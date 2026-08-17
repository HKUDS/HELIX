import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { createID, type LegoRecipe } from "@helix/contracts"
import { createMockSSEProviderTransport, createOpenAICompatibleProvider } from "@helix/lego-provider"
import {
  loadOpenCodePlugin,
  loadOpenCodePlugins,
  openCodeBuiltinProviderIDs,
  type OpenCodeDesktopSurface,
  type OpenCodeSDK,
  type OpenCodeServer,
  type OpenCodeSlackSurface,
  type OpenCodeTUISurface,
  type OpenCodeWebSurface,
} from "@helix/adapters-opencode"
import {
  loadPiExtension,
  loadPiExtensions,
  type PiBrowserSmoke,
  type PiCLISurface,
  type PiExtensionExamples,
  type PiPackageManager,
  type PiRPCSurface,
  type PiReleaseHardening,
  type PiServer,
  type PiSDK,
  type PiTUISurface,
  type PiWebUISurface,
} from "@helix/adapters-pi"
import { definePlugin } from "@opencode-ai/plugin"
import { defineExtension } from "@earendil-works/pi-coding-agent"
import {
  filesystemPortToken,
  isFilesystemPort,
  isProcessRunnerPort,
  isToolPermissionPolicy,
  processRunnerPortToken,
  toolPermissionPolicyToken,
} from "@helix/lego-tools"
import {
  assembleOpenCodeHarness,
  assembleOpenCodePiHybridHarness,
  assembleRecipeHarness,
  assembleNanobotHarness,
  assemblePiMonoHarness,
  applyRecipeOverrides,
  buildAssembledFlowTrace,
  buildAssemblyContract,
  codingAgentMinimalRecipe,
  compileRecipe,
  createHarnessAssemblyAtom,
  defaultRecipeModuleCatalog,
  diffRecipes,
  nanobotRecipe,
  opencodePiHybridRecipe,
  opencodeRecipe,
  parseRecipe,
  piMonoRecipe,
  routeForAtomBlock,
  swapRecipes,
  verifyHarnessFlowGraph,
} from "@helix/recipes"

describe("Harness recipes", () => {
  it("exposes product-specific harness assembly atoms", () => {
    const cases = [
      { product: "opencode" as const, assemble: assembleOpenCodeHarness },
      { product: "pi-mono" as const, assemble: assemblePiMonoHarness },
      { product: "nanobot" as const, assemble: assembleNanobotHarness },
    ]

    for (const item of cases) {
      const direct = item.assemble()
      const atom = createHarnessAssemblyAtom(item.product)
      const assembled = atom.assemble()

      expect(atom.product).toBe(item.product)
      expect(assembled.product).toBe(direct.product)
      expect(assembled.graph.map((module) => module.id)).toEqual(expect.arrayContaining([`${item.product === "pi-mono" ? "pi" : item.product}.product-shell.harness`]))
    }
  })

  it("uses OpenCode native fail-fast hook error defaults in assembled harnesses", async () => {
    const harness = assembleOpenCodeHarness()
    const calls: string[] = []
    harness.hooks.on("message_end", () => {
      calls.push("first")
      throw new Error("opencode hook failed")
    })
    harness.hooks.on("message_end", () => {
      calls.push("second")
    })

    await expect(harness.hooks.emit({ type: "message.end", timestamp: Date.now(), payload: {} })).rejects.toThrow("opencode hook failed")
    expect(calls).toEqual(["first"])
  })

  it("routes product-scoped special atoms to their owning lego plane", () => {
    expect(routeForAtomBlock("nanobot.runtime.binding-defaults")).toMatchObject({
      packageName: "@helix/lego-runtime",
      exportPath: "./runtime-atoms",
    })
    expect(routeForAtomBlock("opencode.prompt.mode-builder")).toMatchObject({
      packageName: "@helix/adapters-opencode",
      exportPath: "./opencode-prompt-mode-builder",
    })
    expect(routeForAtomBlock("pi.config.source")).toMatchObject({
      packageName: "@helix/lego-config",
      exportPath: "./product-schema/pi",
    })
    expect(routeForAtomBlock("nanobot.product-shell.harness")).toMatchObject({
      packageName: "@helix/adapters-nanobot",
      exportPath: "./product-schema/product-shell",
    })
  })

  it("compiles recipe JSON into dependency-checked module graphs", () => {
    const recipe = parseRecipe(JSON.parse(readFileSync("recipes/opencode/recipe.json", "utf8")))
    const plan = compileRecipe(recipe)
    const toolExecutor = plan.modules.find((module) => module.id === "turn.tool-executor.common")
    const graphIDs = plan.graph.map((module) => module.id)
    const piPlan = compileRecipe(parseRecipe(JSON.parse(readFileSync("recipes/pi-mono/recipe.json", "utf8"))))
    const piGraphIDs = piPlan.graph.map((module) => module.id)

    expect(graphIDs).toEqual(expect.arrayContaining(["turn.tool-executor.common", "opencode.product-shell.sdk", "opencode.product-shell.server"]))
    expect(piGraphIDs).toEqual(expect.arrayContaining(["turn.tool-executor.common", "pi.product-shell.sdk", "pi.product-shell.web-ui"]))
    expect(plan.lockfile).toMatchObject({
      schemaVersion: 1,
      recipeID: "opencode",
      recipeVersion: "0.1.0",
    })
    expect(plan.lockfile.bindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          capability: expect.objectContaining({ id: "turn.tool-executor" }),
          consumer: "recipe",
          provider: "opencode.turn.tool-executor",
        }),
      ]),
    )
    expect(plan.commonModules.map((module) => module.id)).toEqual(
      expect.arrayContaining(["provider.stream.openai-compatible", "tool.executor.default", "ui.renderer.noop", "turn.tool-executor.common"]),
    )
    expect(plan.personalityModules.map((module) => module.id)).toEqual(
      expect.arrayContaining([
        "opencode.product-shell.sdk",
        "opencode.product-shell.workspace",
        "opencode.product-shell.tui",
        "opencode.product-shell.web",
        "opencode.product-shell.desktop",
        "opencode.product-shell.slack",
        "opencode.product-shell.server",
        "opencode.product-shell.control-plane",
      ]),
    )
    expect(piPlan.personalityModules.map((module) => module.id)).toEqual(
      expect.arrayContaining([
        "pi.product-shell.package-manager",
        "pi.product-shell.sdk",
        "pi.product-shell.cli",
        "pi.product-shell.tui",
        "pi.product-shell.rpc",
        "pi.product-shell.web-ui",
        "pi.product-shell.server",
        "pi.product-shell.extension-examples",
        "pi.product-shell.browser-smoke",
        "pi.product-shell.release-hardening",
      ]),
    )
    expect(toolExecutor?.provides).toContain("turn.tool-executor")
  })

  it("compiles Nanobot as a third full product recipe from existing lego planes", () => {
    const plan = compileRecipe(nanobotRecipe)
    const graphIDs = plan.graph.map((module) => module.id)

    expect(plan.id).toBe("nanobot")
    expect(graphIDs).toEqual(
      expect.arrayContaining([
        "turn.tool-executor.common",
        "nanobot.product-shell.sdk",
        "nanobot.product-shell.cli",
        "nanobot.product-shell.tui",
        "nanobot.product-shell.web-ui",
        "nanobot.product-shell.server",
      ]),
    )
    expect(plan.personalityModules.map((module) => module.id)).toEqual(
      expect.arrayContaining(["nanobot.session.store.jsonl", "nanobot.plugin.loader", "nanobot.prompt.agent-builder"]),
    )
    expect(plan.modules.every((module) => !module.id.startsWith("opencode.") && !module.id.startsWith("pi."))).toBe(true)
  })

  it("diffs OpenCode and Pi recipes into common and personality modules", () => {
    const diff = diffRecipes(opencodeRecipe, piMonoRecipe)

    expect(diff.leftOnlyModules.map((module) => module.id)).toEqual(
      expect.arrayContaining([
        "opencode.product-shell.sdk",
        "opencode.product-shell.workspace",
        "opencode.product-shell.tui",
        "opencode.product-shell.web",
        "opencode.product-shell.desktop",
        "opencode.product-shell.slack",
        "opencode.product-shell.server",
        "opencode.product-shell.control-plane",
      ]),
    )
    expect(diff.rightOnlyModules.map((module) => module.id)).toEqual(
      expect.arrayContaining([
        "pi.product-shell.package-manager",
        "pi.product-shell.sdk",
        "pi.product-shell.cli",
        "pi.product-shell.tui",
        "pi.product-shell.rpc",
        "pi.product-shell.web-ui",
        "pi.product-shell.server",
        "pi.product-shell.extension-examples",
        "pi.product-shell.browser-smoke",
        "pi.product-shell.release-hardening",
      ]),
    )
    expect(diff.commonModules.map((module) => module.id)).toEqual(
      expect.arrayContaining(["runtime.assembly-graph.lockfile", "tool.executor.default", "ui.renderer.noop", "turn.tool-executor.common"]),
    )
    expect(diff.variantChanges).toEqual([])
    expect(diff.changedBindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          port: "session.store",
          leftProviders: ["opencode.session.store.sqlite-projection"],
          rightProviders: ["pi.session.store.jsonl-v3"],
        }),
        expect.objectContaining({
          port: "hook.bus",
          leftProviders: ["opencode.plugin.loader"],
          rightProviders: ["pi.extension.loader"],
        }),
        expect.objectContaining({
          port: "provider.stream",
          leftProviders: ["opencode.provider.plugin-descriptor"],
          rightProviders: ["pi.provider.extension-descriptor"],
        }),
      ]),
    )
    expect(diff.changedStrategies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "turn.context-builder",
          leftConfig: { variant: "opencode-prompt-context" },
          rightConfig: { variant: "pi-active-leaf-context" },
        }),
        expect.objectContaining({
          id: "tool.permission",
          leftConfig: { source: "opencode-plugin-hooks" },
          rightConfig: { source: "pi-extension-events" },
        }),
      ]),
    )
    expect(diff.changedPolicies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "shell.execution",
          leftConfig: { envHook: "shell.env", helper: "bun-dollar" },
          rightConfig: { envHook: "runtime.events", helper: "node-process" },
        }),
        expect.objectContaining({
          id: "extension.loading",
          leftConfig: { source: "opencode-plugin-loader" },
          rightConfig: { source: "pi-extension-loader" },
        }),
      ]),
    )
  })

  it("assembles an OpenCode/Pi hybrid harness with balanced port bindings", () => {
    const plan = compileRecipe(opencodePiHybridRecipe)
    const graphIDs = plan.graph.map((module) => module.id)
    const sourceCounts = opencodePiHybridRecipe.metadata?.composition as
      | { bindingSourceCounts?: Record<string, number>; productShellSourceCounts?: Record<string, number> }
      | undefined
    const harness = assembleOpenCodePiHybridHarness()

    expect(plan.id).toBe("opencode-pi-hybrid")
    expect(sourceCounts?.bindingSourceCounts).toMatchObject({ opencode: 48, "pi-mono": 48 })
    expect(sourceCounts?.productShellSourceCounts).toMatchObject({ opencode: 5, "pi-mono": 5 })
    expect(graphIDs).toEqual(
      expect.arrayContaining([
        "opencode.session.store.sqlite-projection",
        "opencode.plugin.loader",
        "opencode.tool-pack.native",
        "pi.turn.context-builder",
        "pi.provider.extension-descriptor",
        "pi.prompt.coding-agent-builder",
        "opencode.product-shell.sdk",
        "pi.product-shell.web-ui",
      ]),
    )
    expect(harness.product).toBe("opencode-pi-hybrid")
    expect(harness.recipe.id).toBe("opencode-pi-hybrid")
    expect(harness.hooks.services.get("opencode.sdk")).toBeTruthy()
    expect(harness.hooks.services.get("pi.sdk")).toBeTruthy()
    expect(harness.hooks.services.get("opencode-pi.hybrid.runtime")).toMatchObject({
      opencode: expect.arrayContaining(["session", "hooks", "tool-registry"]),
      "pi-mono": expect.arrayContaining(["prompt", "turn-profile", "acceptance"]),
    })
  })

  it("lets recipe metadata drive executable harness combo planes", () => {
    const comboRecipe: LegoRecipe = {
      ...opencodePiHybridRecipe,
      id: "opencode-pi-hybrid.nanobot-combo-test",
      metadata: {
        ...opencodePiHybridRecipe.metadata,
        product: "opencode-pi-hybrid",
        harnessCombo: {
          session: "nanobot",
          hooks: "nanobot",
          config: "nanobot",
          prompt: "nanobot",
          tools: "nanobot",
          turn: "nanobot",
          acceptance: "nanobot",
          providerPlugins: "none",
          surfaces: ["nanobot"],
        },
      },
    }

    const harness = assembleRecipeHarness(comboRecipe)
    expect(harness.product).toBe("opencode-pi-hybrid")
    expect(harness.hooks.services.get("harness.combo.blend")).toMatchObject({
      session: "nanobot",
      hooks: "nanobot",
      config: "nanobot",
      prompt: "nanobot",
      tools: "nanobot",
      turn: "nanobot",
      acceptance: "nanobot",
      providerPlugins: "none",
    })
    expect(harness.hooks.services.get("opencode-pi.hybrid.runtime")).toMatchObject({
      nanobot: expect.arrayContaining(["session", "hooks", "config", "prompt", "tool-registry", "turn-profile", "cadence", "acceptance"]),
    })
    expect(harness.hooks.services.get("nanobot.sdk")).toBeTruthy()
    expect(harness.hooks.services.get("opencode.sdk")).toBeUndefined()
  })

  it("rejects invalid capability declarations before assembly", () => {
    expect(() =>
      compileRecipe(
        {
          id: "versioned",
          version: "0.1.0",
          modules: [{ id: "consumer" }, { id: "provider" }],
          personalities: [],
        },
        [
          { id: "provider", provides: [{ id: "session.reader", version: "1.0.0" }] },
          { id: "consumer", provides: ["consumer"], requires: [{ id: "session.reader", version: "2.0.0" }] },
        ],
      ),
    ).toThrow(/requires missing capability session\.reader|ambiguous capability session\.reader/)

    expect(() =>
      compileRecipe(
        {
          id: "opencode",
          version: "0.1.0",
          modules: [{ id: "pi-only" }],
          personalities: ["opencode-session-personality"],
        },
        [{ id: "pi-only", provides: ["pi-sdk"], personality: "pi-mono" }],
      ),
    ).toThrow(/OpenCode recipe cannot include Pi personality module/)

    expect(() =>
      compileRecipe(
        {
          id: "resources",
          version: "0.1.0",
          modules: [{ id: "fetch-transport" }],
          personalities: [],
        },
        [{ id: "fetch-transport", provides: [{ id: "provider.transport" }] }],
      ),
    ).toThrow(/undeclared resource network/)
  })

  it("compiles a neutral minimal recipe from common session atoms", () => {
    const plan = compileRecipe(codingAgentMinimalRecipe)

    expect(plan.id).toBe("coding-agent.minimal")
    expect(plan.expandedPacks).toEqual([])
    expect(plan.modules.every((module) => !module.id.startsWith("opencode.") && !module.id.startsWith("pi.") && !module.id.startsWith("nanobot."))).toBe(true)
    expect(plan.personalityModules).toEqual([])
    expect(plan.commonModules.map((module) => module.id)).toEqual(
      expect.arrayContaining([
        "session.id-generator.deterministic",
        "session.event-log.memory",
        "session.message-store.memory",
        "session.projector.common-transcript",
        "session.context-selector.memory",
        "product.shell.minimal-cli",
      ]),
    )
    expect(plan.bindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          capability: expect.objectContaining({ id: "session.message-store" }),
          consumer: "recipe",
          provider: "session.message-store.memory",
          explicit: true,
        }),
        expect.objectContaining({
          capability: expect.objectContaining({ id: "session.context-selector" }),
          consumer: "recipe",
          provider: "session.context-selector.memory",
          explicit: true,
        }),
        expect.objectContaining({
          capability: expect.objectContaining({ id: "session.projector" }),
          consumer: "recipe",
          provider: "session.projector.common-transcript",
          explicit: true,
        }),
      ]),
    )
  })

  it("expands inline packs and recipe atoms into lockfile modules", () => {
    const plan = compileRecipe({
      id: "inline-pack",
      version: "0.1.0",
      modules: [{ id: "block.manifest.schema" }, { id: "runtime.module-catalog.memory" }, { id: "product.shell.minimal-cli" }],
      atoms: [{ id: "tool-pack.echo" }],
      packs: [
        {
          id: "inline.session",
          atoms: [
            "session.id-generator.deterministic",
            "session.event-log.memory",
            "session.message-store.memory",
            "session.projector.common-transcript",
            "session.context-selector.memory",
          ],
        },
      ],
      bindings: [
        { port: "session.id-generator", module: "session.id-generator.deterministic" },
        { port: "session.event-log", module: "session.event-log.memory" },
        { port: "session.message-store", module: "session.message-store.memory" },
        { port: "session.projector", module: "session.projector.common-transcript" },
        { port: "session.context-selector", module: "session.context-selector.memory" },
        { port: "tools", module: "tool-pack.echo" },
      ],
      requiredCapabilities: ["session.message-store", "tools"],
      personalities: [],
    })

    expect(plan.expandedPacks).toEqual([
      {
        id: "inline.session",
        atoms: [
          "session.id-generator.deterministic",
          "session.event-log.memory",
          "session.message-store.memory",
          "session.projector.common-transcript",
          "session.context-selector.memory",
        ],
      },
    ])
    expect(plan.lockfile.modules.map((module) => module.id)).toEqual(
      expect.arrayContaining(["session.id-generator.deterministic", "session.event-log.memory", "session.message-store.memory", "tool-pack.echo"]),
    )
    expect(plan.bindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ capability: expect.objectContaining({ id: "tools" }), provider: "tool-pack.echo", explicit: true }),
      ]),
    )
  })

  it("compiles declared swap recipes for recipe-level lego replacement", () => {
    const compiled = Object.entries(swapRecipes).map(([id, recipe]) => [id, compileRecipe(recipe)] as const)

    expect(compiled.map(([id]) => id)).toEqual(
      expect.arrayContaining([
        "opencode.session-jsonl",
        "pi.session-projection",
        "minimal.filesystem-tools",
        "minimal.no-shell",
        "opencode.echo-tools",
        "pi.echo-tools",
      ]),
    )
    expect(compiled).toHaveLength(6)
    expect(compiled.find(([id]) => id === "opencode.session-jsonl")?.[1].lockfile.bindings).toEqual(
      expect.arrayContaining([expect.objectContaining({ capability: expect.objectContaining({ id: "session.store" }), provider: "pi.session.store.jsonl-v3" })]),
    )
    expect(compiled.find(([id]) => id === "pi.session-projection")?.[1].lockfile.bindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ capability: expect.objectContaining({ id: "session.store" }), provider: "opencode.session.store.sqlite-projection" }),
      ]),
    )
    expect(compiled.find(([id]) => id === "minimal.no-shell")?.[1].lockfile.modules.find((module) => module.id === "tool-pack.echo")?.resources).toEqual(
      undefined,
    )
    expect(compiled.find(([id]) => id === "minimal.filesystem-tools")?.[1].lockfile.modules.find((module) => module.id === "tool-pack.filesystem")?.resources).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "filesystem" })]),
    )
    expect(compiled.find(([id]) => id === "opencode.echo-tools")?.[1].lockfile.bindings).toEqual(
      expect.arrayContaining([expect.objectContaining({ capability: expect.objectContaining({ id: "tools" }), provider: "tool-pack.echo" })]),
    )
    expect(compiled.find(([id]) => id === "pi.echo-tools")?.[1].lockfile.bindings).toEqual(
      expect.arrayContaining([expect.objectContaining({ capability: expect.objectContaining({ id: "tools" }), provider: "tool-pack.echo" })]),
    )
    expect(compiled.find(([id]) => id === "opencode.echo-tools")?.[1].modules.some((module) => module.id === "lego-tools")).toBe(false)
    expect(compiled.find(([id]) => id === "pi.echo-tools")?.[1].modules.some((module) => module.id === "lego-tools")).toBe(false)
  })

  it("supports recipe override dry-runs for storage, provider, permission, UI, and tool lego", () => {
    const cases = [
      { port: "session.store", module: "session.store.memory" },
      { port: "provider.stream", module: "provider.stream.openai-compatible" },
      { port: "tool.permission-policy", module: "tool.permission.always-deny" },
      { port: "ui.renderer", module: "ui.renderer.noop" },
      { port: "tools", module: "tool-pack.echo" },
    ]

    for (const item of cases) {
      const recipe = applyRecipeOverrides(opencodeRecipe, [{ port: item.port, module: item.module }])
      const plan = compileRecipe(recipe)
      expect(plan.modules.map((module) => module.id), item.port).toContain(item.module)
      expect(plan.lockfile.bindings, item.port).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            capability: expect.objectContaining({ id: item.port }),
            consumer: "recipe",
            provider: item.module,
            explicit: true,
          }),
        ]),
      )
    }
  })

  it("installs recipe-selected tool ports into assembled harness services", () => {
    const harness = assembleOpenCodeHarness()

    expect(isFilesystemPort(harness.hooks.services.get(filesystemPortToken))).toBe(true)
    expect(isProcessRunnerPort(harness.hooks.services.get(processRunnerPortToken))).toBe(true)
    expect(isToolPermissionPolicy(harness.hooks.services.get(toolPermissionPolicyToken))).toBe(true)
  })

  it("records module resource declarations for filesystem, network, shell, env, sqlite, and local extension execution", () => {
    const catalogResources = new Set(defaultRecipeModuleCatalog.flatMap((entry) => entry.resources ?? []).map((resource) => resource.id))
    expect([...catalogResources].sort()).toEqual(["env", "extension-runtime", "filesystem", "network", "shell", "sqlite"])

    const plan = compileRecipe({
      id: "resource-declarations",
      version: "0.1.0",
      modules: [
        { id: "contracts" },
        { id: "lego-runtime" },
        { id: "lego-hooks" },
        { id: "config-env-source" },
        { id: "session-store-sqlite" },
        { id: "extension-runtime-local" },
      ],
      requiredCapabilities: ["config.source.env", "session.store.sqlite", "extension.runtime"],
      personalities: [],
    })

    expect(plan.lockfile.modules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "config-env-source", resources: [expect.objectContaining({ id: "env", scope: "process" })] }),
        expect.objectContaining({ id: "session-store-sqlite", resources: [expect.objectContaining({ id: "sqlite", scope: "workspace" })] }),
        expect.objectContaining({
          id: "extension-runtime-local",
          resources: [expect.objectContaining({ id: "extension-runtime", mode: "execute" })],
        }),
      ]),
    )
  })

  it("supports recipe-level session atom swap dry-runs", () => {
    const piWithCommonStore: LegoRecipe = {
      ...piMonoRecipe,
      bindings: [...(piMonoRecipe.bindings ?? []).filter((binding) => binding.port !== "session.message-store"), { port: "session.message-store", module: "session.message-store.memory" }],
      requiredCapabilities: [...(piMonoRecipe.requiredCapabilities ?? []), "session.message-store"],
    }
    const opencodeWithCommonProjector: LegoRecipe = {
      ...opencodeRecipe,
      bindings: [...(opencodeRecipe.bindings ?? []).filter((binding) => binding.port !== "session.projector"), { port: "session.projector", module: "session.projector.common-transcript" }],
      requiredCapabilities: [...(opencodeRecipe.requiredCapabilities ?? []), "session.projector"],
    }

    const piPlan = compileRecipe(piWithCommonStore)
    const opencodePlan = compileRecipe(opencodeWithCommonProjector)

    expect(piPlan.lockfile.bindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          capability: expect.objectContaining({ id: "session.message-store" }),
          consumer: "recipe",
          provider: "session.message-store.memory",
          explicit: true,
        }),
      ]),
    )
    expect(opencodePlan.lockfile.bindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          capability: expect.objectContaining({ id: "session.projector" }),
          consumer: "recipe",
          provider: "session.projector.common-transcript",
          explicit: true,
        }),
      ]),
    )
  })

  it("exposes OpenCode SDK, server, workspace, and control-plane product surfaces", async () => {
    const harness = assembleOpenCodeHarness()
    const sdk = harness.hooks.services.get("opencode.sdk") as OpenCodeSDK
    const createServer = harness.hooks.services.get("opencode.server.factory") as (input?: { provider?: ReturnType<typeof surfaceProvider> }) => OpenCodeServer
    const tui = harness.hooks.services.get("opencode.tui") as OpenCodeTUISurface
    const web = harness.hooks.services.get("opencode.web") as OpenCodeWebSurface
    const desktop = harness.hooks.services.get("opencode.desktop") as OpenCodeDesktopSurface
    const slack = harness.hooks.services.get("opencode.slack") as OpenCodeSlackSurface

    expect(sdk.kind).toBe("opencode-sdk")
    expect(sdk.graph().map((module) => module.id)).toEqual(
      expect.arrayContaining([
        "opencode.product-shell.sdk",
        "opencode.product-shell.workspace",
        "opencode.product-shell.tui",
        "opencode.product-shell.web",
        "opencode.product-shell.desktop",
        "opencode.product-shell.slack",
        "opencode.product-shell.server",
        "opencode.product-shell.control-plane",
      ]),
    )

    const workspace = sdk.workspace()
    expect(workspace.product).toBe("opencode")
    expect(workspace.registries.tools).toEqual(expect.arrayContaining(["bash", "glob", "grep", "read", "skill", "todowrite", "webfetch", "write"]))
    expect(workspace.services).toEqual(
      expect.arrayContaining([
        "opencode.sdk",
        "opencode.workspace",
        "opencode.control-plane",
        "opencode.server.factory",
        "opencode.tui",
        "opencode.web",
        "opencode.desktop",
        "opencode.slack",
      ]),
    )

    const result = await sdk.runTurn({ text: "hello from sdk", provider: surfaceProvider("opencode sdk ok") })
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("opencode sdk ok")
    expect((await sdk.listSessions()).map((session) => session.id)).toContain(result.session.id)
    await expect(sdk.getSession(result.session.id)).resolves.toMatchObject({
      session: expect.objectContaining({ id: result.session.id }),
      transcript: expect.arrayContaining([expect.objectContaining({ role: "assistant" })]),
    })

    const controlPlane = sdk.controlPlane()
    expect(controlPlane.providers).toEqual(expect.arrayContaining(["opencode-builtin-codex", "opencode-builtin-xai"]))
    expect(controlPlane.routes).toContain("POST /v1/run")
    expect(controlPlane.routes).not.toContain("POST /v1/run/fake")

    expect(tui.render()).toContain("OpenCode TUI")
    expect(tui.dispatch({ type: "command", command: "/themes" })).toMatchObject({
      handled: true,
      snapshot: expect.objectContaining({ mode: "theme" }),
    })
    expect(tui.dispatch({ type: "select", target: "theme", value: "tokyonight" })).toMatchObject({
      handled: true,
      snapshot: expect.objectContaining({ theme: "tokyonight" }),
    })
    expect(tui.dispatch({ type: "select", target: "model", value: "opencode-builtin-codex" })).toMatchObject({
      handled: true,
      snapshot: expect.objectContaining({ model: "opencode-builtin-codex" }),
    })
    expect(tui.dispatch({ type: "submit", text: "hello from opencode tui" })).toMatchObject({
      handled: true,
      submittedText: "hello from opencode tui",
    })
    expect(tui.interactiveSnapshot().history).toContain("hello from opencode tui")
    expect(web.render()).toContain('data-opencode-web="ready"')
    expect(desktop.manifest()).toMatchObject({
      appID: "dev.opencode.helix",
      protocolHandlers: expect.arrayContaining(["opencode://workspace"]),
    })
    await expect(slack.handleCommand({ text: "test", userID: "U1" })).resolves.toMatchObject({
      response_type: "ephemeral",
      text: "Bot is working! I can hear you loud and clear.",
    })

    const surfaceDir = mkdtempSync(join(tmpdir(), "helix-opencode-surfaces-"))
    try {
      const webPath = web.write({ outDir: surfaceDir })
      const desktopBundle = desktop.writeBundle({ outDir: surfaceDir })
      expect(readFileSync(webPath, "utf8")).toContain("OpenCode Web Cockpit")
      expect(JSON.parse(readFileSync(desktopBundle.manifestPath, "utf8"))).toMatchObject({ appName: "OpenCode" })
      expect(readFileSync(desktopBundle.shellPath, "utf8")).toContain('data-opencode-desktop-shell="ready"')
    } finally {
      rmSync(surfaceDir, { recursive: true, force: true })
    }

    const server = createServer({ provider: surfaceProvider("opencode server ok") })
    try {
      const { url } = await server.listen()
      await expect(fetchJSON(`${url}/health`)).resolves.toMatchObject({ ok: true, product: "opencode" })
      await expect(fetchJSON(`${url}/v1/workspace`)).resolves.toMatchObject({
        recipeID: "opencode",
        registries: expect.objectContaining({ tools: expect.arrayContaining(["bash", "glob", "skill", "todowrite", "webfetch"]) }),
      })
      await expect(fetchJSON(`${url}/v1/control-plane`)).resolves.toMatchObject({
        product: "opencode",
        routes: expect.arrayContaining(["GET /v1/sessions", "GET /v1/web", "POST /v1/tui/event", "POST /v1/slack/command", "POST /v1/run"]),
      })
      await expect(fetchText(`${url}/v1/tui`)).resolves.toContain("OpenCode TUI")
      const tuiEventResponse = await fetch(`${url}/v1/tui/event`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "submit", text: "hello from opencode tui server" }),
      })
      expect(tuiEventResponse.status).toBe(200)
      expect(await tuiEventResponse.json()).toMatchObject({ handled: true, submittedText: "hello from opencode tui server" })
      await expect(fetchText(`${url}/v1/web`)).resolves.toContain('data-opencode-web="ready"')
      await expect(fetchJSON(`${url}/v1/desktop`)).resolves.toMatchObject({ appID: "dev.opencode.helix" })
      await expect(fetchJSON(`${url}/v1/slack/home`)).resolves.toMatchObject({ text: "OpenCode Slack bot is ready." })

      await expect(fetchJSON(`${url}/v1/run/fake`)).rejects.toThrow(/HTTP 404/)
      const body = await fetchJSON(`${url}/v1/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "hello from server" }),
      })
      expect((body as { session: { id: string } }).session.id).toMatch(/^ses_/)
      expect(JSON.stringify((body as { assistantMessage: { parts: unknown[] } }).assistantMessage.parts)).toContain("opencode server ok")
    } finally {
      await server.close()
    }
  })

  it("exposes Pi SDK, CLI, TUI, RPC, Web UI, package manager, examples, browser smoke, and release hardening surfaces", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "helix-pi-product-surfaces-"))
    try {
      const harness = assemblePiMonoHarness({
        cwd,
        projectConfig: {
          packages: ["npm:@example/pi-package"],
          extensions: [
            "npm:@example/pi-extension",
            "./local-extension.ts",
            { spec: "git:https://example.test/pi-extension.git", integrity: "sha256-test" },
          ],
        },
      })
      const sdk = harness.hooks.services.get("pi.sdk") as PiSDK
      const cli = harness.hooks.services.get("pi.cli") as PiCLISurface
      const tui = harness.hooks.services.get("pi.tui") as PiTUISurface
      const rpc = harness.hooks.services.get("pi.rpc") as PiRPCSurface
      const webUI = harness.hooks.services.get("pi.web-ui") as PiWebUISurface
      const createServer = harness.hooks.services.get("pi.server.factory") as (input?: { provider?: ReturnType<typeof surfaceProvider> }) => PiServer
      const packageManager = harness.hooks.services.get("pi.package-manager") as PiPackageManager
      const examples = harness.hooks.services.get("pi.extension-examples") as PiExtensionExamples
      const browserSmoke = harness.hooks.services.get("pi.browser-smoke") as PiBrowserSmoke
      const release = harness.hooks.services.get("pi.release-hardening") as PiReleaseHardening

      expect(sdk.kind).toBe("pi-sdk")
      expect(cli.kind).toBe("pi-cli")
      expect(tui.kind).toBe("pi-tui")
      expect(rpc.kind).toBe("pi-rpc")
      expect(webUI.kind).toBe("pi-web-ui")
      const serverProbe = createServer()
      expect(serverProbe.kind).toBe("pi-server")
      await serverProbe.close()

      const workspace = sdk.workspace()
      expect(workspace.product).toBe("pi-mono")
      expect(workspace.registries.tools).toEqual(expect.arrayContaining(["bash", "edit", "read", "write"]))
      expect(workspace.services).toEqual(
        expect.arrayContaining([
          "pi.sdk",
          "pi.cli",
          "pi.tui",
          "pi.rpc",
          "pi.web-ui",
          "pi.server.factory",
          "pi.package-manager",
          "pi.extension-examples",
          "pi.browser-smoke",
          "pi.release-hardening",
        ]),
      )
      expect(sdk.graph().map((module) => module.id)).toEqual(
        expect.arrayContaining([
          "pi.product-shell.sdk",
          "pi.product-shell.cli",
          "pi.product-shell.tui",
          "pi.product-shell.rpc",
          "pi.product-shell.web-ui",
          "pi.product-shell.server",
          "pi.product-shell.package-manager",
          "pi.product-shell.release-hardening",
        ]),
      )

      const sdkResult = await sdk.runTurn({ text: "hello from pi sdk", provider: surfaceProvider("pi sdk ok") })
      expect(JSON.stringify(sdkResult.assistantMessage.parts)).toContain("pi sdk ok")
      expect((await sdk.listSessions()).map((session) => session.id)).toContain(sdkResult.session.id)
      await expect(sdk.getSession(sdkResult.session.id)).resolves.toMatchObject({
        session: expect.objectContaining({ id: sdkResult.session.id }),
        transcript: expect.arrayContaining([expect.objectContaining({ role: "assistant" })]),
      })
      await expect(cli.run({ prompt: "hello from pi cli", provider: surfaceProvider("pi cli ok"), json: true })).resolves.toContain("pi cli ok")
      expect(cli.renderHelp()).toContain("pi packages")
      expect(tui.render()).toContain("Pi Mono TUI")
      expect(tui.dispatch({ type: "select", target: "theme", value: "dimGray" })).toMatchObject({
        handled: false,
        error: "Unknown theme: dimGray",
      })
      expect(tui.dispatch({ type: "select", target: "theme", value: "light" })).toMatchObject({
        handled: true,
        snapshot: expect.objectContaining({ theme: "light" }),
      })
      expect(tui.dispatch({ type: "select", target: "model", value: "claude-sonnet-4-5" })).toMatchObject({
        handled: true,
        snapshot: expect.objectContaining({ model: "claude-sonnet-4-5" }),
      })
      expect(tui.dispatch({ type: "submit", text: "hello from pi tui" })).toMatchObject({
        handled: true,
        submittedText: "hello from pi tui",
      })
      expect(tui.interactiveSnapshot().history).toContain("hello from pi tui")
      await expect(rpc.call("workspace.snapshot")).resolves.toMatchObject({ product: "pi-mono", recipeID: "pi-mono" })
      expect(rpc.methods()).not.toContain("run.fake")
      expect(rpc.methods()).not.toContain("run.turn")
      await expect(rpc.call("run.fake", { text: "hello from pi rpc" })).rejects.toThrow("Unknown pi.rpc method: run.fake")
      expect(webUI.render()).toContain('data-pi-web-ui="ready"')
      expect(webUI.render()).toContain('id="session-data" type="application/json"')

      const server = createServer({ provider: surfaceProvider("pi server ok") })
      try {
        const { url } = await server.listen()
        await expect(fetchJSON(`${url}/health`)).resolves.toMatchObject({ ok: true, product: "pi-mono" })
        await expect(fetchJSON(`${url}/v1/workspace`)).resolves.toMatchObject({
          recipeID: "pi-mono",
          services: expect.arrayContaining(["pi.sdk", "pi.server.factory"]),
        })
        await expect(fetchText(`${url}/v1/tui`)).resolves.toContain("Pi Mono TUI")
        const tuiEventResponse = await fetch(`${url}/v1/tui/event`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type: "select", target: "theme", value: "light" }),
        })
        expect(tuiEventResponse.status).toBe(200)
        expect(await tuiEventResponse.json()).toMatchObject({ handled: true, snapshot: expect.objectContaining({ theme: "light" }) })
        await expect(fetchText(`${url}/v1/web`)).resolves.toContain('data-pi-web-ui="ready"')
        await expect(fetchJSON(`${url}/v1/packages`)).resolves.toMatchObject({ product: "pi-mono" })
        await expect(fetchJSON(`${url}/v1/run/fake`)).rejects.toThrow(/HTTP 404/)
        const runResponse = await fetchJSON(`${url}/v1/run`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: "hello from pi server" }),
        })
        expect(JSON.stringify(runResponse)).toContain("pi server ok")
        const rpcRunResponse = await fetchJSON(`${url}/v1/rpc`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ method: "run.turn", params: { text: "hello from pi server rpc" } }),
        })
        expect(JSON.stringify(rpcRunResponse)).toContain("pi server ok")
      } finally {
        await server.close()
      }

      const plan = packageManager.plan()
      expect(plan.packages).toEqual([
        expect.objectContaining({ id: "@example/pi-package", kind: "npm", role: "package", importSpecifier: "@example/pi-package" }),
      ])
      expect(plan.extensions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "@example/pi-extension", kind: "npm", role: "extension" }),
          expect.objectContaining({ spec: "./local-extension.ts", kind: "local", path: join(cwd, "local-extension.ts") }),
          expect.objectContaining({ kind: "git", integrity: "sha256-test" }),
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
      expect(Array.from(harness.hooks.registries.flags.keys()).some((key) => key.startsWith("loaded-"))).toBe(true)
      for (const extension of loaded) await extension.dispose()

      const examplePaths = examples.materialize({ outDir: cwd })
      expect(examplePaths.map((path) => path.slice(cwd.length + 1))).toEqual(
        expect.arrayContaining(["extensions/uppercase.ts", "extensions/session-labeler.ts", "extensions/provider-registration.ts"]),
      )
      expect(readFileSync(join(cwd, "extensions", "uppercase.ts"), "utf8")).toContain("defineExtension")

      const smokePath = browserSmoke.write({ outDir: cwd })
      const smokeHTML = readFileSync(smokePath, "utf8")
      expect(smokeHTML).toContain('data-pi-browser-smoke="ready"')
      expect(smokeHTML).toContain('data-pi-browser-smoke-entry="scripts/browser-smoke-entry.ts"')
      expect(smokeHTML).toContain("pi.product-shell.package-manager")
      const webPath = webUI.write({ outDir: cwd })
      expect(readFileSync(webPath, "utf8")).toContain("Pi Mono Workbench")

      const verification = release.verify()
      expect(verification.ok).toBe(true)
      expect(verification.checks.every((check) => check.ok)).toBe(true)
      expect(verification.checks.map((check) => check.id)).toEqual(expect.arrayContaining([
        "browser-smoke-bundle-gate",
        "web-export-session-data",
        "release-local-install-policy",
        "shrinkwrap-and-dependency-policy",
      ]))
      const shrinkwrapPath = release.writeShrinkwrap({ outDir: cwd })
      expect(JSON.parse(readFileSync(shrinkwrapPath, "utf8"))).toMatchObject({
        product: "pi-mono",
        lockfileVersion: 1,
        generatedBy: "helix",
      })
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("assembles the OpenCode personality and runs a plugin-intercepted fixture turn", async () => {
    const harness = assembleOpenCodeHarness()
    await loadOpenCodePlugin({
      host: harness.hooks,
      plugin: async () => ({
        "tool.execute.before": (_input, output) => {
          output.args.prompt = `${String(output.args.prompt)} from opencode`
        },
        "tool.execute.after": (_input, output) => {
          output.output = `[plugin] ${output.output}`
        },
      }),
      pluginInput: { directory: process.cwd() },
      source: { id: "test-opencode-plugin" },
    })

    const result = await harness.runFixtureTurn({
      text: "hello",
      assistantText: "running",
      toolCalls: [{ toolName: "skill", input: { name: "test", prompt: "hi" } }],
    })

    expect(harness.session.kind).toBe("opencode-sqlite-native")
    expect(harness.graph.map((node) => node.id)).toEqual(
      expect.arrayContaining(["config.source.env", "prompt.system-builder.common", "ui.renderer.noop", "turn.tool-executor.common"]),
    )
    expect(result.transcript).toHaveLength(2)
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("[plugin] Skill recorded: test hi from opencode")
  })

  it("collects a redacted runtime event timeline from runFixtureTurn", async () => {
    const harness = assembleOpenCodeHarness()
    harness.hooks.on("input", () => undefined, {
      id: "trace-test-handler",
      name: "Trace test handler",
      path: "/home/example/private-hook.ts",
      scope: "project",
      order: 10,
    })
    const result = await harness.runFixtureTurn({
      text: "hello runtime trace secret prompt",
      assistantText: "running",
      toolCalls: [{ toolName: "skill", input: { name: "trace", prompt: "secret tool prompt /home/example" } }],
    })
    const eventTypes = result.runtimeTrace.events.map((event) => event.type)

    expect(result.runtimeTrace.source).toBe("runFixtureTurn")
    expect(result.runtimeTrace.summary).toMatchObject({
      events: expect.any(Number),
      uniqueEventTypes: expect.any(Number),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      redaction: "summary-only",
    })
    expect(eventTypes).toEqual(expect.arrayContaining([
      "input",
      "before_agent_start",
      "provider.request.before",
      "tool.call",
      "tool.result",
      "turn.pipeline.trace",
      "message.end",
    ]))
    expect(result.runtimeTrace.registrySnapshot.tools.map((tool) => tool.name)).toEqual(expect.arrayContaining(["skill"]))
    const inputHookSnapshot = result.runtimeTrace.hookSourceSnapshot.events.find((event) => event.event === "input")
    expect(inputHookSnapshot).toMatchObject({
      event: "input",
      observerCount: expect.any(Number),
      handlerCount: expect.any(Number),
    })
    expect(inputHookSnapshot?.handlerCount).toBeGreaterThanOrEqual(1)
    expect(inputHookSnapshot?.sourceOrder.map((record) => record.source.id)).toEqual(expect.arrayContaining([
      "trace-test-handler",
      "harness.runtime-trace.collector",
    ]))
    const traceHandler = inputHookSnapshot?.sourceOrder.find((record) => record.source.id === "trace-test-handler")
    expect(traceHandler).toMatchObject({
      kind: "handler",
      event: "input",
      source: {
        id: "trace-test-handler",
        name: "Trace test handler",
        scope: "project",
        order: 10,
        pathFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      },
    })
    expect(traceHandler?.source).not.toHaveProperty("path")
    const promptTrace = result.runtimeTrace.events.find((event) =>
      event.type === "turn.pipeline.trace" && (event.payload as Record<string, unknown>).stageID === "prompt.assemble"
    )
    expect(promptTrace?.payload).toMatchObject({
      stageID: "prompt.assemble",
      artifactKind: "trace",
      captureMode: "prompt-service",
      productProfile: "opencode",
      promptFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      sections: expect.arrayContaining(["base identity", "environment"]),
      resources: expect.any(Array),
      resourceCount: expect.any(Number),
      tokenEstimate: expect.any(Number),
      sanitizedPreview: expect.stringContaining("redacted prompt artifact"),
    })

    const providerRequest = result.runtimeTrace.events.find((event) => event.type === "provider.request.before")?.payload as Record<string, unknown>
    expect(providerRequest.request).toMatchObject({
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      messageCount: expect.any(Number),
      toolCount: expect.any(Number),
    })
    const toolCall = result.runtimeTrace.events.find((event) => event.type === "tool.call")?.payload as Record<string, unknown>
    expect(toolCall.input).toMatchObject({
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      keys: ["name", "prompt"],
    })
    const serializedTrace = JSON.stringify(result.runtimeTrace)
    expect(serializedTrace).not.toContain("hello runtime trace secret prompt")
    expect(serializedTrace).not.toContain("secret tool prompt")
    expect(serializedTrace).not.toContain("/home/example")
    expect(serializedTrace).not.toContain("private-hook.ts")

    const graph = buildAssembledFlowTrace({
      product: "opencode",
      events: result.runtimeTrace.events,
      contract: buildAssemblyContract({ product: "opencode", generatedAt: "2026-06-10T00:00:00.000Z" }),
      generatedAt: "2026-06-10T00:00:00.000Z",
      taskID: "read-only-answer",
      run: {
        steps: result.steps,
        ...(result.finish ? { finish: result.finish } : {}),
        providerRequestCount: eventTypes.filter((eventType) => eventType === "provider.request.before").length,
        toolSequence: ["skill"],
      },
    })
    expect(verifyHarnessFlowGraph(graph).ok).toBe(true)
    expect(graph.nodes.find((node) => node.id === "tool.plan")?.metrics.toolSequence).toEqual(["skill"])
    expect(graph.nodes.find((node) => node.id === "prompt.assemble")?.metrics.promptFingerprint).toMatch(/^[a-f0-9]{16}$/)
    expect(graph.evidence.find((item) => item.label === "prompt assembly artifact")).toMatchObject({
      kind: "prompt",
      metadata: {
        artifactKind: "trace",
        captureMode: "prompt-service",
        promptFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        sanitizedPreview: expect.stringContaining("redacted prompt artifact"),
      },
    })
  })

  it("maps OpenCode shell.env hooks into bash tool execution", async () => {
    const harness = assembleOpenCodeHarness()
    let shellEnvInput: { cwd?: string; callID?: string; sessionID?: string } | undefined
    await loadOpenCodePlugin({
      host: harness.hooks,
      plugin: async () => ({
        "shell.env": (input, output) => {
          shellEnvInput = input
          output.env.HELIX_SHELL_ENV = `${input.callID}:opencode`
        },
      }),
      pluginInput: { directory: process.cwd() },
      source: { id: "test-opencode-shell-env-plugin" },
    })

    const result = await harness.runFixtureTurn({
      text: "bash",
      assistantText: "running",
      toolCalls: [{ id: "bash-call", toolName: "bash", input: { command: "printf \"$HELIX_SHELL_ENV\"" } }],
    })

    expect(shellEnvInput).toMatchObject({ cwd: process.cwd(), callID: "bash-call" })
    expect(shellEnvInput?.sessionID).toBe(String(result.session.id))
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("bash-call:opencode")
  })

  it("maps OpenCode input, command, context, and tool definition hooks", async () => {
    const harness = assembleOpenCodeHarness()
    await loadOpenCodePlugin({
      host: harness.hooks,
      plugin: () => ({
        "chat.message": (_input, output) => {
          output.text = "patched input"
        },
        "command.execute.before": (_input, output) => {
          output.parts.push({ type: "text", text: "command preflight" })
        },
        "experimental.chat.messages.transform": (_input, output) => {
          output.messages = [{ role: "user", content: "patched context" }]
        },
        "tool.definition": (_input, output) => {
          output.description = "patched tool"
          output.parameters = { type: "object", properties: { text: { type: "string" } } }
        },
      }),
      pluginInput: { directory: process.cwd() },
      source: { id: "opencode-transform-plugin" },
    })

    await expect(harness.hooks.emit({ type: "input", timestamp: Date.now(), payload: { text: "hello" } })).resolves.toMatchObject({
      text: "patched input",
    })
    await expect(
      harness.hooks.emit({
        type: "command.before",
        sessionID: createID("session"),
        timestamp: Date.now(),
        payload: { command: "build", arguments: "--check" },
      }),
    ).resolves.toMatchObject({ parts: [{ type: "text", text: "command preflight" }] })
    await expect(harness.hooks.emit({ type: "context", timestamp: Date.now(), payload: { messages: [] } })).resolves.toMatchObject({
      messages: [{ role: "user", content: "patched context" }],
    })
    await expect(
      harness.hooks.emit({ type: "tool.definition", timestamp: Date.now(), payload: { toolID: "echo" } }),
    ).resolves.toMatchObject({
      description: "patched tool",
      parameters: { type: "object", properties: { text: { type: "string" } } },
    })
  })

  it("supports the @opencode-ai/plugin shim and experimental workspace registration", async () => {
    const harness = assembleOpenCodeHarness()
    const externalRegistrations: Array<{ type: string; adapter: unknown }> = []
    await loadOpenCodePlugin({
      host: harness.hooks,
      plugin: definePlugin((input) => {
        input.experimental_workspace?.register("tool", { name: "workspace-tool", source: "plugin" })
        return {
        "tool.execute.before": (_input, output) => {
            output.args.prompt = `${String(output.args.prompt)} via shim`
          },
        }
      }),
      pluginInput: {
        directory: process.cwd(),
        experimental_workspace: {
          register(type, adapter) {
            externalRegistrations.push({ type, adapter })
          },
        },
      },
      source: { id: "shim-plugin" },
    })

    const result = await harness.runFixtureTurn({
      text: "hello",
      assistantText: "running",
      toolCalls: [{ toolName: "skill", input: { name: "shim", prompt: "hi" } }],
    })

    expect(harness.hooks.services.get("opencode.experimental_workspace:tool")).toEqual([
      expect.objectContaining({
        type: "tool",
        adapter: { name: "workspace-tool", source: "plugin" },
        source: expect.objectContaining({ id: "shim-plugin" }),
      }),
    ])
    expect(harness.hooks.services.get("opencode.experimental_workspace:tool:shim-plugin")).toMatchObject({
      type: "tool",
      adapter: { name: "workspace-tool", source: "plugin" },
    })
    expect(externalRegistrations).toEqual([{ type: "tool", adapter: { name: "workspace-tool", source: "plugin" } }])
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("hi via shim")
  })

  it("registers OpenCode builtin auth/provider plugins", () => {
    const harness = assembleOpenCodeHarness()

    expect(openCodeBuiltinProviderIDs).toEqual([
      "codex",
      "github-copilot",
      "gitlab",
      "poe",
      "cloudflare",
      "azure",
      "digitalocean",
      "xai",
    ])
    expect(harness.hooks.services.get("opencode.auth:opencode-builtin-codex")).toMatchObject({
      id: "codex",
      strategy: "api-key",
      env: expect.arrayContaining(["CODEX_API_KEY", "OPENAI_API_KEY"]),
    })
    expect(harness.hooks.registries.auth.get("opencode-builtin-codex")).toMatchObject({
      name: "opencode-builtin-codex",
      config: expect.objectContaining({ id: "codex", strategy: "api-key" }),
      source: expect.objectContaining({ scope: "builtin" }),
    })
    expect(harness.hooks.services.get("opencode.provider:opencode-builtin-xai")).toMatchObject({
      id: "xai",
      packageName: "@opencode/provider-xai",
      protocol: "openai-compatible",
      baseURL: "https://api.x.ai/v1",
    })
    expect(harness.hooks.registries.providers.get("opencode-builtin-cloudflare")).toMatchObject({
      name: "opencode-builtin-cloudflare",
      config: expect.objectContaining({ id: "cloudflare", packageName: "@opencode/provider-cloudflare" }),
      source: expect.objectContaining({ scope: "builtin" }),
    })
  })

  it("injects an OpenCode-compatible Bun shell dollar helper into plugins", async () => {
    const harness = assembleOpenCodeHarness()
    let shellText = ""
    await loadOpenCodePlugin({
      host: harness.hooks,
      plugin: definePlugin(async (input) => {
        const result = await input.$!`printf ${"hello from shell dollar"}`
        shellText = result.text()
        return {
          "tool.execute.before": (_input, output) => {
            output.args.prompt = shellText
          },
        }
      }),
      pluginInput: { directory: process.cwd() },
      source: { id: "shell-dollar-plugin" },
    })

    const result = await harness.runFixtureTurn({
      text: "hello",
      assistantText: "running",
      toolCalls: [{ toolName: "skill", input: { name: "shell-dollar", prompt: "ignored" } }],
    })

    expect(shellText).toBe("hello from shell dollar")
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("hello from shell dollar")
  })

  it("loads OpenCode local and npm plugin specs in declared order", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "helix-opencode-plugins-"))
    const localPlugin = join(cwd, "local-plugin.mjs")
    writeFileSync(
      localPlugin,
      `
        export default () => ({
          "tool.execute.before": (_input, output) => {
            output.args.prompt = String(output.args.prompt) + " local"
          }
        })
      `,
      "utf8",
    )
    try {
      const harness = assembleOpenCodeHarness({ cwd })
      const loaded = await loadOpenCodePlugins({
        host: harness.hooks,
        plugins: [
          localPlugin,
          {
            spec: "npm:@example/opencode-plugin",
            source: { id: "npm-plugin", scope: "global" },
            options: { enabled: true },
          },
        ],
        pluginInput: { directory: cwd },
        importer: async (specifier) => {
          if (specifier !== "@example/opencode-plugin") return import(specifier)
          return {
            default: (_input: unknown, options: Record<string, unknown>) => ({
              config(config: Record<string, unknown>) {
                config["npmPluginConfigured"] = options.enabled
              },
              "tool.execute.before": (_input: unknown, output: { args: Record<string, unknown> }) => {
                output.args.prompt = `${String(output.args.prompt)} npm`
              },
            }),
          }
        },
        config: {},
      })

      const result = await harness.runFixtureTurn({
        text: "hello",
        assistantText: "running",
        toolCalls: [{ toolName: "skill", input: { name: "plugins", prompt: "hi" } }],
      })

      expect(loaded.map((plugin) => plugin.source)).toEqual([
        expect.objectContaining({ id: localPlugin, path: localPlugin, scope: "project" }),
        expect.objectContaining({ id: "npm-plugin", scope: "global" }),
      ])
      expect(JSON.stringify(result.assistantMessage.parts)).toContain("hi local npm")
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("loads an OpenCode npm provider package plugin into the provider registry", async () => {
    const harness = assembleOpenCodeHarness()
    const importedSpecifiers: string[] = []
    const loaded = await loadOpenCodePlugins({
      host: harness.hooks,
      plugins: [
        {
          spec: "npm:@opencode/provider-poe",
          source: { id: "opencode-provider-poe", scope: "global" },
          options: { protocol: "custom", model: "poe/sage" },
        },
      ],
      pluginInput: { directory: process.cwd() },
      importer: async (specifier) => {
        importedSpecifiers.push(specifier)
        if (specifier !== "@opencode/provider-poe") return import(specifier)
        return {
          default: (_input: unknown, options: Record<string, unknown>) => ({
            auth: { id: "poe", strategy: "api-key", env: ["POE_API_KEY"] },
            provider: {
              id: "poe",
              packageName: "@opencode/provider-poe",
              protocol: options.protocol,
              models: [options.model],
            },
          }),
        }
      },
    })

    expect(importedSpecifiers).toEqual(["@opencode/provider-poe"])
    expect(loaded.map((plugin) => plugin.source)).toEqual([
      expect.objectContaining({ id: "opencode-provider-poe", scope: "global" }),
    ])
    expect(harness.hooks.services.get("opencode.auth:opencode-provider-poe")).toMatchObject({
      id: "poe",
      strategy: "api-key",
      env: ["POE_API_KEY"],
    })
    expect(harness.hooks.services.get("opencode.provider:opencode-provider-poe")).toMatchObject({
      id: "poe",
      packageName: "@opencode/provider-poe",
      protocol: "custom",
      models: ["poe/sage"],
    })
    expect(harness.hooks.registries.providers.get("opencode-provider-poe")).toMatchObject({
      name: "opencode-provider-poe",
      config: expect.objectContaining({
        id: "poe",
        packageName: "@opencode/provider-poe",
        protocol: "custom",
      }),
      source: expect.objectContaining({ id: "opencode-provider-poe", scope: "global" }),
    })
  })

  it("orders OpenCode provider request hooks by plugin load source", async () => {
    const harness = assembleOpenCodeHarness()
    const seen: string[] = []

    await loadOpenCodePlugin({
      host: harness.hooks,
      plugin: () => ({
        "chat.params": (_input, output) => {
          seen.push("first:params")
          output.temperature = 0.25
          output.options = { ...(output.options as Record<string, unknown>), winner: "first" }
        },
        "chat.headers": (_input, output) => {
          seen.push("first:headers")
          output.headers["x-opencode-first"] = "1"
        },
      }),
      pluginInput: { directory: process.cwd() },
      source: { id: "opencode-provider-first" },
    })
    await loadOpenCodePlugin({
      host: harness.hooks,
      plugin: () => ({
        "chat.params": (_input, output) => {
          seen.push("second:params")
          output.temperature = 0.75
          output.options = { ...(output.options as Record<string, unknown>), winner: "second" }
        },
      }),
      pluginInput: { directory: process.cwd() },
      source: { id: "opencode-provider-second" },
    })

    const result = await harness.hooks.emit({
      type: "provider.request.before",
      timestamp: Date.now(),
      payload: {
        temperature: 0,
        topP: 1,
        topK: 0,
        maxOutputTokens: 128,
        options: { seed: "base" },
      },
    })
    const hookOrder = harness.hooks
      .snapshotHookSources(["provider.request.before"])
      .events.find((event) => event.event === "provider.request.before")
      ?.sourceOrder.filter((record) => record.kind === "handler" && record.source.id.startsWith("opencode-provider-"))
      .map((record) => `${record.source.id}:${record.event}`)

    expect(seen).toEqual(["first:params", "first:headers", "second:params"])
    expect(hookOrder).toEqual([
      "opencode-provider-first:provider.request.before",
      "opencode-provider-first:provider.request.before",
      "opencode-provider-second:provider.request.before",
    ])
    expect(result).toMatchObject({
      providerOptions: {
        temperature: 0.75,
        topP: 1,
        topK: 0,
        maxOutputTokens: 128,
        options: { seed: "base", winner: "second" },
      },
      headers: { "x-opencode-first": "1" },
    })
  })

  it("maps OpenCode and Pi provider extensions into common registries", async () => {
    const opencode = assembleOpenCodeHarness()
    const scope = await loadOpenCodePlugin({
      host: opencode.hooks,
      plugin: () => ({
        auth: { type: "api-key", env: ["EXAMPLE_TOKEN"] },
        provider: { id: "opencode-provider", npm: "@example/provider" },
        ui: { name: "opencode-panel" },
      }),
      pluginInput: { directory: process.cwd() },
      source: { id: "test-opencode-provider-plugin" },
    })

    const pi = assemblePiMonoHarness()
    await loadPiExtension({
      host: pi.hooks,
      extension: (api) => {
        api.registerProvider("test-pi-provider", { package: "@example/pi-provider" })
        api.registerUIProvider("test-pi-ui", { package: "@example/pi-ui" })
      },
      source: { id: "test-pi-provider-extension" },
    })

    expect(opencode.hooks.registries.auth.get("test-opencode-provider-plugin")).toMatchObject({
      name: "test-opencode-provider-plugin",
      config: { type: "api-key", env: ["EXAMPLE_TOKEN"] },
      source: { id: "test-opencode-provider-plugin" },
    })
    expect(opencode.hooks.registries.providers.get("test-opencode-provider-plugin")).toMatchObject({
      name: "test-opencode-provider-plugin",
      config: { id: "opencode-provider", npm: "@example/provider" },
      source: { id: "test-opencode-provider-plugin" },
    })
    expect(opencode.hooks.registries.uiProviders.get("test-opencode-provider-plugin")).toMatchObject({
      name: "test-opencode-provider-plugin",
      provider: { name: "opencode-panel" },
      source: { id: "test-opencode-provider-plugin" },
    })
    expect(pi.hooks.registries.providers.get("test-pi-provider")).toMatchObject({
      name: "test-pi-provider",
      config: { package: "@example/pi-provider" },
      source: { id: "test-pi-provider-extension" },
    })
    expect(pi.hooks.registries.uiProviders.get("test-pi-ui")).toMatchObject({
      name: "test-pi-ui",
      provider: { package: "@example/pi-ui" },
      source: { id: "test-pi-provider-extension" },
    })

    await scope.dispose()
    expect(opencode.hooks.registries.auth.has("test-opencode-provider-plugin")).toBe(false)
    expect(opencode.hooks.registries.providers.has("test-opencode-provider-plugin")).toBe(false)
    expect(opencode.hooks.registries.uiProviders.has("test-opencode-provider-plugin")).toBe(false)
  })

  it("replays OpenCode provider plugin reload cleanup before replacement registration", async () => {
    const harness = assembleOpenCodeHarness()
    const source = { id: "opencode-reload-provider" }
    const firstScope = await loadOpenCodePlugin({
      host: harness.hooks,
      plugin: () => ({
        provider: { id: "reload-provider", generation: "first" },
        "chat.params": (_input, output) => {
          output.options = { ...(output.options as Record<string, unknown>), providerGeneration: "first" }
        },
      }),
      pluginInput: { directory: process.cwd() },
      source,
    })

    expect(harness.hooks.services.get("opencode.provider:opencode-reload-provider")).toEqual({
      id: "reload-provider",
      generation: "first",
    })
    expect(harness.hooks.registries.providers.get("opencode-reload-provider")).toMatchObject({
      name: "opencode-reload-provider",
      config: { id: "reload-provider", generation: "first" },
    })
    await expect(
      harness.hooks.emit({
        type: "provider.request.before",
        timestamp: Date.now(),
        payload: { options: {} },
      }),
    ).resolves.toMatchObject({
      providerOptions: {
        options: { providerGeneration: "first" },
      },
    })

    await firstScope.dispose()
    expect(harness.hooks.services.has("opencode.provider:opencode-reload-provider")).toBe(false)
    expect(harness.hooks.registries.providers.has("opencode-reload-provider")).toBe(false)
    await expect(
      harness.hooks.emit({
        type: "provider.request.before",
        timestamp: Date.now(),
        payload: { options: {} },
      }),
    ).resolves.toBeUndefined()

    const secondScope = await loadOpenCodePlugin({
      host: harness.hooks,
      plugin: () => ({
        provider: { id: "reload-provider", generation: "second" },
        "chat.params": (_input, output) => {
          output.options = { ...(output.options as Record<string, unknown>), providerGeneration: "second" }
        },
      }),
      pluginInput: { directory: process.cwd() },
      source,
    })

    expect(harness.hooks.services.get("opencode.provider:opencode-reload-provider")).toEqual({
      id: "reload-provider",
      generation: "second",
    })
    expect(harness.hooks.registries.providers.get("opencode-reload-provider")).toMatchObject({
      name: "opencode-reload-provider",
      config: { id: "reload-provider", generation: "second" },
    })
    await expect(
      harness.hooks.emit({
        type: "provider.request.before",
        timestamp: Date.now(),
        payload: { options: {} },
      }),
    ).resolves.toMatchObject({
      providerOptions: {
        options: { providerGeneration: "second" },
      },
    })

    await secondScope.dispose()
    expect(harness.hooks.services.has("opencode.provider:opencode-reload-provider")).toBe(false)
    expect(harness.hooks.registries.providers.has("opencode-reload-provider")).toBe(false)
  })

  it("assembles the Pi personality and runs an extension-intercepted fixture turn", async () => {
    const harness = assemblePiMonoHarness()
    await loadPiExtension({
      host: harness.hooks,
      extension: (pi) => {
        pi.on("tool_call", (event) => {
          const payload = event as { toolName: string; input: Record<string, unknown> }
          if (payload.toolName === "danger") return { block: true, reason: "blocked by pi extension" }
        })
        pi.registerTool({
          name: "upper",
          description: "Uppercase text.",
          execute(_id, input) {
            return {
              content: [{ id: createID("part"), type: "text", text: String(input.text ?? "").toUpperCase() }],
            }
          },
        })
      },
      source: { id: "test-pi-extension" },
    })

    const result = await harness.runFixtureTurn({
      text: "hello",
      assistantText: "running",
      toolCalls: [
        { toolName: "upper", input: { text: "pi" } },
        { toolName: "danger", input: { text: "nope" } },
      ],
    })

    expect(harness.session.kind).toBe("jsonl-tree")
    expect(harness.graph.map((node) => node.id)).toEqual(
      expect.arrayContaining(["config.source.env", "prompt.system-builder.common", "ui.renderer.noop", "turn.tool-executor.common"]),
    )
    expect(result.blockedTools).toEqual([{ toolName: "danger", reason: "blocked by pi extension" }])
    expect(JSON.stringify(result.assistantMessage.parts)).toContain("PI")
    expect((await harness.session.messages({ sessionID: result.session.id }))).toHaveLength(2)
  })

  it("exposes Pi ctx.ui, readonly sessionManager, custom events, and renderers", async () => {
    const harness = assemblePiMonoHarness()
    const session = await harness.session.create({ title: "ctx session" })
    const storageDir = String(harness.hooks.services.get("storageDir"))
    const nestedDir = join(storageDir, "nested-project")
    mkdirSync(nestedDir)
    writeFileSync(
      join(nestedDir, "nested-session.jsonl"),
      `${JSON.stringify({ type: "session", version: 3, id: "ses_nested_ctx", timestamp: 1, cwd: process.cwd(), title: "nested ctx" })}\n`,
    )
    const seen: unknown[] = []
    await loadPiExtension({
      host: harness.hooks,
      extension: (pi) => {
        pi.on("pi.custom", async (event, ctx) => {
          ctx.ui.notify("from ctx.ui", "info")
          const sessions = await ctx.sessionManager?.listAll()
          const transcript = await ctx.sessionManager?.transcript(session.id)
          seen.push({ event, sessions: sessions?.map((item) => item.title).sort(), messages: transcript?.messages.length })
        })
        pi.registerMessageRenderer("badge", (part) => {
          const data = (part as { data?: { label?: string } }).data
          return { label: data?.label ?? "missing" }
        })
      },
      source: { id: "pi-context-extension" },
    })
    const emitter = await loadPiExtension({
      host: harness.hooks,
      extension: (pi) => {
        pi.events.emit("pi.custom", { value: 1 })
      },
      source: { id: "pi-emitter-extension" },
    })
    await emitter.events.emit("pi.custom", { value: 2 })

    const rendered = harness.ui.renderers.renderMessagePart({
      id: createID("part"),
      type: "custom",
      customType: "badge",
      data: { label: "ok" },
    })

    expect(seen).toEqual([
      { event: { value: 1 }, sessions: ["ctx session", "nested ctx"], messages: 0 },
      { event: { value: 2 }, sessions: ["ctx session", "nested ctx"], messages: 0 },
    ])
    expect((harness.ui as unknown as { notifications: unknown[] }).notifications).toEqual(
      expect.arrayContaining([expect.objectContaining({ message: "from ctx.ui", type: "info" })]),
    )
    expect(harness.hooks.registries.messageRenderers.get("badge")).toMatchObject({
      customType: "badge",
      source: { id: "pi-context-extension" },
    })
    expect(rendered).toEqual({ kind: "custom", customType: "badge", data: { label: "ok" } })
  })

  it("loads Pi local, npm, and git extension specs in declared order", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "helix-pi-extensions-"))
    const localExtension = join(cwd, "local-extension.mjs")
    writeFileSync(
      localExtension,
      `
        export default (pi) => {
          pi.registerFlag("local-loaded", { type: "boolean", default: true })
        }
      `,
      "utf8",
    )
    try {
      const harness = assemblePiMonoHarness({ cwd })
      const loaded = await loadPiExtensions({
        host: harness.hooks,
        extensions: [localExtension, "npm:@example/pi-extension", "git:https://example.test/pi-extension.git"],
        cwd,
        importer: async (specifier) => {
          if (specifier !== "@example/pi-extension" && specifier !== "git:https://example.test/pi-extension.git") return import(specifier)
          return {
            default: (pi: { registerFlag(name: string, options: { type: "boolean"; default: boolean }): void }) => {
              pi.registerFlag(specifier.startsWith("git:") ? "git-loaded" : "npm-loaded", { type: "boolean", default: true })
            },
          }
        },
      })

      expect(loaded.map((extension) => extension.source)).toEqual([
        expect.objectContaining({ id: localExtension, path: localExtension, scope: "project" }),
        expect.objectContaining({ id: "npm:@example/pi-extension", scope: "project" }),
        expect.objectContaining({ id: "git:https://example.test/pi-extension.git", scope: "project" }),
      ])
      expect(Array.from(harness.hooks.registries.flags.keys())).toEqual(["local-loaded", "npm-loaded", "git-loaded"])
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("loads Pi TypeScript extensions through the default jiti-like importer", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "helix-pi-ts-extension-"))
    const tsExtension = join(cwd, "typed-extension.ts")
    writeFileSync(
      tsExtension,
      `
        import type { PiExtensionAPI } from "@earendil-works/pi-coding-agent"

        export default function typedExtension(pi: PiExtensionAPI): void {
          pi.registerFlag("typed-loaded", { type: "boolean", default: true })
          pi.registerTool({
            name: "typedEcho",
            description: "Echo through a TypeScript extension.",
            execute(_id, input: { text?: unknown }) {
              return { content: [{ id: "part-typed", type: "text", text: String(input.text ?? "") + " typed" }] }
            },
          })
        }
      `,
      "utf8",
    )
    try {
      const harness = assemblePiMonoHarness({ cwd })
      const loaded = await loadPiExtensions({ host: harness.hooks, extensions: [tsExtension], cwd })
      const result = await harness.runFixtureTurn({
        text: "hello",
        assistantText: "running",
        toolCalls: [{ toolName: "typedEcho", input: { text: "hi" } }],
      })

      expect(loaded).toEqual([
        expect.objectContaining({ source: expect.objectContaining({ id: tsExtension, path: tsExtension }) }),
      ])
      expect(harness.hooks.registries.flags.get("typed-loaded")).toMatchObject({ default: true })
      expect(JSON.stringify(result.assistantMessage.parts)).toContain("hi typed")
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("hot reloads Pi extensions by disposing old registrations before loading the new module", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "helix-pi-hot-reload-"))
    const tsExtension = join(cwd, "hot-extension.ts")
    const writeExtension = (version: string) => {
      writeFileSync(
        tsExtension,
        `
          import type { PiExtensionAPI } from "@earendil-works/pi-coding-agent"

          export default function hotExtension(pi: PiExtensionAPI): void {
            pi.registerFlag("hot-${version}", { type: "boolean", default: true })
          }
        `,
        "utf8",
      )
    }
    try {
      const harness = assemblePiMonoHarness({ cwd })
      writeExtension("v1")
      const [loaded] = await loadPiExtensions({ host: harness.hooks, extensions: [tsExtension], cwd })
      expect(Array.from(harness.hooks.registries.flags.keys())).toEqual(["hot-v1"])

      writeExtension("v2")
      const reloaded = await loaded!.reload()
      expect(reloaded.source).toMatchObject({ id: tsExtension, path: tsExtension })
      expect(Array.from(harness.hooks.registries.flags.keys())).toEqual(["hot-v2"])

      await reloaded.dispose()
      expect(Array.from(harness.hooks.registries.flags.keys())).toEqual([])
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("supports the @earendil-works/pi-coding-agent extension shim", async () => {
    const harness = assemblePiMonoHarness()
    await loadPiExtension({
      host: harness.hooks,
      extension: defineExtension((pi) => {
        pi.registerTool({
          name: "shimUpper",
          description: "Uppercase text through the Pi shim.",
          execute(_id, input) {
            return { content: [{ id: createID("part"), type: "text", text: String(input.text ?? "").toUpperCase() }] }
          },
        })
      }),
      source: { id: "pi-shim-extension" },
    })

    const result = await harness.runFixtureTurn({
      text: "hello",
      assistantText: "running",
      toolCalls: [{ toolName: "shimUpper", input: { text: "shim" } }],
    })

    expect(JSON.stringify(result.assistantMessage.parts)).toContain("SHIM")
    expect(harness.hooks.registries.tools.get("shimUpper")).toMatchObject({ name: "shimUpper" })
  })
})

function surfaceProvider(text: string) {
  return createOpenAICompatibleProvider({
    id: "surface-test",
    models: [{ providerID: "surface-test", modelID: "surface-model" }],
    transport: createMockSSEProviderTransport([
      `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`,
      'data: {"choices":[{"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":8,"completion_tokens":4}}\n\n',
      "data: [DONE]\n\n",
    ]),
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
