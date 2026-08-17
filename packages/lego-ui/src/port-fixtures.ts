import { createHash } from "node:crypto"
import type { LegoPortContractFixture } from "@helix/contracts"
import { createUIProductAtoms, type TUIEventLoopResult, type UIProductPersonality } from "./ui-atoms"
import {
  openCodeUINativeExactEvidenceRef,
  openCodeUINativeExactFixtureID,
  openCodeUINativeExactReplayRef,
} from "./product-schema/opencode"

export type UITUIInteractionReplayGateProduct = UIProductPersonality
export type UITUIInteractionReplayGateDimension = "input-event" | "render-snapshot" | "state-transition" | "focus" | "resize"
export type UITUIInteractionReplayGateRisk =
  | "source-anchored-partial"
  | "shared-event-loop-only"
  | "preview-shell-only"
  | "borrowed-opencode"

export interface UITUIInteractionReplayGateCase {
  product: UITUIInteractionReplayGateProduct
  sourceMatrixID: "opencode" | "pi" | "nanobot" | "hermes"
  evidenceRef: "conformance:ui-tui-interaction-replay-gate"
  fixtureID: string
  inputEvents: string[]
  renderSnapshots: string[]
  stateTransitions: string[]
  focusEvents: string[]
  resizeEvents: string[]
  sourceAnchors: string[]
  uiAtomIDs: string[]
  uiPortIDs: string[]
  fixtureIDs: string[]
  nativeEvidenceRefs: string[]
  replayRisk: UITUIInteractionReplayGateRisk
  knownLossiness: string[]
}

export interface UITUIInteractionReplayGateSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:ui-tui-interaction-replay-gate"
  fixtureID: "ui:tui-interaction-replay-gate"
  products: UITUIInteractionReplayGateProduct[]
  comparisonDimensions: UITUIInteractionReplayGateDimension[]
  cases: UITUIInteractionReplayGateCase[]
  fingerprint: string
}

export interface UITUIInteractionReplayGateIssue {
  id: string
  product: UITUIInteractionReplayGateProduct
  dimension: UITUIInteractionReplayGateDimension
  message: string
}

export interface UITUIInteractionReplayGateVerification {
  ok: boolean
  issues: UITUIInteractionReplayGateIssue[]
}

export type UITUIInteractionExactDiffBlockerProduct = UITUIInteractionReplayGateProduct
export type UITUIInteractionExactDiffBlockerDimension = UITUIInteractionReplayGateDimension

export interface UITUIInteractionExactDiffBlockerCase {
  product: UITUIInteractionExactDiffBlockerProduct
  sourceMatrixID: "opencode" | "pi" | "nanobot" | "hermes"
  evidenceRef: "conformance:ui-tui-interaction-exact-diff-blocker-gate"
  fixtureID: string
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  inputEvents: string[]
  renderSnapshots: string[]
  stateTransitions: string[]
  focusEvents: string[]
  resizeEvents: string[]
  sourceAnchors: string[]
  uiAtomIDs: string[]
  uiPortIDs: string[]
  fixtureIDs: string[]
  nativeEvidenceRefs: string[]
  exactDiffRisk: "semantic-fixture-needs-exact-diff" | "shared-event-loop-only" | "preview-shell-only" | "borrowed-opencode"
  knownLossiness: string[]
}

export interface UITUIInteractionExactDiffBlockerSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:ui-tui-interaction-exact-diff-blocker-gate"
  fixtureID: "ui:tui-interaction-exact-diff-blocker-gate"
  exactDiffStatus: "exact-diff-partial"
  products: UITUIInteractionExactDiffBlockerProduct[]
  comparisonDimensions: UITUIInteractionExactDiffBlockerDimension[]
  cases: UITUIInteractionExactDiffBlockerCase[]
  fingerprint: string
}

export interface UITUIInteractionExactDiffBlockerIssue {
  id: string
  product: UITUIInteractionExactDiffBlockerProduct
  dimension: UITUIInteractionExactDiffBlockerDimension
  message: string
}

export interface UITUIInteractionExactDiffBlockerVerification {
  ok: boolean
  issues: UITUIInteractionExactDiffBlockerIssue[]
}

const UI_TUI_INTERACTION_REPLAY_DIMENSIONS: UITUIInteractionReplayGateDimension[] = [
  "input-event",
  "render-snapshot",
  "state-transition",
  "focus",
  "resize",
]

const tuiPersonalityAtomImplementationKinds = {
  "hermes.tui.shell": "factory",
  "opencode.tui.shell": "factory",
  "opencode.ui.event-loop": "factory",
  "pi.ui.event-loop": "factory",
  "pi.tui.shell": "factory",
  "nanobot.tui.shell": "factory",
} as const

export function buildUITUIInteractionReplayGateSnapshot(): UITUIInteractionReplayGateSnapshot {
  const cases = (["opencode", "pi-mono", "nanobot", "hermes-agent"] as UITUIInteractionReplayGateProduct[]).map(buildUITUIInteractionReplayGateCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:ui-tui-interaction-replay-gate" as const,
    fixtureID: "ui:tui-interaction-replay-gate" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: UI_TUI_INTERACTION_REPLAY_DIMENSIONS,
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyUITUIInteractionReplayGateSnapshot(snapshot: UITUIInteractionReplayGateSnapshot): UITUIInteractionReplayGateVerification {
  const issues: UITUIInteractionReplayGateIssue[] = []
  const products: UITUIInteractionReplayGateProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]

  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "ui-tui-interaction.missing-product",
        product,
        dimension: "input-event",
        message: `Missing UI/TUI interaction replay gate case for ${product}.`,
      })
      continue
    }
    if (!uiGateContains(item.inputEvents, /input|event|normalize|keypress|text|command|select|submit|TUIInputEvent/i)) {
      issues.push({
        id: "ui-tui-interaction.input-event",
        product,
        dimension: "input-event",
        message: `${product} UI/TUI gate no longer records input event anchors.`,
      })
    }
    if (!uiGateContains(item.renderSnapshots, /render|snapshot|lastRender|title|renderer|width|history/i)) {
      issues.push({
        id: "ui-tui-interaction.render-snapshot",
        product,
        dimension: "render-snapshot",
        message: `${product} UI/TUI gate no longer records render snapshot anchors.`,
      })
    }
    if (!uiGateContains(item.stateTransitions, /transition|status|mode|history|editing|running|selecting|interrupted|ready/i)) {
      issues.push({
        id: "ui-tui-interaction.state-transition",
        product,
        dimension: "state-transition",
        message: `${product} UI/TUI gate no longer records event-loop state transitions.`,
      })
    }
    if (!uiGateContains(item.focusEvents, /focus|selector|ctrl-p|theme|model|mode|chat/i)) {
      issues.push({
        id: "ui-tui-interaction.focus",
        product,
        dimension: "focus",
        message: `${product} UI/TUI gate no longer records selector/focus anchors.`,
      })
    }
    if (!uiGateContains(item.resizeEvents, /resize|width|height|viewport|terminal/i)) {
      issues.push({
        id: "ui-tui-interaction.resize",
        product,
        dimension: "resize",
        message: `${product} UI/TUI gate no longer records resize anchors.`,
      })
    }
    if (item.fixtureIDs.length < 3 || !uiGateContains(item.fixtureIDs, /ui:source-matrix|shared-event-loop-preview|tui-interaction-replay-gate/i)) {
      issues.push({
        id: "ui-tui-interaction.fixture-coverage",
        product,
        dimension: "render-snapshot",
        message: `${product} UI/TUI gate no longer links source matrix and shared event-loop fixtures.`,
      })
    }
    if (item.nativeEvidenceRefs.length === 0 || !uiGateContains(item.nativeEvidenceRefs, /ui-source-matrix|ui:source-matrix|native-exact/i)) {
      issues.push({
        id: "ui-tui-interaction.native-evidence",
        product,
        dimension: "render-snapshot",
        message: `${product} UI/TUI gate lost source matrix or native fixture evidence refs.`,
      })
    }
    if (product === "opencode" && !uiGateContains(item.nativeEvidenceRefs, /opencode-ui-native-exact-fixture|ui-native-exact:opencode/)) {
      issues.push({
        id: "ui-tui-interaction.native-evidence",
        product,
        dimension: "render-snapshot",
        message: "OpenCode UI/TUI gate lost native-exact UI fixture evidence.",
      })
    }
    if (!uiGateContains(item.knownLossiness, /partial|not-exact|not-replayed|preview|shared|not-native|not-proven|side-effects/i)) {
      issues.push({
        id: "ui-tui-interaction.runtime-lossiness",
        product,
        dimension: "state-transition",
        message: `${product} UI/TUI gate no longer records partial replay lossiness.`,
      })
    }
    if (item.replayRisk !== "source-anchored-partial") {
      issues.push({
        id: "ui-tui-interaction.shared-event-loop-only",
        product,
        dimension: "state-transition",
        message: `${product} UI/TUI gate is not source anchored and cannot be promoted toward native parity.`,
      })
    }
    if (product !== "opencode" && (item.sourceMatrixID === "opencode" || item.fixtureID === "opencode-ui:source-matrix" || item.replayRisk === "borrowed-opencode")) {
      issues.push({
        id: "ui-tui-interaction.borrowed-source-matrix",
        product,
        dimension: "input-event",
        message: `${product} UI/TUI gate is borrowing the OpenCode UI source matrix.`,
      })
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  }
}

export function buildUITUIInteractionExactDiffBlockerSnapshot(): UITUIInteractionExactDiffBlockerSnapshot {
  const replayGate = buildUITUIInteractionReplayGateSnapshot()
  const cases = replayGate.cases.map(buildUITUIInteractionExactDiffBlockerCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:ui-tui-interaction-exact-diff-blocker-gate" as const,
    fixtureID: "ui:tui-interaction-exact-diff-blocker-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: replayGate.comparisonDimensions as UITUIInteractionExactDiffBlockerDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyUITUIInteractionExactDiffBlockerSnapshot(
  snapshot: UITUIInteractionExactDiffBlockerSnapshot,
): UITUIInteractionExactDiffBlockerVerification {
  const issues: UITUIInteractionExactDiffBlockerIssue[] = []
  const products: UITUIInteractionExactDiffBlockerProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]

  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "ui-tui-interaction-exact-diff.missing-product",
        product,
        dimension: "input-event",
        message: `Missing UI/TUI interaction exact-diff blocker case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "ui-tui-interaction-exact-diff.native-claim",
        product,
        dimension: "input-event",
        message: `${product} UI/TUI blocker must remain exact-diff-partial and cannot claim native parity.`,
      })
    }
    if (!uiGateContains(item.inputEvents, /input|event|normalize|keypress|text|command|select|submit|TUIInputEvent|pty|exact-diff-not-proven/i)) {
      issues.push({
        id: "ui-tui-interaction-exact-diff.input-event",
        product,
        dimension: "input-event",
        message: `${product} UI/TUI blocker no longer records input event exact-diff anchors.`,
      })
    }
    if (!uiGateContains(item.renderSnapshots, /render|snapshot|lastRender|title|renderer|width|history|tree|exact-diff-not-proven/i)) {
      issues.push({
        id: "ui-tui-interaction-exact-diff.render-snapshot",
        product,
        dimension: "render-snapshot",
        message: `${product} UI/TUI blocker no longer records render snapshot exact-diff anchors.`,
      })
    }
    if (!uiGateContains(item.stateTransitions, /transition|status|mode|history|editing|running|selecting|interrupted|ready|loop|exact-diff-not-proven/i)) {
      issues.push({
        id: "ui-tui-interaction-exact-diff.state-transition",
        product,
        dimension: "state-transition",
        message: `${product} UI/TUI blocker no longer records state transition exact-diff anchors.`,
      })
    }
    if (!uiGateContains(item.focusEvents, /focus|selector|ctrl-p|theme|model|mode|chat|timing|exact-diff-not-proven/i)) {
      issues.push({
        id: "ui-tui-interaction-exact-diff.focus",
        product,
        dimension: "focus",
        message: `${product} UI/TUI blocker no longer records focus exact-diff anchors.`,
      })
    }
    if (!uiGateContains(item.resizeEvents, /resize|width|height|viewport|terminal|exact-diff-not-proven/i)) {
      issues.push({
        id: "ui-tui-interaction-exact-diff.resize",
        product,
        dimension: "resize",
        message: `${product} UI/TUI blocker no longer records resize exact-diff anchors.`,
      })
    }
    if (item.exactDiffRisk !== "semantic-fixture-needs-exact-diff" || item.sourceAnchors.length === 0 || !uiGateContains(item.knownLossiness, /not-proven|partial|not-exact|not-replayed|preview|shared|not-native|side-effects/i)) {
      issues.push({
        id: "ui-tui-interaction-exact-diff.shared-event-loop-only",
        product,
        dimension: "state-transition",
        message: `${product} UI/TUI blocker is not anchored to product-specific partial replay evidence.`,
      })
    }
    if (item.fixtureIDs.length < 3 || !uiGateContains(item.fixtureIDs, /ui:source-matrix|shared-event-loop-preview|tui-interaction-replay-gate/i)) {
      issues.push({
        id: "ui-tui-interaction-exact-diff.fixture-coverage",
        product,
        dimension: "render-snapshot",
        message: `${product} UI/TUI blocker no longer links source matrix and shared event-loop evidence.`,
      })
    }
    if (product !== "opencode" && (item.sourceMatrixID === "opencode" || item.fixtureID === "opencode-ui:source-matrix" || item.exactDiffRisk === "borrowed-opencode" || uiGateContains(item.nativeEvidenceRefs, /^opencode-ui:source-matrix$/))) {
      issues.push({
        id: "ui-tui-interaction-exact-diff.borrowed-source-matrix",
        product,
        dimension: "input-event",
        message: `${product} UI/TUI blocker is borrowing the OpenCode UI source matrix.`,
      })
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildUITUIInteractionExactDiffBlockerCase(
  gateCase: UITUIInteractionReplayGateCase,
): UITUIInteractionExactDiffBlockerCase {
  return {
    product: gateCase.product,
    sourceMatrixID: gateCase.sourceMatrixID,
    evidenceRef: "conformance:ui-tui-interaction-exact-diff-blocker-gate",
    fixtureID: gateCase.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    inputEvents: uniqueStrings([
      ...gateCase.inputEvents,
      "ui-input-event-native-pty:exact-diff-not-proven",
    ]),
    renderSnapshots: uniqueStrings([
      ...gateCase.renderSnapshots,
      "ui-render-snapshot-native-tree:exact-diff-not-proven",
    ]),
    stateTransitions: uniqueStrings([
      ...gateCase.stateTransitions,
      "ui-state-transition-native-loop:exact-diff-not-proven",
    ]),
    focusEvents: uniqueStrings([
      ...gateCase.focusEvents,
      "ui-focus-native-selector-timing:exact-diff-not-proven",
    ]),
    resizeEvents: uniqueStrings([
      ...gateCase.resizeEvents,
      "ui-resize-native-terminal:exact-diff-not-proven",
    ]),
    sourceAnchors: gateCase.sourceAnchors,
    uiAtomIDs: gateCase.uiAtomIDs,
    uiPortIDs: gateCase.uiPortIDs,
    fixtureIDs: gateCase.fixtureIDs,
    nativeEvidenceRefs: uniqueStrings([
      gateCase.fixtureID,
      ...gateCase.fixtureIDs,
      ...gateCase.sourceAnchors,
      ...gateCase.nativeEvidenceRefs,
    ]),
    exactDiffRisk: "semantic-fixture-needs-exact-diff",
    knownLossiness: uniqueStrings([
      ...gateCase.knownLossiness,
      "ui-input-event-native-pty-not-proven",
      "ui-render-snapshot-native-tree-not-proven",
      "ui-state-transition-native-loop-not-proven",
      "ui-focus-native-selector-timing-not-proven",
      "ui-resize-native-terminal-not-proven",
    ]),
  }
}

export const uiPortContractFixtures: LegoPortContractFixture[] = [
  {
    id: "ui.event-loop",
    input: "TUIInputEvent text, command, key, select, resize, submit, and tick events",
    output: "TUIEventLoopResult plus stable snapshot for status, mode, theme, model, history, notifications, and render state",
    lifecycle: ["process", "workspace", "session", "turn"],
    resources: [],
    conformance: "surface-swap:ui-event-loop",
    implementations: ["ui.event-loop.shared-tui"],
    personalityAtoms: ["opencode.ui.event-loop", "opencode.tui.shell", "pi.ui.event-loop", "pi.tui.shell", "nanobot.tui.shell", "hermes.tui.shell"],
    personalityAtomImplementationKinds: tuiPersonalityAtomImplementationKinds,
  },
  {
    id: "ui.renderer",
    input: "transcript, tool status, notifications, theme, model, and product surface state",
    output: "rendered text/HTML/snapshot fragments for a selected shell",
    lifecycle: ["workspace", "session", "turn"],
    resources: [],
    conformance: "ui:renderer",
    implementations: ["ui.renderer.noop", "ui.renderer.text", "ui.renderer.html"],
    personalityAtoms: ["opencode.ui.renderer", "pi.ui.renderer", "nanobot.ui.renderer", "hermes.ui.renderer"],
  },
  {
    id: "ui.command-router",
    input: "slash command, keyboard command, command registry, session context, and product shell context",
    output: "command execution result, navigation action, or tool/turn dispatch request",
    lifecycle: ["workspace", "session", "turn"],
    resources: [],
    conformance: "ui:command-router",
    implementations: ["ui.command-router.common"],
    personalityAtoms: ["opencode.ui.command-router", "pi.ui.command-router", "nanobot.ui.command-router", "hermes.ui.command-router"],
  },
  {
    id: "ui.theme-registry",
    input: "theme registrations, selected theme id, user/product defaults, and validation policy",
    output: "normalized theme descriptor and render token set",
    lifecycle: ["process", "workspace", "session"],
    resources: [],
    conformance: "ui:theme-registry",
    implementations: ["ui.theme-registry.common"],
    personalityAtoms: ["opencode.ui.theme-registry", "pi.ui.theme-registry", "nanobot.ui.theme-registry", "hermes.ui.theme-registry"],
  },
  {
    id: "ui.input-normalizer",
    input: "raw keypress, text, resize, mouse, submit, interrupt, or transport-specific UI event",
    output: "normalized TUIInputEvent or command-router action",
    lifecycle: ["workspace", "session", "turn"],
    resources: [],
    conformance: "ui:input-normalizer",
    implementations: ["ui.input-normalizer.common"],
    personalityAtoms: ["opencode.ui.input-normalizer", "pi.ui.input-normalizer", "nanobot.ui.input-normalizer", "hermes.ui.input-normalizer"],
  },
  {
    id: "ui.snapshot",
    input: "current UI event-loop state, rendered fragments, product shell state, and debug metadata",
    output: "stable UI snapshot for tests, servers, RPC, and browser smoke surfaces",
    lifecycle: ["workspace", "session", "turn"],
    resources: [],
    conformance: "ui:snapshot",
    implementations: ["ui.snapshot.common"],
    personalityAtoms: ["opencode.ui.snapshot", "pi.ui.snapshot", "nanobot.ui.snapshot", "hermes.ui.snapshot"],
  },
]

function buildUITUIInteractionReplayGateCase(product: UITUIInteractionReplayGateProduct): UITUIInteractionReplayGateCase {
  const atoms = createUIProductAtoms(product)
  const profile = atoms.profile()
  const sourceMatrixID = uiSourceMatrixID(product)
  const isOpenCode = product === "opencode"
  const loop = atoms.createEventLoop({ width: 72, height: 18 })
  const normalizer = atoms.createInputNormalizer()
  const themeCommand = isOpenCode ? "/themes" : "/theme"
  const modelFocusEvent: Parameters<typeof loop.handle>[0] = isOpenCode ? { type: "command", command: "/models" } : { type: "key", key: "ctrl-p" }
  const helpCommand = isOpenCode ? "/help" : "/help"
  const normalizedThemeCommand = normalizer.normalize(themeCommand)
  const normalizedModelKey = normalizer.normalize({ type: "keypress", key: "ctrl-p" })
  const normalizedText = normalizer.normalize(`hello ${product}`)
  const help = loop.handle({ type: "command", command: helpCommand })
  const modelFocus = loop.handle(modelFocusEvent)
  const modelSelect = loop.handle({ type: "select", target: "model", value: profile.initialModel })
  const themeFocus = loop.handle({ type: "command", command: themeCommand })
  const themeValue = isOpenCode ? "opencode" : profile.themes.includes("light") ? "light" : profile.initialTheme
  const themeSelect = loop.handle({ type: "select", target: "theme", value: themeValue })
  const resize = loop.handle({ type: "resize", width: 96, height: 32 })
  const text = loop.handle({ type: "text", text: `hello ${product}` })
  const submit = loop.handle({ type: "submit" })
  const interrupt = loop.handle({ type: "key", key: "escape" })
  const rendered = loop.render()
  const renderSnapshot = loop.snapshot()

  return {
    product,
    sourceMatrixID,
    evidenceRef: "conformance:ui-tui-interaction-replay-gate",
    fixtureID: `${sourceMatrixID}-ui:source-matrix`,
    inputEvents: uniqueStrings([
      `normalize:string:${themeCommand}=>${normalizedThemeCommand?.type ?? "missing"}`,
      `normalize:keypress:ctrl-p=>${normalizedModelKey?.type ?? "missing"}`,
      `normalize:text=>${normalizedText?.type ?? "missing"}`,
      `TUIInputEvent:command:${helpCommand}`,
      isOpenCode ? "TUIInputEvent:command:/models" : "TUIInputEvent:key:ctrl-p",
      `TUIInputEvent:select:model:${profile.initialModel}`,
      `TUIInputEvent:select:theme:${themeValue}`,
      "TUIInputEvent:resize:96x32",
      `TUIInputEvent:text:hello ${product}`,
      "TUIInputEvent:submit",
      "TUIInputEvent:key:escape",
    ]),
    renderSnapshots: uniqueStrings([
      `render snapshot title:${profile.title}`,
      `render snapshot rendererMode:${profile.rendererMode}`,
      `render snapshot width:${renderSnapshot.width}`,
      `render snapshot history:${renderSnapshot.history.join("|")}`,
      `render lastRender includes title:${String(rendered.includes(profile.title))}`,
      `render lastRender line count:${renderSnapshot.lastRender.split("\n").length}`,
    ]),
    stateTransitions: uniqueStrings([
      transitionMarker("command:/help", help),
      transitionMarker("key:ctrl-p", modelFocus),
      transitionMarker("select:model", modelSelect),
      transitionMarker("command:/theme", themeFocus),
      transitionMarker("select:theme", themeSelect),
      transitionMarker("resize", resize),
      transitionMarker("text", text),
      transitionMarker("submit", submit),
      transitionMarker("escape", interrupt),
      `history includes submitted text:${submit.snapshot.history.includes(`hello ${product}`)}`,
      `events count:${interrupt.snapshot.events}`,
    ]),
    focusEvents: uniqueStrings([
      `focus selector:model via ${isOpenCode ? "/models command" : "key ctrl-p"} -> mode:${modelFocus.snapshot.mode} status:${modelFocus.snapshot.status}`,
      `focus selector:theme via ${themeCommand} command -> mode:${themeFocus.snapshot.mode} status:${themeFocus.snapshot.status}`,
      `focus returns chat via escape -> mode:${interrupt.snapshot.mode} status:${interrupt.snapshot.status}`,
    ]),
    resizeEvents: uniqueStrings([
      `resize width:${resize.snapshot.width} height:${resize.snapshot.height}`,
      `terminal viewport min width honored:${resize.snapshot.width >= 40}`,
      `terminal viewport min height honored:${resize.snapshot.height >= 10}`,
    ]),
    sourceAnchors: uiSourceAnchors(product),
    uiAtomIDs: uniqueStrings([
      atoms.atomID("event-loop"),
      atoms.atomID("command-router"),
      atoms.atomID("input-normalizer"),
      atoms.atomID("renderer"),
      atoms.atomID("snapshot"),
      atoms.atomID("theme-registry"),
    ]),
    uiPortIDs: ["ui.event-loop", "ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"],
    fixtureIDs: uniqueStrings([
      "ui:tui-interaction-replay-gate",
      `${sourceMatrixID}-ui:source-matrix`,
      `${sourceMatrixID}-tui:shared-event-loop-preview`,
      ...(isOpenCode ? [openCodeUINativeExactFixtureID] : []),
    ]),
    nativeEvidenceRefs: uiNativeEvidenceRefs(product),
    replayRisk: "source-anchored-partial",
    knownLossiness: uniqueStrings([
      `${sourceMatrixID}-ui-source-matrix-partial-fixture`,
      "shared-tui-event-loop-preview-only",
      "native-pty-input-transcript-not-replayed",
      "render-tree-snapshot-not-native",
      "focus-resize-timing-not-exact",
      "command-side-effects-not-replayed",
    ]),
  }
}

function transitionMarker(label: string, result: TUIEventLoopResult): string {
  return `transition:${label}:status:${result.snapshot.status}:mode:${result.snapshot.mode}:history:${result.snapshot.history.length}`
}

function uiSourceMatrixID(product: UITUIInteractionReplayGateProduct): UITUIInteractionReplayGateCase["sourceMatrixID"] {
  if (product === "pi-mono") return "pi"
  if (product === "hermes-agent") return "hermes"
  return product
}

function uiNativeEvidenceRefs(product: UITUIInteractionReplayGateProduct): string[] {
  const sourceMatrixID = uiSourceMatrixID(product)
  return uniqueStrings([
    `${sourceMatrixID}-ui:source-matrix`,
    `conformance:${sourceMatrixID}-ui-source-matrix`,
    ...(product === "opencode"
      ? [openCodeUINativeExactEvidenceRef, openCodeUINativeExactReplayRef, openCodeUINativeExactFixtureID]
      : []),
  ])
}

function uiSourceAnchors(product: UITUIInteractionReplayGateProduct): string[] {
  if (product === "opencode") {
    return [
      "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/cli/cmd/tui/app.tsx#appBindingCommands,rendererConfig,errorMessage,tui,App",
      "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/cli/cmd/tui/plugin/api.tsx#routeRegister,routeNavigate,routeCurrent,mapOption,pickOption,stateApi,appApi,createTuiApi",
      "conformance:opencode-ui-source-matrix",
    ]
  }
  if (product === "pi-mono") {
    return [
      "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da:packages/tui/src/tui.ts#Component,Focusable,isFocusable,CURSOR_MARKER,OverlayHandle,Container,TUI",
      "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da:packages/tui/src/autocomplete.ts#AutocompleteItem,SlashCommand,AutocompleteSuggestions,CombinedAutocompleteProvider",
      "conformance:pi-ui-source-matrix",
    ]
  }
  if (product === "nanobot") {
    return [
      "upstream:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7:nanobot/cli/stream.py#StreamRenderer,ThinkingSpinner,ensure_header,on_delta,on_end,pause_spinner,stop_for_input",
      "upstream:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7:webui/src/components/thread/ThreadShell.tsx#projectWebuiThreadMessages,ThreadShell,PendingFirstMessage",
      "conformance:nanobot-ui-source-matrix",
    ]
  }
  return [
    "upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf:agent/display.py#KawaiiSpinner,build_tool_preview,render_edit_diff_with_delta,get_cute_tool_message",
    "upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf:apps/desktop/src/app/chat/composer/index.tsx#ChatBar,QueueEditState,cloneAttachments",
    "upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf:apps/desktop/src/app/chat/index.tsx#ChatHeader,ChatView",
    "conformance:hermes-ui-source-matrix",
  ]
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`
}

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function uiGateContains(values: readonly string[], pattern: RegExp): boolean {
  return values.some((value) => pattern.test(value))
}
