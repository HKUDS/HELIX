import type { PiCLICommand, PiCLISurface, PiSDK, PiSurfaceHarness } from "./pi-product-types"
import { piMessageText } from "./pi-product-utils"
import { createPiSDK } from "./pi-sdk"

export const PI_CLI_COMMANDS: PiCLICommand[] = [
  { name: "run", flags: ["--provider", "--model", "--tools", "--json"], description: "Run a Pi agent turn through the assembled lego graph." },
  { name: "sessions", flags: ["--cwd"], description: "List JSONL-tree sessions for the current workspace." },
  { name: "resume", flags: ["--session"], description: "Resume an existing Pi session by id." },
  { name: "packages", flags: ["--extension", "--package"], description: "Resolve extension and package inputs into a deterministic plan." },
  { name: "rpc", flags: ["--method", "--json"], description: "Call a Pi RPC method exposed by the product surface." },
  { name: "export", flags: ["--web-ui", "--browser-smoke", "--shrinkwrap"], description: "Write static product outputs from the assembled surfaces." },
]

export function createPiCLI(harness: PiSurfaceHarness, sdk = createPiSDK(harness)): PiCLISurface {
  return {
    kind: "pi-cli",
    commands: () => PI_CLI_COMMANDS.map((command) => ({ ...command, flags: [...command.flags] })),
    renderHelp() {
      const rows = this.commands().map((command) => {
        const flags = command.flags.length ? ` ${command.flags.join(" ")}` : ""
        return `  pi ${command.name}${flags}\n      ${command.description}`
      })
      return ["Pi Mono CLI", "Usage: pi <command> [options]", "", ...rows].join("\n")
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
            product: "pi-mono",
            session: result.session,
            assistantMessage: result.assistantMessage,
            transcriptLength: result.transcript.length,
          },
          null,
          2,
        )}\n`
      }
      return ["Pi Mono CLI", `session ${result.session.id}`, `cwd ${result.session.cwd}`, "", piMessageText(result.assistantMessage)].join("\n")
    },
  }
}

export type { PiCLICommand, PiCLISurface } from "./pi-product-types"
