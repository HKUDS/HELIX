import type { SessionID } from "@helix/contracts"
import type { HermesGatewaySurface, HermesSDK } from "./hermes-product-types"
import { hermesMessageText } from "./hermes-product-utils"

export function createHermesGateway(sdk: HermesSDK): HermesGatewaySurface {
  return {
    kind: "hermes-gateway",
    methods: () => ["gateway.message", "gateway.status", "gateway.interrupt"],
    async dispatch(event) {
      const result = await sdk.runTurn({
        text: event.text,
        provider: event.provider,
        ...(event.model ? { model: event.model } : {}),
      })
      return { text: hermesMessageText(result.assistantMessage), sessionID: result.session.id as SessionID }
    },
  }
}

export type { HermesGatewaySurface } from "./hermes-product-types"
