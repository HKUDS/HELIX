import type { SessionID } from "@helix/contracts"
import type { PiPackageManager, PiReleaseHardening, PiSDK, PiSurfaceHarness } from "./pi-product-types"
import { createPiPackageManager } from "./pi-package-manager"
import { currentPiCwd, piRegistrySnapshot } from "./pi-product-utils"
import { createPiReleaseHardening } from "./pi-release-hardening"

export function createPiSDK(
  harness: PiSurfaceHarness,
  packageManager: PiPackageManager = createPiPackageManager(harness),
  release: PiReleaseHardening = createPiReleaseHardening(harness, packageManager),
): PiSDK {
  return {
    kind: "pi-sdk",
    workspace() {
      const merged = harness.config?.merge()
      const registries = piRegistrySnapshot(harness.hooks)
      return {
        product: "pi-mono",
        cwd: currentPiCwd(harness),
        recipeID: harness.recipe.id,
        recipeVersion: harness.recipe.version,
        reference: harness.reference,
        graph: [...harness.graph],
        storageKind: harness.session.kind,
        config: merged?.values ?? {},
        configLayers: (merged?.layers ?? []).map((layer) => ({ scope: layer.scope, name: layer.name, priority: layer.priority })),
        registries,
        tools: registries.tools,
        commands: registries.commands,
        flags: registries.flags,
        providers: registries.providers,
        services: Array.from(harness.hooks.services.keys()).sort(),
      }
    },
    graph: () => [...harness.graph],
    listSessions: (input = {}) => harness.session.list({ cwd: input.cwd ?? currentPiCwd(harness) }),
    async getSession(sessionID: SessionID) {
      const [session, transcript] = await Promise.all([harness.session.get(sessionID), harness.session.messages({ sessionID })])
      return { session, transcript }
    },
    runTurn: (input) => harness.runTurn(input),
    packagePlan: (input = {}) => packageManager.plan(input),
    releaseSnapshot: () => release.snapshot(),
  }
}

export type { PiRunTurnInput, PiRunTurnResult, PiSDK, PiSurfaceHarness, PiWorkspaceSnapshot } from "./pi-product-types"
