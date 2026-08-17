import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { loadPiExtension } from "@helix/adapters-pi"
import {
  asMessageID,
  createID,
  sessionTranscriptSchema,
  type LegoMessage,
  type SessionID,
} from "@helix/contracts"
import {
  createAssistantMessage,
  createUserMessage,
  type BranchWithSummaryInput,
  type CreateBranchedSessionInput,
  type ProjectionReplayEvent,
  type SessionInfo,
  type SessionService,
} from "@helix/lego-session"
import { assembleOpenCodeHarness, assemblePiMonoHarness, type AssembledHarness } from "./harness"

export interface UpstreamE2EParityInput {
  cwd?: string
}

export interface UpstreamE2EParityCheck {
  id: string
  ok: boolean
  message: string
  details?: unknown
}

export interface UpstreamE2EParityProductReport {
  product: "opencode" | "pi-mono"
  ok: boolean
  checks: UpstreamE2EParityCheck[]
}

export interface UpstreamE2EParityReport {
  ok: boolean
  products: UpstreamE2EParityProductReport[]
  issues: UpstreamE2EParityCheck[]
}

interface UpstreamE2EManifest {
  references?: UpstreamE2EReference[]
}

interface UpstreamE2EReference {
  product?: "opencode" | "pi-mono" | string
  sourceRepository?: string
  sourceCommit?: string
  sourcePath?: string
  sourceSha?: string
  workflow?: string
  behaviors?: string[]
}

interface OpenCodeSDKLike {
  getSession(sessionID: SessionID): Promise<{ transcript: LegoMessage[] }>
  listSessions(input?: { cwd?: string }): Promise<Array<{ id: string }>>
}

interface SurfaceServerLike {
  routes: string[]
  listen(): Promise<{ url: string }>
  close(): Promise<void>
}

interface TUISurfaceLike {
  render(input?: { width?: number }): string
}

interface WebSurfaceLike {
  render(input?: { title?: string }): string
}

interface PiBranchingSessionService extends SessionService {
  branchWithSummary(input: BranchWithSummaryInput): string
  createBranchedSession(input: CreateBranchedSessionInput): SessionInfo
  buildContext(input: { sessionID: SessionID; leafID?: string }): { messages: LegoMessage[] }
  getEntries(sessionID: SessionID): Array<{ id: string; type: string; summary?: string }>
}

const OPENCODE_COMMIT = "1a8fd0e1dca58a473d85500530dd45def3f512ab"
const PI_COMMIT = "7c2775f6f67c38ed491a1ff68240ee4f8ba688da"

export async function runUpstreamE2EParity(input: UpstreamE2EParityInput = {}): Promise<UpstreamE2EParityReport> {
  const cwd = input.cwd ?? process.cwd()
  const root = mkdtempSync(join(tmpdir(), "helix-upstream-e2e-"))
  try {
    const products = [
      await safeProduct("opencode", () => auditOpenCodeUpstreamE2E(cwd, root)),
      await safeProduct("pi-mono", () => auditPiUpstreamE2E(cwd, root)),
    ]
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

async function safeProduct(
  product: "opencode" | "pi-mono",
  fn: () => Promise<UpstreamE2EParityProductReport>,
): Promise<UpstreamE2EParityProductReport> {
  try {
    return await fn()
  } catch (error) {
    return {
      product,
      ok: false,
      checks: [
        check(`${product}:upstream-e2e-error`, false, `${product} upstream e2e parity threw during audit.`, {
          message: error instanceof Error ? error.message : String(error),
        }),
      ],
    }
  }
}

async function auditOpenCodeUpstreamE2E(cwd: string, root: string): Promise<UpstreamE2EParityProductReport> {
  const productCwd = join(root, "opencode-workspace")
  const harness = assembleOpenCodeHarness({ cwd: productCwd })
  const manifest = readE2EManifest(cwd)
  const checks: UpstreamE2EParityCheck[] = [
    check(
      "opencode:upstream-e2e-source-reference",
      hasReference(manifest, {
        product: "opencode",
        sourceCommit: OPENCODE_COMMIT,
        sourcePath: "packages/app/e2e/smoke/session-timeline.spec.ts",
        sourceSha: "af413ffffbba09702cdae00fd86b14bc4d210a36",
      }),
      "Pinned OpenCode session timeline smoke spec reference is recorded for offline e2e parity.",
      referenceDetails(manifest, "opencode"),
    ),
  ]

  const sdk = harness.hooks.services.get("opencode.sdk") as OpenCodeSDKLike | undefined
  const createServer = harness.hooks.services.get("opencode.server.factory") as (() => SurfaceServerLike) | undefined
  const tui = harness.hooks.services.get("opencode.tui") as TUISurfaceLike | undefined
  const web = harness.hooks.services.get("opencode.web") as WebSurfaceLike | undefined
  const replay = harness.session as unknown as { replay?(events: ProjectionReplayEvent[]): Promise<Array<{ id: SessionID; title?: string; cwd: string }>> }
  const fixturePath = join(cwd, "packages", "conformance", "fixtures", "upstream", "opencode-session-timeline.upstream.projection.jsonl")

  if (!sdk || !createServer || !tui || !web || !replay.replay || !existsSync(fixturePath)) {
    checks.push(
      check(
        "opencode:upstream-e2e-surfaces-present",
        false,
        "OpenCode upstream e2e parity requires SDK/server/TUI/Web surfaces and the pinned timeline projection fixture.",
        {
          services: Array.from(harness.hooks.services.keys()).filter((service) => service.startsWith("opencode.")),
          fixturePath,
        },
      ),
    )
    return { product: "opencode", ok: false, checks }
  }

  const events = readJsonl<ProjectionReplayEvent>(fixturePath)
  const infos = await replay.replay(events)
  const source = infos.find((info) => info.id === "ses_smoke_source")
  const target = infos.find((info) => info.id === "ses_smoke_target")
  if (!source || !target) {
    checks.push(
      check("opencode:upstream-e2e-fixture-replay", false, "OpenCode pinned timeline fixture did not replay source and target smoke sessions.", {
        sessions: infos.map((info) => ({ id: info.id, title: info.title })),
      }),
    )
    return { product: "opencode", ok: false, checks }
  }

  const sourceSession = await sdk.getSession(source.id)
  const targetSession = await sdk.getSession(target.id)
  const listedSessions = await sdk.listSessions({ cwd: source.cwd })
  const sourceTranscript = sourceSession.transcript
  const targetTranscript = targetSession.transcript
  const targetText = JSON.stringify(targetTranscript)
  const server = createServer()
  let serverReadback = false
  try {
    const { url } = await server.listen()
    const session = await fetchJSON<{ transcript?: unknown[] }>(`${url}/v1/sessions/${target.id}`)
    serverReadback = session.transcript?.length === targetTranscript.length
  } finally {
    await server.close()
  }
  const webHTML = web.render({ title: "OpenCode upstream e2e parity" })
  const tuiText = tui.render({ width: 96 })
  checks.push(
    check(
      "opencode:upstream-e2e-product-surface-readback",
      source.title === "Uncommitted changes inquiry" &&
        target.title === "Example Game: sample jump movement & sample physics analysis" &&
        sourceTranscript.length === 24 &&
        targetTranscript.length === 144 &&
        sessionTranscriptSchema.validate({ sessionID: source.id, messages: sourceTranscript }).ok &&
        sessionTranscriptSchema.validate({ sessionID: target.id, messages: targetTranscript }).ok &&
        targetText.includes("claude-opus-4-6") &&
        targetText.includes("apply_patch") &&
        targetText.includes("websearch") &&
        listedSessions.some((session) => session.id === source.id) &&
        listedSessions.some((session) => session.id === target.id) &&
        serverReadback &&
        !hasForbiddenTimelineFallback(webHTML) &&
        !hasForbiddenTimelineFallback(tuiText),
      "OpenCode assembled product surfaces read the pinned timeline smoke source/target sessions without fallback placeholders.",
      {
        source: { id: source.id, title: source.title, messages: sourceTranscript.length },
        target: { id: target.id, title: target.title, messages: targetTranscript.length },
        serverReadback,
      },
    ),
  )

  const pageChunks: string[][] = []
  let cursor: string | undefined
  for (let i = 0; i < 20; i++) {
    const page = await harness.session.pageMessages({ sessionID: target.id, limit: 17, ...(cursor ? { before: cursor } : {}) })
    pageChunks.push(page.messages.map((message) => String(message.id)))
    cursor = page.cursor
    if (!page.more) break
    if (!cursor) break
  }
  const expectedIDs = targetTranscript.map((message) => String(message.id))
  const reconstructed = [...pageChunks].reverse().flat()
  checks.push(
    check(
      "opencode:upstream-e2e-session-timeline-paging",
      reconstructed.length === expectedIDs.length &&
        reconstructed.every((id, index) => id === expectedIDs[index]) &&
        new Set(reconstructed).size === reconstructed.length &&
        pageChunks.length >= 8,
      "OpenCode session timeline paging preserves upstream smoke order while scrolling through older pages.",
      { pages: pageChunks.map((page) => page.length), messages: reconstructed.length },
    ),
  )

  const fork = await harness.session.fork({
    sessionID: target.id,
    messageID: asMessageID("msg_user_smoke_0036"),
    title: "upstream e2e fork",
  })
  const forkMessages = await harness.session.messages({ sessionID: fork.id })
  const targetEventCount = events.filter((event) => event.sessionID === target.id).length
  const diff = await harness.session.diff(target.id)
  checks.push(
    check(
      "opencode:upstream-e2e-fork-and-diff",
      fork.parentID === target.id &&
        forkMessages.length > 0 &&
        forkMessages.length < targetTranscript.length &&
        diff.length === targetEventCount,
      "OpenCode pinned timeline sessions can be forked before an upstream smoke message and diffed back to projection events.",
      { forkID: fork.id, forkMessages: forkMessages.length, targetMessages: targetTranscript.length, diff: diff.length, targetEventCount },
    ),
  )

  return { product: "opencode", ok: checks.every((item) => item.ok), checks }
}

async function auditPiUpstreamE2E(cwd: string, root: string): Promise<UpstreamE2EParityProductReport> {
  const productCwd = join(root, "pi-workspace")
  const harness = assemblePiMonoHarness({ cwd: productCwd, storageDir: join(root, "pi-storage") })
  const manifest = readE2EManifest(cwd)
  const checks: UpstreamE2EParityCheck[] = [
    check(
      "pi-mono:upstream-e2e-source-reference",
      [
        {
          sourcePath: "packages/coding-agent/test/agent-session-dynamic-tools.test.ts",
          sourceSha: "e58ea22fcb673501b36e07c4a9f3e16a2c349904",
        },
        {
          sourcePath: "packages/coding-agent/test/agent-session-runtime-events.test.ts",
          sourceSha: "42b01fe127bd93a0638deef469634e590b06b48b",
        },
        {
          sourcePath: "packages/coding-agent/test/agent-session-branching.test.ts",
          sourceSha: "f516e6d6551721c031815f0635a83e948050efeb",
        },
      ].every(({ sourcePath, sourceSha }) =>
        hasReference(manifest, {
          product: "pi-mono",
          sourceCommit: PI_COMMIT,
          sourcePath,
          sourceSha,
        }),
      ),
      "Pinned Pi dynamic-tools, runtime-events, and branching upstream test references are recorded for offline e2e parity.",
      referenceDetails(manifest, "pi-mono"),
    ),
  ]

  checks.push(await auditPiDynamicToolRegistration(harness, productCwd))
  checks.push(await auditPiRuntimeEvents(harness))
  checks.push(await auditPiBranching(harness, productCwd))

  return { product: "pi-mono", ok: checks.every((item) => item.ok), checks }
}

async function auditPiDynamicToolRegistration(harness: AssembledHarness, cwd: string): Promise<UpstreamE2EParityCheck> {
  let sessionStartCount = 0
  await loadPiExtension({
    host: harness.hooks,
    extension: (pi) => {
      pi.on("session_start", async () => {
        sessionStartCount++
        pi.registerTool({
          name: "dynamic_tool",
          description: "Runtime registered upstream dynamic tool.",
          execute(_toolCallID, input) {
            return {
              content: [
                {
                  id: createID("part"),
                  type: "text",
                  text: `dynamic:${String(input["value"] ?? "")}`,
                },
              ],
              details: { source: "session_start" },
            }
          },
        })
        pi.registerTool({
          name: "hidden_tool",
          description: "Runtime registered hidden tool without a prompt snippet.",
          execute() {
            return {
              content: [{ id: createID("part"), type: "text", text: "hidden:ok" }],
            }
          },
        })
        await pi.events.emit("resources.discover", {
          resources: [
            {
              kind: "agent",
              name: "dynamic-tool-guidelines",
              content: "dynamic_tool is available after session_start.",
              source: "extension",
            },
          ],
        })
      })
    },
    source: { id: "upstream-dynamic-tools-extension", path: "packages/coding-agent/test/agent-session-dynamic-tools.test.ts" },
  })

  await emitHook(harness, "session_start", { reason: "startup" })
  const prompt = await harness.prompt.build({
    product: "pi-mono",
    cwd,
    basePrompt: "Pi upstream dynamic tool parity.",
  })
  const result = await harness.runFixtureTurn({
    text: "run dynamic tool",
    assistantText: "dynamic tool turn",
    toolCalls: [{ toolName: "dynamic_tool", input: { value: "ok" } }],
    maxSteps: 3,
  })
  const dynamicService = record(harness.hooks.services.get("tool:dynamic_tool"))
  const dynamicSource = record(dynamicService?.["source"])
  return check(
    "pi-mono:upstream-e2e-dynamic-tool-registration",
    sessionStartCount >= 2 &&
      harness.hooks.registries.tools.has("dynamic_tool") &&
      harness.hooks.registries.tools.has("hidden_tool") &&
      dynamicSource?.["id"] === "upstream-dynamic-tools-extension" &&
      prompt.systemPrompt.includes("dynamic_tool") &&
      !prompt.systemPrompt.includes("hidden_tool") &&
      messagesText([result.assistantMessage]).includes("dynamic:ok"),
    "Pi extension session_start dynamically registers tools with source metadata, exposes visible prompt guidance, and keeps hidden tools out of prompt text.",
    {
      sessionStartCount,
      tools: Array.from(harness.hooks.registries.tools.keys()).filter((tool) => tool.includes("tool")),
      promptIncludesDynamic: prompt.systemPrompt.includes("dynamic_tool"),
      promptIncludesHidden: prompt.systemPrompt.includes("hidden_tool"),
      assistantText: messagesText([result.assistantMessage]),
    },
  )
}

async function auditPiRuntimeEvents(harness: AssembledHarness): Promise<UpstreamE2EParityCheck> {
  const lifecycle: string[] = []
  await loadPiExtension({
    host: harness.hooks,
    extension: (pi) => {
      pi.on("session_start", (event) => {
        lifecycle.push(`session_start:${String(record(event)?.["reason"] ?? "unknown")}`)
      })
      pi.on("session_before_switch", (event) => {
        const target = String(record(event)?.["to"] ?? "")
        lifecycle.push(`session_before_switch:${target}`)
        if (target === "blocked") return { cancel: true, reason: "blocked by upstream e2e parity" }
      })
      pi.on("session_before_fork", (event) => {
        lifecycle.push(`session_before_fork:${String(record(event)?.["source"] ?? "unknown")}`)
      })
      pi.on("session_shutdown", (event) => {
        lifecycle.push(`session_shutdown:${String(record(event)?.["reason"] ?? "unknown")}`)
      })
    },
    source: { id: "upstream-runtime-events-extension", path: "packages/coding-agent/test/agent-session-runtime-events.test.ts" },
  })

  await emitHook(harness, "session_start", { reason: "runtime" })
  await emitHook(harness, "session_before_switch", { to: "allowed" })
  const cancel = await emitHook(harness, "session_before_switch", { to: "blocked" })
  await emitHook(harness, "session_before_fork", { source: "ses_runtime_source", target: "ses_runtime_fork" })
  await emitHook(harness, "session_shutdown", { reason: "test-complete" })
  const cancelRecord = record(cancel)
  return check(
    "pi-mono:upstream-e2e-runtime-events",
    hasOrderedSubsequence(lifecycle, [
      "session_start:runtime",
      "session_before_switch:allowed",
      "session_before_switch:blocked",
      "session_before_fork:ses_runtime_source",
      "session_shutdown:test-complete",
    ]) &&
      cancelRecord?.["cancel"] === true &&
      cancelRecord?.["reason"] === "blocked by upstream e2e parity",
    "Pi runtime session lifecycle aliases emit in upstream order and preserve cancellation semantics.",
    { lifecycle, cancel },
  )
}

async function auditPiBranching(harness: AssembledHarness, cwd: string): Promise<UpstreamE2EParityCheck> {
  const session = await harness.session.create({ title: "Pi upstream branching e2e", cwd })
  await harness.session.appendMessage(createUserMessage({ sessionID: session.id, id: asMessageID("msg_pi_e2e_001"), text: "first user" }))
  await harness.session.appendMessage(
    createAssistantMessage({ sessionID: session.id, id: asMessageID("msg_pi_e2e_002"), text: "first assistant" }),
  )
  await harness.session.appendMessage(createUserMessage({ sessionID: session.id, id: asMessageID("msg_pi_e2e_003"), text: "second user" }))
  await harness.session.appendMessage(
    createAssistantMessage({ sessionID: session.id, id: asMessageID("msg_pi_e2e_004"), text: "second assistant" }),
  )
  const initialMessages = await harness.session.messages({ sessionID: session.id })
  await emitHook(harness, "session_before_fork", { source: session.id, target: "ses_pi_e2e_fork" })
  const fork = await harness.session.fork({
    sessionID: session.id,
    messageID: asMessageID("msg_pi_e2e_003"),
    title: "fork before second turn",
  })
  const forkMessages = await harness.session.messages({ sessionID: fork.id })
  await harness.session.branch({ sessionID: session.id, entryID: "msg_pi_e2e_001" })
  const branchMessages = await harness.session.messages({ sessionID: session.id })
  const branchingSession = harness.session as unknown as PiBranchingSessionService
  const summaryID = branchingSession.branchWithSummary({
    sessionID: session.id,
    entryID: "msg_pi_e2e_001",
    summary: "upstream branch summary",
    fromHook: true,
  })
  const afterSummary = await harness.session.messages({ sessionID: session.id })
  const summaryContext = branchingSession.buildContext({ sessionID: session.id })
  const entries = branchingSession.getEntries(session.id)
  const branched = branchingSession.createBranchedSession({
    sessionID: session.id,
    leafID: summaryID,
    title: "extracted upstream branch",
    cwd,
  })
  const branchedMessages = await harness.session.messages({ sessionID: branched.id })

  return check(
    "pi-mono:upstream-e2e-branching",
    initialMessages.length === 4 &&
      fork.parentID === session.id &&
      forkMessages.length === 2 &&
      branchMessages.length === 1 &&
      afterSummary.length >= 1 &&
      entries.some((entry) => entry.id === summaryID && entry.type === "branch_summary" && entry.summary === "upstream branch summary") &&
      messagesText(summaryContext.messages).includes("upstream branch summary") &&
      branched.parentID === session.id &&
      branchedMessages.length >= 1,
    "Pi JSONL tree sessions can fork from the middle, branch to an earlier message, and materialize a branched session with summary context.",
    {
      sessionID: session.id,
      initialMessages: initialMessages.length,
      forkID: fork.id,
      forkMessages: forkMessages.length,
      branchMessages: branchMessages.length,
      contextMessages: summaryContext.messages.length,
      branchedID: branched.id,
      branchedMessages: branchedMessages.length,
    },
  )
}

function readE2EManifest(cwd: string): UpstreamE2EManifest {
  const path = join(cwd, "packages", "conformance", "fixtures", "upstream", "e2e-manifest.json")
  if (!existsSync(path)) return { references: [] }
  return JSON.parse(readFileSync(path, "utf8")) as UpstreamE2EManifest
}

function hasReference(
  manifest: UpstreamE2EManifest,
  expected: { product: "opencode" | "pi-mono"; sourceCommit: string; sourcePath: string; sourceSha: string },
): boolean {
  return (
    manifest.references?.some(
      (reference) =>
        reference.product === expected.product &&
        reference.sourceCommit === expected.sourceCommit &&
        reference.sourcePath === expected.sourcePath &&
        reference.sourceSha === expected.sourceSha,
    ) === true
  )
}

function referenceDetails(manifest: UpstreamE2EManifest, product: "opencode" | "pi-mono"): unknown {
  return manifest.references?.filter((reference) => reference.product === product) ?? []
}

async function emitHook(harness: AssembledHarness, type: string, payload: unknown): Promise<unknown> {
  return harness.hooks.emit({ type: type as never, timestamp: Date.now(), payload })
}

function hasForbiddenTimelineFallback(value: string): boolean {
  return value.includes("Load details") || value.includes("Show earlier steps")
}

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T)
}

function messagesText(messages: LegoMessage[]): string {
  return messages.map(messageText).join("\n")
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

function hasOrderedSubsequence(values: string[], expected: string[]): boolean {
  let index = 0
  for (const value of values) {
    if (value === expected[index]) index++
    if (index === expected.length) return true
  }
  return expected.length === 0
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
}

async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Expected ${url} to return 2xx, got ${response.status}`)
  return (await response.json()) as T
}

function check(id: string, ok: boolean, message: string, details?: unknown): UpstreamE2EParityCheck {
  return {
    id,
    ok,
    message,
    ...(details === undefined ? {} : { details }),
  }
}
