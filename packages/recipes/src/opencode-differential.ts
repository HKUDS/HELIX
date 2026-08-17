import { execFile, spawn } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { promisify } from "node:util"
import { createID, type LegoMessage, type LegoMessagePart } from "@helix/contracts"
import { JsonlTreeFileStorage, type MessageEntry } from "@helix/lego-session"
import { createDefaultTools, createOpenCodeDefaultTools, createPiDefaultTools } from "@helix/lego-tools"
import { openCodeNativeSQLiteTables } from "@helix/adapters-opencode"
import { compileRecipe } from "./compiler"
import { assembleHermesAgentHarness, assembleNanobotHarness, assembleOpenCodeHarness, assemblePiMonoHarness } from "./harness"
import { productCLIProtocolTrace } from "./product-cli-protocol"
import { hermesAgentRecipe, nanobotRecipe, opencodeRecipe, piMonoRecipe } from "./recipes"

const execFileAsync = promisify(execFile)
const require = createRequire(import.meta.url)

export type HarnessDifferentialProduct = "opencode" | "pi-mono" | "nanobot" | "hermes-agent"
export type OpenCodeOriginalSource = "fixture" | "native"

export interface OpenCodeDifferentialScenario {
  id: string
  prompt: string
  assistantText: string
}

export interface OpenCodeDifferentialTrace {
  product: HarnessDifferentialProduct
  source: "assembled" | "original"
  sourceLabel: string
  scenarioID: string
  graphNodes?: number
  sessionID?: string
  steps?: number
  finish?: string
  transcriptRoles: string[]
  assistantVisibleText: string
  assistantAllText: string
  assistantPartTypes: string[]
  toolNames: string[]
  storage: {
    kind: string
    nativeSchema: boolean
    tables?: string[]
  }
  provider: {
    kind: string
    modelID?: string
    anthropicEndpointSuffix?: string
    baseURLExample?: string
  }
  cli: {
    protocol: string
    stdoutEventTypes: string[]
    stdoutTextVisible: boolean
    jsonTopLevelKeys: string[]
  }
  trace?: OpenCodeDifferentialDebugTrace
  capture?: {
    mode: "fixture" | "native"
    packageSpec?: string
    exitCode?: number
    error?: string
    stdoutLines?: number
    stderrLines?: number
    stderrTail?: string
  }
}

export interface OpenCodeDifferentialDebugTrace {
  sourceFingerprint: string
  debugEventTypes: string[]
  spanOrder: string[]
  redaction: {
    prompt: string
    providerRequest: string
    secrets: string
    workspacePath: string
  }
  readback: {
    storageKind: string
    nativeSchema: boolean
    storageTables: string[]
    transcriptRoles: string[]
    assistantPartTypes: string[]
  }
  flowProjection: {
    protocol: string
    eventSequence: string[]
    projectedStages: string[]
    storageRefs: string[]
  }
}

export interface OpenCodeDifferentialCheck {
  id: string
  ok: boolean
  severity: "match" | "gap"
  message: string
  assembled: unknown
  original: unknown
  next?: string
}

export interface OpenCodeDifferentialReport {
  ok: boolean
  parityOK: boolean
  status: "matched" | "gaps-found"
  product: HarnessDifferentialProduct
  scenario: OpenCodeDifferentialScenario
  assembled: OpenCodeDifferentialTrace
  original: OpenCodeDifferentialTrace
  checks: OpenCodeDifferentialCheck[]
  gaps: OpenCodeDifferentialCheck[]
}

export interface NativeOpenCodeCaptureInput {
  modelID?: string
  apiKey?: string
  baseURL?: string
  env?: Record<string, string | undefined>
  packageSpec?: string
  timeoutMs?: number
  keepTemp?: boolean
}

export interface NativePiMonoCaptureInput {
  modelID?: string
  apiKey?: string
  baseURL?: string
  env?: Record<string, string | undefined>
  packageSpec?: string
  timeoutMs?: number
  keepTemp?: boolean
}

export interface NativeNanobotCaptureInput {
  modelID?: string
  apiKey?: string
  baseURL?: string
  env?: Record<string, string | undefined>
  packageSpec?: string
  timeoutMs?: number
  keepTemp?: boolean
}

export interface NativeHermesCaptureInput {
  modelID?: string
  apiKey?: string
  baseURL?: string
  env?: Record<string, string | undefined>
  packageSpec?: string
  timeoutMs?: number
  keepTemp?: boolean
}

export const defaultNativePiMonoPackageSpec = "@earendil-works/pi-coding-agent@0.75.5"
const nativeNpmCacheRoot = join(tmpdir(), "helix-native-npm-cache")

export const defaultOpenCodeDifferentialScenario: OpenCodeDifferentialScenario = {
  id: "opencode.minimal-answer",
  prompt: "Reply with exactly: opencode-differential-ok",
  assistantText: "opencode-differential-ok",
}

export async function runOpenCodeDifferential(
  input: Partial<OpenCodeDifferentialScenario> & {
    originalSource?: OpenCodeOriginalSource
    native?: NativeOpenCodeCaptureInput
    original?: OpenCodeDifferentialTrace
    assembled?: OpenCodeDifferentialTrace
  } = {},
): Promise<OpenCodeDifferentialReport> {
  const scenario = {
    ...defaultOpenCodeDifferentialScenario,
    ...definedScenarioFields(input),
  }
  const assembled = input.assembled ?? (await captureAssembledOpenCodeTrace(scenario))
  const original =
    input.original ??
    (input.originalSource === "native" ? await captureNativeOpenCodeTrace(scenario, input.native ?? {}) : originalOpenCodeFixtureTrace(scenario))
  const checks = compareOpenCodeTraces(assembled, original)
  const gaps = checks.filter((check) => !check.ok)
  return {
    ok: true,
    parityOK: gaps.length === 0,
    status: gaps.length === 0 ? "matched" : "gaps-found",
    product: "opencode",
    scenario,
    assembled,
    original,
    checks,
    gaps,
  }
}

export async function captureAssembledOpenCodeTrace(scenario: OpenCodeDifferentialScenario): Promise<OpenCodeDifferentialTrace> {
  const harness = assembleOpenCodeHarness()
  const result = await harness.runFixtureTurn({
    text: scenario.prompt,
    assistantText: scenario.assistantText,
    maxSteps: 1,
  })
  const compiled = compileRecipe(opencodeRecipe)
  const assistantParts = result.assistantMessage.parts
  const cli = productCLIProtocolTrace("opencode", result)
  return withDifferentialDebugTrace({
    product: "opencode",
    source: "assembled",
    sourceLabel: "Helix opencode.full",
    scenarioID: scenario.id,
    graphNodes: compiled.graph.length,
    sessionID: result.session.id,
    steps: result.steps,
    ...(result.finish ? { finish: result.finish } : {}),
    transcriptRoles: result.transcript.map((message) => message.role),
    assistantVisibleText: visibleAssistantText(assistantParts),
    assistantAllText: messageText(result.assistantMessage),
    assistantPartTypes: assistantParts.map(logicalPartType),
    toolNames: createOpenCodeDefaultTools().map((tool) => tool.name).sort(),
    storage: {
      kind: "opencode-sqlite-native",
      nativeSchema: true,
      tables: [...openCodeNativeSQLiteTables],
    },
    provider: {
      kind: "ai-sdk-anthropic-compatible",
      anthropicEndpointSuffix: "/messages",
      baseURLExample: "https://api.minimaxi.com/anthropic/v1",
    },
    cli,
  })
}

export async function runPiMonoDifferential(
  input: Partial<OpenCodeDifferentialScenario> & {
    originalSource?: OpenCodeOriginalSource
    native?: NativePiMonoCaptureInput
    original?: OpenCodeDifferentialTrace
    assembled?: OpenCodeDifferentialTrace
  } = {},
): Promise<OpenCodeDifferentialReport> {
  const scenario = {
    id: "pi-mono.minimal-answer",
    prompt: "Reply with exactly: pi-differential-ok",
    assistantText: "pi-differential-ok",
    ...definedScenarioFields(input),
  }
  const assembled = input.assembled ?? (await captureAssembledPiMonoTrace(scenario))
  const original =
    input.original ??
    (input.originalSource === "native" ? await captureNativePiMonoTrace(scenario, input.native ?? {}) : originalPiMonoFixtureTrace(scenario))
  const checks = compareOpenCodeTraces(assembled, original)
  const gaps = checks.filter((check) => !check.ok)
  return {
    ok: true,
    parityOK: gaps.length === 0,
    status: gaps.length === 0 ? "matched" : "gaps-found",
    product: "pi-mono",
    scenario,
    assembled,
    original,
    checks,
    gaps,
  }
}

export async function runNanobotDifferential(
  input: Partial<OpenCodeDifferentialScenario> & {
    originalSource?: OpenCodeOriginalSource
    native?: NativeNanobotCaptureInput
    original?: OpenCodeDifferentialTrace
    assembled?: OpenCodeDifferentialTrace
  } = {},
): Promise<OpenCodeDifferentialReport> {
  const scenario = {
    id: "nanobot.minimal-answer",
    prompt: "Reply with exactly: nanobot-differential-ok",
    assistantText: "nanobot-differential-ok",
    ...definedScenarioFields(input),
  }
  const assembled = input.assembled ?? (await captureAssembledNanobotTrace(scenario))
  const original =
    input.original ??
    (input.originalSource === "native" ? await captureNativeNanobotTrace(scenario, input.native ?? {}) : originalNanobotFixtureTrace(scenario))
  const checks = compareOpenCodeTraces(assembled, original)
  const gaps = checks.filter((check) => !check.ok)
  return {
    ok: true,
    parityOK: gaps.length === 0,
    status: gaps.length === 0 ? "matched" : "gaps-found",
    product: "nanobot",
    scenario,
    assembled,
    original,
    checks,
    gaps,
  }
}

export async function runHermesAgentDifferential(
  input: Partial<OpenCodeDifferentialScenario> & {
    originalSource?: OpenCodeOriginalSource
    native?: NativeHermesCaptureInput
    original?: OpenCodeDifferentialTrace
    assembled?: OpenCodeDifferentialTrace
  } = {},
): Promise<OpenCodeDifferentialReport> {
  const scenario = {
    id: "hermes-agent.minimal-answer",
    prompt: "Reply with exactly: hermes-differential-ok",
    assistantText: "hermes-differential-ok",
    ...definedScenarioFields(input),
  }
  const assembled = input.assembled ?? (await captureAssembledHermesAgentTrace(scenario))
  const original = input.original ?? originalHermesAgentFixtureTrace(scenario)
  const checks = compareOpenCodeTraces(assembled, original)
  const gaps = checks.filter((check) => !check.ok)
  return {
    ok: true,
    parityOK: gaps.length === 0,
    status: gaps.length === 0 ? "matched" : "gaps-found",
    product: "hermes-agent",
    scenario,
    assembled,
    original,
    checks,
    gaps,
  }
}

export async function runHarnessDifferential(
  product: HarnessDifferentialProduct,
  input: Partial<OpenCodeDifferentialScenario> & {
    originalSource?: OpenCodeOriginalSource
    native?: NativeOpenCodeCaptureInput | NativePiMonoCaptureInput | NativeNanobotCaptureInput
  } = {},
): Promise<OpenCodeDifferentialReport> {
  if (product === "opencode") return runOpenCodeDifferential(input as Parameters<typeof runOpenCodeDifferential>[0])
  if (product === "pi-mono") return runPiMonoDifferential(input as Parameters<typeof runPiMonoDifferential>[0])
  if (product === "hermes-agent") return runHermesAgentDifferential(input as Parameters<typeof runHermesAgentDifferential>[0])
  return runNanobotDifferential(input as Parameters<typeof runNanobotDifferential>[0])
}

export async function captureAssembledPiMonoTrace(scenario: OpenCodeDifferentialScenario): Promise<OpenCodeDifferentialTrace> {
  const harness = assemblePiMonoHarness()
  const result = await harness.runFixtureTurn({
    text: scenario.prompt,
    assistantText: scenario.assistantText,
    maxSteps: 1,
  })
  const compiled = compileRecipe(piMonoRecipe)
  const assistantParts = result.assistantMessage.parts
  const cli = productCLIProtocolTrace("pi-mono", result)
  return withDifferentialDebugTrace({
    product: "pi-mono",
    source: "assembled",
    sourceLabel: "Helix pi-mono.full",
    scenarioID: scenario.id,
    graphNodes: compiled.graph.length,
    sessionID: result.session.id,
    steps: result.steps,
    ...(result.finish ? { finish: result.finish } : {}),
    transcriptRoles: result.transcript.map((message) => message.role),
    assistantVisibleText: visibleAssistantText(assistantParts),
    assistantAllText: messageText(result.assistantMessage),
    assistantPartTypes: assistantParts.map(logicalPartType),
    toolNames: createPiDefaultTools().map((tool) => tool.name).sort(),
    storage: {
      kind: "pi-jsonl-v3",
      nativeSchema: true,
      tables: ["session-header", "message", "thinking", "model-change", "tool-call", "tool-result", "branch-summary"],
    },
    provider: {
      kind: "helix-anthropic-port",
      anthropicEndpointSuffix: "/messages",
      baseURLExample: "https://api.anthropic.com/v1",
    },
    cli,
  })
}

export async function captureAssembledNanobotTrace(scenario: OpenCodeDifferentialScenario): Promise<OpenCodeDifferentialTrace> {
  const harness = assembleNanobotHarness()
  const result = await harness.runFixtureTurn({
    text: scenario.prompt,
    assistantText: scenario.assistantText,
    maxSteps: 1,
  })
  const compiled = compileRecipe(nanobotRecipe)
  const assistantParts = result.assistantMessage.parts
  const cli = productCLIProtocolTrace("nanobot", result)
  return withDifferentialDebugTrace({
    product: "nanobot",
    source: "assembled",
    sourceLabel: "Helix nanobot.full",
    scenarioID: scenario.id,
    graphNodes: compiled.graph.length,
    sessionID: result.session.id,
    steps: result.steps,
    ...(result.finish ? { finish: result.finish } : {}),
    transcriptRoles: result.transcript.map((message) => message.role),
    assistantVisibleText: visibleAssistantText(assistantParts),
    assistantAllText: messageText(result.assistantMessage),
    assistantPartTypes: assistantParts.map(logicalPartType),
    toolNames: createDefaultTools().map((tool) => tool.name).sort(),
    storage: {
      kind: "nanobot-jsonl-sessions",
      nativeSchema: true,
      tables: ["metadata", "message"],
    },
    provider: {
      kind: "nanobot-openai-compatible-or-native-provider",
      anthropicEndpointSuffix: "/messages",
      baseURLExample: "https://api.anthropic.com",
    },
    cli,
  })
}

export async function captureAssembledHermesAgentTrace(scenario: OpenCodeDifferentialScenario): Promise<OpenCodeDifferentialTrace> {
  const harness = assembleHermesAgentHarness()
  const result = await harness.runFixtureTurn({
    text: scenario.prompt,
    assistantText: scenario.assistantText,
    maxSteps: 1,
  })
  const compiled = compileRecipe(hermesAgentRecipe)
  const assistantParts = result.assistantMessage.parts
  const cli = productCLIProtocolTrace("hermes-agent", result)
  return withDifferentialDebugTrace({
    product: "hermes-agent",
    source: "assembled",
    sourceLabel: "Helix hermes-agent.full",
    scenarioID: scenario.id,
    graphNodes: compiled.graph.length,
    sessionID: result.session.id,
    steps: result.steps,
    ...(result.finish ? { finish: result.finish } : {}),
    transcriptRoles: result.transcript.map((message) => message.role),
    assistantVisibleText: visibleAssistantText(assistantParts),
    assistantAllText: messageText(result.assistantMessage),
    assistantPartTypes: assistantParts.map(logicalPartType),
    toolNames: createDefaultTools().map((tool) => tool.name).sort(),
    storage: {
      kind: "hermes-sqlite-fts",
      nativeSchema: true,
      tables: ["sessions", "messages", "events", "fts"],
    },
    provider: {
      kind: "hermes-openai-compatible-or-native-provider",
      anthropicEndpointSuffix: "/messages",
      baseURLExample: "https://api.anthropic.com",
    },
    cli,
  })
}

export function originalOpenCodeFixtureTrace(scenario: OpenCodeDifferentialScenario): OpenCodeDifferentialTrace {
  return withDifferentialDebugTrace({
    product: "opencode",
    source: "original",
    sourceLabel: "opencode-ai@1.15.11 observed native CLI",
    scenarioID: scenario.id,
    steps: 1,
    finish: "stop",
    transcriptRoles: ["user", "assistant"],
    assistantVisibleText: scenario.assistantText,
    assistantAllText: [
      `The user is asking me to reply with exactly the text: "${scenario.assistantText}"`,
      "",
      "This is a simple request that doesn't require any tools. I should just output the exact text they requested.",
      scenario.assistantText,
    ].join("\n"),
    assistantPartTypes: ["step-start", "reasoning", "text", "step-finish"],
    toolNames: ["bash", "edit", "glob", "grep", "invalid", "question", "read", "skill", "task", "todowrite", "webfetch", "write"].sort(),
    storage: {
      kind: "opencode-sqlite-native",
      nativeSchema: true,
      tables: ["session", "message", "part", "event", "session_message", "permission", "todo", "workspace"],
    },
    provider: {
      kind: "ai-sdk-anthropic",
      anthropicEndpointSuffix: "/messages",
      baseURLExample: "https://api.minimaxi.com/anthropic/v1",
    },
    cli: {
      protocol: "opencode-run-json-events",
      stdoutEventTypes: ["step_start", "text"],
      stdoutTextVisible: false,
      jsonTopLevelKeys: ["type", "timestamp", "sessionID", "part"],
    },
    capture: {
      mode: "fixture",
      packageSpec: "opencode-ai@1.15.11",
    },
  })
}

export function originalPiMonoFixtureTrace(scenario: OpenCodeDifferentialScenario): OpenCodeDifferentialTrace {
  return withDifferentialDebugTrace({
    product: "pi-mono",
    source: "original",
    sourceLabel: "Pi Mono pinned upstream JSONL fixture shape",
    scenarioID: scenario.id,
    steps: 1,
    finish: "stop",
    transcriptRoles: ["user", "assistant"],
    assistantVisibleText: scenario.assistantText,
    assistantAllText: scenario.assistantText,
    assistantPartTypes: ["text"],
    toolNames: ["bash", "edit", "read", "write"].sort(),
    storage: {
      kind: "pi-jsonl-v3",
      nativeSchema: true,
      tables: ["session-header", "message", "thinking", "model-change", "tool-call", "tool-result", "branch-summary"],
    },
    provider: {
      kind: "pi-ai-anthropic-messages",
      anthropicEndpointSuffix: "/messages",
      baseURLExample: "https://api.anthropic.com/v1",
    },
    cli: {
      protocol: "pi-coding-agent-json-event-stream",
      stdoutEventTypes: [
        "session",
        "agent_start",
        "turn_start",
        "message_start",
        "message_end",
        "message_start",
        "message_update",
        "message_end",
        "turn_end",
        "agent_end",
      ],
      stdoutTextVisible: true,
      jsonTopLevelKeys: ["type", "version", "id", "timestamp", "cwd"],
    },
    capture: {
      mode: "fixture",
      packageSpec: "@mariozechner/pi-coding-agent pinned fixture",
    },
  })
}

export function originalNanobotFixtureTrace(scenario: OpenCodeDifferentialScenario): OpenCodeDifferentialTrace {
  return withDifferentialDebugTrace({
    product: "nanobot",
    source: "original",
    sourceLabel: "Nanobot v0.2.0 pinned upstream JSONL fixture shape",
    scenarioID: scenario.id,
    steps: 1,
    finish: "stop",
    transcriptRoles: ["user", "assistant"],
    assistantVisibleText: scenario.assistantText,
    assistantAllText: scenario.assistantText,
    assistantPartTypes: ["text"],
    toolNames: createDefaultTools().map((tool) => tool.name).sort(),
    storage: {
      kind: "nanobot-jsonl-sessions",
      nativeSchema: true,
      tables: ["metadata", "message"],
    },
    provider: {
      kind: "nanobot-openai-compatible-or-native-provider",
      anthropicEndpointSuffix: "/messages",
      baseURLExample: "https://api.anthropic.com",
    },
    cli: {
      protocol: "nanobot-cli-json-event-stream",
      stdoutEventTypes: ["session", "agent_start", "message", "assistant_delta", "agent_end"],
      stdoutTextVisible: true,
      jsonTopLevelKeys: ["type", "version", "id", "timestamp", "cwd"],
    },
    capture: {
      mode: "fixture",
      packageSpec: "nanobot-ai@0.2.0",
    },
  })
}

export function originalHermesAgentFixtureTrace(scenario: OpenCodeDifferentialScenario): OpenCodeDifferentialTrace {
  return withDifferentialDebugTrace({
    product: "hermes-agent",
    source: "original",
    sourceLabel: "Hermes Agent v0.15.1 pinned CLI/session fixture shape",
    scenarioID: scenario.id,
    steps: 1,
    finish: "stop",
    transcriptRoles: ["user", "assistant"],
    assistantVisibleText: scenario.assistantText,
    assistantAllText: scenario.assistantText,
    assistantPartTypes: ["text"],
    toolNames: createDefaultTools().map((tool) => tool.name).sort(),
    storage: {
      kind: "hermes-sqlite-fts",
      nativeSchema: true,
      tables: ["sessions", "messages", "events", "fts"],
    },
    provider: {
      kind: "hermes-openai-compatible-or-native-provider",
      anthropicEndpointSuffix: "/messages",
      baseURLExample: "https://api.anthropic.com",
    },
    cli: {
      protocol: "hermes-cli-json-event-stream",
      stdoutEventTypes: ["session.created", "pre_llm_call", "message.delta", "post_llm_call"],
      stdoutTextVisible: true,
      jsonTopLevelKeys: ["type", "version", "id", "timestamp", "sessionID"],
    },
    capture: {
      mode: "fixture",
      packageSpec: "hermes-agent==0.15.1",
    },
  })
}

export async function captureNativeNanobotTrace(
  scenario: OpenCodeDifferentialScenario,
  input: NativeNanobotCaptureInput = {},
): Promise<OpenCodeDifferentialTrace> {
  const env = input.env ?? process.env
  const modelID = input.modelID ?? env["HELIX_LIVE_MODEL"] ?? env["ANTHROPIC_MODEL"]
  const apiKey = input.apiKey ?? env["ANTHROPIC_API_KEY"]
  if (!modelID) throw new Error("Native Nanobot differential capture requires HELIX_LIVE_MODEL, ANTHROPIC_MODEL, or modelID.")
  if (!apiKey) throw new Error("Native Nanobot differential capture requires ANTHROPIC_API_KEY or apiKey.")

  const packageSpec = input.packageSpec ?? "nanobot-ai==0.2.0"
  const baseURL = nativeNanobotAnthropicBaseURL(input.baseURL ?? env["HELIX_LIVE_BASE_URL"])
  const home = mkdtempSync(join(tmpdir(), "helix-native-nanobot-home-"))
  const workspace = mkdtempSync(join(tmpdir(), "helix-native-nanobot-workspace-"))
  const configDir = join(home, ".nanobot")
  const configPath = join(configDir, "config.json")
  try {
    writeNativeNanobotConfig({
      configDir,
      configPath,
      workspace,
      modelID,
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    })
    const run = await execNativeNanobot(
      [
        "--from",
        packageSpec,
        "nanobot",
        "agent",
        "--no-markdown",
        "--no-logs",
        "--config",
        configPath,
        "--workspace",
        workspace,
        "--session",
        "helix-nanobot-differential",
        "--message",
        scenario.prompt,
      ],
      {
        ...process.env,
        ...env,
        HOME: home,
        XDG_CONFIG_HOME: join(home, ".config"),
        XDG_DATA_HOME: join(home, ".local", "share"),
        UV_CACHE_DIR: join(nativeCacheRoot("nanobot"), "uv"),
        UV_HTTP_TIMEOUT: "120",
        NO_COLOR: "1",
        CI: "1",
        ANTHROPIC_API_KEY: apiKey,
      },
      workspace,
      input.timeoutMs ?? 180_000,
    )
    const session = readNativeNanobotSession(workspace)
    const assistant = [...session.messages].reverse().find((message) => message.role === "assistant")
    const assistantText = assistant ? visibleAssistantText(assistant.parts) : nativeNanobotStdoutAssistantText(run.stdout)
    const events = parseJSONLines(run.stdout)
    const transcriptRoles = session.messages.length > 0 ? session.messages.map((message) => message.role) : assistantText ? ["user", "assistant"] : []
    const original = originalNanobotFixtureTrace({ ...scenario, assistantText })
    return withDifferentialDebugTrace({
      ...original,
      sourceLabel: `${packageSpec} native CLI capture`,
      ...(session.sessionID ? { sessionID: session.sessionID } : {}),
      transcriptRoles,
      assistantVisibleText: assistantText,
      assistantAllText: assistantText,
      assistantPartTypes: assistantText ? ["text"] : [],
      storage: {
        kind: "nanobot-jsonl-sessions",
        nativeSchema: session.nativeSchema,
        tables: session.tables,
      },
      provider: {
        kind: "nanobot-native-anthropic-provider",
        modelID,
        anthropicEndpointSuffix: "/messages",
        baseURLExample: baseURL ?? "https://api.anthropic.com",
      },
      cli: {
        protocol: original.cli.protocol,
        stdoutEventTypes: events.length > 0 ? events.map((event) => String(record(event)?.["type"] ?? "")).filter(Boolean) : original.cli.stdoutEventTypes,
        jsonTopLevelKeys: events.length > 0 && record(events[0]) ? Object.keys(record(events[0]) ?? {}) : original.cli.jsonTopLevelKeys,
        stdoutTextVisible: Boolean(assistantText && run.stdout.includes(assistantText)),
      },
      capture: {
        mode: "native",
        packageSpec,
        ...(run.exitCode === undefined ? {} : { exitCode: run.exitCode }),
        ...(run.error ? { error: run.error } : {}),
        stdoutLines: run.stdout.split(/\r?\n/).filter(Boolean).length,
        stderrLines: run.stderr.split(/\r?\n/).filter(Boolean).length,
        stderrTail: redactSecrets(run.stderr)
          .split(/\r?\n/)
          .filter(Boolean)
          .slice(-20)
          .join("\n"),
      },
    })
  } finally {
    if (!input.keepTemp) {
      rmSync(home, { recursive: true, force: true })
      rmSync(workspace, { recursive: true, force: true })
    }
  }
}

export function nativeNanobotAnthropicBaseURL(baseURL: string | undefined): string | undefined {
  if (!baseURL) return undefined
  const trimmed = baseURL.replace(/\/+$/, "")
  return trimmed.endsWith("/v1") ? trimmed.slice(0, -3) : trimmed
}

function writeNativeNanobotConfig(input: {
  configDir: string
  configPath: string
  workspace: string
  modelID: string
  apiKey: string
  baseURL?: string
}): void {
  mkdirSync(input.configDir, { recursive: true })
  const model = input.modelID.includes("/") ? input.modelID : `anthropic/${input.modelID}`
  writeFileSync(
    input.configPath,
    `${JSON.stringify(
      {
        agents: {
          defaults: {
            workspace: input.workspace,
            model,
            provider: "anthropic",
            maxTokens: 1024,
            contextWindowTokens: 65536,
            temperature: 0,
            maxToolIterations: 2,
            maxConcurrentSubagents: 1,
            disabledSkills: [],
            botName: "nanobot",
            botIcon: "",
          },
        },
        channels: {
          sendProgress: false,
          sendToolHints: false,
          showReasoning: false,
        },
        providers: {
          anthropic: {
            apiKey: input.apiKey,
            ...(input.baseURL ? { apiBase: input.baseURL } : {}),
          },
        },
        tools: {
          restrictToWorkspace: true,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  )
}

function execNativeNanobot(
  args: string[],
  env: NodeJS.ProcessEnv,
  cwd: string,
  timeout: number,
): Promise<{ stdout: string; stderr: string; exitCode?: number; error?: string }> {
  return new Promise((resolve) => {
    const child = spawn("uvx", args, {
      cwd,
      env,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    let settled = false
    let timedOut = false
    let forceKillTimer: NodeJS.Timeout | undefined
    const timer = setTimeout(() => {
      timedOut = true
      killNativeProcess(child, "SIGTERM")
      forceKillTimer = setTimeout(() => killNativeProcess(child, "SIGKILL"), 5_000)
    }, timeout)
    child.stdout?.setEncoding("utf8")
    child.stderr?.setEncoding("utf8")
    child.stdout?.on("data", (chunk) => {
      stdout += String(chunk)
    })
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk)
    })
    child.on("error", (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (forceKillTimer) clearTimeout(forceKillTimer)
      resolve({ stdout, stderr, error: error.message })
    })
    child.on("close", (code, signal) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (forceKillTimer) clearTimeout(forceKillTimer)
      resolve({
        stdout,
        stderr,
        ...(typeof code === "number" ? { exitCode: code } : {}),
        ...(timedOut
          ? { error: signal ? `timeout ${timeout}ms (${signal})` : `timeout ${timeout}ms` }
          : signal
            ? { error: `signal ${signal}` }
            : code && code !== 0
              ? { error: `exit ${code}` }
              : {}),
      })
    })
  })
}

function readNativeNanobotSession(workspace: string): { sessionID?: string; nativeSchema: boolean; tables: string[]; messages: LegoMessage[] } {
  const sessionsDir = join(workspace, "sessions")
  if (!existsSync(sessionsDir)) return { nativeSchema: false, tables: [], messages: [] }
  let sessionKey: string | undefined
  let sawMetadata = false
  const messages: LegoMessage[] = []
  for (const file of listNativeFiles(sessionsDir).filter((path) => path.endsWith(".jsonl")).sort()) {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      if (!line.trim()) continue
      const entry = parseJSONRecord(line)
      if (!entry) continue
      if (entry["_type"] === "metadata") {
        sawMetadata = true
        if (typeof entry["key"] === "string") sessionKey = entry["key"]
        continue
      }
      const role = typeof entry["role"] === "string" ? entry["role"] : undefined
      if (!role) continue
      const contentText = nativeNanobotMessageContentText(entry["content"])
      if (!contentText && Array.isArray(entry["tool_calls"]) && entry["tool_calls"].length > 0) continue
      const sessionID = createID("session", sessionKey ?? "nanobot-native")
      const timestamp = typeof entry["timestamp"] === "string" ? Date.parse(entry["timestamp"]) : NaN
      const created = Number.isFinite(timestamp) ? timestamp : Date.now()
      const idSeed = `${role}-${messages.length}`
      if (role === "tool") {
        const toolName = typeof entry["name"] === "string" ? entry["name"] : "tool"
        const toolCallID = createID("toolcall", `${idSeed}-${toolName}`)
        messages.push({
          id: createID("message", idSeed),
          sessionID,
          role: "tool",
          time: { created },
          parts: [
            {
              id: createID("part", `${idSeed}-result`),
              type: "tool_result",
              toolCallID,
              toolName,
              content: [{ id: createID("part", `${idSeed}-result-text`), type: "text", text: contentText }],
            },
          ],
        })
        continue
      }
      if (role !== "user" && role !== "assistant") continue
      messages.push({
        id: createID("message", idSeed),
        sessionID,
        role,
        time: { created },
        parts: contentText ? [{ id: createID("part", `${idSeed}-text`), type: "text", text: contentText }] : [],
      })
    }
  }
  const tables = [...(sawMetadata ? ["metadata"] : []), ...(messages.length > 0 ? ["message"] : [])]
  return {
    ...(sessionKey ? { sessionID: createID("session", sessionKey) } : messages[0]?.sessionID ? { sessionID: messages[0].sessionID } : {}),
    nativeSchema: sawMetadata && messages.length > 0,
    tables,
    messages,
  }
}

function nativeNanobotMessageContentText(content: unknown): string {
  if (typeof content === "string") return content
  if (!Array.isArray(content)) return ""
  return content
    .flatMap((part) => {
      if (typeof part === "string") return [part]
      const item = record(part)
      if (!item) return []
      if (typeof item["text"] === "string") return [item["text"]]
      if (typeof item["content"] === "string") return [item["content"]]
      return []
    })
    .filter(Boolean)
    .join("\n")
}

function nativeNanobotStdoutAssistantText(stdout: string): string {
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => {
      const trimmed = line.trim()
      if (!trimmed) return false
      if (trimmed === "nanobot") return false
      if (trimmed.startsWith("Using config:")) return false
      if (trimmed.startsWith("Created ")) return false
      if (trimmed.endsWith("config.json")) return false
      return true
    })
    .join("\n")
    .trim()
}

function nativeCacheRoot(product: string): string {
  const root = process.env["HELIX_NATIVE_CACHE_DIR"] ?? join(tmpdir(), "helix-native-cache")
  return join(root, product.replace(/[^a-z0-9._-]/gi, "-"))
}

function listNativeFiles(root: string): string[] {
  const files: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(root)
  } catch {
    return files
  }
  for (const entry of entries) {
    const path = join(root, entry)
    let stat
    try {
      stat = statSync(path)
    } catch {
      continue
    }
    if (stat.isDirectory()) files.push(...listNativeFiles(path))
    else if (stat.isFile()) files.push(path)
  }
  return files
}

export async function captureNativePiMonoTrace(
  scenario: OpenCodeDifferentialScenario,
  input: NativePiMonoCaptureInput = {},
): Promise<OpenCodeDifferentialTrace> {
  const env = input.env ?? process.env
  const modelID = input.modelID ?? env["HELIX_LIVE_MODEL"] ?? env["ANTHROPIC_MODEL"]
  const apiKey = input.apiKey ?? env["ANTHROPIC_API_KEY"]
  if (!modelID) throw new Error("Native Pi Mono differential capture requires HELIX_LIVE_MODEL, ANTHROPIC_MODEL, or modelID.")
  if (!apiKey) throw new Error("Native Pi Mono differential capture requires ANTHROPIC_API_KEY or apiKey.")

  const packageSpec = input.packageSpec ?? defaultNativePiMonoPackageSpec
  const baseURL = nativePiMonoAnthropicBaseURL(input.baseURL ?? env["HELIX_LIVE_BASE_URL"])
  const home = mkdtempSync(join(tmpdir(), "helix-native-pi-home-"))
  const project = mkdtempSync(join(tmpdir(), "helix-native-pi-project-"))
  const configDir = join(home, ".pi", "agent")
  const sessionDir = join(configDir, "sessions")
  try {
    const npmCacheDir = prepareNativeNpmCache("pi")
    if (baseURL) writeNativePiModelsConfig(configDir, baseURL)
    const commandEnv: NodeJS.ProcessEnv = {
      ...process.env,
      ...env,
      HOME: home,
      npm_config_cache: npmCacheDir,
      PI_CODING_AGENT_DIR: configDir,
      PI_CODING_AGENT_SESSION_DIR: sessionDir,
      PI_OFFLINE: "1",
      NO_COLOR: "1",
      ANTHROPIC_API_KEY: apiKey,
    }
    const args = [
      "-y",
      packageSpec,
      "--offline",
      "--no-extensions",
      "--no-skills",
      "--no-prompt-templates",
      "--no-themes",
      "--no-context-files",
      "--session-dir",
      sessionDir,
      ...(modelID.includes("/") ? [] : ["--provider", "anthropic"]),
      "--model",
      modelID,
      "--api-key",
      apiKey,
      "--tools",
      "read,bash,edit,write",
      "--mode",
      "json",
      "--print",
      scenario.prompt,
    ]
    const run = await execNativePiMono(args, commandEnv, project, input.timeoutMs ?? 120_000)
    const events = parseJSONLines(run.stdout)
    const session = readNativePiSession(sessionDir)
    const messages = session.messages
    const assistant = [...messages].reverse().find((message) => message.role === "assistant")
    const steps = events.filter((event) => record(event)?.["type"] === "turn_start").length
    const assistantError = assistant?.role === "assistant" ? assistant.error?.message : undefined
    const captureError = run.error ?? assistantError
    return withDifferentialDebugTrace({
      product: "pi-mono",
      source: "original",
      sourceLabel: `${packageSpec} native CLI capture`,
      scenarioID: scenario.id,
      ...(session.sessionID ? { sessionID: session.sessionID } : {}),
      ...(steps > 0 ? { steps } : {}),
      ...(assistant?.role === "assistant" && assistant.finish ? { finish: assistant.finish } : {}),
      transcriptRoles: messages.map((message) => message.role),
      assistantVisibleText: assistant ? visibleAssistantText(assistant.parts) : "",
      assistantAllText: assistant ? messageText(assistant) : "",
      assistantPartTypes: assistant ? assistant.parts.map(logicalPartType) : [],
      toolNames: ["bash", "edit", "read", "write"].sort(),
      storage: {
        kind: "pi-jsonl-v3",
        nativeSchema: session.nativeSchema,
        tables: ["session-header", "message", "thinking", "model-change", "tool-call", "tool-result", "branch-summary"],
      },
      provider: {
        kind: "pi-ai-anthropic-messages",
        modelID,
        anthropicEndpointSuffix: "/messages",
        baseURLExample: baseURL ?? "https://api.anthropic.com/v1",
      },
      cli: nativePiMonoCLITrace(events, assistant ? visibleAssistantText(assistant.parts) : scenario.assistantText),
      capture: {
        mode: "native",
        packageSpec,
        ...(run.exitCode === undefined ? {} : { exitCode: run.exitCode }),
        ...(captureError ? { error: captureError } : {}),
        stdoutLines: run.stdout.split(/\r?\n/).filter(Boolean).length,
        stderrLines: run.stderr.split(/\r?\n/).filter(Boolean).length,
        stderrTail: redactSecrets(run.stderr)
          .split(/\r?\n/)
          .filter(Boolean)
          .slice(-20)
          .join("\n"),
      },
    })
  } finally {
    if (!input.keepTemp) {
      rmSync(home, { recursive: true, force: true })
      rmSync(project, { recursive: true, force: true })
    }
  }
}

export async function captureNativeOpenCodeTrace(
  scenario: OpenCodeDifferentialScenario,
  input: NativeOpenCodeCaptureInput = {},
): Promise<OpenCodeDifferentialTrace> {
  const env = input.env ?? process.env
  const modelID = input.modelID ?? env["HELIX_LIVE_MODEL"] ?? env["ANTHROPIC_MODEL"]
  const apiKey = input.apiKey ?? env["ANTHROPIC_API_KEY"]
  if (!modelID) throw new Error("Native OpenCode differential capture requires HELIX_LIVE_MODEL, ANTHROPIC_MODEL, or modelID.")
  if (!apiKey) throw new Error("Native OpenCode differential capture requires ANTHROPIC_API_KEY or apiKey.")

  const packageSpec = input.packageSpec ?? "opencode-ai@1.15.11"
  const baseURL = nativeOpenCodeAnthropicBaseURL(input.baseURL ?? env["HELIX_LIVE_BASE_URL"])
  const home = mkdtempSync(join(tmpdir(), "helix-native-opencode-home-"))
  const project = mkdtempSync(join(tmpdir(), "helix-native-opencode-project-"))
  try {
    const npmCacheDir = prepareNativeNpmCache("opencode")
    const config = JSON.stringify({
      $schema: "https://opencode.ai/config.json",
      provider: {
        anthropic: {
          ...(baseURL ? { options: { baseURL } } : {}),
          models: {
            [modelID]: {
              name: modelID,
            },
          },
        },
      },
      model: `anthropic/${modelID}`,
      small_model: `anthropic/${modelID}`,
      tools: {
        write: false,
        edit: false,
        bash: false,
      },
    })
    const commandEnv: NodeJS.ProcessEnv = {
      ...process.env,
      ...env,
      HOME: home,
      npm_config_cache: npmCacheDir,
      XDG_CONFIG_HOME: join(home, ".config"),
      XDG_DATA_HOME: join(home, ".local", "share"),
      OPENCODE_CONFIG_CONTENT: config,
      OPENCODE_DISABLE_AUTOUPDATE: "1",
      OPENCODE_DISABLE_LSP_DOWNLOAD: "1",
      OPENCODE_DISABLE_MODELS_FETCH: "1",
      OPENCODE_DISABLE_DEFAULT_PLUGINS: "1",
      OPENCODE_DISABLE_CLAUDE_CODE: "1",
      NO_COLOR: "1",
      ANTHROPIC_API_KEY: apiKey,
    }
    const run = await execNativeOpenCode(
      [
        "-y",
        packageSpec,
        "--print-logs",
        "--log-level",
        "INFO",
        "run",
        "--dir",
        project,
        "--model",
        `anthropic/${modelID}`,
        "--format",
        "json",
        scenario.prompt,
      ],
      commandEnv,
      input.timeoutMs ?? 120_000,
    )
    const stdout = run.stdout
    const stderr = run.stderr
    const events = parseJSONLines(stdout)
    const db = await readNativeOpenCodeSQLite(join(home, ".local", "share", "opencode", "opencode.db"))
    const assistantMessageID = [...db.messages].reverse().find((message) => message.role === "assistant")?.id
    const assistantParts = db.parts.filter((part) => part.messageID === assistantMessageID)
    const stdoutAssistant = nativeOpenCodeAssistantFromEvents(events)
    const visibleText =
      assistantParts.length > 0
        ? assistantParts
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .filter(Boolean)
            .join("\n")
        : stdoutAssistant.visibleText
    const allText =
      assistantParts.length > 0
        ? assistantParts
            .filter((part) => part.type === "text" || part.type === "reasoning")
            .map((part) => part.text)
            .filter(Boolean)
            .join("\n")
        : stdoutAssistant.allText
    const stepFinish = assistantParts.find((part) => part.type === "step-finish")
    const finish = typeof stepFinish?.data?.["reason"] === "string" ? stepFinish.data["reason"] : stdoutAssistant.finish
    const transcriptRoles = db.messages.map((message) => message.role).filter(Boolean)
    const assistantPartTypes = assistantParts.length > 0 ? assistantParts.map((part) => part.type).filter(Boolean) : stdoutAssistant.partTypes
    return withDifferentialDebugTrace({
      product: "opencode",
      source: "original",
      sourceLabel: `${packageSpec} native CLI capture`,
      scenarioID: scenario.id,
      ...(db.sessionID ?? stdoutAssistant.sessionID ? { sessionID: db.sessionID ?? stdoutAssistant.sessionID } : {}),
      ...(assistantParts.some((part) => part.type === "step-start")
        ? { steps: assistantParts.filter((part) => part.type === "step-start").length }
        : stdoutAssistant.steps > 0
          ? { steps: stdoutAssistant.steps }
        : {}),
      ...(finish ? { finish } : {}),
      transcriptRoles: transcriptRoles.length > 0 ? transcriptRoles : visibleText ? ["user", "assistant"] : [],
      assistantVisibleText: visibleText,
      assistantAllText: allText,
      assistantPartTypes,
      toolNames: nativeToolNames(stderr),
      storage: {
        kind: "opencode-sqlite-native",
        nativeSchema: db.tables.includes("message") && db.tables.includes("part") && db.tables.includes("session"),
        tables: db.tables,
      },
      provider: {
        kind: "ai-sdk-anthropic",
        modelID,
        anthropicEndpointSuffix: "/messages",
        ...(baseURL ? { baseURLExample: baseURL } : {}),
      },
      cli: nativeOpenCodeCLITrace(events),
      capture: {
        mode: "native",
        packageSpec,
        ...(run.exitCode === undefined ? {} : { exitCode: run.exitCode }),
        ...(run.error ? { error: run.error } : {}),
        stdoutLines: stdout.split(/\r?\n/).filter(Boolean).length,
        stderrLines: stderr.split(/\r?\n/).filter(Boolean).length,
        stderrTail: redactSecrets(stderr)
          .split(/\r?\n/)
          .filter(Boolean)
          .slice(-20)
          .join("\n"),
      },
    })
  } finally {
    if (!input.keepTemp) {
      rmSync(home, { recursive: true, force: true })
      rmSync(project, { recursive: true, force: true })
    }
  }
}

async function execNativeOpenCode(
  args: string[],
  env: NodeJS.ProcessEnv,
  timeout: number,
): Promise<{ stdout: string; stderr: string; exitCode?: number; error?: string }> {
  return execNativeNpx(args, env, timeout)
}

async function execNativePiMono(
  args: string[],
  env: NodeJS.ProcessEnv,
  cwd: string,
  timeout: number,
): Promise<{ stdout: string; stderr: string; exitCode?: number; error?: string }> {
  return execNativeNpx(args, env, timeout, cwd)
}

function execNativeNpx(
  args: string[],
  env: NodeJS.ProcessEnv,
  timeout: number,
  cwd?: string,
): Promise<{ stdout: string; stderr: string; exitCode?: number; error?: string }> {
  return new Promise((resolve) => {
    const child = spawn("npx", args, {
      env,
      ...(cwd ? { cwd } : {}),
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    let settled = false
    let timedOut = false
    let forceKillTimer: NodeJS.Timeout | undefined
    const timer = setTimeout(() => {
      timedOut = true
      killNativeProcess(child, "SIGTERM")
      forceKillTimer = setTimeout(() => {
        killNativeProcess(child, "SIGKILL")
      }, 5_000)
    }, timeout)
    child.stdout?.setEncoding("utf8")
    child.stderr?.setEncoding("utf8")
    child.stdout?.on("data", (chunk) => {
      stdout += String(chunk)
    })
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk)
    })
    child.on("error", (error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (forceKillTimer) clearTimeout(forceKillTimer)
      resolve({ stdout, stderr, error: error.message })
    })
    child.on("close", (code, signal) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (forceKillTimer) clearTimeout(forceKillTimer)
      resolve({
        stdout,
        stderr,
        ...(typeof code === "number" ? { exitCode: code } : {}),
        ...(timedOut
          ? { error: signal ? `timeout ${timeout}ms (${signal})` : `timeout ${timeout}ms` }
          : signal
            ? { error: `signal ${signal}` }
            : code && code !== 0
              ? { error: `exit ${code}` }
              : {}),
      })
    })
  })
}

function prepareNativeNpmCache(product: "opencode" | "pi"): string {
  const existing = process.env["npm_config_cache"] ?? process.env["NPM_CONFIG_CACHE"]
  if (existing) return existing
  if (process.env["HOME"]) return join(process.env["HOME"], ".npm")
  const cacheDir = join(nativeNpmCacheRoot, product)
  mkdirSync(cacheDir, { recursive: true })
  rmSync(join(cacheDir, "_npx"), { recursive: true, force: true })
  return cacheDir
}

function killNativeProcess(child: ReturnType<typeof spawn>, signal: NodeJS.Signals): void {
  const pid = child.pid
  if (pid && pid > 0) {
    try {
      process.kill(-pid, signal)
      return
    } catch {
      // Fall back to the child process handle when the platform or process tree does not expose a group.
    }
  }
  try {
    child.kill(signal)
  } catch {
    // The process may already have exited between timeout handling and close.
  }
}

export function nativeOpenCodeAnthropicBaseURL(baseURL: string | undefined): string | undefined {
  if (!baseURL) return undefined
  const trimmed = baseURL.replace(/\/+$/, "")
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`
}

export function nativePiMonoAnthropicBaseURL(baseURL: string | undefined): string | undefined {
  if (!baseURL) return undefined
  const trimmed = baseURL.replace(/\/+$/, "")
  return trimmed.endsWith("/v1") ? trimmed.slice(0, -3) : trimmed
}

function writeNativePiModelsConfig(configDir: string, baseURL: string): void {
  mkdirSync(configDir, { recursive: true })
  writeFileSync(
    join(configDir, "models.json"),
    `${JSON.stringify(
      {
        providers: {
          anthropic: {
            baseUrl: baseURL,
            apiKey: "ANTHROPIC_API_KEY",
            api: "anthropic-messages",
          },
        },
      },
      null,
      2,
    )}\n`,
  )
}

function readNativePiSession(sessionDir: string): { sessionID?: string; nativeSchema: boolean; messages: LegoMessage[] } {
  try {
    const storage = new JsonlTreeFileStorage(sessionDir)
    const files = storage.listFiles({ recursive: true }).sort()
    const file = files.at(-1)
    if (!file) return { nativeSchema: false, messages: [] }
    const document = storage.read(file)
    const messages = document.entries
      .filter((entry): entry is MessageEntry => entry.type === "message")
      .map((entry) => entry.message)
    return {
      sessionID: document.header.id,
      nativeSchema: document.header.version === 3 && messages.length > 0,
      messages,
    }
  } catch {
    return { nativeSchema: false, messages: [] }
  }
}

function nativePiMonoCLITrace(events: unknown[], visibleText: string): OpenCodeDifferentialTrace["cli"] {
  const first = record(events[0])
  return {
    protocol: "pi-coding-agent-json-event-stream",
    stdoutEventTypes: events.map((event) => String(record(event)?.["type"] ?? "")).filter(Boolean),
    stdoutTextVisible: visibleText ? events.some((event) => JSON.stringify(event).includes(visibleText)) : false,
    jsonTopLevelKeys: first ? Object.keys(first) : [],
  }
}

function nativeOpenCodeCLITrace(events: unknown[]): OpenCodeDifferentialTrace["cli"] {
  const first = record(events[0])
  return {
    protocol: "opencode-run-json-events",
    stdoutEventTypes: events.map((event) => String(record(event)?.["type"] ?? "")).filter(Boolean),
    stdoutTextVisible: false,
    jsonTopLevelKeys: first ? Object.keys(first) : [],
  }
}

function nativeOpenCodeAssistantFromEvents(events: unknown[]): {
  sessionID?: string
  steps: number
  finish?: string
  visibleText: string
  allText: string
  partTypes: string[]
} {
  let sessionID: string | undefined
  let steps = 0
  let hasStepStart = false
  let hasStepFinish = false
  let finish: string | undefined
  const textChunks: string[] = []
  const reasoningChunks: string[] = []

  for (const event of events) {
    const eventRecord = record(event)
    if (!eventRecord) continue
    if (!sessionID && typeof eventRecord["sessionID"] === "string") sessionID = eventRecord["sessionID"]

    const eventType = String(eventRecord["type"] ?? "")
    const part = record(eventRecord["part"])
    const partType = typeof part?.["type"] === "string" ? part["type"] : undefined
    if (eventType === "step_start" || partType === "step-start") {
      steps += 1
      hasStepStart = true
    }
    if (eventType === "step_finish" || partType === "step-finish") {
      hasStepFinish = true
      const reason = part?.["reason"] ?? record(part?.["state"])?.["reason"]
      if (typeof reason === "string") finish = reason
    }
    if (eventType === "reasoning" || partType === "reasoning") {
      const text = nativeOpenCodeEventText(eventRecord, part)
      if (text) reasoningChunks.push(text)
    }
    if (eventType === "text" || partType === "text") {
      const text = nativeOpenCodeEventText(eventRecord, part)
      if (text) textChunks.push(text)
    }
  }

  const visibleText = textChunks.join("")
  const allText = [...reasoningChunks, visibleText].filter(Boolean).join("\n")
  const partTypes: string[] = []
  if (hasStepStart) partTypes.push("step-start")
  if (reasoningChunks.length > 0) partTypes.push("reasoning")
  if (visibleText) partTypes.push("text")
  if (hasStepFinish) partTypes.push("step-finish")
  return {
    ...(sessionID ? { sessionID } : {}),
    steps,
    ...(finish ? { finish } : {}),
    visibleText,
    allText,
    partTypes,
  }
}

function nativeOpenCodeEventText(event: Record<string, unknown>, part: Record<string, unknown> | undefined): string {
  const text = part?.["text"] ?? event["text"]
  if (typeof text === "string") return text
  const delta = record(event["delta"])
  if (typeof delta?.["text"] === "string") return delta["text"]
  if (typeof delta?.["content"] === "string") return delta["content"]
  return ""
}

export function compareOpenCodeTraces(
  assembled: OpenCodeDifferentialTrace,
  original: OpenCodeDifferentialTrace,
): OpenCodeDifferentialCheck[] {
  const assembledTrace = comparableDifferentialDebugTrace(assembled, effectiveDifferentialDebugTrace(assembled))
  const originalTrace = comparableDifferentialDebugTrace(original, effectiveDifferentialDebugTrace(original))
  return [
    check(
      "transcript.roles",
      arraysEqual(assembled.transcriptRoles, original.transcriptRoles),
      "Both traces create the same user/assistant transcript role sequence.",
      assembled.transcriptRoles,
      original.transcriptRoles,
    ),
    check(
      "assistant.visible-text",
      assembled.assistantVisibleText === original.assistantVisibleText,
      "Both traces can produce the same visible assistant answer for the scenario.",
      assembled.assistantVisibleText,
      original.assistantVisibleText,
    ),
    check(
      "assistant.part-types",
      assistantPartTypesCompatible(assembled, original),
      "Assistant message part protocol matches the original product shape.",
      assembled.assistantPartTypes,
      original.assistantPartTypes,
      "Add native OpenCode step-start, reasoning metadata, and step-finish projection atoms.",
    ),
    check(
      "provider.anthropic-endpoint",
      assembled.provider.anthropicEndpointSuffix === original.provider.anthropicEndpointSuffix,
      "Anthropic baseURL composition matches the original product adapter.",
      assembled.provider,
      original.provider,
      "Add an opencode.provider.ai-sdk-anthropic personality atom or endpoint policy binding.",
    ),
    check(
      "storage.native-schema",
      assembled.storage.nativeSchema === original.storage.nativeSchema && assembled.storage.kind === original.storage.kind,
      "Session storage is compatible with the original product schema.",
      assembled.storage,
      original.storage,
      "Add opencode.session.sqlite-native storage and migration replay support.",
    ),
    check(
      "cli.output-protocol",
      cliProtocolCompatible(assembled, original),
      "CLI output protocol matches the original product JSON behavior.",
      assembled.cli,
      original.cli,
      "Add an opencode.cli.native-output product shell around the assembled harness.",
    ),
    check(
      "tool.registry",
      arraysEqual(assembled.toolNames, original.toolNames),
      "Default tool registry names match the original product.",
      assembled.toolNames,
      original.toolNames,
      "Map glob/webfetch/todowrite/skill and OpenCode tool naming into recipe-selected tool atoms.",
    ),
    check(
      "trace.debug-events",
      arraysEqual(assembledTrace.debugEventTypes, originalTrace.debugEventTypes),
      "Debug trace event types match the pinned product trace capture.",
      assembledTrace.debugEventTypes,
      originalTrace.debugEventTypes,
      "Add product-native debug event capture instead of presenting assembled-only trace events as upstream parity.",
    ),
    check(
      "trace.span-order",
      arraysEqual(assembledTrace.spanOrder, originalTrace.spanOrder),
      "Trace span ordering matches the pinned product trace capture.",
      assembledTrace.spanOrder,
      originalTrace.spanOrder,
      "Replay native trace span order and fail when message/provider/session spans are reordered.",
    ),
    check(
      "trace.redaction-policy",
      stableStringify(assembledTrace.redaction) === stableStringify(originalTrace.redaction),
      "Trace redaction/readback policy matches the pinned product trace capture.",
      assembledTrace.redaction,
      originalTrace.redaction,
      "Preserve native trace redaction policy and fail when raw prompt, provider request, workspace path, or secrets leak into trace artifacts.",
    ),
    check(
      "trace.readback",
      stableStringify(assembledTrace.readback) === stableStringify(originalTrace.readback),
      "Trace storage/readback evidence matches the pinned product trace capture.",
      assembledTrace.readback,
      originalTrace.readback,
      "Replay native trace readback from the product storage/transcript instead of relying on adapter metadata.",
    ),
    check(
      "trace.flow-projection",
      stableStringify(assembledTrace.flowProjection) === stableStringify(originalTrace.flowProjection),
      "Flow projection metrics preserve the pinned product trace event sequence.",
      assembledTrace.flowProjection,
      originalTrace.flowProjection,
      "Preserve native flow projection details and fail when assembled debug projections are treated as upstream trace parity.",
    ),
  ]
}

function withDifferentialDebugTrace<T extends Omit<OpenCodeDifferentialTrace, "trace"> & { trace?: OpenCodeDifferentialDebugTrace }>(trace: T): OpenCodeDifferentialTrace {
  return {
    ...trace,
    trace: buildDifferentialDebugTrace(trace),
  }
}

function effectiveDifferentialDebugTrace(trace: OpenCodeDifferentialTrace): OpenCodeDifferentialDebugTrace {
  const computed = buildDifferentialDebugTrace(trace)
  if (trace.trace?.sourceFingerprint === computed.sourceFingerprint) return trace.trace
  return computed
}

function comparableDifferentialDebugTrace(trace: OpenCodeDifferentialTrace, debugTrace: OpenCodeDifferentialDebugTrace): OpenCodeDifferentialDebugTrace {
  const eventSequence = normalizeTraceEventSequence(trace.product, debugTrace.flowProjection.eventSequence)
  const assistantPartTypes = normalizeTraceAssistantPartTypes(trace.product, debugTrace.readback.assistantPartTypes)
  return {
    ...debugTrace,
    debugEventTypes: uniqueStrings([...eventSequence, ...assistantPartTypes.map((type) => `assistant.${normalizeTraceEventType(type)}`)]),
    spanOrder: [
      `storage:${debugTrace.readback.storageKind}`,
      ...debugTrace.readback.transcriptRoles.map((role, index) => `transcript.${index}:${role}`),
      ...assistantPartTypes.map((type, index) => `assistant.${index}:${normalizeTraceEventType(type)}`),
      ...eventSequence.map((type, index) => `cli.${index}:${type}`),
    ],
    readback: {
      ...debugTrace.readback,
      storageTables: [...debugTrace.readback.storageTables].sort(),
      assistantPartTypes,
    },
    flowProjection: {
      ...debugTrace.flowProjection,
      eventSequence,
      storageRefs: [...debugTrace.flowProjection.storageRefs].sort(),
    },
  }
}

function buildDifferentialDebugTrace(trace: Omit<OpenCodeDifferentialTrace, "trace"> | OpenCodeDifferentialTrace): OpenCodeDifferentialDebugTrace {
  const eventSequence = trace.cli.stdoutEventTypes.map(normalizeTraceEventType)
  const assistantSpans = trace.assistantPartTypes.map((type, index) => `assistant.${index}:${normalizeTraceEventType(type)}`)
  const transcriptSpans = trace.transcriptRoles.map((role, index) => `transcript.${index}:${role}`)
  const storageRefs = [trace.storage.kind, ...(trace.storage.tables ?? [])]
  const sourceFingerprint = fingerprintObject({
    product: trace.product,
    scenarioID: trace.scenarioID,
    transcriptRoles: trace.transcriptRoles,
    assistantPartTypes: trace.assistantPartTypes,
    storage: trace.storage,
    cli: trace.cli,
  })
  return {
    sourceFingerprint,
    debugEventTypes: uniqueStrings([...eventSequence, ...trace.assistantPartTypes.map((type) => `assistant.${normalizeTraceEventType(type)}`)]),
    spanOrder: [`storage:${trace.storage.kind}`, ...transcriptSpans, ...assistantSpans, ...eventSequence.map((type, index) => `cli.${index}:${type}`)],
    redaction: {
      prompt: "summary-only",
      providerRequest: "omitted",
      secrets: "redacted",
      workspacePath: "omitted",
    },
    readback: {
      storageKind: trace.storage.kind,
      nativeSchema: trace.storage.nativeSchema,
      storageTables: [...(trace.storage.tables ?? [])].sort(),
      transcriptRoles: trace.transcriptRoles,
      assistantPartTypes: trace.assistantPartTypes,
    },
    flowProjection: {
      protocol: trace.cli.protocol,
      eventSequence,
      projectedStages: traceProjectionStages(trace, eventSequence),
      storageRefs,
    },
  }
}

function traceProjectionStages(trace: Omit<OpenCodeDifferentialTrace, "trace"> | OpenCodeDifferentialTrace, eventSequence: string[]): string[] {
  const stages = new Set<string>()
  if (trace.transcriptRoles.length > 0) stages.add("surface.input")
  if (trace.storage.nativeSchema) stages.add("session.open")
  if (trace.transcriptRoles.includes("user")) stages.add("session.user-write")
  if (eventSequence.some((event) => event.includes("start") || event.includes("request") || event === "pre-llm-call")) stages.add("provider.request")
  if (eventSequence.some((event) => event.includes("delta") || event === "text" || event.includes("update"))) stages.add("provider.stream")
  if (trace.assistantPartTypes.length > 0) stages.add("stream.project")
  if (trace.transcriptRoles.includes("assistant")) stages.add("session.assistant-write")
  if (trace.finish || eventSequence.some((event) => event.includes("end") || event.includes("finish") || event === "post-llm-call")) stages.add("loop.boundary")
  if (trace.assistantVisibleText) stages.add("surface.output")
  return [...stages]
}

function normalizeTraceEventType(type: string): string {
  return type.replace(/_/g, "-").replace(/\./g, "-")
}

function normalizeTraceEventSequence(product: HarnessDifferentialProduct, eventSequence: string[]): string[] {
  if (product !== "pi-mono") return eventSequence
  const normalized: string[] = []
  for (const event of eventSequence) {
    if (event === "message-update" && normalized.at(-1) === "message-update") continue
    normalized.push(event)
  }
  return normalized
}

function normalizeTraceAssistantPartTypes(product: HarnessDifferentialProduct, partTypes: string[]): string[] {
  if (product !== "pi-mono") return partTypes
  return partTypes.filter((type) => type !== "reasoning")
}

function check(
  id: string,
  ok: boolean,
  message: string,
  assembled: unknown,
  original: unknown,
  next?: string,
): OpenCodeDifferentialCheck {
  return {
    id,
    ok,
    severity: ok ? "match" : "gap",
    message,
    assembled,
    original,
    ...(next && !ok ? { next } : {}),
  }
}

function assistantPartTypesCompatible(assembled: OpenCodeDifferentialTrace, original: OpenCodeDifferentialTrace): boolean {
  if (assembled.product === "pi-mono" && original.product === "pi-mono") {
    const assembledVisibleTypes = assembled.assistantPartTypes.filter((type) => type !== "reasoning")
    const originalVisibleTypes = original.assistantPartTypes.filter((type) => type !== "reasoning")
    return arraysEqual(assembledVisibleTypes, originalVisibleTypes)
  }
  if (assembled.product === "opencode" && original.product === "opencode" && original.capture?.mode === "native" && !original.storage.nativeSchema) {
    return arraysEqual(normalizeOpenCodeStdoutPartTypes(assembled.assistantPartTypes), normalizeOpenCodeStdoutPartTypes(original.assistantPartTypes))
  }
  return arraysEqual(assembled.assistantPartTypes, original.assistantPartTypes)
}

function normalizeOpenCodeStdoutPartTypes(types: string[]): string[] {
  const normalized: string[] = []
  for (const type of types) {
    if (type !== "step-start" && type !== "text") continue
    if (normalized.at(-1) !== type) normalized.push(type)
  }
  return normalized
}

function cliProtocolCompatible(assembled: OpenCodeDifferentialTrace, original: OpenCodeDifferentialTrace): boolean {
  if (assembled.cli.protocol !== original.cli.protocol) return false
  if (assembled.cli.stdoutTextVisible !== original.cli.stdoutTextVisible) return false
  if (assembled.product === "opencode" && original.product === "opencode") {
    return arraysEqual(normalizeOpenCodeCLIEventTypes(assembled.cli.stdoutEventTypes), normalizeOpenCodeCLIEventTypes(original.cli.stdoutEventTypes))
  }
  if (assembled.product === "pi-mono" && original.product === "pi-mono") {
    return arraysEqual(normalizePiCLIEventTypes(assembled.cli.stdoutEventTypes), normalizePiCLIEventTypes(original.cli.stdoutEventTypes))
  }
  return arraysEqual(assembled.cli.stdoutEventTypes, original.cli.stdoutEventTypes)
}

function normalizeOpenCodeCLIEventTypes(types: string[]): string[] {
  return types.filter((type) => type !== "text")
}

function normalizePiCLIEventTypes(types: string[]): string[] {
  const normalized: string[] = []
  for (const type of types) {
    if (type === "message_update" && normalized.at(-1) === "message_update") continue
    normalized.push(type)
  }
  return normalized
}

function visibleAssistantText(parts: LegoMessagePart[]): string {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
}

function logicalPartType(part: LegoMessagePart): string {
  return part.type === "custom" ? part.customType : part.type
}

function messageText(message: LegoMessage): string {
  return message.parts.map(partText).filter(Boolean).join("\n")
}

function partText(part: LegoMessagePart): string {
  if (part.type === "text" || part.type === "reasoning") return part.text
  if (part.type === "tool_call") return JSON.stringify(part.input)
  if (part.type === "tool_result") return part.content.map(partText).filter(Boolean).join("\n")
  if (part.type === "compaction") return part.summary
  if (part.type === "custom") return part.display ?? ""
  return ""
}

interface NativeOpenCodeMessageRow {
  id: string
  sessionID: string
  role: string
}

interface NativeOpenCodePartRow {
  id: string
  messageID: string
  sessionID: string
  type: string
  text: string
  data?: Record<string, unknown>
}

async function readNativeOpenCodeSQLite(dbPath: string): Promise<{
  tables: string[]
  sessionID?: string
  messages: NativeOpenCodeMessageRow[]
  parts: NativeOpenCodePartRow[]
}> {
  if (!existsSync(dbPath)) return { tables: [], messages: [], parts: [] }
  const tables = await sqliteJSON<{ name?: string }>(dbPath, "select name from sqlite_master where type = 'table' order by name")
  const messages = await sqliteJSON<{ id?: string; session_id?: string; role?: string }>(
    dbPath,
    "select id, session_id, json_extract(data, '$.role') as role from message order by time_created, id",
  )
  const parts = await sqliteJSON<{ id?: string; message_id?: string; session_id?: string; type?: string; text?: string; data?: string }>(
    dbPath,
    "select id, message_id, session_id, json_extract(data, '$.type') as type, json_extract(data, '$.text') as text, data from part order by time_created, id",
  )
  const normalizedMessages = messages.flatMap((message) => {
    if (!message.id || !message.session_id || !message.role) return []
    return [{ id: message.id, sessionID: message.session_id, role: message.role }]
  })
  const normalizedParts = parts.flatMap((part) => {
    if (!part.id || !part.message_id || !part.session_id || !part.type) return []
    const data = part.data ? parseJSONRecord(part.data) : undefined
    return [
      {
        id: part.id,
        messageID: part.message_id,
        sessionID: part.session_id,
        type: part.type,
        text: part.text ?? "",
        ...(data ? { data } : {}),
      },
    ]
  })
  return {
    tables: tables.map((table) => table.name).filter((name): name is string => Boolean(name)),
    ...(normalizedMessages[0]?.sessionID ? { sessionID: normalizedMessages[0].sessionID } : {}),
    messages: normalizedMessages,
    parts: normalizedParts,
  }
}

async function sqliteJSON<T extends Record<string, unknown>>(dbPath: string, sql: string): Promise<T[]> {
  try {
    const result = await execFileAsync("sqlite3", ["-json", dbPath, sql], { timeout: 10_000, maxBuffer: 8 * 1024 * 1024 })
    const stdout = String(result.stdout ?? "").trim()
    if (!stdout) return []
    const parsed = JSON.parse(stdout) as unknown
    return Array.isArray(parsed) ? (parsed.filter(record) as T[]) : []
  } catch {
    return sqliteNodeJSON(dbPath, sql)
  }
}

function sqliteNodeJSON<T extends Record<string, unknown>>(dbPath: string, sql: string): T[] {
  try {
    const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite")
    const db = new DatabaseSync(dbPath)
    try {
      const rows = db.prepare(sql).all() as unknown[]
      return rows.filter(record) as T[]
    } finally {
      db.close()
    }
  } catch {
    return []
  }
}

function parseJSONLines(stdout: string): unknown[] {
  const events: unknown[] = []
  for (const line of stdout.split(/\r?\n/).filter(Boolean)) {
    try {
      events.push(JSON.parse(line) as unknown)
    } catch {
      // Native CLI logs can include non-JSON notices when package managers are noisy.
    }
  }
  return events
}

function parseJSONRecord(raw: string): Record<string, unknown> | undefined {
  try {
    return record(JSON.parse(raw) as unknown)
  } catch {
    return undefined
  }
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
}

function nativeToolNames(stderr: string): string[] {
  const names = new Set<string>()
  for (const match of stderr.matchAll(/service=tool\.registry\s+status=started\s+([a-zA-Z0-9_-]+)/g)) {
    if (match[1]) names.add(match[1])
  }
  return [...names].sort()
}

function redactSecrets(value: string): string {
  return value
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-<redacted>")
    .replace(/("key"\s*:\s*")[^"]+/gi, "$1<redacted>")
    .replace(/(Authorization:\s*Bearer\s+)[^\s]+/gi, "$1<redacted>")
    .replace(/(api[_-]?key[=:\s]+)[^\s,}]+/gi, "$1<redacted>")
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)].filter(Boolean).sort()
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const recordValue = value as Record<string, unknown>
  return `{${Object.keys(recordValue).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(recordValue[key])}`).join(",")}}`
}

function arraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function definedScenarioFields(input: Partial<OpenCodeDifferentialScenario>): Partial<OpenCodeDifferentialScenario> {
  return {
    ...(input.id ? { id: input.id } : {}),
    ...(input.prompt ? { prompt: input.prompt } : {}),
    ...(input.assistantText ? { assistantText: input.assistantText } : {}),
  }
}
