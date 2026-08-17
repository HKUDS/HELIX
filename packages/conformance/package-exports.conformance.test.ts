import { execFile } from "node:child_process"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { promisify } from "node:util"
import { describe, expect, it } from "vitest"

interface PublicSubpath {
  packageDir: string
  packageName: string
  exportPath: string
  specifier: string
  expected?: string
}

const publicSubpaths: PublicSubpath[] = [
  {
    packageDir: "lego-session",
    packageName: "@helix/lego-session",
    exportPath: "./message-part-projector",
    specifier: "@helix/lego-session/message-part-projector",
    expected: "projectMessagePartType",
  },
  {
    packageDir: "lego-session",
    packageName: "@helix/lego-session",
    exportPath: "./atoms",
    specifier: "@helix/lego-session/atoms",
    expected: "createInMemorySessionAtoms",
  },
  {
    packageDir: "lego-tools",
    packageName: "@helix/lego-tools",
    exportPath: "./default-tools",
    specifier: "@helix/lego-tools/default-tools",
    expected: "createDefaultTools",
  },
  {
    packageDir: "lego-tools",
    packageName: "@helix/lego-tools",
    exportPath: "./tool-atoms",
    specifier: "@helix/lego-tools/tool-atoms",
    expected: "toolPackCatalog",
  },
  {
    packageDir: "lego-tools",
    packageName: "@helix/lego-tools",
    exportPath: "./cadence-atoms",
    specifier: "@helix/lego-tools/cadence-atoms",
    expected: "createToolSchemaSnapshot",
  },
  {
    packageDir: "lego-tools",
    packageName: "@helix/lego-tools",
    exportPath: "./product-schema/opencode",
    specifier: "@helix/lego-tools/product-schema/opencode",
    expected: "buildOpenCodeToolSchemaNativeExactFixture",
  },
  {
    packageDir: "lego-tools",
    packageName: "@helix/lego-tools",
    exportPath: "./ports",
    specifier: "@helix/lego-tools/ports",
    expected: "createLocalFilesystemPort",
  },
  {
    packageDir: "lego-hooks",
    packageName: "@helix/lego-hooks",
    exportPath: "./hook-atoms",
    specifier: "@helix/lego-hooks/hook-atoms",
    expected: "createHookEventBus",
  },
  {
    packageDir: "lego-config",
    packageName: "@helix/lego-config",
    exportPath: "./config-atoms",
    specifier: "@helix/lego-config/config-atoms",
    expected: "createEnvConfigSource",
  },
  {
    packageDir: "lego-prompt",
    packageName: "@helix/lego-prompt",
    exportPath: "./opencode-system",
    specifier: "@helix/lego-prompt/opencode-system",
    expected: "buildOpenCodeUpstreamSystemPromptOutputMatrixSnapshotFromPolicy",
  },
  {
    packageDir: "lego-prompt",
    packageName: "@helix/lego-prompt",
    exportPath: "./prompt-atoms",
    specifier: "@helix/lego-prompt/prompt-atoms",
    expected: "createPromptSystemBuilderAtom",
  },
  {
    packageDir: "lego-prompt",
    packageName: "@helix/lego-prompt",
    exportPath: "./product-schema/nanobot",
    specifier: "@helix/lego-prompt/product-schema/nanobot",
    expected: "buildNanobotPromptNativeExactFixture",
  },
  {
    packageDir: "lego-prompt",
    packageName: "@helix/lego-prompt",
    exportPath: "./product-schema/hermes",
    specifier: "@helix/lego-prompt/product-schema/hermes",
    expected: "buildHermesPromptNativeExactFixture",
  },
  {
    packageDir: "lego-ui",
    packageName: "@helix/lego-ui",
    exportPath: "./ui-atoms",
    specifier: "@helix/lego-ui/ui-atoms",
    expected: "createUIEventLoopAtom",
  },
  {
    packageDir: "lego-ui",
    packageName: "@helix/lego-ui",
    exportPath: "./product-schema/opencode",
    specifier: "@helix/lego-ui/product-schema/opencode",
    expected: "buildOpenCodeUINativeExactFixture",
  },
  {
    packageDir: "lego-ui",
    packageName: "@helix/lego-ui",
    exportPath: "./product-schema/nanobot",
    specifier: "@helix/lego-ui/product-schema/nanobot",
    expected: "buildNanobotUINativeExactFixture",
  },
  {
    packageDir: "lego-provider",
    packageName: "@helix/lego-provider",
    exportPath: "./openai-compatible",
    specifier: "@helix/lego-provider/openai-compatible",
    expected: "createOpenAICompatibleProvider",
  },
  {
    packageDir: "lego-provider",
    packageName: "@helix/lego-provider",
    exportPath: "./streaming-delta-recorder",
    specifier: "@helix/lego-provider/streaming-delta-recorder",
    expected: "recordStreamingDeltas",
  },
  {
    packageDir: "lego-provider",
    packageName: "@helix/lego-provider",
    exportPath: "./ports",
    specifier: "@helix/lego-provider/ports",
    expected: "createFetchProviderTransport",
  },
  {
    packageDir: "lego-runtime",
    packageName: "@helix/lego-runtime",
    exportPath: "./acceptance-controller",
    specifier: "@helix/lego-runtime/acceptance-controller",
    expected: "createRuntimeAcceptanceController",
  },
  {
    packageDir: "lego-runtime",
    packageName: "@helix/lego-runtime",
    exportPath: "./port-fixtures",
    specifier: "@helix/lego-runtime/port-fixtures",
    expected: "runtimePortContractFixtures",
  },
  {
    packageDir: "lego-agent-loop",
    packageName: "@helix/lego-agent-loop",
    exportPath: "./cadence-policies",
    specifier: "@helix/lego-agent-loop/cadence-policies",
    expected: "createCadencePolicyBundle",
  },
  {
    packageDir: "lego-agent-loop",
    packageName: "@helix/lego-agent-loop",
    exportPath: "./product-schema/opencode",
    specifier: "@helix/lego-agent-loop/product-schema/opencode",
    expected: "buildOpenCodeAgentLoopRequestBoundaryNativeExactFixture",
  },
  {
    packageDir: "lego-runtime",
    packageName: "@helix/lego-runtime",
    exportPath: "./runtime-atoms",
    specifier: "@helix/lego-runtime/runtime-atoms",
    expected: "createRuntimeProductAtoms",
  },
  {
    packageDir: "lego-runtime",
    packageName: "@helix/lego-runtime",
    exportPath: "./product-schema/nanobot",
    specifier: "@helix/lego-runtime/product-schema/nanobot",
    expected: "buildNanobotRuntimeAcceptanceNativeExactFixture",
  },
  {
    packageDir: "lego-runtime",
    packageName: "@helix/lego-runtime",
    exportPath: "./product-schema/hermes",
    specifier: "@helix/lego-runtime/product-schema/hermes",
    expected: "buildHermesRuntimeAcceptanceNativeExactFixture",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./product-surface",
    specifier: "@helix/adapters-opencode/product-surface",
    expected: "createOpenCodeSDK",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-sdk",
    specifier: "@helix/adapters-opencode/opencode-sdk",
    expected: "createOpenCodeSDK",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-server",
    specifier: "@helix/adapters-opencode/opencode-server",
    expected: "createOpenCodeServer",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./product-schema/product-shell",
    specifier: "@helix/adapters-opencode/product-schema/product-shell",
    expected: "buildOpenCodeProductShellNativeExactFixture",
  },
  {
    packageDir: "adapters-nanobot",
    packageName: "@helix/adapters-nanobot",
    exportPath: "./product-schema/product-shell",
    specifier: "@helix/adapters-nanobot/product-schema/product-shell",
    expected: "buildNanobotProductShellNativeExactFixture",
  },
  {
    packageDir: "adapters-nanobot",
    packageName: "@helix/adapters-nanobot",
    exportPath: "./product-schema/events",
    specifier: "@helix/adapters-nanobot/product-schema/events",
    expected: "buildNanobotEventNativeExactFixture",
  },
  {
    packageDir: "adapters-nanobot",
    packageName: "@helix/adapters-nanobot",
    exportPath: "./product-schema/trace",
    specifier: "@helix/adapters-nanobot/product-schema/trace",
    expected: "buildNanobotTraceNativeExactFixture",
  },
  {
    packageDir: "adapters-hermes",
    packageName: "@helix/adapters-hermes",
    exportPath: "./product-schema/ui",
    specifier: "@helix/adapters-hermes/product-schema/ui",
    expected: "buildHermesUINativeExactFixture",
  },
  {
    packageDir: "adapters-hermes",
    packageName: "@helix/adapters-hermes",
    exportPath: "./product-schema/product-shell",
    specifier: "@helix/adapters-hermes/product-schema/product-shell",
    expected: "buildHermesProductShellNativeExactFixture",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-workspace",
    specifier: "@helix/adapters-opencode/opencode-workspace",
    expected: "createOpenCodeWorkspaceSurface",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-identity",
    specifier: "@helix/adapters-opencode/opencode-identity",
    expected: "createOpenCodeNativeIdentityWorkspaceResolver",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-hook-error-defaults",
    specifier: "@helix/adapters-opencode/opencode-hook-error-defaults",
    expected: "createOpenCodeHookErrorDefaults",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-hook-handler",
    specifier: "@helix/adapters-opencode/opencode-hook-handler",
    expected: "createOpenCodeHookHandler",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-hook-observer",
    specifier: "@helix/adapters-opencode/opencode-hook-observer",
    expected: "createOpenCodeHookObserver",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-hook-scheduler",
    specifier: "@helix/adapters-opencode/opencode-hook-scheduler",
    expected: "createOpenCodeHookScheduler",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-command-registry",
    specifier: "@helix/adapters-opencode/opencode-command-registry",
    expected: "createOpenCodeCommandRegistryBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-provider-auth-descriptor",
    specifier: "@helix/adapters-opencode/opencode-provider-auth-descriptor",
    expected: "createOpenCodeProviderAuthDescriptor",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-provider-plugin-descriptor",
    specifier: "@helix/adapters-opencode/opencode-provider-plugin-descriptor",
    expected: "createOpenCodeProviderPluginDescriptor",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-plugin-provider-registry",
    specifier: "@helix/adapters-opencode/opencode-plugin-provider-registry",
    expected: "createOpenCodePluginProviderRegistryBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-plugin-ui-registry",
    specifier: "@helix/adapters-opencode/opencode-plugin-ui-registry",
    expected: "createOpenCodePluginUIRegistryBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-plugin-v2-definition",
    specifier: "@helix/adapters-opencode/opencode-plugin-v2-definition",
    expected: "defineOpenCodePluginV2",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-plugin-loader",
    specifier: "@helix/adapters-opencode/opencode-plugin-loader",
    expected: "createOpenCodeNativePluginLoaderAtom",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-plugin-hot-reload-cleanup",
    specifier: "@helix/adapters-opencode/opencode-plugin-hot-reload-cleanup",
    expected: "createOpenCodePluginHotReloadCleanup",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-event-envelope",
    specifier: "@helix/adapters-opencode/opencode-event-envelope",
    expected: "createOpenCodeEventEnvelopeBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-sync-event-log",
    specifier: "@helix/adapters-opencode/opencode-sync-event-log",
    expected: "createOpenCodeSyncEventLogBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-plugin-event-mapper",
    specifier: "@helix/adapters-opencode/opencode-plugin-event-mapper",
    expected: "createOpenCodeNativePluginEventMapper",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-plugin-tool-registry",
    specifier: "@helix/adapters-opencode/opencode-plugin-tool-registry",
    expected: "createOpenCodePluginToolRegistryBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-shell-env",
    specifier: "@helix/adapters-opencode/opencode-shell-env",
    expected: "createOpenCodeShellEnvBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-tool-schema-bridge",
    specifier: "@helix/adapters-opencode/opencode-tool-schema-bridge",
    expected: "createOpenCodeToolSchemaBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-tool-result-render",
    specifier: "@helix/adapters-opencode/opencode-tool-result-render",
    expected: "createOpenCodeToolResultRenderBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-tool-permission-render",
    specifier: "@helix/adapters-opencode/opencode-tool-permission-render",
    expected: "createOpenCodeToolPermissionRenderBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-plugin-permission-bridge",
    specifier: "@helix/adapters-opencode/opencode-plugin-permission-bridge",
    expected: "createOpenCodeNativePluginPermissionBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-tool-definition-plugin",
    specifier: "@helix/adapters-opencode/opencode-tool-definition-plugin",
    expected: "createOpenCodeToolDefinitionPluginBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-provider-model-plugin",
    specifier: "@helix/adapters-opencode/opencode-provider-model-plugin",
    expected: "createOpenCodeProviderModelPluginDescriptor",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-provider-usage",
    specifier: "@helix/adapters-opencode/opencode-provider-usage",
    expected: "createOpenCodeProviderUsageNormalizer",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-provider-request-options",
    specifier: "@helix/adapters-opencode/opencode-provider-request-options",
    expected: "createOpenCodeProviderRequestOptionsBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-turn-input-normalizer",
    specifier: "@helix/adapters-opencode/opencode-turn-input-normalizer",
    expected: "createOpenCodeTurnInputNormalizerBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-turn-context-builder",
    specifier: "@helix/adapters-opencode/opencode-turn-context-builder",
    expected: "createOpenCodeTurnContextBuilderBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-turn-provider-request-builder",
    specifier: "@helix/adapters-opencode/opencode-turn-provider-request-builder",
    expected: "createOpenCodeTurnProviderRequestBuilderBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-turn-provider-stream-runner",
    specifier: "@helix/adapters-opencode/opencode-turn-provider-stream-runner",
    expected: "createOpenCodeTurnProviderStreamRunnerBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-turn-prompt-assembler",
    specifier: "@helix/adapters-opencode/opencode-turn-prompt-assembler",
    expected: "createOpenCodeTurnPromptAssemblerBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-turn-retry-policy",
    specifier: "@helix/adapters-opencode/opencode-turn-retry-policy",
    expected: "createOpenCodeTurnRetryPolicyBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-turn-stream-reducer",
    specifier: "@helix/adapters-opencode/opencode-turn-stream-reducer",
    expected: "createOpenCodeTurnStreamReducerBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-turn-loop-control",
    specifier: "@helix/adapters-opencode/opencode-turn-loop-control",
    expected: "createOpenCodeTurnLoopControlBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-turn-tool-loop",
    specifier: "@helix/adapters-opencode/opencode-turn-tool-loop",
    expected: "createOpenCodeTurnToolLoopBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-turn-compaction-policy",
    specifier: "@helix/adapters-opencode/opencode-turn-compaction-policy",
    expected: "createOpenCodeTurnCompactionPolicyBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-turn-result-recorder",
    specifier: "@helix/adapters-opencode/opencode-turn-result-recorder",
    expected: "createOpenCodeTurnResultRecorderBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-provider-parser-observer",
    specifier: "@helix/adapters-opencode/opencode-provider-parser-observer",
    expected: "createOpenCodeProviderParserObserverBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-provider-event-observer",
    specifier: "@helix/adapters-opencode/opencode-provider-event-observer",
    expected: "createOpenCodeProviderEventObserverBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-provider-stream-projector",
    specifier: "@helix/adapters-opencode/opencode-provider-stream-projector",
    expected: "captureOpenCodeProviderStreamProjectorNativeExactFixture",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-provider-transport-instrumentation",
    specifier: "@helix/adapters-opencode/opencode-provider-transport-instrumentation",
    expected: "createOpenCodeProviderTransportInstrumentationBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-provider-builtin-plugins",
    specifier: "@helix/adapters-opencode/opencode-provider-builtin-plugins",
    expected: "captureOpenCodeProviderBuiltinPluginsNativeExactFixture",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-provider-dynamic-package",
    specifier: "@helix/adapters-opencode/opencode-provider-dynamic-package",
    expected: "captureOpenCodeDynamicProviderPackageNativeExactFixture",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-session-id-generator",
    specifier: "@helix/adapters-opencode/opencode-session-id-generator",
    expected: "createOpenCodeNativeSessionIDGenerator",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-session-compaction-event",
    specifier: "@helix/adapters-opencode/opencode-session-compaction-event",
    expected: "createOpenCodeSessionCompactionEventBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-session-branch-graph",
    specifier: "@helix/adapters-opencode/opencode-session-branch-graph",
    expected: "createOpenCodeSessionBranchGraphBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-session-message-v2-projector",
    specifier: "@helix/adapters-opencode/opencode-session-message-v2-projector",
    expected: "createOpenCodeSessionMessageV2ProjectorBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-session-sqlite-projection",
    specifier: "@helix/adapters-opencode/opencode-session-sqlite-projection",
    expected: "createOpenCodeSessionSQLiteProjectionBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-session-pagination",
    specifier: "@helix/adapters-opencode/opencode-session-pagination",
    expected: "createOpenCodeSessionPaginationBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-session-syncevent-projector",
    specifier: "@helix/adapters-opencode/opencode-session-syncevent-projector",
    expected: "createOpenCodeSessionSyncEventProjector",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-trace-debug-surface",
    specifier: "@helix/adapters-opencode/opencode-trace-debug-surface",
    expected: "createOpenCodeTraceDebugSurface",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-tool-status",
    specifier: "@helix/adapters-opencode/opencode-tool-status",
    expected: "createOpenCodeToolStatusBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-hook-plugin-bridge",
    specifier: "@helix/adapters-opencode/opencode-hook-plugin-bridge",
    expected: "createOpenCodeHookPluginBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-workspace-filesystem",
    specifier: "@helix/adapters-opencode/opencode-workspace-filesystem",
    expected: "createOpenCodeWorkspaceFilesystemBridge",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-control-plane",
    specifier: "@helix/adapters-opencode/opencode-control-plane",
    expected: "createOpenCodeControlPlane",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-tui",
    specifier: "@helix/adapters-opencode/opencode-tui",
    expected: "createOpenCodeTUI",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-web",
    specifier: "@helix/adapters-opencode/opencode-web",
    expected: "createOpenCodeWeb",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-desktop",
    specifier: "@helix/adapters-opencode/opencode-desktop",
    expected: "createOpenCodeDesktop",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./opencode-slack",
    specifier: "@helix/adapters-opencode/opencode-slack",
    expected: "createOpenCodeSlack",
  },
  {
    packageDir: "adapters-opencode",
    packageName: "@helix/adapters-opencode",
    exportPath: "./plugin-atoms",
    specifier: "@helix/adapters-opencode/plugin-atoms",
    expected: "createOpenCodePluginLoaderAtom",
  },
  {
    packageDir: "adapters-pi",
    packageName: "@helix/adapters-pi",
    exportPath: "./product-surface",
    specifier: "@helix/adapters-pi/product-surface",
    expected: "createPiSDK",
  },
  {
    packageDir: "adapters-pi",
    packageName: "@helix/adapters-pi",
    exportPath: "./pi-sdk",
    specifier: "@helix/adapters-pi/pi-sdk",
    expected: "createPiSDK",
  },
  {
    packageDir: "adapters-pi",
    packageName: "@helix/adapters-pi",
    exportPath: "./pi-cli",
    specifier: "@helix/adapters-pi/pi-cli",
    expected: "createPiCLI",
  },
  {
    packageDir: "adapters-pi",
    packageName: "@helix/adapters-pi",
    exportPath: "./pi-tui",
    specifier: "@helix/adapters-pi/pi-tui",
    expected: "createPiTUI",
  },
  {
    packageDir: "adapters-pi",
    packageName: "@helix/adapters-pi",
    exportPath: "./pi-rpc",
    specifier: "@helix/adapters-pi/pi-rpc",
    expected: "createPiRPC",
  },
  {
    packageDir: "adapters-pi",
    packageName: "@helix/adapters-pi",
    exportPath: "./pi-web-ui",
    specifier: "@helix/adapters-pi/pi-web-ui",
    expected: "createPiWebUI",
  },
  {
    packageDir: "adapters-pi",
    packageName: "@helix/adapters-pi",
    exportPath: "./pi-server",
    specifier: "@helix/adapters-pi/pi-server",
    expected: "createPiServer",
  },
  {
    packageDir: "adapters-pi",
    packageName: "@helix/adapters-pi",
    exportPath: "./pi-package-manager",
    specifier: "@helix/adapters-pi/pi-package-manager",
    expected: "createPiPackageManager",
  },
  {
    packageDir: "adapters-pi",
    packageName: "@helix/adapters-pi",
    exportPath: "./pi-extension-examples",
    specifier: "@helix/adapters-pi/pi-extension-examples",
    expected: "createPiExtensionExamples",
  },
  {
    packageDir: "adapters-pi",
    packageName: "@helix/adapters-pi",
    exportPath: "./pi-browser-smoke",
    specifier: "@helix/adapters-pi/pi-browser-smoke",
    expected: "createPiBrowserSmoke",
  },
  {
    packageDir: "adapters-pi",
    packageName: "@helix/adapters-pi",
    exportPath: "./pi-release-hardening",
    specifier: "@helix/adapters-pi/pi-release-hardening",
    expected: "createPiReleaseHardening",
  },
  {
    packageDir: "adapters-pi",
    packageName: "@helix/adapters-pi",
    exportPath: "./extension-atoms",
    specifier: "@helix/adapters-pi/extension-atoms",
    expected: "createPiExtensionLoaderAtom",
  },
  {
    packageDir: "adapters-nanobot",
    packageName: "@helix/adapters-nanobot",
    exportPath: "./product-surface",
    specifier: "@helix/adapters-nanobot/product-surface",
    expected: "createNanobotSDK",
  },
  {
    packageDir: "adapters-nanobot",
    packageName: "@helix/adapters-nanobot",
    exportPath: "./nanobot-sdk",
    specifier: "@helix/adapters-nanobot/nanobot-sdk",
    expected: "createNanobotSDK",
  },
  {
    packageDir: "adapters-nanobot",
    packageName: "@helix/adapters-nanobot",
    exportPath: "./nanobot-cli",
    specifier: "@helix/adapters-nanobot/nanobot-cli",
    expected: "createNanobotCLI",
  },
  {
    packageDir: "adapters-nanobot",
    packageName: "@helix/adapters-nanobot",
    exportPath: "./nanobot-tui",
    specifier: "@helix/adapters-nanobot/nanobot-tui",
    expected: "createNanobotTUI",
  },
  {
    packageDir: "adapters-nanobot",
    packageName: "@helix/adapters-nanobot",
    exportPath: "./nanobot-web-ui",
    specifier: "@helix/adapters-nanobot/nanobot-web-ui",
    expected: "createNanobotWebUI",
  },
  {
    packageDir: "adapters-nanobot",
    packageName: "@helix/adapters-nanobot",
    exportPath: "./nanobot-server",
    specifier: "@helix/adapters-nanobot/nanobot-server",
    expected: "createNanobotServer",
  },
  {
    packageDir: "adapters-nanobot",
    packageName: "@helix/adapters-nanobot",
    exportPath: "./nanobot-atoms",
    specifier: "@helix/adapters-nanobot/nanobot-atoms",
    expected: "createNanobotPluginLoaderAtom",
  },
  {
    packageDir: "recipes",
    packageName: "@helix/recipes",
    exportPath: "./atom-catalog",
    specifier: "@helix/recipes/atom-catalog",
    expected: "defaultAtomRecipeModuleCatalog",
  },
  {
    packageDir: "recipes",
    packageName: "@helix/recipes",
    exportPath: "./packs",
    specifier: "@helix/recipes/packs",
    expected: "defaultRecipePackCatalog",
  },
  {
    packageDir: "recipes",
    packageName: "@helix/recipes",
    exportPath: "./harness-atoms",
    specifier: "@helix/recipes/harness-atoms",
    expected: "createHarnessAssemblyAtom",
  },
  {
    packageDir: "recipes",
    packageName: "@helix/recipes",
    exportPath: "./boundary-lint",
    specifier: "@helix/recipes/boundary-lint",
    expected: "auditSourceBoundaries",
  },
  {
    packageDir: "recipes",
    packageName: "@helix/recipes",
    exportPath: "./block-ledger",
    specifier: "@helix/recipes/block-ledger",
    expected: "auditLegoBlockLedger",
  },
  {
    packageDir: "recipes",
    packageName: "@helix/recipes",
    exportPath: "./personality-inventory",
    specifier: "@helix/recipes/personality-inventory",
    expected: "auditPersonalityInventory",
  },
  {
    packageDir: "recipes",
    packageName: "@helix/recipes",
    exportPath: "./recipe-targets",
    specifier: "@helix/recipes/recipe-targets",
    expected: "buildRecipeTargetShapeReport",
  },
  {
    packageDir: "recipes",
    packageName: "@helix/recipes",
    exportPath: "./pipeline-swaps",
    specifier: "@helix/recipes/pipeline-swaps",
    expected: "auditRecipeLevelPipelineSwaps",
  },
  {
    packageDir: "recipes",
    packageName: "@helix/recipes",
    exportPath: "./nanobot-fit-audit",
    specifier: "@helix/recipes/nanobot-fit-audit",
    expected: "runNanobotFitAudit",
  },
  {
    packageDir: "recipes",
    packageName: "@helix/recipes",
    exportPath: "./opencode-differential",
    specifier: "@helix/recipes/opencode-differential",
    expected: "runOpenCodeDifferential",
  },
  {
    packageDir: "recipes",
    packageName: "@helix/recipes",
    exportPath: "./task-parity",
    specifier: "@helix/recipes/task-parity",
    expected: "runProductTaskParity",
  },
  {
    packageDir: "recipes",
    packageName: "@helix/recipes",
    exportPath: "./assembly-contract",
    specifier: "@helix/recipes/assembly-contract",
    expected: "buildAssemblyContract",
  },
  {
    packageDir: "recipes",
    packageName: "@helix/recipes",
    exportPath: "./nanobot-lego-depth",
    specifier: "@helix/recipes/nanobot-lego-depth",
    expected: "auditNanobotLegoDepth",
  },
]

const execFileAsync = promisify(execFile)

describe("package exports", () => {
  it("publishes stable subpath exports for atoms, packs, and product shells", async () => {
    for (const subpath of publicSubpaths) {
      const manifest = readPackageManifest(subpath.packageDir)
      const target = manifest.exports?.[subpath.exportPath]

      expect(target, `${subpath.packageName}${subpath.exportPath}`).toBeTypeOf("string")
      if (typeof target !== "string") throw new Error(`Missing package export ${subpath.packageName}${subpath.exportPath}`)
      expect(existsSync(join(process.cwd(), "packages", subpath.packageDir, target))).toBe(true)

      await importPublicSubpath(subpath.specifier, subpath.expected)
    }
  }, 120_000)

  it("keeps tests on public package exports instead of unexported deep imports", () => {
    const offenders: Array<{ file: string; import: string }> = []
    for (const file of testFiles()) {
      const source = readFileSync(join(process.cwd(), file), "utf8")
      for (const specifier of importSpecifiers(source)) {
        if (!specifier.startsWith("@")) continue
        const packageName = packageNameFromSpecifier(specifier)
        if (!packageName) continue
        const packageDir = packageDirFor(packageName)
        if (!packageDir) continue

        const exportPath = exportPathForSpecifier(packageName, specifier)
        const manifest = readPackageManifest(packageDir)
        if (!manifest.exports || !(exportPath in manifest.exports)) offenders.push({ file, import: specifier })
      }
    }

    expect(offenders).toEqual([])
  })
})

function readPackageManifest(packageDir: string): { name: string; exports?: Record<string, string> } {
  return JSON.parse(readFileSync(join(process.cwd(), "packages", packageDir, "package.json"), "utf8")) as {
    name: string
    exports?: Record<string, string>
  }
}

async function importPublicSubpath(specifier: string, expected?: string): Promise<void> {
  const script = [
    `const mod = await import(${JSON.stringify(specifier)});`,
    `const expected = ${JSON.stringify(expected ?? "")};`,
    `if (expected && !(expected in mod)) throw new Error("Missing export " + expected);`,
  ].join("\n")

  await execFileAsync(process.execPath, ["--import", "tsx", "--eval", script], { cwd: process.cwd() })
}

function testFiles(): string[] {
  return listFiles(join(process.cwd(), "packages"))
    .filter((file) => file.endsWith(".test.ts"))
    .map((file) => file.slice(process.cwd().length + 1))
}

function listFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) return listFiles(path)
    return path.endsWith(".ts") ? [path] : []
  })
}

function importSpecifiers(source: string): string[] {
  const imports: string[] = []
  for (const line of source.split(/\r?\n/)) {
    const from = /^\s*(?:import|export)\s+(?:type\s+)?(?:[^"'`]+?\s+from\s+)?["']([^"']+)["']/.exec(line)
    if (from?.[1]) imports.push(from[1])
    const dynamicImport = /^\s*import\(\s*["']([^"']+)["']\s*\)/.exec(line)
    if (dynamicImport?.[1]) imports.push(dynamicImport[1])
  }
  return imports
}

function packageNameFromSpecifier(specifier: string): string | undefined {
  const parts = specifier.split("/")
  if (!specifier.startsWith("@") || parts.length < 2) return undefined
  return `${parts[0]}/${parts[1]}`
}

function packageDirFor(packageName: string): string | undefined {
  const manifests = [
    "adapters-opencode",
    "adapters-pi",
    "adapters-nanobot",
    "cli",
    "contracts",
    "docs-site",
    "lego-agent-loop",
    "lego-config",
    "lego-hooks",
    "lego-prompt",
    "lego-provider",
    "lego-runtime",
    "lego-session",
    "lego-tools",
    "lego-ui",
    "opencode-plugin",
    "pi-coding-agent",
    "recipes",
  ]
  return manifests.find((dir) => readPackageManifest(dir).name === packageName)
}

function exportPathForSpecifier(packageName: string, specifier: string): string {
  if (specifier === packageName) return "."
  return `.${specifier.slice(packageName.length)}`
}
