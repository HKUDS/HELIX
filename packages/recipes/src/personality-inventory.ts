import { normalizePortContractFixture, type LegoBlockInventoryEntry, type LegoPortContractFixture } from "@helix/contracts"
import { allPortContractFixtures } from "./block-ledger.ts"

export type ProductPersonality = "opencode" | "pi-mono" | "nanobot" | "hermes-agent"

export interface ExpectedPersonalityClassification {
  id: string
  personality: ProductPersonality
  port: string
  category: string
}

export interface PersonalityInventoryIssue {
  id: string
  message: string
}

export interface PersonalityInventoryRow extends ExpectedPersonalityClassification {
  present: boolean
  type?: LegoBlockInventoryEntry["type"]
}

export interface PersonalityInventoryCoverage {
  expected: number
  present: number
  opencodeAtoms: number
  piAtoms: number
  nanobotAtoms: number
  hermesAtoms: number
  opencodeProductShells: number
  piProductShells: number
  nanobotProductShells: number
  hermesProductShells: number
}

export interface PersonalityInventoryReport {
  ok: boolean
  issues: PersonalityInventoryIssue[]
  coverage: PersonalityInventoryCoverage
  rows: PersonalityInventoryRow[]
  blocks: LegoBlockInventoryEntry[]
}

export const expectedPersonalityClassifications: ExpectedPersonalityClassification[] = [
  {
    id: "opencode.session.projector.syncevent",
    personality: "opencode",
    port: "session.projector",
    category: "SyncEvent projection",
  },
  {
    id: "opencode.session.projector.message-v2",
    personality: "opencode",
    port: "session.projector",
    category: "MessageV2 projector",
  },
  {
    id: "opencode.plugin.loader",
    personality: "opencode",
    port: "hook.bus",
    category: "plugin loader",
  },
  {
    id: "opencode.plugin.event-mapper",
    personality: "opencode",
    port: "hook.handler-chain",
    category: "plugin event mapper",
  },
  {
    id: "opencode.plugin.permission-bridge",
    personality: "opencode",
    port: "tool.permission-policy",
    category: "permission bridge",
  },
  {
    id: "opencode.plugin.provider-registry-bridge",
    personality: "opencode",
    port: "registry.provider",
    category: "provider registry bridge",
  },
  {
    id: "opencode.plugin.ui-registry-bridge",
    personality: "opencode",
    port: "registry.ui",
    category: "UI registry bridge",
  },
  {
    id: "opencode.turn.prompt-assembler",
    personality: "opencode",
    port: "turn.prompt-assembler",
    category: "prompt compatibility strategy",
  },
  {
    id: "opencode.turn.stream-reducer",
    personality: "opencode",
    port: "turn.stream-reducer",
    category: "processor compatibility strategy",
  },
  {
    id: "opencode.provider.plugin-descriptor",
    personality: "opencode",
    port: "provider.stream",
    category: "provider descriptor",
  },
  {
    id: "opencode.runtime.binding-defaults",
    personality: "opencode",
    port: "runtime.binding-planner",
    category: "runtime binding defaults",
  },
  {
    id: "opencode.runtime.lifecycle-defaults",
    personality: "opencode",
    port: "runtime.lifecycle-runner",
    category: "runtime lifecycle defaults",
  },
  {
    id: "pi.session.store.jsonl-v3",
    personality: "pi-mono",
    port: "session.store",
    category: "JSONL v3 tree",
  },
  {
    id: "pi.session.store.jsonl-v3-migrator",
    personality: "pi-mono",
    port: "session.store",
    category: "JSONL v3 migrator",
  },
  {
    id: "pi.session.context-selector.active-leaf",
    personality: "pi-mono",
    port: "session.context-selector",
    category: "active leaf context",
  },
  {
    id: "pi.extension.loader",
    personality: "pi-mono",
    port: "hook.bus",
    category: "extension loader",
  },
  {
    id: "pi.extension.typebox-bridge",
    personality: "pi-mono",
    port: "tool.schema-adapter",
    category: "TypeBox bridge",
  },
  {
    id: "pi.extension.dynamic-tool-bridge",
    personality: "pi-mono",
    port: "tool.registry",
    category: "dynamic tool bridge",
  },
  {
    id: "pi.extension.runtime-event-bridge",
    personality: "pi-mono",
    port: "event.log",
    category: "runtime event bridge",
  },
  {
    id: "pi.prompt.coding-agent-builder",
    personality: "pi-mono",
    port: "prompt.system-builder",
    category: "Pi prompt compatibility strategy",
  },
  {
    id: "pi.turn.context-builder",
    personality: "pi-mono",
    port: "turn.context-builder",
    category: "AgentHarness compatibility strategy",
  },
  {
    id: "pi.provider.extension-descriptor",
    personality: "pi-mono",
    port: "provider.stream",
    category: "provider descriptor",
  },
  {
    id: "pi.runtime.binding-defaults",
    personality: "pi-mono",
    port: "runtime.binding-planner",
    category: "runtime binding defaults",
  },
  {
    id: "pi.runtime.lifecycle-defaults",
    personality: "pi-mono",
    port: "runtime.lifecycle-runner",
    category: "runtime lifecycle defaults",
  },
  {
    id: "nanobot.session.store.jsonl",
    personality: "nanobot",
    port: "session.store",
    category: "JSONL session store",
  },
  {
    id: "nanobot.session.projector.jsonl",
    personality: "nanobot",
    port: "session.projector",
    category: "JSONL projector",
  },
  {
    id: "nanobot.plugin.loader",
    personality: "nanobot",
    port: "hook.bus",
    category: "plugin loader",
  },
  {
    id: "nanobot.plugin.event-mapper",
    personality: "nanobot",
    port: "hook.handler-chain",
    category: "plugin event mapper",
  },
  {
    id: "nanobot.tool.registry-bridge",
    personality: "nanobot",
    port: "tool.registry",
    category: "tool registry bridge",
  },
  {
    id: "nanobot.permission.policy-bridge",
    personality: "nanobot",
    port: "tool.permission-policy",
    category: "permission policy bridge",
  },
  {
    id: "nanobot.prompt.agent-builder",
    personality: "nanobot",
    port: "prompt.system-builder",
    category: "prompt builder",
  },
  {
    id: "nanobot.turn.context-builder",
    personality: "nanobot",
    port: "turn.context-builder",
    category: "session history context builder",
  },
  {
    id: "nanobot.provider.plugin-descriptor",
    personality: "nanobot",
    port: "provider.stream",
    category: "provider descriptor",
  },
  {
    id: "nanobot.ui.renderer",
    personality: "nanobot",
    port: "ui.renderer",
    category: "UI renderer",
  },
  {
    id: "nanobot.runtime.module-aliases",
    personality: "nanobot",
    port: "runtime.module-catalog",
    category: "runtime module aliases",
  },
  {
    id: "nanobot.runtime.binding-defaults",
    personality: "nanobot",
    port: "runtime.binding-planner",
    category: "runtime binding defaults",
  },
  {
    id: "nanobot.runtime.lifecycle-defaults",
    personality: "nanobot",
    port: "runtime.lifecycle-runner",
    category: "runtime lifecycle defaults",
  },
  {
    id: "hermes.session.store.sqlite-fts",
    personality: "hermes-agent",
    port: "session.store",
    category: "Hermes SQLite FTS session store",
  },
  {
    id: "hermes.plugin.loader",
    personality: "hermes-agent",
    port: "hook.bus",
    category: "Hermes plugin loader",
  },
  {
    id: "hermes.tool.registry-bridge",
    personality: "hermes-agent",
    port: "tool.registry",
    category: "Hermes tool registry bridge",
  },
  {
    id: "hermes.prompt.agent-builder",
    personality: "hermes-agent",
    port: "prompt.system-builder",
    category: "Hermes prompt builder",
  },
  {
    id: "hermes.provider.model-registry",
    personality: "hermes-agent",
    port: "provider.model-registry",
    category: "Hermes provider registry",
  },
  {
    id: "hermes.runtime.binding-defaults",
    personality: "hermes-agent",
    port: "runtime.binding-planner",
    category: "Hermes runtime binding defaults",
  },
]

export function auditPersonalityInventory(fixtures: LegoPortContractFixture[] = allPortContractFixtures()): PersonalityInventoryReport {
  const blocks = fixtures.flatMap((fixture) => normalizePortContractFixture(fixture).personalityBlocks)
  const blockByID = new Map(blocks.map((block) => [block.id, block]))
  const issues: PersonalityInventoryIssue[] = []
  const rows = expectedPersonalityClassifications.map((expected) => {
    const block = blockByID.get(expected.id)
    if (!block) {
      issues.push({ id: expected.id, message: `${expected.category} is not classified as a personality atom or product shell` })
    } else {
      if (block.personality !== expected.personality) {
        issues.push({ id: expected.id, message: `${expected.category} is classified as ${block.personality}, expected ${expected.personality}` })
      }
      if (block.port !== expected.port) {
        issues.push({ id: expected.id, message: `${expected.category} is attached to ${block.port}, expected ${expected.port}` })
      }
    }
    return {
      ...expected,
      present: Boolean(block),
      ...(block?.type ? { type: block.type } : {}),
    }
  })

  return {
    ok: issues.length === 0,
    issues,
    coverage: {
      expected: expectedPersonalityClassifications.length,
      present: rows.filter((row) => row.present).length,
      opencodeAtoms: blocks.filter((block) => block.personality === "opencode" && block.type === "atom").length,
      piAtoms: blocks.filter((block) => block.personality === "pi-mono" && block.type === "atom").length,
      nanobotAtoms: blocks.filter((block) => block.personality === "nanobot" && block.type === "atom").length,
      hermesAtoms: blocks.filter((block) => block.personality === "hermes-agent" && block.type === "atom").length,
      opencodeProductShells: blocks.filter((block) => block.personality === "opencode" && block.type === "product-shell").length,
      piProductShells: blocks.filter((block) => block.personality === "pi-mono" && block.type === "product-shell").length,
      nanobotProductShells: blocks.filter((block) => block.personality === "nanobot" && block.type === "product-shell").length,
      hermesProductShells: blocks.filter((block) => block.personality === "hermes-agent" && block.type === "product-shell").length,
    },
    rows,
    blocks,
  }
}
