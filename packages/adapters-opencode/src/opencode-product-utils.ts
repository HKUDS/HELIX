import type { IncomingMessage, Server, ServerResponse } from "node:http"
import type { AddressInfo } from "node:net"
import type { LegoHookHost } from "@helix/lego-hooks"
import type { OpenCodeSurfaceHarness, OpenCodeWorkspaceSnapshot } from "./opencode-product-types"

export function currentOpenCodeCwd(harness: OpenCodeSurfaceHarness): string {
  return String(harness.hooks.services.get("cwd") ?? process.cwd())
}

export function openCodeRegistrySnapshot(hooks: LegoHookHost): OpenCodeWorkspaceSnapshot["registries"] {
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

export async function readJSONBody<T>(request: IncomingMessage, maxBodyBytes: number): Promise<T> {
  const chunks: Buffer[] = []
  let totalBytes = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    totalBytes += buffer.length
    if (totalBytes > maxBodyBytes) throw new OpenCodeHTTPError(413, "Request body is too large.")
    chunks.push(buffer)
  }
  if (chunks.length === 0) return {} as T
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T
  } catch {
    throw new OpenCodeHTTPError(400, "Expected a JSON request body.")
  }
}

export function sendJSON(response: ServerResponse, status: number, value: unknown): void {
  const body = JSON.stringify(value)
  sendText(response, status, body, "application/json; charset=utf-8")
}

export function sendText(response: ServerResponse, status: number, value: string, contentType: string): void {
  response.statusCode = status
  response.setHeader("content-type", contentType)
  response.setHeader("content-length", Buffer.byteLength(value))
  response.end(value)
}

export function openCodeListenPortCandidates(input: { port?: number }): number[] {
  const port = input.port ?? 0
  return port === 0 ? [4096, 0] : [port]
}

export function openCodeServerURL(input: { host: string; port: number }): string {
  const url = new URL("http://localhost")
  url.hostname = input.host
  url.port = String(input.port)
  return url.toString().replace(/\/$/, "")
}

export function openCodeServerCanPublishMDNS(input: { mdns?: boolean; host: string; port: number }): boolean {
  return Boolean(input.mdns && input.port && !["127.0.0.1", "localhost", "::1"].includes(input.host))
}

export function listen(server: Server, input: { port?: number; host?: string }): Promise<{ url: string; port: number; host: string }> {
  const host = input.host ?? "127.0.0.1"
  const candidates = openCodeListenPortCandidates(input)
  return new Promise((resolve, reject) => {
    const tryListen = (index: number) => {
      const port = candidates[index]
      if (typeof port !== "number") {
        reject(new Error("OpenCode server did not have a listener port candidate."))
        return
      }
      const onError = (error: Error) => {
        server.off("listening", onListening)
        if (port === 4096 && candidates[index + 1] !== undefined) {
          tryListen(index + 1)
          return
        }
        reject(error)
      }
      const onListening = () => {
        server.off("error", onError)
        const address = server.address() as AddressInfo
        resolve({ url: openCodeServerURL({ host, port: address.port }), port: address.port, host })
      }
      server.once("error", onError)
      server.once("listening", onListening)
      server.listen(port, host)
    }
    tryListen(0)
  })
}

export function close(server: Server, force = false): Promise<void> {
  if (!server.listening) {
    if (force) server.closeAllConnections()
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
    if (force) server.closeAllConnections()
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

export function escapeAttribute(value: unknown): string {
  return escapeHTML(value).replace(/`/g, "&#96;")
}

export class OpenCodeHTTPError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
