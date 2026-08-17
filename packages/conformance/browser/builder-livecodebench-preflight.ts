import { fileURLToPath } from "node:url"
import { resolve } from "node:path"
import { resolveLiveProviderConfig } from "@helix/recipes"

export function assertLiveCodeBenchProviderPreflight(): void {
  const config = resolveLiveProviderConfig({ requireCredentials: true })
  if (config.missing.length === 0) {
    process.stdout.write(`LiveCodeBench provider preflight ok. Provider: ${config.provider} Model: ${config.modelID}\n`)
    return
  }
  throw new Error(
    [
      "LiveCodeBench builder e2e requires live provider credentials before it can run.",
      `Missing: ${config.missing.join(", ")}`,
      "Set HELIX_LIVE_PROVIDER or a provider-specific API key, plus a model env (HELIX_LIVE_MODEL or provider-specific *_MODEL) and API key env (OPENAI_API_KEY, OPENROUTER_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY, or GEMINI_API_KEY).",
      "This preflight stops before opening the browser or sending provider requests.",
    ].join("\n"),
  )
}

function isMain(): boolean {
  const entry = process.argv[1]
  return Boolean(entry && fileURLToPath(import.meta.url) === resolve(entry))
}

if (isMain()) {
  try {
    assertLiveCodeBenchProviderPreflight()
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
