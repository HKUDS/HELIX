import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { sessionTranscriptSchema, type LegoMessage, type LegoModel, type LegoProviderAdapter, type LegoRecipe, type ProviderRequest } from "@helix/contracts"
import { JsonlTreeSessionService, ProjectionSessionService, type ProjectionReplayEvent } from "@helix/lego-session"
import type { TUIEventLoopResult, TUIEventLoopSnapshot, TUIInputEvent } from "@helix/lego-ui"
import { assembleHermesAgentHarness, assembleNanobotHarness, assembleOpenCodeHarness, assemblePiMonoHarness, type AssembledHarness } from "./harness"
import { compileRecipe, diffRecipes, type CompiledRecipe, type RecipeDiff } from "./compiler"
import { hermesAgentRecipe, nanobotRecipe, opencodeRecipe, piMonoRecipe } from "./recipes"
import { runAgentLoopSemanticReplay } from "./agent-loop-semantics"
import { runUpstreamProductWorkflowParity } from "./product-workflow-parity"
import { runUpstreamE2EParity } from "./upstream-e2e-parity"
import { runLiveProviderParity } from "./live-provider-parity"
import { auditSourceBoundaries } from "./boundary-lint"

export interface ReverseAssemblyAuditInput {
  cwd?: string
  inspectBoundaries?: boolean
  runProviderTurns?: boolean
  runSemanticReplay?: boolean
  runUpstreamFixtures?: boolean
  runProductWorkflowParity?: boolean
  runUpstreamE2EParity?: boolean
  runLiveProviderParity?: boolean
}

export interface ReverseAssemblyCheck {
  id: string
  ok: boolean
  message: string
  details?: unknown
}

export interface ReverseAssemblyProductAudit {
  product: AssembledHarness["product"]
  ok: boolean
  recipe: CompiledRecipe
  graph: Array<{ id: string; variant?: string }>
  services: string[]
  checks: ReverseAssemblyCheck[]
}

export interface ReverseAssemblyAuditReport {
  ok: boolean
  products: ReverseAssemblyProductAudit[]
  shared: {
    diff: RecipeDiff
    checks: ReverseAssemblyCheck[]
  }
  issues: ReverseAssemblyCheck[]
}

const EXPECTED_MODULES = {
  opencode: [
    "runtime.assembly-graph.lockfile",
    "session.store.sqlite-projection",
    "hook.bus.source-ordered",
    "provider.stream.openai-compatible",
    "tool.executor.default",
    "turn.tool-executor.common",
    "opencode.plugin.loader",
    "opencode.product-shell.sdk",
    "opencode.product-shell.workspace",
    "opencode.product-shell.control-plane",
    "opencode.product-shell.tui",
    "opencode.product-shell.web",
    "opencode.product-shell.desktop",
    "opencode.product-shell.slack",
    "opencode.product-shell.server",
  ],
  "pi-mono": [
    "runtime.assembly-graph.lockfile",
    "session.store.jsonl-tree",
    "hook.bus.source-ordered",
    "provider.stream.anthropic",
    "tool.executor.default",
    "turn.tool-executor.common",
    "pi.extension.loader",
    "pi.product-shell.package-manager",
    "pi.product-shell.sdk",
    "pi.product-shell.cli",
    "pi.product-shell.tui",
    "pi.product-shell.rpc",
    "pi.product-shell.web-ui",
    "pi.product-shell.server",
    "pi.product-shell.extension-examples",
    "pi.product-shell.browser-smoke",
    "pi.product-shell.release-hardening",
  ],
  nanobot: [
    "runtime.assembly-graph.lockfile",
    "session.store.jsonl-tree",
    "hook.bus.source-ordered",
    "provider.stream.openai-compatible",
    "tool.executor.default",
    "turn.tool-executor.common",
    "nanobot.plugin.loader",
    "nanobot.product-shell.sdk",
    "nanobot.product-shell.cli",
    "nanobot.product-shell.tui",
    "nanobot.product-shell.web-ui",
    "nanobot.product-shell.server",
  ],
  "hermes-agent": [
    "runtime.assembly-graph.lockfile",
    "session.store.jsonl-tree",
    "hook.bus.source-ordered",
    "provider.stream.openai-compatible",
    "tool.executor.default",
    "turn.tool-executor.common",
    "hermes.plugin.loader",
    "hermes.product-shell.sdk",
    "hermes.product-shell.cli",
    "hermes.product-shell.tui",
    "hermes.product-shell.api-server",
    "hermes.product-shell.acp",
    "hermes.product-shell.gateway",
    "hermes.product-shell.web-dashboard",
  ],
} as const

const EXPECTED_SERVICES = {
  opencode: [
    "cwd",
    "session",
    "hooks",
    "config",
    "prompt",
    "ui",
    "opencode.sdk",
    "opencode.workspace",
    "opencode.control-plane",
    "opencode.server.factory",
    "opencode.tui",
    "opencode.web",
    "opencode.desktop",
    "opencode.slack",
  ],
  "pi-mono": [
    "cwd",
    "session",
    "hooks",
    "config",
    "prompt",
    "ui",
    "storageDir",
    "pi.sdk",
    "pi.cli",
    "pi.tui",
    "pi.rpc",
    "pi.web-ui",
    "pi.server.factory",
    "pi.package-manager",
    "pi.extension-examples",
    "pi.browser-smoke",
    "pi.release-hardening",
    "pi.shrinkwrap",
  ],
  nanobot: [
    "cwd",
    "session",
    "hooks",
    "config",
    "prompt",
    "ui",
    "storageDir",
    "nanobot.sdk",
    "nanobot.cli",
    "nanobot.tui",
    "nanobot.web-ui",
    "nanobot.server.factory",
  ],
  "hermes-agent": [
    "cwd",
    "session",
    "hooks",
    "config",
    "prompt",
    "ui",
    "storageDir",
    "hermes.sdk",
    "hermes.cli",
    "hermes.tui",
    "hermes.acp",
    "hermes.gateway",
    "hermes.web-dashboard",
    "hermes.api-server.factory",
    "hermes.server.factory",
  ],
} as const

export async function auditReverseAssembly(input: ReverseAssemblyAuditInput = {}): Promise<ReverseAssemblyAuditReport> {
  const cwd = input.cwd ?? process.cwd()
  const opencode = assembleOpenCodeHarness({ cwd })
  const piMono = assemblePiMonoHarness({ cwd })
  const nanobot = assembleNanobotHarness({ cwd })
  const hermes = assembleHermesAgentHarness({ cwd })
  const products = [
    await auditProduct({
      harness: opencode,
      recipe: opencodeRecipe,
      expectedModules: [...EXPECTED_MODULES.opencode],
      expectedServices: [...EXPECTED_SERVICES.opencode],
      runProviderTurns: input.runProviderTurns ?? true,
    }),
    await auditProduct({
      harness: piMono,
      recipe: piMonoRecipe,
      expectedModules: [...EXPECTED_MODULES["pi-mono"]],
      expectedServices: [...EXPECTED_SERVICES["pi-mono"]],
      runProviderTurns: input.runProviderTurns ?? true,
    }),
    await auditProduct({
      harness: nanobot,
      recipe: nanobotRecipe,
      expectedModules: [...EXPECTED_MODULES.nanobot],
      expectedServices: [...EXPECTED_SERVICES.nanobot],
      runProviderTurns: input.runProviderTurns ?? true,
    }),
    await auditProduct({
      harness: hermes,
      recipe: hermesAgentRecipe,
      expectedModules: [...EXPECTED_MODULES["hermes-agent"]],
      expectedServices: [...EXPECTED_SERVICES["hermes-agent"]],
      runProviderTurns: input.runProviderTurns ?? true,
    }),
  ]
  const sharedChecks: ReverseAssemblyCheck[] = [
    check("recipe-diff", diffRecipes(opencodeRecipe, piMonoRecipe).commonModules.length > 0, "OpenCode and Pi recipes have a computable common/personality diff."),
    check(
      "shared-common-core",
      [
        "runtime.assembly-graph.lockfile",
        "session.reader.service",
        "hook.bus.source-ordered",
        "turn.tool-executor.common",
        "tool.executor.default",
        "provider.stream.openai-compatible",
      ].every((id) => {
        const diff = diffRecipes(opencodeRecipe, piMonoRecipe)
        return [...diff.commonModules, ...diff.variantChanges].some((module) => module.id === id)
      }),
      "Core lego atoms are shared by module id, with product-specific bindings where needed.",
    ),
  ]
  if (input.inspectBoundaries ?? true) {
    const boundary = auditSourceBoundaries({ cwd })
    sharedChecks.push(
      ...boundary.rules.map((rule) =>
        check(`boundary:${rule.id}`, rule.ok, rule.message, rule.issues),
      ),
    )
  }
  if (input.runSemanticReplay ?? true) {
    const semantic = await runAgentLoopSemanticReplay({ cwd })
    sharedChecks.push(
      check("agent-loop-semantic-replay", semantic.ok, "OpenCode and Pi recipes pass product-level agent-loop semantic replay.", {
        products: semantic.products.map((product) => ({
          product: product.product,
          checks: product.checks.length,
          steps: product.result.steps,
          syntheticContinues: product.result.syntheticContinues,
        })),
        issues: semantic.issues,
      }),
    )
  }
  if (input.runUpstreamFixtures ?? true) sharedChecks.push(...(await auditUpstreamFixtureReplay(cwd)))
  if (input.runProductWorkflowParity ?? true) {
    const parity = await runUpstreamProductWorkflowParity({ cwd })
    sharedChecks.push(
      check("upstream-product-workflow-parity", parity.ok, "OpenCode and Pi pass upstream-oriented product workflow parity checks.", {
        products: parity.products.map((product) => ({
          product: product.product,
          checks: product.checks.length,
          issues: product.checks.filter((item) => !item.ok).map((item) => item.id),
        })),
        issues: parity.issues,
      }),
    )
  }
  if (input.runUpstreamE2EParity ?? true) {
    const parity = await runUpstreamE2EParity({ cwd })
    sharedChecks.push(
      check("upstream-e2e-parity", parity.ok, "OpenCode and Pi pass pinned upstream e2e behavior parity checks.", {
        products: parity.products.map((product) => ({
          product: product.product,
          checks: product.checks.length,
          issues: product.checks.filter((item) => !item.ok).map((item) => item.id),
        })),
        issues: parity.issues,
      }),
    )
  }
  if (input.runLiveProviderParity ?? false) {
    const live = await runLiveProviderParity({ cwd, requireCredentials: true })
    sharedChecks.push(
      check("live-provider-parity", live.ok, "OpenCode and Pi pass live external provider parity when credentials are configured.", {
        status: live.status,
        provider: live.provider,
        modelID: live.modelID,
        missing: live.missing,
        products: live.products.map((product) => ({
          product: product.product,
          status: product.status,
          checks: product.checks.length,
          issues: product.checks.filter((item) => !item.ok).map((item) => item.id),
        })),
        issues: live.issues,
      }),
    )
  }

  const issues = [...products.flatMap((product) => product.checks), ...sharedChecks].filter((item) => !item.ok)
  return {
    ok: issues.length === 0,
    products,
    shared: {
      diff: diffRecipes(opencodeRecipe, piMonoRecipe),
      checks: sharedChecks,
    },
    issues,
  }
}

async function auditProduct(input: {
  harness: AssembledHarness
  recipe: LegoRecipe
  expectedModules: string[]
  expectedServices: string[]
  runProviderTurns: boolean
}): Promise<ReverseAssemblyProductAudit> {
  const compiled = compileRecipe(input.recipe)
  const graphIDs = input.harness.graph.map((module) => module.id)
  const serviceIDs = Array.from(input.harness.hooks.services.keys()).sort()
  const checks: ReverseAssemblyCheck[] = [
    check(
      `${input.harness.product}:compiled`,
      compiled.graph.length === input.harness.graph.length,
      `${input.harness.product} recipe compiles to the assembled harness graph length.`,
      { compiled: compiled.graph.length, harness: input.harness.graph.length },
    ),
    check(
      `${input.harness.product}:modules`,
      input.expectedModules.every((id) => graphIDs.includes(id)),
      `${input.harness.product} graph contains all required lego modules.`,
      missing(input.expectedModules, graphIDs),
    ),
    check(
      `${input.harness.product}:services`,
      input.expectedServices.every((id) => serviceIDs.includes(id)),
      `${input.harness.product} harness registers all required runtime services.`,
      missing(input.expectedServices, serviceIDs),
    ),
    check(
      `${input.harness.product}:conformance-suite`,
      ["session", "hooks", "agent-loop", "tools"].every((id) => compiled.conformanceSuite.includes(id)),
      `${input.harness.product} recipe declares the shared conformance suite.`,
      compiled.conformanceSuite,
    ),
  ]

  if (input.runProviderTurns) {
    const provider = createReverseProvider(input.harness.product, `${input.harness.product} assembled`)
    const result = await input.harness.runTurn({
      text: `reverse assembly ${input.harness.product}`,
      provider,
      maxSteps: 4,
      maxRetries: 1,
    })
    checks.push(
      check(
        `${input.harness.product}:provider-turn`,
        result.transcript.map((message) => message.role).join(",") === "user,assistant" &&
          JSON.stringify(result.assistantMessage.parts).includes(input.harness.product),
        `${input.harness.product} recipe can run a provider-backed turn through provider/session wiring.`,
        { sessionID: result.session.id, steps: result.steps },
      ),
    )
  }

  checks.push(...(await auditProductBehavior(input.harness)))

  return {
    product: input.harness.product,
    ok: checks.every((item) => item.ok),
    recipe: compiled,
    graph: input.harness.graph,
    services: serviceIDs,
    checks,
  }
}

async function auditProductBehavior(harness: AssembledHarness): Promise<ReverseAssemblyCheck[]> {
  if (harness.product === "opencode") return auditOpenCodeBehavior(harness)
  if (harness.product === "pi-mono") return auditPiBehavior(harness)
  if (harness.product === "opencode-pi-hybrid") return auditOpenCodePiHybridBehavior(harness)
  if (harness.product === "hermes-agent") return auditHermesBehavior(harness)
  return auditNanobotBehavior(harness)
}

async function auditOpenCodePiHybridBehavior(harness: AssembledHarness): Promise<ReverseAssemblyCheck[]> {
  const serviceIDs = Array.from(harness.hooks.services.keys()).sort()
  return [
    check(
      "opencode-pi-hybrid:runtime",
      serviceIDs.includes("opencode.sdk") &&
        serviceIDs.includes("pi.sdk") &&
        serviceIDs.includes("opencode-pi.hybrid.runtime"),
      "OpenCode/Pi hybrid exposes both product SDK surfaces and the hybrid runtime marker.",
      missing(["opencode.sdk", "pi.sdk", "opencode-pi.hybrid.runtime"], serviceIDs),
    ),
  ]
}

async function auditOpenCodeBehavior(harness: AssembledHarness): Promise<ReverseAssemblyCheck[]> {
  const sdk = harness.hooks.services.get("opencode.sdk") as
    | {
        graph(): Array<{ id: string }>
        listSessions(): Promise<Array<{ id: string }>>
        getSession(id: string): Promise<{ transcript: unknown[] }>
        runTurn(input: { text: string; provider: LegoProviderAdapter }): Promise<{ session: { id: string }; assistantMessage: unknown }>
      }
    | undefined
  const createServer = harness.hooks.services.get("opencode.server.factory") as
    | ((input?: { provider?: LegoProviderAdapter }) => { routes: string[]; close(): Promise<void> })
    | undefined
  const tui = harness.hooks.services.get("opencode.tui") as TUIBehaviorSurface | undefined
  const web = harness.hooks.services.get("opencode.web") as { render(input?: { title?: string }): string } | undefined
  const desktop = harness.hooks.services.get("opencode.desktop") as { manifest(): { appID?: string; protocolHandlers?: string[] } } | undefined
  const slack = harness.hooks.services.get("opencode.slack") as
    | { handleCommand(input: { text: string; userID?: string }): Promise<{ text: string; response_type: string }> }
    | undefined

  const checks: ReverseAssemblyCheck[] = []
  checks.push(
    check(
      "opencode:surface-registrations",
      Boolean(sdk && createServer && tui && web && desktop && slack),
      "OpenCode reverse assembly exposes SDK/server/TUI/Web/Desktop/Slack surfaces.",
      Array.from(harness.hooks.services.keys()).filter((id) => id.startsWith("opencode.")),
    ),
  )
  if (!sdk || !createServer || !tui || !web || !desktop || !slack) return checks

  const provider = createReverseProvider("opencode", "surface ok")
  const result = await sdk.runTurn({ text: "reverse surface behavior", provider })
  const sessions = await sdk.listSessions()
  const session = await sdk.getSession(String(result.session.id))
  const server = createServer({ provider })
  const slackTest = await slack.handleCommand({ text: "test", userID: "U-reverse" })
  const themeSelectorEvent = tui.dispatch({ type: "command", command: "/themes" })
  const themeEvent = tui.dispatch({ type: "select", target: "theme", value: "tokyonight" })
  const modelEvent = tui.dispatch({ type: "select", target: "model", value: "opencode-builtin-codex" })
  const submitEvent = tui.dispatch({ type: "submit", text: "reverse opencode tui" })
  const interactiveSnapshot = tui.interactiveSnapshot()
  checks.push(
    check(
      "opencode:sdk-session-behavior",
      sessions.some((item) => String(item.id) === String(result.session.id)) &&
        session.transcript.length >= 2 &&
        JSON.stringify(result.assistantMessage).includes("surface ok"),
      "OpenCode SDK can run a turn, list the new session, and read its transcript.",
      { sessionID: result.session.id, transcript: session.transcript.length },
    ),
    check(
      "opencode:surface-behavior",
      sdk.graph().some((module) => module.id === "opencode.product-shell.web") &&
        server.routes.includes("GET /v1/web") &&
        server.routes.includes("POST /v1/tui/event") &&
        server.routes.includes("POST /v1/run") &&
        !server.routes.includes("POST /v1/run/fake") &&
        tui.render().includes("OpenCode TUI") &&
        web.render().includes('data-opencode-web="ready"') &&
        desktop.manifest().appID === "dev.opencode.helix" &&
        desktop.manifest().protocolHandlers?.includes("opencode://workspace") === true &&
        slackTest.text === "Bot is working! I can hear you loud and clear.",
      "OpenCode product surfaces render expected SDK/server/TUI/Web/Desktop/Slack behavior.",
      { routes: server.routes, slack: slackTest },
    ),
    check(
      "opencode:tui-event-loop-behavior",
      themeSelectorEvent.handled === true &&
        themeSelectorEvent.snapshot.mode === "theme" &&
        themeEvent.handled === true &&
        themeEvent.snapshot.theme === "tokyonight" &&
        modelEvent.handled === true &&
        modelEvent.snapshot.model === "opencode-builtin-codex" &&
        submitEvent.handled === true &&
        interactiveSnapshot.history.includes("reverse opencode tui"),
      "OpenCode TUI surface exposes a real event loop for theme/model/submit interactions.",
      { themeSelectorEvent, themeEvent, modelEvent, submitEvent },
    ),
  )
  await server.close()
  return checks
}

async function auditPiBehavior(harness: AssembledHarness): Promise<ReverseAssemblyCheck[]> {
  const sdk = harness.hooks.services.get("pi.sdk") as
    | {
        workspace(): { services: string[]; tools: string[] }
        graph(): Array<{ id: string }>
        listSessions(): Promise<Array<{ id: string }>>
        getSession(id: string): Promise<{ transcript: unknown[] }>
        runTurn(input: { text: string; provider: LegoProviderAdapter }): Promise<{ session: { id: string }; assistantMessage: unknown; transcript: unknown[] }>
        packagePlan(input?: { packages?: string[]; extensions?: string[]; cwd?: string }): { packages: unknown[]; extensions: unknown[] }
        releaseSnapshot(): { packageShrinkwrap: unknown }
      }
    | undefined
  const cli = harness.hooks.services.get("pi.cli") as
    | { renderHelp(): string; run(input: { prompt: string; provider: LegoProviderAdapter; json?: boolean }): Promise<string> }
    | undefined
  const tui = harness.hooks.services.get("pi.tui") as TUIBehaviorSurface | undefined
  const rpc = harness.hooks.services.get("pi.rpc") as
    | { methods(): string[]; call(method: string, params?: Record<string, unknown>): Promise<unknown> }
    | undefined
  const webUI = harness.hooks.services.get("pi.web-ui") as { render(input?: { title?: string }): string } | undefined
  const createServer = harness.hooks.services.get("pi.server.factory") as
    | ((input?: { provider?: LegoProviderAdapter }) => { routes: string[]; listen(): Promise<{ url: string }>; close(): Promise<void> })
    | undefined
  const packageManager = harness.hooks.services.get("pi.package-manager") as
    | {
        plan(input?: { packages?: string[]; extensions?: string[]; cwd?: string }): { packages: unknown[]; extensions: unknown[] }
        shrinkwrap(input?: { packages?: string[]; extensions?: string[]; cwd?: string }): { lockfileVersion: number; generatedBy: string }
      }
    | undefined
  const examples = harness.hooks.services.get("pi.extension-examples") as { list(): unknown[]; materialize(input: { outDir: string }): string[] } | undefined
  const browserSmoke = harness.hooks.services.get("pi.browser-smoke") as { render(): string } | undefined
  const release = harness.hooks.services.get("pi.release-hardening") as { verify(): { ok: boolean }; snapshot(): { packageShrinkwrap: unknown } } | undefined

  const checks: ReverseAssemblyCheck[] = [
    check(
      "pi-mono:surface-registrations",
      Boolean(sdk && cli && tui && rpc && webUI && createServer && packageManager && examples && browserSmoke && release),
      "Pi reverse assembly exposes SDK/CLI/TUI/RPC/Web UI/server/package manager/examples/browser-smoke/release surfaces.",
      Array.from(harness.hooks.services.keys()).filter((id) => id.startsWith("pi.")),
    ),
  ]
  if (!sdk || !cli || !tui || !rpc || !webUI || !createServer || !packageManager || !examples || !browserSmoke || !release) return checks

  const cwd = mkdtempSync(join(tmpdir(), "helix-reverse-pi-"))
  try {
    const plan = packageManager.plan({
      cwd,
      packages: ["npm:@reverse/pi-package"],
      extensions: ["./reverse-extension.ts"],
    })
    const examplePaths = examples.materialize({ outDir: cwd })
    const provider = createReverseProvider("pi-mono", "pi surface ok")
    const sdkRun = await sdk.runTurn({ text: "reverse pi sdk", provider })
    const cliOutput = await cli.run({ prompt: "reverse pi cli", provider, json: true })
    const rpcPlan = (await rpc.call("package.plan", { cwd, packages: ["npm:@reverse/rpc-package"] })) as { packages?: unknown[] }
    const workspace = sdk.workspace()
    const invalidThemeEvent = tui.dispatch({ type: "select", target: "theme", value: "dimGray" })
    const validThemeEvent = tui.dispatch({ type: "select", target: "theme", value: "light" })
    const modelEvent = tui.dispatch({ type: "select", target: "model", value: "claude-sonnet-4-5" })
    const submitEvent = tui.dispatch({ type: "submit", text: "reverse pi tui" })
    const interactiveSnapshot = tui.interactiveSnapshot()
    const server = createServer({ provider })
    try {
      const { url } = await server.listen()
      checks.push(
        check(
          "pi-mono:package-behavior",
          plan.packages.length === 1 &&
            plan.extensions.length === 1 &&
            packageManager.shrinkwrap({ cwd, packages: ["npm:@reverse/pi-package"] }).lockfileVersion === 1,
          "Pi package manager plans package/extension inputs and emits deterministic shrinkwrap.",
          plan,
        ),
        check(
          "pi-mono:surface-behavior",
          examples.list().length >= 3 &&
            examplePaths.length >= 3 &&
            browserSmoke.render().includes('data-pi-browser-smoke="ready"') &&
            release.verify().ok &&
            Boolean(release.snapshot().packageShrinkwrap),
          "Pi examples, browser smoke, and release hardening surfaces render expected behavior.",
          { examplePaths },
        ),
        check(
          "pi-mono:sdk-cli-rpc-behavior",
          sdk.graph().some((module) => module.id === "pi.product-shell.web-ui") &&
            (await sdk.listSessions()).some((session) => String(session.id) === String(sdkRun.session.id)) &&
            (await sdk.getSession(String(sdkRun.session.id))).transcript.length >= 2 &&
            sdk.packagePlan({ cwd, packages: ["npm:@reverse/sdk-package"] }).packages.length === 1 &&
            cli.renderHelp().includes("pi run") &&
            cliOutput.includes("pi surface ok") &&
            !rpc.methods().includes("run.fake") &&
            !rpc.methods().includes("run.turn") &&
            Array.isArray(rpcPlan.packages) &&
            rpcPlan.packages.length === 1,
          "Pi SDK and CLI surfaces can run provider-backed turns; RPC exposes package/session operations without fake-run methods.",
          { sessionID: sdkRun.session.id },
        ),
        check(
          "pi-mono:tui-web-ui-behavior",
          workspace.services.includes("pi.web-ui") &&
            workspace.tools.includes("bash") &&
            tui.render().includes("Pi Mono TUI") &&
            webUI.render({ title: "Reverse Pi Web UI" }).includes('data-pi-web-ui="ready"') &&
            Boolean(sdk.releaseSnapshot().packageShrinkwrap),
          "Pi TUI and Web UI surfaces render from the same SDK workspace/release state.",
          { services: workspace.services.filter((service) => service.startsWith("pi.")) },
        ),
        check(
          "pi-mono:tui-event-loop-behavior",
          invalidThemeEvent.handled === false &&
            invalidThemeEvent.error === "Unknown theme: dimGray" &&
            validThemeEvent.handled === true &&
            validThemeEvent.snapshot.theme === "light" &&
            modelEvent.handled === true &&
            modelEvent.snapshot.model === "claude-sonnet-4-5" &&
            submitEvent.handled === true &&
            interactiveSnapshot.history.includes("reverse pi tui"),
          "Pi TUI surface exposes a real event loop and reports invalid upstream theme input without crashing.",
          { invalidThemeEvent, validThemeEvent, modelEvent, submitEvent },
        ),
        check(
          "pi-mono:server-live-transport-behavior",
          server.routes.includes("POST /v1/rpc") &&
            server.routes.includes("POST /v1/tui/event") &&
            server.routes.includes("POST /v1/run") &&
            !server.routes.includes("POST /v1/run/fake") &&
            (await fetchJSON<{ ok?: boolean; product?: string }>(`${url}/health`)).ok === true &&
            (await fetchText(`${url}/v1/tui`)).includes("Pi Mono TUI") &&
            (await fetchText(`${url}/v1/web`)).includes('data-pi-web-ui="ready"') &&
            ((await postJSON<{ session?: { id?: string }; assistantMessage?: unknown }>(`${url}/v1/rpc`, {
              method: "run.turn",
              params: { text: "reverse pi server rpc" },
            })).session?.id?.startsWith("ses_") ??
              false),
          "Pi server exposes live HTTP transport for health, TUI, Web UI, and provider-backed RPC run workflows.",
          { routes: server.routes },
        ),
      )
    } finally {
      await server.close()
    }
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
  return checks
}

async function auditNanobotBehavior(harness: AssembledHarness): Promise<ReverseAssemblyCheck[]> {
  const sdk = harness.hooks.services.get("nanobot.sdk") as
    | {
        workspace(): { services: string[]; tools: string[] }
        graph(): Array<{ id: string }>
        listSessions(): Promise<Array<{ id: string }>>
        getSession(id: string): Promise<{ transcript: unknown[] }>
        runTurn(input: { text: string; provider: LegoProviderAdapter }): Promise<{ session: { id: string }; assistantMessage: unknown; transcript: unknown[] }>
      }
    | undefined
  const cli = harness.hooks.services.get("nanobot.cli") as
    | { renderHelp(): string; run(input: { prompt: string; provider: LegoProviderAdapter; json?: boolean }): Promise<string> }
    | undefined
  const tui = harness.hooks.services.get("nanobot.tui") as TUIBehaviorSurface | undefined
  const webUI = harness.hooks.services.get("nanobot.web-ui") as { render(input?: { title?: string }): string } | undefined
  const createServer = harness.hooks.services.get("nanobot.server.factory") as
    | ((input?: { provider?: LegoProviderAdapter }) => { routes: string[]; listen(): Promise<{ url: string }>; close(): Promise<void> })
    | undefined

  const checks: ReverseAssemblyCheck[] = [
    check(
      "nanobot:surface-registrations",
      Boolean(sdk && cli && tui && webUI && createServer),
      "Nanobot reverse assembly exposes SDK/CLI/TUI/Web UI/server surfaces.",
      Array.from(harness.hooks.services.keys()).filter((id) => id.startsWith("nanobot.")),
    ),
  ]
  if (!sdk || !cli || !tui || !webUI || !createServer) return checks

  const provider = createReverseProvider("nanobot", "nanobot surface ok")
  const sdkRun = await sdk.runTurn({ text: "reverse nanobot sdk", provider })
  const cliOutput = await cli.run({ prompt: "reverse nanobot cli", provider, json: true })
  const workspace = sdk.workspace()
  const themeEvent = tui.dispatch({ type: "select", target: "theme", value: "dark" })
  const modelEvent = tui.dispatch({ type: "select", target: "model", value: "openrouter/auto" })
  const submitEvent = tui.dispatch({ type: "submit", text: "reverse nanobot tui" })
  const interactiveSnapshot = tui.interactiveSnapshot()
  const server = createServer({ provider })
  try {
    const { url } = await server.listen()
    checks.push(
      check(
        "nanobot:sdk-cli-behavior",
        sdk.graph().some((module) => module.id === "nanobot.product-shell.web-ui") &&
          (await sdk.listSessions()).some((session) => String(session.id) === String(sdkRun.session.id)) &&
          (await sdk.getSession(String(sdkRun.session.id))).transcript.length >= 2 &&
          cli.renderHelp().includes("nanobot agent") &&
          cliOutput.includes("nanobot surface ok"),
        "Nanobot SDK and CLI surfaces can run turns and expose session operations.",
        { sessionID: sdkRun.session.id },
      ),
      check(
        "nanobot:tui-web-ui-behavior",
        workspace.services.includes("nanobot.web-ui") &&
          workspace.tools.includes("bash") &&
          tui.render().includes("Nanobot TUI") &&
          webUI.render({ title: "Reverse Nanobot Web UI" }).includes('data-nanobot-web-ui="ready"'),
        "Nanobot TUI and Web UI surfaces render from the same SDK workspace state.",
        { services: workspace.services.filter((service) => service.startsWith("nanobot.")) },
      ),
      check(
        "nanobot:tui-event-loop-behavior",
        themeEvent.handled === true &&
          themeEvent.snapshot.theme === "dark" &&
          modelEvent.handled === true &&
          modelEvent.snapshot.model === "openrouter/auto" &&
          submitEvent.handled === true &&
          interactiveSnapshot.history.includes("reverse nanobot tui"),
        "Nanobot TUI surface exposes the shared event loop for theme/model/submit interactions.",
        { themeEvent, modelEvent, submitEvent },
      ),
      check(
        "nanobot:server-live-transport-behavior",
        server.routes.includes("POST /v1/agent") &&
          (await fetchJSON<{ ok?: boolean; product?: string }>(`${url}/health`)).ok === true &&
          (await fetchText(`${url}/v1/tui`)).includes("Nanobot TUI") &&
          (await fetchText(`${url}/v1/web`)).includes('data-nanobot-web-ui="ready"') &&
          (await postText(`${url}/v1/agent`, { prompt: "reverse nanobot server" })).includes("nanobot surface ok"),
        "Nanobot server exposes live HTTP transport for health, TUI, Web UI, and provider-backed agent workflows.",
        { routes: server.routes },
      ),
    )
  } finally {
    await server.close()
  }
  return checks
}

async function auditHermesBehavior(harness: AssembledHarness): Promise<ReverseAssemblyCheck[]> {
  const sdk = harness.hooks.services.get("hermes.sdk") as
    | {
        workspace(): { services: string[]; tools: string[] }
        graph(): Array<{ id: string }>
        listSessions(): Promise<Array<{ id: string }>>
        getSession(id: string): Promise<{ transcript: unknown[] }>
        runTurn(input: { text: string; provider: LegoProviderAdapter }): Promise<{ session: { id: string }; assistantMessage: unknown; transcript: unknown[] }>
      }
    | undefined
  const cli = harness.hooks.services.get("hermes.cli") as
    | { renderHelp(): string; run(input: { prompt: string; provider: LegoProviderAdapter; json?: boolean }): Promise<string> }
    | undefined
  const tui = harness.hooks.services.get("hermes.tui") as TUIBehaviorSurface | undefined
  const acp = harness.hooks.services.get("hermes.acp") as { methods(): string[]; call(method: string, params?: Record<string, unknown>): Promise<unknown> } | undefined
  const gateway = harness.hooks.services.get("hermes.gateway") as
    | { methods(): string[]; dispatch(event: { platform: string; text: string; provider: LegoProviderAdapter }): Promise<{ text: string; sessionID: string }> }
    | undefined
  const dashboard = harness.hooks.services.get("hermes.web-dashboard") as { render(input?: { title?: string }): string } | undefined
  const createServer = harness.hooks.services.get("hermes.api-server.factory") as
    | ((input?: { provider?: LegoProviderAdapter }) => { routes: string[]; listen(): Promise<{ url: string }>; close(): Promise<void> })
    | undefined

  const checks: ReverseAssemblyCheck[] = [
    check(
      "hermes:surface-registrations",
      Boolean(sdk && cli && tui && acp && gateway && dashboard && createServer),
      "Hermes Agent reverse assembly exposes SDK/CLI/TUI/ACP/gateway/dashboard/API server surfaces.",
      Array.from(harness.hooks.services.keys()).filter((id) => id.startsWith("hermes.")),
    ),
  ]
  if (!sdk || !cli || !tui || !acp || !gateway || !dashboard || !createServer) return checks

  const provider = createReverseProvider("hermes-agent", "hermes surface ok")
  const sdkRun = await sdk.runTurn({ text: "reverse hermes sdk", provider })
  const cliOutput = await cli.run({ prompt: "reverse hermes cli", provider, json: true })
  const workspace = sdk.workspace()
  const themeEvent = tui.dispatch({ type: "select", target: "theme", value: "dark" })
  const modelEvent = tui.dispatch({ type: "select", target: "model", value: "openrouter/auto" })
  const submitEvent = tui.dispatch({ type: "submit", text: "reverse hermes tui" })
  const interactiveSnapshot = tui.interactiveSnapshot()
  const acpInit = (await acp.call("initialize")) as { product?: string; capabilities?: string[] }
  const acpRunBlocked = await acp.call("session/prompt", { text: "reverse hermes acp" }).then(
    () => false,
    () => true,
  )
  const gatewayRun = await gateway.dispatch({ platform: "reverse", text: "reverse hermes gateway", provider })
  const server = createServer({ provider })
  try {
    const { url } = await server.listen()
    checks.push(
      check(
        "hermes:sdk-cli-behavior",
        sdk.graph().some((module) => module.id === "hermes.product-shell.api-server") &&
          (await sdk.listSessions()).some((session) => String(session.id) === String(sdkRun.session.id)) &&
          (await sdk.getSession(String(sdkRun.session.id))).transcript.length >= 2 &&
          cli.renderHelp().includes("hermes chat") &&
          cliOutput.includes("hermes surface ok"),
        "Hermes SDK and CLI surfaces can run turns and expose session operations.",
        { sessionID: sdkRun.session.id },
      ),
      check(
        "hermes:tui-dashboard-behavior",
        workspace.services.includes("hermes.web-dashboard") &&
          workspace.tools.includes("bash") &&
          tui.render().includes("Hermes Agent TUI") &&
          dashboard.render({ title: "Reverse Hermes Dashboard" }).includes('data-hermes-dashboard="ready"'),
        "Hermes TUI and web dashboard surfaces render from the same SDK workspace state.",
        { services: workspace.services.filter((service) => service.startsWith("hermes.")) },
      ),
      check(
        "hermes:tui-event-loop-behavior",
        themeEvent.handled === true &&
          themeEvent.snapshot.theme === "dark" &&
          modelEvent.handled === true &&
          modelEvent.snapshot.model === "openrouter/auto" &&
          submitEvent.handled === true &&
          interactiveSnapshot.history.includes("reverse hermes tui"),
        "Hermes TUI surface exposes the shared event loop for theme/model/submit interactions.",
        { themeEvent, modelEvent, submitEvent },
      ),
      check(
        "hermes:acp-gateway-behavior",
        acp.methods().includes("session/prompt") &&
          acpInit.product === "hermes-agent" &&
          acpRunBlocked &&
          gateway.methods().includes("gateway.message") &&
          gatewayRun.text.includes("hermes surface ok"),
        "Hermes ACP exposes capabilities without a fake run path, and gateway is backed by a live provider turn runner.",
        { acpCapabilities: acpInit.capabilities, gatewaySessionID: gatewayRun.sessionID },
      ),
      check(
        "hermes:api-server-live-transport-behavior",
        server.routes.includes("POST /v1/chat/completions") &&
          (await fetchJSON<{ ok?: boolean; product?: string }>(`${url}/health`)).ok === true &&
          (await fetchText(`${url}/v1/tui`)).includes("Hermes Agent TUI") &&
          (await fetchText(`${url}/v1/dashboard`)).includes('data-hermes-dashboard="ready"') &&
          (await postText(`${url}/v1/runs`, { prompt: "reverse hermes server" })).includes("hermes surface ok") &&
          ((await postJSON<{ text?: string }>(`${url}/v1/gateway`, { platform: "api", text: "reverse hermes gateway server" })).text?.includes("hermes surface ok") ??
            false),
        "Hermes API server exposes health, TUI, dashboard, run, ACP, and gateway transports.",
        { routes: server.routes },
      ),
    )
  } finally {
    await server.close()
  }
  return checks
}

async function auditUpstreamFixtureReplay(cwd: string): Promise<ReverseAssemblyCheck[]> {
  const fixtureDir = join(cwd, "packages", "conformance", "fixtures", "upstream")
  const piPath = join(fixtureDir, "pi-large-session.upstream.jsonl")
  const opencodePath = join(fixtureDir, "opencode-session-timeline.upstream.projection.jsonl")
  const manifestPath = join(fixtureDir, "manifest.json")
  const checks: ReverseAssemblyCheck[] = [
    check(
      "upstream-fixtures:present",
      existsSync(piPath) && existsSync(opencodePath) && existsSync(manifestPath),
      "Pinned upstream-derived fixture exports are present.",
      { piPath, opencodePath, manifestPath },
    ),
  ]
  if (!existsSync(piPath) || !existsSync(opencodePath) || !existsSync(manifestPath)) return checks

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    fixtures?: Array<{ product?: string; sourceCommit?: string; expectedTranscriptMessages?: number }>
  }
  checks.push(
    check(
      "upstream-fixtures:manifest",
      manifest.fixtures?.some(
        (fixture) =>
          fixture.product === "pi-mono" &&
          fixture.sourceCommit === "7c2775f6f67c38ed491a1ff68240ee4f8ba688da" &&
          fixture.expectedTranscriptMessages === 914,
      ) === true &&
        manifest.fixtures?.some(
          (fixture) =>
            fixture.product === "opencode" &&
            fixture.sourceCommit === "1a8fd0e1dca58a473d85500530dd45def3f512ab" &&
            fixture.expectedTranscriptMessages === 168,
        ) === true,
      "Upstream fixture manifest preserves source commits and expected replay sizes.",
      manifest,
    ),
  )

  const pi = new JsonlTreeSessionService({ storageDir: fixtureDir })
  const opencode = new ProjectionSessionService()
  try {
    const piInfo = await pi.open(piPath)
    const piTranscript = await pi.transcript(piInfo.id)
    const opencodeEvents = readJsonl<ProjectionReplayEvent>(opencodePath)
    const opencodeInfos = await opencode.replay(opencodeEvents)
    const transcripts = await Promise.all(opencodeInfos.map((info) => opencode.transcript(info.id)))
    checks.push(
      check(
        "upstream-fixtures:pi-replay",
        sessionTranscriptSchema.validate(piTranscript).ok &&
          piTranscript.messages.length === 914 &&
          piTranscript.messages.some((message) => message.role === "tool"),
        "Real upstream Pi large session replay validates as a common transcript.",
        { sessionID: piInfo.id, messages: piTranscript.messages.length },
      ),
      check(
        "upstream-fixtures:opencode-replay",
        transcripts.every((transcript) => sessionTranscriptSchema.validate(transcript).ok) &&
          transcripts.reduce((count, transcript) => count + transcript.messages.length, 0) === 168 &&
          opencodeEvents.length === 525,
        "Real upstream OpenCode timeline export replays into projection transcripts.",
        {
          sessions: opencodeInfos.map((info) => ({ id: info.id, title: info.title })),
          messages: transcripts.map((transcript) => transcript.messages.length),
          events: opencodeEvents.length,
        },
      ),
    )
  } catch (error) {
    checks.push(
      check("upstream-fixtures:replay-error", false, "Real upstream fixture replay threw during reverse assembly audit.", {
        message: error instanceof Error ? error.message : String(error),
      }),
    )
  }
  return checks
}

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T)
}

function listFiles(root: string): string[] {
  if (!existsSync(root)) return []
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) return listFiles(path)
    return path.endsWith(".ts") ? [path] : []
  })
}

function check(id: string, ok: boolean, message: string, details?: unknown): ReverseAssemblyCheck {
  return {
    id,
    ok,
    message,
    ...(details === undefined ? {} : { details }),
  }
}

function missing(expected: string[], actual: string[]): string[] {
  return expected.filter((id) => !actual.includes(id))
}

interface TUIBehaviorSurface {
  render(input?: { width?: number }): string
  dispatch(event: TUIInputEvent): TUIEventLoopResult
  interactiveSnapshot(): TUIEventLoopSnapshot
}

function createReverseProvider(product: string, text: string): LegoProviderAdapter {
  const model: LegoModel = {
    providerID: `${product}-reverse-provider`,
    modelID: "reverse-provider-model",
    name: "Reverse Assembly Provider",
    contextWindow: 2048,
    maxOutputTokens: 512,
    input: ["text"],
  }
  return {
    id: model.providerID,
    models: () => [model],
    async *stream(_request: ProviderRequest) {
      yield { type: "text", text }
      yield { type: "finish", finish: "stop", usage: { input: 4, output: 2 }, cost: 0 }
    },
  }
}

async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Expected ${url} to return 2xx, got ${response.status}`)
  return (await response.json()) as T
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Expected ${url} to return 2xx, got ${response.status}`)
  return response.text()
}

async function postJSON<T>(url: string, value: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value),
  })
  if (!response.ok) throw new Error(`Expected ${url} to return 2xx, got ${response.status}`)
  return (await response.json()) as T
}

async function postText(url: string, value: unknown): Promise<string> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value),
  })
  if (!response.ok) throw new Error(`Expected ${url} to return 2xx, got ${response.status}`)
  return response.text()
}
