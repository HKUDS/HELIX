import type { OpenCodeProductSurfaces, OpenCodeSurfaceHarness } from "./opencode-product-types"
import { createOpenCodeControlPlane } from "./opencode-control-plane"
import { createOpenCodeDesktop } from "./opencode-desktop"
import { createOpenCodeSDK } from "./opencode-sdk"
import { createOpenCodeServer } from "./opencode-server"
import { createOpenCodeSlack } from "./opencode-slack"
import { createOpenCodeTUI } from "./opencode-tui"
import { createOpenCodeWeb } from "./opencode-web"
import { createOpenCodeWorkspaceSurface } from "./opencode-workspace"

export function registerOpenCodeProductSurfaces(harness: OpenCodeSurfaceHarness): OpenCodeProductSurfaces {
  const workspace = createOpenCodeWorkspaceSurface(harness)
  const controlPlane = createOpenCodeControlPlane(harness, workspace)
  const sdk = createOpenCodeSDK(harness, workspace, controlPlane)
  const tui = createOpenCodeTUI(harness, sdk)
  const web = createOpenCodeWeb(harness, sdk, tui)
  const desktop = createOpenCodeDesktop(harness, web)
  const slack = createOpenCodeSlack(harness, sdk)
  const createServerFactory = (input: Parameters<OpenCodeProductSurfaces["createServer"]>[0] = {}) =>
    createOpenCodeServer({ sdk, controlPlane, tui, web, desktop, slack, ...input })
  const surfaces = { harness, sdk, workspace, controlPlane, createServer: createServerFactory, tui, web, desktop, slack }

  harness.hooks.services.set("opencode.harness", harness)
  harness.hooks.services.set("opencode.sdk", sdk)
  harness.hooks.services.set("opencode.workspace", workspace)
  harness.hooks.services.set("opencode.control-plane", controlPlane)
  harness.hooks.services.set("opencode.server.factory", createServerFactory)
  harness.hooks.services.set("opencode.tui", tui)
  harness.hooks.services.set("opencode.web", web)
  harness.hooks.services.set("opencode.desktop", desktop)
  harness.hooks.services.set("opencode.slack", slack)
  return surfaces
}

export * from "./opencode-product-types"
export * from "./opencode-workspace"
export * from "./opencode-control-plane"
export * from "./opencode-sdk"
export * from "./opencode-server"
export * from "./opencode-tui"
export * from "./opencode-web"
export * from "./opencode-desktop"
export * from "./opencode-slack"
