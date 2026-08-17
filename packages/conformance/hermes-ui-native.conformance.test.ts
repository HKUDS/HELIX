import { describe, expect, it } from "vitest"
import {
  buildHermesToolPreview,
  buildHermesUINativeExactFixture,
  hermesUICommandRouterNativeExactAtomID,
  hermesUIInputNormalizerNativeExactAtomID,
  hermesUIRendererNativeExactAtomID,
  hermesUISnapshotNativeExactAtomID,
  hermesUIThemeRegistryNativeExactAtomID,
  hermesTUIShellNativeExactAtomID,
  normalizeHermesTUIInput,
  replayHermesUIRendererSnapshotState,
  routeHermesUICommand,
  hermesUINativeDescriptors,
  hermesUINativeExactAtomIDs,
  hermesUINativeExactEvidenceRef,
  hermesUINativeExactFixtureID,
  hermesUINativeExactReplayRef,
  renderHermesTUIFrame,
  verifyHermesUINativeExactFixture,
} from "@helix/adapters-hermes/product-schema/ui"
import { buildAssemblyContract, routeForAtomBlock } from "@helix/recipes"

describe("Hermes UI native exact conformance", () => {
  it("pins the Hermes UI atom group to upstream display, command, input, render, snapshot, theme, and gateway behavior", () => {
    const fixture = buildHermesUINativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "hermes-agent",
      atomIDs: [
        hermesUICommandRouterNativeExactAtomID,
        hermesUIInputNormalizerNativeExactAtomID,
        hermesUIRendererNativeExactAtomID,
        hermesUISnapshotNativeExactAtomID,
        hermesUIThemeRegistryNativeExactAtomID,
        hermesTUIShellNativeExactAtomID,
      ],
      portIDs: ["ui.event-loop", "ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"],
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([hermesUINativeExactEvidenceRef, hermesUINativeExactReplayRef]),
      fixtureIDs: [hermesUINativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "command-router-slash-tool-and-selector-actions",
      "input-normalizer-key-text-command-submit-resize",
      "cli-display-spinner-tool-preview-and-diff",
      "tui-gateway-ink-terminal-surface",
      "renderer-snapshot-theme-registry-state",
      "legacy-tui-shell-service-surface",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      "agent/display.py#KawaiiSpinner,set_tool_preview_max_len,build_tool_preview,capture_local_edit_snapshot,extract_edit_diff,_render_inline_unified_diff,render_edit_diff_with_delta",
      "ui-tui/src/app/useInputHandlers.ts#keyboard,paste,submit,slash",
      "ui-tui/src/app/createSlashHandler.ts#slashCommands,dispatch",
      "ui-tui/packages/hermes-ink/src/ink/render-to-screen.ts#renderToScreen",
      "hermes_cli/skin_engine.py#get_active_skin,list_skins,set_active_skin,built_in_skins,colors,spinner,branding,tool_prefix,tool_emojis",
      "packages/adapters-hermes/src/hermes-tui.ts#createHermesTUI,render,dispatch,interactiveSnapshot",
    ]))

    expect(routeHermesUICommand({ command: "/theme light" })).toMatchObject({ action: "select-theme", args: "light", handled: true })
    expect(routeHermesUICommand({ command: "/gateway start" })).toMatchObject({ action: "custom", args: "start", handled: true })
    expect(normalizeHermesTUIInput({ type: "keypress", key: "ctrl-p" })).toEqual({ type: "key", key: "ctrl-p" })
    expect(normalizeHermesTUIInput({ type: "raw", value: { kind: "unsupported" } })).toBeUndefined()
    expect(replayHermesUIRendererSnapshotState({ width: 72, height: 18 })).toMatchObject({
      profile: { title: "Hermes Agent", rendererMode: "hermes-events" },
      commandTransitions: {
        themeFocus: { handled: true, mode: "theme", status: "selecting" },
        themeSelect: { handled: true, theme: "light" },
        submit: { handled: true, submittedText: "summon hermes", history: ["summon hermes"] },
      },
      render: { titleIncluded: true, rendererMode: "hermes-events", toolPreview: "echo hermes" },
      snapshot: { product: "hermes-agent", title: "Hermes Agent", width: 96, height: 32, functionFreeClone: true },
      themeRegistry: { current: "light", hasSystem: true, skinEngineBuiltIns: expect.arrayContaining(["default", "ares", "mono"]) },
    })
    expect(buildHermesToolPreview({ toolName: "terminal", args: { command: "echo hello" }, maxLen: 8 })).toBe("echo ...")
    expect(buildHermesToolPreview({ toolName: "read_file", args: { path: "/tmp/input.txt" } })).toBe("/tmp/input.txt")
    expect(renderHermesTUIFrame({ width: 64 })).toContain("Hermes Agent TUI :: READY")
    expect(verifyHermesUINativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    expect(hermesUINativeDescriptors.map((descriptor) => descriptor.id)).toEqual([...hermesUINativeExactAtomIDs])
    for (const descriptor of hermesUINativeDescriptors) {
      expect(descriptor).toMatchObject({
        product: "hermes-agent",
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([hermesUINativeExactEvidenceRef, hermesUINativeExactReplayRef]),
        fixtureIDs: [hermesUINativeExactFixtureID],
        knownLossiness: [],
      })
    }
    expect(new Map(hermesUINativeDescriptors.map((descriptor) => [descriptor.id, descriptor.port]))).toEqual(new Map([
      [hermesUICommandRouterNativeExactAtomID, "ui.command-router"],
      [hermesUIInputNormalizerNativeExactAtomID, "ui.input-normalizer"],
      [hermesUIRendererNativeExactAtomID, "ui.renderer"],
      [hermesUISnapshotNativeExactAtomID, "ui.snapshot"],
      [hermesUIThemeRegistryNativeExactAtomID, "ui.theme-registry"],
      [hermesTUIShellNativeExactAtomID, "ui.event-loop"],
    ]))

    for (const atomID of hermesUINativeExactAtomIDs) {
      expect(routeForAtomBlock(atomID), atomID).toMatchObject({
        packageName: "@helix/adapters-hermes",
        exportPath: "./product-schema/ui",
      })
    }

    const contract = buildAssemblyContract({ product: "hermes-agent" })
    for (const atomID of hermesUINativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom, atomID).toMatchObject({
        sourcePackage: "@helix/adapters-hermes",
        publicExport: "./product-schema/ui",
        implementationKind: "factory",
        parityCoverage: "native",
        knownLossiness: [],
        nativeEvidenceRefs: expect.arrayContaining([hermesUINativeExactEvidenceRef, hermesUINativeExactReplayRef]),
        fixtureIDs: [hermesUINativeExactFixtureID],
      })
      expect(atom?.nativeEvidenceRefs).not.toContain("conformance:hermes-ui-source-matrix")
      expect(atom?.fixtureIDs).not.toContain("hermes-ui:source-matrix")
    }
  })
})
