import { Buffer } from "node:buffer"
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type {
  PiPackagePlan,
  PiReleaseSnapshot,
  PiRPCSurface,
  PiSDK,
  PiTUISnapshot,
  PiTUISurface,
  PiWebUISurface,
  PiWorkspaceSnapshot,
} from "./pi-product-types"
import { escapeHTML } from "./pi-product-utils"
import { createPiRPC } from "./pi-rpc"
import { createPiTUIFromSDK } from "./pi-tui"

export function createPiWebUI(
  sdk: PiSDK,
  tui: PiTUISurface = createPiTUIFromSDK(sdk),
  rpc: PiRPCSurface = createPiRPC(sdk),
): PiWebUISurface {
  return {
    kind: "pi-web-ui",
    render(input = {}) {
      return renderPiWebUIHTML({
        title: input.title ?? "Pi Mono Workbench",
        workspace: sdk.workspace(),
        packagePlan: sdk.packagePlan(),
        release: sdk.releaseSnapshot(),
        tui: tui.snapshot(),
        tuiPreview: tui.render({ width: 76 }),
        rpcMethods: rpc.methods(),
      })
    },
    write(input) {
      const fileName = input.fileName ?? "pi-web-ui.html"
      const outputPath = join(input.outDir, fileName)
      mkdirSync(dirname(outputPath), { recursive: true })
      writeFileSync(outputPath, this.render(input), "utf8")
      return outputPath
    },
  }
}

export function renderPiWebUIHTML(input: {
  title: string
  workspace: PiWorkspaceSnapshot
  packagePlan: PiPackagePlan
  release: PiReleaseSnapshot
  tui: PiTUISnapshot
  tuiPreview: string
  rpcMethods: string[]
}): string {
  const modules = input.workspace.graph.map((module) => `${module.id}:${module.variant ?? "base"}`).join(" | ")
  const packages = input.packagePlan.all.map((pkg) => `${pkg.id}:${pkg.role}:${pkg.kind}`).join(" | ") || "clean"
  const services = input.workspace.services.filter((service) => service.startsWith("pi.")).join(" | ")
  const rpc = input.rpcMethods.join(" | ")
  const workspaceLabel = input.workspace.cwd ? "Local workspace" : "Workspace"
  const sessionData = {
    header: {
      product: input.workspace.product,
      cwd: workspaceLabel,
      recipeID: input.workspace.recipeID,
      recipeVersion: input.workspace.recipeVersion,
      title: input.title,
    },
    entries: [
      {
        id: "workspace",
        parentId: null,
        type: "message",
        timestamp: "2026-01-01T00:00:00.000Z",
        message: { role: "user", content: [{ type: "text", text: workspaceLabel }] },
      },
      {
        id: "surface",
        parentId: "workspace",
        type: "message",
        timestamp: "2026-01-01T00:00:01.000Z",
        message: { role: "assistant", content: [{ type: "text", text: `modules=${modules}; rpc=${rpc}` }] },
      },
    ],
    leafId: "surface",
    tools: input.workspace.tools.map((name) => ({ name })),
    renderedTools: {},
  }
  const sessionDataBase64 = Buffer.from(JSON.stringify(sessionData)).toString("base64")
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(input.title)}</title>
</head>
    <body>
  <main data-pi-web-ui="ready">
    <h1>${escapeHTML(input.title)}</h1>
    <p>${escapeHTML(workspaceLabel)}</p>
    <section><h2>Recipe Graph</h2><p>${escapeHTML(modules)}</p></section>
    <section><h2>Packages</h2><p>${escapeHTML(packages)}</p></section>
    <section><h2>RPC</h2><p>${escapeHTML(rpc)}</p></section>
    <section><h2>Services</h2><p>${escapeHTML(services)}</p></section>
    <section><h2>TUI</h2><pre>${escapeHTML(input.tuiPreview)}</pre></section>
    <section><h2>Release</h2><p>${escapeHTML(input.release.browserSmoke.dataAttribute)}</p></section>
    <section data-pi-web-export="session-html">
      <h2>Session Export</h2>
      <p>${escapeHTML(input.release.webExport.encoding)}</p>
    </section>
  </main>
  <script id="session-data" type="application/json">${escapeHTML(sessionDataBase64)}</script>
  <script type="application/json" data-pi-web-export-assets="template">${escapeHTML(JSON.stringify(input.release.webExport.templateAssets))}</script>
</body>
</html>`
}

export type { PiWebUISurface } from "./pi-product-types"
