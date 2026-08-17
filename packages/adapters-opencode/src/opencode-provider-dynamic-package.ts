import { createHash } from "node:crypto"
import { pathToFileURL } from "node:url"

export interface OpenCodeDynamicProviderPackageEvent {
  model?: unknown
  package: string
  options: Record<string, unknown>
  sdk?: unknown
}

export interface OpenCodeDynamicProviderPackageNpmAddResult {
  entrypoint?: string
}

export type OpenCodeDynamicProviderPackageNpmAdd = (
  packageName: string,
) => Promise<OpenCodeDynamicProviderPackageNpmAddResult> | OpenCodeDynamicProviderPackageNpmAddResult

export type OpenCodeDynamicProviderPackageImporter = (
  specifier: string,
) => Promise<Record<string, unknown>> | Record<string, unknown>

export interface OpenCodeDynamicProviderPackageBridge {
  apply(input: {
    event: OpenCodeDynamicProviderPackageEvent
    npmAdd?: OpenCodeDynamicProviderPackageNpmAdd
    importer?: OpenCodeDynamicProviderPackageImporter
  }): Promise<OpenCodeDynamicProviderPackageApplyResult>
}

export interface OpenCodeDynamicProviderPackageApplyResult {
  event: OpenCodeDynamicProviderPackageEvent
  skippedExistingSDK: boolean
  packageName: string
  installedPath?: string
  importSpecifier?: string
  factoryExport?: string
}

export interface OpenCodeDynamicProviderPackageNativeExactFixtureCase {
  id:
    | "existing-sdk-short-circuits"
    | "file-url-factory-export"
    | "npm-entrypoint-path-to-file-url"
    | "first-create-export-wins"
    | "missing-entrypoint-error"
    | "missing-create-export-error"
    | "truthy-non-function-create-export-error"
  actual: unknown
  expected: unknown
}

export interface OpenCodeDynamicProviderPackageNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.provider.dynamic-package"
  portID: "provider.model-registry"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-provider-dynamic-package-native-exact-fixture"
  replayRef: "provider-dynamic-package-native-exact:opencode"
  fixtureID: "opencode-provider-dynamic-package:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeDynamicProviderPackageNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeDynamicProviderPackageNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeDynamicProviderPackageNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeDynamicProviderPackageNativeExactFixtureIssue[]
}

export function createOpenCodeDynamicProviderPackageBridge(): OpenCodeDynamicProviderPackageBridge {
  return {
    apply: openCodeDynamicProviderPackageApply,
  }
}

export async function openCodeDynamicProviderPackageApply(input: {
  event: OpenCodeDynamicProviderPackageEvent
  npmAdd?: OpenCodeDynamicProviderPackageNpmAdd
  importer?: OpenCodeDynamicProviderPackageImporter
}): Promise<OpenCodeDynamicProviderPackageApplyResult> {
  const event = input.event
  if (event.sdk) {
    return {
      event,
      skippedExistingSDK: true,
      packageName: event.package,
    }
  }

  const installedPath = event.package.startsWith("file://")
    ? event.package
    : (await (input.npmAdd ?? defaultNpmAdd)(event.package)).entrypoint
  if (!installedPath) throw new Error(`Package ${event.package} has no import entrypoint`)

  const importSpecifier = installedPath.startsWith("file://")
    ? installedPath
    : pathToFileURL(installedPath).href
  const mod = await (input.importer ?? defaultImporter)(importSpecifier)
  const factoryExport = Object.keys(mod).find((name) => name.startsWith("create"))
  if (!factoryExport) throw new Error(`Package ${event.package} has no provider factory export`)
  event.sdk = (mod[factoryExport] as (options: Record<string, unknown>) => unknown)(event.options)

  return {
    event,
    skippedExistingSDK: false,
    packageName: event.package,
    installedPath,
    importSpecifier,
    factoryExport,
  }
}

export async function captureOpenCodeDynamicProviderPackageNativeExactFixture(): Promise<OpenCodeDynamicProviderPackageNativeExactFixture> {
  const bridge = createOpenCodeDynamicProviderPackageBridge()

  const existingCalls: string[] = []
  const existingEvent: OpenCodeDynamicProviderPackageEvent = {
    package: "@opencode/provider-existing",
    options: { model: "existing" },
    sdk: { id: "already-loaded" },
  }
  const existing = await bridge.apply({
    event: existingEvent,
    npmAdd(packageName) {
      existingCalls.push(`npm:${packageName}`)
      return { entrypoint: "/should-not-load.js" }
    },
    importer(specifier) {
      existingCalls.push(`import:${specifier}`)
      return {}
    },
  })

  const fileEvent: OpenCodeDynamicProviderPackageEvent = {
    package: "file:///repo/provider-file.mjs",
    options: { apiKey: "redacted", model: "poe/sage" },
  }
  const fileImportSpecifiers: string[] = []
  const fileResult = await bridge.apply({
    event: fileEvent,
    importer(specifier) {
      fileImportSpecifiers.push(specifier)
      return {
        createPoeProvider(options: Record<string, unknown>) {
          return { provider: "poe", options }
        },
      }
    },
  })

  const npmEvent: OpenCodeDynamicProviderPackageEvent = {
    package: "@opencode/provider-anthropic",
    options: { cache: true },
  }
  const npmAddCalls: string[] = []
  const npmResult = await bridge.apply({
    event: npmEvent,
    npmAdd(packageName) {
      npmAddCalls.push(packageName)
      return { entrypoint: "/repo/node_modules/@opencode/provider-anthropic/index.js" }
    },
    importer() {
      return {
        helper: "ignored",
        createAnthropicProvider(options: Record<string, unknown>) {
          return { provider: "anthropic", options }
        },
      }
    },
  })

  const firstCreateEvent: OpenCodeDynamicProviderPackageEvent = {
    package: "file:///repo/provider-multi.mjs",
    options: { selected: true },
  }
  const firstCreate = await bridge.apply({
    event: firstCreateEvent,
    importer() {
      return {
        createAlpha(options: Record<string, unknown>) {
          return { provider: "alpha", options }
        },
        createBeta(options: Record<string, unknown>) {
          return { provider: "beta", options }
        },
      }
    },
  })

  const cases: OpenCodeDynamicProviderPackageNativeExactFixtureCase[] = [
    {
      id: "existing-sdk-short-circuits",
      actual: {
        sdk: existing.event.sdk,
        skippedExistingSDK: existing.skippedExistingSDK,
        calls: existingCalls,
      },
      expected: {
        sdk: { id: "already-loaded" },
        skippedExistingSDK: true,
        calls: [],
      },
    },
    {
      id: "file-url-factory-export",
      actual: {
        installedPath: fileResult.installedPath,
        importSpecifier: fileResult.importSpecifier,
        factoryExport: fileResult.factoryExport,
        importSpecifiers: fileImportSpecifiers,
        sdk: fileResult.event.sdk,
      },
      expected: {
        installedPath: "file:///repo/provider-file.mjs",
        importSpecifier: "file:///repo/provider-file.mjs",
        factoryExport: "createPoeProvider",
        importSpecifiers: ["file:///repo/provider-file.mjs"],
        sdk: { provider: "poe", options: { apiKey: "redacted", model: "poe/sage" } },
      },
    },
    {
      id: "npm-entrypoint-path-to-file-url",
      actual: {
        npmAddCalls,
        installedPath: npmResult.installedPath,
        importSpecifier: npmResult.importSpecifier,
        factoryExport: npmResult.factoryExport,
        sdk: npmResult.event.sdk,
      },
      expected: {
        npmAddCalls: ["@opencode/provider-anthropic"],
        installedPath: "/repo/node_modules/@opencode/provider-anthropic/index.js",
        importSpecifier: pathToFileURL("/repo/node_modules/@opencode/provider-anthropic/index.js").href,
        factoryExport: "createAnthropicProvider",
        sdk: { provider: "anthropic", options: { cache: true } },
      },
    },
    {
      id: "first-create-export-wins",
      actual: {
        factoryExport: firstCreate.factoryExport,
        sdk: firstCreate.event.sdk,
      },
      expected: {
        factoryExport: "createAlpha",
        sdk: { provider: "alpha", options: { selected: true } },
      },
    },
    {
      id: "missing-entrypoint-error",
      actual: await captureDynamicProviderError(() =>
        bridge.apply({
          event: { package: "@opencode/provider-missing", options: {} },
          npmAdd: () => ({}),
        }),
      ),
      expected: "Package @opencode/provider-missing has no import entrypoint",
    },
    {
      id: "missing-create-export-error",
      actual: await captureDynamicProviderError(() =>
        bridge.apply({
          event: { package: "file:///repo/provider-no-create.mjs", options: {} },
          importer: () => ({ provider: () => ({}) }),
        }),
      ),
      expected: "Package file:///repo/provider-no-create.mjs has no provider factory export",
    },
    {
      id: "truthy-non-function-create-export-error",
      actual: await captureDynamicProviderErrorSummary(() =>
        bridge.apply({
          event: { package: "file:///repo/provider-bad-create.mjs", options: {} },
          importer: () => ({ createBadProvider: { not: "callable" } }),
        }),
      ),
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
    atomID: "opencode.provider.dynamic-package" as const,
    portID: "provider.model-registry" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-provider-dynamic-package-native-exact-fixture" as const,
    replayRef: "provider-dynamic-package-native-exact:opencode" as const,
    fixtureID: "opencode-provider-dynamic-package:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/provider/dynamic.ts#DynamicProviderPlugin,aisdk.sdk,Npm.add,pathToFileURL,create*",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/provider/index.ts#ProviderPlugins,DynamicProviderPlugin",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeDynamicProviderPackageFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeDynamicProviderPackageNativeExactFixture(
  fixture: OpenCodeDynamicProviderPackageNativeExactFixture,
): OpenCodeDynamicProviderPackageNativeExactFixtureVerification {
  const issues: OpenCodeDynamicProviderPackageNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (
    fixture.atomID !== "opencode.provider.dynamic-package" ||
    fixture.portID !== "provider.model-registry" ||
    fixture.fixtureID !== "opencode-provider-dynamic-package:native-exact-fixture"
  ) {
    add("opencode-provider-dynamic-package-native-exact.identity", "OpenCode dynamic provider package fixture identity drifted.")
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    add("opencode-provider-dynamic-package-native-exact.native-claim", "Dynamic provider package fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-provider-dynamic-package-native-exact.lossiness", "Dynamic provider package fixture cannot retain known lossiness.")
  }
  for (const source of ["packages/core/src/plugin/provider/dynamic.ts", "packages/core/src/plugin/provider/index.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source) && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
      add("opencode-provider-dynamic-package-native-exact.source", `Missing upstream source ${source}.`)
    }
  }
  for (const item of fixture.cases) {
    if (!openCodeDynamicProviderPackageSameJSON(item.actual, item.expected)) {
      add("opencode-provider-dynamic-package-native-exact.case", "Case output must match pinned DynamicProviderPlugin behavior.", item.id)
    }
  }
  for (const required of ["existing-sdk-short-circuits", "npm-entrypoint-path-to-file-url", "missing-entrypoint-error", "missing-create-export-error", "truthy-non-function-create-export-error"] as const) {
    if (!fixture.cases.some((item) => item.id === required)) {
      add("opencode-provider-dynamic-package-native-exact.coverage", `Missing required case ${required}.`, required)
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeDynamicProviderPackageFingerprintObject(withoutFingerprint)) {
    add("opencode-provider-dynamic-package-native-exact.fingerprint", "Dynamic provider package fixture fingerprint is not stable.")
  }
  return { ok: issues.length === 0, issues }
}

async function defaultNpmAdd(): Promise<OpenCodeDynamicProviderPackageNpmAddResult> {
  return {}
}

async function defaultImporter(specifier: string): Promise<Record<string, unknown>> {
  return import(specifier) as Promise<Record<string, unknown>>
}

async function captureDynamicProviderError(run: () => Promise<unknown>): Promise<string> {
  try {
    await run()
    return "<no error>"
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

async function captureDynamicProviderErrorSummary(run: () => Promise<unknown>): Promise<{ rejected: boolean; errorName?: string; messageIncludesNotFunction?: boolean }> {
  try {
    await run()
    return { rejected: false }
  } catch (error) {
    return {
      rejected: true,
      errorName: error instanceof Error ? error.name : typeof error,
      messageIncludesNotFunction: error instanceof Error ? error.message.includes("not a function") : false,
    }
  }
}

function openCodeDynamicProviderPackageSameJSON(left: unknown, right: unknown): boolean {
  return openCodeDynamicProviderPackageStableJSON(left) === openCodeDynamicProviderPackageStableJSON(right)
}

function openCodeDynamicProviderPackageFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeDynamicProviderPackageStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeDynamicProviderPackageStableJSON(value: unknown): string {
  return JSON.stringify(openCodeDynamicProviderPackageSortStable(value))
}

function openCodeDynamicProviderPackageSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeDynamicProviderPackageSortStable)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeDynamicProviderPackageSortStable(entry)]),
  )
}
