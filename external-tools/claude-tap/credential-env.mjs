import { readFileSync } from "node:fs"

export const credentialEnvNames = [
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GOOGLE_API_KEY",
  "GEMINI_API_KEY",
  "OPENROUTER_API_KEY",
  "AZURE_OPENAI_API_KEY",
  "AWS_ACCESS_KEY_ID",
  "AWS_PROFILE",
  "BEDROCK_API_KEY",
]

export function loadCredentialDotEnv(path, env) {
  let text
  try {
    text = readFileSync(path, "utf8")
  } catch {
    return undefined
  }
  const loaded = []
  const skipped = []
  for (const line of text.split(/\r?\n/)) {
    const parsed = parseDotEnvLine(line)
    if (!parsed || !credentialEnvNames.includes(parsed.key)) continue
    if (env[parsed.key] !== undefined) {
      skipped.push(parsed.key)
      continue
    }
    env[parsed.key] = parsed.value
    loaded.push(parsed.key)
  }
  return { path, loaded, skipped }
}

function parseDotEnvLine(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) return undefined
  const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(trimmed)
  if (!match) return undefined
  const key = match[1] ?? ""
  let value = match[2] ?? ""
  if ((value.startsWith('"') && value.endsWith('"') && value.length >= 2) || (value.startsWith("'") && value.endsWith("'") && value.length >= 2)) {
    value = value.slice(1, -1)
  } else {
    const commentIndex = value.search(/\s+#/)
    if (commentIndex >= 0) value = value.slice(0, commentIndex)
    value = value.trim()
  }
  return { key, value: value.replace(/\\n/g, "\n") }
}
