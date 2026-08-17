import type { LegoRecipe, LegoRecipeModuleRef } from "@helix/contracts"
import {
  commonAtomBlockIDs,
  defaultPortBindingModule,
  personalityAtomBlockIDs,
  productShellBlockIDs,
  recipeBindingPorts,
  type AtomRecipePersonality,
} from "./atom-catalog"

const commonAtoms = commonAtomBlockIDs().map((id) => ({ id }))

const fullProductConformance = [
  "session",
  "hooks",
  "agent-loop",
  "tools",
  "port-contract-fixtures",
  "product-shell-surfaces",
  "fixture-replay",
  "product-workflow-parity",
  "upstream-e2e-parity",
  "live-provider-parity",
  "task-parity",
  "reverse-assembly",
  "block-ledger",
]

const minimalConformance = ["session-atoms", "port-contract-fixtures", "runtime", "recipes", "package-exports", "package-boundary", "boundary-lint", "block-ledger"]

export const codingAgentMinimalRecipe: LegoRecipe = atomRecipe({
  id: "coding-agent.minimal",
  personality: "common",
  atoms: commonAtoms,
  productShells: productShellBlockIDs("common").map((id) => ({ id })),
  strategies: [
    { id: "turn.context-builder", config: { variant: "minimal-transcript" } },
    { id: "tool.permission", config: { mode: "allow-echo-only" } },
  ],
  policies: [
    { id: "shell.execution", config: { mode: "disabled" } },
    { id: "extension.loading", config: { mode: "disabled" } },
  ],
  personalities: [],
  entrypoints: {
    cli: "@helix/cli recipe inspect coding-agent.minimal",
  },
  conformance: {
    suite: minimalConformance,
  },
  metadata: {
    role: "neutral minimal recipe proving common atoms are product-neutral",
    graphLevel: "atom",
  },
})

export const opencodeRecipe: LegoRecipe = atomRecipe({
  id: "opencode",
  personality: "opencode",
  atoms: [...commonAtoms, ...personalityAtomBlockIDs("opencode").map((id) => ({ id }))],
  productShells: productShellBlockIDs("opencode").map((id) => ({ id })),
  strategies: [
    { id: "turn.context-builder", config: { variant: "opencode-prompt-context" } },
    { id: "tool.permission", config: { source: "opencode-plugin-hooks" } },
  ],
  policies: [
    { id: "shell.execution", config: { envHook: "shell.env", helper: "bun-dollar" } },
    { id: "extension.loading", config: { source: "opencode-plugin-loader" } },
  ],
  personalities: ["opencode-session-personality", "opencode-plugin-personality"],
  entrypoints: {
    cli: "@helix/cli run opencode",
    sdk: "hooks.services['opencode.sdk']",
    server: "hooks.services['opencode.server.factory']",
    workspace: "hooks.services['opencode.workspace']",
    controlPlane: "hooks.services['opencode.control-plane']",
    tui: "hooks.services['opencode.tui']",
    web: "hooks.services['opencode.web']",
    desktop: "hooks.services['opencode.desktop']",
    slack: "hooks.services['opencode.slack']",
  },
  conformance: {
    suite: fullProductConformance,
  },
  metadata: {
    upstream: "https://github.com/anomalyco/opencode",
    upstreamCommit: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    graphLevel: "atom",
  },
})

export const piMonoRecipe: LegoRecipe = atomRecipe({
  id: "pi-mono",
  personality: "pi-mono",
  atoms: [...commonAtoms, ...personalityAtomBlockIDs("pi-mono").map((id) => ({ id }))],
  productShells: productShellBlockIDs("pi-mono").map((id) => ({ id })),
  strategies: [
    { id: "turn.context-builder", config: { variant: "pi-active-leaf-context" } },
    { id: "tool.permission", config: { source: "pi-extension-events" } },
  ],
  policies: [
    { id: "shell.execution", config: { envHook: "runtime.events", helper: "node-process" } },
    { id: "extension.loading", config: { source: "pi-extension-loader" } },
  ],
  personalities: ["pi-session-personality", "pi-extension-personality"],
  entrypoints: {
    cli: "@helix/cli run pi-mono",
    sdk: "hooks.services['pi.sdk']",
    tui: "hooks.services['pi.tui']",
    rpc: "hooks.services['pi.rpc']",
    webUI: "hooks.services['pi.web-ui']",
    server: "hooks.services['pi.server.factory']",
    packageManager: "hooks.services['pi.package-manager']",
    examples: "hooks.services['pi.extension-examples']",
    browserSmoke: "hooks.services['pi.browser-smoke']",
    release: "hooks.services['pi.release-hardening']",
  },
  conformance: {
    suite: fullProductConformance,
  },
  metadata: {
    upstream: "https://github.com/earendil-works/pi",
    upstreamCommit: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    graphLevel: "atom",
  },
})

type OpencodePiHybridSource = "opencode" | "pi-mono"

const opencodePiHybridPorts = recipeBindingPorts("opencode")

const opencodePiHybridProductShellIDs = [
  "opencode.product-shell.sdk",
  "opencode.product-shell.harness",
  "opencode.product-shell.workspace",
  "opencode.product-shell.tui",
  "opencode.product-shell.web",
  "pi.product-shell.cli",
  "pi.product-shell.tui",
  "pi.product-shell.rpc",
  "pi.product-shell.web-ui",
  "pi.product-shell.package-manager",
]

const opencodePiHybridProductShellIDSet = new Set(opencodePiHybridProductShellIDs)

const opencodePiHybridPortSources = opencodePiHybridPorts.map((port, index) => ({
  port,
  source: opencodePiHybridPortSource(port, index),
}))

const opencodePiHybridSourceCounts = opencodePiHybridPortSources.reduce<Record<OpencodePiHybridSource, number>>(
  (counts, item) => {
    counts[item.source] += 1
    return counts
  },
  { opencode: 0, "pi-mono": 0 },
)

export const opencodePiHybridRecipe: LegoRecipe = {
  id: "opencode-pi-hybrid",
  version: "0.1.0",
  modules: [],
  atoms: opencodePiHybridAtoms(),
  productShells: opencodePiHybridProductShellIDs.map((id) => ({ id })),
  bindings: opencodePiHybridPortSources.map(({ port, source }) => ({
    port,
    module: defaultPortBindingModule(port, source),
  })),
  requiredCapabilities: opencodePiHybridPorts,
  strategies: [
    { id: "turn.context-builder", config: { variant: "pi-active-leaf-context", source: "pi-mono" } },
    { id: "tool.permission", config: { source: "opencode-plugin-hooks+pi-extension-events" } },
  ],
  policies: [
    { id: "shell.execution", config: { envHook: "shell.env", helper: "node-process", source: "opencode-session+pi-runtime" } },
    { id: "extension.loading", config: { source: "opencode-plugin-loader+pi-extension-loader" } },
  ],
  personalities: [
    "opencode-session-personality",
    "opencode-plugin-personality",
    "pi-session-personality",
    "pi-extension-personality",
    "opencode-pi-hybrid-personality",
  ],
  entrypoints: {
    cli: "@helix/cli run opencode-pi-hybrid",
    sdk: "hooks.services['opencode.sdk']",
    piCli: "hooks.services['pi.cli']",
    piTui: "hooks.services['pi.tui']",
    piRpc: "hooks.services['pi.rpc']",
    piWebUI: "hooks.services['pi.web-ui']",
    opencodeWorkspace: "hooks.services['opencode.workspace']",
    opencodeTui: "hooks.services['opencode.tui']",
    opencodeWeb: "hooks.services['opencode.web']",
  },
  conformance: {
    suite: [
      "session",
      "hooks",
      "agent-loop",
      "tools",
      "port-contract-fixtures",
      "product-shell-surfaces",
      "fixture-replay",
      "product-workflow-parity",
      "live-provider-parity",
      "task-parity",
      "block-ledger",
    ],
  },
  metadata: {
    product: "opencode-pi-hybrid",
    baseRecipes: ["opencode.full", "pi-mono.full"],
    upstreams: {
      opencode: "https://github.com/anomalyco/opencode",
      "pi-mono": "https://github.com/earendil-works/pi",
    },
    upstreamCommits: {
      opencode: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
      "pi-mono": "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    },
    graphLevel: "atom",
    composition: {
      rule: "96 port bindings split 48/48: OpenCode foundation/session/hook plus tool-pack/schema/batch; Pi turn/provider/config/prompt/ui plus tool execution/result/permission.",
      bindingSourceCounts: opencodePiHybridSourceCounts,
      productShellSourceCounts: { opencode: 5, "pi-mono": 5 },
      runtimeBlend: {
        opencode: ["session-store", "hook-host", "provider-plugin-registry", "tool-registry", "workspace/web/tui surfaces"],
        "pi-mono": ["config", "prompt", "turn-profile", "cadence", "acceptance", "cli/tui/rpc/web-ui surfaces"],
      },
    },
  },
}

export const nanobotRecipe: LegoRecipe = atomRecipe({
  id: "nanobot",
  personality: "nanobot",
  atoms: [...commonAtoms, ...personalityAtomBlockIDs("nanobot").map((id) => ({ id }))],
  productShells: productShellBlockIDs("nanobot").map((id) => ({ id })),
  strategies: [
    { id: "turn.context-builder", config: { variant: "nanobot-session-history" } },
    { id: "tool.permission", config: { source: "nanobot-tool-policy" } },
  ],
  policies: [
    { id: "shell.execution", config: { envHook: "runtime.events", helper: "python-subprocess" } },
    { id: "extension.loading", config: { source: "nanobot-plugin-loader" } },
  ],
  personalities: ["nanobot-session-personality", "nanobot-plugin-personality"],
  entrypoints: {
    cli: "@helix/cli run nanobot",
    sdk: "hooks.services['nanobot.sdk']",
    tui: "hooks.services['nanobot.tui']",
    webUI: "hooks.services['nanobot.web-ui']",
    server: "hooks.services['nanobot.server.factory']",
  },
  conformance: {
    suite: fullProductConformance,
  },
  metadata: {
    upstream: "https://github.com/HKUDS/nanobot",
    upstreamCommit: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    upstreamTag: "v0.2.0",
    package: "nanobot-ai@0.2.0",
    graphLevel: "atom",
  },
})

export const hermesAgentRecipe: LegoRecipe = atomRecipe({
  id: "hermes-agent",
  personality: "hermes-agent",
  atoms: [...commonAtoms, ...personalityAtomBlockIDs("hermes-agent").map((id) => ({ id }))],
  productShells: productShellBlockIDs("hermes-agent").map((id) => ({ id })),
  strategies: [
    { id: "turn.context-builder", config: { variant: "hermes-stable-context-prompt-builder" } },
    { id: "tool.permission", config: { source: "hermes-shell-hooks" } },
  ],
  policies: [
    { id: "shell.execution", config: { envHook: "pre_tool_call", helper: "python-subprocess" } },
    { id: "extension.loading", config: { source: "hermes-plugin-manager" } },
  ],
  personalities: ["hermes-session-personality", "hermes-plugin-personality", "hermes-shell-personality"],
  entrypoints: {
    cli: "@helix/cli run hermes-agent",
    sdk: "hooks.services['hermes.sdk']",
    tui: "hooks.services['hermes.tui']",
    apiServer: "hooks.services['hermes.api-server.factory']",
    acp: "hooks.services['hermes.acp']",
    gateway: "hooks.services['hermes.gateway']",
    dashboard: "hooks.services['hermes.web-dashboard']",
  },
  conformance: {
    suite: fullProductConformance,
  },
  metadata: {
    product: "hermes-agent",
    upstream: "https://github.com/NousResearch/hermes-agent",
    upstreamCommit: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    upstreamTag: "v0.15.1",
    package: "hermes-agent==0.15.1",
    graphLevel: "atom",
  },
})

export const opencodeSessionJsonlRecipe: LegoRecipe = bindRecipePort(
  {
    ...opencodeRecipe,
    id: "opencode.session-jsonl",
    metadata: {
      ...opencodeRecipe.metadata,
      baseRecipe: "opencode.full",
      swap: "session.store=pi.session.store.jsonl-v3",
    },
  },
  "session.store",
  "pi.session.store.jsonl-v3",
)

export const piSessionProjectionRecipe: LegoRecipe = bindRecipePort(
  {
    ...piMonoRecipe,
    id: "pi.session-projection",
    metadata: {
      ...piMonoRecipe.metadata,
      baseRecipe: "pi-mono.full",
      swap: "session.store=opencode.session.store.sqlite-projection",
    },
  },
  "session.store",
  "opencode.session.store.sqlite-projection",
)

export const minimalFilesystemToolsRecipe: LegoRecipe = bindRecipePort(
  {
    ...codingAgentMinimalRecipe,
    id: "minimal.filesystem-tools",
    strategies: (codingAgentMinimalRecipe.strategies ?? []).map((strategy) =>
      strategy.id === "tool.permission" ? { ...strategy, config: { mode: "workspace-scoped" } } : strategy,
    ),
    policies: (codingAgentMinimalRecipe.policies ?? []).map((policy) =>
      policy.id === "shell.execution" ? { ...policy, config: { mode: "enabled" } } : policy,
    ),
    metadata: {
      ...codingAgentMinimalRecipe.metadata,
      swap: "tools=tool-pack.filesystem",
    },
  },
  "tools",
  "tool-pack.filesystem",
)

export const minimalNoShellRecipe: LegoRecipe = bindRecipePort(
  {
    ...codingAgentMinimalRecipe,
    id: "minimal.no-shell",
    metadata: {
      ...codingAgentMinimalRecipe.metadata,
      swap: "tools=tool-pack.echo",
    },
  },
  "tools",
  "tool-pack.echo",
)

export const opencodeEchoToolsRecipe: LegoRecipe = bindRecipePort(
  {
    ...opencodeRecipe,
    id: "opencode.echo-tools",
    strategies: (opencodeRecipe.strategies ?? []).map((strategy) =>
      strategy.id === "tool.permission" ? { ...strategy, config: { mode: "allow-echo-only", source: "opencode-plugin-hooks" } } : strategy,
    ),
    policies: (opencodeRecipe.policies ?? []).map((policy) =>
      policy.id === "shell.execution" ? { ...policy, config: { mode: "disabled", envHook: "shell.env" } } : policy,
    ),
    metadata: {
      ...opencodeRecipe.metadata,
      baseRecipe: "opencode.full",
      swap: "tools=tool-pack.echo",
    },
  },
  "tools",
  "tool-pack.echo",
)

export const piEchoToolsRecipe: LegoRecipe = bindRecipePort(
  {
    ...piMonoRecipe,
    id: "pi.echo-tools",
    strategies: (piMonoRecipe.strategies ?? []).map((strategy) =>
      strategy.id === "tool.permission" ? { ...strategy, config: { mode: "allow-echo-only", source: "pi-extension-events" } } : strategy,
    ),
    policies: (piMonoRecipe.policies ?? []).map((policy) =>
      policy.id === "shell.execution" ? { ...policy, config: { mode: "disabled", envHook: "runtime.events" } } : policy,
    ),
    metadata: {
      ...piMonoRecipe.metadata,
      baseRecipe: "pi-mono.full",
      swap: "tools=tool-pack.echo",
    },
  },
  "tools",
  "tool-pack.echo",
)

export const swapRecipes = {
  "opencode.session-jsonl": opencodeSessionJsonlRecipe,
  "pi.session-projection": piSessionProjectionRecipe,
  "minimal.filesystem-tools": minimalFilesystemToolsRecipe,
  "minimal.no-shell": minimalNoShellRecipe,
  "opencode.echo-tools": opencodeEchoToolsRecipe,
  "pi.echo-tools": piEchoToolsRecipe,
}

export const recipes = {
  "coding-agent.minimal": codingAgentMinimalRecipe,
  opencode: opencodeRecipe,
  "pi-mono": piMonoRecipe,
  "opencode-pi-hybrid": opencodePiHybridRecipe,
  nanobot: nanobotRecipe,
  "hermes-agent": hermesAgentRecipe,
  ...swapRecipes,
}

function opencodePiHybridPortSource(port: string, index: number): OpencodePiHybridSource {
  if (index <= 42) return "opencode"
  if (port === "tools" || port === "tool.definition" || port === "tool.schema-adapter" || port === "tools.schema" || port === "tools.batch-scheduler") {
    return "opencode"
  }
  return "pi-mono"
}

function opencodePiHybridAtoms(): LegoRecipeModuleRef[] {
  const modules = [...commonAtoms]
  for (const { port, source } of opencodePiHybridPortSources) {
    const moduleID = defaultPortBindingModule(port, source)
    if (!opencodePiHybridProductShellIDSet.has(moduleID)) modules.push({ id: moduleID })
  }
  return uniqueModuleRefs(modules)
}

function atomRecipe(
  input: Omit<LegoRecipe, "version" | "modules" | "bindings" | "requiredCapabilities"> & {
    personality: AtomRecipePersonality
    atoms: LegoRecipeModuleRef[]
    productShells: LegoRecipeModuleRef[]
  },
): LegoRecipe {
  const { personality, atoms, productShells, ...recipe } = input
  const ports = recipeBindingPorts(personality)
  const bindings = ports.map((port) => ({
    port,
    module: defaultPortBindingModule(port, personality),
  }))
  return {
    ...recipe,
    version: "0.1.0",
    modules: [],
    atoms: uniqueModuleRefs(atoms),
    productShells: uniqueModuleRefs(productShells),
    bindings,
    requiredCapabilities: ports,
  }
}

function bindRecipePort(recipe: LegoRecipe, port: string, module: string): LegoRecipe {
  const bindings = [...(recipe.bindings ?? []).filter((binding) => binding.port !== port && binding.capability !== port), { port, module }]
  const requiredCapabilities = recipe.requiredCapabilities?.some((capability) => (typeof capability === "string" ? capability : capability.id) === port)
    ? recipe.requiredCapabilities
    : [...(recipe.requiredCapabilities ?? []), port]
  const productShellIDs = new Set((recipe.productShells ?? []).map((shell) => shell.id))
  return {
    ...recipe,
    atoms: productShellIDs.has(module) ? uniqueModuleRefs(recipe.atoms) : uniqueModuleRefs([...(recipe.atoms ?? []), { id: module }]),
    bindings,
    requiredCapabilities,
  }
}

function uniqueModuleRefs(modules: LegoRecipeModuleRef[] | undefined): LegoRecipeModuleRef[] {
  const seen = new Set<string>()
  const output: LegoRecipeModuleRef[] = []
  for (const module of modules ?? []) {
    if (seen.has(module.id)) continue
    seen.add(module.id)
    output.push(module)
  }
  return output
}
