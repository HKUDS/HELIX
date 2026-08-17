import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { createServer, type IncomingMessage } from "node:http"
import type { AddressInfo } from "node:net"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  createLiveProviderArtifactVerifier,
  createLiveProviderArtifactWriter,
  createLiveProviderCassetteGenerator,
  createLiveProviderCredentialGate,
  createLiveProviderParityArtifact,
  createLiveProviderParitySplitArtifactSet,
  createLiveProviderRunner,
  readLiveProviderParitySplitArtifactSet,
  runLiveProviderParity,
  verifyLiveProviderParityArtifact,
  writeLiveProviderParitySplitArtifactSet,
} from "@helix/recipes"

describe("live provider parity", () => {
  it("skips with explicit missing configuration when live credentials are not available", async () => {
    const gated = createLiveProviderCredentialGate().check({
      provider: "openrouter",
      env: {},
    })
    expect(gated.config.missing).toEqual(["HELIX_LIVE_MODEL or OPENROUTER_MODEL", "OPENROUTER_API_KEY"])
    expect(gated.report?.status).toBe("skipped")

    const report = await runLiveProviderParity({
      provider: "openrouter",
      env: {},
    })

    expect(report.status).toBe("skipped")
    expect(report.ok).toBe(true)
    expect(report.missing).toEqual(["HELIX_LIVE_MODEL or OPENROUTER_MODEL", "OPENROUTER_API_KEY"])
    expect(report.products).toEqual([])
  })

  it("runs all product harnesses through an HTTP streaming provider adapter", async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = []
    const server = createServer(async (request, response) => {
      if (request.method !== "POST" || request.url !== "/v1/chat/completions") {
        response.writeHead(404)
        response.end()
        return
      }
      calls.push({ url: request.url, body: JSON.parse(await readBody(request)) as Record<string, unknown> })
      response.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
      })
      response.write('data: {"choices":[{"delta":{"content":"helix-live-ok from local provider"}}]}\n\n')
      response.write('data: {"choices":[{"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":8,"completion_tokens":4}}\n\n')
      response.write("data: [DONE]\n\n")
      response.end()
    })

    try {
      const { url } = await listen(server)
      const cassetteGenerator = createLiveProviderCassetteGenerator()
      const cassette = cassetteGenerator.create()
      const report = await createLiveProviderRunner().run({
        config: {
          provider: "openai-compatible",
          modelID: "live-provider-test-model",
          apiKey: "local-test-key",
          baseURL: `${url}/v1`,
          missing: [],
        },
        input: {
          requireCredentials: true,
          env: {},
          cassette,
        },
      })

      expect(report.status).toBe("passed")
      expect(report.ok).toBe(true)
      expect(report.issues).toEqual([])
      expect(report.products.map((product) => product.product)).toEqual(["opencode", "pi-mono", "nanobot", "hermes-agent"])
      expect(report.products.every((product) => product.status === "passed")).toBe(true)
      expect(report.checks.map((check) => check.id)).toEqual(
        expect.arrayContaining([
          "live-provider:configured",
          "opencode:live-provider-turn",
          "opencode:live-provider-sdk-readback",
          "pi-mono:live-provider-turn",
          "pi-mono:live-provider-sdk-readback",
          "nanobot:live-provider-turn",
          "nanobot:live-provider-sdk-readback",
          "hermes-agent:live-provider-turn",
          "hermes-agent:live-provider-sdk-readback",
        ]),
      )
      expect(calls).toHaveLength(4)
      expect(calls.map((call) => call.body.model)).toEqual(["live-provider-test-model", "live-provider-test-model", "live-provider-test-model", "live-provider-test-model"])
      expect(calls.every((call) => Array.isArray(call.body.messages))).toBe(true)

      const cassetteArtifact = cassetteGenerator.artifact(cassette, new Date("2026-05-26T19:10:00.000Z"))
      expect(cassetteArtifact.records).toHaveLength(4)
      expect(cassetteArtifact.records.map((record) => record.status)).toEqual([200, 200, 200, 200])
      expect(cassetteArtifact.records.every((record) => record.requestHeaders["authorization"] === "Bearer local-test-key")).toBe(true)
      expect(JSON.stringify(cassetteArtifact)).toContain("local-test-key")

      const generatedAt = new Date("2026-05-26T19:10:00.000Z")
      const writer = createLiveProviderArtifactWriter()
      const artifact = writer.create(report, generatedAt)
      const outRoot = mkdtempSync(join(tmpdir(), "helix-live-provider-artifact-"))
      try {
        const outPath = join(outRoot, "nested", "live-provider-parity.json")
        const written = writer.write({ path: outPath, report, generatedAt })
        expect(written).toEqual(artifact)
        expect(JSON.parse(readFileSync(outPath, "utf8"))).toEqual(artifact)
      } finally {
        rmSync(outRoot, { recursive: true, force: true })
      }

      const verification = createLiveProviderArtifactVerifier().verify({
        artifact,
        expectedProvider: "openai-compatible",
        expectedModelID: "live-provider-test-model",
        now: new Date("2026-05-26T19:11:00.000Z"),
        maxAgeMs: 120_000,
      })
      expect(verification.ok).toBe(true)
      expect(verification.issues).toEqual([])
      expect(verification.checks.map((check) => check.id)).toEqual(
        expect.arrayContaining([
          "live-provider-artifact:schema",
          "live-provider-artifact:passed",
          "live-provider-artifact:products",
          "live-provider-artifact:checks",
          "live-provider-artifact:freshness",
        ]),
      )

      const splitRoot = mkdtempSync(join(tmpdir(), "helix-live-provider-split-"))
      try {
        const split = createLiveProviderParitySplitArtifactSet(report, generatedAt)
        writeLiveProviderParitySplitArtifactSet({ outDir: splitRoot, artifactSet: split, summaryOut: join(splitRoot, "live-provider-summary.json") })
        const reread = readLiveProviderParitySplitArtifactSet(join(splitRoot, "summary.json"))
        const splitVerification = verifyLiveProviderParityArtifact({
          artifact: reread,
          expectedProvider: "openai-compatible",
          expectedModelID: "live-provider-test-model",
          now: new Date("2026-05-26T19:11:00.000Z"),
          maxAgeMs: 120_000,
        })

        expect(split.summary.schemaVersion).toBe(2)
        expect(split.summary.products.map((product) => product.product)).toEqual(["opencode", "pi-mono", "nanobot", "hermes-agent"])
        expect(split.summary.attachments.every((attachment) => attachment.sha256.length === 64)).toBe(true)
        expect(readFileSync(join(splitRoot, "summary.json"), "utf8")).not.toContain("local-test-key")
        expect(readFileSync(join(splitRoot, "manifest.json"), "utf8")).toContain("attachments/")
        expect(splitVerification.ok).toBe(true)
        expect(splitVerification.issues).toEqual([])
      } finally {
        rmSync(splitRoot, { recursive: true, force: true })
      }
    } finally {
      await close(server)
    }
  })

  it("rejects skipped or credential-shaped live provider parity artifacts as completion evidence", async () => {
    const skipped = await runLiveProviderParity({
      provider: "openrouter",
      env: {},
    })
    const skippedVerification = verifyLiveProviderParityArtifact({
      artifact: createLiveProviderParityArtifact(skipped, new Date("2026-05-26T19:10:00.000Z")),
    })
    expect(skippedVerification.ok).toBe(false)
    expect(skippedVerification.issues.map((issue) => issue.id)).toEqual(
      expect.arrayContaining(["live-provider-artifact:passed", "live-provider-artifact:products", "live-provider-artifact:checks"]),
    )

    const leakedSecretVerification = verifyLiveProviderParityArtifact({
      artifact: {
        ...createLiveProviderParityArtifact({
          status: "passed",
          ok: true,
          provider: "openrouter",
          modelID: "openai/gpt-test",
          products: [
            { product: "opencode", status: "passed", ok: true, checks: [], sessionID: "ses_live_opencode", steps: 1 },
            { product: "pi-mono", status: "passed", ok: true, checks: [], sessionID: "ses_live_pi", steps: 1 },
            { product: "nanobot", status: "passed", ok: true, checks: [], sessionID: "ses_live_nanobot", steps: 1 },
          ],
          checks: [
            { id: "live-provider:configured", ok: true, message: "configured" },
            { id: "opencode:live-provider-turn", ok: true, message: "turn" },
            { id: "opencode:live-provider-sdk-readback", ok: true, message: "readback" },
            { id: "pi-mono:live-provider-turn", ok: true, message: "turn" },
            { id: "pi-mono:live-provider-sdk-readback", ok: true, message: "readback" },
            { id: "nanobot:live-provider-turn", ok: true, message: "turn" },
            { id: "nanobot:live-provider-sdk-readback", ok: true, message: "readback" },
          ],
          issues: [],
          missing: [],
        }),
        apiKey: "secret",
      },
    })
    expect(leakedSecretVerification.ok).toBe(false)
    expect(leakedSecretVerification.issues.map((issue) => issue.id)).toContain("live-provider-artifact:no-secret-fields")
  })
})

async function readBody(request: IncomingMessage): Promise<string> {
  let body = ""
  for await (const chunk of request) body += String(chunk)
  return body
}

function listen(server: ReturnType<typeof createServer>): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject)
      const address = server.address() as AddressInfo
      resolve({ url: `http://127.0.0.1:${address.port}` })
    })
  })
}

function close(server: ReturnType<typeof createServer>): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}
