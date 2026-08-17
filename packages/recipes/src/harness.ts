import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { LegoMessage, LegoModel, LegoProviderAdapter, LegoRecipe, LegoSerializedError, SessionID, ToolCallID } from "@helix/contracts"
import {
  createOpenCodeSessionPersonality,
  createOpenCodeHookHost,
  openCodeReference,
  registerOpenCodeBuiltinProviderPlugins,
  registerOpenCodeProductSurfaces,
  type OpenCodeSurfaceHarness,
} from "@helix/adapters-opencode"
import { createPiSessionPersonality, piReference, registerPiProductSurfaces, type PiSurfaceHarness } from "@helix/adapters-pi"
import {
  createNanobotSessionPersonality,
  nanobotReference,
  registerNanobotProductSurfaces,
  type NanobotSurfaceHarness,
} from "@helix/adapters-nanobot"
import {
  createHermesSessionPersonality,
  hermesReference,
  registerHermesProductSurfaces,
  type HermesSurfaceHarness,
} from "@helix/adapters-hermes"
import { createHermesAgentConfig, createNanobotConfig, createOpenCodeConfig, createPiConfig, type LegoConfigService } from "@helix/lego-config"
import {
  createCadencePolicyBundle,
  createProductTurnAtoms,
  finalSummaryPolicyToken,
  requestBoundaryPolicyToken,
  runAgentTurn,
  toolBatchSchedulerToken,
} from "@helix/lego-agent-loop"
import { LegoHookHost } from "@helix/lego-hooks"
import { LegoPromptService } from "@helix/lego-prompt"
import { type SessionInfo, type SessionService } from "@helix/lego-session"
import {
  createAlwaysAllowPermissionPolicy,
  createAlwaysDenyPermissionPolicy,
  createAskHookPermissionPolicy,
  createDefaultTools,
  createOpenCodeDefaultTools,
  createPiDefaultTools,
  createDisabledProcessRunnerPort,
  createLocalFilesystemPort,
  createLocalProcessRunnerPort,
  createProductPersonalityPermissionPolicy,
  createWorkspaceScopedPermissionPolicy,
  filesystemPortToken,
  processRunnerPortToken,
  toolPermissionPolicyToken,
  type ToolPermissionPolicy,
} from "@helix/lego-tools"
import { NoopUI, type LegoUI } from "@helix/lego-ui"
import { compileRecipe } from "./compiler"
import { createInternalFixtureProviderFromTurn, type InternalFixtureProviderStep } from "./internal-fixture-provider"
import { hermesAgentRecipe, nanobotRecipe, opencodePiHybridRecipe, opencodeRecipe, piMonoRecipe } from "./recipes"
import { createHarnessRuntimeTraceCollector, type HarnessRuntimeTrace } from "./runtime-trace"

export interface AssembleHarnessOptions {
  cwd?: string
  storageDir?: string
  globalConfig?: Record<string, unknown>
  projectConfig?: Record<string, unknown>
  cliConfig?: Record<string, unknown>
}

export interface FixtureToolCall {
  toolName: string
  input: Record<string, unknown>
  id?: ToolCallID | string
}

export interface FixtureTurnInput {
  sessionID?: SessionID
  text: string
  assistantText?: string
  toolCalls?: FixtureToolCall[]
  steps?: InternalFixtureProviderStep[]
  maxSteps?: number
  maxRetries?: number
  retryDelayMs?: number
  syntheticContinue?: boolean
  syntheticContinueText?: string
  maxSyntheticContinues?: number
}

export interface HarnessTurnInput {
  sessionID?: SessionID
  text: string
  provider: LegoProviderAdapter
  model?: LegoModel
  maxSteps?: number
  maxInputTokens?: number
  compactionKeepMessages?: number
  autoCompact?: boolean
  maxRetries?: number
  retryDelayMs?: number
  maxToolResultTextChars?: number
  syntheticContinue?: boolean
  syntheticContinueText?: string
  maxSyntheticContinues?: number
  traceSource?: HarnessRuntimeTrace["source"]
}

export interface HarnessTurnResult {
  session: SessionInfo
  userMessage: LegoMessage
  assistantMessage: LegoMessage
  transcript: LegoMessage[]
  blockedTools: Array<{ toolName: string; reason?: string }>
  steps: number
  finish?: string
  usage?: unknown
  cost?: number
  contextCompacted?: boolean
  contextTokenEstimate?: number
  contextTokenLimit?: number
  retries?: number
  error?: LegoSerializedError
  syntheticContinues?: number
  runtimeTrace: HarnessRuntimeTrace
}

export type FixtureTurnResult = HarnessTurnResult

export interface AssembledHarness {
  product: HarnessProduct
  recipe: LegoRecipe
  reference: Record<string, unknown>
  session: SessionService
  hooks: LegoHookHost
  config: LegoConfigService
  prompt: LegoPromptService
  ui: LegoUI
  graph: Array<{ id: string; variant?: string }>
  runTurn(input: HarnessTurnInput): Promise<HarnessTurnResult>
  runFixtureTurn(input: FixtureTurnInput): Promise<FixtureTurnResult>
}

export function assembleOpenCodeHarness(options: AssembleHarnessOptions = {}): AssembledHarness {
  const cwd = options.cwd ?? process.cwd()
  const storageDir = options.storageDir ?? mkdtempSync(join(tmpdir(), "helix-opencode-"))
  const session = createOpenCodeSessionPersonality({ storageDir, ...(options.cwd ? { cwd: options.cwd } : {}) })
  const hooks = createOpenCodeHookHost()
  const config = createOpenCodeConfig({
    ...(options.globalConfig ? { global: options.globalConfig } : {}),
    ...(options.projectConfig ? { project: options.projectConfig } : {}),
    ...(options.cliConfig ? { cli: options.cliConfig } : {}),
    env: process.env,
  })
  const prompt = new LegoPromptService()
  prompt.discoverConventionalResources(cwd, "opencode")
  const ui = new NoopUI()
  prompt.attachHooks(hooks)
  registerDefaultTools(hooks, "opencode")
  registerOpenCodeBuiltinProviderPlugins(hooks, { env: process.env })
  registerCommonServices({ hooks, cwd, session, config, prompt, ui, recipe: opencodeRecipe })
  const harness = createHarness({
    product: "opencode",
    recipe: opencodeRecipe,
    reference: openCodeReference,
    session,
    hooks,
    config,
    prompt,
    ui,
  })
  hooks.services.set("storageDir", storageDir)
  hooks.services.set("opencode.sqlite.path", session.sqlitePath)
  registerOpenCodeProductSurfaces(harness as OpenCodeSurfaceHarness)
  return harness
}

export function assemblePiMonoHarness(options: AssembleHarnessOptions = {}): AssembledHarness {
  const cwd = options.cwd ?? process.cwd()
  const storageDir = options.storageDir ?? mkdtempSync(join(tmpdir(), "helix-pi-"))
  const session = createPiSessionPersonality({ storageDir, ...(options.cwd ? { cwd: options.cwd } : {}) })
  const hooks = new LegoHookHost()
  const config = createPiConfig({
    ...(options.globalConfig ? { global: options.globalConfig } : {}),
    ...(options.projectConfig ? { project: options.projectConfig } : {}),
    ...(options.cliConfig ? { cli: options.cliConfig } : {}),
    env: process.env,
  })
  const prompt = new LegoPromptService()
  prompt.discoverConventionalResources(cwd, "pi-mono")
  const ui = new NoopUI()
  prompt.attachHooks(hooks)
  registerDefaultTools(hooks, "pi-mono")
  registerCommonServices({ hooks, cwd, session, config, prompt, ui, recipe: piMonoRecipe })
  hooks.services.set("storageDir", storageDir)
  const harness = createHarness({
    product: "pi-mono",
    recipe: piMonoRecipe,
    reference: piReference,
    session,
    hooks,
    config,
    prompt,
    ui,
  })
  registerPiProductSurfaces(harness as PiSurfaceHarness)
  return harness
}

export function assembleOpenCodePiHybridHarness(options: AssembleHarnessOptions = {}): AssembledHarness {
  return assembleOpenCodePiHybridHarnessFromRecipe(opencodePiHybridRecipe, options)
}

function assembleOpenCodePiHybridHarnessFromRecipe(recipe: LegoRecipe, options: AssembleHarnessOptions = {}): AssembledHarness {
  const cwd = options.cwd ?? process.cwd()
  const blend = harnessComboBlendForRecipe(recipe) ?? defaultOpenCodePiHybridBlend()
  const storageDir = options.storageDir ?? mkdtempSync(join(tmpdir(), "helix-opencode-pi-hybrid-"))
  const session = createSessionPersonality(blend.session, storageDir, options.cwd)
  const hooks = createHookHost(blend.hooks)
  const config = createConfigService(blend.config, options)
  const prompt = new LegoPromptService()
  prompt.discoverConventionalResources(cwd, blend.prompt)
  const ui = new NoopUI()
  prompt.attachHooks(hooks)
  registerRuntimeDefaultTools(hooks, blend.tools)
  if (blend.providerPlugins === "opencode") registerOpenCodeBuiltinProviderPlugins(hooks, { env: process.env })
  registerCommonServices({ hooks, cwd, session, config, prompt, ui, recipe })
  hooks.services.set("storageDir", storageDir)
  if ("sqlitePath" in session && typeof session.sqlitePath === "string") hooks.services.set("opencode.sqlite.path", session.sqlitePath)
  if (blend.session === "hermes-agent") hooks.services.set("hermes.sqlite.path", `${storageDir}/hermes-sessions.sqlite`)
  hooks.services.set("harness.combo.blend", blend)
  hooks.services.set("opencode-pi.hybrid.runtime", legacyHybridRuntimeMarker(blend))
  const harness = createHarness({
    product: "opencode-pi-hybrid",
    recipe,
    reference: {
      product: "opencode-pi-hybrid",
      opencode: openCodeReference,
      "pi-mono": piReference,
      nanobot: nanobotReference,
      "hermes-agent": hermesReference,
      blend,
    },
    session,
    hooks,
    config,
    prompt,
    ui,
  })
  registerBlendProductSurfaces(harness, blend.surfaces)
  return harness
}

export function assembleNanobotHarness(options: AssembleHarnessOptions = {}): AssembledHarness {
  const cwd = options.cwd ?? process.cwd()
  const storageDir = options.storageDir ?? mkdtempSync(join(tmpdir(), "helix-nanobot-"))
  const session = createNanobotSessionPersonality({ storageDir, ...(options.cwd ? { cwd: options.cwd } : {}) })
  const hooks = new LegoHookHost()
  const config = createNanobotConfig({
    ...(options.globalConfig ? { global: options.globalConfig } : {}),
    ...(options.projectConfig ? { project: options.projectConfig } : {}),
    ...(options.cliConfig ? { cli: options.cliConfig } : {}),
    env: process.env,
  })
  const prompt = new LegoPromptService()
  prompt.discoverConventionalResources(cwd, "nanobot")
  const ui = new NoopUI()
  prompt.attachHooks(hooks)
  registerDefaultTools(hooks, "nanobot")
  registerCommonServices({ hooks, cwd, session, config, prompt, ui, recipe: nanobotRecipe })
  hooks.services.set("storageDir", storageDir)
  const harness = createHarness({
    product: "nanobot",
    recipe: nanobotRecipe,
    reference: nanobotReference,
    session,
    hooks,
    config,
    prompt,
    ui,
  })
  registerNanobotProductSurfaces(harness as NanobotSurfaceHarness)
  return harness
}

export function assembleHermesAgentHarness(options: AssembleHarnessOptions = {}): AssembledHarness {
  const cwd = options.cwd ?? process.cwd()
  const storageDir = options.storageDir ?? mkdtempSync(join(tmpdir(), "helix-hermes-"))
  const session = createHermesSessionPersonality({ storageDir, ...(options.cwd ? { cwd: options.cwd } : {}) })
  const hooks = new LegoHookHost()
  const config = createHermesAgentConfig({
    ...(options.globalConfig ? { global: options.globalConfig } : {}),
    ...(options.projectConfig ? { project: options.projectConfig } : {}),
    ...(options.cliConfig ? { cli: options.cliConfig } : {}),
    env: process.env,
  })
  const prompt = new LegoPromptService()
  prompt.discoverConventionalResources(cwd, "hermes-agent")
  const ui = new NoopUI()
  prompt.attachHooks(hooks)
  registerDefaultTools(hooks, "hermes-agent")
  registerCommonServices({ hooks, cwd, session, config, prompt, ui, recipe: hermesAgentRecipe })
  hooks.services.set("storageDir", storageDir)
  hooks.services.set("hermes.sqlite.path", `${storageDir}/hermes-sessions.sqlite`)
  const harness = createHarness({
    product: "hermes-agent",
    recipe: hermesAgentRecipe,
    reference: hermesReference,
    session,
    hooks,
    config,
    prompt,
    ui,
  })
  registerHermesProductSurfaces(harness as HermesSurfaceHarness)
  return harness
}

export type HarnessProduct = "opencode" | "pi-mono" | "opencode-pi-hybrid" | "nanobot" | "hermes-agent"
export type HarnessRuntimeProduct = Exclude<HarnessProduct, "opencode-pi-hybrid">

export interface HarnessComboBlend {
  session: HarnessRuntimeProduct
  hooks: HarnessRuntimeProduct
  config: HarnessRuntimeProduct
  prompt: HarnessRuntimeProduct
  tools: HarnessRuntimeProduct
  turn: HarnessRuntimeProduct
  acceptance: HarnessRuntimeProduct
  providerPlugins: "opencode" | "none"
  surfaces: HarnessRuntimeProduct[]
}

export function assembleRecipeHarness(recipe: LegoRecipe, options: AssembleHarnessOptions = {}): AssembledHarness {
  const product = runtimeProductForRecipe(recipe)
  if (product === "opencode-pi-hybrid") return assembleOpenCodePiHybridHarnessFromRecipe(recipe, options)
  const cwd = options.cwd ?? process.cwd()
  const storageDir = options.storageDir ?? mkdtempSync(join(tmpdir(), `helix-${product}-recipe-`))
  const session =
    product === "pi-mono"
      ? createPiSessionPersonality({ storageDir, ...(options.cwd ? { cwd: options.cwd } : {}) })
      : product === "nanobot"
        ? createNanobotSessionPersonality({ storageDir, ...(options.cwd ? { cwd: options.cwd } : {}) })
        : product === "hermes-agent"
          ? createHermesSessionPersonality({ storageDir, ...(options.cwd ? { cwd: options.cwd } : {}) })
          : createOpenCodeSessionPersonality({ storageDir, ...(options.cwd ? { cwd: options.cwd } : {}) })
  const hooks = product === "opencode" ? createOpenCodeHookHost() : new LegoHookHost()
  const config =
    product === "pi-mono"
      ? createPiConfig({
          ...(options.globalConfig ? { global: options.globalConfig } : {}),
          ...(options.projectConfig ? { project: options.projectConfig } : {}),
          ...(options.cliConfig ? { cli: options.cliConfig } : {}),
          env: process.env,
        })
      : product === "nanobot"
        ? createNanobotConfig({
            ...(options.globalConfig ? { global: options.globalConfig } : {}),
            ...(options.projectConfig ? { project: options.projectConfig } : {}),
            ...(options.cliConfig ? { cli: options.cliConfig } : {}),
            env: process.env,
          })
        : product === "hermes-agent"
          ? createHermesAgentConfig({
              ...(options.globalConfig ? { global: options.globalConfig } : {}),
              ...(options.projectConfig ? { project: options.projectConfig } : {}),
              ...(options.cliConfig ? { cli: options.cliConfig } : {}),
              env: process.env,
            })
          : createOpenCodeConfig({
              ...(options.globalConfig ? { global: options.globalConfig } : {}),
              ...(options.projectConfig ? { project: options.projectConfig } : {}),
              ...(options.cliConfig ? { cli: options.cliConfig } : {}),
              env: process.env,
            })
  const prompt = new LegoPromptService()
  prompt.discoverConventionalResources(cwd, product)
  const ui = new NoopUI()
  prompt.attachHooks(hooks)
  registerDefaultTools(hooks, product)
  if (product === "opencode") registerOpenCodeBuiltinProviderPlugins(hooks, { env: process.env })
  registerCommonServices({ hooks, cwd, session, config, prompt, ui, recipe })
  hooks.services.set("storageDir", storageDir)
  if (product === "opencode" && "sqlitePath" in session) hooks.services.set("opencode.sqlite.path", session.sqlitePath)
  const harness = createHarness({
    product,
    recipe,
    reference: product === "pi-mono" ? piReference : product === "nanobot" ? nanobotReference : product === "hermes-agent" ? hermesReference : openCodeReference,
    session,
    hooks,
    config,
    prompt,
    ui,
  })
  if (product === "pi-mono") registerPiProductSurfaces(harness as PiSurfaceHarness)
  else if (product === "nanobot") registerNanobotProductSurfaces(harness as NanobotSurfaceHarness)
  else if (product === "hermes-agent") registerHermesProductSurfaces(harness as HermesSurfaceHarness)
  else registerOpenCodeProductSurfaces(harness as OpenCodeSurfaceHarness)
  return harness
}

function createHarness(input: {
  product: HarnessProduct
  recipe: LegoRecipe
  reference: Record<string, unknown>
  session: SessionService
  hooks: LegoHookHost
  config: LegoConfigService
  prompt: LegoPromptService
  ui: LegoUI
}): AssembledHarness {
  const compiled = compileRecipe(input.recipe)
  return {
    ...input,
    graph: compiled.graph.map((module) => {
      const compiledModule = compiled.modules.find((candidate) => candidate.id === module.id)
      return { id: module.id, ...(compiledModule?.variant ? { variant: compiledModule.variant } : {}) }
    }),
    runTurn: (turn) => runHarnessTurn({ ...input, turn }),
    runFixtureTurn: (turn) => runFixtureTurn({ ...input, turn }),
  }
}

function runtimeProductForRecipe(recipe: LegoRecipe): HarnessProduct {
  if (harnessComboBlendForRecipe(recipe)) return "opencode-pi-hybrid"
  const metadataProduct = typeof recipe.metadata?.["product"] === "string" ? recipe.metadata["product"] : undefined
  if (
    metadataProduct === "opencode" ||
    metadataProduct === "pi-mono" ||
    metadataProduct === "opencode-pi-hybrid" ||
    metadataProduct === "nanobot" ||
    metadataProduct === "hermes-agent"
  ) return metadataProduct
  const productShellBinding = recipe.bindings?.find((binding) => binding.port === "product.shell" || binding.capability === "product.shell")?.module
  const shellIDs = [productShellBinding, ...(recipe.productShells ?? []).map((shell) => shell.id)].filter((id): id is string => Boolean(id))
  if (shellIDs.some((id) => id.startsWith("pi."))) return "pi-mono"
  if (shellIDs.some((id) => id.startsWith("nanobot."))) return "nanobot"
  if (shellIDs.some((id) => id.startsWith("hermes."))) return "hermes-agent"
  if (shellIDs.some((id) => id.startsWith("opencode."))) return "opencode"
  const personalities = recipe.personalities ?? []
  if (personalities.includes("pi-mono")) return "pi-mono"
  if (personalities.includes("nanobot")) return "nanobot"
  if (personalities.includes("hermes-agent")) return "hermes-agent"
  return "opencode"
}

async function runFixtureTurn(input: {
  product: HarnessProduct
  recipe: LegoRecipe
  session: SessionService
  hooks: LegoHookHost
  prompt: LegoPromptService
  turn: FixtureTurnInput
}): Promise<FixtureTurnResult> {
  const provider = createInternalFixtureProviderFromTurn({
    assistantText: input.turn.assistantText ?? "ok",
    ...(input.turn.toolCalls ? { toolCalls: input.turn.toolCalls } : {}),
    ...(input.turn.steps ? { steps: input.turn.steps } : {}),
  })
  return runHarnessTurn({
    ...input,
    traceSource: "runFixtureTurn",
    turn: {
      ...(input.turn.sessionID ? { sessionID: input.turn.sessionID } : {}),
      text: input.turn.text,
      provider,
      ...(input.turn.maxSteps ? { maxSteps: input.turn.maxSteps } : {}),
      ...(input.turn.maxRetries === undefined ? {} : { maxRetries: input.turn.maxRetries }),
      ...(input.turn.retryDelayMs === undefined ? {} : { retryDelayMs: input.turn.retryDelayMs }),
      ...(input.turn.syntheticContinue === undefined ? {} : { syntheticContinue: input.turn.syntheticContinue }),
      ...(input.turn.syntheticContinueText === undefined ? {} : { syntheticContinueText: input.turn.syntheticContinueText }),
      ...(input.turn.maxSyntheticContinues === undefined ? {} : { maxSyntheticContinues: input.turn.maxSyntheticContinues }),
    },
  })
}

async function runHarnessTurn(input: {
  product: HarnessProduct
  recipe: LegoRecipe
  session: SessionService
  hooks: LegoHookHost
  prompt: LegoPromptService
  turn: HarnessTurnInput
  traceSource?: HarnessRuntimeTrace["source"]
}): Promise<HarnessTurnResult> {
  const traceCollector = createHarnessRuntimeTraceCollector({ product: input.product, source: input.traceSource ?? input.turn.traceSource ?? "runTurn" })
  const detachTraceCollector = traceCollector.attach(input.hooks)
  const turnProduct = runtimeTurnProduct(input.product, input.recipe)
  const turnAtoms = createProductTurnAtoms(turnProduct)
  const turnProfile = turnAtoms.profile()
  const cadencePolicies = createCadencePolicyBundle(turnProduct)
  try {
    if (!input.hooks.services.has(requestBoundaryPolicyToken)) input.hooks.services.set(requestBoundaryPolicyToken, cadencePolicies.requestBoundary)
    if (!input.hooks.services.has(toolBatchSchedulerToken)) input.hooks.services.set(toolBatchSchedulerToken, cadencePolicies.toolBatchScheduler)
    if (!input.hooks.services.has(finalSummaryPolicyToken)) input.hooks.services.set(finalSummaryPolicyToken, cadencePolicies.finalSummary)
    const normalized = turnAtoms.normalizeInput({
      text: input.turn.text,
      ...runtimeContextInputFromServices(input.hooks.services),
    })
    const providerModels = input.turn.model ? [] : await input.turn.provider.models()
    const model = input.turn.model ?? providerModels[0]
    if (!model) throw new Error(`Provider ${input.turn.provider.id} did not expose a model`)
    const transcript = input.turn.sessionID ? await input.session.transcript(input.turn.sessionID) : undefined
    const builtPrompt = await input.prompt.build({
      product: runtimePromptProduct(input.product, input.recipe),
      mode: "build",
      cwd: String(input.hooks.services.get("cwd") ?? process.cwd()),
      model,
      ...(transcript ? { transcript } : {}),
    })
    await input.hooks.emit({
      type: "turn.pipeline.trace",
      ...(input.turn.sessionID ? { sessionID: input.turn.sessionID } : {}),
      timestamp: Date.now(),
      payload: {
        ...builtPrompt.artifact,
        phase: "prompt.assemble",
        step: "prompt.build",
        decision: "built",
      },
      metadata: {
        captureMode: "prompt-service",
      },
    })
    const result = await runAgentTurn({
      session: input.session,
      hooks: input.hooks,
      cwd: String(input.hooks.services.get("cwd") ?? process.cwd()),
      turn: {
        ...(input.turn.sessionID ? { sessionID: input.turn.sessionID } : {}),
        text: normalized.text,
        systemPrompt: builtPrompt.systemPrompt,
        provider: input.turn.provider,
        assistantPartProtocol: turnProfile.assistantPartProtocol,
        cadenceProduct: turnProduct,
        model,
        maxSteps: input.turn.maxSteps ?? turnProfile.maxSteps,
        ...(input.turn.maxInputTokens === undefined && turnProfile.maxInputTokens === undefined
          ? {}
          : { maxInputTokens: input.turn.maxInputTokens ?? turnProfile.maxInputTokens }),
        ...(input.turn.compactionKeepMessages === undefined && turnProfile.compactionKeepMessages === undefined
          ? {}
          : { compactionKeepMessages: input.turn.compactionKeepMessages ?? turnProfile.compactionKeepMessages }),
        ...(input.turn.autoCompact === undefined ? {} : { autoCompact: input.turn.autoCompact }),
        ...(input.turn.maxRetries === undefined ? {} : { maxRetries: input.turn.maxRetries }),
        ...(input.turn.retryDelayMs === undefined ? {} : { retryDelayMs: input.turn.retryDelayMs }),
        maxToolResultTextChars: input.turn.maxToolResultTextChars ?? turnProfile.maxToolResultTextChars,
        syntheticContinue: input.turn.syntheticContinue ?? turnProfile.syntheticContinue,
        ...(input.turn.syntheticContinueText === undefined ? {} : { syntheticContinueText: input.turn.syntheticContinueText }),
        maxSyntheticContinues: input.turn.maxSyntheticContinues ?? turnProfile.maxSyntheticContinues,
      },
    })
    return { ...result, runtimeTrace: traceCollector.finish(input.hooks) }
  } finally {
    detachTraceCollector()
  }
}

function runtimeContextInputFromServices(services: Map<string, unknown>): {
  channel?: string
  chatID?: string
  senderID?: string
  timezone?: string
  supplementalLines?: string[]
} {
  const channel = stringService(services, "channel") ?? stringService(services, "nanobot.channel")
  const chatID = stringService(services, "chatID") ?? stringService(services, "nanobot.chatID")
  const senderID = stringService(services, "senderID") ?? stringService(services, "nanobot.senderID")
  const timezone = stringService(services, "timezone") ?? stringService(services, "nanobot.timezone")
  const supplemental = services.get("nanobot.runtimeLines")
  return {
    ...(channel ? { channel } : {}),
    ...(chatID ? { chatID } : {}),
    ...(senderID ? { senderID } : {}),
    ...(timezone ? { timezone } : {}),
    ...(Array.isArray(supplemental) ? { supplementalLines: supplemental.filter((line): line is string => typeof line === "string") } : {}),
  }
}

function stringService(services: Map<string, unknown>, key: string): string | undefined {
  const value = services.get(key)
  return typeof value === "string" ? value : undefined
}

function registerDefaultTools(hooks: LegoHookHost, product: HarnessProduct): void {
  const tools = product === "opencode" || product === "opencode-pi-hybrid" ? createOpenCodeDefaultTools() : product === "pi-mono" ? createPiDefaultTools() : createDefaultTools()
  for (const tool of tools) hooks.registerTool(tool)
}

function registerRuntimeDefaultTools(hooks: LegoHookHost, product: HarnessRuntimeProduct): void {
  const tools = product === "opencode" ? createOpenCodeDefaultTools() : product === "pi-mono" ? createPiDefaultTools() : createDefaultTools()
  for (const tool of tools) hooks.registerTool(tool)
}

function runtimeTurnProduct(product: HarnessProduct, recipe?: LegoRecipe): HarnessRuntimeProduct {
  if (product === "opencode-pi-hybrid") return (harnessComboBlendForRecipe(recipe) ?? defaultOpenCodePiHybridBlend()).turn
  return product
}

function runtimePromptProduct(product: HarnessProduct, recipe?: LegoRecipe): HarnessRuntimeProduct {
  if (product === "opencode-pi-hybrid") return (harnessComboBlendForRecipe(recipe) ?? defaultOpenCodePiHybridBlend()).prompt
  return product
}

export function harnessComboAcceptanceProduct(product: HarnessProduct, recipe?: LegoRecipe): HarnessRuntimeProduct {
  if (product === "opencode-pi-hybrid") return (harnessComboBlendForRecipe(recipe) ?? defaultOpenCodePiHybridBlend()).acceptance
  return product
}

export function harnessComboBlendForRecipe(recipe?: LegoRecipe): HarnessComboBlend | undefined {
  const raw = recordField(recipe?.metadata, "harnessCombo")
  if (!raw) return undefined
  const defaults = defaultOpenCodePiHybridBlend()
  const surfaces = runtimeProductArrayField(raw, "surfaces") ?? defaults.surfaces
  return {
    session: runtimeProductField(raw, "session") ?? defaults.session,
    hooks: runtimeProductField(raw, "hooks") ?? defaults.hooks,
    config: runtimeProductField(raw, "config") ?? defaults.config,
    prompt: runtimeProductField(raw, "prompt") ?? defaults.prompt,
    tools: runtimeProductField(raw, "tools") ?? defaults.tools,
    turn: runtimeProductField(raw, "turn") ?? defaults.turn,
    acceptance: runtimeProductField(raw, "acceptance") ?? runtimeProductField(raw, "turn") ?? defaults.acceptance,
    providerPlugins: raw["providerPlugins"] === "none" ? "none" : raw["providerPlugins"] === "opencode" ? "opencode" : defaults.providerPlugins,
    surfaces,
  }
}

function defaultOpenCodePiHybridBlend(): HarnessComboBlend {
  return {
    session: "opencode",
    hooks: "opencode",
    config: "pi-mono",
    prompt: "pi-mono",
    tools: "opencode",
    turn: "pi-mono",
    acceptance: "pi-mono",
    providerPlugins: "opencode",
    surfaces: ["opencode", "pi-mono"],
  }
}

function createSessionPersonality(product: HarnessRuntimeProduct, storageDir: string, cwd?: string): SessionService {
  if (product === "pi-mono") return createPiSessionPersonality({ storageDir, ...(cwd ? { cwd } : {}) })
  if (product === "nanobot") return createNanobotSessionPersonality({ storageDir, ...(cwd ? { cwd } : {}) })
  if (product === "hermes-agent") return createHermesSessionPersonality({ storageDir, ...(cwd ? { cwd } : {}) })
  return createOpenCodeSessionPersonality({ storageDir, ...(cwd ? { cwd } : {}) })
}

function createHookHost(product: HarnessRuntimeProduct): LegoHookHost {
  return product === "opencode" ? createOpenCodeHookHost() : new LegoHookHost()
}

function createConfigService(product: HarnessRuntimeProduct, options: AssembleHarnessOptions): LegoConfigService {
  const input = {
    ...(options.globalConfig ? { global: options.globalConfig } : {}),
    ...(options.projectConfig ? { project: options.projectConfig } : {}),
    ...(options.cliConfig ? { cli: options.cliConfig } : {}),
    env: process.env,
  }
  if (product === "pi-mono") return createPiConfig(input)
  if (product === "nanobot") return createNanobotConfig(input)
  if (product === "hermes-agent") return createHermesAgentConfig(input)
  return createOpenCodeConfig(input)
}

function registerBlendProductSurfaces(harness: AssembledHarness, surfaces: HarnessRuntimeProduct[]): void {
  for (const product of uniqueRuntimeProducts(surfaces)) {
    if (product === "opencode") registerOpenCodeProductSurfaces(harness as OpenCodeSurfaceHarness)
    else if (product === "pi-mono") registerPiProductSurfaces(harness as PiSurfaceHarness)
    else if (product === "nanobot") registerNanobotProductSurfaces(harness as NanobotSurfaceHarness)
    else registerHermesProductSurfaces(harness as HermesSurfaceHarness)
  }
}

function legacyHybridRuntimeMarker(blend: HarnessComboBlend): Record<string, string[]> {
  const marker: Record<string, string[]> = {
    opencode: [],
    "pi-mono": [],
    nanobot: [],
    "hermes-agent": [],
  }
  marker[blend.session]?.push("session")
  marker[blend.hooks]?.push("hooks")
  marker[blend.config]?.push("config")
  marker[blend.prompt]?.push("prompt")
  marker[blend.tools]?.push("tool-registry")
  marker[blend.turn]?.push("turn-profile", "cadence")
  marker[blend.acceptance]?.push("acceptance")
  if (blend.providerPlugins === "opencode") marker.opencode?.push("provider-plugins")
  return Object.fromEntries(Object.entries(marker).filter(([, values]) => values.length > 0))
}

function runtimeProductField(input: Record<string, unknown>, key: string): HarnessRuntimeProduct | undefined {
  const value = input[key]
  return isRuntimeProduct(value) ? value : undefined
}

function runtimeProductArrayField(input: Record<string, unknown>, key: string): HarnessRuntimeProduct[] | undefined {
  const value = input[key]
  if (value === "all") return ["opencode", "pi-mono", "nanobot", "hermes-agent"]
  if (!Array.isArray(value)) return undefined
  const products = value.filter(isRuntimeProduct)
  return products.length > 0 ? uniqueRuntimeProducts(products) : undefined
}

function recordField(input: unknown, key: string): Record<string, unknown> | undefined {
  if (!input || typeof input !== "object") return undefined
  const value = (input as Record<string, unknown>)[key]
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
}

function isRuntimeProduct(value: unknown): value is HarnessRuntimeProduct {
  return value === "opencode" || value === "pi-mono" || value === "nanobot" || value === "hermes-agent"
}

function uniqueRuntimeProducts(products: HarnessRuntimeProduct[]): HarnessRuntimeProduct[] {
  return [...new Set(products)]
}

function registerCommonServices(input: {
  hooks: LegoHookHost
  cwd: string
  session: SessionService
  config: LegoConfigService
  prompt: LegoPromptService
  ui: LegoUI
  recipe: LegoRecipe
}): void {
  input.hooks.services.set("cwd", input.cwd)
  input.hooks.services.set("session", input.session)
  input.hooks.services.set("hooks", input.hooks)
  input.hooks.services.set("config", input.config)
  input.hooks.services.set("prompt", input.prompt)
  input.hooks.services.set("ui", input.ui)
  input.hooks.services.set(filesystemPortToken, createLocalFilesystemPort())
  input.hooks.services.set(processRunnerPortToken, processRunnerForRecipe(input.recipe))
  input.hooks.services.set(toolPermissionPolicyToken, permissionPolicyForRecipe(input.recipe))
}

function processRunnerForRecipe(recipe: LegoRecipe) {
  const shellPolicy = recipe.policies?.find((policy) => policy.id === "shell.execution")
  return shellPolicy?.config?.["mode"] === "disabled" ? createDisabledProcessRunnerPort("recipe disabled shell execution") : createLocalProcessRunnerPort()
}

function permissionPolicyForRecipe(recipe: LegoRecipe): ToolPermissionPolicy {
  const permissionProvider = recipe.bindings?.find((binding) => binding.port === "tool.permission-policy" || binding.port === "tool.permission")?.module
  if (permissionProvider === "tool-permission-always-deny" || permissionProvider === "tool.permission.always-deny") {
    return createAlwaysDenyPermissionPolicy("recipe policy denied")
  }
  if (permissionProvider === "tool-permission-always-allow" || permissionProvider === "tool.permission.always-allow") return createAlwaysAllowPermissionPolicy()

  const strategy = recipe.strategies?.find((candidate) => candidate.id === "tool.permission")
  if (strategy?.config?.["mode"] === "allow-echo-only") {
    return {
      decide(input) {
        return input.toolName === "echo"
          ? { status: "allow", action: input.action, subject: input.subject }
          : { status: "deny", action: input.action, subject: input.subject, reason: "tool not allowed by recipe" }
      },
    }
  }
  if (strategy?.config?.["mode"] === "workspace-scoped") return createWorkspaceScopedPermissionPolicy()
  if (strategy?.config?.["mode"] === "always-allow") return createAlwaysAllowPermissionPolicy()
  if (strategy?.config?.["mode"] === "always-deny") return createAlwaysDenyPermissionPolicy("recipe policy denied")
  return createProductPersonalityPermissionPolicy(createAskHookPermissionPolicy())
}
