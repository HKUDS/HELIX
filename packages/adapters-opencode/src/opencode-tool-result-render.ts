import { createHash } from "node:crypto"

import { createID, type EventEnvelope, type LegoMessagePart, type ToolResultEventPayload } from "@helix/contracts"
import { LegoHookHost, type HookScope, type HookSourceInfo } from "@helix/lego-hooks"
import type { OpenCodeHooks } from "./plugin-adapter"

export interface OpenCodeToolResultRenderRegistrationInput {
  host: LegoHookHost
  scope: HookScope
  hooks: OpenCodeHooks
}

export interface OpenCodeToolResultRenderBridge {
  register(input: OpenCodeToolResultRenderRegistrationInput): void
}

export interface OpenCodeToolResultRenderOutput {
  title: string
  output: string
  metadata: unknown
}

export interface OpenCodeToolResultRenderNativeExactFixtureCase {
  id: "no-tool-after-hook-noop" | "source-order-shared-output" | "nested-tool-result-text" | "cleanup-removes-hook" | "fail-fast-hook-error"
  actual: unknown
  expected: unknown
}

export interface OpenCodeToolResultRenderNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.tool.result-render-bridge"
  portID: "tool.result-normalizer"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-tool-result-render-native-exact-fixture"
  replayRef: "tool-result-render-native-exact:opencode"
  fixtureID: "opencode-tool-result-render:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeToolResultRenderNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeToolResultRenderNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeToolResultRenderNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeToolResultRenderNativeExactFixtureIssue[]
}

interface OpenCodeToolResultRenderHookRecord {
  source: HookSourceInfo
  hook: NonNullable<OpenCodeHooks["tool.execute.after"]>
}

interface OpenCodeToolResultRenderState {
  records: OpenCodeToolResultRenderHookRecord[]
  unregister?: () => void
}

const toolResultRenderStates = new WeakMap<LegoHookHost, OpenCodeToolResultRenderState>()

export function createOpenCodeToolResultRenderBridge(): OpenCodeToolResultRenderBridge {
  return {
    register: openCodeToolResultRenderRegister,
  }
}

export function openCodeToolResultRenderRegister(input: OpenCodeToolResultRenderRegistrationInput): void {
  const hook = input.hooks["tool.execute.after"]
  if (!hook) return
  const state = openCodeToolResultRenderStateForHost(input.host)
  const record: OpenCodeToolResultRenderHookRecord = { source: input.scope.source, hook }
  state.records.push(record)
  state.records.sort((left, right) => left.source.order - right.source.order)
  if (!state.unregister) {
    state.unregister = input.host.on(
      "tool.result",
      (event) => openCodeToolResultRenderHandleEvent(event, state),
      openCodeToolResultRenderHandlerSource(),
    )
  }
  input.scope.addCleanup(() => {
    const index = state.records.indexOf(record)
    if (index >= 0) state.records.splice(index, 1)
    if (state.records.length === 0) {
      state.unregister?.()
      delete state.unregister
      toolResultRenderStates.delete(input.host)
    }
  })
}

export async function openCodeToolResultRenderRun(input: {
  hooks: OpenCodeHooks[]
  tool: string
  sessionID: string
  callID: string
  args: Record<string, unknown>
  result: OpenCodeToolResultRenderOutput
}): Promise<OpenCodeToolResultRenderOutput> {
  const output: OpenCodeToolResultRenderOutput = {
    title: input.result.title,
    output: input.result.output,
    metadata: input.result.metadata,
  }
  const hookInput = { tool: input.tool, sessionID: input.sessionID, callID: input.callID, args: input.args }
  for (const hooks of input.hooks) {
    const hook = hooks["tool.execute.after"]
    if (!hook) continue
    await hook(hookInput, output)
  }
  return output
}

export async function captureOpenCodeToolResultRenderNativeExactFixture(): Promise<OpenCodeToolResultRenderNativeExactFixture> {
  const bridge = createOpenCodeToolResultRenderBridge()

  const noHookHost = new LegoHookHost({ errorMode: "throw" })
  const noHookScope = noHookHost.createScope({ id: "no-tool-after", scope: "project" })
  bridge.register({ host: noHookHost, scope: noHookScope, hooks: {} })
  const noHookActual = await noHookHost.emit({
    type: "tool.result",
    timestamp: 1,
    payload: openCodeToolResultRenderPayload({
      toolName: "bash",
      toolCallID: "call_no_hook",
      sessionID: "ses_no_hook",
      input: { command: "echo ok" },
      text: "ok",
      details: { exitCode: 0 },
    }),
  })

  const orderedHost = new LegoHookHost({ errorMode: "throw" })
  const orderedFirst = orderedHost.createScope({ id: "first", scope: "project", order: 0 })
  const orderedSecond = orderedHost.createScope({ id: "second", scope: "project", order: 1 })
  const orderedCalls: string[] = []
  bridge.register({
    host: orderedHost,
    scope: orderedSecond,
    hooks: {
      "tool.execute.after": (input, output) => {
        orderedCalls.push(`second:${input.callID}:${output.title}:${output.output}:${metadataMarker(output.metadata)}`)
        output.title = `${output.title}:second`
        output.output = `${output.output}|second:${input.args["command"] ?? "missing"}`
        output.metadata = { ...(record(output.metadata) ?? {}), second: true }
      },
    },
  })
  bridge.register({
    host: orderedHost,
    scope: orderedFirst,
    hooks: {
      "tool.execute.after": async (input, output) => {
        orderedCalls.push(`first:${input.tool}:${output.title}:${output.output}:${metadataMarker(output.metadata)}`)
        output.title = `${output.title}:first`
        output.output = `${output.output}|first:${input.sessionID}`
        output.metadata = { ...(record(output.metadata) ?? {}), first: true }
      },
    },
  })
  const orderedActual = await orderedHost.emit({
    type: "tool.result",
    timestamp: 2,
    payload: openCodeToolResultRenderPayload({
      toolName: "bash",
      toolCallID: "call_ordered",
      sessionID: "ses_ordered",
      input: { command: "printf hi" },
      text: "base",
      details: { initial: true },
    }),
  })

  const nestedHost = new LegoHookHost({ errorMode: "throw" })
  const nestedScope = nestedHost.createScope({ id: "nested", scope: "project" })
  let nestedInput: unknown
  bridge.register({
    host: nestedHost,
    scope: nestedScope,
    hooks: {
      "tool.execute.after": (input, output) => {
        nestedInput = input
        output.output = `${output.output}|flattened`
        output.metadata = { textSeen: output.output }
      },
    },
  })
  const nestedActual = await nestedHost.emit({
    type: "tool.result",
    timestamp: 3,
    payload: {
      ...openCodeToolResultRenderPayload({
        toolName: "read",
        toolCallID: "call_nested",
        sessionID: "ses_nested",
        input: { path: "README.md" },
        text: "outer",
      }),
      content: [
        { id: createID("part", "outer"), type: "text", text: "outer" },
        {
          id: createID("part", "tool"),
          type: "tool_result",
          toolCallID: createID("toolcall", "inner"),
          toolName: "inner",
          content: [{ id: createID("part", "inner"), type: "text", text: "inner" }],
        },
      ] satisfies LegoMessagePart[],
    },
  })

  const cleanupHost = new LegoHookHost({ errorMode: "throw" })
  const cleanupScope = cleanupHost.createScope({ id: "cleanup", scope: "project" })
  bridge.register({
    host: cleanupHost,
    scope: cleanupScope,
    hooks: {
      "tool.execute.after": (_input, output) => {
        output.output = "before-cleanup"
      },
    },
  })
  const cleanupBefore = await cleanupHost.emit({
    type: "tool.result",
    timestamp: 4,
    payload: openCodeToolResultRenderPayload({
      toolName: "bash",
      toolCallID: "call_cleanup",
      sessionID: "ses_cleanup",
      input: {},
      text: "original",
    }),
  })
  await cleanupScope.dispose()
  const cleanupAfter = await cleanupHost.emit({
    type: "tool.result",
    timestamp: 5,
    payload: openCodeToolResultRenderPayload({
      toolName: "bash",
      toolCallID: "call_cleanup",
      sessionID: "ses_cleanup",
      input: {},
      text: "original",
    }),
  })

  const errorHost = new LegoHookHost({ errorMode: "throw" })
  const errorFirst = errorHost.createScope({ id: "error-first", scope: "project", order: 0 })
  const errorSecond = errorHost.createScope({ id: "error-second", scope: "project", order: 1 })
  const errorThird = errorHost.createScope({ id: "error-third", scope: "project", order: 2 })
  const errorCalls: string[] = []
  bridge.register({
    host: errorHost,
    scope: errorFirst,
    hooks: {
      "tool.execute.after": (_input, output) => {
        errorCalls.push("first")
        output.output = "first"
      },
    },
  })
  bridge.register({
    host: errorHost,
    scope: errorSecond,
    hooks: {
      "tool.execute.after": () => {
        errorCalls.push("throws")
        throw new Error("tool result hook failed")
      },
    },
  })
  bridge.register({
    host: errorHost,
    scope: errorThird,
    hooks: {
      "tool.execute.after": () => {
        errorCalls.push("third")
      },
    },
  })
  let errorActual: unknown
  try {
    await errorHost.emit({
      type: "tool.result",
      timestamp: 6,
      payload: openCodeToolResultRenderPayload({
        toolName: "bash",
        toolCallID: "call_error",
        sessionID: "ses_error",
        input: {},
        text: "original",
      }),
    })
    errorActual = { rejected: false, calls: errorCalls }
  } catch (error) {
    errorActual = {
      rejected: true,
      errorName: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      calls: errorCalls,
    }
  }

  const cases: OpenCodeToolResultRenderNativeExactFixtureCase[] = [
    {
      id: "no-tool-after-hook-noop",
      actual: noHookActual,
      expected: undefined,
    },
    {
      id: "source-order-shared-output",
      actual: { result: orderedActual, calls: orderedCalls },
      expected: {
        result: {
          title: "bash:first:second",
          content: [{ id: "prt_opencode-tool-result-render", type: "text", text: "base|first:ses_ordered|second:printf hi" }],
          details: { initial: true, first: true, second: true },
        },
        calls: ["first:bash:bash:base:initial", "second:call_ordered:bash:first:base|first:ses_ordered:first,initial"],
      },
    },
    {
      id: "nested-tool-result-text",
      actual: { input: nestedInput, result: nestedActual },
      expected: {
        input: { tool: "read", sessionID: "ses_nested", callID: "call_nested", args: { path: "README.md" } },
        result: {
          title: "read",
          content: [{ id: "prt_opencode-tool-result-render", type: "text", text: "outer\ninner|flattened" }],
          details: { textSeen: "outer\ninner|flattened" },
        },
      },
    },
    {
      id: "cleanup-removes-hook",
      actual: { before: cleanupBefore, after: cleanupAfter },
      expected: {
        before: {
          title: "bash",
          content: [{ id: "prt_opencode-tool-result-render", type: "text", text: "before-cleanup" }],
          details: undefined,
        },
        after: undefined,
      },
    },
    {
      id: "fail-fast-hook-error",
      actual: errorActual,
      expected: {
        rejected: true,
        errorName: "Error",
        message: "tool result hook failed",
        calls: ["first", "throws"],
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1,
    product: "opencode",
    atomID: "opencode.tool.result-render-bridge",
    portID: "tool.result-normalizer",
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
    evidenceRef: "conformance:opencode-tool-result-render-native-exact-fixture",
    replayRef: "tool-result-render-native-exact:opencode",
    fixtureID: "opencode-tool-result-render:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    sourceRefs: [
      "anomalyco/opencode:packages/plugin/src/index.ts#Hooks.tool.execute.after",
      "anomalyco/opencode:packages/opencode/src/session/prompt.ts#SessionPrompt,Plugin.trigger,tool.execute.after",
      "anomalyco/opencode:packages/opencode/src/plugin/index.ts#Plugin.trigger,Plugin.list",
    ],
    cases,
    knownLossiness: [],
  } satisfies Omit<OpenCodeToolResultRenderNativeExactFixture, "fingerprint">
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeToolResultRenderFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeToolResultRenderNativeExactFixture(
  fixture: OpenCodeToolResultRenderNativeExactFixture,
): OpenCodeToolResultRenderNativeExactFixtureVerification {
  const issues: OpenCodeToolResultRenderNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-tool-result-render.schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.tool.result-render-bridge" || fixture.portID !== "tool.result-normalizer") {
    add("opencode-tool-result-render.target", "Fixture must target opencode.tool.result-render-bridge and tool.result-normalizer.")
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    add("opencode-tool-result-render.native-claim", "Tool result render fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-tool-result-render.lossiness", "Native tool result render fixture cannot retain known lossiness.")
  }
  for (const source of ["packages/plugin/src/index.ts", "packages/opencode/src/session/prompt.ts", "packages/opencode/src/plugin/index.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) {
      add("opencode-tool-result-render.source-ref", `Fixture must reference ${source}.`)
    }
  }
  for (const testCase of fixture.cases) {
    if (stableJSONString(testCase.actual) !== stableJSONString(testCase.expected)) {
      add("opencode-tool-result-render.case-mismatch", "Fixture case actual output must match expected upstream behavior.", testCase.id)
    }
  }
  const expectedFingerprint = openCodeToolResultRenderFingerprintObject({
    ...fixture,
    fingerprint: undefined,
  })
  if (fixture.fingerprint !== expectedFingerprint) {
    add("opencode-tool-result-render.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

async function openCodeToolResultRenderHandleEvent(
  event: EventEnvelope,
  state: OpenCodeToolResultRenderState,
): Promise<{ title: string; content: LegoMessagePart[]; details: unknown } | undefined> {
  if (state.records.length === 0) return undefined
  const payload = event.payload as ToolResultEventPayload
  const output = await openCodeToolResultRenderRun({
    hooks: state.records.map((record) => ({ "tool.execute.after": record.hook })),
    tool: String(payload.toolName),
    sessionID: String(payload.sessionID),
    callID: String(payload.toolCallID),
    args: record(payload.input) ?? {},
    result: {
      title: String(payload.toolName),
      output: textFromParts(payload.content),
      metadata: payload.details,
    },
  })
  return {
    title: output.title,
    content: [{ id: createID("part", "opencode-tool-result-render"), type: "text", text: output.output }],
    details: output.metadata,
  }
}

function openCodeToolResultRenderStateForHost(host: LegoHookHost): OpenCodeToolResultRenderState {
  const existing = toolResultRenderStates.get(host)
  if (existing) return existing
  const created: OpenCodeToolResultRenderState = { records: [] }
  toolResultRenderStates.set(host, created)
  return created
}

function openCodeToolResultRenderHandlerSource(): HookSourceInfo {
  return { id: "opencode.tool-result-render", scope: "internal", order: -1 }
}

function textFromParts(parts: LegoMessagePart[] | undefined): string {
  return (parts ?? [])
    .map((part) => {
      if (part.type === "text" || part.type === "reasoning") return part.text
      if (part.type === "tool_result") return textFromParts(part.content)
      return ""
    })
    .filter(Boolean)
    .join("\n")
}

function openCodeToolResultRenderPayload(input: {
  toolName: string
  toolCallID: string
  sessionID: string
  input: Record<string, unknown>
  text: string
  details?: unknown
}): ToolResultEventPayload {
  return {
    toolName: input.toolName,
    toolCallID: input.toolCallID as ToolResultEventPayload["toolCallID"],
    sessionID: input.sessionID as ToolResultEventPayload["sessionID"],
    input: input.input,
    content: [{ id: createID("part", "input"), type: "text", text: input.text }],
    details: input.details,
  }
}

function metadataMarker(value: unknown): string {
  const data = record(value)
  return data ? Object.keys(data).sort().join(",") : "none"
}

function record(value: unknown): Record<string, unknown> | undefined {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
}

function openCodeToolResultRenderFingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableJSONString(value)).digest("hex").slice(0, 16)
}

function stableJSONString(value: unknown): string {
  return JSON.stringify(stableValue(value))
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, stableValue(item)]))
}
