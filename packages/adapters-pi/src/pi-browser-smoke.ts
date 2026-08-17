import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { PiBrowserSmoke, PiPackageManager, PiPackagePlan, PiSurfaceHarness } from "./pi-product-types"
import { createPiPackageManager } from "./pi-package-manager"
import { currentPiCwd, escapeHTML } from "./pi-product-utils"

export function createPiBrowserSmoke(harness: PiSurfaceHarness, packageManager = createPiPackageManager(harness)): PiBrowserSmoke {
  return {
    kind: "pi-browser-smoke",
    render(input = {}) {
      return renderPiBrowserSmokeHTML({
        title: input.title ?? "Pi Mono Browser Smoke",
        cwd: currentPiCwd(harness),
        graph: harness.graph,
        packagePlan: packageManager.plan(),
        storageKind: harness.session.kind,
        browserBundle: {
          entryPoint: "scripts/browser-smoke-entry.ts",
          checkScript: "scripts/check-browser-smoke.mjs",
          bundler: "esbuild",
          platform: "browser",
          format: "esm",
          publicImports: ["@earendil-works/pi-ai", "@earendil-works/pi-agent-core"],
        },
      })
    },
    write(input) {
      const fileName = input.fileName ?? "pi-browser-smoke.html"
      const outputPath = join(input.outDir, fileName)
      mkdirSync(dirname(outputPath), { recursive: true })
      writeFileSync(outputPath, this.render(input), "utf8")
      return outputPath
    },
  }
}

export function renderPiBrowserSmokeHTML(input: {
  title: string
  cwd: string
  graph: Array<{ id: string; variant?: string }>
  packagePlan: PiPackagePlan
  storageKind: string
  browserBundle: {
    entryPoint: string
    checkScript: string
    bundler: string
    platform: string
    format: string
    publicImports: string[]
  }
}): string {
  const modules = input.graph.map((module) => `${module.id}:${module.variant ?? "base"}`).join(" | ")
  const packages = input.packagePlan.all.map((pkg) => `${pkg.id}:${pkg.role}:${pkg.kind}`).join(" | ") || "clean"
  const browserImports = input.browserBundle.publicImports.join(" | ")
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(input.title)}</title>
</head>
  <body>
  <main data-pi-browser-smoke="ready">
    <h1>${escapeHTML(input.title)}</h1>
    <p>${escapeHTML(input.cwd ? "Local workspace" : "Workspace")}</p>
    <dl>
      <dt>storage</dt><dd>${escapeHTML(input.storageKind)}</dd>
      <dt>modules</dt><dd>${escapeHTML(modules)}</dd>
      <dt>packages</dt><dd>${escapeHTML(packages)}</dd>
      <dt>browser bundle</dt><dd data-pi-browser-smoke-entry="${escapeHTML(input.browserBundle.entryPoint)}">${escapeHTML(`${input.browserBundle.bundler}:${input.browserBundle.platform}:${input.browserBundle.format}`)}</dd>
      <dt>imports</dt><dd>${escapeHTML(browserImports)}</dd>
    </dl>
  </main>
</body>
</html>`
}

export type { PiBrowserSmoke } from "./pi-product-types"
