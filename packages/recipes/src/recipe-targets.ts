import type { LegoBlockInventoryEntry } from "@helix/contracts"
import { auditLegoBlockLedger } from "./block-ledger.ts"
import { auditPersonalityInventory, type ProductPersonality } from "./personality-inventory.ts"

export interface RecipeTargetShape {
  id: "opencode.full" | "pi-mono.full" | "nanobot.full" | "coding-agent.minimal"
  commonAtoms: string[]
  commonPacks: string[]
  commonProductShells: string[]
  personalityAtoms: string[]
  productShells: string[]
  forbiddenPersonalities: ProductPersonality[]
}

export interface BindingOnlySwapTarget {
  id: "session swap" | "tool-pack swap" | "provider transport swap"
  base: RecipeTargetShape["id"]
  port: string
  from: string
  to: string
  changes: "binding-only"
}

export interface RecipeTargetShapeReport {
  ok: boolean
  issues: string[]
  targets: RecipeTargetShape[]
  swaps: BindingOnlySwapTarget[]
}

export function buildRecipeTargetShapeReport(): RecipeTargetShapeReport {
  const ledger = auditLegoBlockLedger()
  const personality = auditPersonalityInventory()
  const commonAtoms = uniqueSorted(
    ledger.rows.flatMap((row) => row.commonBlocks).filter((block) => block.type === "atom").map((block) => block.id),
  )
  const commonPacks = uniqueSorted(
    ledger.rows.flatMap((row) => row.commonBlocks).filter((block) => block.type === "pack").map((block) => block.id),
  )
  const commonProductShells = uniqueSorted(
    ledger.rows.flatMap((row) => row.commonBlocks).filter((block) => block.type === "product-shell").map((block) => block.id),
  )
  const opencodeBlocks = personality.blocks.filter((block) => block.personality === "opencode")
  const piBlocks = personality.blocks.filter((block) => block.personality === "pi-mono")
  const nanobotBlocks = personality.blocks.filter((block) => block.personality === "nanobot")
  const targets: RecipeTargetShape[] = [
    productTarget("opencode.full", commonAtoms, commonPacks, commonProductShells, opencodeBlocks, ["pi-mono", "nanobot"]),
    productTarget("pi-mono.full", commonAtoms, commonPacks, commonProductShells, piBlocks, ["opencode", "nanobot"]),
    productTarget("nanobot.full", commonAtoms, commonPacks, commonProductShells, nanobotBlocks, ["opencode", "pi-mono"]),
    {
      id: "coding-agent.minimal",
      commonAtoms,
      commonPacks: [],
      commonProductShells,
      personalityAtoms: [],
      productShells: [],
      forbiddenPersonalities: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
    },
  ]
  const swaps: BindingOnlySwapTarget[] = [
    {
      id: "session swap",
      base: "opencode.full",
      port: "session.store",
      from: "opencode.session.store.sqlite-projection",
      to: "pi.session.store.jsonl-v3",
      changes: "binding-only",
    },
    {
      id: "tool-pack swap",
      base: "coding-agent.minimal",
      port: "tools",
      from: "tool-pack.echo",
      to: "tool-pack.filesystem",
      changes: "binding-only",
    },
    {
      id: "provider transport swap",
      base: "opencode.full",
      port: "provider.transport",
      from: "provider.transport.fetch",
      to: "provider.transport.cassette",
      changes: "binding-only",
    },
  ]
  const issues = targetIssues(targets, swaps)

  return {
    ok: issues.length === 0,
    issues,
    targets,
    swaps,
  }
}

function productTarget(
  id: "opencode.full" | "pi-mono.full" | "nanobot.full",
  commonAtoms: string[],
  commonPacks: string[],
  commonProductShells: string[],
  blocks: LegoBlockInventoryEntry[],
  forbiddenPersonalities: ProductPersonality[],
): RecipeTargetShape {
  return {
    id,
    commonAtoms,
    commonPacks,
    commonProductShells,
    personalityAtoms: uniqueSorted(blocks.filter((block) => block.type === "atom").map((block) => block.id)),
    productShells: uniqueSorted(blocks.filter((block) => block.type === "product-shell").map((block) => block.id)),
    forbiddenPersonalities,
  }
}

function targetIssues(targets: RecipeTargetShape[], swaps: BindingOnlySwapTarget[]): string[] {
  const issues: string[] = []
  const targetByID = new Map(targets.map((target) => [target.id, target]))

  for (const target of targets) {
    if (target.commonAtoms.length === 0) issues.push(`${target.id} has no common atoms`)
    for (const forbidden of target.forbiddenPersonalities) {
      const prefix = forbidden === "opencode" ? "opencode." : forbidden === "pi-mono" ? "pi." : "nanobot."
      const offenders = [...target.personalityAtoms, ...target.productShells].filter((id) => id.startsWith(prefix))
      if (offenders.length > 0) issues.push(`${target.id} includes forbidden ${forbidden} blocks: ${offenders.join(", ")}`)
    }
  }
  for (const id of ["opencode.full", "pi-mono.full", "nanobot.full"] as const) {
    const target = targetByID.get(id)
    if (!target?.personalityAtoms.length) issues.push(`${id} has no personality atoms`)
    if (!target?.productShells.length) issues.push(`${id} has no product shells`)
  }
  const minimal = targetByID.get("coding-agent.minimal")
  if (minimal && (minimal.personalityAtoms.length > 0 || minimal.productShells.length > 0)) {
    issues.push("coding-agent.minimal includes product-specific atoms or shells")
  }
  if (swaps.length < 3) issues.push("fewer than three binding-only swap targets are declared")
  for (const swap of swaps) {
    if (swap.changes !== "binding-only") issues.push(`${swap.id} is not binding-only`)
  }
  return issues
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort()
}
