import { isAbsolute, resolve } from "node:path"
import { loadPiExtensions } from "./extension-loader"
import type {
  PiPackageInput,
  PiPackageKind,
  PiPackageManager,
  PiPackageRole,
  PiPackageSpecObject,
  PiResolvedPackage,
  PiSurfaceHarness,
} from "./pi-product-types"
import { currentPiCwd, isRecord } from "./pi-product-utils"

export function createPiPackageManager(harness: PiSurfaceHarness): PiPackageManager {
  return {
    kind: "pi-package-manager",
    plan(input = {}) {
      const cwd = input.cwd ?? currentPiCwd(harness)
      const configured = configuredPackageInputs(harness)
      const packages = [...configured.packages, ...(input.packages ?? [])]
        .map((spec, index) => resolvePackageInput(spec, { cwd, role: "package", index }))
        .filter((pkg) => pkg.enabled)
      const extensions = [...configured.extensions, ...(input.extensions ?? [])]
        .map((spec, index) => resolvePackageInput(spec, { cwd, role: "extension", index }))
        .filter((pkg) => pkg.enabled)
      return { product: "pi-mono", cwd, packages, extensions, all: [...packages, ...extensions] }
    },
    extensionSpecs(input = {}) {
      return this.plan({ ...(input.cwd ? { cwd: input.cwd } : {}), ...(input.extensions ? { extensions: input.extensions } : {}) }).extensions.map(
        (extension) => ({ spec: extension.spec, source: extension.source }),
      )
    },
    loadExtensions(input = {}) {
      const cwd = input.cwd ?? currentPiCwd(harness)
      return loadPiExtensions({
        host: harness.hooks,
        cwd,
        extensions: this.extensionSpecs({ cwd, ...(input.extensions ? { extensions: input.extensions } : {}) }),
        ...(input.importer ? { importer: input.importer } : {}),
      })
    },
    shrinkwrap(input = {}) {
      const plan = this.plan(input)
      return {
        lockfileVersion: 1,
        product: "pi-mono",
        cwd: plan.cwd,
        generatedBy: "helix",
        packages: plan.all.map((pkg) => ({
          id: pkg.id,
          spec: pkg.spec,
          role: pkg.role,
          kind: pkg.kind,
          importSpecifier: pkg.importSpecifier,
          ...(pkg.integrity ? { integrity: pkg.integrity } : {}),
          ...(pkg.path ? { path: pkg.path } : {}),
        })),
      }
    },
  }
}

export function configuredPackageInputs(harness: PiSurfaceHarness): { packages: PiPackageInput[]; extensions: PiPackageInput[] } {
  const values = harness.config?.merge().values ?? {}
  return {
    packages: packageInputList(values["packages"], "package"),
    extensions: packageInputList(values["extensions"], "extension"),
  }
}

export function packageInputsFromParams(value: unknown): PiPackageInput[] | undefined {
  if (!Array.isArray(value)) return undefined
  const inputs = value.flatMap((item): PiPackageInput[] => {
    if (typeof item === "string") return [item]
    if (isRecord(item) && typeof item["spec"] === "string") {
      const object: PiPackageSpecObject = { spec: item["spec"] }
      if (item["role"] === "package" || item["role"] === "extension") object.role = item["role"]
      if (typeof item["enabled"] === "boolean") object.enabled = item["enabled"]
      if (typeof item["integrity"] === "string") object.integrity = item["integrity"]
      if (isRecord(item["source"])) {
        const source: { id?: string; path?: string; scope?: string } = {}
        if (typeof item["source"]["id"] === "string") source.id = item["source"]["id"]
        if (typeof item["source"]["path"] === "string") source.path = item["source"]["path"]
        if (typeof item["source"]["scope"] === "string") source.scope = item["source"]["scope"]
        if (Object.keys(source).length > 0) object.source = source
      }
      return [object]
    }
    return []
  })
  return inputs.length > 0 ? inputs : undefined
}

function packageInputList(value: unknown, role: PiPackageRole): PiPackageInput[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item): PiPackageInput[] => {
    if (typeof item === "string") return [item]
    if (isRecord(item) && typeof item["spec"] === "string") return [{ ...item, role } as PiPackageSpecObject]
    return []
  })
}

function resolvePackageInput(input: PiPackageInput, context: { cwd: string; role: PiPackageRole; index: number }): PiResolvedPackage {
  const object = typeof input === "string" ? { spec: input } : input
  const spec = object.spec
  const kind = packageKind(spec)
  const path = packagePath(spec, context.cwd)
  const importSpecifier = packageImportSpecifier(spec, path)
  const id = object.source?.id ?? packageID(spec, context.index)
  const scope = object.source?.scope ?? (kind === "npm" || kind === "git" ? "global" : "project")
  const sourcePath = object.source?.path ?? path
  return {
    id,
    spec,
    role: object.role ?? context.role,
    kind,
    importSpecifier,
    enabled: object.enabled ?? true,
    ...(object.integrity ? { integrity: object.integrity } : {}),
    ...(path ? { path } : {}),
    source: { id, scope, ...(sourcePath ? { path: sourcePath } : {}) },
  }
}

function packageKind(spec: string): PiPackageKind {
  if (spec.startsWith("npm:")) return "npm"
  if (spec.startsWith("git:")) return "git"
  if (spec.startsWith("file:")) return "file"
  if (isLocalSpecifier(spec)) return "local"
  return "specifier"
}

function packagePath(spec: string, cwd: string): string | undefined {
  if (spec.startsWith("file:")) return spec.slice("file:".length)
  if (!isLocalSpecifier(spec)) return undefined
  return isAbsolute(spec) ? spec : resolve(cwd, spec)
}

function packageImportSpecifier(spec: string, path: string | undefined): string {
  if (spec.startsWith("npm:")) return spec.slice("npm:".length)
  if (path) return path
  return spec
}

function packageID(spec: string, index: number): string {
  if (spec.startsWith("npm:")) return spec.slice("npm:".length)
  if (spec.startsWith("git:")) return spec
  return spec || `pi-package-${index}`
}

function isLocalSpecifier(spec: string): boolean {
  return spec.startsWith(".") || spec.startsWith("/") || /\.(cjs|js|mjs|ts)$/.test(spec)
}

export type { PiPackageInput, PiPackageManager, PiPackagePlan, PiPackageShrinkwrap, PiResolvedPackage } from "./pi-product-types"
