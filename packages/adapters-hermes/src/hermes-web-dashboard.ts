import type { HermesSDK, HermesWebDashboardSurface } from "./hermes-product-types"
import { escapeHTML } from "./hermes-product-utils"

export function createHermesWebDashboard(sdk: HermesSDK): HermesWebDashboardSurface {
  return {
    kind: "hermes-web-dashboard",
    render(input = {}) {
      const workspace = sdk.workspace()
      const title = input.title ?? "Hermes Agent Dashboard"
      const modules = workspace.graph.map((module) => `<li>${escapeHTML(module.id)}</li>`).join("")
      const tools = workspace.tools.map((tool) => `<li>${escapeHTML(tool)}</li>`).join("")
      return [
        "<!doctype html>",
        '<html lang="en">',
        "<head>",
        '<meta charset="utf-8">',
        `<title>${escapeHTML(title)}</title>`,
        "</head>",
        `<body data-hermes-dashboard="ready">`,
        `<h1>${escapeHTML(title)}</h1>`,
        `<p>recipe ${escapeHTML(workspace.recipeID)} @ ${escapeHTML(workspace.cwd ? "Local workspace" : "Workspace")}</p>`,
        `<h2>Modules</h2><ul>${modules}</ul>`,
        `<h2>Tools</h2><ul>${tools}</ul>`,
        "</body>",
        "</html>",
      ].join("")
    },
  }
}

export type { HermesWebDashboardSurface } from "./hermes-product-types"
