import { describe, expect, it } from "vitest"
import type { LegoCapabilityInput, LegoModuleManifest } from "@helix/contracts"
import { createServiceToken } from "@helix/contracts"
import {
  AssemblyGraph,
  BindingPlanner,
  createManifest,
  createRuntimeProductAtoms,
  LifecycleRunner,
  ModuleCatalog,
  ModuleRegistry,
  CapabilityResolver,
  runtimeProductProfile,
} from "@helix/lego-runtime"

describe("ModuleRegistry conformance", () => {
  it("exposes product-specific runtime atoms for OpenCode, Pi, and Nanobot", () => {
    const products = ["opencode", "pi-mono", "nanobot"] as const

    for (const product of products) {
      const atoms = createRuntimeProductAtoms(product)
      const profile = runtimeProductProfile(product)

      expect(atoms.moduleAliases.resolve("sdk")).toBe(profile.moduleAliases["sdk"])
      expect(atoms.bindingDefaults.moduleForPort("hook.bus")).toBe(profile.bindingDefaults["hook.bus"])
      expect(atoms.lifecycleDefaults.scopesFor("hook.bus")).toContain("turn")
      expect(atoms.graphLabels.labelFor(profile.bindingDefaults["prompt.system-builder"] ?? "")).not.toEqual("")
    }

    expect(createRuntimeProductAtoms("nanobot").capabilityAliases.resolve("agent.bus")).toBe("event.log")
  })

  it("resolves capabilities, assembles lifecycle, and exposes a stable graph", async () => {
    const registry = new ModuleRegistry()
    const lifecycle: string[] = []

    for (const manifest of [
      moduleManifest("contracts", "core", ["contracts"]),
      moduleManifest("session", "storage", ["session"], ["contracts"]),
      moduleManifest("hooks", "hook", ["hooks"], ["contracts"]),
      moduleManifest("agent-loop", "core", ["agent-loop"], ["session", "hooks"]),
    ]) {
      registry.register(manifest, (ctx) => ({
        manifest,
        init() {
          lifecycle.push(`${manifest.id}:init:${ctx.services.size}`)
        },
        start() {
          lifecycle.push(`${manifest.id}:start`)
        },
      }))
    }

    const result = await registry.assemble({
      id: "test-harness",
      version: "0.1.0",
      modules: [{ id: "agent-loop" }, { id: "hooks" }, { id: "session" }, { id: "contracts" }],
      personalities: [],
    })

    expect(result.graph).toMatchInlineSnapshot(`
      [
        {
          "id": "contracts",
          "provides": [
            "contracts",
          ],
          "requires": [],
        },
        {
          "id": "session",
          "provides": [
            "session",
          ],
          "requires": [
            "contracts",
          ],
        },
        {
          "id": "hooks",
          "provides": [
            "hooks",
          ],
          "requires": [
            "contracts",
          ],
        },
        {
          "id": "agent-loop",
          "provides": [
            "agent-loop",
          ],
          "requires": [
            "session",
            "hooks",
          ],
        },
      ]
    `)
    expect(result.context.services.get("agent-loop")).toBe(result.instances.at(-1))
    expect(result.context.services.get("session")).toBe(result.instances.find((instance) => instance.manifest.id === "session"))
    expect(lifecycle).toEqual([
      "contracts:init:1",
      "session:init:2",
      "hooks:init:3",
      "agent-loop:init:4",
      "contracts:start",
      "session:start",
      "hooks:start",
      "agent-loop:start",
    ])
  })

  it("rejects missing required capabilities", () => {
    const registry = new ModuleRegistry()
    registry.register(moduleManifest("agent-loop", "core", ["agent-loop"], ["session"]), () => ({
      manifest: moduleManifest("agent-loop", "core", ["agent-loop"], ["session"]),
    }))

    expect(() =>
      registry.resolve({
        id: "broken",
        version: "0.1.0",
        modules: [{ id: "agent-loop" }],
        personalities: [],
      }),
    ).toThrow(/requires missing capability session/)
  })

  it("supports structured capabilities, explicit bindings, typed service tokens, and assembly lockfiles", async () => {
    const registry = new ModuleRegistry()
    const readerToken = createServiceToken<{ name: string }>("session.reader")

    const contracts = moduleManifest("contracts", "core", ["contracts"])
    const memorySession = moduleManifest(
      "session-memory",
      "atom",
      [{ id: "session.reader", kind: "implementation", variant: "memory", stability: "stable" }],
      ["contracts"],
    )
    const jsonlSession = moduleManifest(
      "session-jsonl",
      "atom",
      [{ id: "session.reader", kind: "implementation", variant: "jsonl-tree", stability: "stable" }],
      ["contracts"],
    )
    const sdk = moduleManifest("sdk", "product-shell", ["sdk.surface"], [{ id: "session.reader", kind: "port" }])

    registry.register(contracts, () => ({ manifest: contracts }))
    registry.register(memorySession, () => ({ manifest: memorySession }))
    registry.register(jsonlSession, (ctx) => ({
      manifest: jsonlSession,
      init() {
        ctx.setService?.(readerToken, { name: "jsonl" })
      },
    }))
    registry.register(sdk, (ctx) => ({
      manifest: sdk,
      init() {
        expect(ctx.requireService?.(readerToken)).toEqual({ name: "jsonl" })
      },
    }))

    const result = await registry.assemble({
      id: "bound",
      version: "0.1.0",
      modules: [{ id: "sdk" }, { id: "session-memory" }, { id: "session-jsonl" }, { id: "contracts" }],
      bindings: [{ port: "session.reader", module: "session-jsonl" }],
      personalities: [],
    })

    expect(result.context.getService?.(readerToken)).toEqual({ name: "jsonl" })
    expect(result.bindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          capability: expect.objectContaining({ id: "session.reader" }),
          consumer: "sdk",
          provider: "session-jsonl",
          explicit: true,
          candidates: ["session-memory", "session-jsonl"],
        }),
      ]),
    )
    expect(result.lockfile).toMatchObject({
      schemaVersion: 1,
      recipeID: "bound",
      recipeVersion: "0.1.0",
      modules: expect.arrayContaining([
        expect.objectContaining({
          id: "session-jsonl",
          kind: "atom",
          provides: [expect.objectContaining({ id: "session.reader", variant: "jsonl-tree" })],
        }),
      ]),
    })
  })

  it("rejects ambiguous single capability bindings unless the recipe selects one", () => {
    const registry = new ModuleRegistry()
    const memorySession = moduleManifest("session-memory", "atom", [{ id: "session.reader", variant: "memory" }])
    const jsonlSession = moduleManifest("session-jsonl", "atom", [{ id: "session.reader", variant: "jsonl-tree" }])
    const sdk = moduleManifest("sdk", "product-shell", ["sdk.surface"], [{ id: "session.reader" }])

    registry.register(memorySession, () => ({ manifest: memorySession }))
    registry.register(jsonlSession, () => ({ manifest: jsonlSession }))
    registry.register(sdk, () => ({ manifest: sdk }))

    expect(() =>
      registry.resolve({
        id: "ambiguous",
        version: "0.1.0",
        modules: [{ id: "sdk" }, { id: "session-memory" }, { id: "session-jsonl" }],
        personalities: [],
      }),
    ).toThrow(/Ambiguous capability session\.reader/)
  })

  it("allows multi capabilities to bind multiple providers", async () => {
    const registry = new ModuleRegistry()
    const observerA = moduleManifest("observer-a", "atom", [{ id: "hook.observer", multiplicity: "multi" }])
    const observerB = moduleManifest("observer-b", "atom", [{ id: "hook.observer", multiplicity: "multi" }])
    const hookHost = moduleManifest("hook-host", "hook", ["hook.host"], [{ id: "hook.observer", multiplicity: "multi" }])

    registry.register(observerA, () => ({ manifest: observerA }))
    registry.register(observerB, () => ({ manifest: observerB }))
    registry.register(hookHost, () => ({ manifest: hookHost }))

    const result = await registry.assemble({
      id: "multi",
      version: "0.1.0",
      modules: [{ id: "hook-host" }, { id: "observer-a" }, { id: "observer-b" }],
      personalities: [],
    })

    expect(result.bindings.map((binding) => binding.provider)).toEqual(["observer-a", "observer-b"])
    expect(result.context.services.get("hook.observer[]")).toHaveLength(2)
  })

  it("continues when an optional capability has no provider", async () => {
    const registry = new ModuleRegistry()
    const shell = createManifest({
      id: "shell",
      version: "0.1.0",
      kind: "product-shell",
      provides: ["shell.surface"],
      optional: ["telemetry.sink"],
    })
    registry.register(shell, (ctx) => ({
      manifest: shell,
      init() {
        expect(ctx.getService?.("telemetry.sink")).toBeUndefined()
      },
    }))

    const result = await registry.assemble({
      id: "optional",
      version: "0.1.0",
      modules: [{ id: "shell" }],
      personalities: [],
    })

    expect(result.bindings).toEqual([])
    expect(result.context.services.get("shell.surface")).toBe(result.instances[0])
  })

  it("disposes lifecycle scopes from narrow to broad without double-disposing instances", async () => {
    const lifecycle = new LifecycleRunner()
    const events: string[] = []
    const manifests = [
      scopedManifest("process-root", "process"),
      scopedManifest("workspace-store", "workspace"),
      scopedManifest("session-cache", "session"),
      scopedManifest("turn-trace", "turn"),
      scopedManifest("tool-call-temp", "tool-call"),
    ]
    const resolved = manifests.map((manifest) => ({
      manifest,
      factory: () => ({
        manifest,
        stop(reason?: string) {
          events.push(`${manifest.id}:stop:${reason ?? "none"}`)
        },
        dispose() {
          events.push(`${manifest.id}:dispose`)
        },
      }),
    }))

    const run = await lifecycle.run(resolved)
    await run.dispose({ scope: "session", reason: "session-ended" })
    await run.dispose({ scope: "process", reason: "process-ended" })

    expect(events).toEqual([
      "tool-call-temp:stop:session-ended",
      "tool-call-temp:dispose",
      "turn-trace:stop:session-ended",
      "turn-trace:dispose",
      "session-cache:stop:session-ended",
      "session-cache:dispose",
      "workspace-store:stop:process-ended",
      "workspace-store:dispose",
      "process-root:stop:process-ended",
      "process-root:dispose",
    ])
  })

  it("exposes the composition kernel as catalog, resolver, planner, lifecycle, and graph lego", async () => {
    const catalog = new ModuleCatalog()
    const resolver = new CapabilityResolver()
    const planner = new BindingPlanner()
    const lifecycle = new LifecycleRunner()
    const graph = new AssemblyGraph()
    const events: string[] = []

    const contracts = moduleManifest("contracts", "core", ["contracts"])
    const store = moduleManifest("store", "atom", ["session.store"], ["contracts"])
    const sdk = moduleManifest("sdk", "product-shell", ["sdk.surface"], ["session.store"])
    for (const manifest of [sdk, store, contracts]) {
      catalog.register(manifest, (ctx) => ({
        manifest,
        init() {
          events.push(`${manifest.id}:init:${ctx.services.size}`)
        },
        start() {
          events.push(`${manifest.id}:start`)
        },
      }))
    }

    const recipe = {
      id: "split-kernel",
      version: "0.1.0",
      modules: [{ id: "sdk" }, { id: "store" }, { id: "contracts" }],
      personalities: [],
    }
    const selected = catalog.entriesFor(recipe)
    const resolved = resolver.resolve(recipe, selected)
    const bindings = planner.plan(recipe, selected)
    const run = await lifecycle.run(resolved)

    expect(resolved.map((entry) => entry.manifest.id)).toEqual(["contracts", "store", "sdk"])
    expect(bindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ consumer: "store", provider: "contracts" }),
        expect.objectContaining({ consumer: "sdk", provider: "store" }),
      ]),
    )
    expect(events).toEqual(["contracts:init:1", "store:init:3", "sdk:init:5", "contracts:start", "store:start", "sdk:start"])
    expect(run.context.services.get("session.store")).toBe(run.instances.find((instance) => instance.manifest.id === "store"))
    expect(graph.graph(resolved).map((entry) => entry.id)).toEqual(["contracts", "store", "sdk"])
    expect(graph.lockfile(recipe, resolved, bindings)).toMatchObject({
      recipeID: "split-kernel",
      modules: expect.arrayContaining([expect.objectContaining({ id: "store" })]),
    })
  })
})

function moduleManifest(
  id: string,
  kind: LegoModuleManifest["kind"],
  provides: LegoCapabilityInput[],
  requires: LegoCapabilityInput[] = [],
): LegoModuleManifest {
  return createManifest({
    id,
    version: "0.1.0",
    kind,
    provides,
    ...(requires.length > 0 ? { requires } : {}),
  })
}

function scopedManifest(id: string, scope: NonNullable<LegoModuleManifest["lifecycleScopes"]>[number]): LegoModuleManifest {
  return createManifest({
    id,
    version: "0.1.0",
    kind: "atom",
    provides: [id],
    lifecycleScopes: [scope],
  })
}
