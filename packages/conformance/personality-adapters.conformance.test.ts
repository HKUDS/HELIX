import { describe, expect, it } from "vitest"
import { createID } from "@helix/contracts"
import { LegoHookHost } from "@helix/lego-hooks"
import {
  createOpenCodePluginLoaderAtom,
  createOpenCodePluginManifestNormalizer,
  createOpenCodeSpecialAtomProfile,
} from "@helix/adapters-opencode/plugin-atoms"
import {
  captureOpenCodeIdentityClockNativeExactFixture,
  captureOpenCodeIdentityIDGeneratorNativeExactFixture,
  captureOpenCodeIdentityWorkspaceResolverNativeExactFixture,
  createOpenCodeNativeIdentityClock,
  createOpenCodeNativeIdentityIDGenerator,
  createOpenCodeNativeIdentityWorkspaceResolver,
  verifyOpenCodeIdentityClockNativeExactFixture,
  verifyOpenCodeIdentityIDGeneratorNativeExactFixture,
  verifyOpenCodeIdentityWorkspaceResolverNativeExactFixture,
} from "@helix/adapters-opencode/opencode-identity"
import {
  captureOpenCodeProviderUsageNativeExactFixture,
  createOpenCodeProviderUsageNormalizer,
  openCodeProviderGetUsage,
  verifyOpenCodeProviderUsageNativeExactFixture,
} from "@helix/adapters-opencode/opencode-provider-usage"
import {
  createPiExtensionLoaderAtom,
  createPiExtensionManifestNormalizer,
  createPiSpecialAtomProfile,
  createPiTypeBoxSchemaBridge,
} from "@helix/adapters-pi/extension-atoms"
import {
  createNanobotPluginManifestNormalizer,
  createNanobotSpecialAtomProfile,
  createNanobotToolSchemaBridge,
  loadNanobotPlugin,
  nanobotHookEventName,
} from "@helix/adapters-nanobot"
import { createHermesSpecialAtomProfile } from "@helix/adapters-hermes/hermes-atoms"

describe("personality adapter atoms", () => {
  it("exposes adapter special atom profiles without treating references as native implementation proof", () => {
    const opencode = createOpenCodeSpecialAtomProfile()
    const pi = createPiSpecialAtomProfile()
    const nanobot = createNanobotSpecialAtomProfile()
    const hermes = createHermesSpecialAtomProfile()
    const validImplementationKinds = new Set(["factory", "bridge", "metadata-only", "preview"])

    expect(opencode.atom("opencode.plugin.loader")).toMatchObject({
      port: "hook.bus",
      implementation: "createOpenCodePluginLoaderAtom",
      referenceSource: expect.stringMatching(/^reference only:/),
      implementationKind: "bridge",
    })
    expect(pi.atom("pi.extension.dynamic-tool-bridge")).toMatchObject({
      port: "tool.registry",
      implementation: "createPiDynamicToolBridge",
      referenceSource: expect.stringMatching(/^reference only:/),
      implementationKind: "bridge",
    })
    expect(nanobot.atom("nanobot.provider.request-options")).toMatchObject({
      port: "provider.request-shape",
      referenceSource: expect.stringMatching(/^reference only:/),
      implementationKind: "bridge",
    })
    expect(hermes.atom("hermes.prompt.agent-builder")).toMatchObject({
      port: "prompt.system-builder",
      implementation: "Hermes prompt builder reference descriptor",
      referenceSource: expect.stringContaining("reference only: agent/prompt_builder.py"),
      implementationKind: "metadata-only",
    })
    expect(hermes.atom("hermes.plugin.loader")).toMatchObject({
      port: "hook.bus",
      implementationKind: "bridge",
    })
    expect(opencode.atom("opencode.block.compatibility-metadata")).toMatchObject({ implementationKind: "metadata-only" })
    for (const [profile, atomID] of [
      [opencode, "opencode.tui.shell"],
      [nanobot, "nanobot.tui.shell"],
      [hermes, "hermes.tui.shell"],
    ] as const) {
      expect(profile.atom(atomID)).toMatchObject({
        port: "ui.event-loop",
        implementationKind: "preview",
        implementation: expect.stringContaining("shared Helix UI event-loop preview"),
        referenceSource: expect.stringMatching(/^reference only:/),
      })
    }
    expect(pi.atom("pi.tui.shell")).toMatchObject({
      port: "ui.event-loop",
      implementationKind: "factory",
      implementation: "Pi upstream TUI event-loop shell",
      referenceSource: expect.stringMatching(/^reference only:/),
    })

    for (const descriptor of [...opencode.atoms(), ...pi.atoms(), ...nanobot.atoms(), ...hermes.atoms()]) {
      expect(Object.prototype.hasOwnProperty.call(descriptor, "upstream")).toBe(false)
      expect(descriptor.referenceSource).toMatch(/^reference only:/)
      expect(validImplementationKinds.has(descriptor.implementationKind)).toBe(true)
    }

    expect(opencode.atoms().length).toBeGreaterThan(10)
    expect(pi.atoms().length).toBeGreaterThan(10)
    expect(nanobot.atoms().length).toBeGreaterThan(10)
    expect(hermes.atoms().length).toBeGreaterThan(4)
  })

  it("splits OpenCode plugin loading, event mapping, registry, permission, and workspace bridges into atoms", async () => {
    const host = new LegoHookHost()
    const manifest = createOpenCodePluginManifestNormalizer().normalize({
      plugin: function samplePlugin() {
        return {}
      },
      source: { path: "/tmp/plugin.ts" },
    })
    expect(manifest).toEqual({ id: "samplePlugin", scope: "project", path: "/tmp/plugin.ts" })

    const scope = await createOpenCodePluginLoaderAtom().load({
      host,
      plugin: (input) => {
        input.experimental_workspace?.register("panel", { ok: true })
        return {
          config(config) {
            host.services.set("opencode.config", config)
          },
          tool: { localTool: { description: "local" } },
          auth: { type: "oauth" },
          provider: { provider: "local" },
          ui: { panel: true },
          "permission.ask": async (_input, output) => {
            output.status = "allow"
          },
          "chat.message": async (_input, output) => {
            output["text"] = "mapped-input"
          },
          "tool.execute.before": async (_input, output) => {
            output.args = { command: "npm test" }
          },
          "tool.execute.after": async (_input, output) => {
            output.output = `patched:${output.output}`
            output.metadata = { patched: true }
          },
          "shell.env": async (_input, output) => {
            output.env["OPENCODE_PLUGIN"] = "1"
          },
          "tool.definition": async (_input, output) => {
            output.description = "mapped definition"
            output.parameters = { type: "object" }
          },
        }
      },
      pluginInput: { directory: process.cwd() },
      config: { enabled: true },
      source: { id: "plugin.atom", scope: "project" },
    })

    expect(host.services.get("opencode.config")).toEqual({ enabled: true })
    expect(host.services.get("opencode.tool:localTool")).toMatchObject({ source: { id: "plugin.atom" } })
    expect(host.registries.auth.get("plugin.atom")).toMatchObject({ config: { type: "oauth" } })
    expect(host.registries.providers.get("plugin.atom")).toMatchObject({ config: { provider: "local" } })
    expect(host.registries.uiProviders.get("plugin.atom")).toMatchObject({ provider: { panel: true } })
    expect(host.services.get("opencode.experimental_workspace:panel:plugin.atom")).toMatchObject({ type: "panel" })

    await expect(host.emit({ type: "permission.ask", timestamp: Date.now(), payload: {} })).resolves.toMatchObject({ status: "allow" })
    await expect(host.emit({ type: "input", timestamp: Date.now(), payload: { text: "start" } })).resolves.toMatchObject({
      text: "mapped-input",
    })
    const toolPayload = {
      toolName: "bash",
      toolCallID: createID("toolcall"),
      sessionID: createID("session"),
      input: { command: "danger" },
    }
    await host.emit({ type: "tool.call", timestamp: Date.now(), payload: toolPayload })
    expect(toolPayload.input).toEqual({ command: "npm test" })
    await expect(
      host.emit({
        type: "tool.result",
        timestamp: Date.now(),
        payload: {
          ...toolPayload,
          content: [{ id: createID("part"), type: "text", text: "ok" }],
        },
      }),
    ).resolves.toMatchObject({ details: { patched: true } })
    await expect(host.emit({ type: "shell.env", timestamp: Date.now(), payload: { cwd: process.cwd() } })).resolves.toEqual({
      env: { OPENCODE_PLUGIN: "1" },
    })
    await expect(host.emit({ type: "tool.definition", timestamp: Date.now(), payload: { name: "bash" } })).resolves.toEqual({
      description: "mapped definition",
      parameters: { type: "object" },
    })

    await scope.dispose()
    expect(host.registries.auth.has("plugin.atom")).toBe(false)
    expect(host.registries.providers.has("plugin.atom")).toBe(false)
    expect(host.registries.uiProviders.has("plugin.atom")).toBe(false)
    expect(host.services.has("opencode.tool:localTool")).toBe(false)
  })

  it("splits Pi extension loading, event mapping, schema, dynamic registry, and runtime event bridges into atoms", async () => {
    const host = new LegoHookHost()
    host.services.set("cwd", "/tmp/pi-workspace")
    const rendererRegistrations: Array<{ customType: string; render(part: unknown, ctx: unknown): unknown }> = []
    host.services.set("ui", {
      renderers: {
        registerMessagePartRenderer(input: { customType: string; render(part: unknown, ctx: unknown): unknown }) {
          rendererRegistrations.push(input)
          return () => {
            rendererRegistrations.splice(rendererRegistrations.indexOf(input), 1)
          }
        },
      },
    })
    const observed: string[] = []
    host.observe((event) => {
      observed.push(event.type)
    })

    const typeBoxKind = Symbol("TypeBox.Kind")
    const typebox = { [typeBoxKind]: "Object", type: "object", properties: { text: { type: "string" } } }
    const schemaBridge = createPiTypeBoxSchemaBridge()
    expect(schemaBridge.inspect({ name: "piTool", description: "Pi", parameters: typebox, execute: async () => ({ content: [] }) })).toMatchObject({
      kind: "typebox",
      jsonSchema: typebox,
    })

    const manifest = createPiExtensionManifestNormalizer().normalize({
      extension: function piSample() {},
      source: { path: "/tmp/extension.ts" },
    })
    expect(manifest).toEqual({ id: "piSample", scope: "project", path: "/tmp/extension.ts" })

    const api = await createPiExtensionLoaderAtom().load({
      host,
      source: { id: "pi.atom", scope: "project" },
      extension: async (pi) => {
        pi.on("input", (payload, ctx) => {
          ctx.ui.notify("hello")
          return { text: (payload as { text: string }).text, cwd: ctx.cwd }
        })
        pi.registerTool({ name: "piTool", description: "Pi", parameters: typebox, execute: async () => ({ content: [] }) })
        pi.registerCommand("build", { handler: async () => undefined })
        pi.registerFlag("verbose", { type: "boolean" })
        pi.registerProvider("local", { model: "test" })
        pi.registerUIProvider("panel", { render: "panel" })
        pi.registerMessageRenderer("custom", () => "rendered")
        await pi.events.emit("pi.custom", { resources: [{ id: "r1" }] })
      },
    })

    expect(observed).toEqual(expect.arrayContaining(["pi.custom", "resources.discover"]))
    await expect(host.emit({ type: "input", timestamp: Date.now(), payload: { text: "hello" } })).resolves.toMatchObject({
      text: "hello",
      cwd: "/tmp/pi-workspace",
    })
    expect(host.registries.tools.get("piTool")?.parameters).toEqual(typebox)
    expect(host.registries.commands.get("build")?.source?.id).toBe("pi.atom")
    expect(host.registries.flags.get("verbose")?.source?.id).toBe("pi.atom")
    expect(host.registries.providers.get("local")?.source?.id).toBe("pi.atom")
    expect(host.registries.uiProviders.get("panel")?.source?.id).toBe("pi.atom")
    expect(host.registries.messageRenderers.get("custom")?.source?.id).toBe("pi.atom")
    expect(rendererRegistrations.map((renderer) => renderer.customType)).toEqual(["custom"])
    expect([...host.services.values()]).toContainEqual({ message: "hello", type: "info" })

    await api.dispose()
    expect(host.registries.tools.has("piTool")).toBe(false)
    expect(host.registries.commands.has("build")).toBe(false)
    expect(host.registries.flags.has("verbose")).toBe(false)
    expect(host.registries.providers.has("local")).toBe(false)
    expect(host.registries.uiProviders.has("panel")).toBe(false)
    expect(host.registries.messageRenderers.has("custom")).toBe(false)
    expect(rendererRegistrations).toEqual([])
  })

  it("splits Nanobot plugin loading, schema, registry, and event bridge into atoms", async () => {
    const host = new LegoHookHost()
    host.services.set("cwd", "/tmp/nanobot-workspace")
    host.services.set("nanobot.workspace", "/tmp/nanobot-workspace")
    const observed: string[] = []
    host.observe((event) => {
      observed.push(event.type)
    })

    const parameters = { type: "object", properties: { text: { type: "string" } } }
    const tool = {
      name: "nanobotTool",
      description: "Nanobot",
      parameters,
      execute: async () => ({ content: [{ id: createID("part"), type: "text" as const, text: "ok" }] }),
    }
    expect(createNanobotToolSchemaBridge().inspect(tool)).toMatchObject({ kind: "json-schema", jsonSchema: parameters })
    const manifest = createNanobotPluginManifestNormalizer().normalize({
      plugin: function nanobotSample() {},
      source: { path: "/tmp/nanobot-plugin.ts" },
    })
    expect(manifest).toEqual({ id: "nanobotSample", scope: "project", path: "/tmp/nanobot-plugin.ts" })

    const api = await loadNanobotPlugin({
      host,
      source: { id: "nanobot.atom", scope: "project" },
      plugin: async (nanobot) => {
        nanobot.registerTool(tool)
        nanobot.registerCommand("scan", { handler: async () => undefined })
        nanobot.registerProvider("local", { model: "test" })
        nanobot.registerUIProvider("panel", { render: "panel" })
        nanobot.on("input", (payload, ctx) => ({
          text: `nanobot:${String((payload as { text?: string }).text ?? "")}`,
          cwd: ctx.services.get("cwd"),
          workspace: ctx.workspace,
        }))
        nanobot.on("before_iteration", (payload, ctx) => ({
          originalEvent: ctx.services.get("nanobot.originalEvent"),
          turn: payload,
        }))
        await nanobot.emit("nanobot.custom", { resources: [{ name: "nanobot-skill", content: "skill" }] })
      },
    })

    expect(nanobotHookEventName("before_iteration")).toBe("turn.start")
    expect(observed).toContain("nanobot.custom")
    expect(observed).toContain("resources.discover")
    await expect(host.emit({ type: "input", timestamp: Date.now(), payload: { text: "hello" } })).resolves.toMatchObject({
      text: "nanobot:hello",
      cwd: "/tmp/nanobot-workspace",
      workspace: "/tmp/nanobot-workspace",
    })
    await expect(host.emit({ type: "turn.start", timestamp: Date.now(), payload: { turnIndex: 1 } })).resolves.toMatchObject({
      originalEvent: "before_iteration",
      turn: { turnIndex: 1 },
    })
    expect(host.registries.tools.get("nanobotTool")?.parameters).toEqual(parameters)
    expect(host.registries.tools.get("nanobotTool")?.description).toBe("Nanobot")
    expect(host.registries.commands.get("scan")?.source?.id).toBe("nanobot.atom")
    expect(host.registries.providers.get("local")?.source?.id).toBe("nanobot.atom")
    expect(host.registries.uiProviders.get("panel")?.source?.id).toBe("nanobot.atom")

    await api.dispose()
    expect(host.registries.tools.has("nanobotTool")).toBe(false)
    expect(host.registries.commands.has("scan")).toBe(false)
    expect(host.registries.providers.has("local")).toBe(false)
    expect(host.registries.uiProviders.has("panel")).toBe(false)
  })

  it("captures OpenCode native ID generator parity from pinned upstream source", () => {
    const fixture = captureOpenCodeIdentityIDGeneratorNativeExactFixture()
    const verification = verifyOpenCodeIdentityIDGeneratorNativeExactFixture(fixture)
    const generator = createOpenCodeNativeIdentityIDGenerator({
      now: () => 1234567890,
      randomBytes: (length) => new Uint8Array(length),
    })

    expect(verification).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      exactDiffStatus: "pinned-upstream-source-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      generated: [
        expect.objectContaining({ kind: "session", value: "ses_fb669fd2dffe00000000000000", direction: "descending" }),
        expect.objectContaining({ kind: "message", value: "msg_0499602d200100000000000000", direction: "ascending" }),
        expect.objectContaining({ kind: "part", value: "prt_0499602d200200000000000000", direction: "ascending" }),
        expect.objectContaining({ kind: "tool", value: "tool_0499602d200300000000000000", direction: "ascending" }),
        expect.objectContaining({ kind: "workspace", value: "wrk_0499602d200400000000000000", direction: "ascending" }),
      ],
    })
    expect(generator.messageID("msg_existing")).toBe("msg_existing")
    expect(generator.partID("prt_existing")).toBe("prt_existing")
    expect(generator.timestamp("msg_0499602d200100000000000000")).toBe(1234567890)
    expect(() => generator.messageID("bad_message")).toThrow("ID bad_message does not start with msg")
    expect(() => generator.ascending("tool", "bad_tool")).toThrow("ID bad_tool does not start with tool")
  })

  it("captures OpenCode native clock/title parity from pinned upstream source", () => {
    const fixture = captureOpenCodeIdentityClockNativeExactFixture()
    const verification = verifyOpenCodeIdentityClockNativeExactFixture(fixture)
    const clock = createOpenCodeNativeIdentityClock({
      now: () => new Date("2026-06-12T13:00:00.123Z"),
    })

    expect(verification).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      exactDiffStatus: "pinned-upstream-source-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: [
        expect.objectContaining({
          path: "packages/opencode/src/session/session.ts",
          symbols: expect.arrayContaining(["createDefaultTitle", "isDefaultTitle"]),
        }),
      ],
      generated: [
        { kind: "parent", isChild: false, value: "New session - 2026-06-12T13:00:00.123Z" },
        { kind: "child", isChild: true, value: "Child session - 2026-06-12T13:00:00.123Z" },
      ],
    })
    expect(clock.createDefaultTitle()).toBe("New session - 2026-06-12T13:00:00.123Z")
    expect(clock.createDefaultTitle(true)).toBe("Child session - 2026-06-12T13:00:00.123Z")
    expect(clock.isDefaultTitle("New session - 2026-06-12T13:00:00.123Z")).toBe(true)
    expect(clock.isDefaultTitle("New session - 2026-06-12T13:00:00Z")).toBe(false)
  })

  it("captures OpenCode native workspace session path parity from pinned upstream source", () => {
    const fixture = captureOpenCodeIdentityWorkspaceResolverNativeExactFixture()
    const verification = verifyOpenCodeIdentityWorkspaceResolverNativeExactFixture(fixture)
    const resolver = createOpenCodeNativeIdentityWorkspaceResolver()

    expect(verification).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      exactDiffStatus: "pinned-upstream-source-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: [
        expect.objectContaining({
          path: "packages/opencode/src/session/session.ts",
          symbols: expect.arrayContaining(["sessionPath"]),
        }),
      ],
      resolved: expect.arrayContaining([
        expect.objectContaining({ name: "root", path: "" }),
        expect.objectContaining({ name: "nested", path: "packages/api" }),
        expect.objectContaining({ name: "outside-worktree", path: "../other" }),
        expect.objectContaining({ name: "separator-normalization", path: "foo/bar" }),
      ]),
    })
    expect(resolver.sessionPath("/repo/project", "/repo/project/packages/api")).toBe("packages/api")
    expect(resolver.sessionPath("/repo/project", "/repo/other")).toBe("../other")
    expect(resolver.sessionPath("/repo/project", "/repo/project/foo\\bar")).toBe("foo/bar")
    expect(resolver.resolve({ worktree: "/repo/project", cwd: "/repo/project" })).toMatchObject({
      worktree: "/repo/project",
      directory: "/repo/project",
      path: "",
    })
  })

  it("captures OpenCode native provider usage parity from pinned upstream getUsage", () => {
    const fixture = captureOpenCodeProviderUsageNativeExactFixture()
    const verification = verifyOpenCodeProviderUsageNativeExactFixture(fixture)
    const normalizer = createOpenCodeProviderUsageNormalizer()

    expect(verification).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      exactDiffStatus: "pinned-upstream-source-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: [
        expect.objectContaining({
          path: "packages/opencode/src/session/session.ts",
          symbols: ["getUsage"],
        }),
      ],
      cases: expect.arrayContaining([
        expect.objectContaining({
          id: "cache-adjustment",
          expected: expect.objectContaining({
            cost: 0.00383,
            tokens: { total: 1500, input: 880, output: 450, reasoning: 50, cache: { read: 100, write: 20 } },
          }),
        }),
        expect.objectContaining({
          id: "metadata-cache-write-fallback",
          expected: expect.objectContaining({
            cost: 0.000107,
            tokens: { input: 60, output: 15, reasoning: 5, cache: { read: 10, write: 30 } },
          }),
        }),
        expect.objectContaining({
          id: "over-200k-cost-tier",
          expected: expect.objectContaining({
            cost: 2.52,
            tokens: { input: 250000, output: 900, reasoning: 100, cache: { read: 0, write: 0 } },
          }),
        }),
      ]),
    })
    expect(
      normalizer.normalize({
        finish: "stop",
        usage: { input: 1000, output: 500, reasoning: 50, cacheRead: 100, cacheWrite: 20 },
        model: { providerID: "opencode", modelID: "priced", cost: { input: 2, output: 4, cacheRead: 0.5, cacheWrite: 1 } },
      }),
    ).toEqual({
      finish: "stop",
      usage: { input: 880, output: 450, reasoning: 50, cacheRead: 100, cacheWrite: 20 },
      cost: 0.00383,
    })
    expect(
      openCodeProviderGetUsage({
        usage: { inputTokens: 10, outputTokens: Number.POSITIVE_INFINITY, reasoningTokens: Number.NaN, cacheReadInputTokens: 3 },
        metadata: { bedrock: { usage: { cacheWriteInputTokens: "7" } } },
        model: { cost: { input: 1, output: 1, cache: { read: 1, write: 1 } } },
      }),
    ).toEqual({
      cost: 0.00001,
      tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 3, write: 7 } },
    })
  })
})
