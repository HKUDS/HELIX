import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { createMockSSEProviderTransport, createOpenAICompatibleProvider, type ProviderFetchInit } from "@helix/lego-provider"
import {
  type HermesACPSurface,
  type HermesAPIServer,
  type HermesCLISurface,
  type HermesGatewaySurface,
  type HermesSDK,
  type HermesTUISurface,
  type HermesWebDashboardSurface,
} from "@helix/adapters-hermes"
import {
  type OpenCodeControlPlane,
  type OpenCodeDesktopSurface,
  type OpenCodeSDK,
  type OpenCodeServer,
  type OpenCodeSlackSurface,
  type OpenCodeTUISurface,
  type OpenCodeWebSurface,
  type OpenCodeWorkspaceSurface,
} from "@helix/adapters-opencode"
import {
  openCodeProductShellNativeExactEvidenceRef,
  openCodeProductShellNativeExactFixtureID,
  openCodeProductShellNativeExactReplayRef,
} from "@helix/adapters-opencode/product-schema/product-shell"
import {
  type PiBrowserSmoke,
  type PiCLISurface,
  type PiExtensionExamples,
  type PiPackageManager,
  type PiReleaseHardening,
  type PiRPCSurface,
  type PiSDK,
  type PiServer,
  type PiTUISurface,
  type PiWebUISurface,
} from "@helix/adapters-pi"
import {
  type NanobotCLISurface,
  type NanobotSDK,
  type NanobotServer,
  type NanobotTUISurface,
  type NanobotWebUISurface,
} from "@helix/adapters-nanobot"
import {
  assembleHermesAgentHarness,
  assembleNanobotHarness,
  assembleOpenCodeHarness,
  assemblePiMonoHarness,
  buildProductShellTranscriptExactDiffBlockerSnapshot,
  buildProductShellTranscriptGateSnapshot,
  buildProductShellTranscriptPinnedReplaySnapshot,
  verifyProductShellTranscriptExactDiffBlockerSnapshot,
  verifyProductShellTranscriptGateSnapshot,
  verifyProductShellTranscriptPinnedReplaySnapshot,
} from "@helix/recipes"

describe("product shell surfaces", () => {
  it("smokes OpenCode SDK as its own product shell", async () => {
    const harness = assembleOpenCodeHarness()
    const sdk = service<OpenCodeSDK>(harness.hooks.services, "opencode.sdk")

    expect(sdk.kind).toBe("opencode-sdk")
    expect(sdk.graph().map((module) => module.id)).toEqual(
      expect.arrayContaining(["opencode.product-shell.sdk", "opencode.product-shell.workspace"]),
    )
    const result = await sdk.runTurn({ text: "hello from sdk", provider: surfaceProvider("opencode sdk ok") })
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("opencode sdk ok")
    await expect(sdk.getSession(result.session.id)).resolves.toMatchObject({
      session: expect.objectContaining({ id: result.session.id }),
      transcript: expect.arrayContaining([expect.objectContaining({ role: "assistant" })]),
    })
  })

  it("smokes OpenCode workspace as its own product shell", () => {
    const harness = assembleOpenCodeHarness()
    const workspace = service<OpenCodeWorkspaceSurface>(harness.hooks.services, "opencode.workspace")
    const snapshot = workspace.snapshot()

    expect(workspace.kind).toBe("opencode-workspace")
    expect(snapshot).toMatchObject({ product: "opencode", recipeID: "opencode" })
    expect(snapshot.registries.tools).toEqual(expect.arrayContaining(["bash", "glob", "grep", "read", "skill", "todowrite", "webfetch", "write"]))
    expect(snapshot.services).toEqual(expect.arrayContaining(["opencode.workspace", "opencode.sdk"]))
  })

  it("smokes OpenCode control plane as its own product shell", () => {
    const harness = assembleOpenCodeHarness()
    const controlPlane = service<OpenCodeControlPlane>(harness.hooks.services, "opencode.control-plane")
    const snapshot = controlPlane.snapshot()

    expect(controlPlane.kind).toBe("opencode-control-plane")
    expect(snapshot).toMatchObject({ product: "opencode", status: "ready" })
    expect(snapshot.routes).toEqual(expect.arrayContaining(["GET /v1/workspace", "POST /v1/run"]))
    expect(snapshot.routes).not.toContain("POST /v1/run/fake")
    expect(snapshot.providers).toEqual(expect.arrayContaining(["opencode-builtin-codex", "opencode-builtin-xai"]))
  })

  it("smokes OpenCode TUI as its own product shell", () => {
    const harness = assembleOpenCodeHarness()
    const tui = service<OpenCodeTUISurface>(harness.hooks.services, "opencode.tui")

    expect(tui.kind).toBe("opencode-tui")
    expect(tui.snapshot()).toMatchObject({ product: "opencode", title: "OpenCode" })
    expect(tui.render()).toContain("OpenCode TUI")
    expect(tui.dispatch({ type: "submit", text: "hello from opencode tui" })).toMatchObject({
      handled: true,
      submittedText: "hello from opencode tui",
    })
  })

  it("smokes OpenCode Web as its own product shell", () => {
    const outDir = mkdtempSync(join(tmpdir(), "helix-opencode-web-"))
    try {
      const harness = assembleOpenCodeHarness()
      const web = service<OpenCodeWebSurface>(harness.hooks.services, "opencode.web")
      const outputPath = web.write({ outDir })

      expect(web.kind).toBe("opencode-web")
      expect(web.launchPlan({ hostname: "127.0.0.1", port: 4096, passwordSet: true })).toMatchObject({
        command: "web",
        warningWhenPasswordMissing: false,
        display: { webInterface: "http://127.0.0.1:4096" },
      })
      expect(web.render()).toContain('data-opencode-web="ready"')
      expect(readFileSync(outputPath, "utf8")).toContain("OpenCode Web Cockpit")
    } finally {
      rmSync(outDir, { recursive: true, force: true })
    }
  })

  it("smokes OpenCode Desktop as its own product shell", () => {
    const outDir = mkdtempSync(join(tmpdir(), "helix-opencode-desktop-"))
    try {
      const harness = assembleOpenCodeHarness()
      const desktop = service<OpenCodeDesktopSurface>(harness.hooks.services, "opencode.desktop")
      const bundle = desktop.writeBundle({ outDir })

      expect(desktop.kind).toBe("opencode-desktop")
      expect(desktop.manifest()).toMatchObject({
        appID: "dev.opencode.helix",
        protocolHandlers: expect.arrayContaining(["opencode://workspace"]),
      })
      expect(desktop.runtimeProjection({ packaged: true, channel: "prod" })).toMatchObject({
        appID: "ai.opencode.desktop",
        environment: expect.objectContaining({ OPENCODE_CLIENT: "desktop" }),
        mainWindow: expect.objectContaining({ rendererURL: "oc://renderer/index.html" }),
      })
      expect(JSON.parse(readFileSync(bundle.manifestPath, "utf8"))).toMatchObject({ appName: "OpenCode" })
      expect(readFileSync(bundle.shellPath, "utf8")).toContain('data-opencode-desktop-shell="ready"')
    } finally {
      rmSync(outDir, { recursive: true, force: true })
    }
  })

  it("smokes OpenCode Slack as its own product shell", async () => {
    const harness = assembleOpenCodeHarness()
    const slack = service<OpenCodeSlackSurface>(harness.hooks.services, "opencode.slack")

    expect(slack.kind).toBe("opencode-slack")
    expect(slack.manifest()).toMatchObject({
      product: "opencode",
      framework: "@slack/bolt",
      socketMode: true,
      commands: ["/test"],
      events: expect.arrayContaining(["message", "message.part.updated"]),
    })
    expect(slack.home()).toMatchObject({ text: "OpenCode Slack bot is ready." })
    await expect(slack.handleCommand({ text: "/test", userID: "U1", channelID: "C1" })).resolves.toMatchObject({
      response_type: "ephemeral",
      text: "Bot is working! I can hear you loud and clear.",
    })
    harness.hooks.services.set("opencode.sdk.default-provider", surfaceProvider("opencode slack ok"))
    await expect(slack.handleMessage({
      channelID: "C1",
      ts: "1710000000.000100",
      threadTS: "1710000000.000100",
      userID: "U1",
      text: "hello from slack",
    })).resolves.toMatchObject({
      ok: true,
      session: expect.objectContaining({ key: "C1-1710000000.000100" }),
      response: expect.objectContaining({
        kind: "assistant-response",
        text: expect.stringContaining("opencode slack ok"),
      }),
    })
    await expect(slack.handleToolUpdate({
      sessionID: slack.sessions()[0]!.sessionID,
      tool: "bash",
      title: "Command completed",
      status: "completed",
    })).resolves.toMatchObject({
      kind: "tool-update",
      text: "*bash* - Command completed",
    })
  })

  it("smokes OpenCode server as its own product shell", async () => {
    const harness = assembleOpenCodeHarness()
    const createServer = service<(input?: { provider?: ReturnType<typeof surfaceProvider> }) => OpenCodeServer>(harness.hooks.services, "opencode.server.factory")
    const server = createServer({ provider: surfaceProvider("opencode server ok") })
    try {
      expect(server.kind).toBe("opencode-server")
      expect(server.routes).toContain("GET /health")
      expect(server.routes).toContain("POST /v1/run")
      expect(server.routes).not.toContain("POST /v1/run/fake")
      const { url } = await server.listen()
      await expect(fetchJSON(`${url}/health`)).resolves.toMatchObject({ ok: true, product: "opencode" })
      await expect(fetchJSON(`${url}/v1/control-plane`)).resolves.toMatchObject({
        routes: expect.arrayContaining(["POST /v1/run"]),
      })
      await expect(fetchJSON(`${url}/v1/run/fake`)).rejects.toThrow(/HTTP 404/)
      const run = await fetchJSON(`${url}/v1/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "hello from opencode server" }),
      })
      expect(JSON.stringify(run)).toContain("opencode server ok")
    } finally {
      await server.close()
    }
  })

  it("smokes Pi SDK as its own product shell", async () => {
    const fixture = createPiFixture()
    try {
      const sdk = service<PiSDK>(fixture.harness.hooks.services, "pi.sdk")

      expect(sdk.kind).toBe("pi-sdk")
      expect(sdk.workspace()).toMatchObject({ product: "pi-mono", recipeID: "pi-mono" })
      expect(sdk.graph().map((module) => module.id)).toEqual(expect.arrayContaining(["pi.product-shell.sdk", "pi.product-shell.package-manager"]))
      const result = await sdk.runTurn({ text: "hello from pi sdk", provider: surfaceProvider("pi sdk ok") })
      expect(JSON.stringify(result.assistantMessage.parts)).toContain("pi sdk ok")
      await expect(sdk.getSession(result.session.id)).resolves.toMatchObject({
        session: expect.objectContaining({ id: result.session.id }),
        transcript: expect.arrayContaining([expect.objectContaining({ role: "assistant" })]),
      })
    } finally {
      fixture.cleanup()
    }
  })

  it("smokes Pi CLI as its own product shell", async () => {
    const fixture = createPiFixture()
    try {
      const cli = service<PiCLISurface>(fixture.harness.hooks.services, "pi.cli")

      expect(cli.kind).toBe("pi-cli")
      expect(cli.commands().map((command) => command.name)).toContain("packages")
      expect(cli.renderHelp()).toContain("Pi Mono CLI")
      await expect(cli.run({ prompt: "hello from pi cli", provider: surfaceProvider("pi cli ok"), json: true })).resolves.toContain("pi cli ok")
    } finally {
      fixture.cleanup()
    }
  })

  it("smokes Pi TUI as its own product shell", () => {
    const fixture = createPiFixture()
    try {
      const tui = service<PiTUISurface>(fixture.harness.hooks.services, "pi.tui")

      expect(tui.kind).toBe("pi-tui")
      expect(tui.snapshot()).toMatchObject({ product: "pi-mono", title: "Pi Mono" })
      expect(tui.render()).toContain("Pi Mono TUI")
      expect(tui.dispatch({ type: "select", target: "theme", value: "light" })).toMatchObject({
        handled: true,
        snapshot: expect.objectContaining({ theme: "light" }),
      })
    } finally {
      fixture.cleanup()
    }
  })

  it("smokes Pi RPC as its own product shell", async () => {
    const fixture = createPiFixture()
    try {
      const rpc = service<PiRPCSurface>(fixture.harness.hooks.services, "pi.rpc")

      expect(rpc.kind).toBe("pi-rpc")
      expect(rpc.methods()).toEqual(expect.arrayContaining(["workspace.snapshot", "package.plan", "release.verify"]))
      expect(rpc.methods()).not.toContain("run.fake")
      expect(rpc.methods()).not.toContain("run.turn")
      await expect(rpc.call("workspace.snapshot")).resolves.toMatchObject({ product: "pi-mono", recipeID: "pi-mono" })
      await expect(rpc.call("run.fake", { text: "hello from pi rpc" })).rejects.toThrow("Unknown pi.rpc method: run.fake")
    } finally {
      fixture.cleanup()
    }
  })

  it("smokes Pi Web UI as its own product shell", () => {
    const fixture = createPiFixture()
    try {
      const webUI = service<PiWebUISurface>(fixture.harness.hooks.services, "pi.web-ui")
      const outputPath = webUI.write({ outDir: fixture.cwd })

      expect(webUI.kind).toBe("pi-web-ui")
      expect(webUI.render()).toContain('data-pi-web-ui="ready"')
      expect(webUI.render()).toContain('id="session-data" type="application/json"')
      expect(webUI.render()).toContain('data-pi-web-export="session-html"')
      expect(readFileSync(outputPath, "utf8")).toContain("Pi Mono Workbench")
    } finally {
      fixture.cleanup()
    }
  })

  it("smokes Pi server as its own product shell", async () => {
    const fixture = createPiFixture()
    const createServer = service<(input?: { provider?: ReturnType<typeof surfaceProvider> }) => PiServer>(fixture.harness.hooks.services, "pi.server.factory")
    const server = createServer({ provider: surfaceProvider("pi server surface ok") })
    try {
      expect(server.kind).toBe("pi-server")
      expect(server.routes).toContain("GET /health")
      const { url } = await server.listen()
      await expect(fetchJSON(`${url}/health`)).resolves.toMatchObject({ ok: true, product: "pi-mono" })
      await expect(fetchText(`${url}/v1/web`)).resolves.toContain('data-pi-web-ui="ready"')
      const run = await fetchJSON(`${url}/v1/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "hello from pi server run" }),
      })
      expect(JSON.stringify(run)).toContain("pi server surface ok")
      const rpcRun = await fetchJSON(`${url}/v1/rpc`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ method: "run.turn", params: { text: "hello from pi rpc run" } }),
      })
      expect(JSON.stringify(rpcRun)).toContain("pi server surface ok")
    } finally {
      await server.close()
      fixture.cleanup()
    }
  })

  it("smokes Pi package manager as its own product shell", async () => {
    const fixture = createPiFixture()
    try {
      const packageManager = service<PiPackageManager>(fixture.harness.hooks.services, "pi.package-manager")
      const plan = packageManager.plan()

      expect(packageManager.kind).toBe("pi-package-manager")
      expect(plan.packages).toEqual([expect.objectContaining({ id: "@example/pi-package", role: "package", kind: "npm" })])
      expect(plan.extensions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "@example/pi-extension", role: "extension", kind: "npm" }),
          expect.objectContaining({ spec: "./local-extension.ts", kind: "local", path: join(fixture.cwd, "local-extension.ts") }),
        ]),
      )
      expect(packageManager.shrinkwrap().packages.map((pkg) => pkg.spec)).toEqual(
        expect.arrayContaining(["npm:@example/pi-package", "npm:@example/pi-extension", "./local-extension.ts"]),
      )

      const loaded = await packageManager.loadExtensions({
        importer: async (specifier) => ({
          default: (pi: { registerFlag(name: string, options: { type: string; default: boolean }): void }) => {
            pi.registerFlag(`loaded-${String(specifier).replace(/[^a-z0-9]+/gi, "-").slice(-24)}`, { type: "boolean", default: true })
          },
        }),
      })
      expect(loaded.length).toBe(plan.extensions.length)
      for (const extension of loaded) await extension.dispose()
    } finally {
      fixture.cleanup()
    }
  })

  it("smokes Pi extension examples as their own product shell", () => {
    const fixture = createPiFixture()
    try {
      const examples = service<PiExtensionExamples>(fixture.harness.hooks.services, "pi.extension-examples")
      const paths = examples.materialize({ outDir: fixture.cwd })

      expect(examples.kind).toBe("pi-extension-examples")
      expect(examples.list().map((example) => example.path)).toEqual(
        expect.arrayContaining(["extensions/uppercase.ts", "extensions/session-labeler.ts", "extensions/provider-registration.ts"]),
      )
      expect(paths.map((path) => path.slice(fixture.cwd.length + 1))).toContain("extensions/uppercase.ts")
      expect(readFileSync(join(fixture.cwd, "extensions", "uppercase.ts"), "utf8")).toContain("defineExtension")
    } finally {
      fixture.cleanup()
    }
  })

  it("smokes Pi browser smoke as its own product shell", () => {
    const fixture = createPiFixture()
    try {
      const browserSmoke = service<PiBrowserSmoke>(fixture.harness.hooks.services, "pi.browser-smoke")
      const outputPath = browserSmoke.write({ outDir: fixture.cwd })

      expect(browserSmoke.kind).toBe("pi-browser-smoke")
      expect(browserSmoke.render()).toContain('data-pi-browser-smoke="ready"')
      expect(browserSmoke.render()).toContain('data-pi-browser-smoke-entry="scripts/browser-smoke-entry.ts"')
      expect(browserSmoke.render()).toContain("esbuild:browser:esm")
      expect(readFileSync(outputPath, "utf8")).toContain("pi.product-shell.package-manager")
    } finally {
      fixture.cleanup()
    }
  })

  it("smokes Pi release hardening as its own product shell", () => {
    const fixture = createPiFixture()
    try {
      const release = service<PiReleaseHardening>(fixture.harness.hooks.services, "pi.release-hardening")
      const shrinkwrapPath = release.writeShrinkwrap({ outDir: fixture.cwd })

      expect(release.kind).toBe("pi-release-hardening")
      expect(release.snapshot()).toMatchObject({
        product: "pi-mono",
        browserSmoke: { dataAttribute: "data-pi-browser-smoke", entryPoint: "scripts/browser-smoke-entry.ts", platform: "browser" },
        webExport: { dataAttribute: "data-pi-web-ui", sessionDataElementID: "session-data", encoding: "base64-json" },
        releasePolicy: {
          localReleaseScript: "npm run release:local",
          shrinkwrapScript: "npm run shrinkwrap:coding-agent",
          outputDirectoryPolicy: "outside-repository",
        },
      })
      expect(release.verify()).toMatchObject({ ok: true })
      expect(JSON.parse(readFileSync(shrinkwrapPath, "utf8"))).toMatchObject({
        product: "pi-mono",
        lockfileVersion: 1,
        generatedBy: "helix",
      })
    } finally {
      fixture.cleanup()
    }
  })

  it("smokes Nanobot SDK as its own product shell", async () => {
    const harness = assembleNanobotHarness()
    const sdk = service<NanobotSDK>(harness.hooks.services, "nanobot.sdk")

    expect(sdk.kind).toBe("nanobot-sdk")
    expect(sdk.workspace()).toMatchObject({ product: "nanobot", recipeID: "nanobot" })
    expect(sdk.graph().map((module) => module.id)).toEqual(expect.arrayContaining(["nanobot.product-shell.sdk", "nanobot.product-shell.cli"]))
    const result = await sdk.runTurn({ text: "hello from nanobot sdk", provider: surfaceProvider("nanobot sdk ok") })
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("nanobot sdk ok")
    await expect(sdk.getSession(result.session.id)).resolves.toMatchObject({
      session: expect.objectContaining({ id: result.session.id }),
      transcript: expect.arrayContaining([expect.objectContaining({ role: "assistant" })]),
    })
  })

  it("smokes Nanobot CLI/TUI/Web UI as product shells", async () => {
    const harness = assembleNanobotHarness()
    const cli = service<NanobotCLISurface>(harness.hooks.services, "nanobot.cli")
    const tui = service<NanobotTUISurface>(harness.hooks.services, "nanobot.tui")
    const webUI = service<NanobotWebUISurface>(harness.hooks.services, "nanobot.web-ui")

    expect(cli.kind).toBe("nanobot-cli")
    expect(cli.commands().map((command) => command.name)).toEqual(expect.arrayContaining(["agent", "serve", "gateway"]))
    expect(cli.renderHelp()).toContain("Nanobot CLI")
    await expect(cli.run({ prompt: "hello from nanobot cli", provider: surfaceProvider("nanobot cli ok"), json: true })).resolves.toContain("nanobot cli ok")
    expect(tui.kind).toBe("nanobot-tui")
    expect(tui.render()).toContain("Nanobot TUI")
    expect(tui.dispatch({ type: "select", target: "theme", value: "dark" })).toMatchObject({
      handled: true,
      snapshot: expect.objectContaining({ theme: "dark" }),
    })
    expect(webUI.kind).toBe("nanobot-web-ui")
    expect(webUI.render()).toContain('data-nanobot-web-ui="ready"')
    expect(webUI.render()).toContain('id="nanobot-webui-bootstrap" type="application/json"')
    expect(webUI.render()).toContain('data-nanobot-webui-route="GET /webui/bootstrap"')
  })

  it("smokes Nanobot server as its own product shell", async () => {
    const harness = assembleNanobotHarness()
    const createServer = service<(input?: { provider?: ReturnType<typeof surfaceProvider> }) => NanobotServer>(harness.hooks.services, "nanobot.server.factory")
    const server = createServer({ provider: surfaceProvider("nanobot server ok") })
    try {
      expect(server.kind).toBe("nanobot-server")
      expect(server.routes).toContain("GET /health")
      expect(server.routes).toEqual(expect.arrayContaining([
        "GET /v1/models",
        "POST /v1/chat/completions",
        "GET /webui/bootstrap",
        "GET /api/sessions",
        "GET /api/settings",
        "GET /api/commands",
      ]))
      const { url } = await server.listen()
      await expect(fetchJSON(`${url}/health`)).resolves.toMatchObject({ status: "ok", ok: true, product: "nanobot" })
      await expect(fetchText(`${url}/v1/web`)).resolves.toContain('data-nanobot-web-ui="ready"')
      await expect(fetchJSON(`${url}/v1/models`)).resolves.toMatchObject({ object: "list", data: [expect.objectContaining({ id: "nanobot", object: "model", owned_by: "nanobot" })] })
      await expect(fetchJSON(`${url}/webui/bootstrap`)).resolves.toMatchObject({ token: "harness-local-token", ws_path: "/", expires_in: 300, model_name: "nanobot" })
      await expect(fetchJSON(`${url}/api/commands`)).resolves.toMatchObject({ commands: expect.arrayContaining([expect.objectContaining({ name: "agent" })]) })
      await expect(fetchJSON(`${url}/v1/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: "nanobot", messages: [{ role: "user", content: "hello from nanobot chat completions" }] }),
      })).resolves.toMatchObject({
        object: "chat.completion",
        model: "nanobot",
        choices: [expect.objectContaining({ message: expect.objectContaining({ role: "assistant", content: expect.stringContaining("nanobot server ok") }), finish_reason: "stop" })],
      })
      const stream = await fetchText(`${url}/v1/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: "nanobot", stream: true, messages: [{ role: "user", content: "hello from nanobot streaming chat completions" }] }),
      })
      expect(stream).toContain("chat.completion.chunk")
      expect(stream).toContain("data: [DONE]")
      const run = await fetchText(`${url}/v1/agent`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: "hello from nanobot server" }),
      })
      expect(run).toContain("nanobot server ok")
    } finally {
      await server.close()
    }
  })

  it("smokes Hermes Agent SDK/CLI/ACP/gateway/API server as product shells", async () => {
    const harness = assembleHermesAgentHarness()
    const sdk = service<HermesSDK>(harness.hooks.services, "hermes.sdk")
    const cli = service<HermesCLISurface>(harness.hooks.services, "hermes.cli")
    const tui = service<HermesTUISurface>(harness.hooks.services, "hermes.tui")
    const acp = service<HermesACPSurface>(harness.hooks.services, "hermes.acp")
    const gateway = service<HermesGatewaySurface>(harness.hooks.services, "hermes.gateway")
    const dashboard = service<HermesWebDashboardSurface>(harness.hooks.services, "hermes.web-dashboard")
    const createServer = service<(input?: { provider?: ReturnType<typeof surfaceProvider> }) => HermesAPIServer>(harness.hooks.services, "hermes.api-server.factory")

    expect(sdk.kind).toBe("hermes-sdk")
    expect(sdk.workspace()).toMatchObject({ product: "hermes-agent", recipeID: "hermes-agent" })
    const sdkRun = await sdk.runTurn({ text: "hello from hermes sdk", provider: surfaceProvider("hermes sdk ok") })
    expect(JSON.stringify(sdkRun.assistantMessage.parts)).toContain("hermes sdk ok")
    await expect(cli.run({ prompt: "hello from hermes cli", provider: surfaceProvider("hermes cli ok"), json: true })).resolves.toContain("hermes cli ok")
    expect(tui.kind).toBe("hermes-tui")
    expect(tui.render()).toContain("Hermes Agent TUI")
    expect(dashboard.kind).toBe("hermes-web-dashboard")
    expect(dashboard.render()).toContain('data-hermes-dashboard="ready"')
    await expect(acp.call("session/prompt", { text: "hello without provider" })).rejects.toThrow("requires a live provider")
    await expect(gateway.dispatch({ platform: "test", text: "hello from hermes gateway", provider: surfaceProvider("hermes gateway ok") })).resolves.toMatchObject({
      text: expect.stringContaining("hermes gateway ok"),
    })

    const server = createServer({ provider: surfaceProvider("hermes api ok") })
    try {
      expect(server.kind).toBe("hermes-api-server")
      expect(server.routes).toEqual(expect.arrayContaining(["GET /health", "GET /v1/capabilities", "GET /v1/models", "GET /v1/dashboard", "GET /v1/tui", "POST /v1/chat/completions", "POST /v1/acp", "POST /v1/gateway"]))
      const { url } = await server.listen()
      await expect(fetchJSON(`${url}/health`)).resolves.toMatchObject({ status: "ok", ok: true, platform: "hermes-agent", product: "hermes-agent" })
      await expect(fetchJSON(`${url}/v1/capabilities`)).resolves.toMatchObject({
        object: "hermes.api_server.capabilities",
        product: "hermes-agent",
        routes: expect.arrayContaining(["hermes.tui", "hermes.web-dashboard"]),
        features: expect.objectContaining({ chat_completions: true, chat_completions_streaming: true }),
      })
      await expect(fetchJSON(`${url}/v1/models`)).resolves.toMatchObject({ object: "list", data: [expect.objectContaining({ id: "hermes-agent", object: "model", owned_by: "hermes", root: "hermes-agent" })] })
      await expect(fetchText(`${url}/v1/dashboard`)).resolves.toContain('data-hermes-dashboard="ready"')
      await expect(fetchText(`${url}/v1/tui`)).resolves.toContain("Hermes Agent TUI")
      await expect(fetchJSON(`${url}/v1/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: "hermes-agent", messages: [{ role: "user", content: "hello from hermes api" }] }),
      })).resolves.toMatchObject({
        object: "chat.completion",
        model: "hermes-agent",
        choices: [expect.objectContaining({ message: expect.objectContaining({ role: "assistant", content: expect.stringContaining("hermes api ok") }), finish_reason: "stop" })],
      })
      const stream = await fetchText(`${url}/v1/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: "hermes-agent", stream: true, messages: [{ role: "user", content: "hello from hermes streaming api" }] }),
      })
      expect(stream).toContain("chat.completion.chunk")
      expect(stream).toContain("data: [DONE]")
      expect(JSON.stringify(await fetchJSON(`${url}/v1/acp`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ method: "session/prompt", params: { text: "hello from hermes acp" } }),
      }))).toContain("hermes api ok")
      await expect(fetchJSON(`${url}/v1/gateway`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ platform: "api", text: "hello from hermes gateway server" }),
      })).resolves.toMatchObject({ text: expect.stringContaining("hermes api ok") })
    } finally {
      await server.close()
    }
  })

  it("records product shell transcript positive and negative gates", () => {
    const snapshot = buildProductShellTranscriptGateSnapshot()
    const verification = verifyProductShellTranscriptGateSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:product-shell-transcript-gate",
      fixtureID: "product-shell:cli-api-pty-transcript-gate",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: [
        "command-route",
        "error-path",
        "pty-api-transcript",
        "session-readback",
        "surface-state",
      ],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-product-shell:source-matrix",
      transcriptRisk: "source-anchored-partial",
      commandRoute: expect.arrayContaining(["SDK runTurn product command route", "server POST /v1/run API route"]),
      errorPath: expect.arrayContaining(["server rejects POST /v1/run/fake with HTTP 404"]),
      ptyApiTranscript: expect.arrayContaining(["TUI render OpenCode TUI", "TUI dispatch submit input event"]),
      sessionReadback: expect.arrayContaining(["SDK getSession transcript assistant readback"]),
      fixtureIDs: expect.arrayContaining([
        "product-shell:cli-api-pty-transcript-gate",
        "opencode-product-shell:source-matrix",
        "opencode-product-shell:native-exact-fixture",
      ]),
      knownLossiness: expect.arrayContaining(["opencode-product-shell-source-matrix-partial-fixture", "native-shell-transcript-not-replayed"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")).toMatchObject({
      fixtureID: "pi-product-shell:source-matrix",
      commandRoute: expect.arrayContaining(["CLI run --json product command route", "server POST /v1/rpc run.turn route"]),
      errorPath: expect.arrayContaining(["RPC rejects run.fake unknown method"]),
      surfaceState: expect.arrayContaining(["TUI snapshot theme state", "package manager shrinkwrap state"]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")).toMatchObject({
      fixtureID: "nanobot-product-shell:source-matrix",
      commandRoute: expect.arrayContaining(["CLI commands agent serve gateway route", "server POST /v1/agent API route"]),
      sessionReadback: expect.arrayContaining(["SDK getSession transcript assistant readback"]),
    })
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")).toMatchObject({
      fixtureID: "hermes-product-shell:source-matrix",
      commandRoute: expect.arrayContaining(["ACP session/prompt method route", "API server POST /v1/chat/completions route"]),
      errorPath: expect.arrayContaining(["ACP session/prompt rejects missing provider with requires a live provider"]),
      ptyApiTranscript: expect.arrayContaining(["API server /v1/tui returns TUI transcript text", "dashboard render data-hermes-dashboard ready"]),
    })

    const commandRouteDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, commandRoute: [] }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptGateSnapshot(commandRouteDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript.command-route",
        product: "opencode",
        dimension: "command-route",
      }),
    ]))

    const ptyTranscriptDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, ptyApiTranscript: [] }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptGateSnapshot(ptyTranscriptDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript.pty-api-transcript",
        product: "pi-mono",
        dimension: "pty-api-transcript",
      }),
    ]))

    const sessionReadbackDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, sessionReadback: [] }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptGateSnapshot(sessionReadbackDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript.session-readback",
        product: "hermes-agent",
        dimension: "session-readback",
      }),
    ]))

    const commonShellOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, transcriptRisk: "common-shell-only" as const }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptGateSnapshot(commonShellOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript.common-shell-only",
        product: "nanobot",
        dimension: "pty-api-transcript",
      }),
    ]))

    const borrowedSourceMatrix = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? {
              ...item,
              sourceMatrixID: "opencode" as const,
              fixtureID: "opencode-product-shell:source-matrix",
              transcriptRisk: "borrowed-opencode" as const,
            }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptGateSnapshot(borrowedSourceMatrix).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript.borrowed-source-matrix",
        product: "pi-mono",
        dimension: "command-route",
      }),
    ]))
  })

  it("records product shell transcript exact-diff blockers while promoting OpenCode to native exact", () => {
    const snapshot = buildProductShellTranscriptExactDiffBlockerSnapshot()
    const verification = verifyProductShellTranscriptExactDiffBlockerSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:product-shell-transcript-exact-diff-blocker-gate",
      fixtureID: "product-shell:cli-api-pty-transcript-exact-diff-blocker-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: [
        "command-route",
        "error-path",
        "pty-api-transcript",
        "session-readback",
        "surface-state",
      ],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: openCodeProductShellNativeExactFixtureID,
      exactDiffStatus: "native-exact",
      coverageStatus: "native",
      nativeParityClaim: true,
      exactDiffRisk: "native-exact",
      commandRoute: expect.arrayContaining(["SDK runTurn product command route", "server POST /v1/run API route"]),
      errorPath: expect.arrayContaining(["server rejects POST /v1/run/fake with HTTP 404"]),
      ptyApiTranscript: expect.arrayContaining(["TUI render OpenCode TUI", "TUI dispatch submit input event"]),
      sessionReadback: expect.arrayContaining(["SDK getSession transcript assistant readback"]),
      surfaceState: expect.arrayContaining(["workspace snapshot product opencode recipeID opencode"]),
      nativeEvidenceRefs: expect.arrayContaining([
        "opencode-product-shell:source-matrix",
        "conformance:opencode-product-shell-source-matrix",
        openCodeProductShellNativeExactEvidenceRef,
        openCodeProductShellNativeExactReplayRef,
      ]),
      fixtureIDs: expect.arrayContaining([openCodeProductShellNativeExactFixtureID]),
      previewDemotion: [],
      knownLossiness: [],
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")).toMatchObject({
      fixtureID: "pi-product-shell:source-matrix",
      commandRoute: expect.arrayContaining(["CLI run --json product command route", "shell-command-route-native-dispatch:exact-diff-not-proven"]),
      surfaceState: expect.arrayContaining(["package manager shrinkwrap state", "shell-surface-state-native-side-effects:exact-diff-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.sessionReadback).toEqual(expect.arrayContaining([
      "SDK getSession transcript assistant readback",
      "shell-session-readback-native-storage:exact-diff-not-proven",
    ]))
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")?.ptyApiTranscript).toEqual(expect.arrayContaining([
      "API server /v1/tui returns TUI transcript text",
      "shell-pty-api-transcript-native-stream:exact-diff-not-proven",
    ]))

    const commandRouteDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, commandRoute: [] }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptExactDiffBlockerSnapshot(commandRouteDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript-exact-diff.command-route",
        product: "opencode",
        dimension: "command-route",
      }),
    ]))

    const errorPathDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, errorPath: [] }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptExactDiffBlockerSnapshot(errorPathDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript-exact-diff.error-path",
        product: "hermes-agent",
        dimension: "error-path",
      }),
    ]))

    const ptyTranscriptDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, ptyApiTranscript: [] }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptExactDiffBlockerSnapshot(ptyTranscriptDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript-exact-diff.pty-api-transcript",
        product: "pi-mono",
        dimension: "pty-api-transcript",
      }),
    ]))

    const sessionReadbackDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, sessionReadback: [] }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptExactDiffBlockerSnapshot(sessionReadbackDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript-exact-diff.session-readback",
        product: "nanobot",
        dimension: "session-readback",
      }),
    ]))

    const surfaceStateDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, surfaceState: [] }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptExactDiffBlockerSnapshot(surfaceStateDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript-exact-diff.surface-state",
        product: "opencode",
        dimension: "surface-state",
      }),
    ]))

    const nativeClaim = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeParityClaim: false }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptExactDiffBlockerSnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript-exact-diff.native-claim",
        product: "opencode",
        dimension: "command-route",
      }),
    ]))

    const nativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeEvidenceRefs: [] }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptExactDiffBlockerSnapshot(nativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript-exact-diff.native-exact-evidence",
        product: "opencode",
        dimension: "pty-api-transcript",
      }),
    ]))

    const commonShellOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, exactDiffRisk: "common-shell-only" as const }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptExactDiffBlockerSnapshot(commonShellOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript-exact-diff.common-shell-only",
        product: "pi-mono",
        dimension: "pty-api-transcript",
      }),
    ]))

    const borrowedSourceMatrix = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? {
              ...item,
              sourceMatrixID: "opencode" as const,
              fixtureID: "opencode-product-shell:source-matrix",
              exactDiffRisk: "borrowed-opencode" as const,
            }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptExactDiffBlockerSnapshot(borrowedSourceMatrix).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript-exact-diff.borrowed-source-matrix",
        product: "hermes-agent",
        dimension: "command-route",
      }),
    ]))
  })

  it("records product shell transcript pinned replay fixtures with OpenCode native exact coverage", () => {
    const snapshot = buildProductShellTranscriptPinnedReplaySnapshot()
    const verification = verifyProductShellTranscriptPinnedReplaySnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:product-shell-transcript-pinned-replay-gate",
      fixtureID: "product-shell:cli-api-pty-transcript-pinned-replay-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: [
        "command-route",
        "error-path",
        "pty-api-transcript",
        "session-readback",
        "surface-state",
      ],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: openCodeProductShellNativeExactFixtureID,
      exactDiffStatus: "native-exact",
      coverageStatus: "native",
      nativeParityClaim: true,
      exactDiffRisk: "native-exact",
      upstreamTranscript: expect.arrayContaining([
        expect.objectContaining({ surfaceServiceID: "opencode.server", commandRoute: "POST /v1/run", stdout: "opencode server ok" }),
        expect.objectContaining({ surfaceServiceID: "opencode.server", commandRoute: "POST /v1/run/fake", statusCode: 404 }),
        expect.objectContaining({ surfaceServiceID: "opencode.tui", commandRoute: "TUI submit", surfaceState: expect.objectContaining({ focus: "chat" }) }),
      ]),
      productTranscript: expect.arrayContaining([
        expect.objectContaining({ sessionID: "ses_oc_1", readbackText: "assistant:opencode server ok" }),
      ]),
      assembledTranscript: expect.arrayContaining([
        expect.objectContaining({ recordID: "opencode-shell-transcript-3", transcriptText: "assistant:hello from opencode tui" }),
      ]),
      fixtureIDs: expect.arrayContaining(["product-shell:cli-api-pty-transcript-gate", "opencode-product-shell:source-matrix", openCodeProductShellNativeExactFixtureID]),
      sourceAnchors: expect.arrayContaining([
        "conformance:opencode-product-shell-source-matrix",
        openCodeProductShellNativeExactEvidenceRef,
        openCodeProductShellNativeExactReplayRef,
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeProductShellNativeExactEvidenceRef,
        openCodeProductShellNativeExactReplayRef,
      ]),
      knownLossiness: [],
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")).toMatchObject({
      upstreamTranscript: expect.arrayContaining([
        expect.objectContaining({ surfaceServiceID: "pi.cli", commandRoute: "CLI run --json", statusCode: 0 }),
        expect.objectContaining({ surfaceServiceID: "pi.rpc", commandRoute: "RPC run.fake", errorMessage: "Unknown pi.rpc method: run.fake" }),
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")).toMatchObject({
      upstreamTranscript: expect.arrayContaining([
        expect.objectContaining({ surfaceServiceID: "nanobot.server", commandRoute: "POST /v1/agent", stdout: "nanobot server ok" }),
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")).toMatchObject({
      upstreamTranscript: expect.arrayContaining([
        expect.objectContaining({ surfaceServiceID: "hermes.acp", commandRoute: "ACP session/prompt", stderr: "requires a live provider" }),
        expect.objectContaining({ surfaceServiceID: "hermes.tui", commandRoute: "GET /v1/tui", stdout: "Hermes Agent TUI" }),
      ]),
    })

    const commandRouteDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              productTranscript: item.productTranscript.map((record, index) =>
                index === 0
                  ? { ...record, commandRoute: "POST /v1/wrong" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptPinnedReplaySnapshot(commandRouteDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript-pinned-replay.command-route",
        product: "opencode",
        dimension: "command-route",
      }),
    ]))

    const errorPathDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? {
              ...item,
              productTranscript: item.productTranscript.map((record, index) =>
                index === 1
                  ? { ...record, statusCode: 500 }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptPinnedReplaySnapshot(errorPathDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript-pinned-replay.error-path",
        product: "hermes-agent",
        dimension: "error-path",
      }),
    ]))

    const transcriptDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? {
              ...item,
              assembledTranscript: item.assembledTranscript.map((record, index) =>
                index === 0
                  ? { ...record, stdout: "pi cli wrong" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptPinnedReplaySnapshot(transcriptDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript-pinned-replay.pty-api-transcript",
        product: "pi-mono",
        dimension: "pty-api-transcript",
      }),
    ]))

    const sessionReadbackDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? {
              ...item,
              productTranscript: item.productTranscript.map((record, index) =>
                index === 1
                  ? { ...record, readbackText: "assistant:wrong" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptPinnedReplaySnapshot(sessionReadbackDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript-pinned-replay.session-readback",
        product: "nanobot",
        dimension: "session-readback",
      }),
    ]))

    const surfaceStateDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              assembledTranscript: item.assembledTranscript.map((record, index) =>
                index === 2
                  ? { ...record, surfaceState: { ...record.surfaceState, focus: "wrong" } }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptPinnedReplaySnapshot(surfaceStateDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript-pinned-replay.surface-state",
        product: "opencode",
        dimension: "surface-state",
      }),
    ]))

    const nativeClaim = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeParityClaim: false }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptPinnedReplaySnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript-pinned-replay.native-claim",
        product: "opencode",
        dimension: "command-route",
      }),
    ]))

    const nativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeEvidenceRefs: [] }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptPinnedReplaySnapshot(nativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript-pinned-replay.native-exact-evidence",
        product: "opencode",
        dimension: "pty-api-transcript",
      }),
    ]))

    const commonShellOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, exactDiffRisk: "common-shell-only" as const }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptPinnedReplaySnapshot(commonShellOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript-pinned-replay.common-shell-only",
        product: "pi-mono",
        dimension: "pty-api-transcript",
      }),
    ]))

    const borrowedSourceMatrix = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? {
              ...item,
              sourceMatrixID: "opencode" as const,
              fixtureID: "opencode-product-shell:source-matrix",
              exactDiffRisk: "borrowed-opencode" as const,
            }
          : item,
      ),
    }
    expect(verifyProductShellTranscriptPinnedReplaySnapshot(borrowedSourceMatrix).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "product-shell-transcript-pinned-replay.borrowed-source-matrix",
        product: "hermes-agent",
        dimension: "command-route",
      }),
    ]))
  })

  it("runs provider-backed who-are-you smoke through public CLI and server surfaces", async () => {
    const opencode = assembleOpenCodeHarness()
    const nanobot = assembleNanobotHarness()
    const hermes = assembleHermesAgentHarness()
    const pi = createPiFixture()

    try {
      const opencodeServerFactory = service<(input?: { provider?: ReturnType<typeof surfaceProvider> }) => OpenCodeServer>(
        opencode.hooks.services,
        "opencode.server.factory",
      )
      const piCli = service<PiCLISurface>(pi.harness.hooks.services, "pi.cli")
      const piServerFactory = service<(input?: { provider?: ReturnType<typeof surfaceProvider> }) => PiServer>(pi.harness.hooks.services, "pi.server.factory")
      const nanobotCli = service<NanobotCLISurface>(nanobot.hooks.services, "nanobot.cli")
      const nanobotServerFactory = service<(input?: { provider?: ReturnType<typeof surfaceProvider> }) => NanobotServer>(
        nanobot.hooks.services,
        "nanobot.server.factory",
      )
      const hermesCli = service<HermesCLISurface>(hermes.hooks.services, "hermes.cli")
      const hermesServerFactory = service<(input?: { provider?: ReturnType<typeof surfaceProvider> }) => HermesAPIServer>(
        hermes.hooks.services,
        "hermes.api-server.factory",
      )

      const opencodeProbe = surfaceProviderProbe("I am OpenCode.")
      const opencodeServer = opencodeServerFactory({ provider: opencodeProbe.provider })
      try {
        const { url } = await opencodeServer.listen()
        const body = await fetchJSON(`${url}/v1/run`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: "who are you" }),
        })
        assertProviderBackedIdentitySmoke(opencodeProbe, "You are opencode", body)
      } finally {
        await opencodeServer.close()
      }

      const piCliProbe = surfaceProviderProbe("I am Pi.")
      assertProviderBackedIdentitySmoke(
        piCliProbe,
        "You are actually not Claude, you are Pi",
        await piCli.run({ prompt: "who are you", provider: piCliProbe.provider, json: true }),
      )

      const piServerProbe = surfaceProviderProbe("I am Pi server.")
      const piServer = piServerFactory({ provider: piServerProbe.provider })
      try {
        const { url } = await piServer.listen()
        const body = await fetchJSON(`${url}/v1/run`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: "who are you" }),
        })
        assertProviderBackedIdentitySmoke(piServerProbe, "You are actually not Claude, you are Pi", body)
      } finally {
        await piServer.close()
      }

      const nanobotCliProbe = surfaceProviderProbe("I am Nanobot.")
      assertProviderBackedIdentitySmoke(
        nanobotCliProbe,
        "I am nanobot",
        await nanobotCli.run({ prompt: "who are you", provider: nanobotCliProbe.provider, json: true }),
      )

      const nanobotServerProbe = surfaceProviderProbe("I am Nanobot server.")
      const nanobotServer = nanobotServerFactory({ provider: nanobotServerProbe.provider })
      try {
        const { url } = await nanobotServer.listen()
        const body = await fetchText(`${url}/v1/agent`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt: "who are you" }),
        })
        assertProviderBackedIdentitySmoke(nanobotServerProbe, "I am nanobot", body)
      } finally {
        await nanobotServer.close()
      }

      const hermesCliProbe = surfaceProviderProbe("I am Hermes.")
      assertProviderBackedIdentitySmoke(
        hermesCliProbe,
        "You are Hermes Agent",
        await hermesCli.run({ prompt: "who are you", provider: hermesCliProbe.provider, json: true }),
      )

      const hermesServerProbe = surfaceProviderProbe("I am Hermes server.")
      const hermesServer = hermesServerFactory({ provider: hermesServerProbe.provider })
      try {
        const { url } = await hermesServer.listen()
        const body = await fetchText(`${url}/v1/chat/completions`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt: "who are you" }),
        })
        assertProviderBackedIdentitySmoke(hermesServerProbe, "You are Hermes Agent", body)
      } finally {
        await hermesServer.close()
      }
    } finally {
      pi.cleanup()
    }
  })
})

function service<T>(services: Map<string, unknown>, id: string): T {
  const value = services.get(id)
  if (!value) throw new Error(`Missing product surface service: ${id}`)
  return value as T
}

function createPiFixture(): { harness: ReturnType<typeof assemblePiMonoHarness>; cwd: string; cleanup(): void } {
  const root = mkdtempSync(join(tmpdir(), "helix-pi-surface-"))
  const cwd = join(root, "workspace")
  const storageDir = join(root, "storage")
  mkdirSync(cwd, { recursive: true })
  mkdirSync(storageDir, { recursive: true })
  return {
    cwd,
    harness: assemblePiMonoHarness({
      cwd,
      storageDir,
      projectConfig: {
        packages: ["npm:@example/pi-package"],
        extensions: ["npm:@example/pi-extension", "./local-extension.ts"],
      },
    }),
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  }
}

interface SurfaceProviderProbe {
  provider: ReturnType<typeof surfaceProvider>
  requests: Array<{ url: string; body: Record<string, unknown> }>
}

function surfaceProvider(text: string): ReturnType<typeof createOpenAICompatibleProvider> {
  return surfaceProviderProbe(text).provider
}

function surfaceProviderProbe(text: string): SurfaceProviderProbe {
  const requests: SurfaceProviderProbe["requests"] = []
  const transport = createMockSSEProviderTransport([
    `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`,
    'data: {"choices":[{"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":8,"completion_tokens":4}}\n\n',
    "data: [DONE]\n\n",
  ])
  const provider = createOpenAICompatibleProvider({
    id: "surface-test",
    models: [{ providerID: "surface-test", modelID: "surface-model" }],
    transport: {
      async fetch(url: string, init: ProviderFetchInit) {
        requests.push({ url, body: parseProviderRequestBody(init.body) })
        return transport.fetch(url, init)
      },
    },
  })
  return { provider, requests }
}

function assertProviderBackedIdentitySmoke(probe: SurfaceProviderProbe, systemMarker: string, output: unknown): void {
  const forbiddenHarnessIdentity = /\b(?:You are|I am|I'm|assistant is)\s+(?:a\s+)?(?:[a-z-]+\s+)?(?:compatible\s+)?Helix\b|compatible Helix/i
  expect(probe.requests).toHaveLength(1)
  expect(probe.requests[0]?.url).toBe("https://api.openai.com/v1/chat/completions")
  const messages = providerMessages(probe.requests[0]?.body)
  const systemText = messages.filter((message) => message.role === "system").map((message) => message.content).join("\n")
  const userText = messages.filter((message) => message.role === "user").map((message) => message.content).join("\n")
  const serializedOutput = typeof output === "string" ? output : JSON.stringify(output)

  expect(systemText).toContain(systemMarker)
  expect(systemText).not.toMatch(forbiddenHarnessIdentity)
  expect(userText).toContain("who are you")
  expect(serializedOutput).not.toMatch(forbiddenHarnessIdentity)
}

function parseProviderRequestBody(body: string): Record<string, unknown> {
  const parsed = JSON.parse(body) as unknown
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Expected provider request body object")
  return parsed as Record<string, unknown>
}

function providerMessages(body: Record<string, unknown> | undefined): Array<{ role: string; content: string }> {
  const messages = body?.messages
  if (!Array.isArray(messages)) throw new Error("Expected provider request messages")
  return messages.map((message) => {
    if (!message || typeof message !== "object" || Array.isArray(message)) throw new Error("Expected provider message object")
    const record = message as Record<string, unknown>
    return {
      role: typeof record.role === "string" ? record.role : "",
      content: typeof record.content === "string" ? record.content : JSON.stringify(record.content),
    }
  })
}

async function fetchJSON(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, init)
  if (response.status !== 200) throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  return response.json()
}

async function fetchText(url: string, init?: RequestInit): Promise<string> {
  const response = await fetch(url, init)
  if (response.status !== 200) throw new Error(`HTTP ${response.status}: ${await response.text()}`)
  return response.text()
}
