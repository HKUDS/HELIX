import type { HermesSpecialAtomDescriptor } from "./types.ts"

export const hermesTuiShellAtom: HermesSpecialAtomDescriptor = {
  id: "hermes.tui.shell",
  port: "ui.event-loop",
  implementation: "shared Helix UI event-loop preview for Hermes Agent",
  referenceSource: "reference only: Hermes Agent CLI/TUI surface; implemented here as shared UI event-loop preview",
  implementationKind: "preview",
}
