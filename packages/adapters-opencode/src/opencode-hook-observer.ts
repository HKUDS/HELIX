import { createHash } from "node:crypto"

export type OpenCodeHookObserverFunction<Event = unknown> = (input: { event: Event }) => void | Promise<void>

export interface OpenCodeHookObserverHookRecord {
  event?: unknown
  [key: string]: unknown
}

export interface OpenCodeHookObserverDescriptor {
  notify<Event>(input: { hooks: OpenCodeHookObserverHookRecord[]; event: Event }): void
}

export interface OpenCodeHookObserverNativeExactFixtureCase {
  id: "source-order-fire-and-forget" | "nullish-observer-skip" | "truthy-non-function-error"
  actual: unknown
  expected: unknown
}

export interface OpenCodeHookObserverNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.hook.observer-adapter"
  portID: "hook.observer-chain"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-hook-observer-native-exact-fixture"
  replayRef: "hook-observer-native-exact:opencode"
  fixtureID: "opencode-hook-observer:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeHookObserverNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeHookObserverNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeHookObserverNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeHookObserverNativeExactFixtureIssue[]
}

export function createOpenCodeHookObserver(): OpenCodeHookObserverDescriptor {
  return {
    notify: openCodeHookObserverNotify,
  }
}

export function openCodeHookObserverNotify<Event>(input: { hooks: OpenCodeHookObserverHookRecord[]; event: Event }): void {
  for (const hook of input.hooks) {
    const fn = hook.event as OpenCodeHookObserverFunction<Event> | null | undefined
    if (fn == null) continue
    void fn({ event: input.event })
  }
}

export async function captureOpenCodeHookObserverNativeExactFixture(): Promise<OpenCodeHookObserverNativeExactFixture> {
  const descriptor = createOpenCodeHookObserver()

  const event = { type: "session.updated", properties: { sessionID: "session-1" } }
  const calls: string[] = []
  const payloads: unknown[] = []
  const notifyResult = descriptor.notify({
    hooks: [
      {
        event: async (input: { event: typeof event }) => {
          calls.push("first:start")
          payloads.push({
            eventType: input.event.type,
            sameEventReference: input.event === event,
          })
          await Promise.resolve()
          calls.push("first:after-await")
        },
      },
      {
        "chat.message": async () => {
          calls.push("wrong-hook")
        },
      },
      {
        event: (input: { event: typeof event }) => {
          calls.push("second")
          payloads.push({
            eventType: input.event.type,
            sameEventReference: input.event === event,
          })
        },
      },
    ],
    event,
  })
  const immediateCalls = [...calls]
  await Promise.resolve()
  const afterMicrotaskCalls = [...calls]

  const nullishCalls: string[] = []
  descriptor.notify({
    hooks: [{}, { event: undefined }, { event: null }, { event: () => nullishCalls.push("called") }],
    event: { type: "noop" },
  })

  let truthyNonFunctionActual: unknown
  try {
    descriptor.notify({
      hooks: [{ event: { not: "a-function" } }],
      event: { type: "bad-hook" },
    })
    truthyNonFunctionActual = { rejected: false }
  } catch (error) {
    truthyNonFunctionActual = {
      rejected: true,
      errorName: error instanceof Error ? error.name : typeof error,
      messageIncludesNotFunction: error instanceof Error ? error.message.includes("fn is not a function") : false,
    }
  }

  const cases: OpenCodeHookObserverNativeExactFixtureCase[] = [
    {
      id: "source-order-fire-and-forget",
      actual: {
        notifyResult,
        immediateCalls,
        afterMicrotaskCalls,
        payloads,
      },
      expected: {
        notifyResult: undefined,
        immediateCalls: ["first:start", "second"],
        afterMicrotaskCalls: ["first:start", "second", "first:after-await"],
        payloads: [
          { eventType: "session.updated", sameEventReference: true },
          { eventType: "session.updated", sameEventReference: true },
        ],
      },
    },
    {
      id: "nullish-observer-skip",
      actual: { calls: nullishCalls },
      expected: { calls: ["called"] },
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
    atomID: "opencode.hook.observer-adapter" as const,
    portID: "hook.observer-chain" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-hook-observer-native-exact-fixture" as const,
    replayRef: "hook-observer-native-exact:opencode" as const,
    fixtureID: "opencode-hook-observer:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "anomalyco/opencode:packages/opencode/src/plugin/index.ts#bus.subscribeAll,hook.event",
      "anomalyco/opencode:packages/plugin/src/index.ts#Hooks.event",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeHookObserverFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeHookObserverNativeExactFixture(
  fixture: OpenCodeHookObserverNativeExactFixture,
): OpenCodeHookObserverNativeExactFixtureVerification {
  const issues: OpenCodeHookObserverNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-hook-observer.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.hook.observer-adapter" || fixture.portID !== "hook.observer-chain") {
    add("opencode-hook-observer.target", "Fixture must target opencode.hook.observer-adapter and hook.observer-chain.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-hook-observer.native-claim", "Hook observer fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-hook-observer.lossiness", "Native hook observer fixture cannot retain known lossiness.")
  }
  for (const source of ["packages/opencode/src/plugin/index.ts", "packages/plugin/src/index.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-hook-observer.source-ref", `Missing upstream source ref ${source}.`)
  }
  for (const item of fixture.cases) {
    if (!openCodeHookObserverSameJSON(item.actual, item.expected)) {
      add("opencode-hook-observer.case", "Case actual output must match expected pinned upstream event observer behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeHookObserverFingerprintObject(withoutFingerprint)) {
    add("opencode-hook-observer.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function openCodeHookObserverSameJSON(left: unknown, right: unknown): boolean {
  return openCodeHookObserverStableJSON(left) === openCodeHookObserverStableJSON(right)
}

function openCodeHookObserverFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeHookObserverStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeHookObserverStableJSON(value: unknown): string {
  return JSON.stringify(openCodeHookObserverSortStable(value))
}

function openCodeHookObserverSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeHookObserverSortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeHookObserverSortStable(entry)]),
  )
}
