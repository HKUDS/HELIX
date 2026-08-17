import { createHash } from "node:crypto"

import type { EventEnvelope, ShellEnvPayload } from "@helix/contracts"
import { LegoHookHost, type HookScope, type HookSourceInfo } from "@helix/lego-hooks"
import type { OpenCodeHooks } from "./plugin-adapter"

export interface OpenCodeShellEnvRegistrationInput {
  host: LegoHookHost
  scope: HookScope
  hooks: OpenCodeHooks
}

export interface OpenCodeShellEnvBridge {
  register(input: OpenCodeShellEnvRegistrationInput): void
}

export interface OpenCodeShellEnvNativeExactFixtureCase {
  id: "no-shell-env-hook-noop" | "source-order-shared-env" | "optional-session-call-fields" | "cleanup-removes-hook" | "fail-fast-hook-error"
  actual: unknown
  expected: unknown
}

export interface OpenCodeShellEnvNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.shell.env-bridge"
  portID: "process-runner.port"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-shell-env-native-exact-fixture"
  replayRef: "shell-env-native-exact:opencode"
  fixtureID: "opencode-shell-env:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeShellEnvNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeShellEnvNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeShellEnvNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeShellEnvNativeExactFixtureIssue[]
}

interface OpenCodeShellEnvHookRecord {
  source: HookSourceInfo
  hook: NonNullable<OpenCodeHooks["shell.env"]>
}

interface OpenCodeShellEnvState {
  records: OpenCodeShellEnvHookRecord[]
  unregister?: () => void
}

const shellEnvStates = new WeakMap<LegoHookHost, OpenCodeShellEnvState>()

export function createOpenCodeShellEnvBridge(): OpenCodeShellEnvBridge {
  return {
    register: openCodeShellEnvRegister,
  }
}

export function openCodeShellEnvRegister(input: OpenCodeShellEnvRegistrationInput): void {
  const hook = input.hooks["shell.env"]
  if (!hook) return
  const state = openCodeShellEnvStateForHost(input.host)
  const record: OpenCodeShellEnvHookRecord = { source: input.scope.source, hook }
  state.records.push(record)
  state.records.sort((left, right) => left.source.order - right.source.order)
  if (!state.unregister) {
    state.unregister = input.host.on(
      "shell.env",
      (event) => openCodeShellEnvHandleEvent(event, state),
      openCodeShellEnvHandlerSource(),
    )
  }
  input.scope.addCleanup(() => {
    const index = state.records.indexOf(record)
    if (index >= 0) state.records.splice(index, 1)
    if (state.records.length === 0) {
      state.unregister?.()
      delete state.unregister
      shellEnvStates.delete(input.host)
    }
  })
}

export async function openCodeShellEnvRun(input: {
  hooks: OpenCodeHooks[]
  cwd: string
  sessionID?: string
  callID?: string
}): Promise<{ env: Record<string, string> }> {
  const output = { env: {} as Record<string, string> }
  const hookInput = openCodeShellEnvInput(input.cwd, input.sessionID, input.callID)
  for (const hooks of input.hooks) {
    const hook = hooks["shell.env"]
    if (!hook) continue
    await hook(hookInput, output)
  }
  return output
}

export async function captureOpenCodeShellEnvNativeExactFixture(): Promise<OpenCodeShellEnvNativeExactFixture> {
  const bridge = createOpenCodeShellEnvBridge()

  const noHookHost = new LegoHookHost({ errorMode: "throw" })
  const noHookScope = noHookHost.createScope({ id: "no-shell-env", scope: "project" })
  bridge.register({ host: noHookHost, scope: noHookScope, hooks: {} })
  const noHookActual = await noHookHost.emit({
    type: "shell.env",
    timestamp: 1,
    payload: { cwd: "/workspace", command: "echo $A", sessionID: "ses_no_hook", callID: "call_no_hook" },
  })

  const orderedHost = new LegoHookHost({ errorMode: "throw" })
  const orderedFirst = orderedHost.createScope({ id: "first", scope: "project", order: 0 })
  const orderedSecond = orderedHost.createScope({ id: "second", scope: "project", order: 1 })
  const orderedCalls: string[] = []
  bridge.register({
    host: orderedHost,
    scope: orderedSecond,
    hooks: {
      "shell.env": (input, output) => {
        orderedCalls.push(`second:${input.callID}:${output.env.FIRST ?? "missing"}:${output.env.SHARED ?? "missing"}`)
        output.env.SECOND = `${output.env.FIRST ?? "missing"}:${input.sessionID ?? "none"}`
        output.env.SHARED = "second"
      },
    },
  })
  bridge.register({
    host: orderedHost,
    scope: orderedFirst,
    hooks: {
      "shell.env": async (input, output) => {
        orderedCalls.push(`first:${input.cwd}:${Object.keys(output.env).length}`)
        output.env.FIRST = "1"
        output.env.SHARED = "first"
      },
    },
  })
  const orderedActual = await orderedHost.emit({
    type: "shell.env",
    timestamp: 2,
    payload: { cwd: "/repo", command: "printf $FIRST", sessionID: "ses_ordered", callID: "call_ordered" },
  })

  const optionalHost = new LegoHookHost({ errorMode: "throw" })
  const optionalScope = optionalHost.createScope({ id: "optional", scope: "project" })
  let optionalInput: unknown
  bridge.register({
    host: optionalHost,
    scope: optionalScope,
    hooks: {
      "shell.env": (input, output) => {
        optionalInput = input
        output.env.CWD = input.cwd
        output.env.HAS_SESSION = Object.hasOwn(input, "sessionID") ? "yes" : "no"
        output.env.HAS_CALL = Object.hasOwn(input, "callID") ? "yes" : "no"
      },
    },
  })
  const optionalActual = await optionalHost.emit({
    type: "shell.env",
    timestamp: 3,
    payload: { cwd: "/optional", command: "env" },
  })

  const cleanupHost = new LegoHookHost({ errorMode: "throw" })
  const cleanupScope = cleanupHost.createScope({ id: "cleanup", scope: "project" })
  bridge.register({
    host: cleanupHost,
    scope: cleanupScope,
    hooks: {
      "shell.env": (_input, output) => {
        output.env.BEFORE_CLEANUP = "1"
      },
    },
  })
  const cleanupBefore = await cleanupHost.emit({
    type: "shell.env",
    timestamp: 4,
    payload: { cwd: "/cleanup", command: "env", sessionID: "ses_cleanup", callID: "call_cleanup" },
  })
  await cleanupScope.dispose()
  const cleanupAfter = await cleanupHost.emit({
    type: "shell.env",
    timestamp: 5,
    payload: { cwd: "/cleanup", command: "env", sessionID: "ses_cleanup", callID: "call_cleanup" },
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
      "shell.env": (_input, output) => {
        errorCalls.push("first")
        output.env.FIRST = "1"
      },
    },
  })
  bridge.register({
    host: errorHost,
    scope: errorSecond,
    hooks: {
      "shell.env": () => {
        errorCalls.push("throws")
        throw new Error("shell env hook failed")
      },
    },
  })
  bridge.register({
    host: errorHost,
    scope: errorThird,
    hooks: {
      "shell.env": () => {
        errorCalls.push("third")
      },
    },
  })
  let errorActual: unknown
  try {
    await errorHost.emit({
      type: "shell.env",
      timestamp: 6,
      payload: { cwd: "/error", command: "env", sessionID: "ses_error", callID: "call_error" },
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

  const cases: OpenCodeShellEnvNativeExactFixtureCase[] = [
    {
      id: "no-shell-env-hook-noop",
      actual: noHookActual,
      expected: undefined,
    },
    {
      id: "source-order-shared-env",
      actual: { result: orderedActual, calls: orderedCalls },
      expected: {
        result: {
          env: {
            FIRST: "1",
            SECOND: "1:ses_ordered",
            SHARED: "second",
          },
        },
        calls: ["first:/repo:0", "second:call_ordered:1:first"],
      },
    },
    {
      id: "optional-session-call-fields",
      actual: { input: optionalInput, result: optionalActual },
      expected: {
        input: { cwd: "/optional" },
        result: { env: { CWD: "/optional", HAS_CALL: "no", HAS_SESSION: "no" } },
      },
    },
    {
      id: "cleanup-removes-hook",
      actual: { before: cleanupBefore, after: cleanupAfter },
      expected: {
        before: { env: { BEFORE_CLEANUP: "1" } },
        after: undefined,
      },
    },
    {
      id: "fail-fast-hook-error",
      actual: errorActual,
      expected: {
        rejected: true,
        errorName: "Error",
        message: "shell env hook failed",
        calls: ["first", "throws"],
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.shell.env-bridge" as const,
    portID: "process-runner.port" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-shell-env-native-exact-fixture" as const,
    replayRef: "shell-env-native-exact:opencode" as const,
    fixtureID: "opencode-shell-env:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "anomalyco/opencode:packages/plugin/src/index.ts#Hooks.shell.env",
      "anomalyco/opencode:packages/opencode/src/session/prompt.ts#SessionPrompt.bash,Plugin.trigger(shell.env),ChildProcess.env",
      "anomalyco/opencode:packages/opencode/src/plugin/index.ts#Plugin.trigger,source-order",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeShellEnvFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeShellEnvNativeExactFixture(
  fixture: OpenCodeShellEnvNativeExactFixture,
): OpenCodeShellEnvNativeExactFixtureVerification {
  const issues: OpenCodeShellEnvNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-shell-env.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.shell.env-bridge" || fixture.portID !== "process-runner.port") {
    add("opencode-shell-env.target", "Fixture must target opencode.shell.env-bridge and process-runner.port.")
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    add("opencode-shell-env.native-claim", "OpenCode shell env fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-shell-env.lossiness", "Native shell env fixture cannot retain known lossiness.")
  }
  for (const source of [
    "packages/plugin/src/index.ts",
    "packages/opencode/src/session/prompt.ts",
    "packages/opencode/src/plugin/index.ts",
  ]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-shell-env.source-ref", `Missing upstream source ref ${source}.`)
  }
  for (const item of fixture.cases) {
    if (!openCodeShellEnvSameJSON(item.actual, item.expected)) {
      add("opencode-shell-env.case", "Case actual output must match expected pinned upstream shell.env behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeShellEnvFingerprintObject(withoutFingerprint)) {
    add("opencode-shell-env.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function openCodeShellEnvStateForHost(host: LegoHookHost): OpenCodeShellEnvState {
  const existing = shellEnvStates.get(host)
  if (existing) return existing
  const state: OpenCodeShellEnvState = { records: [] }
  shellEnvStates.set(host, state)
  return state
}

function openCodeShellEnvHandlerSource(): HookSourceInfo {
  return { id: "opencode.shell-env", scope: "internal", order: -1 }
}

async function openCodeShellEnvHandleEvent(
  event: EventEnvelope,
  state: OpenCodeShellEnvState,
): Promise<{ env: Record<string, string> } | undefined> {
  if (state.records.length === 0) return undefined
  const payload = openCodeShellEnvPayload(event.payload)
  return openCodeShellEnvRun({
    hooks: state.records.map((record) => ({ "shell.env": record.hook })),
    cwd: String(payload.cwd ?? ""),
    ...openCodeShellEnvOptionalString("sessionID", payload.sessionID),
    ...openCodeShellEnvOptionalString("callID", payload.callID),
  })
}

function openCodeShellEnvInput(cwd: string, sessionID?: string, callID?: string): { cwd: string; sessionID?: string; callID?: string } {
  return {
    cwd,
    ...(sessionID ? { sessionID } : {}),
    ...(callID ? { callID } : {}),
  }
}

function openCodeShellEnvPayload(value: unknown): Partial<ShellEnvPayload> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) ? (value as Partial<ShellEnvPayload>) : {}
}

function openCodeShellEnvOptionalString(key: "sessionID" | "callID", value: unknown): Record<"sessionID" | "callID", string> | {} {
  return typeof value === "string" && value.length > 0 ? { [key]: value } as Record<"sessionID" | "callID", string> : {}
}

function openCodeShellEnvSameJSON(left: unknown, right: unknown): boolean {
  return openCodeShellEnvStableJSON(left) === openCodeShellEnvStableJSON(right)
}

function openCodeShellEnvFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeShellEnvStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeShellEnvStableJSON(value: unknown): string {
  return JSON.stringify(openCodeShellEnvSortStable(value))
}

function openCodeShellEnvSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeShellEnvSortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeShellEnvSortStable(entry)]),
  )
}
