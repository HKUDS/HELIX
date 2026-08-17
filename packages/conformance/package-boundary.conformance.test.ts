import { execFile } from "node:child_process"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { promisify } from "node:util"
import { describe, expect, it } from "vitest"

interface PackageManifest {
  name: string
  private?: boolean
  dependencies?: Record<string, string>
  exports?: Record<string, string>
}

interface PackResult {
  name: string
  files: Array<{ path: string }>
}

const execFileAsync = promisify(execFile)
const packageRoot = join(process.cwd(), "packages")

describe("package boundary", () => {
  it("dry-runs publishable package tarballs through npm pack", async () => {
    for (const entry of packageEntries().filter((pkg) => !pkg.manifest.private)) {
      const result = await npmPackDryRun(entry.dir)
      const files = result.files.map((file) => file.path)

      expect(result.name, entry.dir).toBe(entry.manifest.name)
      expect(files, entry.manifest.name).toContain("package.json")
      expect(files.some((file) => file.includes("node_modules/")), entry.manifest.name).toBe(false)
      expect(files.some((file) => file.includes(".env")), entry.manifest.name).toBe(false)
      expect(files.some((file) => file.endsWith(".test.ts")), entry.manifest.name).toBe(false)

      for (const target of Object.values(entry.manifest.exports ?? {})) {
        expect(files, `${entry.manifest.name} export ${target}`).toContain(stripLeadingDotSlash(target))
      }
    }
  }, 30_000)

  it("keeps common packages and product personalities from pulling unrelated personalities", () => {
    const leaks: Array<{ package: string; dependency: string; reason: string }> = []

    for (const entry of packageEntries()) {
      const dependencyNames = Object.keys(entry.manifest.dependencies ?? {})

      if (isCommonPackage(entry.manifest.name)) {
        for (const dependency of dependencyNames) {
          if (isPersonalityPackage(dependency)) {
            leaks.push({ package: entry.manifest.name, dependency, reason: "common package depends on personality package" })
          }
        }
      }

      if (isOpenCodePersonalityPackage(entry.manifest.name)) {
        for (const dependency of dependencyNames) {
          if (isPiPersonalityPackage(dependency) || isNanobotPersonalityPackage(dependency)) {
            leaks.push({ package: entry.manifest.name, dependency, reason: "OpenCode personality depends on another personality" })
          }
        }
      }

      if (isPiPersonalityPackage(entry.manifest.name)) {
        for (const dependency of dependencyNames) {
          if (isOpenCodePersonalityPackage(dependency) || isNanobotPersonalityPackage(dependency)) {
            leaks.push({ package: entry.manifest.name, dependency, reason: "Pi personality depends on another personality" })
          }
        }
      }

      if (isNanobotPersonalityPackage(entry.manifest.name)) {
        for (const dependency of dependencyNames) {
          if (isOpenCodePersonalityPackage(dependency) || isPiPersonalityPackage(dependency)) {
            leaks.push({ package: entry.manifest.name, dependency, reason: "Nanobot personality depends on another personality" })
          }
        }
      }
    }

    expect(leaks).toEqual([])
  })
})

function packageEntries(): Array<{ dir: string; manifest: PackageManifest }> {
  return readdirSync(packageRoot)
    .map((dir) => ({ dir, manifest: readPackageManifest(dir) }))
    .sort((left, right) => left.manifest.name.localeCompare(right.manifest.name))
}

function readPackageManifest(dir: string): PackageManifest {
  return JSON.parse(readFileSync(join(packageRoot, dir, "package.json"), "utf8")) as PackageManifest
}

async function npmPackDryRun(dir: string): Promise<PackResult> {
  const { stdout } = await execFileAsync(npmBinary(), ["pack", "--dry-run", "--json", `./packages/${dir}`], {
    cwd: process.cwd(),
    maxBuffer: 1024 * 1024,
  })
  const parsed = JSON.parse(stdout) as PackResult[]
  if (!parsed[0]) throw new Error(`npm pack dry-run produced no output for ${dir}`)
  return parsed[0]
}

function npmBinary(): string {
  return process.platform === "win32" ? "npm.cmd" : "npm"
}

function stripLeadingDotSlash(path: string): string {
  return path.startsWith("./") ? path.slice(2) : path
}

function isCommonPackage(name: string): boolean {
  return (
    name === "@helix/contracts" ||
    name === "@helix/lego-runtime" ||
    name === "@helix/lego-session" ||
    name === "@helix/lego-hooks" ||
    name === "@helix/lego-agent-loop" ||
    name === "@helix/lego-tools" ||
    name === "@helix/lego-provider" ||
    name === "@helix/lego-prompt" ||
    name === "@helix/lego-config" ||
    name === "@helix/lego-ui"
  )
}

function isPersonalityPackage(name: string): boolean {
  return isOpenCodePersonalityPackage(name) || isPiPersonalityPackage(name) || isNanobotPersonalityPackage(name)
}

function isOpenCodePersonalityPackage(name: string): boolean {
  return name === "@helix/adapters-opencode" || name === "@opencode-ai/plugin"
}

function isPiPersonalityPackage(name: string): boolean {
  return name === "@helix/adapters-pi" || name === "@earendil-works/pi-coding-agent"
}

function isNanobotPersonalityPackage(name: string): boolean {
  return name === "@helix/adapters-nanobot"
}
