import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type { PiExtensionExample, PiExtensionExamples } from "./pi-product-types"

export function createPiExtensionExamples(): PiExtensionExamples {
  return {
    kind: "pi-extension-examples",
    list: () => PI_EXTENSION_EXAMPLES.map((example) => ({ ...example })),
    materialize(input) {
      return PI_EXTENSION_EXAMPLES.map((example) => {
        const outputPath = join(input.outDir, example.path)
        mkdirSync(dirname(outputPath), { recursive: true })
        writeFileSync(outputPath, example.source, "utf8")
        return outputPath
      })
    },
  }
}

const PI_EXTENSION_EXAMPLES: PiExtensionExample[] = [
  {
    id: "tool-uppercase",
    title: "Uppercase Tool",
    path: "extensions/uppercase.ts",
    source: `import { defineExtension } from "@earendil-works/pi-coding-agent"

export default defineExtension((pi) => {
  pi.registerTool({
    name: "uppercase",
    description: "Uppercase text.",
    parameters: {
      type: "object",
      properties: { text: { type: "string" } },
      required: ["text"],
    },
    execute(_id, input) {
      return { content: [{ id: "part-uppercase", type: "text", text: String(input.text).toUpperCase() }] }
    },
  })
})
`,
  },
  {
    id: "session-labeler",
    title: "Session Labeler",
    path: "extensions/session-labeler.ts",
    source: `import { defineExtension } from "@earendil-works/pi-coding-agent"

export default defineExtension((pi) => {
  pi.on("turn_end", async (_event, ctx) => {
    ctx.ui.notify("Pi turn finished", "info")
  })
})
`,
  },
  {
    id: "provider-registration",
    title: "Provider Registration",
    path: "extensions/provider-registration.ts",
    source: `import { defineExtension } from "@earendil-works/pi-coding-agent"

export default defineExtension((pi) => {
  pi.registerProvider("example-provider", {
    package: "@example/pi-provider",
    protocol: "openai-compatible",
  })
})
`,
  },
]

export type { PiExtensionExample, PiExtensionExamples } from "./pi-product-types"
