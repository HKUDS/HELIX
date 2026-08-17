import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  codingAgentMinimalRecipe,
  compileRecipe,
  hermesAgentRecipe,
  nanobotRecipe,
  opencodeRecipe,
  piMonoRecipe,
  swapRecipes,
  verifyLiveProviderParityArtifact,
  type CompiledRecipe,
} from "@helix/recipes"

const conformanceFiles: Record<string, string> = {
  "agent-loop": "agent-loop.conformance.test.ts",
  "block-ledger": "block-ledger.conformance.test.ts",
  "boundary-lint": "boundary-lint.conformance.test.ts",
  "fixture-replay": "fixture-replay.conformance.test.ts",
  hooks: "hooks.conformance.test.ts",
  "live-provider-parity": "live-provider-parity.conformance.test.ts",
  "task-parity": "task-parity.conformance.test.ts",
  "package-boundary": "package-boundary.conformance.test.ts",
  "package-exports": "package-exports.conformance.test.ts",
  "port-contract-fixtures": "port-contract-fixtures.conformance.test.ts",
  "product-shell-surfaces": "product-shell-surfaces.conformance.test.ts",
  "product-workflow-parity": "product-workflow-parity.conformance.test.ts",
  recipes: "recipes.conformance.test.ts",
  "reverse-assembly": "reverse-assembly.conformance.test.ts",
  runtime: "runtime.conformance.test.ts",
  session: "session.conformance.test.ts",
  "session-atoms": "session-atoms.conformance.test.ts",
  tools: "tools.conformance.test.ts",
  "upstream-e2e-parity": "upstream-e2e-parity.conformance.test.ts",
}

const fullProductSuites = [
  "session",
  "hooks",
  "agent-loop",
  "tools",
  "port-contract-fixtures",
  "product-shell-surfaces",
  "fixture-replay",
  "product-workflow-parity",
  "upstream-e2e-parity",
  "live-provider-parity",
  "task-parity",
  "reverse-assembly",
  "block-ledger",
]

const minimalSuites = ["session-atoms", "port-contract-fixtures", "runtime", "recipes", "package-exports", "package-boundary", "boundary-lint", "block-ledger"]

describe("modular acceptance matrix", () => {
  it("declares complete conformance gates for all primary recipes", () => {
    const primary = [
      { alias: "opencode.full", recipe: opencodeRecipe, required: fullProductSuites },
      { alias: "pi-mono.full", recipe: piMonoRecipe, required: fullProductSuites },
      { alias: "nanobot.full", recipe: nanobotRecipe, required: fullProductSuites },
      { alias: "hermes-agent.full", recipe: hermesAgentRecipe, required: fullProductSuites },
      { alias: "coding-agent.minimal", recipe: codingAgentMinimalRecipe, required: minimalSuites },
    ]

    for (const item of primary) {
      const compiled = compileRecipe(item.recipe)
      expect(compiled.conformanceSuite, item.alias).toEqual(expect.arrayContaining(item.required))
      for (const suite of item.required) expect(conformanceFileExists(suite), `${item.alias}:${suite}`).toBe(true)
    }
  })

  it("keeps every current common atom covered by an independent port-level suite", () => {
    const compiled = [compileRecipe(codingAgentMinimalRecipe), ...Object.values(swapRecipes).map((recipe) => compileRecipe(recipe))]
    const currentCommonAtoms = Array.from(new Set(compiled.flatMap((recipe) => recipe.modules).filter(isCurrentCommonAtom).map((module) => module.id))).sort()

    expect(currentCommonAtoms).toEqual(
      expect.arrayContaining([
        "session.id-generator.deterministic",
        "session.message-store.memory",
        "turn.tool-executor.common",
        "tool-pack.echo",
        "provider.event-normalizer.common",
        "ui.renderer.noop",
      ]),
    )
    for (const atomID of currentCommonAtoms) {
      const suites = independentSuitesForCommonAtom(atomID)
      expect(suites.length, atomID).toBeGreaterThan(0)
      for (const suite of suites) expect(conformanceFileExists(suite), `${atomID}:${suite}`).toBe(true)
    }
  })

  it("records live provider artifact verification as product-level modular completion evidence", () => {
    const artifact = JSON.parse(readFileSync(join(process.cwd(), "docs", "reports", "live-provider-parity.json"), "utf8")) as unknown
    const verification = verifyLiveProviderParityArtifact({
      artifact,
      expectedProvider: "anthropic",
      expectedModelID: "MiniMax-M2.7-highspeed",
      expectedProducts: ["opencode", "pi-mono", "nanobot"],
    })

    expect(verification.ok).toBe(true)
    expect(verification.issues).toEqual([])
    expect(verification.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "live-provider-artifact:schema",
        "live-provider-artifact:passed",
        "live-provider-artifact:products",
        "live-provider-artifact:checks",
        "live-provider-artifact:no-secret-fields",
      ]),
    )
  })
})

function conformanceFileExists(suite: string): boolean {
  const file = conformanceFiles[suite]
  if (!file) return false
  return existsSync(join(process.cwd(), "packages", "conformance", file))
}

function isCurrentCommonAtom(module: CompiledRecipe["modules"][number]): boolean {
  return module.personality === "common" && !module.id.includes("test.")
}

function independentSuitesForCommonAtom(atomID: string): string[] {
  if (atomID.startsWith("session.")) return ["session-atoms"]
  if (atomID.startsWith("hook.") || atomID.startsWith("registry.") || atomID === "tool.registry") return ["hooks"]
  if (atomID.startsWith("turn.")) return ["agent-loop"]
  if (
    atomID.startsWith("tool.") ||
    atomID.startsWith("tool-pack.") ||
    atomID.startsWith("filesystem.") ||
    atomID.startsWith("process-runner.")
  ) {
    return ["tools"]
  }
  if (atomID.startsWith("provider.")) return ["live-provider-parity"]
  if (atomID.startsWith("config.") || atomID.startsWith("prompt.") || atomID.startsWith("resource.discovery")) return ["port-contract-fixtures"]
  if (atomID.startsWith("ui.")) return ["port-contract-fixtures"]
  if (atomID.startsWith("runtime.")) return ["runtime"]
  if (atomID.startsWith("product.shell.")) return ["product-shell-surfaces"]
  return ["port-contract-fixtures"]
}
