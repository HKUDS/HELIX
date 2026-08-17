import { createHash } from "node:crypto"

export type OpenCodeHookSchedulerHookFunction<Input = unknown, Output = unknown> = (
  input: Input,
  output: Output,
) => void | Promise<void>

export type OpenCodeHookSchedulerHookRecord = Record<string, unknown>

export interface OpenCodeHookSchedulerDescriptor {
  list<T extends OpenCodeHookSchedulerHookRecord>(hooks: T[]): T[]
  trigger<Input, Output>(input: {
    hooks: OpenCodeHookSchedulerHookRecord[]
    name: string
    input: Input
    output: Output
  }): Promise<Output>
}

export interface OpenCodeHookSchedulerNativeExactFixtureCase {
  id:
    | "source-order-output-mutation"
    | "awaited-async-boundary-source-order"
    | "timer-await-source-order"
    | "empty-name-noop"
    | "list-readback"
    | "error-propagation"
    | "truthy-non-function-error"
  actual: unknown
  expected: unknown
}

export interface OpenCodeHookSchedulerNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.hook.scheduler-defaults"
  portID: "hook.scheduler"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-hook-scheduler-native-exact-fixture"
  replayRef: "hook-scheduler-native-exact:opencode"
  fixtureID: "opencode-hook-scheduler:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeHookSchedulerNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeHookSchedulerNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeHookSchedulerNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeHookSchedulerNativeExactFixtureIssue[]
}

export function createOpenCodeHookScheduler(): OpenCodeHookSchedulerDescriptor {
  return {
    list: openCodeHookSchedulerList,
    trigger: openCodeHookSchedulerTrigger,
  }
}

export function openCodeHookSchedulerList<T extends OpenCodeHookSchedulerHookRecord>(hooks: T[]): T[] {
  return hooks
}

export async function openCodeHookSchedulerTrigger<Input, Output>(input: {
  hooks: OpenCodeHookSchedulerHookRecord[]
  name: string
  input: Input
  output: Output
}): Promise<Output> {
  if (!input.name) return input.output
  for (const hook of input.hooks) {
    const fn = hook[input.name] as OpenCodeHookSchedulerHookFunction<Input, Output> | undefined
    if (!fn) continue
    await fn(input.input, input.output)
  }
  return input.output
}

export async function captureOpenCodeHookSchedulerNativeExactFixture(): Promise<OpenCodeHookSchedulerNativeExactFixture> {
  const descriptor = createOpenCodeHookScheduler()

  const orderedCalls: string[] = []
  const orderedOutput = {
    temperature: 0,
    options: {} as Record<string, unknown>,
  }
  const orderedReturned = await descriptor.trigger({
    hooks: [
      {
        "chat.params": async (input: { sessionID: string; value: string }, output: typeof orderedOutput) => {
          orderedCalls.push(`first:${input.sessionID}`)
          output.options.first = input.value
        },
      },
      {
        "tool.execute.before": async () => {
          orderedCalls.push("wrong-hook")
        },
      },
      {
        "chat.params": async (_input: { sessionID: string; value: string }, output: typeof orderedOutput) => {
          orderedCalls.push("second")
          output.temperature += 0.25
          output.options.second = true
        },
      },
    ],
    name: "chat.params",
    input: { sessionID: "session-1", value: "from-input" },
    output: orderedOutput,
  })

  const asyncBoundaryCalls: string[] = []
  const asyncBoundaryOutput = {
    sequence: [] as string[],
    ready: false,
  }
  const asyncBoundaryPromise = descriptor.trigger({
    hooks: [
      {
        "tool.execute.before": async (_input: unknown, output: typeof asyncBoundaryOutput) => {
          asyncBoundaryCalls.push("first:start")
          output.sequence.push("first:start")
          await Promise.resolve()
          output.ready = true
          output.sequence.push("first:after-await")
          asyncBoundaryCalls.push("first:after-await")
        },
      },
      {
        "tool.execute.before": async (_input: unknown, output: typeof asyncBoundaryOutput) => {
          asyncBoundaryCalls.push(`second:ready:${String(output.ready)}`)
          output.sequence.push(`second:ready:${String(output.ready)}`)
        },
      },
    ],
    name: "tool.execute.before",
    input: { tool: "shell" },
    output: asyncBoundaryOutput,
  })
  const asyncBoundaryImmediate = {
    calls: [...asyncBoundaryCalls],
    output: { sequence: [...asyncBoundaryOutput.sequence], ready: asyncBoundaryOutput.ready },
  }
  await Promise.resolve()
  const asyncBoundaryAfterOneMicrotask = {
    calls: [...asyncBoundaryCalls],
    output: { sequence: [...asyncBoundaryOutput.sequence], ready: asyncBoundaryOutput.ready },
  }
  const asyncBoundaryReturned = await asyncBoundaryPromise

  const timerCalls: string[] = []
  const timerOutput = {
    sequence: [] as string[],
    timerDone: false,
  }
  const timerPromise = descriptor.trigger({
    hooks: [
      {
        "chat.params": async (_input: unknown, output: typeof timerOutput) => {
          timerCalls.push("first:start")
          output.sequence.push("first:start")
          await openCodeHookSchedulerDelay(10)
          output.timerDone = true
          output.sequence.push("first:after-timer")
          timerCalls.push("first:after-timer")
        },
      },
      {
        "chat.params": async (_input: unknown, output: typeof timerOutput) => {
          timerCalls.push(`second:timerDone:${String(output.timerDone)}`)
          output.sequence.push(`second:timerDone:${String(output.timerDone)}`)
        },
      },
    ],
    name: "chat.params",
    input: { sessionID: "session-1" },
    output: timerOutput,
  })
  const timerImmediate = {
    calls: [...timerCalls],
    output: { sequence: [...timerOutput.sequence], timerDone: timerOutput.timerDone },
  }
  await Promise.resolve()
  const timerAfterOneMicrotask = {
    calls: [...timerCalls],
    output: { sequence: [...timerOutput.sequence], timerDone: timerOutput.timerDone },
  }
  const timerReturned = await timerPromise

  const emptyNameCalls: string[] = []
  const emptyNameOutput = { status: "ask" as const }
  const emptyNameReturned = await descriptor.trigger({
    hooks: [
      {
        "permission.ask": async () => {
          emptyNameCalls.push("called")
        },
      },
    ],
    name: "",
    input: { id: "permission-1" },
    output: emptyNameOutput,
  })

  const listHooks = [{ "shell.env": async () => undefined }, { event: async () => undefined }]
  const listedHooks = descriptor.list(listHooks)

  const errorCalls: string[] = []
  const errorOutput = { steps: [] as string[] }
  let errorActual: unknown
  try {
    await descriptor.trigger({
      hooks: [
        {
          "tool.execute.before": async (_input: unknown, output: typeof errorOutput) => {
            errorCalls.push("before")
            output.steps.push("before")
          },
        },
        {
          "tool.execute.before": async () => {
            errorCalls.push("throws")
            throw new Error("plugin hook failed")
          },
        },
        {
          "tool.execute.before": async () => {
            errorCalls.push("after")
          },
        },
      ],
      name: "tool.execute.before",
      input: { tool: "shell" },
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

  let truthyNonFunctionActual: unknown
  try {
    await descriptor.trigger({
      hooks: [{ "chat.message": { not: "a-function" } }],
      name: "chat.message",
      input: { sessionID: "session-1" },
      output: { message: "unchanged" },
    })
    truthyNonFunctionActual = { rejected: false }
  } catch (error) {
    truthyNonFunctionActual = {
      rejected: true,
      errorName: error instanceof Error ? error.name : typeof error,
      messageIncludesNotFunction: error instanceof Error ? error.message.includes("fn is not a function") : false,
    }
  }

  const cases: OpenCodeHookSchedulerNativeExactFixtureCase[] = [
    {
      id: "source-order-output-mutation",
      actual: {
        calls: orderedCalls,
        output: orderedOutput,
        returnedSameReference: orderedReturned === orderedOutput,
      },
      expected: {
        calls: ["first:session-1", "second"],
        output: {
          temperature: 0.25,
          options: {
            first: "from-input",
            second: true,
          },
        },
        returnedSameReference: true,
      },
    },
    {
      id: "awaited-async-boundary-source-order",
      actual: {
        immediate: asyncBoundaryImmediate,
        afterOneMicrotask: asyncBoundaryAfterOneMicrotask,
        final: {
          calls: asyncBoundaryCalls,
          output: asyncBoundaryOutput,
          returnedSameReference: asyncBoundaryReturned === asyncBoundaryOutput,
        },
      },
      expected: {
        immediate: {
          calls: ["first:start"],
          output: { sequence: ["first:start"], ready: false },
        },
        afterOneMicrotask: {
          calls: ["first:start", "first:after-await"],
          output: { sequence: ["first:start", "first:after-await"], ready: true },
        },
        final: {
          calls: ["first:start", "first:after-await", "second:ready:true"],
          output: { sequence: ["first:start", "first:after-await", "second:ready:true"], ready: true },
          returnedSameReference: true,
        },
      },
    },
    {
      id: "timer-await-source-order",
      actual: {
        immediate: timerImmediate,
        afterOneMicrotask: timerAfterOneMicrotask,
        final: {
          calls: timerCalls,
          output: timerOutput,
          returnedSameReference: timerReturned === timerOutput,
        },
      },
      expected: {
        immediate: {
          calls: ["first:start"],
          output: { sequence: ["first:start"], timerDone: false },
        },
        afterOneMicrotask: {
          calls: ["first:start"],
          output: { sequence: ["first:start"], timerDone: false },
        },
        final: {
          calls: ["first:start", "first:after-timer", "second:timerDone:true"],
          output: { sequence: ["first:start", "first:after-timer", "second:timerDone:true"], timerDone: true },
          returnedSameReference: true,
        },
      },
    },
    {
      id: "empty-name-noop",
      actual: {
        calls: emptyNameCalls,
        output: emptyNameOutput,
        returnedSameReference: emptyNameReturned === emptyNameOutput,
      },
      expected: {
        calls: [],
        output: { status: "ask" },
        returnedSameReference: true,
      },
    },
    {
      id: "list-readback",
      actual: {
        returnedSameReference: listedHooks === listHooks,
        length: listedHooks.length,
        hookKeys: listedHooks.map((hook) => Object.keys(hook)),
      },
      expected: {
        returnedSameReference: true,
        length: 2,
        hookKeys: [["shell.env"], ["event"]],
      },
    },
    {
      id: "error-propagation",
      actual: errorActual,
      expected: {
        rejected: true,
        errorName: "Error",
        message: "plugin hook failed",
        calls: ["before", "throws"],
        output: { steps: ["before"] },
      },
    },
    {
      id: "truthy-non-function-error",
      actual: truthyNonFunctionActual,
      expected: {
        rejected: true,
        errorName: "TypeError",
        messageIncludesNotFunction: true,
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.hook.scheduler-defaults" as const,
    portID: "hook.scheduler" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-hook-scheduler-native-exact-fixture" as const,
    replayRef: "hook-scheduler-native-exact:opencode" as const,
    fixtureID: "opencode-hook-scheduler:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "anomalyco/opencode:packages/opencode/src/plugin/index.ts#Plugin.trigger,Plugin.list",
      "anomalyco/opencode:packages/plugin/src/index.ts#Hooks,TriggerName",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeHookSchedulerFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeHookSchedulerNativeExactFixture(
  fixture: OpenCodeHookSchedulerNativeExactFixture,
): OpenCodeHookSchedulerNativeExactFixtureVerification {
  const issues: OpenCodeHookSchedulerNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-hook-scheduler.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.hook.scheduler-defaults" || fixture.portID !== "hook.scheduler") {
    add("opencode-hook-scheduler.target", "Fixture must target opencode.hook.scheduler-defaults and hook.scheduler.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-hook-scheduler.native-claim", "Hook scheduler fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-hook-scheduler.lossiness", "Native hook scheduler fixture cannot retain known lossiness.")
  }
  for (const source of ["packages/opencode/src/plugin/index.ts", "packages/plugin/src/index.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-hook-scheduler.source-ref", `Missing upstream source ref ${source}.`)
  }
  for (const item of fixture.cases) {
    if (!openCodeHookSchedulerSameJSON(item.actual, item.expected)) {
      add("opencode-hook-scheduler.case", "Case actual output must match expected pinned upstream Plugin.trigger/list behavior.", item.id)
    }
  }
  if (!fixture.cases.some((item) => item.id === "timer-await-source-order")) {
    add("opencode-hook-scheduler.timer-await", "Fixture must prove real timer Promise waits block later hooks in source order.", "timer-await-source-order")
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeHookSchedulerFingerprintObject(withoutFingerprint)) {
    add("opencode-hook-scheduler.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function openCodeHookSchedulerSameJSON(left: unknown, right: unknown): boolean {
  return openCodeHookSchedulerStableJSON(left) === openCodeHookSchedulerStableJSON(right)
}

function openCodeHookSchedulerDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function openCodeHookSchedulerFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeHookSchedulerStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeHookSchedulerStableJSON(value: unknown): string {
  return JSON.stringify(openCodeHookSchedulerSortStable(value))
}

function openCodeHookSchedulerSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeHookSchedulerSortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeHookSchedulerSortStable(entry)]),
  )
}
