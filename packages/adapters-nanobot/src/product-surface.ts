import type { NanobotProductSurfaces, NanobotSurfaceHarness } from "./nanobot-product-types"
import { createNanobotCLI } from "./nanobot-cli"
import { createNanobotSDK } from "./nanobot-sdk"
import { createNanobotServer } from "./nanobot-server"
import { createNanobotTUI } from "./nanobot-tui"
import { createNanobotWebUI } from "./nanobot-web-ui"

export function registerNanobotProductSurfaces(harness: NanobotSurfaceHarness): NanobotProductSurfaces {
  const sdk = createNanobotSDK(harness)
  const cli = createNanobotCLI(harness, sdk)
  const tui = createNanobotTUI(harness, sdk)
  const webUI = createNanobotWebUI(sdk)
  const createServerFactory = (input: Parameters<NanobotProductSurfaces["createServer"]>[0] = {}) => createNanobotServer({ sdk, cli, tui, webUI, ...input })
  const surfaces = { sdk, cli, tui, webUI, createServer: createServerFactory }

  harness.hooks.services.set("nanobot.sdk", sdk)
  harness.hooks.services.set("nanobot.cli", cli)
  harness.hooks.services.set("nanobot.tui", tui)
  harness.hooks.services.set("nanobot.web-ui", webUI)
  harness.hooks.services.set("nanobot.server.factory", createServerFactory)
  return surfaces
}

export * from "./nanobot-product-types"
export * from "./nanobot-sdk"
export * from "./nanobot-cli"
export * from "./nanobot-tui"
export * from "./nanobot-web-ui"
export * from "./nanobot-server"
