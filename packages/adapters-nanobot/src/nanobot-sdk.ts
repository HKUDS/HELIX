import type { SessionID } from "@helix/contracts"
import type { NanobotSDK, NanobotSurfaceHarness } from "./nanobot-product-types"
import { currentNanobotCwd, nanobotRegistrySnapshot } from "./nanobot-product-utils.ts"

export function createNanobotSDK(harness: NanobotSurfaceHarness): NanobotSDK {
  return {
    kind: "nanobot-sdk",
    workspace() {
      const merged = harness.config?.merge()
      const registries = nanobotRegistrySnapshot(harness.hooks)
      return {
        product: "nanobot",
        cwd: currentNanobotCwd(harness),
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
        providers: registries.providers,
        services: Array.from(harness.hooks.services.keys()).sort(),
      }
    },
    graph: () => [...harness.graph],
    listSessions: (input = {}) => harness.session.list({ cwd: input.cwd ?? currentNanobotCwd(harness) }),
    async getSession(sessionID: SessionID) {
      const [session, transcript] = await Promise.all([harness.session.get(sessionID), harness.session.messages({ sessionID })])
      return { session, transcript }
    },
    runTurn: (input) => harness.runTurn(input),
  }
}

export type { NanobotRunTurnInput, NanobotRunTurnResult, NanobotSDK, NanobotSurfaceHarness, NanobotWorkspaceSnapshot } from "./nanobot-product-types"
