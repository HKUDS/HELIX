import { createHash } from "node:crypto"
import { LegoHookHost, type HookError } from "@helix/lego-hooks"

export interface OpenCodeHookErrorDefaults {
  readonly errorMode: "throw"
  createHost(input?: OpenCodeHookErrorHostInput): LegoHookHost
}

export interface OpenCodeHookErrorHostInput {
  onError?: (error: HookError) => void
}

export interface OpenCodeHookErrorDefaultsNativeExactFixtureCase {
  id: "handler-fail-fast" | "observer-fail-fast"
  actual: unknown
  expected: unknown
}

export interface OpenCodeHookErrorDefaultsNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.hook.error-defaults"
  portID: "hook.error-policy"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-hook-error-defaults-native-exact-fixture"
  replayRef: "hook-error-defaults-native-exact:opencode"
  fixtureID: "opencode-hook-error-defaults:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeHookErrorDefaultsNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeHookErrorDefaultsNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeHookErrorDefaultsNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeHookErrorDefaultsNativeExactFixtureIssue[]
}

export function createOpenCodeHookErrorDefaults(): OpenCodeHookErrorDefaults {
  return {
    errorMode: "throw",
    createHost: createOpenCodeHookHost,
  }
}

export function createOpenCodeHookHost(input: OpenCodeHookErrorHostInput = {}): LegoHookHost {
  return new LegoHookHost({ errorMode: "throw", ...(input.onError ? { onError: input.onError } : {}) })
}

export async function captureOpenCodeHookErrorDefaultsNativeExactFixture(): Promise<OpenCodeHookErrorDefaultsNativeExactFixture> {
  const defaults = createOpenCodeHookErrorDefaults()

  const handlerCalls: string[] = []
  const handlerErrors: string[] = []
  const handlerHost = defaults.createHost({
    onError(error) {
      handlerErrors.push(error.error instanceof Error ? error.error.message : String(error.error))
    },
  })
  const handlerFirst = handlerHost.createScope({ id: "handler-first", scope: "project", order: 0 })
  const handlerSecond = handlerHost.createScope({ id: "handler-second", scope: "project", order: 1 })
  handlerFirst.on("input", async () => {
    handlerCalls.push("first")
    throw new Error("handler failed")
  })
  handlerSecond.on("input", async () => {
    handlerCalls.push("second")
  })
  let handlerActual: unknown
  try {
    await handlerHost.emit({ type: "input", timestamp: 1, payload: { text: "hello", source: "interactive" } })
    handlerActual = { rejected: false, calls: handlerCalls, errors: handlerErrors }
  } catch (error) {
    handlerActual = {
      rejected: true,
      errorName: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      calls: handlerCalls,
      errors: handlerErrors,
    }
  }

  const observerCalls: string[] = []
  const observerErrors: string[] = []
  const observerHost = defaults.createHost({
    onError(error) {
      observerErrors.push(error.error instanceof Error ? error.error.message : String(error.error))
    },
  })
  const observerFirst = observerHost.createScope({ id: "observer-first", scope: "project", order: 0 })
  const observerSecond = observerHost.createScope({ id: "observer-second", scope: "project", order: 1 })
  observerFirst.observe(async () => {
    observerCalls.push("first")
    throw new Error("observer failed")
  })
  observerSecond.observe(async () => {
    observerCalls.push("second")
  })
  let observerActual: unknown
  try {
    await observerHost.emit({ type: "input", timestamp: 2, payload: { text: "hello", source: "interactive" } })
    observerActual = { rejected: false, calls: observerCalls, errors: observerErrors }
  } catch (error) {
    observerActual = {
      rejected: true,
      errorName: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      calls: observerCalls,
      errors: observerErrors,
    }
  }

  const cases: OpenCodeHookErrorDefaultsNativeExactFixtureCase[] = [
    {
      id: "handler-fail-fast",
      actual: handlerActual,
      expected: {
        rejected: true,
        errorName: "Error",
        message: "handler failed",
        calls: ["first"],
        errors: ["handler failed"],
      },
    },
    {
      id: "observer-fail-fast",
      actual: observerActual,
      expected: {
        rejected: true,
        errorName: "Error",
        message: "observer failed",
        calls: ["first"],
        errors: ["observer failed"],
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.hook.error-defaults" as const,
    portID: "hook.error-policy" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-hook-error-defaults-native-exact-fixture" as const,
    replayRef: "hook-error-defaults-native-exact:opencode" as const,
    fixtureID: "opencode-hook-error-defaults:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "anomalyco/opencode:packages/opencode/src/plugin/index.ts#Plugin.trigger",
      "anomalyco/opencode:packages/plugin/src/index.ts#Hooks",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeHookErrorDefaultsFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeHookErrorDefaultsNativeExactFixture(
  fixture: OpenCodeHookErrorDefaultsNativeExactFixture,
): OpenCodeHookErrorDefaultsNativeExactFixtureVerification {
  const issues: OpenCodeHookErrorDefaultsNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-hook-error-defaults.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.hook.error-defaults" || fixture.portID !== "hook.error-policy") {
    add("opencode-hook-error-defaults.target", "Fixture must target opencode.hook.error-defaults and hook.error-policy.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-hook-error-defaults.native-claim", "Hook error defaults fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-hook-error-defaults.lossiness", "Native hook error defaults fixture cannot retain known lossiness.")
  }
  for (const source of ["packages/opencode/src/plugin/index.ts", "packages/plugin/src/index.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-hook-error-defaults.source-ref", `Missing upstream source ref ${source}.`)
  }
  for (const item of fixture.cases) {
    if (!openCodeHookErrorDefaultsSameJSON(item.actual, item.expected)) {
      add("opencode-hook-error-defaults.case", "Case actual output must match expected pinned upstream fail-fast hook behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeHookErrorDefaultsFingerprintObject(withoutFingerprint)) {
    add("opencode-hook-error-defaults.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function openCodeHookErrorDefaultsSameJSON(left: unknown, right: unknown): boolean {
  return openCodeHookErrorDefaultsStableJSON(left) === openCodeHookErrorDefaultsStableJSON(right)
}

function openCodeHookErrorDefaultsFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeHookErrorDefaultsStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeHookErrorDefaultsStableJSON(value: unknown): string {
  return JSON.stringify(openCodeHookErrorDefaultsSortStable(value))
}

function openCodeHookErrorDefaultsSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeHookErrorDefaultsSortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeHookErrorDefaultsSortStable(entry)]),
  )
}
