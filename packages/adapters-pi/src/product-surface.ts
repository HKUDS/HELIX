import type { PiProductSurfaces, PiSurfaceHarness } from "./pi-product-types"
import { createPiBrowserSmoke } from "./pi-browser-smoke"
import { createPiCLI } from "./pi-cli"
import { createPiExtensionExamples } from "./pi-extension-examples"
import { createPiPackageManager } from "./pi-package-manager"
import { createPiReleaseHardening } from "./pi-release-hardening"
import { createPiRPC } from "./pi-rpc"
import { createPiSDK } from "./pi-sdk"
import { createPiServer } from "./pi-server"
import { createPiTUI } from "./pi-tui"
import { createPiWebUI } from "./pi-web-ui"

export function registerPiProductSurfaces(harness: PiSurfaceHarness): PiProductSurfaces {
  const packageManager = createPiPackageManager(harness)
  const examples = createPiExtensionExamples()
  const browserSmoke = createPiBrowserSmoke(harness, packageManager)
  const release = createPiReleaseHardening(harness, packageManager, browserSmoke)
  const sdk = createPiSDK(harness, packageManager, release)
  const cli = createPiCLI(harness, sdk)
  const tui = createPiTUI(harness, sdk)
  const rpc = createPiRPC(sdk, release)
  const webUI = createPiWebUI(sdk, tui, rpc)
  const createServerFactory = (input: Parameters<PiProductSurfaces["createServer"]>[0] = {}) =>
    createPiServer({
      sdk,
      tui,
      rpc: input.provider ? createPiRPC(sdk, release, { provider: input.provider, ...(input.model ? { model: input.model } : {}) }) : rpc,
      webUI,
      ...input,
    })
  const surfaces = { sdk, cli, tui, rpc, webUI, createServer: createServerFactory, packageManager, examples, browserSmoke, release }

  harness.hooks.services.set("pi.sdk", sdk)
  harness.hooks.services.set("pi.cli", cli)
  harness.hooks.services.set("pi.tui", tui)
  harness.hooks.services.set("pi.rpc", rpc)
  harness.hooks.services.set("pi.web-ui", webUI)
  harness.hooks.services.set("pi.server.factory", createServerFactory)
  harness.hooks.services.set("pi.package-manager", packageManager)
  harness.hooks.services.set("pi.extension-examples", examples)
  harness.hooks.services.set("pi.browser-smoke", browserSmoke)
  harness.hooks.services.set("pi.release-hardening", release)
  harness.hooks.services.set("pi.shrinkwrap", release.snapshot().packageShrinkwrap)
  return surfaces
}

export * from "./pi-product-types"
export * from "./pi-sdk"
export * from "./pi-cli"
export * from "./pi-tui"
export * from "./pi-rpc"
export * from "./pi-web-ui"
export * from "./pi-server"
export * from "./pi-package-manager"
export * from "./pi-extension-examples"
export * from "./pi-browser-smoke"
export * from "./pi-release-hardening"
