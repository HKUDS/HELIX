import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { parseArgs } from "@helix/cli"
import type { HermesAPIServer } from "@helix/adapters-hermes"
import type { NanobotServer } from "@helix/adapters-nanobot"
import type { OpenCodeServer } from "@helix/adapters-opencode"
import type { PiServer } from "@helix/adapters-pi"
import { assembleHermesAgentHarness, assembleNanobotHarness, assembleOpenCodeHarness, assemblePiMonoHarness } from "@helix/recipes"

interface ServerSurface {
  routes: string[]
  listen(input?: { port?: number; host?: string }): Promise<{ url: string }>
  close(): Promise<void>
}

describe("fake provider public path regression", () => {
  it("does not publish fake provider package exports or source entrypoints", async () => {
    const offenders: Array<{ package: string; exportPath: string; target: string }> = []
    for (const manifestPath of packageManifestPaths()) {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { name?: string; exports?: Record<string, string> }
      for (const [exportPath, target] of Object.entries(manifest.exports ?? {})) {
        if (isFakePublicPath(exportPath) || isFakePublicPath(target)) {
          offenders.push({ package: manifest.name ?? manifestPath, exportPath, target })
        }
      }
    }

    expect(offenders).toEqual([])
    expect(existsSync(join(process.cwd(), "packages", "lego-provider", "src", "fake-provider.ts"))).toBe(false)
    const forbiddenProviderSubpath = ["@helix/lego-provider", "fake-provider"].join("/")
    await expect(import(forbiddenProviderSubpath)).rejects.toThrow()
    const providerRoot = await import("@helix/lego-provider")
    expect(Object.keys(providerRoot).filter((name) => isFakePublicPath(name))).toEqual([])
  })

  it("rejects fake provider aliases from public CLI command surfaces", () => {
    expect(() => parseArgs(["run", "opencode", "--fake-provider", "--prompt", "hello"])).toThrow("--fake-provider is no longer supported")
    expect(() => parseArgs(["run", "opencode", "--provider", "fake", "--prompt", "hello"])).toThrow("--provider fake is no longer supported")
    expect(() => parseArgs(["profile", "configure-provider", "demo", "--provider", "fake", "--json"])).toThrow(
      "profile configure-provider no longer supports --provider fake",
    )
    expect(() => parseArgs(["channel", "add", "demo", "telegram", "--mode", "fake", "--json"])).toThrow("Telegram gateway mode fake is no longer supported")
    expect(() => parseArgs(["live-provider-parity", "--provider", "fake", "--json"])).toThrow("live-provider-parity does not support --provider fake")
    expect(() => parseArgs(["task-parity", "--provider", "fake", "--json"])).toThrow("task-parity --provider fake is no longer supported")
  })

  it("does not expose fake run routes from product HTTP/API servers", async () => {
    const piRoot = mkdtempSync(join(tmpdir(), "helix-fake-route-pi-"))
    const piCwd = join(piRoot, "workspace")
    const piStorage = join(piRoot, "storage")
    try {
      const opencode = assembleOpenCodeHarness()
      const pi = assemblePiMonoHarness({ cwd: piCwd, storageDir: piStorage })
      const nanobot = assembleNanobotHarness()
      const hermes = assembleHermesAgentHarness()
      await expectFakeRoutesRejected(service<(input?: unknown) => OpenCodeServer>(opencode.hooks.services, "opencode.server.factory")(), [
        "/v1/run/fake",
        "/v1/fake-provider/run",
      ])
      await expectFakeRoutesRejected(service<(input?: unknown) => PiServer>(pi.hooks.services, "pi.server.factory")(), ["/v1/run/fake", "/v1/fake-provider/run"])
      await expectFakeRoutesRejected(service<(input?: unknown) => NanobotServer>(nanobot.hooks.services, "nanobot.server.factory")(), [
        "/v1/agent/fake",
        "/v1/fake-provider/agent",
      ])
      await expectFakeRoutesRejected(service<(input?: unknown) => HermesAPIServer>(hermes.hooks.services, "hermes.api-server.factory")(), [
        "/v1/chat/completions/fake",
        "/v1/runs/fake",
        "/v1/fake-provider/runs",
      ])
    } finally {
      rmSync(piRoot, { recursive: true, force: true })
    }
  })
})

function packageManifestPaths(): string[] {
  return readdirSync(join(process.cwd(), "packages"))
    .map((entry) => join(process.cwd(), "packages", entry, "package.json"))
    .filter((path) => existsSync(path) && statSync(path).isFile())
}

function isFakePublicPath(value: string): boolean {
  return /(?:^|[/._-])fake(?:[/._-]|$)|fake-provider|fakeProvider|run\/fake/i.test(value)
}

function service<T>(services: Map<string, unknown>, id: string): T {
  const value = services.get(id)
  if (!value) throw new Error(`Missing service: ${id}`)
  return value as T
}

async function expectFakeRoutesRejected(server: ServerSurface, paths: string[]): Promise<void> {
  expect(server.routes.filter((route) => isFakePublicPath(route))).toEqual([])
  try {
    const { url } = await server.listen()
    for (const path of paths) {
      expect(await fetchStatus(`${url}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })).toBe(404)
    }
  } finally {
    await server.close()
  }
}

async function fetchStatus(url: string, init: RequestInit): Promise<number> {
  const response = await fetch(url, init)
  await response.text()
  return response.status
}
