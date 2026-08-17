import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { isAbsolute, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { ModuleKind, ScriptTarget, transpileModule } from "typescript"
import type { LegoHookHost } from "@helix/lego-hooks"
import { loadPiExtension, type PiExtension, type PiExtensionAPI } from "./extension-adapter"

export type PiExtensionSpec =
  | string
  | PiExtension
  | {
      spec: string | PiExtension
      source?: { id?: string; path?: string; scope?: string }
    }

export type PiExtensionImporter = (specifier: string) => Promise<unknown>

export interface LoadPiExtensionsInput {
  host: LegoHookHost
  extensions: PiExtensionSpec[]
  cwd?: string
  importer?: PiExtensionImporter
}

export interface LoadedPiExtension {
  spec: PiExtensionSpec
  source: { id: string; path?: string; scope?: string }
  api: PiExtensionAPI
  dispose(): Promise<void>
  reload(): Promise<LoadedPiExtension>
}

export async function loadPiExtensions(input: LoadPiExtensionsInput): Promise<LoadedPiExtension[]> {
  const cwd = input.cwd ?? String(input.host.services.get("cwd") ?? process.cwd())
  const importer = input.importer ?? defaultImporter
  const loaded: LoadedPiExtension[] = []
  for (const [index, raw] of input.extensions.entries()) {
    loaded.push(await loadOnePiExtension(raw, { ...input, cwd, importer, index }))
  }
  return loaded
}

async function loadOnePiExtension(
  raw: PiExtensionSpec,
  input: LoadPiExtensionsInput & { cwd: string; importer: PiExtensionImporter; index: number },
): Promise<LoadedPiExtension> {
  const normalized = await normalizeExtension(raw, { cwd: input.cwd, importer: input.importer, index: input.index })
  const api = await loadPiExtension({
    host: input.host,
    extension: normalized.extension,
    source: normalized.source,
  })
  return {
    spec: raw,
    source: normalized.source,
    api,
    dispose: () => api.dispose(),
    async reload() {
      await api.dispose()
      return loadOnePiExtension(raw, input)
    },
  }
}

async function normalizeExtension(
  raw: PiExtensionSpec,
  input: { cwd: string; importer: PiExtensionImporter; index: number },
): Promise<{ extension: PiExtension; source: { id: string; path?: string; scope?: string } }> {
  if (typeof raw === "function") {
    return {
      extension: raw,
      source: { id: raw.name || `pi-extension-${input.index}`, scope: "project" },
    }
  }
  if (typeof raw === "string") {
    const resolved = resolveExtensionSpecifier(raw, input.cwd)
    return {
      extension: extensionFromModule(await input.importer(resolved.importSpecifier), raw),
      source: {
        id: raw,
        scope: "project",
        ...(resolved.path ? { path: resolved.path } : {}),
      },
    }
  }
  if (typeof raw.spec === "function") {
    return {
      extension: raw.spec,
      source: {
        id: raw.source?.id ?? raw.spec.name ?? `pi-extension-${input.index}`,
        scope: raw.source?.scope ?? "project",
        ...(raw.source?.path ? { path: raw.source.path } : {}),
      },
    }
  }

  const resolved = resolveExtensionSpecifier(raw.spec, input.cwd)
  return {
    extension: extensionFromModule(await input.importer(resolved.importSpecifier), raw.spec),
    source: {
      id: raw.source?.id ?? raw.spec,
      scope: raw.source?.scope ?? sourceScopeFor(raw.spec),
      ...(raw.source?.path ?? resolved.path ? { path: raw.source?.path ?? resolved.path } : {}),
    },
  }
}

function resolveExtensionSpecifier(spec: string, cwd: string): { importSpecifier: string; path?: string } {
  if (spec.startsWith("npm:")) return { importSpecifier: spec.slice("npm:".length) }
  if (spec.startsWith("git:")) return { importSpecifier: spec }
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

function sourceScopeFor(spec: string): string {
  if (spec.startsWith("npm:") || spec.startsWith("git:")) return "global"
  return "project"
}

function extensionFromModule(moduleValue: unknown, spec: string): PiExtension {
  if (typeof moduleValue === "function") return moduleValue as PiExtension
  if (isRecord(moduleValue)) {
    const candidate = moduleValue["default"] ?? moduleValue["extension"] ?? moduleValue["pi"]
    if (typeof candidate === "function") return candidate as PiExtension
  }
  throw new Error(`Pi extension ${spec} did not export an extension function`)
}

export async function importPiExtensionModule(specifier: string): Promise<unknown> {
  if (isTypeScriptFileSpecifier(specifier)) return importTypeScriptModule(specifier)
  return import(specifier)
}

async function defaultImporter(specifier: string): Promise<unknown> {
  return importPiExtensionModule(specifier)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isTypeScriptFileSpecifier(specifier: string): boolean {
  const path = specifier.startsWith("file:") ? fileURLToPath(specifier) : specifier
  return /\.tsx?$/.test(path)
}

async function importTypeScriptModule(specifier: string): Promise<unknown> {
  const path = specifier.startsWith("file:") ? fileURLToPath(specifier) : specifier
  const source = readFileSync(path, "utf8")
  const output = transpileModule(source, {
    fileName: path,
    compilerOptions: {
      module: ModuleKind.ESNext,
      target: ScriptTarget.ES2022,
      esModuleInterop: true,
      inlineSourceMap: true,
    },
  })
  const compiledPath = `${path}.helix-${process.pid}-${Date.now()}.mjs`
  writeFileSync(compiledPath, output.outputText, "utf8")
  try {
    return await import(`${pathToFileURL(compiledPath).href}?t=${Date.now()}`)
  } finally {
    rmSync(compiledPath, { force: true })
  }
}
