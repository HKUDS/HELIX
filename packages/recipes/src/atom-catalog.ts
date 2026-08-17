import {
  contractPortContractFixtures,
  normalizeCapabilityRefs,
  normalizePortContractFixture,
  type LegoBlockInventoryEntry,
  type LegoBlockImplementationKind,
  type LegoCapabilityInput,
  type LegoPersonality,
  type LegoPortContractFixture,
  type LegoResourceRef,
} from "@helix/contracts"
import { configPortContractFixtures } from "@helix/lego-config"
import { hookPortContractFixtures } from "@helix/lego-hooks"
import { turnPortContractFixtures } from "@helix/lego-agent-loop"
import { promptPortContractFixtures } from "@helix/lego-prompt"
import { providerPortContractFixtures } from "@helix/lego-provider"
import { runtimePortContractFixtures } from "@helix/lego-runtime"
import { sessionPortContractFixtures } from "@helix/lego-session"
import { toolPortContractFixtures } from "@helix/lego-tools"
import { uiPortContractFixtures } from "@helix/lego-ui"
import type { RecipeModuleCatalogEntry } from "./compiler"

export type AtomRecipePersonality = "common" | "opencode" | "pi-mono" | "nanobot" | "hermes-agent"

export const promptSupportAliasPortIDs = [
  "resource.discovery",
  "prompt.resource-loader",
  "prompt.tool-renderer",
  "prompt.model-capability-adapter",
  "prompt.compaction-adapter",
] as const

const promptSupportAliasPorts = new Set<string>(promptSupportAliasPortIDs)

export function isPromptSupportAliasPort(portID: string): boolean {
  return promptSupportAliasPorts.has(portID)
}

const promptSupportCommonBindingModules = {
  "resource.discovery": "resource.discovery.filesystem",
  "prompt.resource-loader": "prompt.resource-loader.text",
  "prompt.tool-renderer": "prompt.tool-renderer.common",
  "prompt.model-capability-adapter": "prompt.model-capability-adapter.common",
  "prompt.compaction-adapter": "prompt.compaction-adapter.common",
} satisfies Record<string, string>

export interface AtomExportRoute {
  packageDir: string
  packageName: string
  exportPath: string
}

interface AtomCatalogEntryAccumulator {
  id: string
  provides: LegoCapabilityInput[]
  resources: LegoResourceRef[]
  personality: LegoPersonality
  implementationKind: LegoBlockImplementationKind
}

export function allRecipePortFixtures(): LegoPortContractFixture[] {
  return [
    ...contractPortContractFixtures,
    ...runtimePortContractFixtures,
    ...sessionPortContractFixtures,
    ...hookPortContractFixtures,
    ...turnPortContractFixtures,
    ...toolPortContractFixtures,
    ...providerPortContractFixtures,
    ...configPortContractFixtures,
    ...promptPortContractFixtures,
    ...uiPortContractFixtures,
  ]
}

export function allRecipeInventoryBlocks(): LegoBlockInventoryEntry[] {
  return allRecipePortFixtures().flatMap((fixture) => normalizePortContractFixture(fixture).blocks)
}

export function defaultAtomRecipeModuleCatalog(): RecipeModuleCatalogEntry[] {
  const entries = new Map<string, AtomCatalogEntryAccumulator>()
  for (const fixture of allRecipePortFixtures()) {
    const normalized = normalizePortContractFixture(fixture)
    for (const block of [...normalized.commonBlocks, ...normalized.personalityBlocks]) {
      const current =
        entries.get(block.id) ??
        ({
          id: block.id,
          provides: [],
          resources: [],
          personality: block.personality,
          implementationKind: block.implementationKind,
        } satisfies AtomCatalogEntryAccumulator)
      current.provides = uniqueCapabilityInputs([...current.provides, capabilityForBlock(block)])
      current.resources = uniqueResources([...current.resources, ...resourcesForBlock(block, fixture)])
      current.personality = mergePersonality(current.personality, block.personality)
      entries.set(block.id, current)
    }
  }

  const fixtureEntries = Array.from(entries.values()).map((entry) => ({
    id: entry.id,
    provides: entry.provides,
    ...(entry.resources.length > 0 ? { resources: entry.resources } : {}),
    personality: entry.personality,
    implementationKind: entry.implementationKind,
  }))

  return [...fixtureEntries, ...productNativeTaskRunnerRecipeModuleCatalog()]
    .sort((left, right) => left.id.localeCompare(right.id))
}

function productNativeTaskRunnerRecipeModuleCatalog(): RecipeModuleCatalogEntry[] {
  return [
    {
      id: "opencode.task.runner.native-cli",
      provides: [
        {
          id: "task.runner.native-cli",
          kind: "implementation",
          multiplicity: "single",
          stability: "stable",
          personality: "opencode",
        },
      ],
      resources: [{ id: "shell", mode: "execute", scope: "process" }],
      personality: "opencode",
      implementationKind: "factory",
    },
  ]
}

export function commonAtomBlockIDs(): string[] {
  return unique(
    allRecipePortFixtures()
      .flatMap((fixture) => normalizePortContractFixture(fixture).commonBlocks)
      .filter((block) => block.type !== "product-shell")
      .map((block) => block.id),
  )
}

export function personalityAtomBlockIDs(personality: Exclude<AtomRecipePersonality, "common">): string[] {
  return unique(
    allRecipePortFixtures()
      .flatMap((fixture) => normalizePortContractFixture(fixture).personalityBlocks)
      .filter((block) =>
        block.type === "atom" &&
        block.personality === personality &&
        !(promptSupportAliasPorts.has(block.port) && block.implementationKind === "metadata-only")
      )
      .map((block) => block.id),
  )
}

export function productShellBlockIDs(personality: AtomRecipePersonality): string[] {
  return unique(
    allRecipePortFixtures()
      .flatMap((fixture) => {
        const normalized = normalizePortContractFixture(fixture)
        return personality === "common" ? normalized.commonBlocks : normalized.personalityBlocks
      })
      .filter((block) => block.type === "product-shell" && block.personality === personality)
      .map((block) => block.id),
  )
}

export function defaultPortBindingModule(port: string, personality: AtomRecipePersonality): string {
  const fixture = allRecipePortFixtures().find((candidate) => candidate.id === port)
  if (!fixture) throw new Error(`Unknown lego port ${port}`)
  const normalized = normalizePortContractFixture(fixture)
  const explicit = explicitBindingModules[personality]?.[port] ?? explicitBindingModules.common?.[port]
  if (explicit) return explicit
  const personalityBlock =
    personality === "common" ? undefined : normalized.personalityBlocks.find((block) => block.personality === personality && block.type !== "product-shell")
  if (personalityBlock) return personalityBlock.id
  const commonBlock = normalized.commonBlocks.find((block) => block.type !== "product-shell") ?? normalized.commonBlocks[0]
  if (!commonBlock) throw new Error(`Lego port ${port} has no bindable implementation`)
  return commonBlock.id
}

export function recipeBindingPorts(personality: AtomRecipePersonality): string[] {
  if (personality === "common") {
    return [
      "block.manifest",
      "capability.ref",
      "resource.grant",
      "recipe.binding",
      "conformance.ref",
      "runtime.module-catalog",
      "runtime.capability-resolver",
      "runtime.binding-planner",
      "runtime.lifecycle-runner",
      "runtime.assembly-graph",
      "runtime.acceptance-controller",
      "runtime.acceptance-evidence",
      "identity.id-generator",
      "identity.clock",
      "identity.workspace-resolver",
      "event.envelope",
      "event.log",
      "trace.recorder",
      "session.id-generator",
      "session.event-log",
      "session.message-store",
      "session.projector",
      "session.message-part-projector",
      "session.context-selector",
      "product.shell",
      "agent-loop.request-boundary",
      "agent-loop.final-summary",
      "tools.schema",
      "tools.batch-scheduler",
      "tools.result-projector",
      "provider.streaming-delta-recorder",
      "provider.stream-projector",
    ]
  }
  return allRecipePortFixtures().map((fixture) => fixture.id)
}

export function routeForAtomBlock(moduleID: string): AtomExportRoute {
  if (moduleID === "contracts") return route("contracts", ".")
  if (moduleID === "minimal-cli") return route("recipes", ".")
  if (moduleID === "tool-pack-echo" || moduleID.startsWith("tool-pack.")) return route("lego-tools", "./tool-atoms")
  if (moduleID.startsWith("session.") || moduleID.startsWith("session-")) return route("lego-session", "./atoms")
  if (moduleID.startsWith("hook.") || moduleID.startsWith("registry.") || moduleID === "tool.registry") return route("lego-hooks", "./hook-atoms")
  if (moduleID.startsWith("turn.")) return route("lego-agent-loop", ".")
  if (moduleID === "opencode.agent-loop.request-boundary.native-like") return route("lego-agent-loop", "./product-schema/opencode")
  if (moduleID === "opencode.agent-loop.final-summary.native-like") return route("lego-agent-loop", "./product-schema/opencode")
  if (moduleID === "pi.agent-loop.request-boundary.native-like") return route("lego-agent-loop", "./product-schema/pi")
  if (moduleID === "pi.agent-loop.final-summary.native-like") return route("lego-agent-loop", "./product-schema/pi")
  if (moduleID === "nanobot.agent-loop.request-boundary.native-like") return route("lego-agent-loop", "./product-schema/nanobot")
  if (moduleID === "nanobot.agent-loop.final-summary.native-like") return route("lego-agent-loop", "./product-schema/nanobot")
  if (moduleID === "hermes.agent-loop.request-boundary.native-like") return route("lego-agent-loop", "./product-schema/hermes")
  if (moduleID === "hermes.agent-loop.final-summary.native-like") return route("lego-agent-loop", "./product-schema/hermes")
  if (isScopedCadenceAtom(moduleID, "agent-loop")) return route("lego-agent-loop", "./cadence-policies")
  if (moduleID.startsWith("tool.") || moduleID.startsWith("filesystem.") || moduleID.startsWith("process-runner.")) return route("lego-tools", "./tool-atoms")
  if (["opencode.config.source", "opencode.config.precedence", "opencode.config.validator"].includes(moduleID)) return route("lego-config", "./product-schema/opencode")
  if (["nanobot.config.source", "nanobot.config.precedence", "nanobot.config.validator"].includes(moduleID)) return route("lego-config", "./product-schema/nanobot")
  if (["hermes.config.source", "hermes.config.precedence", "hermes.config.validator"].includes(moduleID)) return route("lego-config", "./product-schema/hermes")
  if ([
    "opencode.identity.clock-format",
    "opencode.identity.id-generator",
    "opencode.identity.workspace-resolver",
  ].includes(moduleID)) return route("adapters-opencode", "./product-schema/identity")
  if ([
    "nanobot.identity.clock-format",
    "nanobot.identity.id-generator",
    "nanobot.identity.workspace-resolver",
  ].includes(moduleID)) return route("adapters-nanobot", "./product-schema/identity")
  if ([
    "hermes.identity.clock-format",
    "hermes.identity.id-generator",
    "hermes.identity.workspace-resolver",
  ].includes(moduleID)) return route("adapters-hermes", "./product-schema/identity")
  if (["opencode.event.envelope-bridge", "opencode.event.syncevent-bridge"].includes(moduleID)) return route("adapters-opencode", "./product-schema/events")
  if (["hermes.event.envelope-bridge", "hermes.event.runtime-bridge"].includes(moduleID)) return route("adapters-hermes", "./product-schema/events")
  if (["nanobot.event.envelope-bridge", "nanobot.event.bus-bridge"].includes(moduleID)) return route("adapters-nanobot", "./product-schema/events")
  if (moduleID === "nanobot.trace.debug-surface") return route("adapters-nanobot", "./product-schema/trace")
  if (moduleID === "hermes.trace.debug-surface") return route("adapters-hermes", "./product-schema/trace")
  if ([
    "opencode.hook.error-defaults",
    "opencode.hook.handler-adapter",
    "opencode.hook.observer-adapter",
    "opencode.hook.plugin-bridge",
    "opencode.hook.scheduler-defaults",
    "opencode.plugin.event-mapper",
    "opencode.plugin.hot-reload-cleanup",
    "opencode.plugin.loader",
    "opencode.plugin.provider-registry-bridge",
    "opencode.plugin.ui-registry-bridge",
    "opencode.registry.command",
    "opencode.registry.provider-plugin",
    "opencode.registry.tool-definition",
    "opencode.registry.ui-provider",
  ].includes(moduleID)) return route("adapters-opencode", "./product-schema/hooks")
  if ([
    "nanobot.hook.error-defaults",
    "nanobot.hook.handler-adapter",
    "nanobot.hook.observer-adapter",
    "nanobot.hook.plugin-bridge",
    "nanobot.hook.scheduler-defaults",
    "nanobot.plugin.cleanup",
    "nanobot.plugin.event-mapper",
    "nanobot.plugin.loader",
    "nanobot.plugin.provider-registry-bridge",
    "nanobot.plugin.ui-registry-bridge",
    "nanobot.registry.command",
    "nanobot.registry.provider-plugin",
    "nanobot.registry.tool-definition",
    "nanobot.registry.ui-provider",
  ].includes(moduleID)) return route("adapters-nanobot", "./product-schema/hooks")
  if ([
    "hermes.hook.error-defaults",
    "hermes.hook.handler-adapter",
    "hermes.hook.observer-adapter",
    "hermes.hook.plugin-bridge",
    "hermes.hook.scheduler-defaults",
    "hermes.plugin.cleanup",
    "hermes.plugin.event-mapper",
    "hermes.plugin.loader",
    "hermes.plugin.provider-registry-bridge",
    "hermes.plugin.ui-registry-bridge",
    "hermes.registry.command",
    "hermes.registry.provider-plugin",
    "hermes.registry.tool-definition",
    "hermes.registry.ui-provider",
  ].includes(moduleID)) return route("adapters-hermes", "./product-schema/hooks")
  if ([
    "nanobot.provider.auth-descriptor",
    "nanobot.provider.event-observer",
    "nanobot.provider.model-registry",
    "nanobot.provider.parser-observer",
    "nanobot.provider.plugin-descriptor",
    "nanobot.provider.request-options",
    "nanobot.provider.streaming-delta-recorder.native-like",
    "nanobot.provider.stream-projector.native-like",
    "nanobot.provider.transport-instrumentation",
    "nanobot.provider.usage-renderer",
  ].includes(moduleID)) return route("adapters-nanobot", "./product-schema/provider")
  if ([
    "hermes.provider.auth-descriptor",
    "hermes.provider.event-observer",
    "hermes.provider.model-registry",
    "hermes.provider.parser-observer",
    "hermes.provider.plugin-descriptor",
    "hermes.provider.request-options",
    "hermes.provider.streaming-delta-recorder.native-like",
    "hermes.provider.stream-projector.native-like",
    "hermes.provider.transport-instrumentation",
    "hermes.provider.usage-renderer",
  ].includes(moduleID)) return route("adapters-hermes", "./product-schema/provider")
  if ([
    "opencode.session.branch-graph.fork-before-message",
    "opencode.session.compaction-event",
    "opencode.session.id-generator",
    "opencode.session.pagination.update-time-cursor",
    "opencode.session.projector.message-v2",
    "opencode.session.projector.syncevent",
    "opencode.session.store.sqlite-projection",
  ].includes(moduleID)) return route("adapters-opencode", "./product-schema/session")
  if ([
    "nanobot.session.branch-graph.channel-key",
    "nanobot.session.context-selector.max-messages",
    "nanobot.session.goal-state",
    "nanobot.session.id-generator",
    "nanobot.session.message-part-projector.native-like",
    "nanobot.session.pagination.updated-at",
    "nanobot.session.projector.jsonl",
    "nanobot.session.store.jsonl",
  ].includes(moduleID)) return route("adapters-nanobot", "./product-schema/session")
  if ([
    "hermes.session.branch-graph.lineage",
    "hermes.session.compaction-trajectory",
    "hermes.session.context-selector.thread-history",
    "hermes.session.id-generator",
    "hermes.session.message-part-projector.native-like",
    "hermes.session.pagination.updated-at",
    "hermes.session.projector.openai-messages",
    "hermes.session.store.sqlite-fts",
  ].includes(moduleID)) return route("adapters-hermes", "./product-schema/session")
  if ([
    "opencode.permission.ask-bridge",
    "opencode.plugin.permission-bridge",
    "opencode.plugin.registry-bridge",
    "opencode.tool.definition-plugin-bridge",
    "opencode.tool.permission-render-bridge",
    "opencode.tool.result-render-bridge",
    "opencode.tool.schema-bridge",
    "opencode.tool.status-bridge",
    "opencode.workspace-filesystem-bridge",
  ].includes(moduleID)) return route("lego-tools", "./product-schema/opencode")
  if ([
    "nanobot.permission.policy-bridge",
    "nanobot.process-runner-bridge",
    "nanobot.tool.definition-plugin-bridge",
    "nanobot.tool.event-render-bridge",
    "nanobot.tool.progress-event-bridge",
    "nanobot.tool.registry-bridge",
    "nanobot.tool.result-event-bridge",
    "nanobot.tool.schema-bridge",
    "nanobot.workspace-filesystem-bridge",
  ].includes(moduleID)) return route("lego-tools", "./product-schema/nanobot")
  if ([
    "hermes.permission.hook-bridge",
    "hermes.process-runner-bridge",
    "hermes.tool.definition-registry-bridge",
    "hermes.tool.permission-render-bridge",
    "hermes.tool.progress-event-bridge",
    "hermes.tool.registry-bridge",
    "hermes.tool.result-event-bridge",
    "hermes.tool.schema-bridge",
    "hermes.workspace-filesystem-bridge",
  ].includes(moduleID)) return route("lego-tools", "./product-schema/hermes")
  if (moduleID === "opencode.tool.definition-plugin-bridge") return route("adapters-opencode", "./opencode-tool-definition-plugin")
  if (moduleID === "opencode.tool.schema-bridge") return route("adapters-opencode", "./opencode-tool-schema-bridge")
  if (moduleID === "opencode.tool.status-bridge") return route("adapters-opencode", "./opencode-tool-status")
  if (moduleID === "opencode.tool-pack.native") return route("lego-tools", "./product-schema/opencode")
  if (moduleID === "opencode.tool-pack.compatibility") return route("lego-tools", "./product-schema/opencode")
  if (moduleID === "nanobot.tool-pack.compatibility") return route("lego-tools", "./product-schema/nanobot")
  if (moduleID === "hermes.tool-pack.compatibility") return route("lego-tools", "./product-schema/hermes")
  if (moduleID === "opencode.tools.batch-scheduler.native-like") return route("lego-tools", "./product-schema/opencode")
  if (moduleID === "opencode.tools.result-projector.native-like") return route("lego-tools", "./product-schema/opencode")
  if (moduleID === "opencode.tools.schema.native-like") return route("lego-tools", "./product-schema/opencode")
  if (moduleID === "pi.tools.batch-scheduler.native-like") return route("lego-tools", "./product-schema/pi")
  if (moduleID === "nanobot.tools.batch-scheduler.native-like") return route("lego-tools", "./product-schema/nanobot")
  if (moduleID === "nanobot.tools.result-projector.native-like") return route("lego-tools", "./product-schema/nanobot")
  if (moduleID === "nanobot.tools.schema.native-like") return route("lego-tools", "./product-schema/nanobot")
  if (moduleID === "hermes.tools.batch-scheduler.native-like") return route("lego-tools", "./product-schema/hermes")
  if (moduleID === "hermes.tools.result-projector.native-like") return route("lego-tools", "./product-schema/hermes")
  if (moduleID === "hermes.tools.schema.native-like") return route("lego-tools", "./product-schema/hermes")
  if (moduleID === "pi.tools.schema.native-like") return route("lego-tools", "./product-schema/pi")
  if (moduleID === "pi.tools.result-projector.native-like") return route("lego-tools", "./product-schema/pi")
  if (isScopedCadenceAtom(moduleID, "tools")) return route("lego-tools", "./cadence-atoms")
  if (moduleID.startsWith("provider.")) return route("lego-provider", "./ports")
  if (
    moduleID === "opencode.provider.streaming-delta-recorder.native-like" ||
    moduleID === "opencode.provider.stream-projector.native-like"
  ) return route("adapters-opencode", "./opencode-provider-stream-projector")
  if (moduleID === "pi.provider.streaming-delta-recorder.native-like" || moduleID === "pi.provider.stream-projector.native-like") return route("adapters-pi", "./product-schema/provider")
  if (moduleID === "nanobot.provider.streaming-delta-recorder.native-like" || moduleID === "nanobot.provider.stream-projector.native-like") return route("adapters-nanobot", "./product-schema/provider")
  if (moduleID === "hermes.provider.streaming-delta-recorder.native-like" || moduleID === "hermes.provider.stream-projector.native-like") return route("adapters-hermes", "./product-schema/provider")
  if (isScopedCadenceAtom(moduleID, "provider")) return route("lego-provider", "./streaming-delta-recorder")
  if (moduleID === "opencode.session.message-part-projector.native-like") return route("adapters-opencode", "./product-schema/session")
  if (moduleID === "pi.session.message-part-projector.native-like") return route("lego-session", "./product-schema/pi")
  if ([
    "pi.session.event-log.session-manager",
    "pi.session.reader.session-manager",
    "pi.session.writer.session-manager",
    "pi.session.message-store.session-manager",
    "pi.session.branching.session-manager",
    "pi.session.diff.session-manager",
  ].includes(moduleID)) return route("lego-session", "./product-schema/pi")
  if (moduleID === "nanobot.session.message-part-projector.native-like") return route("adapters-nanobot", "./product-schema/session")
  if (moduleID === "hermes.session.message-part-projector.native-like") return route("adapters-hermes", "./product-schema/session")
  if (isScopedCadenceAtom(moduleID, "session")) return route("lego-session", "./message-part-projector")
  if (moduleID === "opencode.runtime.acceptance-controller.native-like") return route("lego-runtime", "./product-schema/opencode")
  if (moduleID === "opencode.runtime.acceptance-evidence.native-like") return route("lego-runtime", "./product-schema/opencode")
  if ([
    "opencode.runtime.module-catalog",
    "opencode.runtime.capability-resolver",
    "opencode.runtime.binding-planner",
    "opencode.runtime.lifecycle-runner",
    "opencode.runtime.assembly-graph",
  ].includes(moduleID)) return route("lego-runtime", "./product-schema/opencode")
  if ([
    "pi.runtime.module-catalog",
    "pi.runtime.capability-resolver",
    "pi.runtime.binding-planner",
    "pi.runtime.lifecycle-runner",
    "pi.runtime.assembly-graph",
  ].includes(moduleID)) return route("lego-runtime", "./product-schema/pi")
  if (moduleID === "pi.runtime.acceptance-controller.native-like") return route("lego-runtime", "./product-schema/pi")
  if (moduleID === "pi.runtime.acceptance-evidence.native-like") return route("lego-runtime", "./product-schema/pi")
  if (moduleID === "nanobot.runtime.acceptance-controller.native-like") return route("lego-runtime", "./product-schema/nanobot")
  if (moduleID === "nanobot.runtime.acceptance-evidence.native-like") return route("lego-runtime", "./product-schema/nanobot")
  if (moduleID === "hermes.runtime.acceptance-controller.native-like") return route("lego-runtime", "./product-schema/hermes")
  if (moduleID === "hermes.runtime.acceptance-evidence.native-like") return route("lego-runtime", "./product-schema/hermes")
  if (isScopedCadenceAtom(moduleID, "runtime")) return route("lego-runtime", "./acceptance-controller")
  if (moduleID.startsWith("config.")) return route("lego-config", "./config-atoms")
  if (moduleID === "pi.prompt.coding-agent-builder") return route("adapters-pi", "./product-schema/prompt")
  if (moduleID.startsWith("resource.") || moduleID.startsWith("prompt.")) return route("lego-prompt", "./prompt-atoms")
  if (moduleID.startsWith("ui.")) return route("lego-ui", "./ui-atoms")
  if (moduleID.startsWith("runtime.")) return route("lego-runtime", ".")
  if (moduleID.startsWith("block.") || moduleID.startsWith("capability.") || moduleID.startsWith("resource.grant") || moduleID.startsWith("recipe.")) {
    return route("contracts", ".")
  }
  if (moduleID.startsWith("conformance.") || moduleID.startsWith("identity.") || moduleID.startsWith("event.") || moduleID.startsWith("trace.")) {
    return route("contracts", ".")
  }
  if (moduleID === "product.shell.minimal-cli") return route("recipes", ".")
  if (moduleID === "pi.product-shell.harness" || moduleID === "pi.product-shell.server") return route("adapters-pi", "./product-schema/product-shell")
  if (
    moduleID === "opencode.product-shell.harness" ||
    moduleID === "opencode.product-shell.web" ||
    moduleID === "opencode.product-shell.desktop"
  ) return route("adapters-opencode", "./product-schema/product-shell")
  if (isNanobotProductShellNativeAtomID(moduleID)) return route("adapters-nanobot", "./product-schema/product-shell")
  if (isHermesProductShellNativeAtomID(moduleID)) return route("adapters-hermes", "./product-schema/product-shell")
  if (
    moduleID === "nanobot.product-shell.harness" ||
    moduleID === "hermes.product-shell.harness"
  ) {
    return route("recipes", "./harness-atoms")
  }
  if (
    moduleID === "pi.product-shell.cli" ||
    moduleID === "pi.product-shell.extension-examples" ||
    moduleID === "pi.product-shell.package-manager" ||
    moduleID === "pi.product-shell.rpc" ||
    moduleID === "pi.product-shell.sdk" ||
    moduleID === "pi.product-shell.tui" ||
    moduleID === "pi.product-shell.web-ui" ||
    moduleID === "pi.product-shell.browser-smoke" ||
    moduleID === "pi.product-shell.release-hardening"
  ) return route("adapters-pi", "./product-schema/product-shell")
  if (isProductScopedAtom(moduleID, "runtime")) return route("lego-runtime", "./runtime-atoms")
  if (moduleID === "pi.config.source" || moduleID === "pi.config.precedence" || moduleID === "pi.config.validator") return route("lego-config", "./product-schema/pi")
  if (isProductScopedAtom(moduleID, "config")) return route("lego-config", "./config-atoms")
  if (moduleID === "opencode.prompt.mode-builder") return route("adapters-opencode", "./opencode-prompt-mode-builder")
  if (moduleID === "nanobot.prompt.agent-builder") return route("lego-prompt", "./product-schema/nanobot")
  if (moduleID === "hermes.prompt.agent-builder") return route("lego-prompt", "./product-schema/hermes")
  if (
    moduleID === "opencode.resource.discovery.instruction" ||
    moduleID === "opencode.prompt.resource-loader.instruction" ||
    moduleID === "opencode.prompt.tool-renderer.provider-tools" ||
    moduleID === "opencode.prompt.model-capability-adapter.provider-prompt" ||
    moduleID === "opencode.prompt.compaction-adapter.build-prompt"
  ) return route("lego-prompt", "./product-schema/opencode")
  if (
    moduleID === "pi.resource.discovery.project-context" ||
    moduleID === "pi.prompt.resource-loader.project-context" ||
    moduleID === "pi.prompt.tool-renderer.runtime-tools" ||
    moduleID === "pi.prompt.model-capability-adapter.runtime-model" ||
    moduleID === "pi.prompt.compaction-adapter.summary-mode"
  ) return route("lego-prompt", "./product-schema/pi")
  if (moduleID === "opencode.turn.input-normalizer") return route("adapters-opencode", "./opencode-turn-input-normalizer")
  if (moduleID === "opencode.turn.context-builder") return route("adapters-opencode", "./opencode-turn-context-builder")
  if (moduleID === "opencode.turn.prompt-assembler") return route("adapters-opencode", "./opencode-turn-prompt-assembler")
  if (moduleID === "opencode.turn.provider-request-builder") return route("adapters-opencode", "./opencode-turn-provider-request-builder")
  if (moduleID === "opencode.turn.provider-stream-runner") return route("adapters-opencode", "./opencode-turn-provider-stream-runner")
  if (moduleID === "opencode.turn.retry-policy") return route("adapters-opencode", "./opencode-turn-retry-policy")
  if (moduleID === "opencode.turn.stream-reducer") return route("adapters-opencode", "./opencode-turn-stream-reducer")
  if (moduleID === "opencode.turn.continuation-policy" || moduleID === "opencode.turn.stop-condition") return route("adapters-opencode", "./opencode-turn-loop-control")
  if (moduleID === "opencode.turn.tool-call-planner" || moduleID === "opencode.turn.tool-executor") return route("adapters-opencode", "./opencode-turn-tool-loop")
  if (moduleID === "opencode.turn.compaction-policy") return route("adapters-opencode", "./opencode-turn-compaction-policy")
  if (moduleID === "opencode.turn.result-recorder") return route("adapters-opencode", "./opencode-turn-result-recorder")
  if (isProductScopedAtom(moduleID, "prompt") || isProductScopedAtom(moduleID, "resource")) return route("lego-prompt", "./prompt-atoms")
  if (
    moduleID === "opencode.ui.event-loop" ||
    moduleID === "opencode.ui.command-router" ||
    moduleID === "opencode.ui.input-normalizer" ||
    moduleID === "opencode.ui.renderer" ||
    moduleID === "opencode.ui.snapshot" ||
    moduleID === "opencode.ui.theme-registry"
  ) return route("lego-ui", "./product-schema/opencode")
  if (
    moduleID === "pi.ui.event-loop" ||
    moduleID === "pi.ui.command-router" ||
    moduleID === "pi.ui.input-normalizer" ||
    moduleID === "pi.ui.renderer" ||
    moduleID === "pi.ui.snapshot" ||
    moduleID === "pi.ui.theme-registry" ||
    moduleID === "pi.tui.shell"
  ) return route("lego-ui", "./product-schema/pi")
  if (
    moduleID === "nanobot.tui.shell" ||
    moduleID === "nanobot.ui.command-router" ||
    moduleID === "nanobot.ui.input-normalizer" ||
    moduleID === "nanobot.ui.renderer" ||
    moduleID === "nanobot.ui.snapshot" ||
    moduleID === "nanobot.ui.theme-registry"
  ) return route("lego-ui", "./product-schema/nanobot")
  if (
    moduleID === "hermes.tui.shell" ||
    moduleID === "hermes.ui.command-router" ||
    moduleID === "hermes.ui.input-normalizer" ||
    moduleID === "hermes.ui.renderer" ||
    moduleID === "hermes.ui.snapshot" ||
    moduleID === "hermes.ui.theme-registry"
  ) return route("adapters-hermes", "./product-schema/ui")
  if (isProductScopedAtom(moduleID, "ui")) return route("lego-ui", "./ui-atoms")
  if (moduleID.startsWith("pi.turn.")) return route("lego-agent-loop", "./product-schema/pi")
  if (moduleID.startsWith("nanobot.turn.")) return route("lego-agent-loop", "./product-schema/nanobot")
  if (moduleID.startsWith("hermes.turn.")) return route("lego-agent-loop", "./product-schema/hermes")
  if (isProductScopedAtom(moduleID, "turn")) return route("lego-agent-loop", ".")
  if (moduleID === "opencode.tui.shell") return route("adapters-opencode", "./product-schema/product-shell")
  if (moduleID.startsWith("opencode.product-shell.")) return route("adapters-opencode", opencodeProductShellExport(moduleID))
  if (moduleID === "opencode.event.envelope-bridge") return route("adapters-opencode", "./opencode-event-envelope")
  if (moduleID === "opencode.event.syncevent-bridge") return route("adapters-opencode", "./opencode-sync-event-log")
  if (
    moduleID === "opencode.identity.id-generator" ||
    moduleID === "opencode.identity.clock-format" ||
    moduleID === "opencode.identity.workspace-resolver"
  ) return route("adapters-opencode", "./opencode-identity")
  if (moduleID === "pi.identity.clock-format" || moduleID === "pi.identity.id-generator" || moduleID === "pi.identity.workspace-resolver") return route("adapters-pi", "./product-schema/pi")
  if (moduleID === "pi.event.envelope-bridge" || moduleID === "pi.event.runtime-bridge" || moduleID === "pi.extension.runtime-event-bridge") return route("adapters-pi", "./product-schema/events")
  if (moduleID === "pi.trace.debug-surface") return route("adapters-pi", "./product-schema/trace")
  if (
    moduleID === "pi.provider.auth-descriptor" ||
    moduleID === "pi.provider.event-observer" ||
    moduleID === "pi.provider.extension-descriptor" ||
    moduleID === "pi.provider.model-extension" ||
    moduleID === "pi.provider.parser-observer" ||
    moduleID === "pi.provider.request-options" ||
    moduleID === "pi.provider.streaming-delta-recorder.native-like" ||
    moduleID === "pi.provider.stream-projector.native-like" ||
    moduleID === "pi.provider.transport-instrumentation" ||
    moduleID === "pi.provider.usage-renderer"
  ) return route("adapters-pi", "./product-schema/provider")
  if (
    moduleID === "pi.tool-pack.compatibility" ||
    moduleID === "pi.extension.dynamic-tool-bridge" ||
    moduleID === "pi.extension.typebox-bridge" ||
    moduleID === "pi.tool.register-tool-bridge" ||
    moduleID === "pi.tool.typebox-bridge"
  ) return route("adapters-pi", "./product-schema/tools")
  if (
    moduleID === "pi.permission.event-bridge" ||
    moduleID === "pi.process-runner-bridge" ||
    moduleID === "pi.tool.event-render-bridge" ||
    moduleID === "pi.tool.result-event-bridge" ||
    moduleID === "pi.tool.runtime-event-bridge" ||
    moduleID === "pi.workspace-filesystem-bridge"
  ) return route("adapters-pi", "./product-schema/tool-runtime")
  if (
    moduleID === "pi.extension.cleanup" ||
    moduleID === "pi.extension.event-mapper" ||
    moduleID === "pi.extension.loader" ||
    moduleID === "pi.extension.provider-registry-bridge" ||
    moduleID === "pi.extension.ui-registry-bridge" ||
    moduleID === "pi.hook.error-defaults" ||
    moduleID === "pi.hook.extension-bridge" ||
    moduleID === "pi.hook.handler-adapter" ||
    moduleID === "pi.hook.observer-adapter" ||
    moduleID === "pi.hook.scheduler-defaults" ||
    moduleID === "pi.registry.command" ||
    moduleID === "pi.registry.message-renderer" ||
    moduleID === "pi.registry.provider-extension" ||
    moduleID === "pi.registry.register-tool"
  ) return route("adapters-pi", "./product-schema/hooks")
  if (moduleID === "opencode.hook.error-defaults") return route("adapters-opencode", "./opencode-hook-error-defaults")
  if (moduleID === "opencode.hook.handler-adapter") return route("adapters-opencode", "./opencode-hook-handler")
  if (moduleID === "opencode.hook.observer-adapter") return route("adapters-opencode", "./opencode-hook-observer")
  if (moduleID === "opencode.hook.scheduler-defaults") return route("adapters-opencode", "./opencode-hook-scheduler")
  if (moduleID === "opencode.hook.plugin-bridge") return route("adapters-opencode", "./opencode-hook-plugin-bridge")
  if (moduleID === "opencode.plugin.loader") return route("adapters-opencode", "./opencode-plugin-loader")
  if (moduleID === "opencode.plugin.hot-reload-cleanup") return route("adapters-opencode", "./opencode-plugin-hot-reload-cleanup")
  if (moduleID === "opencode.plugin.event-mapper") return route("adapters-opencode", "./opencode-plugin-event-mapper")
  if (moduleID === "opencode.registry.command") return route("adapters-opencode", "./opencode-command-registry")
  if (moduleID === "opencode.provider.auth-descriptor") return route("adapters-opencode", "./opencode-provider-auth-descriptor")
  if (moduleID === "opencode.provider.model-plugin") return route("adapters-opencode", "./opencode-provider-model-plugin")
  if (moduleID === "opencode.plugin.registry-bridge") return route("adapters-opencode", "./opencode-plugin-tool-registry")
  if (moduleID === "opencode.registry.tool-definition") return route("adapters-opencode", "./opencode-plugin-tool-registry")
  if (moduleID === "opencode.plugin.provider-registry-bridge") return route("adapters-opencode", "./opencode-plugin-provider-registry")
  if (moduleID === "opencode.registry.provider-plugin") return route("adapters-opencode", "./opencode-plugin-provider-registry")
  if (moduleID === "opencode.plugin.ui-registry-bridge") return route("adapters-opencode", "./opencode-plugin-ui-registry")
  if (moduleID === "opencode.registry.ui-provider") return route("adapters-opencode", "./opencode-plugin-ui-registry")
  if (moduleID === "opencode.shell.env-bridge") return route("adapters-opencode", "./opencode-shell-env")
  if (moduleID === "opencode.tool.permission-render-bridge") return route("adapters-opencode", "./opencode-tool-permission-render")
  if (moduleID === "opencode.tool.result-render-bridge") return route("adapters-opencode", "./opencode-tool-result-render")
  if (moduleID === "opencode.workspace-filesystem-bridge") return route("adapters-opencode", "./opencode-workspace-filesystem")
  if (moduleID === "opencode.plugin.permission-bridge") return route("adapters-opencode", "./opencode-plugin-permission-bridge")
  if (moduleID === "opencode.permission.ask-bridge") return route("adapters-opencode", "./opencode-plugin-permission-bridge")
  if (moduleID === "opencode.provider.plugin-descriptor") return route("adapters-opencode", "./opencode-provider-plugin-descriptor")
  if (moduleID === "opencode.provider.usage-renderer") return route("adapters-opencode", "./opencode-provider-usage")
  if (moduleID === "opencode.provider.request-options") return route("adapters-opencode", "./opencode-provider-request-options")
  if (moduleID === "opencode.provider.parser-observer") return route("adapters-opencode", "./opencode-provider-parser-observer")
  if (moduleID === "opencode.provider.event-observer") return route("adapters-opencode", "./opencode-provider-event-observer")
  if (moduleID === "opencode.provider.transport-instrumentation") return route("adapters-opencode", "./opencode-provider-transport-instrumentation")
  if (moduleID === "opencode.session.pagination.update-time-cursor") return route("adapters-opencode", "./opencode-session-pagination")
  if (moduleID === "opencode.session.id-generator") return route("adapters-opencode", "./opencode-session-id-generator")
  if (moduleID === "opencode.session.store.sqlite-projection") return route("adapters-opencode", "./opencode-session-sqlite-projection")
  if (moduleID === "opencode.session.compaction-event") return route("adapters-opencode", "./opencode-session-compaction-event")
  if (moduleID === "opencode.session.branch-graph.fork-before-message") return route("adapters-opencode", "./opencode-session-branch-graph")
  if (moduleID === "opencode.session.projector.message-v2") return route("adapters-opencode", "./opencode-session-message-v2-projector")
  if (moduleID === "opencode.session.projector.syncevent") return route("adapters-opencode", "./opencode-session-syncevent-projector")
  if (moduleID === "opencode.trace.debug-surface") return route("adapters-opencode", "./opencode-trace-debug-surface")
  if (moduleID === "nanobot.trace.debug-surface") return route("adapters-nanobot", "./product-schema/trace")
  if (moduleID.startsWith("pi.product-shell.")) return route("adapters-pi", piProductShellExport(moduleID))
  if (isNanobotProductShellNativeAtomID(moduleID)) return route("adapters-nanobot", "./product-schema/product-shell")
  if (moduleID.startsWith("nanobot.product-shell.")) return route("adapters-nanobot", nanobotProductShellExport(moduleID))
  if (isHermesProductShellNativeAtomID(moduleID)) return route("adapters-hermes", "./product-schema/product-shell")
  if (moduleID.startsWith("hermes.product-shell.")) return route("adapters-hermes", hermesProductShellExport(moduleID))
  if (
    moduleID === "pi.session.id-generator" ||
    moduleID === "pi.session.branch-graph.leaf-tree" ||
    moduleID === "pi.session.branch-graph.active-leaf" ||
    moduleID === "pi.session.pagination.active-path" ||
    moduleID === "pi.session.context-selector.active-leaf" ||
    moduleID === "pi.session.store.jsonl-v3" ||
    moduleID === "pi.session.store.jsonl-v3-migrator" ||
    moduleID === "pi.session.projector.jsonl" ||
    moduleID === "pi.session.projector.jsonl-v3" ||
    moduleID === "pi.session.branch-summary"
  ) {
    return route("lego-session", "./product-schema/pi")
  }
  if (moduleID.startsWith("opencode.session.")) return route("adapters-opencode", "./session-personality")
  if (moduleID.startsWith("pi.session.")) return route("adapters-pi", "./session-personality")
  if (moduleID.startsWith("nanobot.session.")) return route("adapters-nanobot", "./session-personality")
  if (moduleID.startsWith("hermes.session.")) return route("adapters-hermes", "./session-personality")
  if (moduleID.startsWith("opencode.")) return route("adapters-opencode", "./plugin-atoms")
  if (moduleID.startsWith("pi.")) return route("adapters-pi", "./extension-atoms")
  if (moduleID.startsWith("nanobot.")) return route("adapters-nanobot", "./nanobot-atoms")
  if (moduleID.startsWith("hermes.")) return route("adapters-hermes", "./hermes-atoms")
  return route(moduleID, ".")
}

function isProductScopedAtom(moduleID: string, segment: string): boolean {
  return moduleID.startsWith(`opencode.${segment}.`) || moduleID.startsWith(`pi.${segment}.`) || moduleID.startsWith(`nanobot.${segment}.`) || moduleID.startsWith(`hermes.${segment}.`)
}

function isNanobotProductShellNativeAtomID(moduleID: string): boolean {
  return [
    "nanobot.product-shell.cli",
    "nanobot.product-shell.harness",
    "nanobot.product-shell.sdk",
    "nanobot.product-shell.server",
    "nanobot.product-shell.tui",
    "nanobot.product-shell.web-ui",
  ].includes(moduleID)
}

function isHermesProductShellNativeAtomID(moduleID: string): boolean {
  return [
    "hermes.product-shell.acp",
    "hermes.product-shell.api-server",
    "hermes.product-shell.cli",
    "hermes.product-shell.gateway",
    "hermes.product-shell.harness",
    "hermes.product-shell.sdk",
    "hermes.product-shell.tui",
    "hermes.product-shell.web-dashboard",
  ].includes(moduleID)
}

function isScopedCadenceAtom(moduleID: string, segment: string): boolean {
  const submodules: Record<string, string[]> = {
    "agent-loop": ["request-boundary", "final-summary"],
    tools: ["schema", "batch-scheduler", "result-projector"],
    provider: ["streaming-delta-recorder", "stream-projector"],
    session: ["message-part-projector"],
    runtime: ["acceptance-controller", "acceptance-evidence"],
  }
  const allowed = submodules[segment] ?? []
  const prefixes = [`common.${segment}.`, `opencode.${segment}.`, `pi.${segment}.`, `pi-mono.${segment}.`, `nanobot.${segment}.`, `hermes.${segment}.`]
  return prefixes.some((prefix) => moduleID.startsWith(prefix) && allowed.some((name) => moduleID.slice(prefix.length).startsWith(name)))
}

function capabilityForBlock(block: LegoBlockInventoryEntry): LegoCapabilityInput {
  return {
    id: block.port,
    kind: block.type === "product-shell" ? "surface" : block.type === "strategy" ? "strategy" : "implementation",
    multiplicity: "single",
    stability: "stable",
    ...(block.personality === "common" ? {} : { personality: block.personality }),
  }
}

function resourcesForBlock(block: LegoBlockInventoryEntry, fixture: LegoPortContractFixture): LegoResourceRef[] {
  if (block.id === "tool-pack.echo" || block.id === "tool.executor.echo-only") return []
  if (block.id === "tool-pack.filesystem") return fixture.resources.filter((resource) => resource.id === "filesystem")
  return fixture.resources
}

const explicitBindingModules: Record<AtomRecipePersonality, Record<string, string>> = {
  common: {
    "product.shell": "product.shell.minimal-cli",
    "runtime.module-catalog": "runtime.module-catalog.memory",
    "runtime.capability-resolver": "runtime.capability-resolver.default",
    "runtime.binding-planner": "runtime.binding-planner.lockfile",
    "runtime.lifecycle-runner": "runtime.lifecycle-runner.scoped",
    "runtime.assembly-graph": "runtime.assembly-graph.lockfile",
    "session.store": "session.store.memory",
    "session.reader": "session.reader.memory",
    "session.writer": "session.writer.memory",
    "session.message-store": "session.message-store.memory",
    "session.branching": "session.branching.memory",
    "session.branch-graph": "session.branch-graph.memory",
    "session.pagination": "session.pagination.memory",
    "session.context-selector": "session.context-selector.memory",
    "session.compaction-records": "session.compaction-records.memory",
    "session.diff": "session.branching.memory",
    "session.message-part-projector": "common.session.message-part-projector",
    "runtime.acceptance-controller": "common.runtime.acceptance-controller.default",
    "runtime.acceptance-evidence": "common.runtime.acceptance-evidence.default",
    "agent-loop.request-boundary": "common.agent-loop.request-boundary.default",
    "agent-loop.final-summary": "common.agent-loop.final-summary.default",
    tools: "tool-pack.echo",
    "tools.schema": "common.tools.schema.default",
    "tools.batch-scheduler": "common.tools.batch-scheduler.default",
    "tools.result-projector": "common.tools.result-projector.default",
    "tool.permission-policy": "tool.permission.always-allow",
    "tool.executor": "tool.executor.echo-only",
    "filesystem.port": "filesystem.memory",
    "process-runner.port": "process-runner.disabled",
    "provider.transport": "provider.transport.mock-sse",
    "provider.model-registry": "provider.model-registry.static",
    "provider.request-shape": "provider.request-shape.openai-compatible",
    "provider.stream": "provider.stream.openai-compatible",
    "provider.streaming-delta-recorder": "common.provider.streaming-delta-recorder",
    "provider.stream-projector": "common.provider.stream-projector",
    "provider.event-normalizer": "provider.event-normalizer.common",
    "ui.renderer": "ui.renderer.noop",
  },
  opencode: {
    "product.shell": "opencode.product-shell.sdk",
    "runtime.module-catalog": "opencode.runtime.module-catalog",
    "runtime.capability-resolver": "opencode.runtime.capability-resolver",
    "runtime.binding-planner": "opencode.runtime.binding-planner",
    "runtime.lifecycle-runner": "opencode.runtime.lifecycle-runner",
    "runtime.assembly-graph": "opencode.runtime.assembly-graph",
    "session.id-generator": "opencode.session.id-generator",
    "session.event-log": "opencode.session.event-log.syncevent",
    "session.store": "opencode.session.store.sqlite-projection",
    "session.reader": "opencode.session.reader.sqlite-service",
    "session.writer": "opencode.session.writer.sqlite-service",
    "session.message-store": "opencode.session.message-store.sqlite-service",
    "session.branching": "opencode.session.branching.sqlite-service",
    "session.branch-graph": "opencode.session.branch-graph.fork-before-message",
    "session.diff": "opencode.session.diff.sqlite-service",
    "session.projector": "opencode.session.projector.message-v2",
    "session.message-part-projector": "opencode.session.message-part-projector.native-like",
    "session.pagination": "opencode.session.pagination.update-time-cursor",
    "session.context-selector": "opencode.session.context-selector.message-v2",
    "session.compaction-records": "opencode.session.compaction-event",
    "hook.bus": "opencode.plugin.loader",
    "hook.handler-chain": "opencode.plugin.event-mapper",
    "tool.registry": "opencode.plugin.registry-bridge",
    "registry.provider": "opencode.plugin.provider-registry-bridge",
    "registry.ui": "opencode.plugin.ui-registry-bridge",
    "turn.context-builder": "opencode.turn.context-builder",
    "turn.continuation-policy": "opencode.turn.continuation-policy",
    "runtime.acceptance-controller": "opencode.runtime.acceptance-controller.native-like",
    "runtime.acceptance-evidence": "opencode.runtime.acceptance-evidence.native-like",
    "agent-loop.request-boundary": "opencode.agent-loop.request-boundary.native-like",
    "agent-loop.final-summary": "opencode.agent-loop.final-summary.native-like",
    tools: "opencode.tool-pack.native",
    "tools.schema": "opencode.tools.schema.native-like",
    "tools.batch-scheduler": "opencode.tools.batch-scheduler.native-like",
    "tools.result-projector": "opencode.tools.result-projector.native-like",
    "tool.permission-policy": "opencode.plugin.permission-bridge",
    "tool.executor": "opencode.tool.permission-render-bridge",
    "tool.result-normalizer": "opencode.tool.result-render-bridge",
    "tool.audit-log": "opencode.tool.status-bridge",
    "filesystem.port": "opencode.workspace-filesystem-bridge",
    "process-runner.port": "opencode.shell.env-bridge",
    "provider.transport": "opencode.provider.transport-instrumentation",
    "provider.model-registry": "opencode.provider.model-plugin",
    "provider.request-shape": "opencode.provider.request-options",
    "provider.event-normalizer": "opencode.provider.event-observer",
    "provider.stream": "opencode.provider.plugin-descriptor",
    "provider.streaming-delta-recorder": "opencode.provider.streaming-delta-recorder.native-like",
    "provider.stream-projector": "opencode.provider.stream-projector.native-like",
    "config.source": "opencode.config.source",
    ...promptSupportCommonBindingModules,
    "resource.discovery": "opencode.resource.discovery.instruction",
    "prompt.resource-loader": "opencode.prompt.resource-loader.instruction",
    "prompt.tool-renderer": "opencode.prompt.tool-renderer.provider-tools",
    "prompt.model-capability-adapter": "opencode.prompt.model-capability-adapter.provider-prompt",
    "prompt.compaction-adapter": "opencode.prompt.compaction-adapter.build-prompt",
    "prompt.system-builder": "opencode.prompt.mode-builder",
    "ui.event-loop": "opencode.ui.event-loop",
    "ui.renderer": "opencode.ui.renderer",
  },
  "pi-mono": {
    "product.shell": "pi.product-shell.sdk",
    "runtime.module-catalog": "pi.runtime.module-catalog",
    "runtime.capability-resolver": "pi.runtime.capability-resolver",
    "runtime.binding-planner": "pi.runtime.binding-planner",
    "runtime.lifecycle-runner": "pi.runtime.lifecycle-runner",
    "runtime.assembly-graph": "pi.runtime.assembly-graph",
    "session.id-generator": "pi.session.id-generator",
    "session.store": "pi.session.store.jsonl-v3",
    "session.event-log": "pi.session.event-log.session-manager",
    "session.reader": "pi.session.reader.session-manager",
    "session.writer": "pi.session.writer.session-manager",
    "session.message-store": "pi.session.message-store.session-manager",
    "session.branching": "pi.session.branching.session-manager",
    "session.diff": "pi.session.diff.session-manager",
    "session.branch-graph": "pi.session.branch-graph.active-leaf",
    "session.projector": "pi.session.projector.jsonl-v3",
    "session.pagination": "pi.session.pagination.active-path",
    "session.context-selector": "pi.session.context-selector.active-leaf",
    "session.compaction-records": "pi.session.branch-summary",
    "hook.bus": "pi.extension.loader",
    "hook.handler-chain": "pi.extension.event-mapper",
    "tool.registry": "pi.extension.dynamic-tool-bridge",
    "registry.provider": "pi.extension.provider-registry-bridge",
    "registry.ui": "pi.extension.ui-registry-bridge",
    "turn.context-builder": "pi.turn.context-builder",
    "turn.continuation-policy": "pi.turn.continuation-policy",
    "session.message-part-projector": "pi.session.message-part-projector.native-like",
    "runtime.acceptance-controller": "pi.runtime.acceptance-controller.native-like",
    "runtime.acceptance-evidence": "pi.runtime.acceptance-evidence.native-like",
    "agent-loop.request-boundary": "pi.agent-loop.request-boundary.native-like",
    "agent-loop.final-summary": "pi.agent-loop.final-summary.native-like",
    tools: "pi.tool-pack.compatibility",
    "tools.schema": "pi.tools.schema.native-like",
    "tools.batch-scheduler": "pi.tools.batch-scheduler.native-like",
    "tools.result-projector": "pi.tools.result-projector.native-like",
    "tool.permission-policy": "pi.permission.event-bridge",
    "tool.executor": "pi.tool.event-render-bridge",
    "tool.result-normalizer": "pi.tool.result-event-bridge",
    "tool.audit-log": "pi.tool.runtime-event-bridge",
    "filesystem.port": "pi.workspace-filesystem-bridge",
    "process-runner.port": "pi.process-runner-bridge",
    "provider.transport": "pi.provider.transport-instrumentation",
    "provider.model-registry": "pi.provider.model-extension",
    "provider.request-shape": "pi.provider.request-options",
    "provider.event-normalizer": "pi.provider.event-observer",
    "provider.stream": "pi.provider.extension-descriptor",
    "provider.streaming-delta-recorder": "pi.provider.streaming-delta-recorder.native-like",
    "provider.stream-projector": "pi.provider.stream-projector.native-like",
    "config.source": "pi.config.source",
    ...promptSupportCommonBindingModules,
    "resource.discovery": "pi.resource.discovery.project-context",
    "prompt.resource-loader": "pi.prompt.resource-loader.project-context",
    "prompt.tool-renderer": "pi.prompt.tool-renderer.runtime-tools",
    "prompt.model-capability-adapter": "pi.prompt.model-capability-adapter.runtime-model",
    "prompt.compaction-adapter": "pi.prompt.compaction-adapter.summary-mode",
    "prompt.system-builder": "pi.prompt.coding-agent-builder",
    "ui.event-loop": "pi.ui.event-loop",
    "ui.renderer": "pi.ui.renderer",
  },
  nanobot: {
    "product.shell": "nanobot.product-shell.sdk",
    "session.id-generator": "nanobot.session.id-generator",
    "session.store": "nanobot.session.store.jsonl",
    "session.branch-graph": "nanobot.session.branch-graph.channel-key",
    "session.projector": "nanobot.session.projector.jsonl",
    "session.message-part-projector": "nanobot.session.message-part-projector.native-like",
    "session.pagination": "nanobot.session.pagination.updated-at",
    "session.context-selector": "nanobot.session.context-selector.max-messages",
    "session.compaction-records": "nanobot.session.goal-state",
    "hook.bus": "nanobot.plugin.loader",
    "hook.handler-chain": "nanobot.plugin.event-mapper",
    "tool.registry": "nanobot.tool.registry-bridge",
    "registry.provider": "nanobot.plugin.provider-registry-bridge",
    "registry.ui": "nanobot.plugin.ui-registry-bridge",
    "turn.context-builder": "nanobot.turn.context-builder",
    "turn.continuation-policy": "nanobot.turn.continuation-policy",
    tools: "tool-pack.shell",
    "tool.permission-policy": "nanobot.permission.policy-bridge",
    "tool.executor": "tool.executor.default",
    "tool.result-normalizer": "nanobot.tool.result-event-bridge",
    "tool.audit-log": "nanobot.tool.progress-event-bridge",
    "filesystem.port": "filesystem.workspace-scoped",
    "process-runner.port": "process-runner.local",
    "provider.transport": "provider.transport.fetch",
    "provider.request-shape": "provider.request-shape.openai-compatible",
    "provider.event-normalizer": "provider.event-normalizer.openai-compatible",
    "provider.stream": "provider.stream.openai-compatible",
    "config.source": "nanobot.config.source",
    ...promptSupportCommonBindingModules,
    "prompt.system-builder": "nanobot.prompt.agent-builder",
    "ui.event-loop": "ui.event-loop.shared-tui",
    "ui.renderer": "nanobot.ui.renderer",
  },
  "hermes-agent": {
    "product.shell": "hermes.product-shell.sdk",
    "session.id-generator": "hermes.session.id-generator",
    "session.store": "hermes.session.store.sqlite-fts",
    "session.branch-graph": "hermes.session.branch-graph.lineage",
    "session.projector": "hermes.session.projector.openai-messages",
    "session.message-part-projector": "hermes.session.message-part-projector.native-like",
    "session.pagination": "hermes.session.pagination.updated-at",
    "session.context-selector": "hermes.session.context-selector.thread-history",
    "session.compaction-records": "hermes.session.compaction-trajectory",
    "hook.bus": "hermes.plugin.loader",
    "hook.handler-chain": "hermes.plugin.event-mapper",
    "tool.registry": "hermes.tool.registry-bridge",
    "registry.provider": "hermes.plugin.provider-registry-bridge",
    "registry.ui": "hermes.plugin.ui-registry-bridge",
    "turn.context-builder": "hermes.turn.context-builder",
    "turn.continuation-policy": "hermes.turn.continuation-policy",
    tools: "tool-pack.shell",
    "tool.permission-policy": "hermes.permission.hook-bridge",
    "tool.executor": "tool.executor.default",
    "tool.result-normalizer": "hermes.tool.result-event-bridge",
    "tool.audit-log": "hermes.tool.progress-event-bridge",
    "filesystem.port": "filesystem.workspace-scoped",
    "process-runner.port": "process-runner.local",
    "provider.transport": "provider.transport.fetch",
    "provider.request-shape": "provider.request-shape.openai-compatible",
    "provider.event-normalizer": "provider.event-normalizer.openai-compatible",
    "provider.stream": "provider.stream.openai-compatible",
    "config.source": "hermes.config.source",
    ...promptSupportCommonBindingModules,
    "prompt.system-builder": "hermes.prompt.agent-builder",
    "ui.event-loop": "ui.event-loop.shared-tui",
    "ui.renderer": "hermes.ui.renderer",
  },
}

function uniqueCapabilityInputs(capabilities: LegoCapabilityInput[]): LegoCapabilityInput[] {
  const seen = new Set<string>()
  const output: LegoCapabilityInput[] = []
  for (const capability of normalizeCapabilityRefs(capabilities)) {
    const key = `${capability.id}:${capability.personality ?? ""}:${capability.kind ?? ""}:${capability.variant ?? ""}`
    if (seen.has(key)) continue
    seen.add(key)
    output.push(capability)
  }
  return output
}

function uniqueResources(resources: LegoResourceRef[]): LegoResourceRef[] {
  const seen = new Set<string>()
  const output: LegoResourceRef[] = []
  for (const resource of resources) {
    const key = `${resource.id}:${resource.mode ?? ""}:${resource.scope ?? ""}`
    if (seen.has(key)) continue
    seen.add(key)
    output.push(resource)
  }
  return output
}

function mergePersonality(left: LegoPersonality, right: LegoPersonality): LegoPersonality {
  if (left === right) return left
  if (left === "common") return right
  if (right === "common") return left
  return left
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function route(packageDir: string, exportPath: string): AtomExportRoute {
  return {
    packageDir,
    packageName: packageNameForDir(packageDir),
    exportPath,
  }
}

function packageNameForDir(packageDir: string): string {
  if (packageDir === "opencode-plugin") return "@opencode-ai/plugin"
  if (packageDir === "pi-coding-agent") return "@earendil-works/pi-coding-agent"
  return `@helix/${packageDir}`
}

function opencodeProductShellExport(moduleID: string): string {
  const suffix = moduleID.replace("opencode.product-shell.", "")
  const routes: Record<string, string> = {
    harness: "./product-schema/product-shell",
    sdk: "./product-schema/product-shell",
    server: "./product-schema/product-shell",
    tui: "./product-schema/product-shell",
    workspace: "./product-schema/product-shell",
    "control-plane": "./product-schema/product-shell",
    slack: "./product-schema/product-shell",
    web: "./product-schema/product-shell",
    desktop: "./product-schema/product-shell",
  }
  return routes[suffix] ?? "./product-surface"
}

function piProductShellExport(moduleID: string): string {
  const suffix = moduleID.replace("pi.product-shell.", "")
  const routes: Record<string, string> = {
    sdk: "./pi-sdk",
    cli: "./pi-cli",
    tui: "./product-schema/product-shell",
    rpc: "./pi-rpc",
    "web-ui": "./product-schema/product-shell",
    server: "./pi-server",
    "package-manager": "./pi-package-manager",
    "extension-examples": "./pi-extension-examples",
    "browser-smoke": "./product-schema/product-shell",
    "release-hardening": "./product-schema/product-shell",
  }
  return routes[suffix] ?? "./product-surface"
}

function nanobotProductShellExport(moduleID: string): string {
  const suffix = moduleID.replace("nanobot.product-shell.", "")
  const routes: Record<string, string> = {
    sdk: "./nanobot-sdk",
    cli: "./nanobot-cli",
    tui: "./product-schema/product-shell",
    "web-ui": "./product-schema/product-shell",
    server: "./nanobot-server",
  }
  return routes[suffix] ?? "./product-surface"
}

function hermesProductShellExport(moduleID: string): string {
  const suffix = moduleID.replace("hermes.product-shell.", "")
  const routes: Record<string, string> = {
    sdk: "./hermes-sdk",
    cli: "./hermes-cli",
    tui: "./product-schema/product-shell",
    "api-server": "./hermes-api-server",
    acp: "./hermes-acp",
    gateway: "./hermes-gateway",
    "web-dashboard": "./product-schema/product-shell",
  }
  return routes[suffix] ?? "./product-surface"
}
