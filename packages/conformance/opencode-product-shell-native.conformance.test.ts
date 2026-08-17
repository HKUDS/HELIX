import { describe, expect, it } from "vitest"
import type { OpenCodeDesktopSurface, OpenCodeSDK, OpenCodeSDKEvent, OpenCodeServer, OpenCodeSlackSurface, OpenCodeTUISurface, OpenCodeWebSurface } from "@helix/adapters-opencode"
import {
  buildOpenCodeDesktopRuntimeProjection,
  buildOpenCodeHarnessAssemblyProjection,
  buildOpenCodeSlackBotBehaviorProjection,
  buildOpenCodeTUIAppProviderStack,
  buildOpenCodeTUISurfaceSnapshotProjection,
  buildOpenCodeControlPlaneSnapshotProjection,
  buildOpenCodeProductShellNativeExactFixture,
  buildOpenCodeProductShellSDKMethodList,
  buildOpenCodeProductShellServerBehaviorMatrix,
  buildOpenCodeProductShellServiceKeys,
  buildOpenCodeWebCommandProjection,
  buildOpenCodeWorkspaceSnapshotProjection,
  openCodeProductShellNativeDescriptors,
  openCodeProductShellNativeExactAtomIDs,
  openCodeProductShellNativeExactEvidenceRef,
  openCodeProductShellNativeExactFixtureID,
  openCodeProductShellNativeExactReplayRef,
  openCodeProductShellDesktopNativeExactAtomID,
  openCodeProductShellHarnessNativeExactAtomID,
  openCodeProductShellSlackNativeExactAtomID,
  openCodeProductShellTUINativeExactAtomID,
  openCodeProductShellWebNativeExactAtomID,
  openCodeTUIShellNativeExactAtomID,
  openCodeListenPortCandidates,
  openCodeServerCanPublishMDNS,
  projectOpenCodeTUIRunCommand,
  verifyOpenCodeProductShellNativeExactFixture,
} from "@helix/adapters-opencode/product-schema/product-shell"
import { createMockSSEProviderTransport, createOpenAICompatibleProvider, type ProviderFetchInit } from "@helix/lego-provider"
import { assembleOpenCodeHarness, buildAssemblyContract } from "@helix/recipes"

describe("OpenCode product-shell native exact conformance", () => {
  it("pins OpenCode SDK, server, and TUI product-shell atoms to upstream native behavior", () => {
    const fixture = buildOpenCodeProductShellNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomIDs: [...openCodeProductShellNativeExactAtomIDs],
      portID: "product.shell",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeProductShellNativeExactEvidenceRef,
        openCodeProductShellNativeExactReplayRef,
      ]),
      fixtureIDs: [openCodeProductShellNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "sdk-make-registry-and-agent-api",
      "sdk-session-prompt-subscribe-api",
      "server-default-app-listener-and-mdns",
      "server-cli-serve-command",
      "web-command-listen-open-browser",
      "desktop-electron-sidecar-renderer-shell",
      "harness-bootstrap-surface-registration",
      "workspace-snapshot-sdk-state",
      "control-plane-route-and-registry-snapshot",
      "tui-run-interactive-cli-gates",
      "tui-run-interactive-runtime-entrypoints",
      "tui-solid-app-renderer-sdk-event-stack",
      "tui-local-surface-snapshot-and-event-loop",
      "slack-bolt-socket-mode-thread-session-bot",
    ])
    expect(buildOpenCodeProductShellSDKMethodList()).toEqual([
      "OpenCode.make",
      "tool.add",
      "auth.add",
      "agent.add",
      "session.create",
      "session.prompt",
      "session.wait",
      "session.messages",
      "subscribe",
    ])
    expect(buildOpenCodeProductShellServiceKeys()).toEqual(["opencode.control-plane", "opencode.desktop", "opencode.harness", "opencode.sdk", "opencode.server.factory", "opencode.slack", "opencode.tui", "opencode.web", "opencode.workspace"])
    expect(buildOpenCodeProductShellServerBehaviorMatrix()).toMatchObject({
      defaultApp: ["fetch(request)", "request(input, init)"],
      portZeroCandidates: [4096, 0],
      explicitPortCandidates: [5511],
      loopbackMdnsPublish: false,
      nonLoopbackMdnsPublish: true,
      listenerURL: "http://127.0.0.1:4096",
      stopSignature: "stop(close?: boolean)",
    })
    expect(buildOpenCodeWebCommandProjection({
      hostname: "0.0.0.0",
      port: 0,
      resolvedPort: 4096,
      mdns: true,
      mdnsDomain: "open-code.local",
      passwordSet: false,
      networkInterfaces: [
        { address: "127.0.0.1", family: "IPv4", internal: true },
        { address: "172.18.0.4", family: "IPv4", internal: false },
        { address: "192.0.2.10", family: "IPv4", internal: false },
      ],
    })).toMatchObject({
      product: "opencode",
      command: "web",
      instance: false,
      warningWhenPasswordMissing: true,
      listen: {
        call: "Server.listen(resolveNetworkOptions(args))",
        hostname: "0.0.0.0",
        port: 0,
        mdns: true,
        mdnsDomain: "open-code.local",
      },
      display: {
        mode: "local-and-network",
        localAccess: "http://localhost:4096",
        networkAccess: ["http://192.0.2.10:4096"],
        mdns: "open-code.local:4096",
        webInterface: "http://localhost:4096",
      },
      openURL: "http://localhost:4096",
      keepAlive: true,
    })
    expect(buildOpenCodeWebCommandProjection({ hostname: "127.0.0.1", port: 5511, passwordSet: true })).toMatchObject({
      warningWhenPasswordMissing: false,
      display: {
        mode: "single-url",
        webInterface: "http://127.0.0.1:5511",
      },
      openURL: "http://127.0.0.1:5511",
    })
    expect(buildOpenCodeDesktopRuntimeProjection({
      packaged: true,
      channel: "prod",
      deepLinks: ["opencode://workspace", "opencode://session/ses_native"],
    })).toMatchObject({
      product: "opencode",
      packageName: "@opencode-ai/desktop",
      appID: "ai.opencode.desktop",
      appName: "OpenCode",
      environment: {
        OPENCODE_DISABLE_EMBEDDED_WEB_UI: "true",
        OPENCODE_CLIENT: "desktop",
        OPENCODE_EXPERIMENTAL_ICON_DISCOVERY: "true",
        OPENCODE_EXPERIMENTAL_FILEWATCHER: "true",
      },
      mainWindow: {
        title: "OpenCode",
        defaultWidth: 1280,
        defaultHeight: 800,
        rendererProtocol: "oc",
        rendererURL: "oc://renderer/index.html",
        preload: "../preload/index.js",
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
      sidecar: {
        serviceName: "opencode server",
        startTimeoutMs: 60000,
        stopTimeoutMs: 6000,
        healthPath: "/global/health",
      },
      deepLinks: ["opencode://workspace", "opencode://session/ses_native"],
      protocolHandlers: ["opencode://session/:id", "opencode://workspace"],
    })
    expect(buildOpenCodeWorkspaceSnapshotProjection({
      cwd: "/workspace/opencode",
      graph: [{ id: "opencode.product-shell.workspace" }],
      registries: {
        tools: ["bash"],
        commands: [],
        shortcuts: [],
        flags: [],
        providers: ["openai"],
        auth: ["openai"],
        uiProviders: [],
        messageRenderers: [],
      },
    })).toMatchObject({
      product: "opencode",
      cwd: "/workspace/opencode",
      recipeID: "opencode",
      graph: [{ id: "opencode.product-shell.workspace" }],
      registries: expect.objectContaining({
        tools: ["bash"],
        providers: ["openai"],
        auth: ["openai"],
      }),
      services: ["opencode.control-plane", "opencode.desktop", "opencode.harness", "opencode.sdk", "opencode.server.factory", "opencode.slack", "opencode.tui", "opencode.web", "opencode.workspace"],
    })
    expect(buildOpenCodeHarnessAssemblyProjection({
      cwd: "/workspace/opencode",
      modules: [
        { id: "opencode.product-shell.harness" },
        { id: "opencode.product-shell.sdk" },
        { id: "opencode.product-shell.server" },
      ],
    })).toMatchObject({
      product: "opencode",
      cwd: "/workspace/opencode",
      bootstrap: {
        upstreamFunction: "bootstrap(directory, cb)",
        load: "InstanceRuntime.load({ directory })",
        provide: "context.provide(ctx, cb)",
        dispose: "InstanceRuntime.disposeInstance(ctx)",
        disposeInFinally: true,
      },
      recipe: { id: "opencode", graphLevel: "atom" },
      runtimeServices: {
        core: expect.arrayContaining(["cwd", "session", "hooks", "config", "prompt", "ui", "storageDir", "opencode.sqlite.path"]),
        product: expect.arrayContaining(["opencode.harness", "opencode.sdk", "opencode.server.factory", "opencode.workspace"]),
      },
      registries: {
        tools: "createOpenCodeDefaultTools()",
        providers: "registerOpenCodeBuiltinProviderPlugins(hooks, { env })",
        productSurfaces: "registerOpenCodeProductSurfaces(harness)",
      },
      runTurnEntrypoint: "runHarnessTurn({ product: 'opencode', session, hooks, prompt, turn })",
    })
    expect(buildOpenCodeControlPlaneSnapshotProjection({
      cwd: "/workspace/opencode",
      modules: [{ id: "opencode.product-shell.control-plane" }],
      providers: ["openai"],
      authProviders: ["openai"],
      registryCounts: {
        tools: 1,
        commands: 0,
        shortcuts: 0,
        flags: 0,
        providers: 1,
        auth: 1,
        uiProviders: 0,
        messageRenderers: 0,
      },
    })).toMatchObject({
      product: "opencode",
      status: "ready",
      cwd: "/workspace/opencode",
      recipe: expect.objectContaining({
        id: "opencode",
        modules: [{ id: "opencode.product-shell.control-plane" }],
      }),
      registryCounts: expect.objectContaining({ tools: 1, providers: 1, auth: 1 }),
      providers: ["openai"],
      authProviders: ["openai"],
      routes: expect.arrayContaining(["GET /v1/workspace", "GET /v1/control-plane", "POST /v1/run"]),
    })
    expect(projectOpenCodeTUIRunCommand({ interactive: true, command: true }).errors).toContain("--interactive cannot be used with --command")
    expect(projectOpenCodeTUIRunCommand({ interactive: true, format: "json" }).errors).toContain("--interactive cannot be used with --format json")
    const localTUIRun = projectOpenCodeTUIRunCommand({ interactive: true, message: "hello", files: ["/tmp/prompt.txt"] })
    expect(localTUIRun).toMatchObject({
      errors: [],
      mode: "interactive-local",
      thinking: true,
      replay: false,
      runtimeEntrypoint: "runInteractiveLocalMode",
      sessionStrategy: "lazy-local-session",
      permissionRules: [],
      initialInput: "hello",
      directoryPolicy: "local-chdir-or-root",
    })
    expect(localTUIRun.filePartPolicy).toEqual([{ source: "/tmp/prompt.txt", mime: "text/plain", url: "file:///tmp/prompt.txt" }])
    expect(projectOpenCodeTUIRunCommand({ interactive: true, attach: "http://localhost:4096", dir: "/workspace", replayLimit: 8 })).toMatchObject({
      errors: [],
      mode: "interactive-attach",
      replay: true,
      runtimeEntrypoint: "runInteractiveMode",
      sessionStrategy: "attach-existing-session",
      directoryPolicy: "remote-dir-passthrough",
    })
    expect(projectOpenCodeTUIRunCommand({ interactive: false, message: "hello" })).toMatchObject({
      mode: "noninteractive",
      thinking: false,
      runtimeEntrypoint: "execute",
      sessionStrategy: "single-noninteractive-session",
      permissionRules: ["question:deny:*", "plan_enter:deny:*", "plan_exit:deny:*"],
    })
    expect(buildOpenCodeTUIAppProviderStack()).toMatchObject({
      rendererConfig: {
        externalOutputMode: "passthrough",
        targetFps: 60,
        exitOnCtrlC: false,
        autoFocus: false,
        useMouseDefault: true,
        consoleCopySelection: true,
      },
      boot: expect.arrayContaining(["createCliRenderer", "registerOpencodeKeymap", "render"]),
      providers: expect.arrayContaining(["OpencodeKeymapProvider", "SDKProvider", "SyncProvider", "SyncProviderV2", "ThemeProvider"]),
      sdkEventPolicy: {
        client: "createOpencodeClient",
        source: "sdk.global.event or injected EventSource",
        batchWindowMs: 16,
        retryDelayMs: [1000, 30000],
        cleanup: ["abort sdk signal", "abort sse signal", "clear pending batch timer"],
      },
      routePolicy: {
        continueStartsAtSessionPlaceholder: true,
        sessionForkWaitsForSyncComplete: true,
        terminalTitle: ["OpenCode", "OC | ${sessionTitle}", "OC | ${pluginID}"],
      },
    })
    expect(buildOpenCodeTUISurfaceSnapshotProjection({
      cwd: "/workspace/opencode",
      tools: ["bash", "read"],
      providers: ["anthropic", "openai"],
      modules: [{ id: "opencode.product-shell.tui" }, { id: "opencode.ui.event-loop" }],
    })).toMatchObject({
      product: "opencode",
      cwd: "/workspace/opencode",
      title: "OpenCode",
      status: "ready",
      commands: ["run", "sessions", "graph", "providers", "tools"],
      interactiveEventLoop: {
        title: "OpenCode",
        theme: "opencode",
        modelPreference: ["opencode-builtin-codex", "opencode-default"],
      },
    })
    expect(buildOpenCodeSlackBotBehaviorProjection({
      channelID: "C123",
      threadTS: "1710000000.000100",
      messageText: "fix the failing tests",
      sessionID: "ses_slack_01",
      tool: "bash",
      toolTitle: "Command completed",
    })).toMatchObject({
      framework: "@slack/bolt",
      socketMode: true,
      envKeys: ["SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET", "SLACK_APP_TOKEN"],
      startup: expect.arrayContaining(["createOpencode({ port: 0 })", "client.event.subscribe()"]),
      messageHandler: expect.objectContaining({
        sessionKey: "C123-1710000000.000100",
        createSession: { title: "Slack thread 1710000000.000100", sessionID: "ses_slack_01" },
        prompt: {
          path: { id: "ses_slack_01" },
          body: { parts: [{ type: "text", text: "fix the failing tests" }] },
        },
      }),
      toolUpdate: expect.objectContaining({
        event: "message.part.updated",
        completedOnly: true,
        text: "*bash* - Command completed",
      }),
      command: { name: "/test", response: "Bot is working! I can hear you loud and clear." },
    })
    expect(verifyOpenCodeProductShellNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(openCodeProductShellNativeDescriptors.map((descriptor) => descriptor.id)).toEqual([
      ...openCodeProductShellNativeExactAtomIDs,
    ])

    const contract = buildAssemblyContract({ product: "opencode" })
    for (const atomID of openCodeProductShellNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom, atomID).toMatchObject({
        sourcePackage: "@helix/adapters-opencode",
        publicExport: "./product-schema/product-shell",
        implementationKind: "factory",
        parityCoverage: "native",
        knownLossiness: [],
        nativeEvidenceRefs: expect.arrayContaining([
          openCodeProductShellNativeExactEvidenceRef,
          openCodeProductShellNativeExactReplayRef,
          "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
        ]),
        fixtureIDs: [openCodeProductShellNativeExactFixtureID],
      })
    }
    const tuiProductShellAtom = contract.atoms.find((candidate) => candidate.id === openCodeProductShellTUINativeExactAtomID)
    expect(tuiProductShellAtom).toMatchObject({
      id: openCodeProductShellTUINativeExactAtomID,
      provides: expect.arrayContaining(["product.shell"]),
      implementationKind: "factory",
      parityCoverage: "native",
      knownLossiness: [],
    })
    expect(JSON.stringify(tuiProductShellAtom)).not.toContain("preview-demotion:opencode")
    const tuiEventLoopAtom = contract.atoms.find((candidate) => candidate.id === openCodeTUIShellNativeExactAtomID)
    expect(tuiEventLoopAtom).toMatchObject({
      id: openCodeTUIShellNativeExactAtomID,
      provides: expect.arrayContaining(["ui.event-loop"]),
      implementationKind: "factory",
      parityCoverage: "native",
      knownLossiness: [],
    })
    expect(JSON.stringify(tuiEventLoopAtom)).not.toContain("preview-demotion:opencode")
    const webProductShellAtom = contract.atoms.find((candidate) => candidate.id === openCodeProductShellWebNativeExactAtomID)
    expect(webProductShellAtom).toMatchObject({
      id: openCodeProductShellWebNativeExactAtomID,
      provides: expect.arrayContaining(["product.shell"]),
      implementationKind: "factory",
      parityCoverage: "native",
      knownLossiness: [],
    })
    expect(JSON.stringify(webProductShellAtom)).not.toContain("preview-demotion")
    const desktopProductShellAtom = contract.atoms.find((candidate) => candidate.id === openCodeProductShellDesktopNativeExactAtomID)
    expect(desktopProductShellAtom).toMatchObject({
      id: openCodeProductShellDesktopNativeExactAtomID,
      provides: expect.arrayContaining(["product.shell"]),
      implementationKind: "factory",
      parityCoverage: "native",
      knownLossiness: [],
    })
    expect(JSON.stringify(desktopProductShellAtom)).not.toContain("preview-demotion")
    const slackProductShellAtom = contract.atoms.find((candidate) => candidate.id === openCodeProductShellSlackNativeExactAtomID)
    expect(slackProductShellAtom).toMatchObject({
      id: openCodeProductShellSlackNativeExactAtomID,
      provides: expect.arrayContaining(["product.shell"]),
      implementationKind: "factory",
      parityCoverage: "native",
      knownLossiness: [],
    })
    expect(JSON.stringify(slackProductShellAtom)).not.toContain("compatible-bridge")
    const harnessProductShellAtom = contract.atoms.find((candidate) => candidate.id === openCodeProductShellHarnessNativeExactAtomID)
    expect(harnessProductShellAtom).toMatchObject({
      id: openCodeProductShellHarnessNativeExactAtomID,
      provides: expect.arrayContaining(["product.shell"]),
      sourcePackage: "@helix/adapters-opencode",
      publicExport: "./product-schema/product-shell",
      implementationKind: "factory",
      parityCoverage: "native",
      knownLossiness: [],
    })
    expect(JSON.stringify(harnessProductShellAtom)).not.toContain("compatible-bridge")
  })

  it("exercises the upstream-shaped OpenCode SDK, TUI, and Slack surfaces against the live harness", async () => {
    const harness = assembleOpenCodeHarness()
    const sdk = service<OpenCodeSDK>(harness.hooks.services, "opencode.sdk")
    const tui = service<OpenCodeTUISurface>(harness.hooks.services, "opencode.tui")
    const web = service<OpenCodeWebSurface>(harness.hooks.services, "opencode.web")
    const desktop = service<OpenCodeDesktopSurface>(harness.hooks.services, "opencode.desktop")
    const slack = service<OpenCodeSlackSurface>(harness.hooks.services, "opencode.slack")
    const events: OpenCodeSDKEvent[] = []
    const unsubscribe = sdk.subscribe((event) => events.push(event))

    sdk.tool.add({
      name: "native_bash",
      description: "Run a native SDK command",
      schema: {
        type: "object",
        properties: { command: { type: "string" } },
        required: ["command"],
      },
      execute: (input) => `ran:${String(input.command)}`,
    })
    sdk.auth.add({ provider: "openai", type: "api", value: "test-key" })
    sdk.agent.add({
      name: "build",
      permissions: [],
      model: { id: "surface-model", provider: "surface-test", variant: "xhigh" },
    })

    expect(sdk.tool.list()).toContain("native_bash")
    expect(sdk.auth.list()).toContain("openai")
    expect(sdk.agent.list()).toContain("build")
    expect(sdk.workspace()).toMatchObject({
      product: "opencode",
      recipeID: "opencode",
      registries: expect.objectContaining({
        tools: expect.arrayContaining(["native_bash"]),
        auth: expect.arrayContaining(["openai"]),
      }),
      services: expect.arrayContaining(["opencode.harness", "opencode.workspace", "opencode.control-plane", "opencode.sdk", "opencode.tui", "opencode.web", "opencode.desktop", "opencode.slack"]),
    })
    expect(harness.hooks.services.get("opencode.harness")).toBe(harness)
    expect(sdk.controlPlane()).toMatchObject({
      product: "opencode",
      status: "ready",
      recipe: expect.objectContaining({
        id: "opencode",
        modules: expect.arrayContaining([expect.objectContaining({ id: "opencode.product-shell.control-plane" })]),
      }),
      registryCounts: expect.objectContaining({
        tools: expect.any(Number),
        auth: expect.any(Number),
      }),
      routes: expect.arrayContaining(["GET /v1/workspace", "GET /v1/control-plane", "POST /v1/run"]),
    })
    expect(tui.snapshot()).toMatchObject({
      product: "opencode",
      title: "OpenCode",
      status: "ready",
      commands: ["run", "sessions", "graph", "providers", "tools"],
      tools: expect.arrayContaining(["native_bash"]),
      modules: expect.arrayContaining([expect.objectContaining({ id: "opencode.product-shell.tui" })]),
    })
    const tuiText = tui.dispatch({ type: "text", text: "Fix native TUI" })
    expect(tuiText).toMatchObject({
      handled: true,
      snapshot: expect.objectContaining({
        product: "opencode",
        title: "OpenCode",
        commandLine: "Fix native TUI",
        theme: "opencode",
      }),
    })
    const tuiSubmit = tui.dispatch({ type: "submit" })
    expect(tuiSubmit).toMatchObject({
      handled: true,
      submittedText: "Fix native TUI",
      output: "Fix native TUI",
      snapshot: expect.objectContaining({
        history: expect.arrayContaining(["Fix native TUI"]),
      }),
    })
    const tuiRender = tui.render({ width: 80 })
    expect(tuiRender).toContain("OpenCode TUI :: READY")
    expect(tuiRender).toContain("commands  run / sessions / graph / providers / tools")
    expect(tuiRender).toContain("OpenCode")
    expect(web.launchPlan({
      hostname: "0.0.0.0",
      port: 0,
      resolvedPort: 4096,
      mdns: true,
      mdnsDomain: "open-code.local",
      networkInterfaces: [
        { address: "10.0.0.4", family: "IPv4", internal: false },
        { address: "172.20.0.2", family: "IPv4", internal: false },
      ],
    })).toMatchObject({
      command: "web",
      instance: false,
      display: {
        localAccess: "http://localhost:4096",
        networkAccess: ["http://10.0.0.4:4096"],
        mdns: "open-code.local:4096",
      },
      openURL: "http://localhost:4096",
    })
    expect(desktop.runtimeProjection({ packaged: true, channel: "prod", deepLinks: ["opencode://workspace"] })).toMatchObject({
      appID: "ai.opencode.desktop",
      appName: "OpenCode",
      environment: expect.objectContaining({ OPENCODE_CLIENT: "desktop" }),
      mainWindow: expect.objectContaining({
        rendererURL: "oc://renderer/index.html",
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      }),
      sidecar: expect.objectContaining({ serviceName: "opencode server", healthPath: "/global/health" }),
      deepLinks: ["opencode://workspace"],
    })
    expect(slack.manifest()).toMatchObject({
      product: "opencode",
      framework: "@slack/bolt",
      socketMode: true,
      commands: ["/test"],
      events: expect.arrayContaining(["message", "message.part.updated"]),
      env: expect.objectContaining({
        botToken: expect.any(Boolean),
        signingSecret: expect.any(Boolean),
        appToken: expect.any(Boolean),
      }),
    })
    await expect(slack.handleCommand({ text: "/test", channelID: "C-native" })).resolves.toMatchObject({
      response_type: "ephemeral",
      text: "Bot is working! I can hear you loud and clear.",
    })
    await expect(harness.hooks.registries.tools.get("native_bash")?.execute("tool_1", { command: "pwd" }, {})).resolves.toMatchObject({
      content: [expect.objectContaining({ text: "ran:pwd" })],
    })

    const sessionID = await sdk.session.create({ agent: "build", title: "Native SDK" })
    expect(sessionID).toMatch(/^ses_/)
    const result = await sdk.session.prompt({
      sessionID,
      text: "hello from opencode sdk native facade",
      files: [{ mime: "image/png", uri: "data:image/png;base64,xxxx" }],
      provider: surfaceProvider("opencode sdk native ok"),
    })
    await sdk.session.wait()
    await expect(sdk.session.messages(sessionID)).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ role: "assistant" }),
    ]))
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("opencode sdk native ok")
    harness.hooks.services.set("opencode.sdk.default-provider", surfaceProvider("opencode slack native ok"))
    const slackMessage = await slack.handleMessage({
      channelID: "C-native",
      ts: "1710000000.000100",
      threadTS: "1710000000.000100",
      userID: "U-native",
      text: "hello from slack",
    })
    expect(slackMessage).toMatchObject({
      ok: true,
      session: expect.objectContaining({
        key: "C-native-1710000000.000100",
        channelID: "C-native",
        threadTS: "1710000000.000100",
      }),
      response: expect.objectContaining({
        kind: "assistant-response",
        text: expect.stringContaining("opencode slack native ok"),
      }),
    })
    expect(slack.sessions()).toHaveLength(1)
    await expect(slack.handleToolUpdate({
      sessionID: slack.sessions()[0]!.sessionID,
      tool: "bash",
      title: "Command completed",
      status: "completed",
    })).resolves.toMatchObject({
      kind: "tool-update",
      text: "*bash* - Command completed",
      channelID: "C-native",
      threadTS: "1710000000.000100",
    })
    expect(slack.postedMessages().map((message) => message.kind)).toEqual(expect.arrayContaining(["command-response", "assistant-response", "tool-update"]))
    expect(events.map((event) => event.type)).toEqual(expect.arrayContaining([
      "tool.added",
      "auth.added",
      "agent.added",
      "session.created",
      "session.prompt",
      "session.updated",
    ]))
    unsubscribe()
  })

  it("exercises OpenCode server listener and route behavior with upstream listener policy", async () => {
    const harness = assembleOpenCodeHarness()
    const createServer = service<(input?: { provider?: ReturnType<typeof surfaceProvider> }) => OpenCodeServer>(harness.hooks.services, "opencode.server.factory")
    const server = createServer({ provider: surfaceProvider("opencode server native ok") })
    try {
      expect(openCodeListenPortCandidates({ port: 0 })).toEqual([4096, 0])
      expect(openCodeListenPortCandidates({ port: 5173 })).toEqual([5173])
      expect(openCodeServerCanPublishMDNS({ mdns: true, host: "127.0.0.1", port: 4096 })).toBe(false)
      expect(openCodeServerCanPublishMDNS({ mdns: true, host: "192.0.2.10", port: 4096 })).toBe(true)
      expect(server.routes).toEqual(expect.arrayContaining(["GET /health", "POST /v1/run"]))
      expect(server.routes).not.toContain("POST /v1/run/fake")

      const listener = await server.listen({ port: 0 })
      expect(listener.url).toBe(`http://${listener.host}:${listener.port}`)
      await expect(fetchJSON(`${listener.url}/health`)).resolves.toMatchObject({ ok: true, product: "opencode" })
      await expect(fetchJSON(`${listener.url}/v1/workspace`)).resolves.toMatchObject({
        product: "opencode",
        recipeID: "opencode",
        services: expect.arrayContaining(["opencode.workspace", "opencode.control-plane"]),
      })
      await expect(fetchJSON(`${listener.url}/v1/control-plane`)).resolves.toMatchObject({
        product: "opencode",
        status: "ready",
        routes: expect.arrayContaining(["GET /v1/workspace", "GET /v1/control-plane", "POST /v1/run"]),
      })
      await expect(fetchJSON(`${listener.url}/v1/run/fake`)).rejects.toThrow(/HTTP 404/)
      const run = await fetchJSON(`${listener.url}/v1/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "hello from opencode server native" }),
      })
      expect(JSON.stringify(run)).toContain("opencode server native ok")
    } finally {
      await server.close(true)
    }
  })

  it("flags fixture drift when native SDK/server behavior changes", () => {
    const fixture = buildOpenCodeProductShellNativeExactFixture()
    const mutated = {
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "server-default-app-listener-and-mdns"
          ? { ...item, output: { ...item.output, portZeroCandidates: [0] } }
          : item,
      ),
    }

    expect(verifyOpenCodeProductShellNativeExactFixture(mutated).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-product-shell-native-exact.fingerprint" }),
      expect.objectContaining({ id: "opencode-product-shell-native-exact.cases" }),
    ]))
  })
})

function service<T>(services: Map<string, unknown>, key: string): T {
  const value = services.get(key)
  if (!value) throw new Error(`Missing service ${key}`)
  return value as T
}

function surfaceProvider(text: string): ReturnType<typeof createOpenAICompatibleProvider> {
  const transport = createMockSSEProviderTransport([
    `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`,
    'data: {"choices":[{"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":8,"completion_tokens":4}}\n\n',
    "data: [DONE]\n\n",
  ])
  return createOpenAICompatibleProvider({
    id: "surface-test",
    models: [{ providerID: "surface-test", modelID: "surface-model" }],
    transport: {
      fetch(url: string, init: ProviderFetchInit) {
        return transport.fetch(url, init)
      },
    },
  })
}

async function fetchJSON(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, init)
  const body = await response.text()
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${body}`)
  return body ? JSON.parse(body) : undefined
}
