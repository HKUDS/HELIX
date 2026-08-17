import { createHash } from "node:crypto"

export type OpenCodePluginV2ID = string
export type OpenCodePluginV2HookName = string
export type OpenCodePluginV2Event = Record<string, unknown>
export type OpenCodePluginV2HookFunction = (event: OpenCodePluginV2Event) => void | Promise<void>
export type OpenCodePluginV2HookFunctions = Record<OpenCodePluginV2HookName, OpenCodePluginV2HookFunction | undefined>

export interface OpenCodePluginV2Scope {
  readonly id: OpenCodePluginV2ID
  addCleanup(cleanup: () => void | Promise<void>): void
  close(): Promise<void>
}

export interface OpenCodePluginV2Definition {
  id: OpenCodePluginV2ID
  effect: (scope: OpenCodePluginV2Scope) => OpenCodePluginV2HookFunctions | Promise<OpenCodePluginV2HookFunctions | void> | void
}

export interface OpenCodePluginV2Service {
  add(input: OpenCodePluginV2Definition): Promise<void>
  remove(id: OpenCodePluginV2ID): Promise<void>
  added(): OpenCodePluginV2ID[]
  trigger(name: OpenCodePluginV2HookName, input: OpenCodePluginV2Event, output: OpenCodePluginV2Event): Promise<OpenCodePluginV2Event>
  triggerFor(id: OpenCodePluginV2ID | "*", name: OpenCodePluginV2HookName, input: OpenCodePluginV2Event, output: OpenCodePluginV2Event): Promise<OpenCodePluginV2Event>
}

export interface OpenCodePluginV2DefinitionNativeExactFixtureCase {
  id: "define-identity" | "replace-closes-existing-scope" | "triggerfor-draft-output-and-filter" | "remove-closes-scope"
  actual: unknown
  expected: unknown
}

export interface OpenCodePluginV2DefinitionNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.plugin.v2-definition"
  portID: "hook.bus"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-plugin-v2-definition-native-exact-fixture"
  replayRef: "plugin-v2-definition-native-exact:opencode"
  fixtureID: "opencode-plugin-v2-definition:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodePluginV2DefinitionNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodePluginV2DefinitionNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodePluginV2DefinitionNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodePluginV2DefinitionNativeExactFixtureIssue[]
}

export function defineOpenCodePluginV2<T extends OpenCodePluginV2Definition>(input: T): T {
  return input
}

export function createOpenCodePluginV2Service(): OpenCodePluginV2Service {
  const entries: Array<{ id: OpenCodePluginV2ID; hooks: OpenCodePluginV2HookFunctions; scope: OpenCodePluginV2ScopeImpl }> = []
  const addedIDs: OpenCodePluginV2ID[] = []

  const removeEntry = async (id: OpenCodePluginV2ID) => {
    const index = entries.findIndex((entry) => entry.id === id)
    if (index < 0) return
    const [existing] = entries.splice(index, 1)
    if (existing) await existing.scope.close()
  }

  const service: OpenCodePluginV2Service = {
    async add(input) {
      await removeEntry(input.id)
      const scope = new OpenCodePluginV2ScopeImpl(input.id)
      const hooks = await input.effect(scope)
      entries.push({ id: input.id, hooks: hooks ?? {}, scope })
      addedIDs.push(input.id)
    },
    async remove(id) {
      await removeEntry(id)
    },
    added() {
      return [...addedIDs]
    },
    trigger(name, input, output) {
      return service.triggerFor("*", name, input, output)
    },
    async triggerFor(id, name, input, output) {
      const event = openCodePluginV2DraftEvent(input, output)
      for (const entry of entries) {
        if (id !== "*" && entry.id !== id) continue
        const hook = entry.hooks[name]
        if (!hook) continue
        await hook(event)
      }
      return event
    },
  }
  return service
}

export async function captureOpenCodePluginV2DefinitionNativeExactFixture(): Promise<OpenCodePluginV2DefinitionNativeExactFixture> {
  const identityDefinition = {
    id: "identity-plugin",
    effect: () => ({}),
  }
  const defined = defineOpenCodePluginV2(identityDefinition)

  const replaceService = createOpenCodePluginV2Service()
  const replaceEvents: string[] = []
  await replaceService.add({
    id: "replace-plugin",
    effect(scope) {
      replaceEvents.push(`effect:first:${scope.id}`)
      scope.addCleanup(() => {
        replaceEvents.push("cleanup:first")
      })
      return {
        "agent.update": (event) => {
          replaceEvents.push("hook:first")
          event["cancel"] = true
        },
      }
    },
  })
  await replaceService.add({
    id: "replace-plugin",
    effect(scope) {
      replaceEvents.push(`effect:second:${scope.id}`)
      scope.addCleanup(() => {
        replaceEvents.push("cleanup:second")
      })
      return {
        "agent.update": (event) => {
          replaceEvents.push("hook:second")
          event["agent"] = { id: "second-agent" }
        },
      }
    },
  })
  const replaceOutput = { agent: { id: "base-agent" }, cancel: false }
  const replaceTrigger = await replaceService.trigger("agent.update", {}, replaceOutput)

  const filterService = createOpenCodePluginV2Service()
  const filterEvents: string[] = []
  await filterService.add({
    id: "plugin-a",
    effect: () => ({
      "agent.update": (event) => {
        filterEvents.push("a")
        const agent = event["agent"] as { id: string; flags?: string[] }
        agent.flags = [...(agent.flags ?? []), "a"]
        event["cancel"] = true
      },
    }),
  })
  await filterService.add({
    id: "plugin-b",
    effect: () => ({
      "agent.update": (event) => {
        filterEvents.push("b")
        const agent = event["agent"] as { id: string; flags?: string[] }
        agent.flags = [...(agent.flags ?? []), "b"]
      },
    }),
  })
  const filteredOutput = { agent: { id: "agent-filtered", flags: [] as string[] }, cancel: false }
  const filtered = await filterService.triggerFor("plugin-a", "agent.update", { requestID: "req-1" }, filteredOutput)
  const wildcardOutput = { agent: { id: "agent-all", flags: [] as string[] }, cancel: false }
  const wildcard = await filterService.trigger("agent.update", { requestID: "req-2" }, wildcardOutput)

  const removeService = createOpenCodePluginV2Service()
  const removeEvents: string[] = []
  await removeService.add({
    id: "remove-plugin",
    effect(scope) {
      scope.addCleanup(() => {
        removeEvents.push("cleanup:remove")
      })
      return {
        "catalog.transform": () => {
          removeEvents.push("hook:remove")
        },
      }
    },
  })
  await removeService.remove("remove-plugin")
  const removeTrigger = await removeService.trigger("catalog.transform", {}, {})

  const cases: OpenCodePluginV2DefinitionNativeExactFixtureCase[] = [
    {
      id: "define-identity",
      actual: {
        sameReference: defined === identityDefinition,
        id: defined.id,
        hasEffect: typeof defined.effect === "function",
      },
      expected: {
        sameReference: true,
        id: "identity-plugin",
        hasEffect: true,
      },
    },
    {
      id: "replace-closes-existing-scope",
      actual: {
        added: replaceService.added(),
        events: replaceEvents,
        trigger: replaceTrigger,
        originalOutput: replaceOutput,
      },
      expected: {
        added: ["replace-plugin", "replace-plugin"],
        events: ["effect:first:replace-plugin", "cleanup:first", "effect:second:replace-plugin", "hook:second"],
        trigger: { agent: { id: "second-agent" }, cancel: false },
        originalOutput: { agent: { id: "base-agent" }, cancel: false },
      },
    },
    {
      id: "triggerfor-draft-output-and-filter",
      actual: {
        events: filterEvents,
        filtered,
        wildcard,
        filteredOriginalOutput: filteredOutput,
        wildcardOriginalOutput: wildcardOutput,
      },
      expected: {
        events: ["a", "a", "b"],
        filtered: { requestID: "req-1", agent: { id: "agent-filtered", flags: ["a"] }, cancel: true },
        wildcard: { requestID: "req-2", agent: { id: "agent-all", flags: ["a", "b"] }, cancel: true },
        filteredOriginalOutput: { agent: { id: "agent-filtered", flags: [] }, cancel: false },
        wildcardOriginalOutput: { agent: { id: "agent-all", flags: [] }, cancel: false },
      },
    },
    {
      id: "remove-closes-scope",
      actual: {
        added: removeService.added(),
        events: removeEvents,
        trigger: removeTrigger,
      },
      expected: {
        added: ["remove-plugin"],
        events: ["cleanup:remove"],
        trigger: {},
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.plugin.v2-definition" as const,
    portID: "hook.bus" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-plugin-v2-definition-native-exact-fixture" as const,
    replayRef: "plugin-v2-definition-native-exact:opencode" as const,
    fixtureID: "opencode-plugin-v2-definition:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "anomalyco/opencode:packages/core/src/plugin.ts#PluginV2,ID,Hooks,HookFunctions,define",
      "anomalyco/opencode:packages/core/src/plugin.ts#Service.add,remove,added,trigger,triggerFor",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodePluginV2DefinitionFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodePluginV2DefinitionNativeExactFixture(
  fixture: OpenCodePluginV2DefinitionNativeExactFixture,
): OpenCodePluginV2DefinitionNativeExactFixtureVerification {
  const issues: OpenCodePluginV2DefinitionNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-plugin-v2-definition.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.plugin.v2-definition" || fixture.portID !== "hook.bus") {
    add("opencode-plugin-v2-definition.target", "Fixture must target opencode.plugin.v2-definition and hook.bus.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-plugin-v2-definition.native-claim", "Plugin V2 definition fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-plugin-v2-definition.lossiness", "Native plugin V2 definition fixture cannot retain known lossiness.")
  }
  for (const source of ["packages/core/src/plugin.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-plugin-v2-definition.source-ref", `Missing upstream source ref ${source}.`)
  }
  for (const item of fixture.cases) {
    if (!openCodePluginV2DefinitionSameJSON(item.actual, item.expected)) {
      add("opencode-plugin-v2-definition.case", "Case actual output must match expected pinned upstream PluginV2 definition behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodePluginV2DefinitionFingerprintObject(withoutFingerprint)) {
    add("opencode-plugin-v2-definition.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

class OpenCodePluginV2ScopeImpl implements OpenCodePluginV2Scope {
  private readonly cleanups: Array<() => void | Promise<void>> = []
  private closed = false

  constructor(readonly id: OpenCodePluginV2ID) {}

  addCleanup(cleanup: () => void | Promise<void>): void {
    if (this.closed) return
    this.cleanups.push(cleanup)
  }

  async close(): Promise<void> {
    if (this.closed) return
    this.closed = true
    for (const cleanup of [...this.cleanups].reverse()) await cleanup()
    this.cleanups.length = 0
  }
}

function openCodePluginV2DraftEvent(input: OpenCodePluginV2Event, output: OpenCodePluginV2Event): OpenCodePluginV2Event {
  const event: OpenCodePluginV2Event = { ...input, ...output }
  for (const [field, value] of Object.entries(output)) {
    if (value && typeof value === "object") event[field] = openCodePluginV2Clone(value)
  }
  return event
}

function openCodePluginV2Clone(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodePluginV2Clone)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, openCodePluginV2Clone(entry)]))
}

function openCodePluginV2DefinitionSameJSON(left: unknown, right: unknown): boolean {
  return openCodePluginV2DefinitionStableJSON(left) === openCodePluginV2DefinitionStableJSON(right)
}

function openCodePluginV2DefinitionFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodePluginV2DefinitionStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodePluginV2DefinitionStableJSON(value: unknown): string {
  return JSON.stringify(openCodePluginV2DefinitionSortStable(value))
}

function openCodePluginV2DefinitionSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodePluginV2DefinitionSortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodePluginV2DefinitionSortStable(entry)]),
  )
}
