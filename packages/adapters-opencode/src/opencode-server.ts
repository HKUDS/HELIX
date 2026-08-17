import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import type { LegoModel, LegoProviderAdapter, SessionID } from "@helix/contracts"
import type {
  OpenCodeControlPlane,
  OpenCodeDesktopSurface,
  OpenCodeSDK,
  OpenCodeServer,
  OpenCodeSlackSurface,
  OpenCodeTUISurface,
  OpenCodeWebSurface,
} from "./opencode-product-types"
import { OpenCodeHTTPError, close, listen, readJSONBody, sendJSON, sendText } from "./opencode-product-utils"
import { createOpenCodeDesktopFromSDK } from "./opencode-desktop"
import { createOpenCodeSlackFromSDK } from "./opencode-slack"
import { createOpenCodeTUIFromSDK } from "./opencode-tui"
import { createOpenCodeWebFromSDK } from "./opencode-web"
import type { TUIInputEvent } from "@helix/lego-ui"

export function createOpenCodeServer(input: {
  sdk: OpenCodeSDK
  controlPlane?: OpenCodeControlPlane
  tui?: OpenCodeTUISurface
  web?: OpenCodeWebSurface
  desktop?: OpenCodeDesktopSurface
  slack?: OpenCodeSlackSurface
  provider?: LegoProviderAdapter
  model?: LegoModel
  maxBodyBytes?: number
}): OpenCodeServer {
  const routes = openCodeServerRoutes()
  const server = createServer((request, response) => {
    void routeOpenCodeRequest({
      request,
      response,
      sdk: input.sdk,
      controlPlane: input.controlPlane,
      tui: input.tui,
      web: input.web,
      desktop: input.desktop,
      slack: input.slack,
      provider: input.provider,
      model: input.model,
      maxBodyBytes: input.maxBodyBytes ?? 1_000_000,
    })
  })
  return {
    kind: "opencode-server",
    routes,
    listen: (listenInput = {}) => listen(server, listenInput),
    close: (force = false) => close(server, force),
  }
}

export function openCodeServerRoutes(): string[] {
  return [
    "GET /health",
    "GET /v1/workspace",
    "GET /v1/control-plane",
    "GET /v1/graph",
    "GET /v1/sessions",
    "GET /v1/sessions/:id",
    "GET /v1/tui",
    "POST /v1/tui/event",
    "GET /v1/web",
    "GET /v1/desktop",
    "GET /v1/slack/home",
    "POST /v1/slack/command",
    "POST /v1/run",
  ]
}

async function routeOpenCodeRequest(input: {
  request: IncomingMessage
  response: ServerResponse
  sdk: OpenCodeSDK
  controlPlane: OpenCodeControlPlane | undefined
  tui: OpenCodeTUISurface | undefined
  web: OpenCodeWebSurface | undefined
  desktop: OpenCodeDesktopSurface | undefined
  slack: OpenCodeSlackSurface | undefined
  provider: LegoProviderAdapter | undefined
  model: LegoModel | undefined
  maxBodyBytes: number
}): Promise<void> {
  try {
    const requestURL = new URL(input.request.url ?? "/", "http://helix.local")
    const method = input.request.method ?? "GET"

    if (method === "GET" && requestURL.pathname === "/health") {
      sendJSON(input.response, 200, { ok: true, product: "opencode" })
      return
    }
    if (method === "GET" && requestURL.pathname === "/v1/workspace") {
      sendJSON(input.response, 200, input.sdk.workspace())
      return
    }
    if (method === "GET" && requestURL.pathname === "/v1/control-plane") {
      sendJSON(input.response, 200, input.controlPlane?.snapshot() ?? input.sdk.controlPlane())
      return
    }
    if (method === "GET" && requestURL.pathname === "/v1/graph") {
      sendJSON(input.response, 200, { graph: input.sdk.graph() })
      return
    }
    if (method === "GET" && requestURL.pathname === "/v1/tui") {
      sendText(input.response, 200, input.tui?.render() ?? createOpenCodeTUIFromSDK(input.sdk).render(), "text/plain; charset=utf-8")
      return
    }
    if (method === "POST" && requestURL.pathname === "/v1/tui/event") {
      const body = await readJSONBody<TUIInputEvent>(input.request, input.maxBodyBytes)
      sendJSON(input.response, 200, (input.tui ?? createOpenCodeTUIFromSDK(input.sdk)).dispatch(body))
      return
    }
    if (method === "GET" && requestURL.pathname === "/v1/web") {
      sendText(input.response, 200, input.web?.render() ?? createOpenCodeWebFromSDK(input.sdk).render(), "text/html; charset=utf-8")
      return
    }
    if (method === "GET" && requestURL.pathname === "/v1/desktop") {
      sendJSON(input.response, 200, input.desktop?.manifest() ?? createOpenCodeDesktopFromSDK(input.sdk).manifest())
      return
    }
    if (method === "GET" && requestURL.pathname === "/v1/slack/home") {
      sendJSON(input.response, 200, input.slack?.home() ?? createOpenCodeSlackFromSDK(input.sdk).home())
      return
    }
    if (method === "POST" && requestURL.pathname === "/v1/slack/command") {
      const body = await readJSONBody<{ text?: string; userID?: string; channelID?: string }>(input.request, input.maxBodyBytes)
      sendJSON(
        input.response,
        200,
        await (input.slack ?? createOpenCodeSlackFromSDK(input.sdk, input.provider ? { provider: input.provider, ...(input.model ? { model: input.model } : {}) } : undefined)).handleCommand({
          text: body.text ?? "",
          ...(body.userID ? { userID: body.userID } : {}),
          ...(body.channelID ? { channelID: body.channelID } : {}),
        }),
      )
      return
    }
    if (method === "GET" && requestURL.pathname === "/v1/sessions") {
      sendJSON(input.response, 200, { sessions: await input.sdk.listSessions() })
      return
    }
    const sessionMatch = /^\/v1\/sessions\/([^/]+)$/.exec(requestURL.pathname)
    if (method === "GET" && sessionMatch?.[1]) {
      sendJSON(input.response, 200, await input.sdk.getSession(sessionMatch[1] as SessionID))
      return
    }
    if (method === "POST" && requestURL.pathname === "/v1/run") {
      if (!input.provider) throw new OpenCodeHTTPError(503, "OpenCode run requires a live provider.")
      const body = await readJSONBody<{ sessionID?: SessionID; text?: string; maxSteps?: number; maxRetries?: number; syntheticContinue?: boolean; maxSyntheticContinues?: number }>(
        input.request,
        input.maxBodyBytes,
      )
      if (typeof body.text !== "string" || body.text.length === 0) throw new OpenCodeHTTPError(400, "Expected JSON body with non-empty text.")
      sendJSON(
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
      return
    }
    throw new OpenCodeHTTPError(404, `No route for ${method} ${requestURL.pathname}.`)
  } catch (error) {
    const status = error instanceof OpenCodeHTTPError ? error.status : 500
    sendJSON(input.response, status, {
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
    })
  }
}

export type { OpenCodeServer } from "./opencode-product-types"
