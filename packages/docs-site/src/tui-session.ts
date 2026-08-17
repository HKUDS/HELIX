import { createHash, randomUUID } from "node:crypto"
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import * as pty from "node-pty"
import type WebSocket from "ws"
import {
  HarnessProfileStore,
  parseRecipe,
  redactProfileSecrets,
  redactSecretText,
  type HarnessTuiProviderMode,
} from "@helix/recipes"
import type { LegoRecipe } from "@helix/contracts"

export type HarnessTuiSessionSource = "draft-recipe" | "installed-profile"
export type HarnessTuiSessionState = "starting" | "running" | "stopped" | "failed"

export interface HarnessTuiSessionCreateInput {
  source?: HarnessTuiSessionSource
  recipe?: unknown
  profileName?: string
  providerMode?: HarnessTuiProviderMode
  cols?: number
  rows?: number
  cwd?: string
  storageDir?: string
}

export interface HarnessTuiSessionSnapshot {
  sessionID: string
  source: HarnessTuiSessionSource
  profileName?: string
  recipeID: string
  recipeFingerprint: string
  selectedBundles: string[]
  bindingFingerprint: string
  state: HarnessTuiSessionState
  pid?: number
  startedAt: string
  stoppedAt?: string
  cwd: string
  storageDir: string
  providerMode: HarnessTuiProviderMode
  providerSummary: {
    kind: HarnessTuiProviderMode
    modelID?: string
    apiKeyEnv?: string
    hasAPIKey?: boolean
  }
  logPath: string
  lastError?: string
  exitCode?: number
  exitSignal?: string
  cols: number
  rows: number
  command: string
  argv: string[]
  shell: string
  initialCommand: string
  outputTail: string
  runtimeTraceSummary?: {
    path: string
    turns: number
    events: number
    latestFingerprint?: string
    latestSource?: string
    latestEventTypes: string[]
  }
}

interface HarnessTuiSessionRecord {
  snapshot: HarnessTuiSessionSnapshot
  recipeFilePath?: string
  ptyProcess?: pty.IPty
  sockets: Set<WebSocket>
  outputTail: string
}

interface PreparedHarnessTuiTarget {
  recipe: LegoRecipe
  recipeFilePath?: string
  profileName?: string
  cwd: string
  storageDir: string
  providerSummary: HarnessTuiSessionSnapshot["providerSummary"]
}

export class HarnessTuiSessionController {
  private readonly sessions = new Map<string, HarnessTuiSessionRecord>()
  private readonly cwd: string
  private readonly env: NodeJS.ProcessEnv
  private readonly profileStore: HarnessProfileStore
  private readonly idleTimeoutMs: number

  constructor(options: { cwd?: string; env?: NodeJS.ProcessEnv; profileStore?: HarnessProfileStore; idleTimeoutMs?: number } = {}) {
    this.cwd = resolve(options.cwd ?? process.cwd())
    this.env = options.env ?? process.env
    this.profileStore = options.profileStore ?? new HarnessProfileStore({ cwd: this.cwd, env: this.env })
    this.idleTimeoutMs = options.idleTimeoutMs ?? 30 * 60 * 1000
  }

  create(input: HarnessTuiSessionCreateInput): HarnessTuiSessionSnapshot {
    const source = input.source ?? (input.profileName ? "installed-profile" : "draft-recipe")
    const providerMode = input.providerMode ?? "profile-live"
    const cols = clampInteger(input.cols, 20, 240, 100)
    const rows = clampInteger(input.rows, 8, 80, 28)
    const sessionID = `tui-${randomUUID()}`
    const startedAt = new Date().toISOString()
    const sessionDir = mkdtempSync(join(tmpdir(), "helix-tui-"))
    const logPath = join(sessionDir, "session.log")

    const target: PreparedHarnessTuiTarget = source === "installed-profile"
      ? this.prepareProfileTarget(input, sessionDir)
      : this.prepareDraftTarget(input, sessionDir)
    const tuiCommand = npmCommand()
    const tuiArgv = [
      "run",
      "-s",
      "helix",
      "--",
      "tui",
      ...(source === "installed-profile"
        ? ["--profile", target.profileName ?? "", "--profile-root", this.profileStore.rootDir]
        : ["--recipe-file", target.recipeFilePath ?? ""]),
      "--provider",
      providerMode,
      "--cwd",
      target.cwd,
      "--storage-dir",
      target.storageDir,
    ].filter((item) => item.length > 0)
    const shell = shellCommand(this.env)
    const shellArgv = shellArgs(shell)
    const initialCommand = shellCommandLine([tuiCommand, ...tuiArgv])

    const snapshot: HarnessTuiSessionSnapshot = {
      sessionID,
      source,
      ...(target.profileName ? { profileName: target.profileName } : {}),
      recipeID: target.recipe.id,
      recipeFingerprint: fingerprint(target.recipe),
      selectedBundles: selectedBundles(target.recipe),
      bindingFingerprint: bindingFingerprint(target.recipe),
      state: "starting",
      startedAt,
      cwd: target.cwd,
      storageDir: target.storageDir,
      providerMode,
      providerSummary: target.providerSummary ?? { kind: providerMode },
      logPath,
      cols,
      rows,
      command: shell,
      argv: shellArgv,
      shell: shellName(shell),
      initialCommand,
      outputTail: "",
    }
    const record: HarnessTuiSessionRecord = {
      snapshot,
      ...(target.recipeFilePath ? { recipeFilePath: target.recipeFilePath } : {}),
      sockets: new Set(),
      outputTail: "",
    }
    this.sessions.set(sessionID, record)
    this.appendLog(record, `session ${sessionID} starting source=${source} command=${shell} argv=${JSON.stringify(shellArgv)} initialCommand=${initialCommand}`)
    this.spawn(record)
    setTimeout(() => this.stopIdleSession(sessionID), this.idleTimeoutMs).unref?.()
    return this.redactedSnapshot(record)
  }

  list(): HarnessTuiSessionSnapshot[] {
    return [...this.sessions.values()].map((record) => this.redactedSnapshot(record)).sort((left, right) => right.startedAt.localeCompare(left.startedAt))
  }

  get(sessionID: string): HarnessTuiSessionSnapshot | undefined {
    const record = this.sessions.get(sessionID)
    return record ? this.redactedSnapshot(record) : undefined
  }

  logs(sessionID: string): { path: string; text: string } {
    const record = this.required(sessionID)
    const text = existsSync(record.snapshot.logPath) ? readFileSync(record.snapshot.logPath, "utf8") : ""
    return redactProfileSecrets({ path: record.snapshot.logPath, text: redactSecretText(text, this.env) }, this.env) as { path: string; text: string }
  }

  input(sessionID: string, data: string): HarnessTuiSessionSnapshot {
    const record = this.required(sessionID)
    if (!record.ptyProcess || record.snapshot.state !== "running") throw new Error(`TUI session ${sessionID} is not running.`)
    record.ptyProcess.write(data)
    return this.redactedSnapshot(record)
  }

  interrupt(sessionID: string): HarnessTuiSessionSnapshot {
    return this.input(sessionID, "\x03")
  }

  resize(sessionID: string, cols: number, rows: number): HarnessTuiSessionSnapshot {
    const record = this.required(sessionID)
    record.snapshot.cols = clampInteger(cols, 20, 240, record.snapshot.cols)
    record.snapshot.rows = clampInteger(rows, 8, 80, record.snapshot.rows)
    if (record.ptyProcess && record.snapshot.state === "running") record.ptyProcess.resize(record.snapshot.cols, record.snapshot.rows)
    return this.redactedSnapshot(record)
  }

  stop(sessionID: string): HarnessTuiSessionSnapshot {
    const record = this.required(sessionID)
    if (record.ptyProcess && (record.snapshot.state === "running" || record.snapshot.state === "starting")) {
      this.appendLog(record, `session ${sessionID} stopping pid=${record.snapshot.pid ?? "unknown"}`)
      record.ptyProcess.kill()
    }
    record.snapshot.state = "stopped"
    record.snapshot.stoppedAt = new Date().toISOString()
    delete record.ptyProcess
    this.broadcast(record, { type: "status", session: this.redactedSnapshot(record) })
    this.broadcast(record, { type: "close", sessionID })
    this.closeSockets(record)
    return this.redactedSnapshot(record)
  }

  stopAll(): void {
    for (const sessionID of [...this.sessions.keys()]) {
      try {
        this.stop(sessionID)
      } catch {
        // Best-effort cleanup for test/server shutdown.
      }
    }
  }

  restart(sessionID: string): HarnessTuiSessionSnapshot {
    const record = this.required(sessionID)
    if (record.ptyProcess && (record.snapshot.state === "running" || record.snapshot.state === "starting")) record.ptyProcess.kill()
    record.snapshot.state = "starting"
    record.snapshot.startedAt = new Date().toISOString()
    delete record.snapshot.stoppedAt
    delete record.snapshot.lastError
    delete record.snapshot.exitCode
    delete record.snapshot.exitSignal
    this.appendLog(record, `session ${sessionID} restarting`)
    this.spawn(record)
    return this.redactedSnapshot(record)
  }

  attach(sessionID: string, socket: WebSocket): void {
    const record = this.required(sessionID)
    record.sockets.add(socket)
    socket.send(JSON.stringify({ type: "status", session: this.redactedSnapshot(record) }))
    if (record.outputTail) socket.send(JSON.stringify({ type: "output", data: redactSecretText(record.outputTail, this.env), replay: true }))
    socket.on("message", (message) => {
      try {
        const payload = parseSocketMessage(message)
        if (payload.type === "input") this.input(sessionID, String(payload.data ?? ""))
        else if (payload.type === "interrupt") this.interrupt(sessionID)
        else if (payload.type === "resize") this.resize(sessionID, Number(payload.cols), Number(payload.rows))
        else if (payload.type === "close") socket.close()
        else socket.send(JSON.stringify({ type: "error", error: `Unsupported WebSocket message type: ${String(payload.type ?? "<missing>")}` }))
      } catch (error) {
        socket.send(JSON.stringify({ type: "error", error: redactSecretText(error instanceof Error ? error.message : String(error), this.env) }))
      }
    })
    socket.on("close", () => {
      record.sockets.delete(socket)
    })
  }

  private prepareDraftTarget(input: HarnessTuiSessionCreateInput, sessionDir: string): {
    recipe: LegoRecipe
    recipeFilePath: string
    cwd: string
    storageDir: string
    providerSummary: HarnessTuiSessionSnapshot["providerSummary"]
  } {
    if (!input.recipe || typeof input.recipe !== "object" || Array.isArray(input.recipe)) throw new Error("Draft TUI session requires recipe JSON.")
    const recipe = parseRecipe(input.recipe)
    const recipeFilePath = join(sessionDir, "draft-recipe.json")
    writeFileSync(recipeFilePath, `${JSON.stringify(recipe, null, 2)}\n`, "utf8")
    const cwd = resolve(input.cwd ?? this.cwd)
    const storageDir = resolve(input.storageDir ?? join(sessionDir, "storage"))
    mkdirSync(storageDir, { recursive: true })
    return { recipe, recipeFilePath, cwd, storageDir, providerSummary: { kind: input.providerMode ?? "profile-live" } }
  }

  private prepareProfileTarget(input: HarnessTuiSessionCreateInput, sessionDir: string): {
    recipe: LegoRecipe
    profileName: string
    cwd: string
    storageDir: string
    providerSummary: HarnessTuiSessionSnapshot["providerSummary"]
  } {
    if (!input.profileName) throw new Error("Installed-profile TUI session requires profileName.")
    const record = this.profileStore.getRequired(input.profileName)
    const provider = record.provider
    const apiKeyEnv = provider?.apiKeyEnv
    const storageDir = resolve(record.profile.storageDir || input.storageDir || join(sessionDir, "storage"))
    mkdirSync(storageDir, { recursive: true })
    return {
      recipe: record.recipe,
      profileName: record.profile.name,
      cwd: resolve(record.profile.workspaceDir || input.cwd || this.cwd),
      storageDir,
      providerSummary: {
        kind: input.providerMode ?? "profile-live",
        ...(provider?.modelID ? { modelID: provider.modelID } : {}),
        ...(apiKeyEnv ? { apiKeyEnv, hasAPIKey: Boolean(this.env[apiKeyEnv]) } : {}),
      },
    }
  }

  private spawn(record: HarnessTuiSessionRecord): void {
    try {
      const ptyProcess = pty.spawn(record.snapshot.command, record.snapshot.argv, {
        name: "xterm-256color",
        cols: record.snapshot.cols,
        rows: record.snapshot.rows,
        cwd: record.snapshot.cwd,
        env: createPtyEnv(this.env, record),
      })
      record.ptyProcess = ptyProcess
      record.snapshot.pid = ptyProcess.pid
      record.snapshot.state = "running"
      this.broadcast(record, { type: "status", session: this.redactedSnapshot(record) })
      ptyProcess.onData((data) => {
        const redacted = redactSecretText(data, this.env)
        record.outputTail = tailText(record.outputTail + redacted, 64_000)
        record.snapshot.outputTail = record.outputTail
        this.appendLog(record, redacted, { alreadyRedacted: true })
        this.broadcast(record, { type: "output", data: redacted })
      })
      ptyProcess.write(`${record.snapshot.initialCommand}\r`)
      ptyProcess.onExit((event) => {
        record.snapshot.exitCode = event.exitCode
        if (event.signal !== undefined) record.snapshot.exitSignal = String(event.signal)
        record.snapshot.stoppedAt = new Date().toISOString()
        record.snapshot.state = event.exitCode === 0 || record.snapshot.state === "stopped" ? "stopped" : "failed"
        if (record.snapshot.state === "failed") record.snapshot.lastError = `PTY exited with code ${event.exitCode}${event.signal ? ` signal ${event.signal}` : ""}.`
        delete record.ptyProcess
        this.appendLog(record, `session ${record.snapshot.sessionID} exited code=${event.exitCode} signal=${event.signal ?? ""}`)
        this.broadcast(record, { type: "status", session: this.redactedSnapshot(record) })
        this.broadcast(record, { type: "close", sessionID: record.snapshot.sessionID, exitCode: event.exitCode, signal: event.signal })
        this.closeSockets(record)
      })
    } catch (error) {
      record.snapshot.state = "failed"
      record.snapshot.stoppedAt = new Date().toISOString()
      record.snapshot.lastError = redactSecretText(error instanceof Error ? error.message : String(error), this.env)
      this.appendLog(record, `session ${record.snapshot.sessionID} failed: ${record.snapshot.lastError}`)
      this.broadcast(record, { type: "error", error: record.snapshot.lastError })
      this.broadcast(record, { type: "status", session: this.redactedSnapshot(record) })
    }
  }

  private required(sessionID: string): HarnessTuiSessionRecord {
    const record = this.sessions.get(sessionID)
    if (!record) throw new Error(`TUI session ${sessionID} not found.`)
    return record
  }

  private appendLog(record: HarnessTuiSessionRecord, line: string, options: { alreadyRedacted?: boolean } = {}): void {
    mkdirSync(dirname(record.snapshot.logPath), { recursive: true })
    appendFileSync(record.snapshot.logPath, `${options.alreadyRedacted ? line : redactSecretText(line, this.env)}\n`, "utf8")
  }

  private broadcast(record: HarnessTuiSessionRecord, payload: unknown): void {
    const text = JSON.stringify(redactProfileSecrets(payload, this.env))
    for (const socket of record.sockets) {
      if (socket.readyState === socket.OPEN) socket.send(text)
    }
  }

  private closeSockets(record: HarnessTuiSessionRecord): void {
    for (const socket of record.sockets) {
      if (socket.readyState === socket.OPEN || socket.readyState === socket.CONNECTING) socket.close()
    }
    record.sockets.clear()
  }

  private redactedSnapshot(record: HarnessTuiSessionRecord): HarnessTuiSessionSnapshot {
    record.snapshot.outputTail = record.outputTail
    const runtimeTraceSummary = readRuntimeTraceSummary(record.snapshot.storageDir)
    if (runtimeTraceSummary) record.snapshot.runtimeTraceSummary = runtimeTraceSummary
    else delete record.snapshot.runtimeTraceSummary
    return redactProfileSecrets({ ...record.snapshot, outputTail: redactSecretText(record.outputTail, this.env) }, this.env) as HarnessTuiSessionSnapshot
  }

  private stopIdleSession(sessionID: string): void {
    const record = this.sessions.get(sessionID)
    if (!record || record.sockets.size > 0 || record.snapshot.state !== "running") return
    this.stop(sessionID)
  }
}

function createPtyEnv(env: NodeJS.ProcessEnv, record: HarnessTuiSessionRecord): NodeJS.ProcessEnv {
  const next: NodeJS.ProcessEnv = {}
  for (const key of ["PATH", "HOME", "USER", "LOGNAME", "SHELL", "LANG", "LC_ALL", "TMPDIR", "TMP", "TEMP", "NODE_OPTIONS"]) {
    if (env[key]) next[key] = env[key]
  }
  next.TERM = "xterm-256color"
  next.HELIX_TUI_SESSION = record.snapshot.sessionID
  next.HELIX_TUI_TRACE_SOURCE = "builder-test-session"
  for (const key of Object.keys(env)) {
    if (
      key.startsWith("HELIX_") ||
      key.startsWith("OPENAI_") ||
      key.startsWith("OPENROUTER_") ||
      key.startsWith("ANTHROPIC_") ||
      key.startsWith("GOOGLE_") ||
      key.startsWith("GEMINI_") ||
      key.endsWith("_API_KEY")
    ) {
      next[key] = env[key]
    }
  }
  return next
}

function readRuntimeTraceSummary(storageDir: string): HarnessTuiSessionSnapshot["runtimeTraceSummary"] | undefined {
  const path = join(storageDir, "runtime-traces.jsonl")
  if (!existsSync(path)) return undefined
  const lines = readFileSync(path, "utf8").split(/\r?\n/).filter(Boolean)
  let events = 0
  let latestFingerprint: string | undefined
  let latestSource: string | undefined
  let latestEventTypes: string[] = []
  for (const line of lines) {
    try {
      const record = JSON.parse(line) as {
        runtimeTrace?: {
          source?: string
          events?: Array<{ type?: string }>
          summary?: { events?: number; fingerprint?: string }
        }
      }
      const trace = record.runtimeTrace
      const eventTypes = Array.isArray(trace?.events) ? trace.events.map((event) => String(event.type ?? "")).filter(Boolean) : []
      events += typeof trace?.summary?.events === "number" ? trace.summary.events : eventTypes.length
      latestFingerprint = typeof trace?.summary?.fingerprint === "string" ? trace.summary.fingerprint : latestFingerprint
      latestSource = typeof trace?.source === "string" ? trace.source : latestSource
      latestEventTypes = eventTypes.slice(0, 24)
    } catch {
      // Ignore partial lines written by an active TUI process.
    }
  }
  return {
    path,
    turns: lines.length,
    events,
    ...(latestFingerprint ? { latestFingerprint } : {}),
    ...(latestSource ? { latestSource } : {}),
    latestEventTypes,
  }
}

function parseSocketMessage(message: WebSocket.RawData): Record<string, unknown> {
  const text = typeof message === "string" ? message : Buffer.isBuffer(message) ? message.toString("utf8") : Buffer.concat(message as Buffer[]).toString("utf8")
  const parsed = JSON.parse(text)
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("WebSocket message must be a JSON object.")
  return parsed as Record<string, unknown>
}

function selectedBundles(recipe: LegoRecipe): string[] {
  return Array.isArray(recipe.bundles) ? recipe.bundles.map((bundle) => bundle.id).filter(Boolean) : []
}

function bindingFingerprint(recipe: LegoRecipe): string {
  return fingerprint(recipe.bindings ?? [])
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(stableJSONStringify(value)).digest("hex").slice(0, 16)
}

function stableJSONStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJSONStringify).join(",")}]`
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJSONStringify((value as Record<string, unknown>)[key])}`).join(",")}}`
  }
  return JSON.stringify(value)
}

function tailText(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(value.length - maxLength) : value
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN
  if (!Number.isInteger(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

function npmCommand(): string {
  return process.platform === "win32" ? "npm.cmd" : "npm"
}

function shellCommand(env: NodeJS.ProcessEnv): string {
  if (process.platform === "win32") return env["COMSPEC"] || "cmd.exe"
  const preferred = env["SHELL"]
  if (preferred && existsSync(preferred)) return preferred
  if (existsSync("/bin/bash")) return "/bin/bash"
  return "/bin/sh"
}

function shellArgs(shell: string): string[] {
  if (process.platform === "win32") return []
  const name = shellName(shell)
  if (name === "bash") return ["--noprofile", "--norc", "-i"]
  if (name === "zsh") return ["-f", "-i"]
  return ["-i"]
}

function shellName(shell: string): string {
  return shell.split(/[\\/]/).pop() || shell
}

function shellCommandLine(parts: string[]): string {
  if (process.platform === "win32") return parts.map(windowsShellQuote).join(" ")
  return parts.map(posixShellQuote).join(" ")
}

function posixShellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:=@%+-]+$/.test(value)) return value
  return `'${value.replace(/'/g, "'\\''")}'`
}

function windowsShellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:=@%+-]+$/.test(value)) return value
  return `"${value.replace(/"/g, '\\"')}"`
}
