import { createTUIEventLoop } from "@helix/lego-ui"
import type { HermesSDK, HermesSurfaceHarness, HermesTUISurface } from "./hermes-product-types"
import { HERMES_CLI_COMMANDS } from "./hermes-cli"
import { createHermesSDK } from "./hermes-sdk"

export function createHermesTUI(harness: HermesSurfaceHarness, sdk = createHermesSDK(harness)): HermesTUISurface {
  const loop = createTUIEventLoop({
    product: "hermes-agent",
    title: "Hermes Agent",
    commands: [...HERMES_CLI_COMMANDS.map((command) => command.name), "help", "theme", "model", "interrupt"],
    themes: ["system", "dark", "light"],
    models: ["nous:hermes-4", "openrouter/auto", "custom/openai-compatible"],
    initialTheme: "system",
    initialModel: "nous:hermes-4",
  })
  return {
    kind: "hermes-tui",
    snapshot() {
      const workspace = sdk.workspace()
      return {
        product: "hermes-agent",
        cwd: workspace.cwd,
        title: "Hermes Agent",
        status: "ready",
        storageKind: workspace.storageKind,
        tools: workspace.tools,
        commands: HERMES_CLI_COMMANDS.map((command) => command.name),
        modules: sdk.graph(),
      }
    },
    interactiveSnapshot: () => loop.snapshot(),
    dispatch: (event) => loop.handle(event),
    render(input = {}) {
      const width = Math.max(56, input.width ?? 82)
      const snapshot = this.snapshot()
      const rule = "-".repeat(width)
      const rows = [
        `Hermes Agent TUI :: ${snapshot.status.toUpperCase()}`,
        `cwd       ${snapshot.cwd}`,
        `storage   ${snapshot.storageKind}`,
        `modules   ${snapshot.modules.map((module) => module.id).join(" -> ")}`,
        `tools     ${snapshot.tools.slice(0, 8).join(", ") || "none"}`,
        `commands  ${snapshot.commands.join(" / ")}`,
      ]
      return [rule, ...rows.map((row) => row.slice(0, width)), rule, loop.render()].join("\n")
    },
  }
}

export type { HermesTUISnapshot, HermesTUISurface } from "./hermes-product-types"
