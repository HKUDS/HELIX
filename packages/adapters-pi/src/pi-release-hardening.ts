import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { PiBrowserSmoke, PiPackageManager, PiReleaseHardening, PiSurfaceHarness } from "./pi-product-types"
import { createPiBrowserSmoke } from "./pi-browser-smoke"
import { createPiPackageManager } from "./pi-package-manager"

export function createPiReleaseHardening(
  harness: PiSurfaceHarness,
  packageManager = createPiPackageManager(harness),
  browserSmoke: PiBrowserSmoke = createPiBrowserSmoke(harness, packageManager),
): PiReleaseHardening {
  return {
    kind: "pi-release-hardening",
    snapshot() {
      return {
        product: "pi-mono",
        recipeID: harness.recipe.id,
        recipeVersion: harness.recipe.version,
        ...(typeof harness.reference["commit"] === "string" ? { upstreamCommit: harness.reference["commit"] } : {}),
        modules: [...harness.graph],
        packageShrinkwrap: packageManager.shrinkwrap(),
        services: Array.from(harness.hooks.services.keys()).sort(),
        browserSmoke: {
          fileName: "pi-browser-smoke.html",
          dataAttribute: "data-pi-browser-smoke",
          entryPoint: "scripts/browser-smoke-entry.ts" as const,
          bundler: "esbuild" as const,
          platform: "browser" as const,
        },
        webExport: {
          dataAttribute: "data-pi-web-ui" as const,
          sessionDataElementID: "session-data" as const,
          encoding: "base64-json" as const,
          templateAssets: ["template.html", "template.css", "template.js", "marked.min.js", "highlight.min.js"] as const,
        },
        releasePolicy: {
          checkScript: "npm run check" as const,
          localReleaseScript: "npm run release:local" as const,
          shrinkwrapScript: "npm run shrinkwrap:coding-agent" as const,
          installCommands: ["npm install --omit=dev --ignore-scripts", "bun install --production --ignore-scripts"] as const,
          outputDirectoryPolicy: "outside-repository" as const,
          dependencyPolicy: ["save-exact", "min-release-age", "pinned-direct-dependencies", "review-lockfile-lifecycle-scripts"] as const,
        },
      }
    },
    verify() {
      const snapshot = this.snapshot()
      const moduleIDs = new Set(snapshot.modules.map((module) => module.id))
      const serviceIDs = new Set(snapshot.services)
      const checks = [
        { id: "package-manager-module", ok: moduleIDs.has("pi.product-shell.package-manager"), message: "Pi recipe includes the package manager module." },
        { id: "examples-module", ok: moduleIDs.has("pi.product-shell.extension-examples"), message: "Pi recipe includes extension examples." },
        { id: "browser-smoke-module", ok: moduleIDs.has("pi.product-shell.browser-smoke"), message: "Pi recipe includes browser smoke output." },
        { id: "release-hardening-module", ok: moduleIDs.has("pi.product-shell.release-hardening"), message: "Pi recipe includes release hardening and shrinkwrap." },
        {
          id: "sdk-cli-rpc-web-modules",
          ok:
            moduleIDs.has("pi.product-shell.sdk") &&
            moduleIDs.has("pi.product-shell.cli") &&
            moduleIDs.has("pi.product-shell.tui") &&
            moduleIDs.has("pi.product-shell.rpc") &&
            moduleIDs.has("pi.product-shell.web-ui") &&
            moduleIDs.has("pi.product-shell.server"),
          message: "Pi recipe includes SDK, CLI, TUI, RPC, Web UI, and server product surfaces.",
        },
        {
          id: "registered-services",
          ok:
            serviceIDs.has("pi.sdk") &&
            serviceIDs.has("pi.cli") &&
            serviceIDs.has("pi.tui") &&
            serviceIDs.has("pi.rpc") &&
            serviceIDs.has("pi.web-ui") &&
            serviceIDs.has("pi.server.factory") &&
            serviceIDs.has("pi.package-manager") &&
            serviceIDs.has("pi.extension-examples") &&
            serviceIDs.has("pi.browser-smoke") &&
            serviceIDs.has("pi.release-hardening"),
          message: "Pi product surfaces are registered on the hook service map.",
        },
        {
          id: "shrinkwrap-shape",
          ok: snapshot.packageShrinkwrap.lockfileVersion === 1 && snapshot.packageShrinkwrap.generatedBy === "helix",
          message: "Pi shrinkwrap has a deterministic release shape.",
        },
        {
          id: "browser-smoke-render",
          ok: browserSmoke.render().includes('data-pi-browser-smoke="ready"'),
          message: "Pi browser smoke can render from release hardening dependencies.",
        },
        {
          id: "browser-smoke-bundle-gate",
          ok: snapshot.browserSmoke.entryPoint === "scripts/browser-smoke-entry.ts" && snapshot.browserSmoke.bundler === "esbuild" && snapshot.browserSmoke.platform === "browser",
          message: "Pi browser smoke records the upstream browser bundle gate.",
        },
        {
          id: "web-export-session-data",
          ok: snapshot.webExport.dataAttribute === "data-pi-web-ui" && snapshot.webExport.sessionDataElementID === "session-data" && snapshot.webExport.encoding === "base64-json",
          message: "Pi Web UI records the upstream self-contained session export shape.",
        },
        {
          id: "release-local-install-policy",
          ok:
            snapshot.releasePolicy.outputDirectoryPolicy === "outside-repository" &&
            snapshot.releasePolicy.installCommands.includes("npm install --omit=dev --ignore-scripts") &&
            snapshot.releasePolicy.installCommands.includes("bun install --production --ignore-scripts"),
          message: "Pi release hardening records isolated npm and Bun installs with lifecycle scripts disabled.",
        },
        {
          id: "shrinkwrap-and-dependency-policy",
          ok:
            snapshot.releasePolicy.shrinkwrapScript === "npm run shrinkwrap:coding-agent" &&
            snapshot.releasePolicy.dependencyPolicy.includes("save-exact") &&
            snapshot.releasePolicy.dependencyPolicy.includes("pinned-direct-dependencies"),
          message: "Pi release hardening records coding-agent shrinkwrap and pinned dependency policy.",
        },
      ]
      return { ok: checks.every((check) => check.ok), checks }
    },
    writeShrinkwrap(input) {
      const fileName = input.fileName ?? "pi-shrinkwrap.json"
      const outputPath = join(input.outDir, fileName)
      mkdirSync(dirname(outputPath), { recursive: true })
      writeFileSync(outputPath, `${JSON.stringify(this.snapshot().packageShrinkwrap, null, 2)}\n`, "utf8")
      return outputPath
    },
  }
}

export type { PiReleaseHardening, PiReleaseSnapshot, PiReleaseVerification } from "./pi-product-types"
