import type { SessionID } from "@helix/contracts"
import type { HermesSDK, HermesSurfaceHarness } from "./hermes-product-types"
import { currentHermesCwd, hermesRegistrySnapshot } from "./hermes-product-utils"

export function createHermesSDK(harness: HermesSurfaceHarness): HermesSDK {
  return {
    kind: "hermes-sdk",
    workspace() {
      const merged = harness.config?.merge()
      const registries = hermesRegistrySnapshot(harness.hooks)
      return {
        product: "hermes-agent",
        cwd: currentHermesCwd(harness),
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
    listSessions: (input = {}) => harness.session.list({ cwd: input.cwd ?? currentHermesCwd(harness) }),
    async getSession(sessionID: SessionID) {
      const [session, transcript] = await Promise.all([harness.session.get(sessionID), harness.session.messages({ sessionID })])
      return { session, transcript }
    },
    runTurn: (input) => harness.runTurn(input),
  }
}

export type { HermesRunTurnInput, HermesRunTurnResult, HermesSDK, HermesSurfaceHarness, HermesWorkspaceSnapshot } from "./hermes-product-types"
