import { createHash } from "node:crypto"

export interface OpenCodeWorkspaceAdapter {
  name: string
  description: string
  configure?: unknown
  create?: unknown
  list?: unknown
  remove?: unknown
  target?: unknown
  [key: string]: unknown
}

export interface OpenCodeWorkspaceAdapterEntry {
  type: string
  name: string
  description: string
}

export interface OpenCodeWorkspaceFilesystemRegistry {
  getAdapter(projectID: string, type: string): OpenCodeWorkspaceAdapter
  listAdapters(projectID: string): OpenCodeWorkspaceAdapterEntry[]
  registeredAdapters(projectID: string): Array<[string, OpenCodeWorkspaceAdapter]>
  registerAdapter(projectID: string, type: string, adapter: OpenCodeWorkspaceAdapter): void
}

export interface OpenCodeWorkspaceFilesystemHost {
  services: Map<string, unknown>
}

export interface OpenCodeWorkspaceFilesystemSource {
  id: string
  path?: string
  scope?: string
}

export interface OpenCodeWorkspaceFilesystemPluginInput {
  directory: string
  experimental_workspace?: {
    register(type: string, adapter: unknown): void
  }
  [key: string]: unknown
}

export interface OpenCodeWorkspaceFilesystemBridge {
  createRegistry(input?: { builtin?: Record<string, OpenCodeWorkspaceAdapter> }): OpenCodeWorkspaceFilesystemRegistry
  register(input: {
    registry: OpenCodeWorkspaceFilesystemRegistry
    projectID: string
    type: string
    adapter: OpenCodeWorkspaceAdapter
    host?: OpenCodeWorkspaceFilesystemHost
    source?: OpenCodeWorkspaceFilesystemSource
    externalRegister?: (type: string, adapter: OpenCodeWorkspaceAdapter) => void
  }): void
  withWorkspace(input: {
    registry: OpenCodeWorkspaceFilesystemRegistry
    projectID: string
    host: OpenCodeWorkspaceFilesystemHost
    source: OpenCodeWorkspaceFilesystemSource
    pluginInput: OpenCodeWorkspaceFilesystemPluginInput
  }): OpenCodeWorkspaceFilesystemPluginInput
}

export interface OpenCodeWorkspaceFilesystemNativeExactFixtureCase {
  id:
    | "builtin-worktree-and-unknown-adapter"
    | "project-scoped-custom-adapter-registration"
    | "plugin-input-registers-locally-and-forwards"
    | "same-type-multiple-plugin-sources"
    | "adapter-object-reference-retained"
  actual: unknown
  expected: unknown
}

export interface OpenCodeWorkspaceFilesystemNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.workspace-filesystem-bridge"
  portID: "filesystem.port"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-workspace-filesystem-native-exact-fixture"
  replayRef: "workspace-filesystem-native-exact:opencode"
  fixtureID: "opencode-workspace-filesystem:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeWorkspaceFilesystemNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeWorkspaceFilesystemNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeWorkspaceFilesystemNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeWorkspaceFilesystemNativeExactFixtureIssue[]
}

export function createOpenCodeWorkspaceFilesystemBridge(): OpenCodeWorkspaceFilesystemBridge {
  return {
    createRegistry: createOpenCodeWorkspaceFilesystemRegistry,
    register: openCodeWorkspaceFilesystemRegister,
    withWorkspace(input) {
      const existing = input.pluginInput.experimental_workspace
      return {
        ...input.pluginInput,
        experimental_workspace: {
          register(type, adapter) {
            const externalRegister = existing
              ? (registeredType: string, registeredAdapter: OpenCodeWorkspaceAdapter) => existing.register(registeredType, registeredAdapter)
              : undefined
            openCodeWorkspaceFilesystemRegister({
              registry: input.registry,
              projectID: input.projectID,
              host: input.host,
              source: input.source,
              type,
              adapter: adapter as OpenCodeWorkspaceAdapter,
              ...(externalRegister ? { externalRegister } : {}),
            })
          },
        },
      }
    },
  }
}

export function createOpenCodeWorkspaceFilesystemRegistry(input: {
  builtin?: Record<string, OpenCodeWorkspaceAdapter>
} = {}): OpenCodeWorkspaceFilesystemRegistry {
  const builtin = input.builtin ?? {
    worktree: {
      name: "Worktree",
      description: "Create workspaces backed by local git worktrees",
    },
  }
  const state = new Map<string, Map<string, OpenCodeWorkspaceAdapter>>()
  return {
    getAdapter(projectID, type) {
      const custom = state.get(projectID)?.get(type)
      if (custom) return custom
      const builtinAdapter = builtin[type]
      if (builtinAdapter) return builtinAdapter
      throw new Error(`Unknown workspace adapter: ${type}`)
    },
    listAdapters(projectID) {
      return this.registeredAdapters(projectID).map(([type, adapter]) => ({
        type,
        name: adapter.name,
        description: adapter.description,
      }))
    },
    registeredAdapters(projectID) {
      const adapters = new Map(Object.entries(builtin))
      for (const [type, adapter] of state.get(projectID)?.entries() ?? []) adapters.set(type, adapter)
      return [...adapters.entries()]
    },
    registerAdapter(projectID, type, adapter) {
      const adapters = state.get(projectID) ?? new Map<string, OpenCodeWorkspaceAdapter>()
      adapters.set(type, adapter)
      state.set(projectID, adapters)
    },
  }
}

export function openCodeWorkspaceFilesystemRegister(input: {
  registry: OpenCodeWorkspaceFilesystemRegistry
  projectID: string
  type: string
  adapter: OpenCodeWorkspaceAdapter
  host?: OpenCodeWorkspaceFilesystemHost
  source?: OpenCodeWorkspaceFilesystemSource
  externalRegister?: (type: string, adapter: OpenCodeWorkspaceAdapter) => void
}): void {
  input.registry.registerAdapter(input.projectID, input.type, input.adapter)
  if (input.host && input.source) {
    const registration = {
      type: input.type,
      adapter: input.adapter,
      source: input.source,
    }
    const key = `opencode.experimental_workspace:${input.type}`
    const registrations = readWorkspaceRegistrations(input.host.services.get(key))
    registrations.push(registration)
    input.host.services.set(key, registrations)
    input.host.services.set(`${key}:${input.source.id}`, registration)
  }
  input.externalRegister?.(input.type, input.adapter)
}

export function captureOpenCodeWorkspaceFilesystemNativeExactFixture(): OpenCodeWorkspaceFilesystemNativeExactFixture {
  const bridge = createOpenCodeWorkspaceFilesystemBridge()
  const cases: OpenCodeWorkspaceFilesystemNativeExactFixtureCase[] = []
  const builtinWorktree = { name: "Worktree", description: "Create workspaces backed by local git worktrees" }

  const builtinRegistry = bridge.createRegistry({ builtin: { worktree: builtinWorktree } })
  cases.push({
    id: "builtin-worktree-and-unknown-adapter",
    actual: {
      list: builtinRegistry.listAdapters("prj_a"),
      getBuiltin: serializeWorkspaceAdapter(builtinRegistry.getAdapter("prj_a", "worktree")),
      missing: captureError(() => builtinRegistry.getAdapter("prj_a", "missing")),
    },
    expected: {
      list: [{ type: "worktree", name: "Worktree", description: "Create workspaces backed by local git worktrees" }],
      getBuiltin: { name: "Worktree", description: "Create workspaces backed by local git worktrees" },
      missing: "Unknown workspace adapter: missing",
    },
  })

  const customRegistry = bridge.createRegistry({ builtin: { worktree: builtinWorktree } })
  const folderAdapter = { name: "Folder", description: "Open folders" }
  const replacementWorktree = { name: "Plugin Worktree", description: "Override project worktree" }
  customRegistry.registerAdapter("prj_a", "folder", folderAdapter)
  customRegistry.registerAdapter("prj_a", "worktree", replacementWorktree)
  cases.push({
    id: "project-scoped-custom-adapter-registration",
    actual: {
      projectA: customRegistry.registeredAdapters("prj_a").map(([type, adapter]) => [type, serializeWorkspaceAdapter(adapter)]),
      projectB: customRegistry.registeredAdapters("prj_b").map(([type, adapter]) => [type, serializeWorkspaceAdapter(adapter)]),
      projectAWorktreeIsReplacement: customRegistry.getAdapter("prj_a", "worktree") === replacementWorktree,
      projectBWorktreeIsBuiltin: customRegistry.getAdapter("prj_b", "worktree") === builtinWorktree,
    },
    expected: {
      projectA: [
        ["worktree", { name: "Plugin Worktree", description: "Override project worktree" }],
        ["folder", { name: "Folder", description: "Open folders" }],
      ],
      projectB: [["worktree", { name: "Worktree", description: "Create workspaces backed by local git worktrees" }]],
      projectAWorktreeIsReplacement: true,
      projectBWorktreeIsBuiltin: true,
    },
  })

  const host: OpenCodeWorkspaceFilesystemHost = { services: new Map<string, unknown>() }
  const forwarded: unknown[] = []
  const pluginRegistry = bridge.createRegistry({ builtin: { worktree: builtinWorktree } })
  const pluginInput = bridge.withWorkspace({
    registry: pluginRegistry,
    projectID: "prj_plugin",
    host,
    source: { id: "workspace-plugin", path: "/repo/plugin.ts", scope: "project" },
    pluginInput: {
      directory: "/repo",
      experimental_workspace: {
        register(type, adapter) {
          forwarded.push({ type, adapter: serializeWorkspaceAdapter(adapter as OpenCodeWorkspaceAdapter) })
        },
      },
    },
  })
  pluginInput.experimental_workspace?.register("folder", folderAdapter)
  cases.push({
    id: "plugin-input-registers-locally-and-forwards",
    actual: {
      registry: pluginRegistry.registeredAdapters("prj_plugin").map(([type, adapter]) => [type, serializeWorkspaceAdapter(adapter)]),
      services: serializeWorkspaceServices(host.services),
      forwarded,
    },
    expected: {
      registry: [
        ["worktree", { name: "Worktree", description: "Create workspaces backed by local git worktrees" }],
        ["folder", { name: "Folder", description: "Open folders" }],
      ],
      services: [
        [
          "opencode.experimental_workspace:folder",
          [
            {
              type: "folder",
              adapter: { name: "Folder", description: "Open folders" },
              source: { id: "workspace-plugin", path: "/repo/plugin.ts", scope: "project" },
            },
          ],
        ],
        [
          "opencode.experimental_workspace:folder:workspace-plugin",
          {
            type: "folder",
            adapter: { name: "Folder", description: "Open folders" },
            source: { id: "workspace-plugin", path: "/repo/plugin.ts", scope: "project" },
          },
        ],
      ],
      forwarded: [{ type: "folder", adapter: { name: "Folder", description: "Open folders" } }],
    },
  })

  const multiHost: OpenCodeWorkspaceFilesystemHost = { services: new Map<string, unknown>() }
  const multiRegistry = bridge.createRegistry({ builtin: { worktree: builtinWorktree } })
  bridge.register({ registry: multiRegistry, projectID: "prj_multi", host: multiHost, source: { id: "first" }, type: "remote", adapter: { name: "Remote A", description: "First remote" } })
  bridge.register({ registry: multiRegistry, projectID: "prj_multi", host: multiHost, source: { id: "second" }, type: "remote", adapter: { name: "Remote B", description: "Second remote" } })
  cases.push({
    id: "same-type-multiple-plugin-sources",
    actual: {
      registered: multiRegistry.registeredAdapters("prj_multi").map(([type, adapter]) => [type, serializeWorkspaceAdapter(adapter)]),
      services: serializeWorkspaceServices(multiHost.services),
    },
    expected: {
      registered: [
        ["worktree", { name: "Worktree", description: "Create workspaces backed by local git worktrees" }],
        ["remote", { name: "Remote B", description: "Second remote" }],
      ],
      services: [
        [
          "opencode.experimental_workspace:remote",
          [
            { type: "remote", adapter: { name: "Remote A", description: "First remote" }, source: { id: "first" } },
            { type: "remote", adapter: { name: "Remote B", description: "Second remote" }, source: { id: "second" } },
          ],
        ],
        [
          "opencode.experimental_workspace:remote:first",
          { type: "remote", adapter: { name: "Remote A", description: "First remote" }, source: { id: "first" } },
        ],
        [
          "opencode.experimental_workspace:remote:second",
          { type: "remote", adapter: { name: "Remote B", description: "Second remote" }, source: { id: "second" } },
        ],
      ],
    },
  })

  const identityRegistry = bridge.createRegistry({ builtin: { worktree: builtinWorktree } })
  const identityAdapter = { name: "Identity", description: "Keep reference", configure: () => ({}) }
  identityRegistry.registerAdapter("prj_identity", "identity", identityAdapter)
  cases.push({
    id: "adapter-object-reference-retained",
    actual: {
      sameReference: identityRegistry.getAdapter("prj_identity", "identity") === identityAdapter,
      list: identityRegistry.listAdapters("prj_identity"),
    },
    expected: {
      sameReference: true,
      list: [
        { type: "worktree", name: "Worktree", description: "Create workspaces backed by local git worktrees" },
        { type: "identity", name: "Identity", description: "Keep reference" },
      ],
    },
  })

  const fixtureWithoutFingerprint: Omit<OpenCodeWorkspaceFilesystemNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    product: "opencode",
    atomID: "opencode.workspace-filesystem-bridge",
    portID: "filesystem.port",
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
    evidenceRef: "conformance:opencode-workspace-filesystem-native-exact-fixture",
    replayRef: "workspace-filesystem-native-exact:opencode",
    fixtureID: "opencode-workspace-filesystem:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/plugin/index.ts#experimental_workspace.register",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/control-plane/adapters/index.ts#getAdapter,listAdapters,registeredAdapters,registerAdapter",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/control-plane/types.ts#WorkspaceAdapter,WorkspaceAdapterEntry",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/plugin/src/index.ts#PluginInput,WorkspaceAdapter",
    ],
    cases,
    knownLossiness: [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeWorkspaceFilesystemNativeExactFixture(
  fixture: OpenCodeWorkspaceFilesystemNativeExactFixture,
): OpenCodeWorkspaceFilesystemNativeExactFixtureVerification {
  const issues: OpenCodeWorkspaceFilesystemNativeExactFixtureIssue[] = []
  const expectedCaseIDs: OpenCodeWorkspaceFilesystemNativeExactFixtureCase["id"][] = [
    "builtin-worktree-and-unknown-adapter",
    "project-scoped-custom-adapter-registration",
    "plugin-input-registers-locally-and-forwards",
    "same-type-multiple-plugin-sources",
    "adapter-object-reference-retained",
  ]
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-workspace-filesystem.schema", "Fixture must use schema version 1.")
  if (fixture.product !== "opencode" || fixture.atomID !== "opencode.workspace-filesystem-bridge" || fixture.portID !== "filesystem.port") {
    add("opencode-workspace-filesystem.target", "Fixture must target opencode.workspace-filesystem-bridge and filesystem.port.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-workspace-filesystem.native-claim", "Workspace filesystem fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) add("opencode-workspace-filesystem.lossiness", "Native workspace filesystem fixture cannot retain known lossiness.")
  for (const source of ["plugin/index.ts", "control-plane/adapters/index.ts", "control-plane/types.ts", "packages/plugin/src/index.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-workspace-filesystem.source-ref", `Missing source ref ${source}.`)
  }
  for (const expectedID of expectedCaseIDs) {
    const item = fixture.cases.find((candidate) => candidate.id === expectedID)
    if (!item) {
      add("opencode-workspace-filesystem.case-missing", `Missing ${expectedID} fixture case.`, expectedID)
      continue
    }
    if (!sameJSON(item.actual, item.expected)) add("opencode-workspace-filesystem.case", "Case actual output must match expected OpenCode workspace adapter behavior.", item.id)
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== fingerprintObject(withoutFingerprint)) add("opencode-workspace-filesystem.fingerprint", "Fixture fingerprint must match canonical content.")
  return { ok: issues.length === 0, issues }
}

function readWorkspaceRegistrations(value: unknown): Array<{ type: string; adapter: OpenCodeWorkspaceAdapter; source: OpenCodeWorkspaceFilesystemSource }> {
  return Array.isArray(value) ? [...(value as Array<{ type: string; adapter: OpenCodeWorkspaceAdapter; source: OpenCodeWorkspaceFilesystemSource }>)] : []
}

function serializeWorkspaceAdapter(adapter: OpenCodeWorkspaceAdapter): Record<string, unknown> {
  return {
    name: adapter.name,
    description: adapter.description,
  }
}

function serializeWorkspaceRegistration(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value
  const record = value as { type?: unknown; adapter?: unknown; source?: unknown }
  return {
    type: record.type,
    adapter: record.adapter && typeof record.adapter === "object" && !Array.isArray(record.adapter)
      ? serializeWorkspaceAdapter(record.adapter as OpenCodeWorkspaceAdapter)
      : record.adapter,
    source: record.source,
  }
}

function serializeWorkspaceServices(services: Map<string, unknown>): unknown[] {
  return [...services.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => [
      key,
      Array.isArray(value)
        ? value.map(serializeWorkspaceRegistration)
        : serializeWorkspaceRegistration(value),
    ])
}

function captureError(fn: () => unknown): string | undefined {
  try {
    fn()
    return undefined
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

function sameJSON(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right)
}

function fingerprintObject(input: unknown): string {
  return createHash("sha256").update(stableStringify(input)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (value === undefined) return "undefined"
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`
}
