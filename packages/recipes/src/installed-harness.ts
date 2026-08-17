import { randomUUID } from "node:crypto"
import { spawn } from "node:child_process"
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join, resolve } from "node:path"
import type { LegoRecipe, SessionID } from "@helix/contracts"
import { assembleRecipeHarness, type HarnessProduct, type HarnessTurnResult } from "./harness"
import { createLiveProvider, type LiveProviderKind } from "./live-provider-parity"

export type InstalledProviderKind = LiveProviderKind
export type TelegramGatewayMode = "polling" | "webhook"
export type GatewayWorkerState = "stopped" | "starting" | "running" | "failed"
export type GatewayHealthState = "unknown" | "healthy" | "stale" | "exited"

export interface InstalledHarnessProfile {
  schemaVersion: 1
  name: string
  createdAt: string
  updatedAt: string
  recipeID: string
  product: HarnessProduct
  status: "installed" | "configured" | "running" | "stopped" | "invalid"
  storageDir: string
  workspaceDir: string
}

export interface InstalledHarnessProviderConfig {
  schemaVersion: 1
  kind: InstalledProviderKind
  configuredAt: string
  modelID?: string
  baseURL?: string
  appURL?: string
  appName?: string
  apiKeyEnv?: string
}

export interface InstalledHarnessTelegramConfig {
  schemaVersion: 1
  platform: "telegram"
  mode: TelegramGatewayMode
  configuredAt: string
  botTokenEnv?: string
  allowedChatIDs: string[]
  allowedUserIDs: string[]
  webhookURL?: string
  webhookSecretEnv?: string
}

export interface InstalledHarnessChannelsConfig {
  schemaVersion: 1
  telegram?: InstalledHarnessTelegramConfig
}

export interface InstalledHarnessGatewayStatus {
  schemaVersion: 1
  state: GatewayWorkerState
  channel?: "telegram"
  pid?: number
  startedAt?: string
  stoppedAt?: string
  lastHealth?: string
  health?: GatewayHealthState
  exitCode?: number | undefined
  exitSignal?: string | undefined
  lastError?: string | undefined
  logPath: string
  restartReason?: string
  lastRestartedAt?: string
}

export interface InstalledHarnessProfileRecord {
  profile: InstalledHarnessProfile
  recipe: LegoRecipe
  provider?: InstalledHarnessProviderConfig
  channels: InstalledHarnessChannelsConfig
  gateway: InstalledHarnessGatewayStatus
  dir: string
}

export interface InstalledHarnessValidation {
  ok: boolean
  missing: string[]
  issues: string[]
  secrets: {
    providerAPIKeyEnv?: string
    telegramBotTokenEnv?: string
    webhookSecretEnv?: string
    hasProviderAPIKey: boolean
    hasTelegramBotToken: boolean
    hasWebhookSecret: boolean
  }
}

export interface InstalledHarnessStatus {
  profile: InstalledHarnessProfile
  provider?: Omit<InstalledHarnessProviderConfig, "apiKeyEnv"> & { apiKeyEnv?: string; hasAPIKey: boolean }
  telegram?: Omit<InstalledHarnessTelegramConfig, "botTokenEnv" | "webhookSecretEnv"> & {
    botTokenEnv?: string
    webhookSecretEnv?: string
    hasBotToken: boolean
    hasWebhookSecret: boolean
  }
  gateway: InstalledHarnessGatewayStatus
  validation: InstalledHarnessValidation
}

export interface InstallHarnessProfileInput {
  name: string
  recipe: LegoRecipe
  workspaceDir?: string
  storageDir?: string
  now?: Date
}

export interface ConfigureProfileProviderInput {
  name: string
  kind: InstalledProviderKind
  modelID?: string
  baseURL?: string
  appURL?: string
  appName?: string
  apiKeyEnv?: string
  now?: Date
}

export interface ConfigureTelegramChannelInput {
  name: string
  mode?: TelegramGatewayMode
  botTokenEnv?: string
  allowedChatIDs?: string[]
  allowedUserIDs?: string[]
  webhookURL?: string
  webhookSecretEnv?: string
  now?: Date
}

export interface HarnessProfileStoreOptions {
  rootDir?: string
  cwd?: string
  env?: Record<string, string | undefined>
}

export class HarnessProfileStore {
  readonly rootDir: string
  private readonly cwd: string
  private readonly env: Record<string, string | undefined>

  constructor(options: HarnessProfileStoreOptions = {}) {
    this.cwd = options.cwd ?? process.cwd()
    this.rootDir = resolve(options.rootDir ?? defaultHarnessProfileRoot())
    this.env = options.env ?? process.env
  }

  install(input: InstallHarnessProfileInput): InstalledHarnessProfileRecord {
    const name = normalizeProfileName(input.name)
    const dir = this.profileDir(name)
    const now = (input.now ?? new Date()).toISOString()
    const existing = this.readProfileFile(name)
    const workspaceDir = resolve(input.workspaceDir ?? existing?.workspaceDir ?? this.cwd)
    const storageDir = resolve(input.storageDir ?? existing?.storageDir ?? join(dir, "storage"))
    mkdirSync(dir, { recursive: true })
    mkdirSync(storageDir, { recursive: true })
    const profile: InstalledHarnessProfile = {
      schemaVersion: 1,
      name,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      recipeID: input.recipe.id,
      product: inferHarnessProduct(input.recipe),
      status: "installed",
      storageDir,
      workspaceDir,
    }
    writeJSON(join(dir, "profile.json"), profile)
    writeJSON(join(dir, "recipe.json"), input.recipe)
    if (!existsSync(join(dir, "channels.json"))) writeJSON(join(dir, "channels.json"), { schemaVersion: 1 } satisfies InstalledHarnessChannelsConfig)
    if (!existsSync(join(dir, "gateway.json"))) writeJSON(join(dir, "gateway.json"), createDefaultGatewayStatus(dir))
    return this.getRequired(name)
  }

  list(): InstalledHarnessStatus[] {
    if (!existsSync(this.rootDir)) return []
    const names = safeReadDirNames(this.rootDir)
    return names.flatMap((name) => {
      if (name.includes(".removed-")) return []
      const record = this.get(name)
      return record ? [this.statusFor(record)] : []
    }).sort((left, right) => right.profile.updatedAt.localeCompare(left.profile.updatedAt))
  }

  get(name: string): InstalledHarnessProfileRecord | undefined {
    const normalized = normalizeProfileName(name)
    const dir = this.profileDir(normalized)
    if (!existsSync(join(dir, "profile.json")) || !existsSync(join(dir, "recipe.json"))) return undefined
    const profile = readJSON<InstalledHarnessProfile>(join(dir, "profile.json"))
    const recipe = readJSON<LegoRecipe>(join(dir, "recipe.json"))
    const provider = existsSync(join(dir, "provider.json")) ? readJSON<InstalledHarnessProviderConfig>(join(dir, "provider.json")) : undefined
    const channels = existsSync(join(dir, "channels.json")) ? readJSON<InstalledHarnessChannelsConfig>(join(dir, "channels.json")) : ({ schemaVersion: 1 } satisfies InstalledHarnessChannelsConfig)
    const gateway = existsSync(join(dir, "gateway.json")) ? readJSON<InstalledHarnessGatewayStatus>(join(dir, "gateway.json")) : createDefaultGatewayStatus(dir)
    return { profile, recipe, ...(provider ? { provider } : {}), channels, gateway, dir }
  }

  getRequired(name: string): InstalledHarnessProfileRecord {
    const record = this.get(name)
    if (!record) throw new Error(`Harness profile ${name} is not installed.`)
    return record
  }

  status(name: string): InstalledHarnessStatus {
    return this.statusFor(this.getRequired(name))
  }

  configureProvider(input: ConfigureProfileProviderInput): InstalledHarnessStatus {
    const record = this.getRequired(input.name)
    const provider = normalizeProviderConfig(input)
    writeJSON(join(record.dir, "provider.json"), provider)
    this.updateProfile(record.profile.name, { status: "configured" })
    return this.status(record.profile.name)
  }

  addTelegramChannel(input: ConfigureTelegramChannelInput): InstalledHarnessStatus {
    const record = this.getRequired(input.name)
    if ((input.mode as string | undefined) === "fake") {
      throw new Error("Telegram gateway mode fake is no longer supported. Configure polling or webhook with a real bot token.")
    }
    const channels: InstalledHarnessChannelsConfig = {
      ...record.channels,
      schemaVersion: 1,
      telegram: {
        schemaVersion: 1,
        platform: "telegram",
        mode: input.mode ?? "polling",
        configuredAt: (input.now ?? new Date()).toISOString(),
        allowedChatIDs: uniqueStrings(input.allowedChatIDs ?? []),
        allowedUserIDs: uniqueStrings(input.allowedUserIDs ?? []),
        ...(input.botTokenEnv ? { botTokenEnv: normalizeEnvRef(input.botTokenEnv, "Telegram bot token env") } : {}),
        ...(input.webhookURL ? { webhookURL: validatePublicURL(input.webhookURL, "Telegram webhook URL") } : {}),
        ...(input.webhookSecretEnv ? { webhookSecretEnv: normalizeEnvRef(input.webhookSecretEnv, "Telegram webhook secret env") } : {}),
      },
    }
    writeJSON(join(record.dir, "channels.json"), channels)
    this.updateProfile(record.profile.name, { status: "configured" })
    return this.status(record.profile.name)
  }

  removeTelegramChannel(name: string): InstalledHarnessStatus {
    const record = this.getRequired(name)
    const channels: InstalledHarnessChannelsConfig = { ...record.channels, schemaVersion: 1 }
    delete channels.telegram
    writeJSON(join(record.dir, "channels.json"), channels)
    return this.status(record.profile.name)
  }

  remove(name: string, input: { purge?: boolean } = {}): void {
    const record = this.getRequired(name)
    const profileDir = record.dir
    if (input.purge) rmSync(profileDir, { recursive: true, force: true })
    else {
      const removedDir = `${profileDir}.removed-${Date.now()}`
      rmSync(removedDir, { recursive: true, force: true })
      renameSync(profileDir, removedDir)
    }
  }

  writeGatewayStatus(name: string, patch: Partial<InstalledHarnessGatewayStatus>): InstalledHarnessGatewayStatus {
    const record = this.getRequired(name)
    const gateway = {
      ...record.gateway,
      ...patch,
      schemaVersion: 1 as const,
      logPath: patch.logPath ?? record.gateway.logPath ?? join(record.dir, "gateway.log"),
    }
    writeJSON(join(record.dir, "gateway.json"), gateway)
    this.updateProfile(name, { status: gateway.state === "running" || gateway.state === "starting" ? "running" : gateway.state === "failed" ? "invalid" : "stopped" })
    return gateway
  }

  appendGatewayLog(name: string, line: string): string {
    const record = this.getRequired(name)
    const logPath = record.gateway.logPath || join(record.dir, "gateway.log")
    mkdirSync(dirname(logPath), { recursive: true })
    appendFileSync(logPath, `${redactSecretText(line, this.env)}\n`, "utf8")
    return logPath
  }

  gatewayLogs(name: string, input: { maxLines?: number } = {}): { path: string; text: string } {
    const record = this.getRequired(name)
    const path = record.gateway.logPath || join(record.dir, "gateway.log")
    const maxLines = Math.max(1, Math.min(input.maxLines ?? 100, 1000))
    const text = existsSync(path) ? readFileSync(path, "utf8").split(/\r?\n/).slice(-maxLines).join("\n") : ""
    return { path, text: redactSecretText(text, this.env) }
  }

  validate(record: InstalledHarnessProfileRecord): InstalledHarnessValidation {
    const missing: string[] = []
    const issues: string[] = []
    if (!record.recipe || typeof record.recipe !== "object") missing.push("recipe")
    if (!record.provider) missing.push("provider")
    if (!record.channels.telegram) missing.push("telegram")
    if (record.provider) {
      if (!record.provider.modelID) missing.push("provider.modelID")
      if (!record.provider.apiKeyEnv) missing.push("provider.apiKeyEnv")
    }
    if (record.channels.telegram?.mode === "polling") {
      if (!record.channels.telegram.botTokenEnv) missing.push("telegram.botTokenEnv")
    }
    const providerKey = record.provider?.apiKeyEnv ? this.env[record.provider.apiKeyEnv] : undefined
    const telegramToken = record.channels.telegram?.botTokenEnv ? this.env[record.channels.telegram.botTokenEnv] : undefined
    const webhookSecret = record.channels.telegram?.webhookSecretEnv ? this.env[record.channels.telegram.webhookSecretEnv] : undefined
    if (record.provider?.apiKeyEnv && !providerKey) issues.push(`Provider API key env ${record.provider.apiKeyEnv} is not set.`)
    if (record.channels.telegram?.mode === "polling" && record.channels.telegram.botTokenEnv && !telegramToken) {
      issues.push(`Telegram bot token env ${record.channels.telegram.botTokenEnv} is not set.`)
    }
    return {
      ok: missing.length === 0 && issues.length === 0,
      missing,
      issues,
      secrets: {
        ...(record.provider?.apiKeyEnv ? { providerAPIKeyEnv: record.provider.apiKeyEnv } : {}),
        ...(record.channels.telegram?.botTokenEnv ? { telegramBotTokenEnv: record.channels.telegram.botTokenEnv } : {}),
        ...(record.channels.telegram?.webhookSecretEnv ? { webhookSecretEnv: record.channels.telegram.webhookSecretEnv } : {}),
        hasProviderAPIKey: Boolean(providerKey),
        hasTelegramBotToken: Boolean(telegramToken),
        hasWebhookSecret: Boolean(webhookSecret),
      },
    }
  }

  private statusFor(record: InstalledHarnessProfileRecord): InstalledHarnessStatus {
    const validation = this.validate(record)
    return {
      profile: record.profile,
      ...(record.provider
        ? {
            provider: {
              ...record.provider,
              ...(record.provider.apiKeyEnv ? { apiKeyEnv: record.provider.apiKeyEnv } : {}),
              hasAPIKey: Boolean(record.provider.apiKeyEnv && this.env[record.provider.apiKeyEnv]),
            },
          }
        : {}),
      ...(record.channels.telegram
        ? {
            telegram: {
              ...record.channels.telegram,
              ...(record.channels.telegram.botTokenEnv ? { botTokenEnv: record.channels.telegram.botTokenEnv } : {}),
              ...(record.channels.telegram.webhookSecretEnv ? { webhookSecretEnv: record.channels.telegram.webhookSecretEnv } : {}),
              hasBotToken: Boolean(record.channels.telegram.botTokenEnv && this.env[record.channels.telegram.botTokenEnv]),
              hasWebhookSecret: Boolean(record.channels.telegram.webhookSecretEnv && this.env[record.channels.telegram.webhookSecretEnv]),
            },
          }
        : {}),
      gateway: record.gateway,
      validation,
    }
  }

  private updateProfile(name: string, patch: Partial<Pick<InstalledHarnessProfile, "status" | "updatedAt">>): InstalledHarnessProfile {
    const record = this.getRequired(name)
    const profile: InstalledHarnessProfile = {
      ...record.profile,
      ...patch,
      updatedAt: patch.updatedAt ?? new Date().toISOString(),
    }
    writeJSON(join(record.dir, "profile.json"), profile)
    return profile
  }

  private readProfileFile(name: string): InstalledHarnessProfile | undefined {
    const path = join(this.profileDir(normalizeProfileName(name)), "profile.json")
    return existsSync(path) ? readJSON<InstalledHarnessProfile>(path) : undefined
  }

  profileDir(name: string): string {
    return join(this.rootDir, normalizeProfileName(name))
  }
}

export interface GatewayEvent {
  platform: "telegram"
  channelID: string
  chatID: string
  senderID: string
  messageID: string
  text: string
  threadID?: string
  timestamp: string
}

export interface GatewayRuntimeContext {
  channel: "telegram"
  channelID: string
  chatID: string
  senderID: string
  messageID: string
  text: string
  threadID?: string
  timestamp: string
  timezone: string
  hermes: {
    gatewayEvent: {
      platform: "telegram"
      chatID: string
      senderID: string
      threadID?: string
      text: string
    }
  }
  nanobot: {
    channel: "telegram"
    conversationID: string
    userID: string
    threadID?: string
    timezone: string
  }
  opencode: {
    slackCompatibleResponse: {
      channelID: string
      userID: string
      responseProjection: "plain-text"
    }
  }
}

export interface GatewayDispatchResult {
  event: GatewayEvent
  text: string
  sessionID: string
  turn: Pick<HarnessTurnResult, "steps" | "finish" | "blockedTools" | "error">
}

export interface GatewayLocalFixtureSmokeResult {
  ok: boolean
  profile: string
  channel: "telegram"
  source: "local-fixture"
  dispatch: GatewayDispatchResult
  sentMessages: Array<{ chatID: string; text: string }>
}

export interface GatewayStartResult {
  ok: boolean
  profile: string
  channel: "telegram"
  pid?: number
  state: GatewayWorkerState
  logPath: string
  restarted?: boolean
  stoppedPID?: number
}

export interface GatewayStopResult {
  ok: boolean
  profile: string
  channel: "telegram"
  pid?: number
  state: GatewayWorkerState
}

export interface GatewayServiceManifests {
  schemaVersion: 1
  profile: string
  channel: "telegram"
  systemdUserService: string
  launchdPlist: string
  pm2EcosystemConfig: string
  dockerCompose: string
}

export interface GatewayWebhookResult {
  ok: boolean
  profile: string
  channel: "telegram"
  accepted: boolean
  ignored?: boolean
  deferred?: boolean
  dispatch?: GatewayDispatchResult
  sentMessages: Array<{ chatID: string; text: string }>
}

export interface GatewayLiveSmokeResult {
  ok: boolean
  profile: string
  channel: "telegram"
  skipped: boolean
  reason?: string
  dispatch?: GatewayDispatchResult
  sentMessages: Array<{ chatID: string; text: string }>
}

export interface GatewayControllerOptions {
  store: HarnessProfileStore
  cwd?: string
  env?: NodeJS.ProcessEnv
  workerCommand?: string[]
}

export class HarnessGatewayController {
  private readonly store: HarnessProfileStore
  private readonly cwd: string
  private readonly env: NodeJS.ProcessEnv
  private readonly workerCommand: string[] | undefined

  constructor(options: GatewayControllerOptions) {
    this.store = options.store
    this.cwd = options.cwd ?? process.cwd()
    this.env = options.env ?? process.env
    this.workerCommand = options.workerCommand
  }

  async localFixtureSmoke(input: { name: string; text?: string; chatID?: string; senderID?: string; threadID?: string }): Promise<GatewayLocalFixtureSmokeResult> {
    const record = this.store.getRequired(input.name)
    const transport = new LocalFixtureTelegramTransport()
    const event: GatewayEvent = {
      platform: "telegram",
      channelID: "telegram",
      chatID: input.chatID ?? "local-chat",
      senderID: input.senderID ?? "local-user",
      messageID: `msg-${randomUUID()}`,
      text: input.text ?? "hello",
      ...(input.threadID ? { threadID: input.threadID } : {}),
      timestamp: new Date().toISOString(),
    }
    const dispatch = await dispatchGatewayEvent({
      record,
      event,
      env: this.env,
      cwd: this.cwd,
    })
    await transport.sendMessage(dispatch.event.chatID, dispatch.text)
    this.store.appendGatewayLog(record.profile.name, `[${new Date().toISOString()}] local-fixture-smoke ${dispatch.event.chatID} ${safeLogText(input.text ?? "hello")} -> ${safeLogText(dispatch.text)}`)
    return {
      ok: !dispatch.turn.error,
      profile: record.profile.name,
      channel: "telegram",
      source: "local-fixture",
      dispatch,
      sentMessages: transport.sentMessages,
    }
  }

  start(input: { name: string; channel?: "telegram"; reason?: string } = { name: "" }): GatewayStartResult {
    const record = this.store.getRequired(input.name)
    const channel = input.channel ?? "telegram"
    const logPath = record.gateway.logPath || join(record.dir, "gateway.log")
    const command = this.workerCommand ?? defaultGatewayWorkerCommand(record.profile.name, channel)
    if (command.length === 0) throw new Error("Gateway worker command is empty.")
    const [file, ...args] = command
    if (!file) throw new Error("Gateway worker command is empty.")
    mkdirSync(dirname(logPath), { recursive: true })
    const startedAt = new Date().toISOString()
    this.store.writeGatewayStatus(record.profile.name, {
      state: "starting",
      channel,
      startedAt,
      lastHealth: startedAt,
      health: "unknown",
      logPath,
      exitCode: undefined,
      exitSignal: undefined,
      lastError: undefined,
      ...(input.reason ? { restartReason: input.reason } : {}),
    })
    const child = spawn(file, args, {
      cwd: this.cwd,
      env: minimalWorkerEnv(this.env, record, this.store.rootDir),
      shell: false,
      detached: true,
      stdio: ["ignore", "ignore", "ignore"],
    })
    const profileName = record.profile.name
    child.once("error", (error) => {
      const now = new Date().toISOString()
      const message = redactSecretText(error.message, this.env)
      try {
        this.store.writeGatewayStatus(profileName, {
          state: "failed",
          channel,
          ...(child.pid ? { pid: child.pid } : {}),
          stoppedAt: now,
          lastHealth: now,
          health: "exited",
          lastError: message,
        })
        this.store.appendGatewayLog(profileName, `[${now}] worker spawn error pid=${child.pid ?? "unknown"} ${safeLogText(message)}`)
      } catch {
        // The profile may have been removed while the child process was starting.
      }
    })
    child.once("exit", (code, signal) => {
      const now = new Date().toISOString()
      try {
        const latest = this.store.get(profileName)
        if (latest?.gateway.pid && child.pid && latest.gateway.pid !== child.pid) {
          this.store.appendGatewayLog(profileName, `[${now}] worker exited pid=${child.pid} after a newer worker started`)
          return
        }
        const alreadyStopped = latest?.gateway.state === "stopped"
        const state: GatewayWorkerState = alreadyStopped || code === 0 ? "stopped" : "failed"
        const lastError = state === "failed" ? `Gateway worker exited with code ${code ?? "null"}${signal ? ` signal ${signal}` : ""}.` : latest?.gateway.lastError
        this.store.writeGatewayStatus(profileName, {
          state,
          channel,
          ...(child.pid ? { pid: child.pid } : {}),
          stoppedAt: now,
          lastHealth: now,
          health: "exited",
          ...(typeof code === "number" ? { exitCode: code } : {}),
          ...(signal ? { exitSignal: signal } : {}),
          ...(lastError ? { lastError: redactSecretText(lastError, this.env) } : {}),
        })
        this.store.appendGatewayLog(profileName, `[${now}] worker exited pid=${child.pid ?? "unknown"} code=${code ?? "null"} signal=${signal ?? "none"}`)
      } catch {
        // The profile may have been removed while the worker was running.
      }
    })
    child.unref()
    const healthyAt = new Date().toISOString()
    const gateway = this.store.writeGatewayStatus(record.profile.name, {
      state: "running",
      channel,
      ...(child.pid ? { pid: child.pid } : {}),
      startedAt,
      lastHealth: healthyAt,
      health: "healthy",
      logPath,
      ...(input.reason ? { restartReason: input.reason } : {}),
      ...(input.reason ? { lastRestartedAt: healthyAt } : {}),
    })
    this.store.appendGatewayLog(record.profile.name, `[${new Date().toISOString()}] started worker pid=${child.pid ?? "unknown"} command=${command.map(safeLogText).join(" ")}`)
    return {
      ok: true,
      profile: record.profile.name,
      channel,
      ...(child.pid ? { pid: child.pid } : {}),
      state: gateway.state,
      logPath,
    }
  }

  restart(input: { name: string; channel?: "telegram"; reason?: string }): GatewayStartResult {
    const stopped = this.stop({ name: input.name, channel: input.channel ?? "telegram" })
    const started = this.start({ name: input.name, channel: input.channel ?? "telegram", reason: input.reason ?? "manual-restart" })
    return {
      ...started,
      restarted: true,
      ...(stopped.pid ? { stoppedPID: stopped.pid } : {}),
    }
  }

  stop(input: { name: string; channel?: "telegram" }): GatewayStopResult {
    const record = this.store.getRequired(input.name)
    const pid = record.gateway.pid
    if (pid && isProcessAlive(pid)) {
      try {
        process.kill(pid, "TERM")
      } catch {
        // status update below records the stopped state even when the process is already gone.
      }
    }
    this.store.appendGatewayLog(record.profile.name, `[${new Date().toISOString()}] stopped worker pid=${pid ?? "unknown"}`)
    this.store.writeGatewayStatus(record.profile.name, {
      state: "stopped",
      channel: input.channel ?? "telegram",
      ...(pid ? { pid } : {}),
      stoppedAt: new Date().toISOString(),
      lastHealth: new Date().toISOString(),
      health: "exited",
    })
    return { ok: true, profile: record.profile.name, channel: input.channel ?? "telegram", ...(pid ? { pid } : {}), state: "stopped" }
  }

  serviceManifests(input: { name: string; channel?: "telegram" }): GatewayServiceManifests {
    const record = this.store.getRequired(input.name)
    return createGatewayServiceManifests({
      profileName: record.profile.name,
      channel: input.channel ?? "telegram",
      profileRoot: this.store.rootDir,
      cwd: this.cwd,
    })
  }

  async liveTelegramSmoke(input: { name: string; text?: string; chatID?: string; senderID?: string }): Promise<GatewayLiveSmokeResult> {
    const record = this.store.getRequired(input.name)
    const telegram = record.channels.telegram
    const validation = this.store.validate(record)
    const reasons: string[] = []
    if (!telegram) reasons.push("Telegram channel is not configured")
    if (!telegram?.botTokenEnv || !this.env[telegram.botTokenEnv]) reasons.push(`Telegram bot token env ${telegram?.botTokenEnv ?? "TELEGRAM_BOT_TOKEN"} is not set`)
    if (!record.provider) reasons.push("Live provider is not configured")
    if (record.provider?.apiKeyEnv && !this.env[record.provider.apiKeyEnv]) reasons.push(`Provider API key env ${record.provider.apiKeyEnv} is not set`)
    const chatID = input.chatID ?? telegram?.allowedChatIDs[0]
    if (!chatID) reasons.push("A Telegram chat ID is required for live smoke")
    if (!validation.ok) reasons.push(...validation.missing.map((item) => `Missing ${item}`))
    if (reasons.length > 0 || !telegram || !chatID || !telegram.botTokenEnv) {
      return {
        ok: true,
        profile: record.profile.name,
        channel: "telegram",
        skipped: true,
        reason: uniqueStrings(reasons).join("; "),
        sentMessages: [],
      }
    }
    const token = this.env[telegram.botTokenEnv]
    if (!token) {
      return { ok: true, profile: record.profile.name, channel: "telegram", skipped: true, reason: `Telegram bot token env ${telegram.botTokenEnv} is not set`, sentMessages: [] }
    }
    const event: GatewayEvent = {
      platform: "telegram",
      channelID: "telegram",
      chatID,
      senderID: input.senderID ?? "manual-live-smoke",
      messageID: `live-${randomUUID()}`,
      text: input.text ?? "hello",
      timestamp: new Date().toISOString(),
    }
    const dispatch = await dispatchGatewayEvent({ record, event, env: this.env, cwd: this.cwd })
    const transport = createTelegramPollingTransport({ token, allowedChatIDs: telegram.allowedChatIDs })
    await transport.sendMessage(dispatch.event.chatID, dispatch.text)
    this.store.appendGatewayLog(record.profile.name, `[${new Date().toISOString()}] live-smoke ${dispatch.event.chatID} ${safeLogText(event.text)} -> ${safeLogText(dispatch.text)}`)
    return { ok: !dispatch.turn.error, profile: record.profile.name, channel: "telegram", skipped: false, dispatch, sentMessages: [{ chatID: dispatch.event.chatID, text: dispatch.text }] }
  }

  async handleTelegramWebhook(input: { name: string; update: unknown; secretToken?: string }): Promise<GatewayWebhookResult> {
    const record = this.store.getRequired(input.name)
    const telegram = record.channels.telegram
    if (!telegram) throw new Error("Telegram channel is not configured.")
    if (telegram.webhookSecretEnv) {
      const expected = this.env[telegram.webhookSecretEnv]
      if (!expected || input.secretToken !== expected) throw new Error("Invalid Telegram webhook secret.")
    }
    const normalized = normalizeTelegramUpdate(input.update)
    if (!normalized) {
      return { ok: true, profile: record.profile.name, channel: "telegram", accepted: true, ignored: true, sentMessages: [] }
    }
    if (!isTelegramEventAllowed(normalized.event, telegram)) {
      this.store.appendGatewayLog(record.profile.name, `[${new Date().toISOString()}] webhook rejected ${normalized.event.chatID}/${normalized.event.senderID}`)
      return { ok: true, profile: record.profile.name, channel: "telegram", accepted: false, sentMessages: [] }
    }
    const dispatch = await dispatchGatewayEvent({ record, event: normalized.event, env: this.env, cwd: this.cwd })
    const token = telegram.botTokenEnv ? this.env[telegram.botTokenEnv] : undefined
    const sentMessages: Array<{ chatID: string; text: string }> = []
    if (token) {
      await createTelegramPollingTransport({ token, allowedChatIDs: telegram.allowedChatIDs }).sendMessage(dispatch.event.chatID, dispatch.text)
      sentMessages.push({ chatID: dispatch.event.chatID, text: dispatch.text })
    }
    this.store.appendGatewayLog(record.profile.name, `[${new Date().toISOString()}] webhook dispatched ${dispatch.event.chatID} ${safeLogText(normalized.event.text)} -> ${safeLogText(dispatch.text)}`)
    return {
      ok: !dispatch.turn.error,
      profile: record.profile.name,
      channel: "telegram",
      accepted: true,
      deferred: !token,
      dispatch,
      sentMessages,
    }
  }

  async worker(input: { name: string; channel?: "telegram"; once?: boolean; pollIntervalMs?: number }): Promise<void> {
    const record = this.store.getRequired(input.name)
    const channel = input.channel ?? "telegram"
    const telegram = record.channels.telegram
    if (!telegram) throw new Error("Telegram channel is not configured.")
    const token = telegram.botTokenEnv ? this.env[telegram.botTokenEnv] : undefined
    if (!token) throw new Error(`Telegram bot token env ${telegram.botTokenEnv ?? "<missing>"} is not set.`)
    const transport = createTelegramPollingTransport({ token, allowedChatIDs: telegram.allowedChatIDs })
    this.store.writeGatewayStatus(record.profile.name, { state: "running", channel, pid: process.pid, lastHealth: new Date().toISOString(), health: "healthy" })
    try {
      let offset = 0
      const pollIntervalMs = Math.max(250, Math.min(input.pollIntervalMs ?? 1500, 30_000))
      for (;;) {
        const events = await transport.poll(offset)
        for (const item of events) {
          offset = Math.max(offset, item.offset + 1)
          if (!isTelegramEventAllowed(item.event, telegram)) {
            this.store.appendGatewayLog(record.profile.name, `[${new Date().toISOString()}] rejected ${item.event.chatID}/${item.event.senderID}`)
            continue
          }
          if (transport.sendChatAction) {
            try {
              await transport.sendChatAction(item.event.chatID, "typing")
            } catch (error) {
              this.store.appendGatewayLog(record.profile.name, `[${new Date().toISOString()}] sendChatAction failed ${safeLogText(error instanceof Error ? error.message : String(error))}`)
            }
          }
          const dispatch = await dispatchGatewayEvent({ record, event: item.event, env: this.env, cwd: this.cwd })
          await transport.sendMessage(item.event.chatID, dispatch.text)
          this.store.appendGatewayLog(record.profile.name, `[${new Date().toISOString()}] dispatched ${item.event.chatID} ${safeLogText(item.event.text)} -> ${safeLogText(dispatch.text)}`)
        }
        this.store.writeGatewayStatus(record.profile.name, { state: "running", channel, pid: process.pid, lastHealth: new Date().toISOString(), health: "healthy" })
        if (input.once) return
        await delay(pollIntervalMs)
      }
    } catch (error) {
      const message = redactSecretText(error instanceof Error ? error.message : String(error), this.env)
      this.store.writeGatewayStatus(record.profile.name, { state: "failed", channel, pid: process.pid, stoppedAt: new Date().toISOString(), lastHealth: new Date().toISOString(), health: "exited", lastError: message })
      this.store.appendGatewayLog(record.profile.name, `[${new Date().toISOString()}] worker failed ${safeLogText(message)}`)
      throw error
    }
  }
}

export interface TelegramPollItem {
  offset: number
  event: GatewayEvent
}

export interface TelegramTransport {
  poll(offset: number): Promise<TelegramPollItem[]>
  sendMessage(chatID: string, text: string): Promise<void>
  sendChatAction?(chatID: string, action: string): Promise<void>
}

export class LocalFixtureTelegramTransport implements TelegramTransport {
  readonly sentMessages: Array<{ chatID: string; text: string }> = []
  readonly chatActions: Array<{ chatID: string; action: string }> = []
  private readonly queue: TelegramPollItem[]

  constructor(events: GatewayEvent[] = []) {
    this.queue = events.map((event, index) => ({ offset: index + 1, event }))
  }

  async poll(offset: number): Promise<TelegramPollItem[]> {
    return this.queue.filter((item) => item.offset >= offset)
  }

  async sendMessage(chatID: string, text: string): Promise<void> {
    this.sentMessages.push({ chatID, text })
  }

  async sendChatAction(chatID: string, action: string): Promise<void> {
    this.chatActions.push({ chatID, action })
  }
}

export interface TelegramPollingTransportOptions {
  token: string
  allowedChatIDs?: string[]
  fetchImpl?: typeof fetch
  retryAttempts?: number
  rateLimitDelayMs?: number
}

export function createTelegramPollingTransport(input: TelegramPollingTransportOptions): TelegramTransport {
  const fetchImpl = input.fetchImpl ?? globalThis.fetch
  if (!fetchImpl) throw new Error("Telegram polling requires fetch.")
  const baseURL = `https://api.telegram.org/bot${encodeURIComponent(input.token)}`
  const retryAttempts = Math.max(1, Math.min(input.retryAttempts ?? 2, 5))
  const rateLimitDelayMs = Math.max(0, Math.min(input.rateLimitDelayMs ?? 250, 5_000))
  return {
    async poll(offset) {
      const url = new URL(`${baseURL}/getUpdates`)
      url.searchParams.set("timeout", "10")
      if (offset > 0) url.searchParams.set("offset", String(offset))
      const body = await telegramFetchJSON<{ ok?: boolean; result?: unknown[]; description?: string }>(fetchImpl, "getUpdates", url, undefined, retryAttempts)
      return (body.result ?? []).flatMap((update) => {
        const normalized = normalizeTelegramUpdate(update)
        return normalized ? [normalized] : []
      })
    },
    async sendMessage(chatID, text) {
      const chunks = splitTelegramMessage(text)
      for (let index = 0; index < chunks.length; index += 1) {
        const chunk = chunks[index] ?? ""
        await telegramFetchJSON<{ ok?: boolean; description?: string }>(fetchImpl, "sendMessage", `${baseURL}/sendMessage`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ chat_id: chatID, text: chunk }),
        }, retryAttempts)
        if (rateLimitDelayMs > 0 && index < chunks.length - 1) await delay(rateLimitDelayMs)
      }
    },
    async sendChatAction(chatID, action) {
      await telegramFetchJSON<{ ok?: boolean; description?: string }>(fetchImpl, "sendChatAction", `${baseURL}/sendChatAction`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatID, action }),
      }, retryAttempts)
    },
  }
}

export function normalizeTelegramUpdate(update: unknown): TelegramPollItem | undefined {
  if (!update || typeof update !== "object") return undefined
  const record = update as Record<string, unknown>
  const message = objectValue(record["message"]) ?? objectValue(record["edited_message"])
  if (!message) return undefined
  const chat = objectValue(message["chat"])
  const from = objectValue(message["from"])
  const text = typeof message["text"] === "string" ? message["text"] : typeof message["caption"] === "string" ? message["caption"] : undefined
  if (!chat || !text) return undefined
  const chatID = stringID(chat["id"])
  const senderID = stringID(from?.["id"] ?? chat["id"])
  const messageID = stringID(message["message_id"] ?? record["update_id"] ?? randomUUID())
  const timestampSeconds = typeof message["date"] === "number" ? message["date"] : undefined
  return {
    offset: Number(record["update_id"] ?? 0),
    event: {
      platform: "telegram",
      channelID: "telegram",
      chatID,
      senderID,
      messageID,
      text,
      ...(message["message_thread_id"] !== undefined ? { threadID: stringID(message["message_thread_id"]) } : {}),
      timestamp: timestampSeconds ? new Date(timestampSeconds * 1000).toISOString() : new Date().toISOString(),
    },
  }
}

export function splitTelegramMessage(text: string, maxLength = 4096): string[] {
  if (text.length <= maxLength) return [text]
  const chunks: string[] = []
  let rest = text
  while (rest.length > maxLength) {
    chunks.push(rest.slice(0, maxLength))
    rest = rest.slice(maxLength)
  }
  if (rest) chunks.push(rest)
  return chunks
}

export function redactProfileSecrets(value: unknown, env: Record<string, string | undefined> = process.env): unknown {
  void env
  return value
}

export function redactSecretText(text: string, env: Record<string, string | undefined> = process.env): string {
  void env
  return text
}

export function defaultHarnessProfileRoot(): string {
  return resolve(process.env.HELIX_PROFILE_ROOT ?? join(homedir(), ".helix", "harnesses"))
}

async function telegramFetchJSON<T>(fetchImpl: typeof fetch, label: string, url: string | URL, init: RequestInit | undefined, retryAttempts: number): Promise<T> {
  let lastError: Error | undefined
  for (let attempt = 1; attempt <= retryAttempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, init)
      const body = await safeResponseJSON(response)
      const ok = response.ok && (body.ok === undefined || body.ok === true)
      if (ok) return body as T
      lastError = new Error(`Telegram ${label} failed: ${typeof body.description === "string" ? body.description : response.statusText || response.status}`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
    }
    if (attempt < retryAttempts) await delay(Math.min(250 * attempt, 1000))
  }
  throw new Error(redactSecretText(lastError?.message ?? `Telegram ${label} failed.`))
}

async function safeResponseJSON(response: Response): Promise<Record<string, unknown>> {
  try {
    const body = await response.json()
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

async function dispatchGatewayEvent(input: {
  record: InstalledHarnessProfileRecord
  event: GatewayEvent
  env: NodeJS.ProcessEnv
  cwd: string
}): Promise<GatewayDispatchResult> {
  const harness = assembleRecipeHarness(input.record.recipe, {
    cwd: input.record.profile.workspaceDir || input.cwd,
    storageDir: input.record.profile.storageDir,
  })
  installGatewayRuntimeContext(harness, input.event, input.env)
  const sessionID = gatewaySessionID(input.event)
  const command = gatewayCommand(input.event.text)
  if (command === "status") {
    await ensureGatewaySession(harness, sessionID, input.event, input.env)
    const gateway = input.record.gateway
    const text = `Profile ${input.record.profile.name}: ${gateway.state}${gateway.pid ? ` pid=${gateway.pid}` : ""}${gateway.health ? ` health=${gateway.health}` : ""}.`
    return {
      event: input.event,
      text,
      sessionID,
      turn: { steps: 0, blockedTools: [] },
    }
  }
  if (command === "reset") {
    try {
      await harness.session.remove(sessionID)
    } catch {
      // Removing a non-existent session is equivalent to starting fresh.
    }
    await ensureGatewaySession(harness, sessionID, input.event, input.env)
    return {
      event: input.event,
      text: `Started a new Telegram session for ${input.event.chatID}${input.event.threadID ? `/${input.event.threadID}` : ""}.`,
      sessionID,
      turn: { steps: 0, blockedTools: [] },
    }
  }
  const provider = providerForProfile(input.record, input.env)
  await ensureGatewaySession(harness, sessionID, input.event, input.env)
  const result = await harness.runTurn({
    sessionID,
    text: input.event.text,
    provider,
    maxRetries: 0,
    syntheticContinue: false,
  })
  const text = result.assistantMessage.parts.map((part) => (part && typeof part === "object" && "text" in part && typeof part.text === "string" ? part.text : "")).filter(Boolean).join("\n") || "ok"
  return {
    event: input.event,
    text,
    sessionID: result.session.id,
    turn: {
      steps: result.steps,
      ...(result.finish ? { finish: result.finish } : {}),
      blockedTools: result.blockedTools,
      ...(result.error ? { error: result.error } : {}),
    },
  }
}

async function ensureGatewaySession(harness: ReturnType<typeof assembleRecipeHarness>, sessionID: SessionID, event: GatewayEvent, env: NodeJS.ProcessEnv): Promise<void> {
  try {
    await harness.session.get(sessionID)
  } catch {
    await harness.session.create({
      id: sessionID,
      title: `Telegram ${event.chatID}`,
      metadata: {
        channel: "telegram",
        chatID: event.chatID,
        senderID: event.senderID,
        ...(event.threadID ? { threadID: event.threadID } : {}),
        timezone: gatewayTimeZone(env),
      },
    })
  }
}

export function gatewaySessionID(event: GatewayEvent): SessionID {
  return `telegram:${event.chatID}${event.threadID ? `:${event.threadID}` : ""}` as SessionID
}

export function createGatewayRuntimeContext(event: GatewayEvent, env: NodeJS.ProcessEnv = process.env): GatewayRuntimeContext {
  const timezone = gatewayTimeZone(env)
  return {
    channel: "telegram",
    channelID: event.channelID,
    chatID: event.chatID,
    senderID: event.senderID,
    messageID: event.messageID,
    text: event.text,
    ...(event.threadID ? { threadID: event.threadID } : {}),
    timestamp: event.timestamp,
    timezone,
    hermes: {
      gatewayEvent: {
        platform: "telegram",
        chatID: event.chatID,
        senderID: event.senderID,
        ...(event.threadID ? { threadID: event.threadID } : {}),
        text: event.text,
      },
    },
    nanobot: {
      channel: "telegram",
      conversationID: event.threadID ? `${event.chatID}:${event.threadID}` : event.chatID,
      userID: event.senderID,
      ...(event.threadID ? { threadID: event.threadID } : {}),
      timezone,
    },
    opencode: {
      slackCompatibleResponse: {
        channelID: event.chatID,
        userID: event.senderID,
        responseProjection: "plain-text",
      },
    },
  }
}

function installGatewayRuntimeContext(harness: ReturnType<typeof assembleRecipeHarness>, event: GatewayEvent, env: NodeJS.ProcessEnv): GatewayRuntimeContext {
  const context = createGatewayRuntimeContext(event, env)
  harness.hooks.services.set("gateway.event", event)
  harness.hooks.services.set("gateway.context", context)
  harness.hooks.services.set("channel", context.channel)
  harness.hooks.services.set("chatID", context.chatID)
  harness.hooks.services.set("senderID", context.senderID)
  if (context.threadID) harness.hooks.services.set("threadID", context.threadID)
  harness.hooks.services.set("timezone", context.timezone)
  harness.hooks.services.set("nanobot.channel", context.nanobot.channel)
  harness.hooks.services.set("nanobot.channel.metadata", context.nanobot)
  harness.hooks.services.set("hermes.gateway.event", context.hermes.gatewayEvent)
  harness.hooks.services.set("opencode.responseProjection", context.opencode.slackCompatibleResponse)
  return context
}

function gatewayCommand(text: string): "status" | "reset" | undefined {
  const command = text.trim().split(/\s+/, 1)[0]?.toLowerCase().split("@", 1)[0]
  if (command === "/status") return "status"
  if (command === "/new" || command === "/reset") return "reset"
  return undefined
}

function providerForProfile(record: InstalledHarnessProfileRecord, env: NodeJS.ProcessEnv) {
  const provider = record.provider
  if (!provider) {
    throw new Error("Live provider is not configured. Configure a real provider/model/API key before running gateway turns.")
  }
  if (!provider.modelID) throw new Error("Provider modelID is required.")
  if (!provider.apiKeyEnv) throw new Error("Provider apiKeyEnv is required.")
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

function normalizeProviderConfig(input: ConfigureProfileProviderInput): InstalledHarnessProviderConfig {
  const kind = input.kind
  if ((kind as string) === "fake") throw new Error("Fake provider profiles are no longer supported. Configure a real provider/model/API key.")
  if (!input.modelID) throw new Error("Provider model is required for live provider profiles.")
  if (!input.apiKeyEnv) throw new Error("Provider apiKeyEnv is required for live provider profiles.")
  return {
    schemaVersion: 1,
    kind,
    configuredAt: (input.now ?? new Date()).toISOString(),
    ...(input.modelID ? { modelID: input.modelID } : {}),
    ...(input.baseURL ? { baseURL: validatePublicURL(input.baseURL, "Provider base URL") } : {}),
    ...(input.appURL ? { appURL: validatePublicURL(input.appURL, "Provider app URL") } : {}),
    ...(input.appName ? { appName: input.appName } : {}),
    ...(input.apiKeyEnv ? { apiKeyEnv: normalizeEnvRef(input.apiKeyEnv, "Provider API key env") } : {}),
  }
}

function inferHarnessProduct(recipe: LegoRecipe): HarnessProduct {
  const metadataProduct = typeof recipe.metadata?.["product"] === "string" ? recipe.metadata["product"] : undefined
  if (metadataProduct === "opencode" || metadataProduct === "pi-mono" || metadataProduct === "nanobot" || metadataProduct === "hermes-agent") return metadataProduct
  const shellIDs = [
    ...(recipe.productShells ?? []).map((shell) => shell.id),
    ...(recipe.bindings ?? []).filter((binding) => binding.port === "product.shell" || binding.capability === "product.shell").map((binding) => binding.module),
  ].filter((id): id is string => Boolean(id))
  if (shellIDs.some((id) => id.startsWith("pi."))) return "pi-mono"
  if (shellIDs.some((id) => id.startsWith("nanobot."))) return "nanobot"
  if (shellIDs.some((id) => id.startsWith("hermes."))) return "hermes-agent"
  return "opencode"
}

function normalizeProfileName(name: string): string {
  const trimmed = name.trim()
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(trimmed)) {
    throw new Error("Profile name must be 1-64 chars and contain only letters, numbers, dot, dash, and underscore.")
  }
  return trimmed
}

function normalizeEnvRef(value: string, label: string): string {
  const trimmed = value.trim()
  if (!/^[A-Z_][A-Z0-9_]*$/.test(trimmed)) throw new Error(`${label} must be an environment variable name.`)
  return trimmed
}

function validatePublicURL(value: string, label: string): string {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`${label} must be a valid URL.`)
  }
  if (parsed.protocol !== "https:") throw new Error(`${label} must use https://.`)
  return parsed.toString().replace(/\/$/, "")
}

function createDefaultGatewayStatus(dir: string): InstalledHarnessGatewayStatus {
  return {
    schemaVersion: 1,
    state: "stopped",
    health: "unknown",
    logPath: join(dir, "gateway.log"),
  }
}

function createGatewayServiceManifests(input: { profileName: string; channel: "telegram"; profileRoot: string; cwd: string }): GatewayServiceManifests {
  const command = ["npm", "run", "-s", "helix", "--", "gateway", "worker", input.profileName, "--channel", input.channel, "--profile-root", input.profileRoot]
  const execStart = command.map(systemdArg).join(" ")
  const serviceName = `helix-${input.profileName}-telegram`
  const dockerProfileRoot = "/var/lib/helix/harnesses"
  return {
    schemaVersion: 1,
    profile: input.profileName,
    channel: input.channel,
    systemdUserService: [
      `[Unit]`,
      `Description=Helix Telegram gateway (${input.profileName})`,
      `After=network-online.target`,
      ``,
      `[Service]`,
      `Type=simple`,
      `WorkingDirectory=${input.cwd}`,
      `Environment=HELIX_PROFILE_ROOT=${input.profileRoot}`,
      `ExecStart=${execStart}`,
      `Restart=on-failure`,
      `RestartSec=5`,
      ``,
      `[Install]`,
      `WantedBy=default.target`,
    ].join("\n"),
    launchdPlist: [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">`,
      `<plist version="1.0">`,
      `<dict>`,
      `  <key>Label</key><string>dev.helix.${input.profileName}.telegram</string>`,
      `  <key>WorkingDirectory</key><string>${xmlEscape(input.cwd)}</string>`,
      `  <key>EnvironmentVariables</key><dict><key>HELIX_PROFILE_ROOT</key><string>${xmlEscape(input.profileRoot)}</string></dict>`,
      `  <key>ProgramArguments</key><array>${command.map((part) => `<string>${xmlEscape(part)}</string>`).join("")}</array>`,
      `  <key>RunAtLoad</key><true/>`,
      `  <key>KeepAlive</key><dict><key>SuccessfulExit</key><false/></dict>`,
      `</dict>`,
      `</plist>`,
    ].join("\n"),
    pm2EcosystemConfig: [
      `module.exports = {`,
      `  apps: [{`,
      `    name: ${JSON.stringify(serviceName)},`,
      `    cwd: ${JSON.stringify(input.cwd)},`,
      `    script: "npm",`,
      `    args: ${JSON.stringify(command.slice(1))},`,
      `    autorestart: true,`,
      `    env: { HELIX_PROFILE_ROOT: ${JSON.stringify(input.profileRoot)} }`,
      `  }]`,
      `}`,
    ].join("\n"),
    dockerCompose: [
      `services:`,
      `  ${serviceName}:`,
      `    image: node:22`,
      `    working_dir: /workspace`,
      `    command: ${JSON.stringify(command)}`,
      `    restart: unless-stopped`,
      `    environment:`,
      `      HELIX_PROFILE_ROOT: ${dockerProfileRoot}`,
      `    volumes:`,
      `      - ${input.cwd}:/workspace`,
      `      - ${input.profileRoot}:${dockerProfileRoot}`,
    ].join("\n"),
  }
}

function writeJSON(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

function readJSON<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T
}

function safeReadDirNames(path: string): string[] {
  try {
    return Array.from(new Set(readdirSync(path).filter((item) => !item.startsWith("."))))
  } catch {
    return []
  }
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean))).sort()
}


function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
}

function stringID(value: unknown): string {
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : String(value ?? "")
}

function isTelegramEventAllowed(event: GatewayEvent, config: InstalledHarnessTelegramConfig): boolean {
  if (config.allowedChatIDs.length > 0 && !config.allowedChatIDs.includes(event.chatID)) return false
  if (config.allowedUserIDs.length > 0 && !config.allowedUserIDs.includes(event.senderID)) return false
  return true
}

function gatewayTimeZone(env: NodeJS.ProcessEnv): string {
  if (env.TZ) return env.TZ
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
}

function defaultGatewayWorkerCommand(profile: string, channel: "telegram"): string[] {
  return ["npm", "run", "-s", "helix", "--", "gateway", "worker", profile, "--channel", channel]
}

function minimalWorkerEnv(env: NodeJS.ProcessEnv, record?: InstalledHarnessProfileRecord, profileRoot?: string): NodeJS.ProcessEnv {
  const keep = [
    "PATH",
    "HOME",
    "USER",
    "SHELL",
    "TZ",
    "NODE_OPTIONS",
    "HELIX_PROFILE_ROOT",
    "HELIX_LIVE_PROVIDER",
    "HELIX_LIVE_MODEL",
    "HELIX_LIVE_BASE_URL",
    "OPENAI_API_KEY",
    "OPENROUTER_API_KEY",
    "ANTHROPIC_API_KEY",
    "GOOGLE_API_KEY",
    "TELEGRAM_BOT_TOKEN",
  ]
  if (record?.provider?.apiKeyEnv) keep.push(record.provider.apiKeyEnv)
  if (record?.channels.telegram?.botTokenEnv) keep.push(record.channels.telegram.botTokenEnv)
  if (record?.channels.telegram?.webhookSecretEnv) keep.push(record.channels.telegram.webhookSecretEnv)
  const next: NodeJS.ProcessEnv = {}
  for (const key of keep) if (env[key] !== undefined) next[key] = env[key]
  if (profileRoot) next.HELIX_PROFILE_ROOT = profileRoot
  return next
}

function safeLogText(value: string): string {
  return value.replace(/\s+/g, " ").slice(0, 160)
}

function systemdArg(value: string): string {
  return /[\s"'\\]/.test(value) ? `"${value.replace(/(["\\$`])/g, "\\$1")}"` : value
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms))
}
