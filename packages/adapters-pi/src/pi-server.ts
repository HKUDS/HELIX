import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import type { LegoModel, LegoProviderAdapter, SessionID } from "@helix/contracts"
import type { TUIInputEvent } from "@helix/lego-ui"
import type { PiRPCSurface, PiSDK, PiServer, PiTUISurface, PiWebUISurface } from "./pi-product-types"
import { PiHTTPError, close, listen, readJSONBody, sendJSON, sendText } from "./pi-product-utils"
import { createPiRPC } from "./pi-rpc"
import { createPiTUIFromSDK } from "./pi-tui"
import { createPiWebUI } from "./pi-web-ui"

export function createPiServer(input: {
  sdk: PiSDK
  tui?: PiTUISurface
  rpc?: PiRPCSurface
  webUI?: PiWebUISurface
  provider?: LegoProviderAdapter
  model?: LegoModel
  maxBodyBytes?: number
}): PiServer {
  const routes = piServerRoutes()
  const server = createServer((request, response) => {
    void routePiRequest({
      request,
      response,
      sdk: input.sdk,
      tui: input.tui,
      rpc: input.rpc,
      webUI: input.webUI,
      provider: input.provider,
      model: input.model,
      maxBodyBytes: input.maxBodyBytes ?? 1_000_000,
    })
  })
  return {
    kind: "pi-server",
    routes,
    listen: (listenInput = {}) => listen(server, listenInput),
    close: () => close(server),
  }
}

export function piServerRoutes(): string[] {
  return [
    "GET /health",
    "GET /v1/workspace",
    "GET /v1/graph",
    "GET /v1/sessions",
    "GET /v1/sessions/:id",
    "GET /v1/tui",
    "POST /v1/tui/event",
    "GET /v1/web",
    "GET /v1/packages",
    "GET /v1/release",
    "POST /v1/rpc",
    "POST /v1/run",
  ]
}

async function routePiRequest(input: {
  request: IncomingMessage
  response: ServerResponse
  sdk: PiSDK
  tui: PiTUISurface | undefined
  rpc: PiRPCSurface | undefined
  webUI: PiWebUISurface | undefined
  provider: LegoProviderAdapter | undefined
  model: LegoModel | undefined
  maxBodyBytes: number
}): Promise<void> {
  try {
    const requestURL = new URL(input.request.url ?? "/", "http://helix.local")
    const method = input.request.method ?? "GET"

    if (method === "GET" && requestURL.pathname === "/health") return sendJSON(input.response, 200, { ok: true, product: "pi-mono" })
    if (method === "GET" && requestURL.pathname === "/v1/workspace") return sendJSON(input.response, 200, input.sdk.workspace())
    if (method === "GET" && requestURL.pathname === "/v1/graph") return sendJSON(input.response, 200, { graph: input.sdk.graph() })
    if (method === "GET" && requestURL.pathname === "/v1/sessions") return sendJSON(input.response, 200, { sessions: await input.sdk.listSessions() })

    const sessionMatch = /^\/v1\/sessions\/([^/]+)$/.exec(requestURL.pathname)
    if (method === "GET" && sessionMatch?.[1]) return sendJSON(input.response, 200, await input.sdk.getSession(sessionMatch[1] as SessionID))
    if (method === "GET" && requestURL.pathname === "/v1/tui") {
      return sendText(input.response, 200, (input.tui ?? createPiTUIFromSDK(input.sdk)).render(), "text/plain; charset=utf-8")
    }
    if (method === "POST" && requestURL.pathname === "/v1/tui/event") {
      const body = await readJSONBody<TUIInputEvent>(input.request, input.maxBodyBytes)
      return sendJSON(input.response, 200, (input.tui ?? createPiTUIFromSDK(input.sdk)).dispatch(body))
    }
    if (method === "GET" && requestURL.pathname === "/v1/web") {
      return sendText(input.response, 200, (input.webUI ?? createPiWebUI(input.sdk)).render(), "text/html; charset=utf-8")
    }
    if (method === "GET" && requestURL.pathname === "/v1/packages") return sendJSON(input.response, 200, input.sdk.packagePlan())
    if (method === "GET" && requestURL.pathname === "/v1/release") return sendJSON(input.response, 200, input.sdk.releaseSnapshot())
    if (method === "POST" && requestURL.pathname === "/v1/rpc") {
      const body = await readJSONBody<{ method?: string; params?: Record<string, unknown> }>(input.request, input.maxBodyBytes)
      if (typeof body.method !== "string" || body.method.length === 0) throw new PiHTTPError(400, "Expected JSON body with non-empty method.")
      return sendJSON(
        input.response,
        200,
        await (input.rpc ?? createPiRPC(input.sdk, undefined, input.provider ? { provider: input.provider, ...(input.model ? { model: input.model } : {}) } : undefined)).call(
          body.method,
          body.params ?? {},
        ),
      )
    }
    if (method === "POST" && requestURL.pathname === "/v1/run") {
      if (!input.provider) throw new PiHTTPError(503, "Pi run requires a live provider.")
      const body = await readJSONBody<{ text?: string; sessionID?: SessionID; maxSteps?: number; maxRetries?: number; syntheticContinue?: boolean; maxSyntheticContinues?: number }>(
        input.request,
        input.maxBodyBytes,
      )
      if (typeof body.text !== "string" || body.text.length === 0) throw new PiHTTPError(400, "Expected JSON body with non-empty text.")
      return sendJSON(
        input.response,
        200,
        await input.sdk.runTurn({
          text: body.text,
          provider: input.provider,
          ...(input.model ? { model: input.model } : {}),
          ...(typeof body.sessionID === "string" ? { sessionID: body.sessionID } : {}),
          ...(typeof body.maxSteps === "number" ? { maxSteps: body.maxSteps } : {}),
          ...(typeof body.maxRetries === "number" ? { maxRetries: body.maxRetries } : {}),
          ...(typeof body.syntheticContinue === "boolean" ? { syntheticContinue: body.syntheticContinue } : {}),
          ...(typeof body.maxSyntheticContinues === "number" ? { maxSyntheticContinues: body.maxSyntheticContinues } : {}),
        }),
      )
    }
    throw new PiHTTPError(404, `No route for ${method} ${requestURL.pathname}.`)
  } catch (error) {
    const status = error instanceof PiHTTPError ? error.status : 500
    sendJSON(input.response, status, { error: { message: error instanceof Error ? error.message : String(error) } })
  }
}

export type { PiServer } from "./pi-product-types"
