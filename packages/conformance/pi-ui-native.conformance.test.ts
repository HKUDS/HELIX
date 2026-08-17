import { describe, expect, it } from "vitest"
import {
  buildPiMonoUINativeExactFixture,
  normalizePiMonoTUIInput,
  piMonoTUIShellNativeExactAtomID,
  piMonoUICommandRouterNativeExactAtomID,
  piMonoUIEventLoopNativeExactAtomID,
  piMonoUIInputNormalizerNativeExactAtomID,
  piMonoUIRendererNativeExactAtomID,
  piMonoUISnapshotNativeExactAtomID,
  piMonoUIThemeRegistryNativeExactAtomID,
  piMonoUINativeDescriptors,
  piMonoUINativeExactAtomIDs,
  piMonoUINativeExactEvidenceRef,
  piMonoUINativeExactFixtureID,
  piMonoUINativeExactReplayRef,
  renderPiMonoUIText,
  replayPiMonoUIEventLoopNativeScenario,
  routePiMonoUICommand,
  snapshotPiMonoUIState,
  verifyPiMonoUINativeExactFixture,
} from "@helix/lego-ui/product-schema/pi"
import { buildAssemblyContract } from "@helix/recipes"

describe("Pi UI native exact conformance", () => {
  it("pins Pi TUI input, command routing, rendering, theme, and snapshot atoms to native exact behavior", () => {
    const fixture = buildPiMonoUINativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "pi-mono",
      atomIDs: [
        piMonoUIEventLoopNativeExactAtomID,
        piMonoUICommandRouterNativeExactAtomID,
        piMonoUIInputNormalizerNativeExactAtomID,
        piMonoUIRendererNativeExactAtomID,
        piMonoUISnapshotNativeExactAtomID,
        piMonoUIThemeRegistryNativeExactAtomID,
        piMonoTUIShellNativeExactAtomID,
      ],
      portIDs: ["ui.event-loop", "ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"],
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        piMonoUINativeExactEvidenceRef,
        piMonoUINativeExactReplayRef,
      ]),
      fixtureIDs: [piMonoUINativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "event-loop-lifecycle-focus-overlay-and-resize",
      "input-component-keybindings-and-wide-text",
      "slash-command-routing-and-autocomplete",
      "differential-render-and-cursor-marker",
      "theme-registry-and-text-rendering",
      "snapshot-stable-clone",
      "legacy-tui-shell-service-surface",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      "packages/tui/src/tui.ts#Component,Focusable,isFocusable,CURSOR_MARKER,Container,TUI,render,start,stop,setFocus,showOverlay",
      "packages/tui/src/tui.ts#TUI.requestRender,handleInput,hideOverlay,consumeCellSizeResponse,setClearOnShrink",
      "packages/tui/src/components/input.ts#Input,handleInput,setValue,getValue,render,killRing,undoStack,bracketedPaste",
      "packages/tui/src/components/text.ts#Text,setText,setCustomBgFn,invalidate,render",
      "packages/tui/src/autocomplete.ts#AutocompleteItem,SlashCommand,CombinedAutocompleteProvider,applyCompletion,resolveScopedFuzzyQuery,getFileSuggestions",
    ]))

    expect(replayPiMonoUIEventLoopNativeScenario()).toMatchObject({
      lifecycle: { started: true, stopped: true, minRenderIntervalMs: 16 },
      focus: { beforeOverlay: "editor", overlayFocus: "theme-selector", restoredAfterHide: "editor" },
      input: {
        cellSizeResponseConsumed: true,
        commandRoute: { command: "theme", args: "light", action: "select-theme", handled: true },
      },
      render: { differentialRender: true },
    })
    expect(normalizePiMonoTUIInput("\x1b")).toEqual({ type: "key", key: "escape" })
    expect(routePiMonoUICommand({ command: "/theme dark", commands: ["theme"] })).toEqual({
      command: "theme",
      args: "dark",
      action: "select-theme",
      handled: true,
    })
    expect(renderPiMonoUIText({ text: "Pi\tUI", width: 10 })).toEqual([
      "          ",
      " Pi   UI  ",
      "          ",
    ])
    const state = { status: "ready", nested: { count: 1 } }
    const snapshot = snapshotPiMonoUIState(state)
    snapshot.nested.count = 2
    expect(state.nested.count).toBe(1)

    expect(verifyPiMonoUINativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(piMonoUINativeDescriptors.map((descriptor) => descriptor.id)).toEqual([
      ...piMonoUINativeExactAtomIDs,
    ])
    for (const descriptor of piMonoUINativeDescriptors) {
      expect(descriptor).toMatchObject({
        product: "pi-mono",
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          piMonoUINativeExactEvidenceRef,
          piMonoUINativeExactReplayRef,
        ]),
        fixtureIDs: [piMonoUINativeExactFixtureID],
        knownLossiness: [],
      })
    }

    const contract = buildAssemblyContract({ product: "pi-mono" })
    for (const atomID of piMonoUINativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom, atomID).toMatchObject({
        sourcePackage: "@helix/lego-ui",
        publicExport: "./product-schema/pi",
        implementationKind: "factory",
        parityCoverage: "native",
        knownLossiness: [],
        nativeEvidenceRefs: expect.arrayContaining([
          piMonoUINativeExactEvidenceRef,
          piMonoUINativeExactReplayRef,
        ]),
        fixtureIDs: [piMonoUINativeExactFixtureID],
      })
    }
    expect(contract.bindings.find((binding) => binding.capability.id === "ui.event-loop")).toMatchObject({
      providerAtom: piMonoUIEventLoopNativeExactAtomID,
      source: "recipe-explicit",
      replaceable: true,
    })
    expect(contract.atoms.find((candidate) => candidate.id === piMonoTUIShellNativeExactAtomID)).toMatchObject({
      provides: expect.arrayContaining(["ui.event-loop"]),
      implementationKind: "factory",
      parityCoverage: "native",
      knownLossiness: [],
      nativeEvidenceRefs: expect.arrayContaining([
        piMonoUINativeExactEvidenceRef,
        piMonoUINativeExactReplayRef,
      ]),
      fixtureIDs: [piMonoUINativeExactFixtureID],
    })

    const mutated = {
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "differential-render-and-cursor-marker"
          ? { ...item, output: { ...item.output, dirtyRows: [] } }
          : item,
      ),
    }
    expect(verifyPiMonoUINativeExactFixture(mutated).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-ui-native-exact.fingerprint" }),
      expect.objectContaining({ id: "pi-ui-native-exact.cases" }),
    ]))
  })
})
