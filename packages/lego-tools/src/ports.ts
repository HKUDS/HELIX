import { createHash } from "node:crypto"
import { execFile } from "node:child_process"
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { dirname, isAbsolute, relative, resolve } from "node:path"
import { promisify } from "node:util"
import type { LegoToolContext, LegoToolPermissionRequest, PermissionStatus } from "@helix/contracts"

const execFileAsync = promisify(execFile)

export const filesystemPortToken = "filesystem.port"
export const processRunnerPortToken = "process-runner.port"
export const toolPermissionPolicyToken = "tool.permission-policy"

export interface FilesystemGrepInput {
  query: string
  path?: string
  glob?: string
  regex?: boolean
  ignoreCase?: boolean
  maxResults?: number
}

export interface FilesystemFindInput {
  path?: string
  query?: string
  glob?: string
  maxResults?: number
}

export interface FilesystemPort {
  readText(path: string, ctx: LegoToolContext): Promise<{ path: string; text: string }>
  writeText(path: string, content: string, ctx: LegoToolContext): Promise<{ path: string }>
  list(path: string, ctx: LegoToolContext): Promise<{ path: string; entries: string[] }>
  find(input: FilesystemFindInput, ctx: LegoToolContext): Promise<{ path: string; files: string[] }>
  grep(input: FilesystemGrepInput, ctx: LegoToolContext): Promise<{ path: string; lines: string[] }>
}

export interface ProcessRunnerInput {
  command: string
  args?: string[]
  cwd?: string
  env?: NodeJS.ProcessEnv
  maxBuffer?: number
}

export interface ProcessRunnerResult {
  stdout: string
  stderr: string
  exitCode: number
  signal?: NodeJS.Signals | string | null
}

export interface ProcessRunnerPort {
  run(input: ProcessRunnerInput, ctx: LegoToolContext): Promise<ProcessRunnerResult>
}

export interface ToolPermissionPolicyInput {
  toolName: string
  action: string
  subject: string
  input: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface ToolPermissionPolicy {
  decide(
    input: ToolPermissionPolicyInput,
    ctx: LegoToolContext,
  ): LegoToolPermissionRequest | PermissionStatus | Promise<LegoToolPermissionRequest | PermissionStatus>
}

export function filesystemPort(ctx: LegoToolContext): FilesystemPort {
  const candidate = ctx.services?.get(filesystemPortToken)
  if (isFilesystemPort(candidate)) return candidate
  return createLocalFilesystemPort()
}

export function processRunnerPort(ctx: LegoToolContext): ProcessRunnerPort {
  const candidate = ctx.services?.get(processRunnerPortToken)
  if (isProcessRunnerPort(candidate)) return candidate
  return createLocalProcessRunnerPort()
}

export function toolPermissionPolicy(ctx: LegoToolContext): ToolPermissionPolicy {
  const candidate = ctx.services?.get(toolPermissionPolicyToken)
  if (isToolPermissionPolicy(candidate)) return candidate
  return createAskHookPermissionPolicy()
}

export function createLocalFilesystemPort(): FilesystemPort {
  return {
    async readText(path, ctx) {
      const resolved = resolveToolPath(path, ctx)
      return { path: resolved, text: await readFile(resolved, "utf8") }
    },
    async writeText(path, content, ctx) {
      const resolved = resolveToolPath(path, ctx)
      await mkdir(dirname(resolved), { recursive: true })
      await writeFile(resolved, content, "utf8")
      return { path: resolved }
    },
    async list(path, ctx) {
      const resolved = resolveToolPath(path, ctx)
      return { path: resolved, entries: await readdir(resolved) }
    },
    async find(input, ctx) {
      const cwd = resolveToolPath(input.path ?? ".", ctx)
      const args = ["--files"]
      if (input.glob) args.push("--glob", input.glob)
      args.push(".")
      const result = await createLocalProcessRunnerPort().run({ command: "rg", args, cwd }, ctx)
      const query = input.query?.toLowerCase()
      const files = result.stdout
        .split("\n")
        .filter(Boolean)
        .filter((file) => (query ? file.toLowerCase().includes(query) : true))
        .slice(0, normalizeLimit(input.maxResults))
      return { path: cwd, files }
    },
    async grep(input, ctx) {
      const cwd = resolveToolPath(input.path ?? ".", ctx)
      const args = ["--line-number", "--column", "--no-heading"]
      if (!input.regex) args.push("--fixed-strings")
      if (input.ignoreCase) args.push("--ignore-case")
      if (input.glob) args.push("--glob", input.glob)
      args.push(input.query, ".")
      const runner = createLocalProcessRunnerPort()
      try {
        const result = await runner.run({ command: "rg", args, cwd, maxBuffer: 1024 * 1024 * 10 }, ctx)
        return { path: cwd, lines: result.stdout.split("\n").filter(Boolean).slice(0, normalizeLimit(input.maxResults)) }
      } catch (error) {
        if (isExitCode(error, 1)) return { path: cwd, lines: [] }
        throw error
      }
    },
  }
}

export function createMemoryFilesystemPort(initialFiles: Record<string, string> = {}): FilesystemPort & { files: Map<string, string> } {
  const files = new Map(Object.entries(initialFiles).map(([path, content]) => [resolve("/", path), content]))
  const port: FilesystemPort & { files: Map<string, string> } = {
    files,
    async readText(path, ctx) {
      const resolved = resolveMemoryPath(path, ctx)
      const text = files.get(resolved)
      if (text === undefined) throw new Error(`File not found: ${resolved}`)
      return { path: resolved, text }
    },
    async writeText(path, content, ctx) {
      const resolved = resolveMemoryPath(path, ctx)
      files.set(resolved, content)
      return { path: resolved }
    },
    async list(path, ctx) {
      const resolved = resolveMemoryPath(path, ctx)
      const prefix = resolved.endsWith("/") ? resolved : `${resolved}/`
      const entries = new Set<string>()
      for (const file of files.keys()) {
        if (!file.startsWith(prefix)) continue
        const rest = file.slice(prefix.length)
        if (!rest) continue
        entries.add(rest.split("/")[0] ?? rest)
      }
      return { path: resolved, entries: [...entries].sort() }
    },
    async find(input, ctx) {
      const resolved = resolveMemoryPath(input.path ?? ".", ctx)
      const prefix = resolved.endsWith("/") ? resolved : `${resolved}/`
      const query = input.query?.toLowerCase()
      const filesForPath = [...files.keys()]
        .filter((file) => file.startsWith(prefix))
        .map((file) => file.slice(prefix.length))
        .filter((file) => (query ? file.toLowerCase().includes(query) : true))
        .filter((file) => (input.glob ? globSuffixMatches(file, input.glob) : true))
        .slice(0, normalizeLimit(input.maxResults))
      return { path: resolved, files: filesForPath }
    },
    async grep(input, ctx) {
      const resolved = resolveMemoryPath(input.path ?? ".", ctx)
      const prefix = resolved.endsWith("/") ? resolved : `${resolved}/`
      const query = input.regex ? new RegExp(input.query, input.ignoreCase ? "i" : "") : undefined
      const needle = input.ignoreCase ? input.query.toLowerCase() : input.query
      const lines: string[] = []
      for (const [file, text] of files.entries()) {
        if (!file.startsWith(prefix)) continue
        const relativePath = file.slice(prefix.length)
        if (input.glob && !globSuffixMatches(relativePath, input.glob)) continue
        for (const [index, line] of text.split(/\r?\n/).entries()) {
          const haystack = input.ignoreCase ? line.toLowerCase() : line
          const matched = query ? query.test(line) : haystack.includes(needle)
          if (matched) lines.push(`${relativePath}:${index + 1}:1:${line}`)
          if (lines.length >= normalizeLimit(input.maxResults)) return { path: resolved, lines }
        }
      }
      return { path: resolved, lines }
    },
  }
  return port
}

export function createReadonlyFilesystemPort(inner: FilesystemPort = createLocalFilesystemPort()): FilesystemPort {
  return {
    readText: (path, ctx) => inner.readText(path, ctx),
    list: (path, ctx) => inner.list(path, ctx),
    find: (input, ctx) => inner.find(input, ctx),
    grep: (input, ctx) => inner.grep(input, ctx),
    async writeText(path, _content, ctx) {
      const resolved = resolveToolPath(path, ctx)
      throw new Error(`Filesystem is read-only: ${resolved}`)
    },
  }
}

export function createWorkspaceScopedFilesystemPort(inner: FilesystemPort = createLocalFilesystemPort()): FilesystemPort {
  return {
    readText: (path, ctx) => inner.readText(assertWorkspacePath(path, ctx), ctx),
    writeText: (path, content, ctx) => inner.writeText(assertWorkspacePath(path, ctx), content, ctx),
    list: (path, ctx) => inner.list(assertWorkspacePath(path, ctx), ctx),
    find: (input, ctx) => inner.find({ ...input, path: assertWorkspacePath(input.path ?? ".", ctx) }, ctx),
    grep: (input, ctx) => inner.grep({ ...input, path: assertWorkspacePath(input.path ?? ".", ctx) }, ctx),
  }
}

export function createLocalProcessRunnerPort(): ProcessRunnerPort {
  return {
    async run(input) {
      const { stdout, stderr } = await execFileAsync(input.command, input.args ?? [], {
        ...(input.cwd ? { cwd: input.cwd } : {}),
        ...(input.env ? { env: input.env } : {}),
        ...(input.maxBuffer ? { maxBuffer: input.maxBuffer } : {}),
      })
      return { stdout, stderr, exitCode: 0 }
    },
  }
}

export function createDisabledProcessRunnerPort(reason = "process runner disabled"): ProcessRunnerPort {
  return {
    async run(input) {
      throw new Error(`${reason}: ${input.command}`)
    },
  }
}

export function createDryRunProcessRunnerPort(): ProcessRunnerPort {
  return {
    async run(input) {
      return {
        stdout: `[dry-run] ${[input.command, ...(input.args ?? [])].join(" ")}`,
        stderr: "",
        exitCode: 0,
      }
    },
  }
}

export function createSandboxProcessRunnerPort(inner: ProcessRunnerPort = createDisabledProcessRunnerPort("sandbox runner not configured")): ProcessRunnerPort {
  return inner
}

export function createAlwaysAllowPermissionPolicy(): ToolPermissionPolicy {
  return {
    decide(input) {
      return { status: "allow", action: input.action, subject: input.subject, ...(input.metadata ? { metadata: input.metadata } : {}) }
    },
  }
}

export function createAlwaysDenyPermissionPolicy(reason = "permission denied"): ToolPermissionPolicy {
  return {
    decide(input) {
      return {
        status: "deny",
        action: input.action,
        subject: input.subject,
        reason,
        ...(input.metadata ? { metadata: input.metadata } : {}),
      }
    },
  }
}

export function createAskHookPermissionPolicy(): ToolPermissionPolicy {
  return {
    decide(input) {
      return { status: "ask", action: input.action, subject: input.subject, ...(input.metadata ? { metadata: input.metadata } : {}) }
    },
  }
}

export function createWorkspaceScopedPermissionPolicy(): ToolPermissionPolicy {
  return {
    decide(input, ctx) {
      if (!input.action.startsWith("file.")) return { status: "ask", action: input.action, subject: input.subject }
      try {
        assertWorkspacePath(input.subject, ctx)
        return { status: "ask", action: input.action, subject: input.subject }
      } catch (error) {
        return {
          status: "deny",
          action: input.action,
          subject: input.subject,
          reason: error instanceof Error ? error.message : "outside workspace",
        }
      }
    },
  }
}

export function createProductPersonalityPermissionPolicy(inner: ToolPermissionPolicy = createAskHookPermissionPolicy()): ToolPermissionPolicy {
  return inner
}

export function createToolPermission(
  toolName: string,
  action: string,
  subject: (input: Record<string, unknown>, ctx: LegoToolContext) => string,
  metadata?: (input: Record<string, unknown>, ctx: LegoToolContext) => Record<string, unknown> | undefined,
) {
  return (input: Record<string, unknown>, ctx: LegoToolContext): ReturnType<ToolPermissionPolicy["decide"]> => {
    const extra = metadata?.(input, ctx)
    return toolPermissionPolicy(ctx).decide(
      {
        toolName,
        action,
        subject: subject(input, ctx),
        input,
        ...(extra ? { metadata: extra } : {}),
      },
      ctx,
    )
  }
}

export function isFilesystemPort(value: unknown): value is FilesystemPort {
  return (
    value !== null &&
    typeof value === "object" &&
    "readText" in value &&
    typeof value.readText === "function" &&
    "writeText" in value &&
    typeof value.writeText === "function" &&
    "list" in value &&
    typeof value.list === "function" &&
    "find" in value &&
    typeof value.find === "function" &&
    "grep" in value &&
    typeof value.grep === "function"
  )
}

export function isProcessRunnerPort(value: unknown): value is ProcessRunnerPort {
  return value !== null && typeof value === "object" && "run" in value && typeof value.run === "function"
}

export function isToolPermissionPolicy(value: unknown): value is ToolPermissionPolicy {
  return value !== null && typeof value === "object" && "decide" in value && typeof value.decide === "function"
}

export function resolveToolPath(path: string, ctx: LegoToolContext): string {
  return resolve(ctx.cwd ?? process.cwd(), path)
}

export function normalizeLimit(value: number | undefined): number {
  return Math.max(1, Math.min(value ?? 200, 1000))
}

function resolveMemoryPath(path: string, ctx: LegoToolContext): string {
  return resolve("/", relative("/", resolveToolPath(path, ctx)))
}

function assertWorkspacePath(path: string, ctx: LegoToolContext): string {
  const root = resolve(ctx.cwd ?? process.cwd())
  const target = resolveToolPath(path, ctx)
  const rel = relative(root, target)
  if (rel === "" || (!rel.startsWith("..") && !isAbsolute(rel))) return target
  throw new Error(`Path is outside workspace: ${target}`)
}

function globSuffixMatches(path: string, glob: string): boolean {
  if (glob === "*") return true
  if (glob.startsWith("*.")) return path.endsWith(glob.slice(1))
  return path.includes(glob.replaceAll("*", ""))
}

function isExitCode(error: unknown, code: number): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === code
}

export type ToolPublicPortSurfacePortID = typeof filesystemPortToken | typeof processRunnerPortToken | typeof toolPermissionPolicyToken

export interface ToolPublicPortSurfaceRef {
  portID: ToolPublicPortSurfacePortID
  token: string
  implementations: string[]
  exposure: "partial-lossy-port"
  exactDiffStatus: "exact-diff-partial"
  nativeParityClaim: false
  cadenceRisk: string[]
  knownLossiness: string[]
}

export interface ToolPublicPortSurfaceGuardSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:tool-public-port-surface-guard"
  fixtureID: "tool:public-port-surface-guard"
  fixtureDiffTarget: "cadence.event-timing-replay"
  exactDiffStatus: "exact-diff-partial"
  nativeParityClaim: false
  portRefs: ToolPublicPortSurfaceRef[]
  nativeBlockers: string[]
  summary: string
  fingerprint: string
}

export interface ToolPublicPortSurfaceGuardIssue {
  id: string
  portID?: ToolPublicPortSurfacePortID
  message: string
}

export interface ToolPublicPortSurfaceGuardVerification {
  ok: boolean
  issues: ToolPublicPortSurfaceGuardIssue[]
}

export function buildToolPublicPortSurfaceGuardSnapshot(): ToolPublicPortSurfaceGuardSnapshot {
  const portRefs: ToolPublicPortSurfaceRef[] = [
    {
      portID: filesystemPortToken,
      token: filesystemPortToken,
      implementations: [
        "createLocalFilesystemPort",
        "createMemoryFilesystemPort",
        "createReadonlyFilesystemPort",
        "createWorkspaceScopedFilesystemPort",
      ],
      exposure: "partial-lossy-port",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      cadenceRisk: ["workspace-filesystem-side-effects", "tool-result-writeback-order", "readback-after-write"],
      knownLossiness: [
        "tool-public-filesystem-port-side-effects-not-native",
        "workspace-filesystem-watch-order-not-proven",
      ],
    },
    {
      portID: processRunnerPortToken,
      token: processRunnerPortToken,
      implementations: [
        "createLocalProcessRunnerPort",
        "createDisabledProcessRunnerPort",
        "createDryRunProcessRunnerPort",
        "createSandboxProcessRunnerPort",
      ],
      exposure: "partial-lossy-port",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      cadenceRisk: ["tool-batch-order", "process-exit-timing", "stderr-stdout-order"],
      knownLossiness: [
        "tool-public-process-runner-wall-clock-not-native",
        "process-runner-output-order-not-exact",
      ],
    },
    {
      portID: toolPermissionPolicyToken,
      token: toolPermissionPolicyToken,
      implementations: [
        "createAlwaysAllowPermissionPolicy",
        "createAlwaysDenyPermissionPolicy",
        "createAskHookPermissionPolicy",
        "createWorkspaceScopedPermissionPolicy",
        "createProductPersonalityPermissionPolicy",
      ],
      exposure: "partial-lossy-port",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      cadenceRisk: ["permission-decision", "permission-ui-side-effects", "continuation-boundary"],
      knownLossiness: [
        "tool-public-permission-ui-side-effects-not-replayed",
        "product-native-permission-hook-order-not-proven",
      ],
    },
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:tool-public-port-surface-guard" as const,
    fixtureID: "tool:public-port-surface-guard" as const,
    fixtureDiffTarget: "cadence.event-timing-replay" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    nativeParityClaim: false as const,
    portRefs,
    nativeBlockers: [
      "product-native-filesystem-side-effects:not-proven",
      "product-native-process-runner-timing:not-proven",
      "product-native-permission-ui-side-effects:not-proven",
      "tool-result-session-writeback-order:not-live-native",
    ],
    summary: "Tool public ports expose partial/lossy cadence evidence only; filesystem, process runner, permission UI side effects, and tool result writeback still need product-native exact fixtures.",
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: toolPublicPortSurfaceFingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyToolPublicPortSurfaceGuardSnapshot(
  snapshot: ToolPublicPortSurfaceGuardSnapshot,
): ToolPublicPortSurfaceGuardVerification {
  const issues: ToolPublicPortSurfaceGuardIssue[] = []
  if (snapshot.exactDiffStatus !== "exact-diff-partial" || snapshot.nativeParityClaim !== false) {
    issues.push({
      id: "tool-public-port.native-claim",
      message: "Tool public port surface must remain exact-diff-partial and cannot claim native parity.",
    })
  }
  for (const portID of [filesystemPortToken, processRunnerPortToken, toolPermissionPolicyToken] as ToolPublicPortSurfacePortID[]) {
    const ref = snapshot.portRefs.find((item) => item.portID === portID)
    if (!ref) {
      issues.push({
        id: "tool-public-port.missing-port",
        portID,
        message: `${portID} is no longer represented in the tool public port surface guard.`,
      })
      continue
    }
    if (ref.exposure !== "partial-lossy-port" || ref.exactDiffStatus !== "exact-diff-partial" || ref.nativeParityClaim !== false) {
      issues.push({
        id: "tool-public-port.port-native-claim",
        portID,
        message: `${portID} must remain a partial/lossy public port surface.`,
      })
    }
    if (ref.implementations.length === 0) {
      issues.push({
        id: "tool-public-port.implementations",
        portID,
        message: `${portID} no longer lists swappable public implementations.`,
      })
    }
    if (!ref.cadenceRisk.some((risk) => /order|side-effects|timing|permission|writeback|continuation/.test(risk))) {
      issues.push({
        id: "tool-public-port.cadence-risk",
        portID,
        message: `${portID} no longer records cadence timing risk.`,
      })
    }
    if (!toolPublicPortSurfaceHasLossiness(ref.knownLossiness)) {
      issues.push({
        id: "tool-public-port.lossiness",
        portID,
        message: `${portID} no longer carries partial/lossy evidence markers.`,
      })
    }
  }
  if (!snapshot.nativeBlockers.some((blocker) => /filesystem|process-runner|permission|writeback/.test(blocker))) {
    issues.push({
      id: "tool-public-port.native-blockers",
      message: "Tool public port surface guard no longer records native blockers.",
    })
  }
  if (!/partial|lossy/.test(snapshot.summary) || /native parity complete|product-native complete|native complete/i.test(snapshot.summary)) {
    issues.push({
      id: "tool-public-port.summary",
      message: "Tool public port surface summary must describe partial/lossy evidence without complete-native wording.",
    })
  }
  if (!/^[a-f0-9]{16}$/.test(snapshot.fingerprint)) {
    issues.push({
      id: "tool-public-port.fingerprint",
      message: "Tool public port surface guard fingerprint is not stable.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function toolPublicPortSurfaceHasLossiness(values: string[]): boolean {
  return values.some((value) => /partial|lossy|not-native|not-proven|not-exact|not-replayed/.test(value))
}

function toolPublicPortSurfaceFingerprintObject(value: unknown): string {
  return createHash("sha256").update(toolPublicPortSurfaceStableStringify(value)).digest("hex").slice(0, 16)
}

function toolPublicPortSurfaceStableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(toolPublicPortSurfaceStableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${toolPublicPortSurfaceStableStringify(record[key])}`).join(",")}}`
}
