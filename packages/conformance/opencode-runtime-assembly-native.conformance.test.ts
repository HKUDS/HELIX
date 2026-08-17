import { describe, expect, it } from "vitest"
import {
  buildOpenCodeRuntimeAssemblyGraph,
  buildOpenCodeRuntimeAssemblyNativeExactFixture,
  buildOpenCodeRuntimeModuleCatalog,
  openCodeRuntimeAssemblyNativeDescriptors,
  openCodeRuntimeAssemblyNativeExactAtomIDs,
  openCodeRuntimeAssemblyNativeExactEvidenceRef,
  openCodeRuntimeAssemblyNativeExactFixtureID,
  openCodeRuntimeAssemblyNativeExactReplayRef,
  planOpenCodeRuntimeBindings,
  resolveOpenCodeRuntimeCapabilities,
  runOpenCodeRuntimeLifecycle,
  verifyOpenCodeRuntimeAssemblyNativeExactFixture,
} from "@helix/lego-runtime/product-schema/opencode"
import { buildAssemblyContract } from "@helix/recipes"

describe("OpenCode runtime assembly native exact conformance", () => {
  it("pins the interactive runtime five-pack to upstream boot, lifecycle, transport, queue, and graph behavior", () => {
    const fixture = buildOpenCodeRuntimeAssemblyNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomIDs: [...openCodeRuntimeAssemblyNativeExactAtomIDs],
      portIDs: [
        "runtime.module-catalog",
        "runtime.capability-resolver",
        "runtime.binding-planner",
        "runtime.lifecycle-runner",
        "runtime.assembly-graph",
      ],
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeRuntimeAssemblyNativeExactEvidenceRef,
        openCodeRuntimeAssemblyNativeExactReplayRef,
      ]),
      fixtureIDs: [openCodeRuntimeAssemblyNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "module-catalog-interactive-runtime-services",
      "capability-resolution-runtime-order",
      "binding-plan-runtime-ports",
      "lifecycle-runner-split-footer-and-transport",
      "assembly-graph-runtime-lockfile",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      "packages/opencode/src/cli/cmd/run/runtime.boot.ts#resolveFooterKeybinds,resolveDiffStyle,resolveModelInfo,resolveSessionInfo",
      "packages/opencode/src/cli/cmd/run/runtime.lifecycle.ts#createRuntimeLifecycle,shutdown,queueSplash",
      "packages/opencode/src/cli/cmd/run/runtime.ts#runInteractiveRuntime,runInteractiveLocalMode,runInteractiveMode,ensureStream,runQueue",
      "packages/opencode/src/cli/cmd/run/runtime.queue.ts#runPromptQueue,submit,drain,close",
      "packages/opencode/src/cli/cmd/run/stream.transport.ts#createSessionTransport,bootstrap,watch,runPromptTurn",
    ]))

    const catalog = buildOpenCodeRuntimeModuleCatalog()
    expect(catalog.map((item) => item.id)).toEqual([
      "run.boot",
      "run.lifecycle",
      "run.stream-transport",
      "run.prompt-queue",
      "run.interactive-runtime",
    ])
    expect(catalog.find((item) => item.id === "run.stream-transport")).toMatchObject({
      provides: expect.arrayContaining(["stream.global-events", "stream.session-bootstrap", "stream.turn-runner", "stream.idle-completion"]),
      lifecycle: expect.arrayContaining(["session:subscribe-events", "turn:send-prompt", "session:close-scope"]),
    })

    expect(resolveOpenCodeRuntimeCapabilities({ mode: "local" })).toMatchObject({
      order: ["run.boot", "run.lifecycle", "run.stream-transport", "run.prompt-queue", "run.interactive-runtime"],
      eagerStream: false,
      lazySession: true,
    })
    expect(resolveOpenCodeRuntimeCapabilities({ mode: "attach", resume: true, hasInitialSession: true })).toMatchObject({
      eagerStream: true,
      lazySession: false,
    })

    expect(planOpenCodeRuntimeBindings().map((item) => [item.portID, item.atomID])).toEqual([
      ["runtime.module-catalog", "opencode.runtime.module-catalog"],
      ["runtime.capability-resolver", "opencode.runtime.capability-resolver"],
      ["runtime.binding-planner", "opencode.runtime.binding-planner"],
      ["runtime.lifecycle-runner", "opencode.runtime.lifecycle-runner"],
      ["runtime.assembly-graph", "opencode.runtime.assembly-graph"],
    ])

    const lifecycle = runOpenCodeRuntimeLifecycle({ mode: "local", firstPromptIncludesFiles: true })
    expect(lifecycle.boot).toEqual(expect.arrayContaining(["bootTasks:await-all", "createRuntimeLifecycle:split-footer"]))
    expect(lifecycle.session).toEqual(expect.arrayContaining(["ensureSession:deferred-until-stream", "streamTransport:bootstrap-session-data"]))
    expect(lifecycle.turn).toEqual(expect.arrayContaining(["queue:drain-one-at-a-time", "turn:include-files", "turn:clear-files-after-first-send"]))
    expect(lifecycle.close).toEqual([
      "streamTransport:close-scope",
      "shell.close:resolve-exit-title",
      "lifecycle.close:remove-sigint",
      "lifecycle.close:optional-exit-splash",
      "footer.close",
      "footer.idle",
      "footer.destroy",
      "renderer.shutdown",
      "stdin.cleanup",
    ])

    const graph = buildOpenCodeRuntimeAssemblyGraph()
    expect(graph.lockfile).toMatchObject({
      root: "run.interactive-runtime",
      order: ["run.boot", "run.lifecycle", "run.stream-transport", "run.prompt-queue", "run.interactive-runtime"],
      bindings: planOpenCodeRuntimeBindings(),
    })
    expect(graph.lockfile.fingerprint).toMatch(/^[0-9a-f]{16}$/)

    expect(verifyOpenCodeRuntimeAssemblyNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(openCodeRuntimeAssemblyNativeDescriptors.map((descriptor) => descriptor.id)).toEqual([
      ...openCodeRuntimeAssemblyNativeExactAtomIDs,
    ])
    for (const descriptor of openCodeRuntimeAssemblyNativeDescriptors) {
      expect(descriptor).toMatchObject({
        product: "opencode",
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          openCodeRuntimeAssemblyNativeExactEvidenceRef,
          openCodeRuntimeAssemblyNativeExactReplayRef,
        ]),
        fixtureIDs: [openCodeRuntimeAssemblyNativeExactFixtureID],
        knownLossiness: [],
      })
    }

    const contract = buildAssemblyContract({ product: "opencode" })
    for (const atomID of openCodeRuntimeAssemblyNativeExactAtomIDs) {
      expect(contract.atoms.find((candidate) => candidate.id === atomID), atomID).toMatchObject({
        sourcePackage: "@helix/lego-runtime",
        publicExport: "./product-schema/opencode",
        implementationKind: "factory",
        parityCoverage: "native",
        knownLossiness: [],
        nativeEvidenceRefs: expect.arrayContaining([
          openCodeRuntimeAssemblyNativeExactEvidenceRef,
          openCodeRuntimeAssemblyNativeExactReplayRef,
        ]),
        fixtureIDs: [openCodeRuntimeAssemblyNativeExactFixtureID],
      })
    }
    for (const [portID, providerAtomID] of planOpenCodeRuntimeBindings().map((item) => [item.portID, item.atomID] as const)) {
      expect(contract.bindings).toEqual(expect.arrayContaining([expect.objectContaining({ portID, providerAtomID })]))
    }

    const mutated = {
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "capability-resolution-runtime-order"
          ? { ...item, output: { ...item.output, localResolution: { order: ["run.lifecycle"], eagerStream: true, lazySession: false } } }
          : item,
      ),
    }
    expect(verifyOpenCodeRuntimeAssemblyNativeExactFixture(mutated).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-runtime-assembly-native-exact.resolver" }),
      expect.objectContaining({ id: "opencode-runtime-assembly-native-exact.fingerprint" }),
      expect.objectContaining({ id: "opencode-runtime-assembly-native-exact.cases" }),
    ]))
  })
})
