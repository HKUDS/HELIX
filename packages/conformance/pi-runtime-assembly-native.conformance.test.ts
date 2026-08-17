import { describe, expect, it } from "vitest"
import {
  buildPiMonoRuntimeAssemblyGraph,
  buildPiMonoRuntimeAssemblyNativeExactFixture,
  buildPiMonoRuntimeModuleCatalog,
  piMonoRuntimeAssemblyNativeDescriptors,
  piMonoRuntimeAssemblyNativeExactAtomIDs,
  piMonoRuntimeAssemblyNativeExactEvidenceRef,
  piMonoRuntimeAssemblyNativeExactFixtureID,
  piMonoRuntimeAssemblyNativeExactReplayRef,
  planPiMonoRuntimeBindings,
  resolvePiMonoRuntimeCapabilities,
  runPiMonoRuntimeLifecycle,
  verifyPiMonoRuntimeAssemblyNativeExactFixture,
} from "@helix/lego-runtime/product-schema/pi"
import { buildAssemblyContract } from "@helix/recipes"

describe("Pi runtime assembly native exact conformance", () => {
  it("pins the AgentSession runtime five-pack to upstream session factory, extension, replacement, and graph behavior", () => {
    const fixture = buildPiMonoRuntimeAssemblyNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "pi-mono",
      atomIDs: [...piMonoRuntimeAssemblyNativeExactAtomIDs],
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
        piMonoRuntimeAssemblyNativeExactEvidenceRef,
        piMonoRuntimeAssemblyNativeExactReplayRef,
      ]),
      fixtureIDs: [piMonoRuntimeAssemblyNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "module-catalog-agent-session-runtime-services",
      "capability-resolution-session-replacement-order",
      "binding-plan-runtime-ports",
      "lifecycle-runner-session-events-and-rebind",
      "assembly-graph-agent-session-runtime-lockfile",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      "packages/coding-agent/src/core/sdk.ts#createAgentSession,CreateAgentSessionOptions,CreateAgentSessionResult",
      "packages/coding-agent/src/core/agent-session.ts#AgentSession,prompt,abort,clearQueue,dispose,bindExtensions,createReplacedSessionContext",
      "packages/coding-agent/src/core/agent-session-runtime.ts#AgentSessionRuntime,switchSession,newSession,fork,importFromJsonl,dispose",
      "packages/coding-agent/src/core/extensions/loader.ts#createExtensionRuntime,createExtensionAPI,loadExtensionFromFactory",
      "packages/coding-agent/src/core/extensions/runner.ts#ExtensionRunner.bindCore,emit,emitSessionShutdownEvent",
    ]))

    const catalog = buildPiMonoRuntimeModuleCatalog()
    expect(catalog.map((item) => item.id)).toEqual([
      "session-manager",
      "create-agent-session-runtime",
      "agent-session",
      "extension-runtime",
      "agent-session-runtime",
    ])
    expect(catalog.find((item) => item.id === "agent-session-runtime")).toMatchObject({
      provides: expect.arrayContaining(["runtime.current-session", "runtime.cwd-services", "runtime.session-replacement", "runtime.diagnostics"]),
      lifecycle: expect.arrayContaining(["session:shutdown-old-runtime", "session:create-next-runtime", "session:rebind"]),
    })

    expect(resolvePiMonoRuntimeCapabilities({ mode: "interactive" })).toMatchObject({
      order: ["session-manager", "create-agent-session-runtime", "agent-session", "extension-runtime", "agent-session-runtime"],
      tearsDownPreviousSession: false,
      rebindsSession: false,
    })
    expect(resolvePiMonoRuntimeCapabilities({ mode: "interactive", replacement: "resume" })).toMatchObject({
      emitsSessionStart: true,
      tearsDownPreviousSession: true,
      rebindsSession: true,
    })

    expect(planPiMonoRuntimeBindings().map((item) => [item.portID, item.atomID])).toEqual([
      ["runtime.module-catalog", "pi.runtime.module-catalog"],
      ["runtime.capability-resolver", "pi.runtime.capability-resolver"],
      ["runtime.binding-planner", "pi.runtime.binding-planner"],
      ["runtime.lifecycle-runner", "pi.runtime.lifecycle-runner"],
      ["runtime.assembly-graph", "pi.runtime.assembly-graph"],
    ])

    const lifecycle = runPiMonoRuntimeLifecycle({ mode: "interactive", replacement: "resume" })
    expect(lifecycle.boot).toEqual(expect.arrayContaining(["DefaultResourceLoader:reload", "AgentSession:create", "resourceLoader:getExtensions"]))
    expect(lifecycle.session).toEqual(expect.arrayContaining(["bindExtensions:ui-context", "ExtensionRunner:bindCore", "prompt:run-or-queue"]))
    expect(lifecycle.replacement).toEqual([
      "session_before_switch",
      "session_shutdown",
      "beforeSessionInvalidate",
      "old-session:dispose",
      "createRuntime:next-session",
      "apply:next-session-services-diagnostics",
      "rebindSession",
      "withSession:replaced-context",
    ])
    expect(runPiMonoRuntimeLifecycle({ mode: "interactive", replacement: "fork", beforeEventCancelled: true }).replacement).toEqual([
      "session_before_fork:cancel",
    ])

    const graph = buildPiMonoRuntimeAssemblyGraph()
    expect(graph.lockfile).toMatchObject({
      root: "create-agent-session-runtime",
      order: ["session-manager", "create-agent-session-runtime", "agent-session", "extension-runtime", "agent-session-runtime"],
      bindings: planPiMonoRuntimeBindings(),
    })
    expect(graph.lockfile.fingerprint).toMatch(/^[0-9a-f]{16}$/)

    expect(verifyPiMonoRuntimeAssemblyNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(piMonoRuntimeAssemblyNativeDescriptors.map((descriptor) => descriptor.id)).toEqual([
      ...piMonoRuntimeAssemblyNativeExactAtomIDs,
    ])
    for (const descriptor of piMonoRuntimeAssemblyNativeDescriptors) {
      expect(descriptor).toMatchObject({
        product: "pi-mono",
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          piMonoRuntimeAssemblyNativeExactEvidenceRef,
          piMonoRuntimeAssemblyNativeExactReplayRef,
        ]),
        fixtureIDs: [piMonoRuntimeAssemblyNativeExactFixtureID],
        knownLossiness: [],
      })
    }

    const contract = buildAssemblyContract({ product: "pi-mono" })
    for (const atomID of piMonoRuntimeAssemblyNativeExactAtomIDs) {
      expect(contract.atoms.find((candidate) => candidate.id === atomID), atomID).toMatchObject({
        sourcePackage: "@helix/lego-runtime",
        publicExport: "./product-schema/pi",
        implementationKind: "factory",
        parityCoverage: "native",
        knownLossiness: [],
        nativeEvidenceRefs: expect.arrayContaining([
          piMonoRuntimeAssemblyNativeExactEvidenceRef,
          piMonoRuntimeAssemblyNativeExactReplayRef,
        ]),
        fixtureIDs: [piMonoRuntimeAssemblyNativeExactFixtureID],
      })
    }
    for (const [portID, providerAtomID] of planPiMonoRuntimeBindings().map((item) => [item.portID, item.atomID] as const)) {
      expect(contract.bindings).toEqual(expect.arrayContaining([expect.objectContaining({ portID, providerAtomID })]))
    }

    const mutated = {
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "capability-resolution-session-replacement-order"
          ? { ...item, output: { ...item.output, resumeResolution: { order: ["agent-session"], emitsSessionStart: false, tearsDownPreviousSession: false, rebindsSession: false, capabilities: {} } } }
          : item,
      ),
    }
    expect(verifyPiMonoRuntimeAssemblyNativeExactFixture(mutated).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-runtime-assembly-native-exact.resolver" }),
      expect.objectContaining({ id: "pi-runtime-assembly-native-exact.fingerprint" }),
      expect.objectContaining({ id: "pi-runtime-assembly-native-exact.cases" }),
    ]))
  })
})
