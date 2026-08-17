import type { OpenCodeSurfaceHarness, OpenCodeWorkspaceSurface } from "./opencode-product-types"
import { currentOpenCodeCwd, openCodeRegistrySnapshot } from "./opencode-product-utils"

export function createOpenCodeWorkspaceSurface(harness: OpenCodeSurfaceHarness): OpenCodeWorkspaceSurface {
  return {
    kind: "opencode-workspace",
    snapshot() {
      const merged = harness.config?.merge()
      return {
        product: "opencode",
        cwd: currentOpenCodeCwd(harness),
        recipeID: harness.recipe.id,
        recipeVersion: harness.recipe.version,
        reference: harness.reference,
        graph: [...harness.graph],
        config: merged?.values ?? {},
        configLayers: (merged?.layers ?? []).map((layer) => ({ scope: layer.scope, name: layer.name, priority: layer.priority })),
        registries: openCodeRegistrySnapshot(harness.hooks),
        services: Array.from(harness.hooks.services.keys()).sort(),
      }
    },
  }
}

export type { OpenCodeWorkspaceSnapshot, OpenCodeWorkspaceSurface } from "./opencode-product-types"
