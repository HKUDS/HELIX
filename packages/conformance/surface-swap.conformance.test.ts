import { describe, expect, it } from "vitest"
import type { TUIInputEvent, TUIEventLoopSnapshot } from "@helix/lego-ui"
import { assembleOpenCodeHarness, assemblePiMonoHarness } from "@helix/recipes"
import type { OpenCodeTUISurface } from "@helix/adapters-opencode"
import type { PiTUISurface } from "@helix/adapters-pi"

type SharedTUISurface = Pick<OpenCodeTUISurface | PiTUISurface, "dispatch" | "interactiveSnapshot" | "render">

describe("surface swap smoke", () => {
  it("drives OpenCode through its native TUI event loop and Pi through the shared ui.event-loop", () => {
    const opencode = assembleOpenCodeHarness().hooks.services.get("opencode.tui") as OpenCodeTUISurface
    const pi = assemblePiMonoHarness().hooks.services.get("pi.tui") as PiTUISurface

    const opencodeTrace = driveOpenCodeNativeTUI(opencode)
    const piTrace = driveSharedTUI(pi)

    expect(opencode.render()).toContain("OpenCode TUI")
    expect(pi.render()).toContain("Pi Mono TUI")
    expect(opencodeTrace).not.toEqual(piTrace)
  })
})

function driveOpenCodeNativeTUI(surface: SharedTUISurface): Array<Pick<TUIEventLoopSnapshot, "status" | "mode" | "history" | "events">> {
  const trace: Array<Pick<TUIEventLoopSnapshot, "status" | "mode" | "history" | "events">> = []
  const text = "native opencode surface swap"
  const currentModel = surface.interactiveSnapshot().model
  const events: TUIInputEvent[] = [
    { type: "command", command: "/help" },
    { type: "command", command: "/models" },
    { type: "select", target: "model", value: currentModel },
    { type: "command", command: "/themes" },
    { type: "select", target: "theme", value: "tokyonight" },
    { type: "text", text },
    { type: "submit" },
    { type: "command", command: "/new" },
    { type: "key", key: "ctrl-p" },
  ]

  for (const event of events) {
    const result = surface.dispatch(event)
    expect(result.handled, JSON.stringify(event)).toBe(true)
    trace.push(projectSnapshot(result.snapshot))
  }
  expect(surface.dispatch({ type: "command", command: "/theme" })).toMatchObject({
    handled: false,
    error: "Unknown OpenCode TUI command: theme",
  })
  expect(surface.interactiveSnapshot().history).toEqual([text])
  expect(surface.render()).toContain("Route:Home")
  return trace
}

function driveSharedTUI(surface: SharedTUISurface): Array<Pick<TUIEventLoopSnapshot, "status" | "mode" | "history" | "events">> {
  const trace: Array<Pick<TUIEventLoopSnapshot, "status" | "mode" | "history" | "events">> = []
  const sharedText = "shared surface swap"
  const events: TUIInputEvent[] = [
    { type: "command", command: "/help" },
    { type: "text", text: sharedText },
    { type: "submit" },
    { type: "command", command: "/theme" },
    { type: "select", target: "theme", value: "dark" },
    { type: "key", key: "ctrl-p" },
    { type: "select", target: "model", value: surface.interactiveSnapshot().model },
    { type: "command", command: "/interrupt" },
  ]

  for (const event of events) {
    const result = surface.dispatch(event)
    expect(result.handled, JSON.stringify(event)).toBe(true)
    trace.push(projectSnapshot(result.snapshot))
  }
  expect(surface.interactiveSnapshot().history).toEqual([sharedText])
  return trace
}

function projectSnapshot(snapshot: TUIEventLoopSnapshot): Pick<TUIEventLoopSnapshot, "status" | "mode" | "history" | "events"> {
  return {
    status: snapshot.status,
    mode: snapshot.mode,
    history: snapshot.history,
    events: snapshot.events,
  }
}
