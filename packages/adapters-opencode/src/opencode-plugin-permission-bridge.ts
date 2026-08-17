import { createHash } from "node:crypto"
import { LegoHookHost, type HookScope } from "@helix/lego-hooks"
import type { OpenCodeHooks } from "./plugin-adapter"

export type OpenCodePluginPermissionStatus = "ask" | "deny" | "allow"

export interface OpenCodePluginPermissionBridgeRegistrationInput {
  scope: HookScope
  hooks: OpenCodeHooks
}

export interface OpenCodeNativePluginPermissionBridge {
  register(input: OpenCodePluginPermissionBridgeRegistrationInput): void
}

export interface OpenCodePluginPermissionBridgeNativeExactFixtureCase {
  id: "default-ask-without-hook" | "source-order-output-mutation" | "fail-fast-hook-error"
  actual: unknown
  expected: unknown
}

export interface OpenCodePluginPermissionBridgeNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.plugin.permission-bridge"
  coveredAtomIDs: Array<"opencode.plugin.permission-bridge" | "opencode.permission.ask-bridge">
  portID: "tool.permission-policy"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-plugin-permission-bridge-native-exact-fixture"
  replayRef: "plugin-permission-bridge-native-exact:opencode"
  fixtureID: "opencode-plugin-permission-bridge:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodePluginPermissionBridgeNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodePluginPermissionBridgeNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodePluginPermissionBridgeNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodePluginPermissionBridgeNativeExactFixtureIssue[]
}

export function createOpenCodeNativePluginPermissionBridge(): OpenCodeNativePluginPermissionBridge {
  return {
    register({ scope, hooks }) {
      if (!hooks["permission.ask"]) return
      scope.on("permission.ask", async (event) => {
        const output: { status: OpenCodePluginPermissionStatus } = { status: "ask" }
        await hooks["permission.ask"]?.(permissionPayload(event.payload), output)
        return output
      })
    },
  }
}

export const createOpenCodePluginPermissionBridge = createOpenCodeNativePluginPermissionBridge

export async function captureOpenCodePluginPermissionBridgeNativeExactFixture(): Promise<OpenCodePluginPermissionBridgeNativeExactFixture> {
  const bridge = createOpenCodeNativePluginPermissionBridge()

  const noHookHost = new LegoHookHost({ errorMode: "throw" })
  const noHookScope = noHookHost.createScope({ id: "no-hook", scope: "project" })
  bridge.register({ scope: noHookScope, hooks: {} })
  const noHookResult = await noHookHost.emit({
    type: "permission.ask",
    timestamp: 1,
    payload: { permission: "bash", patterns: ["git status"], sessionID: "ses_default" },
  })

  const orderedHost = new LegoHookHost({ errorMode: "throw" })
  const firstScope = orderedHost.createScope({ id: "first", scope: "project", order: 0 })
  const secondScope = orderedHost.createScope({ id: "second", scope: "project", order: 1 })
  const calls: string[] = []
  bridge.register({
    scope: firstScope,
    hooks: {
      "permission.ask": async (input: Record<string, unknown>, output: { status: OpenCodePluginPermissionStatus }) => {
        calls.push(`first:${String(input["permission"])}`)
        output.status = "deny"
      },
    },
  })
  bridge.register({
    scope: secondScope,
    hooks: {
      "permission.ask": async (input: Record<string, unknown>, output: { status: OpenCodePluginPermissionStatus }) => {
        calls.push(`second:${String(input["sessionID"])}`)
        output.status = "allow"
      },
    },
  })
  const orderedPayload = { permission: "edit", patterns: ["src/index.ts"], sessionID: "ses_ordered" }
  const orderedResult = await orderedHost.emit({
    type: "permission.ask",
    timestamp: 2,
    payload: orderedPayload,
  })

  const errorHost = new LegoHookHost({ errorMode: "throw" })
  const errorFirst = errorHost.createScope({ id: "error-first", scope: "project", order: 0 })
  const errorSecond = errorHost.createScope({ id: "error-second", scope: "project", order: 1 })
  const errorCalls: string[] = []
  bridge.register({
    scope: errorFirst,
    hooks: {
      "permission.ask": async (_input: Record<string, unknown>, output: { status: OpenCodePluginPermissionStatus }) => {
        errorCalls.push("before")
        output.status = "deny"
      },
    },
  })
  bridge.register({
    scope: errorSecond,
    hooks: {
      "permission.ask": async () => {
        errorCalls.push("throws")
        throw new Error("permission hook failed")
      },
    },
  })
  let errorActual: unknown
  try {
    await errorHost.emit({
      type: "permission.ask",
      timestamp: 3,
      payload: { permission: "bash", patterns: ["rm -rf"], sessionID: "ses_error" },
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

  const cases: OpenCodePluginPermissionBridgeNativeExactFixtureCase[] = [
    {
      id: "default-ask-without-hook",
      actual: noHookResult,
      expected: undefined,
    },
    {
      id: "source-order-output-mutation",
      actual: {
        calls,
        result: orderedResult,
        payloadAfterEmit: orderedPayload,
      },
      expected: {
        calls: ["first:edit", "second:ses_ordered"],
        result: { status: "allow" },
        payloadAfterEmit: { permission: "edit", patterns: ["src/index.ts"], sessionID: "ses_ordered" },
      },
    },
    {
      id: "fail-fast-hook-error",
      actual: errorActual,
      expected: {
        rejected: true,
        errorName: "Error",
        message: "permission hook failed",
        calls: ["before", "throws"],
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.plugin.permission-bridge" as const,
    coveredAtomIDs: ["opencode.plugin.permission-bridge", "opencode.permission.ask-bridge"] as Array<"opencode.plugin.permission-bridge" | "opencode.permission.ask-bridge">,
    portID: "tool.permission-policy" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-plugin-permission-bridge-native-exact-fixture" as const,
    replayRef: "plugin-permission-bridge-native-exact:opencode" as const,
    fixtureID: "opencode-plugin-permission-bridge:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "anomalyco/opencode:packages/opencode/src/plugin/index.ts#Plugin.trigger",
      "anomalyco/opencode:packages/plugin/src/index.ts#Hooks.permission.ask",
      "anomalyco/opencode:packages/opencode/src/permission/index.ts#Permission.Event.Asked,Permission.ask",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodePluginPermissionBridgeFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodePluginPermissionBridgeNativeExactFixture(
  fixture: OpenCodePluginPermissionBridgeNativeExactFixture,
): OpenCodePluginPermissionBridgeNativeExactFixtureVerification {
  const issues: OpenCodePluginPermissionBridgeNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-plugin-permission-bridge.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.plugin.permission-bridge" || fixture.portID !== "tool.permission-policy") {
    add("opencode-plugin-permission-bridge.target", "Fixture must target opencode.plugin.permission-bridge and tool.permission-policy.")
  }
  for (const atomID of ["opencode.plugin.permission-bridge", "opencode.permission.ask-bridge"] as const) {
    if (!fixture.coveredAtomIDs.includes(atomID)) add("opencode-plugin-permission-bridge.covered-atom", `Fixture must cover ${atomID}.`)
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-plugin-permission-bridge.native-claim", "Permission bridge fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-plugin-permission-bridge.lossiness", "Native permission bridge fixture cannot retain known lossiness.")
  }
  for (const source of ["packages/opencode/src/plugin/index.ts", "packages/plugin/src/index.ts", "packages/opencode/src/permission/index.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-plugin-permission-bridge.source-ref", `Missing upstream source ref ${source}.`)
  }
  for (const item of fixture.cases) {
    if (!openCodePluginPermissionBridgeSameJSON(item.actual, item.expected)) {
      add("opencode-plugin-permission-bridge.case", "Case actual output must match expected pinned upstream permission hook behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodePluginPermissionBridgeFingerprintObject(withoutFingerprint)) {
    add("opencode-plugin-permission-bridge.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function permissionPayload(value: unknown): Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function openCodePluginPermissionBridgeSameJSON(left: unknown, right: unknown): boolean {
  return openCodePluginPermissionBridgeStableJSON(left) === openCodePluginPermissionBridgeStableJSON(right)
}

function openCodePluginPermissionBridgeFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodePluginPermissionBridgeStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodePluginPermissionBridgeStableJSON(value: unknown): string {
  return JSON.stringify(openCodePluginPermissionBridgeSortStable(value))
}

function openCodePluginPermissionBridgeSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodePluginPermissionBridgeSortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodePluginPermissionBridgeSortStable(entry)]),
  )
}
