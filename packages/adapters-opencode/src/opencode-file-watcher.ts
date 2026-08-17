import { createHash } from "node:crypto"
import { isAbsolute, relative } from "node:path"

export type OpenCodeFileWatcherBackend = "windows" | "fs-events" | "inotify"
export type OpenCodeFileWatcherParcelEvent = "create" | "update" | "delete"
export type OpenCodeFileWatcherEvent = "add" | "change" | "unlink"

export interface OpenCodeFileWatcherSubscriptionPlan {
  kind: "root" | "git"
  dir: string
  ignore: string[]
  backend: OpenCodeFileWatcherBackend
}

export interface OpenCodeFileWatcherPlanInput {
  directory: string
  worktree: string
  platform: NodeJS.Platform | string
  disabled?: boolean
  hasNativeBinding?: boolean
  experimentalFileWatcher?: boolean
  projectVcs?: "git" | "none"
  configIgnores?: string[]
  protectedPaths?: string[]
  gitDir?: string
  gitDirRealpath?: string
  gitEntries?: string[]
}

export interface OpenCodeFileWatcherPlan {
  enabled: boolean
  reason?: "disabled" | "unsupported-platform" | "missing-native-binding"
  backend?: OpenCodeFileWatcherBackend
  subscriptions: OpenCodeFileWatcherSubscriptionPlan[]
}

export interface OpenCodeFileWatcherRuntime {
  plan: OpenCodeFileWatcherPlan
  published: Array<{ file: string; event: OpenCodeFileWatcherEvent }>
  unsubscribed: string[]
  dispatch(input: { subscription: number; events: Array<{ path: string; type: OpenCodeFileWatcherParcelEvent | string }> }): void
  dispose(): Promise<void>
}

export interface OpenCodeFileWatcherNativeSubscription {
  unsubscribe(): Promise<void> | void
}

export type OpenCodeFileWatcherNativeSubscribeCallback = (
  error: unknown,
  events: Array<{ path: string; type: OpenCodeFileWatcherParcelEvent | string }>,
) => void

export interface OpenCodeFileWatcherNativeSubscribeDriver {
  subscribe(
    dir: string,
    callback: OpenCodeFileWatcherNativeSubscribeCallback,
    opts: { ignore: string[]; backend: OpenCodeFileWatcherBackend },
  ): Promise<OpenCodeFileWatcherNativeSubscription>
}

export interface OpenCodeFileWatcherNativeSubscribeRuntime {
  plan: OpenCodeFileWatcherPlan
  published: Array<{ file: string; event: OpenCodeFileWatcherEvent }>
  resolvedSubscriptions: string[]
  subscribeErrors: Array<{ dir: string; name: string; message: string }>
  lateUnsubscribed: string[]
  unsubscribed: string[]
  ready(): Promise<void>
  dispose(): Promise<void>
}

export interface OpenCodeFileWatcherNativeExactFixtureCase {
  id:
    | "backend-event-mapping-and-root-ignore"
    | "git-head-subscription-and-config-ignore"
    | "runtime-publish-and-dispose"
    | "native-subscribe-callback-timeout-and-dispose"
  actual: unknown
  expected: unknown
}

export interface OpenCodeFileWatcherNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.file.watcher"
  portID: "hook.cleanup-scope"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-file-watcher-native-exact-fixture"
  replayRef: "file-watcher-native-exact:opencode"
  fixtureID: "opencode-file-watcher:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeFileWatcherNativeExactFixtureCase[]
  knownLossiness: []
  residualGaps: ["opencode-file-watcher-native-binding-not-replayed"]
  fingerprint: string
}

export interface OpenCodeFileWatcherNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeFileWatcherNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeFileWatcherNativeExactFixtureIssue[]
}

export const openCodeFileWatcherIgnorePatterns = [
  "**/*.swp",
  "**/*.swo",
  "**/*.pyc",
  "**/.DS_Store",
  "**/Thumbs.db",
  "**/logs/**",
  "**/tmp/**",
  "**/temp/**",
  "**/*.log",
  "**/coverage/**",
  "**/.nyc_output/**",
  "node_modules",
  "bower_components",
  ".pnpm-store",
  "vendor",
  ".npm",
  "dist",
  "build",
  "out",
  ".next",
  "target",
  "bin",
  "obj",
  ".git",
  ".svn",
  ".hg",
  ".vscode",
  ".idea",
  ".turbo",
  ".output",
  "desktop",
  ".sst",
  ".cache",
  ".webkit-cache",
  "__pycache__",
  ".pytest_cache",
  "mypy_cache",
  ".history",
  ".gradle",
]

export function openCodeFileWatcherBackend(platform: NodeJS.Platform | string = process.platform): OpenCodeFileWatcherBackend | undefined {
  if (platform === "win32") return "windows"
  if (platform === "darwin") return "fs-events"
  if (platform === "linux") return "inotify"
  return undefined
}

export function openCodeFileWatcherMapParcelEvent(type: OpenCodeFileWatcherParcelEvent | string): OpenCodeFileWatcherEvent | undefined {
  if (type === "create") return "add"
  if (type === "update") return "change"
  if (type === "delete") return "unlink"
  return undefined
}

export function createOpenCodeFileWatcherPlan(input: OpenCodeFileWatcherPlanInput): OpenCodeFileWatcherPlan {
  if (input.disabled) return { enabled: false, reason: "disabled", subscriptions: [] }
  const backend = openCodeFileWatcherBackend(input.platform)
  if (!backend) return { enabled: false, reason: "unsupported-platform", subscriptions: [] }
  if (!input.hasNativeBinding) return { enabled: false, reason: "missing-native-binding", backend, subscriptions: [] }

  const configIgnores = input.configIgnores ?? []
  const subscriptions: OpenCodeFileWatcherSubscriptionPlan[] = []
  if (input.experimentalFileWatcher) {
    subscriptions.push({
      kind: "root",
      dir: input.directory,
      ignore: [...openCodeFileWatcherIgnorePatterns, ...configIgnores, ...openCodeFileWatcherProtectedPaths(input.directory, input.protectedPaths ?? [])],
      backend,
    })
  }

  if (input.projectVcs === "git") {
    const resolved = input.gitDir
    const vcsDir = input.gitDirRealpath ?? resolved
    if (
      vcsDir &&
      !configIgnores.includes(".git") &&
      !configIgnores.includes(vcsDir) &&
      (!resolved || !configIgnores.includes(resolved))
    ) {
      subscriptions.push({
        kind: "git",
        dir: vcsDir,
        ignore: (input.gitEntries ?? []).filter((entry) => entry !== "HEAD"),
        backend,
      })
    }
  }

  return { enabled: true, backend, subscriptions }
}

export function createOpenCodeFileWatcherRuntime(plan: OpenCodeFileWatcherPlan): OpenCodeFileWatcherRuntime {
  const published: Array<{ file: string; event: OpenCodeFileWatcherEvent }> = []
  const unsubscribed: string[] = []
  let disposed = false
  return {
    plan,
    published,
    unsubscribed,
    dispatch(input) {
      if (disposed) return
      const subscription = plan.subscriptions[input.subscription]
      if (!subscription) return
      for (const event of input.events) {
        const mapped = openCodeFileWatcherMapParcelEvent(event.type)
        if (!mapped) continue
        published.push({ file: event.path, event: mapped })
      }
    },
    async dispose() {
      if (disposed) return
      disposed = true
      for (const subscription of plan.subscriptions) unsubscribed.push(subscription.dir)
    },
  }
}

export function createOpenCodeFileWatcherNativeSubscribeRuntime(
  plan: OpenCodeFileWatcherPlan,
  input: { driver: OpenCodeFileWatcherNativeSubscribeDriver; timeoutMs?: number },
): OpenCodeFileWatcherNativeSubscribeRuntime {
  const timeoutMs = input.timeoutMs ?? 10_000
  const published: Array<{ file: string; event: OpenCodeFileWatcherEvent }> = []
  const resolvedSubscriptions: string[] = []
  const subscribeErrors: Array<{ dir: string; name: string; message: string }> = []
  const lateUnsubscribed: string[] = []
  const unsubscribed: string[] = []
  const subscriptions: Array<{ dir: string; subscription: OpenCodeFileWatcherNativeSubscription }> = []
  let disposed = false

  const tasks = plan.subscriptions.map((subscription) => {
    const callback: OpenCodeFileWatcherNativeSubscribeCallback = (_error, events) => {
      if (disposed) return
      for (const event of events) {
        const mapped = openCodeFileWatcherMapParcelEvent(event.type)
        if (!mapped) continue
        published.push({ file: event.path, event: mapped })
      }
    }
    const pending = input.driver.subscribe(subscription.dir, callback, {
      ignore: subscription.ignore,
      backend: subscription.backend,
    })
    return openCodeFileWatcherWithTimeout(pending, timeoutMs, subscription.dir)
      .then(async (nativeSubscription) => {
        if (disposed) {
          await nativeSubscription.unsubscribe()
          unsubscribed.push(subscription.dir)
          return
        }
        resolvedSubscriptions.push(subscription.dir)
        subscriptions.push({ dir: subscription.dir, subscription: nativeSubscription })
      })
      .catch((error) => {
        subscribeErrors.push({
          dir: subscription.dir,
          name: error instanceof Error ? error.name : typeof error,
          message: error instanceof Error ? error.message : String(error),
        })
        pending
          .then(async (nativeSubscription) => {
            await nativeSubscription.unsubscribe()
            lateUnsubscribed.push(subscription.dir)
          })
          .catch(() => {})
      })
  })

  return {
    plan,
    published,
    resolvedSubscriptions,
    subscribeErrors,
    lateUnsubscribed,
    unsubscribed,
    async ready() {
      await Promise.allSettled(tasks)
    },
    async dispose() {
      if (disposed) return
      disposed = true
      await Promise.allSettled(subscriptions.map(async (subscription) => {
        await subscription.subscription.unsubscribe()
        unsubscribed.push(subscription.dir)
      }))
    },
  }
}

export async function captureOpenCodeFileWatcherNativeExactFixture(): Promise<OpenCodeFileWatcherNativeExactFixture> {
  const rootPlan = createOpenCodeFileWatcherPlan({
    directory: "/repo",
    worktree: "/repo",
    platform: "linux",
    hasNativeBinding: true,
    experimentalFileWatcher: true,
    projectVcs: "none",
    configIgnores: ["custom-ignore", ".cache/custom"],
    protectedPaths: ["/repo/Downloads", "/repo", "/outside/Documents"],
  })
  const unsupported = createOpenCodeFileWatcherPlan({
    directory: "/repo",
    worktree: "/repo",
    platform: "freebsd",
    hasNativeBinding: true,
    experimentalFileWatcher: true,
  })
  const missingBinding = createOpenCodeFileWatcherPlan({
    directory: "/repo",
    worktree: "/repo",
    platform: "darwin",
    hasNativeBinding: false,
    experimentalFileWatcher: true,
  })

  const gitPlan = createOpenCodeFileWatcherPlan({
    directory: "/repo",
    worktree: "/repo",
    platform: "darwin",
    hasNativeBinding: true,
    experimentalFileWatcher: false,
    projectVcs: "git",
    gitDir: "/repo/.git",
    gitDirRealpath: "/private/tmp/repo.git",
    gitEntries: ["HEAD", "index", "refs", "objects"],
  })
  const gitIgnoredByName = createOpenCodeFileWatcherPlan({
    directory: "/repo",
    worktree: "/repo",
    platform: "darwin",
    hasNativeBinding: true,
    projectVcs: "git",
    configIgnores: [".git"],
    gitDir: "/repo/.git",
    gitEntries: ["HEAD", "index"],
  })
  const gitIgnoredByRealpath = createOpenCodeFileWatcherPlan({
    directory: "/repo",
    worktree: "/repo",
    platform: "darwin",
    hasNativeBinding: true,
    projectVcs: "git",
    configIgnores: ["/private/tmp/repo.git"],
    gitDir: "/repo/.git",
    gitDirRealpath: "/private/tmp/repo.git",
    gitEntries: ["HEAD", "index"],
  })

  const runtimePlan = createOpenCodeFileWatcherPlan({
    directory: "/repo",
    worktree: "/repo",
    platform: "linux",
    hasNativeBinding: true,
    experimentalFileWatcher: true,
    projectVcs: "git",
    gitDir: "/repo/.git",
    gitEntries: ["HEAD", "index"],
  })
  const runtime = createOpenCodeFileWatcherRuntime(runtimePlan)
  runtime.dispatch({
    subscription: 0,
    events: [
      { path: "/repo/new.txt", type: "create" },
      { path: "/repo/new.txt", type: "update" },
      { path: "/repo/new.txt", type: "delete" },
      { path: "/repo/noop.txt", type: "rename" },
    ],
  })
  runtime.dispatch({ subscription: 1, events: [{ path: "/repo/.git/HEAD", type: "update" }] })
  const beforeDispose = [...runtime.published]
  await runtime.dispose()
  runtime.dispatch({ subscription: 0, events: [{ path: "/repo/after.txt", type: "create" }] })

  const successCallbacks = new Map<string, OpenCodeFileWatcherNativeSubscribeCallback>()
  const successSubscribeCalls: Array<{ dir: string; opts: { ignore: string[]; backend: OpenCodeFileWatcherBackend } }> = []
  const successNativeUnsubscribed: string[] = []
  const nativeSubscribeSuccess = createOpenCodeFileWatcherNativeSubscribeRuntime(runtimePlan, {
    driver: {
      async subscribe(dir, callback, opts) {
        successSubscribeCalls.push({ dir, opts })
        successCallbacks.set(dir, callback)
        return {
          async unsubscribe() {
            successNativeUnsubscribed.push(dir)
          },
        }
      },
    },
    timeoutMs: 50,
  })
  await nativeSubscribeSuccess.ready()
  successCallbacks.get("/repo")?.(undefined, [
    { path: "/repo/native-new.txt", type: "create" },
    { path: "/repo/native-new.txt", type: "update" },
    { path: "/repo/native-new.txt", type: "rename" },
  ])
  successCallbacks.get("/repo/.git")?.(undefined, [{ path: "/repo/.git/HEAD", type: "update" }])
  const nativeBeforeDispose = [...nativeSubscribeSuccess.published]
  await nativeSubscribeSuccess.dispose()
  successCallbacks.get("/repo")?.(undefined, [{ path: "/repo/after-dispose.txt", type: "create" }])

  let timeoutResolve!: (subscription: OpenCodeFileWatcherNativeSubscription) => void
  const timeoutPending = new Promise<OpenCodeFileWatcherNativeSubscription>((resolve) => {
    timeoutResolve = resolve
  })
  const timeoutPlan: OpenCodeFileWatcherPlan = {
    enabled: true,
    backend: "inotify",
    subscriptions: [{ kind: "root", dir: "/timeout", ignore: ["slow"], backend: "inotify" }],
  }
  const timeoutNativeUnsubscribed: string[] = []
  const nativeSubscribeTimeout = createOpenCodeFileWatcherNativeSubscribeRuntime(timeoutPlan, {
    driver: {
      async subscribe() {
        return timeoutPending
      },
    },
    timeoutMs: 1,
  })
  await nativeSubscribeTimeout.ready()
  timeoutResolve({
    async unsubscribe() {
      timeoutNativeUnsubscribed.push("/timeout")
    },
  })
  await openCodeFileWatcherDelay(2)

  const rejectedPlan: OpenCodeFileWatcherPlan = {
    enabled: true,
    backend: "fs-events",
    subscriptions: [{ kind: "root", dir: "/reject", ignore: ["broken"], backend: "fs-events" }],
  }
  const nativeSubscribeRejected = createOpenCodeFileWatcherNativeSubscribeRuntime(rejectedPlan, {
    driver: {
      async subscribe() {
        throw new Error("subscribe boom")
      },
    },
    timeoutMs: 50,
  })
  await nativeSubscribeRejected.ready()

  const cases: OpenCodeFileWatcherNativeExactFixtureCase[] = [
    {
      id: "backend-event-mapping-and-root-ignore",
      actual: {
        backends: ["win32", "darwin", "linux", "freebsd"].map((platform) => [platform, openCodeFileWatcherBackend(platform)]),
        eventMap: ["create", "update", "delete", "rename"].map((event) => [event, openCodeFileWatcherMapParcelEvent(event)]),
        rootSubscription: rootPlan.subscriptions[0],
        unsupported,
        missingBinding,
      },
      expected: {
        backends: [["win32", "windows"], ["darwin", "fs-events"], ["linux", "inotify"], ["freebsd", undefined]],
        eventMap: [["create", "add"], ["update", "change"], ["delete", "unlink"], ["rename", undefined]],
        rootSubscription: {
          kind: "root",
          dir: "/repo",
          backend: "inotify",
          ignore: [...openCodeFileWatcherIgnorePatterns, "custom-ignore", ".cache/custom", "/repo/Downloads"],
        },
        unsupported: { enabled: false, reason: "unsupported-platform", subscriptions: [] },
        missingBinding: { enabled: false, reason: "missing-native-binding", backend: "fs-events", subscriptions: [] },
      },
    },
    {
      id: "git-head-subscription-and-config-ignore",
      actual: {
        gitSubscriptions: gitPlan.subscriptions,
        gitIgnoredByName: gitIgnoredByName.subscriptions,
        gitIgnoredByRealpath: gitIgnoredByRealpath.subscriptions,
      },
      expected: {
        gitSubscriptions: [
          { kind: "git", dir: "/private/tmp/repo.git", backend: "fs-events", ignore: ["index", "refs", "objects"] },
        ],
        gitIgnoredByName: [],
        gitIgnoredByRealpath: [],
      },
    },
    {
      id: "runtime-publish-and-dispose",
      actual: {
        subscriptions: runtimePlan.subscriptions.map((subscription) => [subscription.kind, subscription.dir, subscription.backend, subscription.ignore]),
        beforeDispose,
        afterDispose: runtime.published,
        unsubscribed: runtime.unsubscribed,
      },
      expected: {
        subscriptions: [
          ["root", "/repo", "inotify", openCodeFileWatcherIgnorePatterns],
          ["git", "/repo/.git", "inotify", ["index"]],
        ],
        beforeDispose: [
          { file: "/repo/new.txt", event: "add" },
          { file: "/repo/new.txt", event: "change" },
          { file: "/repo/new.txt", event: "unlink" },
          { file: "/repo/.git/HEAD", event: "change" },
        ],
        afterDispose: [
          { file: "/repo/new.txt", event: "add" },
          { file: "/repo/new.txt", event: "change" },
          { file: "/repo/new.txt", event: "unlink" },
          { file: "/repo/.git/HEAD", event: "change" },
        ],
        unsubscribed: ["/repo", "/repo/.git"],
      },
    },
    {
      id: "native-subscribe-callback-timeout-and-dispose",
      actual: {
        success: {
          subscribeCalls: successSubscribeCalls,
          resolvedSubscriptions: nativeSubscribeSuccess.resolvedSubscriptions,
          beforeDispose: nativeBeforeDispose,
          afterDispose: nativeSubscribeSuccess.published,
          runtimeUnsubscribed: nativeSubscribeSuccess.unsubscribed,
          nativeUnsubscribed: successNativeUnsubscribed,
          errors: nativeSubscribeSuccess.subscribeErrors,
        },
        timeout: {
          resolvedSubscriptions: nativeSubscribeTimeout.resolvedSubscriptions,
          errors: nativeSubscribeTimeout.subscribeErrors,
          lateUnsubscribed: nativeSubscribeTimeout.lateUnsubscribed,
          nativeUnsubscribed: timeoutNativeUnsubscribed,
        },
        rejected: {
          resolvedSubscriptions: nativeSubscribeRejected.resolvedSubscriptions,
          errors: nativeSubscribeRejected.subscribeErrors,
          lateUnsubscribed: nativeSubscribeRejected.lateUnsubscribed,
        },
      },
      expected: {
        success: {
          subscribeCalls: [
            { dir: "/repo", opts: { ignore: openCodeFileWatcherIgnorePatterns, backend: "inotify" } },
            { dir: "/repo/.git", opts: { ignore: ["index"], backend: "inotify" } },
          ],
          resolvedSubscriptions: ["/repo", "/repo/.git"],
          beforeDispose: [
            { file: "/repo/native-new.txt", event: "add" },
            { file: "/repo/native-new.txt", event: "change" },
            { file: "/repo/.git/HEAD", event: "change" },
          ],
          afterDispose: [
            { file: "/repo/native-new.txt", event: "add" },
            { file: "/repo/native-new.txt", event: "change" },
            { file: "/repo/.git/HEAD", event: "change" },
          ],
          runtimeUnsubscribed: ["/repo", "/repo/.git"],
          nativeUnsubscribed: ["/repo", "/repo/.git"],
          errors: [],
        },
        timeout: {
          resolvedSubscriptions: [],
          errors: [
            {
              dir: "/timeout",
              name: "OpenCodeFileWatcherSubscribeTimeoutError",
              message: "Timed out subscribing to /timeout after 1ms",
            },
          ],
          lateUnsubscribed: ["/timeout"],
          nativeUnsubscribed: ["/timeout"],
        },
        rejected: {
          resolvedSubscriptions: [],
          errors: [{ dir: "/reject", name: "Error", message: "subscribe boom" }],
          lateUnsubscribed: [],
        },
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.file.watcher" as const,
    portID: "hook.cleanup-scope" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-file-watcher-native-exact-fixture" as const,
    replayRef: "file-watcher-native-exact:opencode" as const,
    fixtureID: "opencode-file-watcher:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
	    sourceRefs: [
	      "anomalyco/opencode:packages/opencode/src/file/watcher.ts#FileWatcher.layer,backend,watcher,subscribe,Event.Updated,SUBSCRIBE_TIMEOUT_MS",
	      "anomalyco/opencode:packages/opencode/src/file/ignore.ts#FileIgnore.PATTERNS",
	      "anomalyco/opencode:packages/opencode/src/file/protected.ts#Protected.paths",
	      "anomalyco/opencode:packages/opencode/test/file/watcher.test.ts#root-events,cleanup-stops-publishing,git-head-events",
	      "helix:packages/adapters-opencode/src/opencode-file-watcher.ts#createOpenCodeFileWatcherPlan,createOpenCodeFileWatcherRuntime,createOpenCodeFileWatcherNativeSubscribeRuntime",
	    ],
    cases,
    knownLossiness: [] as [],
    residualGaps: ["opencode-file-watcher-native-binding-not-replayed"] as ["opencode-file-watcher-native-binding-not-replayed"],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeFileWatcherFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeFileWatcherNativeExactFixture(
  fixture: OpenCodeFileWatcherNativeExactFixture,
): OpenCodeFileWatcherNativeExactFixtureVerification {
  const issues: OpenCodeFileWatcherNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-file-watcher.native-schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.file.watcher" || fixture.portID !== "hook.cleanup-scope") {
    add("opencode-file-watcher.target", "Fixture must target opencode.file.watcher and hook.cleanup-scope.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-file-watcher.native-claim", "File watcher fixture must retain native exact status for injectable watcher semantics.")
  }
  if (fixture.knownLossiness.length !== 0) add("opencode-file-watcher.lossiness", "Native file watcher fixture cannot retain known lossiness.")
  if (!fixture.residualGaps.includes("opencode-file-watcher-native-binding-not-replayed")) {
    add("opencode-file-watcher.residual-gap", "Fixture must keep real @parcel/watcher native binding execution outside the injectable watcher claim.")
  }
  for (const source of ["packages/opencode/src/file/watcher.ts", "packages/opencode/src/file/ignore.ts", "packages/opencode/src/file/protected.ts", "packages/opencode/test/file/watcher.test.ts", "packages/adapters-opencode/src/opencode-file-watcher.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-file-watcher.source-ref", `Missing source ref ${source}.`)
  }
  for (const id of ["backend-event-mapping-and-root-ignore", "git-head-subscription-and-config-ignore", "runtime-publish-and-dispose", "native-subscribe-callback-timeout-and-dispose"] as const) {
    if (!fixture.cases.some((item) => item.id === id)) add("opencode-file-watcher.case-missing", `Missing case ${id}.`, id)
  }
  for (const item of fixture.cases) {
    if (!openCodeFileWatcherSameJSON(item.actual, item.expected)) {
      add("opencode-file-watcher.case", "Case actual output must match expected pinned OpenCode file watcher behavior.", item.id)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeFileWatcherFingerprintObject(withoutFingerprint)) {
    add("opencode-file-watcher.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function openCodeFileWatcherProtectedPaths(dir: string, protectedPaths: string[]): string[] {
  return protectedPaths.filter((item) => {
    const rel = relative(dir, item)
    return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel)
  })
}

class OpenCodeFileWatcherSubscribeTimeoutError extends Error {
  constructor(dir: string, timeoutMs: number) {
    super(`Timed out subscribing to ${dir} after ${timeoutMs}ms`)
    this.name = "OpenCodeFileWatcherSubscribeTimeoutError"
  }
}

function openCodeFileWatcherWithTimeout<T>(promise: Promise<T>, timeoutMs: number, dir: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new OpenCodeFileWatcherSubscribeTimeoutError(dir, timeoutMs))
    }, timeoutMs)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

function openCodeFileWatcherDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function openCodeFileWatcherSameJSON(left: unknown, right: unknown): boolean {
  return openCodeFileWatcherStableJSON(left) === openCodeFileWatcherStableJSON(right)
}

function openCodeFileWatcherFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeFileWatcherStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeFileWatcherStableJSON(value: unknown): string {
  return JSON.stringify(openCodeFileWatcherSortStable(value))
}

function openCodeFileWatcherSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeFileWatcherSortStable)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeFileWatcherSortStable(entry)]),
  )
}
