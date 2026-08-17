import { createHash } from "node:crypto"
import type { OpenCodeHooks, OpenCodePlugin, OpenCodePluginInput, OpenCodePluginOptions } from "./plugin-adapter"

export interface OpenCodeHookPluginBridgeLoadEntry {
  plugin: OpenCodePlugin
  options?: OpenCodePluginOptions
}

export interface OpenCodeHookPluginBridgeInitInput {
  plugins: OpenCodeHookPluginBridgeLoadEntry[]
  pluginInput: OpenCodePluginInput
  config?: Record<string, unknown>
}

export interface OpenCodeHookPluginBridge {
  init(input: OpenCodeHookPluginBridgeInitInput): Promise<OpenCodeHooks[]>
  list(): OpenCodeHooks[]
  trigger<Input, Output>(name: string, input: Input, output: Output): Promise<Output>
  notifyEvent(event: unknown): void
}

export interface OpenCodeHookPluginBridgeNativeExactFixtureCase {
  id:
    | "init-load-config-list-order"
    | "trigger-source-order-output-mutation"
    | "trigger-error-fail-fast"
    | "event-fire-and-forget"
  actual: unknown
  expected: unknown
}

export interface OpenCodeHookPluginBridgeNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.hook.plugin-bridge"
  portID: "hook.bus"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-hook-plugin-bridge-native-exact-fixture"
  replayRef: "hook-plugin-bridge-native-exact:opencode"
  fixtureID: "opencode-hook-plugin-bridge:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeHookPluginBridgeNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeHookPluginBridgeNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeHookPluginBridgeNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeHookPluginBridgeNativeExactFixtureIssue[]
}

export function createOpenCodeHookPluginBridge(): OpenCodeHookPluginBridge {
  const hooks: OpenCodeHooks[] = []
  return {
    async init(input) {
      hooks.length = 0
      for (const entry of input.plugins) hooks.push(await entry.plugin(input.pluginInput, entry.options))
      for (const hook of hooks) {
        try {
          await Promise.resolve(hook.config?.(input.config ?? {}))
        } catch {
          // OpenCode logs config hook failures and keeps plugin initialization alive.
        }
      }
      return hooks
    },
    list() {
      return hooks
    },
    async trigger(name, input, output) {
      if (!name) return output
      for (const hook of hooks) {
        const fn = (hook as Record<string, unknown>)[name] as ((triggerInput: typeof input, triggerOutput: typeof output) => void | Promise<void>) | undefined
        if (!fn) continue
        await fn(input, output)
      }
      return output
    },
    notifyEvent(event) {
      for (const hook of hooks) {
        const fn = (hook as Record<string, unknown>)["event"] as ((input: { event: unknown }) => void | Promise<void>) | null | undefined
        if (fn == null) continue
        void fn({ event })
      }
    },
  }
}

export async function captureOpenCodeHookPluginBridgeNativeExactFixture(): Promise<OpenCodeHookPluginBridgeNativeExactFixture> {
  const bridge = createOpenCodeHookPluginBridge()
  const loadEvents: string[] = []
  const configEvents: string[] = []
  const triggerCalls: string[] = []
  const pluginInput: OpenCodePluginInput = {
    directory: "/workspace",
    worktree: "/workspace",
    project: { id: "project-1" },
  }

  const loadedHooks = await bridge.init({
    pluginInput,
    config: { model: "gpt-test", theme: "dark" },
    plugins: [
      {
        plugin: (input, options) => {
          loadEvents.push(`load:first:${input.directory}:${Object.keys(options ?? {}).sort().join(",")}`)
          return {
            config: (config) => {
              configEvents.push(`config:first:${Object.keys(config).sort().join(",")}`)
            },
            "chat.message": (inputRecord, outputRecord) => {
              triggerCalls.push(`first:${inputRecord["sessionID"]}`)
              outputRecord["message"] = "first"
            },
            event: async (inputRecord) => {
              triggerCalls.push(`event:first:${inputRecord.event.type}`)
            },
          }
        },
        options: { mode: "test" },
      },
      {
        plugin: (input) => {
          loadEvents.push(`load:bad-config:${input.directory}`)
          return {
            config: () => {
              configEvents.push("config:bad-config")
              throw new Error("config failed")
            },
          }
        },
      },
      {
        plugin: (input) => {
          loadEvents.push(`load:third:${input.directory}`)
          return {
            config: (config) => {
              configEvents.push(`config:third:${Object.keys(config).sort().join(",")}`)
            },
            "chat.message": (_inputRecord, outputRecord) => {
              triggerCalls.push("third")
              outputRecord["message"] = "third"
              outputRecord["parts"] = [...((outputRecord["parts"] as unknown[]) ?? []), { type: "text", text: "third" }]
            },
          }
        },
      },
    ],
  })

  const listedHooks = bridge.list()
  const cases: OpenCodeHookPluginBridgeNativeExactFixtureCase[] = [
    {
      id: "init-load-config-list-order",
      actual: {
        loadEvents,
        configEvents,
        listSameReference: listedHooks === loadedHooks,
        hookKeys: listedHooks.map((hook) => Object.keys(hook).sort()),
      },
      expected: {
        loadEvents: ["load:first:/workspace:mode", "load:bad-config:/workspace", "load:third:/workspace"],
        configEvents: ["config:first:model,theme", "config:bad-config", "config:third:model,theme"],
        listSameReference: true,
        hookKeys: [
          ["chat.message", "config", "event"],
          ["config"],
          ["chat.message", "config"],
        ],
      },
    },
  ]

  const triggerOutput = { message: "initial", parts: [] as unknown[] }
  const triggerReturned = await bridge.trigger("chat.message", { sessionID: "ses_trigger" }, triggerOutput)
  const emptyNameOutput = { unchanged: true }
  const emptyNameReturned = await bridge.trigger("", { sessionID: "ses_empty" }, emptyNameOutput)
  cases.push({
    id: "trigger-source-order-output-mutation",
    actual: {
      triggerCalls,
      output: triggerOutput,
      returnedSameReference: triggerReturned === triggerOutput,
      emptyNameReturnedSameReference: emptyNameReturned === emptyNameOutput,
      emptyNameOutput,
    },
    expected: {
      triggerCalls: ["first:ses_trigger", "third"],
      output: { message: "third", parts: [{ type: "text", text: "third" }] },
      returnedSameReference: true,
      emptyNameReturnedSameReference: true,
      emptyNameOutput: { unchanged: true },
    },
  })

  const errorBridge = createOpenCodeHookPluginBridge()
  const errorCalls: string[] = []
  await errorBridge.init({
    pluginInput,
    plugins: [
      {
        plugin: () => ({
          "chat.headers": (_input, output) => {
            errorCalls.push("before")
            output.headers["x-before"] = "1"
          },
        }),
      },
      {
        plugin: () => ({
          "chat.headers": () => {
            errorCalls.push("throws")
            throw new Error("handler failed")
          },
        }),
      },
      {
        plugin: () => ({
          "chat.headers": () => {
            errorCalls.push("after")
          },
        }),
      },
    ],
  })
  const errorOutput = { headers: {} as Record<string, string> }
  let errorActual: unknown
  try {
    await errorBridge.trigger("chat.headers", { sessionID: "ses_error" }, errorOutput)
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
  cases.push({
    id: "trigger-error-fail-fast",
    actual: errorActual,
    expected: {
      rejected: true,
      errorName: "Error",
      message: "handler failed",
      calls: ["before", "throws"],
      output: { headers: { "x-before": "1" } },
    },
  })

  const eventBridge = createOpenCodeHookPluginBridge()
  const eventCalls: string[] = []
  const eventPayload = { type: "session.updated", timestamp: 1, payload: { sessionID: "ses_event" } }
  await eventBridge.init({
    pluginInput,
    plugins: [
      {
        plugin: () => ({
          event: async (input) => {
            eventCalls.push(`first:start:${input.event.type}`)
            await Promise.resolve()
            eventCalls.push("first:after-await")
          },
        }),
      },
      {
        plugin: () => ({
          event: (input) => {
            eventCalls.push(`second:${input.event.type}`)
          },
        }),
      },
    ],
  })
  const notifyResult = eventBridge.notifyEvent(eventPayload)
  const immediateEventCalls = [...eventCalls]
  await Promise.resolve()
  const afterMicrotaskEventCalls = [...eventCalls]
  cases.push({
    id: "event-fire-and-forget",
    actual: {
      notifyResult,
      immediateEventCalls,
      afterMicrotaskEventCalls,
    },
    expected: {
      notifyResult: undefined,
      immediateEventCalls: ["first:start:session.updated", "second:session.updated"],
      afterMicrotaskEventCalls: ["first:start:session.updated", "second:session.updated", "first:after-await"],
    },
  })

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.hook.plugin-bridge" as const,
    portID: "hook.bus" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-hook-plugin-bridge-native-exact-fixture" as const,
    replayRef: "hook-plugin-bridge-native-exact:opencode" as const,
    fixtureID: "opencode-hook-plugin-bridge:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "anomalyco/opencode:packages/opencode/src/plugin/index.ts#Plugin.Service,state,config,trigger,list,bus.subscribeAll",
      "anomalyco/opencode:packages/plugin/src/index.ts#Plugin,PluginInput,PluginOptions,Hooks",
    ],
    cases,
    knownLossiness: [] as [],
  }

  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeHookPluginBridgeFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeHookPluginBridgeNativeExactFixture(
  fixture: OpenCodeHookPluginBridgeNativeExactFixture,
): OpenCodeHookPluginBridgeNativeExactFixtureVerification {
  const issues: OpenCodeHookPluginBridgeNativeExactFixtureIssue[] = []
  const expectedCaseIDs: OpenCodeHookPluginBridgeNativeExactFixtureCase["id"][] = [
    "init-load-config-list-order",
    "trigger-source-order-output-mutation",
    "trigger-error-fail-fast",
    "event-fire-and-forget",
  ]
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-hook-plugin-bridge.schema", "Fixture must use schema version 1.")
  if (fixture.product !== "opencode" || fixture.atomID !== "opencode.hook.plugin-bridge" || fixture.portID !== "hook.bus") {
    add("opencode-hook-plugin-bridge.target", "Fixture must target opencode.hook.plugin-bridge and hook.bus.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-hook-plugin-bridge.native-claim", "Hook plugin bridge fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) add("opencode-hook-plugin-bridge.lossiness", "Native hook plugin bridge fixture cannot retain known lossiness.")
  for (const source of ["packages/opencode/src/plugin/index.ts", "packages/plugin/src/index.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-hook-plugin-bridge.source-ref", `Missing source ref ${source}.`)
  }
  for (const expectedID of expectedCaseIDs) {
    const item = fixture.cases.find((candidate) => candidate.id === expectedID)
    if (!item) {
      add("opencode-hook-plugin-bridge.case-missing", `Missing ${expectedID} fixture case.`, expectedID)
      continue
    }
    if (!openCodeHookPluginBridgeSameJSON(item.actual, item.expected)) {
      add("opencode-hook-plugin-bridge.case", "Case actual output must match expected OpenCode Plugin service behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeHookPluginBridgeFingerprintObject(withoutFingerprint)) {
    add("opencode-hook-plugin-bridge.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function openCodeHookPluginBridgeSameJSON(left: unknown, right: unknown): boolean {
  return openCodeHookPluginBridgeStableJSON(left) === openCodeHookPluginBridgeStableJSON(right)
}

function openCodeHookPluginBridgeFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeHookPluginBridgeStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeHookPluginBridgeStableJSON(value: unknown): string {
  return JSON.stringify(openCodeHookPluginBridgeSortStable(value))
}

function openCodeHookPluginBridgeSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeHookPluginBridgeSortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeHookPluginBridgeSortStable(entry)]),
  )
}
