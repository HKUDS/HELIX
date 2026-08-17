import { createHash } from "node:crypto"
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, isAbsolute, join, relative, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import type { HookScope, LegoHookHost } from "@helix/lego-hooks"
import {
  loadOpenCodePlugin,
  type OpenCodePlugin,
  type OpenCodePluginInput,
  type OpenCodePluginOptions,
} from "./plugin-adapter"
import { openCodeParsePluginSpecifier } from "./product-schema/hooks"

export type OpenCodePluginSpec =
  | string
  | OpenCodePlugin
  | {
      spec: string | OpenCodePlugin
      options?: OpenCodePluginOptions
      source?: { id?: string; path?: string; scope?: string }
    }

export type OpenCodePluginImporter = (specifier: string) => Promise<unknown>

export interface LoadOpenCodePluginsInput {
  host: LegoHookHost
  plugins: OpenCodePluginSpec[]
  pluginInput: OpenCodePluginInput
  config?: Record<string, unknown>
  cwd?: string
  importer?: OpenCodePluginImporter
  wait?: () => Promise<void>
}

export interface LoadedOpenCodePlugin {
  spec: OpenCodePluginSpec
  source: { id: string; path?: string; scope?: string }
  scope: HookScope
}

export interface OpenCodePluginRuntimeImportNativeExactFixtureCase {
  id:
    | "file-module-default-export"
    | "module-export-priority"
    | "cleanup-removes-live-hook"
    | "parallel-skip-failed-and-preserve-order"
    | "file-retry-after-wait"
  actual: unknown
  expected: unknown
}

export interface OpenCodePluginRuntimeImportNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.plugin.loader"
  portID: "hook.bus"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-plugin-runtime-import-native-exact-fixture"
  replayRef: "plugin-runtime-import-native-exact:opencode"
  fixtureID: "opencode-plugin-runtime-import:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodePluginRuntimeImportNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodePluginRuntimeImportNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodePluginRuntimeImportNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodePluginRuntimeImportNativeExactFixtureIssue[]
}

export type OpenCodePluginPackageKind = "server" | "tui"

export interface OpenCodePluginPackage {
  dir: string
  pkg: string
  json: Record<string, unknown>
}

export interface OpenCodePluginPackageTarget {
  kind: OpenCodePluginPackageKind
  opts?: Record<string, unknown>
}

export interface OpenCodePluginPackageEntry {
  spec: string
  source: "file" | "npm"
  target: string
  pkg?: OpenCodePluginPackage
  entry?: string
}

export type OpenCodePluginPackageLoaderResolution =
  | { ok: true; value: OpenCodePluginPackageEntry }
  | { ok: false; stage: "entry" | "missing" | "compatibility"; message: string }

export interface OpenCodePluginPackageCompatibilityNativeExactFixtureCase {
  id:
    | "package-targets-export-config"
    | "main-and-theme-target-fallback"
    | "entry-resolution-and-compatibility-pass"
    | "entry-outside-package-rejected"
    | "npm-compatibility-gate"
  actual: unknown
  expected: unknown
}

export interface OpenCodePluginPackageCompatibilityNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.plugin.loader"
  portID: "hook.bus"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-plugin-package-compatibility-native-exact-fixture"
  replayRef: "plugin-package-compatibility-native-exact:opencode"
  fixtureID: "opencode-plugin-package-compatibility:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodePluginPackageCompatibilityNativeExactFixtureCase[]
  knownLossiness: []
  residualGaps: ["opencode-real-npm-arborist-reify-not-replayed"]
  fingerprint: string
}

export interface OpenCodePluginPackageCompatibilityNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodePluginPackageCompatibilityNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodePluginPackageCompatibilityNativeExactFixtureIssue[]
}

export interface OpenCodeNpmInstallEntryPoint {
  directory: string
  entrypoint?: string
}

export interface OpenCodeNpmInstallTreeEdge {
  name: string
  path: string
}

export interface OpenCodeNpmInstallDeps {
  cacheDir: string
  platform?: NodeJS.Platform | string
  exists(path: string): Promise<boolean>
  reify(input: { dir: string; add: string[] }): Promise<{ edgesOut: OpenCodeNpmInstallTreeEdge[] }>
  resolveEntryPoint(name: string, dir: string): OpenCodeNpmInstallEntryPoint
}

export interface OpenCodeNpmAddResult extends OpenCodeNpmInstallEntryPoint {
  pkg: string
  name: string
  cacheDir: string
  reified: boolean
  reifyAdd: string[]
}

export interface OpenCodePluginNpmInstallNativeExactFixtureCase {
  id:
    | "bare-plugin-spec-installs-latest"
    | "existing-cache-skips-reify"
    | "reify-tree-first-edge"
    | "fallback-entrypoint-after-empty-tree"
    | "empty-tree-without-entrypoint-fails"
  actual: unknown
  expected: unknown
}

export interface OpenCodePluginNpmInstallNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.plugin.loader"
  portID: "hook.bus"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-plugin-npm-install-native-exact-fixture"
  replayRef: "plugin-npm-install-native-exact:opencode"
  fixtureID: "opencode-plugin-npm-install:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodePluginNpmInstallNativeExactFixtureCase[]
  knownLossiness: []
  residualGaps: ["opencode-real-npm-arborist-reify-not-replayed"]
  fingerprint: string
}

export interface OpenCodePluginNpmInstallNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodePluginNpmInstallNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodePluginNpmInstallNativeExactFixtureIssue[]
}

export class OpenCodeNpmInstallFailedError extends Error {
  readonly add?: string[]
  readonly dir: string

  constructor(input: { add?: string[]; dir: string }) {
    super(`Failed to install npm package in ${input.dir}`)
    this.name = "NpmInstallFailedError"
    if (input.add) this.add = input.add
    this.dir = input.dir
  }
}

interface NormalizedOpenCodePlugin {
  plugin: OpenCodePlugin
  options?: OpenCodePluginOptions
  source: { id: string; path?: string; scope?: string }
}

interface OpenCodePluginAttemptResult {
  value?: NormalizedOpenCodePlugin
  retry: boolean
}

export async function loadOpenCodePlugins(input: LoadOpenCodePluginsInput): Promise<LoadedOpenCodePlugin[]> {
  const cwd = input.cwd ?? input.pluginInput.directory
  const importer = input.importer ?? defaultImporter
  const attempts = await Promise.all(input.plugins.map((raw, index) => attemptNormalizePlugin(raw, { cwd, importer, index }, false)))
  if (input.wait) {
    let deps: Promise<void> | undefined
    for (const [index, attempt] of attempts.entries()) {
      if (attempt.value !== undefined || attempt.retry !== true) continue
      const raw = input.plugins[index]
      if (!raw || pluginSpecSource(raw) !== "file") continue
      deps ??= input.wait()
      await deps
      attempts[index] = await attemptNormalizePlugin(raw, { cwd, importer, index }, true)
    }
  }
  const loaded: LoadedOpenCodePlugin[] = []
  for (const [index, attempt] of attempts.entries()) {
    const normalized = attempt.value
    if (!normalized) continue
    const raw = input.plugins[index]
    if (!raw) continue
    const scope = await loadOpenCodePlugin({
      host: input.host,
      plugin: normalized.plugin,
      pluginInput: input.pluginInput,
      ...(normalized.options ? { options: normalized.options } : {}),
      ...(input.config ? { config: input.config } : {}),
      source: normalized.source,
    })
    loaded.push({ spec: raw, source: normalized.source, scope })
  }
  return loaded
}

async function attemptNormalizePlugin(
  raw: OpenCodePluginSpec,
  input: { cwd: string; importer: OpenCodePluginImporter; index: number },
  retry: boolean,
): Promise<OpenCodePluginAttemptResult> {
  try {
    return { value: await normalizePlugin(raw, input), retry: false }
  } catch (error) {
    return { retry: !retry && pluginSpecSource(raw) === "file" && isRetryablePluginSetupError(error) }
  }
}

async function normalizePlugin(
  raw: OpenCodePluginSpec,
  input: { cwd: string; importer: OpenCodePluginImporter; index: number },
): Promise<{
  plugin: OpenCodePlugin
  options?: OpenCodePluginOptions
  source: { id: string; path?: string; scope?: string }
}> {
  if (typeof raw === "function") {
    return {
      plugin: raw,
      source: { id: raw.name || `opencode-plugin-${input.index}`, scope: "project" },
    }
  }

  if (typeof raw === "string") {
    const resolved = resolvePluginSpecifier(raw, input.cwd)
    const plugin = pluginFromModule(await input.importer(resolved.importSpecifier), raw)
    return {
      plugin,
      source: {
        id: raw,
        scope: "project",
        ...(resolved.path ? { path: resolved.path } : {}),
      },
    }
  }

  if (typeof raw.spec === "function") {
    return {
      plugin: raw.spec,
      ...(raw.options ? { options: raw.options } : {}),
      source: {
        id: raw.source?.id ?? raw.spec.name ?? `opencode-plugin-${input.index}`,
        scope: raw.source?.scope ?? "project",
        ...(raw.source?.path ? { path: raw.source.path } : {}),
      },
    }
  }

  const resolved = resolvePluginSpecifier(raw.spec, input.cwd)
  const plugin = pluginFromModule(await input.importer(resolved.importSpecifier), raw.spec)
  return {
    plugin,
    ...(raw.options ? { options: raw.options } : {}),
    source: {
      id: raw.source?.id ?? raw.spec,
      scope: raw.source?.scope ?? "project",
      ...(raw.source?.path ?? resolved.path ? { path: raw.source?.path ?? resolved.path } : {}),
    },
  }
}

function resolvePluginSpecifier(spec: string, cwd: string): { importSpecifier: string; path?: string } {
  if (spec.startsWith("npm:")) return { importSpecifier: spec.slice("npm:".length) }
  if (spec.startsWith("file:")) return { importSpecifier: spec, path: spec }
  if (isLocalSpecifier(spec)) {
    const path = isAbsolute(spec) ? spec : resolve(cwd, spec)
    return { importSpecifier: pathToFileURL(path).href, path }
  }
  return { importSpecifier: spec }
}

function isLocalSpecifier(spec: string): boolean {
  return spec.startsWith(".") || spec.startsWith("/") || /\.(cjs|js|mjs|ts)$/.test(spec)
}

function pluginSpecSource(spec: OpenCodePluginSpec): "file" | "npm" | "inline" {
  if (typeof spec === "function") return "inline"
  if (typeof spec === "string") return pluginStringSpecSource(spec)
  if (typeof spec.spec === "function") return "inline"
  return pluginStringSpecSource(spec.spec)
}

function pluginStringSpecSource(spec: string): "file" | "npm" {
  return spec.startsWith("file:") || isLocalSpecifier(spec) ? "file" : "npm"
}

export async function readOpenCodePluginPackage(target: string): Promise<OpenCodePluginPackage> {
  const file = target.startsWith("file://") ? fileURLToPath(target) : target
  const info = await stat(file)
  const dir = info.isDirectory() ? file : dirname(file)
  const pkg = join(dir, "package.json")
  const json = JSON.parse(await readFile(pkg, "utf8")) as unknown
  if (!isRecord(json)) throw new TypeError(`Plugin package ${pkg} must contain a JSON object`)
  return { dir, pkg, json }
}

export function openCodePluginPackageTargets(pkg: OpenCodePluginPackage): OpenCodePluginPackageTarget[] {
  const targets: OpenCodePluginPackageTarget[] = []
  const server = openCodePluginPackageExportTarget(pkg.json, "server")
  if (server) targets.push({ kind: "server", ...(server.opts ? { opts: server.opts } : {}) })
  else if (openCodePluginPackageHasMainTarget(pkg.json)) targets.push({ kind: "server" })
  const tui = openCodePluginPackageExportTarget(pkg.json, "tui")
  if (tui) targets.push({ kind: "tui", ...(tui.opts ? { opts: tui.opts } : {}) })
  if (!targets.some((target) => target.kind === "tui") && readOpenCodePluginPackageThemes(pkg).length) targets.push({ kind: "tui" })
  return targets
}

export async function createOpenCodePluginPackageEntry(
  spec: string,
  target: string,
  kind: OpenCodePluginPackageKind,
  pkg?: OpenCodePluginPackage,
): Promise<OpenCodePluginPackageEntry> {
  const source = pluginStringSpecSource(spec)
  const hit = pkg ?? (source === "npm" ? await readOpenCodePluginPackage(target) : await readOpenCodePluginPackage(target).catch(() => undefined))
  const entry = await resolveOpenCodePluginEntrypoint(spec, target, kind, hit)
  return {
    spec,
    source,
    target,
    ...(hit ? { pkg: hit } : {}),
    ...(entry ? { entry } : {}),
  }
}

export async function checkOpenCodePluginPackageCompatibility(
  target: string,
  opencodeVersion: string,
  pkg?: OpenCodePluginPackage,
): Promise<void> {
  const parsed = parseOpenCodeSemver(opencodeVersion)
  if (!parsed || parsed.major === 0) return
  const hit = pkg ?? await readOpenCodePluginPackage(target).catch(() => undefined)
  if (!hit) return
  const engines = hit.json["engines"]
  if (!isRecord(engines)) return
  const range = engines["opencode"]
  if (typeof range !== "string") return
  if (!openCodeSemverSatisfies(parsed, range)) throw new Error(`Plugin requires opencode ${range} but running ${opencodeVersion}`)
}

export async function resolveOpenCodePluginPackageForLoader(input: {
  spec: string
  target: string
  kind: OpenCodePluginPackageKind
  opencodeVersion: string
}): Promise<OpenCodePluginPackageLoaderResolution> {
  let base: OpenCodePluginPackageEntry
  try {
    base = await createOpenCodePluginPackageEntry(input.spec, input.target, input.kind)
  } catch (error) {
    return { ok: false, stage: "entry", message: openCodePluginErrorMessage(error) }
  }
  if (!base.entry) return { ok: false, stage: "missing", message: `Plugin ${input.spec} does not expose a ${input.kind} entrypoint` }
  if (base.source === "npm") {
    try {
      await checkOpenCodePluginPackageCompatibility(base.target, input.opencodeVersion, base.pkg)
    } catch (error) {
      return { ok: false, stage: "compatibility", message: openCodePluginErrorMessage(error) }
    }
  }
  return { ok: true, value: base }
}

export async function resolveOpenCodeNpmPluginInstallTarget(
  spec: string,
  deps: OpenCodeNpmInstallDeps,
): Promise<OpenCodeNpmAddResult> {
  const pkg = openCodeNpmPluginInstallPackage(spec)
  return openCodeNpmAdd(pkg, deps)
}

export async function openCodeNpmAdd(pkg: string, deps: OpenCodeNpmInstallDeps): Promise<OpenCodeNpmAddResult> {
  const cacheDir = join(deps.cacheDir, "packages", openCodeNpmSanitizePackageCacheKey(pkg, deps.platform))
  const name = openCodeNpmPackageName(pkg)
  const nodeModuleDir = join(cacheDir, "node_modules", ...name.split("/"))
  if (await deps.exists(nodeModuleDir)) {
    return {
      ...deps.resolveEntryPoint(name, nodeModuleDir),
      pkg,
      name,
      cacheDir,
      reified: false,
      reifyAdd: [],
    }
  }
  const tree = await deps.reify({ dir: cacheDir, add: [pkg] })
  const first = tree.edgesOut[0]
  if (first) {
    return {
      ...deps.resolveEntryPoint(first.name, first.path),
      pkg,
      name,
      cacheDir,
      reified: true,
      reifyAdd: [pkg],
    }
  }
  const fallback = deps.resolveEntryPoint(name, nodeModuleDir)
  if (fallback.entrypoint) {
    return {
      ...fallback,
      pkg,
      name,
      cacheDir,
      reified: true,
      reifyAdd: [pkg],
    }
  }
  throw new OpenCodeNpmInstallFailedError({ add: [pkg], dir: cacheDir })
}

function isRetryablePluginSetupError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return error.message.includes("missing package.json or index file")
}

function pluginFromModule(moduleValue: unknown, spec: string): OpenCodePlugin {
  if (typeof moduleValue === "function") return moduleValue as OpenCodePlugin
  if (isRecord(moduleValue)) {
    const candidate = moduleValue["default"] ?? moduleValue["plugin"] ?? moduleValue["opencode"]
    if (typeof candidate === "function") return candidate as OpenCodePlugin
  }
  throw new Error(`OpenCode plugin ${spec} did not export a plugin function`)
}

async function defaultImporter(specifier: string): Promise<unknown> {
  return import(specifier)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function openCodePluginPackageExportTarget(pkg: Record<string, unknown>, kind: OpenCodePluginPackageKind): { opts?: Record<string, unknown> } | undefined {
  const exports = pkg["exports"]
  if (!isRecord(exports)) return undefined
  const value = exports[`./${kind}`]
  const entry = openCodePluginPackageExportValue(value)
  if (!entry) return undefined
  const opts = isRecord(value) && isRecord(value["config"]) ? value["config"] : undefined
  return { ...(opts ? { opts } : {}) }
}

function openCodePluginPackageExportValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    const next = value.trim()
    return next || undefined
  }
  if (!isRecord(value)) return undefined
  for (const key of ["import", "default"]) {
    const nested = value[key]
    if (typeof nested !== "string") continue
    const next = nested.trim()
    if (next) return next
  }
  return undefined
}

function openCodePluginPackageHasMainTarget(pkg: Record<string, unknown>): boolean {
  const main = pkg["main"]
  return typeof main === "string" && main.trim().length > 0
}

function openCodePluginPackageMain(pkg: OpenCodePluginPackage): string | undefined {
  const main = pkg.json["main"]
  if (typeof main !== "string") return undefined
  const next = main.trim()
  return next || undefined
}

function readOpenCodePluginPackageThemes(pkg: OpenCodePluginPackage): string[] {
  const field = pkg.json["oc-themes"]
  if (field === undefined) return []
  if (!Array.isArray(field)) throw new TypeError(`Plugin ${openCodePluginPackageSpecName(pkg)} has invalid oc-themes field`)
  const list = field.map((item) => {
    if (typeof item !== "string") throw new TypeError(`Plugin ${openCodePluginPackageSpecName(pkg)} has invalid oc-themes entry`)
    const raw = item.trim()
    if (!raw) throw new TypeError(`Plugin ${openCodePluginPackageSpecName(pkg)} has empty oc-themes entry`)
    if (raw.startsWith("file://") || isAbsolute(raw) || /^[A-Za-z]:[\\/]/.test(raw)) {
      throw new TypeError(`Plugin ${openCodePluginPackageSpecName(pkg)} oc-themes entry must be relative: ${item}`)
    }
    return resolveOpenCodePluginPackageFile(openCodePluginPackageSpecName(pkg), raw, "oc-themes", pkg)
  })
  return Array.from(new Set(list))
}

function openCodePluginPackageSpecName(pkg: OpenCodePluginPackage): string {
  const name = pkg.json["name"]
  return typeof name === "string" && name.trim() ? name.trim() : pkg.dir.split(/[\\/]/).at(-1) ?? pkg.dir
}

function openCodeNpmPluginInstallPackage(spec: string): string {
  const parsed = openCodeParsePluginSpecifier(spec)
  return spec === parsed.pkg ? `${parsed.pkg}@latest` : spec
}

function openCodeNpmSanitizePackageCacheKey(pkg: string, platform: NodeJS.Platform | string = process.platform): string {
  if (platform !== "win32") return pkg
  const illegal = new Set(["<", ">", ":", "\"", "|", "?", "*"])
  return Array.from(pkg, (char) => illegal.has(char) || char.charCodeAt(0) < 32 ? "_" : char).join("")
}

function openCodeNpmPackageName(pkg: string): string {
  const raw = pkg.startsWith("npm:") ? pkg.slice("npm:".length) : pkg
  const aliasIndex = raw.lastIndexOf("npm:")
  const value = aliasIndex >= 0 ? raw.slice(aliasIndex + "npm:".length) : raw
  if (value.startsWith("@")) {
    const slash = value.indexOf("/")
    if (slash < 0) return value
    const afterName = value.indexOf("@", slash + 1)
    return afterName < 0 ? value : value.slice(0, afterName)
  }
  const at = value.lastIndexOf("@")
  return at > 0 ? value.slice(0, at) : value
}

async function resolveOpenCodePluginEntrypoint(
  spec: string,
  target: string,
  kind: OpenCodePluginPackageKind,
  pkg?: OpenCodePluginPackage,
): Promise<string | undefined> {
  const source = pluginStringSpecSource(spec)
  if (!pkg) return target
  const entry = resolveOpenCodePluginPackageEntrypoint(spec, kind, pkg)
  if (entry) return entry
  const dir = await resolveOpenCodePluginTargetDirectory(target)
  if (kind === "tui") {
    if (source === "file" && dir) {
      const index = await resolveOpenCodePluginDirectoryIndex(dir)
      if (index) return pathToFileURL(index).href
    }
    if (source === "npm") return undefined
    if (dir) return undefined
    return target
  }
  if (dir && isRecord(pkg.json["exports"])) {
    if (source === "file") {
      const index = await resolveOpenCodePluginDirectoryIndex(dir)
      if (index) return pathToFileURL(index).href
    }
    return undefined
  }
  return target
}

function resolveOpenCodePluginPackageEntrypoint(
  spec: string,
  kind: OpenCodePluginPackageKind,
  pkg: OpenCodePluginPackage,
): string | undefined {
  const exports = pkg.json["exports"]
  if (isRecord(exports)) {
    const raw = openCodePluginPackageExportValue(exports[`./${kind}`])
    if (raw) return pathToFileURL(resolveOpenCodePluginPackageFile(spec, raw, kind, pkg)).href
  }
  if (kind !== "server") return undefined
  const main = openCodePluginPackageMain(pkg)
  if (!main) return undefined
  return pathToFileURL(resolveOpenCodePluginPackageFile(spec, main, kind, pkg)).href
}

function resolveOpenCodePluginPackageFile(
  spec: string,
  raw: string,
  kind: string,
  pkg: OpenCodePluginPackage,
): string {
  const resolved = raw.startsWith("file://") ? fileURLToPath(raw) : isAbsolute(raw) ? raw : resolve(pkg.dir, raw)
  const root = resolve(pkg.dir)
  const next = resolve(resolved)
  const pathFromRoot = relative(root, next)
  if (pathFromRoot.startsWith("..") || isAbsolute(pathFromRoot)) {
    throw new Error(`Plugin ${spec} resolved ${kind} entry outside plugin directory`)
  }
  return next
}

async function resolveOpenCodePluginTargetDirectory(target: string): Promise<string | undefined> {
  const file = target.startsWith("file://") ? fileURLToPath(target) : target
  const info = await stat(file).catch(() => undefined)
  if (!info?.isDirectory()) return undefined
  return file
}

async function resolveOpenCodePluginDirectoryIndex(dir: string): Promise<string | undefined> {
  for (const name of ["index.ts", "index.tsx", "index.js", "index.mjs", "index.cjs"]) {
    const file = join(dir, name)
    const info = await stat(file).catch(() => undefined)
    if (info?.isFile()) return file
  }
  return undefined
}

interface OpenCodeSemver {
  major: number
  minor: number
  patch: number
}

function parseOpenCodeSemver(value: string): OpenCodeSemver | undefined {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(value.trim())
  if (!match) return undefined
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  }
}

function openCodeSemverSatisfies(version: OpenCodeSemver, range: string): boolean {
  const raw = range.trim()
  if (!raw || raw === "*" || raw.toLowerCase() === "latest") return true
  if (raw.includes("||")) return raw.split("||").some((part) => openCodeSemverSatisfies(version, part))
  return raw.split(/\s+/).filter(Boolean).every((part) => openCodeSemverComparatorSatisfies(version, part))
}

function openCodeSemverComparatorSatisfies(version: OpenCodeSemver, comparator: string): boolean {
  if (comparator.startsWith("^")) {
    const base = parseOpenCodeSemver(comparator.slice(1))
    if (!base) return false
    const upper = base.major > 0
      ? { major: base.major + 1, minor: 0, patch: 0 }
      : base.minor > 0
        ? { major: 0, minor: base.minor + 1, patch: 0 }
        : { major: 0, minor: 0, patch: base.patch + 1 }
    return compareOpenCodeSemver(version, base) >= 0 && compareOpenCodeSemver(version, upper) < 0
  }
  if (comparator.startsWith("~")) {
    const base = parseOpenCodeSemver(comparator.slice(1))
    if (!base) return false
    return compareOpenCodeSemver(version, base) >= 0 && compareOpenCodeSemver(version, { major: base.major, minor: base.minor + 1, patch: 0 }) < 0
  }
  const match = /^(>=|<=|>|<|=)?(.+)$/.exec(comparator)
  if (!match) return false
  const operator = match[1] ?? "="
  const rawBase = match[2]
  if (!rawBase) return false
  const base = parseOpenCodeSemver(rawBase)
  if (!base) return false
  const cmp = compareOpenCodeSemver(version, base)
  if (operator === ">=") return cmp >= 0
  if (operator === "<=") return cmp <= 0
  if (operator === ">") return cmp > 0
  if (operator === "<") return cmp < 0
  return cmp === 0
}

function compareOpenCodeSemver(left: OpenCodeSemver, right: OpenCodeSemver): number {
  return left.major - right.major || left.minor - right.minor || left.patch - right.patch
}

function openCodePluginErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export async function captureOpenCodePluginRuntimeImportNativeExactFixture(): Promise<OpenCodePluginRuntimeImportNativeExactFixture> {
  const temp = await mkdtemp(join(tmpdir(), "helix-opencode-plugin-"))
  const callsKey = `__helix_opencode_plugin_runtime_${process.pid}_${Date.now()}`
  try {
    const defaultPluginPath = join(temp, "default-plugin.mjs")
    const priorityPluginPath = join(temp, "priority-plugin.mjs")
    await writeFile(defaultPluginPath, `
const calls = globalThis[${JSON.stringify(callsKey)}] ??= []
calls.push("module:default")
export default async function defaultPlugin(input, options) {
  calls.push(\`default-plugin:\${input.directory}:\${options.mode}\`)
  return {
    config(config) {
      calls.push(\`default-config:\${Object.keys(config).sort().join(",")}\`)
    },
    "tool.execute.before": (_input, output) => {
      calls.push("default-tool-before")
      output.args = { ...output.args, patched: true }
    }
  }
}
`, "utf8")
    await writeFile(priorityPluginPath, `
const calls = globalThis[${JSON.stringify(callsKey)}] ??= []
calls.push("module:priority")
export function plugin() {
  calls.push("named-plugin-should-not-run")
  return { "tool.execute.before": (_input, output) => { output.args = { ...output.args, named: true } } }
}
export function opencode() {
  calls.push("opencode-should-not-run")
  return { "tool.execute.before": (_input, output) => { output.args = { ...output.args, opencode: true } } }
}
export default function preferredDefault() {
  calls.push("preferred-default")
  return { "tool.execute.before": (_input, output) => { output.args = { ...output.args, default: true } } }
}
`, "utf8")

    const { LegoHookHost } = await import("@helix/lego-hooks")
    const host = new LegoHookHost({ errorMode: "throw" })
    const loaded = await loadOpenCodePlugins({
      host,
      cwd: temp,
      pluginInput: { directory: temp, worktree: temp },
      config: { model: "gpt-test", theme: "dark" },
      plugins: [
        { spec: "./default-plugin.mjs", options: { mode: "live" }, source: { id: "runtime-default", scope: "project" } },
        { spec: pathToFileURL(priorityPluginPath).href, source: { id: "runtime-priority", scope: "project" } },
      ],
    })
    const beforePayload = { toolName: "bash", sessionID: "ses_runtime", toolCallID: "call_runtime", input: { command: "pwd" } }
    const beforeCleanup = await host.emit({
      type: "tool.call",
      timestamp: 1,
      payload: beforePayload,
    })
    await loaded[0]?.scope.dispose()
    const afterDefaultPayload = { toolName: "bash", sessionID: "ses_runtime", toolCallID: "call_runtime_2", input: { command: "pwd" } }
    const afterDefaultCleanup = await host.emit({
      type: "tool.call",
      timestamp: 2,
      payload: afterDefaultPayload,
    })
    await loaded[1]?.scope.dispose()
    const afterAllPayload = { toolName: "bash", sessionID: "ses_runtime", toolCallID: "call_runtime_3", input: { command: "pwd" } }
    const afterAllCleanup = await host.emit({
      type: "tool.call",
      timestamp: 3,
      payload: afterAllPayload,
    })

    const parallelHost = new LegoHookHost({ errorMode: "throw" })
    const parallelEvents: string[] = []
    const parallelLoaded = await loadOpenCodePlugins({
      host: parallelHost,
      pluginInput: { directory: temp, worktree: temp },
      plugins: [
        { spec: "npm:@example/slow-plugin", source: { id: "slow-plugin", scope: "project" } },
        { spec: "npm:@example/broken-plugin", source: { id: "broken-plugin", scope: "project" } },
        { spec: "npm:@example/fast-plugin", source: { id: "fast-plugin", scope: "project" } },
      ],
      importer: async (specifier) => {
        parallelEvents.push(`start:${specifier}`)
        if (specifier === "@example/slow-plugin") await new Promise((resolve) => setTimeout(resolve, 5))
        if (specifier === "@example/broken-plugin") throw new Error("load failed")
        parallelEvents.push(`finish:${specifier}`)
        return {
          default: () => ({
            "tool.execute.before": (_input: unknown, output: { args: Record<string, unknown> }) => {
              parallelEvents.push(`hook:${specifier}`)
              output.args.order = `${String(output.args.order ?? "")}${specifier.includes("slow") ? "slow" : "fast"} `
            },
          }),
        }
      },
    })
    const parallelPayload = { toolName: "bash", sessionID: "ses_parallel", toolCallID: "call_parallel", input: { order: "" } }
    await parallelHost.emit({ type: "tool.call", timestamp: 4, payload: parallelPayload })

    const retryHost = new LegoHookHost({ errorMode: "throw" })
    const retryEvents: string[] = []
    let retryReady = false
    const retryLoaded = await loadOpenCodePlugins({
      host: retryHost,
      cwd: temp,
      pluginInput: { directory: temp, worktree: temp },
      plugins: ["./retry-plugin.mjs"],
      wait: async () => {
        retryEvents.push("wait")
        retryReady = true
      },
      importer: async (specifier) => {
        retryEvents.push(`import:${retryReady ? "retry" : "initial"}:${specifier.startsWith("file://") ? "file" : specifier}`)
        if (!retryReady) throw new Error("Plugin directory is missing package.json or index file")
        return {
          default: () => ({
            "tool.execute.before": (_input: unknown, output: { args: Record<string, unknown> }) => {
              output.args.retry = true
            },
          }),
        }
      },
    })
    const retryPayload = { toolName: "bash", sessionID: "ses_retry", toolCallID: "call_retry", input: { command: "pwd" } }
    await retryHost.emit({ type: "tool.call", timestamp: 5, payload: retryPayload })

    const calls = Array.isArray((globalThis as Record<string, unknown>)[callsKey])
      ? [...((globalThis as Record<string, unknown>)[callsKey] as string[])]
      : []
    delete (globalThis as Record<string, unknown>)[callsKey]

    const cases: OpenCodePluginRuntimeImportNativeExactFixtureCase[] = [
      {
        id: "file-module-default-export",
        actual: {
          loadedSource: loaded[0]?.source,
          calls: calls.filter((item) => item.startsWith("module:default") || item.startsWith("default-")),
          beforeCleanupResultUndefined: beforeCleanup === undefined,
          beforePayload,
        },
        expected: {
          loadedSource: { id: "runtime-default", path: defaultPluginPath, scope: "project" },
          calls: ["module:default", `default-plugin:${temp}:live`, "default-config:model,theme", "default-tool-before"],
          beforeCleanupResultUndefined: true,
          beforePayload: { toolName: "bash", sessionID: "ses_runtime", toolCallID: "call_runtime", input: { command: "pwd", patched: true, default: true } },
        },
      },
      {
        id: "module-export-priority",
        actual: {
          loadedSource: loaded[1]?.source,
          priorityCalls: calls.filter((item) => item === "module:priority" || item === "preferred-default" || item.includes("should-not-run")),
          beforePayload,
        },
        expected: {
          loadedSource: { id: "runtime-priority", path: pathToFileURL(priorityPluginPath).href, scope: "project" },
          priorityCalls: ["module:priority", "preferred-default"],
          beforePayload: { toolName: "bash", sessionID: "ses_runtime", toolCallID: "call_runtime", input: { command: "pwd", patched: true, default: true } },
        },
      },
      {
        id: "cleanup-removes-live-hook",
        actual: {
          afterDefaultCleanupResultUndefined: afterDefaultCleanup === undefined,
          afterDefaultPayload,
          afterAllCleanupResultUndefined: afterAllCleanup === undefined,
          afterAllPayload,
        },
        expected: {
          afterDefaultCleanupResultUndefined: true,
          afterDefaultPayload: { toolName: "bash", sessionID: "ses_runtime", toolCallID: "call_runtime_2", input: { command: "pwd", default: true } },
          afterAllCleanupResultUndefined: true,
          afterAllPayload: { toolName: "bash", sessionID: "ses_runtime", toolCallID: "call_runtime_3", input: { command: "pwd" } },
        },
      },
      {
        id: "parallel-skip-failed-and-preserve-order",
        actual: {
          loadedSources: parallelLoaded.map((plugin) => plugin.source.id),
          events: parallelEvents,
          payload: parallelPayload,
        },
        expected: {
          loadedSources: ["slow-plugin", "fast-plugin"],
          events: [
            "start:@example/slow-plugin",
            "start:@example/broken-plugin",
            "start:@example/fast-plugin",
            "finish:@example/fast-plugin",
            "finish:@example/slow-plugin",
            "hook:@example/slow-plugin",
            "hook:@example/fast-plugin",
          ],
          payload: { toolName: "bash", sessionID: "ses_parallel", toolCallID: "call_parallel", input: { order: "slow fast " } },
        },
      },
      {
        id: "file-retry-after-wait",
        actual: {
          loadedSources: retryLoaded.map((plugin) => plugin.source),
          events: retryEvents,
          payload: retryPayload,
        },
        expected: {
          loadedSources: [{ id: "./retry-plugin.mjs", path: join(temp, "retry-plugin.mjs"), scope: "project" }],
          events: ["import:initial:file", "wait", "import:retry:file"],
          payload: { toolName: "bash", sessionID: "ses_retry", toolCallID: "call_retry", input: { command: "pwd", retry: true } },
        },
      },
    ]

    const fixtureWithoutFingerprint = {
      schemaVersion: 1 as const,
      product: "opencode" as const,
      atomID: "opencode.plugin.loader" as const,
      portID: "hook.bus" as const,
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
      evidenceRef: "conformance:opencode-plugin-runtime-import-native-exact-fixture" as const,
      replayRef: "plugin-runtime-import-native-exact:opencode" as const,
      fixtureID: "opencode-plugin-runtime-import:native-exact-fixture" as const,
      exactDiffStatus: "native-exact" as const,
      nativeParityClaim: true as const,
      sourceRefs: [
        "anomalyco/opencode:packages/opencode/src/plugin/loader.ts#PluginLoader.load,loadExternal,import(row.entry)",
        "anomalyco/opencode:packages/opencode/src/plugin/shared.ts#pluginSource,resolvePathPluginTarget,createPluginEntry,readV1Plugin",
        "helix:packages/adapters-opencode/src/plugin-loader.ts#loadOpenCodePlugins,resolvePluginSpecifier,pluginFromModule",
      ],
      cases,
      knownLossiness: [] as [],
    }
    return {
      ...fixtureWithoutFingerprint,
      fingerprint: openCodePluginRuntimeImportFingerprintObject(fixtureWithoutFingerprint),
    }
  } finally {
    delete (globalThis as Record<string, unknown>)[callsKey]
    await rm(temp, { recursive: true, force: true })
  }
}

export function verifyOpenCodePluginRuntimeImportNativeExactFixture(
  fixture: OpenCodePluginRuntimeImportNativeExactFixture,
): OpenCodePluginRuntimeImportNativeExactFixtureVerification {
  const issues: OpenCodePluginRuntimeImportNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-plugin-runtime-import.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.plugin.loader" || fixture.portID !== "hook.bus") {
    add("opencode-plugin-runtime-import.target", "Fixture must target opencode.plugin.loader and hook.bus.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-plugin-runtime-import.native-claim", "Plugin runtime import fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-plugin-runtime-import.lossiness", "Native plugin runtime import fixture cannot retain known lossiness.")
  }
  for (const source of ["packages/opencode/src/plugin/loader.ts", "packages/opencode/src/plugin/shared.ts", "packages/adapters-opencode/src/plugin-loader.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-plugin-runtime-import.source-ref", `Missing source ref ${source}.`)
  }
  for (const item of fixture.cases) {
    if (!openCodePluginRuntimeImportSameJSON(item.actual, item.expected)) {
      add("opencode-plugin-runtime-import.case", "Case actual output must match expected pinned OpenCode plugin runtime import behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodePluginRuntimeImportFingerprintObject(withoutFingerprint)) {
    add("opencode-plugin-runtime-import.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

export async function captureOpenCodePluginNpmInstallNativeExactFixture(): Promise<OpenCodePluginNpmInstallNativeExactFixture> {
  const existingCalls: Array<{ dir: string; add: string[] }> = []
  const existing = await openCodeNpmAdd("bad:name*plugin@1.0.0", {
    cacheDir: "C:\\opencode-cache",
    platform: "win32",
    exists: async (path) => path.endsWith("node_modules/bad:name*plugin".replaceAll("/", "\\")) || path.includes("node_modules/bad:name*plugin"),
    reify: async (input) => {
      existingCalls.push(input)
      return { edgesOut: [] }
    },
    resolveEntryPoint: (_name, dir) => ({ directory: dir, entrypoint: `${dir}/index.js` }),
  })

  const reifyCalls: Array<{ dir: string; add: string[] }> = []
  const tree = await openCodeNpmAdd("@scope/demo@1.2.3", {
    cacheDir: "/cache",
    exists: async () => false,
    reify: async (input) => {
      reifyCalls.push(input)
      return { edgesOut: [{ name: "@scope/demo", path: "/cache/packages/@scope/demo@1.2.3/node_modules/@scope/demo" }] }
    },
    resolveEntryPoint: (name, dir) => ({ directory: dir, entrypoint: `file://${dir}/${name.includes("/") ? "scoped" : "index"}.js` }),
  })

  const fallbackCalls: Array<{ dir: string; add: string[] }> = []
  const fallback = await openCodeNpmAdd("fallback-plugin@latest", {
    cacheDir: "/cache",
    exists: async () => false,
    reify: async (input) => {
      fallbackCalls.push(input)
      return { edgesOut: [] }
    },
    resolveEntryPoint: (_name, dir) => ({ directory: dir, entrypoint: `file://${dir}/index.js` }),
  })

  let failure: unknown
  try {
    await openCodeNpmAdd("missing-plugin@latest", {
      cacheDir: "/cache",
      exists: async () => false,
      reify: async () => ({ edgesOut: [] }),
      resolveEntryPoint: (_name, dir) => ({ directory: dir }),
    })
  } catch (error) {
    failure = {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      add: error instanceof OpenCodeNpmInstallFailedError ? error.add : undefined,
      dir: error instanceof OpenCodeNpmInstallFailedError ? error.dir : undefined,
    }
  }

  const bareCalls: Array<{ dir: string; add: string[] }> = []
  const bare = await resolveOpenCodeNpmPluginInstallTarget("bare-plugin", {
    cacheDir: "/cache",
    exists: async () => false,
    reify: async (input) => {
      bareCalls.push(input)
      return { edgesOut: [{ name: "bare-plugin", path: "/cache/packages/bare-plugin@latest/node_modules/bare-plugin" }] }
    },
    resolveEntryPoint: (_name, dir) => ({ directory: dir, entrypoint: `file://${dir}/index.js` }),
  })

  const cases: OpenCodePluginNpmInstallNativeExactFixtureCase[] = [
    {
      id: "bare-plugin-spec-installs-latest",
      actual: {
        directory: bare.directory,
        entrypoint: bare.entrypoint,
        pkg: bare.pkg,
        name: bare.name,
        cacheDir: bare.cacheDir,
        reified: bare.reified,
        reifyAdd: bare.reifyAdd,
        reifyCalls: bareCalls,
      },
      expected: {
        directory: "/cache/packages/bare-plugin@latest/node_modules/bare-plugin",
        entrypoint: "file:///cache/packages/bare-plugin@latest/node_modules/bare-plugin/index.js",
        pkg: "bare-plugin@latest",
        name: "bare-plugin",
        cacheDir: "/cache/packages/bare-plugin@latest",
        reified: true,
        reifyAdd: ["bare-plugin@latest"],
        reifyCalls: [{ dir: "/cache/packages/bare-plugin@latest", add: ["bare-plugin@latest"] }],
      },
    },
    {
      id: "existing-cache-skips-reify",
      actual: {
        directory: existing.directory,
        entrypoint: existing.entrypoint,
        name: existing.name,
        cacheDir: existing.cacheDir,
        reified: existing.reified,
        reifyCalls: existingCalls,
      },
      expected: {
        directory: "C:\\opencode-cache/packages/bad_name_plugin@1.0.0/node_modules/bad:name*plugin",
        entrypoint: "C:\\opencode-cache/packages/bad_name_plugin@1.0.0/node_modules/bad:name*plugin/index.js",
        name: "bad:name*plugin",
        cacheDir: "C:\\opencode-cache/packages/bad_name_plugin@1.0.0",
        reified: false,
        reifyCalls: [],
      },
    },
    {
      id: "reify-tree-first-edge",
      actual: {
        directory: tree.directory,
        entrypoint: tree.entrypoint,
        pkg: tree.pkg,
        name: tree.name,
        cacheDir: tree.cacheDir,
        reified: tree.reified,
        reifyCalls,
      },
      expected: {
        directory: "/cache/packages/@scope/demo@1.2.3/node_modules/@scope/demo",
        entrypoint: "file:///cache/packages/@scope/demo@1.2.3/node_modules/@scope/demo/scoped.js",
        pkg: "@scope/demo@1.2.3",
        name: "@scope/demo",
        cacheDir: "/cache/packages/@scope/demo@1.2.3",
        reified: true,
        reifyCalls: [{ dir: "/cache/packages/@scope/demo@1.2.3", add: ["@scope/demo@1.2.3"] }],
      },
    },
    {
      id: "fallback-entrypoint-after-empty-tree",
      actual: {
        directory: fallback.directory,
        entrypoint: fallback.entrypoint,
        name: fallback.name,
        reified: fallback.reified,
        reifyCalls: fallbackCalls,
      },
      expected: {
        directory: "/cache/packages/fallback-plugin@latest/node_modules/fallback-plugin",
        entrypoint: "file:///cache/packages/fallback-plugin@latest/node_modules/fallback-plugin/index.js",
        name: "fallback-plugin",
        reified: true,
        reifyCalls: [{ dir: "/cache/packages/fallback-plugin@latest", add: ["fallback-plugin@latest"] }],
      },
    },
    {
      id: "empty-tree-without-entrypoint-fails",
      actual: failure,
      expected: {
        name: "NpmInstallFailedError",
        message: "Failed to install npm package in /cache/packages/missing-plugin@latest",
        add: ["missing-plugin@latest"],
        dir: "/cache/packages/missing-plugin@latest",
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.plugin.loader" as const,
    portID: "hook.bus" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-plugin-npm-install-native-exact-fixture" as const,
    replayRef: "plugin-npm-install-native-exact:opencode" as const,
    fixtureID: "opencode-plugin-npm-install:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "anomalyco/opencode:packages/core/src/npm.ts#Npm.add,sanitize,resolveEntryPoint,reify",
      "anomalyco/opencode:packages/opencode/src/plugin/shared.ts#resolvePluginTarget",
      "helix:packages/adapters-opencode/src/plugin-loader.ts#openCodeNpmAdd,resolveOpenCodeNpmPluginInstallTarget",
    ],
    cases,
    knownLossiness: [] as [],
    residualGaps: ["opencode-real-npm-arborist-reify-not-replayed"] as ["opencode-real-npm-arborist-reify-not-replayed"],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodePluginRuntimeImportFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodePluginNpmInstallNativeExactFixture(
  fixture: OpenCodePluginNpmInstallNativeExactFixture,
): OpenCodePluginNpmInstallNativeExactFixtureVerification {
  const issues: OpenCodePluginNpmInstallNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-plugin-npm-install.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.plugin.loader" || fixture.portID !== "hook.bus") {
    add("opencode-plugin-npm-install.target", "Fixture must target opencode.plugin.loader and hook.bus.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-plugin-npm-install.native-claim", "Npm install fixture must retain native exact status for injectable install semantics.")
  }
  if (fixture.knownLossiness.length !== 0) add("opencode-plugin-npm-install.lossiness", "Native npm install fixture cannot retain known lossiness.")
  if (!fixture.residualGaps.includes("opencode-real-npm-arborist-reify-not-replayed")) {
    add("opencode-plugin-npm-install.residual-gap", "Fixture must keep real @npmcli/arborist reify execution outside the injectable install claim.")
  }
  for (const source of ["packages/core/src/npm.ts", "packages/opencode/src/plugin/shared.ts", "packages/adapters-opencode/src/plugin-loader.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-plugin-npm-install.source-ref", `Missing source ref ${source}.`)
  }
  for (const id of ["bare-plugin-spec-installs-latest", "existing-cache-skips-reify", "reify-tree-first-edge", "fallback-entrypoint-after-empty-tree", "empty-tree-without-entrypoint-fails"] as const) {
    if (!fixture.cases.some((item) => item.id === id)) add("opencode-plugin-npm-install.case-missing", `Missing case ${id}.`, id)
  }
  for (const item of fixture.cases) {
    if (!openCodePluginRuntimeImportSameJSON(item.actual, item.expected)) {
      add("opencode-plugin-npm-install.case", "Case actual output must match expected pinned OpenCode Npm.add behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodePluginRuntimeImportFingerprintObject(withoutFingerprint)) {
    add("opencode-plugin-npm-install.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

export async function captureOpenCodePluginPackageCompatibilityNativeExactFixture(): Promise<OpenCodePluginPackageCompatibilityNativeExactFixture> {
  const temp = await mkdtemp(join(tmpdir(), "helix-opencode-plugin-pkg-"))
  try {
    const exportPkgDir = join(temp, "export-plugin")
    const fallbackPkgDir = join(temp, "fallback-plugin")
    const escapePkgDir = join(temp, "escape-plugin")
    const incompatiblePkgDir = join(temp, "incompatible-plugin")
    await mkdir(join(exportPkgDir, "ui"), { recursive: true })
    await mkdir(fallbackPkgDir, { recursive: true })
    await mkdir(escapePkgDir, { recursive: true })
    await mkdir(incompatiblePkgDir, { recursive: true })

    await writeFile(join(exportPkgDir, "package.json"), JSON.stringify({
      name: "export-plugin",
      exports: {
        "./server": { import: "./server.mjs", config: { mode: "server" } },
        "./tui": { default: "./ui/tui.mjs", config: { slot: "home" } },
      },
      engines: { opencode: ">=1.0.0 <2.0.0" },
    }), "utf8")
    await writeFile(join(exportPkgDir, "server.mjs"), "export default {}\n", "utf8")
    await writeFile(join(exportPkgDir, "ui", "tui.mjs"), "export default {}\n", "utf8")

    await writeFile(join(fallbackPkgDir, "package.json"), JSON.stringify({
      name: "fallback-plugin",
      main: "./main.mjs",
      "oc-themes": ["./theme.json", "./theme.json"],
    }), "utf8")
    await writeFile(join(fallbackPkgDir, "main.mjs"), "export default {}\n", "utf8")
    await writeFile(join(fallbackPkgDir, "theme.json"), "{}\n", "utf8")

    await writeFile(join(escapePkgDir, "package.json"), JSON.stringify({
      name: "escape-plugin",
      exports: { "./server": "../escape.mjs" },
    }), "utf8")

    await writeFile(join(incompatiblePkgDir, "package.json"), JSON.stringify({
      name: "incompatible-plugin",
      main: "./main.mjs",
      engines: { opencode: ">=2.0.0" },
    }), "utf8")
    await writeFile(join(incompatiblePkgDir, "main.mjs"), "export default {}\n", "utf8")

    const exportPkg = await readOpenCodePluginPackage(exportPkgDir)
    const fallbackPkg = await readOpenCodePluginPackage(pathToFileURL(fallbackPkgDir).href)
    const exportEntry = await createOpenCodePluginPackageEntry("export-plugin", exportPkgDir, "server", exportPkg)
    await checkOpenCodePluginPackageCompatibility(exportEntry.target, "1.4.2", exportEntry.pkg)
    const fallbackServer = await createOpenCodePluginPackageEntry("fallback-plugin", fallbackPkgDir, "server", fallbackPkg)
    const fallbackTui = await resolveOpenCodePluginPackageForLoader({
      spec: "fallback-plugin",
      target: fallbackPkgDir,
      kind: "tui",
      opencodeVersion: "1.4.2",
    })
    const escapeError = await captureOpenCodePluginPackageFixtureError(() =>
      createOpenCodePluginPackageEntry("escape-plugin", escapePkgDir, "server"),
    )
    const incompatibleNpm = await resolveOpenCodePluginPackageForLoader({
      spec: "incompatible-plugin",
      target: incompatiblePkgDir,
      kind: "server",
      opencodeVersion: "1.5.0",
    })
    const incompatibleFile = await resolveOpenCodePluginPackageForLoader({
      spec: pathToFileURL(incompatiblePkgDir).href,
      target: pathToFileURL(incompatiblePkgDir).href,
      kind: "server",
      opencodeVersion: "1.5.0",
    })
    const zeroMajorNpm = await resolveOpenCodePluginPackageForLoader({
      spec: "incompatible-plugin",
      target: incompatiblePkgDir,
      kind: "server",
      opencodeVersion: "0.9.0",
    })

    const cases: OpenCodePluginPackageCompatibilityNativeExactFixtureCase[] = [
      {
        id: "package-targets-export-config",
        actual: {
          targets: openCodePluginPackageTargets(exportPkg),
          pkgName: exportPkg.json.name,
        },
        expected: {
          targets: [
            { kind: "server", opts: { mode: "server" } },
            { kind: "tui", opts: { slot: "home" } },
          ],
          pkgName: "export-plugin",
        },
      },
      {
        id: "main-and-theme-target-fallback",
        actual: {
          targets: openCodePluginPackageTargets(fallbackPkg),
          serverEntry: fallbackServer.entry,
          tuiResolution: fallbackTui,
        },
        expected: {
          targets: [{ kind: "server" }, { kind: "tui" }],
          serverEntry: pathToFileURL(join(fallbackPkgDir, "main.mjs")).href,
          tuiResolution: { ok: false, stage: "missing", message: "Plugin fallback-plugin does not expose a tui entrypoint" },
        },
      },
      {
        id: "entry-resolution-and-compatibility-pass",
        actual: {
          source: exportEntry.source,
          target: exportEntry.target,
          entry: exportEntry.entry,
          pkgName: exportEntry.pkg?.json.name,
          compatibility: "passed",
        },
        expected: {
          source: "npm",
          target: exportPkgDir,
          entry: pathToFileURL(join(exportPkgDir, "server.mjs")).href,
          pkgName: "export-plugin",
          compatibility: "passed",
        },
      },
      {
        id: "entry-outside-package-rejected",
        actual: escapeError,
        expected: "Plugin escape-plugin resolved server entry outside plugin directory",
      },
      {
        id: "npm-compatibility-gate",
        actual: {
          npm: incompatibleNpm,
          file: compactOpenCodePluginPackageResolution(incompatibleFile),
          zeroMajor: compactOpenCodePluginPackageResolution(zeroMajorNpm),
        },
        expected: {
          npm: { ok: false, stage: "compatibility", message: "Plugin requires opencode >=2.0.0 but running 1.5.0" },
          file: {
            ok: true,
            source: "file",
            entry: pathToFileURL(join(incompatiblePkgDir, "main.mjs")).href,
            pkgName: "incompatible-plugin",
          },
          zeroMajor: {
            ok: true,
            source: "npm",
            entry: pathToFileURL(join(incompatiblePkgDir, "main.mjs")).href,
            pkgName: "incompatible-plugin",
          },
        },
      },
    ]

    const fixtureWithoutFingerprint = {
      schemaVersion: 1 as const,
      product: "opencode" as const,
      atomID: "opencode.plugin.loader" as const,
      portID: "hook.bus" as const,
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
      evidenceRef: "conformance:opencode-plugin-package-compatibility-native-exact-fixture" as const,
      replayRef: "plugin-package-compatibility-native-exact:opencode" as const,
      fixtureID: "opencode-plugin-package-compatibility:native-exact-fixture" as const,
      exactDiffStatus: "native-exact" as const,
      nativeParityClaim: true as const,
      sourceRefs: [
        "anomalyco/opencode:packages/opencode/src/plugin/shared.ts#createPluginEntry,resolvePluginEntrypoint,checkPluginCompatibility,readPackageThemes",
        "anomalyco/opencode:packages/opencode/src/plugin/install.ts#packageTargets,readPluginManifest",
        "anomalyco/opencode:packages/opencode/src/plugin/loader.ts#PluginLoader.resolve",
        "helix:packages/adapters-opencode/src/plugin-loader.ts#readOpenCodePluginPackage,createOpenCodePluginPackageEntry,resolveOpenCodePluginPackageForLoader",
      ],
      cases,
      knownLossiness: [] as [],
      residualGaps: ["opencode-real-npm-arborist-reify-not-replayed"] as ["opencode-real-npm-arborist-reify-not-replayed"],
    }
    return {
      ...fixtureWithoutFingerprint,
      fingerprint: openCodePluginRuntimeImportFingerprintObject(fixtureWithoutFingerprint),
    }
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
}

export function verifyOpenCodePluginPackageCompatibilityNativeExactFixture(
  fixture: OpenCodePluginPackageCompatibilityNativeExactFixture,
): OpenCodePluginPackageCompatibilityNativeExactFixtureVerification {
  const issues: OpenCodePluginPackageCompatibilityNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-plugin-package-compatibility.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.plugin.loader" || fixture.portID !== "hook.bus") {
    add("opencode-plugin-package-compatibility.target", "Fixture must target opencode.plugin.loader and hook.bus.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-plugin-package-compatibility.native-claim", "Package compatibility fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-plugin-package-compatibility.lossiness", "Package compatibility fixture cannot retain known lossiness.")
  }
  if (!fixture.residualGaps.includes("opencode-real-npm-arborist-reify-not-replayed")) {
    add("opencode-plugin-package-compatibility.residual-gap", "Fixture must keep real @npmcli/arborist reify execution outside the native package-compatibility claim.")
  }
  for (const source of ["packages/opencode/src/plugin/shared.ts", "packages/opencode/src/plugin/install.ts", "packages/opencode/src/plugin/loader.ts", "packages/adapters-opencode/src/plugin-loader.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-plugin-package-compatibility.source-ref", `Missing source ref ${source}.`)
  }
  for (const id of ["package-targets-export-config", "main-and-theme-target-fallback", "entry-resolution-and-compatibility-pass", "entry-outside-package-rejected", "npm-compatibility-gate"] as const) {
    if (!fixture.cases.some((item) => item.id === id)) add("opencode-plugin-package-compatibility.case-missing", `Missing case ${id}.`, id)
  }
  for (const item of fixture.cases) {
    if (!openCodePluginRuntimeImportSameJSON(item.actual, item.expected)) {
      add("opencode-plugin-package-compatibility.case", "Case actual output must match expected pinned OpenCode package target and compatibility behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodePluginRuntimeImportFingerprintObject(withoutFingerprint)) {
    add("opencode-plugin-package-compatibility.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

async function captureOpenCodePluginPackageFixtureError(action: () => Promise<unknown>): Promise<string> {
  try {
    await action()
  } catch (error) {
    return openCodePluginErrorMessage(error)
  }
  return ""
}

function compactOpenCodePluginPackageResolution(value: OpenCodePluginPackageLoaderResolution): unknown {
  if (!value.ok) return value
  return {
    ok: true,
    source: value.value.source,
    entry: value.value.entry,
    pkgName: value.value.pkg?.json.name,
  }
}

function openCodePluginRuntimeImportSameJSON(left: unknown, right: unknown): boolean {
  return openCodePluginRuntimeImportStableJSON(left) === openCodePluginRuntimeImportStableJSON(right)
}

function openCodePluginRuntimeImportFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodePluginRuntimeImportStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodePluginRuntimeImportStableJSON(value: unknown): string {
  return JSON.stringify(openCodePluginRuntimeImportSortStable(value))
}

function openCodePluginRuntimeImportSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodePluginRuntimeImportSortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodePluginRuntimeImportSortStable(entry)]),
  )
}
