import { createHash } from "node:crypto"
import { mkdir, mkdtemp, open, readFile, rm, stat, unlink, utimes, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, isAbsolute, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { LegoHookHost, type HookScope } from "@helix/lego-hooks"

export interface OpenCodePluginHotReloadCleanup {
  disposeExisting(input: { host: LegoHookHost; sourceID: string }): Promise<boolean>
  track(input: { host: LegoHookHost; scope: HookScope }): void
  trackedSourceIDs(input: { host: LegoHookHost }): string[]
}

export interface OpenCodePluginHotReloadCleanupNativeExactFixtureCase {
  id: "replacement-disposes-existing-before-track" | "scope-dispose-removes-tracked-source" | "host-state-isolated"
  actual: unknown
  expected: unknown
}

export interface OpenCodePluginHotReloadCleanupNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.plugin.hot-reload-cleanup"
  portID: "hook.cleanup-scope"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-plugin-hot-reload-cleanup-native-exact-fixture"
  replayRef: "plugin-hot-reload-cleanup-native-exact:opencode"
  fixtureID: "opencode-plugin-hot-reload-cleanup:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodePluginHotReloadCleanupNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodePluginHotReloadCleanupNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodePluginHotReloadCleanupNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodePluginHotReloadCleanupNativeExactFixtureIssue[]
}

export type OpenCodePluginHotReloadMetaSource = "file" | "npm"
export type OpenCodePluginHotReloadMetaState = "first" | "updated" | "same"

export interface OpenCodePluginHotReloadMetaTheme {
  src: string
  dest: string
  mtime?: number
  size?: number
}

export interface OpenCodePluginHotReloadMetaEntry {
  id: string
  source: OpenCodePluginHotReloadMetaSource
  spec: string
  target: string
  requested?: string
  version?: string
  modified?: number
  first_time: number
  last_time: number
  time_changed: number
  load_count: number
  fingerprint: string
  themes?: Record<string, OpenCodePluginHotReloadMetaTheme>
}

export interface OpenCodePluginHotReloadMetaTouch {
  spec: string
  target: string
  id: string
}

export interface OpenCodePluginHotReloadMetadata {
  touch(input: { file: string } & OpenCodePluginHotReloadMetaTouch): Promise<{ state: OpenCodePluginHotReloadMetaState; entry: OpenCodePluginHotReloadMetaEntry }>
  touchMany(input: { file: string; items: OpenCodePluginHotReloadMetaTouch[] }): Promise<Array<{ state: OpenCodePluginHotReloadMetaState; entry: OpenCodePluginHotReloadMetaEntry }>>
  setTheme(input: { file: string; id: string; name: string; theme: OpenCodePluginHotReloadMetaTheme }): Promise<void>
  list(input: { file: string }): Promise<Record<string, OpenCodePluginHotReloadMetaEntry>>
}

export interface OpenCodePluginHotReloadMetaNativeExactFixtureCase {
  id:
    | "file-plugin-load-change-and-theme"
    | "npm-plugin-version-fingerprint"
    | "locked-concurrent-touch-counts"
  actual: unknown
  expected: unknown
}

export interface OpenCodePluginHotReloadMetaNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.plugin.hot-reload-cleanup"
  portID: "hook.cleanup-scope"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-plugin-hot-reload-meta-native-exact-fixture"
  replayRef: "plugin-hot-reload-meta-native-exact:opencode"
  fixtureID: "opencode-plugin-hot-reload-meta:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodePluginHotReloadMetaNativeExactFixtureCase[]
  knownLossiness: []
  residualGaps: ["opencode-file-watcher-native-binding-not-replayed"]
  fingerprint: string
}

export interface OpenCodePluginHotReloadMetaNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodePluginHotReloadMetaNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodePluginHotReloadMetaNativeExactFixtureIssue[]
}

const hotReloadScopesByHost = new WeakMap<LegoHookHost, Map<string, HookScope>>()

export function createOpenCodePluginHotReloadCleanup(): OpenCodePluginHotReloadCleanup {
  return {
    disposeExisting: openCodePluginHotReloadDisposeExisting,
    track: openCodePluginHotReloadTrack,
    trackedSourceIDs({ host }) {
      return [...(hotReloadScopesByHost.get(host)?.keys() ?? [])].sort()
    },
  }
}

export async function openCodePluginHotReloadDisposeExisting(input: { host: LegoHookHost; sourceID: string }): Promise<boolean> {
  const scopes = hotReloadScopesByHost.get(input.host)
  const existing = scopes?.get(input.sourceID)
  if (!existing) return false
  await existing.dispose()
  scopes?.delete(input.sourceID)
  return true
}

export function openCodePluginHotReloadTrack(input: { host: LegoHookHost; scope: HookScope }): void {
  const scopes = openCodePluginHotReloadScopesForHost(input.host)
  scopes.set(input.scope.source.id, input.scope)
  input.scope.addCleanup(() => {
    if (scopes.get(input.scope.source.id) === input.scope) scopes.delete(input.scope.source.id)
  })
}

export function createOpenCodePluginHotReloadMetadata(input: { now?: () => number; lockRetryMs?: number } = {}): OpenCodePluginHotReloadMetadata {
  const now = input.now ?? Date.now
  const lockRetryMs = input.lockRetryMs ?? 5
  return {
    async touch({ file, spec, target, id }) {
      const hit = await this.touchMany({ file, items: [{ spec, target, id }] })
      const item = hit[0]
      if (!item) throw new Error("Failed to touch plugin metadata.")
      return item
    },
    async touchMany({ file, items }) {
      if (!items.length) return []
      const rows = await Promise.all(items.map((item) => openCodePluginHotReloadMetaRow(item)))
      return openCodePluginHotReloadMetaWithLock(file, lockRetryMs, async () => {
        const store = await openCodePluginHotReloadMetaRead(file)
        const time = now()
        const out: Array<{ state: OpenCodePluginHotReloadMetaState; entry: OpenCodePluginHotReloadMetaEntry }> = []
        for (const item of rows) {
          const hit = openCodePluginHotReloadMetaNext(store[item.id], item.core, time)
          store[item.id] = hit.entry
          out.push(hit)
        }
        await openCodePluginHotReloadMetaWrite(file, store)
        return out
      })
    },
    async setTheme({ file, id, name, theme }) {
      await openCodePluginHotReloadMetaWithLock(file, lockRetryMs, async () => {
        const store = await openCodePluginHotReloadMetaRead(file)
        const entry = store[id]
        if (!entry) return
        entry.themes = {
          ...entry.themes,
          [name]: theme,
        }
        await openCodePluginHotReloadMetaWrite(file, store)
      })
    },
    async list({ file }) {
      return openCodePluginHotReloadMetaWithLock(file, lockRetryMs, async () => openCodePluginHotReloadMetaRead(file))
    },
  }
}

export async function captureOpenCodePluginHotReloadCleanupNativeExactFixture(): Promise<OpenCodePluginHotReloadCleanupNativeExactFixture> {
  const cleanup = createOpenCodePluginHotReloadCleanup()

  const replacementHost = new LegoHookHost({ errorMode: "throw" })
  const replacementEvents: string[] = []
  const firstScope = replacementHost.createScope({ id: "plugin-a", scope: "project" })
  firstScope.addCleanup(() => {
    replacementEvents.push("cleanup:first")
  })
  cleanup.track({ host: replacementHost, scope: firstScope })
  const disposedExisting = await cleanup.disposeExisting({ host: replacementHost, sourceID: "plugin-a" })
  const secondScope = replacementHost.createScope({ id: "plugin-a", scope: "project" })
  secondScope.addCleanup(() => {
    replacementEvents.push("cleanup:second")
  })
  cleanup.track({ host: replacementHost, scope: secondScope })
  const replacementActual = {
    disposedExisting,
    eventsAfterReplace: [...replacementEvents],
    tracked: cleanup.trackedSourceIDs({ host: replacementHost }),
  }

  const disposeHost = new LegoHookHost({ errorMode: "throw" })
  const disposeScope = disposeHost.createScope({ id: "plugin-b", scope: "global" })
  cleanup.track({ host: disposeHost, scope: disposeScope })
  const trackedBeforeDispose = cleanup.trackedSourceIDs({ host: disposeHost })
  await disposeScope.dispose()
  const disposeActual = {
    trackedBeforeDispose,
    trackedAfterDispose: cleanup.trackedSourceIDs({ host: disposeHost }),
  }

  const hostA = new LegoHookHost({ errorMode: "throw" })
  const hostB = new LegoHookHost({ errorMode: "throw" })
  cleanup.track({ host: hostA, scope: hostA.createScope({ id: "shared-plugin", scope: "project" }) })
  cleanup.track({ host: hostB, scope: hostB.createScope({ id: "shared-plugin", scope: "project" }) })
  await cleanup.disposeExisting({ host: hostA, sourceID: "shared-plugin" })
  const isolatedActual = {
    hostA: cleanup.trackedSourceIDs({ host: hostA }),
    hostB: cleanup.trackedSourceIDs({ host: hostB }),
  }

  const cases: OpenCodePluginHotReloadCleanupNativeExactFixtureCase[] = [
    {
      id: "replacement-disposes-existing-before-track",
      actual: replacementActual,
      expected: {
        disposedExisting: true,
        eventsAfterReplace: ["cleanup:first"],
        tracked: ["plugin-a"],
      },
    },
    {
      id: "scope-dispose-removes-tracked-source",
      actual: disposeActual,
      expected: {
        trackedBeforeDispose: ["plugin-b"],
        trackedAfterDispose: [],
      },
    },
    {
      id: "host-state-isolated",
      actual: isolatedActual,
      expected: {
        hostA: [],
        hostB: ["shared-plugin"],
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.plugin.hot-reload-cleanup" as const,
    portID: "hook.cleanup-scope" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-plugin-hot-reload-cleanup-native-exact-fixture" as const,
    replayRef: "plugin-hot-reload-cleanup-native-exact:opencode" as const,
    fixtureID: "opencode-plugin-hot-reload-cleanup:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "anomalyco/opencode:packages/core/src/plugin.ts#Plugin.add,Plugin.remove,Scope.close",
      "anomalyco/opencode:packages/core/src/plugin/boot.ts#PluginBoot.add",
      "helix:packages/adapters-opencode/src/opencode-plugin-loader.ts#openCodeNativePluginLoaderLoad",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodePluginHotReloadCleanupFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodePluginHotReloadCleanupNativeExactFixture(
  fixture: OpenCodePluginHotReloadCleanupNativeExactFixture,
): OpenCodePluginHotReloadCleanupNativeExactFixtureVerification {
  const issues: OpenCodePluginHotReloadCleanupNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-plugin-hot-reload-cleanup.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.plugin.hot-reload-cleanup" || fixture.portID !== "hook.cleanup-scope") {
    add("opencode-plugin-hot-reload-cleanup.target", "Fixture must target opencode.plugin.hot-reload-cleanup and hook.cleanup-scope.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-plugin-hot-reload-cleanup.native-claim", "Hot reload cleanup fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-plugin-hot-reload-cleanup.lossiness", "Native hot reload cleanup fixture cannot retain known lossiness.")
  }
  for (const source of ["packages/core/src/plugin.ts", "packages/core/src/plugin/boot.ts", "packages/adapters-opencode/src/opencode-plugin-loader.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-plugin-hot-reload-cleanup.source-ref", `Missing source ref ${source}.`)
  }
  for (const item of fixture.cases) {
    if (!openCodePluginHotReloadCleanupSameJSON(item.actual, item.expected)) {
      add("opencode-plugin-hot-reload-cleanup.case", "Case actual output must match expected pinned plugin replacement cleanup behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodePluginHotReloadCleanupFingerprintObject(withoutFingerprint)) {
    add("opencode-plugin-hot-reload-cleanup.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

export async function captureOpenCodePluginHotReloadMetaNativeExactFixture(): Promise<OpenCodePluginHotReloadMetaNativeExactFixture> {
  const temp = await mkdtemp(join(tmpdir(), "helix-opencode-plugin-meta-"))
  let clock = 1_000
  const meta = createOpenCodePluginHotReloadMetadata({ now: () => clock, lockRetryMs: 1 })
  try {
    const storeFile = join(temp, "state", "plugin-meta.json")
    const filePlugin = join(temp, "plugin.ts")
    await writeFile(filePlugin, "export default async () => ({})\n", "utf8")
    await utimes(filePlugin, new Date(1_000_000), new Date(1_000_000))
    const fileSpec = pathToFileURL(filePlugin).href

    const fileFirst = await meta.touch({ file: storeFile, spec: fileSpec, target: fileSpec, id: "demo.file" })
    await meta.setTheme({
      file: storeFile,
      id: "demo.file",
      name: "dark",
      theme: { src: join(temp, "theme.json"), dest: "dark.json", mtime: 1_000_000, size: 2 },
    })
    clock = 2_000
    const fileSecond = await meta.touch({ file: storeFile, spec: fileSpec, target: fileSpec, id: "demo.file" })
    await writeFile(filePlugin, "export default async () => ({ ok: true })\n", "utf8")
    await utimes(filePlugin, new Date(1_010_000), new Date(1_010_000))
    clock = 3_000
    const fileThird = await meta.touch({ file: storeFile, spec: fileSpec, target: fileSpec, id: "demo.file" })
    const fileStore = await meta.list({ file: storeFile })

    const npmDir = join(temp, "node_modules", "acme-plugin")
    const npmPkg = join(npmDir, "package.json")
    await mkdir(npmDir, { recursive: true })
    await writeFile(npmPkg, JSON.stringify({ name: "acme-plugin", version: "1.0.0" }, null, 2), "utf8")
    clock = 4_000
    const npmFirst = await meta.touch({ file: storeFile, spec: "acme-plugin@latest", target: npmDir, id: "acme-plugin" })
    await writeFile(npmPkg, JSON.stringify({ name: "acme-plugin", version: "1.1.0" }, null, 2), "utf8")
    clock = 5_000
    const npmSecond = await meta.touch({ file: storeFile, spec: "acme-plugin@latest", target: npmDir, id: "acme-plugin" })

    const lockStoreFile = join(temp, "state", "locked-plugin-meta.json")
    clock = 6_000
    await Promise.all(Array.from({ length: 8 }, () =>
      meta.touch({ file: lockStoreFile, spec: fileSpec, target: fileSpec, id: "locked.file" }),
    ))
    const lockedStore = await meta.list({ file: lockStoreFile })

    const cases: OpenCodePluginHotReloadMetaNativeExactFixtureCase[] = [
      {
        id: "file-plugin-load-change-and-theme",
        actual: {
          first: openCodePluginHotReloadMetaCompact(fileFirst),
          second: openCodePluginHotReloadMetaCompact(fileSecond),
          third: openCodePluginHotReloadMetaCompact(fileThird),
          saved: openCodePluginHotReloadMetaCompactSaved(fileStore["demo.file"]),
        },
        expected: {
          first: {
            state: "first",
            source: "file",
            modified: 1_000_000,
            first_time: 1_000,
            last_time: 1_000,
            time_changed: 1_000,
            load_count: 1,
            fingerprint: `${fileSpec}|1000000`,
          },
          second: {
            state: "same",
            source: "file",
            modified: 1_000_000,
            first_time: 1_000,
            last_time: 2_000,
            time_changed: 1_000,
            load_count: 2,
            fingerprint: `${fileSpec}|1000000`,
            themes: {
              dark: { src: join(temp, "theme.json"), dest: "dark.json", mtime: 1_000_000, size: 2 },
            },
          },
          third: {
            state: "updated",
            source: "file",
            modified: 1_010_000,
            first_time: 1_000,
            last_time: 3_000,
            time_changed: 3_000,
            load_count: 3,
            fingerprint: `${fileSpec}|1010000`,
            themes: {
              dark: { src: join(temp, "theme.json"), dest: "dark.json", mtime: 1_000_000, size: 2 },
            },
          },
          saved: {
            id: "demo.file",
            source: "file",
            spec: fileSpec,
            target: fileSpec,
            modified: 1_010_000,
            load_count: 3,
            fingerprint: `${fileSpec}|1010000`,
            themes: {
              dark: { src: join(temp, "theme.json"), dest: "dark.json", mtime: 1_000_000, size: 2 },
            },
          },
        },
      },
      {
        id: "npm-plugin-version-fingerprint",
        actual: {
          first: openCodePluginHotReloadMetaCompact(npmFirst),
          second: openCodePluginHotReloadMetaCompact(npmSecond),
        },
        expected: {
          first: {
            state: "first",
            source: "npm",
            requested: "latest",
            version: "1.0.0",
            first_time: 4_000,
            last_time: 4_000,
            time_changed: 4_000,
            load_count: 1,
            fingerprint: `${npmDir}|latest|1.0.0`,
          },
          second: {
            state: "updated",
            source: "npm",
            requested: "latest",
            version: "1.1.0",
            first_time: 4_000,
            last_time: 5_000,
            time_changed: 5_000,
            load_count: 2,
            fingerprint: `${npmDir}|latest|1.1.0`,
          },
        },
      },
      {
        id: "locked-concurrent-touch-counts",
        actual: {
          loadCount: lockedStore["locked.file"]?.load_count,
          stateFingerprint: lockedStore["locked.file"]?.fingerprint,
        },
        expected: {
          loadCount: 8,
          stateFingerprint: `${fileSpec}|1010000`,
        },
      },
    ]

    const fixtureWithoutFingerprint = {
      schemaVersion: 1 as const,
      product: "opencode" as const,
      atomID: "opencode.plugin.hot-reload-cleanup" as const,
      portID: "hook.cleanup-scope" as const,
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
      evidenceRef: "conformance:opencode-plugin-hot-reload-meta-native-exact-fixture" as const,
      replayRef: "plugin-hot-reload-meta-native-exact:opencode" as const,
      fixtureID: "opencode-plugin-hot-reload-meta:native-exact-fixture" as const,
      exactDiffStatus: "native-exact" as const,
      nativeParityClaim: true as const,
      sourceRefs: [
        "anomalyco/opencode:packages/opencode/src/plugin/meta.ts#touchMany,touch,setTheme,list,fingerprint,next",
        "anomalyco/opencode:packages/opencode/test/plugin/meta.test.ts#tracks-file-plugin-loads-and-changes,tracks-npm-plugin-versions,serializes-concurrent-metadata-updates",
        "helix:packages/adapters-opencode/src/opencode-plugin-hot-reload-cleanup.ts#createOpenCodePluginHotReloadMetadata",
      ],
      cases,
      knownLossiness: [] as [],
      residualGaps: ["opencode-file-watcher-native-binding-not-replayed"] as ["opencode-file-watcher-native-binding-not-replayed"],
    }
    return {
      ...fixtureWithoutFingerprint,
      fingerprint: openCodePluginHotReloadCleanupFingerprintObject(fixtureWithoutFingerprint),
    }
  } finally {
    await rm(temp, { recursive: true, force: true })
  }
}

export function verifyOpenCodePluginHotReloadMetaNativeExactFixture(
  fixture: OpenCodePluginHotReloadMetaNativeExactFixture,
): OpenCodePluginHotReloadMetaNativeExactFixtureVerification {
  const issues: OpenCodePluginHotReloadMetaNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-plugin-hot-reload-meta.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.plugin.hot-reload-cleanup" || fixture.portID !== "hook.cleanup-scope") {
    add("opencode-plugin-hot-reload-meta.target", "Fixture must target opencode.plugin.hot-reload-cleanup and hook.cleanup-scope.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-plugin-hot-reload-meta.native-claim", "Plugin metadata fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) add("opencode-plugin-hot-reload-meta.lossiness", "Native plugin metadata fixture cannot retain known lossiness.")
  if (!fixture.residualGaps.includes("opencode-file-watcher-native-binding-not-replayed")) {
    add("opencode-plugin-hot-reload-meta.residual-gap", "Fixture must keep real @parcel/watcher native binding execution outside the metadata claim.")
  }
  for (const source of ["packages/opencode/src/plugin/meta.ts", "packages/opencode/test/plugin/meta.test.ts", "packages/adapters-opencode/src/opencode-plugin-hot-reload-cleanup.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-plugin-hot-reload-meta.source-ref", `Missing source ref ${source}.`)
  }
  for (const id of ["file-plugin-load-change-and-theme", "npm-plugin-version-fingerprint", "locked-concurrent-touch-counts"] as const) {
    if (!fixture.cases.some((item) => item.id === id)) add("opencode-plugin-hot-reload-meta.case-missing", `Missing case ${id}.`, id)
  }
  for (const item of fixture.cases) {
    if (!openCodePluginHotReloadCleanupSameJSON(item.actual, item.expected)) {
      add("opencode-plugin-hot-reload-meta.case", "Case actual output must match expected pinned OpenCode plugin metadata behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodePluginHotReloadCleanupFingerprintObject(withoutFingerprint)) {
    add("opencode-plugin-hot-reload-meta.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function openCodePluginHotReloadScopesForHost(host: LegoHookHost): Map<string, HookScope> {
  const existing = hotReloadScopesByHost.get(host)
  if (existing) return existing
  const scopes = new Map<string, HookScope>()
  hotReloadScopesByHost.set(host, scopes)
  return scopes
}

type OpenCodePluginHotReloadMetaCore = Omit<OpenCodePluginHotReloadMetaEntry, "first_time" | "last_time" | "time_changed" | "load_count" | "fingerprint" | "themes">

async function openCodePluginHotReloadMetaRow(
  item: OpenCodePluginHotReloadMetaTouch,
): Promise<OpenCodePluginHotReloadMetaTouch & { core: OpenCodePluginHotReloadMetaCore }> {
  return {
    ...item,
    core: await openCodePluginHotReloadMetaEntryCore(item),
  }
}

async function openCodePluginHotReloadMetaEntryCore(item: OpenCodePluginHotReloadMetaTouch): Promise<OpenCodePluginHotReloadMetaCore> {
  const source = openCodePluginHotReloadMetaSource(item.spec)
  if (source === "file") {
    const file = openCodePluginHotReloadMetaFileTarget(item.spec, item.target)
    const modified = file ? await openCodePluginHotReloadMetaModifiedAt(file) : undefined
    return {
      id: item.id,
      source,
      spec: item.spec,
      target: item.target,
      ...(modified === undefined ? {} : { modified }),
    }
  }
  const version = await openCodePluginHotReloadMetaNpmVersion(item.target)
  return {
    id: item.id,
    source,
    spec: item.spec,
    target: item.target,
    requested: openCodePluginHotReloadMetaParseSpecifier(item.spec).version,
    ...(version === undefined ? {} : { version }),
  }
}

function openCodePluginHotReloadMetaNext(
  prev: OpenCodePluginHotReloadMetaEntry | undefined,
  core: OpenCodePluginHotReloadMetaCore,
  now: number,
): { state: OpenCodePluginHotReloadMetaState; entry: OpenCodePluginHotReloadMetaEntry } {
  const entry: OpenCodePluginHotReloadMetaEntry = {
    ...core,
    first_time: prev?.first_time ?? now,
    last_time: now,
    time_changed: prev?.time_changed ?? now,
    load_count: (prev?.load_count ?? 0) + 1,
    fingerprint: openCodePluginHotReloadMetaFingerprint(core),
    ...(prev?.themes ? { themes: prev.themes } : {}),
  }
  const state: OpenCodePluginHotReloadMetaState = !prev ? "first" : prev.fingerprint === entry.fingerprint ? "same" : "updated"
  if (state === "updated") entry.time_changed = now
  return { state, entry }
}

function openCodePluginHotReloadMetaFingerprint(value: OpenCodePluginHotReloadMetaCore): string {
  if (value.source === "file") return [value.target, value.modified ?? ""].join("|")
  return [value.target, value.requested ?? "", value.version ?? ""].join("|")
}

async function openCodePluginHotReloadMetaRead(file: string): Promise<Record<string, OpenCodePluginHotReloadMetaEntry>> {
  const text = await readFile(file, "utf8").catch(() => "{}")
  const json = JSON.parse(text) as unknown
  return json && typeof json === "object" && !Array.isArray(json) ? json as Record<string, OpenCodePluginHotReloadMetaEntry> : {}
}

async function openCodePluginHotReloadMetaWrite(file: string, store: Record<string, OpenCodePluginHotReloadMetaEntry>): Promise<void> {
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(store, null, 2), "utf8")
}

async function openCodePluginHotReloadMetaWithLock<T>(file: string, retryMs: number, fn: () => Promise<T>): Promise<T> {
  await mkdir(dirname(file), { recursive: true })
  const lockFile = `${file}.lock`
  let handle: Awaited<ReturnType<typeof open>> | undefined
  while (!handle) {
    try {
      handle = await open(lockFile, "wx")
    } catch (error) {
      if (!openCodePluginHotReloadMetaIsLockBusy(error)) throw error
      await new Promise((resolve) => setTimeout(resolve, retryMs))
    }
  }
  try {
    return await fn()
  } finally {
    await handle.close().catch(() => {})
    await unlink(lockFile).catch(() => {})
  }
}

function openCodePluginHotReloadMetaIsLockBusy(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "EEXIST")
}

function openCodePluginHotReloadMetaSource(spec: string): OpenCodePluginHotReloadMetaSource {
  return spec.startsWith("file://") || spec.startsWith(".") || isAbsolute(spec) || /^[A-Za-z]:[\\/]/.test(spec) ? "file" : "npm"
}

function openCodePluginHotReloadMetaFileTarget(spec: string, target: string): string | undefined {
  if (spec.startsWith("file://")) return fileURLToPath(spec)
  if (target.startsWith("file://")) return fileURLToPath(target)
  return undefined
}

async function openCodePluginHotReloadMetaModifiedAt(file: string): Promise<number | undefined> {
  const info = await stat(file).catch(() => undefined)
  if (!info) return undefined
  return Math.floor(info.mtimeMs)
}

async function openCodePluginHotReloadMetaNpmVersion(target: string): Promise<string | undefined> {
  const resolved = target.startsWith("file://") ? fileURLToPath(target) : target
  const info = await stat(resolved).catch(() => undefined)
  const dir = info?.isDirectory() ? resolved : dirname(resolved)
  const text = await readFile(join(dir, "package.json"), "utf8").catch(() => undefined)
  if (!text) return undefined
  const json = JSON.parse(text) as unknown
  if (!json || typeof json !== "object" || Array.isArray(json)) return undefined
  const version = (json as Record<string, unknown>)["version"]
  return typeof version === "string" ? version : undefined
}

function openCodePluginHotReloadMetaParseSpecifier(spec: string): { pkg: string; version: string } {
  const raw = spec.startsWith("npm:") ? spec.slice("npm:".length) : spec
  const aliasIndex = raw.lastIndexOf("npm:")
  const value = aliasIndex >= 0 ? raw.slice(aliasIndex + "npm:".length) : raw
  if (value.startsWith("@")) {
    const slash = value.indexOf("/")
    if (slash < 0) return { pkg: value, version: "" }
    const afterName = value.indexOf("@", slash + 1)
    if (afterName < 0) return { pkg: value, version: "latest" }
    return { pkg: value.slice(0, afterName), version: value.slice(afterName + 1) || "latest" }
  }
  const at = value.lastIndexOf("@")
  if (at > 0) return { pkg: value.slice(0, at), version: value.slice(at + 1) || "latest" }
  return { pkg: value, version: "latest" }
}

function openCodePluginHotReloadMetaCompact(value: { state: OpenCodePluginHotReloadMetaState; entry: OpenCodePluginHotReloadMetaEntry }): Record<string, unknown> {
  return {
    state: value.state,
    source: value.entry.source,
    ...(value.entry.requested ? { requested: value.entry.requested } : {}),
    ...(value.entry.version ? { version: value.entry.version } : {}),
    ...(value.entry.modified !== undefined ? { modified: value.entry.modified } : {}),
    first_time: value.entry.first_time,
    last_time: value.entry.last_time,
    time_changed: value.entry.time_changed,
    load_count: value.entry.load_count,
    fingerprint: value.entry.fingerprint,
    ...(value.entry.themes ? { themes: value.entry.themes } : {}),
  }
}

function openCodePluginHotReloadMetaCompactSaved(value: OpenCodePluginHotReloadMetaEntry | undefined): Record<string, unknown> | undefined {
  if (!value) return undefined
  return {
    id: value.id,
    source: value.source,
    spec: value.spec,
    target: value.target,
    ...(value.modified !== undefined ? { modified: value.modified } : {}),
    ...(value.requested ? { requested: value.requested } : {}),
    ...(value.version ? { version: value.version } : {}),
    load_count: value.load_count,
    fingerprint: value.fingerprint,
    ...(value.themes ? { themes: value.themes } : {}),
  }
}

function openCodePluginHotReloadCleanupSameJSON(left: unknown, right: unknown): boolean {
  return openCodePluginHotReloadCleanupStableJSON(left) === openCodePluginHotReloadCleanupStableJSON(right)
}

function openCodePluginHotReloadCleanupFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodePluginHotReloadCleanupStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodePluginHotReloadCleanupStableJSON(value: unknown): string {
  return JSON.stringify(openCodePluginHotReloadCleanupSortStable(value))
}

function openCodePluginHotReloadCleanupSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodePluginHotReloadCleanupSortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodePluginHotReloadCleanupSortStable(entry)]),
  )
}
