import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  createExternalToolCaptureDryRun,
  doctorExternalTool,
  runExternalToolCapture,
  importExternalToolArtifact,
  verifyExternalToolRunManifest,
  verifyNativeCaptureArtifactWithRunManifest,
  type ExternalToolRunManifest,
} from "../src/index"

describe("external tool capture dry-run", () => {
  it("checks a mock tool binary without requiring claude-tap to be installed", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-external-doctor-"))
    try {
      const toolPath = join(dir, "mock-claude-tap")
      writeFileSync(
        toolPath,
        `#!/usr/bin/env node
if (process.argv.includes("--version")) {
  console.log("claude-tap 0.1.114")
  process.exit(0)
}
process.exit(2)
`,
        { mode: 0o755 },
      )

      const result = await doctorExternalTool("claude-tap", { toolPath })

      expect(result.ok).toBe(true)
      expect(result.installed).toBe(true)
      expect(result.command).toBe(toolPath)
      expect(result.version).toBe("0.1.114")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("allows enough default doctor time for cold launchers", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-external-doctor-"))
    try {
      const toolPath = join(dir, "slow-claude-tap")
      writeFileSync(
        toolPath,
        `#!/usr/bin/env node
setTimeout(() => {
  console.log("claude-tap 0.1.114")
}, 3200)
`,
        { mode: 0o755 },
      )

      const result = await doctorExternalTool("claude-tap", { toolPath })

      expect(result.ok).toBe(true)
      expect(result.version).toBe("0.1.114")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("writes a run manifest without launching the external tool", () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-external-capture-"))
    try {
      const result = createExternalToolCaptureDryRun({
        toolID: "claude-tap",
        product: "pi-mono",
        taskID: "read-only-answer",
        outDir: dir,
        toolArgs: ["--tap-client", "pi", "--", "-p", "Reply OK"],
        now: new Date("2026-06-14T00:00:00.000Z"),
        runID: "test-run",
      })
      const manifest = JSON.parse(readFileSync(result.manifestPath, "utf8")) as ExternalToolRunManifest

      expect(result.dryRun).toBe(true)
      expect(existsSync(result.manifestPath)).toBe(true)
      expect(manifest).toMatchObject({
        schemaVersion: 1,
        artifactKind: "external-tool-run-manifest",
        runID: "test-run",
        toolID: "claude-tap",
        product: "pi-mono",
        taskID: "read-only-answer",
        captureMode: "dry-run",
        exitCode: 0,
        invocation: {
          strategy: "binary",
          command: "claude-tap",
        },
        artifacts: [],
      })
      expect(manifest.invocation.args).toEqual([
        "--tap-output-dir",
        join(dir, "raw"),
        "--tap-no-open",
        "--tap-no-live",
        "--tap-no-update-check",
        "--tap-store-stream-events",
        "--tap-client",
        "pi",
        "--",
        "-p",
        "Reply OK",
      ])
      const dryRunVerification = verifyExternalToolRunManifest(manifest, {
        runManifestPath: result.manifestPath,
        requiredProduct: "pi-mono",
        requiredTaskID: "read-only-answer",
        requiredCaptureMode: "dry-run",
        requiredInvocationStrategy: "binary",
        requiredInvocationArgs: [
          "--tap-output-dir",
          join(dir, "raw"),
          "--tap-no-open",
          "--tap-no-live",
          "--tap-no-update-check",
          "--tap-store-stream-events",
          "--tap-client",
          "pi",
          "--",
          "-p",
          "Reply OK",
        ],
        allowUnknownToolVersion: true,
        allowEmptyArtifacts: true,
      })
      expect(dryRunVerification).toMatchObject({ ok: true })
      expect(verifyExternalToolRunManifest(manifest, {
        requiredInvocationCommand: "claude-tap",
        allowUnknownToolVersion: true,
        allowEmptyArtifacts: true,
      })).toMatchObject({ ok: true })
      expect(verifyExternalToolRunManifest(
        { ...manifest, invocation: { ...manifest.invocation, resolvedCommand: "/tmp/other-claude-tap" } },
        {
          requiredInvocationCommand: "claude-tap",
          allowUnknownToolVersion: true,
          allowEmptyArtifacts: true,
        },
      ).issues).toEqual(expect.arrayContaining([expect.objectContaining({ id: "run-manifest.invocation-command" })]))
      expect(verifyExternalToolRunManifest(
        { ...manifest, invocation: { ...manifest.invocation, args: ["--tap-client", "pi"] } },
        {
          requiredProduct: "pi-mono",
          requiredTaskID: "read-only-answer",
          requiredCaptureMode: "dry-run",
          requiredInvocationStrategy: "binary",
          requiredInvocationArgs: [
            "--tap-output-dir",
            join(dir, "raw"),
            "--tap-no-open",
            "--tap-no-live",
            "--tap-no-update-check",
            "--tap-store-stream-events",
            "--tap-client",
            "pi",
            "--",
            "-p",
            "Reply OK",
          ],
          allowUnknownToolVersion: true,
          allowEmptyArtifacts: true,
        },
      ).issues).toEqual(expect.arrayContaining([expect.objectContaining({ id: "run-manifest.invocation-args" })]))
      expect(verifyExternalToolRunManifest(
        { ...manifest, captureMode: "simulated-capture" },
        {
          allowUnknownToolVersion: true,
          allowEmptyArtifacts: true,
        },
      ).issues).toEqual(expect.arrayContaining([expect.objectContaining({ id: "run-manifest.capture-mode" })]))
      expect(verifyExternalToolRunManifest(
        {
          ...manifest,
          runID: "",
          startedAt: "not-a-date",
          invocation: {
            ...manifest.invocation,
            envAllowlist: ["OPENAI_API_KEY", "OPENAI_API_KEY", "openai_api_key"],
          },
        },
        {
          allowUnknownToolVersion: true,
          allowEmptyArtifacts: true,
        },
      ).issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "run-manifest.run-id" }),
        expect.objectContaining({ id: "run-manifest.started-at" }),
        expect.objectContaining({ id: "run-manifest.duration" }),
        expect.objectContaining({ id: "run-manifest.env-allowlist" }),
      ]))
      expect(verifyExternalToolRunManifest(
        {
          ...manifest,
          finishedAt: "2026-06-13T23:59:59.999Z",
          invocation: { ...manifest.invocation, args: ["--tap-client", 1], cwd: "relative-workspace" },
        },
        {
          allowUnknownToolVersion: true,
          allowEmptyArtifacts: true,
        },
      ).issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "run-manifest.duration" }),
        expect.objectContaining({ id: "run-manifest.invocation" }),
      ]))
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("writes uvx invocation details into dry-run manifests", () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-external-capture-"))
    try {
      const result = createExternalToolCaptureDryRun({
        toolID: "claude-tap",
        product: "pi-mono",
        taskID: "read-only-answer",
        outDir: dir,
        strategy: "uvx",
        toolArgs: ["--tap-client", "pi", "--", "-p", "Reply OK"],
        now: new Date("2026-06-14T00:00:00.000Z"),
        runID: "uvx-dry-run",
      })
      const manifest = JSON.parse(readFileSync(result.manifestPath, "utf8")) as ExternalToolRunManifest

      expect(manifest).toMatchObject({
        runID: "uvx-dry-run",
        invocation: {
          strategy: "uvx",
          command: "uvx",
        },
      })
      expect(manifest.invocation.args).toEqual([
        "claude-tap",
        "--tap-output-dir",
        join(dir, "raw"),
        "--tap-no-open",
        "--tap-no-live",
        "--tap-no-update-check",
        "--tap-store-stream-events",
        "--tap-client",
        "pi",
        "--",
        "-p",
        "Reply OK",
      ])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("does not duplicate explicit claude-tap stream event storage flags", () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-external-capture-"))
    try {
      const result = createExternalToolCaptureDryRun({
        toolID: "claude-tap",
        product: "pi-mono",
        taskID: "read-only-answer",
        outDir: dir,
        toolArgs: ["--tap-store-stream-events", "--tap-client", "pi", "--", "-p", "Reply OK"],
        now: new Date("2026-06-14T00:00:00.000Z"),
        runID: "stream-events-explicit",
      })
      const manifest = JSON.parse(readFileSync(result.manifestPath, "utf8")) as ExternalToolRunManifest

      expect(manifest.invocation.args.filter((arg) => arg === "--tap-store-stream-events")).toHaveLength(1)
      expect(manifest.invocation.args.indexOf("--tap-store-stream-events")).toBeLessThan(manifest.invocation.args.indexOf("--tap-client"))
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("rejects docs/reports output directories for local-only raw captures", () => {
    expect(() =>
      createExternalToolCaptureDryRun({
        toolID: "claude-tap",
        product: "pi-mono",
        taskID: "read-only-answer",
        outDir: join(process.cwd(), "docs/reports/external-tools/claude-tap/raw-run"),
        toolArgs: ["--tap-client", "pi", "--", "-p", "Reply OK"],
      }),
    ).toThrow("docs/reports")
  })

  it("rejects unsupported claude-tap products before capture or import", () => {
    expect(() =>
      createExternalToolCaptureDryRun({
        toolID: "claude-tap",
        product: "nanobot",
        taskID: "read-only-answer",
        outDir: join(tmpdir(), "helix-external-capture-nanobot"),
        toolArgs: ["--tap-client", "nanobot", "--", "Reply OK"],
      }),
    ).toThrow("does not support product nanobot")

    expect(() =>
      importExternalToolArtifact({
        toolID: "claude-tap",
        product: "nanobot",
        artifactPath: "external-tools/claude-tap/fixtures/minimal-jsonl.trace.jsonl",
      }),
    ).toThrow("does not support product nanobot")
  })

  it("rejects claude-tap output overrides under docs/reports", () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-external-capture-"))
    try {
      expect(() =>
        createExternalToolCaptureDryRun({
          toolID: "claude-tap",
          product: "pi-mono",
          taskID: "read-only-answer",
          outDir: dir,
          toolArgs: ["--tap-output-dir=docs/reports/external-tools/claude-tap/raw", "--tap-client", "pi", "--", "-p", "Reply OK"],
        }),
      ).toThrow("claude-tap --tap-output-dir")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("runs a mock external tool capture and records artifacts", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-external-capture-"))
    try {
      const toolPath = join(dir, "mock-claude-tap")
      writeFileSync(
        toolPath,
        `#!/usr/bin/env node
const { mkdirSync, writeFileSync } = require("node:fs")
const { resolve } = require("node:path")
const args = process.argv.slice(2)
if (args.includes("--version")) {
  console.log("claude-tap 0.1.114")
  process.exit(0)
}
const outIndex = args.indexOf("--tap-output-dir")
if (outIndex < 0 || !args[outIndex + 1]) process.exit(2)
const rawDir = resolve(args[outIndex + 1])
mkdirSync(rawDir, { recursive: true })
writeFileSync(resolve(rawDir, "trace.jsonl"), JSON.stringify({
  request_id: "mock-1",
  turn: 1,
  request: {
    method: "POST",
    path: "/v1/responses",
    headers: { authorization: "***" },
    body: {
      model: "gpt-test",
      instructions: "You are Pi.",
      input: [{ role: "user", content: "Reply OK" }],
      tools: [{ type: "function", function: { name: "bash", parameters: { type: "object", properties: { cmd: { type: "string" } } } } }],
    },
  },
  response: {
    status: 200,
    headers: { "content-type": "application/json" },
    body: {
      status: "completed",
      output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: "OK" }] }],
    },
  },
}) + "\\n", "utf8")
writeFileSync(resolve(rawDir, "env.json"), JSON.stringify({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || null,
  CODEX_API_KEY: process.env.CODEX_API_KEY || null,
  CODEX_MANAGED_BY_NPM: process.env.CODEX_MANAGED_BY_NPM || null,
  CODEX_MANAGED_PACKAGE_ROOT: process.env.CODEX_MANAGED_PACKAGE_ROOT || null,
  CODEX_REMOTE_PAYLOAD: process.env.CODEX_REMOTE_PAYLOAD || null,
  CODEX_THREAD_ID: process.env.CODEX_THREAD_ID || null,
  HELIX_EXTERNAL_CAPTURE: process.env.HELIX_EXTERNAL_CAPTURE || null,
  SECRET_SHOULD_NOT_PASS: process.env.SECRET_SHOULD_NOT_PASS || null,
  PATH_PRESENT: Boolean(process.env.PATH)
}) + "\\n", "utf8")
console.log("mock stdout")
console.error("mock stderr")
`,
        { mode: 0o755 },
      )

      const result = await runExternalToolCapture({
        toolID: "claude-tap",
        product: "pi-mono",
        taskID: "read-only-answer",
        outDir: join(dir, "run"),
        toolPath,
        toolArgs: ["--tap-client", "pi", "--", "-p", "Reply OK"],
        env: {
          OPENAI_API_KEY: "synthetic-provider-key",
          CODEX_API_KEY: "synthetic-codex-provider-key",
          CODEX_MANAGED_BY_NPM: "1",
          CODEX_MANAGED_PACKAGE_ROOT: "/tmp/internal-codex-package",
          CODEX_REMOTE_PAYLOAD: "internal-payload",
          CODEX_THREAD_ID: "internal-thread",
          HELIX_EXTERNAL_CAPTURE: "1",
          SECRET_SHOULD_NOT_PASS: "do-not-pass",
        },
        now: new Date("2026-06-14T00:00:00.000Z"),
        runID: "real-run",
      })
      const manifest = JSON.parse(readFileSync(result.manifestPath, "utf8")) as ExternalToolRunManifest

      expect(result.ok).toBe(true)
      expect(result.dryRun).toBe(false)
      expect(manifest).toMatchObject({
        runID: "real-run",
        toolID: "claude-tap",
        product: "pi-mono",
        taskID: "read-only-answer",
        toolVersion: "0.1.114",
        captureMode: "real-capture",
        exitCode: 0,
        invocation: {
          strategy: "explicitPath",
          command: toolPath,
          resolvedCommand: toolPath,
        },
      })
      expect(manifest.invocation.args).toEqual([
        "--tap-output-dir",
        result.rawDir,
        "--tap-no-open",
        "--tap-no-live",
        "--tap-no-update-check",
        "--tap-store-stream-events",
        "--tap-client",
        "pi",
        "--",
        "-p",
        "Reply OK",
      ])
      expect(manifest.invocation.envAllowlist).toEqual(expect.arrayContaining(["CODEX_API_KEY", "OPENAI_API_KEY", "PATH"]))
      expect(manifest.invocation.envAllowlist).not.toEqual(expect.arrayContaining([
        "CODEX_MANAGED_BY_NPM",
        "CODEX_MANAGED_PACKAGE_ROOT",
        "CODEX_REMOTE_PAYLOAD",
        "CODEX_THREAD_ID",
        "HELIX_EXTERNAL_CAPTURE",
        "SECRET_SHOULD_NOT_PASS",
      ]))
      expect(manifest.artifacts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "raw/trace.jsonl", format: "jsonl", role: "raw-trace" }),
          expect.objectContaining({ path: "raw/env.json", format: "json", role: "other" }),
          expect.objectContaining({ path: "raw/trace.ctap.json", format: "compact", role: "raw-trace" }),
          expect.objectContaining({ path: "raw/viewer.html", format: "html", role: "viewer" }),
          expect.objectContaining({ path: "normalized/native-capture.json", format: "json", role: "other" }),
          expect.objectContaining({ path: "normalized/runtime-trace.jsonl", format: "jsonl", role: "other" }),
          expect.objectContaining({ path: "normalized/prompt-snapshot.md", format: "unknown", role: "other" }),
          expect.objectContaining({ path: "logs/stdout.log", format: "log", role: "log" }),
          expect.objectContaining({ path: "logs/stderr.log", format: "log", role: "log" }),
        ]),
      )
      expect(JSON.parse(readFileSync(join(result.normalizedDir, "native-capture.json"), "utf8"))).toMatchObject({
        artifactKind: "external-tool-native-capture",
        sourceToolVersion: "0.1.114",
        product: "pi-mono",
        taskID: "read-only-answer",
        captureMode: "real-capture",
      })
      const nativeCaptureText = readFileSync(join(result.normalizedDir, "native-capture.json"), "utf8")
      const runtimeTraceText = readFileSync(join(result.normalizedDir, "runtime-trace.jsonl"), "utf8")
      const promptSnapshotText = readFileSync(join(result.normalizedDir, "prompt-snapshot.md"), "utf8")
      for (const normalizedText of [nativeCaptureText, runtimeTraceText, promptSnapshotText]) {
        expect(normalizedText).not.toContain("Reply OK")
        expect(normalizedText).not.toContain("You are Pi")
        expect(normalizedText).not.toContain("***")
      }
      expect(promptSnapshotText).toContain("toolNames: bash")
      expect(promptSnapshotText).toContain("systemFingerprint: sha256:")
      expect(promptSnapshotText).toContain("userFingerprint: sha256:")
      const capture = JSON.parse(nativeCaptureText)
      const verification = verifyNativeCaptureArtifactWithRunManifest(capture, manifest, {
        artifactPath: join(result.normalizedDir, "native-capture.json"),
        runManifestPath: result.manifestPath,
      })
      const manifestVerification = verifyExternalToolRunManifest(manifest, {
        runManifestPath: result.manifestPath,
        requiredProduct: "pi-mono",
        requiredTaskID: "read-only-answer",
        requiredCaptureMode: "real-capture",
        requiredArtifactRoles: [
          { path: "raw/trace.jsonl", role: "raw-trace" },
          { path: "normalized/native-capture.json", role: "other" },
          { path: "logs/stdout.log", role: "log" },
          { path: "logs/stderr.log", role: "log" },
        ],
      })
      expect(verification).toMatchObject({ ok: true })
      expect(manifestVerification).toMatchObject({ ok: true })
      expect(verification.checks).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "run-manifest.source-artifact", ok: true }),
        expect.objectContaining({ id: "run-manifest.normalized-artifact", ok: true }),
        expect.objectContaining({ id: "run-manifest.env-gates", ok: true }),
      ]))
      expect(verifyExternalToolRunManifest({
        ...manifest,
        invocation: { ...manifest.invocation, envAllowlist: [...manifest.invocation.envAllowlist, "CODEX_REMOTE_PAYLOAD"] },
      }).issues).toEqual(expect.arrayContaining([expect.objectContaining({ id: "run-manifest.env-gates" })]))
      expect(verifyExternalToolRunManifest({
        ...manifest,
        product: "nanobot",
      }).issues).toEqual(expect.arrayContaining([expect.objectContaining({ id: "run-manifest.product-supported" })]))
      expect(verifyExternalToolRunManifest({
        ...manifest,
        artifacts: manifest.artifacts.map((artifact, index) => index === 0 ? { ...artifact, hash: "sha256:not-a-real-digest", bytes: -1, format: "zip", role: "raw" } : artifact),
      }, {
        runManifestPath: result.manifestPath,
      }).issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "run-manifest.artifact.0.format" }),
        expect.objectContaining({ id: "run-manifest.artifact.0.role" }),
        expect.objectContaining({ id: "run-manifest.artifact.0.hash-format" }),
        expect.objectContaining({ id: "run-manifest.artifact.0.bytes-format" }),
      ]))
      expect(verifyExternalToolRunManifest({
        ...manifest,
        artifacts: manifest.artifacts.map((artifact, index) => index === 0 ? { ...artifact, hash: "sha256:not-a-real-digest", bytes: -1, format: "zip", role: "raw" } : artifact),
      }).issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "run-manifest.artifact.0.format" }),
        expect.objectContaining({ id: "run-manifest.artifact.0.role" }),
        expect.objectContaining({ id: "run-manifest.artifact.0.hash-format" }),
        expect.objectContaining({ id: "run-manifest.artifact.0.bytes-format" }),
      ]))
      expect(verifyExternalToolRunManifest({
        ...manifest,
        artifacts: [manifest.artifacts[0], ...manifest.artifacts],
      }, {
        runManifestPath: result.manifestPath,
      }).issues).toEqual(expect.arrayContaining([expect.objectContaining({ id: "run-manifest.artifact-paths" })]))
      const tamperedManifest = { ...manifest, artifacts: manifest.artifacts.filter((artifact) => artifact.path !== "raw/trace.jsonl") }
      expect(verifyExternalToolRunManifest(tamperedManifest, {
        runManifestPath: result.manifestPath,
        requiredProduct: "pi-mono",
        requiredTaskID: "read-only-answer",
        requiredCaptureMode: "real-capture",
        requiredArtifactRoles: [{ path: "raw/trace.jsonl", role: "raw-trace" }],
      }).issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: "run-manifest.required-artifact.raw/trace.jsonl" })]),
      )
      expect(verifyNativeCaptureArtifactWithRunManifest(capture, tamperedManifest, { runManifestPath: result.manifestPath }).issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: "run-manifest.source-artifact" })]),
      )
      const sourceFormatDriftManifest = {
        ...manifest,
        artifacts: manifest.artifacts.map((artifact) => artifact.path === "raw/trace.jsonl" ? { ...artifact, format: "compact" } : artifact),
      }
      expect(verifyNativeCaptureArtifactWithRunManifest(capture, sourceFormatDriftManifest, { runManifestPath: result.manifestPath }).issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: "run-manifest.source-artifact" })]),
      )
      expect(JSON.parse(readFileSync(join(result.rawDir, "trace.ctap.json"), "utf8"))).toMatchObject({
        __claude_tap_compact_trace__: { version: 1, record_count: 1 },
        records: expect.any(Array),
      })
      expect(JSON.parse(readFileSync(join(result.rawDir, "env.json"), "utf8"))).toMatchObject({
        OPENAI_API_KEY: "synthetic-provider-key",
        CODEX_API_KEY: "synthetic-codex-provider-key",
        CODEX_MANAGED_BY_NPM: null,
        CODEX_MANAGED_PACKAGE_ROOT: null,
        CODEX_REMOTE_PAYLOAD: null,
        CODEX_THREAD_ID: null,
        HELIX_EXTERNAL_CAPTURE: null,
        SECRET_SHOULD_NOT_PASS: null,
        PATH_PRESENT: true,
      })
      expect(readFileSync(join(result.rawDir, "viewer.html"), "utf8")).toContain('data-claude-tap-local-viewer="true"')
      expect(readFileSync(join(result.normalizedDir, "runtime-trace.jsonl"), "utf8")).toContain("external-tool-runtime-trace-event")
      expect(readFileSync(join(result.normalizedDir, "prompt-snapshot.md"), "utf8")).toContain("Raw prompt text is not stored here")
      expect(readFileSync(result.stdoutPath, "utf8")).toContain("mock stdout")
      expect(readFileSync(result.stderrPath, "utf8")).toContain("mock stderr")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("keeps failed real captures as diagnostics instead of verified evidence", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-external-capture-failed-"))
    try {
      const toolPath = join(dir, "failing-claude-tap")
      writeFileSync(
        toolPath,
        `#!/usr/bin/env node
const { mkdirSync, writeFileSync } = require("node:fs")
const { resolve } = require("node:path")
const args = process.argv.slice(2)
if (args.includes("--version")) {
  console.log("claude-tap 0.1.114")
  process.exit(0)
}
const outIndex = args.indexOf("--tap-output-dir")
if (outIndex < 0 || !args[outIndex + 1]) process.exit(2)
const rawDir = resolve(args[outIndex + 1])
mkdirSync(rawDir, { recursive: true })
writeFileSync(resolve(rawDir, "trace.jsonl"), JSON.stringify({ request_id: "failed-1", turn: 1, request: { method: "POST", path: "/v1/responses", body: { model: "gpt-test" } }, response: { status: 500, body: { error: "synthetic failure" } } }) + "\\n", "utf8")
console.error("synthetic capture failure")
process.exit(42)
`,
        { mode: 0o755 },
      )

      const result = await runExternalToolCapture({
        toolID: "claude-tap",
        product: "pi-mono",
        taskID: "read-only-answer",
        outDir: join(dir, "run"),
        toolPath,
        toolArgs: ["--tap-client", "pi", "--", "-p", "Reply OK"],
        env: { HELIX_EXTERNAL_CAPTURE: "1" },
        now: new Date("2026-06-14T00:00:00.000Z"),
        runID: "failed-real-run",
      })
      const manifest = JSON.parse(readFileSync(result.manifestPath, "utf8")) as ExternalToolRunManifest

      expect(result.ok).toBe(false)
      expect(manifest).toMatchObject({
        runID: "failed-real-run",
        toolVersion: "0.1.114",
        captureMode: "real-capture",
        exitCode: 42,
      })
      expect(manifest.artifacts).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: "raw/trace.jsonl", role: "raw-trace" }),
        expect.objectContaining({ path: "logs/stdout.log", role: "log" }),
        expect.objectContaining({ path: "logs/stderr.log", role: "log" }),
      ]))
      expect(existsSync(join(result.normalizedDir, "native-capture.json"))).toBe(false)
      expect(readFileSync(result.stderrPath, "utf8")).toContain("synthetic capture failure")
      expect(verifyExternalToolRunManifest(manifest, {
        runManifestPath: result.manifestPath,
        requiredProduct: "pi-mono",
        requiredTaskID: "read-only-answer",
        requiredCaptureMode: "real-capture",
        requiredArtifactRoles: [{ path: "normalized/native-capture.json", role: "other" }],
      }).issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "run-manifest.exit-code" }),
        expect.objectContaining({ id: "run-manifest.required-artifact.normalized/native-capture.json" }),
      ]))
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("runs claude-tap through a mock uvx launcher and records the strategy", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-external-capture-"))
    try {
      const uvxPath = join(dir, "uvx")
      writeFileSync(
        uvxPath,
        `#!/usr/bin/env node
const { mkdirSync, writeFileSync } = require("node:fs")
const { resolve } = require("node:path")
const args = process.argv.slice(2)
if (args[0] !== "claude-tap") process.exit(3)
const toolArgs = args.slice(1)
if (toolArgs.includes("--version")) {
  console.log("claude-tap 0.1.114")
  process.exit(0)
}
const outIndex = toolArgs.indexOf("--tap-output-dir")
if (outIndex < 0 || !toolArgs[outIndex + 1]) process.exit(2)
const rawDir = resolve(toolArgs[outIndex + 1])
mkdirSync(rawDir, { recursive: true })
writeFileSync(resolve(rawDir, "trace.jsonl"), JSON.stringify({ request_id: "uvx-mock-1", turn: 1, request: { method: "POST", path: "/v1/responses", body: { model: "gpt-test" } }, response: { status: 200, body: { status: "completed" } } }) + "\\n", "utf8")
console.log("mock uvx stdout")
`,
        { mode: 0o755 },
      )

      const result = await runExternalToolCapture({
        toolID: "claude-tap",
        product: "pi-mono",
        taskID: "read-only-answer",
        outDir: join(dir, "run"),
        strategy: "uvx",
        toolArgs: ["--tap-client", "pi", "--", "-p", "Reply OK"],
        env: { PATH: `${dir}:${process.env.PATH ?? ""}` },
        now: new Date("2026-06-14T00:00:00.000Z"),
        runID: "uvx-run",
      })
      const manifest = JSON.parse(readFileSync(result.manifestPath, "utf8")) as ExternalToolRunManifest

      expect(result.ok).toBe(true)
      expect(manifest).toMatchObject({
        runID: "uvx-run",
        toolVersion: "0.1.114",
        invocation: {
          strategy: "uvx",
          command: "uvx",
          resolvedCommand: uvxPath,
        },
      })
      expect(manifest.invocation.args).toEqual([
        "claude-tap",
        "--tap-output-dir",
        result.rawDir,
        "--tap-no-open",
        "--tap-no-live",
        "--tap-no-update-check",
        "--tap-store-stream-events",
        "--tap-client",
        "pi",
        "--",
        "-p",
        "Reply OK",
      ])
      expect(manifest.artifacts).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: "raw/trace.jsonl", role: "raw-trace" }),
        expect.objectContaining({ path: "raw/trace.ctap.json", role: "raw-trace" }),
        expect.objectContaining({ path: "raw/viewer.html", role: "viewer" }),
        expect.objectContaining({ path: "normalized/native-capture.json", role: "other" }),
      ]))
      expect(readFileSync(result.stdoutPath, "utf8")).toContain("mock uvx stdout")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
