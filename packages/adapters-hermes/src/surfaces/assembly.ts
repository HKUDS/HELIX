import type { HermesProductSurfaces, HermesSurfaceHarness } from "../hermes-product-types.ts"
import { createHermesACP } from "../hermes-acp.ts"
import { createHermesAPIServer } from "../hermes-api-server.ts"
import { createHermesCLI } from "../hermes-cli.ts"
import { createHermesGateway } from "../hermes-gateway.ts"
import { createHermesSDK } from "../hermes-sdk.ts"
import { createHermesTUI } from "../hermes-tui.ts"
import { createHermesWebDashboard } from "../hermes-web-dashboard.ts"

export function createHermesProductSurfaces(harness: HermesSurfaceHarness): HermesProductSurfaces {
  const sdk = createHermesSDK(harness)
  const cli = createHermesCLI(harness, sdk)
  const tui = createHermesTUI(harness, sdk)
  const acp = createHermesACP(sdk)
  const gateway = createHermesGateway(sdk)
  const webDashboard = createHermesWebDashboard(sdk)
  const createAPIServer = (input: Parameters<HermesProductSurfaces["createAPIServer"]>[0] = {}) =>
    createHermesAPIServer({ sdk, cli, tui, acp, gateway, webDashboard, ...input })
  return { sdk, cli, tui, acp, gateway, webDashboard, createAPIServer }
}
