import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"
import {
  nanobotBuiltinBootstrapAssets,
  nanobotPromptNativeExactEvidenceRef,
  nanobotPromptNativeExactFixtureID,
  nanobotPromptNativeExactReplayRef,
  hermesPromptNativeExactEvidenceRef,
  hermesPromptNativeExactFixtureID,
  hermesPromptNativeExactReplayRef,
  openCodePromptModelCapabilityAdapterNativeAtomID,
  openCodePromptCompactionAdapterNativeAtomID,
  openCodePromptCompactionAdapterNativeExactEvidenceRef,
  openCodePromptCompactionAdapterNativeExactFixtureID,
  openCodePromptCompactionAdapterNativeExactReplayRef,
  openCodePromptInstructionNativeExactEvidenceRef,
  openCodePromptInstructionNativeExactFixtureID,
  openCodePromptInstructionNativeExactReplayRef,
  openCodePromptProviderSupportNativeExactEvidenceRef,
  openCodePromptProviderSupportNativeExactFixtureID,
  openCodePromptProviderSupportNativeExactReplayRef,
  openCodePromptResourceLoaderInstructionNativeAtomID,
  openCodePromptToolRendererNativeAtomID,
  openCodeResourceDiscoveryInstructionNativeAtomID,
  piMonoPromptCompactionAdapterNativeAtomID,
  piMonoPromptCompactionAdapterNativeExactEvidenceRef,
  piMonoPromptCompactionAdapterNativeExactFixtureID,
  piMonoPromptCompactionAdapterNativeExactReplayRef,
  piMonoPromptModelCapabilityAdapterNativeAtomID,
  piMonoPromptProviderSupportNativeExactEvidenceRef,
  piMonoPromptProviderSupportNativeExactFixtureID,
  piMonoPromptProviderSupportNativeExactReplayRef,
  piMonoPromptResourceLoaderNativeAtomID,
  piMonoPromptResourceSupportNativeExactEvidenceRef,
  piMonoPromptResourceSupportNativeExactFixtureID,
  piMonoPromptResourceSupportNativeExactReplayRef,
  piMonoPromptToolRendererNativeAtomID,
  piMonoResourceDiscoveryNativeAtomID,
} from "@helix/lego-prompt"
import {
  openCodeEventNativeExactAtomIDs,
  openCodeEventNativeExactEvidenceRef,
  openCodeEventNativeExactFixtureID,
  openCodeEventNativeExactReplayRef,
} from "@helix/adapters-opencode/product-schema/events"
import {
  hermesEventNativeExactAtomIDs,
  hermesEventNativeExactEvidenceRef,
  hermesEventNativeExactFixtureID,
  hermesEventNativeExactReplayRef,
} from "@helix/adapters-hermes/product-schema/events"
import {
  nanobotEventNativeExactAtomIDs,
  nanobotEventNativeExactEvidenceRef,
  nanobotEventNativeExactFixtureID,
  nanobotEventNativeExactReplayRef,
} from "@helix/adapters-nanobot/product-schema/events"
import {
  hermesHookLifecycleNativeExactAtomIDs,
  hermesHookLifecycleNativeExactEvidenceRef,
  hermesHookLifecycleNativeExactFixtureID,
  hermesHookLifecycleNativeExactReplayRef,
} from "@helix/adapters-hermes/product-schema/hooks"
import {
  openCodeHookLifecycleNativeExactAtomIDs,
  openCodeHookLifecycleNativeExactEvidenceRef,
  openCodeHookLifecycleNativeExactFixtureID,
  openCodeHookLifecycleNativeExactReplayRef,
} from "@helix/adapters-opencode/product-schema/hooks"
import {
  openCodeSessionBranchingSQLiteServiceNativeExactAtomID,
  openCodeSessionContextSelectorMessageV2NativeExactAtomID,
  openCodeSessionDiffSQLiteServiceNativeExactAtomID,
  openCodeSessionEventLogSyncEventNativeExactAtomID,
  openCodeSessionMessageStoreSQLiteServiceNativeExactAtomID,
  openCodeSessionMessagePartProjectorNativeExactAtomID,
  openCodeSessionNativeExactAtomIDs,
  openCodeSessionNativeExactEvidenceRef,
  openCodeSessionNativeExactFixtureID,
  openCodeSessionNativeExactReplayRef,
  openCodeSessionReaderSQLiteServiceNativeExactAtomID,
  openCodeSessionWriterSQLiteServiceNativeExactAtomID,
} from "@helix/adapters-opencode/product-schema/session"
import {
  nanobotHookLifecycleNativeExactAtomIDs,
  nanobotHookLifecycleNativeExactEvidenceRef,
  nanobotHookLifecycleNativeExactFixtureID,
  nanobotHookLifecycleNativeExactReplayRef,
} from "@helix/adapters-nanobot/product-schema/hooks"
import {
  nanobotProviderNativeExactAtomIDs,
  nanobotProviderNativeExactEvidenceRef,
  nanobotProviderNativeExactFixtureID,
  nanobotProviderNativeExactReplayRef,
} from "@helix/adapters-nanobot/product-schema/provider"
import {
  nanobotSessionNativeExactAtomIDs,
  nanobotSessionNativeExactEvidenceRef,
  nanobotSessionNativeExactFixtureID,
  nanobotSessionNativeExactReplayRef,
} from "@helix/adapters-nanobot/product-schema/session"
import {
  nanobotProductShellNativeExactAtomIDs,
  nanobotProductShellNativeExactEvidenceRef,
  nanobotProductShellNativeExactFixtureID,
  nanobotProductShellNativeExactReplayRef,
} from "@helix/adapters-nanobot/product-schema/product-shell"
import {
  hermesProviderNativeExactAtomIDs,
  hermesProviderNativeExactEvidenceRef,
  hermesProviderNativeExactFixtureID,
  hermesProviderNativeExactReplayRef,
} from "@helix/adapters-hermes/product-schema/provider"
import {
  hermesProductShellNativeExactAtomIDs,
  hermesProductShellNativeExactEvidenceRef,
  hermesProductShellNativeExactFixtureID,
  hermesProductShellNativeExactReplayRef,
  hermesProductShellTUINativeExactAtomID,
  hermesProductShellWebDashboardNativeExactAtomID,
} from "@helix/adapters-hermes/product-schema/product-shell"
import {
  hermesTUIShellNativeExactAtomID,
  hermesUINativeExactAtomIDs,
  hermesUINativeExactEvidenceRef,
  hermesUINativeExactFixtureID,
  hermesUINativeExactReplayRef,
} from "@helix/adapters-hermes/product-schema/ui"
import {
  openCodeIdentityNativeExactAtomIDs,
  openCodeIdentityNativeExactEvidenceRef,
  openCodeIdentityNativeExactFixtureID,
  openCodeIdentityNativeExactReplayRef,
} from "@helix/adapters-opencode/product-schema/identity"
import {
  openCodeProductShellNativeExactAtomIDs,
  openCodeProductShellNativeExactEvidenceRef,
  openCodeProductShellNativeExactFixtureID,
  openCodeProductShellNativeExactReplayRef,
} from "@helix/adapters-opencode/product-schema/product-shell"
import {
  openCodeProviderStreamNativeExactEvidenceRef,
  openCodeProviderStreamNativeExactFixtureID,
  openCodeProviderStreamNativeExactReplayRef,
  openCodeProviderStreamProjectorNativeExactAtomID,
  openCodeProviderStreamingDeltaRecorderNativeExactAtomID,
} from "@helix/adapters-opencode/opencode-provider-stream-projector"
import {
  openCodeProviderPackageRuntimeNativeExactDiffEvidenceRef,
  openCodeProviderPackageRuntimeNativeExactDiffFixtureID,
  openCodeProviderPackageRuntimeNativeExactDiffReplayRef,
  openCodeProviderRetryCancelNativeExactDiffEvidenceRef,
  openCodeProviderRetryCancelNativeExactDiffFixtureID,
  openCodeProviderRetryCancelNativeExactDiffReplayRef,
} from "@helix/lego-provider"
import {
  hermesToolNativeExactAtomIDs,
  hermesToolNativeExactEvidenceRef,
  hermesToolNativeExactFixtureID,
  hermesToolNativeExactReplayRef,
} from "@helix/lego-tools/product-schema/hermes"
import {
  openCodeToolBatchSchedulerNativeExactAtomID,
  openCodeToolNativeExactAtomIDs,
  openCodeToolNativeExactEvidenceRef,
  openCodeToolNativeExactFixtureID,
  openCodeToolNativeExactReplayRef,
  openCodeToolPackNativeExactAtomID,
  openCodeToolResultProjectorNativeExactAtomID,
  openCodeToolSchemaNativeExactAtomID,
  openCodeToolSchemaNativeExactEvidenceRef,
  openCodeToolSchemaNativeExactFixtureID,
  openCodeToolSchemaNativeExactReplayRef,
} from "@helix/lego-tools/product-schema/opencode"
import {
  openCodeConfigNativeExactAtomIDs,
  openCodeConfigNativeExactEvidenceRef,
  openCodeConfigNativeExactFixtureID,
  openCodeConfigNativeExactReplayRef,
} from "@helix/lego-config/product-schema/opencode"
import {
  openCodeRuntimeAcceptanceControllerNativeExactAtomID,
  openCodeRuntimeAcceptanceEvidenceNativeExactAtomID,
  openCodeRuntimeAcceptanceNativeExactEvidenceRef,
  openCodeRuntimeAcceptanceNativeExactFixtureID,
  openCodeRuntimeAcceptanceNativeExactReplayRef,
  openCodeRuntimeAssemblyNativeExactAtomIDs,
  openCodeRuntimeAssemblyNativeExactEvidenceRef,
  openCodeRuntimeAssemblyNativeExactFixtureID,
  openCodeRuntimeAssemblyNativeExactReplayRef,
} from "@helix/lego-runtime/product-schema/opencode"
import {
  piMonoRuntimeAssemblyNativeExactAtomIDs,
  piMonoRuntimeAssemblyNativeExactEvidenceRef,
  piMonoRuntimeAssemblyNativeExactFixtureID,
  piMonoRuntimeAssemblyNativeExactReplayRef,
} from "@helix/lego-runtime/product-schema/pi"
import {
  openCodeUINativeExactAtomIDs,
  openCodeUINativeExactEvidenceRef,
  openCodeUINativeExactFixtureID,
  openCodeUINativeExactReplayRef,
} from "@helix/lego-ui/product-schema/opencode"
import {
  nanobotUINativeExactAtomIDs,
  nanobotUINativeExactEvidenceRef,
  nanobotUINativeExactFixtureID,
  nanobotUINativeExactReplayRef,
} from "@helix/lego-ui/product-schema/nanobot"
import {
  openCodeAgentLoopFinalSummaryNativeExactAtomID,
  openCodeAgentLoopFinalSummaryNativeExactEvidenceRef,
  openCodeAgentLoopFinalSummaryNativeExactFixtureID,
  openCodeAgentLoopFinalSummaryNativeExactReplayRef,
  openCodeAgentLoopRequestBoundaryNativeExactAtomID,
  openCodeAgentLoopRequestBoundaryNativeExactEvidenceRef,
  openCodeAgentLoopRequestBoundaryNativeExactFixtureID,
  openCodeAgentLoopRequestBoundaryNativeExactReplayRef,
  openCodeTurnNativeLoopExactDiffEvidenceRef,
  openCodeTurnNativeLoopExactDiffFixtureID,
  openCodeTurnNativeLoopExactDiffReplayRef,
} from "@helix/lego-agent-loop/product-schema/opencode"
import {
  piMonoTraceDebugSurfaceNativeExactAtomID,
  piMonoTraceDebugSurfaceNativeExactEvidenceRef,
  piMonoTraceDebugSurfaceNativeExactFixtureID,
  piMonoTraceDebugSurfaceNativeExactReplayRef,
} from "@helix/adapters-pi/product-schema/trace"
import {
  hermesTraceDebugSurfaceNativeExactAtomID,
  hermesTraceDebugSurfaceNativeExactEvidenceRef,
  hermesTraceDebugSurfaceNativeExactFixtureID,
  hermesTraceDebugSurfaceNativeExactReplayRef,
} from "@helix/adapters-hermes/product-schema/trace"
import {
  nanobotTraceDebugSurfaceNativeExactAtomID,
  nanobotTraceDebugSurfaceNativeExactEvidenceRef,
  nanobotTraceDebugSurfaceNativeExactFixtureID,
  nanobotTraceDebugSurfaceNativeExactReplayRef,
} from "@helix/adapters-nanobot/product-schema/trace"
import {
  nanobotToolNativeExactAtomIDs,
  nanobotToolNativeExactEvidenceRef,
  nanobotToolNativeExactFixtureID,
  nanobotToolNativeExactReplayRef,
} from "@helix/lego-tools/product-schema/nanobot"
import {
  buildAssemblyContract,
  opencodeRecipe,
  readAssemblyContract,
  verifyAssemblyContract,
  writeAssemblyContract,
  type AssemblyContract,
  type AssemblyContractExternalToolEvidenceRef,
  type AssemblyContractProduct,
  type ProductTaskNativeCadenceFixtureSet,
  type ProductTaskParityArtifact,
} from "@helix/recipes"

describe("assembly contract conformance", () => {
  it("builds verifiable contracts for OpenCode, Pi, Nanobot, and the neutral fixture", () => {
    const products: AssemblyContractProduct[] = ["opencode", "pi-mono", "nanobot", "minimal"]

    for (const product of products) {
      const contract = buildAssemblyContract({
        product,
        generatedAt: "2026-05-30T00:00:00.000Z",
      })
      const verification = verifyAssemblyContract(contract)

      expect(verification.ok).toBe(true)
      expect(contract.product).toBe(product)
      expect(contract.atoms.length).toBeGreaterThan(0)
      expect(contract.ports.length).toBeGreaterThan(0)
      expect(contract.bindings.length).toBeGreaterThan(0)
      expect(contract.commonAtoms.length).toBeGreaterThan(0)
      expect(contract.fingerprints.contract).toMatch(/^[a-f0-9]{16}$/)
      expect(contract.planes.map((plane) => plane.id)).toEqual(expect.arrayContaining(["runtime", "session", "provider"]))
      if (product !== "minimal") {
        expect(contract.productSpecificAtoms.length).toBeGreaterThan(0)
        expect(contract.surfaces.length).toBeGreaterThan(0)
        expect(contract.swapPoints.map((swap) => swap.port)).toEqual(
          expect.arrayContaining([
            "session.store",
            "runtime.acceptance-controller",
            "session.message-part-projector",
            "provider.streaming-delta-recorder",
            "tools.batch-scheduler",
          ]),
        )
      }
    }
  })

  it("classifies common, product-specific, fixture-only, and reserved atoms without product leakage", () => {
    const contract = buildAssemblyContract({
      product: "nanobot",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })

    expect(contract.commonAtoms.every((id) => !id.startsWith("opencode.") && !id.startsWith("pi.") && !id.startsWith("nanobot."))).toBe(true)
    expect(contract.productSpecificAtoms).toEqual(expect.arrayContaining(["nanobot.product-shell.cli", "nanobot.session.store.jsonl"]))
    expect(contract.fixtureOnlyAtoms).toEqual(expect.arrayContaining(["nanobot.turn.cadence-emitter", "nanobot.trace.jsonl-event-projection"]))
    expect(contract.reservedAtoms).toEqual(expect.arrayContaining(["nanobot.task.runner.native-server"]))
    expect(verifyAssemblyContract(contract).ok).toBe(true)
  })

  it("declares implementation kind for factory, bridge, preview, and metadata-only atoms", () => {
    const contract = buildAssemblyContract({
      product: "opencode",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    const atom = (id: string) => {
      const found = contract.atoms.find((candidate) => candidate.id === id)
      if (!found) throw new Error(`Missing atom ${id}`)
      return found
    }

    expect(contract.atoms.every((candidate) => candidate.implementationKind)).toBe(true)
    expect(atom("turn.input-normalizer.text").implementationKind).toBe("factory")
    expect(atom("opencode.prompt.mode-builder").implementationKind).toBe("factory")
    expect(atom("opencode.product-shell.sdk").implementationKind).toBe("factory")
    expect(atom("opencode.product-shell.web").implementationKind).toBe("factory")
    expect(atom("opencode.runtime.module-aliases").implementationKind).toBe("metadata-only")
    expect(atom("opencode.turn.cadence-emitter").implementationKind).toBe("metadata-only")
    expect(atom("opencode.task.runner.native-cli")).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      knownLossiness: [],
      fixtureIDs: expect.arrayContaining(["task-parity-live:opencode:read-only-answer:native-cli"]),
      nativeEvidenceRefs: expect.arrayContaining(["upstream:npm:opencode-ai@1.15.11:bin/opencode.exe"]),
    })
    expect(atom("opencode.task.runner.native-server")).toMatchObject({
      implementationKind: "metadata-only",
      parityCoverage: "metadata",
    })
    const runtimeMetadataSuffixes = ["module-aliases", "capability-aliases", "binding-defaults", "lifecycle-defaults", "graph-labels"]
    const runtimeMetadataProducts: Array<{ product: AssemblyContractProduct; prefix: string }> = [
      { product: "opencode", prefix: "opencode" },
      { product: "pi-mono", prefix: "pi" },
      { product: "nanobot", prefix: "nanobot" },
      { product: "hermes-agent", prefix: "hermes" },
    ]
    for (const item of runtimeMetadataProducts) {
      const productContract = buildAssemblyContract({
        product: item.product,
        includeTaskParity: true,
        includeNativeFixtures: true,
        generatedAt: "2026-05-30T00:00:00.000Z",
      })
      for (const suffix of runtimeMetadataSuffixes) {
        const atomID = `${item.prefix}.runtime.${suffix}`
        const found = productContract.atoms.find((candidate) => candidate.id === atomID)
        expect(found, atomID).toMatchObject({ implementationKind: "metadata-only" })
      }
    }
    expect(verifyAssemblyContract(contract).ok).toBe(true)
  })

  it("keeps source-product upstream metadata for custom mixed recipe atoms", () => {
    const customOpenCodeRecipe = {
      ...opencodeRecipe,
      id: "custom.opencode-nanobot-prompt",
      atoms: [
        ...((opencodeRecipe.atoms ?? []) as Array<{ id: string }>).filter((atom) => atom.id !== "opencode.prompt.mode-builder"),
        { id: "nanobot.prompt.agent-builder" },
      ],
      bindings: ((opencodeRecipe.bindings ?? []) as Array<{ port: string; module: string }>).map((binding) =>
        binding.port === "prompt.system-builder"
          ? { ...binding, module: "nanobot.prompt.agent-builder" }
          : binding,
      ),
      personalities: ["common", "opencode", "nanobot"],
      metadata: {
        ...(opencodeRecipe.metadata ?? {}),
        product: "opencode",
        basedOn: "opencode",
        sourceFingerprint: "custom-opencode-nanobot-prompt",
      },
    }
    const contract = buildAssemblyContract({
      recipe: customOpenCodeRecipe,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    const nanobotPromptAtom = contract.atoms.find((atom) => atom.id === "nanobot.prompt.agent-builder")
    const opencodeSessionAtom = contract.atoms.find((atom) => atom.id === "opencode.session.store.sqlite-projection")

    expect(contract.product).toBe("opencode")
    expect(contract.recipeID).toBe("custom.opencode-nanobot-prompt")
    expect(verifyAssemblyContract(contract).ok).toBe(true)
    expect(nanobotPromptAtom).toMatchObject({
      parityCoverage: "native",
      upstreamVersion: "v0.2.0 / nanobot-ai@0.2.0",
      upstreamCommit: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
      nativeEvidenceRefs: expect.arrayContaining([
        nanobotPromptNativeExactEvidenceRef,
        nanobotPromptNativeExactReplayRef,
        "package:nanobot-ai@0.2.0",
        "upstream:https://github.com/HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        "conformance:nanobot-prompt-upstream-source-matrix",
      ]),
      fixtureIDs: expect.arrayContaining([nanobotPromptNativeExactFixtureID, "nanobot-prompt:upstream-source-matrix"]),
      knownLossiness: [],
    })
    expect(nanobotPromptAtom?.nativeEvidenceRefs).not.toContain("upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab")
    expect(opencodeSessionAtom?.nativeEvidenceRefs).toEqual(expect.arrayContaining(["upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"]))

    const customOpenCodePiSessionRecipe = {
      ...opencodeRecipe,
      id: "custom.opencode-pi-session-store",
      atoms: [
        ...((opencodeRecipe.atoms ?? []) as Array<{ id: string }>).filter((atom) => atom.id !== "opencode.session.store.sqlite-projection"),
        { id: "pi.session.store.jsonl-v3" },
      ],
      bindings: ((opencodeRecipe.bindings ?? []) as Array<{ port: string; module: string }>).map((binding) =>
        binding.port === "session.store"
          ? { ...binding, module: "pi.session.store.jsonl-v3" }
          : binding,
      ),
      personalities: ["common", "opencode", "pi-mono"],
      metadata: {
        ...(opencodeRecipe.metadata ?? {}),
        product: "opencode",
        basedOn: "opencode",
        sourceFingerprint: "custom-opencode-pi-session-store",
      },
    }
    const sessionContract = buildAssemblyContract({
      recipe: customOpenCodePiSessionRecipe,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    const piSessionStoreAtom = sessionContract.atoms.find((atom) => atom.id === "pi.session.store.jsonl-v3")

    expect(sessionContract.product).toBe("opencode")
    expect(verifyAssemblyContract(sessionContract).ok).toBe(true)
    expect(piSessionStoreAtom).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      upstreamCommit: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
      nativeEvidenceRefs: expect.arrayContaining([
        "upstream:https://github.com/earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        "conformance:pi-session-store-jsonl-v3-native-exact-fixture",
        "session-store-jsonl-v3-native-exact:pi-mono",
      ]),
      fixtureIDs: ["pi-session-store-jsonl-v3:native-exact-fixture"],
      knownLossiness: [],
    })
    expect(piSessionStoreAtom?.nativeEvidenceRefs).not.toContain("upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab")
  })

  it("carries TODO-027 native evidence metadata for bridge, preview, metadata, native-like, and common atoms", () => {
    const contract = buildAssemblyContract({
      product: "opencode",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    const piContract = buildAssemblyContract({
      product: "pi-mono",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    const atom = (id: string) => {
      const found = contract.atoms.find((candidate) => candidate.id === id)
      if (!found) throw new Error(`Missing atom ${id}`)
      return found
    }
    const binding = (portID: string) => {
      const found = contract.bindings.find((candidate) => candidate.portID === portID)
      if (!found) throw new Error(`Missing binding ${portID}`)
      return found
    }
    const piAtom = (id: string) => {
      const found = piContract.atoms.find((candidate) => candidate.id === id)
      if (!found) throw new Error(`Missing Pi atom ${id}`)
      return found
    }

    expect(
      contract.atoms.every((candidate) =>
        Array.isArray(candidate.nativeEvidenceRefs) &&
        Array.isArray(candidate.fixtureIDs) &&
        Boolean(candidate.parityCoverage) &&
        Array.isArray(candidate.knownLossiness),
      ),
    ).toBe(true)
    const opencodeTurnNativeKeys = [
      "input-normalizer",
      "context-builder",
      "prompt-assembler",
      "provider-request-builder",
      "provider-stream-runner",
      "stream-reducer",
      "tool-call-planner",
      "tool-executor",
      "result-recorder",
      "retry-policy",
      "continuation-policy",
      "compaction-policy",
      "stop-condition",
    ] as const
    for (const key of opencodeTurnNativeKeys) {
      expect(atom(`opencode.turn.${key}`), key).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        upstreamCommit: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
        nativeEvidenceRefs: expect.arrayContaining([
          "conformance:opencode-turn-replay-snapshot",
          `turn-replay:opencode:${key}`,
          `conformance:opencode-turn-${key}-native-exact-fixture`,
          `turn-${key}-native-exact:opencode`,
          openCodeTurnNativeLoopExactDiffEvidenceRef,
          openCodeTurnNativeLoopExactDiffReplayRef,
          "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
        ]),
        fixtureIDs: expect.arrayContaining([`opencode-turn:${key}`, `opencode-turn-${key}:native-exact-fixture`, openCodeTurnNativeLoopExactDiffFixtureID]),
        knownLossiness: [],
      })
    }
    expect(atom("opencode.prompt.mode-builder")).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-llm-request-system-exact-fixture",
        "conformance:opencode-system-prompt-core-exact-fixture",
        "conformance:opencode-system-prompt-live-upstream-exact-diff-fixture",
        "conformance:opencode-prompt-resource-policy",
        "conformance:opencode-system-prompt-ordering",
        "conformance:opencode-rendered-system-prompt",
        "conformance:opencode-upstream-system-prompt-matrix",
        "conformance:opencode-upstream-system-prompt-output-matrix",
        "conformance:opencode-system-prompt-runtime-output-projection",
        "conformance:opencode-system-prompt-invocation-boundary-projection",
        "conformance:opencode-system-prompt-provider-message-projection",
        "conformance:opencode-system-prompt-live-runtime-fixture",
        expect.stringMatching(/^pinned-asset:opencode-prompt\/gpt\.txt@sha256:[a-f0-9]{64}$/),
      ]),
      fixtureIDs: expect.arrayContaining(["opencode-prompt:llm-request-system-exact-fixture", "opencode-prompt:system-prompt-core-exact-fixture", "opencode-prompt:live-upstream-exact-diff-fixture", "opencode-prompt:resource-policy", "opencode-prompt:system-output-ordering", "opencode-prompt:rendered-system-output", "opencode-prompt:upstream-system-matrix", "opencode-prompt:upstream-system-output-matrix", "opencode-prompt:runtime-system-output-projection", "opencode-prompt:system-invocation-boundary-projection", "opencode-prompt:provider-message-projection", "opencode-prompt:live-runtime-fixture", "opencode-prompt:gpt"]),
      knownLossiness: [],
    })
    const piPromptAtom = piContract.atoms.find((candidate) => candidate.id === "pi.prompt.coding-agent-builder")
    expect(piPromptAtom).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      upstreamCommit: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:pi-prompt-family-matrix",
        "conformance:pi-prompt-native-exact-fixture",
        "conformance:pi-prompt-upstream-source-matrix",
        "prompt-native-exact:pi-mono",
        "upstream:https://github.com/earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
      ]),
      fixtureIDs: expect.arrayContaining(["pi-prompt:native-exact-fixture", "pi-prompt:family-matrix", "pi-prompt:upstream-source-matrix"]),
      knownLossiness: [],
    })
    const piProviderNativeAtomIDs = [
      "pi.provider.auth-descriptor",
      "pi.provider.event-observer",
      "pi.provider.extension-descriptor",
      "pi.provider.model-extension",
      "pi.provider.parser-observer",
      "pi.provider.request-options",
      "pi.provider.transport-instrumentation",
      "pi.provider.usage-renderer",
    ]
    for (const atomID of piProviderNativeAtomIDs) {
      const providerAtom = piContract.atoms.find((candidate) => candidate.id === atomID)
      expect(providerAtom, atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        source: expect.objectContaining({
          specifier: "@helix/adapters-pi/product-schema/provider",
        }),
        nativeEvidenceRefs: expect.arrayContaining([
          "conformance:pi-provider-descriptor-native-exact-fixture",
          "provider-descriptor-native-exact:pi-mono",
          "upstream:https://github.com/earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        ]),
        fixtureIDs: ["pi-provider-descriptor:native-exact-fixture"],
        knownLossiness: [],
      })
    }
    expect(verifyAssemblyContract(piContract).ok).toBe(true)
    const hermesContract = buildAssemblyContract({
      product: "hermes-agent",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    const hermesPromptAtom = hermesContract.atoms.find((candidate) => candidate.id === "hermes.prompt.agent-builder")
    expect(hermesPromptAtom).toMatchObject({
      parityCoverage: "native",
      upstreamVersion: "v0.15.1 / hermes-agent==0.15.1",
      upstreamCommit: "92a567db2d7a5031df8211efbfdad864c2f51faf",
      nativeEvidenceRefs: expect.arrayContaining([
        hermesPromptNativeExactEvidenceRef,
        hermesPromptNativeExactReplayRef,
        "conformance:hermes-prompt-factory-options",
        "conformance:hermes-prompt-scanner",
        "conformance:hermes-prompt-registry-snapshot",
        "conformance:hermes-prompt-upstream-registry-source-matrix",
        "conformance:hermes-skills-index-cache",
        "package:hermes-agent==0.15.1",
        "upstream:https://github.com/NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
      ]),
      fixtureIDs: expect.arrayContaining([hermesPromptNativeExactFixtureID, "hermes-prompt:factory-options", "hermes-prompt:prompt-scanner", "hermes-prompt:registry-snapshot", "hermes-prompt:upstream-registry-source-matrix", "hermes-skills:index-cache"]),
      knownLossiness: [],
    })
    expect(verifyAssemblyContract(hermesContract).ok).toBe(true)
    expect(atom("opencode.tui.shell")).toMatchObject({
      parityCoverage: "native",
      implementationKind: "factory",
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeProductShellNativeExactEvidenceRef,
        openCodeProductShellNativeExactReplayRef,
      ]),
      fixtureIDs: [openCodeProductShellNativeExactFixtureID],
      knownLossiness: [],
    })
    for (const metadataAtomID of [
      "opencode.block.compatibility-metadata",
      "opencode.resource.grant-defaults",
      "opencode.provider.cassette-artifact",
      "opencode.runtime.module-aliases",
      "opencode.trace.sqlite-part-projection",
      "opencode.turn.cadence-emitter",
    ]) {
      expect(atom(metadataAtomID)).toMatchObject({
        parityCoverage: "metadata",
        nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-metadata-overlay-demotion-matrix"]),
        fixtureIDs: expect.arrayContaining(["opencode-metadata:overlay-demotion-matrix"]),
        knownLossiness: expect.arrayContaining([
          "bom-or-overlay-only",
          "not-executable-provider",
          "opencode-metadata-overlay-demotion-matrix-partial-fixture",
        ]),
      })
    }
    expect(atom(openCodeAgentLoopRequestBoundaryNativeExactAtomID)).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/lego-agent-loop/product-schema/opencode",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeAgentLoopRequestBoundaryNativeExactEvidenceRef,
        openCodeAgentLoopRequestBoundaryNativeExactReplayRef,
      ]),
      fixtureIDs: [openCodeAgentLoopRequestBoundaryNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(binding("agent-loop.request-boundary")).toMatchObject({
      providerAtomID: openCodeAgentLoopRequestBoundaryNativeExactAtomID,
      bindingSource: "recipe-explicit",
      canSwapWith: expect.arrayContaining(["common.agent-loop.request-boundary.default"]),
    })
    expect(atom(openCodeAgentLoopFinalSummaryNativeExactAtomID)).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/lego-agent-loop/product-schema/opencode",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeAgentLoopFinalSummaryNativeExactEvidenceRef,
        openCodeAgentLoopFinalSummaryNativeExactReplayRef,
      ]),
      fixtureIDs: [openCodeAgentLoopFinalSummaryNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(binding("agent-loop.final-summary")).toMatchObject({
      providerAtomID: openCodeAgentLoopFinalSummaryNativeExactAtomID,
      bindingSource: "recipe-explicit",
      canSwapWith: expect.arrayContaining(["common.agent-loop.final-summary.default"]),
    })
    expect(piAtom("pi.agent-loop.request-boundary.native-like")).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/lego-agent-loop/product-schema/pi",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:pi-agent-loop-request-boundary-native-exact-fixture",
        "agent-loop-request-boundary-native-exact:pi-mono",
      ]),
      fixtureIDs: ["pi-agent-loop-request-boundary:native-exact-fixture"],
      knownLossiness: [],
    })
    expect(piAtom("pi.agent-loop.final-summary.native-like")).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/lego-agent-loop/product-schema/pi",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:pi-agent-loop-final-summary-native-exact-fixture",
        "agent-loop-final-summary-native-exact:pi-mono",
      ]),
      fixtureIDs: ["pi-agent-loop-final-summary:native-exact-fixture"],
      knownLossiness: [],
    })
    for (const key of [
      "input-normalizer",
      "context-builder",
      "prompt-assembler",
      "provider-request-builder",
      "provider-stream-runner",
      "stream-reducer",
      "tool-call-planner",
      "tool-executor",
      "result-recorder",
      "retry-policy",
      "continuation-policy",
      "compaction-policy",
      "stop-condition",
    ]) {
      expect(piAtom(`pi.turn.${key}`)).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        source: expect.objectContaining({
          specifier: "@helix/lego-agent-loop/product-schema/pi",
        }),
        nativeEvidenceRefs: expect.arrayContaining([
          "conformance:pi-turn-native-exact-fixture",
          "turn-native-exact:pi-mono",
          `turn-native-exact:pi-mono:${key}`,
        ]),
        fixtureIDs: expect.arrayContaining(["pi-turn:native-exact-fixture", `pi-turn:${key}:native-exact-fixture`]),
        knownLossiness: [],
      })
    }
    expect(piAtom("pi.identity.clock-format")).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/adapters-pi/product-schema/pi",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:pi-identity-clock-native-exact-fixture",
        "identity-clock-native-exact:pi-mono",
      ]),
      fixtureIDs: ["pi-identity-clock:native-exact-fixture"],
      knownLossiness: [],
    })
    expect(piAtom("pi.identity.id-generator")).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/adapters-pi/product-schema/pi",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:pi-identity-id-generator-native-exact-fixture",
        "identity-id-generator-native-exact:pi-mono",
      ]),
      fixtureIDs: ["pi-identity-id-generator:native-exact-fixture"],
      knownLossiness: [],
    })
    expect(piAtom("pi.identity.workspace-resolver")).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/adapters-pi/product-schema/pi",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:pi-identity-workspace-resolver-native-exact-fixture",
        "identity-workspace-resolver-native-exact:pi-mono",
      ]),
      fixtureIDs: ["pi-identity-workspace-resolver:native-exact-fixture"],
      knownLossiness: [],
    })
    for (const atomID of ["pi.event.envelope-bridge", "pi.event.runtime-bridge", "pi.extension.runtime-event-bridge"]) {
      expect(piAtom(atomID)).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        source: expect.objectContaining({
          specifier: "@helix/adapters-pi/product-schema/events",
        }),
        nativeEvidenceRefs: expect.arrayContaining([
          "conformance:pi-event-native-exact-fixture",
          "event-native-exact:pi-mono",
        ]),
        fixtureIDs: ["pi-event:native-exact-fixture"],
        knownLossiness: [],
      })
    }
    expect(piAtom("pi.session.id-generator")).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/lego-session/product-schema/pi",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:pi-session-id-generator-native-exact-fixture",
        "session-id-generator-native-exact:pi-mono",
      ]),
      fixtureIDs: ["pi-session-id-generator:native-exact-fixture"],
      knownLossiness: [],
    })
    for (const atomID of ["pi.session.branch-graph.leaf-tree", "pi.session.branch-graph.active-leaf"]) {
      expect(piAtom(atomID)).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        source: expect.objectContaining({
          specifier: "@helix/lego-session/product-schema/pi",
        }),
        nativeEvidenceRefs: expect.arrayContaining([
          "conformance:pi-session-branch-graph-native-exact-fixture",
          "session-branch-graph-native-exact:pi-mono",
        ]),
        fixtureIDs: ["pi-session-branch-graph:native-exact-fixture"],
        knownLossiness: [],
      })
    }
    for (const atomID of ["pi.session.projector.jsonl", "pi.session.projector.jsonl-v3"]) {
      expect(piAtom(atomID)).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        source: expect.objectContaining({
          specifier: "@helix/lego-session/product-schema/pi",
        }),
        nativeEvidenceRefs: expect.arrayContaining([
          "conformance:pi-session-projector-jsonl-v3-native-exact-fixture",
          "session-projector-jsonl-v3-native-exact:pi-mono",
        ]),
        fixtureIDs: ["pi-session-projector-jsonl-v3:native-exact-fixture"],
        knownLossiness: [],
      })
    }
    expect(atom(openCodeToolPackNativeExactAtomID)).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/lego-tools/product-schema/opencode",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeToolNativeExactEvidenceRef,
        openCodeToolNativeExactReplayRef,
      ]),
      fixtureIDs: [openCodeToolNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(binding("tools")).toMatchObject({
      providerAtomID: openCodeToolPackNativeExactAtomID,
      bindingSource: "recipe-explicit",
      canSwapWith: expect.arrayContaining(["tool-pack.shell"]),
    })
    expect(atom(openCodeToolBatchSchedulerNativeExactAtomID)).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/lego-tools/product-schema/opencode",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeToolNativeExactEvidenceRef,
        openCodeToolNativeExactReplayRef,
      ]),
      fixtureIDs: [openCodeToolNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(binding("tools.batch-scheduler")).toMatchObject({
      providerAtomID: openCodeToolBatchSchedulerNativeExactAtomID,
      bindingSource: "recipe-explicit",
      canSwapWith: expect.arrayContaining(["common.tools.batch-scheduler.default"]),
    })
    expect(piAtom("pi.tools.batch-scheduler.native-like")).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/lego-tools/product-schema/pi",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:pi-tool-batch-scheduler-native-exact-fixture",
        "tool-batch-scheduler-native-exact:pi-mono",
      ]),
      fixtureIDs: ["pi-tool-batch-scheduler:native-exact-fixture"],
      knownLossiness: [],
    })
    expect(atom(openCodeToolSchemaNativeExactAtomID)).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/lego-tools/product-schema/opencode",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeToolSchemaNativeExactEvidenceRef,
        openCodeToolSchemaNativeExactReplayRef,
      ]),
      fixtureIDs: [openCodeToolSchemaNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(binding("tools.schema")).toMatchObject({
      providerAtomID: openCodeToolSchemaNativeExactAtomID,
      bindingSource: "recipe-explicit",
      canSwapWith: expect.arrayContaining(["common.tools.schema.default"]),
    })
    expect(piAtom("pi.tools.schema.native-like")).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/lego-tools/product-schema/pi",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:pi-tool-schema-native-exact-fixture",
        "tool-schema-native-exact:pi-mono",
      ]),
      fixtureIDs: ["pi-tool-schema:native-exact-fixture"],
      knownLossiness: [],
    })
    expect(piAtom("pi.tools.result-projector.native-like")).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/lego-tools/product-schema/pi",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:pi-tool-result-projector-native-exact-fixture",
        "tool-result-projector-native-exact:pi-mono",
      ]),
      fixtureIDs: ["pi-tool-result-projector:native-exact-fixture"],
      knownLossiness: [],
    })
    expect(atom(openCodeToolResultProjectorNativeExactAtomID)).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/lego-tools/product-schema/opencode",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeToolNativeExactEvidenceRef,
        openCodeToolNativeExactReplayRef,
      ]),
      fixtureIDs: [openCodeToolNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(binding("tools.result-projector")).toMatchObject({
      providerAtomID: openCodeToolResultProjectorNativeExactAtomID,
      bindingSource: "recipe-explicit",
      canSwapWith: expect.arrayContaining(["common.tools.result-projector.default"]),
    })
    expect(atom(openCodeProviderStreamingDeltaRecorderNativeExactAtomID)).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/adapters-opencode/opencode-provider-stream-projector",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeProviderStreamNativeExactEvidenceRef,
        openCodeProviderStreamNativeExactReplayRef,
      ]),
      fixtureIDs: [openCodeProviderStreamNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(binding("provider.streaming-delta-recorder")).toMatchObject({
      providerAtomID: openCodeProviderStreamingDeltaRecorderNativeExactAtomID,
      bindingSource: "recipe-explicit",
      canSwapWith: expect.arrayContaining(["common.provider.streaming-delta-recorder"]),
    })
    expect(atom(openCodeProviderStreamProjectorNativeExactAtomID)).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/adapters-opencode/opencode-provider-stream-projector",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeProviderStreamNativeExactEvidenceRef,
        openCodeProviderStreamNativeExactReplayRef,
      ]),
      fixtureIDs: [openCodeProviderStreamNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(binding("provider.stream-projector")).toMatchObject({
      providerAtomID: openCodeProviderStreamProjectorNativeExactAtomID,
      bindingSource: "recipe-explicit",
      canSwapWith: expect.arrayContaining(["common.provider.stream-projector"]),
    })
    for (const { portID, atomID, commonAtomID } of [
      {
        portID: "provider.model-registry",
        atomID: "opencode.provider.model-plugin",
        commonAtomID: "provider.model-registry.static",
      },
      {
        portID: "provider.request-shape",
        atomID: "opencode.provider.request-options",
        commonAtomID: "provider.request-shape.openai-compatible",
      },
      {
        portID: "provider.transport",
        atomID: "opencode.provider.transport-instrumentation",
        commonAtomID: "provider.transport.fetch",
      },
      {
        portID: "provider.event-normalizer",
        atomID: "opencode.provider.event-observer",
        commonAtomID: "provider.event-normalizer.openai-compatible",
      },
      {
        portID: "provider.stream",
        atomID: "opencode.provider.plugin-descriptor",
        commonAtomID: "provider.stream.openai-compatible",
      },
    ] as const) {
      expect(binding(portID)).toMatchObject({
        providerAtomID: atomID,
        bindingSource: "recipe-explicit",
        canSwapWith: expect.arrayContaining([commonAtomID]),
      })
    }
    for (const { portID, atomID, commonAtomID } of [
      {
        portID: "tool.executor",
        atomID: "opencode.tool.permission-render-bridge",
        commonAtomID: "tool.executor.default",
      },
      {
        portID: "filesystem.port",
        atomID: "opencode.workspace-filesystem-bridge",
        commonAtomID: "filesystem.workspace-scoped",
      },
      {
        portID: "process-runner.port",
        atomID: "opencode.shell.env-bridge",
        commonAtomID: "process-runner.local",
      },
    ] as const) {
      expect(binding(portID)).toMatchObject({
        providerAtomID: atomID,
        bindingSource: "recipe-explicit",
        canSwapWith: expect.arrayContaining([commonAtomID]),
      })
    }
    expect(atom(openCodeSessionMessagePartProjectorNativeExactAtomID)).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/adapters-opencode/product-schema/session",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeSessionNativeExactEvidenceRef,
        openCodeSessionNativeExactReplayRef,
        "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      ]),
      fixtureIDs: [openCodeSessionNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(binding("session.message-part-projector")).toMatchObject({
      providerAtomID: openCodeSessionMessagePartProjectorNativeExactAtomID,
      bindingSource: "recipe-explicit",
      canSwapWith: expect.arrayContaining(["common.session.message-part-projector"]),
    })
    const openCodeSessionSQLiteServiceAtomIDs = new Set<string>([
      openCodeSessionBranchingSQLiteServiceNativeExactAtomID,
      openCodeSessionContextSelectorMessageV2NativeExactAtomID,
      openCodeSessionDiffSQLiteServiceNativeExactAtomID,
      openCodeSessionEventLogSyncEventNativeExactAtomID,
      openCodeSessionMessageStoreSQLiteServiceNativeExactAtomID,
      openCodeSessionReaderSQLiteServiceNativeExactAtomID,
      openCodeSessionWriterSQLiteServiceNativeExactAtomID,
    ])
    for (const { portID, atomID, commonAtomID } of [
      {
        portID: "session.event-log",
        atomID: openCodeSessionEventLogSyncEventNativeExactAtomID,
        commonAtomID: "session.event-log.memory",
      },
      {
        portID: "session.reader",
        atomID: openCodeSessionReaderSQLiteServiceNativeExactAtomID,
        commonAtomID: "session.reader.memory",
      },
      {
        portID: "session.writer",
        atomID: openCodeSessionWriterSQLiteServiceNativeExactAtomID,
        commonAtomID: "session.writer.memory",
      },
      {
        portID: "session.message-store",
        atomID: openCodeSessionMessageStoreSQLiteServiceNativeExactAtomID,
        commonAtomID: "session.message-store.memory",
      },
      {
        portID: "session.branching",
        atomID: openCodeSessionBranchingSQLiteServiceNativeExactAtomID,
        commonAtomID: "session.branching.memory",
      },
      {
        portID: "session.context-selector",
        atomID: openCodeSessionContextSelectorMessageV2NativeExactAtomID,
        commonAtomID: "session.context-selector.memory",
      },
      {
        portID: "session.diff",
        atomID: openCodeSessionDiffSQLiteServiceNativeExactAtomID,
        commonAtomID: "session.branching.memory",
      },
    ] as const) {
      expect(atom(atomID), atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        source: expect.objectContaining({
          specifier: "@helix/adapters-opencode/session-personality",
        }),
        nativeEvidenceRefs: expect.arrayContaining([
          openCodeSessionNativeExactEvidenceRef,
          openCodeSessionNativeExactReplayRef,
          "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
        ]),
        fixtureIDs: [openCodeSessionNativeExactFixtureID],
        knownLossiness: [],
      })
      expect(binding(portID)).toMatchObject({
        providerAtomID: atomID,
        bindingSource: "recipe-explicit",
        canSwapWith: expect.arrayContaining([commonAtomID]),
      })
    }
    expect(atom(openCodeRuntimeAcceptanceControllerNativeExactAtomID)).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/lego-runtime/product-schema/opencode",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeRuntimeAcceptanceNativeExactEvidenceRef,
        openCodeRuntimeAcceptanceNativeExactReplayRef,
        "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      ]),
      fixtureIDs: [openCodeRuntimeAcceptanceNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(binding("runtime.acceptance-controller")).toMatchObject({
      providerAtomID: openCodeRuntimeAcceptanceControllerNativeExactAtomID,
      bindingSource: "recipe-explicit",
      canSwapWith: expect.arrayContaining(["common.runtime.acceptance-controller.default"]),
    })
    expect(atom(openCodeRuntimeAcceptanceEvidenceNativeExactAtomID)).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      source: expect.objectContaining({
        specifier: "@helix/lego-runtime/product-schema/opencode",
      }),
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeRuntimeAcceptanceNativeExactEvidenceRef,
        openCodeRuntimeAcceptanceNativeExactReplayRef,
        "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      ]),
      fixtureIDs: [openCodeRuntimeAcceptanceNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(binding("runtime.acceptance-evidence")).toMatchObject({
      providerAtomID: openCodeRuntimeAcceptanceEvidenceNativeExactAtomID,
      bindingSource: "recipe-explicit",
      canSwapWith: expect.arrayContaining(["common.runtime.acceptance-evidence.default"]),
    })
    expect(atom("turn.input-normalizer.text")).toMatchObject({
      parityCoverage: "common-shared",
      nativeEvidenceRefs: [],
      fixtureIDs: [],
      knownLossiness: [],
    })
    for (const atomID of openCodeConfigNativeExactAtomIDs) {
      expect(atom(atomID), atomID).toMatchObject({
        parityCoverage: "native",
        implementationKind: "factory",
        source: expect.objectContaining({
          specifier: "@helix/lego-config/product-schema/opencode",
        }),
        nativeEvidenceRefs: expect.arrayContaining([
          openCodeConfigNativeExactEvidenceRef,
          openCodeConfigNativeExactReplayRef,
          "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
        ]),
        fixtureIDs: [openCodeConfigNativeExactFixtureID],
        knownLossiness: [],
      })
    }
    for (const atomID of openCodeIdentityNativeExactAtomIDs) {
      expect(atom(atomID), atomID).toMatchObject({
        parityCoverage: "native",
        implementationKind: "factory",
        source: expect.objectContaining({
          specifier: "@helix/adapters-opencode/product-schema/identity",
        }),
        nativeEvidenceRefs: expect.arrayContaining([
          openCodeIdentityNativeExactEvidenceRef,
          openCodeIdentityNativeExactReplayRef,
          "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
        ]),
        fixtureIDs: [openCodeIdentityNativeExactFixtureID],
        knownLossiness: [],
      })
      expect(atom(atomID)?.nativeEvidenceRefs).not.toContain("conformance:opencode-identity-source-matrix")
      expect(atom(atomID)?.fixtureIDs).not.toContain("opencode-identity:source-matrix")
    }
    const hermesIdentityContract = buildAssemblyContract({
      product: "hermes-agent",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    for (const atomID of [
      "hermes.identity.clock-format",
      "hermes.identity.id-generator",
      "hermes.identity.workspace-resolver",
    ]) {
      const hermesAtom = hermesIdentityContract.atoms.find((candidate) => candidate.id === atomID)
      expect(hermesAtom, atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          "conformance:hermes-identity-native-exact-fixture",
          "identity-native-exact:hermes-agent",
        ]),
        fixtureIDs: ["hermes-identity:native-exact-fixture"],
        knownLossiness: [],
      })
      expect(hermesAtom?.nativeEvidenceRefs).not.toContain("conformance:hermes-identity-source-matrix")
      expect(hermesAtom?.fixtureIDs).not.toContain("hermes-identity:source-matrix")
    }
    const nanobotIdentityContract = buildAssemblyContract({
      product: "nanobot",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    for (const atomID of [
      "nanobot.identity.clock-format",
      "nanobot.identity.id-generator",
      "nanobot.identity.workspace-resolver",
    ]) {
      const nanobotAtom = nanobotIdentityContract.atoms.find((candidate) => candidate.id === atomID)
      expect(nanobotAtom, atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          "conformance:nanobot-identity-native-exact-fixture",
          "identity-native-exact:nanobot",
        ]),
        fixtureIDs: ["nanobot-identity:native-exact-fixture"],
        knownLossiness: [],
      })
      expect(nanobotAtom?.nativeEvidenceRefs).not.toContain("conformance:nanobot-identity-source-matrix")
      expect(nanobotAtom?.fixtureIDs).not.toContain("nanobot-identity:source-matrix")
    }
    const opencodeProviderNativeCases = [
      { atomID: "opencode.provider.auth-descriptor", exactKey: "auth-descriptor" },
      { atomID: "opencode.provider.event-observer", exactKey: "event-observer" },
      { atomID: "opencode.provider.model-plugin", exactKey: "model-plugin" },
      { atomID: "opencode.provider.parser-observer", exactKey: "parser-observer" },
      { atomID: "opencode.provider.plugin-descriptor", exactKey: "plugin-descriptor" },
      { atomID: "opencode.provider.request-options", exactKey: "request-options" },
      { atomID: "opencode.provider.transport-instrumentation", exactKey: "transport-instrumentation" },
      { atomID: "opencode.provider.usage-renderer", exactKey: "usage" },
    ] as const
    for (const { atomID, exactKey } of opencodeProviderNativeCases) {
      const packageRuntimeExact = exactKey === "model-plugin" || exactKey === "plugin-descriptor"
      const nativeEvidenceRefs = [
        `conformance:opencode-provider-${exactKey}-native-exact-fixture`,
        `provider-${exactKey}-native-exact:opencode`,
        "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
        ...(packageRuntimeExact
          ? [
            openCodeProviderPackageRuntimeNativeExactDiffEvidenceRef,
            openCodeProviderPackageRuntimeNativeExactDiffReplayRef,
          ]
          : []),
        ...(exactKey === "transport-instrumentation"
          ? [
            openCodeProviderRetryCancelNativeExactDiffEvidenceRef,
            openCodeProviderRetryCancelNativeExactDiffReplayRef,
          ]
          : []),
      ]
      const fixtureIDs = [
        `opencode-provider-${exactKey}:native-exact-fixture`,
        ...(packageRuntimeExact ? [openCodeProviderPackageRuntimeNativeExactDiffFixtureID] : []),
        ...(exactKey === "transport-instrumentation" ? [openCodeProviderRetryCancelNativeExactDiffFixtureID] : []),
      ]
      expect(atom(atomID), atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining(nativeEvidenceRefs),
        fixtureIDs: expect.arrayContaining(fixtureIDs),
        knownLossiness: [],
      })
    }
    for (const atomID of openCodeSessionNativeExactAtomIDs) {
      const found = atom(atomID)
      expect(found, atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          openCodeSessionNativeExactEvidenceRef,
          openCodeSessionNativeExactReplayRef,
          "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
        ]),
        fixtureIDs: [openCodeSessionNativeExactFixtureID],
        knownLossiness: [],
        source: expect.objectContaining({
          specifier: openCodeSessionSQLiteServiceAtomIDs.has(atomID)
            ? "@helix/adapters-opencode/session-personality"
            : "@helix/adapters-opencode/product-schema/session",
        }),
      })
      expect(found.nativeEvidenceRefs).not.toContain("conformance:opencode-session-source-matrix")
      expect(found.nativeEvidenceRefs).not.toContain("conformance:opencode-session-runtime-projection")
      expect(found.nativeEvidenceRefs).not.toContain("conformance:opencode-session-live-runtime-fixture")
      expect(found.fixtureIDs).not.toContain("opencode-session:source-matrix")
      expect(found.fixtureIDs).not.toContain("opencode-session:runtime-projection")
      expect(found.fixtureIDs).not.toContain("opencode-session:live-runtime-fixture")
    }
    const nanobotSessionContract = buildAssemblyContract({
      product: "nanobot",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    for (const atomID of nanobotSessionNativeExactAtomIDs) {
      const found = nanobotSessionContract.atoms.find((candidate) => candidate.id === atomID)
      expect(found, atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          nanobotSessionNativeExactEvidenceRef,
          nanobotSessionNativeExactReplayRef,
          "upstream:https://github.com/HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        ]),
        fixtureIDs: [nanobotSessionNativeExactFixtureID],
        knownLossiness: [],
        source: expect.objectContaining({
          specifier: "@helix/adapters-nanobot/product-schema/session",
        }),
      })
      expect(found?.nativeEvidenceRefs).not.toContain("conformance:nanobot-session-source-matrix")
      expect(found?.fixtureIDs).not.toContain("nanobot-session:source-matrix")
    }
    const hermesSessionNativeAtomIDs = [
      "hermes.session.id-generator",
      "hermes.session.branch-graph.lineage",
      "hermes.session.pagination.updated-at",
      "hermes.session.context-selector.thread-history",
      "hermes.session.store.sqlite-fts",
      "hermes.session.projector.openai-messages",
      "hermes.session.compaction-trajectory",
    ]
    const hermesSessionContract = buildAssemblyContract({
      product: "hermes-agent",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    for (const atomID of hermesSessionNativeAtomIDs) {
      const found = hermesSessionContract.atoms.find((candidate) => candidate.id === atomID)
      expect(found, atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          "conformance:hermes-session-acp-native-exact-fixture",
          "session-acp-native-exact:hermes-agent",
          "upstream:https://github.com/NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
        ]),
        fixtureIDs: ["hermes-session-acp:native-exact-fixture"],
        knownLossiness: [],
        source: expect.objectContaining({
          specifier: "@helix/adapters-hermes/product-schema/session",
        }),
      })
    }
    for (const atomID of openCodeEventNativeExactAtomIDs) {
      const found = atom(atomID)
      expect(found, atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          openCodeEventNativeExactEvidenceRef,
          openCodeEventNativeExactReplayRef,
          "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
        ]),
        fixtureIDs: [openCodeEventNativeExactFixtureID],
        knownLossiness: [],
        source: expect.objectContaining({
          specifier: "@helix/adapters-opencode/product-schema/events",
        }),
      })
      expect(found.nativeEvidenceRefs).not.toContain("conformance:opencode-event-live-runtime-fixture")
      expect(found.nativeEvidenceRefs).not.toContain("conformance:opencode-event-source-matrix")
      expect(found.fixtureIDs).not.toContain("opencode-event:live-runtime-fixture")
      expect(found.fixtureIDs).not.toContain("opencode-event:source-matrix")
    }
    const nanobotEventContract = buildAssemblyContract({
      product: "nanobot",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    for (const atomID of nanobotEventNativeExactAtomIDs) {
      const found = nanobotEventContract.atoms.find((candidate) => candidate.id === atomID)
      expect(found, atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          nanobotEventNativeExactEvidenceRef,
          nanobotEventNativeExactReplayRef,
          "upstream:https://github.com/HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        ]),
        fixtureIDs: [nanobotEventNativeExactFixtureID],
        knownLossiness: [],
        source: expect.objectContaining({
          specifier: "@helix/adapters-nanobot/product-schema/events",
        }),
      })
      expect(found?.nativeEvidenceRefs).not.toContain("conformance:nanobot-event-source-matrix")
      expect(found?.fixtureIDs).not.toContain("nanobot-event:source-matrix")
    }
    const hermesEventContract = buildAssemblyContract({
      product: "hermes-agent",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    for (const atomID of hermesEventNativeExactAtomIDs) {
      const found = hermesEventContract.atoms.find((candidate) => candidate.id === atomID)
      expect(found, atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          hermesEventNativeExactEvidenceRef,
          hermesEventNativeExactReplayRef,
          "upstream:https://github.com/NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
        ]),
        fixtureIDs: [hermesEventNativeExactFixtureID],
        knownLossiness: [],
        source: expect.objectContaining({
          specifier: "@helix/adapters-hermes/product-schema/events",
        }),
      })
      expect(found?.nativeEvidenceRefs).not.toContain("conformance:hermes-event-source-matrix")
      expect(found?.fixtureIDs).not.toContain("hermes-event:source-matrix")
    }
    expect(atom("opencode.tool-pack.compatibility")).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-tool-native-exact-fixture",
        "tool-native-exact:opencode",
        "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      ]),
      fixtureIDs: ["opencode-tool:native-exact-fixture"],
      knownLossiness: [],
      source: expect.objectContaining({
        specifier: "@helix/lego-tools/product-schema/opencode",
      }),
    })
    expect(atom("opencode.trace.debug-surface")).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-trace-debug-surface-native-exact-fixture",
        "trace-debug-surface-native-exact:opencode",
        "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      ]),
      fixtureIDs: ["opencode-trace-debug-surface:native-exact-fixture"],
      knownLossiness: [],
    })
    const piTraceContract = buildAssemblyContract({
      product: "pi-mono",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    const piTraceAtom = piTraceContract.atoms.find((candidate) => candidate.id === piMonoTraceDebugSurfaceNativeExactAtomID)
    expect(piTraceAtom).toMatchObject({
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([
        piMonoTraceDebugSurfaceNativeExactEvidenceRef,
        piMonoTraceDebugSurfaceNativeExactReplayRef,
      ]),
      fixtureIDs: expect.arrayContaining([piMonoTraceDebugSurfaceNativeExactFixtureID]),
      knownLossiness: [],
    })
    expect(piTraceAtom?.nativeEvidenceRefs).not.toContain("conformance:pi-trace-source-matrix")
    expect(piTraceAtom?.fixtureIDs).not.toContain("pi-trace:source-matrix")

    const hermesTraceContract = buildAssemblyContract({
      product: "hermes-agent",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    const hermesTraceAtom = hermesTraceContract.atoms.find((candidate) => candidate.id === hermesTraceDebugSurfaceNativeExactAtomID)
    expect(hermesTraceAtom).toMatchObject({
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([
        hermesTraceDebugSurfaceNativeExactEvidenceRef,
        hermesTraceDebugSurfaceNativeExactReplayRef,
      ]),
      fixtureIDs: expect.arrayContaining([hermesTraceDebugSurfaceNativeExactFixtureID]),
      knownLossiness: [],
      source: expect.objectContaining({
        specifier: "@helix/adapters-hermes/product-schema/trace",
      }),
    })
    expect(hermesTraceAtom?.nativeEvidenceRefs).not.toContain("conformance:hermes-trace-source-matrix")
    expect(hermesTraceAtom?.fixtureIDs).not.toContain("hermes-trace:source-matrix")

    const nanobotTraceContract = buildAssemblyContract({
      product: "nanobot",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    const nanobotTraceAtom = nanobotTraceContract.atoms.find((candidate) => candidate.id === nanobotTraceDebugSurfaceNativeExactAtomID)
    expect(nanobotTraceAtom).toMatchObject({
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([
        nanobotTraceDebugSurfaceNativeExactEvidenceRef,
        nanobotTraceDebugSurfaceNativeExactReplayRef,
      ]),
      fixtureIDs: expect.arrayContaining([nanobotTraceDebugSurfaceNativeExactFixtureID]),
      knownLossiness: [],
      source: expect.objectContaining({
        specifier: "@helix/adapters-nanobot/product-schema/trace",
      }),
    })
    expect(nanobotTraceAtom?.nativeEvidenceRefs).not.toContain("conformance:nanobot-trace-source-matrix")
    expect(nanobotTraceAtom?.fixtureIDs).not.toContain("nanobot-trace:source-matrix")

    for (const atomID of openCodeProductShellNativeExactAtomIDs) {
      expect(atom(atomID), atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        source: expect.objectContaining({
          specifier: "@helix/adapters-opencode/product-schema/product-shell",
        }),
        sourcePackage: "@helix/adapters-opencode",
        publicExport: "./product-schema/product-shell",
        nativeEvidenceRefs: expect.arrayContaining([
          openCodeProductShellNativeExactEvidenceRef,
          openCodeProductShellNativeExactReplayRef,
          "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
        ]),
        fixtureIDs: [openCodeProductShellNativeExactFixtureID],
        knownLossiness: [],
      })
    }
    expect(atom("opencode.shell.env-bridge")).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-shell-env-native-exact-fixture",
        "shell-env-native-exact:opencode",
        "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      ]),
      fixtureIDs: ["opencode-shell-env:native-exact-fixture"],
      knownLossiness: [],
    })
    const piProductShellNativeContract = buildAssemblyContract({
      product: "pi-mono",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    for (const atomID of ["pi.product-shell.harness", "pi.product-shell.server"]) {
      const productAtom = piProductShellNativeContract.atoms.find((candidate) => candidate.id === atomID)
      expect(productAtom, `pi-mono:${atomID}`).toMatchObject({
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          "conformance:pi-product-shell-native-exact-fixture",
          "product-shell-native-exact:pi-mono",
          "upstream:https://github.com/earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        ]),
        fixtureIDs: ["pi-product-shell:native-exact-fixture"],
        knownLossiness: [],
      })
    }
    const nanobotProductShellNativeContract = buildAssemblyContract({
      product: "nanobot",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    for (const atomID of nanobotProductShellNativeExactAtomIDs) {
      const productAtom = nanobotProductShellNativeContract.atoms.find((candidate) => candidate.id === atomID)
      expect(productAtom, `nanobot:${atomID}`).toMatchObject({
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          nanobotProductShellNativeExactEvidenceRef,
          nanobotProductShellNativeExactReplayRef,
          nanobotUINativeExactEvidenceRef,
          nanobotUINativeExactReplayRef,
        ]),
        fixtureIDs: expect.arrayContaining([nanobotProductShellNativeExactFixtureID, nanobotUINativeExactFixtureID]),
        knownLossiness: [],
      })
    }
    const hermesProductShellNativeContract = buildAssemblyContract({
      product: "hermes-agent",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    for (const atomID of hermesProductShellNativeExactAtomIDs) {
      const productAtom = hermesProductShellNativeContract.atoms.find((candidate) => candidate.id === atomID)
      expect(productAtom, `hermes-agent:${atomID}`).toMatchObject({
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          hermesProductShellNativeExactEvidenceRef,
          hermesProductShellNativeExactReplayRef,
          hermesUINativeExactEvidenceRef,
          hermesUINativeExactReplayRef,
        ]),
        fixtureIDs: expect.arrayContaining([hermesProductShellNativeExactFixtureID, hermesUINativeExactFixtureID]),
        knownLossiness: [],
      })
    }
    for (const atomID of openCodeUINativeExactAtomIDs) {
      expect(atom(atomID), atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        source: expect.objectContaining({
          specifier: "@helix/lego-ui/product-schema/opencode",
        }),
        sourcePackage: "@helix/lego-ui",
        publicExport: "./product-schema/opencode",
        nativeEvidenceRefs: expect.arrayContaining([
          openCodeUINativeExactEvidenceRef,
          openCodeUINativeExactReplayRef,
          "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
        ]),
        fixtureIDs: [openCodeUINativeExactFixtureID],
        knownLossiness: [],
      })
    }
    const nanobotUINativeContract = buildAssemblyContract({
      product: "nanobot",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    for (const atomID of nanobotUINativeExactAtomIDs) {
      const productAtom = nanobotUINativeContract.atoms.find((candidate) => candidate.id === atomID)
      expect(productAtom, `nanobot:${atomID}`).toMatchObject({
        parityCoverage: "native",
        sourcePackage: "@helix/lego-ui",
        publicExport: "./product-schema/nanobot",
        nativeEvidenceRefs: expect.arrayContaining([
          nanobotUINativeExactEvidenceRef,
          nanobotUINativeExactReplayRef,
          "upstream:https://github.com/HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        ]),
        fixtureIDs: [nanobotUINativeExactFixtureID],
        knownLossiness: [],
      })
    }
    const hermesUINativeContract = buildAssemblyContract({
      product: "hermes-agent",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    for (const atomID of hermesUINativeExactAtomIDs) {
      const productAtom = hermesUINativeContract.atoms.find((candidate) => candidate.id === atomID)
      expect(productAtom, `hermes-agent:${atomID}`).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        sourcePackage: "@helix/adapters-hermes",
        publicExport: "./product-schema/ui",
        nativeEvidenceRefs: expect.arrayContaining([
          hermesUINativeExactEvidenceRef,
          hermesUINativeExactReplayRef,
          "upstream:https://github.com/NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
        ]),
        fixtureIDs: [hermesUINativeExactFixtureID],
        knownLossiness: [],
      })
      expect(productAtom?.nativeEvidenceRefs).not.toContain("conformance:hermes-ui-source-matrix")
      expect(productAtom?.fixtureIDs).not.toContain("hermes-ui:source-matrix")
    }
    for (const atomID of openCodeHookLifecycleNativeExactAtomIDs) {
      expect(atom(atomID), atomID).toMatchObject({
        parityCoverage: "native",
        implementationKind: "factory",
        nativeEvidenceRefs: expect.arrayContaining([
          openCodeHookLifecycleNativeExactEvidenceRef,
          openCodeHookLifecycleNativeExactReplayRef,
          "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
        ]),
        fixtureIDs: [openCodeHookLifecycleNativeExactFixtureID],
        knownLossiness: [],
      })
    }
    const productHookSourceMatrixCases: Array<{
      product: AssemblyContractProduct
      evidenceRef: string
      fixtureID: string
      lossiness: string
      upstreamRef: string
      atomIDs: string[]
    }> = []
    for (const item of productHookSourceMatrixCases) {
      const productContract = buildAssemblyContract({
        product: item.product,
        includeTaskParity: true,
        includeNativeFixtures: true,
        generatedAt: "2026-05-30T00:00:00.000Z",
      })
      const productAtom = (id: string) => {
        const found = productContract.atoms.find((candidate) => candidate.id === id)
        if (!found) throw new Error(`Missing ${item.product} atom ${id}`)
        return found
      }
      for (const atomID of item.atomIDs) {
        expect(productAtom(atomID), `${item.product}:${atomID}`).toMatchObject({
          parityCoverage: "compatible-bridge",
          nativeEvidenceRefs: expect.arrayContaining([item.evidenceRef, item.upstreamRef]),
          fixtureIDs: expect.arrayContaining([item.fixtureID]),
          knownLossiness: expect.arrayContaining([
            "product-bridge",
            "native-parity-not-proven",
            item.lossiness,
          ]),
        })
      }
    }
    const hermesHookNativeContract = buildAssemblyContract({
      product: "hermes-agent",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    for (const atomID of hermesHookLifecycleNativeExactAtomIDs) {
      const productAtom = hermesHookNativeContract.atoms.find((candidate) => candidate.id === atomID)
      expect(productAtom, `hermes-agent:${atomID}`).toMatchObject({
        parityCoverage: "native",
        implementationKind: "factory",
        nativeEvidenceRefs: expect.arrayContaining([
          hermesHookLifecycleNativeExactEvidenceRef,
          hermesHookLifecycleNativeExactReplayRef,
          "upstream:https://github.com/NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
        ]),
        fixtureIDs: [hermesHookLifecycleNativeExactFixtureID],
        knownLossiness: [],
      })
    }
    const nanobotHookNativeContract = buildAssemblyContract({
      product: "nanobot",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    for (const atomID of nanobotHookLifecycleNativeExactAtomIDs) {
      const productAtom = nanobotHookNativeContract.atoms.find((candidate) => candidate.id === atomID)
      expect(productAtom, `nanobot:${atomID}`).toMatchObject({
        parityCoverage: "native",
        implementationKind: "factory",
        nativeEvidenceRefs: expect.arrayContaining([
          nanobotHookLifecycleNativeExactEvidenceRef,
          nanobotHookLifecycleNativeExactReplayRef,
          "upstream:https://github.com/HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        ]),
        fixtureIDs: [nanobotHookLifecycleNativeExactFixtureID],
        knownLossiness: [],
      })
    }
    for (const atomID of openCodeToolNativeExactAtomIDs) {
      expect(atom(atomID), atomID).toMatchObject({
        parityCoverage: "native",
        implementationKind: "factory",
        nativeEvidenceRefs: expect.arrayContaining([
          openCodeToolNativeExactEvidenceRef,
          openCodeToolNativeExactReplayRef,
          "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
        ]),
        fixtureIDs: [openCodeToolNativeExactFixtureID],
        knownLossiness: [],
      })
    }
    expect(verifyAssemblyContract(contract).ok).toBe(true)

    const hermesToolContract = buildAssemblyContract({
      product: "hermes-agent",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    for (const atomID of hermesToolNativeExactAtomIDs) {
      const found = hermesToolContract.atoms.find((candidate) => candidate.id === atomID)
      expect(found, `hermes-agent:${atomID}`).toMatchObject({
        parityCoverage: "native",
        implementationKind: "factory",
        nativeEvidenceRefs: expect.arrayContaining([
          hermesToolNativeExactEvidenceRef,
          hermesToolNativeExactReplayRef,
          "upstream:https://github.com/NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
        ]),
        fixtureIDs: [hermesToolNativeExactFixtureID],
        knownLossiness: [],
      })
    }

    const nanobotContract = buildAssemblyContract({
      product: "nanobot",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    for (const atomID of nanobotToolNativeExactAtomIDs) {
      const found = nanobotContract.atoms.find((candidate) => candidate.id === atomID)
      expect(found, `nanobot:${atomID}`).toMatchObject({
        parityCoverage: "native",
        implementationKind: "factory",
        nativeEvidenceRefs: expect.arrayContaining([
          nanobotToolNativeExactEvidenceRef,
          nanobotToolNativeExactReplayRef,
          "upstream:https://github.com/HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        ]),
        fixtureIDs: [nanobotToolNativeExactFixtureID],
        knownLossiness: [],
      })
    }
    const nanobotPromptAtom = nanobotContract.atoms.find((candidate) => candidate.id === "nanobot.prompt.agent-builder")
    const bootstrapEvidenceRefs = nanobotBuiltinBootstrapAssets().map((asset) => `pinned-asset:nanobot-bootstrap/${asset.name}@sha256:${asset.sha256}`)
    const bootstrapFixtureIDs = nanobotBuiltinBootstrapAssets().map((asset) => `nanobot-bootstrap:${asset.name}`)
    expect(nanobotPromptAtom).toMatchObject({
      parityCoverage: "native",
      upstreamVersion: "v0.2.0 / nanobot-ai@0.2.0",
      upstreamCommit: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
      nativeEvidenceRefs: expect.arrayContaining([
        nanobotPromptNativeExactEvidenceRef,
        nanobotPromptNativeExactReplayRef,
        "conformance:nanobot-memory-lifecycle",
        "conformance:nanobot-prompt-upstream-source-matrix",
        "conformance:nanobot-channel-lifecycle-timing",
        "conformance:nanobot-channel-side-effect-replay",
        "conformance:nanobot-channel-registry-source-matrix",
        "conformance:nanobot-platform-prompt-matrix",
        "conformance:nanobot-platform-router-rendering",
        "conformance:nanobot-workspace-template-sync",
        "conformance:nanobot-skills-index-cache",
        "package:nanobot-ai@0.2.0",
        "upstream:https://github.com/HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        ...bootstrapEvidenceRefs,
      ]),
      fixtureIDs: expect.arrayContaining([nanobotPromptNativeExactFixtureID, "nanobot-memory:lifecycle", "nanobot-prompt:upstream-source-matrix", "nanobot-prompt:channel-lifecycle-timing", "nanobot-prompt:channel-side-effect-replay", "nanobot-prompt:channel-registry-source-matrix", "nanobot-prompt:platform-matrix", "nanobot-prompt:platform-router-rendering", "nanobot-workspace-sync:templates", "nanobot-skills:index-cache", ...bootstrapFixtureIDs]),
      knownLossiness: [],
    })
    for (const atomID of nanobotProviderNativeExactAtomIDs) {
      const providerAtom = nanobotContract.atoms.find((candidate) => candidate.id === atomID)
      expect(providerAtom, atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        source: expect.objectContaining({
          specifier: "@helix/adapters-nanobot/product-schema/provider",
        }),
        nativeEvidenceRefs: expect.arrayContaining([
          nanobotProviderNativeExactEvidenceRef,
          nanobotProviderNativeExactReplayRef,
          "package:nanobot-ai@0.2.0",
          "upstream:https://github.com/HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        ]),
        fixtureIDs: [nanobotProviderNativeExactFixtureID],
        knownLossiness: [],
      })
      expect(providerAtom?.nativeEvidenceRefs).not.toContain("conformance:nanobot-provider-source-matrix")
      expect(providerAtom?.fixtureIDs).not.toContain("nanobot-provider:source-matrix")
    }
    expect(verifyAssemblyContract(nanobotContract).ok).toBe(true)

    for (const atomID of hermesProviderNativeExactAtomIDs) {
      const providerAtom = hermesContract.atoms.find((candidate) => candidate.id === atomID)
      expect(providerAtom, atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          hermesProviderNativeExactEvidenceRef,
          hermesProviderNativeExactReplayRef,
          "package:hermes-agent==0.15.1",
          "upstream:https://github.com/NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
        ]),
        fixtureIDs: expect.arrayContaining([hermesProviderNativeExactFixtureID]),
        knownLossiness: [],
      })
      expect(providerAtom?.nativeEvidenceRefs).not.toContain("conformance:hermes-provider-source-matrix")
      expect(providerAtom?.fixtureIDs).not.toContain("hermes-provider:source-matrix")
    }
    expect(verifyAssemblyContract(hermesContract).ok).toBe(true)
  }, 15000)

  it("binds OpenCode runtime executable ports to native providers while retaining product metadata overlays", () => {
    const products: Array<{ product: AssemblyContractProduct; prefix: string }> = [
      { product: "opencode", prefix: "opencode" },
      { product: "pi-mono", prefix: "pi" },
      { product: "nanobot", prefix: "nanobot" },
      { product: "hermes-agent", prefix: "hermes" },
    ]
    const expectedBindings = {
      "runtime.module-catalog": "runtime.module-catalog.memory",
      "runtime.capability-resolver": "runtime.capability-resolver.default",
      "runtime.binding-planner": "runtime.binding-planner.lockfile",
      "runtime.lifecycle-runner": "runtime.lifecycle-runner.scoped",
      "runtime.assembly-graph": "runtime.assembly-graph.lockfile",
    }
    const expectedOpenCodeBindings = {
      "runtime.module-catalog": "opencode.runtime.module-catalog",
      "runtime.capability-resolver": "opencode.runtime.capability-resolver",
      "runtime.binding-planner": "opencode.runtime.binding-planner",
      "runtime.lifecycle-runner": "opencode.runtime.lifecycle-runner",
      "runtime.assembly-graph": "opencode.runtime.assembly-graph",
    }
    const expectedPiBindings = {
      "runtime.module-catalog": "pi.runtime.module-catalog",
      "runtime.capability-resolver": "pi.runtime.capability-resolver",
      "runtime.binding-planner": "pi.runtime.binding-planner",
      "runtime.lifecycle-runner": "pi.runtime.lifecycle-runner",
      "runtime.assembly-graph": "pi.runtime.assembly-graph",
    }
    const overlaySuffixes = ["module-aliases", "capability-aliases", "binding-defaults", "lifecycle-defaults", "graph-labels"]

    for (const { product, prefix } of products) {
      const contract = buildAssemblyContract({ product, generatedAt: "2026-05-30T00:00:00.000Z" })
      const selectedAtomIDs = contract.atoms.filter((atom) => atom.selected).map((atom) => atom.id)
      const expected = product === "opencode" ? expectedOpenCodeBindings : product === "pi-mono" ? expectedPiBindings : expectedBindings
      for (const portID of Object.keys(expectedBindings)) {
        const expectedProvider = expected[portID as keyof typeof expected]
        expect(contract.bindings).toEqual(expect.arrayContaining([expect.objectContaining({ portID, providerAtomID: expectedProvider })]))
        expect(contract.ports.find((port) => port.id === portID)?.selectedProviderAtom).toBe(expectedProvider)
      }
      for (const suffix of overlaySuffixes) {
        const atomID = `${prefix}.runtime.${suffix}`
        expect(selectedAtomIDs).toContain(atomID)
        expect(contract.atoms.find((atom) => atom.id === atomID)).toMatchObject({ implementationKind: "metadata-only" })
      }
      if (product === "opencode") {
        for (const atomID of openCodeRuntimeAssemblyNativeExactAtomIDs) {
          expect(contract.atoms.find((atom) => atom.id === atomID)).toMatchObject({
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
      }
      if (product === "pi-mono") {
        for (const atomID of piMonoRuntimeAssemblyNativeExactAtomIDs) {
          expect(contract.atoms.find((atom) => atom.id === atomID)).toMatchObject({
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
      }
      expect(verifyAssemblyContract(contract).ok).toBe(true)
    }
  })

  it("rejects metadata-only atoms as providers for executable runtime ports", () => {
    const contract = buildAssemblyContract({ product: "opencode", generatedAt: "2026-05-30T00:00:00.000Z" })
    const metadataProvider = "opencode.runtime.capability-aliases"
    const broken: AssemblyContract = {
      ...contract,
      ports: contract.ports.map((port) =>
        port.id === "runtime.capability-resolver"
          ? { ...port, providerAtoms: [metadataProvider], selectedProviderAtom: metadataProvider }
          : port,
      ),
      bindings: contract.bindings.map((binding) =>
        binding.portID === "runtime.capability-resolver"
          ? { ...binding, providerAtomID: metadataProvider, providerAtom: metadataProvider }
          : binding,
      ),
    }
    const verification = verifyAssemblyContract(broken)

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("assembly.required-executable-no-placeholder")
    expect(verification.issues.find((issue) => issue.id === "assembly.required-executable-no-placeholder")?.refs).toEqual(
      expect.arrayContaining(["opencode:runtime.capability-resolver:opencode.runtime.capability-aliases"]),
    )
  })

  it("promotes Pi, Nanobot, and Hermes TUI event-loop shells to native surfaces", () => {
    const piContract = buildAssemblyContract({ product: "pi-mono", generatedAt: "2026-05-30T00:00:00.000Z" })
    expect(piContract.atoms.find((candidate) => candidate.id === "pi.tui.shell")).toMatchObject({
      id: "pi.tui.shell",
      provides: expect.arrayContaining(["ui.event-loop"]),
      implementationKind: "factory",
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-ui-native-exact-fixture", "ui-native-exact:pi-mono"]),
      fixtureIDs: ["pi-ui:native-exact-fixture"],
      knownLossiness: [],
    })
    expect(verifyAssemblyContract(piContract).ok).toBe(true)

    const nanobotContract = buildAssemblyContract({ product: "nanobot", generatedAt: "2026-05-30T00:00:00.000Z" })
    expect(nanobotContract.atoms.find((candidate) => candidate.id === "nanobot.tui.shell")).toMatchObject({
      id: "nanobot.tui.shell",
      provides: expect.arrayContaining(["ui.event-loop"]),
      implementationKind: "factory",
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining(["conformance:nanobot-ui-native-exact-fixture", "ui-native-exact:nanobot"]),
      fixtureIDs: ["nanobot-ui:native-exact-fixture"],
      knownLossiness: [],
    })
    expect(verifyAssemblyContract(nanobotContract).ok).toBe(true)

    const hermesContract = buildAssemblyContract({ product: "hermes-agent", generatedAt: "2026-05-30T00:00:00.000Z" })
    expect(hermesContract.atoms.find((candidate) => candidate.id === hermesTUIShellNativeExactAtomID)).toMatchObject({
      id: hermesTUIShellNativeExactAtomID,
      provides: expect.arrayContaining(["ui.event-loop"]),
      implementationKind: "factory",
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([hermesUINativeExactEvidenceRef, hermesUINativeExactReplayRef]),
      fixtureIDs: [hermesUINativeExactFixtureID],
      knownLossiness: [],
    })
    expect(verifyAssemblyContract(hermesContract).ok).toBe(true)
  })

  it("promotes Pi, Nanobot, and Hermes TUI product shells to native surfaces", () => {
    const piContract = buildAssemblyContract({ product: "pi-mono", generatedAt: "2026-05-30T00:00:00.000Z" })
    expect(piContract.atoms.find((candidate) => candidate.id === "pi.product-shell.tui")).toMatchObject({
      id: "pi.product-shell.tui",
      provides: expect.arrayContaining(["product.shell"]),
      implementationKind: "factory",
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-product-shell-native-exact-fixture", "product-shell-native-exact:pi-mono"]),
      fixtureIDs: ["pi-product-shell:native-exact-fixture"],
      knownLossiness: [],
    })
    expect(verifyAssemblyContract(piContract).ok).toBe(true)

    const nanobotContract = buildAssemblyContract({ product: "nanobot", generatedAt: "2026-05-30T00:00:00.000Z" })
    expect(nanobotContract.atoms.find((candidate) => candidate.id === "nanobot.product-shell.tui")).toMatchObject({
      id: "nanobot.product-shell.tui",
      provides: expect.arrayContaining(["product.shell"]),
      implementationKind: "factory",
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining(["conformance:nanobot-product-shell-native-exact-fixture", "product-shell-native-exact:nanobot"]),
      fixtureIDs: expect.arrayContaining(["nanobot-product-shell:native-exact-fixture", "nanobot-ui:native-exact-fixture"]),
      knownLossiness: [],
    })
    expect(verifyAssemblyContract(nanobotContract).ok).toBe(true)

    const hermesContract = buildAssemblyContract({ product: "hermes-agent", generatedAt: "2026-05-30T00:00:00.000Z" })
    expect(hermesContract.atoms.find((candidate) => candidate.id === hermesProductShellTUINativeExactAtomID)).toMatchObject({
      id: hermesProductShellTUINativeExactAtomID,
      provides: expect.arrayContaining(["product.shell"]),
      implementationKind: "factory",
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([hermesProductShellNativeExactEvidenceRef, hermesProductShellNativeExactReplayRef, hermesUINativeExactEvidenceRef, hermesUINativeExactReplayRef]),
      fixtureIDs: expect.arrayContaining([hermesProductShellNativeExactFixtureID, hermesUINativeExactFixtureID]),
      knownLossiness: [],
    })
    expect(verifyAssemblyContract(hermesContract).ok).toBe(true)
  })

  it("promotes Pi, Nanobot, and Hermes Web product shells to native surfaces", () => {
    const piContract = buildAssemblyContract({ product: "pi-mono", generatedAt: "2026-05-30T00:00:00.000Z" })
    for (const atomID of ["pi.product-shell.web-ui", "pi.product-shell.browser-smoke", "pi.product-shell.release-hardening"]) {
      expect(piContract.atoms.find((candidate) => candidate.id === atomID)).toMatchObject({
        id: atomID,
        provides: expect.arrayContaining(["product.shell"]),
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-product-shell-native-exact-fixture", "product-shell-native-exact:pi-mono"]),
        fixtureIDs: ["pi-product-shell:native-exact-fixture"],
        knownLossiness: [],
      })
    }
    expect(verifyAssemblyContract(piContract).ok).toBe(true)

    const nanobotContract = buildAssemblyContract({ product: "nanobot", generatedAt: "2026-05-30T00:00:00.000Z" })
    expect(nanobotContract.atoms.find((candidate) => candidate.id === "nanobot.product-shell.web-ui")).toMatchObject({
      id: "nanobot.product-shell.web-ui",
      provides: expect.arrayContaining(["product.shell"]),
      implementationKind: "factory",
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining(["conformance:nanobot-product-shell-native-exact-fixture", "product-shell-native-exact:nanobot"]),
      fixtureIDs: expect.arrayContaining(["nanobot-product-shell:native-exact-fixture"]),
      knownLossiness: [],
    })
    expect(verifyAssemblyContract(nanobotContract).ok).toBe(true)

    const hermesContract = buildAssemblyContract({ product: "hermes-agent", generatedAt: "2026-05-30T00:00:00.000Z" })
    expect(hermesContract.atoms.find((candidate) => candidate.id === hermesProductShellWebDashboardNativeExactAtomID)).toMatchObject({
      id: hermesProductShellWebDashboardNativeExactAtomID,
      provides: expect.arrayContaining(["product.shell"]),
      implementationKind: "factory",
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([hermesProductShellNativeExactEvidenceRef, hermesProductShellNativeExactReplayRef, hermesUINativeExactEvidenceRef, hermesUINativeExactReplayRef]),
      fixtureIDs: expect.arrayContaining([hermesProductShellNativeExactFixtureID, hermesUINativeExactFixtureID]),
      knownLossiness: [],
    })
    expect(verifyAssemblyContract(hermesContract).ok).toBe(true)
  })

  it("rejects preview-only shells as primary product shell providers", () => {
    const contract = buildAssemblyContract({ product: "hermes-agent", generatedAt: "2026-05-30T00:00:00.000Z" })
    const previewProvider = hermesProductShellWebDashboardNativeExactAtomID
    const broken: AssemblyContract = {
      ...contract,
      atoms: contract.atoms.map((atom) =>
        atom.id === previewProvider
          ? {
              ...atom,
              implementationKind: "preview",
              parityCoverage: "preview",
              nativeEvidenceRefs: [],
              fixtureIDs: ["hermes-product-shell:inspection-dashboard-preview"],
              knownLossiness: ["static-inspection-dashboard-preview"],
            }
          : atom,
      ),
      ports: contract.ports.map((port) =>
        port.id === "product.shell"
          ? { ...port, providerAtoms: [previewProvider], selectedProviderAtom: previewProvider }
          : port,
      ),
      bindings: contract.bindings.map((binding) =>
        binding.portID === "product.shell"
          ? { ...binding, providerAtomID: previewProvider, providerAtom: previewProvider }
          : binding,
      ),
    }
    const verification = verifyAssemblyContract(broken)

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("assembly.primary-product-shell-not-preview")
    expect(verification.issues.find((issue) => issue.id === "assembly.primary-product-shell-not-preview")?.refs).toEqual(
      expect.arrayContaining([`hermes-agent:product.shell:${previewProvider}`]),
    )
  })

  it("rejects native-like atoms that lose native evidence and fixtures", () => {
    const contract = buildAssemblyContract({
      product: "nanobot",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    const nativeLikeAtomID = "nanobot.runtime.acceptance-controller.native-like"
    const broken: AssemblyContract = {
      ...contract,
      atoms: contract.atoms.map((atom) =>
        atom.id === nativeLikeAtomID
          ? {
              ...atom,
              nativeEvidenceRefs: [],
              fixtureIDs: [],
              parityCoverage: "native-like",
              knownLossiness: ["descriptor-only-native-like"],
            }
          : atom,
      ),
    }
    const verification = verifyAssemblyContract(broken)

    expect(verifyAssemblyContract(contract).ok).toBe(true)
    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("assembly.native-like-evidence-linked")
    expect(verification.issues.find((issue) => issue.id === "assembly.native-like-evidence-linked")?.refs).toEqual(
      expect.arrayContaining(["nanobot:nanobot.runtime.acceptance-controller.native-like"]),
    )
  })

  it("rejects product native upgrades without complete proof or product-specific source modules", () => {
    const contract = buildAssemblyContract({ product: "opencode", generatedAt: "2026-05-30T00:00:00.000Z" })
    const promptAtom = contract.atoms.find((atom) => atom.id === "opencode.prompt.mode-builder")
    const turnAtom = contract.atoms.find((atom) => atom.id === "opencode.turn.context-builder")
    if (!promptAtom || !turnAtom) throw new Error("Missing OpenCode prompt or turn atom")

    const prooflessNativeAtom = {
      ...turnAtom,
      implementationKind: "factory",
      selectionReason: "native parity complete but still using partial product turn replay",
      nativeEvidenceRefs: [],
      fixtureIDs: [],
      parityCoverage: "native",
      knownLossiness: ["partial-product-turn-replay"],
      source: {
        packageDir: "packages/lego-agent-loop",
        packageName: "@helix/lego-agent-loop",
        exportPath: "./product-turn/opencode/context-builder",
        specifier: "@helix/lego-agent-loop/product-turn/opencode/context-builder",
      },
      sourcePackage: "@helix/lego-agent-loop",
      publicExport: "./product-turn/opencode/context-builder",
    } satisfies AssemblyContract["atoms"][number]
    const monolithNativeAtom = {
      ...promptAtom,
      implementationKind: "factory",
      selectionReason: "upstream native implementation with complete fixture coverage",
      nativeEvidenceRefs: ["upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"],
      fixtureIDs: ["opencode-prompt:system-output-ordering"],
      parityCoverage: "native",
      knownLossiness: [],
    } satisfies AssemblyContract["atoms"][number]
    const broken: AssemblyContract = {
      ...contract,
      atoms: contract.atoms.map((atom) => {
        if (atom.id === prooflessNativeAtom.id) return prooflessNativeAtom
        if (atom.id === monolithNativeAtom.id) return monolithNativeAtom
        return atom
      }),
    }
    const verification = verifyAssemblyContract(broken)

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toEqual(
      expect.arrayContaining(["assembly.product-native-upgrade-proof-linked"]),
    )
    expect(verification.issues.find((issue) => issue.id === "assembly.product-native-upgrade-proof-linked")?.refs).toEqual(
      expect.arrayContaining(["opencode:opencode.turn.context-builder"]),
    )
  })

  it("binds product prompt support ports to executable atoms instead of metadata aliases", () => {
    const products: AssemblyContractProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
    const commonExpectedBindings = {
      "resource.discovery": "resource.discovery.filesystem",
      "prompt.resource-loader": "prompt.resource-loader.text",
      "prompt.tool-renderer": "prompt.tool-renderer.common",
      "prompt.model-capability-adapter": "prompt.model-capability-adapter.common",
      "prompt.compaction-adapter": "prompt.compaction-adapter.common",
    }
    const productAliases = [
      "opencode.resource.discovery",
      "opencode.prompt.resource-loader",
      "opencode.prompt.tool-renderer",
      "opencode.prompt.model-adapter",
      "opencode.prompt.compaction-adapter",
      "pi.resource.discovery",
      "pi.prompt.resource-loader",
      "pi.prompt.tool-renderer",
      "pi.prompt.model-adapter",
      "pi.prompt.compaction-adapter",
      "nanobot.resource.discovery",
      "nanobot.prompt.resource-loader",
      "nanobot.prompt.tool-renderer",
      "nanobot.prompt.model-adapter",
      "nanobot.prompt.compaction-adapter",
      "hermes.resource.discovery",
      "hermes.prompt.resource-loader",
      "hermes.prompt.tool-renderer",
      "hermes.prompt.model-adapter",
      "hermes.prompt.compaction-adapter",
    ]

    for (const product of products) {
      const contract = buildAssemblyContract({ product, generatedAt: "2026-05-30T00:00:00.000Z" })
      const expectedBindings = product === "opencode"
        ? {
            ...commonExpectedBindings,
            "resource.discovery": openCodeResourceDiscoveryInstructionNativeAtomID,
            "prompt.resource-loader": openCodePromptResourceLoaderInstructionNativeAtomID,
            "prompt.tool-renderer": openCodePromptToolRendererNativeAtomID,
            "prompt.model-capability-adapter": openCodePromptModelCapabilityAdapterNativeAtomID,
            "prompt.compaction-adapter": openCodePromptCompactionAdapterNativeAtomID,
          }
        : product === "pi-mono"
          ? {
              ...commonExpectedBindings,
              "resource.discovery": piMonoResourceDiscoveryNativeAtomID,
              "prompt.resource-loader": piMonoPromptResourceLoaderNativeAtomID,
              "prompt.tool-renderer": piMonoPromptToolRendererNativeAtomID,
              "prompt.model-capability-adapter": piMonoPromptModelCapabilityAdapterNativeAtomID,
              "prompt.compaction-adapter": piMonoPromptCompactionAdapterNativeAtomID,
            }
          : commonExpectedBindings
      for (const [portID, providerAtomID] of Object.entries(expectedBindings)) {
        expect(contract.bindings).toEqual(expect.arrayContaining([expect.objectContaining({ portID, providerAtomID })]))
      }
      const atomIDs = contract.atoms.map((atom) => atom.id)
      for (const alias of productAliases) expect(atomIDs).not.toContain(alias)
      if (product === "opencode" || product === "pi-mono") {
        const nativePromptSupport = product === "opencode" ? [
          {
            atomID: openCodeResourceDiscoveryInstructionNativeAtomID,
            evidenceRefs: [openCodePromptInstructionNativeExactEvidenceRef, openCodePromptInstructionNativeExactReplayRef],
            fixtureID: openCodePromptInstructionNativeExactFixtureID,
          },
          {
            atomID: openCodePromptResourceLoaderInstructionNativeAtomID,
            evidenceRefs: [openCodePromptInstructionNativeExactEvidenceRef, openCodePromptInstructionNativeExactReplayRef],
            fixtureID: openCodePromptInstructionNativeExactFixtureID,
          },
          {
            atomID: openCodePromptToolRendererNativeAtomID,
            evidenceRefs: [openCodePromptProviderSupportNativeExactEvidenceRef, openCodePromptProviderSupportNativeExactReplayRef],
            fixtureID: openCodePromptProviderSupportNativeExactFixtureID,
          },
          {
            atomID: openCodePromptModelCapabilityAdapterNativeAtomID,
            evidenceRefs: [openCodePromptProviderSupportNativeExactEvidenceRef, openCodePromptProviderSupportNativeExactReplayRef],
            fixtureID: openCodePromptProviderSupportNativeExactFixtureID,
          },
          {
            atomID: openCodePromptCompactionAdapterNativeAtomID,
            evidenceRefs: [openCodePromptCompactionAdapterNativeExactEvidenceRef, openCodePromptCompactionAdapterNativeExactReplayRef],
            fixtureID: openCodePromptCompactionAdapterNativeExactFixtureID,
          },
        ] : [
          {
            atomID: piMonoResourceDiscoveryNativeAtomID,
            evidenceRefs: [piMonoPromptResourceSupportNativeExactEvidenceRef, piMonoPromptResourceSupportNativeExactReplayRef],
            fixtureID: piMonoPromptResourceSupportNativeExactFixtureID,
          },
          {
            atomID: piMonoPromptResourceLoaderNativeAtomID,
            evidenceRefs: [piMonoPromptResourceSupportNativeExactEvidenceRef, piMonoPromptResourceSupportNativeExactReplayRef],
            fixtureID: piMonoPromptResourceSupportNativeExactFixtureID,
          },
          {
            atomID: piMonoPromptToolRendererNativeAtomID,
            evidenceRefs: [piMonoPromptProviderSupportNativeExactEvidenceRef, piMonoPromptProviderSupportNativeExactReplayRef],
            fixtureID: piMonoPromptProviderSupportNativeExactFixtureID,
          },
          {
            atomID: piMonoPromptModelCapabilityAdapterNativeAtomID,
            evidenceRefs: [piMonoPromptProviderSupportNativeExactEvidenceRef, piMonoPromptProviderSupportNativeExactReplayRef],
            fixtureID: piMonoPromptProviderSupportNativeExactFixtureID,
          },
          {
            atomID: piMonoPromptCompactionAdapterNativeAtomID,
            evidenceRefs: [piMonoPromptCompactionAdapterNativeExactEvidenceRef, piMonoPromptCompactionAdapterNativeExactReplayRef],
            fixtureID: piMonoPromptCompactionAdapterNativeExactFixtureID,
          },
        ]
        for (const { atomID, evidenceRefs, fixtureID } of nativePromptSupport) {
          const atom = contract.atoms.find((candidate) => candidate.id === atomID)
          expect(atom).toMatchObject({
            implementationKind: "factory",
            parityCoverage: "native",
            knownLossiness: [],
          })
          expect(atom?.nativeEvidenceRefs).toEqual(expect.arrayContaining(evidenceRefs))
          expect(atom?.fixtureIDs).toEqual(expect.arrayContaining([fixtureID]))
        }
      }
      expect(verifyAssemblyContract(contract).ok).toBe(true)
    }
  })

  it("rejects product prompt support metadata aliases on executable prompt ports", () => {
    const products: Array<{ product: AssemblyContractProduct; prefix: string }> = [
      { product: "opencode", prefix: "opencode" },
      { product: "pi-mono", prefix: "pi" },
      { product: "nanobot", prefix: "nanobot" },
      { product: "hermes-agent", prefix: "hermes" },
    ]

    for (const { product, prefix } of products) {
      const contract = buildAssemblyContract({ product, generatedAt: "2026-05-30T00:00:00.000Z" })
      const aliasByPort: Record<string, string> = {
        "resource.discovery": `${prefix}.resource.discovery`,
        "prompt.resource-loader": `${prefix}.prompt.resource-loader`,
        "prompt.tool-renderer": `${prefix}.prompt.tool-renderer`,
        "prompt.model-capability-adapter": `${prefix}.prompt.model-adapter`,
        "prompt.compaction-adapter": `${prefix}.prompt.compaction-adapter`,
      }

      for (const [portID, aliasAtomID] of Object.entries(aliasByPort)) {
        const existingPort = contract.ports.find((port) => port.id === portID)
        const existingBinding = contract.bindings.find((binding) => binding.portID === portID)
        const executableAtomID = existingPort?.selectedProviderAtom ?? existingBinding?.providerAtomID
        const executableAtom = contract.atoms.find((atom) => atom.id === executableAtomID)
        if (!existingPort || !existingBinding || !executableAtom) throw new Error(`Missing prompt support binding for ${product}:${portID}`)

        const aliasAtom = {
          ...executableAtom,
          id: aliasAtomID,
          plane: executableAtom.plane,
          kind: executableAtom.kind,
          scope: "product",
          productScope: "product",
          personality: product,
          implementationKind: "metadata-only",
          selected: true,
          selectedBy: [product],
          selectionReason: "metadata-only product prompt support alias; executable binding uses the shared common prompt support atom",
          provides: [portID],
          nativeEvidenceRefs: [`metadata-overlay:${product}:${portID}`],
          fixtureIDs: [],
          parityCoverage: "metadata",
          knownLossiness: ["bom-or-overlay-only", "not-executable-provider"],
        } satisfies AssemblyContract["atoms"][number]
        const broken: AssemblyContract = {
          ...contract,
          atoms: [...contract.atoms.filter((atom) => atom.id !== aliasAtomID), aliasAtom],
          ports: contract.ports.map((port) =>
            port.id === portID
              ? {
                  ...port,
                  providerAtoms: [aliasAtomID],
                  selectedProviderAtom: aliasAtomID,
                  productProviderAtoms: [aliasAtomID],
                  candidateAtoms: Array.from(new Set([...port.candidateAtoms, aliasAtomID])).sort(),
                }
              : port,
          ),
          bindings: contract.bindings.map((binding) =>
            binding.portID === portID
              ? {
                  ...binding,
                  providerAtomID: aliasAtomID,
                  providerAtom: aliasAtomID,
                  candidates: Array.from(new Set([...binding.candidates, aliasAtomID])).sort(),
                }
              : binding,
          ),
        }
        const verification = verifyAssemblyContract(broken)

        expect(verification.ok, `${product}:${portID} -> ${aliasAtomID}`).toBe(false)
        expect(verification.issues.map((issue) => issue.id)).toContain("assembly.required-executable-no-placeholder")
        expect(verification.issues.find((issue) => issue.id === "assembly.required-executable-no-placeholder")?.refs).toEqual(
          expect.arrayContaining([`${product}:${portID}:${aliasAtomID}`]),
        )
      }
    }
  })

  it("rejects product-specific prompt support executable atoms without upstream fixtures", () => {
    const products: Array<{ product: AssemblyContractProduct; prefix: string }> = [
      { product: "opencode", prefix: "opencode" },
      { product: "pi-mono", prefix: "pi" },
      { product: "nanobot", prefix: "nanobot" },
      { product: "hermes-agent", prefix: "hermes" },
    ]

    for (const { product, prefix } of products) {
      const contract = buildAssemblyContract({ product, generatedAt: "2026-05-30T00:00:00.000Z" })
      const productAtomByPort: Record<string, string> = {
        "resource.discovery": `${prefix}.resource.discovery.native`,
        "prompt.resource-loader": `${prefix}.prompt.resource-loader.native`,
        "prompt.tool-renderer": `${prefix}.prompt.tool-renderer.native`,
        "prompt.model-capability-adapter": `${prefix}.prompt.model-adapter.native`,
        "prompt.compaction-adapter": `${prefix}.prompt.compaction-adapter.native`,
      }

      for (const [portID, productAtomID] of Object.entries(productAtomByPort)) {
        const existingPort = contract.ports.find((port) => port.id === portID)
        const existingBinding = contract.bindings.find((binding) => binding.portID === portID)
        const commonAtomID = existingPort?.selectedProviderAtom ?? existingBinding?.providerAtomID
        const commonAtom = contract.atoms.find((atom) => atom.id === commonAtomID)
        if (!existingPort || !existingBinding || !commonAtom) throw new Error(`Missing prompt support binding for ${product}:${portID}`)

        const productSupportAtom = {
          ...commonAtom,
          id: productAtomID,
          scope: "product",
          productScope: "product",
          personality: product,
          implementationKind: "factory",
          selected: true,
          selectedBy: [product],
          selectionReason: "product-specific prompt support common wrapper without upstream fixture",
          provides: [portID],
          nativeEvidenceRefs: [],
          fixtureIDs: [],
          parityCoverage: "native",
          knownLossiness: ["common-wrapper"],
        } satisfies AssemblyContract["atoms"][number]
        const broken: AssemblyContract = {
          ...contract,
          atoms: [...contract.atoms.filter((atom) => atom.id !== productAtomID), productSupportAtom],
          ports: contract.ports.map((port) =>
            port.id === portID
              ? {
                  ...port,
                  providerAtoms: [productAtomID],
                  selectedProviderAtom: productAtomID,
                  productProviderAtoms: [productAtomID],
                  candidateAtoms: Array.from(new Set([...port.candidateAtoms, productAtomID])).sort(),
                }
              : port,
          ),
          bindings: contract.bindings.map((binding) =>
            binding.portID === portID
              ? {
                  ...binding,
                  providerAtomID: productAtomID,
                  providerAtom: productAtomID,
                  candidates: Array.from(new Set([...binding.candidates, productAtomID])).sort(),
                }
              : binding,
          ),
        }
        const verification = verifyAssemblyContract(broken)

        expect(verification.ok, `${product}:${portID} -> ${productAtomID}`).toBe(false)
        expect(verification.issues.map((issue) => issue.id)).toContain("assembly.product-prompt-support-fixture-linked")
        expect(verification.issues.find((issue) => issue.id === "assembly.product-prompt-support-fixture-linked")?.refs).toEqual(
          expect.arrayContaining([`${product}:${portID}:${productAtomID}`]),
        )
      }
    }
  })

  it("keeps fingerprints stable across regenerated timestamps and detects semantic contract changes", () => {
    const first = buildAssemblyContract({ product: "opencode", generatedAt: "2026-05-30T00:00:00.000Z" })
    const second = buildAssemblyContract({ product: "opencode", generatedAt: "2026-05-30T01:00:00.000Z" })
    const changed: AssemblyContract = {
      ...first,
      atoms: first.atoms.filter((atom) => atom.id !== "opencode.session.store.sqlite-projection"),
    }

    expect(first.fingerprints.contract).toBe(second.fingerprints.contract)
    expect(verifyAssemblyContract(first).ok).toBe(true)
    expect(verifyAssemblyContract(changed).ok).toBe(false)
    expect(verifyAssemblyContract(changed).issues.map((issue) => issue.id)).toContain("assembly-contract.binding.providers-exist")
  })

  it("fails verification when required port provider evidence is removed", () => {
    const contract = buildAssemblyContract({ product: "pi-mono" })
    const broken: AssemblyContract = {
      ...contract,
      ports: contract.ports.map((port) => (port.id === "session.store" ? { ...port, providerAtoms: [], candidateAtoms: [] } : port)),
    }
    const verification = verifyAssemblyContract(broken)

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("assembly-contract.port.providers")
  })

  it("rejects multiple selected bundles in the same replace-policy exclusive family", () => {
    const opencode = buildAssemblyContract({ product: "opencode" })
    const nanobot = buildAssemblyContract({ product: "nanobot" })
    const nanobotTurnLoop = nanobot.bundles.find((bundle) => bundle.id === "bundle.nanobot.turn-loop")
    if (!nanobotTurnLoop) throw new Error("nanobot turn-loop bundle fixture missing")
    const broken: AssemblyContract = {
      ...opencode,
      bundles: [...opencode.bundles, nanobotTurnLoop],
    }
    const verification = verifyAssemblyContract(broken)

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("assembly-contract.exclusive-bundle-family-single-active")
    expect(verification.issues.find((issue) => issue.id === "assembly-contract.exclusive-bundle-family-single-active")?.refs).toEqual(
      expect.arrayContaining(["bundle.opencode.turn-loop", "bundle.nanobot.turn-loop"]),
    )
  })

  it("links task parity and native fixture artifacts when they are provided", () => {
    const parityPath = resolve(process.cwd(), "docs/reports/task-parity-livecodebench-cadence.json")
    const fixturePath = resolve(process.cwd(), "docs/reports/task-parity-livecodebench-native-cadence-fixtures.json")
    if (!existsSync(parityPath) || !existsSync(fixturePath)) return

    const taskParityArtifact = JSON.parse(readFileSync(parityPath, "utf8")) as ProductTaskParityArtifact
    const nativeCadenceFixtures = JSON.parse(readFileSync(fixturePath, "utf8")) as ProductTaskNativeCadenceFixtureSet
    const contract = buildAssemblyContract({
      product: "opencode",
      taskParityArtifact,
      nativeCadenceFixtures,
      includeTaskParity: true,
      includeNativeFixtures: true,
    })
    const verification = verifyAssemblyContract({
      contract,
      requireTaskParity: true,
      requireNativeFixtures: true,
    })

    expect(verification.ok).toBe(true)
    expect(contract.taskParity.status).toBe("linked")
    expect(contract.taskParity.artifact?.summaryFingerprint).toMatch(/^[a-f0-9]{16}$/)
    expect(contract.nativeFixtures.status).toBe("linked")
    expect(contract.nativeFixtures.fixtureAtoms).toEqual(expect.arrayContaining(["opencode.turn.cadence-emitter"]))
  })

  it("links verified external tool evidence refs without accepting raw trace paths", () => {
    const externalEvidence: AssemblyContractExternalToolEvidenceRef = {
      kind: "externalTool",
      toolID: "claude-tap",
      toolVersion: "0.1.114",
      product: "pi-mono",
      taskID: "read-only-answer",
      captureMode: "real-capture",
      artifactPath: "docs/reports/external-tools/claude-tap/pi-read-only/native-capture.json",
      generatedAt: "2026-06-14T00:00:00.000Z",
      sourceArtifact: {
        format: "jsonl",
        hash: "sha256:trace",
        bytes: 713,
      },
      lossiness: {
        observability: "external-proxy-capture",
        rawPrompt: "fingerprint-only",
        rawProviderPayload: "shape-summary-only",
        rawToolPayload: "fingerprint-only",
        nativeInternals: "unobservable",
      },
      redactionPolicy: {
        version: 1,
        containsRawPrompt: false,
      },
      verification: {
        ok: true,
        issueIDs: [],
      },
      manifest: {
        hash: "sha256:manifest",
        sourceArtifactHashMatched: true,
      },
      fingerprint: "sha256:external",
    }
    const contract = buildAssemblyContract({
      product: "pi-mono",
      externalToolEvidence: [externalEvidence],
      includeExternalToolEvidence: true,
    })

    expect(contract.externalToolEvidence.status).toBe("linked")
    expect(contract.externalToolEvidence.refs[0]).toMatchObject({ kind: "externalTool", toolID: "claude-tap", product: "pi-mono" })
    expect(verifyAssemblyContract({ contract, requireExternalToolEvidence: true }).ok).toBe(true)

    const rawPathContract: AssemblyContract = {
      ...contract,
      externalToolEvidence: {
        ...contract.externalToolEvidence,
        refs: [{ ...contract.externalToolEvidence.refs[0]!, artifactPath: ".helix/external-tools/runs/pi-read-only/raw/trace.jsonl" }],
      },
    }
    const rawPathVerification = verifyAssemblyContract({ contract: rawPathContract, requireExternalToolEvidence: true })
    expect(rawPathVerification.ok).toBe(false)
    expect(rawPathVerification.issues.map((issue) => issue.id)).toContain("assembly-contract.external-tool-evidence.no-raw-paths")

    const mismatchContract: AssemblyContract = {
      ...contract,
      externalToolEvidence: {
        ...contract.externalToolEvidence,
        refs: [{ ...contract.externalToolEvidence.refs[0]!, manifest: { hash: "sha256:manifest", sourceArtifactHashMatched: false } }],
      },
    }
    const mismatchVerification = verifyAssemblyContract({ contract: mismatchContract, requireExternalToolEvidence: true })
    expect(mismatchVerification.ok).toBe(false)
    expect(mismatchVerification.issues.map((issue) => issue.id)).toContain("assembly-contract.external-tool-evidence.manifest-hash")
  })

  it("round-trips contract artifacts through the public writer and reader", () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-assembly-contract-"))
    try {
      const path = join(dir, "assembly-contract-opencode.json")
      const contract = buildAssemblyContract({ product: "opencode" })
      writeAssemblyContract(path, contract)
      const roundTripped = readAssemblyContract(path)

      expect(roundTripped.fingerprints).toEqual(contract.fingerprints)
      expect(verifyAssemblyContract(roundTripped).ok).toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
