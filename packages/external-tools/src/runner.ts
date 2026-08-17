import { createHash } from "node:crypto"
import { execFile, spawn } from "node:child_process"
import { createWriteStream, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { basename, delimiter, extname, isAbsolute, relative, resolve } from "node:path"
import { promisify } from "node:util"
import { assertExternalToolProductSupported, getExternalToolProfile } from "./registry"
import { defaultExternalToolRunID } from "./run-manifest"
import { claudeTapCaptureArgs, claudeTapOutputDirOverride } from "./tools/claude-tap/launch"
import { materializeClaudeTapNormalizedRunArtifacts } from "./tools/claude-tap/normalize"
import type {
  ExternalToolArtifactManifest,
  ExternalToolCaptureDryRunResult,
  ExternalToolCaptureMode,
  ExternalToolCaptureRunResult,
  ExternalToolDoctorResult,
  ExternalToolID,
  ExternalToolInvocationStrategy,
  ExternalToolProduct,
  ExternalToolRunArtifactFormat,
  ExternalToolRunManifest,
} from "./types"

const execFileAsync = promisify(execFile)
const CAPTURE_ENV_EXACT_ALLOWLIST = [
  "PATH",
  "Path",
  "HOME",
  "USER",
  "LOGNAME",
  "SHELL",
  "TMPDIR",
  "TMP",
  "TEMP",
  "LANG",
  "LC_ALL",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GOOGLE_API_KEY",
  "GEMINI_API_KEY",
  "OPENROUTER_API_KEY",
  "OPENAI_BASE_URL",
  "ANTHROPIC_BASE_URL",
  "GOOGLE_BASE_URL",
  "GEMINI_BASE_URL",
  "OPENROUTER_BASE_URL",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_SESSION_TOKEN",
  "AWS_PROFILE",
  "AWS_REGION",
  "AWS_DEFAULT_REGION",
  "BEDROCK_API_KEY",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "ALL_PROXY",
  "NO_PROXY",
  "http_proxy",
  "https_proxy",
  "all_proxy",
  "no_proxy",
  "NODE_EXTRA_CA_CERTS",
  "SSL_CERT_FILE",
  "CURL_CA_BUNDLE",
  "REQUESTS_CA_BUNDLE",
  "CODEX_API_KEY",
  "CODEX_CA_CERTIFICATE",
]
const CAPTURE_ENV_PREFIX_ALLOWLIST = [
  "ANTHROPIC_",
  "AWS_",
  "AZURE_OPENAI_",
  "BEDROCK_",
  "CLAUDE_",
  "GEMINI_",
  "GOOGLE_",
  "HERMES_",
  "OPENAI_",
  "OPENCODE_",
  "OPENROUTER_",
  "PI_",
  "UV_",
  "XDG_",
]
const CAPTURE_ENV_DENYLIST = [
  "HELIX_EXTERNAL_CAPTURE",
  "HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS",
  "CODEX_MANAGED_BY_NPM",
  "CODEX_MANAGED_PACKAGE_ROOT",
  "CODEX_REMOTE_PAYLOAD",
  "CODEX_THREAD_ID",
]
const DEFAULT_DOCTOR_TIMEOUT_MS = 10000

export interface ExternalToolDoctorOptions {
  toolPath?: string
  strategy?: ExternalToolInvocationStrategy
  timeoutMs?: number
}

export async function doctorExternalTool(toolID: ExternalToolID, options: ExternalToolDoctorOptions = {}): Promise<ExternalToolDoctorResult> {
  const profile = getExternalToolProfile(toolID)
  const invocation = externalToolInvocation({
    baseCommand: profile.versionCommand.command,
    baseArgs: profile.versionCommand.args,
    ...(options.toolPath ? { toolPath: options.toolPath } : {}),
    ...(options.strategy || !options.toolPath ? { strategy: options.strategy ?? profile.defaultInvocation.strategy } : {}),
  })
  try {
    const result = await execFileAsync(invocation.command, invocation.args, {
      timeout: options.timeoutMs ?? DEFAULT_DOCTOR_TIMEOUT_MS,
      maxBuffer: 128 * 1024,
    })
    const version = parseVersion(`${result.stdout}\n${result.stderr}`) || "unknown"
    return {
      toolID,
      label: profile.label,
      ok: true,
      installed: true,
      command: invocation.command,
      args: invocation.args,
      version,
      profile: {
        supportedProducts: profile.supportedProducts,
        supportedArtifactFormats: profile.supportedArtifactFormats,
        supportedCaptureModes: profile.supportedCaptureModes,
      },
    }
  } catch (error) {
    return {
      toolID,
      label: profile.label,
      ok: false,
      installed: false,
      command: invocation.command,
      args: invocation.args,
      error: error instanceof Error ? error.message : String(error),
      profile: {
        supportedProducts: profile.supportedProducts,
        supportedArtifactFormats: profile.supportedArtifactFormats,
        supportedCaptureModes: profile.supportedCaptureModes,
      },
    }
  }
}

export interface ExternalToolCaptureDryRunOptions {
  toolID: ExternalToolID
  product?: ExternalToolProduct
  taskID?: string
  outDir: string
  toolPath?: string
  strategy?: ExternalToolInvocationStrategy
  toolArgs?: string[]
  cwd?: string
  runID?: string
  now?: Date
  toolVersion?: string
}

export function createExternalToolCaptureDryRun(options: ExternalToolCaptureDryRunOptions): ExternalToolCaptureDryRunResult {
  const profile = getExternalToolProfile(options.toolID)
  assertExternalToolProductSupported(options.toolID, options.product, "capture")
  const now = options.now ?? new Date()
  const runID = options.runID ?? defaultExternalToolRunID(options.toolID, options.product, options.taskID, now)
  const outDir = resolve(options.outDir)
  const userArgs = options.toolArgs && options.toolArgs.length > 0 ? options.toolArgs : profile.defaultInvocation.args
  assertExternalToolCapturePathsLocalOnly({ toolID: options.toolID, outDir, toolArgs: userArgs, cwd: options.cwd })
  const rawDir = resolve(outDir, "raw")
  const captureArgs = externalToolCaptureArgs(options.toolID, userArgs, rawDir)
  const childEnv = externalToolChildEnv(process.env)
  const invocation = externalToolInvocation({
    baseCommand: profile.defaultInvocation.command,
    baseArgs: captureArgs,
    ...(options.toolPath ? { toolPath: options.toolPath } : {}),
    ...(options.strategy || !options.toolPath ? { strategy: options.strategy ?? profile.defaultInvocation.strategy } : {}),
  })
  const manifest: ExternalToolRunManifest = {
    schemaVersion: 1,
    artifactKind: "external-tool-run-manifest",
    runID,
    toolID: options.toolID,
    toolVersion: options.toolVersion ?? "unknown",
    invocation: {
      strategy: invocation.strategy,
      command: invocation.command,
      resolvedCommand: resolveExecutable(invocation.command, childEnv),
      args: invocation.args,
      cwd: resolve(options.cwd ?? process.cwd()),
      envAllowlist: externalToolEnvAllowlist(childEnv),
    },
    ...(options.product ? { product: options.product } : {}),
    ...(options.taskID ? { taskID: options.taskID } : {}),
    captureMode: "dry-run",
    startedAt: now.toISOString(),
    finishedAt: now.toISOString(),
    exitCode: 0,
    artifacts: [],
  }
  mkdirSync(outDir, { recursive: true })
  const manifestPath = resolve(outDir, "run-manifest.json")
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8")
  return { ok: true, dryRun: true, manifest, manifestPath }
}

export interface ExternalToolCaptureRunOptions {
  toolID: ExternalToolID
  product?: ExternalToolProduct
  taskID?: string
  outDir: string
  toolPath?: string
  strategy?: ExternalToolInvocationStrategy
  toolArgs?: string[]
  cwd?: string
  runID?: string
  now?: Date
  toolVersion?: string
  captureMode?: Extract<ExternalToolCaptureMode, "real-capture" | "capture-only">
  env?: NodeJS.ProcessEnv
}

export async function runExternalToolCapture(options: ExternalToolCaptureRunOptions): Promise<ExternalToolCaptureRunResult> {
  const profile = getExternalToolProfile(options.toolID)
  assertExternalToolProductSupported(options.toolID, options.product, "capture")
  const startedAt = options.now ?? new Date()
  const runID = options.runID ?? defaultExternalToolRunID(options.toolID, options.product, options.taskID, startedAt)
  const outDir = resolve(options.outDir)
  const userArgs = options.toolArgs && options.toolArgs.length > 0 ? options.toolArgs : profile.defaultInvocation.args
  assertExternalToolCapturePathsLocalOnly({ toolID: options.toolID, outDir, toolArgs: userArgs, cwd: options.cwd })
  const rawDir = resolve(outDir, "raw")
  const logsDir = resolve(outDir, "logs")
  const normalizedDir = resolve(outDir, "normalized")
  mkdirSync(rawDir, { recursive: true })
  mkdirSync(logsDir, { recursive: true })
  mkdirSync(normalizedDir, { recursive: true })

  const captureArgs = externalToolCaptureArgs(options.toolID, userArgs, rawDir)
  const childEnv = externalToolChildEnv({ ...process.env, ...(options.env ?? {}) })
  const toolVersion = options.toolVersion ?? await detectExternalToolVersion(profile, {
    ...(options.toolPath ? { toolPath: options.toolPath } : {}),
    ...(options.strategy ? { strategy: options.strategy } : {}),
    ...(options.cwd ? { cwd: options.cwd } : {}),
    env: childEnv,
  })
  const invocation = externalToolInvocation({
    baseCommand: profile.defaultInvocation.command,
    baseArgs: captureArgs,
    ...(options.toolPath ? { toolPath: options.toolPath } : {}),
    ...(options.strategy || !options.toolPath ? { strategy: options.strategy ?? profile.defaultInvocation.strategy } : {}),
  })
  const manifestPath = resolve(outDir, "run-manifest.json")
  const stdoutPath = resolve(logsDir, "stdout.log")
  const stderrPath = resolve(logsDir, "stderr.log")
  let manifest: ExternalToolRunManifest = {
    schemaVersion: 1,
    artifactKind: "external-tool-run-manifest",
    runID,
    toolID: options.toolID,
    toolVersion,
    invocation: {
      strategy: invocation.strategy,
      command: invocation.command,
      resolvedCommand: resolveExecutable(invocation.command, childEnv),
      args: invocation.args,
      cwd: resolve(options.cwd ?? process.cwd()),
      envAllowlist: externalToolEnvAllowlist(childEnv),
    },
    ...(options.product ? { product: options.product } : {}),
    ...(options.taskID ? { taskID: options.taskID } : {}),
    captureMode: options.captureMode ?? "real-capture",
    startedAt: startedAt.toISOString(),
    artifacts: [],
  }
  writeRunManifest(manifestPath, manifest)

  const stdoutLog = createWriteStream(stdoutPath, { flags: "w" })
  const stderrLog = createWriteStream(stderrPath, { flags: "w" })
  const exit = await executeExternalTool(invocation.command, invocation.args, {
    cwd: manifest.invocation.cwd,
    env: childEnv,
    stdoutLog,
    stderrLog,
  })
  await Promise.all([closeWriteStream(stdoutLog), closeWriteStream(stderrLog)])

  if (exit.exitCode === 0) {
    materializeNormalizedRunArtifacts({
      toolID: options.toolID,
      product: options.product,
      taskID: options.taskID,
      captureMode: manifest.captureMode,
      sourceToolVersion: manifest.toolVersion,
      rawDir,
      normalizedDir,
    })
  }
  const artifacts = collectRunArtifacts(outDir)
  manifest = {
    ...manifest,
    finishedAt: new Date().toISOString(),
    exitCode: exit.exitCode,
    artifacts,
  }
  writeRunManifest(manifestPath, manifest)

  return {
    ok: exit.exitCode === 0,
    dryRun: false,
    manifest,
    manifestPath,
    stdoutPath,
    stderrPath,
    rawDir,
    logsDir,
    normalizedDir,
    ...(exit.error ? { error: exit.error } : {}),
  }
}

function externalToolInvocation(options: {
  baseCommand: string
  baseArgs: string[]
  toolPath?: string
  strategy?: ExternalToolInvocationStrategy
}): { strategy: ExternalToolInvocationStrategy; command: string; args: string[] } {
  if (options.toolPath) {
    if (options.strategy && options.strategy !== "explicitPath") {
      throw new Error("--tool-path can only be used with the explicitPath invocation strategy.")
    }
    return {
      strategy: "explicitPath",
      command: options.toolPath,
      args: options.baseArgs,
    }
  }
  const strategy = options.strategy ?? "binary"
  if (strategy === "explicitPath") throw new Error("explicitPath invocation strategy requires --tool-path.")
  if (strategy === "uvx") {
    return {
      strategy,
      command: "uvx",
      args: [options.baseCommand, ...options.baseArgs],
    }
  }
  return {
    strategy,
    command: options.baseCommand,
    args: options.baseArgs,
  }
}

async function detectExternalToolVersion(
  profile: ReturnType<typeof getExternalToolProfile>,
  options: {
    toolPath?: string
    strategy?: ExternalToolInvocationStrategy
    cwd?: string
    env: NodeJS.ProcessEnv
  },
): Promise<string> {
  const invocation = externalToolInvocation({
    baseCommand: profile.versionCommand.command,
    baseArgs: profile.versionCommand.args,
    ...(options.toolPath ? { toolPath: options.toolPath } : {}),
    ...(options.strategy || !options.toolPath ? { strategy: options.strategy ?? profile.defaultInvocation.strategy } : {}),
  })
  try {
    const result = await execFileAsync(invocation.command, invocation.args, {
      cwd: resolve(options.cwd ?? process.cwd()),
      env: options.env,
      timeout: DEFAULT_DOCTOR_TIMEOUT_MS,
      maxBuffer: 128 * 1024,
    })
    return parseVersion(`${result.stdout}\n${result.stderr}`) || "unknown"
  } catch {
    return "unknown"
  }
}

function externalToolCaptureArgs(toolID: ExternalToolID, args: string[], rawDir: string): string[] {
  if (toolID !== "claude-tap") return args
  return claudeTapCaptureArgs(args, rawDir)
}

function materializeNormalizedRunArtifacts(input: {
  toolID: ExternalToolID
  product: ExternalToolProduct | undefined
  taskID: string | undefined
  captureMode: ExternalToolCaptureMode
  sourceToolVersion: string
  rawDir: string
  normalizedDir: string
}): void {
  if (input.toolID !== "claude-tap" || !input.product) return
  materializeClaudeTapNormalizedRunArtifacts({
    product: input.product,
    ...(input.taskID ? { taskID: input.taskID } : {}),
    captureMode: input.captureMode,
    sourceToolVersion: input.sourceToolVersion,
    rawDir: input.rawDir,
    normalizedDir: input.normalizedDir,
  })
}

function externalToolChildEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(env)
      .filter(([name, value]) => value !== undefined && isCaptureEnvAllowed(name))
      .sort(([left], [right]) => left.localeCompare(right)),
  ) as NodeJS.ProcessEnv
}

function externalToolEnvAllowlist(env: NodeJS.ProcessEnv): string[] {
  return Object.keys(env).sort((left, right) => left.localeCompare(right))
}

function isCaptureEnvAllowed(name: string): boolean {
  if (CAPTURE_ENV_DENYLIST.includes(name)) return false
  if (CAPTURE_ENV_EXACT_ALLOWLIST.includes(name)) return true
  return CAPTURE_ENV_PREFIX_ALLOWLIST.some((prefix) => name.startsWith(prefix))
}

function assertExternalToolCapturePathsLocalOnly(input: { toolID: ExternalToolID; outDir: string; toolArgs: string[]; cwd: string | undefined }): void {
  assertNotDocsReportsPath(input.outDir, "external tool capture output directory", process.cwd())
  if (input.toolID !== "claude-tap") return
  const outputDirOverride = claudeTapOutputDirOverride(input.toolArgs)
  if (outputDirOverride !== undefined) {
    assertNotDocsReportsPath(resolve(input.cwd ?? process.cwd(), outputDirOverride), "claude-tap --tap-output-dir", input.cwd ?? process.cwd())
  }
}

function assertNotDocsReportsPath(path: string, label: string, cwd: string): void {
  if (!isDocsReportsPath(path, cwd)) return
  throw new Error(`${label} must stay local-only; refusing docs/reports path ${path}`)
}

function isDocsReportsPath(path: string, cwd: string): boolean {
  const docsReports = resolve(cwd, "docs/reports")
  const candidate = resolve(cwd, path)
  const relativePath = relative(docsReports, candidate)
  return relativePath === "" || (relativePath.length > 0 && !relativePath.startsWith("..") && !isAbsolute(relativePath))
}

async function executeExternalTool(
  command: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv; stdoutLog: NodeJS.WritableStream; stderrLog: NodeJS.WritableStream },
): Promise<{ exitCode: number; error?: string }> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (exit: { exitCode: number; error?: string }) => {
      if (settled) return
      settled = true
      resolve(exit)
    }
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ["ignore", "pipe", "pipe"],
    })
    child.stdout.on("data", (chunk: Buffer) => options.stdoutLog.write(chunk))
    child.stderr.on("data", (chunk: Buffer) => options.stderrLog.write(chunk))
    child.on("error", (error) => finish({ exitCode: 127, error: error.message }))
    child.on("close", (code, signal) => finish({ exitCode: code ?? 1, ...(signal ? { error: `terminated by signal ${signal}` } : {}) }))
  })
}

function closeWriteStream(stream: NodeJS.WritableStream): Promise<void> {
  return new Promise((resolveClose, rejectClose) => {
    stream.once("error", rejectClose)
    stream.end(() => resolveClose())
  })
}

function collectRunArtifacts(outDir: string): ExternalToolArtifactManifest[] {
  const resolvedOutDir = resolve(outDir)
  return walkFiles(resolvedOutDir)
    .filter((filePath) => basename(filePath) !== "run-manifest.json")
    .map((filePath) => {
      const path = relative(resolvedOutDir, filePath)
      return {
        path,
        hash: sha256File(filePath),
        bytes: statSync(filePath).size,
        format: runArtifactFormat(path),
        role: runArtifactRole(path),
      }
    })
    .sort((left, right) => left.path.localeCompare(right.path))
}

function walkFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name)
    if (entry.isDirectory()) return walkFiles(path)
    return entry.isFile() ? [path] : []
  })
}

function sha256File(path: string): string {
  return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`
}

function runArtifactFormat(path: string): ExternalToolRunArtifactFormat {
  if (path.endsWith(".ctap.json")) return "compact"
  if (path.endsWith(".jsonl")) return "jsonl"
  if (path.endsWith(".json")) return "json"
  if (path.endsWith(".html")) return "html"
  if (path.endsWith(".log")) return "log"
  return "unknown"
}

function runArtifactRole(path: string): ExternalToolArtifactManifest["role"] {
  const name = basename(path)
  if (
    path.startsWith("raw/") &&
    (name === "trace.jsonl" ||
      name === "trace.json" ||
      name === "trace.ctap.json" ||
      name === "export.json" ||
      name.endsWith(".trace.jsonl") ||
      name.endsWith(".trace.json") ||
      name.endsWith(".trace.ctap.json") ||
      name.endsWith(".export.json"))
  ) {
    return "raw-trace"
  }
  if (extname(path) === ".html") return "viewer"
  if (path.startsWith("logs/")) return "log"
  return "other"
}

function writeRunManifest(path: string, manifest: ExternalToolRunManifest): void {
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, "utf8")
}

function resolveExecutable(command: string, env: NodeJS.ProcessEnv): string {
  if (command.includes("/") || command.includes("\\")) return resolve(command)
  for (const dir of (env.PATH ?? "").split(delimiter).filter(Boolean)) {
    const candidate = resolve(dir, command)
    try {
      if (statSync(candidate).isFile()) return candidate
    } catch {
      // Keep searching PATH entries.
    }
  }
  return command
}

function parseVersion(text: string): string {
  const match = /\b(\d+\.\d+\.\d+(?:[-+][A-Za-z0-9._-]+)?)\b/.exec(text)
  return match?.[1] ?? ""
}
