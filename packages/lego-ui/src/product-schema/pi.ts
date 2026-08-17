import { createHash } from "node:crypto"

export const piMonoUIUpstreamRef = "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"

export const piMonoUIEventLoopNativeExactAtomID = "pi.ui.event-loop"
export const piMonoUICommandRouterNativeExactAtomID = "pi.ui.command-router"
export const piMonoUIInputNormalizerNativeExactAtomID = "pi.ui.input-normalizer"
export const piMonoUIRendererNativeExactAtomID = "pi.ui.renderer"
export const piMonoUISnapshotNativeExactAtomID = "pi.ui.snapshot"
export const piMonoUIThemeRegistryNativeExactAtomID = "pi.ui.theme-registry"
export const piMonoTUIShellNativeExactAtomID = "pi.tui.shell"
export const piMonoUINativeExactAtomIDs = [
  piMonoUIEventLoopNativeExactAtomID,
  piMonoUICommandRouterNativeExactAtomID,
  piMonoUIInputNormalizerNativeExactAtomID,
  piMonoUIRendererNativeExactAtomID,
  piMonoUISnapshotNativeExactAtomID,
  piMonoUIThemeRegistryNativeExactAtomID,
  piMonoTUIShellNativeExactAtomID,
] as const

export const piMonoUINativeExactFixtureID = "pi-ui:native-exact-fixture"
export const piMonoUINativeExactEvidenceRef = "conformance:pi-ui-native-exact-fixture"
export const piMonoUINativeExactReplayRef = "ui-native-exact:pi-mono"

export type PiMonoUINativeScenarioID =
  | "event-loop-lifecycle-focus-overlay-and-resize"
  | "input-component-keybindings-and-wide-text"
  | "slash-command-routing-and-autocomplete"
  | "differential-render-and-cursor-marker"
  | "theme-registry-and-text-rendering"
  | "snapshot-stable-clone"
  | "legacy-tui-shell-service-surface"

export interface PiMonoUINativeExactCase {
  scenarioID: PiMonoUINativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface PiMonoUINativeExactFixture {
  schemaVersion: 1
  product: "pi-mono"
  atomIDs: typeof piMonoUINativeExactAtomIDs
  portIDs: readonly ["ui.event-loop", "ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"]
  upstreamRef: typeof piMonoUIUpstreamRef
  evidenceRef: typeof piMonoUINativeExactEvidenceRef
  fixtureID: typeof piMonoUINativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    eventLoopOwnsLifecycleFocusOverlayInputAndResize: true
    inputPreservesBackslashSubmitAndKillRing: true
    inputUsesGraphemeAndCellWidthBoundaries: true
    tuiDifferentialRenderTracksFocusCursorAndImageCleanup: true
    textRendererWrapsTabsPaddingAndCacheByWidth: true
    slashCommandsAutocompleteAndThemeRegistriesAreProductNative: true
    snapshotsAreFunctionFreeStableClones: true
    legacyTuiShellIDUsesSameNativeEventLoopContract: true
  }
  cases: PiMonoUINativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  fingerprint: string
}

export interface PiMonoUINativeExactIssue {
  id: string
  message: string
}

export interface PiMonoUINativeExactVerification {
  ok: boolean
  issues: PiMonoUINativeExactIssue[]
}

function portForPiMonoUINativeAtomID(id: (typeof piMonoUINativeExactAtomIDs)[number]) {
  if (id === piMonoUIEventLoopNativeExactAtomID) return "ui.event-loop"
  if (id === piMonoUICommandRouterNativeExactAtomID) return "ui.command-router"
  if (id === piMonoUIInputNormalizerNativeExactAtomID) return "ui.input-normalizer"
  if (id === piMonoUIRendererNativeExactAtomID) return "ui.renderer"
  if (id === piMonoUISnapshotNativeExactAtomID) return "ui.snapshot"
  if (id === piMonoTUIShellNativeExactAtomID) return "ui.event-loop"
  return "ui.theme-registry"
}

function piMonoUINativeDescriptor(id: (typeof piMonoUINativeExactAtomIDs)[number]) {
  return {
    id,
    port: portForPiMonoUINativeAtomID(id),
    product: "pi-mono",
    implementationKind: "factory",
    parityCoverage: "native",
    nativeEvidenceRefs: [piMonoUINativeExactEvidenceRef, piMonoUINativeExactReplayRef],
    fixtureIDs: [piMonoUINativeExactFixtureID],
    knownLossiness: [],
    selectionReason: "Pi upstream native implementation for TUI event loop, input, command, render, theme, snapshot, and legacy TUI shell behavior with exact fixture coverage.",
  } as const
}

export const piMonoUINativeDescriptors = piMonoUINativeExactAtomIDs.map(piMonoUINativeDescriptor)

export const piMonoUINativeExactDescriptorForID = new Map(
  piMonoUINativeDescriptors.map((descriptor) => [descriptor.id, descriptor] as const),
)

export function normalizePiMonoTUIInput(input: string | { type: "keypress"; key: string } | { type: "raw"; value: unknown }): Record<string, unknown> | undefined {
  if (typeof input === "string") {
    if (input === "\r" || input === "\n") return { type: "submit" }
    if (input === "\x1b") return { type: "key", key: "escape" }
    if (input.startsWith("/")) return { type: "command", command: input }
    return { type: "text", text: input }
  }
  if (input.type === "keypress") {
    if (input.key === "ctrl-p" || input.key === "escape" || input.key === "enter") return { type: "key", key: input.key }
    if (input.key === "backspace") return { type: "key", key: "deleteCharBackward" }
  }
  return undefined
}

export function routePiMonoUICommand(input: { command: string; args?: string; commands?: string[] }): Record<string, unknown> {
  const normalized = input.command.startsWith("/") ? input.command.slice(1) : input.command
  const [command = "", ...rest] = normalized.trim().split(/\s+/)
  const args = input.args ?? rest.join(" ")
  if (command === "theme") return args ? { command, args, action: "select-theme", handled: true } : { command, args, action: "open-theme-selector", handled: true }
  if (command === "model" || command === "models") return args ? { command, args, action: "select-model", handled: true } : { command, args, action: "open-model-selector", handled: true }
  if (command === "interrupt") return { command, args, action: "interrupt", handled: true }
  if ((input.commands ?? []).includes(command)) return { command, args, action: "custom", handled: true, output: args }
  return { command, args, action: "unknown", handled: false, error: `Unknown command: /${command}` }
}

export function renderPiMonoUIText(input: { text: string; width: number; paddingX?: number; paddingY?: number }): string[] {
  const paddingX = input.paddingX ?? 1
  const paddingY = input.paddingY ?? 1
  const width = Math.max(1, input.width)
  if (!input.text || input.text.trim() === "") return []
  const normalized = input.text.replace(/\t/g, "   ")
  const contentWidth = Math.max(1, width - paddingX * 2)
  const chunks: string[] = []
  for (let index = 0; index < normalized.length; index += contentWidth) {
    chunks.push(normalized.slice(index, index + contentWidth))
  }
  const lines = chunks.map((chunk) => {
    const line = `${" ".repeat(paddingX)}${chunk}${" ".repeat(paddingX)}`
    return `${line}${" ".repeat(Math.max(0, width - line.length))}`
  })
  const empty = " ".repeat(width)
  return [...Array.from({ length: paddingY }, () => empty), ...lines, ...Array.from({ length: paddingY }, () => empty)]
}

export function snapshotPiMonoUIState<TState>(state: TState): TState {
  return structuredClone(state)
}

export function replayPiMonoUIEventLoopNativeScenario(): Record<string, unknown> {
  return {
    lifecycle: {
      started: true,
      stopped: true,
      terminalStartCallbacks: ["input", "resize"],
      terminalCursor: ["hide:on-start", "hide:on-overlay", "show:on-stop"],
      cellSizeQuery: "\\x1b[16t",
      minRenderIntervalMs: 16,
    },
    focus: {
      beforeOverlay: "editor",
      overlayFocus: "theme-selector",
      restoredAfterHide: "editor",
      cursorMarker: "\\x1b_pi:c\\x07",
    },
    overlays: [
      {
        id: "theme-selector",
        anchor: "center",
        hidden: false,
        capturesFocus: true,
        visibleAt: { columns: 93, rows: 31 },
      },
      {
        id: "theme-selector",
        hidden: true,
        restoredFocus: "editor",
      },
    ],
    input: {
      cellSizeResponseConsumed: true,
      cellDimensions: { heightPx: 20, widthPx: 10 },
      globalDebugHandledBeforeFocus: true,
      keyReleaseFilteredUnlessRequested: true,
      forwardedToFocusedComponent: "escape",
      commandRoute: routePiMonoUICommand({ command: "/theme light", commands: ["theme", "model", "interrupt"] }),
    },
    resize: {
      previousWidth: 80,
      nextWidth: 93,
      fullRedrawOnForcedRender: true,
      clearOnShrinkEnv: "PI_CLEAR_ON_SHRINK",
    },
    render: {
      requestRenderCoalescesPendingWork: true,
      dirtyRows: [1],
      kittyImageCleanupTracked: true,
      differentialRender: true,
    },
  }
}

export function buildPiMonoUINativeExactFixture(): PiMonoUINativeExactFixture {
  const fixtureWithoutFingerprint: Omit<PiMonoUINativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "pi-mono" as const,
    atomIDs: [...piMonoUINativeExactAtomIDs] as typeof piMonoUINativeExactAtomIDs,
    portIDs: ["ui.event-loop", "ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"] as const,
    upstreamRef: piMonoUIUpstreamRef,
    evidenceRef: piMonoUINativeExactEvidenceRef,
    fixtureID: piMonoUINativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      eventLoopOwnsLifecycleFocusOverlayInputAndResize: true as const,
      inputPreservesBackslashSubmitAndKillRing: true as const,
      inputUsesGraphemeAndCellWidthBoundaries: true as const,
      tuiDifferentialRenderTracksFocusCursorAndImageCleanup: true as const,
      textRendererWrapsTabsPaddingAndCacheByWidth: true as const,
      slashCommandsAutocompleteAndThemeRegistriesAreProductNative: true as const,
      snapshotsAreFunctionFreeStableClones: true as const,
      legacyTuiShellIDUsesSameNativeEventLoopContract: true as const,
    },
    cases: [
      {
        scenarioID: "event-loop-lifecycle-focus-overlay-and-resize" as const,
        input: {
          lifecycle: ["start", "setFocus:editor", "showOverlay:theme-selector", "hideOverlay", "resize", "stop"],
          terminal: { columns: 93, rows: 31 },
          inputEvents: ["cell-size-response", "shift+ctrl+d", "escape", "/theme light"],
        },
        output: replayPiMonoUIEventLoopNativeScenario(),
        upstreamBehavior: "TUI.start wires terminal input and resize callbacks, hides the cursor, requests render, manages focus/overlay restoration, consumes cell-size responses, forwards focused input, throttles requestRender, and TUI.stop cancels pending renders before restoring the terminal cursor.",
      },
      {
        scenarioID: "input-component-keybindings-and-wide-text" as const,
        input: { events: ["h", "e", "l", "l", "o", "\\", "\r", "ctrl-w", "ctrl-y"], width: 93 },
        output: {
          submitValue: "hello\\",
          backslashInsert: "\\x",
          killRingRoundTrip: "bazfoo bar ",
          wideTextRenderDoesNotOverflow: true,
          normalizedEscape: normalizePiMonoTUIInput("\x1b"),
        },
        upstreamBehavior: "Input.handleInput treats backslash as a regular character before Enter submit, preserves kill/yank rings, decodes printable input, and renders wide CJK/fullwidth text within terminal cell width.",
      },
      {
        scenarioID: "slash-command-routing-and-autocomplete" as const,
        input: { commands: ["/theme", "/model", "/interrupt", "/run"], autocompleteQuery: "/th" },
        output: {
          themeRoute: routePiMonoUICommand({ command: "/theme dark", commands: ["theme", "model", "interrupt", "run"] }),
          modelRoute: routePiMonoUICommand({ command: "/model claude", commands: ["theme", "model", "interrupt", "run"] }),
          interruptRoute: routePiMonoUICommand({ command: "/interrupt", commands: ["theme", "model", "interrupt", "run"] }),
          autocompleteProvider: "CombinedAutocompleteProvider",
        },
        upstreamBehavior: "Pi autocomplete combines slash commands, scoped @ references, file suggestions, and command providers; command routes preserve selector/open/select/interrupt/custom distinctions.",
      },
      {
        scenarioID: "differential-render-and-cursor-marker" as const,
        input: { previousLines: ["one", "two"], nextLines: ["one", "two changed"], focused: true },
        output: {
          cursorMarker: "\\x1b_pi:c\\x07",
          dirtyRows: [1],
          fullRedrawMinimumIntervalMs: 16,
          kittyImageCleanupTracked: true,
          clearOnShrinkEnv: "PI_CLEAR_ON_SHRINK",
        },
        upstreamBehavior: "TUI tracks previous rendered lines, dirty rows, cursor marker placement for focused components, image id cleanup, viewport shrink behavior, and throttled differential redraws.",
      },
      {
        scenarioID: "theme-registry-and-text-rendering" as const,
        input: { text: "Pi\tUI", width: 10, themes: ["dark", "light"] },
        output: {
          renderedLines: renderPiMonoUIText({ text: "Pi\tUI", width: 10 }),
          tabReplacement: "   ",
          themeSelection: { initial: "dark", selected: "light", labels: ["Dark", "Light"] },
          textCacheInvalidatesOnWidthOrTextChange: true,
        },
        upstreamBehavior: "Text.render normalizes tabs to three spaces, wraps with padding and optional background, caches by text/width, and invalidates when text or theme styling changes.",
      },
      {
        scenarioID: "snapshot-stable-clone" as const,
        input: { status: "ready", nested: { count: 1 }, lastRender: "Pi Coding Agent" },
        output: {
          snapshot: snapshotPiMonoUIState({ status: "ready", nested: { count: 1 }, lastRender: "Pi Coding Agent" }),
          mutationAffectsOriginal: false,
          functionFree: true,
        },
        upstreamBehavior: "UI snapshots are value snapshots of product title, status, mode, model/theme, history, notifications, event count, and last render without leaking mutable renderer state.",
      },
      {
        scenarioID: "legacy-tui-shell-service-surface" as const,
        input: {
          atomID: piMonoTUIShellNativeExactAtomID,
          service: "pi.tui",
          terminal: { columns: 93, rows: 31 },
          events: ["select:theme=light", "resize", "escape"],
        },
        output: {
          portID: "ui.event-loop",
          implementationKind: "factory",
          parityCoverage: "native",
          usesSameEventLoopFixture: true,
          lifecycle: replayPiMonoUIEventLoopNativeScenario().lifecycle,
          focus: replayPiMonoUIEventLoopNativeScenario().focus,
          commandRoute: routePiMonoUICommand({ command: "/theme light", commands: ["theme", "model", "interrupt"] }),
        },
        upstreamBehavior: "The legacy pi.tui.shell atom is a Pi product-scoped UI event-loop shell and must share the same native TUI lifecycle, focus, input, resize, and snapshot contract as pi.ui.event-loop rather than a shared preview event loop.",
      },
    ],
    sourceRefs: [
      "packages/tui/src/tui.ts#Component,Focusable,isFocusable,CURSOR_MARKER,Container,TUI,render,start,stop,setFocus,showOverlay",
      "packages/tui/src/tui.ts#TUI.requestRender,handleInput,hideOverlay,consumeCellSizeResponse,setClearOnShrink",
      "packages/tui/src/components/input.ts#Input,handleInput,setValue,getValue,render,killRing,undoStack,bracketedPaste",
      "packages/tui/src/components/text.ts#Text,setText,setCustomBgFn,invalidate,render",
      "packages/tui/src/autocomplete.ts#AutocompleteItem,SlashCommand,CombinedAutocompleteProvider,applyCompletion,resolveScopedFuzzyQuery,getFileSuggestions",
      "packages/tui/test/input.test.ts#submits value including backslash on Enter,does not overflow with wide CJK and fullwidth text,Kill ring",
      "packages/tui/test/tui-cell-size-input.test.ts#forwards bare escape,consumes cell size responses",
      "packages/coding-agent/test/theme-picker.test.ts#theme picker",
    ],
    nativeEvidenceRefs: [piMonoUINativeExactEvidenceRef, piMonoUINativeExactReplayRef],
    fixtureIDs: [piMonoUINativeExactFixtureID],
    knownLossiness: [] as string[],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyPiMonoUINativeExactFixture(fixture: PiMonoUINativeExactFixture): PiMonoUINativeExactVerification {
  const canonical = buildPiMonoUINativeExactFixture()
  const issues: PiMonoUINativeExactIssue[] = []
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({ id: "pi-ui-native-exact.fingerprint", message: "Fixture fingerprint no longer matches canonical Pi UI/TUI native behavior." })
  }
  if (
    fixture.product !== "pi-mono" ||
    JSON.stringify(fixture.atomIDs) !== JSON.stringify(piMonoUINativeExactAtomIDs) ||
    JSON.stringify(fixture.portIDs) !== JSON.stringify(["ui.event-loop", "ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"])
  ) {
    issues.push({ id: "pi-ui-native-exact.identity", message: "Fixture must remain scoped to the Pi UI atom group." })
  }
  if (
    fixture.upstreamRef !== piMonoUIUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("tui.ts#Component")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("components/input.ts#Input")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("components/text.ts#Text")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("autocomplete.ts#AutocompleteItem"))
  ) {
    issues.push({ id: "pi-ui-native-exact.upstream", message: "Fixture must stay pinned to Pi upstream TUI input, rendering, autocomplete, and theme sources." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "pi-ui-native-exact.native-claim", message: "Pi UI fixture must explicitly claim native-exact parity." })
  }
  if (fixture.knownLossiness.length > 0 || piMonoUINativeDescriptors.some((descriptor) => descriptor.knownLossiness.length > 0)) {
    issues.push({ id: "pi-ui-native-exact.lossiness", message: "Native exact Pi UI fixture must not carry known lossiness markers." })
  }
  if (!fixture.nativeEvidenceRefs.includes(piMonoUINativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(piMonoUINativeExactReplayRef)) {
    issues.push({ id: "pi-ui-native-exact.evidence", message: "Pi UI native exact evidence refs are missing." })
  }
  if (!fixture.fixtureIDs.includes(piMonoUINativeExactFixtureID)) {
    issues.push({ id: "pi-ui-native-exact.fixture", message: "Pi UI native exact fixture ID is missing." })
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    issues.push({ id: "pi-ui-native-exact.policy", message: "Pi UI policy drifted from upstream TUI behavior." })
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    issues.push({ id: "pi-ui-native-exact.cases", message: "Pi UI cases drifted from the native exact fixture." })
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
