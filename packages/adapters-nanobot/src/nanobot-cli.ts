import type { NanobotCLICommand, NanobotCLISurface, NanobotSDK, NanobotSurfaceHarness } from "./nanobot-product-types"
import { nanobotMessageText } from "./nanobot-product-utils.ts"
import { createNanobotSDK } from "./nanobot-sdk.ts"

export const NANOBOT_CLI_COMMANDS: NanobotCLICommand[] = [
  { name: "onboard", flags: ["--wizard", "--config", "--workspace"], description: "Initialize config and workspace at .nanobot paths." },
  { name: "agent", flags: ["-m", "--config", "--workspace", "--no-markdown", "--logs"], description: "Run one prompt or an interactive Nanobot agent session." },
  { name: "serve", flags: ["--host", "--port", "--config", "--workspace"], description: "Expose the OpenAI-compatible HTTP API surface." },
  { name: "gateway", flags: ["--host", "--port", "--config", "--workspace"], description: "Start channel gateway and background runtime services." },
  { name: "status", flags: ["--config"], description: "Show config, workspace, provider, and channel status." },
  { name: "channels", flags: ["login", "status"], description: "Manage chat channel integrations." },
  { name: "provider", flags: ["login"], description: "Manage OAuth-backed provider integrations." },
]

export function createNanobotCLI(harness: NanobotSurfaceHarness, sdk = createNanobotSDK(harness)): NanobotCLISurface {
  return {
    kind: "nanobot-cli",
    commands: () => NANOBOT_CLI_COMMANDS.map((command) => ({ ...command, flags: [...command.flags] })),
    renderHelp() {
      const rows = this.commands().map((command) => {
        const flags = command.flags.length ? ` ${command.flags.join(" ")}` : ""
        return `  nanobot ${command.name}${flags}\n      ${command.description}`
      })
      return ["Nanobot CLI", "Usage: nanobot <command> [options]", "", ...rows].join("\n")
    },
    async run(input) {
      const result = await sdk.runTurn({
        text: input.prompt,
        provider: input.provider,
        ...(input.model ? { model: input.model } : {}),
      })
      if (input.json) {
        return `${JSON.stringify(
          {
            product: "nanobot",
            session: result.session,
            assistantMessage: result.assistantMessage,
            transcriptLength: result.transcript.length,
          },
          null,
          2,
        )}\n`
      }
      return ["Nanobot CLI", `session ${result.session.id}`, `cwd ${result.session.cwd}`, "", nanobotMessageText(result.assistantMessage)].join("\n")
    },
  }
}

export type { NanobotCLICommand, NanobotCLISurface } from "./nanobot-product-types"
