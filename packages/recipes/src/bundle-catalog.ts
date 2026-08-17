import type { LegoRecipeBundleRef, LegoRecipeModuleRef } from "@helix/contracts"
import { allRecipeInventoryBlocks, allRecipePortFixtures, type AtomRecipePersonality } from "./atom-catalog"

export type LegoBundleKind = "feature-bundle" | "product-bundle" | "compat-bundle"
export type LegoBundleProductScope = AtomRecipePersonality | "hybrid"
export type LegoBundleExclusiveFamilyPolicy = "replace" | "warn" | "allow-many"

export interface LegoBundleSource {
  packageName: string
  evidence: string
  upstream?: string
}

export interface LegoBundleDescriptor {
  id: string
  label: string
  description: string
  plane: string
  kind: LegoBundleKind
  productScope: LegoBundleProductScope
  atoms: string[]
  ports: string[]
  optionalAtomIDs?: string[]
  dependsOnBundles?: string[]
  exclusiveFamilyID?: string
  exclusiveFamilyLabel?: string
  exclusiveFamilyPolicy?: LegoBundleExclusiveFamilyPolicy
  exclusiveFamilyPorts?: string[]
  source: LegoBundleSource
}

export interface LegoBundleRecipeExpansion {
  id: string
  version?: string
  atoms: string[]
  ports: string[]
  removedAtoms: string[]
  replacedAtoms: Array<{ from: string; to: string }>
}

export interface LegoBundleMatch {
  id: string
  status: "selected" | "partial"
  atoms: string[]
  selectedAtoms: string[]
  missingAtoms: string[]
}

export interface LegoBundleCatalogIssue {
  id: string
  severity: "error" | "warning"
  message: string
  refs: string[]
}

interface ProductBundleSeed {
  product: Exclude<AtomRecipePersonality, "common">
  prefix: string
  label: string
}

interface BundleInput {
  id: string
  label: string
  description: string
  plane: string
  kind: LegoBundleKind
  productScope: LegoBundleProductScope
  atoms: string[]
  ports?: string[]
  optionalAtomIDs?: string[]
  dependsOnBundles?: string[]
  exclusiveFamilyID?: string
  exclusiveFamilyLabel?: string
  exclusiveFamilyPolicy?: LegoBundleExclusiveFamilyPolicy
  exclusiveFamilyPorts?: string[]
  source?: Partial<LegoBundleSource>
}

const productSeeds: ProductBundleSeed[] = [
  { product: "opencode", prefix: "opencode.", label: "OpenCode" },
  { product: "pi-mono", prefix: "pi.", label: "Pi" },
  { product: "nanobot", prefix: "nanobot.", label: "Nanobot" },
  { product: "hermes-agent", prefix: "hermes.", label: "Hermes Agent" },
]

let cachedCatalog: LegoBundleDescriptor[] | undefined
let cachedInventoryBlocks: ReturnType<typeof allRecipeInventoryBlocks> | undefined
let cachedPortFixtures: ReturnType<typeof allRecipePortFixtures> | undefined

export function defaultLegoBundleCatalog(): LegoBundleDescriptor[] {
  if (cachedCatalog) return cachedCatalog
  const catalog = [
    ...commonFeatureBundles(),
    ...productSeeds.flatMap(productFeatureBundles),
    ...hermesNamedBundles(),
  ]
  cachedCatalog = catalog.sort((left, right) => left.id.localeCompare(right.id))
  return cachedCatalog
}

export function legoBundleByID(catalog: LegoBundleDescriptor[] = defaultLegoBundleCatalog()): Map<string, LegoBundleDescriptor> {
  return new Map(catalog.map((bundle) => [bundle.id, bundle]))
}

export function expandRecipeBundles(
  bundles: LegoRecipeBundleRef[] | undefined,
  catalog: LegoBundleDescriptor[] = defaultLegoBundleCatalog(),
): {
  moduleRefs: LegoRecipeModuleRef[]
  requiredCapabilities: string[]
  expandedBundles: LegoBundleRecipeExpansion[]
  bundleOverrides: LegoBundleRecipeExpansion[]
} {
  const byID = legoBundleByID(catalog)
  const moduleRefs: LegoRecipeModuleRef[] = []
  const requiredCapabilities: string[] = []
  const expandedBundles: LegoBundleRecipeExpansion[] = []
  const bundleOverrides: LegoBundleRecipeExpansion[] = []

  for (const bundleRef of bundles ?? []) {
    const descriptor = byID.get(bundleRef.id)
    if (!descriptor) throw new Error(`Recipe references unknown bundle ${bundleRef.id}`)
    const removed = new Set(bundleRef.removedAtoms ?? [])
    const replacements = Object.entries(bundleRef.replacedAtoms ?? {})
    const replacementTargets = new Set(replacements.map(([, to]) => to))
    const atoms = uniqueStrings([
      ...descriptor.atoms.filter((atomID) => !removed.has(atomID) && !bundleRef.replacedAtoms?.[atomID]),
      ...replacementTargets,
    ])
    moduleRefs.push(...atoms.map((id) => ({ id })))
    requiredCapabilities.push(...descriptor.ports)
    const expansion: LegoBundleRecipeExpansion = {
      id: descriptor.id,
      ...(bundleRef.version ? { version: bundleRef.version } : {}),
      atoms,
      ports: descriptor.ports,
      removedAtoms: [...removed].sort(),
      replacedAtoms: replacements.map(([from, to]) => ({ from, to })).sort((left, right) => left.from.localeCompare(right.from)),
    }
    expandedBundles.push(expansion)
    if (expansion.removedAtoms.length > 0 || expansion.replacedAtoms.length > 0) bundleOverrides.push(expansion)
  }

  return {
    moduleRefs,
    requiredCapabilities: uniqueStrings(requiredCapabilities),
    expandedBundles,
    bundleOverrides,
  }
}

export function inferBundleMatches(atomIDs: Iterable<string>, catalog: LegoBundleDescriptor[] = defaultLegoBundleCatalog()): LegoBundleMatch[] {
  const selected = new Set(atomIDs)
  return catalog
    .map((bundle): LegoBundleMatch | undefined => {
      const selectedAtoms = bundle.atoms.filter((atomID) => selected.has(atomID))
      if (selectedAtoms.length === 0) return undefined
      const missingAtoms = bundle.atoms.filter((atomID) => !selected.has(atomID))
      return {
        id: bundle.id,
        status: missingAtoms.length === 0 ? "selected" : "partial",
        atoms: bundle.atoms,
        selectedAtoms,
        missingAtoms,
      }
    })
    .filter((match): match is LegoBundleMatch => Boolean(match))
    .sort((left, right) => scoreBundleMatch(right) - scoreBundleMatch(left) || left.id.localeCompare(right.id))
}

export function selectedBundleIDsForAtoms(atomIDs: Iterable<string>, catalog: LegoBundleDescriptor[] = defaultLegoBundleCatalog()): string[] {
  return inferBundleMatches(atomIDs, catalog)
    .filter((match) => match.status === "selected")
    .map((match) => match.id)
    .sort()
}

export function bundleIDsForAtom(atomID: string, catalog: LegoBundleDescriptor[] = defaultLegoBundleCatalog()): string[] {
  return catalog.filter((bundle) => bundle.atoms.includes(atomID) || bundle.optionalAtomIDs?.includes(atomID)).map((bundle) => bundle.id).sort()
}

export function bundleCandidatesForPort(portID: string, catalog: LegoBundleDescriptor[] = defaultLegoBundleCatalog()): string[] {
  return catalog.filter((bundle) => bundle.ports.includes(portID)).map((bundle) => bundle.id).sort()
}

export function validateLegoBundleCatalog(catalog: LegoBundleDescriptor[] = defaultLegoBundleCatalog()): LegoBundleCatalogIssue[] {
  const issues: LegoBundleCatalogIssue[] = []
  const atoms = new Set(recipeInventoryBlocks().map((block) => block.id))
  const ports = new Set(recipePortFixtures().map((fixture) => fixture.id))
  const bundleIDs = new Set<string>()

  for (const bundle of catalog) {
    if (bundleIDs.has(bundle.id)) {
      issues.push(issue(bundle.id, "error", `Duplicate bundle id ${bundle.id}.`, [bundle.id]))
    }
    bundleIDs.add(bundle.id)
    for (const atom of [...bundle.atoms, ...(bundle.optionalAtomIDs ?? [])]) {
      if (!atoms.has(atom)) issues.push(issue(bundle.id, "error", `Bundle references unknown atom ${atom}.`, [atom]))
      if (bundle.productScope !== "common" && bundle.productScope !== "hybrid" && productScopeForAtom(atom) !== "common" && productScopeForAtom(atom) !== bundle.productScope) {
        issues.push(issue(bundle.id, "error", `Product bundle references atom from another product: ${atom}.`, [atom, bundle.productScope]))
      }
    }
    for (const port of bundle.ports) {
      if (!ports.has(port)) issues.push(issue(bundle.id, "error", `Bundle references unknown port ${port}.`, [port]))
    }
    for (const dependsOn of bundle.dependsOnBundles ?? []) {
      if (!catalog.some((candidate) => candidate.id === dependsOn)) {
        issues.push(issue(bundle.id, "error", `Bundle depends on unknown bundle ${dependsOn}.`, [dependsOn]))
      }
    }
  }

  for (const cycle of bundleDependencyCycles(catalog)) {
    issues.push(issue(cycle[0] ?? "bundle", "error", `Bundle dependency cycle: ${cycle.join(" -> ")}.`, cycle))
  }

  return issues.sort((left, right) => left.id.localeCompare(right.id) || left.message.localeCompare(right.message))
}

function commonFeatureBundles(): LegoBundleDescriptor[] {
  return [
    bundle({
      id: "bundle.foundation.contract-ledger",
      label: "Contract Ledger",
      description: "Block manifests, capability refs, resources, recipe bindings, and conformance refs.",
      plane: "foundation",
      kind: "feature-bundle",
      productScope: "common",
      atoms: [
        "block.manifest.normalizer",
        "block.manifest.schema",
        "capability.ref.normalizer",
        "resource.grant.validator",
        "recipe.binding.lockfile",
        "conformance.ref.fixture-registry",
      ],
    }),
    bundle({
      id: "bundle.runtime.assembly-core",
      label: "Runtime Assembly Core",
      description: "Runtime module catalog, capability resolver, binding planner, lifecycle runner, lockfile graph, and acceptance evidence.",
      plane: "runtime",
      kind: "feature-bundle",
      productScope: "common",
      atoms: [
        "runtime.module-catalog.memory",
        "runtime.capability-resolver.default",
        "runtime.binding-planner.lockfile",
        "runtime.lifecycle-runner.scoped",
        "runtime.assembly-graph.lockfile",
        "common.runtime.acceptance-controller.default",
        "common.runtime.acceptance-evidence.default",
      ],
    }),
    bundle({
      id: "bundle.identity-event-trace.core",
      label: "Identity / Event / Trace",
      description: "Stable IDs, clocks, workspace resolution, event envelope/log/projection, and trace recording.",
      plane: "event",
      kind: "feature-bundle",
      productScope: "common",
      atoms: [
        "identity.id-generator.deterministic",
        "identity.clock.system",
        "identity.workspace-resolver.cwd",
        "event.envelope.common",
        "event.log.memory",
        "event.log.projection",
        "trace.recorder.memory",
      ],
      optionalAtomIDs: ["identity.clock.deterministic", "identity.id-generator.random", "identity.workspace-resolver.configured", "event.log.jsonl", "trace.recorder.jsonl"],
    }),
    bundle({
      id: "bundle.session.memory",
      label: "Memory Session",
      description: "In-memory session storage, event log, message store, branch graph, projector, context selector, and message-part projector.",
      plane: "session",
      kind: "feature-bundle",
      productScope: "common",
      atoms: [
        "session.id-generator.deterministic",
        "session.event-log.memory",
        "session.message-store.memory",
        "session.store.memory",
        "session.reader.memory",
        "session.writer.memory",
        "session.branch-graph.memory",
        "session.branching.memory",
        "session.projector.common-transcript",
        "session.context-selector.memory",
        "common.session.message-part-projector",
      ],
    }),
    bundle({
      id: "bundle.session.service-contracts",
      label: "Session Service Contracts",
      description: "Service-facing session reader/writer/store/branch/context/pagination contracts for product adapters.",
      plane: "session",
      kind: "feature-bundle",
      productScope: "common",
      atoms: [
        "session.store.sqlite-projection",
        "session.store.jsonl-tree",
        "session.event-log.jsonl",
        "session.event-log.projection",
        "session.message-store.service",
        "session.reader.service",
        "session.writer.service",
        "session.branch-graph.service",
        "session.branching.service",
        "session.context-selector.service",
        "session.pagination.service",
        "session.compaction-records.service",
      ],
    }),
    bundle({
      id: "bundle.agent-loop.turn-runner",
      label: "Turn Runner",
      description: "The common request boundary, turn input, prompt assembly, provider request/stream, tools, reducer, retry, stop, and final summary.",
      plane: "agent-loop",
      kind: "feature-bundle",
      productScope: "common",
      atoms: [
        "common.agent-loop.request-boundary.default",
        "turn.input-normalizer.text",
        "turn.context-builder.transcript",
        "turn.prompt-assembler.common",
        "turn.provider-request-builder.common",
        "turn.provider-stream-runner.common",
        "turn.tool-call-planner.parallel-batch",
        "turn.tool-executor.common",
        "turn.stream-reducer.common",
        "turn.result-recorder.common",
        "turn.retry-policy.exponential",
        "turn.stop-condition.max-steps",
        "turn.continuation-policy.synthetic-continue",
        "common.agent-loop.final-summary.default",
      ],
      optionalAtomIDs: ["turn.tool-call-planner.sequential", "turn.retry-policy.fixed", "turn.retry-policy.none", "turn.stop-condition.no-tool-calls"],
    }),
    bundle({
      id: "bundle.provider.openai-compatible",
      label: "OpenAI-compatible Provider",
      description: "Fetch transport, API-key auth, model registry, request shape, SSE/JSON stream parsers, event normalizers, usage, and stream projector.",
      plane: "provider",
      kind: "feature-bundle",
      productScope: "common",
      atoms: [
        "provider.transport.fetch",
        "provider.auth.api-key",
        "provider.model-registry.env",
        "provider.request-shape.openai-compatible",
        "provider.stream-parser.sse",
        "provider.stream.openai-compatible",
        "provider.event-normalizer.openai-compatible",
        "provider.usage-normalizer.common",
        "common.provider.streaming-delta-recorder",
        "common.provider.stream-projector",
      ],
      optionalAtomIDs: [
        "provider.stream.openrouter",
        "provider.request-shape.anthropic",
        "provider.request-shape.google",
        "provider.event-normalizer.anthropic",
        "provider.event-normalizer.google",
        "provider.usage-normalizer.pricing-table",
      ],
    }),
    bundle({
      id: "bundle.provider.cassette",
      label: "Cassette Provider",
      description: "Offline provider replay using memory or JSONL cassettes for conformance and task parity.",
      plane: "provider",
      kind: "compat-bundle",
      productScope: "common",
      atoms: ["provider.transport.cassette", "provider.cassette.memory", "provider.cassette.jsonl", "provider.stream-parser.cassette"],
    }),
    bundle({
      id: "bundle.tool.filesystem-shell",
      label: "Filesystem / Shell Tools",
      description: "Filesystem and shell tool packs, process runners, executors, result formats, permissions, and audit.",
      plane: "tool",
      kind: "feature-bundle",
      productScope: "common",
      atoms: [
        "tool-pack.filesystem",
        "tool-pack.shell",
        "filesystem.workspace-scoped",
        "filesystem.local",
        "process-runner.local",
        "process-runner.sandbox",
        "tool.definition.filesystem",
        "tool.definition.shell",
        "tool.executor.default",
        "tool.permission.workspace-scoped",
        "tool.result.json",
        "tool.result.text",
        "tool.result.error",
        "tool.audit.memory",
        "common.tools.schema.default",
        "common.tools.batch-scheduler.default",
        "common.tools.result-projector.default",
      ],
      optionalAtomIDs: ["filesystem.memory", "filesystem.readonly", "process-runner.disabled", "process-runner.dry-run", "tool.audit.jsonl"],
    }),
    bundle({
      id: "bundle.tool.schema-permission",
      label: "Tool Schema / Permission",
      description: "Schema conversion, permission policies, echo/meta tool packs, and result truncation.",
      plane: "tool",
      kind: "feature-bundle",
      productScope: "common",
      atoms: [
        "tool-pack.echo",
        "tool-pack.meta",
        "tool.definition.echo",
        "tool.definition.meta",
        "tool.executor.echo-only",
        "tool.permission.always-allow",
        "tool.schema.json-schema",
        "tool.schema.typescript-validator",
        "tool.result.truncated",
      ],
      optionalAtomIDs: ["tool.permission.always-deny", "tool.permission.ask-hook", "tool.permission.product-personality", "tool.schema.zod-compatible", "tool.schema.typebox"],
    }),
    bundle({
      id: "bundle.prompt.resources",
      label: "Prompt / Resources",
      description: "System prompt builder, model capability adapter, compaction adapter, resource discovery/loaders, grants, and tool renderer.",
      plane: "prompt",
      kind: "feature-bundle",
      productScope: "common",
      atoms: [
        "prompt.system-builder.common",
        "prompt.model-capability-adapter.common",
        "prompt.compaction-adapter.common",
        "prompt.resource-loader.markdown",
        "prompt.resource-loader.text",
        "resource.discovery.filesystem",
        "resource.discovery.memory",
        "resource.grant.validator",
        "prompt.tool-renderer.common",
      ],
    }),
    bundle({
      id: "bundle.ui.basic",
      label: "Basic UI",
      description: "Shared UI command router, input normalizer, renderers, snapshots, themes, and TUI event loop.",
      plane: "ui",
      kind: "feature-bundle",
      productScope: "common",
      atoms: [
        "ui.command-router.common",
        "ui.input-normalizer.common",
        "ui.renderer.text",
        "ui.renderer.html",
        "ui.snapshot.common",
        "ui.theme-registry.common",
        "ui.event-loop.shared-tui",
      ],
      optionalAtomIDs: ["ui.renderer.noop"],
    }),
    bundle({
      id: "bundle.config.sources",
      label: "Config Sources",
      description: "Environment/file/CLI config sources, merge strategies, and validators.",
      plane: "config",
      kind: "feature-bundle",
      productScope: "common",
      atoms: [
        "config.source.env",
        "config.source.file",
        "config.source.cli-override",
        "config.merge.priority",
        "config.merge.deep",
        "config.validator.schema",
        "config.validator.typescript",
      ],
      optionalAtomIDs: ["config.merge.replace"],
    }),
    bundle({
      id: "bundle.product.minimal-cli",
      label: "Minimal CLI Shell",
      description: "The neutral product shell used to prove common atoms can assemble without a product personality.",
      plane: "product",
      kind: "product-bundle",
      productScope: "common",
      atoms: ["product.shell.minimal-cli"],
      ports: ["product.shell"],
    }),
  ]
}

function productFeatureBundles(seed: ProductBundleSeed): LegoBundleDescriptor[] {
  return [
    bundle({
      id: `bundle.${seed.product}.product-shells`,
      label: `${seed.label} Product Shells`,
      description: `${seed.label} CLI, SDK, TUI, web, server, gateway, and other product entry surfaces.`,
      plane: "product",
      kind: "product-bundle",
      productScope: seed.product,
      atoms: atomsStartingWith(seed.prefix, ["product-shell."]),
      ports: ["product.shell"],
    }),
    bundle({
      id: `bundle.${seed.product}.turn-loop`,
      label: `${seed.label} Turn Loop`,
      description: `${seed.label} native-like turn cadence, request boundary, provider runner, tool planner, retry, stop, compaction, and final summary.`,
      plane: "agent-loop",
      kind: "product-bundle",
      productScope: seed.product,
      atoms: atomsStartingWith(seed.prefix, ["turn.", "agent-loop."]),
      exclusiveFamilyID: "family.turn-loop",
      exclusiveFamilyLabel: "Turn Loop",
      exclusiveFamilyPolicy: "replace",
      dependsOnBundles: ["bundle.agent-loop.turn-runner"],
    }),
    bundle({
      id: `bundle.${seed.product}.session`,
      label: `${seed.label} Session`,
      description: `${seed.label} session storage, projection, branch/context/pagination, identity, and message part semantics.`,
      plane: "session",
      kind: "product-bundle",
      productScope: seed.product,
      atoms: atomsStartingWith(seed.prefix, ["session.", "identity."]),
      exclusiveFamilyID: "family.session",
      exclusiveFamilyLabel: "Session Adapter",
      exclusiveFamilyPolicy: "replace",
      dependsOnBundles: ["bundle.session.memory"],
    }),
    bundle({
      id: `bundle.${seed.product}.provider`,
      label: `${seed.label} Provider`,
      description: `${seed.label} provider registry, model/auth/request/stream/usage adapters, and stream evidence projectors.`,
      plane: "provider",
      kind: "product-bundle",
      productScope: seed.product,
      atoms: atomsStartingWith(seed.prefix, ["provider.", "registry.provider", "plugin.provider", "extension.provider"]),
      exclusiveFamilyID: "family.provider-adapter",
      exclusiveFamilyLabel: "Provider Adapter",
      exclusiveFamilyPolicy: "replace",
      dependsOnBundles: ["bundle.provider.openai-compatible"],
    }),
    bundle({
      id: `bundle.${seed.product}.tools-extensions`,
      label: `${seed.label} Tools / Extensions`,
      description: `${seed.label} plugin or extension loader, tool registry bridge, schema/permission/result adapters, process runner, and filesystem bridge.`,
      plane: "tool",
      kind: "product-bundle",
      productScope: seed.product,
      atoms: atomsStartingWith(seed.prefix, [
        "tool.",
        "tools.",
        "tool-pack.",
        "plugin.",
        "extension.",
        "permission.",
        "process-runner",
        "workspace-filesystem",
        "shell.env",
      ]),
      dependsOnBundles: ["bundle.tool.filesystem-shell"],
    }),
    bundle({
      id: `bundle.${seed.product}.prompt-config-ui`,
      label: `${seed.label} Prompt / Config / UI`,
      description: `${seed.label} prompt resources, config precedence, command/UI registries, renderers, themes, and TUI shell.`,
      plane: "prompt",
      kind: "product-bundle",
      productScope: seed.product,
      atoms: atomsStartingWith(seed.prefix, ["prompt.", "config.", "resource.", "ui.", "registry.command", "registry.ui", "tui.shell"]),
      dependsOnBundles: ["bundle.prompt.resources", "bundle.config.sources", "bundle.ui.basic"],
    }),
    bundle({
      id: `bundle.${seed.product}.runtime-contract`,
      label: `${seed.label} Runtime Contract`,
      description: `${seed.label} runtime defaults, compatibility metadata, capability/recipe aliases, event bridges, traces, and product gates.`,
      plane: "runtime",
      kind: "compat-bundle",
      productScope: seed.product,
      atoms: atomsStartingWith(seed.prefix, ["runtime.", "block.", "capability.", "recipe.", "conformance.", "event.", "trace."]),
      exclusiveFamilyID: "family.runtime-contract",
      exclusiveFamilyLabel: "Runtime Contract",
      exclusiveFamilyPolicy: "warn",
      dependsOnBundles: ["bundle.foundation.contract-ledger", "bundle.runtime.assembly-core", "bundle.identity-event-trace.core"],
    }),
  ].filter((bundle) => bundle.atoms.length > 0)
}

function hermesNamedBundles(): LegoBundleDescriptor[] {
  return [
    bundle({
      id: "bundle.hermes.plugin-bridge",
      label: "Hermes Plugin Bridge",
      description: "Hermes plugin loader, event mapper, lifecycle cleanup, hook bridge, tool registry bridge, and UI/provider registry bridges.",
      plane: "hook",
      kind: "product-bundle",
      productScope: "hermes-agent",
      atoms: [
        "hermes.plugin.loader",
        "hermes.plugin.event-mapper",
        "hermes.plugin.cleanup",
        "hermes.hook.plugin-bridge",
        "hermes.tool.registry-bridge",
        "hermes.plugin.provider-registry-bridge",
        "hermes.plugin.ui-registry-bridge",
        "hermes.registry.tool-definition",
        "hermes.registry.provider-plugin",
        "hermes.registry.ui-provider",
      ],
      dependsOnBundles: ["bundle.hermes-agent.tools-extensions"],
    }),
    bundle({
      id: "bundle.hermes.prompt-builder",
      label: "Hermes Prompt Builder",
      description: "Hermes agent prompt builder, compaction/model adapters, resource loader, tool renderer, and resource grant defaults.",
      plane: "prompt",
      kind: "product-bundle",
      productScope: "hermes-agent",
      atoms: [
        "hermes.prompt.agent-builder",
        "hermes.prompt.compaction-adapter",
        "hermes.prompt.model-adapter",
        "hermes.prompt.resource-loader",
        "hermes.prompt.tool-renderer",
        "hermes.resource.discovery",
        "hermes.resource.grant-defaults",
      ],
      dependsOnBundles: ["bundle.hermes-agent.prompt-config-ui"],
    }),
    bundle({
      id: "bundle.hermes.provider-registry",
      label: "Hermes Provider Registry",
      description: "Hermes model registry, auth/request options, plugin descriptors, transport instrumentation, stream observers, and usage renderer.",
      plane: "provider",
      kind: "product-bundle",
      productScope: "hermes-agent",
      atoms: [
        "hermes.provider.model-registry",
        "hermes.provider.auth-descriptor",
        "hermes.provider.request-options",
        "hermes.provider.plugin-descriptor",
        "hermes.provider.transport-instrumentation",
        "hermes.provider.event-observer",
        "hermes.provider.parser-observer",
        "hermes.provider.usage-renderer",
      ],
      dependsOnBundles: ["bundle.hermes-agent.provider"],
    }),
    bundle({
      id: "bundle.hermes.session-sqlite-fts",
      label: "Hermes SQLite / FTS Session",
      description: "Hermes SQLite FTS store, OpenAI message projector, thread-history context selector, lineage branch graph, and compaction trajectory.",
      plane: "session",
      kind: "product-bundle",
      productScope: "hermes-agent",
      atoms: [
        "hermes.session.store.sqlite-fts",
        "hermes.session.projector.openai-messages",
        "hermes.session.context-selector.thread-history",
        "hermes.session.branch-graph.lineage",
        "hermes.session.compaction-trajectory",
        "hermes.session.pagination.updated-at",
        "hermes.session.message-part-projector.native-like",
      ],
      dependsOnBundles: ["bundle.hermes-agent.session"],
    }),
  ]
}

function bundle(input: BundleInput): LegoBundleDescriptor {
  const atoms = uniqueStrings(input.atoms)
  const optionalAtomIDs = uniqueStrings(input.optionalAtomIDs ?? [])
  const ports = uniqueStrings([...(input.ports ?? []), ...portsForAtoms([...atoms, ...optionalAtomIDs])])
  const exclusiveFamilyPorts = uniqueStrings(input.exclusiveFamilyPorts ?? (input.exclusiveFamilyID ? ports : []))
  return {
    id: input.id,
    label: input.label,
    description: input.description,
    plane: input.plane,
    kind: input.kind,
    productScope: input.productScope,
    atoms,
    ports,
    ...(optionalAtomIDs.length > 0 ? { optionalAtomIDs } : {}),
    ...(input.dependsOnBundles && input.dependsOnBundles.length > 0 ? { dependsOnBundles: uniqueStrings(input.dependsOnBundles) } : {}),
    ...(input.exclusiveFamilyID
      ? {
          exclusiveFamilyID: input.exclusiveFamilyID,
          exclusiveFamilyLabel: input.exclusiveFamilyLabel ?? input.exclusiveFamilyID,
          exclusiveFamilyPolicy: input.exclusiveFamilyPolicy ?? "replace",
          exclusiveFamilyPorts,
        }
      : {}),
    source: {
      packageName: input.source?.packageName ?? "@helix/recipes",
      evidence: input.source?.evidence ?? "TODO-013 bundle layer",
      ...(input.source?.upstream ? { upstream: input.source.upstream } : {}),
    },
  }
}

function portsForAtoms(atomIDs: string[]): string[] {
  const blockByID = new Map(recipeInventoryBlocks().map((block) => [block.id, block]))
  return uniqueStrings(
    atomIDs
      .map((atomID) => blockByID.get(atomID)?.port ?? "")
      .filter((portID): portID is string => portID.length > 0),
  )
}

function atomsStartingWith(prefix: string, suffixPrefixes: string[]): string[] {
  const atoms = recipeInventoryBlocks().map((block) => block.id)
  return uniqueStrings(atoms.filter((id) => suffixPrefixes.some((suffix) => id.startsWith(`${prefix}${suffix}`))))
}

function recipeInventoryBlocks(): ReturnType<typeof allRecipeInventoryBlocks> {
  cachedInventoryBlocks ??= allRecipeInventoryBlocks()
  return cachedInventoryBlocks
}

function recipePortFixtures(): ReturnType<typeof allRecipePortFixtures> {
  cachedPortFixtures ??= allRecipePortFixtures()
  return cachedPortFixtures
}

function productScopeForAtom(atomID: string): LegoBundleProductScope {
  if (atomID.startsWith("opencode.")) return "opencode"
  if (atomID.startsWith("pi.")) return "pi-mono"
  if (atomID.startsWith("nanobot.")) return "nanobot"
  if (atomID.startsWith("hermes.")) return "hermes-agent"
  return "common"
}

function bundleDependencyCycles(catalog: LegoBundleDescriptor[]): string[][] {
  const byID = new Map(catalog.map((bundle) => [bundle.id, bundle]))
  const cycles: string[][] = []
  const visiting = new Set<string>()
  const visited = new Set<string>()

  function visit(id: string, path: string[]): void {
    if (visiting.has(id)) {
      const start = path.indexOf(id)
      cycles.push([...path.slice(start), id])
      return
    }
    if (visited.has(id)) return
    visiting.add(id)
    const bundle = byID.get(id)
    for (const next of bundle?.dependsOnBundles ?? []) visit(next, [...path, id])
    visiting.delete(id)
    visited.add(id)
  }

  for (const bundle of catalog) visit(bundle.id, [])
  return cycles
}

function scoreBundleMatch(match: LegoBundleMatch): number {
  return match.status === "selected" ? 10_000 + match.atoms.length : match.selectedAtoms.length
}

function issue(id: string, severity: LegoBundleCatalogIssue["severity"], message: string, refs: string[]): LegoBundleCatalogIssue {
  return { id, severity, message, refs }
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort()
}
