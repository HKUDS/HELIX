import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { runCli } from "@helix/cli"
import {
  buildCurrentModulePlaceholderAudit,
  verifyCurrentModulePlaceholderAudit,
  writeCurrentModulePlaceholderAuditReports,
  type CurrentModulePlaceholderAudit,
} from "@helix/recipes"

describe("current module placeholder audit conformance", () => {
  it("lists every current module gap with owner TODO, evidence, lossiness, and next action", () => {
    const audit = buildCurrentModulePlaceholderAudit({
      generatedAt: "2026-06-10T00:00:00.000Z",
    })
    const verification = verifyCurrentModulePlaceholderAudit(audit)
    const opencodePrompt = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.prompt.mode-builder")
    const piPrompt = audit.items.find((item) => item.kind === "product-atom" && item.product === "pi-mono" && item.atomID === "pi.prompt.coding-agent-builder")
    const nanobotPrompt = audit.items.find((item) => item.kind === "product-atom" && item.product === "nanobot" && item.atomID === "nanobot.prompt.agent-builder")
    const hermesPrompt = audit.items.find((item) => item.kind === "product-atom" && item.product === "hermes-agent" && item.atomID === "hermes.prompt.agent-builder")
    const opencodeFoundation = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.tool-pack.compatibility")
    const piFoundation = audit.items.find((item) => item.kind === "product-atom" && item.product === "pi-mono" && item.atomID === "pi.tool-pack.compatibility")
    const nanobotFoundation = audit.items.find((item) => item.kind === "product-atom" && item.product === "nanobot" && item.atomID === "nanobot.tool-pack.compatibility")
    const hermesFoundation = audit.items.find((item) => item.kind === "product-atom" && item.product === "hermes-agent" && item.atomID === "hermes.tool-pack.compatibility")
    const opencodeConfig = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.config.precedence")
    const piConfig = audit.items.find((item) => item.kind === "product-atom" && item.product === "pi-mono" && item.atomID === "pi.config.precedence")
    const nanobotConfig = audit.items.find((item) => item.kind === "product-atom" && item.product === "nanobot" && item.atomID === "nanobot.config.precedence")
    const hermesConfig = audit.items.find((item) => item.kind === "product-atom" && item.product === "hermes-agent" && item.atomID === "hermes.config.precedence")
    const opencodeIdentity = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.identity.id-generator")
    const piIdentity = audit.items.find((item) => item.kind === "product-atom" && item.product === "pi-mono" && item.atomID === "pi.identity.id-generator")
    const nanobotIdentity = audit.items.find((item) => item.kind === "product-atom" && item.product === "nanobot" && item.atomID === "nanobot.identity.workspace-resolver")
    const hermesIdentity = audit.items.find((item) => item.kind === "product-atom" && item.product === "hermes-agent" && item.atomID === "hermes.identity.clock-format")
    const opencodeEvent = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.event.envelope-bridge")
    const piEvent = audit.items.find((item) => item.kind === "product-atom" && item.product === "pi-mono" && item.atomID === "pi.event.envelope-bridge")
    const nanobotEvent = audit.items.find((item) => item.kind === "product-atom" && item.product === "nanobot" && item.atomID === "nanobot.event.envelope-bridge")
    const hermesEvent = audit.items.find((item) => item.kind === "product-atom" && item.product === "hermes-agent" && item.atomID === "hermes.event.envelope-bridge")
    const opencodeTrace = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.trace.debug-surface")
    const piTrace = audit.items.find((item) => item.kind === "product-atom" && item.product === "pi-mono" && item.atomID === "pi.trace.debug-surface")
    const nanobotTrace = audit.items.find((item) => item.kind === "product-atom" && item.product === "nanobot" && item.atomID === "nanobot.trace.debug-surface")
    const hermesTrace = audit.items.find((item) => item.kind === "product-atom" && item.product === "hermes-agent" && item.atomID === "hermes.trace.debug-surface")
    const opencodeMetadataOverlay = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.runtime.module-aliases")
    const opencodeTask = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.task.runner.native-cli")
    const nanobotTask = audit.items.find((item) => item.kind === "product-atom" && item.product === "nanobot" && item.atomID === "nanobot.task.runner.native-cli")
    const opencodeTurn = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.turn.context-builder")
    const opencodePromptBinding = audit.items.find((item) => item.kind === "required-binding" && item.product === "opencode" && item.portID === "prompt.system-builder")
    const opencodeProviderBinding = audit.items.find((item) => item.kind === "required-binding" && item.product === "opencode" && item.portID === "provider.stream-parser")
    const opencodeProviderRequestOptions = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.provider.request-options")
    const opencodeProviderTransportInstrumentation = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.provider.transport-instrumentation")
    const opencodeSessionStore = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.session.store.sqlite-projection")
    const opencodeToolSchema = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.tool.schema-bridge")
    const opencodePluginLoader = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.plugin.loader")
    const piProviderRequestOptions = audit.items.find((item) => item.kind === "product-atom" && item.product === "pi-mono" && item.atomID === "pi.provider.request-options")
    const nanobotProviderRequestOptions = audit.items.find((item) => item.kind === "product-atom" && item.product === "nanobot" && item.atomID === "nanobot.provider.request-options")
    const hermesProviderRequestOptions = audit.items.find((item) => item.kind === "product-atom" && item.product === "hermes-agent" && item.atomID === "hermes.provider.request-options")
    const opencodeToolBinding = audit.items.find((item) => item.kind === "required-binding" && item.product === "opencode" && item.portID === "tool.definition")
    const opencodeHookBinding = audit.items.find((item) => item.kind === "required-binding" && item.product === "opencode" && item.portID === "hook.bus")
    const opencodeSessionBinding = audit.items.find((item) => item.kind === "required-binding" && item.product === "opencode" && item.portID === "session.branch-graph")
    const opencodeRuntimeBinding = audit.items.find((item) => item.kind === "required-binding" && item.product === "opencode" && item.portID === "runtime.acceptance-controller")
    const opencodeProductShellSdkAtom = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.product-shell.sdk")
    const opencodeProductShellControlPlaneAtom = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.product-shell.control-plane")
    const opencodeProductShellDesktopAtom = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.product-shell.desktop")
    const opencodeProductShellWorkspaceAtom = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.product-shell.workspace")
    const opencodeShellEnvAtom = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.shell.env-bridge")
    const piProductShellCLIAtom = audit.items.find((item) => item.kind === "product-atom" && item.product === "pi-mono" && item.atomID === "pi.product-shell.cli")
    const piProductShellSDKAtom = audit.items.find((item) => item.kind === "product-atom" && item.product === "pi-mono" && item.atomID === "pi.product-shell.sdk")
    const piProductShellRPCAtom = audit.items.find((item) => item.kind === "product-atom" && item.product === "pi-mono" && item.atomID === "pi.product-shell.rpc")
    const piProductShellHarnessAtom = audit.items.find((item) => item.kind === "product-atom" && item.product === "pi-mono" && item.atomID === "pi.product-shell.harness")
    const piProductShellServerAtom = audit.items.find((item) => item.kind === "product-atom" && item.product === "pi-mono" && item.atomID === "pi.product-shell.server")
    const piProductShellPackageManagerAtom = audit.items.find((item) => item.kind === "product-atom" && item.product === "pi-mono" && item.atomID === "pi.product-shell.package-manager")
    const piProductShellExtensionExamplesAtom = audit.items.find((item) => item.kind === "product-atom" && item.product === "pi-mono" && item.atomID === "pi.product-shell.extension-examples")
    const opencodeProductShellBinding = audit.items.find((item) => item.kind === "required-binding" && item.product === "opencode" && item.portID === "product.shell")
    const opencodeUIEventLoopBinding = audit.items.find((item) => item.kind === "required-binding" && item.product === "opencode" && item.portID === "ui.event-loop")
    const opencodeUIRendererAtom = audit.items.find((item) => item.kind === "product-atom" && item.product === "opencode" && item.atomID === "opencode.ui.renderer")
    const piUIRendererAtom = audit.items.find((item) => item.kind === "product-atom" && item.product === "pi-mono" && item.atomID === "pi.ui.renderer")
    const nanobotUIRendererAtom = audit.items.find((item) => item.kind === "product-atom" && item.product === "nanobot" && item.atomID === "nanobot.ui.renderer")
    const hermesUIRendererAtom = audit.items.find((item) => item.kind === "product-atom" && item.product === "hermes-agent" && item.atomID === "hermes.ui.renderer")
    const opencodePackage = audit.items.find((item) => item.kind === "package" && item.packagePath === "packages/adapters-opencode")
    const manualPackage = audit.items.find((item) => item.kind === "package" && item.packagePath === "packages/cli")
    const opencodePromptWorkItem = audit.workQueue.find((item) => item.ownerTODO === "TODO-027" && item.divergenceKind === "prompt-family-partial" && item.products.includes("opencode") && item.planes.includes("prompt"))
    const localEvidenceWorkItem = audit.workQueue.find((item) => item.ownerTODO === "TODO-029" && item.divergenceKind === "local-evidence-tool-only")
    const compatibilityExportWorkItem = audit.workQueue.find((item) => item.ownerTODO === "TODO-029" && item.divergenceKind === "compatibility-export-only")
    const opencodeProductSummary = audit.productSummaries.find((summary) => summary.product === "opencode")
    const piProductSummary = audit.productSummaries.find((summary) => summary.product === "pi-mono")
    const nanobotProductSummary = audit.productSummaries.find((summary) => summary.product === "nanobot")
    const hermesProductSummary = audit.productSummaries.find((summary) => summary.product === "hermes-agent")
    const agentLoopPackageSummary = audit.packageSummaries.find((summary) => summary.packagePath === "packages/lego-agent-loop")
    const contractsPackageSummary = audit.packageSummaries.find((summary) => summary.packagePath === "packages/contracts")
    const legoHooksPackageSummary = audit.packageSummaries.find((summary) => summary.packagePath === "packages/lego-hooks")
    const opencodeAdapterPackageSummary = audit.packageSummaries.find((summary) => summary.packagePath === "packages/adapters-opencode")
    const cliPackageSummary = audit.packageSummaries.find((summary) => summary.packagePath === "packages/cli")
    const docsSitePackageSummary = audit.packageSummaries.find((summary) => summary.packagePath === "packages/docs-site")
    const conformancePackageSummary = audit.packageSummaries.find((summary) => summary.packagePath === "packages/conformance")
    const opencodePluginPackageSummary = audit.packageSummaries.find((summary) => summary.packagePath === "packages/opencode-plugin")
    const piCodingAgentPackageSummary = audit.packageSummaries.find((summary) => summary.packagePath === "packages/pi-coding-agent")
    const agentLoopPlaneSummary = audit.planeSummaries.find((summary) => summary.plane === "agent-loop")
    const providerPlaneSummary = audit.planeSummaries.find((summary) => summary.plane === "provider")
    const hookPlaneSummary = audit.planeSummaries.find((summary) => summary.plane === "hook")
    const legoConfigAtomsSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-config/src/config-atoms.ts")
    const legoConfigRuntimeSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-config/src/config.ts")
    const legoConfigPortFixtureSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-config/src/port-fixtures.ts")
    const legoConfigOpenCodeProductSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-config/src/product-schema/opencode.ts")
    const legoConfigNanobotProductSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-config/src/product-schema/nanobot.ts")
    const legoConfigPiProductSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-config/src/product-schema/pi.ts")
    const legoRuntimeIndexSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-runtime/src/index.ts")
    const legoRuntimeRegistrySourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-runtime/src/registry.ts")
    const legoRuntimeAtomsSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-runtime/src/runtime-atoms.ts")
    const legoRuntimePiProductSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-runtime/src/product-schema/pi.ts")
    const legoRuntimeAcceptanceSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-runtime/src/acceptance-controller.ts")
    const legoRuntimePortFixtureSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-runtime/src/port-fixtures.ts")
    const piExtensionSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-pi/src/extension-atoms.ts")
    const piProductSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-pi/src/product-schema/pi.ts")
    const piEventSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-pi/src/product-schema/events.ts")
    const piProviderSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-pi/src/product-schema/provider.ts")
    const piPromptSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-pi/src/product-schema/prompt.ts")
    const piProductShellSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-pi/src/product-schema/product-shell.ts")
    const piTraceSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-pi/src/product-schema/trace.ts")
    const piExtensionAdapterSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-pi/src/extension-adapter.ts")
    const nanobotAtomsSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-nanobot/src/nanobot-atoms.ts")
    const nanobotIdentitySchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-nanobot/src/product-schema/identity.ts")
    const opencodePluginSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-opencode/src/plugin-atoms.ts")
    const opencodePluginAdapterSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-opencode/src/plugin-adapter.ts")
    const opencodePluginLoaderSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-opencode/src/plugin-loader.ts")
    const opencodeBuiltinProvidersSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-opencode/src/builtin-providers.ts")
    const hermesAtomsSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-hermes/src/hermes-atoms.ts")
    const hermesIdentitySchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-hermes/src/product-schema/identity.ts")
    const hermesSessionSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-hermes/src/product-schema/session.ts")
    const hermesTraceSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-hermes/src/product-schema/trace.ts")
    const hermesEventSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-hermes/src/product-schema/events.ts")
    const hermesProviderSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-hermes/src/product-schema/provider.ts")
    const hermesPluginSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-hermes/src/atoms/plugin.ts")
    const hermesToolSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-hermes/src/atoms/tool.ts")
    const hermesProviderSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-hermes/src/atoms/provider.ts")
    const hermesUISourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-hermes/src/atoms/ui.ts")
    const hermesUISchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-hermes/src/product-schema/ui.ts")
    const hermesProductShellSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-hermes/src/product-schema/product-shell.ts")
    const hermesHooksFixtureSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-hooks/src/port-fixtures.ts")
    const legoHooksHostSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-hooks/src/host.ts")
    const legoHooksAtomsSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-hooks/src/hook-atoms.ts")
    const legoHooksTypesSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-hooks/src/types.ts")
    const legoHooksAliasesSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-hooks/src/aliases.ts")
    const hermesToolsFixtureSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-tools/src/port-fixtures.ts")
    const legoToolsToolAtomsSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-tools/src/tool-atoms.ts")
    const legoToolsDefaultToolsSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-tools/src/default-tools.ts")
    const legoToolsPortsSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-tools/src/ports.ts")
    const legoToolsCadenceSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-tools/src/cadence-atoms.ts")
    const legoToolsNanobotProductSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-tools/src/product-schema/nanobot.ts")
    const legoToolsHermesProductSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-tools/src/product-schema/hermes.ts")
    const legoAgentLoopToolBatchSchedulerSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-agent-loop/src/cadence/tool-batch-scheduler.ts")
    const legoAgentLoopToolStepSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-agent-loop/src/loop/tool-step.ts")
    const legoAgentLoopPiProductSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-agent-loop/src/product-schema/pi.ts")
    const hermesProviderFixtureSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-provider/src/port-fixtures.ts")
    const legoProviderPortsSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-provider/src/ports.ts")
    const legoProviderNormalizerSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-provider/src/normalizer.ts")
    const legoProviderOpenAICompatibleSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-provider/src/openai-compatible.ts")
    const legoProviderAnthropicSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-provider/src/anthropic.ts")
    const legoProviderGoogleSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-provider/src/google.ts")
    const legoProviderOpenRouterSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-provider/src/openrouter.ts")
    const legoAgentLoopIndexSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-agent-loop/src/index.ts")
    const legoAgentLoopProductTurnSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-agent-loop/src/product-turn/atoms.ts")
    const legoAgentLoopRunTurnSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-agent-loop/src/loop/run-turn.ts")
    const legoUISourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-ui/src/ui-atoms.ts")
    const legoUIOpenCodeProductSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-ui/src/product-schema/opencode.ts")
    const legoUIPiProductSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-ui/src/product-schema/pi.ts")
    const legoUINanobotProductSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-ui/src/product-schema/nanobot.ts")
    const legoUITUIEventLoopSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-ui/src/tui-event-loop.ts")
    const legoUITransportSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-ui/src/ui.ts")
    const legoUIPortFixtureSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-ui/src/port-fixtures.ts")
    const opencodeSessionSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-opencode/src/product-schema/session.ts")
    const piSessionSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-pi/src/session-personality.ts")
    const nanobotSessionSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-nanobot/src/product-schema/session.ts")
    const hermesSessionSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/adapters-hermes/src/session-personality.ts")
    const legoSessionAtomsSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-session/src/atoms.ts")
    const legoSessionJsonlTreeSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-session/src/jsonl-tree.ts")
    const legoSessionProjectionSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-session/src/projection.ts")
    const legoSessionMessagePartProjectorSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-session/src/message-part-projector.ts")
    const legoSessionPiProductSchemaSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-session/src/product-schema/pi.ts")
    const legoSessionTypesSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-session/src/types.ts")
    const legoSessionUtilsSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-session/src/utils.ts")
    const atomCatalogSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/recipes/src/atom-catalog.ts")
    const bundleCatalogSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/recipes/src/bundle-catalog.ts")
    const cliSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/cli/src/index.ts")
    const docsSiteIndexSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/docs-site/src/index.ts")
    const conformanceAuditSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/conformance/current-module-placeholder-audit.conformance.test.ts")
    const opencodePluginCompatSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/opencode-plugin/src/index.ts")
    const piCodingAgentCompatSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/pi-coding-agent/src/index.ts")
    const piVirtualTaskSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/pi-mono.task.runner.native-cli/src/index.ts")
    const turnFixtureQueueItem = audit.fixtureDiffQueue.find((item) => item.fixtureDiffTarget === "turn.native-loop-replay" && item.exactDiffStatus === "exact-diff-partial")
    const hookFixtureQueueItem = audit.fixtureDiffQueue.find((item) => item.fixtureDiffTarget === "hook.plugin-lifecycle-replay" && item.exactDiffStatus === "exact-diff-missing")
    const opencodeHookFixtureQueueItem = audit.fixtureDiffQueue.find((item) => item.fixtureDiffTarget === "hook.plugin-lifecycle-replay" && item.exactDiffStatus === "exact-diff-missing")
    const toolFixtureQueueItem = audit.fixtureDiffQueue.find((item) => item.fixtureDiffTarget === "tool.contract-envelope-replay" && item.exactDiffStatus === "exact-diff-partial")
    const opencodeToolFixtureQueueItem = audit.fixtureDiffQueue.find((item) => item.fixtureDiffTarget === "tool.contract-envelope-replay" && item.exactDiffStatus === "exact-diff-partial" && item.products.includes("opencode"))
    const sessionFixtureQueueItem = audit.fixtureDiffQueue.find((item) => item.fixtureDiffTarget === "session.storage-round-trip" && item.exactDiffStatus === "exact-diff-partial")
    const providerFixtureQueueItem = audit.fixtureDiffQueue.find((item) => item.fixtureDiffTarget === "provider.raw-frame-replay" && item.exactDiffStatus === "exact-diff-partial")
    const localEvidenceFixtureQueueItem = audit.fixtureDiffQueue.find((item) => item.fixtureDiffTarget === "local-evidence.native-claim-guard" && item.exactDiffStatus === "demotion-guard-only")
    const compatibilityExportFixtureQueueItem = audit.fixtureDiffQueue.find((item) => item.fixtureDiffTarget === "compat-export.api-surface-guard" && item.exactDiffStatus === "demotion-guard-only")
    const configMissingFixtureQueueItem = audit.fixtureDiffQueue.find((item) => item.fixtureDiffTarget === "config.discovery-precedence-matrix" && item.exactDiffStatus === "exact-diff-missing")
    const configPartialFixtureQueueItem = audit.fixtureDiffQueue.find((item) => item.fixtureDiffTarget === "config.discovery-precedence-matrix" && item.exactDiffStatus === "exact-diff-partial")
    const identityMissingFixtureQueueItem = audit.fixtureDiffQueue.find((item) => item.fixtureDiffTarget === "identity.formatting-round-trip" && item.exactDiffStatus === "exact-diff-missing")
    const identityPartialFixtureQueueItem = audit.fixtureDiffQueue.find((item) => item.fixtureDiffTarget === "identity.formatting-round-trip" && item.exactDiffStatus === "exact-diff-partial")
    const piVirtualTaskSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/pi-mono.task.runner.native-cli/src/index.ts" && item.fixtureDiffTarget === "metadata.executable-blocker" && item.exactDiffStatus === "demotion-guard-only",
    )
    const agentLoopSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-agent-loop/src/product-turn/atoms.ts" && item.fixtureDiffTarget === "turn.native-loop-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const agentLoopIndexSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-agent-loop/src/index.ts" && item.fixtureDiffTarget === "turn.native-loop-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const opencodePluginToolSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-opencode/src/plugin-atoms.ts" && item.fixtureDiffTarget === "tool.contract-envelope-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const opencodePluginAdapterToolSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-opencode/src/plugin-adapter.ts" && item.fixtureDiffTarget === "tool.contract-envelope-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const opencodePluginAdapterHookSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-opencode/src/plugin-adapter.ts" && item.fixtureDiffTarget === "hook.plugin-lifecycle-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const opencodePluginLoaderHookSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-opencode/src/plugin-loader.ts" && item.fixtureDiffTarget === "hook.plugin-lifecycle-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const piExtensionAdapterToolSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-pi/src/extension-adapter.ts" && item.fixtureDiffTarget === "tool.contract-envelope-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const nanobotAtomsToolSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-nanobot/src/nanobot-atoms.ts" && item.fixtureDiffTarget === "tool.contract-envelope-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const sharedHooksPortFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-hooks/src/port-fixtures.ts" && item.fixtureDiffTarget === "hook.plugin-lifecycle-replay" && item.exactDiffStatus === "exact-diff-missing",
    )
    const sharedHooksPortPartialFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-hooks/src/port-fixtures.ts" && item.fixtureDiffTarget === "hook.plugin-lifecycle-replay" && item.exactDiffStatus === "exact-diff-missing",
    )
    const legoHooksHostHookSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-hooks/src/host.ts" && item.fixtureDiffTarget === "hook.plugin-lifecycle-replay" && item.exactDiffStatus === "exact-diff-missing",
    )
    const legoHooksHostPartialHookSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-hooks/src/host.ts" && item.fixtureDiffTarget === "hook.plugin-lifecycle-replay" && item.exactDiffStatus === "exact-diff-missing",
    )
    const legoHooksAtomsHookSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-hooks/src/hook-atoms.ts" && item.fixtureDiffTarget === "hook.plugin-lifecycle-replay" && item.exactDiffStatus === "exact-diff-missing",
    )
    const legoHooksAtomsPartialHookSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-hooks/src/hook-atoms.ts" && item.fixtureDiffTarget === "hook.plugin-lifecycle-replay" && item.exactDiffStatus === "exact-diff-missing",
    )
    const hermesAtomsSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-hermes/src/hermes-atoms.ts" && item.fixtureDiffTarget === "hook.plugin-lifecycle-replay" && item.exactDiffStatus === "exact-diff-missing",
    )
    const hermesPluginHookSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-hermes/src/atoms/plugin.ts" && item.fixtureDiffTarget === "hook.plugin-lifecycle-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const hermesToolsPortFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-tools/src/port-fixtures.ts" && item.fixtureDiffTarget === "tool.contract-envelope-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const opencodeToolsPortFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-tools/src/port-fixtures.ts" && item.fixtureDiffTarget === "tool.contract-envelope-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const legoToolsPortFixturesCommonSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-tools/src/port-fixtures.ts" && item.fixtureDiffTarget === "common-provider.native-claim-guard" && item.exactDiffStatus === "demotion-guard-only",
    )
    const legoToolsPortFixturesCadenceSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-tools/src/port-fixtures.ts" && item.fixtureDiffTarget === "cadence.event-timing-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const legoToolsToolAtomsCommonSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-tools/src/tool-atoms.ts" && item.fixtureDiffTarget === "common-provider.native-claim-guard" && item.exactDiffStatus === "demotion-guard-only",
    )
    const legoToolsDefaultToolsCommonSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-tools/src/default-tools.ts" && item.fixtureDiffTarget === "common-provider.native-claim-guard" && item.exactDiffStatus === "demotion-guard-only",
    )
    const legoToolsDefaultToolsCadenceSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-tools/src/default-tools.ts" && item.fixtureDiffTarget === "cadence.event-timing-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const legoToolsPortsCommonSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-tools/src/ports.ts" && item.fixtureDiffTarget === "common-provider.native-claim-guard" && item.exactDiffStatus === "demotion-guard-only",
    )
    const legoToolsCadencePartialSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-tools/src/cadence-atoms.ts" && item.fixtureDiffTarget === "cadence.event-timing-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const legoToolsCadenceCommonSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-tools/src/cadence-atoms.ts" && item.fixtureDiffTarget === "common-provider.native-claim-guard" && item.exactDiffStatus === "demotion-guard-only",
    )
    const legoAgentLoopToolBatchSchedulerPartialSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-agent-loop/src/cadence/tool-batch-scheduler.ts" && item.fixtureDiffTarget === "cadence.event-timing-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const legoAgentLoopToolStepCadenceSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-agent-loop/src/loop/tool-step.ts" && item.fixtureDiffTarget === "cadence.event-timing-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const hermesProviderPortFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-provider/src/port-fixtures.ts" && item.fixtureDiffTarget === "provider.raw-frame-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const legoProviderPortsCommonSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-provider/src/ports.ts" && item.fixtureDiffTarget === "common-provider.native-claim-guard" && item.exactDiffStatus === "demotion-guard-only",
    )
    const legoProviderNormalizerCommonSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-provider/src/normalizer.ts" && item.fixtureDiffTarget === "common-provider.native-claim-guard" && item.exactDiffStatus === "demotion-guard-only",
    )
    const legoProviderOpenAICommonSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-provider/src/openai-compatible.ts" && item.fixtureDiffTarget === "common-provider.native-claim-guard" && item.exactDiffStatus === "demotion-guard-only",
    )
    const legoProviderAnthropicCommonSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-provider/src/anthropic.ts" && item.fixtureDiffTarget === "common-provider.native-claim-guard" && item.exactDiffStatus === "demotion-guard-only",
    )
    const legoProviderGooglePartialSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-provider/src/google.ts" && item.fixtureDiffTarget === "provider.raw-frame-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const legoProviderOpenRouterPartialSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-provider/src/openrouter.ts" && item.fixtureDiffTarget === "provider.raw-frame-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const uiSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-ui/src/ui-atoms.ts" && item.fixtureDiffTarget === "ui.tui-interaction-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const uiTUIEventLoopSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-ui/src/tui-event-loop.ts" && item.fixtureDiffTarget === "ui.tui-interaction-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const uiTransportSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-ui/src/ui.ts" && item.fixtureDiffTarget === "ui.tui-interaction-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const legoSessionAtomsSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-session/src/atoms.ts" && item.fixtureDiffTarget === "session.storage-round-trip" && item.exactDiffStatus === "exact-diff-partial",
    )
    const legoSessionJsonlTreeSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-session/src/jsonl-tree.ts" && item.fixtureDiffTarget === "session.storage-round-trip" && item.exactDiffStatus === "exact-diff-partial",
    )
    const legoSessionProjectionSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-session/src/projection.ts" && item.fixtureDiffTarget === "session.storage-round-trip" && item.exactDiffStatus === "exact-diff-partial",
    )
    const legoSessionMessagePartProjectorSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-session/src/message-part-projector.ts" && item.fixtureDiffTarget === "session.storage-round-trip" && item.exactDiffStatus === "exact-diff-partial",
    )
    const opencodeSessionSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-opencode/src/product-schema/session.ts" && item.fixtureDiffTarget === "session.storage-round-trip" && item.exactDiffStatus === "exact-diff-partial",
    )
    const piSessionSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-pi/src/session-personality.ts" && item.fixtureDiffTarget === "session.storage-round-trip" && item.exactDiffStatus === "exact-diff-partial",
    )
    const nanobotSessionSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-nanobot/src/product-schema/session.ts" && item.fixtureDiffTarget === "session.storage-round-trip" && item.exactDiffStatus === "exact-diff-partial",
    )
    const hermesSessionSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-hermes/src/session-personality.ts" && item.fixtureDiffTarget === "session.storage-round-trip" && item.exactDiffStatus === "exact-diff-partial",
    )
    const hermesSessionSchemaSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-hermes/src/product-schema/session.ts" && item.fixtureDiffTarget === "session.storage-round-trip" && item.exactDiffStatus === "exact-diff-partial",
    )
    const cliLocalEvidenceSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/cli/src/index.ts" && item.fixtureDiffTarget === "local-evidence.native-claim-guard" && item.exactDiffStatus === "demotion-guard-only",
    )
    const docsSiteLocalEvidenceSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/docs-site/src/index.ts" && item.fixtureDiffTarget === "local-evidence.native-claim-guard" && item.exactDiffStatus === "demotion-guard-only",
    )
    const opencodePluginCompatSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/opencode-plugin/src/index.ts" && item.fixtureDiffTarget === "compat-export.api-surface-guard" && item.exactDiffStatus === "demotion-guard-only",
    )
    const piCodingAgentCompatSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/pi-coding-agent/src/index.ts" && item.fixtureDiffTarget === "compat-export.api-surface-guard" && item.exactDiffStatus === "demotion-guard-only",
    )
    const legoConfigAtomsSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-config/src/config-atoms.ts" && item.fixtureDiffTarget === "config.discovery-precedence-matrix" && item.exactDiffStatus === "exact-diff-missing",
    )
    const legoConfigAtomsPartialSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-config/src/config-atoms.ts" && item.fixtureDiffTarget === "config.discovery-precedence-matrix" && item.exactDiffStatus === "exact-diff-partial",
    )
    const legoConfigRuntimeSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-config/src/config.ts" && item.fixtureDiffTarget === "config.discovery-precedence-matrix" && item.exactDiffStatus === "exact-diff-missing",
    )
    const legoConfigRuntimePartialSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-config/src/config.ts" && item.fixtureDiffTarget === "config.discovery-precedence-matrix" && item.exactDiffStatus === "exact-diff-partial",
    )
    const legoConfigPortFixtureSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-config/src/port-fixtures.ts" && item.fixtureDiffTarget === "config.discovery-precedence-matrix" && item.exactDiffStatus === "exact-diff-missing",
    )
    const legoConfigPortFixturePartialSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-config/src/port-fixtures.ts" && item.fixtureDiffTarget === "config.discovery-precedence-matrix" && item.exactDiffStatus === "exact-diff-partial",
    )
    const legoConfigOpenCodeProductSchemaSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-config/src/product-schema/opencode.ts" && item.fixtureDiffTarget === "config.discovery-precedence-matrix" && item.exactDiffStatus === "exact-diff-missing",
    )
    const legoConfigNanobotProductSchemaSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-config/src/product-schema/nanobot.ts" && item.fixtureDiffTarget === "config.discovery-precedence-matrix" && item.exactDiffStatus === "exact-diff-missing",
    )
    const legoConfigPiProductSchemaSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-config/src/product-schema/pi.ts" && item.fixtureDiffTarget === "config.discovery-precedence-matrix" && item.exactDiffStatus === "exact-diff-missing",
    )
    const legoConfigPiProductSchemaPartialSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-config/src/product-schema/pi.ts" && item.fixtureDiffTarget === "config.discovery-precedence-matrix" && item.exactDiffStatus === "exact-diff-partial",
    )
    const opencodePluginIdentitySourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-opencode/src/plugin-atoms.ts" && item.fixtureDiffTarget === "identity.formatting-round-trip" && item.exactDiffStatus === "exact-diff-partial",
    )
    const opencodeIdentitySchemaSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-opencode/src/product-schema/identity.ts" && item.fixtureDiffTarget === "identity.formatting-round-trip" && item.exactDiffStatus === "exact-diff-missing",
    )
    const hermesProfileIdentitySourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-hermes/src/atoms/profile.ts" && item.fixtureDiffTarget === "identity.formatting-round-trip" && item.exactDiffStatus === "exact-diff-partial",
    )
    const hermesTypesIdentitySourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-hermes/src/atoms/types.ts" && item.fixtureDiffTarget === "identity.formatting-round-trip" && item.exactDiffStatus === "exact-diff-partial",
    )
    const hermesIdentitySchemaSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-hermes/src/product-schema/identity.ts" && item.fixtureDiffTarget === "identity.formatting-round-trip" && item.exactDiffStatus === "exact-diff-missing",
    )
    const nanobotAtomsIdentitySourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-nanobot/src/nanobot-atoms.ts" && item.fixtureDiffTarget === "identity.formatting-round-trip" && item.exactDiffStatus === "exact-diff-partial",
    )
    const nanobotIdentitySchemaSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-nanobot/src/product-schema/identity.ts" && item.fixtureDiffTarget === "identity.formatting-round-trip" && item.exactDiffStatus === "exact-diff-missing",
    )
    const piExtensionIdentitySourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-pi/src/extension-atoms.ts" && item.fixtureDiffTarget === "identity.formatting-round-trip" && item.exactDiffStatus === "exact-diff-partial",
    )
    const piProductSchemaIdentitySourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/adapters-pi/src/product-schema/pi.ts" && item.fixtureDiffTarget === "identity.formatting-round-trip" && item.exactDiffStatus === "exact-diff-missing",
    )
    const contractsPortIdentityMissingSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/contracts/src/port-fixtures.ts" && item.fixtureDiffTarget === "identity.formatting-round-trip" && item.exactDiffStatus === "exact-diff-missing",
    )
    const contractsPortIdentityPartialSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/contracts/src/port-fixtures.ts" && item.fixtureDiffTarget === "identity.formatting-round-trip" && item.exactDiffStatus === "exact-diff-partial",
    )
    const contractsIndexIdentityPartialSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/contracts/src/index.ts" && item.fixtureDiffTarget === "identity.formatting-round-trip" && item.exactDiffStatus === "exact-diff-missing",
    )
    const legoRuntimeRegistryCommonSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-runtime/src/registry.ts" && item.fixtureDiffTarget === "common-provider.native-claim-guard" && item.exactDiffStatus === "demotion-guard-only",
    )
    const legoRuntimeAtomsMetadataSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-runtime/src/runtime-atoms.ts" && item.fixtureDiffTarget === "metadata.executable-blocker" && item.exactDiffStatus === "demotion-guard-only",
    )
    const legoRuntimeAcceptanceSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-runtime/src/acceptance-controller.ts" && item.fixtureDiffTarget === "runtime.acceptance-lifecycle-replay" && item.exactDiffStatus === "exact-diff-partial",
    )
    const legoRuntimePortFixtureCommonSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-runtime/src/port-fixtures.ts" && item.fixtureDiffTarget === "common-provider.native-claim-guard" && item.exactDiffStatus === "demotion-guard-only",
    )
    const legoRuntimePortFixtureMetadataSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-runtime/src/port-fixtures.ts" && item.fixtureDiffTarget === "metadata.executable-blocker" && item.exactDiffStatus === "demotion-guard-only",
    )
    const legoRuntimePortFixtureAcceptanceSourceFixtureQueueItem = audit.sourceFileFixtureQueue.find(
      (item) => item.currentSourceFile === "packages/lego-runtime/src/port-fixtures.ts" && item.fixtureDiffTarget === "runtime.acceptance-lifecycle-replay" && item.exactDiffStatus === "exact-diff-partial",
    )

    expect(verification.ok).toBe(true)
    expect(audit.schemaVersion).toBe(1)
    expect(audit.artifactKind).toBe("current-module-placeholder-audit")
    expect(audit.products).toEqual(["opencode", "pi-mono", "nanobot", "hermes-agent"])
    expect(audit.summary).toMatchObject({
      totalItems: 898,
      packageItems: 20,
      planeItems: 17,
      productAtomItems: 445,
      requiredBindingItems: 416,
      productNativeComplete: 389,
      transitionAtoms: 445,
      selectedTransitionAtoms: 433,
      requiredBindings: 416,
      compileBlockers: 0,
      previewOnlyBindings: 0,
      lossyCompatibleBindings: 0,
      previewOrMetadataExecutableBindings: 0,
      manualSourceCheckRequired: 6,
      workQueueItems: 60,
      workQueueCoveredItems: 171,
      sourceFileFixtureQueueItems: 175,
      sourceOwnerLineLevelSummaryItems: 30,
      currentSourceFileSummaryItems: 168,
      upstreamHeadDriftProducts: 4,
      upstreamHeadDriftItems: 856,
      productNativeExactFixtureItems: 691,
      semanticFixtureItems: 7,
      byMismatchKind: expect.objectContaining({
        "common-shared-not-product-native": 105,
        "compatible-bridge": 0,
        "lossy-compatible-binding": 0,
        "manual-source-check-required": 6,
        "metadata-only": 96,
        "native-like-projection": 0,
        "preview-only": 0,
        "profile-compatible-common-runner": 0,
        "upstream-head-drift-unchecked": 691,
      }),
      byImplementationLevel: expect.objectContaining({
        "common-shared": 102,
        "metadata-only": 80,
        native: 679,
      }),
      byUpstreamDriftStatus: expect.objectContaining({
        "not-product-scoped": 42,
        "pinned-behind-latest-head": 856,
        "pinned-matches-latest-head": 0,
      }),
      byUpstreamSourceStatus: expect.objectContaining({
        "not-product-scoped": 42,
        "pinned-source-path-mapped": 0,
        "pinned-source-symbol-mapped": 856,
        "upstream-baseline-only": 0,
      }),
      byPinnedUpstreamBehaviorStatus: expect.objectContaining({
        "compatibility-export-only": 2,
        "local-evidence-tool-only": 3,
        "manual-behavior-check-pending": 1,
        "not-product-scoped": 36,
        "pinned-common-not-product-native": 70,
        "pinned-metadata-only": 95,
        "pinned-native-exact": 691,
        "pinned-partial-or-lossy": 0,
        "pinned-preview-only": 0,
      }),
      byPinnedUpstreamDivergenceKind: expect.objectContaining({
        "cadence-timing-partial": 0,
        "common-provider-not-product-native": 70,
        "compatibility-export-only": 2,
        "config-precedence-bridge": 0,
        "event-envelope-bridge": 0,
        "foundation-compatibility-overlay": 0,
        "generic-compatible-bridge": 0,
        "hook-plugin-bridge": 0,
        "identity-format-bridge": 0,
        "local-evidence-tool-only": 3,
        "manual-behavior-check-required": 1,
        "metadata-overlay-only": 95,
        "preview-surface-only": 0,
        "product-shell-bridge": 0,
        "product-turn-common-runner": 0,
        "prompt-family-partial": 0,
        "provider-stream-projection": 0,
        "runtime-acceptance-policy": 0,
        "session-storage-projection": 0,
        "tool-contract-projection": 0,
        "trace-projection": 0,
        "ui-surface-bridge": 0,
      }),
      byBehaviorExactDiffStatus: expect.objectContaining({
        "demotion-guard-only": 170,
        "exact-diff-missing": 0,
        "exact-diff-partial": 0,
        "manual-check-pending": 1,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 70,
        "metadata.executable-blocker": 95,
        "local-evidence.native-claim-guard": 3,
        "compat-export.api-surface-guard": 2,
        "manual.source-api-inspection": 1,
      }),
      byComparisonDimension: expect.objectContaining({
        "adapter-upgrade-fixture": 70,
        "common-provider-visibility": 70,
        "product-native-claim-negative": 70,
        "native-claim-negative": 100,
      }),
      byWorkQueueOwnerTODO: expect.objectContaining({
        "TODO-024": 0,
        "TODO-025": 16,
        "TODO-027": 8,
        "TODO-028": 27,
        "TODO-029": 9,
      }),
      bySourceVerificationStatus: expect.objectContaining({
        "manual-source-check-pending": 1,
        "metadata-overlay-source": 99,
        "preview-only-source": 0,
        "product-native-exact-fixture": 691,
        "semantic-fixture-with-lossiness": 7,
        "source-mapped-no-exact-fixture": 100,
      }),
    })
    expect(audit.upstreamBaselines).toContainEqual(
      expect.objectContaining({
        product: "opencode",
        pinnedRepo: "anomalyco/opencode",
        latestRepo: "anomalyco/opencode",
        latestHead: "bf05e8a1224d6560f7a441f70d09e0c77e50e931",
        driftStatus: "pinned-behind-latest-head",
      }),
    )
    expect(audit.upstreamBaselines).toContainEqual(
      expect.objectContaining({
        product: "hermes-agent",
        pinnedRepo: "NousResearch/hermes-agent",
        latestRepo: "NousResearch/hermes-agent",
        latestHead: "fa7f24e8980367c2ca849eb99e1eb2331c7d3699",
        driftStatus: "pinned-behind-latest-head",
      }),
    )
    expect(audit.upstreamBaselines).toContainEqual(
      expect.objectContaining({
        product: "nanobot",
        pinnedRepo: "HKUDS/nanobot",
        latestRepo: "HKUDS/nanobot",
        latestHead: "ffae1dca6d132020514f14ddb34e61705b5c54a1",
        driftStatus: "pinned-behind-latest-head",
      }),
    )
    expect(audit.summary.fingerprint).toMatch(/^[a-f0-9]{16}$/)
    expect(audit.productSummaries).toHaveLength(4)
    expect(audit.packageSummaries).toHaveLength(20)
    expect(audit.planeSummaries.length).toBeGreaterThanOrEqual(17)
    expect(audit.fixtureDiffQueue).toHaveLength(5)
    expect(audit.sourceFileFixtureQueue).toHaveLength(175)
    expect(audit.sourceOwnerLineLevelSummaries).toHaveLength(30)
    expect(audit.summary.sourceOwnerLineLevelSummaryItems).toBe(30)
    expect(audit.currentSourceFileSummaries).toHaveLength(168)
    expect(opencodeProductSummary).toMatchObject({
      product: "opencode",
      totalItems: 220,
      productAtomItems: 124,
      requiredBindingItems: 96,
      productNativeComplete: 108,
      upstreamSourceSymbolMapped: 220,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 22,
      manualCheckPending: 0,
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 22,
      }),
      byComparisonDimension: expect.objectContaining({
        "native-claim-negative": 22,
      }),
    })
    expect(piProductSummary).toMatchObject({
      product: "pi-mono",
      totalItems: 218,
      exactDiffMissing: 0,
      productNativeComplete: 111,
      exactDiffPartial: 0,
      demotionGuardOnly: 17,
    })
    expect(nanobotProductSummary).toMatchObject({
      product: "nanobot",
      totalItems: 197,
      productAtomItems: 101,
      exactDiffMissing: 0,
      productNativeComplete: 84,
      exactDiffPartial: 0,
      demotionGuardOnly: 58,
    })
    expect(hermesProductSummary).toMatchObject({
      product: "hermes-agent",
      totalItems: 194,
      exactDiffMissing: 0,
      productNativeComplete: 86,
      exactDiffPartial: 0,
      demotionGuardOnly: 53,
    })
    expect(agentLoopPackageSummary).toMatchObject({
      packagePath: "packages/lego-agent-loop",
      totalItems: 99,
      productAtomItems: 49,
      requiredBindingItems: 49,
      selectedTransitionAtoms: 47,
      productNativeComplete: 47,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 7,
      manualCheckPending: 0,
      packageSourceVerificationStatus: "metadata-overlay-source",
      products: expect.arrayContaining(["hermes-agent", "minimal", "nanobot", "opencode", "pi-mono"]),
      planes: expect.arrayContaining(["agent-loop", "turn"]),
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 4,
        "metadata.executable-blocker": 3,
      }),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 90,
        "semantic-fixture-with-lossiness": 0,
        "metadata-overlay-source": 3,
        "source-mapped-no-exact-fixture": 6,
      }),
    })
    expect(contractsPackageSummary).toMatchObject({
      packagePath: "packages/contracts",
      totalItems: 11,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 0,
      sourceOwnedItems: 67,
      sourceOwnedProductAtomItems: 28,
      sourceOwnedRequiredBindingItems: 27,
      sourceOwnedExactDiffMissing: 0,
      sourceOwnedExactDiffPartial: 0,
      sourceOwnedDemotionGuardOnly: 50,
      sourceOwnedManualCheckPending: 0,
      sourceOwnedCurrentSourceFileCount: 2,
      sampleSourceOwnedCurrentSourceFiles: ["packages/contracts/src/index.ts", "packages/contracts/src/port-fixtures.ts"],
      sourceOwnedProducts: expect.arrayContaining(["hermes-agent", "minimal", "nanobot", "opencode", "pi-mono"]),
      sourceOwnedPlanes: expect.arrayContaining(["event", "foundation", "identity", "product", "task", "trace"]),
      bySourceOwnedFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 50,
      }),
    })
    expect(legoHooksPackageSummary).toMatchObject({
      packagePath: "packages/lego-hooks",
      totalItems: 1,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 0,
      sourceOwnedItems: 2,
      sourceOwnedProductAtomItems: 0,
      sourceOwnedRequiredBindingItems: 0,
      sourceOwnedExactDiffMissing: 0,
      sourceOwnedExactDiffPartial: 0,
      sourceOwnedDemotionGuardOnly: 0,
      sourceOwnedManualCheckPending: 0,
      sourceOwnedCurrentSourceFileCount: 5,
      sampleSourceOwnedCurrentSourceFiles: expect.arrayContaining(["packages/lego-hooks/src/hook-atoms.ts", "packages/lego-hooks/src/host.ts", "packages/lego-hooks/src/port-fixtures.ts"]),
      sourceOwnedProducts: [],
      sourceOwnedPlanes: ["hook"],
      bySourceOwnedFixtureDiffTarget: {},
    })
    expect(opencodeAdapterPackageSummary).toMatchObject({
      packagePath: "packages/adapters-opencode",
      totalItems: 141,
      productAtomItems: 80,
      requiredBindingItems: 60,
      exactDiffMissing: 0,
      productNativeComplete: 71,
      exactDiffPartial: 0,
      demotionGuardOnly: 15,
      packagePinnedUpstreamBehaviorStatus: "pinned-metadata-only",
      packageSourceVerificationStatus: "metadata-overlay-source",
      products: ["opencode"],
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 15,
      }),
    })
    expect(cliPackageSummary).toMatchObject({
      packagePath: "packages/cli",
      totalItems: 1,
      productAtomItems: 0,
      requiredBindingItems: 0,
      manualCheckPending: 0,
      demotionGuardOnly: 1,
      packageMismatchKind: "manual-source-check-required",
      packagePinnedUpstreamBehaviorStatus: "local-evidence-tool-only",
      packageSourceVerificationStatus: "metadata-overlay-source",
      currentSourceFileCount: 1,
      sampleCurrentSourceFiles: ["packages/cli/src/index.ts"],
      byFixtureDiffTarget: expect.objectContaining({
        "local-evidence.native-claim-guard": 1,
      }),
    })
    expect(docsSitePackageSummary).toMatchObject({
      packagePath: "packages/docs-site",
      packageMismatchKind: "manual-source-check-required",
      packagePinnedUpstreamBehaviorStatus: "local-evidence-tool-only",
      packageSourceVerificationStatus: "metadata-overlay-source",
      manualCheckPending: 0,
      demotionGuardOnly: 1,
      currentSourceFileCount: 5,
      sampleCurrentSourceFiles: expect.arrayContaining(["packages/docs-site/src/index.ts", "packages/docs-site/src/server.ts", "packages/docs-site/src/tui-session.ts"]),
      byFixtureDiffTarget: expect.objectContaining({
        "local-evidence.native-claim-guard": 1,
      }),
    })
    expect(conformancePackageSummary).toMatchObject({
      packagePath: "packages/conformance",
      packageMismatchKind: "manual-source-check-required",
      packagePinnedUpstreamBehaviorStatus: "local-evidence-tool-only",
      packageSourceVerificationStatus: "metadata-overlay-source",
      manualCheckPending: 0,
      demotionGuardOnly: 1,
      currentSourceFileCount: 6,
      sampleCurrentSourceFiles: expect.arrayContaining([
        "packages/conformance/current-module-placeholder-audit.conformance.test.ts",
        "packages/conformance/executable-placeholder-audit.conformance.test.ts",
        "packages/conformance/fake-public-path.conformance.test.ts",
      ]),
    })
    expect(opencodePluginPackageSummary).toMatchObject({
      packagePath: "packages/opencode-plugin",
      packageMismatchKind: "manual-source-check-required",
      packagePinnedUpstreamBehaviorStatus: "compatibility-export-only",
      packageSourceVerificationStatus: "source-mapped-no-exact-fixture",
      manualCheckPending: 0,
      demotionGuardOnly: 1,
      currentSourceFileCount: 1,
      sampleCurrentSourceFiles: ["packages/opencode-plugin/src/index.ts"],
      byFixtureDiffTarget: expect.objectContaining({
        "compat-export.api-surface-guard": 1,
      }),
    })
    expect(piCodingAgentPackageSummary).toMatchObject({
      packagePath: "packages/pi-coding-agent",
      packageMismatchKind: "manual-source-check-required",
      packagePinnedUpstreamBehaviorStatus: "compatibility-export-only",
      packageSourceVerificationStatus: "source-mapped-no-exact-fixture",
      manualCheckPending: 0,
      demotionGuardOnly: 1,
      currentSourceFileCount: 1,
      sampleCurrentSourceFiles: ["packages/pi-coding-agent/src/index.ts"],
      byFixtureDiffTarget: expect.objectContaining({
        "compat-export.api-surface-guard": 1,
      }),
    })
    expect(agentLoopPlaneSummary).toMatchObject({
      plane: "agent-loop",
      totalItems: 123,
      productAtomItems: 60,
      requiredBindingItems: 62,
      selectedTransitionAtoms: 60,
      productNativeComplete: 60,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 4,
      manualCheckPending: 0,
      planeSourceVerificationStatus: "product-native-exact-fixture",
      packages: ["packages/adapters-opencode", "packages/lego-agent-loop"],
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 4,
      }),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 117,
        "semantic-fixture-with-lossiness": 0,
        "source-mapped-no-exact-fixture": 6,
      }),
    })
    expect(providerPlaneSummary).toMatchObject({
      plane: "provider",
      totalItems: 89,
      productAtomItems: 44,
      requiredBindingItems: 44,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 21,
      planeSourceVerificationStatus: "metadata-overlay-source",
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 12,
        "metadata.executable-blocker": 9,
      }),
    })
    expect(hookPlaneSummary).toMatchObject({
      plane: "hook",
      totalItems: 95,
      productAtomItems: 56,
      requiredBindingItems: 38,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 2,
      planeSourceVerificationStatus: "product-native-exact-fixture",
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 2,
      }),
    })
    expect(piExtensionSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-pi/src/extension-atoms.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 14,
      itemCount: 14,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 14,
      products: ["pi-mono"],
      packages: ["packages/adapters-pi"],
      planes: ["foundation", "product", "provider"],
      ownerTODOs: ["TODO-027", "TODO-028", "TODO-029"],
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 14,
      }),
      finding: expect.stringContaining("guarded as common/metadata/preview demotion"),
    })
    expect(piProviderSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-pi/src/product-schema/provider.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 22,
      itemCount: 22,
      productAtomItems: 10,
      requiredBindingItems: 10,
      selectedTransitionAtoms: 10,
      productNativeComplete: 10,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 2,
      products: ["pi-mono"],
      packages: ["packages/adapters-pi"],
      planes: ["provider"],
      ownerTODOs: expect.arrayContaining(["TODO-025", "TODO-027", "TODO-029"]),
      byImplementationLevel: expect.objectContaining({
        native: 20,
      }),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 20,
        "semantic-fixture-with-lossiness": 0,
        "metadata-overlay-source": 2,
        "preview-only-source": 0,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 2,
      }),
    })
    expect(piProductSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-pi/src/product-schema/pi.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 8,
      itemCount: 8,
      productAtomItems: 3,
      requiredBindingItems: 3,
      selectedTransitionAtoms: 3,
      productNativeComplete: 3,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: ["pi-mono"],
      packages: ["packages/adapters-pi"],
      planes: ["identity"],
      ownerTODOs: expect.arrayContaining(["TODO-025", "TODO-027", "TODO-029"]),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 7,
        "source-mapped-no-exact-fixture": 0,
        "metadata-overlay-source": 1,
        "preview-only-source": 0,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
    })
    expect(piEventSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-pi/src/product-schema/events.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 7,
      itemCount: 7,
      productAtomItems: 3,
      requiredBindingItems: 2,
      selectedTransitionAtoms: 3,
      productNativeComplete: 3,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: ["pi-mono"],
      packages: ["packages/adapters-pi"],
      planes: ["event"],
      ownerTODOs: expect.arrayContaining(["TODO-025", "TODO-027", "TODO-029"]),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 6,
        "semantic-fixture-with-lossiness": 0,
        "metadata-overlay-source": 1,
        "preview-only-source": 0,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
    })
    expect(piPromptSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-pi/src/product-schema/prompt.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 4,
      productAtomItems: 1,
      requiredBindingItems: 1,
      selectedTransitionAtoms: 1,
      productNativeComplete: 1,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 2,
      products: ["pi-mono"],
      packages: ["packages/adapters-pi"],
      planes: ["prompt"],
      byImplementationLevel: expect.objectContaining({
        native: 2,
      }),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 2,
        "semantic-fixture-with-lossiness": 0,
        "metadata-overlay-source": 2,
        "preview-only-source": 0,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 2,
      }),
    })
    expect(piProductShellSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-pi/src/product-schema/product-shell.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 14,
      itemCount: 14,
      productAtomItems: 11,
      requiredBindingItems: 1,
      selectedTransitionAtoms: 11,
      productNativeComplete: 11,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 2,
      products: ["pi-mono"],
      packages: ["packages/adapters-pi"],
      planes: ["product"],
      ownerTODOs: expect.arrayContaining(["TODO-025", "TODO-027", "TODO-029"]),
      byImplementationLevel: expect.objectContaining({
        native: 12,
      }),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 12,
        "metadata-overlay-source": 2,
        "preview-only-source": 0,
        "semantic-fixture-with-lossiness": 0,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 2,
      }),
    })
    expect(piTraceSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-pi/src/product-schema/trace.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 4,
      itemCount: 4,
      productAtomItems: 1,
      requiredBindingItems: 1,
      selectedTransitionAtoms: 1,
      productNativeComplete: 1,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 2,
      products: ["pi-mono"],
      packages: ["packages/adapters-pi"],
      planes: ["trace"],
      ownerTODOs: expect.arrayContaining(["TODO-025", "TODO-027", "TODO-029"]),
      byImplementationLevel: expect.objectContaining({
        native: 2,
      }),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 2,
        "semantic-fixture-with-lossiness": 0,
        "metadata-overlay-source": 2,
        "preview-only-source": 0,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 2,
      }),
    })
    expect(piExtensionAdapterSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-pi/src/extension-adapter.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 4,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 4,
      products: ["pi-mono"],
      packages: ["packages/adapters-pi"],
      planes: ["provider"],
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 4,
      }),
    })
    expect(nanobotAtomsSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-nanobot/src/nanobot-atoms.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 21,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 21,
      products: ["nanobot"],
      packages: ["packages/adapters-nanobot"],
      planes: expect.arrayContaining(["foundation", "product", "provider", "task", "trace"]),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 21,
      }),
    })
    expect(nanobotIdentitySchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-nanobot/src/product-schema/identity.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 8,
      itemCount: 8,
      productAtomItems: 3,
      requiredBindingItems: 3,
      selectedTransitionAtoms: 3,
      productNativeComplete: 3,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: ["nanobot"],
      packages: ["packages/adapters-nanobot"],
      planes: ["identity"],
      ownerTODOs: expect.arrayContaining(["TODO-025", "TODO-027", "TODO-029"]),
      byImplementationLevel: expect.objectContaining({
        native: 6,
      }),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 7,
        "source-mapped-no-exact-fixture": 0,
        "preview-only-source": 0,
        "semantic-fixture-with-lossiness": 0,
        "metadata-overlay-source": 1,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
    })
    expect(opencodePluginSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-opencode/src/plugin-atoms.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 21,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 20,
      products: ["opencode"],
      packages: ["packages/adapters-opencode"],
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 20,
      }),
    })
    expect(opencodePluginAdapterSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-opencode/src/plugin-adapter.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 4,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 4,
      products: ["opencode"],
      packages: ["packages/adapters-opencode"],
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 4,
      }),
    })
    expect(opencodePluginLoaderSourceSummary).toBeUndefined()
    expect(opencodeBuiltinProvidersSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-opencode/src/builtin-providers.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 4,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 4,
      products: ["opencode"],
      packages: ["packages/adapters-opencode"],
      planes: ["provider"],
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 4,
      }),
    })
    expect(hermesAtomsSourceSummary).toBeUndefined()
    expect(hermesIdentitySchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-hermes/src/product-schema/identity.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 8,
      itemCount: 8,
      productAtomItems: 3,
      requiredBindingItems: 3,
      selectedTransitionAtoms: 3,
      productNativeComplete: 3,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: ["hermes-agent"],
      packages: ["packages/adapters-hermes"],
      planes: ["identity"],
      ownerTODOs: expect.arrayContaining(["TODO-025", "TODO-027", "TODO-029"]),
      byImplementationLevel: expect.objectContaining({
        native: 6,
      }),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 7,
        "metadata-overlay-source": 1,
        "source-mapped-no-exact-fixture": 0,
        "preview-only-source": 0,
        "semantic-fixture-with-lossiness": 0,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
    })
    expect(hermesSessionSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-hermes/src/product-schema/session.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 18,
      itemCount: 18,
      productAtomItems: 8,
      requiredBindingItems: 8,
      selectedTransitionAtoms: 8,
      productNativeComplete: 8,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: ["hermes-agent"],
      packages: ["packages/adapters-hermes"],
      planes: ["session"],
      ownerTODOs: expect.arrayContaining(["TODO-025", "TODO-027", "TODO-029"]),
      byImplementationLevel: expect.objectContaining({
        native: 16,
      }),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 17,
        "metadata-overlay-source": 1,
        "semantic-fixture-with-lossiness": 0,
        "preview-only-source": 0,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
    })
    expect(hermesTraceSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-hermes/src/product-schema/trace.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 4,
      itemCount: 4,
      productAtomItems: 1,
      requiredBindingItems: 1,
      selectedTransitionAtoms: 1,
      productNativeComplete: 1,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 2,
      products: ["hermes-agent"],
      packages: ["packages/adapters-hermes"],
      planes: ["trace"],
      ownerTODOs: expect.arrayContaining(["TODO-025", "TODO-027", "TODO-029"]),
      byImplementationLevel: expect.objectContaining({
        native: 2,
      }),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 2,
        "metadata-overlay-source": 2,
        "semantic-fixture-with-lossiness": 0,
        "preview-only-source": 0,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 2,
      }),
    })
    expect(hermesEventSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-hermes/src/product-schema/events.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 6,
      itemCount: 6,
      productAtomItems: 2,
      requiredBindingItems: 2,
      selectedTransitionAtoms: 2,
      productNativeComplete: 2,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: ["hermes-agent"],
      packages: ["packages/adapters-hermes"],
      planes: ["event"],
      ownerTODOs: expect.arrayContaining(["TODO-025", "TODO-027", "TODO-029"]),
      byImplementationLevel: expect.objectContaining({
        native: 4,
      }),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 5,
        "metadata-overlay-source": 1,
        "semantic-fixture-with-lossiness": 0,
        "preview-only-source": 0,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
    })
    expect(hermesPluginSourceSummary).toBeUndefined()
    expect(hermesToolSourceSummary).toBeUndefined()
    expect(legoToolsHermesProductSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-tools/src/product-schema/hermes.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 22,
      itemCount: 22,
      productAtomItems: 13,
      requiredBindingItems: 6,
      selectedTransitionAtoms: 13,
      productNativeComplete: 13,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: ["hermes-agent"],
      packages: ["packages/lego-tools"],
      planes: ["foundation", "tool"],
      ownerTODOs: expect.arrayContaining(["TODO-025", "TODO-027", "TODO-029"]),
      byImplementationLevel: expect.objectContaining({
        native: 19,
      }),
      bySourceVerificationStatus: expect.objectContaining({
        "metadata-overlay-source": 1,
        "product-native-exact-fixture": 21,
        "semantic-fixture-with-lossiness": 0,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
    })
    expect(hermesProviderSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-hermes/src/atoms/provider.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 4,
      itemCount: 4,
      productAtomItems: 1,
      requiredBindingItems: 1,
      selectedTransitionAtoms: 1,
      productNativeComplete: 0,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 4,
      products: ["hermes-agent"],
      packages: ["packages/adapters-hermes"],
      planes: ["provider"],
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 4,
      }),
    })
    expect(hermesProviderSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-hermes/src/product-schema/provider.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 15,
      itemCount: 15,
      productAtomItems: 10,
      requiredBindingItems: 3,
      selectedTransitionAtoms: 10,
      productNativeComplete: 10,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 2,
      products: ["hermes-agent"],
      packages: ["packages/adapters-hermes"],
      planes: ["provider"],
      byImplementationLevel: expect.objectContaining({
        native: 13,
      }),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 13,
        "metadata-overlay-source": 2,
        "semantic-fixture-with-lossiness": 0,
        "preview-only-source": 0,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 2,
      }),
    })
    expect(hermesUISourceSummary).toBeUndefined()
    expect(hermesUISchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-hermes/src/product-schema/ui.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 14,
      productAtomItems: 6,
      selectedTransitionAtoms: 6,
      productNativeComplete: 6,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 2,
      products: ["hermes-agent"],
      packages: ["packages/adapters-hermes"],
      planes: ["product", "ui"],
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 12,
        "semantic-fixture-with-lossiness": 0,
        "metadata-overlay-source": 2,
        "preview-only-source": 0,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 2,
      }),
    })
    expect(hermesProductShellSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-hermes/src/product-schema/product-shell.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 11,
      productAtomItems: 8,
      selectedTransitionAtoms: 8,
      productNativeComplete: 8,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 2,
      products: ["hermes-agent"],
      packages: ["packages/adapters-hermes"],
      planes: ["product"],
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 9,
        "semantic-fixture-with-lossiness": 0,
        "metadata-overlay-source": 2,
        "preview-only-source": 0,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 2,
      }),
    })
    expect(hermesHooksFixtureSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-hooks/src/port-fixtures.ts",
      sourceOwnerPackagePath: "packages/lego-hooks",
      sourceOwnerPackageCatalogStatus: "catalog-package",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 2,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 0,
      products: [],
      packages: ["packages/lego-hooks"],
      byFixtureDiffTarget: {},
    })
    for (const summary of [legoHooksHostSourceSummary, legoHooksAtomsSourceSummary, legoHooksTypesSourceSummary, legoHooksAliasesSourceSummary]) {
      expect(summary).toMatchObject({
        sourceVerificationStatus: "source-mapped-no-exact-fixture",
        totalItems: 2,
        exactDiffMissing: 0,
        exactDiffPartial: 0,
        demotionGuardOnly: 0,
        products: [],
        packages: ["packages/lego-hooks"],
        planes: ["hook"],
        byFixtureDiffTarget: {},
      })
    }
    expect(hermesToolsFixtureSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-tools/src/port-fixtures.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 24,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 17,
      products: expect.arrayContaining(["opencode", "nanobot", "hermes-agent", "minimal"]),
      packages: ["packages/adapters-opencode", "packages/lego-tools"],
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 14,
        "metadata.executable-blocker": 3,
      }),
    })
    expect(legoToolsNanobotProductSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-tools/src/product-schema/nanobot.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 22,
      itemCount: 22,
      productAtomItems: 13,
      requiredBindingItems: 6,
      selectedTransitionAtoms: 13,
      productNativeComplete: 13,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: ["nanobot"],
      packages: ["packages/lego-tools"],
      planes: ["foundation", "tool"],
      byImplementationLevel: expect.objectContaining({
        native: 19,
      }),
      bySourceVerificationStatus: expect.objectContaining({
        "metadata-overlay-source": 1,
        "product-native-exact-fixture": 21,
        "semantic-fixture-with-lossiness": 0,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
    })
    expect(legoToolsToolAtomsSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-tools/src/tool-atoms.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 12,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 10,
      products: expect.arrayContaining(["nanobot", "hermes-agent"]),
      packages: ["packages/lego-tools"],
      planes: expect.arrayContaining(["foundation", "product", "tool"]),
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 8,
        "metadata.executable-blocker": 2,
      }),
    })
    expect(legoToolsDefaultToolsSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-tools/src/default-tools.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 18,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 14,
      products: expect.arrayContaining(["minimal", "nanobot", "hermes-agent"]),
      packages: ["packages/lego-tools"],
      planes: expect.arrayContaining(["foundation", "product", "tool"]),
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 12,
        "metadata.executable-blocker": 2,
      }),
    })
    expect(legoToolsPortsSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-tools/src/ports.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 12,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 10,
      products: expect.arrayContaining(["nanobot", "hermes-agent"]),
      packages: ["packages/lego-tools"],
      planes: expect.arrayContaining(["foundation", "product", "tool"]),
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 8,
        "metadata.executable-blocker": 2,
      }),
    })
    expect(legoToolsCadenceSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-tools/src/cadence-atoms.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 11,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 6,
      products: expect.arrayContaining(["minimal", "nanobot", "hermes-agent"]),
      packages: ["packages/lego-tools"],
      planes: ["tool"],
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 6,
      }),
    })
    expect(legoAgentLoopToolBatchSchedulerSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-agent-loop/src/cadence/tool-batch-scheduler.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 8,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 5,
      products: expect.arrayContaining(["opencode", "nanobot", "hermes-agent", "minimal"]),
      packages: expect.arrayContaining(["packages/lego-agent-loop", "packages/lego-tools"]),
      planes: expect.arrayContaining(["tool", "turn"]),
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 2,
        "metadata.executable-blocker": 3,
      }),
    })
    expect(legoAgentLoopToolStepSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-agent-loop/src/loop/tool-step.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 10,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 5,
      products: expect.arrayContaining(["nanobot", "hermes-agent"]),
      packages: expect.arrayContaining(["packages/lego-agent-loop", "packages/lego-tools"]),
      planes: expect.arrayContaining(["agent-loop", "tool"]),
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 4,
      }),
    })
    expect(legoAgentLoopPiProductSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-agent-loop/src/product-schema/pi.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 32,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: ["pi-mono"],
      packages: ["packages/lego-agent-loop"],
      planes: ["agent-loop"],
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 31,
        "semantic-fixture-with-lossiness": 0,
        "metadata-overlay-source": 1,
      }),
    })
    expect(hermesProviderFixtureSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-provider/src/port-fixtures.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 35,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 23,
      products: expect.arrayContaining(["opencode", "pi-mono", "nanobot", "hermes-agent"]),
      packages: expect.arrayContaining(["packages/adapters-opencode", "packages/adapters-pi", "packages/adapters-nanobot", "packages/adapters-hermes", "packages/lego-provider"]),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 13,
        "common-provider.native-claim-guard": 10,
      }),
    })
    expect(legoProviderPortsSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-provider/src/ports.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 13,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 11,
      products: expect.arrayContaining(["nanobot", "hermes-agent"]),
      packages: ["packages/lego-provider"],
      planes: expect.arrayContaining(["hook", "provider"]),
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 10,
        "metadata.executable-blocker": 1,
      }),
    })
    expect(legoProviderNormalizerSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-provider/src/normalizer.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 8,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 7,
      products: expect.arrayContaining(["nanobot", "hermes-agent"]),
      packages: ["packages/lego-provider"],
      planes: ["provider"],
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 6,
        "metadata.executable-blocker": 1,
      }),
    })
    expect(legoProviderOpenAICompatibleSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-provider/src/openai-compatible.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 8,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 7,
      products: expect.arrayContaining(["nanobot", "hermes-agent"]),
      packages: ["packages/lego-provider"],
      planes: ["provider"],
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 6,
        "metadata.executable-blocker": 1,
      }),
    })
    expect(legoProviderAnthropicSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-provider/src/anthropic.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 2,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: [],
      packages: ["packages/lego-provider"],
      planes: ["provider"],
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
    })
    expect(legoProviderGoogleSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-provider/src/google.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 2,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      packages: ["packages/lego-provider"],
      planes: ["provider"],
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
    })
    expect(legoProviderOpenRouterSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-provider/src/openrouter.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 2,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      packages: ["packages/lego-provider"],
      planes: ["provider"],
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
    })
    expect(legoConfigAtomsSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-config/src/config-atoms.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 3,
      itemCount: 3,
      productAtomItems: 0,
      requiredBindingItems: 0,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: [],
      packages: ["packages/lego-config"],
      planes: expect.arrayContaining(["config", "product"]),
      bySourceVerificationStatus: expect.objectContaining({
        "preview-only-source": 0,
        "semantic-fixture-with-lossiness": 0,
        "metadata-overlay-source": 1,
        "source-mapped-no-exact-fixture": 0,
        "product-native-exact-fixture": 2,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
      moduleConfirmationStatus: "demotion-guard-confirmed",
    })
    expect(legoConfigRuntimeSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-config/src/config.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 3,
      itemCount: 3,
      productAtomItems: 0,
      requiredBindingItems: 0,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: [],
      packages: ["packages/lego-config"],
      planes: expect.arrayContaining(["config", "product"]),
      bySourceVerificationStatus: expect.objectContaining({
        "preview-only-source": 0,
        "semantic-fixture-with-lossiness": 0,
        "metadata-overlay-source": 1,
        "source-mapped-no-exact-fixture": 0,
        "product-native-exact-fixture": 2,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
      moduleConfirmationStatus: "demotion-guard-confirmed",
    })
    expect(legoConfigPortFixtureSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-config/src/port-fixtures.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 3,
      itemCount: 3,
      productAtomItems: 0,
      requiredBindingItems: 0,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: [],
      packages: ["packages/lego-config"],
      planes: expect.arrayContaining(["config", "product"]),
      bySourceVerificationStatus: expect.objectContaining({
        "preview-only-source": 0,
        "semantic-fixture-with-lossiness": 0,
        "metadata-overlay-source": 1,
        "source-mapped-no-exact-fixture": 0,
        "product-native-exact-fixture": 2,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
      moduleConfirmationStatus: "demotion-guard-confirmed",
    })
    expect(legoConfigOpenCodeProductSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-config/src/product-schema/opencode.ts",
      sourceVerificationStatus: "product-native-exact-fixture",
      totalItems: 8,
      itemCount: 8,
      productAtomItems: 3,
      requiredBindingItems: 3,
      selectedTransitionAtoms: 3,
      productNativeComplete: 3,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 0,
      products: ["opencode"],
      packages: ["packages/lego-config"],
      planes: ["config"],
      ownerTODOs: expect.arrayContaining(["TODO-025", "TODO-027", "TODO-029"]),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 8,
        "semantic-fixture-with-lossiness": 0,
        "source-mapped-no-exact-fixture": 0,
      }),
      byFixtureDiffTarget: {},
      moduleConfirmationStatus: "no-open-divergence",
    })
    expect(legoConfigNanobotProductSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-config/src/product-schema/nanobot.ts",
      sourceVerificationStatus: "product-native-exact-fixture",
      totalItems: 8,
      itemCount: 8,
      productAtomItems: 3,
      requiredBindingItems: 3,
      selectedTransitionAtoms: 3,
      productNativeComplete: 3,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 0,
      products: ["nanobot"],
      packages: ["packages/lego-config"],
      planes: ["config"],
      ownerTODOs: expect.arrayContaining(["TODO-025", "TODO-027", "TODO-029"]),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 8,
        "semantic-fixture-with-lossiness": 0,
        "source-mapped-no-exact-fixture": 0,
      }),
      byFixtureDiffTarget: {},
      moduleConfirmationStatus: "no-open-divergence",
    })
    expect(legoConfigPiProductSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-config/src/product-schema/pi.ts",
      sourceVerificationStatus: "product-native-exact-fixture",
      totalItems: 8,
      itemCount: 8,
      productAtomItems: 3,
      requiredBindingItems: 3,
      selectedTransitionAtoms: 3,
      productNativeComplete: 3,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 0,
      products: ["pi-mono"],
      packages: ["packages/lego-config"],
      planes: ["config"],
      ownerTODOs: expect.arrayContaining(["TODO-025", "TODO-027", "TODO-029"]),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 8,
        "semantic-fixture-with-lossiness": 0,
        "source-mapped-no-exact-fixture": 0,
      }),
      byFixtureDiffTarget: {},
      moduleConfirmationStatus: "no-open-divergence",
    })
    expect(legoRuntimeIndexSourceSummary).toBeUndefined()
    expect(legoRuntimeRegistrySourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-runtime/src/registry.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 17,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 12,
      products: ["hermes-agent", "minimal", "nanobot"],
      packages: ["packages/lego-runtime"],
      planes: ["runtime"],
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 10,
        "metadata.executable-blocker": 2,
      }),
      finding: expect.stringContaining("demotion"),
    })
    expect(legoRuntimeAtomsSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-runtime/src/runtime-atoms.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 22,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 22,
      products: expect.arrayContaining(["opencode", "pi-mono", "nanobot", "hermes-agent"]),
      packages: ["packages/lego-runtime"],
      planes: ["runtime"],
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 22,
      }),
    })
    expect(legoRuntimePiProductSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-runtime/src/product-schema/pi.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 16,
      productAtomItems: 7,
      requiredBindingItems: 7,
      selectedTransitionAtoms: 7,
      productNativeComplete: 7,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 2,
      products: ["pi-mono"],
      packages: ["packages/lego-runtime"],
      planes: ["runtime"],
      ownerTODOs: expect.arrayContaining(["TODO-027", "TODO-029"]),
      byImplementationLevel: expect.objectContaining({
        native: 14,
      }),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 14,
        "semantic-fixture-with-lossiness": 0,
      }),
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 2,
      }),
    })
    expect(legoRuntimeAcceptanceSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-runtime/src/acceptance-controller.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 8,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 6,
      products: expect.arrayContaining(["nanobot", "hermes-agent", "minimal"]),
      packages: ["packages/lego-runtime"],
      planes: ["runtime"],
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 4,
        "metadata.executable-blocker": 2,
      }),
    })
    expect(legoRuntimePortFixtureSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-runtime/src/port-fixtures.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 43,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 36,
      products: expect.arrayContaining(["opencode", "pi-mono", "nanobot", "hermes-agent", "minimal"]),
      packages: ["packages/lego-runtime"],
      planes: ["runtime"],
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 14,
        "metadata.executable-blocker": 22,
      }),
    })
    expect(legoAgentLoopIndexSourceSummary).toBeUndefined()
    expect(legoAgentLoopProductTurnSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-agent-loop/src/product-turn/atoms.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 2,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: [],
      packages: ["packages/lego-agent-loop"],
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
      finding: expect.stringContaining("demotion"),
    })
    expect(legoAgentLoopRunTurnSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-agent-loop/src/loop/run-turn.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 2,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: [],
      packages: ["packages/lego-agent-loop"],
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
    })
    expect(legoUISourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-ui/src/ui-atoms.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 6,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 3,
      products: ["hermes-agent", "nanobot"],
      packages: ["packages/lego-ui"],
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 2,
        "metadata.executable-blocker": 1,
      }),
    })
    expect(legoUIOpenCodeProductSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-ui/src/product-schema/opencode.ts",
      sourceVerificationStatus: "product-native-exact-fixture",
      totalItems: 14,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 0,
      productNativeComplete: 6,
      products: ["opencode"],
      packages: ["packages/lego-ui"],
      byFixtureDiffTarget: {},
    })
    expect(legoUIPiProductSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-ui/src/product-schema/pi.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 16,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      productNativeComplete: 7,
      products: ["pi-mono"],
      packages: ["packages/lego-ui"],
      byFixtureDiffTarget: {
        "metadata.executable-blocker": 1,
      },
    })
    expect(legoUINanobotProductSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-ui/src/product-schema/nanobot.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 14,
      productAtomItems: 6,
      selectedTransitionAtoms: 6,
      productNativeComplete: 6,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: ["nanobot"],
      packages: ["packages/lego-ui"],
      planes: ["product", "ui"],
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 13,
        "semantic-fixture-with-lossiness": 0,
        "metadata-overlay-source": 1,
      }),
      byFixtureDiffTarget: {
        "metadata.executable-blocker": 1,
      },
    })
    expect(legoUITUIEventLoopSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-ui/src/tui-event-loop.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 6,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 3,
      products: ["hermes-agent", "nanobot"],
      packages: ["packages/lego-ui"],
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 2,
        "metadata.executable-blocker": 1,
      }),
    })
    expect(legoUITransportSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-ui/src/ui.ts",
      sourceVerificationStatus: "product-native-exact-fixture",
      totalItems: 2,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 0,
      products: [],
      packages: ["packages/lego-ui"],
      planes: ["ui"],
      byFixtureDiffTarget: {},
    })
    expect(legoUIPortFixtureSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-ui/src/port-fixtures.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 6,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 3,
      products: ["hermes-agent", "nanobot"],
      packages: ["packages/lego-ui"],
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 2,
        "metadata.executable-blocker": 1,
      }),
    })
    expect(atomCatalogSourceSummary).toMatchObject({
      currentSourceFile: "packages/recipes/src/atom-catalog.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 47,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 46,
      byFixtureDiffTarget: {
        "metadata.executable-blocker": 46,
      },
    })
    expect(bundleCatalogSourceSummary).toMatchObject({
      currentSourceFile: "packages/recipes/src/bundle-catalog.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 47,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 46,
      byFixtureDiffTarget: {
        "metadata.executable-blocker": 46,
      },
    })
    expect(opencodeSessionSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-opencode/src/product-schema/session.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 17,
      productNativeComplete: 8,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: ["opencode"],
      packages: ["packages/adapters-opencode"],
      planes: ["session"],
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 16,
        "semantic-fixture-with-lossiness": 0,
        "metadata-overlay-source": 1,
      }),
    })
    expect(piSessionSourceSummary).toBeUndefined()
    expect(nanobotSessionSourceSummary).toMatchObject({
      currentSourceFile: "packages/adapters-nanobot/src/product-schema/session.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 18,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: ["nanobot"],
      packages: ["packages/adapters-nanobot"],
      planes: ["session"],
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
    })
    expect(hermesSessionSourceSummary).toBeUndefined()
    expect(legoSessionAtomsSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-session/src/atoms.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 35,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 13,
      products: expect.arrayContaining(["opencode", "nanobot", "hermes-agent", "minimal"]),
      packages: expect.arrayContaining(["packages/adapters-opencode", "packages/lego-session"]),
      planes: ["session"],
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 12,
        "metadata.executable-blocker": 1,
      }),
    })
    expect(legoSessionJsonlTreeSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-session/src/jsonl-tree.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 11,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: ["opencode"],
      packages: expect.arrayContaining(["packages/adapters-opencode", "packages/lego-session"]),
      planes: ["session"],
      byFixtureDiffTarget: {
        "metadata.executable-blocker": 1,
      },
    })
    expect(legoSessionProjectionSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-session/src/projection.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 17,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 1,
      products: ["opencode"],
      packages: expect.arrayContaining(["packages/adapters-opencode", "packages/lego-session"]),
      planes: ["session"],
      byFixtureDiffTarget: {
        "metadata.executable-blocker": 1,
      },
    })
    expect(legoSessionMessagePartProjectorSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-session/src/message-part-projector.ts",
      sourceVerificationStatus: "semantic-fixture-with-lossiness",
      totalItems: 3,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 0,
      products: ["minimal"],
      packages: ["packages/lego-session"],
      planes: ["session"],
      byFixtureDiffTarget: {},
    })
    expect(legoSessionPiProductSchemaSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-session/src/product-schema/pi.ts",
      sourceVerificationStatus: "product-native-exact-fixture",
      totalItems: 33,
      productNativeComplete: 17,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 0,
      products: ["pi-mono"],
      packages: ["packages/lego-session"],
      planes: ["session"],
      byFixtureDiffTarget: {},
      bySourceVerificationStatus: expect.objectContaining({
        "product-native-exact-fixture": 33,
        "semantic-fixture-with-lossiness": 0,
      }),
    })
    expect(legoSessionTypesSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-session/src/types.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 35,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 13,
      products: expect.arrayContaining(["opencode", "nanobot", "hermes-agent", "minimal"]),
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 12,
        "metadata.executable-blocker": 1,
      }),
    })
    expect(legoSessionUtilsSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-session/src/utils.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 34,
      exactDiffMissing: 0,
      exactDiffPartial: 0,
      demotionGuardOnly: 13,
      products: expect.arrayContaining(["opencode", "nanobot", "hermes-agent", "minimal"]),
      byFixtureDiffTarget: expect.objectContaining({
        "common-provider.native-claim-guard": 12,
        "metadata.executable-blocker": 1,
      }),
    })
    expect(cliSourceSummary).toMatchObject({
      currentSourceFile: "packages/cli/src/index.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 1,
      manualCheckPending: 0,
      demotionGuardOnly: 1,
      packages: ["packages/cli"],
      ownerTODOs: ["TODO-029"],
      byFixtureDiffTarget: expect.objectContaining({
        "local-evidence.native-claim-guard": 1,
      }),
      finding: expect.stringContaining("demotion"),
    })
    expect(docsSiteIndexSourceSummary).toMatchObject({
      currentSourceFile: "packages/docs-site/src/index.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 1,
      manualCheckPending: 0,
      demotionGuardOnly: 1,
      packages: ["packages/docs-site"],
      ownerTODOs: ["TODO-029"],
      byFixtureDiffTarget: expect.objectContaining({
        "local-evidence.native-claim-guard": 1,
      }),
    })
    expect(conformanceAuditSourceSummary).toMatchObject({
      currentSourceFile: "packages/conformance/current-module-placeholder-audit.conformance.test.ts",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 1,
      manualCheckPending: 0,
      demotionGuardOnly: 1,
      packages: ["packages/conformance"],
      ownerTODOs: ["TODO-029"],
      byFixtureDiffTarget: expect.objectContaining({
        "local-evidence.native-claim-guard": 1,
      }),
    })
    expect(opencodePluginCompatSourceSummary).toMatchObject({
      currentSourceFile: "packages/opencode-plugin/src/index.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 1,
      manualCheckPending: 0,
      demotionGuardOnly: 1,
      packages: ["packages/opencode-plugin"],
      ownerTODOs: ["TODO-029"],
      byFixtureDiffTarget: expect.objectContaining({
        "compat-export.api-surface-guard": 1,
      }),
    })
    expect(piCodingAgentCompatSourceSummary).toMatchObject({
      currentSourceFile: "packages/pi-coding-agent/src/index.ts",
      sourceVerificationStatus: "source-mapped-no-exact-fixture",
      totalItems: 1,
      manualCheckPending: 0,
      demotionGuardOnly: 1,
      packages: ["packages/pi-coding-agent"],
      ownerTODOs: ["TODO-029"],
      byFixtureDiffTarget: expect.objectContaining({
        "compat-export.api-surface-guard": 1,
      }),
    })
    expect(piVirtualTaskSourceSummary).toMatchObject({
      currentSourceFile: "packages/pi-mono.task.runner.native-cli/src/index.ts",
      sourceOwnerPackagePath: "packages/pi-mono.task.runner.native-cli",
      sourceOwnerPackageCatalogStatus: "virtual-package",
      sourceVerificationStatus: "metadata-overlay-source",
      totalItems: 1,
      demotionGuardOnly: 1,
      ownerTODOs: ["TODO-027"],
      byFixtureDiffTarget: expect.objectContaining({
        "metadata.executable-blocker": 1,
      }),
    })
	    expect(piVirtualTaskSourceFixtureQueueItem).toMatchObject({
	      currentSourceFile: "packages/pi-mono.task.runner.native-cli/src/index.ts",
	      sourceOwnerPackagePath: "packages/pi-mono.task.runner.native-cli",
	      sourceOwnerPackageCatalogStatus: "virtual-package",
	      fixtureDiffTarget: "metadata.executable-blocker",
	      exactDiffStatus: "demotion-guard-only",
	      lineLevelDiffStatus: "demotion-guard-only",
	      itemCount: 1,
	      sampleItemIDs: ["plane:task"],
	      ownerTODOs: ["TODO-027"],
	      divergenceKinds: ["metadata-overlay-only"],
	      fixtureImplementationTarget: "preserve-guard:metadata.executable-blocker:packages/pi-mono.task.runner.native-cli/src/index.ts",
	      negativeVerificationTarget: "native-claim-guard:metadata.executable-blocker:packages/pi-mono.task.runner.native-cli/src/index.ts",
	    })
    expect(turnFixtureQueueItem).toBeUndefined()
    expect(hookFixtureQueueItem).toBeUndefined()
    expect(opencodeHookFixtureQueueItem).toBeUndefined()
    expect(toolFixtureQueueItem).toBeUndefined()
    expect(opencodeToolFixtureQueueItem).toBeUndefined()
    expect(sessionFixtureQueueItem).toBeUndefined()
    expect(providerFixtureQueueItem).toBeUndefined()
    expect(localEvidenceFixtureQueueItem).toMatchObject({
      fixtureDiffTarget: "local-evidence.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      priority: "P1-native-parity",
      itemCount: 3,
      products: [],
      planes: [],
      packages: expect.arrayContaining(["packages/cli", "packages/conformance", "packages/docs-site"]),
      ownerTODOs: ["TODO-029"],
      divergenceKinds: ["local-evidence-tool-only"],
      comparisonDimensions: expect.arrayContaining(["local-tooling", "evidence-only", "native-claim-negative", "upstream-nonapplicability"]),
      action: expect.stringContaining("Preserve demotion"),
    })
    expect(compatibilityExportFixtureQueueItem).toMatchObject({
      fixtureDiffTarget: "compat-export.api-surface-guard",
      exactDiffStatus: "demotion-guard-only",
      priority: "P1-native-parity",
      itemCount: 2,
      products: [],
      planes: [],
      packages: expect.arrayContaining(["packages/opencode-plugin", "packages/pi-coding-agent"]),
      ownerTODOs: ["TODO-029"],
      divergenceKinds: ["compatibility-export-only"],
      comparisonDimensions: expect.arrayContaining(["exported-api-name", "type-surface", "lifecycle-not-implemented", "native-claim-negative"]),
      upstreamAnchorRefs: expect.arrayContaining([expect.stringContaining("packages/core/src/plugin.ts"), expect.stringContaining("packages/coding-agent/src/core/extensions/types.ts")]),
    })
    expect(cliLocalEvidenceSourceFixtureQueueItem).toMatchObject({
      currentSourceFile: "packages/cli/src/index.ts",
      fixtureDiffTarget: "local-evidence.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      priority: "P1-native-parity",
      itemCount: 1,
      itemIDs: ["package:packages/cli"],
      packages: ["packages/cli"],
      ownerTODOs: ["TODO-029"],
      divergenceKinds: ["local-evidence-tool-only"],
      currentAnchorRefs: expect.arrayContaining(["current:packages/cli/src/index.ts", "current-ref:@helix/cli:command-router"]),
      upstreamAnchorRefs: ["not-upstream:local-evidence-tool:packages/cli"],
      action: expect.stringContaining("Preserve demotion guards"),
    })
    expect(docsSiteLocalEvidenceSourceFixtureQueueItem).toMatchObject({
      currentSourceFile: "packages/docs-site/src/index.ts",
      fixtureDiffTarget: "local-evidence.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      priority: "P1-native-parity",
      itemCount: 1,
      itemIDs: ["package:packages/docs-site"],
      packages: ["packages/docs-site"],
      ownerTODOs: ["TODO-029"],
      divergenceKinds: ["local-evidence-tool-only"],
      currentAnchorRefs: expect.arrayContaining(["current:packages/docs-site/src/index.ts", "current-ref:@helix/docs-site:builder-and-preview-surfaces"]),
      upstreamAnchorRefs: ["not-upstream:local-evidence-tool:packages/docs-site"],
    })
    expect(opencodePluginCompatSourceFixtureQueueItem).toMatchObject({
      currentSourceFile: "packages/opencode-plugin/src/index.ts",
      fixtureDiffTarget: "compat-export.api-surface-guard",
      exactDiffStatus: "demotion-guard-only",
      priority: "P1-native-parity",
      itemCount: 1,
      itemIDs: ["package:packages/opencode-plugin"],
      packages: ["packages/opencode-plugin"],
      ownerTODOs: ["TODO-029"],
      divergenceKinds: ["compatibility-export-only"],
      upstreamAnchorRefs: expect.arrayContaining([expect.stringContaining("packages/core/src/plugin.ts#PluginV2")]),
    })
    expect(piCodingAgentCompatSourceFixtureQueueItem).toMatchObject({
      currentSourceFile: "packages/pi-coding-agent/src/index.ts",
      fixtureDiffTarget: "compat-export.api-surface-guard",
      exactDiffStatus: "demotion-guard-only",
      priority: "P1-native-parity",
      itemCount: 1,
      itemIDs: ["package:packages/pi-coding-agent"],
      packages: ["packages/pi-coding-agent"],
      ownerTODOs: ["TODO-029"],
      divergenceKinds: ["compatibility-export-only"],
      upstreamAnchorRefs: expect.arrayContaining([expect.stringContaining("packages/coding-agent/src/core/extensions/types.ts#Extension")]),
    })
    expect(configMissingFixtureQueueItem).toBeUndefined()
    expect(configPartialFixtureQueueItem).toBeUndefined()
    expect(identityMissingFixtureQueueItem).toBeUndefined()
    expect(identityPartialFixtureQueueItem).toBeUndefined()
    expect(legoConfigAtomsSourceFixtureQueueItem).toBeUndefined()
    expect(legoConfigAtomsPartialSourceFixtureQueueItem).toBeUndefined()
    expect(legoConfigRuntimeSourceFixtureQueueItem).toBeUndefined()
    expect(legoConfigRuntimePartialSourceFixtureQueueItem).toBeUndefined()
    expect(legoConfigPortFixtureSourceFixtureQueueItem).toBeUndefined()
    expect(legoConfigPortFixturePartialSourceFixtureQueueItem).toBeUndefined()
    expect(legoConfigOpenCodeProductSchemaSourceFixtureQueueItem).toBeUndefined()
    expect(legoConfigNanobotProductSchemaSourceFixtureQueueItem).toBeUndefined()
    expect(legoConfigPiProductSchemaSourceFixtureQueueItem).toBeUndefined()
    expect(legoConfigPiProductSchemaPartialSourceFixtureQueueItem).toBeUndefined()
    expect(opencodePluginIdentitySourceFixtureQueueItem).toBeUndefined()
    expect(opencodeIdentitySchemaSourceFixtureQueueItem).toBeUndefined()
    expect(hermesProfileIdentitySourceFixtureQueueItem).toBeUndefined()
    expect(hermesTypesIdentitySourceFixtureQueueItem).toBeUndefined()
    expect(hermesIdentitySchemaSourceFixtureQueueItem).toBeUndefined()
    expect(nanobotAtomsIdentitySourceFixtureQueueItem).toBeUndefined()
    expect(nanobotIdentitySchemaSourceFixtureQueueItem).toBeUndefined()
    expect(piExtensionIdentitySourceFixtureQueueItem).toBeUndefined()
    expect(piProductSchemaIdentitySourceFixtureQueueItem).toBeUndefined()
    expect(contractsPortIdentityMissingSourceFixtureQueueItem).toBeUndefined()
    expect(contractsPortIdentityPartialSourceFixtureQueueItem).toBeUndefined()
    expect(contractsIndexIdentityPartialSourceFixtureQueueItem).toBeUndefined()
    expect(legoRuntimeRegistryCommonSourceFixtureQueueItem).toMatchObject({
      currentSourceFile: "packages/lego-runtime/src/registry.ts",
      fixtureDiffTarget: "common-provider.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      priority: "P2-demotion-guard",
      itemCount: 10,
      products: ["hermes-agent", "nanobot"],
      planes: ["runtime"],
      packages: ["packages/lego-runtime"],
      ownerTODOs: ["TODO-025"],
      divergenceKinds: ["common-provider-not-product-native"],
      comparisonDimensions: expect.arrayContaining(["adapter-upgrade-fixture", "common-provider-visibility", "product-native-claim-negative"]),
      action: expect.stringContaining("Preserve demotion guards in packages/lego-runtime/src/registry.ts"),
    })
    expect(legoRuntimeAtomsMetadataSourceFixtureQueueItem).toMatchObject({
      currentSourceFile: "packages/lego-runtime/src/runtime-atoms.ts",
      fixtureDiffTarget: "metadata.executable-blocker",
      exactDiffStatus: "demotion-guard-only",
      priority: "P2-demotion-guard",
      itemCount: 22,
      products: expect.arrayContaining(["opencode", "pi-mono", "nanobot", "hermes-agent"]),
      planes: ["runtime"],
      packages: ["packages/lego-runtime"],
      ownerTODOs: expect.arrayContaining(["TODO-027", "TODO-028", "TODO-029"]),
      divergenceKinds: ["metadata-overlay-only"],
      comparisonDimensions: expect.arrayContaining(["bom-annotation", "executable-blocker", "graph-annotation", "native-claim-negative"]),
      action: expect.stringContaining("Preserve demotion guards in packages/lego-runtime/src/runtime-atoms.ts"),
    })
    expect(legoRuntimeAcceptanceSourceFixtureQueueItem).toBeUndefined()
    expect(legoRuntimePortFixtureCommonSourceFixtureQueueItem).toMatchObject({
      currentSourceFile: "packages/lego-runtime/src/port-fixtures.ts",
      fixtureDiffTarget: "common-provider.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      priority: "P2-demotion-guard",
      itemCount: 14,
      products: ["hermes-agent", "nanobot"],
      planes: ["runtime"],
      packages: ["packages/lego-runtime"],
      ownerTODOs: ["TODO-025"],
      divergenceKinds: ["common-provider-not-product-native"],
      comparisonDimensions: expect.arrayContaining(["adapter-upgrade-fixture", "common-provider-visibility", "product-native-claim-negative"]),
      action: expect.stringContaining("Preserve demotion guards in packages/lego-runtime/src/port-fixtures.ts"),
    })
    expect(legoRuntimePortFixtureMetadataSourceFixtureQueueItem).toMatchObject({
      currentSourceFile: "packages/lego-runtime/src/port-fixtures.ts",
      fixtureDiffTarget: "metadata.executable-blocker",
      exactDiffStatus: "demotion-guard-only",
      priority: "P2-demotion-guard",
      itemCount: 22,
      products: expect.arrayContaining(["opencode", "pi-mono", "nanobot", "hermes-agent"]),
      planes: ["runtime"],
      packages: ["packages/lego-runtime"],
      ownerTODOs: expect.arrayContaining(["TODO-027", "TODO-028", "TODO-029"]),
      divergenceKinds: ["metadata-overlay-only"],
      comparisonDimensions: expect.arrayContaining(["bom-annotation", "executable-blocker", "graph-annotation", "native-claim-negative"]),
      action: expect.stringContaining("Preserve demotion guards in packages/lego-runtime/src/port-fixtures.ts"),
    })
    expect(legoRuntimePortFixtureAcceptanceSourceFixtureQueueItem).toBeUndefined()
    expect(agentLoopSourceFixtureQueueItem).toBeUndefined()
    expect(agentLoopIndexSourceFixtureQueueItem).toBeUndefined()
    expect(opencodePluginToolSourceFixtureQueueItem).toBeUndefined()
    expect(opencodePluginAdapterToolSourceFixtureQueueItem).toBeUndefined()
    expect(opencodePluginAdapterHookSourceFixtureQueueItem).toBeUndefined()
    expect(opencodePluginLoaderHookSourceFixtureQueueItem).toBeUndefined()
    expect(piExtensionAdapterToolSourceFixtureQueueItem).toBeUndefined()
    expect(nanobotAtomsToolSourceFixtureQueueItem).toBeUndefined()
    expect(sharedHooksPortFixtureQueueItem).toBeUndefined()
    expect(sharedHooksPortPartialFixtureQueueItem).toBeUndefined()
    expect(legoHooksHostHookSourceFixtureQueueItem).toBeUndefined()
    expect(legoHooksHostPartialHookSourceFixtureQueueItem).toBeUndefined()
    expect(legoHooksAtomsHookSourceFixtureQueueItem).toBeUndefined()
    expect(legoHooksAtomsPartialHookSourceFixtureQueueItem).toBeUndefined()
    expect(hermesAtomsSourceFixtureQueueItem).toBeUndefined()
    expect(hermesPluginHookSourceFixtureQueueItem).toBeUndefined()
    expect(hermesToolsPortFixtureQueueItem).toBeUndefined()
    expect(opencodeToolsPortFixtureQueueItem).toBeUndefined()
    expect(legoToolsPortFixturesCommonSourceFixtureQueueItem).toMatchObject({
      currentSourceFile: "packages/lego-tools/src/port-fixtures.ts",
      fixtureDiffTarget: "common-provider.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      priority: "P2-demotion-guard",
      itemCount: 14,
      products: expect.arrayContaining(["nanobot", "hermes-agent"]),
      planes: expect.arrayContaining(["product", "tool"]),
      packages: ["packages/lego-tools"],
      ownerTODOs: ["TODO-025"],
      divergenceKinds: ["common-provider-not-product-native"],
      comparisonDimensions: expect.arrayContaining(["adapter-upgrade-fixture", "common-provider-visibility", "product-native-claim-negative"]),
      action: expect.stringContaining("Preserve demotion guards in packages/lego-tools/src/port-fixtures.ts"),
    })
    expect(legoToolsPortFixturesCadenceSourceFixtureQueueItem).toBeUndefined()
    expect(legoToolsToolAtomsCommonSourceFixtureQueueItem).toMatchObject({
      currentSourceFile: "packages/lego-tools/src/tool-atoms.ts",
      fixtureDiffTarget: "common-provider.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      priority: "P2-demotion-guard",
      itemCount: 8,
      products: expect.arrayContaining(["nanobot", "hermes-agent"]),
      planes: expect.arrayContaining(["product", "tool"]),
      packages: ["packages/lego-tools"],
      ownerTODOs: ["TODO-025"],
      divergenceKinds: ["common-provider-not-product-native"],
      comparisonDimensions: expect.arrayContaining(["adapter-upgrade-fixture", "common-provider-visibility", "product-native-claim-negative"]),
      action: expect.stringContaining("Preserve demotion guards in packages/lego-tools/src/tool-atoms.ts"),
    })
    expect(legoToolsDefaultToolsCommonSourceFixtureQueueItem).toMatchObject({
      currentSourceFile: "packages/lego-tools/src/default-tools.ts",
      fixtureDiffTarget: "common-provider.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      priority: "P2-demotion-guard",
      itemCount: 12,
      products: expect.arrayContaining(["nanobot", "hermes-agent"]),
      planes: expect.arrayContaining(["product", "tool"]),
      packages: ["packages/lego-tools"],
      ownerTODOs: ["TODO-025"],
      divergenceKinds: ["common-provider-not-product-native"],
      comparisonDimensions: expect.arrayContaining(["adapter-upgrade-fixture", "common-provider-visibility", "product-native-claim-negative"]),
      action: expect.stringContaining("Preserve demotion guards in packages/lego-tools/src/default-tools.ts"),
    })
    expect(legoToolsDefaultToolsCadenceSourceFixtureQueueItem).toBeUndefined()
    expect(legoToolsPortsCommonSourceFixtureQueueItem).toMatchObject({
      currentSourceFile: "packages/lego-tools/src/ports.ts",
      fixtureDiffTarget: "common-provider.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      priority: "P2-demotion-guard",
      itemCount: 8,
      products: expect.arrayContaining(["nanobot", "hermes-agent"]),
      planes: expect.arrayContaining(["product", "tool"]),
      packages: ["packages/lego-tools"],
      ownerTODOs: ["TODO-025"],
      divergenceKinds: ["common-provider-not-product-native"],
      comparisonDimensions: expect.arrayContaining(["adapter-upgrade-fixture", "common-provider-visibility", "product-native-claim-negative"]),
      action: expect.stringContaining("Preserve demotion guards in packages/lego-tools/src/ports.ts"),
    })
    expect(legoToolsCadencePartialSourceFixtureQueueItem).toBeUndefined()
    expect(legoToolsCadenceCommonSourceFixtureQueueItem).toMatchObject({
      currentSourceFile: "packages/lego-tools/src/cadence-atoms.ts",
      fixtureDiffTarget: "common-provider.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      priority: "P2-demotion-guard",
      itemCount: 6,
      products: expect.arrayContaining(["nanobot", "hermes-agent"]),
      planes: ["tool"],
      packages: ["packages/lego-tools"],
      ownerTODOs: ["TODO-025"],
      divergenceKinds: ["common-provider-not-product-native"],
      comparisonDimensions: expect.arrayContaining(["adapter-upgrade-fixture", "common-provider-visibility", "product-native-claim-negative"]),
      action: expect.stringContaining("Preserve demotion guards in packages/lego-tools/src/cadence-atoms.ts"),
    })
    expect(legoAgentLoopToolBatchSchedulerPartialSourceFixtureQueueItem).toBeUndefined()
    expect(legoAgentLoopToolStepCadenceSourceFixtureQueueItem).toBeUndefined()
    expect(hermesProviderPortFixtureQueueItem).toBeUndefined()
    expect(legoProviderPortsCommonSourceFixtureQueueItem).toMatchObject({
      currentSourceFile: "packages/lego-provider/src/ports.ts",
      fixtureDiffTarget: "common-provider.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      priority: "P2-demotion-guard",
      itemCount: 10,
      products: expect.arrayContaining(["nanobot", "hermes-agent"]),
      planes: expect.arrayContaining(["hook", "provider"]),
      packages: ["packages/lego-provider"],
      ownerTODOs: ["TODO-025"],
      divergenceKinds: ["common-provider-not-product-native"],
      comparisonDimensions: expect.arrayContaining(["adapter-upgrade-fixture", "common-provider-visibility", "product-native-claim-negative"]),
      action: expect.stringContaining("Preserve demotion guards in packages/lego-provider/src/ports.ts"),
    })
    expect(legoProviderNormalizerCommonSourceFixtureQueueItem).toMatchObject({
      currentSourceFile: "packages/lego-provider/src/normalizer.ts",
      fixtureDiffTarget: "common-provider.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      priority: "P2-demotion-guard",
      itemCount: 6,
      products: expect.arrayContaining(["nanobot", "hermes-agent"]),
      planes: ["provider"],
      packages: ["packages/lego-provider"],
      ownerTODOs: ["TODO-025"],
      divergenceKinds: ["common-provider-not-product-native"],
      comparisonDimensions: expect.arrayContaining(["adapter-upgrade-fixture", "common-provider-visibility", "product-native-claim-negative"]),
      action: expect.stringContaining("Preserve demotion guards in packages/lego-provider/src/normalizer.ts"),
    })
    expect(legoProviderOpenAICommonSourceFixtureQueueItem).toMatchObject({
      currentSourceFile: "packages/lego-provider/src/openai-compatible.ts",
      fixtureDiffTarget: "common-provider.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      priority: "P2-demotion-guard",
      itemCount: 6,
      products: expect.arrayContaining(["nanobot", "hermes-agent"]),
      planes: ["provider"],
      packages: ["packages/lego-provider"],
      ownerTODOs: ["TODO-025"],
      divergenceKinds: ["common-provider-not-product-native"],
      comparisonDimensions: expect.arrayContaining(["adapter-upgrade-fixture", "common-provider-visibility", "product-native-claim-negative"]),
      action: expect.stringContaining("Preserve demotion guards in packages/lego-provider/src/openai-compatible.ts"),
    })
    expect(legoProviderAnthropicCommonSourceFixtureQueueItem).toBeUndefined()
    expect(legoProviderGooglePartialSourceFixtureQueueItem).toBeUndefined()
    expect(legoProviderOpenRouterPartialSourceFixtureQueueItem).toBeUndefined()
    expect(uiSourceFixtureQueueItem).toBeUndefined()
    expect(uiTUIEventLoopSourceFixtureQueueItem).toBeUndefined()
    expect(uiTransportSourceFixtureQueueItem).toBeUndefined()
    expect(legoSessionAtomsSourceFixtureQueueItem).toBeUndefined()
    expect(legoSessionJsonlTreeSourceFixtureQueueItem).toBeUndefined()
    expect(legoSessionProjectionSourceFixtureQueueItem).toBeUndefined()
    expect(legoSessionMessagePartProjectorSourceFixtureQueueItem).toBeUndefined()
    expect(opencodeSessionSourceFixtureQueueItem).toBeUndefined()
    expect(piSessionSourceFixtureQueueItem).toBeUndefined()
    expect(nanobotSessionSourceFixtureQueueItem).toBeUndefined()
    expect(hermesSessionSourceFixtureQueueItem).toBeUndefined()
    expect(hermesSessionSchemaSourceFixtureQueueItem).toBeUndefined()
    expect(opencodePrompt).toMatchObject({
      ownerTODO: "TODO-027",
      evidenceStrength: "todo27-inventory",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      upstreamDriftStatus: "pinned-behind-latest-head",
      upstreamBaselineRefs: expect.arrayContaining([
        "pinned:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
        "latest:anomalyco/opencode@bf05e8a1224d6560f7a441f70d09e0c77e50e931",
      ]),
      currentSourcePaths: expect.arrayContaining(["adapters-opencode:./opencode-prompt-mode-builder:opencode.prompt.mode-builder"]),
      currentSourceFiles: expect.arrayContaining(["packages/adapters-opencode/src/opencode-prompt-mode-builder.ts"]),
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          repo: "anomalyco/opencode",
          ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
          path: "packages/opencode/src/session/system.ts",
          symbols: expect.arrayContaining(["provider", "Interface", "Service", "layer", "defaultLayer", "SystemPrompt"]),
          evidence: "github-tree:2026-06-10",
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/prompt.ts",
          symbols: expect.arrayContaining(["PromptInput", "LoopInput", "createStructuredOutputTool"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/prompt/reference.ts",
          symbols: expect.arrayContaining(["ReferencePromptMetadata", "referencePromptMetadata", "referenceTextPart", "ReferencePrompt"]),
        }),
      ]),
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      pinnedUpstreamDivergences: [],
      sourceVerificationStatus: "product-native-exact-fixture",
      nextAction: "Run source-level check against pinned upstream and latest HEAD.",
      evidenceRefs: expect.arrayContaining([
        "fixture:opencode-prompt:resource-policy",
        "fixture:opencode-prompt:system-output-ordering",
        "fixture:opencode-prompt:rendered-system-output",
        "fixture:opencode-prompt:upstream-system-matrix",
        "fixture:opencode-prompt:upstream-system-output-matrix",
        "native-evidence:conformance:opencode-prompt-resource-policy",
        "native-evidence:conformance:opencode-system-prompt-ordering",
        "native-evidence:conformance:opencode-rendered-system-prompt",
        "native-evidence:conformance:opencode-upstream-system-prompt-matrix",
        "native-evidence:conformance:opencode-upstream-system-prompt-output-matrix",
      ]),
      knownLossiness: [],
    })
    expect(piPrompt).toMatchObject({
      ownerTODO: "TODO-027",
      evidenceStrength: "todo27-inventory",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      currentSourcePaths: expect.arrayContaining(["adapters-pi:./product-schema/prompt:pi.prompt.coding-agent-builder"]),
      currentSourceFiles: expect.arrayContaining(["packages/adapters-pi/src/product-schema/prompt.ts"]),
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "pi-mono",
          repo: "earendil-works/pi",
          path: "packages/agent/src/harness/system-prompt.ts",
          symbols: expect.arrayContaining(["formatSkillsForSystemPrompt", "escapeXml"]),
        }),
        expect.objectContaining({
          product: "pi-mono",
          repo: "earendil-works/pi",
          path: "packages/agent/src/harness/prompt-templates.ts",
          symbols: expect.arrayContaining(["PromptTemplateDiagnosticCode", "loadPromptTemplates", "formatPromptTemplateInvocation"]),
        }),
        expect.objectContaining({
          product: "pi-mono",
          repo: "earendil-works/pi",
          path: ".pi/prompts/cl.md",
          symbols: expect.arrayContaining(["CL_PROMPT_TEMPLATE", "Process", "ChangelogFormatReference"]),
        }),
        expect.objectContaining({
          product: "pi-mono",
          repo: "earendil-works/pi",
          path: ".pi/extensions/prompt-url-widget.ts",
          symbols: expect.arrayContaining(["PR_PROMPT_PATTERN", "ISSUE_PROMPT_PATTERN", "promptUrlWidgetExtension"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
      evidenceRefs: expect.arrayContaining([
        "fixture:pi-prompt:family-matrix",
        "fixture:pi-prompt:native-exact-fixture",
        "fixture:pi-prompt:upstream-source-matrix",
        "native-evidence:conformance:pi-prompt-family-matrix",
        "native-evidence:conformance:pi-prompt-native-exact-fixture",
        "native-evidence:conformance:pi-prompt-upstream-source-matrix",
        "native-evidence:prompt-native-exact:pi-mono",
      ]),
      knownLossiness: [],
      nextAction: "Run source-level check against pinned upstream and latest HEAD.",
    })
    expect(nanobotPrompt).toMatchObject({
      ownerTODO: "TODO-027",
      mismatchKind: "upstream-head-drift-unchecked",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      sourceVerificationStatus: "product-native-exact-fixture",
      currentSourceFiles: ["packages/lego-prompt/src/product-schema/nanobot.ts"],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/utils/prompt_templates.py",
          symbols: expect.arrayContaining(["_TEMPLATES_ROOT", "_environment", "render_template"]),
        }),
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/templates/AGENTS.md",
          symbols: expect.arrayContaining(["AGENTS_TEMPLATE", "AgentInstructions", "ScheduledReminders", "HeartbeatTasks"]),
        }),
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/templates/TOOLS.md",
          symbols: expect.arrayContaining(["TOOLS_TEMPLATE", "ToolUsageNotes", "ExecSafetyLimits"]),
        }),
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/templates/memory/MEMORY.md",
          symbols: expect.arrayContaining(["MEMORY_TEMPLATE", "LongTermMemory", "ProjectContext", "ImportantNotes"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
      evidenceRefs: expect.arrayContaining([
        "fixture:nanobot-prompt:native-exact-fixture",
        "fixture:nanobot-prompt:upstream-source-matrix",
        "native-evidence:conformance:nanobot-prompt-native-exact-fixture",
        "native-evidence:conformance:nanobot-prompt-upstream-source-matrix",
        "native-evidence:prompt-native-exact:nanobot",
      ]),
      knownLossiness: [],
    })
    expect(hermesPrompt).toMatchObject({
      ownerTODO: "TODO-027",
      mismatchKind: "upstream-head-drift-unchecked",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      sourceVerificationStatus: "product-native-exact-fixture",
      currentSourceFiles: ["packages/lego-prompt/src/product-schema/hermes.ts"],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "hermes-agent",
          path: "agent/system_prompt.py",
          symbols: expect.arrayContaining(["build_system_prompt_parts", "build_system_prompt", "invalidate_system_prompt", "format_tools_for_system_message"]),
        }),
        expect.objectContaining({
          product: "hermes-agent",
          path: "agent/prompt_builder.py",
          symbols: expect.arrayContaining(["DEFAULT_AGENT_IDENTITY", "PLATFORM_HINTS", "build_environment_hints", "build_skills_system_prompt"]),
        }),
        expect.objectContaining({
          product: "hermes-agent",
          path: "agent/skill_bundles.py",
          symbols: expect.arrayContaining(["scan_bundles", "get_skill_bundles", "build_bundle_invocation_message", "get_bundle"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
      evidenceRefs: expect.arrayContaining([
        "fixture:hermes-prompt:native-exact-fixture",
        "fixture:hermes-prompt:registry-snapshot",
        "fixture:hermes-prompt:upstream-registry-source-matrix",
        "native-evidence:conformance:hermes-prompt-native-exact-fixture",
        "native-evidence:conformance:hermes-prompt-registry-snapshot",
        "native-evidence:conformance:hermes-prompt-upstream-registry-source-matrix",
        "native-evidence:prompt-native-exact:hermes-agent",
      ]),
      knownLossiness: [],
    })
    expect(opencodeFoundation).toMatchObject({
      ownerTODO: "TODO-027",
      mismatchKind: "upstream-head-drift-unchecked",
      implementationLevel: "native",
      parityCoverage: "native",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      evidenceRefs: expect.arrayContaining([
        "fixture:opencode-tool:native-exact-fixture",
        "native-evidence:conformance:opencode-tool-native-exact-fixture",
        "native-evidence:tool-native-exact:opencode",
      ]),
      knownLossiness: [],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/tool/registry.ts",
          symbols: expect.arrayContaining(["ToolRegistry", "state", "tools", "fromPlugin"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/tools.ts",
          symbols: expect.arrayContaining(["SessionTools", "resolve"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/processor.ts",
          symbols: expect.arrayContaining(["SessionProcessor", "process"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/tool/tool.ts",
          symbols: expect.arrayContaining(["Tool", "define", "InvalidArgumentsError"]),
        }),
      ]),
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      pinnedUpstreamDivergences: [],
    })
    expect(piFoundation).toMatchObject({
      ownerTODO: "TODO-027",
      mismatchKind: "upstream-head-drift-unchecked",
      implementationLevel: "native",
      parityCoverage: "native",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "pi-mono",
          path: "packages/coding-agent/src/config.ts",
          symbols: expect.arrayContaining(["InstallMethod", "SelfUpdateCommand", "detectInstallMethod", "getSelfUpdateCommand", "APP_NAME", "CONFIG_DIR_NAME", "VERSION"]),
        }),
        expect.objectContaining({
          product: "pi-mono",
          path: "packages/coding-agent/docs/session-format.md",
          symbols: expect.arrayContaining(["SessionFileFormat", "SessionHeader", "SessionMessageEntry", "SessionManagerAPI"]),
        }),
      ]),
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      pinnedUpstreamDivergences: [],
      sourceVerificationStatus: "product-native-exact-fixture",
      currentSourceFiles: expect.arrayContaining(["packages/adapters-pi/src/product-schema/tools.ts"]),
      evidenceRefs: expect.arrayContaining([
        "fixture:pi-tool-pack-compatibility:native-exact-fixture",
        "native-evidence:conformance:pi-tool-pack-compatibility-native-exact-fixture",
        "native-evidence:tool-pack-compatibility-native-exact:pi-mono",
      ]),
      knownLossiness: [],
    })
    expect(nanobotFoundation).toMatchObject({
      ownerTODO: "TODO-027",
      mismatchKind: "upstream-head-drift-unchecked",
      implementationLevel: "native",
      parityCoverage: "native",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/config/schema.py",
          symbols: expect.arrayContaining(["Base", "AgentDefaults", "ProvidersConfig", "ToolsConfig", "Config", "resolve_preset", "get_provider"]),
        }),
        expect.objectContaining({
          product: "nanobot",
          path: "docs/configuration.md",
          symbols: expect.arrayContaining(["Configuration", "Providers", "ModelPresets", "WebTools", "MCP", "Security"]),
        }),
      ]),
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      pinnedUpstreamDivergences: [],
      sourceVerificationStatus: "product-native-exact-fixture",
      currentSourceFiles: expect.arrayContaining(["packages/lego-tools/src/product-schema/nanobot.ts"]),
      evidenceRefs: expect.arrayContaining([
        "fixture:nanobot-tool:native-exact-fixture",
        "native-evidence:conformance:nanobot-tool-native-exact-fixture",
        "native-evidence:tool-native-exact:nanobot",
      ]),
      knownLossiness: [],
    })
    expect(hermesFoundation).toMatchObject({
      ownerTODO: "TODO-027",
      mismatchKind: "upstream-head-drift-unchecked",
      implementationLevel: "native",
      parityCoverage: "native",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "hermes-agent",
          path: "cli.py",
          symbols: expect.arrayContaining(["load_cli_config", "CLI_CONFIG", "ChatConsole", "HermesCLI", "main"]),
        }),
        expect.objectContaining({
          product: "hermes-agent",
          path: "hermes_cli/_parser.py",
          symbols: expect.arrayContaining(["PRE_ARGPARSE_INHERITED_FLAGS", "_inherited_flag", "_EPILOGUE", "build_top_level_parser"]),
        }),
      ]),
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      pinnedUpstreamDivergences: [],
      sourceVerificationStatus: "product-native-exact-fixture",
      currentSourceFiles: expect.arrayContaining(["packages/lego-tools/src/product-schema/hermes.ts"]),
      evidenceRefs: expect.arrayContaining([
        "fixture:hermes-tool:native-exact-fixture",
        "native-evidence:conformance:hermes-tool-native-exact-fixture",
        "native-evidence:tool-native-exact:hermes-agent",
      ]),
      knownLossiness: [],
    })
    expect(opencodeConfig).toMatchObject({
      ownerTODO: "TODO-027",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      evidenceRefs: expect.arrayContaining([
        "fixture:opencode-config:native-exact-fixture",
        "native-evidence:config-native-exact:opencode",
        "native-evidence:conformance:opencode-config-native-exact-fixture",
        expect.stringContaining("native-evidence:upstream:https://github.com/anomalyco/opencode@"),
      ]),
      knownLossiness: [],
      currentSourceFiles: ["packages/lego-config/src/product-schema/opencode.ts"],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/config/skills.ts",
          symbols: expect.arrayContaining(["Info", "ConfigSkills"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/core/src/plugin/env.ts",
          symbols: expect.arrayContaining(["EnvPlugin"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
    })
    expect(piConfig).toMatchObject({
      ownerTODO: "TODO-027",
      implementationKind: "factory",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      currentSourceFiles: ["packages/lego-config/src/product-schema/pi.ts"],
      evidenceRefs: expect.arrayContaining([
        "fixture:pi-config:native-exact-fixture",
        "native-evidence:config-native-exact:pi-mono",
        "native-evidence:conformance:pi-config-native-exact-fixture",
        expect.stringContaining("native-evidence:upstream:https://github.com/earendil-works/pi@"),
      ]),
      knownLossiness: [],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "pi-mono",
          path: "packages/coding-agent/src/config.ts",
          symbols: expect.arrayContaining(["InstallMethod", "detectInstallMethod", "getSelfUpdateCommand", "APP_NAME", "CONFIG_DIR_NAME", "getAgentDir", "getSettingsPath", "getSessionsDir"]),
        }),
        expect.objectContaining({
          product: "pi-mono",
          path: "packages/coding-agent/src/cli/config-selector.ts",
          symbols: expect.arrayContaining(["ConfigSelectorOptions", "selectConfig"]),
        }),
        expect.objectContaining({
          product: "pi-mono",
          path: "packages/coding-agent/src/core/resolve-config-value.ts",
          symbols: expect.arrayContaining(["resolveConfigValue", "resolveConfigValueOrThrow", "resolveHeaders", "clearConfigValueCache"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
    })
    expect(nanobotConfig).toMatchObject({
      ownerTODO: "TODO-027",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      evidenceRefs: expect.arrayContaining(["fixture:nanobot-config:native-exact-fixture", "native-evidence:conformance:nanobot-config-native-exact-fixture", "native-evidence:config-native-exact:nanobot"]),
      knownLossiness: [],
      currentSourceFiles: ["packages/lego-config/src/product-schema/nanobot.ts"],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/config/loader.py",
          symbols: expect.arrayContaining(["set_config_path", "load_config", "_apply_ssrf_whitelist", "resolve_config_env_vars", "_migrate_config"]),
        }),
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/config/paths.py",
          symbols: expect.arrayContaining(["get_config_path", "get_data_dir", "get_workspace_path", "is_default_workspace"]),
        }),
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/config/schema.py",
          symbols: expect.arrayContaining(["Config", "_validate_model_preset", "resolve_preset", "_match_provider", "get_api_base"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
    })
    expect(hermesConfig).toMatchObject({
      ownerTODO: "TODO-027",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      evidenceRefs: expect.arrayContaining(["fixture:hermes-config:native-exact-fixture", "native-evidence:conformance:hermes-config-native-exact-fixture", "native-evidence:config-native-exact:hermes-agent"]),
      knownLossiness: [],
      currentSourceFiles: ["packages/lego-config/src/product-schema/hermes.ts"],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "hermes-agent",
          path: "apps/desktop/src/app/settings/config-settings.tsx",
          symbols: expect.arrayContaining(["ConfigField", "ConfigSettings"]),
        }),
        expect.objectContaining({
          product: "hermes-agent",
          path: "apps/desktop/src/app/session/hooks/use-hermes-config.ts",
          symbols: expect.arrayContaining(["DEFAULT_VOICE_SECONDS", "FAST_TIERS", "recordingLimit", "HermesConfigOptions", "useHermesConfig", "refreshHermesConfig"]),
        }),
        expect.objectContaining({
          product: "hermes-agent",
          path: "hermes_cli/skills_config.py",
          symbols: expect.arrayContaining(["PLATFORMS", "get_disabled_skills", "save_disabled_skills", "_select_platform", "skills_command"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
    })
    expect(opencodeIdentity).toMatchObject({
      ownerTODO: "TODO-027",
      implementationKind: "factory",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      evidenceRefs: expect.arrayContaining([
        "fixture:opencode-identity:native-exact-fixture",
        "native-evidence:conformance:opencode-identity-native-exact-fixture",
        "native-evidence:identity-native-exact:opencode",
        expect.stringContaining("native-evidence:upstream:https://github.com/anomalyco/opencode@"),
      ]),
      knownLossiness: [],
      currentSourceFiles: ["packages/adapters-opencode/src/product-schema/identity.ts"],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/id/id.ts",
          symbols: expect.arrayContaining(["Identifier", "ascending", "descending", "create", "timestamp"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/schema.ts",
          symbols: expect.arrayContaining(["MessageID", "PartID"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/core/src/util/identifier.ts",
          symbols: expect.arrayContaining(["Identifier", "ascending", "descending", "create"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/core/src/session.ts",
          symbols: expect.arrayContaining(["Session", "ID"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
    })
    expect(piIdentity).toMatchObject({
      ownerTODO: "TODO-027",
      implementationKind: "factory",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      currentSourceFiles: expect.arrayContaining(["packages/adapters-pi/src/product-schema/pi.ts"]),
      evidenceRefs: expect.arrayContaining([
        "fixture:pi-identity-id-generator:native-exact-fixture",
        "native-evidence:conformance:pi-identity-id-generator-native-exact-fixture",
        "native-evidence:identity-id-generator-native-exact:pi-mono",
        expect.stringContaining("native-evidence:upstream:https://github.com/earendil-works/pi@"),
      ]),
      knownLossiness: [],
      pinnedUpstreamDivergences: [],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "pi-mono",
          path: "packages/agent/src/harness/session/uuid.ts",
          symbols: expect.arrayContaining(["fillRandomBytes", "uuidv7", "formatUuid"]),
        }),
        expect.objectContaining({
          product: "pi-mono",
          path: "packages/coding-agent/src/cli/initial-message.ts",
          symbols: expect.arrayContaining(["InitialMessageInput", "InitialMessageResult", "buildInitialMessage"]),
        }),
      ]),
    })
    expect(nanobotIdentity).toMatchObject({
      ownerTODO: "TODO-027",
      implementationKind: "factory",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      currentSourceFiles: expect.arrayContaining(["packages/adapters-nanobot/src/product-schema/identity.ts"]),
      evidenceRefs: expect.arrayContaining([
        "fixture:nanobot-identity:native-exact-fixture",
        "native-evidence:conformance:nanobot-identity-native-exact-fixture",
        "native-evidence:identity-native-exact:nanobot",
        "native-evidence:package:nanobot-ai@0.2.0",
        "native-evidence:upstream:https://github.com/HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
      ]),
      knownLossiness: [],
      pinnedUpstreamDivergences: [],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/config/paths.py",
          symbols: expect.arrayContaining(["get_workspace_path", "is_default_workspace", "get_cli_history_path"]),
        }),
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/session/goal_state.py",
          symbols: expect.arrayContaining(["GOAL_STATE_KEY", "goal_state_runtime_lines", "goal_state_ws_blob", "runner_wall_llm_timeout_s"]),
        }),
      ]),
    })
    expect(hermesIdentity).toMatchObject({
      ownerTODO: "TODO-027",
      implementationKind: "factory",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      currentSourceFiles: ["packages/adapters-hermes/src/product-schema/identity.ts"],
      evidenceRefs: expect.arrayContaining([
        "fixture:hermes-identity:native-exact-fixture",
        "native-evidence:conformance:hermes-identity-native-exact-fixture",
        "native-evidence:identity-native-exact:hermes-agent",
        "native-evidence:package:hermes-agent==0.15.1",
      ]),
      knownLossiness: [],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "hermes-agent",
          path: "agent/agent_runtime_helpers.py",
          symbols: expect.arrayContaining(["_ra", "convert_to_trajectory_format", "sanitize_tool_call_arguments"]),
        }),
        expect.objectContaining({
          product: "hermes-agent",
          path: "acp_adapter/session.py",
          symbols: expect.arrayContaining(["_normalize_cwd_for_compare", "_build_session_title", "_format_updated_at", "SessionState", "SessionManager", "create_session", "list_sessions"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
    })
    expect(opencodeEvent).toMatchObject({
      ownerTODO: "TODO-027",
      implementationKind: "factory",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/message-v2.ts",
          symbols: expect.arrayContaining(["Event", "Part", "ToolPart", "WithParts", "toModelMessages", "stream", "fromError"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/projectors.ts",
          symbols: expect.arrayContaining(["DeepPartial", "usage", "applyUsage", "toPartialRow"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/projectors-next.ts",
          symbols: expect.arrayContaining(["encodeDateTimes", "encodeMessageData", "sqlite", "update"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
      evidenceRefs: expect.arrayContaining([
        "fixture:opencode-event:native-exact-fixture",
        "native-evidence:conformance:opencode-event-native-exact-fixture",
        "native-evidence:event-native-exact:opencode",
      ]),
      knownLossiness: [],
      currentSourceFiles: ["packages/adapters-opencode/src/product-schema/events.ts"],
    })
	    expect(piEvent).toMatchObject({
	      ownerTODO: "TODO-027",
	      implementationKind: "factory",
	      implementationLevel: "native",
	      parityCoverage: "native",
	      mismatchKind: "upstream-head-drift-unchecked",
	      sourceVerificationStatus: "product-native-exact-fixture",
	      upstreamSourceStatus: "pinned-source-symbol-mapped",
	      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
	      currentSourceFiles: expect.arrayContaining(["packages/adapters-pi/src/product-schema/events.ts"]),
	      evidenceRefs: expect.arrayContaining([
	        "fixture:pi-event:native-exact-fixture",
	        "native-evidence:conformance:pi-event-native-exact-fixture",
	        "native-evidence:event-native-exact:pi-mono",
	        expect.stringContaining("native-evidence:upstream:https://github.com/earendil-works/pi@"),
	      ]),
	      knownLossiness: [],
	      upstreamSourceLocations: expect.arrayContaining([
	        expect.objectContaining({
	          product: "pi-mono",
	          path: "packages/coding-agent/src/core/agent-session-runtime.ts",
          symbols: expect.arrayContaining(["AgentSessionRuntime", "switchSession", "newSession", "fork", "importFromJsonl", "createAgentSessionRuntime"]),
        }),
        expect.objectContaining({
          product: "pi-mono",
          path: "packages/agent/src/harness/messages.ts",
	          symbols: expect.arrayContaining(["BashExecutionMessage", "CustomMessage", "createBranchSummaryMessage", "createCompactionSummaryMessage", "convertToLlm"]),
	        }),
	      ]),
	      pinnedUpstreamDivergences: [],
	    })
    expect(nanobotEvent).toMatchObject({
      ownerTODO: "TODO-027",
      implementationKind: "factory",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/agent/progress_hook.py",
          symbols: expect.arrayContaining(["AgentProgressHook", "on_stream", "before_execute_tools", "emit_reasoning", "after_iteration", "finalize_content"]),
        }),
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/channels/websocket.py",
          symbols: expect.arrayContaining(["WebSocketConfig", "WebSocketChannel", "_send_event", "_dispatch_envelope", "send_delta", "send_turn_end"]),
        }),
      ]),
      evidenceRefs: expect.arrayContaining([
        "fixture:nanobot-event:native-exact-fixture",
        "native-evidence:conformance:nanobot-event-native-exact-fixture",
        "native-evidence:event-native-exact:nanobot",
      ]),
      knownLossiness: [],
      currentSourceFiles: ["packages/adapters-nanobot/src/product-schema/events.ts"],
      pinnedUpstreamDivergences: [],
    })
    expect(hermesEvent).toMatchObject({
      ownerTODO: "TODO-027",
      implementationKind: "factory",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "hermes-agent",
          path: "agent/transports/types.py",
          symbols: expect.arrayContaining(["ToolCall", "Usage", "NormalizedResponse", "build_tool_call", "map_finish_reason"]),
        }),
        expect.objectContaining({
          product: "hermes-agent",
          path: "agent/transports/codex_event_projector.py",
          symbols: expect.arrayContaining(["ProjectionResult", "CodexEventProjector", "project", "_project_command", "_project_opaque"]),
        }),
      ]),
      evidenceRefs: expect.arrayContaining([
        "fixture:hermes-event:native-exact-fixture",
        "native-evidence:conformance:hermes-event-native-exact-fixture",
        "native-evidence:event-native-exact:hermes-agent",
      ]),
      knownLossiness: [],
      currentSourceFiles: ["packages/adapters-hermes/src/product-schema/events.ts"],
      pinnedUpstreamDivergences: [],
    })
    expect(opencodeTrace).toMatchObject({
      ownerTODO: "TODO-027",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      sourceVerificationStatus: "product-native-exact-fixture",
      evidenceRefs: expect.arrayContaining([
        "fixture:opencode-trace-debug-surface:native-exact-fixture",
        "native-evidence:conformance:opencode-trace-debug-surface-native-exact-fixture",
        "native-evidence:trace-debug-surface-native-exact:opencode",
      ]),
      knownLossiness: [],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/message.ts",
          symbols: expect.arrayContaining(["ToolCall", "ToolResult", "ToolInvocation", "MessagePart", "Info"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/status.ts",
          symbols: expect.arrayContaining(["Info", "Event", "Interface", "Service", "layer", "defaultLayer"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
    })
    expect(piTrace).toMatchObject({
      ownerTODO: "TODO-027",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      sourceVerificationStatus: "product-native-exact-fixture",
      evidenceRefs: expect.arrayContaining([
        "fixture:pi-trace-debug-surface:native-exact-fixture",
        "native-evidence:conformance:pi-trace-debug-surface-native-exact-fixture",
        "native-evidence:trace-debug-surface-native-exact:pi-mono",
      ]),
      knownLossiness: [],
      currentSourceFiles: ["packages/adapters-pi/src/product-schema/trace.ts"],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "pi-mono",
          path: "packages/coding-agent/src/core/agent-session-runtime.ts",
          symbols: expect.arrayContaining(["AgentSessionRuntime", "switchSession", "newSession", "fork", "importFromJsonl", "createAgentSessionRuntime"]),
        }),
        expect.objectContaining({
          product: "pi-mono",
          path: "packages/coding-agent/docs/session-format.md",
          symbols: expect.arrayContaining(["SessionFileFormat", "SessionHeader", "SessionMessageEntry", "SessionManagerAPI"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
    })
    expect(nanobotTrace).toMatchObject({
      ownerTODO: "TODO-027",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      sourceVerificationStatus: "product-native-exact-fixture",
      evidenceRefs: expect.arrayContaining([
        "fixture:nanobot-trace-debug-surface:native-exact-fixture",
        "native-evidence:conformance:nanobot-trace-debug-surface-native-exact-fixture",
        "native-evidence:trace-debug-surface-native-exact:nanobot",
      ]),
      knownLossiness: [],
      currentSourceFiles: ["packages/adapters-nanobot/src/product-schema/trace.ts"],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/agent/runner.py",
          symbols: expect.arrayContaining(["AgentRunSpec", "AgentRunResult", "AgentRunner", "_append_injected_messages", "_normalize_tool_result"]),
        }),
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/utils/webui_transcript.py",
          symbols: expect.arrayContaining(["WEBUI_TRANSCRIPT_SCHEMA_VERSION", "append_transcript_object", "tool_trace_lines_from_events", "build_webui_thread_response"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
    })
    expect(hermesTrace).toMatchObject({
      ownerTODO: "TODO-027",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      sourceVerificationStatus: "product-native-exact-fixture",
      evidenceRefs: expect.arrayContaining([
        "fixture:hermes-trace-debug-surface:native-exact-fixture",
        "native-evidence:conformance:hermes-trace-debug-surface-native-exact-fixture",
        "native-evidence:trace-debug-surface-native-exact:hermes-agent",
      ]),
      knownLossiness: [],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "hermes-agent",
          path: "agent/trajectory.py",
          symbols: expect.arrayContaining(["convert_scratchpad_to_think", "has_incomplete_scratchpad", "save_trajectory"]),
        }),
        expect.objectContaining({
          product: "hermes-agent",
          path: "agent/tool_result_classification.py",
          symbols: expect.arrayContaining(["FILE_MUTATING_TOOL_NAMES", "file_mutation_result_landed"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
      currentSourceFiles: ["packages/adapters-hermes/src/product-schema/trace.ts"],
    })
    expect(opencodeTask).toMatchObject({
      ownerTODO: "TODO-027",
      mismatchKind: "upstream-head-drift-unchecked",
      implementationLevel: "native",
      parityCoverage: "native",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/todo.ts",
          symbols: expect.arrayContaining(["Info", "Event", "Interface", "Service", "layer", "defaultLayer"]),
        }),
      ]),
      evidenceRefs: expect.arrayContaining([
        "fixture:task-parity-live:opencode:read-only-answer:native-cli",
        "native-evidence:upstream:npm:opencode-ai@1.15.11:bin/opencode.exe",
      ]),
      knownLossiness: [],
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      pinnedUpstreamDivergences: [],
    })
    expect(opencodeMetadataOverlay).toMatchObject({
      ownerTODO: "TODO-028",
      mismatchKind: "metadata-only",
      implementationLevel: "metadata-only",
      parityCoverage: "metadata",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      sourceVerificationStatus: "metadata-overlay-source",
      evidenceRefs: expect.arrayContaining([
        "native-evidence:conformance:opencode-metadata-overlay-demotion-matrix",
        "fixture:opencode-metadata:overlay-demotion-matrix",
      ]),
      knownLossiness: expect.arrayContaining([
        "bom-or-overlay-only",
        "not-executable-provider",
        "opencode-metadata-overlay-demotion-matrix-partial-fixture",
      ]),
      pinnedUpstreamDivergences: expect.arrayContaining([
        expect.objectContaining({
          kind: "metadata-overlay-only",
          exactDiffStatus: "demotion-guard-only",
          fixtureDiffTarget: "metadata.executable-blocker",
        }),
      ]),
    })
    expect(nanobotTask).toMatchObject({
      ownerTODO: "TODO-028",
      mismatchKind: "metadata-only",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      sourceVerificationStatus: "metadata-overlay-source",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/agent/tools/long_task.py",
          symbols: expect.arrayContaining(["_iso_now", "_GoalToolsMixin", "LongTaskTool", "CompleteGoalTool"]),
        }),
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/skills/long-goal/SKILL.md",
          symbols: expect.arrayContaining(["Long-running objectives", "Start fast", "Tools", "Execution guide after long_task is set"]),
        }),
      ]),
      pinnedUpstreamDivergences: expect.arrayContaining([
        expect.objectContaining({
          kind: "metadata-overlay-only",
          requiredEvidence: expect.stringContaining("metadata overlay proof"),
          nextVerification: expect.stringContaining("metadata executable-blocker"),
          exactDiffStatus: "demotion-guard-only",
          fixtureDiffTarget: "metadata.executable-blocker",
          comparisonDimensions: expect.arrayContaining(["bom-annotation", "graph-annotation", "executable-blocker", "native-claim-negative"]),
          currentCoverage: expect.stringContaining("metadata/demotion guard only"),
        }),
      ]),
    })
    expect(opencodeTurn).toMatchObject({
      ownerTODO: "TODO-027",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/processor.ts",
          symbols: expect.arrayContaining(["Service", "layer", "defaultLayer"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/compaction.ts",
          symbols: expect.arrayContaining(["Service", "buildPrompt", "preserveRecentBudget"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/retry.ts",
          symbols: expect.arrayContaining(["delay", "retryable", "policy"]),
        }),
      ]),
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      pinnedUpstreamDivergences: [],
      nextAction: "Run source-level check against pinned upstream and latest HEAD.",
      knownLossiness: [],
    })
    expect(opencodePromptBinding).toMatchObject({
      ownerTODO: "TODO-025",
      evidenceStrength: "executable-audit",
      executableRequired: true,
      bindingRisk: "common-ok",
      compileStatus: "passed",
      currentSourceFiles: ["packages/adapters-opencode/src/opencode-prompt-mode-builder.ts"],
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          repo: "anomalyco/opencode",
          path: "packages/opencode/src/session/system.ts",
          symbols: expect.arrayContaining(["provider", "Interface", "Service", "layer", "defaultLayer", "SystemPrompt"]),
        }),
      ]),
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      pinnedUpstreamDivergences: [],
      sourceVerificationStatus: "product-native-exact-fixture",
      mismatchKind: "upstream-head-drift-unchecked",
      summary: "opencode.prompt.mode-builder is an executable provider; product-specific labels/defaults remain separate metadata overlays.",
    })
    expect(opencodeProviderBinding).toMatchObject({
      ownerTODO: "TODO-025",
      mismatchKind: "upstream-head-drift-unchecked",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/llm/request.ts",
          symbols: expect.arrayContaining(["Prepared", "prepare", "hasToolCalls", "LLMRequestPrep"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/llm/native-request.ts",
          symbols: expect.arrayContaining(["RequestInput", "model", "request", "LLMNative"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/core/src/plugin/provider.ts",
          symbols: expect.arrayContaining(["ProviderPlugins"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
    })
    expect(opencodeProviderRequestOptions).toMatchObject({
      ownerTODO: "TODO-027",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/llm/request.ts",
          symbols: expect.arrayContaining(["Prepared", "prepare", "hasToolCalls", "LLMRequestPrep"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/llm/native-request.ts",
          symbols: expect.arrayContaining(["RequestInput", "model", "request", "LLMNative"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/core/src/plugin/provider.ts",
          symbols: expect.arrayContaining(["ProviderPlugins"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
      evidenceRefs: expect.arrayContaining([
        "fixture:opencode-provider-request-options:native-exact-fixture",
        "native-evidence:conformance:opencode-provider-request-options-native-exact-fixture",
        "native-evidence:provider-request-options-native-exact:opencode",
      ]),
      knownLossiness: [],
    })
    expect(opencodeProviderTransportInstrumentation).toMatchObject({
      ownerTODO: "TODO-027",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      evidenceRefs: expect.arrayContaining([
        "fixture:opencode-provider-transport-instrumentation:native-exact-fixture",
        "native-evidence:conformance:opencode-provider-transport-instrumentation-native-exact-fixture",
        "native-evidence:provider-transport-instrumentation-native-exact:opencode",
      ]),
      knownLossiness: [],
    })
    expect(opencodeSessionStore).toMatchObject({
      ownerTODO: "TODO-027",
      implementationKind: "factory",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      sourceVerificationStatus: "product-native-exact-fixture",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/session.ts",
          symbols: expect.arrayContaining(["Info", "CreateInput", "ForkInput", "Session"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/message-v2.ts",
          symbols: expect.arrayContaining(["Info", "Part", "ToolPart", "MessageV2"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/session.sql.ts",
          symbols: expect.arrayContaining(["SessionTable", "MessageTable", "PartTable"]),
        }),
      ]),
      currentSourceFiles: ["packages/adapters-opencode/src/product-schema/session.ts"],
      pinnedUpstreamDivergences: [],
      evidenceRefs: expect.arrayContaining([
        "fixture:opencode-session:native-exact-fixture",
        "native-evidence:conformance:opencode-session-native-exact-fixture",
        "native-evidence:session-native-exact:opencode",
      ]),
      knownLossiness: [],
    })
    expect(opencodeToolSchema).toMatchObject({
      ownerTODO: "TODO-027",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      pinnedUpstreamDivergences: [],
      evidenceRefs: expect.arrayContaining([
        "fixture:opencode-tool:native-exact-fixture",
        "native-evidence:conformance:opencode-tool-native-exact-fixture",
        "native-evidence:tool-native-exact:opencode",
      ]),
      knownLossiness: [],
      currentSourceFiles: ["packages/lego-tools/src/product-schema/opencode.ts"],
    })
    expect(opencodePluginLoader).toMatchObject({
      ownerTODO: "TODO-027",
      mismatchKind: "upstream-head-drift-unchecked",
      implementationLevel: "native",
      parityCoverage: "native",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          path: "packages/core/src/plugin.ts",
          symbols: expect.arrayContaining(["PluginV2", "Hooks", "HookFunctions", "define"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/core/src/plugin/boot.ts",
          symbols: expect.arrayContaining(["PluginBoot", "Service", "Interface"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/core/src/plugin/provider.ts",
          symbols: expect.arrayContaining(["ProviderPlugins"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
      evidenceRefs: expect.arrayContaining([
        "fixture:opencode-hook-lifecycle:native-exact-fixture",
        "native-evidence:conformance:opencode-hook-lifecycle-native-exact-fixture",
        "native-evidence:hook-lifecycle-native-exact:opencode",
      ]),
      knownLossiness: [],
      currentSourceFiles: ["packages/adapters-opencode/src/product-schema/hooks.ts"],
    })
    expect(piProviderRequestOptions).toMatchObject({
      ownerTODO: "TODO-027",
      mismatchKind: "upstream-head-drift-unchecked",
      implementationLevel: "native",
      parityCoverage: "native",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "pi-mono",
          path: "packages/ai/src/providers/anthropic.ts",
          symbols: expect.arrayContaining(["AnthropicOptions", "streamAnthropic", "buildParams", "convertMessages", "convertTools"]),
        }),
        expect.objectContaining({
          product: "pi-mono",
          path: "packages/ai/src/providers/openai-responses.ts",
          symbols: expect.arrayContaining(["OpenAIResponsesOptions", "streamOpenAIResponses", "buildParams"]),
        }),
        expect.objectContaining({
          product: "pi-mono",
          path: "packages/ai/src/providers/register-builtins.ts",
          symbols: expect.arrayContaining(["registerBuiltInApiProviders", "resetApiProviders"]),
        }),
      ]),
      currentSourceFiles: expect.arrayContaining(["packages/adapters-pi/src/product-schema/provider.ts"]),
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      pinnedUpstreamDivergences: [],
      sourceVerificationStatus: "product-native-exact-fixture",
      evidenceRefs: expect.arrayContaining([
        "fixture:pi-provider-descriptor:native-exact-fixture",
        "native-evidence:conformance:pi-provider-descriptor-native-exact-fixture",
        "native-evidence:provider-descriptor-native-exact:pi-mono",
      ]),
      knownLossiness: [],
    })
    expect(nanobotProviderRequestOptions).toMatchObject({
      ownerTODO: "TODO-027",
      implementationKind: "factory",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      pinnedUpstreamDivergences: [],
      currentSourceFiles: ["packages/adapters-nanobot/src/product-schema/provider.ts"],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/providers/openai_compat_provider.py",
          symbols: expect.arrayContaining(["OpenAICompatProvider", "_build_kwargs", "_parse_chunks"]),
        }),
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/providers/anthropic_provider.py",
          symbols: expect.arrayContaining(["AnthropicProvider", "_convert_messages", "_convert_tools"]),
        }),
      ]),
      evidenceRefs: expect.arrayContaining([
        "fixture:nanobot-provider:native-exact-fixture",
        "native-evidence:conformance:nanobot-provider-native-exact-fixture",
        "native-evidence:provider-native-exact:nanobot",
      ]),
      knownLossiness: [],
    })
    expect(hermesProviderRequestOptions).toMatchObject({
      ownerTODO: "TODO-027",
      implementationKind: "factory",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      pinnedUpstreamDivergences: [],
      currentSourceFiles: ["packages/adapters-hermes/src/product-schema/provider.ts"],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "hermes-agent",
          path: "agent/transports/codex.py",
          symbols: expect.arrayContaining(["ResponsesApiTransport", "convert_messages", "build_kwargs", "normalize_response"]),
        }),
        expect.objectContaining({
          product: "hermes-agent",
          path: "agent/transports/anthropic.py",
          symbols: expect.arrayContaining(["AnthropicTransport", "convert_messages", "build_kwargs", "normalize_response"]),
        }),
        expect.objectContaining({
          product: "hermes-agent",
          path: "agent/transports/chat_completions.py",
          symbols: expect.arrayContaining(["ChatCompletionsTransport", "convert_messages", "build_kwargs", "normalize_response"]),
        }),
        expect.objectContaining({
          product: "hermes-agent",
          path: "agent/transports/types.py",
          symbols: expect.arrayContaining(["ToolCall", "Usage", "NormalizedResponse", "build_tool_call", "map_finish_reason"]),
        }),
      ]),
      evidenceRefs: expect.arrayContaining([
        "fixture:hermes-provider:native-exact-fixture",
        "native-evidence:conformance:hermes-provider-native-exact-fixture",
        "native-evidence:provider-native-exact:hermes-agent",
      ]),
      knownLossiness: [],
    })
    expect(opencodeToolBinding).toMatchObject({
      ownerTODO: "TODO-025",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      pinnedUpstreamDivergences: [],
      evidenceRefs: expect.arrayContaining([
        "binding:tool.definition->opencode.tool.definition-plugin-bridge",
        "source:@helix/lego-tools/product-schema/opencode",
      ]),
      knownLossiness: [],
      currentSourceFiles: ["packages/lego-tools/src/product-schema/opencode.ts"],
    })
    expect(opencodeHookBinding).toMatchObject({
      ownerTODO: "TODO-025",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          path: "packages/core/src/plugin.ts",
          symbols: expect.arrayContaining(["PluginV2", "ID", "Hooks", "HookFunctions", "define", "Service", "layer", "defaultLayer"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/core/src/plugin/boot.ts",
          symbols: expect.arrayContaining(["PluginBoot", "Interface", "Service", "layer", "defaultLayer"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/core/src/plugin/provider.ts",
          symbols: expect.arrayContaining(["ProviderPlugins"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
      evidenceRefs: expect.arrayContaining([
        "binding:hook.bus->opencode.plugin.loader",
        "source:@helix/adapters-opencode/product-schema/hooks",
      ]),
      knownLossiness: [],
      currentSourceFiles: ["packages/adapters-opencode/src/product-schema/hooks.ts"],
    })
    expect(opencodeSessionBinding).toMatchObject({
      ownerTODO: "TODO-025",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      sourceVerificationStatus: "product-native-exact-fixture",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/session.ts",
          symbols: expect.arrayContaining(["Info", "Event", "fromRow", "toRow", "getUsage", "Service", "layer", "listGlobal", "Session"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/message-v2.ts",
          symbols: expect.arrayContaining(["Info", "Part", "WithParts", "toModelMessages", "page", "stream", "filterCompacted", "MessageV2"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/session/session.sql.ts",
          symbols: expect.arrayContaining(["SessionTable", "MessageTable", "PartTable", "TodoTable", "SessionMessageTable", "PermissionTable"]),
        }),
      ]),
      currentSourceFiles: ["packages/adapters-opencode/src/product-schema/session.ts"],
      pinnedUpstreamDivergences: [],
      evidenceRefs: expect.arrayContaining([
        "binding:session.branch-graph->opencode.session.branch-graph.fork-before-message",
        "source:@helix/adapters-opencode/product-schema/session",
      ]),
      knownLossiness: [],
    })
    expect(opencodeProductShellSdkAtom).toMatchObject({
      ownerTODO: "TODO-027",
      implementationKind: "factory",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      evidenceRefs: expect.arrayContaining([
        "fixture:opencode-product-shell:native-exact-fixture",
        "native-evidence:conformance:opencode-product-shell-native-exact-fixture",
        "native-evidence:product-shell-native-exact:opencode",
        "native-evidence:upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      ]),
      knownLossiness: [],
      currentSourceFiles: ["packages/adapters-opencode/src/product-schema/product-shell.ts"],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/cli/bootstrap.ts",
          symbols: expect.arrayContaining(["bootstrap"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/server/server.ts",
          symbols: expect.arrayContaining(["Listener", "Default", "openapi", "listen"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/specs/v2/api.ts",
          symbols: expect.arrayContaining(["opencode", "sessionID"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
    })
    for (const item of [
      piProductShellCLIAtom,
      piProductShellSDKAtom,
      piProductShellRPCAtom,
      piProductShellHarnessAtom,
      piProductShellServerAtom,
      piProductShellPackageManagerAtom,
      piProductShellExtensionExamplesAtom,
    ]) {
      expect(item).toMatchObject({
        ownerTODO: "TODO-027",
        implementationLevel: "native",
        parityCoverage: "native",
        mismatchKind: "upstream-head-drift-unchecked",
        sourceVerificationStatus: "product-native-exact-fixture",
        pinnedUpstreamBehaviorStatus: "pinned-native-exact",
        evidenceRefs: expect.arrayContaining([
          "fixture:pi-product-shell:native-exact-fixture",
          "native-evidence:conformance:pi-product-shell-native-exact-fixture",
          "native-evidence:product-shell-native-exact:pi-mono",
        ]),
        knownLossiness: [],
        currentSourceFiles: ["packages/adapters-pi/src/product-schema/product-shell.ts"],
        upstreamSourceLocations: expect.arrayContaining([
          expect.objectContaining({
            product: "pi-mono",
            path: "packages/coding-agent/src/cli.ts",
            symbols: expect.arrayContaining(["APP_NAME", "configureHttpDispatcher", "main"]),
          }),
          expect.objectContaining({
            product: "pi-mono",
            path: "packages/coding-agent/src/main.ts",
            symbols: expect.arrayContaining(["readPipedStdin", "resolveAppMode", "createSessionManager", "main"]),
          }),
          expect.objectContaining({
            product: "pi-mono",
            path: "packages/coding-agent/src/modes/rpc/rpc-client.ts",
            symbols: expect.arrayContaining(["RpcClientOptions", "ModelInfo", "RpcClient"]),
          }),
          expect.objectContaining({
            product: "pi-mono",
            path: "packages/coding-agent/src/package-manager-cli.ts",
            symbols: expect.arrayContaining(["PackageCommand", "handleConfigCommand", "handlePackageCommand"]),
          }),
          expect.objectContaining({
            product: "pi-mono",
            path: "packages/tui/src/tui.ts",
            symbols: expect.arrayContaining(["Component", "Focusable", "Container", "TUI"]),
          }),
        ]),
        pinnedUpstreamDivergences: [],
      })
    }
    expect(opencodeShellEnvAtom).toMatchObject({
      ownerTODO: "TODO-027",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      sourceVerificationStatus: "product-native-exact-fixture",
      evidenceRefs: expect.arrayContaining([
        "fixture:opencode-shell-env:native-exact-fixture",
        "native-evidence:conformance:opencode-shell-env-native-exact-fixture",
        "native-evidence:shell-env-native-exact:opencode",
      ]),
      knownLossiness: [],
      currentSourceFiles: expect.arrayContaining([
        "packages/adapters-opencode/src/opencode-shell-env.ts",
        "packages/lego-tools/src/port-fixtures.ts",
      ]),
      pinnedUpstreamDivergences: [],
    })
    expect(opencodeProductShellControlPlaneAtom).toMatchObject({
      ownerTODO: "TODO-027",
      mismatchKind: "upstream-head-drift-unchecked",
      implementationLevel: "native",
      parityCoverage: "native",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      sourceVerificationStatus: "product-native-exact-fixture",
      evidenceRefs: expect.arrayContaining([
        "fixture:opencode-product-shell:native-exact-fixture",
        "native-evidence:conformance:opencode-product-shell-native-exact-fixture",
        "native-evidence:product-shell-native-exact:opencode",
      ]),
      knownLossiness: [],
      currentSourceFiles: ["packages/adapters-opencode/src/product-schema/product-shell.ts"],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          path: "packages/app/src/app.tsx",
          symbols: expect.arrayContaining(["AppBaseProviders", "ConnectionGate", "AppInterface"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/server/server.ts",
          symbols: expect.arrayContaining(["Listener", "Default", "openapi", "listen"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/specs/v2/api.ts",
          symbols: expect.arrayContaining(["opencode", "sessionID"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
    })
    expect(opencodeProductShellDesktopAtom).toMatchObject({
      ownerTODO: "TODO-027",
      mismatchKind: "upstream-head-drift-unchecked",
      implementationLevel: "native",
      parityCoverage: "native",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      sourceVerificationStatus: "product-native-exact-fixture",
      evidenceRefs: expect.arrayContaining([
        "fixture:opencode-product-shell:native-exact-fixture",
        "native-evidence:conformance:opencode-product-shell-native-exact-fixture",
        "native-evidence:product-shell-native-exact:opencode",
      ]),
      knownLossiness: [],
      currentSourceFiles: ["packages/adapters-opencode/src/product-schema/product-shell.ts"],
      pinnedUpstreamDivergences: [],
    })
    expect(opencodeProductShellWorkspaceAtom).toMatchObject({
      ownerTODO: "TODO-027",
      mismatchKind: "upstream-head-drift-unchecked",
      implementationLevel: "native",
      parityCoverage: "native",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      sourceVerificationStatus: "product-native-exact-fixture",
      evidenceRefs: expect.arrayContaining([
        "fixture:opencode-product-shell:native-exact-fixture",
        "native-evidence:conformance:opencode-product-shell-native-exact-fixture",
        "native-evidence:product-shell-native-exact:opencode",
      ]),
      knownLossiness: [],
      currentSourceFiles: ["packages/adapters-opencode/src/product-schema/product-shell.ts"],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          path: "packages/app/src/app.tsx",
          symbols: expect.arrayContaining(["AppBaseProviders", "ConnectionGate", "AppInterface"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/server/server.ts",
          symbols: expect.arrayContaining(["Listener", "Default", "openapi", "listen"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/specs/v2/api.ts",
          symbols: expect.arrayContaining(["opencode", "sessionID"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
    })
    expect(opencodeProductShellBinding).toMatchObject({
      atomID: "opencode.product-shell.sdk",
      ownerTODO: "TODO-025",
      implementationKind: "factory",
      implementationLevel: "native",
      parityCoverage: "native",
      mismatchKind: "upstream-head-drift-unchecked",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      currentSourceFiles: ["packages/adapters-opencode/src/product-schema/product-shell.ts"],
      knownLossiness: [],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/cli/bootstrap.ts",
          symbols: expect.arrayContaining(["bootstrap"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/cli/cmd/tui/app.tsx",
          symbols: expect.arrayContaining(["rendererConfig", "errorMessage", "tui", "App"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/app/src/app.tsx",
          symbols: expect.arrayContaining(["AppBaseProviders", "ConnectionGate", "AppInterface"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/server/server.ts",
          symbols: expect.arrayContaining(["Listener", "Default", "openapi", "listen"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/specs/v2/api.ts",
          symbols: expect.arrayContaining(["opencode", "sessionID"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
    })
    expect(opencodeRuntimeBinding).toMatchObject({
      atomID: "opencode.runtime.acceptance-controller.native-like",
      ownerTODO: "TODO-025",
      mismatchKind: "upstream-head-drift-unchecked",
      implementationLevel: "native",
      parityCoverage: "native",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      currentSourceFiles: ["packages/lego-runtime/src/product-schema/opencode.ts"],
      evidenceRefs: expect.arrayContaining([
        "binding:runtime.acceptance-controller->opencode.runtime.acceptance-controller.native-like",
        "source:@helix/lego-runtime/product-schema/opencode",
      ]),
      knownLossiness: [],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/cli/cmd/run/runtime.ts",
          symbols: expect.arrayContaining(["RuntimeState", "runInteractiveRuntime", "runInteractiveLocalMode", "runInteractiveMode"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/cli/cmd/run/runtime.lifecycle.ts",
          symbols: expect.arrayContaining(["LifecycleInput", "Lifecycle", "createRuntimeLifecycle"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/cli/cmd/run/runtime.shared.ts",
          symbols: expect.arrayContaining(["PendingTask", "reusePendingTask"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
    })
    expect(opencodeUIRendererAtom).toMatchObject({
      ownerTODO: "TODO-027",
      mismatchKind: "upstream-head-drift-unchecked",
      implementationKind: "factory",
      implementationLevel: "native",
      parityCoverage: "native",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      sourceVerificationStatus: "product-native-exact-fixture",
      currentSourceFiles: ["packages/lego-ui/src/product-schema/opencode.ts"],
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      evidenceRefs: expect.arrayContaining([
        "fixture:opencode-ui:native-exact-fixture",
        "native-evidence:conformance:opencode-ui-native-exact-fixture",
        "native-evidence:ui-native-exact:opencode",
        "native-evidence:upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      ]),
      knownLossiness: [],
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/cli/cmd/tui/app.tsx",
          symbols: expect.arrayContaining(["appBindingCommands", "rendererConfig", "errorMessage", "tui", "App"]),
        }),
        expect.objectContaining({
          product: "opencode",
          path: "packages/opencode/src/cli/cmd/tui/plugin/api.tsx",
          symbols: expect.arrayContaining(["RouteEntry", "RouteMap", "Input", "routeRegister", "routeNavigate", "createTuiApi"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
    })
    expect(piUIRendererAtom).toMatchObject({
      ownerTODO: "TODO-027",
      mismatchKind: "upstream-head-drift-unchecked",
      implementationKind: "factory",
      implementationLevel: "native",
      parityCoverage: "native",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      sourceVerificationStatus: "product-native-exact-fixture",
      currentSourceFiles: ["packages/lego-ui/src/product-schema/pi.ts"],
      evidenceRefs: expect.arrayContaining([
        "fixture:pi-ui:native-exact-fixture",
        "native-evidence:conformance:pi-ui-native-exact-fixture",
        "native-evidence:ui-native-exact:pi-mono",
      ]),
      knownLossiness: [],
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "pi-mono",
          path: "packages/tui/src/autocomplete.ts",
          symbols: expect.arrayContaining(["AutocompleteItem", "SlashCommand", "AutocompleteProvider", "CombinedAutocompleteProvider", "getFileSuggestions"]),
        }),
        expect.objectContaining({
          product: "pi-mono",
          path: "packages/tui/src/components/box.ts",
          symbols: expect.arrayContaining(["RenderCache", "Box", "addChild", "removeChild"]),
        }),
        expect.objectContaining({
          product: "pi-mono",
          path: "packages/tui/src/tui.ts",
          symbols: expect.arrayContaining(["Component", "Focusable", "OverlayHandle", "Container", "TUI"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
    })
    expect(nanobotUIRendererAtom).toMatchObject({
      ownerTODO: "TODO-027",
      mismatchKind: "upstream-head-drift-unchecked",
      implementationKind: "factory",
      implementationLevel: "native",
      parityCoverage: "native",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/cli/stream.py",
          symbols: expect.arrayContaining(["ThinkingSpinner", "StreamRenderer", "on_delta", "on_end", "close"]),
        }),
        expect.objectContaining({
          product: "nanobot",
          path: "nanobot/channels/websocket.py",
          symbols: expect.arrayContaining(["WebSocketConfig", "WebSocketChannel", "_dispatch_http", "_serve_static", "send_delta"]),
        }),
        expect.objectContaining({
          product: "nanobot",
          path: "webui/src/App.tsx",
          symbols: expect.arrayContaining(["BootState", "ShellView", "AuthForm", "App", "Shell"]),
        }),
        expect.objectContaining({
          product: "nanobot",
          path: "webui/src/components/thread/ThreadShell.tsx",
          symbols: expect.arrayContaining(["projectWebuiThreadMessages", "ThreadShellProps", "PendingFirstMessage", "ThreadShell"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
      evidenceRefs: expect.arrayContaining([
        "fixture:nanobot-ui:native-exact-fixture",
        "native-evidence:conformance:nanobot-ui-native-exact-fixture",
        "native-evidence:ui-native-exact:nanobot",
      ]),
      knownLossiness: [],
      summary: "Native proof complete for this atom; no open module blocker remains.",
    })
    expect(hermesUIRendererAtom).toMatchObject({
      ownerTODO: "TODO-027",
      mismatchKind: "upstream-head-drift-unchecked",
      implementationKind: "factory",
      implementationLevel: "native",
      parityCoverage: "native",
      upstreamSourceStatus: "pinned-source-symbol-mapped",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      sourceVerificationStatus: "product-native-exact-fixture",
      upstreamSourceLocations: expect.arrayContaining([
        expect.objectContaining({
          product: "hermes-agent",
          path: "agent/display.py",
          symbols: expect.arrayContaining(["LocalEditSnapshot", "build_tool_preview", "KawaiiSpinner", "get_cute_tool_message"]),
        }),
        expect.objectContaining({
          product: "hermes-agent",
          path: "apps/desktop/src/app/chat/index.tsx",
          symbols: expect.arrayContaining(["ChatViewProps", "ChatHeaderProps", "ChatHeader", "ChatView"]),
        }),
        expect.objectContaining({
          product: "hermes-agent",
          path: "apps/desktop/src/app/chat/composer/index.tsx",
          symbols: expect.arrayContaining(["COMPOSER_STACK_BREAKPOINT_PX", "QueueEditState", "ChatBar", "ChatBarFallback"]),
        }),
      ]),
      pinnedUpstreamDivergences: [],
      evidenceRefs: expect.arrayContaining([
        "fixture:hermes-ui:native-exact-fixture",
        "native-evidence:conformance:hermes-ui-native-exact-fixture",
        "native-evidence:ui-native-exact:hermes-agent",
      ]),
      knownLossiness: [],
      summary: "Native proof complete for this atom; no open module blocker remains.",
    })
    expect(opencodeUIEventLoopBinding).toMatchObject({
      atomID: "opencode.ui.event-loop",
      ownerTODO: "TODO-025",
      evidenceStrength: "executable-audit",
      executableRequired: true,
      bindingRisk: "common-ok",
      compileStatus: "passed",
      mismatchKind: "upstream-head-drift-unchecked",
      implementationLevel: "native",
      parityCoverage: "native",
      pinnedUpstreamBehaviorStatus: "pinned-native-exact",
      pinnedUpstreamDivergences: [],
      sourceVerificationStatus: "product-native-exact-fixture",
      currentSourceFiles: ["packages/lego-ui/src/product-schema/opencode.ts"],
    })
    expect(opencodePackage).toMatchObject({
      ownerTODO: "TODO-029",
      mismatchKind: "metadata-only",
      sourceVerificationStatus: "metadata-overlay-source",
      pinnedUpstreamBehaviorStatus: "pinned-metadata-only",
      nextAction: "Confirm package atoms against upstream source paths and preserve current bridge/metadata labels.",
    })
    expect(manualPackage).toMatchObject({
      ownerTODO: "TODO-029",
      mismatchKind: "manual-source-check-required",
      sourceVerificationStatus: "metadata-overlay-source",
      pinnedUpstreamBehaviorStatus: "local-evidence-tool-only",
      currentSourceFiles: ["packages/cli/src/index.ts"],
      pinnedUpstreamDivergences: expect.arrayContaining([
        expect.objectContaining({
          kind: "local-evidence-tool-only",
          exactDiffStatus: "demotion-guard-only",
          fixtureDiffTarget: "local-evidence.native-claim-guard",
          upstreamAnchorRefs: ["not-upstream:local-evidence-tool:packages/cli"],
        }),
      ]),
      nextAction: expect.stringContaining("Inspect packages/cli/src/index.ts command routing"),
    })
    expect(opencodePromptWorkItem).toBeUndefined()
    expect(localEvidenceWorkItem).toMatchObject({
      ownerTODO: "TODO-029",
      priority: "P1-native-parity",
      divergenceKind: "local-evidence-tool-only",
      itemIDs: expect.arrayContaining(["package:packages/cli"]),
      exactDiffStatuses: expect.arrayContaining(["demotion-guard-only"]),
      fixtureDiffTargets: expect.arrayContaining(["local-evidence.native-claim-guard"]),
      comparisonDimensions: expect.arrayContaining(["local-tooling", "evidence-only", "native-claim-negative", "upstream-nonapplicability"]),
      action: expect.stringContaining("Add the named upstream fixture/gate"),
    })
    expect(compatibilityExportWorkItem).toMatchObject({
      ownerTODO: "TODO-029",
      priority: "P1-native-parity",
      divergenceKind: "compatibility-export-only",
      itemIDs: expect.arrayContaining(["package:packages/opencode-plugin", "package:packages/pi-coding-agent"]),
      exactDiffStatuses: expect.arrayContaining(["demotion-guard-only"]),
      fixtureDiffTargets: expect.arrayContaining(["compat-export.api-surface-guard"]),
      comparisonDimensions: expect.arrayContaining(["exported-api-name", "type-surface", "lifecycle-not-implemented", "native-claim-negative"]),
    })
    expect(verification.checks.find((check) => check.id === "current-module-audit.classification-complete")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "current-module-audit.upstream-head-drift.marked")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "current-module-audit.upstream-source.product-scoped-mapped")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "current-module-audit.pinned-upstream-behavior.classified")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "current-module-audit.pinned-upstream-divergence.details")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "current-module-audit.pinned-upstream-divergence.verification-targets")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "current-module-audit.behavior-exact-diff.targets")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "current-module-audit.work-queue.covered")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "current-module-audit.fixture-diff-queue.covered")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "current-module-audit.source-file-fixture-queue.covered")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "current-module-audit.source-owner-line-level-summaries.complete")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "current-module-audit.product-summaries.complete")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "current-module-audit.package-summaries.complete")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "current-module-audit.plane-summaries.complete")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "current-module-audit.current-source-file-summaries.complete")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "current-module-audit.source-verification-classified")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "current-module-audit.current-source-files.mapped")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "current-module-audit.manual-package-entrypoints.mapped")).toMatchObject({ ok: true })
    expect(verification.warnings).toEqual([])
    expect(verification.checks.find((check) => check.id === "current-module-audit.open-work-visible")).toMatchObject({ ok: true })
  })

  it("groups source-file fixture work by source owner and line-level exact-diff status", () => {
    const audit = buildCurrentModulePlaceholderAudit({
      generatedAt: "2026-06-10T00:00:00.000Z",
    })
    const verification = verifyCurrentModulePlaceholderAudit(audit)
    const legoHooksSummary = audit.sourceOwnerLineLevelSummaries.find((summary) => summary.sourceOwnerPackagePath === "packages/lego-hooks")
    const piVirtualTaskSummary = audit.sourceOwnerLineLevelSummaries.find((summary) => summary.sourceOwnerPackagePath === "packages/pi-mono.task.runner.native-cli")
    const legoHooksPortFixtureSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/lego-hooks/src/port-fixtures.ts")
    const piVirtualTaskSourceSummary = audit.currentSourceFileSummaries.find((summary) => summary.currentSourceFile === "packages/pi-mono.task.runner.native-cli/src/index.ts")

    expect(verification.checks.find((check) => check.id === "current-module-audit.source-owner-line-level-summaries.complete")).toMatchObject({ ok: true })
    expect(audit.sourceOwnerLineLevelSummaries).toHaveLength(30)
    expect(legoHooksSummary).toBeUndefined()
    expect(piVirtualTaskSummary).toMatchObject({
      sourceOwnerPackagePath: "packages/pi-mono.task.runner.native-cli",
      sourceOwnerPackageCatalogStatus: "virtual-package",
      moduleConfirmationStatus: "demotion-guard-confirmed",
      moduleConfirmationSummary: expect.stringContaining("demotion/native-claim guard"),
      queueItems: 1,
      itemCount: 1,
      currentSourceFileCount: 1,
      sampleCurrentSourceFiles: ["packages/pi-mono.task.runner.native-cli/src/index.ts"],
      products: [],
      planes: ["task"],
      packages: [],
      ownerTODOs: ["TODO-027"],
      lineLevelDiffMissing: 0,
      semanticFixtureNeedsExactDiff: 0,
      demotionGuardOnly: 1,
      manualAnchorNeeded: 0,
      byFixtureDiffTarget: {
        "metadata.executable-blocker": 1,
      },
      sampleFixtureImplementationTargets: ["preserve-guard:metadata.executable-blocker:packages/pi-mono.task.runner.native-cli/src/index.ts"],
      sampleNegativeVerificationTargets: ["native-claim-guard:metadata.executable-blocker:packages/pi-mono.task.runner.native-cli/src/index.ts"],
    })
      expect(legoHooksPortFixtureSourceSummary).toMatchObject({
      currentSourceFile: "packages/lego-hooks/src/port-fixtures.ts",
      sourceOwnerPackagePath: "packages/lego-hooks",
      sourceOwnerPackageCatalogStatus: "catalog-package",
      moduleConfirmationStatus: "no-open-divergence",
      moduleConfirmationSummary: expect.stringContaining("no open source-file fixture divergence"),
      })
    expect(piVirtualTaskSourceSummary).toMatchObject({
      currentSourceFile: "packages/pi-mono.task.runner.native-cli/src/index.ts",
      sourceOwnerPackagePath: "packages/pi-mono.task.runner.native-cli",
      sourceOwnerPackageCatalogStatus: "virtual-package",
      moduleConfirmationStatus: "demotion-guard-confirmed",
      moduleConfirmationSummary: expect.stringContaining("demotion/native-claim guard"),
    })
  })

  it("writes JSON and Markdown reports that round-trip through the verifier", () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-current-module-audit-"))
    try {
      const jsonPath = join(dir, "current-module-placeholder-audit.json")
      const markdownPath = join(dir, "current-module-placeholder-audit.md")
      const audit = buildCurrentModulePlaceholderAudit({
        products: ["opencode"],
        generatedAt: "2026-06-10T00:00:00.000Z",
      })

      writeCurrentModulePlaceholderAuditReports({ audit, jsonPath, markdownPath })

      const roundTripped = JSON.parse(readFileSync(jsonPath, "utf8")) as CurrentModulePlaceholderAudit
      const markdown = readFileSync(markdownPath, "utf8")
      expect(verifyCurrentModulePlaceholderAudit(roundTripped).ok).toBe(true)
      expect(roundTripped.summary.fingerprint).toBe(audit.summary.fingerprint)
      expect(markdown).toContain("# Current Module Placeholder Audit")
      expect(markdown).toContain("## Upstream Baselines")
      expect(markdown).toContain("## Product Summaries")
      expect(markdown).toContain("## Package Summaries")
      expect(markdown).toContain("## Source Owner Line-Level Summaries")
      expect(markdown).toContain("## Plane Summaries")
      expect(markdown).toContain("## Current Source File Summaries")
      expect(markdown).toContain("## Source File Fixture Queue")
      expect(markdown).toContain("## Implementation Levels")
      expect(markdown).toContain("## Upstream Drift Status")
      expect(markdown).toContain("## Upstream Source Status")
      expect(markdown).toContain("## Pinned Upstream Behavior Status")
      expect(markdown).toContain("## Pinned Upstream Divergence Kinds")
      expect(markdown).toContain("## Behavior Exact Diff Status")
      expect(markdown).toContain("## Fixture Diff Targets")
      expect(markdown).toContain("## Comparison Dimensions")
      expect(markdown).toContain("## Fixture Diff Queue")
      expect(markdown).toContain("## Work Queue Owners")
      expect(markdown).toContain("## Pinned Divergence Verification Targets")
      expect(markdown).toContain("## Owner Work Queue")
      expect(markdown).toContain("P1-native-parity")
      expect(markdown).toContain("exact-diff-partial")
      expect(markdown).toContain("Product native complete | 108")
      expect(markdown).toContain("| opencode | `opencode.ui.renderer` | ui | native |")
      expect(markdown).toContain("local-evidence.native-claim-guard")
      expect(markdown).toContain("compat-export.api-surface-guard")
      expect(markdown).toContain("`packages/adapters-opencode/src/plugin-atoms.ts`")
      expect(markdown).toContain("`packages/lego-agent-loop/src/product-turn/atoms.ts`")
      expect(markdown).toContain("`packages/lego-agent-loop/src/loop/run-turn.ts`")
      expect(markdown).toContain("`packages/lego-agent-loop`")
      expect(markdown).toContain("`packages/lego-hooks`")
      expect(markdown).toContain("no-open-divergence")
      expect(markdown).toContain("semantic-fixture-with-lossiness")
      expect(markdown).toContain("demotion-guard-confirmed")
      expect(markdown).toContain("`metadata.executable-blocker` 22")
      expect(markdown).toContain("| opencode | `opencode.ui.event-loop` | ui | native |")
      expect(markdown).toContain("`opencode.ui.snapshot`")
      expect(markdown).toContain("preserve-guard:metadata.executable-blocker:packages/adapters-opencode/src/opencode-turn-context-builder.ts")
      expect(markdown).toContain("## Upstream Source Samples")
      expect(markdown).toContain("pinned-source-path-mapped")
      expect(markdown).toContain("pinned-partial-or-lossy")
      expect(markdown).toContain("prompt-family-partial")
      expect(markdown).toContain("## Source Verification Status")
      expect(markdown).toContain("product-native-exact-fixture")
      expect(markdown).toContain("## Product Transition Atoms")
      expect(markdown).toContain("## Required Binding Risks")
      expect(markdown).toContain("manual-source-check-required")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("rejects audits that lose classification or unproven native source evidence", () => {
    const audit = buildCurrentModulePlaceholderAudit({
      products: ["opencode"],
      generatedAt: "2026-06-10T00:00:00.000Z",
    })
    const stripped: CurrentModulePlaceholderAudit = {
      ...audit,
      productSummaries: [],
      packageSummaries: [],
      planeSummaries: [],
      currentSourceFileSummaries: [],
      sourceOwnerLineLevelSummaries: [],
      workQueue: [],
      fixtureDiffQueue: [],
      sourceFileFixtureQueue: [],
      items: audit.items.map((item) => {
        if (item.id === "atom:opencode:opencode.prompt.mode-builder") {
          return { ...item, nextAction: "", summary: "", upstreamBaselineRefs: [], upstreamSourceLocations: [], upstreamSourceStatus: "upstream-baseline-only", pinnedUpstreamBehaviorStatus: "not-product-scoped", pinnedUpstreamDivergences: [] }
        }
        if (item.id === "atom:opencode:opencode.turn.context-builder") {
          return {
            ...item,
            implementationLevel: "native",
            upstreamRefs: [],
            evidenceRefs: [],
            knownLossiness: ["partial-product-turn-replay"],
            pinnedUpstreamDivergences: [],
          }
        }
        if (item.id === "atom:opencode:opencode.product-shell.harness") {
          return {
            ...item,
            pinnedUpstreamDivergences: item.pinnedUpstreamDivergences.map((divergence) => ({
              ...divergence,
              upstreamAnchorRefs: [],
              currentAnchorRefs: [],
              requiredEvidence: "",
              nextVerification: "",
              fixtureDiffTarget: "",
              comparisonDimensions: [],
              currentCoverage: "",
            })),
          }
        }
        return item
      }),
    }

    const verification = verifyCurrentModulePlaceholderAudit(stripped)

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toEqual(
      expect.arrayContaining([
        "current-module-audit.fingerprint",
        "current-module-audit.upstream-source.product-scoped-mapped",
        "current-module-audit.pinned-upstream-behavior.classified",
        "current-module-audit.work-queue.covered",
        "current-module-audit.fixture-diff-queue.covered",
        "current-module-audit.source-file-fixture-queue.covered",
        "current-module-audit.source-owner-line-level-summaries.complete",
        "current-module-audit.product-summaries.complete",
        "current-module-audit.package-summaries.complete",
        "current-module-audit.package-source-ownership.visible",
        "current-module-audit.plane-summaries.complete",
        "current-module-audit.current-source-file-summaries.complete",
        "current-module-audit.upstream-head-drift.marked",
        "current-module-audit.classification-complete",
        "current-module-audit.native-requires-source-evidence",
      ]),
    )
  })

  it("is available through the public CLI and writes verifiable report artifacts", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-current-module-audit-cli-"))
    try {
      const jsonPath = join(dir, "current-module-placeholder-audit.json")
      const markdownPath = join(dir, "current-module-placeholder-audit.md")
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

      expect(await runCli(["current-module-placeholder-audit", "--product", "opencode,pi-mono,nanobot,hermes-agent", "--out", jsonPath, "--markdown", markdownPath, "--json"], io)).toBe(0)
      expect(existsSync(jsonPath)).toBe(true)
      expect(existsSync(markdownPath)).toBe(true)
      const output = JSON.parse(stdout.join("")) as { audit: CurrentModulePlaceholderAudit; verification: { ok: boolean } }
      expect(output.verification.ok).toBe(true)
      expect(output.audit.summary.totalItems).toBe(898)
      expect(output.audit.fixtureDiffQueue).toHaveLength(5)
      expect(output.audit.sourceFileFixtureQueue).toHaveLength(175)
      expect(output.audit.sourceOwnerLineLevelSummaries).toHaveLength(30)
      expect(output.audit.summary.sourceOwnerLineLevelSummaryItems).toBe(30)
      expect(output.audit.productSummaries).toHaveLength(4)
      expect(output.audit.packageSummaries).toHaveLength(20)
      expect(output.audit.planeSummaries.length).toBeGreaterThanOrEqual(17)
      expect(output.audit.currentSourceFileSummaries).toHaveLength(168)

      stdout.length = 0
      expect(await runCli(["verify-current-module-placeholder-audit", "--artifact", jsonPath, "--json"], io)).toBe(0)
      const verification = JSON.parse(stdout.join("")) as { ok: boolean }
      expect(verification.ok).toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
