import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type {
  OpenCodeControlPlaneSnapshot,
  OpenCodeSDK,
  OpenCodeSurfaceHarness,
  OpenCodeTUISnapshot,
  OpenCodeTUISurface,
  OpenCodeWebLaunchPlan,
  OpenCodeWebSurface,
  OpenCodeWorkspaceSnapshot,
} from "./opencode-product-types"
import { escapeHTML } from "./opencode-product-utils"
import { createOpenCodeSDK } from "./opencode-sdk"
import { createOpenCodeTUI, createOpenCodeTUIFromSDK } from "./opencode-tui"

export function createOpenCodeWeb(
  harness: OpenCodeSurfaceHarness,
  sdk = createOpenCodeSDK(harness),
  tui = createOpenCodeTUI(harness, sdk),
): OpenCodeWebSurface {
  return createOpenCodeWebFromSDK(sdk, tui)
}

export function createOpenCodeWebFromSDK(
  sdk: OpenCodeSDK,
  tui: OpenCodeTUISurface = createOpenCodeTUIFromSDK(sdk),
): OpenCodeWebSurface {
  return {
    kind: "opencode-web",
    launchPlan(input = {}) {
      return projectOpenCodeWebLaunchPlan(input)
    },
    render(input = {}) {
      return renderOpenCodeWebHTML({
        title: input.title ?? "OpenCode Web Cockpit",
        workspace: sdk.workspace(),
        controlPlane: sdk.controlPlane(),
        tui: tui.snapshot(),
      })
    },
    write(input) {
      const fileName = input.fileName ?? "opencode-web.html"
      const outputPath = join(input.outDir, fileName)
      mkdirSync(dirname(outputPath), { recursive: true })
      writeFileSync(outputPath, this.render(input), "utf8")
      return outputPath
    },
  }
}

export function projectOpenCodeWebLaunchPlan(input: {
  hostname?: string
  port?: number
  resolvedPort?: number
  mdns?: boolean
  mdnsDomain?: string
  passwordSet?: boolean
  networkInterfaces?: Array<{ address: string; family?: string; internal?: boolean }>
} = {}): OpenCodeWebLaunchPlan {
  const hostname = input.hostname ?? "127.0.0.1"
  const port = input.port ?? 0
  const resolvedPort = input.resolvedPort ?? (port === 0 ? 4096 : port)
  const mdns = input.mdns ?? false
  const mdnsDomain = input.mdnsDomain ?? "opencode.local"
  const singleURL = `http://${hostname}:${resolvedPort}`
  const networkAccess = (input.networkInterfaces ?? [])
    .filter((entry) => entry.family === "IPv4" && !entry.internal && !entry.address.startsWith("172."))
    .map((entry) => `http://${entry.address}:${resolvedPort}`)
  const localAccess = `http://localhost:${resolvedPort}`
  const wildcard = hostname === "0.0.0.0"
  return {
    product: "opencode",
    command: "web",
    instance: false,
    warningWhenPasswordMissing: input.passwordSet !== true,
    listen: {
      call: "Server.listen(resolveNetworkOptions(args))",
      hostname,
      port,
      mdns,
      ...(mdns ? { mdnsDomain } : {}),
    },
    display: wildcard
      ? {
          mode: "local-and-network",
          localAccess,
          networkAccess,
          ...(mdns ? { mdns: `${mdnsDomain}:${resolvedPort}` } : {}),
          webInterface: localAccess,
        }
      : {
          mode: "single-url",
          networkAccess: [],
          webInterface: singleURL,
        },
    openURL: wildcard ? localAccess : singleURL,
    keepAlive: true,
  }
}

export function renderOpenCodeWebHTML(input: {
  title: string
  workspace: OpenCodeWorkspaceSnapshot
  controlPlane: OpenCodeControlPlaneSnapshot
  tui: OpenCodeTUISnapshot
}): string {
  const moduleRows = input.controlPlane.recipe.modules
    .map((module) => `<li><span>${escapeHTML(module.id)}</span><code>${escapeHTML(module.variant ?? "base")}</code></li>`)
    .join("")
  const toolRows = input.workspace.registries.tools
    .slice(0, 12)
    .map((tool) => `<li><span>${escapeHTML(tool)}</span><code>tool</code></li>`)
    .join("")
  const providerRows = input.controlPlane.providers
    .slice(0, 12)
    .map((provider) => `<li><span>${escapeHTML(provider)}</span><code>provider</code></li>`)
    .join("")

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(input.title)}</title>
  <style>
    :root {
      color-scheme: light;
      --paper: #f3f4ef;
      --ink: #171915;
      --muted: #666b60;
      --line: #171915;
      --panel: #fffdf7;
      --mint: #8bd7c8;
      --gold: #efc349;
      --red: #d95f43;
      --blue: #3867c8;
      --soft: #dde3d8;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      background:
        linear-gradient(90deg, rgb(23 25 21 / 0.06) 1px, transparent 1px),
        linear-gradient(0deg, rgb(23 25 21 / 0.06) 1px, transparent 1px),
        var(--paper);
      background-size: 22px 22px;
      font-family: "Avenir Next", "Gill Sans", ui-sans-serif, system-ui, sans-serif;
    }

    main {
      width: min(1180px, calc(100vw - 32px));
      margin: 0 auto;
      padding: 24px 0 38px;
    }

    header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 20px;
      align-items: end;
      border-bottom: 4px solid var(--line);
      padding-bottom: 16px;
    }

    h1, h2, p { margin: 0; }

    h1 {
      font-size: 2.35rem;
      line-height: 1;
      letter-spacing: 0;
    }

    h2 {
      font-size: 0.92rem;
      letter-spacing: 0;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .badge {
      border: 2px solid var(--line);
      background: var(--gold);
      padding: 9px 11px;
      font-weight: 900;
      white-space: nowrap;
    }

    .facts {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin-top: 18px;
    }

    .fact {
      border: 2px solid var(--line);
      background: var(--panel);
      padding: 12px;
      box-shadow: 5px 5px 0 var(--soft);
    }

    .fact strong {
      display: block;
      font-size: 1.8rem;
      line-height: 1;
    }

    .fact span {
      display: block;
      margin-top: 8px;
      color: var(--muted);
      font-size: 0.82rem;
      font-weight: 800;
    }

    .grid {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(310px, 0.8fr);
      gap: 18px;
      margin-top: 22px;
      align-items: start;
    }

    section {
      border-top: 3px solid var(--line);
      padding-top: 12px;
      min-width: 0;
    }

    section + section {
      margin-top: 20px;
    }

    ul {
      display: grid;
      gap: 8px;
      list-style: none;
      padding: 0;
      margin: 0;
    }

    li {
      min-height: 42px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      border: 2px solid var(--line);
      background: var(--panel);
      padding: 8px 10px;
    }

    li:nth-child(3n + 1) { border-left: 10px solid var(--mint); }
    li:nth-child(3n + 2) { border-left: 10px solid var(--red); }
    li:nth-child(3n) { border-left: 10px solid var(--blue); }

    li span {
      overflow-wrap: anywhere;
      font-weight: 850;
    }

    code, pre {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    code {
      border: 1px solid var(--line);
      background: #eef7d4;
      padding: 3px 6px;
      font-size: 0.76rem;
      white-space: nowrap;
    }

    pre {
      overflow: auto;
      border: 2px solid var(--line);
      background: #151915;
      color: #ecf4dc;
      padding: 12px;
      margin: 0;
      min-height: 170px;
      white-space: pre-wrap;
    }

    @media (max-width: 840px) {
      header,
      .facts,
      .grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main data-opencode-web="ready">
    <header>
      <div>
        <h1>${escapeHTML(input.title)}</h1>
        <p>${escapeHTML(input.workspace.cwd ? "Local workspace" : "Workspace")}</p>
      </div>
      <div class="badge">${escapeHTML(input.controlPlane.status.toUpperCase())}</div>
    </header>

    <div class="facts">
      <div class="fact"><strong>${input.controlPlane.recipe.modules.length}</strong><span>recipe modules</span></div>
      <div class="fact"><strong>${input.workspace.registries.tools.length}</strong><span>tools</span></div>
      <div class="fact"><strong>${input.controlPlane.providers.length}</strong><span>providers</span></div>
      <div class="fact"><strong>${input.workspace.services.length}</strong><span>services</span></div>
    </div>

    <div class="grid">
      <div>
        <section aria-labelledby="modules-title">
          <h2 id="modules-title">Recipe Graph</h2>
          <ul>${moduleRows}</ul>
        </section>
      </div>
      <aside>
        <section aria-labelledby="tui-title">
          <h2 id="tui-title">TUI Surface</h2>
          <pre>${escapeHTML(input.tui.title)} :: ${escapeHTML(input.tui.status)}
${escapeHTML(input.tui.commands.join(" / "))}</pre>
        </section>
        <section aria-labelledby="tools-title">
          <h2 id="tools-title">Tools</h2>
          <ul>${toolRows || `<li><span>No tools</span><code>empty</code></li>`}</ul>
        </section>
        <section aria-labelledby="providers-title">
          <h2 id="providers-title">Providers</h2>
          <ul>${providerRows || `<li><span>No providers</span><code>empty</code></li>`}</ul>
        </section>
      </aside>
    </div>
  </main>
</body>
</html>`
}

export type { OpenCodeWebSurface } from "./opencode-product-types"
