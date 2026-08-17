import type { HermesProductSurfaces, HermesSurfaceHarness } from "../hermes-product-types.ts"

export function registerHermesSurfaceServices(
  harness: HermesSurfaceHarness,
  surfaces: HermesProductSurfaces,
): HermesProductSurfaces {
  harness.hooks.services.set("hermes.sdk", surfaces.sdk)
  harness.hooks.services.set("hermes.cli", surfaces.cli)
  harness.hooks.services.set("hermes.tui", surfaces.tui)
  harness.hooks.services.set("hermes.acp", surfaces.acp)
  harness.hooks.services.set("hermes.gateway", surfaces.gateway)
  harness.hooks.services.set("hermes.web-dashboard", surfaces.webDashboard)
  harness.hooks.services.set("hermes.api-server.factory", surfaces.createAPIServer)
  harness.hooks.services.set("hermes.server.factory", surfaces.createAPIServer)
  return surfaces
}
