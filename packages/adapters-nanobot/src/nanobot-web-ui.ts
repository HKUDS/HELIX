import type { NanobotSDK, NanobotWebUIBootstrap, NanobotWebUISurface } from "./nanobot-product-types.ts"
import { escapeHTML } from "./nanobot-product-utils.ts"

export const nanobotWebUINativeHTTPRoutes = [
  "GET /webui/bootstrap",
  "GET /api/sessions",
  "GET /api/settings",
  "GET /api/commands",
  "GET /api/sessions/:key/messages",
  "GET /api/sessions/:key/webui-thread",
  "GET /api/media/:sig/:payload",
] as const

export function buildNanobotWebUIBootstrap(input: Partial<NanobotWebUIBootstrap> = {}): NanobotWebUIBootstrap {
  return {
    token: input.token ?? "harness-local-token",
    ws_path: input.ws_path ?? "/",
    expires_in: input.expires_in ?? 300,
    model_name: input.model_name ?? "nanobot",
  }
}

export function createNanobotWebUI(sdk: NanobotSDK): NanobotWebUISurface {
  return {
    kind: "nanobot-web-ui",
    render(input = {}) {
      const workspace = sdk.workspace()
      const title = input.title ?? "Nanobot Web UI"
      const bootstrap = input.bootstrap ?? buildNanobotWebUIBootstrap()
      const apiRoutes = input.apiRoutes ?? nanobotWebUINativeHTTPRoutes
      const modules = workspace.graph.map((module) => `<li>${escapeHTML(module.id)}</li>`).join("")
      const tools = workspace.tools.map((tool) => `<li>${escapeHTML(tool)}</li>`).join("")
      const routes = apiRoutes.map((route) => `<li data-nanobot-webui-route="${escapeHTML(route)}">${escapeHTML(route)}</li>`).join("")
      const bootstrapJSON = JSON.stringify(bootstrap).replace(/</g, "\\u003c")
      return [
        "<!doctype html>",
        '<html lang="en">',
        "<head>",
        '<meta charset="utf-8">',
        `<title>${escapeHTML(title)}</title>`,
        "</head>",
        `<body data-nanobot-web-ui="ready">`,
        `<h1>${escapeHTML(title)}</h1>`,
        `<p>recipe ${escapeHTML(workspace.recipeID)} @ ${escapeHTML(workspace.cwd ? "Local workspace" : "Workspace")}</p>`,
        `<script id="nanobot-webui-bootstrap" type="application/json">${bootstrapJSON}</script>`,
        `<section data-nanobot-webui="native-websocket-channel">`,
        `<h2>WebUI Channel</h2><ul>${routes}</ul>`,
        `</section>`,
        `<h2>Modules</h2><ul>${modules}</ul>`,
        `<h2>Tools</h2><ul>${tools}</ul>`,
        "</body>",
        "</html>",
      ].join("")
    },
  }
}

export type { NanobotWebUISurface } from "./nanobot-product-types"
