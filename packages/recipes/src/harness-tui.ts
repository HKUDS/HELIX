import { createHash } from "node:crypto"
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createInterface } from "node:readline/promises"
import { stdin as processStdin, stdout as processStdout, stderr as processStderr } from "node:process"
import type { Readable, Writable } from "node:stream"
import type { LegoProviderAdapter, LegoRecipe, SessionID } from "@helix/contracts"
import { assembleRecipeHarness, type AssembledHarness, type HarnessTurnResult } from "./harness"
import { parseRecipe } from "./compiler"
import { HarnessProfileStore, defaultHarnessProfileRoot, redactProfileSecrets, redactSecretText, type InstalledHarnessProfileRecord } from "./installed-harness"
import { createLiveProvider, resolveLiveProviderConfig } from "./live-provider-parity"
import type { HarnessRuntimeTrace } from "./runtime-trace"

export type HarnessTuiSource = "draft-recipe" | "installed-profile"
export type HarnessTuiProviderMode = "profile-live"

export interface HarnessTuiRunInput {
  recipe?: LegoRecipe
  recipeFilePath?: string
  profileName?: string
  rootDir?: string
  providerMode?: HarnessTuiProviderMode
  text?: string
  json?: boolean
  cwd?: string
  storageDir?: string
  env?: NodeJS.ProcessEnv
  stdin?: Readable
  stdout?: Writable
  stderr?: Writable
}

export interface HarnessTuiSummary {
  ok: boolean
  source: HarnessTuiSource
  profileName?: string
  recipeID: string
  providerMode: HarnessTuiProviderMode
  sessionID: string
  turns: Array<{
    input: string
    assistantText: string
    steps: number
    blockedTools: Array<{ toolName: string; reason?: string }>
    finish?: string
    error?: unknown
    runtimeTrace: HarnessRuntimeTrace
  }>
}

interface LoadedHarnessTuiTarget {
  source: HarnessTuiSource
  profileName?: string
  recipe: LegoRecipe
  harness: AssembledHarness
  storageDir: string
  runtimeTracePath: string
  record?: InstalledHarnessProfileRecord
}

export async function runHarnessTui(input: HarnessTuiRunInput): Promise<HarnessTuiSummary> {
  const env = input.env ?? process.env
  const stdout = input.stdout ?? processStdout
  const stderr = input.stderr ?? processStderr
  const providerMode = input.providerMode ?? "profile-live"
  const target = loadHarnessTuiTarget(input)
  const session = await target.harness.session.create({ title: `${productDisplayName(target.recipe.id)} TUI` })
  const sessionID = session.id
  const summary: HarnessTuiSummary = {
    ok: true,
    source: target.source,
    ...(target.profileName ? { profileName: target.profileName } : {}),
    recipeID: target.recipe.id,
    providerMode,
    sessionID,
    turns: [],
  }

  if (input.text !== undefined) {
    const turn = await runHarnessTuiTurn({
      target,
      sessionID,
      text: input.text,
      providerMode,
      env,
    })
    summary.turns.push(summarizeTuiTurn(input.text, turn))
    appendTuiRuntimeTrace(target, input.text, turn)
    summary.ok = !turn.error
    if (input.json) writeTuiJSON(stdout, summary, env)
    else writeTuiTurn(stdout, input.text, turn, env)
    return summary
  }

  writeTuiBanner(stdout, target, providerMode, sessionID, env)
  const rl = createInterface({ input: input.stdin ?? processStdin, output: stdout, terminal: true })
  const prompt = () => {
    if ((rl as unknown as { closed?: boolean }).closed) return
    try {
      rl.prompt()
    } catch {
      // Piped stdin can close while queued lines are still being processed.
    }
  }
  try {
    rl.setPrompt("> ")
    prompt()
    for await (const line of rl) {
      const text = line.trim()
      if (!text) {
        prompt()
        continue
      }
      if (text === "/exit" || text === "/quit") break
      if (text === "/help") {
        stdout.write("Commands: /help, /status, /clear, /exit\n")
        prompt()
        continue
      }
      if (text === "/clear") {
        stdout.write("\u001b[2J\u001b[H")
        prompt()
        continue
      }
      if (text === "/status") {
        stdout.write(redactSecretText(`recipe=${target.recipe.id} source=${target.source} provider=${providerMode} session=${sessionID}\n`, env))
        prompt()
        continue
      }
      try {
        const turn = await runHarnessTuiTurn({
          target,
          sessionID,
          text,
          providerMode,
          env,
        })
        summary.turns.push(summarizeTuiTurn(text, turn))
        appendTuiRuntimeTrace(target, text, turn)
        summary.ok = summary.ok && !turn.error
        writeTuiTurn(stdout, text, turn, env)
      } catch (error) {
        summary.ok = false
        stderr.write(`${redactSecretText(error instanceof Error ? error.message : String(error), env)}\n`)
      }
      prompt()
    }
  } finally {
    rl.close()
  }
  return summary
}

function loadHarnessTuiTarget(input: HarnessTuiRunInput): LoadedHarnessTuiTarget {
  if (input.recipe && input.recipeFilePath) throw new Error("Use either recipe or recipeFilePath, not both.")
  if (input.profileName && (input.recipe || input.recipeFilePath)) throw new Error("Use either profileName or recipe input, not both.")
  if (input.profileName) {
    const store = new HarnessProfileStore({
      rootDir: input.rootDir ?? defaultHarnessProfileRoot(),
      ...(input.cwd ? { cwd: input.cwd } : {}),
      ...(input.env ? { env: input.env } : {}),
    })
    const record = store.getRequired(input.profileName)
    const storageDir = record.profile.storageDir || input.storageDir || mkdtempSync(join(tmpdir(), "helix-tui-storage-"))
    return {
      source: "installed-profile",
      profileName: record.profile.name,
      recipe: record.recipe,
      record,
      storageDir,
      runtimeTracePath: runtimeTracePath(storageDir),
      harness: assembleRecipeHarness(record.recipe, {
        ...(record.profile.workspaceDir || input.cwd ? { cwd: record.profile.workspaceDir || input.cwd } : {}),
        storageDir,
      }),
    }
  }
  const recipe = input.recipe ?? readRecipeFile(input.recipeFilePath)
  const storageDir = input.storageDir ?? mkdtempSync(join(tmpdir(), "helix-tui-storage-"))
  return {
    source: "draft-recipe",
    recipe,
    storageDir,
    runtimeTracePath: runtimeTracePath(storageDir),
    harness: assembleRecipeHarness(recipe, {
      ...(input.cwd ? { cwd: input.cwd } : {}),
      ...(input.storageDir ? { storageDir: input.storageDir } : {}),
    }),
  }
}

function readRecipeFile(path: string | undefined): LegoRecipe {
  if (!path) throw new Error("Harness TUI requires --recipe-file <path> or --profile <name>.")
  if (!existsSync(path)) throw new Error(`Recipe file ${path} does not exist.`)
  return parseRecipe(JSON.parse(readFileSync(path, "utf8")))
}

async function runHarnessTuiTurn(input: {
  target: LoadedHarnessTuiTarget
  sessionID: SessionID
  text: string
  providerMode: HarnessTuiProviderMode
  env: NodeJS.ProcessEnv
}): Promise<HarnessTurnResult> {
  const traceSource = traceSourceForTui(input.env)
  return input.target.harness.runTurn({
    sessionID: input.sessionID,
    text: input.text,
    provider: providerForTui(input.target, input.env),
    maxRetries: 0,
    syntheticContinue: false,
    ...(traceSource ? { traceSource } : {}),
  })
}

function providerForTui(target: LoadedHarnessTuiTarget, env: NodeJS.ProcessEnv): LegoProviderAdapter {
  if (env["HELIX_DISABLE_LIVE_PROVIDER"] === "1" || env["HELIX_TUI_DISABLE_LIVE_PROVIDER"] === "1") {
    throw new Error("Live provider is not configured; live provider resolution is disabled for this TUI session.")
  }
  const provider = target.record?.provider
  if (target.record && !provider) {
    throw new Error("Profile live provider is required. Configure a real provider/model/API key before starting TUI turns.")
  }
  if (provider) {
    if (!provider.modelID) throw new Error("Profile provider modelID is required.")
    if (!provider.apiKeyEnv) throw new Error("Profile provider apiKeyEnv is required.")
    const apiKey = env[provider.apiKeyEnv]
    if (!apiKey) throw new Error(`Provider API key env ${provider.apiKeyEnv} is not set.`)
    return createLiveProvider(provider.kind, {
      provider: provider.kind,
      modelID: provider.modelID,
      apiKey,
      missing: [],
      ...(provider.baseURL ? { baseURL: provider.baseURL } : {}),
      ...(provider.appURL ? { appURL: provider.appURL } : {}),
      ...(provider.appName ? { appName: provider.appName } : {}),
    })
  }
  const resolved = resolveLiveProviderConfig({ env })
  if (!resolved.provider || !resolved.modelID || !resolved.apiKey || resolved.missing.length > 0) {
    throw new Error(`Live provider is not configured; missing: ${resolved.missing.join(", ") || "provider/model/apiKey"}.`)
  }
  return createLiveProvider(resolved.provider, {
    provider: resolved.provider,
    modelID: resolved.modelID,
    apiKey: resolved.apiKey,
    missing: [],
    ...(resolved.baseURL ? { baseURL: resolved.baseURL } : {}),
    ...(resolved.appURL ? { appURL: resolved.appURL } : {}),
    ...(resolved.appName ? { appName: resolved.appName } : {}),
  })
}

function summarizeTuiTurn(input: string, turn: HarnessTurnResult): HarnessTuiSummary["turns"][number] {
  return {
    input,
    assistantText: assistantText(turn),
    steps: turn.steps,
    blockedTools: turn.blockedTools,
    ...(turn.finish ? { finish: turn.finish } : {}),
    ...(turn.error ? { error: turn.error } : {}),
    runtimeTrace: turn.runtimeTrace,
  }
}

function appendTuiRuntimeTrace(target: LoadedHarnessTuiTarget, input: string, turn: HarnessTurnResult): void {
  if (!target.storageDir) return
  mkdirSync(target.storageDir, { recursive: true })
  appendFileSync(target.runtimeTracePath, `${JSON.stringify({
    schemaVersion: 1,
    source: turn.runtimeTrace.source,
    inputLength: input.length,
    inputFingerprint: fingerprint({ text: input }),
    runtimeTrace: turn.runtimeTrace,
  })}\n`, "utf8")
}

function runtimeTracePath(storageDir: string): string {
  return storageDir ? join(storageDir, "runtime-traces.jsonl") : ""
}

function traceSourceForTui(env: NodeJS.ProcessEnv): HarnessRuntimeTrace["source"] | undefined {
  return env["HELIX_TUI_TRACE_SOURCE"] === "builder-test-session" ? "builder-test-session" : undefined
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16)
}

function writeTuiBanner(stdout: Writable, target: LoadedHarnessTuiTarget, providerMode: HarnessTuiProviderMode, sessionID: string, env: NodeJS.ProcessEnv): void {
  stdout.write(redactSecretText(`${productDisplayName(target.recipe.id)} TUI\nrecipe=${target.recipe.id}\nsource=${target.source}${target.profileName ? ` profile=${target.profileName}` : ""}\nprovider=${providerMode}\nsession=${sessionID}\nType /help for commands, /exit to quit.\n`, env))
}

function writeTuiTurn(stdout: Writable, input: string, turn: HarnessTurnResult, env: NodeJS.ProcessEnv): void {
  const lines = [
    `[user] ${input}`,
    `[assistant] ${assistantText(turn) || "ok"}`,
    `[steps] ${turn.steps}`,
    ...(turn.blockedTools.length ? [`[blocked] ${turn.blockedTools.map((tool) => `${tool.toolName}${tool.reason ? `:${tool.reason}` : ""}`).join(", ")}`] : []),
    ...(turn.finish ? [`[finish] ${turn.finish}`] : []),
    ...(turn.error ? [`[error] ${JSON.stringify(turn.error)}`] : []),
  ]
  stdout.write(`${redactSecretText(lines.join("\n"), env)}\n`)
}

function writeTuiJSON(stdout: Writable, summary: HarnessTuiSummary, env: NodeJS.ProcessEnv): void {
  stdout.write(`${JSON.stringify(redactProfileSecrets(summary, env), null, 2)}\n`)
}

function assistantText(turn: HarnessTurnResult): string {
  return turn.assistantMessage.parts.map((part) => {
    if (part && typeof part === "object" && "text" in part && typeof part.text === "string") return part.text
    return ""
  }).filter(Boolean).join("\n")
}

function productDisplayName(recipeID: string): string {
  if (recipeID === "opencode") return "OpenCode"
  if (recipeID === "pi-mono") return "Pi Mono"
  if (recipeID === "nanobot") return "Nanobot"
  if (recipeID === "hermes-agent") return "Hermes Agent"
  return recipeID
}
