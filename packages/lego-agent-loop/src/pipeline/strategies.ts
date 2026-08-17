import type { TurnPipelineAtomID } from "./ids.ts"

export type TurnPipelinePersonality = "common" | "opencode" | "pi-mono" | "nanobot" | "hermes-agent"

export interface TurnPipelineStrategyOption {
  atomID: TurnPipelineAtomID
  strategy: string
  personality: TurnPipelinePersonality
  label: string
}

export interface TurnPipelineStrategySelection extends TurnPipelineStrategyOption {
  selectedBy: "default" | "personality" | "override"
}

export interface TurnPipelineStrategyOverride {
  atomID: TurnPipelineAtomID
  strategy: string
  personality?: TurnPipelinePersonality
}

export interface TurnPipelineStrategyCatalogRow {
  atomID: TurnPipelineAtomID
  common: TurnPipelineStrategyOption
  opencode?: TurnPipelineStrategyOption
  piMono?: TurnPipelineStrategyOption
  nanobot?: TurnPipelineStrategyOption
  hermesAgent?: TurnPipelineStrategyOption
}

export const turnPipelineStrategyCatalog: TurnPipelineStrategyCatalogRow[] = [
  strategyRow("turn.input-normalizer", "turn.input-normalizer.text", "normalized text input", "opencode.turn.input-normalizer", "pi.turn.input-normalizer", "nanobot.turn.input-normalizer", "hermes.turn.input-normalizer"),
  strategyRow("turn.context-builder", "turn.context-builder.transcript", "transcript context", "opencode.turn.context-builder", "pi.turn.context-builder", "nanobot.turn.context-builder", "hermes.turn.context-builder"),
  strategyRow("turn.prompt-assembler", "turn.prompt-assembler.common", "common prompt assembly", "opencode.turn.prompt-assembler", "pi.turn.prompt-assembler", "nanobot.turn.prompt-assembler", "hermes.turn.prompt-assembler"),
  strategyRow(
    "turn.provider-request-builder",
    "turn.provider-request-builder.common",
    "common provider request",
    "opencode.turn.provider-request-builder",
    "pi.turn.provider-request-builder",
    "nanobot.turn.provider-request-builder",
    "hermes.turn.provider-request-builder",
  ),
  strategyRow(
    "turn.provider-stream-runner",
    "turn.provider-stream-runner.common",
    "common stream runner",
    "opencode.turn.provider-stream-runner",
    "pi.turn.provider-stream-runner",
    "nanobot.turn.provider-stream-runner",
    "hermes.turn.provider-stream-runner",
  ),
  strategyRow("turn.stream-reducer", "turn.stream-reducer.common", "common stream reducer", "opencode.turn.stream-reducer", "pi.turn.stream-reducer", "nanobot.turn.stream-reducer", "hermes.turn.stream-reducer"),
  strategyRow(
    "turn.tool-call-planner",
    "turn.tool-call-planner.parallel-batch",
    "parallel tool-call planner",
    "opencode.turn.tool-call-planner",
    "pi.turn.tool-call-planner",
    "nanobot.turn.tool-call-planner",
    "hermes.turn.tool-call-planner",
  ),
  strategyRow("turn.tool-executor", "turn.tool-executor.common", "common tool executor", "opencode.turn.tool-executor", "pi.turn.tool-executor", "nanobot.turn.tool-executor", "hermes.turn.tool-executor"),
  strategyRow("turn.result-recorder", "turn.result-recorder.common", "common result recorder", "opencode.turn.result-recorder", "pi.turn.result-recorder", "nanobot.turn.result-recorder", "hermes.turn.result-recorder"),
  strategyRow("turn.retry-policy", "turn.retry-policy.fixed", "fixed retry policy", "opencode.turn.retry-policy", "pi.turn.retry-policy", "nanobot.turn.retry-policy", "hermes.turn.retry-policy"),
  strategyRow(
    "turn.continuation-policy",
    "turn.continuation-policy.synthetic-continue",
    "synthetic continuation",
    "opencode.turn.continuation-policy",
    "pi.turn.continuation-policy",
    "nanobot.turn.continuation-policy",
    "hermes.turn.continuation-policy",
  ),
  strategyRow(
    "turn.compaction-policy",
    "turn.compaction-policy.token-threshold",
    "token threshold compaction",
    "opencode.turn.compaction-policy",
    "pi.turn.compaction-policy",
    "nanobot.turn.compaction-policy",
    "hermes.turn.compaction-policy",
  ),
  strategyRow("turn.stop-condition", "turn.stop-condition.no-tool-calls", "no pending tool calls", "opencode.turn.stop-condition", "pi.turn.stop-condition", "nanobot.turn.stop-condition", "hermes.turn.stop-condition"),
]

export function selectTurnPipelineStrategies(input: {
  personality?: TurnPipelinePersonality
  overrides?: TurnPipelineStrategyOverride[]
} = {}): TurnPipelineStrategySelection[] {
  const personality = input.personality ?? "common"
  const overrides = new Map((input.overrides ?? []).map((override) => [override.atomID, override]))
  return turnPipelineStrategyCatalog.map((row) => {
    const override = overrides.get(row.atomID)
    if (override) {
      return {
        atomID: row.atomID,
        strategy: override.strategy,
        personality: override.personality ?? personality,
        label: "recipe override",
        selectedBy: "override",
      }
    }
    const personalityOption = personality === "opencode" ? row.opencode :
      personality === "pi-mono" ? row.piMono :
      personality === "nanobot" ? row.nanobot :
      personality === "hermes-agent" ? row.hermesAgent :
      undefined
    const selected = personalityOption ?? row.common
    return {
      ...selected,
      selectedBy: personalityOption ? "personality" : "default",
    }
  })
}

function strategyRow(
  atomID: TurnPipelineAtomID,
  commonStrategy: string,
  commonLabel: string,
  opencodeStrategy: string,
  piStrategy: string,
  nanobotStrategy: string,
  hermesStrategy: string,
): TurnPipelineStrategyCatalogRow {
  return {
    atomID,
    common: { atomID, strategy: commonStrategy, personality: "common", label: commonLabel },
    opencode: { atomID, strategy: opencodeStrategy, personality: "opencode", label: "OpenCode personality strategy" },
    piMono: { atomID, strategy: piStrategy, personality: "pi-mono", label: "Pi Mono personality strategy" },
    nanobot: { atomID, strategy: nanobotStrategy, personality: "nanobot", label: "Nanobot personality strategy" },
    hermesAgent: { atomID, strategy: hermesStrategy, personality: "hermes-agent", label: "Hermes Agent personality strategy" },
  }
}
