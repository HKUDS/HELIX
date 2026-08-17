import { createHash } from "node:crypto"

import { asSessionID, type EventEnvelope } from "@helix/contracts"
import { LegoHookHost, type HookScope, type HookSourceInfo } from "@helix/lego-hooks"
import type { OpenCodeHooks } from "./plugin-adapter"

export interface OpenCodeCommandRegistryRegistrationInput {
  host: LegoHookHost
  scope: HookScope
  hooks: OpenCodeHooks
}

export interface OpenCodeCommandRegistryBridge {
  register(input: OpenCodeCommandRegistryRegistrationInput): void
}

export interface OpenCodeCommandRegistryNativeExactFixtureCase {
  id: "no-command-hook-noop" | "source-order-shared-output" | "event-session-fallback" | "cleanup-removes-hook" | "fail-fast-hook-error"
  actual: unknown
  expected: unknown
}

export interface OpenCodeCommandRegistryNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.registry.command"
  portID: "registry.command"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-command-registry-native-exact-fixture"
  replayRef: "command-registry-native-exact:opencode"
  fixtureID: "opencode-command-registry:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeCommandRegistryNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeCommandRegistryNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeCommandRegistryNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeCommandRegistryNativeExactFixtureIssue[]
}

interface OpenCodeCommandHookRecord {
  source: HookSourceInfo
  hook: NonNullable<OpenCodeHooks["command.execute.before"]>
}

interface OpenCodeCommandRegistryState {
  records: OpenCodeCommandHookRecord[]
  unregister?: () => void
}

const commandRegistryStates = new WeakMap<LegoHookHost, OpenCodeCommandRegistryState>()

export function createOpenCodeCommandRegistryBridge(): OpenCodeCommandRegistryBridge {
  return {
    register: openCodeCommandRegistryRegister,
  }
}

export function openCodeCommandRegistryRegister(input: OpenCodeCommandRegistryRegistrationInput): void {
  const hook = input.hooks["command.execute.before"]
  if (!hook) return
  const state = openCodeCommandRegistryStateForHost(input.host)
  const record: OpenCodeCommandHookRecord = { source: input.scope.source, hook }
  state.records.push(record)
  state.records.sort((left, right) => left.source.order - right.source.order)
  if (!state.unregister) {
    state.unregister = input.host.on(
      "command.before",
      (event) => openCodeCommandRegistryHandleCommandBefore(event, state),
      openCodeCommandRegistryHandlerSource(),
    )
  }
  input.scope.addCleanup(() => {
    const index = state.records.indexOf(record)
    if (index >= 0) state.records.splice(index, 1)
    if (state.records.length === 0) {
      state.unregister?.()
      delete state.unregister
      commandRegistryStates.delete(input.host)
    }
  })
}

export async function openCodeCommandRegistryRun(input: {
  hooks: OpenCodeHooks[]
  command: string
  sessionID: string
  arguments: string
}): Promise<{ parts: unknown[] }> {
  const output = { parts: [] as unknown[] }
  for (const hooks of input.hooks) {
    const hook = hooks["command.execute.before"]
    if (!hook) continue
    await hook({ command: input.command, sessionID: input.sessionID, arguments: input.arguments }, output)
  }
  return output
}

export async function captureOpenCodeCommandRegistryNativeExactFixture(): Promise<OpenCodeCommandRegistryNativeExactFixture> {
  const bridge = createOpenCodeCommandRegistryBridge()

  const noHookHost = new LegoHookHost({ errorMode: "throw" })
  const noHookScope = noHookHost.createScope({ id: "no-hook", scope: "project" })
  bridge.register({ host: noHookHost, scope: noHookScope, hooks: {} })
  const noHookActual = await noHookHost.emit({
    type: "command.before",
    timestamp: 1,
    payload: { command: "/build", sessionID: "ses_no_hook", arguments: "--fast" },
  })

  const orderedHost = new LegoHookHost({ errorMode: "throw" })
  const orderedFirst = orderedHost.createScope({ id: "first", scope: "project", order: 0 })
  const orderedSecond = orderedHost.createScope({ id: "second", scope: "project", order: 1 })
  const orderedCalls: string[] = []
  bridge.register({
    host: orderedHost,
    scope: orderedSecond,
    hooks: {
      "command.execute.before": (input, output) => {
        orderedCalls.push(`second:${input.arguments}:${output.parts.length}`)
        output.parts.push({ type: "text", text: `second:${input.sessionID}` })
      },
    },
  })
  bridge.register({
    host: orderedHost,
    scope: orderedFirst,
    hooks: {
      "command.execute.before": async (input, output) => {
        orderedCalls.push(`first:${input.command}:${output.parts.length}`)
        output.parts.push({ type: "text", text: "first" })
      },
    },
  })
  const orderedPayload = { command: "/build", sessionID: "ses_ordered", arguments: "--fast" }
  const orderedActual = await orderedHost.emit({
    type: "command.before",
    timestamp: 2,
    payload: orderedPayload,
  })

  const fallbackHost = new LegoHookHost({ errorMode: "throw" })
  const fallbackScope = fallbackHost.createScope({ id: "fallback", scope: "project" })
  let fallbackInput: unknown
  bridge.register({
    host: fallbackHost,
    scope: fallbackScope,
    hooks: {
      "command.execute.before": (input, output) => {
        fallbackInput = input
        output.parts.push({ type: "text", text: input.sessionID })
      },
    },
  })
  const fallbackActual = await fallbackHost.emit({
    type: "command.before",
    sessionID: asSessionID("ses_event"),
    timestamp: 3,
    payload: { command: "/fallback", arguments: "" },
  })

  const cleanupHost = new LegoHookHost({ errorMode: "throw" })
  const cleanupScope = cleanupHost.createScope({ id: "cleanup", scope: "project" })
  bridge.register({
    host: cleanupHost,
    scope: cleanupScope,
    hooks: {
      "command.execute.before": (_input, output) => {
        output.parts.push({ type: "text", text: "before-cleanup" })
      },
    },
  })
  const cleanupBefore = await cleanupHost.emit({
    type: "command.before",
    timestamp: 4,
    payload: { command: "/cleanup", sessionID: "ses_cleanup", arguments: "" },
  })
  await cleanupScope.dispose()
  const cleanupAfter = await cleanupHost.emit({
    type: "command.before",
    timestamp: 5,
    payload: { command: "/cleanup", sessionID: "ses_cleanup", arguments: "" },
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
      "command.execute.before": (_input, output) => {
        errorCalls.push("first")
        output.parts.push({ type: "text", text: "first" })
      },
    },
  })
  bridge.register({
    host: errorHost,
    scope: errorSecond,
    hooks: {
      "command.execute.before": () => {
        errorCalls.push("throws")
        throw new Error("command hook failed")
      },
    },
  })
  bridge.register({
    host: errorHost,
    scope: errorThird,
    hooks: {
      "command.execute.before": () => {
        errorCalls.push("third")
      },
    },
  })
  let errorActual: unknown
  try {
    await errorHost.emit({
      type: "command.before",
      timestamp: 6,
      payload: { command: "/error", sessionID: "ses_error", arguments: "--bad" },
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

  const cases: OpenCodeCommandRegistryNativeExactFixtureCase[] = [
    {
      id: "no-command-hook-noop",
      actual: noHookActual,
      expected: undefined,
    },
    {
      id: "source-order-shared-output",
      actual: { result: orderedActual, calls: orderedCalls, payloadAfterEmit: orderedPayload },
      expected: {
        result: {
          parts: [
            { type: "text", text: "first" },
            { type: "text", text: "second:ses_ordered" },
          ],
        },
        calls: ["first:/build:0", "second:--fast:1"],
        payloadAfterEmit: { command: "/build", sessionID: "ses_ordered", arguments: "--fast" },
      },
    },
    {
      id: "event-session-fallback",
      actual: { input: fallbackInput, result: fallbackActual },
      expected: {
        input: { command: "/fallback", sessionID: "ses_event", arguments: "" },
        result: { parts: [{ type: "text", text: "ses_event" }] },
      },
    },
    {
      id: "cleanup-removes-hook",
      actual: { before: cleanupBefore, after: cleanupAfter },
      expected: {
        before: { parts: [{ type: "text", text: "before-cleanup" }] },
        after: undefined,
      },
    },
    {
      id: "fail-fast-hook-error",
      actual: errorActual,
      expected: {
        rejected: true,
        errorName: "Error",
        message: "command hook failed",
        calls: ["first", "throws"],
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.registry.command" as const,
    portID: "registry.command" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-command-registry-native-exact-fixture" as const,
    replayRef: "command-registry-native-exact:opencode" as const,
    fixtureID: "opencode-command-registry:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "anomalyco/opencode:packages/plugin/src/index.ts#Hooks.command.execute.before",
      "anomalyco/opencode:packages/opencode/src/session/prompt.ts#SessionPrompt.command,Plugin.trigger(command.execute.before)",
      "anomalyco/opencode:packages/opencode/src/plugin/index.ts#Plugin.trigger,source-order",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeCommandRegistryFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeCommandRegistryNativeExactFixture(
  fixture: OpenCodeCommandRegistryNativeExactFixture,
): OpenCodeCommandRegistryNativeExactFixtureVerification {
  const issues: OpenCodeCommandRegistryNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-command-registry.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.registry.command" || fixture.portID !== "registry.command") {
    add("opencode-command-registry.target", "Fixture must target opencode.registry.command and registry.command.")
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    add("opencode-command-registry.native-claim", "Command registry fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-command-registry.lossiness", "Native command registry fixture cannot retain known lossiness.")
  }
  for (const source of [
    "packages/plugin/src/index.ts",
    "packages/opencode/src/session/prompt.ts",
    "packages/opencode/src/plugin/index.ts",
  ]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-command-registry.source-ref", `Missing upstream source ref ${source}.`)
  }
  for (const item of fixture.cases) {
    if (!openCodeCommandRegistrySameJSON(item.actual, item.expected)) {
      add("opencode-command-registry.case", "Case actual output must match expected pinned upstream command hook behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeCommandRegistryFingerprintObject(withoutFingerprint)) {
    add("opencode-command-registry.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function openCodeCommandRegistryStateForHost(host: LegoHookHost): OpenCodeCommandRegistryState {
  const existing = commandRegistryStates.get(host)
  if (existing) return existing
  const state: OpenCodeCommandRegistryState = { records: [] }
  commandRegistryStates.set(host, state)
  return state
}

function openCodeCommandRegistryHandlerSource(): HookSourceInfo {
  return { id: "opencode.command-registry", scope: "internal", order: -1 }
}

async function openCodeCommandRegistryHandleCommandBefore(
  event: EventEnvelope,
  state: OpenCodeCommandRegistryState,
): Promise<{ parts: unknown[] } | undefined> {
  if (state.records.length === 0) return undefined
  const payload = openCodeCommandRegistryRecord(event.payload)
  return openCodeCommandRegistryRun({
    hooks: state.records.map((record) => ({ "command.execute.before": record.hook })),
    command: String(payload["command"] ?? ""),
    sessionID: String(payload["sessionID"] ?? event.sessionID ?? ""),
    arguments: String(payload["arguments"] ?? ""),
  })
}

function openCodeCommandRegistryRecord(value: unknown): Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function openCodeCommandRegistrySameJSON(left: unknown, right: unknown): boolean {
  return openCodeCommandRegistryStableJSON(left) === openCodeCommandRegistryStableJSON(right)
}

function openCodeCommandRegistryFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeCommandRegistryStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeCommandRegistryStableJSON(value: unknown): string {
  return JSON.stringify(openCodeCommandRegistrySortStable(value))
}

function openCodeCommandRegistrySortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeCommandRegistrySortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeCommandRegistrySortStable(entry)]),
  )
}
