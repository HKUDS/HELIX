import type { LegoModel, LegoProviderAdapter } from "@helix/contracts"
import type { HermesACPSurface, HermesSDK } from "./hermes-product-types"

export function createHermesACP(sdk: HermesSDK, run?: { provider: LegoProviderAdapter; model?: LegoModel }): HermesACPSurface {
  return {
    kind: "hermes-acp",
    methods: () => ["initialize", "session/new", "session/prompt", "session/cancel", "session/fork", "auth/status"],
    async call(method, params = {}) {
      if (method === "initialize") return { product: "hermes-agent", capabilities: this.methods(), workspace: sdk.workspace() }
      if (method === "session/new") return sdk.workspace()
      if (method === "session/prompt") {
        if (!run) throw new Error("Hermes ACP session/prompt requires a live provider.")
        const text = typeof params["text"] === "string" ? params["text"] : "hello from acp"
        return sdk.runTurn({
          text,
          provider: run.provider,
          ...(run.model ? { model: run.model } : {}),
        })
      }
      return { ok: true, method }
    },
  }
}

export type { HermesACPSurface } from "./hermes-product-types"
