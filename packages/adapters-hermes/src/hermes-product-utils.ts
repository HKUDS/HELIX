import type { IncomingMessage, Server, ServerResponse } from "node:http"
import type { AddressInfo } from "node:net"
import type { LegoMessage } from "@helix/contracts"
import type { LegoHookHost } from "@helix/lego-hooks"
import type { HermesRegistrySnapshot, HermesSurfaceHarness } from "./hermes-product-types"

export function currentHermesCwd(harness: HermesSurfaceHarness): string {
  return String(harness.hooks.services.get("cwd") ?? process.cwd())
}

export function hermesRegistrySnapshot(hooks: LegoHookHost): HermesRegistrySnapshot {
  return {
    tools: Array.from(hooks.registries.tools.keys()).sort(),
    commands: Array.from(hooks.registries.commands.keys()).sort(),
    shortcuts: Array.from(hooks.registries.shortcuts.keys()).sort(),
    flags: Array.from(hooks.registries.flags.keys()).sort(),
    providers: Array.from(hooks.registries.providers.keys()).sort(),
    auth: Array.from(hooks.registries.auth.keys()).sort(),
    uiProviders: Array.from(hooks.registries.uiProviders.keys()).sort(),
    messageRenderers: Array.from(hooks.registries.messageRenderers.keys()).sort(),
  }
}

export function hermesMessageText(message: LegoMessage): string {
  return message.parts
    .map((part) => {
      if (isRecord(part) && typeof part["text"] === "string") return part["text"]
      return JSON.stringify(part)
    })
    .join("\n")
}

export async function readJSONBody<T>(request: IncomingMessage, maxBodyBytes: number): Promise<T> {
  const chunks: Buffer[] = []
  let totalBytes = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    totalBytes += buffer.length
    if (totalBytes > maxBodyBytes) throw new HermesHTTPError(413, "Request body is too large.")
    chunks.push(buffer)
  }
  if (chunks.length === 0) return {} as T
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T
  } catch {
    throw new HermesHTTPError(400, "Expected a JSON request body.")
  }
}

export function sendJSON(response: ServerResponse, status: number, value: unknown): void {
  sendText(response, status, JSON.stringify(value), "application/json; charset=utf-8")
}

export function sendText(response: ServerResponse, status: number, value: string, contentType: string): void {
  response.statusCode = status
  response.setHeader("content-type", contentType)
  response.setHeader("content-length", Buffer.byteLength(value))
  response.end(value)
}

export function listen(server: Server, input: { port?: number; host?: string }): Promise<{ url: string; port: number; host: string }> {
  const port = input.port ?? 0
  const host = input.host ?? "127.0.0.1"
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening)
      reject(error)
    }
    const onListening = () => {
      server.off("error", onError)
      const address = server.address() as AddressInfo
      resolve({ url: `http://${host}:${address.port}`, port: address.port, host })
    }
    server.once("error", onError)
    server.once("listening", onListening)
    server.listen(port, host)
  })
}

export function close(server: Server): Promise<void> {
  if (!server.listening) return Promise.resolve()
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

export function escapeHTML(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export class HermesHTTPError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}
