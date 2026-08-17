import { createTUIEventLoop } from "@helix/lego-ui"
import type { NanobotSDK, NanobotSurfaceHarness, NanobotTUISurface } from "./nanobot-product-types"
import { NANOBOT_CLI_COMMANDS } from "./nanobot-cli"
import { createNanobotSDK } from "./nanobot-sdk"

export function createNanobotTUI(harness: NanobotSurfaceHarness, sdk = createNanobotSDK(harness)): NanobotTUISurface {
  return createNanobotTUIFromSDK(sdk)
}

export function createNanobotTUIFromSDK(sdk: NanobotSDK): NanobotTUISurface {
  const loop = createTUIEventLoop({
    product: "nanobot",
    title: "Nanobot",
    commands: [...NANOBOT_CLI_COMMANDS.map((command) => command.name), "help", "theme", "model", "models", "interrupt"],
    themes: ["system", "dark", "light"],
    models: ["anthropic/claude-opus-4-5", "openrouter/auto", "custom/openai-compatible"],
    initialTheme: "system",
    initialModel: "anthropic/claude-opus-4-5",
  })
  return {
    kind: "nanobot-tui",
    snapshot() {
      const workspace = sdk.workspace()
      return {
        product: "nanobot",
        cwd: workspace.cwd,
        title: "Nanobot",
        status: "ready",
        storageKind: workspace.storageKind,
        tools: workspace.tools,
        commands: NANOBOT_CLI_COMMANDS.map((command) => command.name),
        modules: sdk.graph(),
      }
    },
    interactiveSnapshot: () => loop.snapshot(),
    dispatch: (event) => loop.handle(event),
    render(input = {}) {
      const width = Math.max(56, input.width ?? 78)
      const snapshot = this.snapshot()
      const rule = "-".repeat(width)
      const rows = [
        `Nanobot TUI :: ${snapshot.status.toUpperCase()}`,
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

export type { NanobotTUISnapshot, NanobotTUISurface } from "./nanobot-product-types"
