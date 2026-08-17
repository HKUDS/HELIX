import type { HermesCLICommand, HermesCLISurface, HermesSDK, HermesSurfaceHarness } from "./hermes-product-types"
import { hermesMessageText } from "./hermes-product-utils"
import { createHermesSDK } from "./hermes-sdk"

export const HERMES_CLI_COMMANDS: HermesCLICommand[] = [
  { name: "chat", flags: ["--provider", "--model", "--base-url", "--api-key"], description: "Run an interactive or one-shot Hermes Agent chat session." },
  { name: "setup", flags: ["--accept-hooks"], description: "Configure providers, tools, skills, and profile defaults." },
  { name: "tools", flags: ["list", "enable", "disable"], description: "Manage toolsets and provider-aware tool credentials." },
  { name: "skills", flags: ["list", "enable", "disable"], description: "Manage bundled and project skills." },
  { name: "gateway", flags: ["start", "stop", "status"], description: "Run messaging gateway integrations." },
  { name: "acp", flags: ["--bootstrap"], description: "Serve Agent Client Protocol over stdio." },
  { name: "api", flags: ["--host", "--port"], description: "Expose OpenAI-compatible HTTP endpoints." },
  { name: "doctor", flags: ["--json"], description: "Check configuration, credentials, sessions, and dependencies." },
]

export function createHermesCLI(harness: HermesSurfaceHarness, sdk = createHermesSDK(harness)): HermesCLISurface {
  return {
    kind: "hermes-cli",
    commands: () => HERMES_CLI_COMMANDS.map((command) => ({ ...command, flags: [...command.flags] })),
    renderHelp() {
      const rows = this.commands().map((command) => {
        const flags = command.flags.length ? ` ${command.flags.join(" ")}` : ""
        return `  hermes ${command.name}${flags}\n      ${command.description}`
      })
      return ["Hermes Agent CLI", "Usage: hermes <command> [options]", "", ...rows].join("\n")
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
            product: "hermes-agent",
            session: result.session,
            assistantMessage: result.assistantMessage,
            transcriptLength: result.transcript.length,
          },
          null,
          2,
        )}\n`
      }
      return ["Hermes Agent CLI", `session ${result.session.id}`, `cwd ${result.session.cwd}`, "", hermesMessageText(result.assistantMessage)].join("\n")
    },
  }
}

export type { HermesCLICommand, HermesCLISurface } from "./hermes-product-types"
