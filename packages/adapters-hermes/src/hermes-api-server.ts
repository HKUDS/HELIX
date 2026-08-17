import { createServer as createHTTPServer, type Server } from "node:http"
import type { LegoModel, LegoProviderAdapter, SessionID } from "@helix/contracts"
import type { HermesACPSurface, HermesCLISurface, HermesAPIServer, HermesGatewaySurface, HermesSDK, HermesTUISurface, HermesWebDashboardSurface } from "./hermes-product-types"
import { close, hermesMessageText, HermesHTTPError, isRecord, listen, readJSONBody, sendJSON, sendText } from "./hermes-product-utils"
import { createHermesACP } from "./hermes-acp"

export interface CreateHermesAPIServerInput {
  sdk: HermesSDK
  cli: HermesCLISurface
  tui: HermesTUISurface
  acp: HermesACPSurface
  gateway: HermesGatewaySurface
  webDashboard: HermesWebDashboardSurface
  provider?: LegoProviderAdapter
  model?: LegoModel
}

export function createHermesAPIServer(input: CreateHermesAPIServerInput): HermesAPIServer {
  let server: Server | undefined
  const routes = [
    "GET /health",
    "GET /v1/capabilities",
    "GET /v1/models",
    "GET /v1/dashboard",
    "GET /v1/tui",
    "POST /v1/chat/completions",
    "POST /v1/runs",
    "POST /v1/acp",
    "POST /v1/gateway",
  ]
  return {
    kind: "hermes-api-server",
    routes,
    async listen(listenInput = {}) {
      if (!server) server = createHermesHTTPServer(input)
      return listen(server, listenInput)
    },
    async close() {
      if (server) await close(server)
    },
  }
}

function createHermesHTTPServer(input: CreateHermesAPIServerInput): Server {
  return createHTTPServer(async (request, response) => {
    try {
      const method = request.method ?? "GET"
      const url = new URL(request.url ?? "/", "http://127.0.0.1")
      const route = `${method} ${url.pathname}`
      if (route === "GET /health") {
        sendJSON(response, 200, { status: "ok", ok: true, platform: "hermes-agent", product: "hermes-agent", recipe: input.sdk.workspace().recipeID })
        return
      }
      if (route === "GET /v1/capabilities") {
        sendJSON(response, 200, {
          object: "hermes.api_server.capabilities",
          platform: "hermes-agent",
          product: "hermes-agent",
          model: hermesModelName(input),
          routes: input.sdk.workspace().services,
          acp: input.acp.methods(),
          gateway: input.gateway.methods(),
          features: {
            chat_completions: true,
            chat_completions_streaming: true,
            responses_api: false,
            run_submission: true,
            session_continuity_header: "X-Hermes-Session-Id",
            session_key_header: "X-Hermes-Session-Key",
          },
          endpoints: {
            health: { method: "GET", path: "/health" },
            models: { method: "GET", path: "/v1/models" },
            chat_completions: { method: "POST", path: "/v1/chat/completions" },
            runs: { method: "POST", path: "/v1/runs" },
            acp: { method: "POST", path: "/v1/acp" },
            gateway: { method: "POST", path: "/v1/gateway" },
            dashboard: { method: "GET", path: "/v1/dashboard" },
            tui: { method: "GET", path: "/v1/tui" },
          },
        })
        return
      }
      if (route === "GET /v1/models") {
        const modelName = hermesModelName(input)
        sendJSON(response, 200, {
          object: "list",
          data: [{ id: modelName, object: "model", created: 0, owned_by: "hermes", permission: [], root: modelName, parent: null }],
        })
        return
      }
      if (route === "GET /v1/dashboard") {
        sendText(response, 200, input.webDashboard.render(), "text/html; charset=utf-8")
        return
      }
      if (route === "GET /v1/tui") {
        sendText(response, 200, input.tui.render(), "text/plain; charset=utf-8")
        return
      }
      if (route === "POST /v1/chat/completions" || route === "POST /v1/runs") {
        if (!input.provider) throw new HermesHTTPError(503, "Hermes API run requires a live provider.")
        const body = await readJSONBody<HermesChatCompletionRequest>(request, 10 * 1024 * 1024)
        const modelName = hermesModelName(input, body)
        const sessionID = hermesAPISessionID(request.headers["x-hermes-session-id"], body)
        const result = await input.sdk.runTurn({
          ...(sessionID ? { sessionID } : {}),
          text: hermesUserTextFromChatCompletion(body),
          provider: input.provider,
          ...(input.model ? { model: input.model } : {}),
        })
        const completion = hermesMessageText(result.assistantMessage)
        if (body.stream === true || body.stream === "true") {
          sendHermesChatCompletionStream(response, { content: completion, model: modelName, sessionID: String(result.session.id) })
          return
        }
        sendJSON(response, 200, {
          id: hermesChatCompletionID(String(result.session.id)),
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: modelName,
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: completion },
              finish_reason: hermesFinishReason(result),
            },
          ],
          usage: hermesOpenAIUsage(result.usage),
        })
        return
      }
      if (route === "POST /v1/acp") {
        const body = await readJSONBody<{ method?: string; params?: Record<string, unknown> }>(request, 1024 * 1024)
        const acp = input.provider ? createHermesACP(input.sdk, { provider: input.provider, ...(input.model ? { model: input.model } : {}) }) : input.acp
        sendJSON(response, 200, await acp.call(body.method ?? "initialize", body.params))
        return
      }
      if (route === "POST /v1/gateway") {
        if (!input.provider) throw new HermesHTTPError(503, "Hermes gateway run requires a live provider.")
        const body = await readJSONBody<{ platform?: string; text?: string; userID?: string }>(request, 1024 * 1024)
        sendJSON(
          response,
          200,
          await input.gateway.dispatch({
            platform: body.platform ?? "api",
            text: body.text ?? "hello from gateway",
            ...(body.userID ? { userID: body.userID } : {}),
            provider: input.provider,
            ...(input.model ? { model: input.model } : {}),
          }),
        )
        return
      }
      sendJSON(response, 404, { error: "not_found", route })
    } catch (error) {
      if (error instanceof HermesHTTPError) {
        sendJSON(response, error.status, { error: error.message })
        return
      }
      sendJSON(response, 500, { error: error instanceof Error ? error.message : String(error) })
    }
  })
}

interface HermesChatCompletionRequest {
  model?: unknown
  messages?: unknown
  prompt?: unknown
  stream?: unknown
  session_id?: unknown
  sessionId?: unknown
}

function hermesModelName(input: CreateHermesAPIServerInput, body?: HermesChatCompletionRequest): string {
  if (typeof body?.model === "string" && body.model.trim()) return body.model
  return input.model?.modelID ? String(input.model.modelID) : "hermes-agent"
}

function hermesAPISessionID(headerValue: string | string[] | undefined, body: HermesChatCompletionRequest): SessionID | undefined {
  const rawHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue
  const rawSessionID = typeof rawHeader === "string" && rawHeader.trim()
    ? rawHeader.trim()
    : typeof body.session_id === "string"
      ? body.session_id
      : typeof body.sessionId === "string"
        ? body.sessionId
        : undefined
  if (!rawSessionID) return undefined
  return `api:${rawSessionID.replace(/[\r\n\0]/g, "")}` as SessionID
}

function hermesUserTextFromChatCompletion(body: HermesChatCompletionRequest): string {
  if (typeof body.prompt === "string" && body.prompt.trim()) return body.prompt
  if (!Array.isArray(body.messages)) throw new HermesHTTPError(400, "Missing or invalid 'messages' field.")
  const conversationalMessages = body.messages.filter((message) => isRecord(message) && (message.role === "user" || message.role === "assistant"))
  let lastUserMessage: Record<string, unknown> | undefined
  for (let index = conversationalMessages.length - 1; index >= 0; index -= 1) {
    const message = conversationalMessages[index]
    if (message?.role === "user") {
      lastUserMessage = message
      break
    }
  }
  if (!lastUserMessage) throw new HermesHTTPError(400, "No user message found in messages.")
  const text = hermesChatMessageContentText(lastUserMessage.content)
  if (!text.trim()) throw new HermesHTTPError(400, "Expected non-empty user message content.")
  return text
}

function hermesChatMessageContentText(content: unknown): string {
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return content == null ? "" : String(content)
  return content
    .map((part) => {
      if (typeof part === "string") return part
      if (!isRecord(part)) return ""
      if ((part.type === "text" || part.type === "input_text" || part.type === "output_text") && typeof part.text === "string") return part.text
      if (typeof part.text === "string") return part.text
      return ""
    })
    .filter(Boolean)
    .join("\n")
}

function hermesChatCompletionID(sessionID: string): string {
  return `chatcmpl-${sessionID.replace(/[^a-zA-Z0-9_-]/g, "-")}`
}

function hermesFinishReason(result: { finish?: string; error?: unknown }): "stop" | "length" | "error" {
  if (result.error) return "error"
  return result.finish === "length" ? "length" : "stop"
}

function hermesOpenAIUsage(usage: unknown): { prompt_tokens: number; completion_tokens: number; total_tokens: number } {
  if (isRecord(usage)) {
    const promptTokens = numberField(usage.input_tokens) ?? numberField(usage.prompt_tokens) ?? numberField(usage.promptTokens) ?? 0
    const completionTokens = numberField(usage.output_tokens) ?? numberField(usage.completion_tokens) ?? numberField(usage.completionTokens) ?? 0
    const totalTokens = numberField(usage.total_tokens) ?? numberField(usage.totalTokens) ?? promptTokens + completionTokens
    return { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: totalTokens }
  }
  return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
}

function numberField(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function sendHermesChatCompletionStream(response: Parameters<typeof sendText>[0], input: { content: string; model: string; sessionID: string }): void {
  const id = hermesChatCompletionID(input.sessionID)
  const created = Math.floor(Date.now() / 1000)
  response.statusCode = 200
  response.setHeader("content-type", "text/event-stream; charset=utf-8")
  response.setHeader("cache-control", "no-cache")
  response.write(`data: ${JSON.stringify({
    id,
    object: "chat.completion.chunk",
    created,
    model: input.model,
    choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: null }],
  })}\n\n`)
  response.write(`data: ${JSON.stringify({
    id,
    object: "chat.completion.chunk",
    created,
    model: input.model,
    choices: [{ index: 0, delta: { content: input.content }, finish_reason: null }],
  })}\n\n`)
  response.write(`data: ${JSON.stringify({
    id,
    object: "chat.completion.chunk",
    created,
    model: input.model,
    choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
  })}\n\n`)
  response.end("data: [DONE]\n\n")
}

export type { HermesAPIServer } from "./hermes-product-types"
