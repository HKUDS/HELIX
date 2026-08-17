import { createHash } from "node:crypto"

export const piMonoProductShellUpstreamRef = "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
export const piMonoProductShellCLINativeExactAtomID = "pi.product-shell.cli"
export const piMonoProductShellSDKNativeExactAtomID = "pi.product-shell.sdk"
export const piMonoProductShellRPCNativeExactAtomID = "pi.product-shell.rpc"
export const piMonoProductShellHarnessNativeExactAtomID = "pi.product-shell.harness"
export const piMonoProductShellServerNativeExactAtomID = "pi.product-shell.server"
export const piMonoProductShellPackageManagerNativeExactAtomID = "pi.product-shell.package-manager"
export const piMonoProductShellExtensionExamplesNativeExactAtomID = "pi.product-shell.extension-examples"
export const piMonoProductShellTUINativeExactAtomID = "pi.product-shell.tui"
export const piMonoProductShellWebUINativeExactAtomID = "pi.product-shell.web-ui"
export const piMonoProductShellBrowserSmokeNativeExactAtomID = "pi.product-shell.browser-smoke"
export const piMonoProductShellReleaseHardeningNativeExactAtomID = "pi.product-shell.release-hardening"
export const piMonoProductShellNativeExactAtomIDs = [
  piMonoProductShellCLINativeExactAtomID,
  piMonoProductShellSDKNativeExactAtomID,
  piMonoProductShellRPCNativeExactAtomID,
  piMonoProductShellHarnessNativeExactAtomID,
  piMonoProductShellServerNativeExactAtomID,
  piMonoProductShellPackageManagerNativeExactAtomID,
  piMonoProductShellExtensionExamplesNativeExactAtomID,
  piMonoProductShellTUINativeExactAtomID,
  piMonoProductShellWebUINativeExactAtomID,
  piMonoProductShellBrowserSmokeNativeExactAtomID,
  piMonoProductShellReleaseHardeningNativeExactAtomID,
] as const

export const piMonoProductShellNativeExactFixtureID = "pi-product-shell:native-exact-fixture"
export const piMonoProductShellNativeExactEvidenceRef = "conformance:pi-product-shell-native-exact-fixture"
export const piMonoProductShellNativeExactReplayRef = "product-shell-native-exact:pi-mono"

export type PiMonoProductShellNativeScenarioID =
  | "cli-entrypoint-mode-and-session-resolution"
  | "sdk-session-construction-and-tool-policy"
  | "rpc-jsonl-client-and-extension-ui"
  | "package-manager-and-extension-resource-loading"
  | "tui-surface-uses-upstream-terminal-lifecycle"
  | "web-ui-uses-native-session-export-html"
  | "browser-smoke-bundles-browser-safe-public-exports"
  | "release-hardening-builds-shrinkwrap-and-isolated-installs"
  | "harness-surface-registration"

export interface PiMonoProductShellNativeExactCase {
  scenarioID: PiMonoProductShellNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface PiMonoProductShellNativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomIDs: typeof piMonoProductShellNativeExactAtomIDs
  portID: "product.shell"
  upstreamRef: typeof piMonoProductShellUpstreamRef
  evidenceRef: typeof piMonoProductShellNativeExactEvidenceRef
  fixtureID: typeof piMonoProductShellNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    cliEntrypointSetsProcessIdentityAndDelegatesToMain: true
    mainResolvesInteractivePrintJsonRpcModesFromArgsAndStdin: true
    sdkCreatesAgentSessionWithWorkspaceSessionModelToolsAndAttribution: true
    rpcUsesStrictJsonlCommandResponseAndEventProtocol: true
    harnessRegistersSdkCliRpcAndServerFactoriesAsProductServices: true
    packagesResolveNpmGitLocalAndManifestResources: true
    extensionExamplesUseNativeExtensionAPIs: true
    tuiSurfaceUsesNativeTuiLifecycleAndSnapshots: true
    webUIUsesNativeStaticSessionExportShape: true
    browserSmokeUsesNativeBrowserBundleGate: true
    releaseHardeningUsesNativeShrinkwrapAndIsolatedInstalls: true
  }
  cases: PiMonoProductShellNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoProductShellNativeExactIssue {
  id: string
  message: string
}

export interface PiMonoProductShellNativeExactVerification {
  ok: boolean
  issues: PiMonoProductShellNativeExactIssue[]
}

function piMonoProductShellNativeDescriptor(id: (typeof piMonoProductShellNativeExactAtomIDs)[number]) {
  return {
    id,
    port: "product.shell",
    product: "pi-mono",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [piMonoProductShellNativeExactEvidenceRef, piMonoProductShellNativeExactReplayRef],
    fixtureIDs: [piMonoProductShellNativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "Pi upstream native implementation for CLI, SDK, RPC, Harness, server, package manager, extension example, TUI, Web export, browser smoke, and release hardening product-shell behavior with exact fixture coverage.",
  } as const
}

export const piMonoProductShellNativeDescriptors = piMonoProductShellNativeExactAtomIDs.map(piMonoProductShellNativeDescriptor)

export const piMonoProductShellNativeExactDescriptorForID = new Map(
  piMonoProductShellNativeDescriptors.map((descriptor) => [descriptor.id, descriptor] as const),
)

export function resolvePiMonoProductShellMode(input: { parsedMode?: "json" | "rpc"; print?: boolean; stdinIsTTY: boolean }): "interactive" | "print" | "json" | "rpc" {
  if (input.parsedMode === "rpc") return "rpc"
  if (input.parsedMode === "json") return "json"
  if (input.print || !input.stdinIsTTY) return "print"
  return "interactive"
}

export function buildPiMonoProductShellServiceKeys(input: { withProvider?: boolean } = {}): string[] {
  return [
    "pi.browser-smoke",
    "pi.cli",
    "pi.extension-examples",
    "pi.package-manager",
    "pi.release-hardening",
    "pi.rpc",
    "pi.sdk",
    "pi.server.factory",
    "pi.shrinkwrap",
    "pi.tui",
    "pi.web-ui",
    ...(input.withProvider ? ["pi.rpc.run.turn"] : []),
  ].sort()
}

export function buildPiMonoRPCMethodList(input: { withRunProvider?: boolean } = {}): string[] {
  return [
    "workspace.snapshot",
    "session.list",
    "session.get",
    ...(input.withRunProvider ? ["run.turn"] : []),
    "package.plan",
    "release.verify",
  ]
}

export function buildPiMonoProductShellNativeExactFixture(): PiMonoProductShellNativeExactFixture {
  const fixtureWithoutFingerprint: Omit<PiMonoProductShellNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomIDs: [...piMonoProductShellNativeExactAtomIDs] as typeof piMonoProductShellNativeExactAtomIDs,
    portID: "product.shell" as const,
    upstreamRef: piMonoProductShellUpstreamRef,
    evidenceRef: piMonoProductShellNativeExactEvidenceRef,
    fixtureID: piMonoProductShellNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      cliEntrypointSetsProcessIdentityAndDelegatesToMain: true as const,
      mainResolvesInteractivePrintJsonRpcModesFromArgsAndStdin: true as const,
      sdkCreatesAgentSessionWithWorkspaceSessionModelToolsAndAttribution: true as const,
      rpcUsesStrictJsonlCommandResponseAndEventProtocol: true as const,
      harnessRegistersSdkCliRpcAndServerFactoriesAsProductServices: true as const,
      packagesResolveNpmGitLocalAndManifestResources: true as const,
      extensionExamplesUseNativeExtensionAPIs: true as const,
      tuiSurfaceUsesNativeTuiLifecycleAndSnapshots: true as const,
      webUIUsesNativeStaticSessionExportShape: true as const,
      browserSmokeUsesNativeBrowserBundleGate: true as const,
      releaseHardeningUsesNativeShrinkwrapAndIsolatedInstalls: true as const,
    },
    cases: [
      {
        scenarioID: "cli-entrypoint-mode-and-session-resolution" as const,
        input: { argv: ["--mode", "rpc"], stdinIsTTY: true, env: { PI_CODING_AGENT: "true" } },
        output: {
          processTitle: "pi",
          envFlag: "PI_CODING_AGENT",
          resolvedModes: {
            rpc: resolvePiMonoProductShellMode({ parsedMode: "rpc", stdinIsTTY: true }),
            json: resolvePiMonoProductShellMode({ parsedMode: "json", stdinIsTTY: true }),
            printByFlag: resolvePiMonoProductShellMode({ print: true, stdinIsTTY: true }),
            printByPipe: resolvePiMonoProductShellMode({ stdinIsTTY: false }),
            interactive: resolvePiMonoProductShellMode({ stdinIsTTY: true }),
          },
          sessionResolution: ["path", "local", "global", "not_found"],
        },
        upstreamBehavior: "cli.ts sets APP_NAME/process identity, PI_CODING_AGENT, suppresses process warnings, configures HTTP dispatch, and delegates argv to main; main resolves rpc/json/print/interactive modes and session path/local/global/not-found branches.",
      },
      {
        scenarioID: "sdk-session-construction-and-tool-policy" as const,
        input: { cwd: "/workspace/pi", noTools: "builtin", tools: ["read", "bash"], sessionHasModel: true },
        output: {
          defaultAgentDir: "~/.pi/agent",
          resourceLoaderReloadTimed: true,
          toolPolicy: ["default built-ins", "custom tools", "noTools=all", "noTools=builtin", "allowlist"],
          attributionHeaders: ["x-opencode-session", "x-opencode-client", "HTTP-Referer", "X-OpenRouter-Title", "User-Agent"],
          returns: ["session", "extensionsResult", "modelFallbackMessage"],
        },
        upstreamBehavior: "core/sdk.ts createAgentSession resolves cwd/agentDir/session manager/settings/resource loader, restores or selects model, applies tool suppression/allowlist, builds attribution headers, and returns the live AgentSession plus extension result.",
      },
      {
        scenarioID: "rpc-jsonl-client-and-extension-ui" as const,
        input: { transport: "stdio-jsonl", commands: buildPiMonoRPCMethodList({ withRunProvider: true }) },
        output: {
          clientArgs: ["--mode", "rpc", "--provider", "--model"],
          methods: buildPiMonoRPCMethodList({ withRunProvider: true }),
          responseShape: { type: "response", command: "get_state", success: true },
          extensionUI: ["select", "confirm", "input", "notify", "setStatus", "setWidget", "setTitle", "set_editor_text"],
          cleanup: ["SIGTERM", "SIGKILL-timeout", "killTrackedDetachedChildren"],
        },
        upstreamBehavior: "rpc-client.ts spawns CLI in rpc mode, uses strict JSONL line reader, correlates requests, emits events, and rejects pending requests on exit; rpc-mode.ts outputs response/event JSONL and exposes extension UI request methods with abort/timeout cleanup.",
      },
      {
        scenarioID: "package-manager-and-extension-resource-loading" as const,
        input: {
          configuredPackages: ["npm:@example/pi-package", "git:github.com/user/repo@v1", "./local-extension.ts"],
          manifest: { pi: { extensions: ["extensions"], skills: ["skills"], prompts: ["prompts"], themes: ["themes"] } },
        },
        output: {
          sourceKinds: ["npm", "git", "local", "file", "specifier"],
          installScopes: ["user:~/.pi/agent", "project:.pi"],
          resourceTypes: ["extensions", "skills", "prompts", "themes"],
          extensionExampleAPIs: ["defineExtension", "registerTool", "on", "registerProvider", "ctx.ui.notify"],
          productionDependencyRule: "dependencies-only-for-installed-packages",
          packageFiltering: ["glob", "force-include", "force-exclude"],
        },
        upstreamBehavior: "packages.md and package-manager.ts define npm/git/local package specs, user/project install scopes, package pi manifests, conventional resource directories, filters, dependency installation, and resource discovery; extensions.md and examples/extensions define native extension factories that register tools, commands, providers, events, and UI interactions.",
      },
      {
        scenarioID: "tui-surface-uses-upstream-terminal-lifecycle" as const,
        input: {
          terminal: { columns: 93, rows: 31 },
          lifecycle: ["start", "hide-cursor", "focus", "show-overlay", "resize", "stop"],
          inputEvents: ["cell-size-response", "shift+ctrl+d", "escape", "/theme light"],
        },
        output: {
          service: "pi.tui",
          title: "Pi Mono",
          shellKinds: ["Component", "Focusable", "Container", "TUI"],
          lifecycle: ["terminal.start(input,resize)", "terminal.hideCursor", "queryCellSize", "requestRender", "terminal.showCursor", "terminal.stop"],
          renderPolicy: ["differential-render", "dirty-row-update", "cursor-marker", "kitty-image-cleanup"],
          overlayPolicy: ["anchor-layout", "visibility-gate", "focus-restore", "non-capturing-overlay"],
          inputPolicy: ["cell-size-response-consumed", "debug-key-before-focus", "key-release-filter", "focused-component-forward"],
        },
        upstreamBehavior: "packages/tui/src/tui.ts exports Component, Focusable, Container, and TUI; TUI.start wires terminal input/resize, hides the cursor, queries cell size, schedules throttled differential rendering, handles focus and overlay restoration, filters key releases, consumes cell-size responses, tracks cursor markers and Kitty image cleanup, and TUI.stop restores the terminal cursor.",
      },
      {
        scenarioID: "web-ui-uses-native-session-export-html" as const,
        input: {
          command: "pi --export session.html",
          session: { entries: ["user", "assistant", "toolResult"], leafID: "surface" },
          theme: "light",
        },
        output: {
          service: "pi.web-ui",
          mode: "static-session-export",
          dataAttribute: "data-pi-web-ui",
          sessionDataElementID: "session-data",
          sessionDataEncoding: "base64-json",
          templateAssets: ["template.html", "template.css", "template.js", "marked.min.js", "highlight.min.js"],
          safetyPolicy: ["javascript-url-blocked", "vbscript-url-blocked", "href-escaped", "tree-metadata-escaped"],
          readback: ["workspace", "recipe graph", "package plan", "rpc methods", "tui snapshot", "release browser-smoke attribute"],
        },
        upstreamBehavior: "main.ts accepts --export and delegates to core/export-html; export-html/index.ts reads a SessionManager file, pre-renders custom tools, base64-encodes session data into the session-data script element, injects template HTML/CSS/JS plus marked/highlight assets, resolves theme export colors, and the export-html tests guard XSS escaping and whitespace preservation.",
      },
      {
        scenarioID: "browser-smoke-bundles-browser-safe-public-exports" as const,
        input: {
          script: "npm run check:browser-smoke",
          entryPoint: "scripts/browser-smoke-entry.ts",
          bundler: "esbuild",
        },
        output: {
          service: "pi.browser-smoke",
          dataAttribute: "data-pi-browser-smoke",
          build: { platform: "browser", format: "esm" },
          publicImports: ["@earendil-works/pi-ai", "@earendil-works/pi-agent-core"],
          checkedExports: ["complete", "createAssistantMessageEventStream", "Agent", "InMemorySessionRepo", "formatSkillsForSystemPrompt", "streamProxy"],
          errorReadback: "tmp/pi-browser-smoke-errors.log",
        },
        upstreamBehavior: "scripts/check-browser-smoke.mjs bundles scripts/browser-smoke-entry.ts with esbuild platform=browser and format=esm, writing detailed errors to a tmp log on failure; the entry imports browser-facing pi-ai and pi-agent-core APIs to catch accidental Node-only runtime imports.",
      },
      {
        scenarioID: "release-hardening-builds-shrinkwrap-and-isolated-installs" as const,
        input: {
          script: "npm run release:local",
          packages: ["@earendil-works/pi-ai", "@earendil-works/pi-tui", "@earendil-works/pi-agent-core", "@earendil-works/pi-coding-agent"],
          outputDirectory: "outside repository",
        },
        output: {
          service: "pi.release-hardening",
          checks: ["npm run check", "clean", "build", "npm pack --json", "build-bun-binary"],
          isolatedInstalls: ["npm install --omit=dev --ignore-scripts", "bun install --production --ignore-scripts"],
          shrinkwrap: ["package-lock.json v3 input", "packages/coding-agent/npm-shrinkwrap.json", "no link/local resolved entries", "install-script allowlist", "platform optional dependencies"],
          dependencyPolicy: ["save-exact", "min-release-age", "pinned direct external dependencies", "lockfile review gate", "npm audit signatures"],
        },
        upstreamBehavior: "local-release.mjs requires repo root, refuses an --out directory inside the repo, optionally runs npm run check, cleans/builds/packages each publishable package, builds a Bun binary release, and creates isolated npm and Bun installs with lifecycle scripts disabled; generate-coding-agent-shrinkwrap.mjs derives the published coding-agent npm-shrinkwrap from package-lock.json, rejects link/local resolved entries and unreviewed install scripts, and CI/npm-audit workflows use npm ci --ignore-scripts plus audit/signature checks.",
      },
      {
        scenarioID: "harness-surface-registration" as const,
        input: { product: "pi-mono", withProvider: true },
        output: {
          serviceKeys: buildPiMonoProductShellServiceKeys({ withProvider: false }),
          defaultRPCMethods: buildPiMonoRPCMethodList(),
          runRPCMethods: buildPiMonoRPCMethodList({ withRunProvider: true }),
        },
        upstreamBehavior: "Harness product-surface registration keeps Pi SDK, CLI, RPC, TUI, web, package, browser-smoke, release, shrinkwrap, and server-factory services wired around the upstream CLI/SDK/RPC behavior without borrowing another product shell.",
      },
    ],
    sourceRefs: [
      "packages/coding-agent/src/cli.ts#APP_NAME,configureHttpDispatcher,main",
      "packages/coding-agent/src/main.ts#readPipedStdin,collectSettingsDiagnostics,reportDiagnostics,resolveAppMode,prepareInitialMessage,resolveSessionPath,createSessionManager,buildSessionOptions,resolveCliPaths,main",
      "packages/coding-agent/src/core/sdk.ts#CreateAgentSessionOptions,CreateAgentSessionResult,createAgentSession,getAttributionHeaders,createCodingTools,createReadOnlyTools,withFileMutationQueue",
      "packages/coding-agent/src/modes/rpc/rpc-client.ts#RpcClientOptions,ModelInfo,RpcEventListener,RpcClient,start,stop,prompt,getState,setModel",
      "packages/coding-agent/src/modes/rpc/rpc-mode.ts#runRpcMode,createExtensionUIContext,success,error,output",
      "packages/coding-agent/src/modes/rpc/rpc-types.ts#RpcCommand,RpcResponse,RpcSessionState,RpcSlashCommand",
      "packages/coding-agent/src/core/package-manager.ts#PackageManager,resolve,install,installAndPersist,update,collectResourceFiles,resolveExtensionEntries,collectAutoExtensionEntries,readPiManifestFile",
      "packages/coding-agent/docs/packages.md#Install and Manage,Package Sources,Package Structure,Dependencies,Package Filtering,Scope and Deduplication",
      "packages/coding-agent/docs/extensions.md#Extension Locations,Available Imports,Writing an Extension,ExtensionAPI Methods,Custom Tools,Custom UI",
      "packages/coding-agent/examples/extensions/README.md#Extension Examples,Custom Tools,Commands & UI,Custom Providers",
      "packages/tui/src/tui.ts#Component,Focusable,isFocusable,CURSOR_MARKER,OverlayOptions,OverlayHandle,Container,TUI,start,stop,setFocus,showOverlay,hideOverlay,requestRender,handleInput,consumeCellSizeResponse,setClearOnShrink",
      "packages/tui/src/terminal.ts#Terminal,start,stop,write,hideCursor,showCursor,columns,rows",
      "packages/tui/src/keys.ts#matchesKey,isKeyRelease",
      "packages/tui/src/terminal-image.ts#getCapabilities,setCellDimensions,deleteKittyImage",
      "packages/coding-agent/src/core/export-html/index.ts#exportSessionToHtml,exportFromFile,generateHtml,preRenderCustomTools,generateThemeVars",
      "packages/coding-agent/src/core/export-html/template.html#session-data,sidebar,content,marked,highlight",
      "packages/coding-agent/src/core/export-html/template.js#URLSearchParams,buildTree,escapeHtml,markedRenderers,renderMessages",
      "packages/coding-agent/test/export-html-xss.test.ts#link,image,href,mimeType,data,entryID,treeMetadata,modelName",
      "packages/coding-agent/test/export-html-whitespace.test.ts#ansiLinesToHtml,createToolHtmlRenderer",
      "scripts/browser-smoke-entry.ts#complete,createAssistantMessageEventStream,getModel,getProviders,Agent,InMemorySessionRepo,streamProxy",
      "scripts/check-browser-smoke.mjs#build,platform-browser,format-esm,error-log",
      "scripts/local-release.mjs#parseArgs,prepareOutputDirectory,packPackage,buildBunBinaryRelease,createPiShim,isolated npm install,isolated Bun install",
      "scripts/generate-coding-agent-shrinkwrap.mjs#generateShrinkwrap,validateShrinkwrap,allowedInstallScriptPackages,checkOnly",
      "scripts/check-pinned-deps.mjs#exactVersionPattern,isInternalWorkspaceDependency,isNonRegistrySpecifier",
      "scripts/check-lockfile-commit.mjs#PI_ALLOW_LOCKFILE_CHANGE,summarizeLockfileChange,lifecycle scripts",
      ".npmrc#save-exact,min-release-age",
      ".github/workflows/ci.yml#npm ci --ignore-scripts,build,check,test",
      ".github/workflows/npm-audit.yml#npm audit --omit=dev,npm audit signatures --omit=dev",
    ],
    nativeEvidenceRefs: [piMonoProductShellNativeExactEvidenceRef, piMonoProductShellNativeExactReplayRef],
    fixtureIDs: [piMonoProductShellNativeExactFixtureID],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyPiMonoProductShellNativeExactFixture(fixture: PiMonoProductShellNativeExactFixture): PiMonoProductShellNativeExactVerification {
  const canonical = buildPiMonoProductShellNativeExactFixture()
  const issues: PiMonoProductShellNativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "pi-product-shell-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi product-shell behavior." })
  }
  if (
    fixture.product !== "pi-mono" ||
    JSON.stringify(fixture.atomIDs) !== JSON.stringify(piMonoProductShellNativeExactAtomIDs) ||
    fixture.portID !== "product.shell"
  ) {
    issues.push({ id: "pi-product-shell-native-exact.identity", message: "Fixture must stay scoped to the Pi CLI/SDK/RPC/Harness/server product-shell atom group." })
  }
  if (
    fixture.upstreamRef !== piMonoProductShellUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("main.ts#readPipedStdin")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("core/sdk.ts#CreateAgentSessionOptions")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("rpc-mode.ts#runRpcMode"))
  ) {
    issues.push({ id: "pi-product-shell-native-exact.upstream", message: "Fixture must stay pinned to Pi upstream CLI, SDK, and RPC sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-product-shell-native-exact.native-claim", message: "Pi product-shell fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || piMonoProductShellNativeDescriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) {
    issues.push({ id: "pi-product-shell-native-exact.lossiness", message: "Native exact Pi product-shell fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoProductShellNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoProductShellNativeExactReplayRef)) {
    issues.push({ id: "pi-product-shell-native-exact.evidence", message: "Pi product-shell native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoProductShellNativeExactFixtureID)) {
    issues.push({ id: "pi-product-shell-native-exact.fixture", message: "Pi product-shell native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "pi-product-shell-native-exact.policy", message: "Pi product-shell policy drifted from upstream behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push({ id: "pi-product-shell-native-exact.cases", message: "Pi product-shell cases drifted from the native exact fixture." })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}
