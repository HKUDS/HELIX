import { createHash } from "node:crypto"
import { execFile } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { createServer, type IncomingMessage } from "node:http"
import { tmpdir } from "node:os"
import { delimiter, join, resolve } from "node:path"
import { Readable, Writable } from "node:stream"
import { promisify } from "node:util"
import { describe, expect, it } from "vitest"
import { loadDotEnv, parseArgs, runCli } from "@helix/cli"
import {
  codingAgentMinimalRecipe,
  createProductTaskNativeCadenceFixtureSet,
  createProductTaskNativeCadenceFixtureSplitSet,
  hermesAgentRecipe,
  nanobotRecipe,
  opencodeRecipe,
  piMonoRecipe,
  runHarnessTui,
  runProductTaskParitySuite,
  writeProductTaskNativeCadenceFixtureSplitSet,
} from "@helix/recipes"

const execFileAsync = promisify(execFile)

describe("Helix CLI conformance", () => {
  it("loads .env values for script entrypoints without overriding process env", () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-cli-env-"))
    try {
      writeFileSync(
        join(dir, ".env"),
        [
          "# live acceptance values",
          "HELIX_LIVE_PROVIDER=anthropic",
          "HELIX_LIVE_MODEL='claude-test'",
          "HELIX_LIVE_BASE_URL=https://api.anthropic.test/v1 # inline comment",
          "EXISTING_VALUE=from-file",
          "export ANTHROPIC_API_KEY=\"secret-value\"",
        ].join("\n"),
        "utf8",
      )
      const env: NodeJS.ProcessEnv = { EXISTING_VALUE: "from-process" }
      const result = loadDotEnv({ cwd: dir, env })

      expect(result?.loaded).toEqual(
        expect.arrayContaining(["HELIX_LIVE_PROVIDER", "HELIX_LIVE_MODEL", "HELIX_LIVE_BASE_URL", "ANTHROPIC_API_KEY"]),
      )
      expect(result?.skipped).toEqual(["EXISTING_VALUE"])
      expect(env.HELIX_LIVE_PROVIDER).toBe("anthropic")
      expect(env.HELIX_LIVE_MODEL).toBe("claude-test")
      expect(env.HELIX_LIVE_BASE_URL).toBe("https://api.anthropic.test/v1")
      expect(env.ANTHROPIC_API_KEY).toBe("secret-value")
      expect(env.EXISTING_VALUE).toBe("from-process")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("keeps external capture consent shell-only when loading .env", () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-cli-env-"))
    try {
      writeFileSync(
        join(dir, ".env"),
        [
          "HELIX_EXTERNAL_CAPTURE=1",
          "HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS=1",
          "OPENAI_API_KEY=dotenv-secret-that-must-not-leak",
        ].join("\n"),
        "utf8",
      )
      const env: NodeJS.ProcessEnv = {}
      const result = loadDotEnv({ cwd: dir, env })

      expect(result?.loaded).toEqual(["OPENAI_API_KEY"])
      expect(result?.skipped).toEqual(["HELIX_EXTERNAL_CAPTURE", "HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS"])
      expect(env.HELIX_EXTERNAL_CAPTURE).toBeUndefined()
      expect(env.HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS).toBeUndefined()
      expect(env.OPENAI_API_KEY).toBe("dotenv-secret-that-must-not-leak")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("parses real provider selection for recipe runs", () => {
    expect(
      parseArgs([
        "run",
        "pi-mono",
        "--provider",
        "google",
        "--model",
        "gemini-test",
        "--api-key",
        "secret",
        "--base-url",
        "https://google.example/v1beta",
        "--prompt",
        "hello",
        "--json",
      ]),
    ).toMatchObject({
      command: "run",
      product: "pi-mono",
      provider: {
        kind: "google",
        modelID: "gemini-test",
        apiKey: "secret",
        baseURL: "https://google.example/v1beta",
      },
      prompt: "hello",
      json: true,
    })
  })

  it("requires real providers for recipe runs and rejects fake-only options", () => {
    expect(() => parseArgs(["run", "opencode", "--prompt", "hello", "--native-json-events"])).toThrow("run requires --provider")
    expect(() => parseArgs(["run", "opencode", "--fake-provider", "--prompt", "hello"])).toThrow("--fake-provider is no longer supported")
    expect(() => parseArgs(["run", "opencode", "--provider", "fake", "--prompt", "hello"])).toThrow("--provider fake is no longer supported")
    expect(() => parseArgs(["run", "opencode", "--provider", "openai-compatible", "--model", "gpt-test", "--assistant", "ok"])).toThrow("--assistant is only available")
    expect(() => parseArgs(["run", "opencode", "--provider", "openai-compatible", "--model", "gpt-test", "--tool", "skill:prompt=hi"])).toThrow("--tool is only available")
    expect(parseArgs(["run", "opencode", "--provider", "openai-compatible", "--model", "gpt-test", "--prompt", "hello", "--native-json-events"])).toMatchObject({
      command: "run",
      product: "opencode",
      provider: { kind: "openai-compatible", modelID: "gpt-test" },
      prompt: "hello",
      nativeJsonEvents: true,
    })
  })

  it("parses external tool gateway commands", () => {
    expect(parseArgs(["external-tools", "list", "--json"])).toMatchObject({
      command: "external-tools-list",
      json: true,
    })
    expect(parseArgs(["external-tools", "doctor", "claude-tap", "--tool-path", "/tmp/claude-tap", "--require-tool", "--json"])).toMatchObject({
      command: "external-tools-doctor",
      toolID: "claude-tap",
      toolPath: resolve("/tmp/claude-tap"),
      requireTool: true,
      json: true,
    })
    expect(parseArgs(["external-tools", "doctor", "claude-tap", "--strategy", "uvx", "--json"])).toMatchObject({
      command: "external-tools-doctor",
      toolID: "claude-tap",
      strategy: "uvx",
      json: true,
    })
    expect(
      parseArgs([
        "external-tools",
        "capture",
        "claude-tap",
        "--dry-run",
        "--product",
        "pi-mono",
        "--task",
        "read-only-answer",
        "--out-dir",
        ".helix/external-tools/runs/pi-read-only",
        "--json",
        "--",
        "--tap-client",
        "pi",
        "--",
        "-p",
        "Reply OK",
      ]),
    ).toMatchObject({
      command: "external-tools-capture",
      toolID: "claude-tap",
      dryRun: true,
      captureMode: "real-capture",
      requireTool: false,
      product: "pi-mono",
      taskID: "read-only-answer",
      outDir: resolve(process.cwd(), ".helix/external-tools/runs/pi-read-only"),
      toolArgs: ["--tap-client", "pi", "--", "-p", "Reply OK"],
      json: true,
    })
    expect(
      parseArgs([
        "external-tools",
        "capture",
        "claude-tap",
        "--dry-run",
        "--strategy",
        "uvx",
        "--product",
        "pi-mono",
        "--",
        "--tap-client",
        "pi",
      ]),
    ).toMatchObject({
      command: "external-tools-capture",
      toolID: "claude-tap",
      dryRun: true,
      strategy: "uvx",
      product: "pi-mono",
      toolArgs: ["--tap-client", "pi"],
    })
    expect(
      parseArgs([
        "external-tools",
        "capture",
        "claude-tap",
        "--capture-only",
        "--require-tool",
        "--product",
        "pi-mono",
        "--",
        "--tap-client",
        "pi",
      ]),
    ).toMatchObject({
      command: "external-tools-capture",
      toolID: "claude-tap",
      dryRun: false,
      captureMode: "capture-only",
      requireTool: true,
      product: "pi-mono",
      toolArgs: ["--tap-client", "pi"],
    })
    expect(
      parseArgs([
        "external-tools",
        "to-native-cadence",
        "--artifact",
        "native-capture.json",
        "--out",
        "native-cadence.json",
        "--json",
      ]),
    ).toMatchObject({
      command: "external-tools-to-native-cadence",
      artifactPath: resolve(process.cwd(), "native-capture.json"),
      out: resolve(process.cwd(), "native-cadence.json"),
      json: true,
    })
    expect(
      parseArgs([
        "external-tools",
        "verify",
        "--artifact",
        "native-capture.json",
        "--run-manifest",
        "run-manifest.json",
        "--json",
      ]),
    ).toMatchObject({
      command: "external-tools-verify",
      artifactPath: resolve(process.cwd(), "native-capture.json"),
      runManifestPath: resolve(process.cwd(), "run-manifest.json"),
      json: true,
    })
    expect(
      parseArgs([
        "external-tools",
        "verify-run-manifest",
        "--manifest",
        "run-manifest.json",
        "--product",
        "pi-mono",
        "--task",
        "read-only-answer",
        "--capture-mode",
        "dry-run",
        "--strategy",
        "uvx",
        "--expect-command",
        "uvx",
        "--expect-args-json",
        JSON.stringify(["claude-tap", "--tap-client", "pi", "--", "-p", "Reply OK"]),
        "--allow-unknown-tool-version",
        "--allow-empty-artifacts",
        "--require-artifact",
        "raw/trace.jsonl:raw-trace",
        "--json",
      ]),
    ).toMatchObject({
      command: "external-tools-verify-run-manifest",
      manifestPath: resolve(process.cwd(), "run-manifest.json"),
      product: "pi-mono",
      taskID: "read-only-answer",
      captureMode: "dry-run",
      expectedInvocationStrategy: "uvx",
      expectedInvocationCommand: "uvx",
      expectedInvocationArgs: ["claude-tap", "--tap-client", "pi", "--", "-p", "Reply OK"],
      allowUnknownToolVersion: true,
      allowEmptyArtifacts: true,
      requiredArtifactRoles: [{ path: "raw/trace.jsonl", role: "raw-trace" }],
      json: true,
    })
    expect(
      parseArgs([
        "external-tools",
        "import",
        "claude-tap",
        "--artifact",
        "external-tools/claude-tap/fixtures/minimal-jsonl.trace.jsonl",
        "--product",
        "pi-mono",
        "--task",
        "read-only-answer",
        "--out",
        "native-capture.json",
        "--json",
      ]),
    ).toMatchObject({
      command: "external-tools-import",
      toolID: "claude-tap",
      artifactPath: resolve(process.cwd(), "external-tools/claude-tap/fixtures/minimal-jsonl.trace.jsonl"),
      product: "pi-mono",
      taskID: "read-only-answer",
      out: resolve(process.cwd(), "native-capture.json"),
      json: true,
    })
    expect(() => parseArgs(["external-tools", "capture", "claude-tap", "--strategy", "explicitPath"])).toThrow("--strategy explicitPath requires --tool-path")
    expect(() => parseArgs(["external-tools", "doctor", "claude-tap", "--tool-path", "/tmp/claude-tap", "--strategy", "uvx"])).toThrow("--tool-path can only be combined")
  })

  it("keeps real claude-tap capture scripts manual and credential gated", () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as { scripts?: Record<string, string> }
    const scripts = pkg.scripts ?? {}
    const gitignore = readFileSync(resolve(process.cwd(), ".gitignore"), "utf8")
    expect(gitignore.split(/\r?\n/)).toContain(".helix/")
    expect(scripts["external:claude-tap:preflight"]).toBe("node external-tools/claude-tap/preflight.mjs --json")
    expect(scripts["external:claude-tap:preflight:human"]).toBe("node external-tools/claude-tap/preflight.mjs")
    expect(scripts["external:claude-tap:preflight:strict"]).toBe("node external-tools/claude-tap/preflight.mjs --json --strict --strategy binary")
    expect(scripts["external:claude-tap:preflight:uvx:strict"]).toBe("node external-tools/claude-tap/preflight.mjs --json --strict --strategy uvx")
    expect(scripts["external:claude-tap:preflight:captures"]).toBe("node external-tools/claude-tap/preflight.mjs --json --require-captures --strict")
    expect(scripts["external:claude-tap:preflight:captures:binary"]).toBe("node external-tools/claude-tap/preflight.mjs --json --require-captures --strict --strategy binary")
    expect(scripts["external:claude-tap:preflight:captures:uvx"]).toBe("node external-tools/claude-tap/preflight.mjs --json --require-captures --strict --strategy uvx")
    expect(scripts["external:claude-tap:preflight:compare"]).toBe("node external-tools/claude-tap/preflight.mjs --json --require-compare --strict")
    expect(scripts["external:claude-tap:preflight:compare:binary"]).toBe("node external-tools/claude-tap/preflight.mjs --json --require-compare --strict --strategy binary")
    expect(scripts["external:claude-tap:preflight:compare:uvx"]).toBe("node external-tools/claude-tap/preflight.mjs --json --require-compare --strict --strategy uvx")
    expect(scripts["external:claude-tap:doctor:required"]).toContain("external-tools doctor claude-tap --require-tool --json")
    expect(scripts["external:claude-tap:doctor:uvx:required"]).toContain("external-tools doctor claude-tap --strategy uvx --require-tool --json")

    const dryRunCases = [
      { script: "external:claude-tap:dry-run:read-only", strategy: "binary", root: ".helix/external-tools/dry-runs/binary" },
      { script: "external:claude-tap:dry-run:uvx:read-only", strategy: "uvx", root: ".helix/external-tools/dry-runs/uvx" },
    ]
    const dryRunProducts = [
      { product: "opencode", slug: "opencode-read-only", client: "--tap-client opencode -- run \"Reply OK\"" },
      { product: "pi-mono", slug: "pi-read-only", client: "--tap-client pi -- -p \"Reply OK\"" },
      { product: "hermes-agent", slug: "hermes-read-only", client: "--tap-client hermes -- chat \"Reply OK\"" },
    ]
    for (const testCase of dryRunCases) {
      const command = scripts[testCase.script] ?? ""
      expect(command, testCase.script).not.toContain("require-real-capture.mjs")
      expect(command, testCase.script).not.toContain("--require-tool")
      expect(command, testCase.script).not.toContain("docs/reports")
      for (const product of dryRunProducts) {
        expect(command, testCase.script).toContain("external-tools capture claude-tap")
        expect(command, testCase.script).toContain("--dry-run")
        expect(command, testCase.script).toContain(`--product ${product.product}`)
        expect(command, testCase.script).toContain("--task read-only-answer")
        expect(command, testCase.script).toContain(`--out-dir ${testCase.root}/${product.slug}`)
        expect(command, testCase.script).toContain(product.client)
      }
      if (testCase.strategy === "uvx") expect(command, testCase.script).toContain("--strategy uvx")
      else expect(command, testCase.script).not.toContain("--strategy uvx")
    }
    expect(scripts["external:claude-tap:dry-run:verify:read-only"]).toBe("node external-tools/claude-tap/verify-dry-run-rehearsal.mjs --json")
    expect(scripts["external:claude-tap:dry-run:acceptance:read-only"]).toBe(
      "npm run external:claude-tap:dry-run:read-only && npm run external:claude-tap:dry-run:uvx:read-only && npm run external:claude-tap:dry-run:verify:read-only",
    )

    const cases = [
      {
        script: "external:claude-tap:capture:opencode:read-only",
        product: "opencode",
        runDir: ".helix/external-tools/runs/opencode-read-only",
        client: "--tap-client opencode",
        strategy: "binary",
      },
      {
        script: "external:claude-tap:capture:uvx:opencode:read-only",
        product: "opencode",
        runDir: ".helix/external-tools/runs/opencode-read-only",
        client: "--tap-client opencode",
        strategy: "uvx",
      },
      {
        script: "external:claude-tap:capture:pi:read-only",
        product: "pi-mono",
        runDir: ".helix/external-tools/runs/pi-read-only",
        client: "--tap-client pi",
        strategy: "binary",
      },
      {
        script: "external:claude-tap:capture:uvx:pi:read-only",
        product: "pi-mono",
        runDir: ".helix/external-tools/runs/pi-read-only",
        client: "--tap-client pi",
        strategy: "uvx",
      },
      {
        script: "external:claude-tap:capture:hermes:read-only",
        product: "hermes-agent",
        runDir: ".helix/external-tools/runs/hermes-read-only",
        client: "--tap-client hermes",
        strategy: "binary",
      },
      {
        script: "external:claude-tap:capture:uvx:hermes:read-only",
        product: "hermes-agent",
        runDir: ".helix/external-tools/runs/hermes-read-only",
        client: "--tap-client hermes",
        strategy: "uvx",
      },
    ]

    for (const testCase of cases) {
      const command = scripts[testCase.script] ?? ""
      expect(command, testCase.script).toContain("node external-tools/claude-tap/require-real-capture.mjs &&")
      expect(command, testCase.script).toContain("external-tools capture claude-tap")
      expect(command, testCase.script).toContain("--require-tool")
      expect(command, testCase.script).toContain(`--product ${testCase.product}`)
      expect(command, testCase.script).toContain("--task read-only-answer")
      expect(command, testCase.script).toContain(`--out-dir ${testCase.runDir}`)
      expect(command, testCase.script).toContain("--json")
      expect(command, testCase.script).toContain(testCase.client)
      if (testCase.strategy === "uvx") expect(command, testCase.script).toContain("--strategy uvx")
      else expect(command, testCase.script).not.toContain("--strategy uvx")
      expect(command, testCase.script).not.toContain("--dry-run")
      expect(command, testCase.script).not.toContain("docs/reports")
    }
    expect(scripts["external:claude-tap:capture:uvx:read-only"]).toBe(
      "npm run external:claude-tap:capture:uvx:opencode:read-only && npm run external:claude-tap:capture:uvx:pi:read-only && npm run external:claude-tap:capture:uvx:hermes:read-only",
    )

    const verifyCases = [
      {
        script: "external:claude-tap:verify:opencode:read-only",
        product: "opencode",
        runDir: ".helix/external-tools/runs/opencode-read-only",
      },
      {
        script: "external:claude-tap:verify:pi:read-only",
        product: "pi-mono",
        runDir: ".helix/external-tools/runs/pi-read-only",
      },
      {
        script: "external:claude-tap:verify:hermes:read-only",
        product: "hermes-agent",
        runDir: ".helix/external-tools/runs/hermes-read-only",
      },
    ]

    for (const testCase of verifyCases) {
      const command = scripts[testCase.script] ?? ""
      const nativeCapture = `${testCase.runDir}/normalized/native-capture.json`
      const runManifest = `${testCase.runDir}/run-manifest.json`
      const flowCompare = `${testCase.runDir}/flow-compare.json`
      expect(command, testCase.script).toContain(`node external-tools/claude-tap/require-normalized-capture.mjs ${nativeCapture} &&`)
      expect(command, testCase.script).toContain(`external-tools verify-run-manifest --manifest ${runManifest} --product ${testCase.product} --task read-only-answer --capture-mode real-capture`)
      expect(command, testCase.script).toContain("--require-artifact raw/trace.jsonl:raw-trace")
      expect(command, testCase.script).toContain("--require-artifact normalized/native-capture.json:other")
      expect(command, testCase.script).toContain("--require-artifact logs/stdout.log:log")
      expect(command, testCase.script).toContain("--require-artifact logs/stderr.log:log")
      expect(command, testCase.script).toContain(`external-tools verify --artifact ${nativeCapture} --run-manifest ${runManifest} --json`)
      expect(command, testCase.script).toContain(`flow-graph --product ${testCase.product} --mode compare --task read-only-answer --artifact ${nativeCapture} --out ${flowCompare} --json`)
      expect(command, testCase.script).toContain(`verify-flow-graph --artifact ${flowCompare} --json`)
      expect(command, testCase.script).not.toContain("docs/reports")
    }
    expect(scripts["external:claude-tap:verify:read-only"]).toBe(
      "npm run external:claude-tap:verify:opencode:read-only && npm run external:claude-tap:verify:pi:read-only && npm run external:claude-tap:verify:hermes:read-only",
    )
    expect(scripts["external:claude-tap:acceptance:read-only"]).toBe(
      "npm run external:claude-tap:dry-run:acceptance:read-only && npm run external:claude-tap:preflight:strict && npm run external:claude-tap:doctor:required && npm run external:claude-tap:capture:opencode:read-only && npm run external:claude-tap:capture:pi:read-only && npm run external:claude-tap:capture:hermes:read-only && npm run external:claude-tap:preflight:captures:binary && npm run external:claude-tap:verify:read-only && npm run external:claude-tap:preflight:compare:binary",
    )
    expect(scripts["external:claude-tap:acceptance:uvx:read-only"]).toBe(
      "npm run external:claude-tap:dry-run:acceptance:read-only && npm run external:claude-tap:preflight:uvx:strict && npm run external:claude-tap:doctor:uvx:required && npm run external:claude-tap:capture:uvx:read-only && npm run external:claude-tap:preflight:captures:uvx && npm run external:claude-tap:verify:read-only && npm run external:claude-tap:preflight:compare:uvx",
    )

    const gate = readFileSync(resolve(process.cwd(), "external-tools/claude-tap/require-real-capture.mjs"), "utf8")
    expect(gate).toContain("HELIX_EXTERNAL_CAPTURE")
    expect(gate).toContain("HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS")
    expect(gate).toContain("credential-env.mjs")
    const credentialEnv = readFileSync(resolve(process.cwd(), "external-tools/claude-tap/credential-env.mjs"), "utf8")
    expect(credentialEnv).toContain("OPENAI_API_KEY")
    expect(credentialEnv).toContain("AZURE_OPENAI_API_KEY")
    const captureGate = readFileSync(resolve(process.cwd(), "external-tools/claude-tap/require-normalized-capture.mjs"), "utf8")
    expect(captureGate).toContain("Missing normalized claude-tap capture artifact")
    expect(captureGate).toContain("native-capture.json")
  })

  it("keeps external-tools doctor optional unless --require-tool is set", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-claude-tap-doctor-"))
    const stdout: string[] = []
    const stderr: string[] = []
    const io = {
      stdout: {
        write(chunk: string) {
          stdout.push(chunk)
          return true
        },
      },
      stderr: {
        write(chunk: string) {
          stderr.push(chunk)
          return true
        },
      },
    }
    const missingToolPath = join(dir, "missing-claude-tap")
    try {
      expect(await runCli(["external-tools", "doctor", "claude-tap", "--tool-path", missingToolPath, "--json"], io)).toBe(0)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        tools: [expect.objectContaining({ toolID: "claude-tap", installed: false, command: missingToolPath })],
      })
      expect(stderr.join("")).toBe("")

      stdout.length = 0
      stderr.length = 0
      expect(await runCli(["external-tools", "doctor", "claude-tap", "--tool-path", missingToolPath, "--require-tool", "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        tools: [expect.objectContaining({ toolID: "claude-tap", installed: false, command: missingToolPath })],
      })
      expect(stderr.join("")).toBe("")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("requires normalized claude-tap captures before verify scripts run", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-claude-tap-normalized-gate-"))
    const gate = resolve(process.cwd(), "external-tools/claude-tap/require-normalized-capture.mjs")
    try {
      await expect(
        execFileAsync(process.execPath, [gate], {
          cwd: dir,
          env: { PATH: process.env.PATH ?? "" },
        }),
      ).rejects.toMatchObject({
        code: 2,
        stderr: expect.stringContaining("Expected at least one normalized claude-tap native-capture.json path."),
      })

      const missingPath = join(dir, "missing", "native-capture.json")
      await expect(
        execFileAsync(process.execPath, [gate, missingPath], {
          cwd: dir,
          env: { PATH: process.env.PATH ?? "" },
        }),
      ).rejects.toMatchObject({
        code: 2,
        stderr: expect.stringContaining("Run the matching external:claude-tap:capture:*:read-only script before verify."),
      })

      const existingPath = join(dir, "normalized", "native-capture.json")
      mkdirSync(join(dir, "normalized"), { recursive: true })
      writeFileSync(existingPath, "{}\n", "utf8")
      const allowed = await execFileAsync(process.execPath, [gate, existingPath], {
        cwd: dir,
        env: { PATH: process.env.PATH ?? "" },
      })
      expect(`${allowed.stdout}${allowed.stderr}`).toBe("")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("allows claude-tap real-capture credentials from .env without accepting .env consent", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-claude-tap-gate-"))
    try {
      writeFileSync(join(dir, ".env"), "AZURE_OPENAI_API_KEY=dotenv-secret-that-must-not-leak\nHELIX_EXTERNAL_CAPTURE=1\n", "utf8")
      await expect(
        execFileAsync(process.execPath, [resolve(process.cwd(), "external-tools/claude-tap/require-real-capture.mjs")], {
          cwd: dir,
          env: { PATH: process.env.PATH ?? "" },
        }),
      ).rejects.toMatchObject({ code: 2 })

      const allowed = await execFileAsync(process.execPath, [resolve(process.cwd(), "external-tools/claude-tap/require-real-capture.mjs")], {
        cwd: dir,
        env: { PATH: process.env.PATH ?? "", HELIX_EXTERNAL_CAPTURE: "1" },
      })
      expect(`${allowed.stdout}${allowed.stderr}`).not.toContain("dotenv-secret-that-must-not-leak")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("keeps claude-tap no-credentials override shell-only", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-claude-tap-gate-"))
    try {
      writeFileSync(join(dir, ".env"), "HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS=1\n", "utf8")
      await expect(
        execFileAsync(process.execPath, [resolve(process.cwd(), "external-tools/claude-tap/require-real-capture.mjs")], {
          cwd: dir,
          env: { PATH: process.env.PATH ?? "", HELIX_EXTERNAL_CAPTURE: "1" },
        }),
      ).rejects.toMatchObject({ code: 2 })

      const allowed = await execFileAsync(process.execPath, [resolve(process.cwd(), "external-tools/claude-tap/require-real-capture.mjs")], {
        cwd: dir,
        env: {
          PATH: process.env.PATH ?? "",
          HELIX_EXTERNAL_CAPTURE: "1",
          HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS: "1",
        },
      })
      expect(`${allowed.stdout}${allowed.stderr}`).not.toContain("HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS=1")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("gates non-dry-run external tool capture in the CLI namespace", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-claude-tap-cli-gate-"))
    const stdout: string[] = []
    const stderr: string[] = []
    const io = {
      stdout: {
        write(chunk: string) {
          stdout.push(chunk)
          return true
        },
      },
      stderr: {
        write(chunk: string) {
          stderr.push(chunk)
          return true
        },
      },
    }
    const envNames = [
      "HELIX_EXTERNAL_CAPTURE",
      "HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS",
      "OPENAI_API_KEY",
      "ANTHROPIC_API_KEY",
      "GOOGLE_API_KEY",
      "GEMINI_API_KEY",
      "OPENROUTER_API_KEY",
      "AWS_ACCESS_KEY_ID",
      "AWS_PROFILE",
      "BEDROCK_API_KEY",
    ]
    const originalEnv = new Map(envNames.map((name) => [name, process.env[name]]))
    try {
      for (const name of envNames) delete process.env[name]
      expect(
        await runCli(
          [
            "external-tools",
            "capture",
            "claude-tap",
            "--product",
            "pi-mono",
            "--task",
            "read-only-answer",
            "--out-dir",
            dir,
            "--tool-path",
            join(dir, "unused-claude-tap"),
            "--json",
          ],
          io,
        ),
      ).toBe(2)
      expect(stderr.join("")).toContain("HELIX_EXTERNAL_CAPTURE=1")

      stderr.length = 0
      process.env.HELIX_EXTERNAL_CAPTURE = "1"
      expect(
        await runCli(
          [
            "external-tools",
            "capture",
            "claude-tap",
            "--product",
            "pi-mono",
            "--task",
            "read-only-answer",
            "--out-dir",
            dir,
            "--tool-path",
            join(dir, "unused-claude-tap"),
            "--json",
          ],
          io,
        ),
      ).toBe(2)
      expect(stderr.join("")).toContain("requires one provider credential environment variable")
    } finally {
      for (const name of envNames) {
        const original = originalEnv.get(name)
        if (original === undefined) delete process.env[name]
        else process.env[name] = original
      }
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("fails claude-tap capture-ready preflight strict without shell consent", async () => {
    await expect(
      execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--strict", "--skip-tool-check", "--no-dotenv"], {
        cwd: process.cwd(),
        env: {
          PATH: process.env.PATH ?? "",
          OPENAI_API_KEY: "secret-value-that-must-not-leak",
        },
      }),
    ).rejects.toMatchObject({
      code: 2,
      stdout: expect.stringContaining('"target": "capture-ready"'),
    })

    try {
      await execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--strict", "--skip-tool-check", "--no-dotenv"], {
        cwd: process.cwd(),
        env: {
          PATH: process.env.PATH ?? "",
          OPENAI_API_KEY: "secret-value-that-must-not-leak",
        },
      })
    } catch (error) {
      const output = `${(error as { stdout?: string; stderr?: string }).stdout ?? ""}${(error as { stderr?: string }).stderr ?? ""}`
      expect(output).not.toContain("secret-value-that-must-not-leak")
      expect(JSON.parse((error as { stdout?: string }).stdout ?? "{}")).toMatchObject({
        ok: false,
        requirements: { target: "capture-ready", ok: false, captureReady: false },
        missing: expect.arrayContaining([
          expect.objectContaining({ id: "capture-consent" }),
          expect.objectContaining({ id: "tool-strategy" }),
        ]),
        gates: {
          consent: { ok: false },
          credentials: { ok: true, envNamesPresent: ["OPENAI_API_KEY"] },
        },
      })
      return
    }
    throw new Error("Expected claude-tap preflight strict to fail without shell consent.")
  })

  it("keeps claude-tap capture-ready preflight strategy-specific", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-claude-tap-preflight-strategy-"))
    try {
      const uvxPath = join(dir, "uvx")
      writeFileSync(
        uvxPath,
        `#!${process.execPath}
const args = process.argv.slice(2)
if (args[0] === "claude-tap" && args[1] === "--version") {
  console.log("claude-tap 0.1.114")
  process.exit(0)
}
process.exit(2)
`,
        { mode: 0o755 },
      )
      const explicitToolDir = join(dir, "tool path")
      mkdirSync(explicitToolDir)
      const explicitToolPath = join(explicitToolDir, "mock-claude-tap")
      const quotedExplicitToolPath = `'${explicitToolPath}'`
      writeFileSync(
        explicitToolPath,
        `#!${process.execPath}
const args = process.argv.slice(2)
if (args[0] === "--version") {
  console.log("claude-tap 0.1.115")
  process.exit(0)
}
process.exit(2)
`,
        { mode: 0o755 },
      )
      const env = {
        PATH: dir,
        HELIX_EXTERNAL_CAPTURE: "1",
        OPENAI_API_KEY: "secret-value-that-must-not-leak",
      }

      const uvxReady = await execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--strict", "--strategy", "uvx", "--no-dotenv"], {
        cwd: process.cwd(),
        env,
      })
      expect(uvxReady.stdout).not.toContain("secret-value-that-must-not-leak")
      expect(JSON.parse(uvxReady.stdout)).toMatchObject({
        ok: true,
        readyToCapture: true,
        recommendedStrategy: "uvx",
        requirements: { target: "capture-ready", strategy: "uvx", product: "all", ok: true, captureReady: true },
        toolStrategies: [expect.objectContaining({ strategy: "uvx", ok: true })],
        nextCommands: expect.arrayContaining([
          "npm run external:claude-tap:preflight:captures:uvx",
          "npm run external:claude-tap:preflight:compare:uvx",
        ]),
      })

      const uvxPiReady = await execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--strict", "--strategy", "uvx", "--product", "pi-mono", "--no-dotenv"], {
        cwd: process.cwd(),
        env,
      })
      expect(uvxPiReady.stdout).not.toContain("secret-value-that-must-not-leak")
      const uvxPiReport = JSON.parse(uvxPiReady.stdout)
      expect(uvxPiReport).toMatchObject({
        ok: true,
        readyToCapture: true,
        recommendedStrategy: "uvx",
        products: ["pi-mono"],
        requirements: { target: "capture-ready", strategy: "uvx", product: "pi-mono", products: ["pi-mono"], ok: true, captureReady: true },
        toolStrategies: [expect.objectContaining({ strategy: "uvx", ok: true })],
      })
      expect(uvxPiReport.artifacts.map((item: { product?: string }) => item.product)).toEqual(["pi-mono"])
      expect(uvxPiReport.nextCommands).toEqual([
        "npm run external:claude-tap:dry-run:acceptance:read-only",
        "npm run external:claude-tap:doctor:uvx:required",
        "HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:uvx:pi:read-only",
        "npm run external:claude-tap:preflight:captures -- --strategy uvx --product pi-mono",
        "npm run external:claude-tap:verify:pi:read-only",
        "npm run external:claude-tap:preflight:compare -- --strategy uvx --product pi-mono",
      ])

      const uvxPiAliasReady = await execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--strict", "--strategy", "uvx", "--product", "pi", "--no-dotenv"], {
        cwd: process.cwd(),
        env,
      })
      expect(JSON.parse(uvxPiAliasReady.stdout)).toMatchObject({
        products: ["pi-mono"],
        requirements: { product: "pi-mono", productInput: "pi", products: ["pi-mono"] },
        nextCommands: expect.arrayContaining([
          "HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:uvx:pi:read-only",
          "npm run external:claude-tap:preflight:captures -- --strategy uvx --product pi-mono",
        ]),
      })

      const uvxHermesAliasReady = await execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--strict", "--strategy", "uvx", "--product", "hermes", "--no-dotenv"], {
        cwd: process.cwd(),
        env,
      })
      expect(JSON.parse(uvxHermesAliasReady.stdout)).toMatchObject({
        products: ["hermes-agent"],
        requirements: { product: "hermes-agent", productInput: "hermes", products: ["hermes-agent"] },
        nextCommands: expect.arrayContaining([
          "HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:uvx:hermes:read-only",
          "npm run external:claude-tap:preflight:compare -- --strategy uvx --product hermes-agent",
        ]),
      })

      const explicitPathPiReady = await execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--strict", "--strategy", "explicitPath", "--tool-path", explicitToolPath, "--product", "pi", "--no-dotenv"], {
        cwd: process.cwd(),
        env,
      })
      expect(explicitPathPiReady.stdout).not.toContain("secret-value-that-must-not-leak")
      const explicitPathPiReport = JSON.parse(explicitPathPiReady.stdout)
      expect(explicitPathPiReport).toMatchObject({
        ok: true,
        readyToCapture: true,
        recommendedStrategy: "explicitPath",
        products: ["pi-mono"],
        requirements: { target: "capture-ready", strategy: "explicitPath", toolPath: explicitToolPath, product: "pi-mono", productInput: "pi", products: ["pi-mono"], ok: true, captureReady: true },
        toolStrategies: [expect.objectContaining({ strategy: "explicitPath", command: explicitToolPath, toolPath: explicitToolPath, ok: true, version: "0.1.115" })],
      })
      expect(explicitPathPiReport.nextCommands).toEqual([
        `npm run helix -- external-tools capture claude-tap --strategy explicitPath --tool-path ${quotedExplicitToolPath} --dry-run --product pi-mono --task read-only-answer --out-dir .helix/external-tools/dry-runs/explicitPath/pi-read-only --json -- --tap-client pi -- -p "Reply OK" && node external-tools/claude-tap/verify-dry-run-rehearsal.mjs --json --strategy explicitPath --tool-path ${quotedExplicitToolPath} --product pi-mono`,
        `npm run helix -- external-tools doctor claude-tap --strategy explicitPath --tool-path ${quotedExplicitToolPath} --require-tool --json`,
        `HELIX_EXTERNAL_CAPTURE=1 npm run helix -- external-tools capture claude-tap --strategy explicitPath --tool-path ${quotedExplicitToolPath} --require-tool --product pi-mono --task read-only-answer --out-dir .helix/external-tools/runs/pi-read-only --json -- --tap-client pi -- -p "Reply OK"`,
        `npm run external:claude-tap:preflight:captures -- --strategy explicitPath --tool-path ${quotedExplicitToolPath} --product pi-mono`,
        "npm run external:claude-tap:verify:pi:read-only",
        `npm run external:claude-tap:preflight:compare -- --strategy explicitPath --tool-path ${quotedExplicitToolPath} --product pi-mono`,
      ])
      const toolPathOnlyPiReady = await execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--strict", "--tool-path", explicitToolPath, "--product", "pi", "--no-dotenv"], {
        cwd: process.cwd(),
        env,
      })
      expect(JSON.parse(toolPathOnlyPiReady.stdout)).toMatchObject({
        recommendedStrategy: "explicitPath",
        requirements: { strategy: "explicitPath", toolPath: explicitToolPath, product: "pi-mono", productInput: "pi" },
        toolStrategies: [expect.objectContaining({ strategy: "explicitPath", toolPath: explicitToolPath, ok: true })],
        nextCommands: expect.arrayContaining([
          `npm run helix -- external-tools doctor claude-tap --strategy explicitPath --tool-path ${quotedExplicitToolPath} --require-tool --json`,
        ]),
      })
      const explicitPathPiHuman = await execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--strategy", "explicitPath", "--tool-path", explicitToolPath, "--product", "pi", "--no-dotenv"], {
        cwd: process.cwd(),
        env,
      })
      expect(explicitPathPiHuman.stdout).not.toContain("secret-value-that-must-not-leak")
      expect(explicitPathPiHuman.stdout).toContain(`explicitPath (${explicitToolPath}): ok 0.1.115`)
      expect(explicitPathPiHuman.stdout).toContain("pi-mono: manifest=")
      expect(explicitPathPiHuman.stdout).toContain(`--strategy explicitPath --tool-path ${quotedExplicitToolPath}`)
      await expect(
        execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--strategy", "explicitPath", "--no-dotenv"], {
          cwd: process.cwd(),
          env,
        }),
      ).rejects.toMatchObject({
        code: 2,
        stderr: expect.stringContaining("--strategy explicitPath requires --tool-path"),
      })
      await expect(
        execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--strategy", "binary", "--tool-path", explicitToolPath, "--no-dotenv"], {
          cwd: process.cwd(),
          env,
        }),
      ).rejects.toMatchObject({
        code: 2,
        stderr: expect.stringContaining("--tool-path can only be combined"),
      })

      await expect(
        execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--strict", "--strategy", "binary", "--no-dotenv"], {
          cwd: process.cwd(),
          env,
        }),
      ).rejects.toMatchObject({
        code: 2,
        stdout: expect.stringContaining('"strategy": "binary"'),
      })
      await expect(
        execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--product", "nanobot", "--no-dotenv"], {
          cwd: process.cwd(),
          env,
        }),
      ).rejects.toMatchObject({
        code: 2,
        stderr: expect.stringContaining("Unsupported claude-tap preflight product: nanobot"),
      })
      await expect(
        execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--product", "nanobot", "--no-dotenv"], {
          cwd: process.cwd(),
          env,
        }),
      ).rejects.toMatchObject({
        code: 2,
        stderr: expect.stringContaining("pi-mono (alias pi)"),
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("reports claude-tap preflight readiness without leaking credential values", async () => {
    const { stdout } = await execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--skip-tool-check", "--no-dotenv"], {
      cwd: process.cwd(),
      env: {
        PATH: process.env.PATH ?? "",
        HELIX_EXTERNAL_CAPTURE: "1",
        OPENAI_API_KEY: "secret-value-that-must-not-leak",
      },
    })
    expect(stdout).not.toContain("secret-value-that-must-not-leak")
    const report = JSON.parse(stdout) as {
      ok?: boolean
      requirements?: { target?: string; ok?: boolean; captureReady?: boolean; capturesReady?: boolean; compareReady?: boolean }
      gates?: { consent?: { ok?: boolean }; credentials?: { ok?: boolean; envNamesPresent?: string[] } }
      toolStrategies?: Array<{ strategy?: string; skipped?: boolean }>
      artifacts?: Array<{ product?: string; readiness?: { capturesReady?: boolean; compareReady?: boolean }; files?: { normalizedCapture?: { exists?: boolean } } }>
      missing?: Array<{ id?: string }>
      nextCommands?: string[]
    }
    expect(report.ok).toBe(false)
    expect(report.requirements).toMatchObject({ target: "capture-ready", ok: false, captureReady: false })
    expect(report.gates?.consent?.ok).toBe(true)
    expect(report.gates?.credentials).toMatchObject({ ok: true, envNamesPresent: ["OPENAI_API_KEY"] })
    expect(report.toolStrategies).toEqual(expect.arrayContaining([
      expect.objectContaining({ strategy: "binary", skipped: true }),
      expect.objectContaining({ strategy: "uvx", skipped: true }),
    ]))
    expect(report.missing).toEqual([expect.objectContaining({ id: "tool-strategy" })])
    expect(report.artifacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ product: "opencode" }),
      expect.objectContaining({ product: "pi-mono", readiness: { capturesReady: false, compareReady: false } }),
      expect.objectContaining({ product: "hermes-agent" }),
    ]))
    expect(report.nextCommands).toEqual(expect.arrayContaining([
      "npm run external:claude-tap:dry-run:acceptance:read-only",
      "HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:opencode:read-only && HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:pi:read-only && HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:hermes:read-only",
      "npm run external:claude-tap:preflight:captures:binary",
      "npm run external:claude-tap:verify:read-only",
      "npm run external:claude-tap:preflight:compare:binary",
    ]))

    const npmProductPreflight = await execFileAsync("npm", ["--silent", "run", "external:claude-tap:preflight", "--", "--product", "pi-mono", "--skip-tool-check", "--no-dotenv"], {
      cwd: process.cwd(),
      env: { PATH: process.env.PATH ?? "" },
    })
    const npmProductReport = JSON.parse(npmProductPreflight.stdout) as { products?: string[]; requirements?: { target?: string; product?: string }; nextCommands?: string[] }
    expect(npmProductReport).toMatchObject({
      products: ["pi-mono"],
      requirements: { target: "capture-ready", product: "pi-mono" },
      nextCommands: expect.arrayContaining([
        "npm run external:claude-tap:preflight:captures -- --strategy binary --product pi-mono",
        "npm run external:claude-tap:preflight:compare -- --strategy binary --product pi-mono",
      ]),
    })

    const npmCapturesRoot = mkdtempSync(join(tmpdir(), "helix-claude-tap-npm-captures-"))
    try {
      let npmCapturesFailed = false
      try {
        await execFileAsync("npm", ["--silent", "run", "external:claude-tap:preflight:captures", "--", "--strategy", "uvx", "--product", "pi-mono", "--skip-tool-check", "--no-dotenv", "--root", npmCapturesRoot], {
          cwd: process.cwd(),
          env: { PATH: process.env.PATH ?? "" },
        })
      } catch (error) {
        npmCapturesFailed = true
        const npmCapturesReport = JSON.parse((error as { stdout?: string }).stdout ?? "{}") as { products?: string[]; requirements?: { target?: string; strategy?: string; product?: string }; missing?: Array<{ product?: string }> }
        expect(npmCapturesReport).toMatchObject({
          products: ["pi-mono"],
          requirements: { target: "captures", strategy: "uvx", product: "pi-mono" },
          missing: expect.arrayContaining([
            expect.objectContaining({ product: "pi-mono" }),
          ]),
        })
        expect((error as { code?: number }).code).toBe(2)
      }
      expect(npmCapturesFailed).toBe(true)
    } finally {
      rmSync(npmCapturesRoot, { recursive: true, force: true })
    }

    const envRoot = mkdtempSync(join(tmpdir(), "helix-claude-tap-env-"))
    try {
      writeFileSync(join(envRoot, ".env"), "AZURE_OPENAI_API_KEY=dotenv-secret-that-must-not-leak\n", "utf8")
      const dotenvOutput = await execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--skip-tool-check", "--root", envRoot], {
        cwd: process.cwd(),
        env: { PATH: process.env.PATH ?? "" },
      })
      expect(dotenvOutput.stdout).not.toContain("dotenv-secret-that-must-not-leak")
      expect(JSON.parse(dotenvOutput.stdout)).toMatchObject({
        dotenv: { loaded: ["AZURE_OPENAI_API_KEY"], skipped: [] },
        gates: { credentials: { ok: true, envNamesPresent: ["AZURE_OPENAI_API_KEY"], allowNoCredentials: false } },
      })
    } finally {
      rmSync(envRoot, { recursive: true, force: true })
    }

    const noCredentialRoot = mkdtempSync(join(tmpdir(), "helix-claude-tap-env-"))
    try {
      writeFileSync(
        join(noCredentialRoot, ".env"),
        "HELIX_EXTERNAL_CAPTURE=1\nHELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS=1\n",
        "utf8",
      )
      const noCredentialOutput = await execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--skip-tool-check", "--root", noCredentialRoot], {
        cwd: process.cwd(),
        env: { PATH: process.env.PATH ?? "" },
      })
      expect(JSON.parse(noCredentialOutput.stdout)).toMatchObject({
        dotenv: { loaded: [], skipped: [] },
        gates: {
          consent: { ok: false },
          credentials: { ok: false, envNamesPresent: [], allowNoCredentials: false },
        },
      })
    } finally {
      rmSync(noCredentialRoot, { recursive: true, force: true })
    }

    const captures = await execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--require-captures", "--skip-tool-check"], {
      cwd: process.cwd(),
      env: { PATH: process.env.PATH ?? "" },
    })
    const capturesReport = JSON.parse(captures.stdout) as { ok?: boolean; requirements?: { target?: string; capturesReady?: boolean } }
    expect(capturesReport).toMatchObject({
      ok: false,
      requirements: { target: "captures", capturesReady: false },
      missing: expect.arrayContaining([
        expect.objectContaining({ id: "artifact-manifest", product: "opencode" }),
        expect.objectContaining({ id: "artifact-rawTrace", product: "pi-mono" }),
        expect.objectContaining({ id: "artifact-normalizedCapture", product: "hermes-agent" }),
      ]),
    })

    const humanMissing = await execFileAsync("npm", ["--silent", "run", "external:claude-tap:preflight:human", "--", "--require-captures", "--product", "pi-mono", "--skip-tool-check", "--no-dotenv"], {
      cwd: process.cwd(),
      env: { PATH: process.env.PATH ?? "" },
    })
    expect(humanMissing.stdout).toContain("Missing:")
    expect(humanMissing.stdout).toContain("pi-mono: manifest=missing raw=missing native=missing compare=missing capturesReady=no compareReady=no")
    expect(humanMissing.stdout).toContain("artifact-manifest: pi-mono run manifest is missing (.helix/external-tools/runs/pi-read-only/run-manifest.json)")
    expect(humanMissing.stdout).toContain("artifact-normalizedCapture: pi-mono normalized capture is missing (.helix/external-tools/runs/pi-read-only/normalized/native-capture.json)")

    await expect(
      execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--require-compare", "--strict", "--skip-tool-check"], {
        cwd: process.cwd(),
        env: { PATH: process.env.PATH ?? "" },
      }),
    ).rejects.toMatchObject({ code: 2 })

    const root = mkdtempSync(join(tmpdir(), "helix-claude-tap-preflight-"))
    try {
      const graphStdout: string[] = []
      const graphStderr: string[] = []
      const graphIO = {
        stdout: {
          write(chunk: string) {
            graphStdout.push(chunk)
            return true
          },
        },
        stderr: {
          write(chunk: string) {
            graphStderr.push(chunk)
            return true
          },
        },
      }
      const cases = [
        { product: "opencode", slug: "opencode-read-only" },
        { product: "pi-mono", slug: "pi-read-only" },
        { product: "hermes-agent", slug: "hermes-read-only" },
      ]
      const artifact = (runDir: string, path: string, format: string, role: string) => {
        const bytes = readFileSync(join(runDir, ...path.split("/")))
        return {
          path,
          hash: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
          bytes: bytes.length,
          format,
          role,
        }
      }
      for (const testCase of cases) {
        const runDir = join(root, ".helix/external-tools/runs", testCase.slug)
        mkdirSync(join(runDir, "normalized"), { recursive: true })
        mkdirSync(join(runDir, "raw"), { recursive: true })
        mkdirSync(join(runDir, "logs"), { recursive: true })
        writeFileSync(
          join(runDir, "raw/trace.jsonl"),
          `${JSON.stringify({
            request_id: `${testCase.slug}-request-1`,
            request: { method: "POST", path: "/v1/messages", body: { model: "claude-test" } },
            response: { status: 200, body: { type: "message" } },
          })}\n`,
          "utf8",
        )
        writeFileSync(join(runDir, "logs/stdout.log"), "mock stdout\n", "utf8")
        writeFileSync(join(runDir, "logs/stderr.log"), "", "utf8")
        const rawTraceBytes = readFileSync(join(runDir, "raw/trace.jsonl"))
        const rawTraceHash = `sha256:${createHash("sha256").update(rawTraceBytes).digest("hex")}`
        writeFileSync(
          join(runDir, "normalized/native-capture.json"),
          `${JSON.stringify(
            {
              schemaVersion: 1,
              artifactKind: "external-tool-native-capture",
              generatedAt: "2026-06-14T00:00:00.000Z",
              sourceTool: "claude-tap",
              sourceToolVersion: "0.1.114",
              sourceArtifact: {
                format: "jsonl",
                hash: rawTraceHash,
                bytes: rawTraceBytes.length,
              },
              product: testCase.product,
              taskID: "read-only-answer",
              captureMode: "real-capture",
              lossiness: {
                observability: "external-proxy-capture",
                rawPrompt: "fingerprint-only",
                rawProviderPayload: "shape-summary-only",
                rawToolPayload: "fingerprint-only",
                nativeInternals: "unobservable",
              },
              providerRequests: [
                {
                  requestID: `${testCase.slug}-request-1`,
                  turn: 1,
                  method: "POST",
                  path: "/v1/messages",
                  protocol: "anthropic-messages",
                  modelID: "claude-test",
                  status: 200,
                  durationMs: 1,
                  requestShape: { type: "object", fingerprint: `sha256:${"1".repeat(64)}`, keys: ["model"] },
                  responseShape: { type: "object", fingerprint: `sha256:${"2".repeat(64)}`, keys: ["type"] },
                },
              ],
              promptEvidence: [],
              toolEvidence: [],
              streamEvidence: [],
              usageEvidence: [],
              stageEvidence: [
                {
                  stage: "provider",
                  observability: "external-proxy-capture",
                  evidenceCount: 1,
                  summary: "provider request observed",
                  fingerprints: [`sha256:${"1".repeat(64)}`],
                },
              ],
              redactionPolicy: {
                version: 1,
                containsRawPrompt: false,
                credentials: "redacted",
                hostPaths: "normalized",
              },
              summary: {
                records: 1,
                providerRequests: 1,
                promptEvidence: 0,
                toolEvidence: 0,
                streamEvents: 0,
                models: ["claude-test"],
                protocols: ["anthropic-messages"],
                statusCodes: [200],
              },
            },
            null,
            2,
          )}\n`,
          "utf8",
        )
        graphStdout.length = 0
        graphStderr.length = 0
        expect(
          await runCli(
            [
              "flow-graph",
              "--product",
              testCase.product,
              "--mode",
              "compare",
              "--task",
              "read-only-answer",
              "--artifact",
              join(runDir, "normalized/native-capture.json"),
              "--out",
              join(runDir, "flow-compare.json"),
              "--json",
            ],
            graphIO,
          ),
        ).toBe(0)
        expect(graphStderr.join("")).toBe("")
        graphStdout.length = 0
        expect(
          await runCli(["verify-flow-graph", "--artifact", join(runDir, "flow-compare.json"), "--json"], graphIO),
        ).toBe(0)
        expect(JSON.parse(graphStdout.join(""))).toMatchObject({ ok: true })
        expect(graphStderr.join("")).toBe("")
        graphStdout.length = 0
        graphStderr.length = 0
        writeFileSync(
          join(runDir, "flow-compare.local-shape-only.json"),
          `${JSON.stringify(
            {
              schemaVersion: 1,
              product: testCase.product,
              taskID: "read-only-answer",
              assembled: { source: "assembled", product: testCase.product },
              original: { source: "original", product: testCase.product },
              diffs: [],
              summary: { fingerprint: "test-fingerprint" },
            },
            null,
            2,
          )}\n`,
          "utf8",
        )
        writeFileSync(
          join(runDir, "run-manifest.json"),
          `${JSON.stringify(
            {
              schemaVersion: 1,
              artifactKind: "external-tool-run-manifest",
              runID: `${testCase.slug}-fixture`,
              toolID: "claude-tap",
              toolVersion: "0.1.114",
              product: testCase.product,
              taskID: "read-only-answer",
              captureMode: "real-capture",
              invocation: {
                strategy: "uvx",
                command: "uvx",
                resolvedCommand: "uvx",
                args: ["claude-tap", "--tap-client", testCase.slug],
                cwd: root,
                envAllowlist: ["ANTHROPIC_API_KEY"],
              },
              startedAt: "2026-06-14T00:00:00.000Z",
              finishedAt: "2026-06-14T00:00:01.000Z",
              exitCode: 0,
              artifacts: [
                artifact(runDir, "raw/trace.jsonl", "jsonl", "raw-trace"),
                artifact(runDir, "normalized/native-capture.json", "json", "other"),
                artifact(runDir, "logs/stdout.log", "log", "log"),
                artifact(runDir, "logs/stderr.log", "log", "log"),
              ],
            },
            null,
            2,
          )}\n`,
          "utf8",
        )
      }
      const mockBinDir = join(root, "mock-bin")
      mkdirSync(mockBinDir)
      writeFileSync(
        join(mockBinDir, "uvx"),
        `#!${process.execPath}
const args = process.argv.slice(2)
if (args[0] === "claude-tap" && args[1] === "--version") {
  console.log("claude-tap 0.1.114")
  process.exit(0)
}
process.exit(2)
`,
        { mode: 0o755 },
      )
      const staleNormalizedPath = join(root, ".helix/external-tools/runs/pi-read-only/normalized/native-capture.json")
      const originalStaleNormalized = readFileSync(staleNormalizedPath, "utf8")
      writeFileSync(staleNormalizedPath, `${JSON.stringify({ artifactKind: "stale-native-capture" })}\n`, "utf8")
      try {
        const captureReadyWithStaleArtifacts = await execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--strict", "--strategy", "uvx", "--no-dotenv", "--root", root], {
          cwd: process.cwd(),
          env: {
            PATH: mockBinDir,
            HELIX_EXTERNAL_CAPTURE: "1",
            OPENAI_API_KEY: "secret-value-that-must-not-leak",
          },
        })
        const captureReadyReport = JSON.parse(captureReadyWithStaleArtifacts.stdout) as {
          artifacts?: Array<{ product?: string; files?: { manifest?: { skipped?: boolean }; normalizedCapture?: { skipped?: boolean } } }>
        }
        expect(captureReadyWithStaleArtifacts.stdout).not.toContain("secret-value-that-must-not-leak")
        expect(captureReadyReport).toMatchObject({
          ok: true,
          readyToCapture: true,
          readyToVerify: false,
          requirements: { target: "capture-ready", strategy: "uvx", ok: true, captureReady: true, capturesReady: false },
        })
        const piArtifact = captureReadyReport.artifacts?.find((item) => item.product === "pi-mono")
        expect(piArtifact?.files?.manifest).toMatchObject({ skipped: true })
        expect(piArtifact?.files?.normalizedCapture).toMatchObject({ skipped: true })
      } finally {
        writeFileSync(staleNormalizedPath, originalStaleNormalized, "utf8")
      }

      const valid = await execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--require-compare", "--strict", "--strategy", "uvx", "--skip-tool-check", "--root", root], {
        cwd: process.cwd(),
        env: { PATH: process.env.PATH ?? "" },
      })
      expect(JSON.parse(valid.stdout)).toMatchObject({
        ok: true,
        readyToVerify: true,
        manifestsReady: true,
        rawTracesReady: true,
        normalizedCapturesReady: true,
        flowCompareComplete: true,
        requirements: { target: "compare", strategy: "uvx", ok: true, capturesReady: true, compareReady: true },
      })

      const targetedCaptures = await execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--require-captures", "--strict", "--strategy", "uvx", "--product", "pi-mono", "--skip-tool-check", "--root", root], {
        cwd: process.cwd(),
        env: { PATH: process.env.PATH ?? "" },
      })
      const targetedCapturesReport = JSON.parse(targetedCaptures.stdout) as {
        artifacts?: Array<{ product?: string; readiness?: { capturesReady?: boolean; compareReady?: boolean }; files?: { flowCompare?: { skipped?: boolean } } }>
        missing?: unknown[]
        nextCommands?: string[]
      }
      expect(targetedCapturesReport).toMatchObject({
        ok: true,
        products: ["pi-mono"],
        readyToVerify: true,
        requirements: { target: "captures", strategy: "uvx", product: "pi-mono", products: ["pi-mono"], ok: true, capturesReady: true },
      })
      expect(targetedCapturesReport.artifacts?.map((item) => item.product)).toEqual(["pi-mono"])
      expect(targetedCapturesReport.artifacts?.[0]?.readiness).toEqual({ capturesReady: true, compareReady: false })
      expect(targetedCapturesReport.artifacts?.[0]?.files?.flowCompare).toMatchObject({ skipped: true })
      expect(targetedCapturesReport.missing).toEqual([])
      expect(targetedCapturesReport.nextCommands).toEqual([
        "npm run external:claude-tap:dry-run:acceptance:read-only",
        "npm run external:claude-tap:doctor:uvx:required",
        "HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:uvx:pi:read-only",
        "npm run external:claude-tap:preflight:captures -- --strategy uvx --product pi-mono",
        "npm run external:claude-tap:verify:pi:read-only",
        "npm run external:claude-tap:preflight:compare -- --strategy uvx --product pi-mono",
      ])

      const capturesOnlyRunDir = join(root, ".helix/external-tools/runs/opencode-read-only")
      const capturesOnlyFlowComparePath = join(capturesOnlyRunDir, "flow-compare.json")
      const originalCapturesOnlyFlowCompare = readFileSync(capturesOnlyFlowComparePath, "utf8")
      writeFileSync(capturesOnlyFlowComparePath, readFileSync(join(capturesOnlyRunDir, "flow-compare.local-shape-only.json"), "utf8"), "utf8")
      const capturesOnly = await execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--require-captures", "--strict", "--strategy", "uvx", "--skip-tool-check", "--root", root], {
        cwd: process.cwd(),
        env: { PATH: process.env.PATH ?? "" },
      })
      const capturesOnlyReport = JSON.parse(capturesOnly.stdout) as { artifacts?: Array<{ files?: { flowCompare?: { skipped?: boolean } } }> }
      expect(capturesOnlyReport).toMatchObject({
        ok: true,
        readyToVerify: true,
        flowCompareComplete: false,
        requirements: { target: "captures", strategy: "uvx", ok: true, capturesReady: true, compareReady: false },
      })
      expect(capturesOnlyReport.artifacts?.[0]?.files?.flowCompare).toMatchObject({ skipped: true })

      const targetedCompare = await execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--require-compare", "--strict", "--strategy", "uvx", "--product", "pi-mono", "--skip-tool-check", "--root", root], {
        cwd: process.cwd(),
        env: { PATH: process.env.PATH ?? "" },
      })
      const targetedCompareReport = JSON.parse(targetedCompare.stdout) as { artifacts?: Array<{ product?: string; readiness?: { capturesReady?: boolean; compareReady?: boolean } }>; missing?: unknown[] }
      expect(targetedCompareReport).toMatchObject({
        ok: true,
        products: ["pi-mono"],
        readyToVerify: true,
        flowCompareComplete: true,
        requirements: { target: "compare", strategy: "uvx", product: "pi-mono", products: ["pi-mono"], ok: true, capturesReady: true, compareReady: true },
      })
      expect(targetedCompareReport.artifacts?.map((item) => item.product)).toEqual(["pi-mono"])
      expect(targetedCompareReport.artifacts?.[0]?.readiness).toEqual({ capturesReady: true, compareReady: true })
      expect(targetedCompareReport.missing).toEqual([])

      const explicitPathManifestPath = join(root, ".helix/external-tools/runs/pi-read-only/run-manifest.json")
      const originalExplicitPathManifest = readFileSync(explicitPathManifestPath, "utf8")
      const explicitPathManifest = JSON.parse(originalExplicitPathManifest) as { invocation?: { strategy?: string; command?: string; resolvedCommand?: string; args?: string[] } }
      writeFileSync(
        explicitPathManifestPath,
        `${JSON.stringify({
          ...explicitPathManifest,
          invocation: {
            ...(explicitPathManifest.invocation ?? {}),
            strategy: "explicitPath",
            command: "/tmp/wrong-claude-tap",
            resolvedCommand: "/tmp/wrong-claude-tap",
            args: ["--tap-client", "pi"],
          },
        }, null, 2)}\n`,
        "utf8",
      )
      try {
        await expect(
          execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--require-captures", "--strict", "--strategy", "explicitPath", "--tool-path", join(root, "mock-bin/right-claude-tap"), "--product", "pi-mono", "--skip-tool-check", "--root", root], {
            cwd: process.cwd(),
            env: { PATH: process.env.PATH ?? "" },
          }),
        ).rejects.toMatchObject({
          code: 2,
          stdout: expect.stringContaining("run-manifest.invocation-command"),
        })
      } finally {
        writeFileSync(explicitPathManifestPath, originalExplicitPathManifest, "utf8")
      }
      writeFileSync(capturesOnlyFlowComparePath, originalCapturesOnlyFlowCompare, "utf8")

      const hiddenFlowCompares = cases.map((testCase) => {
        const visible = join(root, ".helix/external-tools/runs", testCase.slug, "flow-compare.json")
        const hidden = join(root, ".helix/external-tools/runs", testCase.slug, "flow-compare.strategy-check.json")
        renameSync(visible, hidden)
        return { visible, hidden }
      })
      try {
        await expect(
          execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--require-captures", "--strict", "--strategy", "binary", "--skip-tool-check", "--root", root], {
            cwd: process.cwd(),
            env: { PATH: process.env.PATH ?? "" },
          }),
        ).rejects.toMatchObject({
          code: 2,
          stdout: expect.stringContaining("run-manifest.invocation-strategy"),
        })
      } finally {
        for (const { visible, hidden } of hiddenFlowCompares) renameSync(hidden, visible)
      }

      const invalidCompareRunDir = join(root, ".helix/external-tools/runs/opencode-read-only")
      const rawTracePath = join(invalidCompareRunDir, "raw/trace.jsonl")
      const originalRawTrace = readFileSync(rawTracePath, "utf8")
      writeFileSync(rawTracePath, `${originalRawTrace}{"request_id":"extra-after-manifest"}\n`, "utf8")
      const staleCapture = await execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--require-compare", "--skip-tool-check", "--root", root], {
        cwd: process.cwd(),
        env: { PATH: process.env.PATH ?? "" },
      })
      expect(JSON.parse(staleCapture.stdout)).toMatchObject({
        ok: false,
        readyToVerify: false,
        flowCompareComplete: true,
        requirements: { target: "compare", ok: false, capturesReady: false, compareReady: false },
      })
      writeFileSync(rawTracePath, originalRawTrace, "utf8")

      writeFileSync(
        join(invalidCompareRunDir, "flow-compare.json"),
        readFileSync(join(invalidCompareRunDir, "flow-compare.local-shape-only.json"), "utf8"),
        "utf8",
      )
      await expect(
        execFileAsync(process.execPath, ["external-tools/claude-tap/preflight.mjs", "--json", "--require-compare", "--strict", "--skip-tool-check", "--root", root], {
          cwd: process.cwd(),
          env: { PATH: process.env.PATH ?? "" },
        }),
      ).rejects.toMatchObject({
        code: 2,
        stdout: expect.stringContaining("flow-artifact.shape"),
      })
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }, 120000)

  it("compares synthetic claude-tap external captures for Phase 4 products", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-external-compare-"))
    const stdout: string[] = []
    const stderr: string[] = []
    const io = {
      stdout: {
        write(chunk: string) {
          stdout.push(chunk)
          return true
        },
      },
      stderr: {
        write(chunk: string) {
          stderr.push(chunk)
          return true
        },
      },
    }
    const cases = [
      { product: "opencode", slug: "opencode-read-only" },
      { product: "pi-mono", slug: "pi-read-only" },
      { product: "hermes-agent", slug: "hermes-read-only" },
    ] as const
    try {
      for (const testCase of cases) {
        const captureOut = join(dir, `${testCase.slug}.native-capture.json`)
        const compareOut = join(dir, `${testCase.slug}.flow-compare.json`)
        stdout.length = 0
        stderr.length = 0
        expect(
          await runCli(
            [
              "external-tools",
              "import",
              "claude-tap",
              "--artifact",
              "external-tools/claude-tap/fixtures/minimal-jsonl.trace.jsonl",
              "--product",
              testCase.product,
              "--task",
              "read-only-answer",
              "--out",
              captureOut,
              "--json",
            ],
            io,
          ),
        ).toBe(0)

        stdout.length = 0
        expect(await runCli(["external-tools", "verify", "--artifact", captureOut, "--json"], io)).toBe(0)
        expect(JSON.parse(stdout.join(""))).toMatchObject({ ok: true })

        stdout.length = 0
        expect(
          await runCli(
            [
              "flow-graph",
              "--product",
              testCase.product,
              "--mode",
              "compare",
              "--task",
              "read-only-answer",
              "--artifact",
              captureOut,
              "--out",
              compareOut,
              "--json",
            ],
            io,
          ),
        ).toBe(0)
        expect(JSON.parse(readFileSync(compareOut, "utf8"))).toMatchObject({
          product: testCase.product,
          original: expect.objectContaining({ source: "original" }),
          assembled: expect.objectContaining({ source: "assembled" }),
        })

        stdout.length = 0
        expect(await runCli(["verify-flow-graph", "--artifact", compareOut, "--json"], io)).toBe(0)
        expect(JSON.parse(stdout.join(""))).toMatchObject({ ok: true })
        expect(stderr.join("")).toBe("")
      }
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("imports and verifies claude-tap trace artifacts through the CLI", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-external-tools-"))
    const stdout: string[] = []
    const stderr: string[] = []
    const io = {
      stdout: {
        write(chunk: string) {
          stdout.push(chunk)
          return true
        },
      },
      stderr: {
        write(chunk: string) {
          stderr.push(chunk)
          return true
        },
      },
    }
    try {
      expect(await runCli(["external-tools", "list", "--json"], io)).toBe(0)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        tools: [
          expect.objectContaining({
            id: "claude-tap",
            supportedProducts: expect.arrayContaining(["opencode", "pi-mono", "hermes-agent", "codex"]),
            unsupportedProducts: ["nanobot"],
            unsupportedGaps: [
              expect.objectContaining({
                product: "nanobot",
                status: "needs-upstream-support",
                nextAction: expect.stringContaining("Helix-owned Nanobot capture path"),
              }),
            ],
          }),
        ],
      })

      stdout.length = 0
      stderr.length = 0
      expect(
        await runCli(
          [
            "external-tools",
            "import",
            "claude-tap",
            "--artifact",
            "docs/reports/external-tools/claude-tap/raw/trace.jsonl",
            "--product",
            "pi-mono",
            "--json",
          ],
          io,
        ),
      ).toBe(2)
      expect(stderr.join("")).toContain("refuses raw external tool artifacts from docs/reports")

      stdout.length = 0
      stderr.length = 0
      const out = join(dir, "native-capture.json")
      expect(
        await runCli(
          [
            "external-tools",
            "import",
            "claude-tap",
            "--artifact",
            "external-tools/claude-tap/fixtures/minimal-jsonl.trace.jsonl",
            "--product",
            "pi-mono",
            "--task",
            "read-only-answer",
            "--out",
            out,
            "--json",
          ],
          io,
        ),
      ).toBe(0)
      const importOutput = JSON.parse(stdout.join("")) as { artifact?: { summary?: { records?: number }; redactionPolicy?: { containsRawPrompt?: boolean } }; verification?: { ok?: boolean } }
      const written = JSON.parse(readFileSync(out, "utf8")) as Record<string, unknown> & {
        providerRequests?: Array<Record<string, unknown>>
        promptEvidence?: Array<Record<string, unknown>>
        toolEvidence?: Array<Record<string, unknown>>
        streamEvidence?: Array<Record<string, unknown>>
        usageEvidence?: Array<Record<string, unknown>>
        stageEvidence?: Array<Record<string, unknown>>
        redactionPolicy?: { version?: number; containsRawPrompt?: boolean; credentials?: string; hostPaths?: string }
        sourceArtifact?: { hash?: string; bytes?: number; format?: string }
        summary?: Record<string, unknown>
      }
      expect(importOutput.verification?.ok).toBe(true)
      expect(importOutput.artifact?.summary?.records).toBe(1)
      expect(written?.redactionPolicy?.containsRawPrompt).toBe(false)

      stdout.length = 0
      const publishedDir = join(dir, "docs/reports/external-tools/claude-tap/pi-read-only")
      expect(
        await runCli(
          [
            "external-tools",
            "import",
            "claude-tap",
            "--artifact",
            "external-tools/claude-tap/fixtures/minimal-jsonl.trace.jsonl",
            "--product",
            "pi-mono",
            "--task",
            "read-only-answer",
            "--publish-report",
            "--out-dir",
            publishedDir,
            "--json",
          ],
          io,
        ),
      ).toBe(0)
      const publishedOutput = JSON.parse(stdout.join("")) as { outputPaths?: string[]; verification?: { ok?: boolean } }
      const publishedCapturePath = join(publishedDir, "native-capture.json")
      const publishedCaptureText = readFileSync(publishedCapturePath, "utf8")
      expect(publishedOutput.verification?.ok).toBe(true)
      expect(publishedOutput.outputPaths).toContain(publishedCapturePath)
      expect(JSON.parse(publishedCaptureText)).toMatchObject({
        artifactKind: "external-tool-native-capture",
        product: "pi-mono",
        taskID: "read-only-answer",
        redactionPolicy: { containsRawPrompt: false },
      })
      expect(publishedCaptureText).not.toContain("Reply OK")
      expect(publishedCaptureText).not.toContain("You are Pi")
      expect(publishedCaptureText).not.toContain("***")

      stdout.length = 0
      stderr.length = 0
      const unsafeTracePath = join(dir, "unsafe-home-path.trace.jsonl")
      const unsafeOut = join(dir, "unsafe-native-capture.json")
      const unsafePublishedDir = join(dir, "docs/reports/external-tools/claude-tap/unsafe")
      const unsafePublishedCapturePath = join(unsafePublishedDir, "native-capture.json")
      writeFileSync(
        unsafeTracePath,
        `${JSON.stringify({
          timestamp: "2026-06-14T00:00:00.000Z",
          request_id: "req_unsafe_path_1",
          turn: 1,
          upstream_base_url: "/home/alice/private-project",
          request: { method: "POST", path: "/v1/responses", body: { model: "gpt-test" } },
          response: { status: 200, body: { status: "completed" } },
        })}\n`,
        "utf8",
      )
      expect(
        await runCli(
          [
            "external-tools",
            "import",
            "claude-tap",
            "--artifact",
            unsafeTracePath,
            "--product",
            "pi-mono",
            "--task",
            "read-only-answer",
            "--out",
            unsafeOut,
            "--publish-report",
            "--out-dir",
            unsafePublishedDir,
            "--json",
          ],
          io,
        ),
      ).toBe(1)
      const unsafeOutput = JSON.parse(stdout.join("")) as { artifact?: unknown; outputPaths?: string[]; verification?: { ok?: boolean; issues?: Array<{ id?: string }> } }
      expect(unsafeOutput.artifact).toBeUndefined()
      expect(unsafeOutput.outputPaths).toEqual([])
      expect(unsafeOutput.verification).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "host-paths" })]),
      })
      expect(existsSync(unsafeOut)).toBe(false)
      expect(existsSync(unsafePublishedCapturePath)).toBe(false)
      expect(stderr.join("")).toBe("")

      stdout.length = 0
      expect(await runCli(["external-tools", "verify", "--artifact", out, "--json"], io)).toBe(0)
      expect(JSON.parse(stdout.join(""))).toMatchObject({ ok: true })

      stdout.length = 0
      stderr.length = 0
      const unsupportedCaptureOut = join(dir, "nanobot-native-capture.json")
      writeFileSync(unsupportedCaptureOut, `${JSON.stringify({ ...written, product: "nanobot" }, null, 2)}\n`, "utf8")
      expect(await runCli(["external-tools", "verify", "--artifact", unsupportedCaptureOut, "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "product-supported" })]),
      })
      expect(stderr.join("")).toBe("")

      stdout.length = 0
      const invalidSourceArtifactOut = join(dir, "invalid-source-artifact-native-capture.json")
      writeFileSync(
        invalidSourceArtifactOut,
        `${JSON.stringify(
          {
            ...written,
            sourceArtifact: {
              ...written.sourceArtifact,
              hash: "sha256:not-a-real-digest",
              bytes: -1,
              format: "zip",
            },
          },
          null,
          2,
        )}\n`,
        "utf8",
      )
      expect(await runCli(["external-tools", "verify", "--artifact", invalidSourceArtifactOut, "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ id: "source-artifact-hash" }),
          expect.objectContaining({ id: "source-artifact-format" }),
          expect.objectContaining({ id: "source-artifact-bytes" }),
        ]),
      })

      stdout.length = 0
      const invalidCoreSchemaOut = join(dir, "invalid-core-schema-native-capture.json")
      writeFileSync(
        invalidCoreSchemaOut,
        `${JSON.stringify(
          {
            ...written,
            generatedAt: "not-a-date",
            sourceToolVersion: "",
            lossiness: { nativeInternals: "observable" },
            promptEvidence: undefined,
            toolEvidence: undefined,
            streamEvidence: undefined,
            usageEvidence: undefined,
            summary: { records: 1 },
          },
          null,
          2,
        )}\n`,
        "utf8",
      )
      expect(await runCli(["external-tools", "verify", "--artifact", invalidCoreSchemaOut, "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ id: "generated-at" }),
          expect.objectContaining({ id: "source-tool-version" }),
          expect.objectContaining({ id: "lossiness-policy" }),
          expect.objectContaining({ id: "prompt-evidence" }),
          expect.objectContaining({ id: "tool-evidence" }),
          expect.objectContaining({ id: "stream-evidence" }),
          expect.objectContaining({ id: "usage-evidence" }),
          expect.objectContaining({ id: "summary" }),
        ]),
      })

      stdout.length = 0
      const mismatchedSummaryOut = join(dir, "mismatched-summary-native-capture.json")
      writeFileSync(
        mismatchedSummaryOut,
        `${JSON.stringify(
          {
            ...written,
            summary: {
              ...written.summary,
              records: 999,
              providerRequests: 999,
            },
          },
          null,
          2,
        )}\n`,
        "utf8",
      )
      expect(await runCli(["external-tools", "verify", "--artifact", mismatchedSummaryOut, "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "summary-counts" })]),
      })

      stdout.length = 0
      const mismatchedObservedSummaryOut = join(dir, "mismatched-observed-summary-native-capture.json")
      writeFileSync(
        mismatchedObservedSummaryOut,
        `${JSON.stringify(
          {
            ...written,
            summary: {
              ...written.summary,
              models: ["wrong-model"],
              protocols: ["wrong-protocol"],
              statusCodes: [500],
            },
          },
          null,
          2,
        )}\n`,
        "utf8",
      )
      expect(await runCli(["external-tools", "verify", "--artifact", mismatchedObservedSummaryOut, "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "summary-observed-values" })]),
      })

      stdout.length = 0
      const malformedProviderRequestOut = join(dir, "malformed-provider-request-native-capture.json")
      writeFileSync(
        malformedProviderRequestOut,
        `${JSON.stringify(
          {
            ...written,
            providerRequests: (written.providerRequests ?? []).map((request, index) => index === 0 ? { ...request, method: "", requestShape: { type: "object", fingerprint: "not-a-sha", keys: [] } } : request),
          },
          null,
          2,
        )}\n`,
        "utf8",
      )
      expect(await runCli(["external-tools", "verify", "--artifact", malformedProviderRequestOut, "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "provider-request-shape" })]),
      })

      stdout.length = 0
      const malformedPromptEvidenceOut = join(dir, "malformed-prompt-evidence-native-capture.json")
      writeFileSync(
        malformedPromptEvidenceOut,
        `${JSON.stringify(
          {
            ...written,
            promptEvidence: (written.promptEvidence ?? []).map((prompt, index) => index === 0 ? { ...prompt, userFingerprint: "not-a-sha", toolSchemaFingerprints: ["not-a-sha"], messageCount: -1 } : prompt),
          },
          null,
          2,
        )}\n`,
        "utf8",
      )
      expect(await runCli(["external-tools", "verify", "--artifact", malformedPromptEvidenceOut, "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "prompt-evidence-shape" })]),
      })

      stdout.length = 0
      const malformedToolEvidenceOut = join(dir, "malformed-tool-evidence-native-capture.json")
      writeFileSync(
        malformedToolEvidenceOut,
        `${JSON.stringify(
          {
            ...written,
            toolEvidence: (written.toolEvidence ?? []).map((tool, index) => index === 0 ? { ...tool, source: "raw-tool-call", toolName: "", argumentFingerprint: "not-a-sha", order: -1 } : tool),
          },
          null,
          2,
        )}\n`,
        "utf8",
      )
      expect(await runCli(["external-tools", "verify", "--artifact", malformedToolEvidenceOut, "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "tool-evidence-shape" })]),
      })

      stdout.length = 0
      const malformedStreamEvidenceOut = join(dir, "malformed-stream-evidence-native-capture.json")
      writeFileSync(
        malformedStreamEvidenceOut,
        `${JSON.stringify(
          {
            ...written,
            streamEvidence: (written.streamEvidence ?? []).map((stream, index) => index === 0 ? {
              ...stream,
              protocol: "",
              eventCount: -1,
              reconstructedResponse: {
                eventTypes: ["message", 1],
                chunkTypes: [""],
                textBytes: -1,
                textFingerprint: "not-a-sha",
                toolCallCount: -1,
                toolArgumentBytes: -1,
                semanticFingerprint: "not-a-sha",
              },
              responseFingerprint: "not-a-sha",
            } : stream),
          },
          null,
          2,
        )}\n`,
        "utf8",
      )
      expect(await runCli(["external-tools", "verify", "--artifact", malformedStreamEvidenceOut, "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "stream-evidence-shape" })]),
      })

      stdout.length = 0
      const malformedUsageEvidenceOut = join(dir, "malformed-usage-evidence-native-capture.json")
      writeFileSync(
        malformedUsageEvidenceOut,
        `${JSON.stringify(
          {
            ...written,
            usageEvidence: (written.usageEvidence ?? []).map((usage, index) => index === 0 ? {
              ...usage,
              requestID: "",
              turn: -1,
              inputTokens: -1,
              outputTokens: -1,
              cacheReadTokens: -1,
              cacheCreateTokens: -1,
              totalTokens: -1,
            } : usage),
          },
          null,
          2,
        )}\n`,
        "utf8",
      )
      expect(await runCli(["external-tools", "verify", "--artifact", malformedUsageEvidenceOut, "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "usage-evidence-shape" })]),
      })

      stdout.length = 0
      const malformedStageEvidenceOut = join(dir, "malformed-stage-evidence-native-capture.json")
      writeFileSync(
        malformedStageEvidenceOut,
        `${JSON.stringify(
          {
            ...written,
            stageEvidence: (written.stageEvidence ?? []).map((stage, index) => index === 0 ? {
              ...stage,
              observability: "raw-native-internals",
              evidenceCount: -1,
              summary: "",
              fingerprints: ["not-a-sha"],
            } : stage),
          },
          null,
          2,
        )}\n`,
        "utf8",
      )
      expect(await runCli(["external-tools", "verify", "--artifact", malformedStageEvidenceOut, "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "stage-evidence-shape" })]),
      })

      stdout.length = 0
      const mismatchedStageEvidenceOut = join(dir, "mismatched-stage-evidence-native-capture.json")
      writeFileSync(
        mismatchedStageEvidenceOut,
        `${JSON.stringify(
          {
            ...written,
            stageEvidence: (written.stageEvidence ?? []).map((stage) => stage.stage === "provider" ? { ...stage, evidenceCount: 999 } : stage),
          },
          null,
          2,
        )}\n`,
        "utf8",
      )
      expect(await runCli(["external-tools", "verify", "--artifact", mismatchedStageEvidenceOut, "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "stage-evidence-counts" })]),
      })

      stdout.length = 0
      const malformedRedactionPolicyOut = join(dir, "malformed-redaction-policy-native-capture.json")
      writeFileSync(
        malformedRedactionPolicyOut,
        `${JSON.stringify(
          {
            ...written,
            redactionPolicy: {
              ...written.redactionPolicy,
              credentials: "available",
              hostPaths: "raw",
            },
          },
          null,
          2,
        )}\n`,
        "utf8",
      )
      expect(await runCli(["external-tools", "verify", "--artifact", malformedRedactionPolicyOut, "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "redaction-policy" })]),
      })

      stdout.length = 0
      stderr.length = 0
      const rejectedCadenceOut = join(dir, "nanobot-native-cadence.json")
      expect(
        await runCli(
          ["external-tools", "to-native-cadence", "--artifact", unsupportedCaptureOut, "--out", rejectedCadenceOut, "--json"],
          io,
        ),
      ).toBe(2)
      expect(stderr.join("")).toContain("External capture artifact failed verification")
      expect(stderr.join("")).toContain("product-supported")
      expect(existsSync(rejectedCadenceOut)).toBe(false)

      stdout.length = 0
      stderr.length = 0
      expect(await runCli(["external-tools", "verify", "--artifact", out, "--run-manifest", join(dir, "missing-run-manifest.json"), "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "run-manifest.parse" })]),
      })
      expect(stderr.join("")).toBe("")

      stdout.length = 0
      const cadenceOut = join(dir, "native-cadence.json")
      expect(await runCli(["external-tools", "to-native-cadence", "--artifact", out, "--out", cadenceOut, "--json"], io)).toBe(0)
      const cadenceOutput = JSON.parse(stdout.join("")) as {
        fixtureSet?: { fixtures?: Array<{ product?: string; nativeVersion?: string; providerShape?: { requests?: number }; projectionLosses?: unknown[] }> }
        verification?: { ok?: boolean }
      }
      expect(cadenceOutput.verification?.ok).toBe(true)
      expect(cadenceOutput.fixtureSet?.fixtures?.[0]).toMatchObject({
        product: "pi-mono",
        nativeVersion: "external-tool/claude-tap@unknown",
        providerShape: { requests: 1 },
      })
      expect(cadenceOutput.fixtureSet?.fixtures?.[0]?.projectionLosses?.length).toBeGreaterThan(0)
      expect(JSON.parse(readFileSync(cadenceOut, "utf8"))).toMatchObject({ schemaVersion: 1, fixtures: [expect.objectContaining({ product: "pi-mono" })] })

      stdout.length = 0
      expect(await runCli(["flow-graph", "--product", "pi-mono", "--mode", "native", "--task", "read-only-answer", "--artifact", out, "--json"], io)).toBe(0)
      const nativeFlow = JSON.parse(stdout.join("")) as {
        source?: string
        mode?: string
        product?: string
        taskID?: string
        evidence?: Array<{ kind?: string; refs?: string[]; metadata?: { projectionLossDetails?: Array<{ field?: string; lossiness?: string }> } }>
      }
      expect(nativeFlow).toMatchObject({
        source: "original",
        mode: "native",
        product: "pi-mono",
        taskID: "read-only-answer",
      })
      expect(nativeFlow.evidence).toEqual(expect.arrayContaining([
        expect.objectContaining({
          kind: "native-cadence",
          refs: expect.arrayContaining(["external-tool/claude-tap@unknown", "read-only-answer"]),
          metadata: expect.objectContaining({
            projectionLossDetails: expect.arrayContaining([
              expect.objectContaining({ field: "workspace", lossiness: "unobservable" }),
            ]),
          }),
        }),
      ]))

      stdout.length = 0
      expect(await runCli(["flow-graph", "--product", "pi-mono", "--mode", "compare", "--task", "read-only-answer", "--artifact", out, "--json"], io)).toBe(0)
      const compareFlow = JSON.parse(stdout.join("")) as { original?: { evidence?: Array<{ refs?: string[] }> }; summary?: { fingerprint?: string }; diffs?: unknown[] }
      expect(compareFlow.original?.evidence).toEqual(expect.arrayContaining([
        expect.objectContaining({ refs: expect.arrayContaining(["external-tool/claude-tap@unknown", "read-only-answer"]) }),
      ]))
      expect(compareFlow.summary?.fingerprint).toMatch(/^[a-f0-9]{16}$/)
      expect(compareFlow.diffs?.length).toEqual(expect.any(Number))

      stdout.length = 0
      expect(await runCli(["task-parity", "--product", "pi-mono", "--task", "read-only-answer", "--mode", "original", "--external-capture", out, "--json"], io)).toBe(0)
      const externalTaskParity = JSON.parse(stdout.join("")) as {
        reports?: Array<{
          status?: string
          runner?: { id?: string; evidence?: string; externalCapture?: { sourceTool?: string; captureMode?: string } }
          productEvidence?: { nativeAdapter?: string }
          observationShape?: { workspace?: { lossiness?: string } }
          fixtureReplay?: { source?: string; verified?: boolean }
        }>
        summary?: { reports?: number; acceptableDrift?: number }
      }
      expect(externalTaskParity.summary).toMatchObject({ reports: 1, acceptableDrift: 1 })
      expect(externalTaskParity.reports?.[0]).toMatchObject({
        status: "acceptable-drift",
        runner: {
          id: "task.runner.external-capture",
          evidence: "external-tool-capture",
          externalCapture: { sourceTool: "claude-tap", captureMode: "import-only" },
        },
        productEvidence: { nativeAdapter: "external-tool-capture" },
        observationShape: { workspace: { lossiness: "unobservable" } },
        fixtureReplay: { source: "external-tool-capture", verified: true },
      })

      stdout.length = 0
      const assemblyOut = join(dir, "assembly-contract-pi-mono.json")
      const runManifestOut = join(dir, "run-manifest.json")
      writeFileSync(
        runManifestOut,
        `${JSON.stringify(
          {
            schemaVersion: 1,
            artifactKind: "external-tool-run-manifest",
            runID: "cli-external-evidence",
            toolID: "claude-tap",
            toolVersion: "unknown",
            invocation: { strategy: "binary", command: "claude-tap", resolvedCommand: "claude-tap", args: [], cwd: process.cwd(), envAllowlist: [] },
            captureMode: "real-capture",
            startedAt: "2026-06-14T00:00:00.000Z",
            finishedAt: "2026-06-14T00:00:00.000Z",
            exitCode: 0,
            artifacts: [{ path: "raw/trace.jsonl", hash: written?.sourceArtifact?.hash, bytes: written?.sourceArtifact?.bytes, format: "jsonl", role: "raw-trace" }],
          },
          null,
          2,
        )}\n`,
      )
      expect(await runCli(["assemble", "--product", "pi-mono", "--with-external-capture", out, "--external-run-manifest", runManifestOut, "--out", assemblyOut, "--json"], io)).toBe(0)
      const assemblyOutput = JSON.parse(stdout.join("")) as {
        contract?: { externalToolEvidence?: { status?: string; refs?: Array<{ kind?: string; toolID?: string; artifactPath?: string }> } }
        verification?: { ok?: boolean; checks?: Array<{ id?: string; ok?: boolean }> }
        summary?: { externalEvidence?: string }
      }
      expect(assemblyOutput.verification?.ok).toBe(true)
      expect(assemblyOutput.summary?.externalEvidence).toBe("linked")
      expect(assemblyOutput.contract?.externalToolEvidence).toMatchObject({
        status: "linked",
        refs: [expect.objectContaining({ kind: "externalTool", toolID: "claude-tap", artifactPath: out, manifest: expect.objectContaining({ sourceArtifactHashMatched: true }) })],
      })
      expect(JSON.parse(readFileSync(assemblyOut, "utf8"))).toMatchObject({
        externalToolEvidence: { status: "linked", refs: [expect.objectContaining({ kind: "externalTool", toolID: "claude-tap" })] },
      })

      stdout.length = 0
      stderr.length = 0
      const captureOnlyOut = join(dir, "capture-only.json")
      writeFileSync(captureOnlyOut, `${JSON.stringify({ ...written, captureMode: "capture-only" }, null, 2)}\n`, "utf8")
      expect(await runCli(["external-tools", "to-native-cadence", "--artifact", captureOnlyOut, "--json"], io)).toBe(2)
      expect(stderr.join("")).toContain("refuses capture-only artifacts")
      stderr.length = 0
      expect(await runCli(["flow-graph", "--product", "pi-mono", "--mode", "native", "--artifact", captureOnlyOut, "--json"], io)).toBe(2)
      expect(stderr.join("")).toContain("refuses capture-only external artifacts")
      stderr.length = 0
      expect(await runCli(["task-parity", "--product", "pi-mono", "--task", "read-only-answer", "--mode", "original", "--external-capture", captureOnlyOut, "--json"], io)).toBe(2)
      expect(stderr.join("")).toContain("refuses capture-only or dry-run artifacts")
      stderr.length = 0

      stdout.length = 0
      const dryRunCaptureOut = join(dir, "dry-run-native-capture.json")
      writeFileSync(dryRunCaptureOut, `${JSON.stringify({ ...written, captureMode: "dry-run" }, null, 2)}\n`, "utf8")
      expect(await runCli(["external-tools", "verify", "--artifact", dryRunCaptureOut, "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "capture-mode" })]),
      })
      stdout.length = 0
      stderr.length = 0
      const dryRunCadenceOut = join(dir, "dry-run-native-cadence.json")
      expect(await runCli(["external-tools", "to-native-cadence", "--artifact", dryRunCaptureOut, "--out", dryRunCadenceOut, "--json"], io)).toBe(2)
      expect(stderr.join("")).toContain("External capture artifact failed verification")
      expect(stderr.join("")).toContain("capture-mode")
      expect(existsSync(dryRunCadenceOut)).toBe(false)
      stderr.length = 0
      expect(await runCli(["flow-graph", "--product", "pi-mono", "--mode", "native", "--artifact", dryRunCaptureOut, "--json"], io)).toBe(2)
      expect(stderr.join("")).toContain("External capture artifact failed verification")
      expect(stderr.join("")).toContain("capture-mode")
      stderr.length = 0

      expect(stderr.join("")).toBe("")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("writes claude-tap capture dry-run manifests through the CLI", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-external-capture-cli-"))
    const stdout: string[] = []
    const stderr: string[] = []
    const io = {
      stdout: {
        write(chunk: string) {
          stdout.push(chunk)
          return true
        },
      },
      stderr: {
        write(chunk: string) {
          stderr.push(chunk)
          return true
        },
      },
    }
    try {
      expect(
        await runCli(
          [
            "external-tools",
            "capture",
            "claude-tap",
            "--dry-run",
            "--out-dir",
            "docs/reports/external-tools/claude-tap/raw-run",
            "--json",
            "--",
            "--tap-client",
            "pi",
          ],
          io,
        ),
      ).toBe(2)
      expect(stderr.join("")).toContain("docs/reports")

      stdout.length = 0
      stderr.length = 0
      expect(
        await runCli(
          [
            "external-tools",
            "capture",
            "claude-tap",
            "--dry-run",
            "--product",
            "nanobot",
            "--task",
            "read-only-answer",
            "--out-dir",
            dir,
            "--json",
            "--",
            "--tap-client",
            "nanobot",
          ],
          io,
        ),
      ).toBe(2)
      expect(stderr.join("")).toContain("does not support product nanobot")
      expect(stderr.join("")).toContain("Helix-owned Nanobot capture path")

      stdout.length = 0
      stderr.length = 0
      expect(
        await runCli(
          [
            "external-tools",
            "capture",
            "claude-tap",
            "--dry-run",
            "--product",
            "pi-mono",
            "--task",
            "read-only-answer",
            "--out-dir",
            dir,
            "--json",
            "--",
            "--tap-client",
            "pi",
            "--",
            "-p",
            "Reply OK",
          ],
          io,
        ),
      ).toBe(0)
      const output = JSON.parse(stdout.join("")) as { manifestPath?: string; manifest?: { captureMode?: string; invocation?: { args?: string[] } } }
      expect(output.manifestPath).toBe(join(dir, "run-manifest.json"))
      expect(output.manifest?.captureMode).toBe("dry-run")
      expect(output.manifest?.invocation?.args).toEqual([
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
      expect(JSON.parse(readFileSync(join(dir, "run-manifest.json"), "utf8"))).toMatchObject({
        toolID: "claude-tap",
        product: "pi-mono",
        taskID: "read-only-answer",
        captureMode: "dry-run",
      })
      stdout.length = 0
      const uvxDir = join(dir, "uvx")
      expect(
        await runCli(
          [
            "external-tools",
            "capture",
            "claude-tap",
            "--dry-run",
            "--strategy",
            "uvx",
            "--product",
            "pi-mono",
            "--task",
            "read-only-answer",
            "--out-dir",
            uvxDir,
            "--json",
            "--",
            "--tap-client",
            "pi",
          ],
          io,
        ),
      ).toBe(0)
      const uvxOutput = JSON.parse(stdout.join("")) as { manifest?: { invocation?: { strategy?: string; command?: string; args?: string[] } } }
      expect(uvxOutput.manifest?.invocation).toMatchObject({
        strategy: "uvx",
        command: "uvx",
      })
      expect(uvxOutput.manifest?.invocation?.args).toEqual([
        "claude-tap",
        "--tap-output-dir",
        join(uvxDir, "raw"),
        "--tap-no-open",
        "--tap-no-live",
        "--tap-no-update-check",
        "--tap-store-stream-events",
        "--tap-client",
        "pi",
      ])
      expect(JSON.parse(readFileSync(join(uvxDir, "run-manifest.json"), "utf8"))).toMatchObject({
        invocation: {
          strategy: "uvx",
          command: "uvx",
        },
      })
      stdout.length = 0
      stderr.length = 0
      const explicitToolPath = join(dir, "mock-claude-tap-explicit")
      writeFileSync(
        explicitToolPath,
        `#!/usr/bin/env node
const args = process.argv.slice(2)
if (args[0] === "--version") {
  console.log("claude-tap 0.1.115")
  process.exit(0)
}
process.exit(2)
`,
        { mode: 0o755 },
      )
      const explicitPathDir = join(dir, ".helix/external-tools/dry-runs/explicitPath/pi-read-only")
      expect(
        await runCli(
          [
            "external-tools",
            "capture",
            "claude-tap",
            "--dry-run",
            "--require-tool",
            "--strategy",
            "explicitPath",
            "--tool-path",
            explicitToolPath,
            "--product",
            "pi-mono",
            "--task",
            "read-only-answer",
            "--out-dir",
            explicitPathDir,
            "--json",
            "--",
            "--tap-client",
            "pi",
            "--",
            "-p",
            "Reply OK",
          ],
          io,
        ),
      ).toBe(0)
      const explicitPathOutput = JSON.parse(stdout.join("")) as { manifest?: { toolVersion?: string; invocation?: { strategy?: string; command?: string; resolvedCommand?: string; args?: string[] } } }
      expect(explicitPathOutput.manifest).toMatchObject({
        toolVersion: "0.1.115",
        invocation: {
          strategy: "explicitPath",
          command: explicitToolPath,
          resolvedCommand: explicitToolPath,
        },
      })
      expect(explicitPathOutput.manifest?.invocation?.args).toEqual([
        "--tap-output-dir",
        join(explicitPathDir, "raw"),
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
      const explicitPathVerification = await execFileAsync(process.execPath, ["external-tools/claude-tap/verify-dry-run-rehearsal.mjs", "--json", "--strategy", "explicitPath", "--tool-path", explicitToolPath, "--product", "pi", "--root", dir], {
        cwd: process.cwd(),
        env: { PATH: process.env.PATH ?? "" },
      })
      expect(JSON.parse(explicitPathVerification.stdout)).toMatchObject({
        ok: true,
        checks: [
          expect.objectContaining({
            id: "claude-tap.dry-run.explicitPath.pi-read-only",
            ok: true,
            strategy: "explicitPath",
            product: "pi-mono",
            manifestPath: join(explicitPathDir, "run-manifest.json"),
          }),
        ],
      })
      await expect(
        execFileAsync(process.execPath, ["external-tools/claude-tap/verify-dry-run-rehearsal.mjs", "--json", "--strategy", "explicitPath", "--tool-path", join(dir, "other-claude-tap"), "--product", "pi", "--root", dir], {
          cwd: process.cwd(),
          env: { PATH: process.env.PATH ?? "" },
        }),
      ).rejects.toMatchObject({
        code: 1,
        stdout: expect.stringContaining("run-manifest.invocation-command"),
      })
      const mockBinDir = join(dir, "mock-bin")
      mkdirSync(mockBinDir)
      const uvxPath = join(mockBinDir, "uvx")
      writeFileSync(
        uvxPath,
        `#!/usr/bin/env node
const args = process.argv.slice(2)
if (args[0] === "claude-tap" && args[1] === "--version") {
  console.log("claude-tap 0.1.114")
  process.exit(0)
}
process.exit(2)
`,
        { mode: 0o755 },
      )
      const originalPath = process.env.PATH
      process.env.PATH = `${mockBinDir}${delimiter}${originalPath ?? ""}`
      try {
        stdout.length = 0
        stderr.length = 0
        const uvxRequiredDir = join(dir, "uvx-required")
        expect(
          await runCli(
            [
              "external-tools",
              "capture",
              "claude-tap",
              "--dry-run",
              "--require-tool",
              "--strategy",
              "uvx",
              "--product",
              "pi-mono",
              "--task",
              "read-only-answer",
              "--out-dir",
              uvxRequiredDir,
              "--json",
              "--",
              "--tap-client",
              "pi",
            ],
            io,
          ),
        ).toBe(0)
        expect(JSON.parse(stdout.join(""))).toMatchObject({
          manifest: {
            toolVersion: "0.1.114",
            invocation: {
              strategy: "uvx",
              command: "uvx",
            },
          },
        })
        const uvxRequiredOutput = JSON.parse(stdout.join("")) as { manifest?: { invocation?: { args?: string[] } } }
        expect(uvxRequiredOutput.manifest?.invocation?.args).toEqual([
          "claude-tap",
          "--tap-output-dir",
          join(uvxRequiredDir, "raw"),
          "--tap-no-open",
          "--tap-no-live",
          "--tap-no-update-check",
          "--tap-store-stream-events",
          "--tap-client",
          "pi",
        ])
      } finally {
        if (originalPath === undefined) delete process.env.PATH
        else process.env.PATH = originalPath
      }
      expect(stderr.join("")).toBe("")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 15000)

  it("runs claude-tap capture through a mock CLI binary", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-external-capture-cli-"))
    const stdout: string[] = []
    const stderr: string[] = []
    const io = {
      stdout: {
        write(chunk: string) {
          stdout.push(chunk)
          return true
        },
      },
      stderr: {
        write(chunk: string) {
          stderr.push(chunk)
          return true
        },
      },
    }
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
writeFileSync(resolve(rawDir, "trace.jsonl"), JSON.stringify({ request_id: "cli-mock-1", turn: 1, request: { method: "POST", path: "/v1/responses", body: { model: "gpt-test" } }, response: { status: 200, body: { status: "completed" } } }) + "\\n", "utf8")
console.log("mock stdout")
console.error("mock stderr")
`,
        { mode: 0o755 },
      )

      expect(await runCli(["external-tools", "doctor", "claude-tap", "--tool-path", toolPath, "--require-tool", "--json"], io)).toBe(0)
      expect(JSON.parse(stdout.join(""))).toMatchObject({ ok: true, tools: [expect.objectContaining({ toolID: "claude-tap", installed: true, version: "0.1.114" })] })
      stdout.length = 0

      const originalConsent = process.env.HELIX_EXTERNAL_CAPTURE
      const originalAllowNoCredentials = process.env.HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS
      process.env.HELIX_EXTERNAL_CAPTURE = "1"
      process.env.HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS = "1"
      try {
        expect(
          await runCli(
            [
              "external-tools",
              "capture",
              "claude-tap",
              "--product",
              "pi-mono",
              "--task",
              "read-only-answer",
              "--out-dir",
              join(dir, "run"),
              "--tool-path",
              toolPath,
              "--json",
              "--",
              "--tap-client",
              "pi",
              "--",
              "-p",
              "Reply OK",
            ],
            io,
          ),
        ).toBe(0)
      } finally {
        if (originalConsent === undefined) delete process.env.HELIX_EXTERNAL_CAPTURE
        else process.env.HELIX_EXTERNAL_CAPTURE = originalConsent
        if (originalAllowNoCredentials === undefined) delete process.env.HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS
        else process.env.HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS = originalAllowNoCredentials
      }
      const output = JSON.parse(stdout.join("")) as {
        dryRun?: boolean
        rawDir?: string
        stdoutPath?: string
        stderrPath?: string
        manifestPath?: string
        manifest?: { captureMode?: string; exitCode?: number; toolVersion?: string; invocation?: { args?: string[] }; artifacts?: Array<{ path?: string; role?: string }> }
      }
      expect(output.dryRun).toBe(false)
      expect(output.manifest?.captureMode).toBe("real-capture")
      expect(output.manifest?.toolVersion).toBe("0.1.114")
      expect(output.manifest?.exitCode).toBe(0)
      expect(output.manifest?.invocation?.args).toEqual([
        "--tap-output-dir",
        output.rawDir,
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
      expect(output.manifest?.artifacts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "raw/trace.jsonl", role: "raw-trace" }),
          expect.objectContaining({ path: "logs/stdout.log", role: "log" }),
          expect.objectContaining({ path: "logs/stderr.log", role: "log" }),
        ]),
      )
      expect(readFileSync(output.stdoutPath ?? "", "utf8")).toContain("mock stdout")
      expect(readFileSync(output.stderrPath ?? "", "utf8")).toContain("mock stderr")
      expect(JSON.parse(readFileSync(output.manifestPath ?? "", "utf8"))).toMatchObject({
        toolID: "claude-tap",
        toolVersion: "0.1.114",
        product: "pi-mono",
        taskID: "read-only-answer",
        captureMode: "real-capture",
        exitCode: 0,
      })
      stdout.length = 0
      const normalizedCapture = join(dir, "run", "normalized", "native-capture.json")
      expect(await runCli(["external-tools", "verify", "--artifact", normalizedCapture, "--run-manifest", output.manifestPath ?? "", "--json"], io)).toBe(0)
      const linkedVerification = JSON.parse(stdout.join("")) as { ok?: boolean; checks?: Array<{ id?: string; ok?: boolean }>; manifest?: { path?: string } }
      expect(linkedVerification.ok).toBe(true)
      expect(linkedVerification.manifest?.path).toBe(output.manifestPath)
      expect(linkedVerification.checks).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "run-manifest.source-artifact", ok: true }),
        expect.objectContaining({ id: "run-manifest.normalized-artifact", ok: true }),
        expect.objectContaining({ id: "run-manifest.env-gates", ok: true }),
      ]))
      stdout.length = 0
      expect(await runCli([
        "external-tools",
        "verify-run-manifest",
        "--manifest",
        output.manifestPath ?? "",
        "--product",
        "pi-mono",
        "--task",
        "read-only-answer",
        "--capture-mode",
        "real-capture",
        "--require-artifact",
        "raw/trace.jsonl:raw-trace",
        "--json",
      ], io)).toBe(0)
      const manifestVerification = JSON.parse(stdout.join("")) as { ok?: boolean; checks?: Array<{ id?: string; ok?: boolean }>; manifest?: { path?: string } }
      expect(manifestVerification.ok).toBe(true)
      expect(manifestVerification.manifest?.path).toBe(output.manifestPath)
      expect(manifestVerification.checks).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "run-manifest.required-artifact.raw/trace.jsonl", ok: true }),
      ]))

      const capturedRunManifestPath = output.manifestPath ?? ""
      const capturedRunManifest = JSON.parse(readFileSync(capturedRunManifestPath, "utf8")) as { invocation?: { args?: unknown[]; envAllowlist?: string[] }; artifacts?: Array<Record<string, unknown>> }
      const hostEnvManifestPath = join(dir, "run", "run-manifest-host-env.json")
      writeFileSync(
        hostEnvManifestPath,
        `${JSON.stringify(
          {
            ...capturedRunManifest,
            invocation: {
              ...capturedRunManifest.invocation,
              envAllowlist: [...(capturedRunManifest.invocation?.envAllowlist ?? []), "CODEX_REMOTE_PAYLOAD"],
            },
          },
          null,
          2,
        )}\n`,
        "utf8",
      )
      stdout.length = 0
      expect(await runCli(["external-tools", "verify", "--artifact", normalizedCapture, "--run-manifest", hostEnvManifestPath, "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "run-manifest.env-gates" })]),
      })

      const sourceFormatDriftManifestPath = join(dir, "run", "run-manifest-source-format-drift.json")
      writeFileSync(
        sourceFormatDriftManifestPath,
        `${JSON.stringify(
          {
            ...capturedRunManifest,
            artifacts: (capturedRunManifest.artifacts ?? []).map((artifact) => artifact.path === "raw/trace.jsonl" ? { ...artifact, format: "compact" } : artifact),
          },
          null,
          2,
        )}\n`,
        "utf8",
      )
      stdout.length = 0
      expect(await runCli(["external-tools", "verify", "--artifact", normalizedCapture, "--run-manifest", sourceFormatDriftManifestPath, "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "run-manifest.source-artifact" })]),
      })
      stdout.length = 0
      expect(await runCli([
        "external-tools",
        "verify-run-manifest",
        "--manifest",
        hostEnvManifestPath,
        "--product",
        "pi-mono",
        "--task",
        "read-only-answer",
        "--capture-mode",
        "real-capture",
        "--require-artifact",
        "raw/trace.jsonl:raw-trace",
        "--json",
      ], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "run-manifest.env-gates" })]),
      })

      const invalidAuditFieldsManifestPath = join(dir, "run", "run-manifest-invalid-audit-fields.json")
      writeFileSync(
        invalidAuditFieldsManifestPath,
        `${JSON.stringify(
          {
            ...capturedRunManifest,
            runID: "",
            finishedAt: "2020-01-01T00:00:00.000Z",
            invocation: {
              ...capturedRunManifest.invocation,
              args: [...(capturedRunManifest.invocation?.args ?? []), 1],
              envAllowlist: ["OPENAI_API_KEY", "OPENAI_API_KEY", "openai_api_key"],
            },
          },
          null,
          2,
        )}\n`,
        "utf8",
      )
      stdout.length = 0
      expect(await runCli(["external-tools", "verify-run-manifest", "--manifest", invalidAuditFieldsManifestPath, "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ id: "run-manifest.run-id" }),
          expect.objectContaining({ id: "run-manifest.duration" }),
          expect.objectContaining({ id: "run-manifest.invocation" }),
          expect.objectContaining({ id: "run-manifest.env-allowlist" }),
        ]),
      })

      const invalidModeManifestPath = join(dir, "run", "run-manifest-invalid-mode.json")
      writeFileSync(
        invalidModeManifestPath,
        `${JSON.stringify({ ...capturedRunManifest, captureMode: "simulated-capture" }, null, 2)}\n`,
        "utf8",
      )
      stdout.length = 0
      expect(await runCli([
        "external-tools",
        "verify-run-manifest",
        "--manifest",
        invalidModeManifestPath,
        "--require-artifact",
        "raw/trace.jsonl:raw-trace",
        "--json",
      ], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "run-manifest.capture-mode" })]),
      })

      const invalidArtifactSchemaManifestPath = join(dir, "run", "run-manifest-invalid-artifact-schema.json")
      writeFileSync(
        invalidArtifactSchemaManifestPath,
        `${JSON.stringify(
          {
            ...capturedRunManifest,
            artifacts: (capturedRunManifest.artifacts ?? []).map((artifact, index) => index === 0 ? { ...artifact, hash: "sha256:not-a-real-digest", bytes: -1, format: "zip", role: "raw" } : artifact),
          },
          null,
          2,
        )}\n`,
        "utf8",
      )
      stdout.length = 0
      expect(await runCli(["external-tools", "verify-run-manifest", "--manifest", invalidArtifactSchemaManifestPath, "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ id: "run-manifest.artifact.0.format" }),
          expect.objectContaining({ id: "run-manifest.artifact.0.role" }),
          expect.objectContaining({ id: "run-manifest.artifact.0.hash-format" }),
          expect.objectContaining({ id: "run-manifest.artifact.0.bytes-format" }),
        ]),
      })

      const duplicateArtifact = (capturedRunManifest.artifacts ?? [])[0]
      const duplicateArtifactManifestPath = join(dir, "run", "run-manifest-duplicate-artifact.json")
      writeFileSync(
        duplicateArtifactManifestPath,
        `${JSON.stringify(
          {
            ...capturedRunManifest,
            artifacts: duplicateArtifact ? [duplicateArtifact, ...(capturedRunManifest.artifacts ?? [])] : capturedRunManifest.artifacts,
          },
          null,
          2,
        )}\n`,
        "utf8",
      )
      stdout.length = 0
      expect(await runCli(["external-tools", "verify-run-manifest", "--manifest", duplicateArtifactManifestPath, "--json"], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "run-manifest.artifact-paths" })]),
      })

      const unsupportedManifestPath = join(dir, "run", "run-manifest-nanobot.json")
      writeFileSync(
        unsupportedManifestPath,
        `${JSON.stringify({ ...capturedRunManifest, product: "nanobot" }, null, 2)}\n`,
        "utf8",
      )
      stdout.length = 0
      expect(await runCli([
        "external-tools",
        "verify-run-manifest",
        "--manifest",
        unsupportedManifestPath,
        "--capture-mode",
        "real-capture",
        "--require-artifact",
        "raw/trace.jsonl:raw-trace",
        "--json",
      ], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "run-manifest.product-supported" })]),
      })
      expect(stderr.join("")).toBe("")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("returns the failing claude-tap capture exit code without verified evidence", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-external-capture-cli-failed-"))
    const stdout: string[] = []
    const stderr: string[] = []
    const io = {
      stdout: {
        write(chunk: string) {
          stdout.push(chunk)
          return true
        },
      },
      stderr: {
        write(chunk: string) {
          stderr.push(chunk)
          return true
        },
      },
    }
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
writeFileSync(resolve(rawDir, "trace.jsonl"), JSON.stringify({ request_id: "cli-failed-1", turn: 1, request: { method: "POST", path: "/v1/responses", body: { model: "gpt-test" } }, response: { status: 500, body: { error: "synthetic failure" } } }) + "\\n", "utf8")
console.error("synthetic cli capture failure")
process.exit(42)
`,
        { mode: 0o755 },
      )

      const originalConsent = process.env.HELIX_EXTERNAL_CAPTURE
      const originalAllowNoCredentials = process.env.HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS
      process.env.HELIX_EXTERNAL_CAPTURE = "1"
      process.env.HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS = "1"
      try {
        expect(
          await runCli(
            [
              "external-tools",
              "capture",
              "claude-tap",
              "--product",
              "pi-mono",
              "--task",
              "read-only-answer",
              "--out-dir",
              join(dir, "run"),
              "--tool-path",
              toolPath,
              "--json",
              "--",
              "--tap-client",
              "pi",
              "--",
              "-p",
              "Reply OK",
            ],
            io,
          ),
        ).toBe(42)
      } finally {
        if (originalConsent === undefined) delete process.env.HELIX_EXTERNAL_CAPTURE
        else process.env.HELIX_EXTERNAL_CAPTURE = originalConsent
        if (originalAllowNoCredentials === undefined) delete process.env.HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS
        else process.env.HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS = originalAllowNoCredentials
      }

      const output = JSON.parse(stdout.join("")) as {
        ok?: boolean
        dryRun?: boolean
        rawDir?: string
        stderrPath?: string
        manifestPath?: string
        manifest?: {
          captureMode?: string
          exitCode?: number
          toolVersion?: string
          artifacts?: Array<{ path?: string; role?: string }>
        }
      }
      expect(output.ok).toBe(false)
      expect(output.dryRun).toBe(false)
      expect(output.manifest).toMatchObject({
        captureMode: "real-capture",
        exitCode: 42,
        toolVersion: "0.1.114",
      })
      expect(output.manifest?.artifacts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "raw/trace.jsonl", role: "raw-trace" }),
          expect.objectContaining({ path: "logs/stdout.log", role: "log" }),
          expect.objectContaining({ path: "logs/stderr.log", role: "log" }),
        ]),
      )
      expect(existsSync(join(dir, "run", "normalized", "native-capture.json"))).toBe(false)
      expect(readFileSync(output.stderrPath ?? "", "utf8")).toContain("synthetic cli capture failure")

      stdout.length = 0
      expect(await runCli([
        "external-tools",
        "verify-run-manifest",
        "--manifest",
        output.manifestPath ?? "",
        "--product",
        "pi-mono",
        "--task",
        "read-only-answer",
        "--capture-mode",
        "real-capture",
        "--require-artifact",
        "normalized/native-capture.json:other",
        "--json",
      ], io)).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([
          expect.objectContaining({ id: "run-manifest.exit-code" }),
          expect.objectContaining({ id: "run-manifest.required-artifact.normalized/native-capture.json" }),
        ]),
      })
      expect(stderr.join("")).toBe("")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("parses live provider parity report options", () => {
    expect(
      parseArgs([
        "live-provider-parity",
        "--provider",
        "openrouter",
        "--model",
        "openai/gpt-test",
        "--api-key",
        "secret",
        "--product",
        "opencode,pi-mono",
        "--require-credentials",
        "--out",
        "docs/reports/live-provider-parity.json",
        "--artifact-format",
        "split",
        "--out-dir",
        "docs/reports/live-provider-parity",
        "--summary-out",
        "docs/reports/live-provider-parity.json",
        "--json",
      ]),
    ).toMatchObject({
      command: "live-provider-parity",
      provider: "openrouter",
      modelID: "openai/gpt-test",
      apiKey: "secret",
      products: ["opencode", "pi-mono"],
      requireCredentials: true,
      artifactFormat: "split",
      outDir: resolve(process.cwd(), "docs/reports/live-provider-parity"),
      summaryOut: resolve(process.cwd(), "docs/reports/live-provider-parity.json"),
      json: true,
      out: resolve(process.cwd(), "docs/reports/live-provider-parity.json"),
    })
    expect(
      parseArgs([
        "live-provider-parity",
        "migrate-artifact",
        "--artifact",
        "docs/reports/live-provider-parity.json",
        "--out-dir",
        "docs/reports/live-provider-parity",
        "--json",
      ]),
    ).toMatchObject({
      command: "live-provider-migrate-artifact",
      artifactPath: resolve(process.cwd(), "docs/reports/live-provider-parity.json"),
      outDir: resolve(process.cwd(), "docs/reports/live-provider-parity"),
      json: true,
    })
  })

  it("parses live provider parity artifact verification options", () => {
    expect(
      parseArgs([
        "verify-live-provider-parity",
        "--artifact",
        "docs/reports/live-provider-parity.json",
        "--provider",
        "openrouter",
        "--model",
        "openai/gpt-test",
        "--product",
        "opencode,pi-mono",
        "--max-age-ms",
        "86400000",
        "--json",
      ]),
    ).toMatchObject({
      command: "verify-live-provider-parity",
      artifactPath: resolve(process.cwd(), "docs/reports/live-provider-parity.json"),
      provider: "openrouter",
      modelID: "openai/gpt-test",
      products: ["opencode", "pi-mono"],
      maxAgeMs: 86400000,
      json: true,
    })
  })

  it("parses task parity report, verification, and diff options", () => {
    expect(
      parseArgs([
        "task-parity",
        "--suite",
        "smoke",
        "--task",
        "read-only-answer,single-file-edit",
        "--product",
        "opencode,nanobot",
        "--mode",
        "assembled,original",
        "--provider",
        "cassette",
        "--native-original",
        "--model",
        "claude-test",
        "--api-key",
        "secret",
        "--base-url",
        "https://api.anthropic.test",
        "--package",
        "opencode-ai@1.15.11",
        "--timeout-ms",
        "120000",
        "--external-capture",
        "docs/reports/external-tools/claude-tap/pi-read-only/native-capture.json",
        "--out",
        "docs/reports/task-parity.json",
        "--artifact-format",
        "split",
        "--out-dir",
        "docs/reports/task-parity",
        "--summary-out",
        "docs/reports/task-parity.json",
        "--json",
      ]),
    ).toMatchObject({
      command: "task-parity",
      suite: "smoke",
      taskIDs: ["read-only-answer", "single-file-edit"],
      products: ["opencode", "nanobot"],
      modes: ["assembled", "original"],
      provider: "cassette",
      nativeOriginal: true,
      modelID: "claude-test",
      apiKey: "secret",
      baseURL: "https://api.anthropic.test",
      packageSpec: "opencode-ai@1.15.11",
      timeoutMs: 120000,
      externalCapturePath: resolve(process.cwd(), "docs/reports/external-tools/claude-tap/pi-read-only/native-capture.json"),
      out: resolve(process.cwd(), "docs/reports/task-parity.json"),
      artifactFormat: "split",
      outDir: resolve(process.cwd(), "docs/reports/task-parity"),
      summaryOut: resolve(process.cwd(), "docs/reports/task-parity.json"),
      json: true,
    })
    expect(parseArgs(["task-parity", "--suite", "smoke", "--provider", "fixture", "--json"])).toMatchObject({
      command: "task-parity",
      suite: "smoke",
      provider: "fixture",
      json: true,
    })
    expect(() => parseArgs(["task-parity", "--suite", "smoke", "--provider", "fake", "--json"])).toThrow(
      "task-parity --provider fake is no longer supported",
    )
    expect(parseArgs(["verify-task-parity", "--artifact", "docs/reports/task-parity.json", "--product", "pi", "--mode", "assembled", "--task", "read-only-answer", "--json"])).toMatchObject({
      command: "verify-task-parity",
      artifactPath: resolve(process.cwd(), "docs/reports/task-parity.json"),
      products: ["pi-mono"],
      modes: ["assembled"],
      taskIDs: ["read-only-answer"],
      json: true,
    })
    expect(
      parseArgs([
        "task-parity",
        "diff",
        "--artifact-a",
        "docs/reports/task-parity.json",
        "--artifact-b",
        "docs/reports/task-parity-live.json",
        "--json",
      ]),
    ).toMatchObject({
      command: "task-parity-diff",
      artifactA: resolve(process.cwd(), "docs/reports/task-parity.json"),
      artifactB: resolve(process.cwd(), "docs/reports/task-parity-live.json"),
      json: true,
    })
    expect(
      parseArgs([
        "task-parity",
        "migrate-artifact",
        "--artifact",
        "docs/reports/task-parity.json",
        "--out-dir",
        "docs/reports/task-parity",
        "--json",
      ]),
    ).toMatchObject({
      command: "task-parity-migrate-artifact",
      artifactPath: resolve(process.cwd(), "docs/reports/task-parity.json"),
      outDir: resolve(process.cwd(), "docs/reports/task-parity"),
      json: true,
    })
    expect(
      parseArgs([
        "task-parity",
        "cadence-diagnose",
        "--artifact",
        "docs/reports/task-parity-livecodebench-cadence.json",
        "--out",
        "docs/reports/task-parity-livecodebench-cadence-diagnosis.md",
        "--json",
      ]),
    ).toMatchObject({
      command: "task-parity-cadence-diagnose",
      artifactPath: resolve(process.cwd(), "docs/reports/task-parity-livecodebench-cadence.json"),
      out: resolve(process.cwd(), "docs/reports/task-parity-livecodebench-cadence-diagnosis.md"),
      json: true,
    })
    expect(
      parseArgs([
        "task-parity",
        "native-cadence-fixtures",
        "--artifact",
        "docs/reports/task-parity-livecodebench-cadence.json",
        "--out",
        "docs/reports/task-parity-livecodebench-native-cadence-fixtures.json",
        "--artifact-format",
        "split",
        "--out-dir",
        "docs/reports/task-parity-livecodebench-native-cadence-fixtures",
        "--json",
      ]),
    ).toMatchObject({
      command: "task-parity-native-cadence-fixtures",
      artifactPath: resolve(process.cwd(), "docs/reports/task-parity-livecodebench-cadence.json"),
      out: resolve(process.cwd(), "docs/reports/task-parity-livecodebench-native-cadence-fixtures.json"),
      artifactFormat: "split",
      outDir: resolve(process.cwd(), "docs/reports/task-parity-livecodebench-native-cadence-fixtures"),
      json: true,
    })
    expect(
      parseArgs([
        "task-parity",
        "replay-native-cadence",
        "--fixture",
        "docs/reports/task-parity-livecodebench-native-cadence-fixtures.json",
        "--out",
        "docs/reports/task-parity-livecodebench-native-cadence-replay.json",
        "--json",
      ]),
    ).toMatchObject({
      command: "task-parity-replay-native-cadence",
      fixturePath: resolve(process.cwd(), "docs/reports/task-parity-livecodebench-native-cadence-fixtures.json"),
      out: resolve(process.cwd(), "docs/reports/task-parity-livecodebench-native-cadence-replay.json"),
      json: true,
    })
  })

  it("replays native cadence fixtures through the CLI into a reusable artifact", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-cli-native-cadence-replay-"))
    try {
      const taskArtifact = await runProductTaskParitySuite({
        taskIDs: ["read-only-answer"],
        products: ["opencode"],
        modes: ["assembled", "original"],
        provider: "cassette",
      })
      const fixtureSet = createProductTaskNativeCadenceFixtureSet({ artifact: taskArtifact })
      const split = createProductTaskNativeCadenceFixtureSplitSet({ fixtureSet, generatedAt: new Date("2026-06-10T00:00:00.000Z") })
      writeProductTaskNativeCadenceFixtureSplitSet({ outDir: dir, fixtureSet: split })

      const out = join(dir, "native-cadence-replay.json")
      const stdout: string[] = []
      const stderr: string[] = []
      const io = {
        stdout: {
          write(chunk: string) {
            stdout.push(chunk)
            return true
          },
        },
        stderr: {
          write(chunk: string) {
            stderr.push(chunk)
            return true
          },
        },
      }

      expect(await runCli(["task-parity", "replay-native-cadence", "--fixture", join(dir, "summary.json"), "--out", out, "--json"], io)).toBe(0)
      const replayArtifact = JSON.parse(readFileSync(out, "utf8")) as {
        schemaVersion?: number
        artifactKind?: string
        sourceFixturePath?: string
        verification?: { ok?: boolean }
        replays?: Array<{ product?: string; taskID?: string; cadenceSignature?: { costShape?: { providerRequests?: number } }; projectionLosses?: unknown[] }>
        summary?: { fixtures?: number; products?: string[]; tasks?: string[]; providerRequests?: number; projectionLosses?: number; fingerprint?: string }
      }
      const stdoutArtifact = JSON.parse(stdout.join("")) as typeof replayArtifact

      expect(replayArtifact).toMatchObject({
        schemaVersion: 1,
        artifactKind: "native-cadence-fixture-replay",
        sourceFixturePath: expect.stringContaining("summary.json"),
        verification: { ok: true },
        summary: {
          fixtures: 1,
          products: ["opencode"],
          tasks: ["read-only-answer"],
        },
      })
      expect(replayArtifact.summary?.fingerprint).toMatch(/^[a-f0-9]{16}$/)
      expect(replayArtifact.summary?.providerRequests).toBe(replayArtifact.replays?.[0]?.cadenceSignature?.costShape?.providerRequests)
      expect(replayArtifact.summary?.projectionLosses).toBe(replayArtifact.replays?.[0]?.projectionLosses?.length)
      expect(stdoutArtifact.summary?.fingerprint).toBe(replayArtifact.summary?.fingerprint)
      expect(JSON.stringify(replayArtifact)).not.toMatch(/"(apiKey|authorization|rawPrompt|providerRequest|toolArgs)"/)
      expect(stderr.join("")).toBe("")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("parses OpenCode differential report options", () => {
    expect(
      parseArgs([
        "differential",
        "opencode",
        "--native-original",
        "--model",
        "claude-test",
        "--api-key",
        "secret",
        "--base-url",
        "https://api.anthropic.test",
        "--package",
        "opencode-ai@1.15.11",
        "--prompt",
        "Reply with exactly: custom-ok",
        "--assistant",
        "custom-ok",
        "--json",
      ]),
    ).toMatchObject({
      command: "harness-differential",
      product: "opencode",
      nativeOriginal: true,
      modelID: "claude-test",
      apiKey: "secret",
      baseURL: "https://api.anthropic.test",
      packageSpec: "opencode-ai@1.15.11",
      prompt: "Reply with exactly: custom-ok",
      assistantText: "custom-ok",
      json: true,
    })
    expect(parseArgs(["differential", "pi", "--json"])).toMatchObject({
      command: "harness-differential",
      product: "pi-mono",
      json: true,
    })
    expect(parseArgs(["differential", "nanobot", "--json"])).toMatchObject({
      command: "harness-differential",
      product: "nanobot",
      json: true,
    })
    expect(
      parseArgs([
        "differential",
        "pi-mono",
        "--native-original",
        "--model",
        "claude-test",
        "--api-key",
        "secret",
        "--base-url",
        "https://api.anthropic.test",
        "--package",
        "@earendil-works/pi-coding-agent@0.75.5",
        "--json",
      ]),
    ).toMatchObject({
      command: "harness-differential",
      product: "pi-mono",
      nativeOriginal: true,
      modelID: "claude-test",
      apiKey: "secret",
      baseURL: "https://api.anthropic.test",
      packageSpec: "@earendil-works/pi-coding-agent@0.75.5",
      json: true,
    })
    expect(parseArgs(["nanobot", "lego-depth", "--out", "docs/reports/nanobot-lego-depth.json", "--markdown", "docs/reports/nanobot-lego-depth.md", "--json"])).toMatchObject({
      command: "nanobot-lego-depth",
      out: resolve(process.cwd(), "docs/reports/nanobot-lego-depth.json"),
      markdown: resolve(process.cwd(), "docs/reports/nanobot-lego-depth.md"),
      json: true,
    })
  })

  it("parses recipe inspection commands", () => {
    expect(parseArgs(["inspect", "recipe", "opencode.full", "--json"])).toMatchObject({
      command: "recipe-inspect",
      recipeID: "opencode.full",
      json: true,
    })
    expect(parseArgs(["graph", "recipe", "pi-mono.full"])).toMatchObject({
      command: "recipe-graph",
      recipeID: "pi-mono.full",
      json: false,
    })
    expect(parseArgs(["diff", "recipe", "opencode.full", "pi-mono.full", "--json"])).toMatchObject({
      command: "recipe-diff",
      leftRecipeID: "opencode.full",
      rightRecipeID: "pi-mono.full",
      json: true,
    })
    expect(parseArgs(["compose", "--recipe", "opencode.full", "--override", "session.store=session.store.memory", "--json"])).toMatchObject({
      command: "recipe-compose",
      recipeID: "opencode.full",
      overrides: [{ port: "session.store", module: "session.store.memory" }],
      json: true,
    })
    expect(parseArgs(["validate", "recipe-file", "docs/site/harness-builder-export.json", "--json"])).toMatchObject({
      command: "recipe-validate-file",
      recipeFilePath: resolve(process.cwd(), "docs/site/harness-builder-export.json"),
      json: true,
    })
    expect(parseArgs(["graph", "recipe-file", "docs/site/harness-builder-export.json", "--json"])).toMatchObject({
      command: "recipe-graph-file",
      recipeFilePath: resolve(process.cwd(), "docs/site/harness-builder-export.json"),
      json: true,
    })
  })

  it("parses assembly contract commands", () => {
    expect(
      parseArgs([
        "assemble",
        "--recipe-file",
        "docs/site/harness-builder-export.json",
        "--explain",
        "--json",
      ]),
    ).toMatchObject({
      command: "assemble",
      recipeFilePath: resolve(process.cwd(), "docs/site/harness-builder-export.json"),
      explain: true,
      json: true,
    })
    expect(
      parseArgs([
        "assemble",
        "--product",
        "opencode,pi,nanobot,minimal",
        "--explain",
        "--with-task-parity",
        "docs/reports/task-parity.json",
        "--with-native-fixtures",
        "docs/reports/task-parity-livecodebench-native-cadence-fixtures.json",
        "--out-dir",
        "docs/reports",
        "--strict",
        "--json",
      ]),
    ).toMatchObject({
      command: "assemble",
      products: ["opencode", "pi-mono", "nanobot", "minimal"],
      explain: true,
      taskParityArtifactPath: resolve(process.cwd(), "docs/reports/task-parity.json"),
      nativeFixturePath: resolve(process.cwd(), "docs/reports/task-parity-livecodebench-native-cadence-fixtures.json"),
      outDir: resolve(process.cwd(), "docs/reports"),
      requireTaskParity: true,
      requireNativeFixtures: true,
      strict: true,
      json: true,
    })
    expect(parseArgs(["verify-assembly-contract", "--artifact", "docs/reports/assembly-contract-opencode.json", "--require-task-parity", "--require-native-fixtures", "--json"])).toMatchObject({
      command: "verify-assembly-contract",
      artifactPath: resolve(process.cwd(), "docs/reports/assembly-contract-opencode.json"),
      requireTaskParity: true,
      requireNativeFixtures: true,
      json: true,
    })
    expect(parseArgs(["flow-graph", "reports", "--product", "opencode,minimal", "--task", "read-only-answer", "--out-dir", "docs/reports", "--json"])).toMatchObject({
      command: "flow-graph-reports",
      products: ["opencode", "minimal"],
      taskID: "read-only-answer",
      outDir: resolve(process.cwd(), "docs/reports"),
      json: true,
    })
    expect(parseArgs(["flow-graph", "--product", "hermes-agent", "--mode", "native", "--artifact", "docs/reports/task-parity-native-cadence-fixtures/manifest.json", "--json"])).toMatchObject({
      command: "flow-graph",
      product: "hermes-agent",
      mode: "native",
      artifactPath: resolve(process.cwd(), "docs/reports/task-parity-native-cadence-fixtures/manifest.json"),
      json: true,
    })
    expect(parseArgs(["flow-graph", "--recipe-file", "custom-opencode.json", "--mode", "blueprint", "--out", "docs/reports/flow-graph-custom-opencode.json", "--json"])).toMatchObject({
      command: "flow-graph",
      recipeFilePath: resolve(process.cwd(), "custom-opencode.json"),
      mode: "blueprint",
      out: resolve(process.cwd(), "docs/reports/flow-graph-custom-opencode.json"),
      json: true,
    })
    expect(() => parseArgs(["flow-graph", "--recipe-file", "custom-opencode.json", "--mode", "compare"])).toThrow("flow-graph --recipe-file currently supports --mode blueprint.")
  })

  it("parses installed profile, channel, and gateway commands", () => {
    expect(
      parseArgs([
        "profile",
        "install",
        "--name",
        "my-harness",
        "--recipe-file",
        "recipe.json",
        "--root-dir",
        "profiles",
        "--json",
      ]),
    ).toMatchObject({
      command: "profile-install",
      name: "my-harness",
      recipeFilePath: resolve(process.cwd(), "recipe.json"),
      rootDir: resolve(process.cwd(), "profiles"),
      json: true,
    })
    expect(() => parseArgs(["profile", "configure-provider", "my-harness", "--provider", "fake", "--root-dir", "profiles", "--json"])).toThrow(
      "profile configure-provider no longer supports --provider fake",
    )
    expect(() => parseArgs(["channel", "add", "my-harness", "telegram", "--mode", "fake", "--root-dir", "profiles", "--json"])).toThrow(
      "Telegram gateway mode fake is no longer supported",
    )
    expect(parseArgs([
      "channel",
      "add",
      "my-harness",
      "telegram",
      "--mode",
      "polling",
      "--bot-token-env",
      "TELEGRAM_BOT_TOKEN",
      "--allowed-chat",
      "chat-1,chat-2",
      "--allowed-user",
      "user-1",
      "--root-dir",
      "profiles",
      "--json",
    ])).toMatchObject({
      command: "channel-add-telegram",
      name: "my-harness",
      mode: "polling",
      botTokenEnv: "TELEGRAM_BOT_TOKEN",
      allowedChatIDs: ["chat-1", "chat-2"],
      allowedUserIDs: ["user-1"],
      rootDir: resolve(process.cwd(), "profiles"),
      json: true,
    })
    expect(parseArgs(["gateway", "smoke-local", "my-harness", "--channel", "telegram", "--text", "hello", "--root-dir", "profiles", "--json"])).toMatchObject({
      command: "gateway-smoke-local",
      name: "my-harness",
      channel: "telegram",
      text: "hello",
      live: false,
      rootDir: resolve(process.cwd(), "profiles"),
      json: true,
    })
    expect(parseArgs(["gateway", "smoke", "my-harness", "--chat-id", "chat-1", "--root-dir", "profiles", "--json"])).toMatchObject({
      command: "gateway-smoke",
      name: "my-harness",
      channel: "telegram",
      chatID: "chat-1",
      live: true,
      rootDir: resolve(process.cwd(), "profiles"),
      json: true,
    })
    expect(parseArgs(["gateway", "restart", "my-harness", "--root-dir", "profiles", "--json"])).toMatchObject({
      command: "gateway-restart",
      name: "my-harness",
      channel: "telegram",
      rootDir: resolve(process.cwd(), "profiles"),
      json: true,
    })
    expect(parseArgs(["gateway", "manifests", "my-harness", "--root-dir", "profiles", "--json"])).toMatchObject({
      command: "gateway-manifests",
      name: "my-harness",
      channel: "telegram",
      rootDir: resolve(process.cwd(), "profiles"),
      json: true,
    })
    expect(() => parseArgs(["tui", "--recipe-file", "recipe.json", "--provider", "fake", "--text", "hello", "--json"])).toThrow(
      'Expected TUI provider to be "profile-live"',
    )
    expect(parseArgs(["tui", "--recipe-file", "recipe.json", "--provider", "profile-live", "--text", "hello", "--json"])).toMatchObject({
      command: "tui",
      recipeFilePath: resolve(process.cwd(), "recipe.json"),
      providerMode: "profile-live",
      text: "hello",
      json: true,
    })
    expect(parseArgs(["tui", "--profile", "my-harness", "--provider", "profile-live", "--root-dir", "profiles", "--json"])).toMatchObject({
      command: "tui",
      profileName: "my-harness",
      providerMode: "profile-live",
      rootDir: resolve(process.cwd(), "profiles"),
      json: true,
    })
  })

  it("keeps interactive TUI stdin queued across multiple turns", async () => {
    const stdout: string[] = []
    const stderr: string[] = []
    const capture = (chunks: string[]) => new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk))
        callback()
      },
    })
    const summary = await runHarnessTui({
      recipe: codingAgentMinimalRecipe,
      stdin: Readable.from(["hello\nsecond\n/exit\n"]),
      stdout: capture(stdout),
      stderr: capture(stderr),
      env: { ...process.env, HELIX_DISABLE_LIVE_PROVIDER: "1" },
    })

    const errorText = stderr.join("")
    expect(summary.ok).toBe(false)
    expect(errorText.match(/Live provider is not configured/g)?.length).toBe(2)
    expect(`${stdout.join("")}\n${errorText}`).not.toContain("readline was closed")
  })

  it("writes redacted runtime traces for Builder TUI test turns", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-cli-tui-trace-"))
    const storageDir = join(dir, "storage")
    try {
      await withLocalOpenAICompatibleProvider("I am OpenCode.", async (baseURL, providerRequests) => {
        const stdout: string[] = []
        const stderr: string[] = []
        const capture = (chunks: string[]) => new Writable({
          write(chunk, _encoding, callback) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk))
            callback()
          },
        })
        const summary = await runHarnessTui({
          recipe: opencodeRecipe,
          text: "who are you",
          json: true,
          stdout: capture(stdout),
          stderr: capture(stderr),
          storageDir,
          cwd: dir,
          env: {
            ...process.env,
            HELIX_LIVE_PROVIDER: "openai-compatible",
            HELIX_LIVE_MODEL: "tui-trace-test-model",
            HELIX_LIVE_BASE_URL: baseURL,
            HELIX_TUI_TRACE_SOURCE: "builder-test-session",
            OPENAI_API_KEY: "local-test-key",
          },
        })

        expect(summary.ok).toBe(true)
        expect(stderr.join("")).toBe("")
        expect(summary.turns[0]?.assistantText).toContain("I am OpenCode.")
        expect(JSON.stringify(summary)).not.toMatch(/Helix/)
        expect(summary.turns[0]?.runtimeTrace.source).toBe("builder-test-session")
        expect(summary.turns[0]?.runtimeTrace.events.map((event) => event.type)).toEqual(expect.arrayContaining(["input", "provider.request.before", "message.end"]))
        expect(summary.turns[0]?.runtimeTrace.summary.fingerprint).toMatch(/^[a-f0-9]{16}$/)
        expect(summary.turns[0]?.runtimeTrace.registrySnapshot.tools.map((tool) => tool.name)).toEqual(expect.arrayContaining(["skill"]))
        const providerRequest = providerRequests[0]?.json as { model?: unknown; messages?: Array<{ role?: unknown; content?: unknown }> } | undefined
        const systemText = (providerRequest?.messages ?? [])
          .filter((message) => message.role === "system")
          .map((message) => typeof message.content === "string" ? message.content : JSON.stringify(message.content))
          .join("\n")
        expect(providerRequest?.model).toBe("tui-trace-test-model")
        expect(systemText).toContain("You are opencode")
        expect(systemText).not.toMatch(/Helix/)

        const tracePath = join(storageDir, "runtime-traces.jsonl")
        expect(existsSync(tracePath)).toBe(true)
        const traceRecords = readFileSync(tracePath, "utf8").trim().split(/\r?\n/).map((line) => JSON.parse(line) as {
          inputLength?: number
          inputFingerprint?: string
          runtimeTrace?: { source?: string; summary?: { events?: number; fingerprint?: string } }
        })
        expect(traceRecords).toHaveLength(1)
        expect(traceRecords[0]).toMatchObject({
          inputLength: "who are you".length,
          inputFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
          runtimeTrace: {
            source: "builder-test-session",
            summary: {
              events: expect.any(Number),
              fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
            },
          },
        })
        const serialized = readFileSync(tracePath, "utf8")
        expect(serialized).not.toContain("builder tui trace secret")
        expect(serialized).not.toContain("local-test-key")
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("sends product identity prompts through provider-backed TUI turns", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-cli-tui-identity-"))
    try {
      await withLocalOpenAICompatibleProvider("identity ok", async (baseURL, providerRequests) => {
        const cases = [
          { recipe: opencodeRecipe, marker: "You are opencode" },
          { recipe: piMonoRecipe, marker: "You are actually not Claude, you are Pi" },
          { recipe: nanobotRecipe, marker: "I am nanobot" },
          { recipe: hermesAgentRecipe, marker: "You are Hermes Agent" },
        ]
        for (const item of cases) {
          const before = providerRequests.length
          const stdout: string[] = []
          const stderr: string[] = []
          const capture = (chunks: string[]) => new Writable({
            write(chunk, _encoding, callback) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk))
              callback()
            },
          })
          const summary = await runHarnessTui({
            recipe: item.recipe,
            text: "who are you",
            json: true,
            stdout: capture(stdout),
            stderr: capture(stderr),
            cwd: dir,
            storageDir: join(dir, item.recipe.id),
            env: {
              ...process.env,
              HELIX_LIVE_PROVIDER: "openai-compatible",
              HELIX_LIVE_MODEL: "tui-identity-test-model",
              HELIX_LIVE_BASE_URL: baseURL,
              OPENAI_API_KEY: "local-test-key",
            },
          })
          const providerRequest = providerRequests[before]?.json as { messages?: Array<{ role?: unknown; content?: unknown }> } | undefined
          const systemText = (providerRequest?.messages ?? [])
            .filter((message) => message.role === "system")
            .map((message) => typeof message.content === "string" ? message.content : JSON.stringify(message.content))
            .join("\n")

          expect(summary.ok).toBe(true)
          expect(stderr.join("")).toBe("")
          expect(systemText).toContain(item.marker)
          expect(systemText).not.toMatch(/Helix/)
          expect(JSON.stringify(summary)).not.toMatch(/Helix/)
        }
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("installs, configures, and smokes an installed harness profile through the CLI", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-cli-profile-"))
    const rootDir = join(dir, "profiles")
    const recipeFile = join(dir, "minimal-recipe.json")
    const previousProviderKey = process.env["CLI_PROVIDER_KEY"]
    const stdout: string[] = []
    const stderr: string[] = []
    const io = {
      stdout: {
        write(chunk: string) {
          stdout.push(chunk)
          return true
        },
      },
      stderr: {
        write(chunk: string) {
          stderr.push(chunk)
          return true
        },
      },
    }
    try {
      writeFileSync(recipeFile, JSON.stringify(codingAgentMinimalRecipe), "utf8")

      expect(await runCli(["profile", "install", "--name", "cli-harness", "--recipe-file", recipeFile, "--root-dir", rootDir, "--json"], io)).toBe(0)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        profile: { name: "cli-harness" },
        validation: { ok: false, missing: expect.arrayContaining(["provider", "telegram"]) },
      })

      stdout.length = 0
      stderr.length = 0
      expect(await runCli(["tui", "--profile", "cli-harness", "--root-dir", rootDir, "--text", "hello", "--json"], io)).toBe(1)
      expect(stderr.join("")).toContain("Profile live provider is required")

      expect(await runCli(["profile", "configure-provider", "cli-harness", "--provider", "fake", "--root-dir", rootDir, "--json"], io)).toBe(2)
      expect(stderr.join("")).toContain("profile configure-provider no longer supports --provider fake")

      process.env["CLI_PROVIDER_KEY"] = "secret-token"
      stdout.length = 0
      stderr.length = 0
      expect(await runCli(["profile", "configure-provider", "cli-harness", "--provider", "openai-compatible", "--model", "cli-test-model", "--api-key-env", "CLI_PROVIDER_KEY", "--root-dir", rootDir, "--json"], io)).toBe(0)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        provider: { kind: "openai-compatible", modelID: "cli-test-model", apiKeyEnv: "CLI_PROVIDER_KEY", hasAPIKey: true },
        validation: { ok: false, missing: expect.arrayContaining(["telegram"]) },
      })

      stdout.length = 0
      stderr.length = 0
      expect(await runCli(["channel", "add", "cli-harness", "telegram", "--mode", "fake", "--root-dir", rootDir, "--json"], io)).toBe(2)
      expect(stderr.join("")).toContain("Telegram gateway mode fake is no longer supported")

      process.env["CLI_TELEGRAM_TOKEN"] = "telegram-token"
      stdout.length = 0
      stderr.length = 0
      expect(
        await runCli(
          [
            "channel",
            "add",
            "cli-harness",
            "telegram",
            "--mode",
            "polling",
            "--bot-token-env",
            "CLI_TELEGRAM_TOKEN",
            "--allowed-chat",
            "chat-1",
            "--root-dir",
            rootDir,
            "--json",
          ],
          io,
        ),
      ).toBe(0)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        telegram: { mode: "polling", botTokenEnv: "CLI_TELEGRAM_TOKEN", allowedChatIDs: ["chat-1"] },
        validation: { ok: true },
      })
      expect(stdout.join("")).not.toContain("secret-token")

      stdout.length = 0
      expect(await runCli(["gateway", "smoke-local", "cli-harness", "--channel", "telegram", "--text", "/status", "--chat-id", "chat-1", "--root-dir", rootDir, "--json"], io)).toBe(0)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: true,
        profile: "cli-harness",
        source: "local-fixture",
        dispatch: { text: expect.stringContaining("Profile cli-harness") },
        sentMessages: [expect.objectContaining({ chatID: "chat-1", text: expect.stringContaining("Profile cli-harness") })],
      })

      stdout.length = 0
      expect(await runCli(["profile", "status", "cli-harness", "--root-dir", rootDir, "--json"], io)).toBe(0)
      expect(JSON.parse(stdout.join(""))).toMatchObject({ profile: { name: "cli-harness" }, validation: { ok: true } })

      stdout.length = 0
      expect(await runCli(["profile", "list", "--root-dir", rootDir, "--json"], io)).toBe(0)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        profiles: [expect.objectContaining({ profile: expect.objectContaining({ name: "cli-harness" }) })],
      })

      stdout.length = 0
      expect(await runCli(["profile", "remove", "cli-harness", "--root-dir", rootDir, "--json"], io)).toBe(0)
      expect(JSON.parse(stdout.join(""))).toMatchObject({ ok: true, name: "cli-harness", purge: false })

      stdout.length = 0
      expect(await runCli(["profile", "list", "--root-dir", rootDir, "--json"], io)).toBe(0)
      expect(JSON.parse(stdout.join(""))).toMatchObject({ profiles: [] })
      expect(stderr.join("")).toBe("")
    } finally {
      if (previousProviderKey === undefined) delete process.env["CLI_PROVIDER_KEY"]
      else process.env["CLI_PROVIDER_KEY"] = previousProviderKey
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("exposes recipe graph, diff, and validation dry-run commands", async () => {
    const stdout: string[] = []
    const stderr: string[] = []
    const code = await runCli(["graph", "recipe", "opencode.full", "--json"], {
      stdout: {
        write(chunk: string) {
          stdout.push(chunk)
          return true
        },
      },
      stderr: {
        write(chunk: string) {
          stderr.push(chunk)
          return true
        },
      },
    })
    const graph = JSON.parse(stdout.join("")) as { id: string; graph: Array<{ id: string }>; bindings: Array<{ provider: string }> }

    expect(code).toBe(0)
    expect(stderr.join("")).toBe("")
    expect(graph.id).toBe("opencode")
    expect(graph.graph.map((module) => module.id)).toContain("opencode.product-shell.sdk")
    expect(graph.bindings).toEqual(expect.arrayContaining([expect.objectContaining({ provider: "opencode.turn.tool-executor" })]))

    stdout.length = 0
    const minimalGraphCode = await runCli(["graph", "recipe", "coding-agent.minimal", "--json"], {
      stdout: {
        write(chunk: string) {
          stdout.push(chunk)
          return true
        },
      },
      stderr: {
        write(chunk: string) {
          stderr.push(chunk)
          return true
        },
      },
    })
    expect(minimalGraphCode).toBe(0)
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      id: "coding-agent.minimal",
      graph: expect.arrayContaining([expect.objectContaining({ id: "product.shell.minimal-cli" })]),
      bindings: expect.arrayContaining([
        expect.objectContaining({ capability: expect.objectContaining({ id: "session.message-store" }), provider: "session.message-store.memory" }),
      ]),
    })

    stdout.length = 0
    const validateCode = await runCli(["validate", "recipe", "pi-mono.full", "--json"], {
      stdout: {
        write(chunk: string) {
          stdout.push(chunk)
          return true
        },
      },
      stderr: {
        write(chunk: string) {
          stderr.push(chunk)
          return true
        },
      },
    })
    expect(validateCode).toBe(0)
    expect(JSON.parse(stdout.join(""))).toMatchObject({ ok: true, id: "pi-mono", modules: expect.any(Number), bindings: expect.any(Number) })

    stdout.length = 0
    const nanobotValidateCode = await runCli(["validate", "recipe", "nanobot.full", "--json"], {
      stdout: {
        write(chunk: string) {
          stdout.push(chunk)
          return true
        },
      },
      stderr: {
        write(chunk: string) {
          stderr.push(chunk)
          return true
        },
      },
    })
    expect(nanobotValidateCode).toBe(0)
    expect(JSON.parse(stdout.join(""))).toMatchObject({ ok: true, id: "nanobot", modules: expect.any(Number), bindings: expect.any(Number) })

    stdout.length = 0
    const recipeFileRoot = mkdtempSync(join(tmpdir(), "helix-builder-recipe-"))
    try {
      const recipeFile = join(recipeFileRoot, "custom-minimal.json")
      writeFileSync(
        recipeFile,
        JSON.stringify({
          id: "custom.minimal",
          version: "0.1.0",
          modules: [],
          atoms: [{ id: "session.store.memory" }],
          bundles: [{ id: "bundle.session.memory" }],
          productShells: [],
          bindings: [
            { port: "session.store", module: "session.store.memory" },
          ],
          requiredCapabilities: ["session.store"],
          personalities: ["common"],
        }),
        "utf8",
      )
      const validateFileCode = await runCli(["validate", "recipe-file", recipeFile, "--json"], {
        stdout: {
          write(chunk: string) {
            stdout.push(chunk)
            return true
          },
        },
        stderr: {
          write(chunk: string) {
            stderr.push(chunk)
            return true
          },
        },
      })
      expect(validateFileCode).toBe(0)
      expect(JSON.parse(stdout.join(""))).toMatchObject({ ok: true, id: "custom.minimal", source: recipeFile })

      stdout.length = 0
      const graphFileCode = await runCli(["graph", "recipe-file", recipeFile, "--json"], {
        stdout: {
          write(chunk: string) {
            stdout.push(chunk)
            return true
          },
        },
        stderr: {
          write(chunk: string) {
            stderr.push(chunk)
            return true
          },
        },
      })
      expect(graphFileCode).toBe(0)
      expect(JSON.parse(stdout.join(""))).toMatchObject({ id: "custom.minimal", source: recipeFile, graph: expect.any(Array) })

      stdout.length = 0
      const assembleFileCode = await runCli(["assemble", "--recipe-file", recipeFile, "--explain", "--json"], {
        stdout: {
          write(chunk: string) {
            stdout.push(chunk)
            return true
          },
        },
        stderr: {
          write(chunk: string) {
            stderr.push(chunk)
            return true
          },
        },
      })
      expect(assembleFileCode).toBe(0)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        contract: { recipeID: "custom.minimal" },
        verification: { ok: true },
      })
    } finally {
      rmSync(recipeFileRoot, { recursive: true, force: true })
    }

    stdout.length = 0
    const diffCode = await runCli(["diff", "recipe", "opencode.full", "pi-mono.full", "--json"], {
      stdout: {
        write(chunk: string) {
          stdout.push(chunk)
          return true
        },
      },
      stderr: {
        write(chunk: string) {
          stderr.push(chunk)
          return true
        },
      },
    })
    expect(diffCode).toBe(0)
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      left: "opencode",
      right: "pi-mono",
      leftOnlyModules: expect.arrayContaining([expect.objectContaining({ id: "opencode.product-shell.sdk" })]),
      rightOnlyModules: expect.arrayContaining([expect.objectContaining({ id: "pi.product-shell.sdk" })]),
      changedBindings: expect.arrayContaining([
        expect.objectContaining({ port: "session.store", leftProviders: ["opencode.session.store.sqlite-projection"], rightProviders: ["pi.session.store.jsonl-v3"] }),
      ]),
      changedStrategies: expect.arrayContaining([expect.objectContaining({ id: "turn.context-builder" })]),
      changedPolicies: expect.arrayContaining([expect.objectContaining({ id: "shell.execution" })]),
    })

    stdout.length = 0
    const swapValidateCode = await runCli(["validate", "recipe", "minimal.no-shell", "--json"], {
      stdout: {
        write(chunk: string) {
          stdout.push(chunk)
          return true
        },
      },
      stderr: {
        write(chunk: string) {
          stderr.push(chunk)
          return true
        },
      },
    })
    expect(swapValidateCode).toBe(0)
    expect(JSON.parse(stdout.join(""))).toMatchObject({ ok: true, id: "minimal.no-shell", modules: expect.any(Number) })

    stdout.length = 0
    const composeCode = await runCli(["compose", "--recipe", "opencode.full", "--override", "session.store=session.store.memory", "--json"], {
      stdout: {
        write(chunk: string) {
          stdout.push(chunk)
          return true
        },
      },
      stderr: {
        write(chunk: string) {
          stderr.push(chunk)
          return true
        },
      },
    })
    expect(composeCode).toBe(0)
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      id: "opencode",
      overrides: [{ port: "session.store", module: "session.store.memory" }],
      bindings: expect.arrayContaining([expect.objectContaining({ capability: expect.objectContaining({ id: "session.store" }), provider: "session.store.memory" })]),
    })

    stdout.length = 0
    const assembleCode = await runCli(["assemble", "--product", "opencode", "--explain", "--json"], {
      stdout: {
        write(chunk: string) {
          stdout.push(chunk)
          return true
        },
      },
      stderr: {
        write(chunk: string) {
          stderr.push(chunk)
          return true
        },
      },
    })
    expect(assembleCode).toBe(0)
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      contract: {
        product: "opencode",
        atoms: expect.arrayContaining([expect.objectContaining({ id: "opencode.product-shell.sdk" })]),
        swapPoints: expect.arrayContaining([expect.objectContaining({ port: "session.store" })]),
      },
      verification: { ok: true },
    })

    stdout.length = 0
    const differentialCode = await runCli(["differential", "opencode", "--json"], {
      stdout: {
        write(chunk: string) {
          stdout.push(chunk)
          return true
        },
      },
      stderr: {
        write(chunk: string) {
          stderr.push(chunk)
          return true
        },
      },
    })
    expect(differentialCode).toBe(0)
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      ok: true,
      parityOK: true,
      product: "opencode",
      status: "matched",
      gaps: [],
    })

    stdout.length = 0
    const piDifferentialCode = await runCli(["differential", "pi-mono", "--json"], {
      stdout: {
        write(chunk: string) {
          stdout.push(chunk)
          return true
        },
      },
      stderr: {
        write(chunk: string) {
          stderr.push(chunk)
          return true
        },
      },
    })
    expect(piDifferentialCode).toBe(0)
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      ok: true,
      parityOK: true,
      product: "pi-mono",
      status: "matched",
      gaps: [],
    })

    stdout.length = 0
    const nanobotDifferentialCode = await runCli(["differential", "nanobot", "--json"], {
      stdout: {
        write(chunk: string) {
          stdout.push(chunk)
          return true
        },
      },
      stderr: {
        write(chunk: string) {
          stderr.push(chunk)
          return true
        },
      },
    })
    expect(nanobotDifferentialCode).toBe(0)
    expect(JSON.parse(stdout.join(""))).toMatchObject({
      ok: true,
      parityOK: true,
      product: "nanobot",
      status: "matched",
      gaps: [],
    })
  })

  it("runs an OpenCode recipe with native JSON event output", async () => {
    const stdout: string[] = []
    const stderr: string[] = []
    await withLocalOpenAICompatibleProvider("running", async (baseURL) => {
      const code = await runCli(["run", "opencode", "--provider", "openai-compatible", "--model", "cli-local-model", "--api-key", "local-test-key", "--base-url", baseURL, "--prompt", "hello", "--native-json-events"], {
        stdout: {
          write(chunk: string) {
            stdout.push(chunk)
            return true
          },
        },
        stderr: {
          write(chunk: string) {
            stderr.push(chunk)
            return true
          },
        },
      })
      const lines = stdout.join("").trim().split(/\r?\n/)
      const event = JSON.parse(lines[0] ?? "{}") as { type: string; sessionID?: string; part?: { type?: string } }
      const textEvent = JSON.parse(lines[1] ?? "{}") as { type: string; part?: { type?: string; text?: string } }

      expect(code).toBe(0)
      expect(stderr.join("")).toBe("")
      expect(event).toMatchObject({
        type: "step_start",
        sessionID: expect.any(String),
        part: { type: "step-start" },
      })
      expect(textEvent).toMatchObject({
        type: "text",
        part: { type: "text", text: "running" },
      })
    })
  })

  it("writes, verifies, and diffs a task parity artifact through the CLI", async () => {
    const cwd = mkdtempSync(resolve(tmpdir(), "helix-cli-task-parity-"))
    const out = resolve(cwd, "task-parity.json")
    const stdout: string[] = []
    const stderr: string[] = []
    try {
      const code = await runCli(
        [
          "task-parity",
          "--task",
          "read-only-answer",
          "--product",
          "opencode",
          "--mode",
          "assembled,original",
          "--provider",
          "cassette",
          "--out",
          out,
          "--json",
        ],
        {
          stdout: {
            write(chunk: string) {
              stdout.push(chunk)
              return true
            },
          },
          stderr: {
            write(chunk: string) {
              stderr.push(chunk)
              return true
            },
          },
        },
      )
      const artifact = JSON.parse(stdout.join("")) as { summary: { reports: number; gapsFound: number; failed: number }; pairs: Array<{ status: string }> }

      expect(code).toBe(0)
      expect(stderr.join("")).toBe("")
      expect(existsSync(out)).toBe(true)
      expect(artifact.summary).toMatchObject({ reports: 2, gapsFound: 0, failed: 0 })
      expect(artifact.pairs).toEqual([expect.objectContaining({ status: "matched" })])
      expect(readFileSync(out, "utf8")).not.toMatch(/bearer\s+[a-z0-9._-]{12,}|secret-token|\bsk-[a-z0-9]/i)

      stdout.length = 0
      const verifyCode = await runCli(["verify-task-parity", "--artifact", out, "--product", "opencode", "--mode", "assembled,original", "--json"], {
        stdout: {
          write(chunk: string) {
            stdout.push(chunk)
            return true
          },
        },
        stderr: {
          write(chunk: string) {
            stderr.push(chunk)
            return true
          },
        },
      })
      expect(verifyCode).toBe(0)
      expect(JSON.parse(stdout.join(""))).toMatchObject({ ok: true, issues: [] })

      stdout.length = 0
      const diffCode = await runCli(["task-parity", "diff", "--artifact-a", out, "--artifact-b", out, "--json"], {
        stdout: {
          write(chunk: string) {
            stdout.push(chunk)
            return true
          },
        },
        stderr: {
          write(chunk: string) {
            stderr.push(chunk)
            return true
          },
        },
      })
      expect(diffCode).toBe(0)
      expect(JSON.parse(stdout.join(""))).toEqual({ ok: true, changed: [] })
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("writes a skipped live provider parity report without leaking credentials", async () => {
    const cwd = mkdtempSync(resolve(tmpdir(), "helix-cli-live-provider-"))
    const out = resolve(cwd, "live-provider-parity.json")
    const stdout: string[] = []
    const stderr: string[] = []
    const saved = {
      HELIX_LIVE_MODEL: process.env["HELIX_LIVE_MODEL"],
      OPENROUTER_MODEL: process.env["OPENROUTER_MODEL"],
      OPENROUTER_API_KEY: process.env["OPENROUTER_API_KEY"],
    }
    delete process.env["HELIX_LIVE_MODEL"]
    delete process.env["OPENROUTER_MODEL"]
    delete process.env["OPENROUTER_API_KEY"]
    try {
      const code = await runCli(["live-provider-parity", "--provider", "openrouter", "--out", out, "--json"], {
        stdout: {
          write(chunk: string) {
            stdout.push(chunk)
            return true
          },
        },
        stderr: {
          write(chunk: string) {
            stderr.push(chunk)
            return true
          },
        },
      })
      const artifact = JSON.parse(readFileSync(out, "utf8")) as { report: { status: string; ok: boolean; missing: string[] } }

      expect(code).toBe(0)
      expect(stderr.join("")).toBe("")
      expect(JSON.parse(stdout.join(""))).toMatchObject({ report: { status: "skipped", ok: true } })
      expect(artifact.report.status).toBe("skipped")
      expect(artifact.report.missing).toEqual(["HELIX_LIVE_MODEL or OPENROUTER_MODEL", "OPENROUTER_API_KEY"])
      expect(readFileSync(out, "utf8")).not.toContain("secret")

      stdout.length = 0
      const verifyCode = await runCli(["verify-live-provider-parity", "--artifact", out, "--json"], {
        stdout: {
          write(chunk: string) {
            stdout.push(chunk)
            return true
          },
        },
        stderr: {
          write(chunk: string) {
            stderr.push(chunk)
            return true
          },
        },
      })
      expect(verifyCode).toBe(1)
      expect(JSON.parse(stdout.join(""))).toMatchObject({
        ok: false,
        issues: expect.arrayContaining([expect.objectContaining({ id: "live-provider-artifact:passed" })]),
      })
    } finally {
      if (saved.HELIX_LIVE_MODEL === undefined) delete process.env["HELIX_LIVE_MODEL"]
      else process.env["HELIX_LIVE_MODEL"] = saved.HELIX_LIVE_MODEL
      if (saved.OPENROUTER_MODEL === undefined) delete process.env["OPENROUTER_MODEL"]
      else process.env["OPENROUTER_MODEL"] = saved.OPENROUTER_MODEL
      if (saved.OPENROUTER_API_KEY === undefined) delete process.env["OPENROUTER_API_KEY"]
      else process.env["OPENROUTER_API_KEY"] = saved.OPENROUTER_API_KEY
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("does not archive failed required live provider reports to the final artifact path", async () => {
    const cwd = mkdtempSync(resolve(tmpdir(), "helix-cli-live-provider-required-"))
    const out = resolve(cwd, "live-provider-parity.json")
    const stdout: string[] = []
    const stderr: string[] = []
    const saved = {
      HELIX_LIVE_PROVIDER: process.env["HELIX_LIVE_PROVIDER"],
      HELIX_LIVE_MODEL: process.env["HELIX_LIVE_MODEL"],
      OPENAI_API_KEY: process.env["OPENAI_API_KEY"],
      OPENROUTER_API_KEY: process.env["OPENROUTER_API_KEY"],
      ANTHROPIC_API_KEY: process.env["ANTHROPIC_API_KEY"],
      GOOGLE_API_KEY: process.env["GOOGLE_API_KEY"],
      GEMINI_API_KEY: process.env["GEMINI_API_KEY"],
    }
    for (const key of Object.keys(saved) as Array<keyof typeof saved>) delete process.env[key]
    try {
      const code = await runCli(["live-provider-parity", "--require-credentials", "--out", out, "--json"], {
        stdout: {
          write(chunk: string) {
            stdout.push(chunk)
            return true
          },
        },
        stderr: {
          write(chunk: string) {
            stderr.push(chunk)
            return true
          },
        },
      })

      expect(code).toBe(1)
      expect(stderr.join("")).toBe("")
      expect(JSON.parse(stdout.join(""))).toMatchObject({ report: { status: "failed", ok: false } })
      expect(existsSync(out)).toBe(false)
    } finally {
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("runs an OpenCode recipe through the CLI entrypoint", async () => {
    const tsx = resolve(process.cwd(), "node_modules/.bin/tsx")
    const { stdout } = await withLocalOpenAICompatibleProvider("running", async (baseURL) =>
      execFileAsync(
        tsx,
        [
          "packages/cli/src/index.ts",
          "run",
          "opencode",
          "--provider",
          "openai-compatible",
          "--model",
          "cli-entrypoint-model",
          "--api-key",
          "local-test-key",
          "--base-url",
          baseURL,
          "--prompt",
          "hello",
          "--json",
        ],
        { cwd: process.cwd(), maxBuffer: 1024 * 1024 },
      ),
    )

    const output = JSON.parse(stdout) as {
      product: string
      transcript: Array<{ role: string; text: string }>
      assistantParts: unknown[]
    }

    expect(output.product).toBe("opencode")
    expect(output.transcript.map((message) => message.role)).toEqual(["user", "assistant"])
    expect(JSON.stringify(output.assistantParts)).toContain("running")
  })
})

interface LocalOpenAICompatibleProviderRequest {
  body: string
  json?: unknown
}

async function withLocalOpenAICompatibleProvider<T>(
  assistantText: string,
  fn: (baseURL: string, requests: LocalOpenAICompatibleProviderRequest[]) => Promise<T>,
): Promise<T> {
  const requests: LocalOpenAICompatibleProviderRequest[] = []
  const server = createServer(async (request, response) => {
    if (request.method !== "POST" || request.url !== "/v1/chat/completions") {
      response.writeHead(404)
      response.end()
      return
    }
    const body = await readBody(request)
    try {
      requests.push({ body, json: JSON.parse(body) as unknown })
    } catch {
      requests.push({ body })
    }
    response.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
    })
    response.write(`data: ${JSON.stringify({ choices: [{ delta: { content: assistantText } }] })}\n\n`)
    response.write('data: {"choices":[{"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":8,"completion_tokens":4}}\n\n')
    response.write("data: [DONE]\n\n")
    response.end()
  })
  await new Promise<void>((resolveListen, rejectListen) => {
    server.once("error", rejectListen)
    server.listen(0, "127.0.0.1", () => {
      server.off("error", rejectListen)
      resolveListen()
    })
  })
  const address = server.address()
  if (!address || typeof address !== "object") throw new Error("Expected local provider server address.")
  try {
    return await fn(`http://127.0.0.1:${address.port}/v1`, requests)
  } finally {
    await new Promise<void>((resolveClose, rejectClose) => {
      server.close((error) => (error ? rejectClose(error) : resolveClose()))
    })
  }
}

async function readBody(request: IncomingMessage): Promise<string> {
  let body = ""
  for await (const chunk of request) body += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk)
  return body
}
