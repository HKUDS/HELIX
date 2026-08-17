import type { LegoModel, LegoProviderAdapter, SessionID } from "@helix/contracts"
import type { PiRPCSurface, PiReleaseHardening, PiSDK } from "./pi-product-types"
import { packageInputsFromParams } from "./pi-package-manager"

export function createPiRPC(sdk: PiSDK, release?: PiReleaseHardening, run?: { provider: LegoProviderAdapter; model?: LegoModel }): PiRPCSurface {
  return {
    kind: "pi-rpc",
    methods: () => [
      "workspace.snapshot",
      "session.list",
      "session.get",
      ...(run ? ["run.turn"] : []),
      "package.plan",
      "release.verify",
    ],
    async call(method, params = {}) {
      switch (method) {
        case "workspace.snapshot":
          return sdk.workspace()
        case "session.list":
          return sdk.listSessions({ ...(typeof params["cwd"] === "string" ? { cwd: params["cwd"] } : {}) })
        case "session.get": {
          const sessionID = params["sessionID"]
          if (typeof sessionID !== "string") throw new Error("pi.rpc session.get expects params.sessionID.")
          return sdk.getSession(sessionID as SessionID)
        }
        case "run.turn":
          if (!run) throw new Error("pi.rpc run.turn requires a live provider.")
          return sdk.runTurn({
            text: typeof params["text"] === "string" ? params["text"] : "Pi RPC run",
            provider: run.provider,
            ...(run.model ? { model: run.model } : {}),
          })
        case "package.plan": {
          const packages = packageInputsFromParams(params["packages"])
          const extensions = packageInputsFromParams(params["extensions"])
          return sdk.packagePlan({
            ...(typeof params["cwd"] === "string" ? { cwd: params["cwd"] } : {}),
            ...(packages ? { packages } : {}),
            ...(extensions ? { extensions } : {}),
          })
        }
        case "release.verify":
          return release?.verify() ?? { ok: true, checks: [{ id: "release-surface", ok: true, message: "Pi release surface is not attached." }] }
        default:
          throw new Error(`Unknown pi.rpc method: ${method}`)
      }
    },
  }
}

export type { PiRPCSurface } from "./pi-product-types"
