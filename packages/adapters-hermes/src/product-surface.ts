import type { HermesProductSurfaces, HermesSurfaceHarness } from "./hermes-product-types.ts"
import { createHermesProductSurfaces, registerHermesSurfaceServices } from "./surfaces/index.ts"

export function registerHermesProductSurfaces(harness: HermesSurfaceHarness): HermesProductSurfaces {
  return registerHermesSurfaceServices(harness, createHermesProductSurfaces(harness))
}

export * from "./hermes-product-types.ts"
export * from "./hermes-sdk.ts"
export * from "./hermes-cli.ts"
export * from "./hermes-tui.ts"
export * from "./hermes-api-server.ts"
export * from "./hermes-acp.ts"
export * from "./hermes-gateway.ts"
export * from "./hermes-web-dashboard.ts"
export * from "./surfaces/index.ts"
