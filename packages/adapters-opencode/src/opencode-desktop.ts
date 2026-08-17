import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { OpenCodeDesktopManifest, OpenCodeDesktopRuntimeProjection, OpenCodeDesktopSurface, OpenCodeSDK, OpenCodeSurfaceHarness, OpenCodeWebSurface } from "./opencode-product-types"
import { escapeAttribute, escapeHTML } from "./opencode-product-utils"
import { createOpenCodeSDK } from "./opencode-sdk"
import { createOpenCodeWeb, createOpenCodeWebFromSDK } from "./opencode-web"

export function createOpenCodeDesktop(harness: OpenCodeSurfaceHarness, web = createOpenCodeWeb(harness)): OpenCodeDesktopSurface {
  return createOpenCodeDesktopFromSDK(createOpenCodeSDK(harness), web)
}

export function createOpenCodeDesktopFromSDK(sdk: OpenCodeSDK, web = createOpenCodeWebFromSDK(sdk)): OpenCodeDesktopSurface {
  return {
    kind: "opencode-desktop",
    runtimeProjection(input = {}) {
      return projectOpenCodeDesktopRuntime(input)
    },
    manifest() {
      const workspace = sdk.workspace()
      return {
        product: "opencode",
        appID: "dev.opencode.helix",
        appName: "OpenCode",
        window: {
          title: "OpenCode",
          width: 1280,
          height: 860,
          minWidth: 920,
          minHeight: 620,
        },
        webEntry: "opencode-web.html",
        protocolHandlers: ["opencode://session/:id", "opencode://workspace"],
        services: workspace.services,
      }
    },
    writeBundle(input) {
      const manifestPath = join(input.outDir, input.manifestFileName ?? "opencode-desktop-manifest.json")
      const shellPath = join(input.outDir, input.shellFileName ?? "opencode-desktop-shell.html")
      mkdirSync(dirname(manifestPath), { recursive: true })
      mkdirSync(dirname(shellPath), { recursive: true })
      writeFileSync(manifestPath, `${JSON.stringify(this.manifest(), null, 2)}\n`, "utf8")
      writeFileSync(shellPath, renderOpenCodeDesktopShellHTML({ manifest: this.manifest(), webHTML: web.render() }), "utf8")
      return { manifestPath, shellPath }
    },
  }
}

export function projectOpenCodeDesktopRuntime(input: {
  packaged?: boolean
  channel?: "dev" | "beta" | "prod"
  deepLinks?: string[]
} = {}): OpenCodeDesktopRuntimeProjection {
  const channel = input.channel ?? "prod"
  const appIDs = {
    dev: "ai.opencode.desktop.dev",
    beta: "ai.opencode.desktop.beta",
    prod: "ai.opencode.desktop",
  } as const
  const appNames = {
    dev: "OpenCode Dev",
    beta: "OpenCode Beta",
    prod: "OpenCode",
  } as const
  const effectiveChannel = input.packaged === false ? "dev" : channel
  return {
    product: "opencode",
    packageName: "@opencode-ai/desktop",
    appID: appIDs[effectiveChannel],
    appName: appNames[effectiveChannel],
    environment: {
      OPENCODE_DISABLE_EMBEDDED_WEB_UI: "true",
      OPENCODE_CLIENT: "desktop",
      OPENCODE_EXPERIMENTAL_ICON_DISCOVERY: "true",
      OPENCODE_EXPERIMENTAL_FILEWATCHER: "true",
    },
    mainWindow: {
      title: "OpenCode",
      defaultWidth: 1280,
      defaultHeight: 800,
      rendererProtocol: "oc",
      rendererURL: "oc://renderer/index.html",
      preload: "../preload/index.js",
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    sidecar: {
      serviceName: "opencode server",
      startTimeoutMs: 60_000,
      stopTimeoutMs: 6_000,
      healthPath: "/global/health",
    },
    deepLinks: input.deepLinks ?? [],
    protocolHandlers: ["opencode://session/:id", "opencode://workspace"],
  }
}

export function renderOpenCodeDesktopShellHTML(input: { manifest: OpenCodeDesktopManifest; webHTML: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(input.manifest.window.title)} Desktop Shell</title>
  <style>
    body { margin: 0; background: #11140f; color: #f5f7ee; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    header { display: flex; justify-content: space-between; align-items: center; min-height: 44px; padding: 0 14px; border-bottom: 2px solid #f5f7ee; background: #20251b; }
    iframe { width: 100vw; height: calc(100vh - 46px); border: 0; background: white; }
  </style>
</head>
<body data-opencode-desktop-shell="ready">
  <header><strong>${escapeHTML(input.manifest.appName)}</strong><span>${escapeHTML(input.manifest.appID)}</span></header>
  <iframe title="OpenCode Web" srcdoc="${escapeAttribute(input.webHTML)}"></iframe>
</body>
</html>`
}

export type { OpenCodeDesktopManifest, OpenCodeDesktopSurface } from "./opencode-product-types"
