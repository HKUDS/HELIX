import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { basename, join, relative } from "node:path"

export interface BoundaryLintInput {
  cwd?: string
}

export interface BoundaryLintIssue {
  ruleID: string
  file: string
  import: string
  message: string
}

export interface BoundaryLintRuleReport {
  id: string
  ok: boolean
  message: string
  issues: BoundaryLintIssue[]
}

export interface BoundaryLintReport {
  ok: boolean
  rules: BoundaryLintRuleReport[]
  issues: BoundaryLintIssue[]
}

interface SourceImport {
  file: string
  specifier: string
}

const COMMON_PACKAGE_DIRS = [
  "contracts",
  "lego-runtime",
  "lego-session",
  "lego-hooks",
  "lego-agent-loop",
  "lego-tools",
  "lego-provider",
  "lego-prompt",
  "lego-config",
  "lego-ui",
]

const PRODUCT_SHELL_FILES = [
  "packages/adapters-opencode/src/product-surface.ts",
  "packages/adapters-opencode/src/opencode-sdk.ts",
  "packages/adapters-opencode/src/opencode-server.ts",
  "packages/adapters-opencode/src/opencode-workspace.ts",
  "packages/adapters-opencode/src/opencode-control-plane.ts",
  "packages/adapters-opencode/src/opencode-tui.ts",
  "packages/adapters-opencode/src/opencode-web.ts",
  "packages/adapters-opencode/src/opencode-desktop.ts",
  "packages/adapters-opencode/src/opencode-slack.ts",
  "packages/adapters-pi/src/product-surface.ts",
  "packages/adapters-pi/src/pi-sdk.ts",
  "packages/adapters-pi/src/pi-cli.ts",
  "packages/adapters-pi/src/pi-tui.ts",
  "packages/adapters-pi/src/pi-rpc.ts",
  "packages/adapters-pi/src/pi-web-ui.ts",
  "packages/adapters-pi/src/pi-server.ts",
  "packages/adapters-pi/src/pi-package-manager.ts",
  "packages/adapters-pi/src/pi-extension-examples.ts",
  "packages/adapters-pi/src/pi-browser-smoke.ts",
  "packages/adapters-pi/src/pi-release-hardening.ts",
  "packages/adapters-nanobot/src/product-surface.ts",
  "packages/adapters-nanobot/src/nanobot-sdk.ts",
  "packages/adapters-nanobot/src/nanobot-cli.ts",
  "packages/adapters-nanobot/src/nanobot-tui.ts",
  "packages/adapters-nanobot/src/nanobot-web-ui.ts",
  "packages/adapters-nanobot/src/nanobot-server.ts",
]

const PERSONALITY_IMPORTS = [
  "@helix/adapters-opencode",
  "@helix/adapters-pi",
  "@helix/adapters-nanobot",
  "@opencode-ai/plugin",
  "@earendil-works/pi-coding-agent",
]

const PRODUCT_SHELL_ALLOWED_HARNESS_IMPORTS = new Set([
  "@helix/contracts",
  "@helix/lego-hooks",
  "@helix/lego-session",
  "@helix/lego-ui",
])

export function auditSourceBoundaries(input: BoundaryLintInput = {}): BoundaryLintReport {
  const cwd = input.cwd ?? process.cwd()
  const rules = [
    commonAtomsDoNotImportPersonalities(cwd),
    atomsDoNotImportProductSurfaces(cwd),
    providerAtomsDoNotImportSessionAtoms(cwd),
    toolsDoNotImportUI(cwd),
    productShellsDependOnlyOnPortsAndAdapters(cwd),
  ]
  const issues = rules.flatMap((rule) => rule.issues)
  return {
    ok: issues.length === 0,
    rules,
    issues,
  }
}

function commonAtomsDoNotImportPersonalities(cwd: string): BoundaryLintRuleReport {
  const issues = COMMON_PACKAGE_DIRS.flatMap((dir) =>
    importsUnder(join(cwd, "packages", dir, "src"), cwd).flatMap((entry) =>
      PERSONALITY_IMPORTS.some((specifier) => entry.specifier === specifier || entry.specifier.startsWith(`${specifier}/`))
        ? [issue("common-no-personality-imports", entry, "Common lego packages must not import OpenCode/Pi personality packages.")]
        : [],
    ),
  )
  return rule("common-no-personality-imports", "Common atoms do not import product personality packages.", issues)
}

function atomsDoNotImportProductSurfaces(cwd: string): BoundaryLintRuleReport {
  const issues = listFiles(join(cwd, "packages"))
    .filter((file) => basename(file).includes("atom") || basename(file) === "atoms.ts")
    .flatMap((file) =>
      importsFromFile(file, cwd).flatMap((entry) =>
        entry.specifier.includes("product-surface")
          ? [issue("atoms-no-product-surface-imports", entry, "Atoms must not import product surface implementations.")]
          : [],
      ),
    )
  return rule("atoms-no-product-surface-imports", "Atoms do not import product surfaces.", issues)
}

function providerAtomsDoNotImportSessionAtoms(cwd: string): BoundaryLintRuleReport {
  const issues = importsUnder(join(cwd, "packages", "lego-provider", "src"), cwd).flatMap((entry) =>
    entry.specifier === "@helix/lego-session" || entry.specifier.startsWith("@helix/lego-session/")
      ? [issue("provider-no-session-atoms", entry, "Provider atoms must not import session atoms.")]
      : [],
  )
  return rule("provider-no-session-atoms", "Provider atoms do not import session atoms.", issues)
}

function toolsDoNotImportUI(cwd: string): BoundaryLintRuleReport {
  const issues = importsUnder(join(cwd, "packages", "lego-tools", "src"), cwd).flatMap((entry) =>
    entry.specifier === "@helix/lego-ui" || entry.specifier.startsWith("@helix/lego-ui/")
      ? [issue("tools-no-ui-imports", entry, "Tool atoms must not import UI atoms.")]
      : [],
  )
  return rule("tools-no-ui-imports", "Tool atoms do not import UI atoms.", issues)
}

function productShellsDependOnlyOnPortsAndAdapters(cwd: string): BoundaryLintRuleReport {
  const issues = PRODUCT_SHELL_FILES.flatMap((file) =>
    importsFromFile(join(cwd, file), cwd).flatMap((entry) => {
      if (isAllowedProductShellImport(entry.specifier)) return []
      return [issue("product-shell-declared-deps", entry, "Product shells may depend only on declared ports, Node builtins, and local personality adapters.")]
    }),
  )
  return rule("product-shell-declared-deps", "Product shells depend only on declared ports and local personality adapters.", issues)
}

function isAllowedProductShellImport(specifier: string): boolean {
  if (specifier.startsWith("node:")) return true
  if (specifier.startsWith(".")) return true
  return PRODUCT_SHELL_ALLOWED_HARNESS_IMPORTS.has(specifier)
}

function rule(id: string, message: string, issues: BoundaryLintIssue[]): BoundaryLintRuleReport {
  return { id, ok: issues.length === 0, message, issues }
}

function issue(ruleID: string, entry: SourceImport, message: string): BoundaryLintIssue {
  return {
    ruleID,
    file: entry.file,
    import: entry.specifier,
    message,
  }
}

function importsUnder(root: string, cwd: string): SourceImport[] {
  return listFiles(root).flatMap((file) => importsFromFile(file, cwd))
}

function importsFromFile(file: string, cwd: string): SourceImport[] {
  if (!existsSync(file)) return []
  const displayFile = relative(cwd, file)
  return importSpecifiers(readFileSync(file, "utf8")).map((specifier) => ({ file: displayFile, specifier }))
}

function importSpecifiers(source: string): string[] {
  const imports: string[] = []
  for (const line of source.split(/\r?\n/)) {
    const from = /^\s*(?:import|export)\s+(?:type\s+)?(?:[^"'`]+?\s+from\s+)?["']([^"']+)["']/.exec(line)
    if (from?.[1]) imports.push(from[1])
    const dynamicImport = /^\s*import\(\s*["']([^"']+)["']\s*\)/.exec(line)
    if (dynamicImport?.[1]) imports.push(dynamicImport[1])
  }
  return imports
}

function listFiles(root: string): string[] {
  if (!existsSync(root)) return []
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) return listFiles(path)
    return path.endsWith(".ts") || path.endsWith(".tsx") ? [path] : []
  })
}
