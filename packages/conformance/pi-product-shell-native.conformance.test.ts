import { describe, expect, it } from "vitest"
import {
  buildPiMonoProductShellNativeExactFixture,
  buildPiMonoProductShellServiceKeys,
  buildPiMonoRPCMethodList,
  piMonoProductShellBrowserSmokeNativeExactAtomID,
  piMonoProductShellCLINativeExactAtomID,
  piMonoProductShellExtensionExamplesNativeExactAtomID,
  piMonoProductShellHarnessNativeExactAtomID,
  piMonoProductShellNativeDescriptors,
  piMonoProductShellNativeExactAtomIDs,
  piMonoProductShellNativeExactEvidenceRef,
  piMonoProductShellNativeExactFixtureID,
  piMonoProductShellNativeExactReplayRef,
  piMonoProductShellPackageManagerNativeExactAtomID,
  piMonoProductShellRPCNativeExactAtomID,
  piMonoProductShellSDKNativeExactAtomID,
  piMonoProductShellServerNativeExactAtomID,
  piMonoProductShellTUINativeExactAtomID,
  piMonoProductShellReleaseHardeningNativeExactAtomID,
  piMonoProductShellWebUINativeExactAtomID,
  resolvePiMonoProductShellMode,
  verifyPiMonoProductShellNativeExactFixture,
} from "@helix/adapters-pi/product-schema/product-shell"
import { buildAssemblyContract } from "@helix/recipes"

describe("Pi product shell native exact conformance", () => {
  it("pins Pi product-shell atoms to upstream native behavior", () => {
    const fixture = buildPiMonoProductShellNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "pi-mono",
      atomIDs: [
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
      ],
      portID: "product.shell",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        piMonoProductShellNativeExactEvidenceRef,
        piMonoProductShellNativeExactReplayRef,
      ]),
      fixtureIDs: [piMonoProductShellNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "cli-entrypoint-mode-and-session-resolution",
      "sdk-session-construction-and-tool-policy",
      "rpc-jsonl-client-and-extension-ui",
      "package-manager-and-extension-resource-loading",
      "tui-surface-uses-upstream-terminal-lifecycle",
      "web-ui-uses-native-session-export-html",
      "browser-smoke-bundles-browser-safe-public-exports",
      "release-hardening-builds-shrinkwrap-and-isolated-installs",
      "harness-surface-registration",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      "packages/coding-agent/src/cli.ts#APP_NAME,configureHttpDispatcher,main",
      "packages/coding-agent/src/main.ts#readPipedStdin,collectSettingsDiagnostics,reportDiagnostics,resolveAppMode,prepareInitialMessage,resolveSessionPath,createSessionManager,buildSessionOptions,resolveCliPaths,main",
      "packages/coding-agent/src/core/sdk.ts#CreateAgentSessionOptions,CreateAgentSessionResult,createAgentSession,getAttributionHeaders,createCodingTools,createReadOnlyTools,withFileMutationQueue",
      "packages/coding-agent/src/modes/rpc/rpc-mode.ts#runRpcMode,createExtensionUIContext,success,error,output",
      "packages/coding-agent/src/core/package-manager.ts#PackageManager,resolve,install,installAndPersist,update,collectResourceFiles,resolveExtensionEntries,collectAutoExtensionEntries,readPiManifestFile",
      "packages/coding-agent/docs/packages.md#Install and Manage,Package Sources,Package Structure,Dependencies,Package Filtering,Scope and Deduplication",
      "packages/coding-agent/docs/extensions.md#Extension Locations,Available Imports,Writing an Extension,ExtensionAPI Methods,Custom Tools,Custom UI",
      "packages/tui/src/tui.ts#Component,Focusable,isFocusable,CURSOR_MARKER,OverlayOptions,OverlayHandle,Container,TUI,start,stop,setFocus,showOverlay,hideOverlay,requestRender,handleInput,consumeCellSizeResponse,setClearOnShrink",
      "packages/coding-agent/src/core/export-html/index.ts#exportSessionToHtml,exportFromFile,generateHtml,preRenderCustomTools,generateThemeVars",
      "scripts/browser-smoke-entry.ts#complete,createAssistantMessageEventStream,getModel,getProviders,Agent,InMemorySessionRepo,streamProxy",
      "scripts/check-browser-smoke.mjs#build,platform-browser,format-esm,error-log",
      "scripts/local-release.mjs#parseArgs,prepareOutputDirectory,packPackage,buildBunBinaryRelease,createPiShim,isolated npm install,isolated Bun install",
      "scripts/generate-coding-agent-shrinkwrap.mjs#generateShrinkwrap,validateShrinkwrap,allowedInstallScriptPackages,checkOnly",
    ]))
    expect(resolvePiMonoProductShellMode({ parsedMode: "rpc", stdinIsTTY: true })).toBe("rpc")
    expect(resolvePiMonoProductShellMode({ stdinIsTTY: false })).toBe("print")
    expect(buildPiMonoRPCMethodList({ withRunProvider: true })).toEqual([
      "workspace.snapshot",
      "session.list",
      "session.get",
      "run.turn",
      "package.plan",
      "release.verify",
    ])
    expect(buildPiMonoProductShellServiceKeys()).toEqual(expect.arrayContaining([
      "pi.cli",
      "pi.extension-examples",
      "pi.package-manager",
      "pi.browser-smoke",
      "pi.release-hardening",
      "pi.rpc",
      "pi.sdk",
      "pi.server.factory",
      "pi.tui",
      "pi.web-ui",
    ]))

    expect(verifyPiMonoProductShellNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(piMonoProductShellNativeDescriptors.map((descriptor) => descriptor.id)).toEqual([
      ...piMonoProductShellNativeExactAtomIDs,
    ])
    for (const descriptor of piMonoProductShellNativeDescriptors) {
      expect(descriptor).toMatchObject({
        product: "pi-mono",
        port: "product.shell",
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          piMonoProductShellNativeExactEvidenceRef,
          piMonoProductShellNativeExactReplayRef,
        ]),
        fixtureIDs: [piMonoProductShellNativeExactFixtureID],
        knownLossiness: [],
      })
    }

    const contract = buildAssemblyContract({ product: "pi-mono" })
    for (const atomID of piMonoProductShellNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom, atomID).toMatchObject({
        sourcePackage: "@helix/adapters-pi",
        publicExport: "./product-schema/product-shell",
        implementationKind: "factory",
        parityCoverage: "native",
        knownLossiness: [],
        nativeEvidenceRefs: expect.arrayContaining([
          piMonoProductShellNativeExactEvidenceRef,
          piMonoProductShellNativeExactReplayRef,
        ]),
        fixtureIDs: [piMonoProductShellNativeExactFixtureID],
      })
    }

    const mutated = {
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "rpc-jsonl-client-and-extension-ui"
          ? { ...item, output: { ...item.output, methods: [] } }
          : item,
      ),
    }
    expect(verifyPiMonoProductShellNativeExactFixture(mutated).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-product-shell-native-exact.fingerprint" }),
      expect.objectContaining({ id: "pi-product-shell-native-exact.cases" }),
    ]))
  })
})
