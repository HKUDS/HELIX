import { createServer as createHTTPServer, type Server } from "node:http"
import type { LegoModel, LegoProviderAdapter, SessionID } from "@helix/contracts"
import type { NanobotCLISurface, NanobotSDK, NanobotServer, NanobotTUISurface, NanobotWebUISurface } from "./nanobot-product-types"
import { close, isRecord, listen, nanobotMessageText, NanobotHTTPError, readJSONBody, sendJSON, sendText } from "./nanobot-product-utils"
import { buildNanobotWebUIBootstrap, nanobotWebUINativeHTTPRoutes } from "./nanobot-web-ui.ts"

export interface CreateNanobotServerInput {
  sdk: NanobotSDK
  cli: NanobotCLISurface
  tui: NanobotTUISurface
  webUI: NanobotWebUISurface
  provider?: LegoProviderAdapter
  model?: LegoModel
}

export function createNanobotServer(input: CreateNanobotServerInput): NanobotServer {
  let server: Server | undefined
  const routes = [
    "GET /health",
    "GET /",
    "GET /v1/web",
    "GET /v1/tui",
    "GET /v1/models",
    "POST /v1/chat/completions",
    "POST /v1/agent",
    ...nanobotWebUINativeHTTPRoutes,
  ]
  return {
    kind: "nanobot-server",
    routes,
    async listen(listenInput = {}) {
      if (!server) server = createNanobotHTTPServer(input)
      return listen(server, listenInput)
    },
    async close() {
      if (server) await close(server)
    },
  }
}

function createNanobotHTTPServer(input: CreateNanobotServerInput): Server {
  return createHTTPServer(async (request, response) => {
    try {
      const method = request.method ?? "GET"
      const url = new URL(request.url ?? "/", "http://127.0.0.1")
      const route = `${method} ${url.pathname}`
      if (route === "GET /health") {
        sendJSON(response, 200, { status: "ok", ok: true, product: "nanobot", recipe: input.sdk.workspace().recipeID })
        return
      }
      if (route === "GET /" || route === "GET /v1/web") {
        sendText(response, 200, input.webUI.render({ bootstrap: webUIBootstrapFor(input), apiRoutes: nanobotWebUINativeHTTPRoutes }), "text/html; charset=utf-8")
        return
      }
      if (route === "GET /webui/bootstrap") {
        sendJSON(response, 200, webUIBootstrapFor(input))
        return
      }
      if (route === "GET /api/sessions") {
        sendJSON(response, 200, { sessions: await input.sdk.listSessions() })
        return
      }
      if (route === "GET /api/settings") {
        sendJSON(response, 200, {
          model: webUIBootstrapFor(input).model_name,
          providers: input.sdk.workspace().providers,
          commands: input.cli.commands().map((command) => command.name),
          requires_restart: false,
        })
        return
      }
      if (route === "GET /api/commands") {
        sendJSON(response, 200, { commands: input.cli.commands() })
        return
      }
      const messagesMatch = /^\/api\/sessions\/([^/]+)\/messages$/.exec(url.pathname)
      if (method === "GET" && messagesMatch) {
        const rawSessionID = messagesMatch[1]
        if (!rawSessionID) throw new NanobotHTTPError(400, "Invalid session key.")
        const session = await input.sdk.getSession(decodeURIComponent(rawSessionID) as SessionID)
        sendJSON(response, 200, { messages: session.transcript })
        return
      }
      const threadMatch = /^\/api\/sessions\/([^/]+)\/webui-thread$/.exec(url.pathname)
      if (method === "GET" && threadMatch) {
        const rawSessionID = threadMatch[1]
        if (!rawSessionID) throw new NanobotHTTPError(400, "Invalid session key.")
        const session = await input.sdk.getSession(decodeURIComponent(rawSessionID) as SessionID)
        sendJSON(response, 200, { key: session.session.id, messages: session.transcript })
        return
      }
      if (route === "GET /v1/tui") {
        sendText(response, 200, input.tui.render(), "text/plain; charset=utf-8")
        return
      }
      if (route === "GET /v1/models") {
        const modelName = nanobotModelName(input)
        sendJSON(response, 200, { object: "list", data: [{ id: modelName, object: "model", created: 0, owned_by: "nanobot" }] })
        return
      }
      if (route === "POST /v1/chat/completions") {
        if (!input.provider) throw new NanobotHTTPError(503, "Nanobot chat completions require a live provider.")
        const body = await readJSONBody<NanobotChatCompletionRequest>(request, 20 * 1024 * 1024)
        const modelName = nanobotModelName(input)
        const requestedModel = typeof body.model === "string" ? body.model : undefined
        if (requestedModel && requestedModel !== modelName) {
          sendNanobotOpenAIError(response, 400, `Model ${requestedModel} not found. Expected ${modelName}.`)
          return
        }
        const text = nanobotUserTextFromChatCompletion(body)
        const sessionID = nanobotAPISessionID(body)
        const result = await input.sdk.runTurn({
          ...(sessionID ? { sessionID } : {}),
          text,
          provider: input.provider,
          ...(input.model ? { model: input.model } : {}),
        })
        const completion = nanobotMessageText(result.assistantMessage)
        if (body.stream === true) {
          sendNanobotChatCompletionStream(response, { content: completion, model: modelName, sessionID: String(result.session.id) })
          return
        }
        sendJSON(response, 200, {
          id: nanobotChatCompletionID(String(result.session.id)),
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: modelName,
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: completion },
              finish_reason: "stop",
            },
          ],
          usage: nanobotOpenAIUsage(result.usage),
        })
        return
      }
      if (route === "POST /v1/agent") {
        if (!input.provider) throw new NanobotHTTPError(503, "Nanobot agent run requires a live provider.")
        const body = await readJSONBody<{ prompt?: string; json?: boolean }>(request, 1024 * 1024)
        sendText(
          response,
          200,
          await input.cli.run({
            prompt: body.prompt ?? "hello from nanobot server",
            provider: input.provider,
            ...(input.model ? { model: input.model } : {}),
            json: body.json ?? true,
          }),
          body.json === false ? "text/plain; charset=utf-8" : "application/json; charset=utf-8",
        )
        return
      }
      sendJSON(response, 404, { error: "not_found", route })
    } catch (error) {
      if (error instanceof NanobotHTTPError) {
        sendJSON(response, error.status, { error: error.message })
        return
      }
      sendJSON(response, 500, { error: error instanceof Error ? error.message : String(error) })
    }
  })
}

function webUIBootstrapFor(input: CreateNanobotServerInput) {
  return buildNanobotWebUIBootstrap({ model_name: nanobotModelName(input) })
}

interface NanobotChatCompletionRequest {
  model?: unknown
  messages?: unknown
  stream?: unknown
  session_id?: unknown
  sessionId?: unknown
}

function nanobotModelName(input: CreateNanobotServerInput): string {
  return input.model?.modelID ? String(input.model.modelID) : "nanobot"
}

function nanobotAPISessionID(body: NanobotChatCompletionRequest): SessionID | undefined {
  const rawSessionID = typeof body.session_id === "string"
    ? body.session_id
    : typeof body.sessionId === "string"
      ? body.sessionId
      : undefined
  if (!rawSessionID) return undefined
  return `api:${rawSessionID}` as SessionID
}

function nanobotUserTextFromChatCompletion(body: NanobotChatCompletionRequest): string {
  if (!Array.isArray(body.messages)) throw new NanobotHTTPError(400, "Expected messages with exactly one user message.")
  const userMessages = body.messages.filter((message) => isRecord(message) && message.role === "user")
  if (userMessages.length !== 1) throw new NanobotHTTPError(400, "Expected exactly one user message.")
  const content = userMessages[0]?.content
  const text = nanobotChatMessageContentText(content)
  if (!text.trim()) throw new NanobotHTTPError(400, "Expected non-empty user message content.")
  return text
}

function nanobotChatMessageContentText(content: unknown): string {
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return ""
  return content
    .map((part) => {
      if (!isRecord(part)) return ""
      if (part.type === "text" && typeof part.text === "string") return part.text
      if (typeof part.text === "string") return part.text
      return ""
    })
    .filter(Boolean)
    .join("\n")
}

function nanobotChatCompletionID(sessionID: string): string {
  return `chatcmpl-${sessionID.replace(/[^a-zA-Z0-9_-]/g, "-")}`
}

function nanobotOpenAIUsage(usage: unknown): { prompt_tokens: number; completion_tokens: number; total_tokens: number } {
  if (isRecord(usage)) {
    const promptTokens = numberField(usage.prompt_tokens) ?? numberField(usage.promptTokens) ?? 0
    const completionTokens = numberField(usage.completion_tokens) ?? numberField(usage.completionTokens) ?? 0
    const totalTokens = numberField(usage.total_tokens) ?? numberField(usage.totalTokens) ?? promptTokens + completionTokens
    return { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: totalTokens }
  }
  return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
}

function numberField(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function sendNanobotOpenAIError(response: Parameters<typeof sendJSON>[0], status: number, message: string): void {
  sendJSON(response, status, { error: { message, type: "invalid_request_error", code: status } })
}

function sendNanobotChatCompletionStream(response: Parameters<typeof sendText>[0], input: { content: string; model: string; sessionID: string }): void {
  const id = nanobotChatCompletionID(input.sessionID)
  const created = Math.floor(Date.now() / 1000)
  response.statusCode = 200
  response.setHeader("content-type", "text/event-stream; charset=utf-8")
  response.setHeader("cache-control", "no-cache")
  response.write(`data: ${JSON.stringify({
    id,
    object: "chat.completion.chunk",
    created,
    model: input.model,
    choices: [{ index: 0, delta: { role: "assistant", content: input.content }, finish_reason: null }],
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

export type { NanobotServer } from "./nanobot-product-types"
