import { createOpenCodeUIEventLoopAtom } from "@helix/lego-ui"
import type { OpenCodeSDK, OpenCodeSurfaceHarness, OpenCodeTUISurface } from "./opencode-product-types"
import { createOpenCodeSDK } from "./opencode-sdk"
import { currentOpenCodeCwd } from "./opencode-product-utils"

export function createOpenCodeTUI(harness: OpenCodeSurfaceHarness, sdk = createOpenCodeSDK(harness)): OpenCodeTUISurface {
  return createOpenCodeTUIFromSDK(sdk, () => currentOpenCodeCwd(harness))
}

export function createOpenCodeTUIFromSDK(sdk: OpenCodeSDK, cwd: () => string = () => sdk.workspace().cwd): OpenCodeTUISurface {
  const workspace = sdk.workspace()
  const modelOptions = [...new Set(["opencode-default", ...workspace.registries.providers])].filter(Boolean)
  const initialModel = modelOptions.includes("opencode-builtin-codex") ? "opencode-builtin-codex" : (modelOptions[0] ?? "opencode-default")
  const loop = createOpenCodeUIEventLoopAtom({
    product: "opencode",
    title: "OpenCode",
    models: modelOptions,
    initialTheme: "opencode",
    initialModel,
  })
  return {
    kind: "opencode-tui",
    snapshot() {
      const workspace = sdk.workspace()
      return {
        product: "opencode",
        cwd: cwd(),
        title: "OpenCode",
        status: "ready",
        commands: ["run", "sessions", "graph", "providers", "tools"],
        tools: workspace.registries.tools,
        providers: workspace.registries.providers,
        modules: sdk.graph(),
      }
    },
    interactiveSnapshot: () => loop.snapshot(),
    dispatch: (event) => loop.handle(event),
    render(input = {}) {
      const width = Math.max(52, input.width ?? 76)
      const snapshot = this.snapshot()
      const rule = "=".repeat(width)
      const rows = [
        `OpenCode TUI :: ${snapshot.status.toUpperCase()}`,
        `cwd       ${snapshot.cwd}`,
        `modules   ${snapshot.modules.map((module) => module.id).join(" -> ")}`,
        `tools     ${snapshot.tools.slice(0, 8).join(", ") || "none"}`,
        `providers ${snapshot.providers.slice(0, 8).join(", ") || "none"}`,
        `commands  ${snapshot.commands.join(" / ")}`,
      ]
      return [rule, ...rows.map((row) => row.slice(0, width)), rule, loop.render()].join("\n")
    },
  }
}

export type { OpenCodeTUISnapshot, OpenCodeTUISurface } from "./opencode-product-types"
