import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { LegoMessage, LegoModel, LegoProviderAdapter, ProviderRequest, SessionID } from "@helix/contracts"
import type { TUIEventLoopResult, TUIEventLoopSnapshot, TUIInputEvent } from "@helix/lego-ui"
import type { ProjectionReplayEvent } from "@helix/lego-session"
import { assembleOpenCodeHarness, assemblePiMonoHarness, type AssembledHarness, type HarnessTurnResult } from "./harness"

export interface ProductWorkflowParityInput {
  cwd?: string
}

export interface ProductWorkflowParityCheck {
  id: string
  ok: boolean
  message: string
  details?: unknown
}

export interface ProductWorkflowParityProductReport {
  product: "opencode" | "pi-mono"
  ok: boolean
  checks: ProductWorkflowParityCheck[]
}

export interface ProductWorkflowParityReport {
  ok: boolean
  products: ProductWorkflowParityProductReport[]
  issues: ProductWorkflowParityCheck[]
}

interface WorkflowProviderCapture {
  requests: WorkflowProviderRequestSnapshot[]
}

interface WorkflowProviderRequestSnapshot {
  call: number
  model: { providerID: string; modelID: string }
  systemText: string
  roles: string[]
  messageText: string
  tools: string[]
}

export async function runUpstreamProductWorkflowParity(input: ProductWorkflowParityInput = {}): Promise<ProductWorkflowParityReport> {
  const cwd = input.cwd ?? process.cwd()
  const root = mkdtempSync(join(tmpdir(), "helix-product-parity-"))
  try {
    const products = [await auditOpenCodeWorkflow(cwd, root), await auditPiWorkflow(cwd, root)]
    const issues = products.flatMap((product) => product.checks).filter((item) => !item.ok)
    return {
      ok: issues.length === 0,
      products,
      issues,
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

async function auditOpenCodeWorkflow(cwd: string, root: string): Promise<ProductWorkflowParityProductReport> {
  const productCwd = join(root, "opencode-workspace")
  mkdirSync(productCwd, { recursive: true })
  const harness = assembleOpenCodeHarness({ cwd: productCwd })
  const checks: ProductWorkflowParityCheck[] = []
  const providerWorkflow = await runProviderWorkflow(harness, "opencode")
  checks.push(providerWorkflow.check)

  const sdk = harness.hooks.services.get("opencode.sdk") as
    | {
        getSession(sessionID: SessionID): Promise<{ transcript: LegoMessage[] }>
        listSessions(): Promise<Array<{ id: string }>>
      }
    | undefined
  const createServer = harness.hooks.services.get("opencode.server.factory") as ((input?: { provider?: LegoProviderAdapter }) => OpenCodeServerLike) | undefined
  const tui = harness.hooks.services.get("opencode.tui") as TUIWorkflowSurface | undefined
  const web = harness.hooks.services.get("opencode.web") as { render(input?: { title?: string }): string } | undefined
  const desktop = harness.hooks.services.get("opencode.desktop") as { manifest(): { services?: string[]; protocolHandlers?: string[] } } | undefined
  const slack = harness.hooks.services.get("opencode.slack") as
    | { handleCommand(input: { text: string; userID?: string; channelID?: string }): Promise<{ text: string; response_type: string }> }
    | undefined

  checks.push(
    check(
      "opencode:workflow-surfaces-present",
      Boolean(sdk && createServer && tui && web && desktop && slack),
      "OpenCode product workflow has SDK/server/TUI/Web/Desktop/Slack surfaces available.",
      Array.from(harness.hooks.services.keys()).filter((service) => service.startsWith("opencode.")),
    ),
  )

  if (sdk && createServer && tui && web && desktop && slack) {
    const surfaceProvider = createWorkflowProvider("opencode", { requests: [] })
    const server = createServer({ provider: surfaceProvider })
    try {
      const { url } = await server.listen()
      const health = await fetchJSON<{ ok?: boolean; product?: string }>(`${url}/health`)
      const control = await fetchJSON<{ routes?: string[]; recipe?: { modules?: Array<{ id: string }> } }>(`${url}/v1/control-plane`)
      const sessions = await fetchJSON<{ sessions?: Array<{ id: string }> }>(`${url}/v1/sessions`)
      const webHTML = await fetchText(`${url}/v1/web`)
      const tuiText = await fetchText(`${url}/v1/tui`)
      const desktopManifest = desktop.manifest()
      const slackRun = await slack.handleCommand({ text: "test", userID: "U-parity" })
      const serverRun = await postJSON<{ assistantMessage?: unknown }>(`${url}/v1/run`, { text: "opencode server provider workflow" })
      const themeSelectorEvent = await postTUIEvent(`${url}/v1/tui/event`, { type: "command", command: "/themes" })
      const themeEvent = await postTUIEvent(`${url}/v1/tui/event`, { type: "select", target: "theme", value: "tokyonight" })
      const modelSelectorEvent = await postTUIEvent(`${url}/v1/tui/event`, { type: "command", command: "/models" })
      const modelEvent = await postTUIEvent(`${url}/v1/tui/event`, {
        type: "select",
        target: "model",
        value: "opencode-builtin-codex",
      })
      const submitEvent = await postTUIEvent(`${url}/v1/tui/event`, { type: "submit", text: "opencode interactive prompt" })
      const localHelpEvent = tui.dispatch({ type: "command", command: "/help" })
      const interactiveSnapshot = tui.interactiveSnapshot()
      checks.push(
        check(
          "opencode:interactive-surface-workflow",
          health.ok === true &&
            health.product === "opencode" &&
            control.routes?.includes("POST /v1/run") === true &&
            control.routes?.includes("POST /v1/run/fake") !== true &&
            control.routes?.includes("POST /v1/tui/event") === true &&
            control.routes?.includes("GET /v1/web") === true &&
            control.recipe?.modules?.some((module) => module.id === "opencode.product-shell.control-plane") === true &&
            sessions.sessions?.some((session) => session.id === providerWorkflow.result.session.id) === true &&
            JSON.stringify(serverRun.assistantMessage).includes("opencode:provider-final") &&
            webHTML.includes('data-opencode-web="ready"') &&
            tuiText.includes("OpenCode TUI") &&
            tui.render().includes("OpenCode TUI") &&
            web.render().includes('data-opencode-web="ready"') &&
            desktopManifest.services?.includes("opencode.web") === true &&
            desktopManifest.protocolHandlers?.includes("opencode://workspace") === true &&
            slackRun.response_type === "ephemeral" &&
            slackRun.text === "Bot is working! I can hear you loud and clear.",
          "OpenCode server/TUI/Web/Desktop/Slack surfaces perform an e2e workflow without exposing fake Slack runs.",
          { routes: control.routes, slack: slackRun.text },
        ),
        check(
          "opencode:interactive-tui-event-loop-workflow",
          themeSelectorEvent.handled === true &&
            themeSelectorEvent.snapshot.mode === "theme" &&
            themeEvent.handled === true &&
            themeEvent.snapshot.theme === "tokyonight" &&
            modelSelectorEvent.handled === true &&
            modelSelectorEvent.snapshot.mode === "model" &&
            modelEvent.handled === true &&
            modelEvent.snapshot.model === "opencode-builtin-codex" &&
            submitEvent.handled === true &&
            submitEvent.submittedText === "opencode interactive prompt" &&
            localHelpEvent.handled === true &&
            interactiveSnapshot.history.includes("opencode interactive prompt"),
          "OpenCode live TUI event loop accepts theme/model/submit/help interactions over HTTP and local dispatch.",
          { themeSelectorEvent, themeEvent, modelSelectorEvent, modelEvent, submitEvent, localHelpEvent },
        ),
      )
    } finally {
      await server.close()
    }

    const upstream = await replayOpenCodeUpstreamFixtureThroughSDK(cwd, harness, sdk)
    checks.push(upstream)
  }

  return { product: "opencode", ok: checks.every((item) => item.ok), checks }
}

async function auditPiWorkflow(cwd: string, root: string): Promise<ProductWorkflowParityProductReport> {
  const productCwd = join(root, "pi-workspace")
  mkdirSync(productCwd, { recursive: true })
  const harness = assemblePiMonoHarness({
    cwd: productCwd,
    projectConfig: {
      packages: ["npm:@upstream/pi-package"],
      extensions: ["npm:@upstream/pi-extension", "./local-upstream-extension.ts"],
    },
  })
  const checks: ProductWorkflowParityCheck[] = []
  const providerWorkflow = await runProviderWorkflow(harness, "pi-mono")
  checks.push(providerWorkflow.check)

  const sdk = harness.hooks.services.get("pi.sdk") as
    | {
        getSession(sessionID: SessionID): Promise<{ transcript: LegoMessage[] }>
        packagePlan(input?: { cwd?: string; packages?: string[]; extensions?: string[] }): { packages: unknown[]; extensions: unknown[] }
        workspace(): { product: "pi-mono"; services: string[]; storageKind: string }
      }
    | undefined
  const cli = harness.hooks.services.get("pi.cli") as
    | { renderHelp(): string; run(input: { prompt: string; provider: LegoProviderAdapter; json?: boolean }): Promise<string> }
    | undefined
  const tui = harness.hooks.services.get("pi.tui") as TUIWorkflowSurface | undefined
  const rpc = harness.hooks.services.get("pi.rpc") as
    | { methods(): string[]; call(method: string, params?: Record<string, unknown>): Promise<unknown> }
    | undefined
  const webUI = harness.hooks.services.get("pi.web-ui") as { render(input?: { title?: string }): string } | undefined
  const createServer = harness.hooks.services.get("pi.server.factory") as ((input?: { provider?: LegoProviderAdapter }) => OpenCodeServerLike) | undefined
  const release = harness.hooks.services.get("pi.release-hardening") as { verify(): { ok: boolean } } | undefined

  checks.push(
    check(
      "pi-mono:workflow-surfaces-present",
      Boolean(sdk && cli && tui && rpc && webUI && createServer && release),
      "Pi product workflow has SDK/CLI/TUI/RPC/Web UI/server/release surfaces available.",
      Array.from(harness.hooks.services.keys()).filter((service) => service.startsWith("pi.")),
    ),
  )

  if (sdk && cli && tui && rpc && webUI && createServer && release) {
    const rpcPlan = (await rpc.call("package.plan", {
      cwd: productCwd,
      packages: ["npm:@upstream/rpc-package"],
      extensions: ["./rpc-extension.ts"],
    })) as { packages?: unknown[]; extensions?: unknown[] }
    const releaseVerify = (await rpc.call("release.verify")) as { ok?: boolean }
    const workspace = sdk.workspace()
    const cliOutput = await cli.run({ prompt: "upstream cli workflow", provider: createWorkflowProvider("pi-mono", { requests: [] }), json: true })
    const server = createServer({ provider: createWorkflowProvider("pi-mono", { requests: [] }) })
    try {
      const { url } = await server.listen()
      const themeSelectorEvent = await postTUIEvent(`${url}/v1/tui/event`, { type: "command", command: "/theme" })
      const invalidThemeEvent = await postTUIEvent(`${url}/v1/tui/event`, { type: "select", target: "theme", value: "dimGray" })
      const validThemeEvent = await postTUIEvent(`${url}/v1/tui/event`, { type: "select", target: "theme", value: "light" })
      const modelSelectorEvent = await postTUIEvent(`${url}/v1/tui/event`, { type: "key", key: "ctrl-p" })
      const modelEvent = await postTUIEvent(`${url}/v1/tui/event`, { type: "select", target: "model", value: "claude-sonnet-4-5" })
      const submitEvent = await postTUIEvent(`${url}/v1/tui/event`, { type: "submit", text: "pi interactive prompt" })
      const interactiveSnapshot = tui.interactiveSnapshot()
      checks.push(
        check(
          "pi-mono:interactive-rpc-tui-workflow",
          workspace.product === "pi-mono" &&
            workspace.storageKind === "jsonl-tree" &&
            workspace.services.includes("pi.rpc") &&
            rpc.methods().includes("session.get") &&
            !rpc.methods().includes("run.fake") &&
            !rpc.methods().includes("run.turn") &&
            (rpcPlan.packages?.length ?? 0) >= 1 &&
            (rpcPlan.extensions?.length ?? 0) >= 1 &&
            releaseVerify.ok === true &&
            release.verify().ok === true &&
            cli.renderHelp().includes("--provider") &&
            cliOutput.includes("pi-mono:provider-final") &&
            tui.render().includes("Pi Mono TUI") &&
            webUI.render({ title: "Pi Upstream Workflow" }).includes('data-pi-web-ui="ready"'),
          "Pi CLI/RPC/TUI/Web UI surfaces perform an e2e workflow without exposing fake RPC runs.",
          { methods: rpc.methods(), services: workspace.services.filter((service) => service.startsWith("pi.")) },
        ),
        check(
          "pi-mono:live-rpc-web-transport-workflow",
          server.routes.includes("POST /v1/rpc") &&
            server.routes.includes("POST /v1/tui/event") &&
            server.routes.includes("POST /v1/run") &&
            !server.routes.includes("POST /v1/run/fake") &&
            (await fetchJSON<{ ok?: boolean; product?: string }>(`${url}/health`)).product === "pi-mono" &&
            (await fetchJSON<{ product?: string; services?: string[] }>(`${url}/v1/workspace`)).services?.includes("pi.server.factory") === true &&
            (await fetchText(`${url}/v1/tui`)).includes("Pi Mono TUI") &&
            (await fetchText(`${url}/v1/web`)).includes('data-pi-web-ui="ready"') &&
            ((await postJSON<{ session?: { id?: string }; assistantMessage?: unknown }>(`${url}/v1/rpc`, {
              method: "run.turn",
              params: { text: "upstream live rpc" },
            })).session?.id?.startsWith("ses_") ??
              false) &&
            JSON.stringify(
              await postJSON<{ assistantMessage?: unknown }>(`${url}/v1/run`, {
                text: "upstream live web transport",
              }),
            ).includes("pi-mono:provider-final"),
          "Pi live server exposes HTTP RPC/Web/TUI transport over the assembled SDK state.",
          { routes: server.routes },
        ),
        check(
          "pi-mono:interactive-tui-event-loop-workflow",
          themeSelectorEvent.handled === true &&
            themeSelectorEvent.snapshot.mode === "theme" &&
            invalidThemeEvent.handled === false &&
            invalidThemeEvent.error === "Unknown theme: dimGray" &&
            validThemeEvent.handled === true &&
            validThemeEvent.snapshot.theme === "light" &&
            modelSelectorEvent.handled === true &&
            modelSelectorEvent.snapshot.mode === "model" &&
            modelEvent.handled === true &&
            modelEvent.snapshot.model === "claude-sonnet-4-5" &&
            submitEvent.handled === true &&
            submitEvent.submittedText === "pi interactive prompt" &&
            interactiveSnapshot.history.includes("pi interactive prompt"),
          "Pi live TUI event loop handles theme/model/submit interactions and reports invalid upstream theme input without crashing.",
          { invalidThemeEvent, validThemeEvent, modelEvent, submitEvent },
        ),
      )
    } finally {
      await server.close()
    }

    const upstream = await replayPiUpstreamFixtureThroughSDK(cwd, root, harness, sdk)
    checks.push(upstream)
  }

  return { product: "pi-mono", ok: checks.every((item) => item.ok), checks }
}

async function runProviderWorkflow(
  harness: AssembledHarness,
  product: "opencode" | "pi-mono",
): Promise<{ result: HarnessTurnResult; capture: WorkflowProviderCapture; check: ProductWorkflowParityCheck }> {
  const capture: WorkflowProviderCapture = { requests: [] }
  const provider = createWorkflowProvider(product, capture)
  const model = firstModel(provider)
  const result = await harness.runTurn({
    text: `${product} upstream provider workflow`,
    provider,
    model,
    maxSteps: 4,
    maxRetries: 0,
  })
  return {
    result,
    capture,
    check: check(
      `${product}:provider-stream-workflow`,
      result.steps === 2 &&
        result.finish === "stop" &&
        result.transcript.map((message) => message.role).join(",") === "user,assistant" &&
        JSON.stringify(result.assistantMessage.parts).includes(`${product}:provider-final`) &&
        capture.requests.length === 2 &&
        capture.requests[0]?.tools.includes("bash") === true &&
        capture.requests[0]?.model.modelID === "upstream-e2e-model" &&
        capture.requests[1]?.messageText.includes(`${product}:tool-input`) === true,
      `${product} runs a provider-stream workflow with tool use through the assembled harness.`,
      {
        sessionID: result.session.id,
        steps: result.steps,
        requests: capture.requests,
      },
    ),
  }
}

function createWorkflowProvider(product: "opencode" | "pi-mono", capture: WorkflowProviderCapture): LegoProviderAdapter {
  let calls = 0
  const model: LegoModel = {
    providerID: `${product}-upstream-provider`,
    modelID: "upstream-e2e-model",
    name: "Upstream E2E Model",
    contextWindow: 2048,
    maxOutputTokens: 512,
    input: ["text"],
  }
  return {
    id: model.providerID,
    models: () => [model],
    async *stream(request: ProviderRequest) {
      calls++
      capture.requests.push(snapshotProviderRequest(request, calls))
      if (calls === 1) {
        yield { type: "text", text: `${product}:provider-start` }
        yield { type: "tool_call", id: `${product}-e2e-bash`, toolName: "bash", input: { command: `printf ${JSON.stringify(`${product}:tool-input`)}` } }
        yield { type: "finish", finish: "tool_calls", usage: { input: 10, output: 4 }, cost: 0.001 }
        return
      }
      yield { type: "reasoning", text: `${product}:checked-tool-result` }
      yield { type: "text", text: `${product}:provider-final` }
      yield { type: "finish", finish: "stop", usage: { input: 12, output: 3 }, cost: 0.001 }
    },
  }
}

async function replayOpenCodeUpstreamFixtureThroughSDK(
  cwd: string,
  harness: AssembledHarness,
  sdk: { getSession(sessionID: SessionID): Promise<{ transcript: LegoMessage[] }> },
): Promise<ProductWorkflowParityCheck> {
  const path = join(cwd, "packages", "conformance", "fixtures", "upstream", "opencode-session-timeline.upstream.projection.jsonl")
  const replay = harness.session as unknown as { replay?(events: ProjectionReplayEvent[]): Promise<Array<{ id: SessionID }>> }
  if (!existsSync(path) || !replay.replay) {
    return check("opencode:upstream-fixture-product-sdk", false, "OpenCode upstream fixture or projection replay surface is missing.", { path })
  }
  const infos = await replay.replay(readJsonl<ProjectionReplayEvent>(path))
  const fixtureInfos = infos.filter((info) => String(info.id).startsWith("ses_smoke_"))
  const transcripts = await Promise.all(fixtureInfos.map((info) => sdk.getSession(info.id).then((session) => session.transcript)))
  const messages = transcripts.reduce((total, transcript) => total + transcript.length, 0)
  return check(
    "opencode:upstream-fixture-product-sdk",
    fixtureInfos.length === 2 && messages === 168 && transcripts.every((transcript) => transcript.some((message) => message.role === "assistant")),
    "OpenCode product SDK can read sessions replayed from the pinned upstream timeline fixture.",
    { sessions: fixtureInfos.map((info) => info.id), messages },
  )
}

async function replayPiUpstreamFixtureThroughSDK(
  cwd: string,
  root: string,
  harness: AssembledHarness,
  sdk: { getSession(sessionID: SessionID): Promise<{ transcript: LegoMessage[] }> },
): Promise<ProductWorkflowParityCheck> {
  const sourcePath = join(cwd, "packages", "conformance", "fixtures", "upstream", "pi-large-session.upstream.jsonl")
  const fixturePath = join(root, "pi-large-session.product-parity.jsonl")
  if (!existsSync(sourcePath)) {
    return check("pi-mono:upstream-fixture-product-sdk", false, "Pi upstream large-session fixture is missing.", { sourcePath })
  }
  copyFileSync(sourcePath, fixturePath)
  const info = await harness.session.open(fixturePath)
  const transcript = await sdk.getSession(info.id).then((session) => session.transcript)
  return check(
    "pi-mono:upstream-fixture-product-sdk",
    transcript.length === 914 && transcript.some((message) => message.role === "tool") && transcript.some((message) => message.role === "assistant"),
    "Pi product SDK can open and read the pinned upstream JSONL tree fixture.",
    { sessionID: info.id, messages: transcript.length },
  )
}

function firstModel(provider: LegoProviderAdapter): LegoModel {
  const models = provider.models()
  if (models instanceof Promise) throw new Error("Workflow parity providers must expose models synchronously.")
  const model = models[0]
  if (!model) throw new Error("Workflow parity provider exposed no models.")
  return model
}

function snapshotProviderRequest(request: ProviderRequest, call: number): WorkflowProviderRequestSnapshot {
  return {
    call,
    model: {
      providerID: String(request.model.providerID),
      modelID: String(request.model.modelID),
    },
    systemText: request.system.join("\n"),
    roles: request.messages.map((message) => message.role),
    messageText: request.messages.map(messageText).join("\n"),
    tools: request.tools.map((tool) => tool.name),
  }
}

function messageText(message: LegoMessage): string {
  return message.parts
    .map((part) => {
      if (part.type === "text" || part.type === "reasoning") return part.text
      if (part.type === "tool_call") return `[tool:${part.toolName}] ${JSON.stringify(part.input)}`
      if (part.type === "tool_result") return part.content.map((content) => (content.type === "text" ? content.text : JSON.stringify(content))).join("\n")
      if (part.type === "compaction") return part.summary
      return JSON.stringify(part.data)
    })
    .join("\n")
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

function postTUIEvent(url: string, event: TUIInputEvent): Promise<TUIEventLoopResult> {
  return postJSON<TUIEventLoopResult>(url, event)
}

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T)
}

function check(id: string, ok: boolean, message: string, details?: unknown): ProductWorkflowParityCheck {
  return {
    id,
    ok,
    message,
    ...(details === undefined ? {} : { details }),
  }
}

interface OpenCodeServerLike {
  readonly routes: string[]
  listen(input?: { port?: number; host?: string }): Promise<{ url: string; port: number; host: string }>
  close(): Promise<void>
}

interface TUIWorkflowSurface {
  render(input?: { width?: number }): string
  dispatch(event: TUIInputEvent): TUIEventLoopResult
  interactiveSnapshot(): TUIEventLoopSnapshot
}
