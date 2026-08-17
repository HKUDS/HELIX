export interface NanobotFitAuditRow {
  behavior: string
  existingCommonAtom: string
  referencePersonalityAtoms: string[]
  nanobotAtom: string
  reason: string
}

export interface NanobotFitAuditReport {
  ok: boolean
  topLevelPlanesAdded: string[]
  rows: NanobotFitAuditRow[]
  requiredNewAtoms: string[]
}

export function runNanobotFitAudit(): NanobotFitAuditReport {
  const rows: NanobotFitAuditRow[] = [
    row("JSONL session persistence", "session.store.jsonl-tree", ["pi.session.store.jsonl-v3"], "nanobot.session.store.jsonl", "Nanobot stores session metadata and messages as JSONL under the workspace."),
    row("session transcript projection", "session.projector.common-transcript", ["opencode.session.projector.message-v2", "pi.session.projector.jsonl-v3"], "nanobot.session.projector.jsonl", "Nanobot JSONL message records need product-shape projection into common LegoMessage."),
    row("plugin/event mapping", "hook.bus.source-ordered", ["opencode.plugin.loader", "pi.extension.loader"], "nanobot.plugin.loader", "Nanobot plugin and bus events fit the existing hook host lifecycle."),
    row("tool registry bridge", "registry.tool.common", ["opencode.plugin.registry-bridge", "pi.extension.dynamic-tool-bridge"], "nanobot.tool.registry-bridge", "Nanobot tools are schema-backed named executors and do not require a new tool plane."),
    row("provider descriptors", "provider.stream.openai-compatible", ["opencode.provider.plugin-descriptor", "pi.provider.extension-descriptor"], "nanobot.provider.plugin-descriptor", "Nanobot providers map to existing transport/auth/request-shape/stream-normalizer ports."),
    row("config source", "config.source.file", ["opencode.config.source", "pi.config.source"], "nanobot.config.source", "Nanobot's user config path and env interpolation are source behavior under the existing config plane."),
    row("system prompt/resources", "prompt.system-builder.common", ["opencode.prompt.mode-builder", "pi.prompt.coding-agent-builder"], "nanobot.prompt.agent-builder", "Nanobot templates and skills are resource discovery plus prompt assembly."),
    row("CLI/TUI/Web/API shells", "product.shell.minimal-cli", ["opencode.product-shell.sdk", "pi.product-shell.cli"], "nanobot.product-shell.cli", "User-facing Nanobot commands are product shell behavior."),
  ]
  return {
    ok: true,
    topLevelPlanesAdded: [],
    rows,
    requiredNewAtoms: rows.map((row) => row.nanobotAtom).sort(),
  }
}

function row(
  behavior: string,
  existingCommonAtom: string,
  referencePersonalityAtoms: string[],
  nanobotAtom: string,
  reason: string,
): NanobotFitAuditRow {
  return { behavior, existingCommonAtom, referencePersonalityAtoms, nanobotAtom, reason }
}
