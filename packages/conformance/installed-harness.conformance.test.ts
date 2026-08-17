import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  codingAgentMinimalRecipe,
  createGatewayRuntimeContext,
  createTelegramPollingTransport,
  gatewaySessionID,
  HarnessGatewayController,
  HarnessProfileStore,
  LocalFixtureTelegramTransport,
  normalizeTelegramUpdate,
  redactProfileSecrets,
  redactSecretText,
  splitTelegramMessage,
} from "@helix/recipes"
import { startDocsServer } from "../docs-site/src/server.ts"

describe("installed harness profiles and gateway activation", () => {
  it("installs a profile, keeps secrets as env refs, and rejects fake provider profiles", async () => {
    const rootDir = mkdtempSync(join(tmpdir(), "helix-profiles-"))
    try {
      const env = {
        ANTHROPIC_API_KEY: "anthropic-secret-value",
        TELEGRAM_BOT_TOKEN: "telegram-secret-value",
      }
      const store = new HarnessProfileStore({ rootDir, cwd: process.cwd(), env })
      const record = store.install({ name: "my-harness", recipe: codingAgentMinimalRecipe })

      expect(record.profile.name).toBe("my-harness")
      expect(readFileSync(join(rootDir, "my-harness", "recipe.json"), "utf8")).toContain("coding-agent.minimal")

      const providerStatus = store.configureProvider({
        name: "my-harness",
        kind: "anthropic",
        modelID: "claude-test",
        apiKeyEnv: "ANTHROPIC_API_KEY",
      })
      expect(JSON.stringify(providerStatus)).not.toContain("anthropic-secret-value")
      expect(providerStatus.provider).toMatchObject({ kind: "anthropic", apiKeyEnv: "ANTHROPIC_API_KEY", hasAPIKey: true })

      const telegramStatus = store.addTelegramChannel({
        name: "my-harness",
        mode: "polling",
        botTokenEnv: "TELEGRAM_BOT_TOKEN",
        allowedChatIDs: ["chat-1"],
      })
      expect(JSON.stringify(telegramStatus)).not.toContain("telegram-secret-value")
      expect(telegramStatus.telegram).toMatchObject({ mode: "polling", botTokenEnv: "TELEGRAM_BOT_TOKEN", hasBotToken: true })

      expect(() => store.configureProvider({ name: "my-harness", kind: "fake" as never })).toThrow("Fake provider profiles are no longer supported")
      expect(() => store.addTelegramChannel({ name: "my-harness", mode: "fake" as never })).toThrow("Telegram gateway mode fake is no longer supported")
      const smoke = await new HarnessGatewayController({ store, env: env as NodeJS.ProcessEnv }).localFixtureSmoke({
        name: "my-harness",
        text: "/status",
        chatID: "chat-1",
        senderID: "user-1",
      })
      expect(smoke.ok).toBe(true)
      expect(smoke.source).toBe("local-fixture")
      expect(smoke.dispatch.text).toContain("Profile my-harness")
      expect(smoke.sentMessages).toEqual([{ chatID: "chat-1", text: smoke.dispatch.text }])
      expect(store.gatewayLogs("my-harness").text).toContain("local-fixture-smoke chat-1")

      const customRecipe = {
        ...codingAgentMinimalRecipe,
        id: "custom.telegram-gateway",
        metadata: { ...codingAgentMinimalRecipe.metadata, product: "custom" },
      }
      store.install({ name: "custom-harness", recipe: customRecipe })
      expect(() => store.configureProvider({ name: "custom-harness", kind: "fake" as never })).toThrow("Fake provider profiles are no longer supported")
      store.addTelegramChannel({
        name: "custom-harness",
        mode: "polling",
        botTokenEnv: "TELEGRAM_BOT_TOKEN",
        allowedChatIDs: ["custom-chat"],
      })
      await expect(new HarnessGatewayController({ store, env: env as NodeJS.ProcessEnv }).localFixtureSmoke({
        name: "custom-harness",
        text: "hello custom",
        chatID: "custom-chat",
      })).rejects.toThrow("Live provider is not configured")
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it("normalizes Telegram updates, splits long messages, and redacts env secret values", async () => {
    const normalized = normalizeTelegramUpdate({
      update_id: 42,
      message: {
        message_id: 7,
        date: 1_700_000_000,
        chat: { id: -100 },
        from: { id: 123 },
        text: "hello",
      },
    })

    expect(normalized).toMatchObject({
      offset: 42,
      event: {
        platform: "telegram",
        chatID: "-100",
        senderID: "123",
        messageID: "7",
        text: "hello",
      },
    })
    expect(splitTelegramMessage("abcdef", 2)).toEqual(["ab", "cd", "ef"])
    expect(redactProfileSecrets({ message: "token=super-secret-token" }, { TOKEN: "super-secret-token" })).toEqual({ message: "token=super-secret-token" })
    const runtimeContext = createGatewayRuntimeContext(normalized!.event, { TZ: "Asia/Shanghai" } as NodeJS.ProcessEnv)
    expect(runtimeContext).toMatchObject({
      channel: "telegram",
      timezone: "Asia/Shanghai",
      hermes: { gatewayEvent: { platform: "telegram", chatID: "-100", senderID: "123" } },
      nanobot: { channel: "telegram", conversationID: "-100", userID: "123", timezone: "Asia/Shanghai" },
      opencode: { slackCompatibleResponse: { channelID: "-100", userID: "123", responseProjection: "plain-text" } },
    })

    const localFixture = new LocalFixtureTelegramTransport([normalized!.event])
    await expect(localFixture.poll(0)).resolves.toHaveLength(1)
  })

  it("exposes profile activation APIs without echoing secret values", async () => {
    const rootDir = mkdtempSync(join(tmpdir(), "helix-profile-api-"))
      const previousAnthropic = process.env["ANTHROPIC_API_KEY"]
      const previousTelegram = process.env["TELEGRAM_BOT_TOKEN"]
      const previousWebhook = process.env["TELEGRAM_WEBHOOK_SECRET"]
      process.env["ANTHROPIC_API_KEY"] = "api-server-secret"
      process.env["TELEGRAM_BOT_TOKEN"] = "telegram-server-secret"
      process.env["TELEGRAM_WEBHOOK_SECRET"] = "webhook-server-secret"
    const profileStore = new HarnessProfileStore({ rootDir, cwd: process.cwd(), env: process.env })
    const running = await startDocsServer({ cwd: process.cwd(), host: "127.0.0.1", port: 0, profileStore })
    try {
      const install = await fetch(`${running.url}/api/harnesses`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "api-harness", recipe: codingAgentMinimalRecipe }),
      })
      expect(install.status).toBe(201)

      const provider = await fetch(`${running.url}/api/harnesses/api-harness/provider`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: "anthropic", modelID: "claude-test", apiKeyEnv: "ANTHROPIC_API_KEY", apiKey: "one-time-provider-secret" }),
      })
      const providerText = await provider.text()
      expect(provider.status).toBe(200)
      expect(providerText).not.toContain("api-server-secret")
      expect(providerText).not.toContain("one-time-provider-secret")
      expect(readFileSync(join(rootDir, "api-harness", "provider.json"), "utf8")).not.toContain("one-time-provider-secret")

      const telegram = await fetch(`${running.url}/api/harnesses/api-harness/channels/telegram`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "polling", botTokenEnv: "TELEGRAM_BOT_TOKEN", botToken: "one-time-telegram-secret", allowedChatIDs: ["chat-1"] }),
      })
      const telegramText = await telegram.text()
      expect(telegram.status).toBe(200)
      expect(telegramText).not.toContain("telegram-server-secret")
      expect(telegramText).not.toContain("one-time-telegram-secret")
      expect(readFileSync(join(rootDir, "api-harness", "channels.json"), "utf8")).not.toContain("one-time-telegram-secret")

      const rejectedProvider = await fetch(`${running.url}/api/harnesses/api-harness/provider`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: "fake" }),
      })
      const rejectedProviderText = await rejectedProvider.text()
      expect(rejectedProvider.status).toBe(400)
      expect(rejectedProviderText).toContain("Fake provider profiles are no longer supported")
      const smoke = await fetch(`${running.url}/api/harnesses/api-harness/gateway/smoke-local`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "/status", chatID: "chat-1" }),
      })
      const smokeJSON = (await smoke.json()) as { ok?: boolean; dispatch?: { text?: string } }
      expect(smoke.status).toBe(200)
      expect(smokeJSON.ok).toBe(true)
      expect(smokeJSON.dispatch?.text).toContain("Profile api-harness")

      await fetch(`${running.url}/api/harnesses/api-harness/channels/telegram`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "webhook", webhookURL: "https://example.com/telegram", webhookSecretEnv: "TELEGRAM_WEBHOOK_SECRET", allowedChatIDs: ["chat-1"] }),
      })
      const webhookUpdate = {
        update_id: 99,
        message: {
          message_id: 12,
          date: 1_700_000_000,
          chat: { id: "chat-1" },
          from: { id: "user-1" },
          text: "/status",
        },
      }
      const rejectedWebhook = await fetch(`${running.url}/api/harnesses/api-harness/channels/telegram/webhook`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": "wrong-secret" },
        body: JSON.stringify(webhookUpdate),
      })
      const rejectedText = await rejectedWebhook.text()
      expect(rejectedWebhook.status).toBe(400)
      expect(rejectedText).not.toContain("webhook-server-secret")
      const acceptedWebhook = await fetch(`${running.url}/api/harnesses/api-harness/channels/telegram/webhook`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": "webhook-server-secret" },
        body: JSON.stringify(webhookUpdate),
      })
      const acceptedJSON = (await acceptedWebhook.json()) as { ok?: boolean; accepted?: boolean; deferred?: boolean; dispatch?: { text?: string } }
      expect(acceptedWebhook.status).toBe(200)
      expect(acceptedJSON).toMatchObject({ ok: true, accepted: true, deferred: true })
      expect(acceptedJSON.dispatch?.text).toContain("Profile api-harness")
    } finally {
      await new Promise<void>((resolveClose) => running.server.close(() => resolveClose()))
      if (previousAnthropic === undefined) delete process.env["ANTHROPIC_API_KEY"]
      else process.env["ANTHROPIC_API_KEY"] = previousAnthropic
      if (previousTelegram === undefined) delete process.env["TELEGRAM_BOT_TOKEN"]
      else process.env["TELEGRAM_BOT_TOKEN"] = previousTelegram
      if (previousWebhook === undefined) delete process.env["TELEGRAM_WEBHOOK_SECRET"]
      else process.env["TELEGRAM_WEBHOOK_SECRET"] = previousWebhook
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it("binds Telegram threads to sessions and handles gateway commands without provider turns", async () => {
    const rootDir = mkdtempSync(join(tmpdir(), "helix-profile-commands-"))
    try {
      const store = new HarnessProfileStore({ rootDir, cwd: process.cwd(), env: { TZ: "Asia/Shanghai" } })
      store.install({ name: "command-harness", recipe: codingAgentMinimalRecipe })
      store.addTelegramChannel({ name: "command-harness", mode: "polling", botTokenEnv: "TELEGRAM_BOT_TOKEN", allowedChatIDs: ["chat-1"] })
      const controller = new HarnessGatewayController({ store, env: { TZ: "Asia/Shanghai", TELEGRAM_BOT_TOKEN: "command-token" } as NodeJS.ProcessEnv })

      const status = await controller.localFixtureSmoke({ name: "command-harness", text: "/status", chatID: "chat-1", senderID: "user-1", threadID: "topic-7" })
      expect(status.dispatch.sessionID).toBe("telegram:chat-1:topic-7")
      expect(status.dispatch.turn.steps).toBe(0)
      expect(status.dispatch.text).toContain("Profile command-harness")

      const reset = await controller.localFixtureSmoke({ name: "command-harness", text: "/reset", chatID: "chat-1", senderID: "user-1", threadID: "topic-7" })
      expect(reset.dispatch.sessionID).toBe("telegram:chat-1:topic-7")
      expect(reset.dispatch.text).toContain("Started a new Telegram session")
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it("manages worker lifecycle, redacts logs, and emits service manifests", async () => {
    const rootDir = mkdtempSync(join(tmpdir(), "helix-profile-worker-"))
    let runningPID: number | undefined
    try {
      const env = { PATH: process.env.PATH, TOKEN: "worker-secret-value", TELEGRAM_BOT_TOKEN: "worker-telegram-token" } as NodeJS.ProcessEnv
      const store = new HarnessProfileStore({ rootDir, cwd: process.cwd(), env })
      store.install({ name: "worker-harness", recipe: codingAgentMinimalRecipe })
      store.addTelegramChannel({ name: "worker-harness", mode: "polling", botTokenEnv: "TELEGRAM_BOT_TOKEN" })
      const controller = new HarnessGatewayController({
        store,
        cwd: process.cwd(),
        env,
        workerCommand: [process.execPath, "-e", "setInterval(() => {}, 1000)"],
      })

      const started = controller.start({ name: "worker-harness", channel: "telegram" })
      runningPID = started.pid
      expect(started).toMatchObject({ ok: true, state: "running" })
      expect(store.status("worker-harness").gateway).toMatchObject({ state: "running", health: "healthy", pid: started.pid })

      store.appendGatewayLog("worker-harness", "env TOKEN=worker-secret-value")
      expect(store.gatewayLogs("worker-harness").text).toContain("TOKEN=worker-secret-value")
      expect(redactSecretText("worker-secret-value", env)).toBe("worker-secret-value")

      const manifests = controller.serviceManifests({ name: "worker-harness" })
      expect(manifests.systemdUserService).toContain("Restart=on-failure")
      expect(manifests.launchdPlist).toContain("KeepAlive")
      expect(manifests.pm2EcosystemConfig).toContain("autorestart")
      expect(manifests.dockerCompose).toContain("restart: unless-stopped")

      const restarted = controller.restart({ name: "worker-harness" })
      runningPID = restarted.pid
      expect(restarted).toMatchObject({ restarted: true, state: "running" })
      expect(store.status("worker-harness").gateway.restartReason).toBe("manual-restart")
      const stopped = controller.stop({ name: "worker-harness" })
      runningPID = undefined
      expect(stopped.state).toBe("stopped")
      expect(store.status("worker-harness").gateway.health).toBe("exited")
    } finally {
      if (runningPID) {
        try {
          process.kill(runningPID, "TERM")
        } catch {
          // The worker may have already exited.
        }
      }
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it("records worker exit codes and skips live Telegram smoke without credentials", async () => {
    const rootDir = mkdtempSync(join(tmpdir(), "helix-profile-exit-"))
    try {
      const env = { PATH: process.env.PATH } as NodeJS.ProcessEnv
      const store = new HarnessProfileStore({ rootDir, cwd: process.cwd(), env })
      store.install({ name: "exit-harness", recipe: codingAgentMinimalRecipe })
      store.configureProvider({ name: "exit-harness", kind: "anthropic", modelID: "claude-test", apiKeyEnv: "ANTHROPIC_API_KEY" })
      store.addTelegramChannel({ name: "exit-harness", mode: "polling", botTokenEnv: "TELEGRAM_BOT_TOKEN", allowedChatIDs: ["chat-1"] })
      const controller = new HarnessGatewayController({
        store,
        cwd: process.cwd(),
        env,
        workerCommand: [process.execPath, "-e", "process.exit(7)"],
      })
      controller.start({ name: "exit-harness" })
      await waitFor(() => store.status("exit-harness").gateway.state === "failed")
      expect(store.status("exit-harness").gateway).toMatchObject({ state: "failed", health: "exited", exitCode: 7 })

      const live = await controller.liveTelegramSmoke({ name: "exit-harness", text: "hello", chatID: "chat-1" })
      expect(live).toMatchObject({ ok: true, skipped: true })
      expect(live.reason).toContain("Telegram bot token env")
    } finally {
      rmSync(rootDir, { recursive: true, force: true })
    }
  })

  it("retries Telegram polling requests and sends typing actions", async () => {
    const calls: Array<{ url: string; body?: string }> = []
    let getUpdatesAttempts = 0
    const fetchImpl: typeof fetch = async (url, init) => {
      const urlText = String(url)
      calls.push({ url: urlText, ...(typeof init?.body === "string" ? { body: init.body } : {}) })
      if (urlText.includes("getUpdates")) {
        getUpdatesAttempts += 1
        if (getUpdatesAttempts === 1) return new Response(JSON.stringify({ ok: false, description: "retry later" }), { status: 429, statusText: "Too Many Requests" })
        return new Response(JSON.stringify({
          ok: true,
          result: [{
            update_id: 10,
            message: {
              message_id: 5,
              message_thread_id: 77,
              date: 1_700_000_000,
              chat: { id: "chat-1" },
              from: { id: "user-1" },
              text: "hello",
            },
          }],
        }), { status: 200 })
      }
      return new Response(JSON.stringify({ ok: true, result: true }), { status: 200 })
    }
    const transport = createTelegramPollingTransport({ token: "telegram-secret-value", fetchImpl, retryAttempts: 2, rateLimitDelayMs: 0 })
    const events = await transport.poll(0)
    expect(getUpdatesAttempts).toBe(2)
    expect(events[0]?.event.threadID).toBe("77")
    expect(gatewaySessionID(events[0]!.event)).toBe("telegram:chat-1:77")

    await transport.sendChatAction!("chat-1", "typing")
    await transport.sendMessage("chat-1", "abcdef")
    expect(calls.some((call) => call.url.includes("sendChatAction") && call.body?.includes("typing"))).toBe(true)
    expect(calls.some((call) => call.url.includes("sendMessage") && call.body?.includes("abcdef"))).toBe(true)
  })
})

async function waitFor(predicate: () => boolean, timeoutMs = 2000): Promise<void> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (predicate()) return
    await new Promise((resolveWait) => setTimeout(resolveWait, 25))
  }
  throw new Error("Timed out waiting for condition.")
}
