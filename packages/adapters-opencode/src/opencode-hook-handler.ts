import { createHash } from "node:crypto"

export type OpenCodeHookHandlerFunction<Input = unknown, Output = unknown> = (
  input: Input,
  output: Output,
) => void | Promise<void>

export type OpenCodeHookHandlerRecord = Record<string, unknown>

export interface OpenCodeHookHandlerDescriptor {
  run<Input, Output>(input: {
    hooks: OpenCodeHookHandlerRecord[]
    name: string
    input: Input
    output: Output
  }): Promise<Output>
}

export interface OpenCodeHookHandlerNativeExactFixtureCase {
  id: "mutable-output-source-order" | "falsey-handler-skip" | "fail-fast-handler-error"
  actual: unknown
  expected: unknown
}

export interface OpenCodeHookHandlerNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.hook.handler-adapter"
  portID: "hook.handler-chain"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-hook-handler-native-exact-fixture"
  replayRef: "hook-handler-native-exact:opencode"
  fixtureID: "opencode-hook-handler:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeHookHandlerNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeHookHandlerNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeHookHandlerNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeHookHandlerNativeExactFixtureIssue[]
}

export function createOpenCodeHookHandler(): OpenCodeHookHandlerDescriptor {
  return {
    run: openCodeHookHandlerRun,
  }
}

export async function openCodeHookHandlerRun<Input, Output>(input: {
  hooks: OpenCodeHookHandlerRecord[]
  name: string
  input: Input
  output: Output
}): Promise<Output> {
  for (const hook of input.hooks) {
    const fn = hook[input.name] as OpenCodeHookHandlerFunction<Input, Output> | undefined
    if (!fn) continue
    await fn(input.input, input.output)
  }
  return input.output
}

export async function captureOpenCodeHookHandlerNativeExactFixture(): Promise<OpenCodeHookHandlerNativeExactFixture> {
  const descriptor = createOpenCodeHookHandler()

  const handlerCalls: string[] = []
  const handlerOutput = {
    message: { role: "user", content: "initial" },
    parts: [] as Array<{ type: string; text: string }>,
  }
  const handlerReturned = await descriptor.run({
    hooks: [
      {
        "chat.message": async (input: { sessionID: string }, output: typeof handlerOutput) => {
          handlerCalls.push(`first:${input.sessionID}`)
          output.message.content = "first"
          output.parts.push({ type: "text", text: "first" })
        },
      },
      {
        "chat.params": async () => {
          handlerCalls.push("wrong-hook")
        },
      },
      {
        "chat.message": async (_input: { sessionID: string }, output: typeof handlerOutput) => {
          handlerCalls.push("second")
          output.message.content = "second"
          output.parts.push({ type: "text", text: "second" })
        },
      },
    ],
    name: "chat.message",
    input: { sessionID: "session-1" },
    output: handlerOutput,
  })

  const falseyCalls: string[] = []
  const falseyOutput = { args: { keep: true } as Record<string, unknown> }
  const falseyReturned = await descriptor.run({
    hooks: [
      { "tool.execute.before": false },
      { "tool.execute.before": 0 },
      { "tool.execute.before": null },
      { "tool.execute.before": undefined },
      {
        "tool.execute.before": async (_input: unknown, output: typeof falseyOutput) => {
          falseyCalls.push("called")
          output.args = { keep: true, updated: true }
        },
      },
    ],
    name: "tool.execute.before",
    input: { tool: "shell" },
    output: falseyOutput,
  })

  const errorCalls: string[] = []
  const errorOutput = { headers: {} as Record<string, string> }
  let errorActual: unknown
  try {
    await descriptor.run({
      hooks: [
        {
          "chat.headers": async (_input: unknown, output: typeof errorOutput) => {
            errorCalls.push("before")
            output.headers["x-before"] = "1"
          },
        },
        {
          "chat.headers": async () => {
            errorCalls.push("throws")
            throw new Error("handler failed")
          },
        },
        {
          "chat.headers": async () => {
            errorCalls.push("after")
          },
        },
      ],
      name: "chat.headers",
      input: { sessionID: "session-1" },
      output: errorOutput,
    })
    errorActual = { rejected: false, calls: errorCalls, output: errorOutput }
  } catch (error) {
    errorActual = {
      rejected: true,
      errorName: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      calls: errorCalls,
      output: errorOutput,
    }
  }

  const cases: OpenCodeHookHandlerNativeExactFixtureCase[] = [
    {
      id: "mutable-output-source-order",
      actual: {
        calls: handlerCalls,
        output: handlerOutput,
        returnedSameReference: handlerReturned === handlerOutput,
      },
      expected: {
        calls: ["first:session-1", "second"],
        output: {
          message: { role: "user", content: "second" },
          parts: [
            { type: "text", text: "first" },
            { type: "text", text: "second" },
          ],
        },
        returnedSameReference: true,
      },
    },
    {
      id: "falsey-handler-skip",
      actual: {
        calls: falseyCalls,
        output: falseyOutput,
        returnedSameReference: falseyReturned === falseyOutput,
      },
      expected: {
        calls: ["called"],
        output: { args: { keep: true, updated: true } },
        returnedSameReference: true,
      },
    },
    {
      id: "fail-fast-handler-error",
      actual: errorActual,
      expected: {
        rejected: true,
        errorName: "Error",
        message: "handler failed",
        calls: ["before", "throws"],
        output: { headers: { "x-before": "1" } },
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.hook.handler-adapter" as const,
    portID: "hook.handler-chain" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-hook-handler-native-exact-fixture" as const,
    replayRef: "hook-handler-native-exact:opencode" as const,
    fixtureID: "opencode-hook-handler:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "anomalyco/opencode:packages/opencode/src/plugin/index.ts#Plugin.trigger,TriggerName",
      "anomalyco/opencode:packages/plugin/src/index.ts#Hooks.chat.message,Hooks.chat.headers,Hooks.tool.execute.before",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeHookHandlerFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeHookHandlerNativeExactFixture(
  fixture: OpenCodeHookHandlerNativeExactFixture,
): OpenCodeHookHandlerNativeExactFixtureVerification {
  const issues: OpenCodeHookHandlerNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-hook-handler.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.hook.handler-adapter" || fixture.portID !== "hook.handler-chain") {
    add("opencode-hook-handler.target", "Fixture must target opencode.hook.handler-adapter and hook.handler-chain.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-hook-handler.native-claim", "Hook handler fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-hook-handler.lossiness", "Native hook handler fixture cannot retain known lossiness.")
  }
  for (const source of ["packages/opencode/src/plugin/index.ts", "packages/plugin/src/index.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-hook-handler.source-ref", `Missing upstream source ref ${source}.`)
  }
  for (const item of fixture.cases) {
    if (!openCodeHookHandlerSameJSON(item.actual, item.expected)) {
      add("opencode-hook-handler.case", "Case actual output must match expected pinned upstream Plugin.trigger handler behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeHookHandlerFingerprintObject(withoutFingerprint)) {
    add("opencode-hook-handler.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function openCodeHookHandlerSameJSON(left: unknown, right: unknown): boolean {
  return openCodeHookHandlerStableJSON(left) === openCodeHookHandlerStableJSON(right)
}

function openCodeHookHandlerFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeHookHandlerStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeHookHandlerStableJSON(value: unknown): string {
  return JSON.stringify(openCodeHookHandlerSortStable(value))
}

function openCodeHookHandlerSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeHookHandlerSortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeHookHandlerSortStable(entry)]),
  )
}
