import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { runCli } from "@helix/cli"
import {
  buildTodo27NativeRewriteInventory,
  verifyTodo27NativeRewriteInventory,
  writeTodo27NativeRewriteInventoryReports,
  type Todo27NativeRewriteInventory,
} from "@helix/recipes"
import {
  openCodeEventNativeExactEvidenceRef,
  openCodeEventNativeExactFixtureID,
  openCodeEventNativeExactReplayRef,
} from "@helix/adapters-opencode/product-schema/events"
import {
  openCodeSessionNativeExactEvidenceRef,
  openCodeSessionNativeExactFixtureID,
  openCodeSessionNativeExactReplayRef,
} from "@helix/adapters-opencode/product-schema/session"
import {
  openCodeRuntimeAcceptanceNativeExactEvidenceRef,
  openCodeRuntimeAcceptanceNativeExactFixtureID,
  openCodeRuntimeAcceptanceNativeExactReplayRef,
} from "@helix/lego-runtime/product-schema/opencode"
import {
  openCodeUINativeExactEvidenceRef,
  openCodeUINativeExactFixtureID,
  openCodeUINativeExactReplayRef,
} from "@helix/lego-ui/product-schema/opencode"
import {
  nanobotTurnNativeExactEvidenceRef,
  nanobotTurnNativeExactFixtureID,
  nanobotTurnNativeExactFixtureIDForKey,
  nanobotTurnNativeExactReplayRef,
  nanobotTurnNativeExactReplayRefForKey,
} from "@helix/lego-agent-loop/product-schema/nanobot"
import {
  hermesSessionNativeExactEvidenceRef,
  hermesSessionNativeExactFixtureID,
  hermesSessionNativeExactReplayRef,
} from "@helix/adapters-hermes/product-schema/session"
import {
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
  hermesProductShellNativeExactAtomIDs,
  hermesProductShellNativeExactEvidenceRef,
  hermesProductShellNativeExactFixtureID,
  hermesProductShellNativeExactReplayRef,
} from "@helix/adapters-hermes/product-schema/product-shell"

describe("TODO-027 native rewrite inventory conformance", () => {
  it("classifies every product-scoped transition atom with an owner, blocker, and fixture target", () => {
    const inventory = buildTodo27NativeRewriteInventory({
      generatedAt: "2026-06-10T00:00:00.000Z",
    })
    const verification = verifyTodo27NativeRewriteInventory(inventory)
    const opencodePrompt = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.prompt.mode-builder")
    const piPrompt = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.prompt.coding-agent-builder")
    const opencodeIdentity = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.identity.id-generator")
    const piIdentity = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.identity.id-generator")
    const piWorkspaceResolver = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.identity.workspace-resolver")
    const nanobotIdentity = inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.identity.workspace-resolver")
    const hermesIdentity = inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.identity.clock-format")
    const opencodeConfigSource = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.config.source")
    const opencodeProviderStreamingDelta = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.provider.streaming-delta-recorder.native-like")
    const opencodeProviderProjector = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.provider.stream-projector.native-like")
    const nanobotProviderStreamNativeItems = [
      inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.provider.streaming-delta-recorder.native-like"),
      inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.provider.stream-projector.native-like"),
    ]
    const hermesProviderStreamNativeItems = [
      inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.provider.streaming-delta-recorder.native-like"),
      inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.provider.stream-projector.native-like"),
    ]
    const opencodeProviderRequestOptions = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.provider.request-options")
    const opencodeProviderTransportInstrumentation = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.provider.transport-instrumentation")
    const opencodeSessionStore = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.session.store.sqlite-projection")
    const opencodeSessionMessagePart = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.session.message-part-projector.native-like")
    const opencodeRuntimeAcceptanceNativeItems = [
      inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.runtime.acceptance-controller.native-like"),
      inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.runtime.acceptance-evidence.native-like"),
    ]
    const opencodeEventEnvelope = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.event.envelope-bridge")
    const piEventEnvelope = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.event.envelope-bridge")
    const piRuntimeEvent = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.event.runtime-bridge")
    const piExtensionRuntimeEvent = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.extension.runtime-event-bridge")
    const piProviderNativeDescriptorItems = [
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.provider.auth-descriptor"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.provider.event-observer"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.provider.extension-descriptor"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.provider.model-extension"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.provider.parser-observer"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.provider.request-options"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.provider.transport-instrumentation"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.provider.usage-renderer"),
    ]
    const piConfigNativeItems = [
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.config.precedence"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.config.source"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.config.validator"),
    ]
    const hermesConfigNativeItems = [
      inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.config.precedence"),
      inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.config.source"),
      inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.config.validator"),
    ]
    const nanobotConfigNativeItems = [
      inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.config.precedence"),
      inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.config.source"),
      inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.config.validator"),
    ]
    const nanobotToolNativeItems = [
      inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.permission.policy-bridge"),
      inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.process-runner-bridge"),
      inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.tool.definition-plugin-bridge"),
      inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.tool.event-render-bridge"),
      inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.tool.progress-event-bridge"),
      inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.tool.registry-bridge"),
      inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.tool.result-event-bridge"),
      inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.tool.schema-bridge"),
      inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.workspace-filesystem-bridge"),
    ]
    const nanobotEventEnvelope = inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.event.envelope-bridge")
    const nanobotEventBus = inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.event.bus-bridge")
    const hermesEventEnvelope = inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.event.envelope-bridge")
    const hermesRuntimeEvent = inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.event.runtime-bridge")
    const hermesProviderNativeItems = [
      inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.provider.auth-descriptor"),
      inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.provider.event-observer"),
      inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.provider.model-registry"),
      inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.provider.parser-observer"),
      inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.provider.plugin-descriptor"),
      inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.provider.request-options"),
      inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.provider.transport-instrumentation"),
      inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.provider.usage-renderer"),
    ]
    const nanobotSessionMessagePartProjector = inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.session.message-part-projector.native-like")
    const hermesSessionMessagePartProjector = inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.session.message-part-projector.native-like")
    const opencodeToolSchema = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.tool.schema-bridge")
    const opencodeHookPlugin = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.hook.plugin-bridge")
    const opencodeProductShellHarness = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.product-shell.harness")
    const opencodeProductShellSdk = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.product-shell.sdk")
    const opencodeProductShellControlPlane = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.product-shell.control-plane")
    const opencodeProductShellDesktop = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.product-shell.desktop")
    const opencodeProductShellWeb = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.product-shell.web")
    const opencodeProductShellSlack = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.product-shell.slack")
    const opencodeProductShellWorkspace = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.product-shell.workspace")
    const opencodeShellEnv = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.shell.env-bridge")
    const piProductShellNativeItems = [
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.product-shell.cli"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.product-shell.sdk"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.product-shell.rpc"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.product-shell.harness"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.product-shell.server"),
    ]
    const nanobotProductShellNativeItems = nanobotProductShellNativeExactAtomIDs.map((atomID) =>
      inventory.items.find((item) => item.product === "nanobot" && item.atomID === atomID),
    )
    const hermesProductShellNativeItems = hermesProductShellNativeExactAtomIDs.map((atomID) =>
      inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === atomID),
    )
    const opencodeUIRenderer = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.ui.renderer")
    const opencodeUIEventLoop = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.ui.event-loop")
    const opencodeUICommandRouter = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.ui.command-router")
    const opencodeUIThemeRegistry = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.ui.theme-registry")
    const opencodeToolPackCompatibility = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.tool-pack.compatibility")
    const opencodeNativeToolPack = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.tool-pack.native")
    const piToolPackCompatibility = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.tool-pack.compatibility")
    const opencodeTraceDebugSurface = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.trace.debug-surface")
    const piTraceDebugSurface = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.trace.debug-surface")
    const nanobotTraceDebugSurface = inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.trace.debug-surface")
    const hermesTraceDebugSurface = inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.trace.debug-surface")
    const opencodeTui = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.product-shell.tui")
    const opencodeUISnapshot = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.ui.snapshot")
    const opencodeMetadata = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.runtime.capability-aliases")
    const opencodeNativeCliTaskRunner = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.task.runner.native-cli")
    const opencodeNativeToolBatchScheduler = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.tools.batch-scheduler.native-like")
    const opencodeNativeToolResultProjector = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.tools.result-projector.native-like")
    const opencodeNativeToolSchema = inventory.items.find((item) => item.product === "opencode" && item.atomID === "opencode.tools.schema.native-like")
    const piNativeIdentityClock = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.identity.clock-format")
    const piNativeFinalSummary = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.agent-loop.final-summary.native-like")
    const piNativeRequestBoundary = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.agent-loop.request-boundary.native-like")
    const piNativeTurnContextBuilder = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.turn.context-builder")
    const nanobotNativeTurnContextBuilder = inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.turn.context-builder")
    const piNativeToolBatchScheduler = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.tools.batch-scheduler.native-like")
    const piNativeToolSchema = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.tools.schema.native-like")
    const piNativeToolResultProjector = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.tools.result-projector.native-like")
    const hermesNanobotNativeCadenceItems = [
      inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.agent-loop.request-boundary.native-like"),
      inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.agent-loop.final-summary.native-like"),
      inventory.items.find((item) => item.product === "hermes-agent" && item.atomID === "hermes.tools.batch-scheduler.native-like"),
      inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.agent-loop.request-boundary.native-like"),
      inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.agent-loop.final-summary.native-like"),
      inventory.items.find((item) => item.product === "nanobot" && item.atomID === "nanobot.tools.batch-scheduler.native-like"),
    ]
    const piSessionBranchGraphNativeItems = [
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.session.branch-graph.leaf-tree"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.session.branch-graph.active-leaf"),
    ]
    const piSessionContextSelectorNativeItems = [
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.session.pagination.active-path"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.session.context-selector.active-leaf"),
    ]
    const piSessionStoreNativeItem = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.session.store.jsonl-v3")
    const piSessionStoreMigratorNativeItem = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.session.store.jsonl-v3-migrator")
    const piSessionProjectorLegacyNativeItem = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.session.projector.jsonl")
    const piSessionProjectorNativeItem = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.session.projector.jsonl-v3")
    const piSessionBranchSummaryNativeItem = inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.session.branch-summary")
    const piRuntimeAcceptanceNativeItems = [
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.runtime.acceptance-controller.native-like"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.runtime.acceptance-evidence.native-like"),
    ]
    const piUINativeItems = [
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.ui.command-router"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.ui.event-loop"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.ui.input-normalizer"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.ui.renderer"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.ui.snapshot"),
      inventory.items.find((item) => item.product === "pi-mono" && item.atomID === "pi.ui.theme-registry"),
    ]

    expect(verification.ok).toBe(true)
    expect(inventory.schemaVersion).toBe(1)
    expect(inventory.artifactKind).toBe("todo27-native-rewrite-inventory")
    expect(inventory.products).toEqual(["hermes-agent", "nanobot", "opencode", "pi-mono"])
    expect(inventory.summary).toMatchObject({
      total: 445,
      selected: 433,
      productNativeComplete: 389,
      uncategorized: 0,
      previewRetained: 0,
      metadataRetained: 56,
      byImplementationLevel: expect.objectContaining({
        "common-shared": 0,
        "compatible-bridge": 0,
        "metadata-only": 56,
        native: 389,
        "native-like": 0,
        "preview-shell": 0,
        "profile-compatible": 0,
      }),
    })
    expect(inventory.summary.fingerprint).toMatch(/^[a-f0-9]{16}$/)
    expect(opencodePrompt).toMatchObject({
      ownerSection: "P0-01 Prompt Family Native Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: "opencode-prompt:llm-request-system-exact-fixture",
      implementationLevel: "native",
      fixtureIDs: expect.arrayContaining(["opencode-prompt:system-prompt-core-exact-fixture", "opencode-prompt:llm-request-system-exact-fixture"]),
      knownLossiness: [],
    })
    expect(piPrompt).toMatchObject({
      ownerSection: "P0-01 Prompt Family Native Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: "pi-prompt:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["pi-prompt:family-matrix", "pi-prompt:native-exact-fixture", "pi-prompt:upstream-source-matrix"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-prompt-native-exact-fixture", "prompt-native-exact:pi-mono"]),
      knownLossiness: [],
    })
    expect(piNativeTurnContextBuilder).toMatchObject({
      ownerSection: "P0-02 Product Turn Atoms Native Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: "pi-turn:context-builder:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: expect.arrayContaining(["pi-turn:native-exact-fixture", "pi-turn:context-builder:native-exact-fixture"]),
      nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-turn-native-exact-fixture", "turn-native-exact:pi-mono", "turn-native-exact:pi-mono:context-builder"]),
      knownLossiness: [],
      blocker: "Native proof complete for this atom; no open module blocker remains.",
    })
    expect(nanobotNativeTurnContextBuilder).toMatchObject({
      ownerSection: "P0-02 Product Turn Atoms Native Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: expect.stringContaining("native-exact-fixture"),
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: expect.arrayContaining([nanobotTurnNativeExactFixtureID, nanobotTurnNativeExactFixtureIDForKey("context-builder")]),
      nativeEvidenceRefs: expect.arrayContaining([
        nanobotTurnNativeExactEvidenceRef,
        nanobotTurnNativeExactReplayRef,
        nanobotTurnNativeExactReplayRefForKey("context-builder"),
      ]),
      knownLossiness: [],
      blocker: "Native proof complete for this atom; no open module blocker remains.",
    })
    expect(opencodeIdentity).toMatchObject({
      ownerSection: "TODO-027 Product Bridge Inventory",
      disposition: "product-native-complete",
      fixtureTarget: "opencode-identity:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["opencode-identity:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-identity-native-exact-fixture", "identity-native-exact:opencode"]),
      knownLossiness: [],
    })
    expect(piIdentity).toMatchObject({
      ownerSection: "TODO-027 Product Bridge Inventory",
      disposition: "product-native-complete",
      fixtureTarget: "pi-identity-id-generator:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["pi-identity-id-generator:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-identity-id-generator-native-exact-fixture", "identity-id-generator-native-exact:pi-mono"]),
      knownLossiness: [],
    })
    expect(piWorkspaceResolver).toMatchObject({
      ownerSection: "TODO-027 Product Bridge Inventory",
      disposition: "product-native-complete",
      fixtureTarget: "pi-identity-workspace-resolver:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["pi-identity-workspace-resolver:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-identity-workspace-resolver-native-exact-fixture", "identity-workspace-resolver-native-exact:pi-mono"]),
      knownLossiness: [],
    })
    expect(nanobotIdentity).toMatchObject({
      ownerSection: "TODO-027 Product Bridge Inventory",
      disposition: "product-native-complete",
      fixtureTarget: "nanobot-identity:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["nanobot-identity:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:nanobot-identity-native-exact-fixture", "identity-native-exact:nanobot"]),
      knownLossiness: [],
    })
    expect(hermesIdentity).toMatchObject({
      ownerSection: "TODO-027 Product Bridge Inventory",
      disposition: "product-native-complete",
      fixtureTarget: "hermes-identity:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["hermes-identity:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:hermes-identity-native-exact-fixture", "identity-native-exact:hermes-agent"]),
      knownLossiness: [],
    })
    expect(opencodeConfigSource).toMatchObject({
      ownerSection: "TODO-027 Product Bridge Inventory",
      disposition: "product-native-complete",
      fixtureTarget: "opencode-config:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["opencode-config:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-config-native-exact-fixture", "config-native-exact:opencode"]),
      knownLossiness: [],
    })
    for (const item of [opencodeProviderStreamingDelta, opencodeProviderProjector]) {
      expect(item).toMatchObject({
        ownerSection: "P1-06 Provider Stream Projector Rewrite",
        disposition: "product-native-complete",
        fixtureTarget: "opencode-provider-stream-projector:native-exact-fixture",
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: ["opencode-provider-stream-projector:native-exact-fixture"],
        nativeEvidenceRefs: expect.arrayContaining([
          "conformance:opencode-provider-stream-projector-native-exact-fixture",
          "provider-stream-projector-native-exact:opencode",
        ]),
        knownLossiness: [],
      })
    }
    for (const item of nanobotProviderStreamNativeItems) {
      expect(item).toMatchObject({
        ownerSection: "P1-06 Provider Stream Projector Rewrite",
        disposition: "product-native-complete",
        fixtureTarget: "nanobot-provider:native-exact-fixture",
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: ["nanobot-provider:native-exact-fixture"],
        nativeEvidenceRefs: expect.arrayContaining([
          "conformance:nanobot-provider-native-exact-fixture",
          "provider-native-exact:nanobot",
        ]),
        knownLossiness: [],
      })
    }
    for (const item of hermesProviderStreamNativeItems) {
      expect(item).toMatchObject({
        ownerSection: "P1-06 Provider Stream Projector Rewrite",
        disposition: "product-native-complete",
        fixtureTarget: "hermes-provider:native-exact-fixture",
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: ["hermes-provider:native-exact-fixture"],
        nativeEvidenceRefs: expect.arrayContaining([
          "conformance:hermes-provider-native-exact-fixture",
          "provider-native-exact:hermes-agent",
        ]),
        knownLossiness: [],
      })
    }
    expect(opencodeProviderRequestOptions).toMatchObject({
      ownerSection: "P1-06 Provider Stream Projector Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: "opencode-provider-request-options:native-exact-fixture",
      implementationLevel: "native",
      fixtureIDs: ["opencode-provider-request-options:native-exact-fixture"],
      knownLossiness: [],
    })
    expect(opencodeProviderTransportInstrumentation).toMatchObject({
      ownerSection: "P1-06 Provider Stream Projector Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: "opencode-provider-transport-instrumentation:native-exact-fixture",
      implementationLevel: "native",
      fixtureIDs: expect.arrayContaining([
        "opencode-provider-transport-instrumentation:native-exact-fixture",
        "opencode-provider:retry-cancel-native-exact-diff-fixture",
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-provider-transport-instrumentation-native-exact-fixture",
        "conformance:opencode-provider-retry-cancel-native-exact-diff-fixture",
        "provider-transport-instrumentation-native-exact:opencode",
        "provider-retry-cancel-native-exact-diff:opencode",
      ]),
      knownLossiness: [],
    })
    for (const item of [opencodeSessionStore, opencodeSessionMessagePart]) {
      expect(item).toMatchObject({
        ownerSection: "P1-07 Session Message-part Projector Rewrite",
        disposition: "product-native-complete",
        fixtureTarget: openCodeSessionNativeExactFixtureID,
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: [openCodeSessionNativeExactFixtureID],
        nativeEvidenceRefs: expect.arrayContaining([openCodeSessionNativeExactEvidenceRef, openCodeSessionNativeExactReplayRef]),
        knownLossiness: [],
      })
    }
    expect(nanobotSessionMessagePartProjector).toMatchObject({
      ownerSection: "P1-07 Session Message-part Projector Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: nanobotSessionNativeExactFixtureID,
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: [nanobotSessionNativeExactFixtureID],
      nativeEvidenceRefs: expect.arrayContaining([nanobotSessionNativeExactEvidenceRef, nanobotSessionNativeExactReplayRef]),
      knownLossiness: [],
    })
    expect(hermesSessionMessagePartProjector).toMatchObject({
      ownerSection: "P1-07 Session Message-part Projector Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: hermesSessionNativeExactFixtureID,
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: [hermesSessionNativeExactFixtureID],
      nativeEvidenceRefs: expect.arrayContaining([hermesSessionNativeExactEvidenceRef, hermesSessionNativeExactReplayRef]),
      knownLossiness: [],
    })
    for (const item of opencodeRuntimeAcceptanceNativeItems) {
      expect(item).toMatchObject({
        ownerSection: "P1-08 Runtime Acceptance Rewrite",
        disposition: "product-native-complete",
        fixtureTarget: openCodeRuntimeAcceptanceNativeExactFixtureID,
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: [openCodeRuntimeAcceptanceNativeExactFixtureID],
        nativeEvidenceRefs: expect.arrayContaining([
          openCodeRuntimeAcceptanceNativeExactEvidenceRef,
          openCodeRuntimeAcceptanceNativeExactReplayRef,
        ]),
        knownLossiness: [],
      })
    }
    expect(opencodeEventEnvelope).toMatchObject({
      ownerSection: "TODO-027 Product Bridge Inventory",
      disposition: "product-native-complete",
      fixtureTarget: openCodeEventNativeExactFixtureID,
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: [openCodeEventNativeExactFixtureID],
      nativeEvidenceRefs: expect.arrayContaining([openCodeEventNativeExactEvidenceRef, openCodeEventNativeExactReplayRef]),
      knownLossiness: [],
    })
    for (const item of [piEventEnvelope, piRuntimeEvent, piExtensionRuntimeEvent]) {
      expect(item).toMatchObject({
        ownerSection: "TODO-027 Product Bridge Inventory",
        disposition: "product-native-complete",
        fixtureTarget: "pi-event:native-exact-fixture",
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: ["pi-event:native-exact-fixture"],
        nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-event-native-exact-fixture", "event-native-exact:pi-mono"]),
        knownLossiness: [],
      })
    }
    for (const item of piProviderNativeDescriptorItems) {
      expect(item).toMatchObject({
        ownerSection: "P1-06 Provider Stream Projector Rewrite",
        disposition: "product-native-complete",
        fixtureTarget: "pi-provider-descriptor:native-exact-fixture",
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: ["pi-provider-descriptor:native-exact-fixture"],
        nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-provider-descriptor-native-exact-fixture", "provider-descriptor-native-exact:pi-mono"]),
        knownLossiness: [],
      })
    }
    for (const item of piConfigNativeItems) {
      expect(item).toMatchObject({
        ownerSection: "TODO-027 Product Bridge Inventory",
        disposition: "product-native-complete",
        fixtureTarget: "pi-config:native-exact-fixture",
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: ["pi-config:native-exact-fixture"],
        nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-config-native-exact-fixture", "config-native-exact:pi-mono"]),
        knownLossiness: [],
      })
    }
    for (const item of hermesConfigNativeItems) {
      expect(item).toMatchObject({
        ownerSection: "TODO-027 Product Bridge Inventory",
        disposition: "product-native-complete",
        fixtureTarget: "hermes-config:native-exact-fixture",
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: ["hermes-config:native-exact-fixture"],
        nativeEvidenceRefs: expect.arrayContaining(["conformance:hermes-config-native-exact-fixture", "config-native-exact:hermes-agent"]),
        knownLossiness: [],
      })
    }
    for (const item of nanobotConfigNativeItems) {
      expect(item).toMatchObject({
        ownerSection: "TODO-027 Product Bridge Inventory",
        disposition: "product-native-complete",
        fixtureTarget: "nanobot-config:native-exact-fixture",
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: ["nanobot-config:native-exact-fixture"],
        nativeEvidenceRefs: expect.arrayContaining(["conformance:nanobot-config-native-exact-fixture", "config-native-exact:nanobot"]),
        knownLossiness: [],
      })
    }
    for (const item of nanobotToolNativeItems) {
      expect(["P1-05 Tool Schema / Result Projector Rewrite", "TODO-027 Product Bridge Inventory"]).toContain(item?.ownerSection)
      expect(item).toMatchObject({
        disposition: "product-native-complete",
        fixtureTarget: "nanobot-tool:native-exact-fixture",
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: ["nanobot-tool:native-exact-fixture"],
        nativeEvidenceRefs: expect.arrayContaining(["conformance:nanobot-tool-native-exact-fixture", "tool-native-exact:nanobot"]),
        knownLossiness: [],
      })
    }
    for (const item of piRuntimeAcceptanceNativeItems) {
      expect(item).toMatchObject({
        ownerSection: "P1-08 Runtime Acceptance Rewrite",
        disposition: "product-native-complete",
        fixtureTarget: "pi-runtime-acceptance:native-exact-fixture",
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: ["pi-runtime-acceptance:native-exact-fixture"],
        nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-runtime-acceptance-native-exact-fixture", "runtime-acceptance-native-exact:pi-mono"]),
        knownLossiness: [],
      })
    }
    for (const item of piUINativeItems) {
      expect(item).toMatchObject({
        ownerSection: "TODO-027 Product Bridge Inventory",
        disposition: "product-native-complete",
        fixtureTarget: "pi-ui:native-exact-fixture",
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: ["pi-ui:native-exact-fixture"],
        nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-ui-native-exact-fixture", "ui-native-exact:pi-mono"]),
        knownLossiness: [],
      })
    }
    for (const item of piProductShellNativeItems) {
      expect(item).toMatchObject({
        ownerSection: "P2 Product Shell Surface Bridge",
        disposition: "product-native-complete",
        fixtureTarget: "pi-product-shell:native-exact-fixture",
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: ["pi-product-shell:native-exact-fixture"],
        nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-product-shell-native-exact-fixture", "product-shell-native-exact:pi-mono"]),
        knownLossiness: [],
      })
    }
    for (const item of nanobotProductShellNativeItems) {
      expect(item).toMatchObject({
        disposition: "product-native-complete",
        fixtureTarget: nanobotProductShellNativeExactFixtureID,
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: expect.arrayContaining([nanobotProductShellNativeExactFixtureID]),
        nativeEvidenceRefs: expect.arrayContaining([
          nanobotProductShellNativeExactEvidenceRef,
          nanobotProductShellNativeExactReplayRef,
        ]),
        knownLossiness: [],
      })
      expect(item?.ownerSection).toMatch(/^P2/)
    }
    for (const item of piSessionBranchGraphNativeItems) {
      expect(item).toMatchObject({
        ownerSection: "P1-07 Session Message-part Projector Rewrite",
        disposition: "product-native-complete",
        fixtureTarget: "pi-session-branch-graph:native-exact-fixture",
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: ["pi-session-branch-graph:native-exact-fixture"],
        nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-session-branch-graph-native-exact-fixture", "session-branch-graph-native-exact:pi-mono"]),
        knownLossiness: [],
      })
    }
    for (const item of piSessionContextSelectorNativeItems) {
      expect(item).toMatchObject({
        ownerSection: "P1-07 Session Message-part Projector Rewrite",
        disposition: "product-native-complete",
        fixtureTarget: "pi-session-context-selector:native-exact-fixture",
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: ["pi-session-context-selector:native-exact-fixture"],
        nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-session-context-selector-native-exact-fixture", "session-context-selector-native-exact:pi-mono"]),
        knownLossiness: [],
      })
    }
    expect(piSessionStoreNativeItem).toMatchObject({
      ownerSection: "P1-07 Session Message-part Projector Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: "pi-session-store-jsonl-v3:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["pi-session-store-jsonl-v3:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-session-store-jsonl-v3-native-exact-fixture", "session-store-jsonl-v3-native-exact:pi-mono"]),
      knownLossiness: [],
    })
    expect(piSessionStoreMigratorNativeItem).toMatchObject({
      ownerSection: "P1-07 Session Message-part Projector Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: "pi-session-store-jsonl-v3-migrator:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["pi-session-store-jsonl-v3-migrator:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-session-store-jsonl-v3-migrator-native-exact-fixture", "session-store-jsonl-v3-migrator-native-exact:pi-mono"]),
      knownLossiness: [],
    })
    expect(piSessionProjectorLegacyNativeItem).toMatchObject({
      ownerSection: "P1-07 Session Message-part Projector Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: "pi-session-projector-jsonl-v3:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["pi-session-projector-jsonl-v3:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-session-projector-jsonl-v3-native-exact-fixture", "session-projector-jsonl-v3-native-exact:pi-mono"]),
      knownLossiness: [],
    })
    expect(piSessionProjectorNativeItem).toMatchObject({
      ownerSection: "P1-07 Session Message-part Projector Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: "pi-session-projector-jsonl-v3:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["pi-session-projector-jsonl-v3:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-session-projector-jsonl-v3-native-exact-fixture", "session-projector-jsonl-v3-native-exact:pi-mono"]),
      knownLossiness: [],
    })
    expect(piSessionBranchSummaryNativeItem).toMatchObject({
      ownerSection: "P1-07 Session Message-part Projector Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: "pi-session-branch-summary:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["pi-session-branch-summary:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-session-branch-summary-native-exact-fixture", "session-branch-summary-native-exact:pi-mono"]),
      knownLossiness: [],
    })
    for (const item of [nanobotEventEnvelope, nanobotEventBus]) {
      expect(item).toMatchObject({
        ownerSection: "TODO-027 Product Bridge Inventory",
        disposition: "product-native-complete",
        fixtureTarget: "nanobot-event:native-exact-fixture",
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: ["nanobot-event:native-exact-fixture"],
        nativeEvidenceRefs: expect.arrayContaining(["conformance:nanobot-event-native-exact-fixture", "event-native-exact:nanobot"]),
        knownLossiness: [],
      })
    }
    for (const item of [hermesEventEnvelope, hermesRuntimeEvent]) {
      expect(item).toMatchObject({
        ownerSection: "TODO-027 Product Bridge Inventory",
        disposition: "product-native-complete",
        fixtureTarget: "hermes-event:native-exact-fixture",
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: ["hermes-event:native-exact-fixture"],
        nativeEvidenceRefs: expect.arrayContaining(["conformance:hermes-event-native-exact-fixture", "event-native-exact:hermes-agent"]),
        knownLossiness: [],
      })
    }
    for (const item of hermesProviderNativeItems) {
      expect(item).toMatchObject({
        ownerSection: "P1-06 Provider Stream Projector Rewrite",
        disposition: "product-native-complete",
        fixtureTarget: "hermes-provider:native-exact-fixture",
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: ["hermes-provider:native-exact-fixture"],
        nativeEvidenceRefs: expect.arrayContaining(["conformance:hermes-provider-native-exact-fixture", "provider-native-exact:hermes-agent"]),
        knownLossiness: [],
        blocker: "Native proof complete for this atom; no open module blocker remains.",
      })
    }
    expect(opencodeToolSchema).toMatchObject({
      ownerSection: "P1-05 Tool Schema / Result Projector Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: "opencode-tool:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["opencode-tool:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-tool-native-exact-fixture", "tool-native-exact:opencode"]),
      knownLossiness: [],
    })
    expect(piToolPackCompatibility).toMatchObject({
      ownerSection: "TODO-027 Product Bridge Inventory",
      disposition: "product-native-complete",
      fixtureTarget: "pi-tool-pack-compatibility:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["pi-tool-pack-compatibility:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-tool-pack-compatibility-native-exact-fixture", "tool-pack-compatibility-native-exact:pi-mono"]),
      knownLossiness: [],
    })
    expect(opencodeHookPlugin).toMatchObject({
      ownerSection: "TODO-027 Product Bridge Inventory",
      disposition: "product-native-complete",
      fixtureTarget: "opencode-hook-lifecycle:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["opencode-hook-lifecycle:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-hook-lifecycle-native-exact-fixture", "hook-lifecycle-native-exact:opencode"]),
      knownLossiness: [],
    })
    expect(opencodeProductShellSdk).toMatchObject({
      ownerSection: "P2 Product Shell Surface Bridge",
      disposition: "product-native-complete",
      fixtureTarget: "opencode-product-shell:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["opencode-product-shell:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-product-shell-native-exact-fixture",
        "product-shell-native-exact:opencode",
        "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      ]),
      knownLossiness: [],
    })
    for (const item of [opencodeProductShellControlPlane, opencodeProductShellDesktop, opencodeProductShellHarness, opencodeProductShellSlack, opencodeProductShellWeb, opencodeProductShellWorkspace]) {
      expect(item?.ownerSection).toMatch(/^P2/)
      expect(item).toMatchObject({
        disposition: "product-native-complete",
        fixtureTarget: "opencode-product-shell:native-exact-fixture",
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: ["opencode-product-shell:native-exact-fixture"],
        nativeEvidenceRefs: expect.arrayContaining([
          "conformance:opencode-product-shell-native-exact-fixture",
          "product-shell-native-exact:opencode",
          "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
        ]),
        knownLossiness: [],
      })
    }
    expect(opencodeShellEnv).toMatchObject({
      disposition: "product-native-complete",
      fixtureTarget: "opencode-shell-env:native-exact-fixture",
      implementationLevel: "native",
      fixtureIDs: ["opencode-shell-env:native-exact-fixture"],
      knownLossiness: [],
    })
    for (const item of hermesProductShellNativeItems) {
      expect(item?.ownerSection).toMatch(/^P2/)
      expect(item).toMatchObject({
        disposition: "product-native-complete",
        fixtureTarget: hermesProductShellNativeExactFixtureID,
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: expect.arrayContaining([hermesProductShellNativeExactFixtureID]),
        nativeEvidenceRefs: expect.arrayContaining([
          hermesProductShellNativeExactEvidenceRef,
          hermesProductShellNativeExactReplayRef,
        ]),
        knownLossiness: [],
      })
    }
    for (const item of [opencodeUIEventLoop, opencodeUICommandRouter, opencodeUIRenderer, opencodeUISnapshot, opencodeUIThemeRegistry]) {
      expect(item).toMatchObject({
        disposition: "product-native-complete",
        fixtureTarget: openCodeUINativeExactFixtureID,
        implementationLevel: "native",
        parityCoverage: "native",
        fixtureIDs: [openCodeUINativeExactFixtureID],
        nativeEvidenceRefs: expect.arrayContaining([openCodeUINativeExactEvidenceRef, openCodeUINativeExactReplayRef]),
        knownLossiness: [],
      })
    }
    expect(opencodeToolPackCompatibility).toMatchObject({
      ownerSection: "TODO-027 Product Bridge Inventory",
      disposition: "product-native-complete",
      fixtureTarget: "opencode-tool:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["opencode-tool:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-tool-native-exact-fixture", "tool-native-exact:opencode"]),
      knownLossiness: [],
    })
    expect(opencodeNativeToolPack).toMatchObject({
      ownerSection: "TODO-027 Product Bridge Inventory",
      disposition: "product-native-complete",
      fixtureTarget: "opencode-tool:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["opencode-tool:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-tool-native-exact-fixture", "tool-native-exact:opencode"]),
      knownLossiness: [],
    })
    expect(opencodeTraceDebugSurface).toMatchObject({
      ownerSection: "TODO-027 Product Bridge Inventory",
      disposition: "product-native-complete",
      fixtureTarget: "opencode-trace-debug-surface:native-exact-fixture",
      implementationLevel: "native",
      fixtureIDs: ["opencode-trace-debug-surface:native-exact-fixture"],
      knownLossiness: [],
    })
    expect(piTraceDebugSurface).toMatchObject({
      ownerSection: "TODO-027 Product Bridge Inventory",
      disposition: "product-native-complete",
      fixtureTarget: "pi-trace-debug-surface:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["pi-trace-debug-surface:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:pi-trace-debug-surface-native-exact-fixture",
        "trace-debug-surface-native-exact:pi-mono",
      ]),
      knownLossiness: [],
    })
    expect(nanobotTraceDebugSurface).toMatchObject({
      ownerSection: "TODO-027 Product Bridge Inventory",
      disposition: "product-native-complete",
      fixtureTarget: "nanobot-trace-debug-surface:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["nanobot-trace-debug-surface:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:nanobot-trace-debug-surface-native-exact-fixture",
        "trace-debug-surface-native-exact:nanobot",
      ]),
      knownLossiness: [],
    })
    expect(hermesTraceDebugSurface).toMatchObject({
      ownerSection: "TODO-027 Product Bridge Inventory",
      disposition: "product-native-complete",
      fixtureTarget: "hermes-trace-debug-surface:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["hermes-trace-debug-surface:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:hermes-trace-debug-surface-native-exact-fixture",
        "trace-debug-surface-native-exact:hermes-agent",
      ]),
      knownLossiness: [],
    })
    expect(opencodeTui).toMatchObject({
      ownerSection: "P2-09 Product TUI Shell Rewrite",
      disposition: "product-native-complete",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureTarget: "opencode-product-shell:native-exact-fixture",
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-product-shell-native-exact-fixture",
        "product-shell-native-exact:opencode",
      ]),
      fixtureIDs: ["opencode-product-shell:native-exact-fixture"],
      knownLossiness: [],
    })
    expect(opencodeMetadata).toMatchObject({
      ownerSection: "TODO-028 Metadata Overlay Boundary",
      disposition: "metadata-retained",
      fixtureTarget: "opencode-metadata:overlay-demotion-matrix",
      implementationLevel: "metadata-only",
      nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-metadata-overlay-demotion-matrix"]),
      fixtureIDs: expect.arrayContaining(["opencode-metadata:overlay-demotion-matrix"]),
      knownLossiness: expect.arrayContaining([
        "bom-or-overlay-only",
        "not-executable-provider",
        "opencode-metadata-overlay-demotion-matrix-partial-fixture",
      ]),
      blocker: expect.stringContaining("must not bind executable ports"),
    })
    expect(opencodeNativeCliTaskRunner).toMatchObject({
      ownerSection: "TODO-027 Product Bridge Inventory",
      disposition: "product-native-complete",
      fixtureTarget: "replay:opencode.task.runner.native-cli",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: expect.arrayContaining(["task-parity-live:opencode:read-only-answer:native-cli"]),
      nativeEvidenceRefs: expect.arrayContaining([
        "artifact:docs/reports/task-parity-live-opencode-smoke.json#opencode:original:read-only-answer:native-cli",
        "upstream:npm:opencode-ai@1.15.11:bin/opencode.exe",
      ]),
      knownLossiness: [],
      blocker: "Native proof complete for this atom; no open module blocker remains.",
    })
    expect(opencodeNativeToolBatchScheduler).toMatchObject({
      ownerSection: "P1-04 Native-like Cadence Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: "opencode-tool:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["opencode-tool:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-tool-native-exact-fixture", "tool-native-exact:opencode"]),
      knownLossiness: [],
    })
    expect(opencodeNativeToolResultProjector).toMatchObject({
      ownerSection: "P1-05 Tool Schema / Result Projector Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: "opencode-tool:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["opencode-tool:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-tool-native-exact-fixture", "tool-native-exact:opencode"]),
      knownLossiness: [],
    })
    expect(opencodeNativeToolSchema).toMatchObject({
      ownerSection: "P1-05 Tool Schema / Result Projector Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: "opencode-tool-schema:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["opencode-tool-schema:native-exact-fixture"],
      knownLossiness: [],
    })
    expect(piNativeIdentityClock).toMatchObject({
      ownerSection: "TODO-027 Product Bridge Inventory",
      disposition: "product-native-complete",
      fixtureTarget: "pi-identity-clock:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["pi-identity-clock:native-exact-fixture"],
      nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-identity-clock-native-exact-fixture", "identity-clock-native-exact:pi-mono"]),
      knownLossiness: [],
    })
    expect(piNativeFinalSummary).toMatchObject({
      ownerSection: "P1-04 Native-like Cadence Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: "pi-agent-loop-final-summary:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["pi-agent-loop-final-summary:native-exact-fixture"],
      knownLossiness: [],
    })
    expect(piNativeRequestBoundary).toMatchObject({
      ownerSection: "P1-04 Native-like Cadence Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: "pi-agent-loop-request-boundary:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["pi-agent-loop-request-boundary:native-exact-fixture"],
      knownLossiness: [],
    })
    expect(piNativeToolBatchScheduler).toMatchObject({
      ownerSection: "P1-04 Native-like Cadence Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: "pi-tool-batch-scheduler:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["pi-tool-batch-scheduler:native-exact-fixture"],
      knownLossiness: [],
    })
    for (const item of hermesNanobotNativeCadenceItems) {
      expect(item).toMatchObject({
        ownerSection: "P1-04 Native-like Cadence Rewrite",
        disposition: "product-native-complete",
        implementationLevel: "native",
        parityCoverage: "native",
        knownLossiness: [],
        blocker: "Native proof complete for this atom; no open module blocker remains.",
      })
      expect(item?.fixtureTarget, item?.atomID).toMatch(/:native-exact-fixture$/)
      expect(item?.fixtureIDs, item?.atomID).toContain(item?.fixtureTarget)
      expect(item?.nativeEvidenceRefs.some((ref) => ref.startsWith("conformance:")), item?.atomID).toBe(true)
    }
    expect(piNativeToolSchema).toMatchObject({
      ownerSection: "P1-05 Tool Schema / Result Projector Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: "pi-tool-schema:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["pi-tool-schema:native-exact-fixture"],
      knownLossiness: [],
    })
    expect(piNativeToolResultProjector).toMatchObject({
      ownerSection: "P1-05 Tool Schema / Result Projector Rewrite",
      disposition: "product-native-complete",
      fixtureTarget: "pi-tool-result-projector:native-exact-fixture",
      implementationLevel: "native",
      parityCoverage: "native",
      fixtureIDs: ["pi-tool-result-projector:native-exact-fixture"],
      knownLossiness: [],
    })
    expect(verification.checks.find((check) => check.id === "todo27-inventory.classification-complete")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "todo27-inventory.no-unproven-native-complete")).toMatchObject({ ok: true })
  })

  it("writes JSON and Markdown reports that round-trip through the verifier", () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-todo27-inventory-"))
    try {
      const jsonPath = join(dir, "todo27-native-rewrite-inventory.json")
      const markdownPath = join(dir, "todo27-native-rewrite-inventory.md")
      const inventory = buildTodo27NativeRewriteInventory({
        products: ["opencode"],
        generatedAt: "2026-06-10T00:00:00.000Z",
      })

      writeTodo27NativeRewriteInventoryReports({ inventory, jsonPath, markdownPath })

      const roundTripped = JSON.parse(readFileSync(jsonPath, "utf8")) as Todo27NativeRewriteInventory
      const markdown = readFileSync(markdownPath, "utf8")
      expect(verifyTodo27NativeRewriteInventory(roundTripped).ok).toBe(true)
      expect(roundTripped.summary.fingerprint).toBe(inventory.summary.fingerprint)
      expect(markdown).toContain("# TODO-027 Native Rewrite Inventory")
      expect(markdown).toContain("P0-01 Prompt Family Native Rewrite")
      expect(markdown).toContain("P2-09 Product TUI Shell Rewrite")
      expect(markdown).toContain("Metadata retained")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("rejects inventories that lose classification or evidence fields", () => {
    const inventory = buildTodo27NativeRewriteInventory({
      products: ["opencode"],
      generatedAt: "2026-06-10T00:00:00.000Z",
    })
    const stripped: Todo27NativeRewriteInventory = {
      ...inventory,
      items: inventory.items.map((item) =>
        item.atomID === "opencode.prompt.mode-builder"
          ? { ...item, ownerSection: "", fixtureTarget: "", blocker: "", nativeEvidenceRefs: [], fixtureIDs: [], knownLossiness: [] }
          : item,
      ),
    }

    const verification = verifyTodo27NativeRewriteInventory(stripped)

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toEqual(
      expect.arrayContaining(["todo27-inventory.classification-complete", "todo27-inventory.transition-evidence-or-lossiness"]),
    )
  })

  it("is available through the public CLI and writes verifiable report artifacts", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-todo27-inventory-cli-"))
    try {
      const jsonPath = join(dir, "todo27-native-rewrite-inventory.json")
      const markdownPath = join(dir, "todo27-native-rewrite-inventory.md")
      const stdout: string[] = []
      const stderr: string[] = []
      const io = {
        stdout: {
          write(chunk: string) {
            stdout.push(chunk)
            return true
          },
        },
        stderr: {
          write(chunk: string) {
            stderr.push(chunk)
            return true
          },
        },
      }

      expect(await runCli(["todo27-native-rewrite-inventory", "--product", "opencode,pi-mono,nanobot,hermes-agent", "--out", jsonPath, "--markdown", markdownPath, "--json"], io)).toBe(0)
      expect(existsSync(jsonPath)).toBe(true)
      expect(existsSync(markdownPath)).toBe(true)
      const output = JSON.parse(stdout.join("")) as { inventory: Todo27NativeRewriteInventory; verification: { ok: boolean } }
      expect(output.verification.ok).toBe(true)
      expect(output.inventory.summary.total).toBe(445)
      expect(await runCli(["verify-todo27-native-rewrite-inventory", "--artifact", jsonPath, "--json"], io)).toBe(0)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
