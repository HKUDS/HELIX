import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { describe, expect, it } from "vitest"

type RiskPattern = {
  id: string
  pattern: RegExp
}

type CopyMatch = {
  file: string
  line: number
  patternID: string
  excerpt: string
}

const AUDITED_ROOTS = ["README.md", "TODO", "docs", "packages", "recipes", "scripts", "package.json", "tsconfig.json", "vitest.config.ts"]

const REQUIRED_AUDITED_FILES = [
  "README.md",
  "TODO/TODO-027.md",
  "docs/architecture.md",
  "docs/lego-block-catalog.md",
  "docs/migration.md",
  "docs/module-map.md",
  "docs/recipes.md",
  "docs/site/harness-builder.html",
  "docs/site/index.html",
  "packages/docs-site/src/index.ts",
  "packages/docs-site/src/server.ts",
  "recipes/opencode/README.md",
  "recipes/pi-mono/README.md",
]

const TEXT_EXTENSIONS = new Set([".cjs", ".css", ".html", ".js", ".json", ".md", ".mjs", ".ts", ".tsx", ".yaml", ".yml"])

const SKIPPED_PATH_PATTERNS = [
  /^docs\/reports(?:\/|$)/,
  /^packages\/conformance\/fixtures(?:\/|$)/,
  /^packages\/conformance\/todo27-misleading-native-copy\.conformance\.test\.ts$/,
  /(?:^|\/)\.git(?:\/|$)/,
  /(?:^|\/)coverage(?:\/|$)/,
  /(?:^|\/)dist(?:\/|$)/,
  /(?:^|\/)node_modules(?:\/|$)/,
]

const RISK_PATTERNS: RiskPattern[] = [
  {
    id: "placeholder-prompt-identity",
    pattern: /(?:compatible Helix|Helix-compatible|You are .*Helix|Helix runtime)/i,
  },
  {
    id: "fake-provider-native-claim",
    pattern:
      /(?:fake[- ]provider|fake provider).{0,120}(?:native|provider-backed|real provider|live|production|complete|parity|run)|(?:native|provider-backed|real provider|live|production|complete|parity|run).{0,120}(?:fake[- ]provider|fake provider)/i,
  },
  {
    id: "transition-state-native-claim",
    pattern:
      /(?:preview shell|metadata-only|native-like(?: scaffold)?).{0,120}(?:native parity|native-equivalent|native complete|原生完成|原生等价|complete evidence)|(?:native parity|native-equivalent|native complete|原生完成|原生等价|complete evidence).{0,120}(?:preview shell|metadata-only|native-like(?: scaffold)?)/i,
  },
]

const GUARDED_CONTEXT =
  /(?:not|no|do not|don't|cannot|can't|without|until|yet|still|only|placeholder|partial|lossy|lossiness|reject|rejects|rejected|fail|fails|failed|failure|prevent|blocked|guard|forbid|forbidden|unsupported|unverified|downgrade|negative|risk|must not|should not|nativeEvidenceRefs|fixtureIDs|knownLossiness|return false|TODO-024|TODO27|TODO-027|未|不|不能|不得|不是|不会|不要|仍|尚未|继续|防止|阻断|失败|拒绝|保留|避免|只|仅|负向|降级|缺口|未完成|冒充)/i

function excerptAround(line: string, matchIndex: number, matchLength: number): string {
  const start = Math.max(0, matchIndex - 180)
  const end = Math.min(line.length, matchIndex + matchLength + 180)
  return line.slice(start, end).replace(/\s+/g, " ").trim()
}

function extensionOf(file: string): string {
  const dotIndex = file.lastIndexOf(".")
  return dotIndex === -1 ? "" : file.slice(dotIndex)
}

function isSkippedPath(file: string): boolean {
  return SKIPPED_PATH_PATTERNS.some((pattern) => pattern.test(file))
}

function collectAuditedFiles(root: string): string[] {
  const files: string[] = []

  function visit(path: string): void {
    const fullPath = join(root, path)
    if (!existsSync(fullPath) || isSkippedPath(path)) return

    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      for (const entry of readdirSync(fullPath).sort()) {
        visit(join(path, entry))
      }
      return
    }

    if (!stat.isFile()) return
    const relativePath = relative(root, fullPath).replace(/\\/g, "/")
    if (isSkippedPath(relativePath)) return
    if (relativePath === "package-lock.json") return
    if (!TEXT_EXTENSIONS.has(extensionOf(relativePath))) return
    files.push(relativePath)
  }

  for (const path of AUDITED_ROOTS) {
    visit(path)
  }

  return [...new Set(files)].sort()
}

function lineMatches(pattern: RegExp, line: string): RegExpExecArray[] {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`
  return [...line.matchAll(new RegExp(pattern.source, flags))]
}

function collectMisleadingMatches(root: string, auditedFiles: string[]): { guarded: CopyMatch[]; unguarded: CopyMatch[] } {
  const guarded: CopyMatch[] = []
  const unguarded: CopyMatch[] = []

  for (const file of auditedFiles) {
    const fullPath = join(root, file)
    const lines = readFileSync(fullPath, "utf8").split(/\r?\n/)
    for (const [lineIndex, line] of lines.entries()) {
      for (const risk of RISK_PATTERNS) {
        const matches = lineMatches(risk.pattern, line)
        if (matches.length === 0) continue

        for (const match of matches) {
          const excerpt = excerptAround(line, match.index ?? 0, match[0].length)
          const context = [
            ...lines.slice(Math.max(0, lineIndex - 3), lineIndex),
            excerpt,
            ...lines.slice(lineIndex + 1, Math.min(lines.length, lineIndex + 4)),
          ].join("\n")
          const copyMatch = {
            file,
            line: lineIndex + 1,
            patternID: risk.id,
            excerpt,
          }

          if (GUARDED_CONTEXT.test(context)) {
            guarded.push(copyMatch)
          } else {
            unguarded.push(copyMatch)
          }
        }
      }
    }
  }

  return { guarded, unguarded }
}

describe("TODO-027 misleading native copy audit", () => {
  it("keeps fake/compatible/preview/metadata/native-like wording guarded across repository text surfaces", () => {
    const auditedFiles = collectAuditedFiles(process.cwd())
    const missing = REQUIRED_AUDITED_FILES.filter((file) => !auditedFiles.includes(file))
    expect(missing).toEqual([])
    expect(auditedFiles.length).toBeGreaterThan(100)

    const matches = collectMisleadingMatches(process.cwd(), auditedFiles)

    expect(matches.unguarded).toEqual([])
    expect(matches.guarded.map((match) => match.patternID)).toEqual(
      expect.arrayContaining([
        "placeholder-prompt-identity",
        "fake-provider-native-claim",
        "transition-state-native-claim",
      ]),
    )
  })
})
