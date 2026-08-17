import type { OpenCodeControlPlane, OpenCodeSurfaceHarness, OpenCodeWorkspaceSurface } from "./opencode-product-types"
import { openCodeServerRoutes } from "./opencode-server"
import { openCodeRegistrySnapshot } from "./opencode-product-utils"

export function createOpenCodeControlPlane(harness: OpenCodeSurfaceHarness, workspace: OpenCodeWorkspaceSurface): OpenCodeControlPlane {
  return {
    kind: "opencode-control-plane",
    snapshot() {
      const registries = openCodeRegistrySnapshot(harness.hooks)
      const entrypoints = harness.recipe.entrypoints ?? {}
      return {
        product: "opencode",
        status: "ready",
        cwd: workspace.snapshot().cwd,
        recipe: {
          id: harness.recipe.id,
          version: harness.recipe.version,
          modules: [...harness.graph],
          entrypoints,
        },
        registryCounts: Object.fromEntries(Object.entries(registries).map(([key, values]) => [key, values.length])),
        providers: registries.providers,
        authProviders: registries.auth,
        routes: openCodeServerRoutes(),
      }
    },
  }
}

export type { OpenCodeControlPlane, OpenCodeControlPlaneSnapshot } from "./opencode-product-types"
