import { createTUIEventLoop } from "@helix/lego-ui"
import type { PiSDK, PiSurfaceHarness, PiTUISurface } from "./pi-product-types"
import { PI_CLI_COMMANDS } from "./pi-cli"
import { createPiSDK } from "./pi-sdk"

export function createPiTUI(harness: PiSurfaceHarness, sdk = createPiSDK(harness)): PiTUISurface {
  return createPiTUIFromSDK(sdk)
}

export function createPiTUIFromSDK(sdk: PiSDK): PiTUISurface {
  const loop = createTUIEventLoop({
    product: "pi-mono",
    title: "Pi Mono",
    commands: [...PI_CLI_COMMANDS.map((command) => command.name), "help", "theme", "model", "models", "interrupt"],
    themes: ["dark", "light", "nord"],
    models: ["gemini-2.5-flash", "claude-sonnet-4-5", "openrouter/auto"],
    initialTheme: "dark",
    initialModel: "gemini-2.5-flash",
  })
  return {
    kind: "pi-tui",
    snapshot() {
      const workspace = sdk.workspace()
      return {
        product: "pi-mono",
        cwd: workspace.cwd,
        title: "Pi Mono",
        status: "ready",
        storageKind: workspace.storageKind,
        tools: workspace.tools,
        commands: PI_CLI_COMMANDS.map((command) => command.name),
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
        `Pi Mono TUI :: ${snapshot.status.toUpperCase()}`,
        `cwd       ${snapshot.cwd ? "Local workspace" : "Workspace"}`,
        `storage   ${snapshot.storageKind}`,
        `modules   ${snapshot.modules.map((module) => module.id).join(" -> ")}`,
        `tools     ${snapshot.tools.slice(0, 8).join(", ") || "none"}`,
        `commands  ${snapshot.commands.join(" / ")}`,
      ]
      return [rule, ...rows.map((row) => row.slice(0, width)), rule, loop.render()].join("\n")
    },
  }
}

export type { PiTUISnapshot, PiTUISurface } from "./pi-product-types"
