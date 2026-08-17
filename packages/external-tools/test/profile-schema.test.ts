import { describe, expect, it } from "vitest"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { extname, join, relative, resolve } from "node:path"
import { assertExternalToolProductSupported, externalToolProductSupport, getExternalToolProfile, validateExternalToolProfile } from "../src/index"
import type { ExternalToolProduct, ExternalToolProfile } from "../src/index"

interface PackageManifest {
  name?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

describe("external tool profiles", () => {
  it("validates the claude-tap profile", () => {
    const profile = getExternalToolProfile("claude-tap")
    const verification = validateExternalToolProfile(profile)

    expect(verification.ok).toBe(true)
    expect(profile.repository).toBe("https://github.com/liaohch3/claude-tap")
    expect(profile.license).toBe("MIT")
    expect(profile.licenseURL).toBe("https://github.com/liaohch3/claude-tap/blob/main/LICENSE")
    expect(profile.copyrightNotice).toBe("Copyright (c) 2025 liaohch3")
    expect(profile.vendoredSource).toBe(false)
    expect(profile.supportedProducts).toContain("pi-mono")
    expect(profile.unsupportedProducts).toContain("nanobot")
    expect(profile.unsupportedGaps).toEqual([
      expect.objectContaining({
        product: "nanobot",
        status: "needs-upstream-support",
        nextAction: expect.stringContaining("Helix-owned Nanobot capture path"),
      }),
    ])
  })

  it("keeps the checked-in claude-tap JSON profile aligned with the runtime profile", () => {
    const runtimeProfile = getExternalToolProfile("claude-tap")
    const diskProfile = JSON.parse(readFileSync(resolve("external-tools/claude-tap/tool.profile.json"), "utf8")) as ExternalToolProfile

    expect(validateExternalToolProfile(diskProfile).ok).toBe(true)
    expect(diskProfile).toEqual(runtimeProfile)
  })

  it("keeps unsupported products as hard gateway boundaries", () => {
    expect(externalToolProductSupport("claude-tap", "pi-mono")).toMatchObject({ supported: true })
    expect(externalToolProductSupport("claude-tap", "nanobot")).toMatchObject({
      supported: false,
      gap: expect.objectContaining({
        product: "nanobot",
        status: "needs-upstream-support",
      }),
    })
    expect(() => assertExternalToolProductSupported("claude-tap", "nanobot", "capture")).toThrow("does not support product nanobot")
    expect(() => assertExternalToolProductSupported("claude-tap", "nanobot", "capture")).toThrow("Helix-owned Nanobot capture path")
  })

  it("keeps real capture examples behind explicit shell consent", () => {
    for (const file of ["opencode", "pi-mono", "hermes-agent"]) {
      const example = readFileSync(resolve("external-tools/claude-tap/examples", `${file}.capture.md`), "utf8")
      expect(example).toContain("HELIX_EXTERNAL_CAPTURE=1 npm run helix -- external-tools capture claude-tap")
    }
  })

  it("keeps claude-tap as an external tool instead of vendoring its source", () => {
    const root = resolve("external-tools/claude-tap")
    const files = listFiles(root).map((file) => relative(root, file).replaceAll("\\", "/"))
    const forbiddenFiles = files.filter((file) => isVendoredClaudeTapSource(file))
    const unexpectedExtensions = files.filter((file) => ![".json", ".jsonl", ".md", ".mjs"].includes(extname(file)))

    expect(files).toEqual(expect.arrayContaining([
      "README.md",
      "NOTICE.md",
      "tool.profile.json",
      "preflight.mjs",
      "schemas/native-capture.schema.json",
      "fixtures/minimal-jsonl.trace.jsonl",
    ]))
    expect(forbiddenFiles).toEqual([])
    expect(unexpectedExtensions).toEqual([])
  })

  it("keeps claude-tap out of workspace package dependencies", () => {
    const leaks = workspacePackageManifests().flatMap(({ path, manifest }) => {
      return dependencyEntries(manifest)
        .filter((entry) => isClaudeTapDependency(entry.name))
        .map((entry) => ({ path, package: manifest.name, section: entry.section, dependency: entry.name }))
    })

    expect(leaks).toEqual([])
  })

  it("publishes machine-readable artifact schemas for claude-tap evidence", () => {
    const profile = getExternalToolProfile("claude-tap")
    const runManifest = JSON.parse(readFileSync(resolve("external-tools/claude-tap/schemas/run-manifest.schema.json"), "utf8")) as Record<string, unknown>
    const nativeCapture = JSON.parse(readFileSync(resolve("external-tools/claude-tap/schemas/native-capture.schema.json"), "utf8")) as Record<string, unknown>
    const runManifestProductEnum = ((runManifest as { properties?: { product?: { enum?: string[] } } }).properties?.product?.enum ?? []) as ExternalToolProduct[]
    const nativeCaptureProductEnum = ((nativeCapture as { properties?: { product?: { enum?: string[] } } }).properties?.product?.enum ?? []) as ExternalToolProduct[]
    const unsupportedProducts = profile.unsupportedProducts ?? []

    expect(runManifest).toMatchObject({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      properties: {
        artifactKind: { const: "external-tool-run-manifest" },
        toolID: { const: "claude-tap" },
        captureMode: { enum: ["real-capture", "capture-only", "import-only", "dry-run"] },
        exitCode: { type: "integer", minimum: 0 },
      },
    })
    expect(runManifest.required).toEqual(expect.arrayContaining(["runID", "toolVersion", "invocation", "startedAt", "finishedAt", "exitCode", "artifacts"]))
    expect(runManifestProductEnum).toEqual(profile.supportedProducts)
    expect(runManifestProductEnum.filter((product) => unsupportedProducts.includes(product))).toEqual([])
    expect((runManifest as { $defs?: { sha256?: { pattern?: string }; artifact?: { properties?: { hash?: { $ref?: string }; bytes?: { minimum?: number }; format?: { enum?: string[] }; role?: { enum?: string[] } } } } }).$defs?.sha256).toMatchObject({
      pattern: "^sha256:[a-f0-9]{64}$",
    })
    expect((runManifest as { $defs?: { artifact?: { properties?: { hash?: { $ref?: string }; bytes?: { minimum?: number }; format?: { enum?: string[] }; role?: { enum?: string[] } } } } }).$defs?.artifact?.properties).toMatchObject({
      hash: { $ref: "#/$defs/sha256" },
      bytes: { minimum: 0 },
      format: { enum: ["jsonl", "json", "compact", "html", "log", "unknown"] },
      role: { enum: ["raw-trace", "viewer", "log", "other"] },
    })

    expect(nativeCapture).toMatchObject({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      properties: {
        artifactKind: { const: "external-tool-native-capture" },
        sourceTool: { const: "claude-tap" },
        captureMode: { enum: ["real-capture", "capture-only", "import-only"] },
      },
    })
    expect(nativeCapture.required).toEqual(expect.arrayContaining(["sourceArtifact", "lossiness", "providerRequests", "promptEvidence", "toolEvidence", "streamEvidence", "usageEvidence", "stageEvidence", "redactionPolicy", "summary"]))
    expect(nativeCaptureProductEnum).toEqual(profile.supportedProducts)
    expect(nativeCaptureProductEnum.filter((product) => unsupportedProducts.includes(product))).toEqual([])
    expect((nativeCapture as { properties?: { redactionPolicy?: { properties?: Record<string, unknown> }; sourceArtifact?: { properties?: Record<string, unknown> } } }).properties?.redactionPolicy?.properties).toMatchObject({
      version: { const: 1 },
      containsRawPrompt: { const: false },
      credentials: { const: "redacted" },
      hostPaths: { const: "normalized" },
    })
    expect((nativeCapture as { $defs?: { sha256?: { pattern?: string } } }).$defs?.sha256).toMatchObject({
      pattern: "^sha256:[a-f0-9]{64}$",
    })
    expect((nativeCapture as { properties?: { sourceArtifact?: { properties?: { hash?: { $ref?: string }; format?: { enum?: string[] } } } } }).properties?.sourceArtifact?.properties).toMatchObject({
      format: { enum: ["jsonl", "json", "compact"] },
      hash: { $ref: "#/$defs/sha256" },
    })
  })
})

function listFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(root, entry.name)
    if (entry.isDirectory()) return listFiles(fullPath)
    if (!entry.isFile() && !statSync(fullPath).isFile()) return []
    return [fullPath]
  })
}

function isVendoredClaudeTapSource(file: string): boolean {
  const segments = file.split("/")
  const basename = segments[segments.length - 1]
  return (
    segments.includes("claude_tap") ||
    basename === "pyproject.toml" ||
    basename === "uv.lock" ||
    basename === "requirements.txt" ||
    basename === "requirements-dev.txt" ||
    file.endsWith(".py") ||
    file.endsWith(".pyi")
  )
}

function workspacePackageManifests(): Array<{ path: string; manifest: PackageManifest }> {
  const rootPackage = resolve("package.json")
  const packageRoot = resolve("packages")
  const packageFiles = readdirSync(packageRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(packageRoot, entry.name, "package.json"))
    .filter((path) => existsSync(path))
  return [rootPackage, ...packageFiles].map((path) => ({
    path: relative(process.cwd(), path).replaceAll("\\", "/"),
    manifest: JSON.parse(readFileSync(path, "utf8")) as PackageManifest,
  }))
}

function dependencyEntries(manifest: PackageManifest): Array<{ section: string; name: string }> {
  return ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"].flatMap((section) => (
    Object.keys((manifest as Record<string, Record<string, string> | undefined>)[section] ?? {}).map((name) => ({ section, name }))
  ))
}

function isClaudeTapDependency(name: string): boolean {
  return name === "claude-tap" || name === "claude_tap" || name === "@liaohch3/claude-tap"
}
