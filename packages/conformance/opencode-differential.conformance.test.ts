import { describe, expect, it } from "vitest"
import {
  captureNativeNanobotTrace,
  captureNativePiMonoTrace,
  nativeNanobotAnthropicBaseURL,
  nativeOpenCodeAnthropicBaseURL,
  nativePiMonoAnthropicBaseURL,
  runHermesAgentDifferential,
  runNanobotDifferential,
  runOpenCodeDifferential,
  runPiMonoDifferential,
} from "@helix/recipes"

describe("harness differential trace runner", () => {
  it("compares assembled OpenCode against the native OpenCode trace shape without fixture gaps", async () => {
    const report = await runOpenCodeDifferential()

    expect(report.ok).toBe(true)
    expect(report.parityOK).toBe(true)
    expect(report.status).toBe("matched")
    expect(report.assembled.graphNodes).toBe(293)
    expect(report.checks.every((check) => check.ok)).toBe(true)
    expect(report.gaps).toEqual([])
  })

  it("keeps Nanobot differential support on pinned fixture traces", async () => {
    const report = await runNanobotDifferential()

    expect(report.ok).toBe(true)
    expect(report.parityOK).toBe(true)
    expect(report.status).toBe("matched")
    expect(report.product).toBe("nanobot")
    expect(report.assembled.graphNodes).toBeGreaterThan(0)
    expect(report.checks.every((check) => check.ok)).toBe(true)
    expect(report.gaps).toEqual([])
  })

  it("keeps Pi Mono differential support on pinned fixture traces", async () => {
    const report = await runPiMonoDifferential()

    expect(report.ok).toBe(true)
    expect(report.parityOK).toBe(true)
    expect(report.status).toBe("matched")
    expect(report.product).toBe("pi-mono")
    expect(report.assembled.graphNodes).toBe(297)
    expect(report.checks.every((check) => check.ok)).toBe(true)
    expect(report.gaps).toEqual([])
  })

  it("keeps Hermes Agent differential support on pinned fixture traces", async () => {
    const report = await runHermesAgentDifferential()

    expect(report.ok).toBe(true)
    expect(report.parityOK).toBe(true)
    expect(report.status).toBe("matched")
    expect(report.product).toBe("hermes-agent")
    expect(report.assembled.graphNodes).toBeGreaterThan(0)
    expect(report.checks.every((check) => check.ok)).toBe(true)
    expect(report.gaps).toEqual([])
  })

  it("treats native Pi reasoning and streamed text deltas as protocol-compatible", async () => {
    const fixture = await runPiMonoDifferential()
    const report = await runPiMonoDifferential({
      original: {
        ...fixture.original,
        assistantPartTypes: ["reasoning", "text"],
        cli: {
          ...fixture.original.cli,
          stdoutEventTypes: [
            "session",
            "agent_start",
            "turn_start",
            "message_start",
            "message_end",
            "message_start",
            "message_update",
            "message_update",
            "message_update",
            "message_end",
            "turn_end",
            "agent_end",
          ],
        },
      },
    })

    expect(report.parityOK).toBe(true)
    expect(report.gaps).toEqual([])
  })

  it("treats native OpenCode stdout-only captures as CLI-compatible but not trace-complete", async () => {
    const fixture = await runOpenCodeDifferential()
    const report = await runOpenCodeDifferential({
      original: {
        ...fixture.original,
        capture: { mode: "native", packageSpec: "opencode-ai@1.15.11" },
        assistantAllText: fixture.original.assistantVisibleText,
        assistantPartTypes: ["step-start", "text"],
        storage: { ...fixture.original.storage, nativeSchema: false, tables: [] },
        cli: {
          ...fixture.original.cli,
          stdoutEventTypes: ["step_start", "text"],
        },
      },
    })

    expect(report.parityOK).toBe(false)
    expect(report.gaps.map((gap) => gap.id)).toEqual([
      "storage.native-schema",
      "trace.debug-events",
      "trace.span-order",
      "trace.readback",
      "trace.flow-projection",
    ])
  })

  it("fails trace parity when redaction policy evidence is downgraded", async () => {
    const fixture = await runOpenCodeDifferential()
    const report = await runOpenCodeDifferential({
      original: {
        ...fixture.original,
        trace: {
          ...fixture.original.trace!,
          redaction: {
            ...fixture.original.trace!.redaction,
            providerRequest: "raw",
          },
        },
      },
    })

    expect(report.parityOK).toBe(false)
    expect(report.gaps.map((gap) => gap.id)).toEqual(["trace.redaction-policy"])
  })

  it("normalizes Anthropic base URLs for native OpenCode AI SDK capture", () => {
    expect(nativeOpenCodeAnthropicBaseURL("https://api.minimaxi.com/anthropic")).toBe("https://api.minimaxi.com/anthropic/v1")
    expect(nativeOpenCodeAnthropicBaseURL("https://api.minimaxi.com/anthropic/v1")).toBe("https://api.minimaxi.com/anthropic/v1")
    expect(nativePiMonoAnthropicBaseURL("https://api.minimaxi.com/anthropic/v1")).toBe("https://api.minimaxi.com/anthropic")
    expect(nativePiMonoAnthropicBaseURL("https://api.minimaxi.com/anthropic")).toBe("https://api.minimaxi.com/anthropic")
    expect(nativeNanobotAnthropicBaseURL("https://api.anthropic.com")).toBe("https://api.anthropic.com")
    expect(nativeNanobotAnthropicBaseURL("https://api.anthropic.com/v1")).toBe("https://api.anthropic.com")
    expect(nativeNanobotAnthropicBaseURL("https://api.minimaxi.com/anthropic/v1")).toBe("https://api.minimaxi.com/anthropic")
  })

  it("exposes native Pi Mono capture behind the same differential source switch", async () => {
    await expect(
      captureNativePiMonoTrace(
        {
          id: "pi-native-missing-credentials",
          prompt: "Reply with exactly: pi-native-ok",
          assistantText: "pi-native-ok",
        },
        { env: {} },
      ),
    ).rejects.toThrow("Native Pi Mono differential capture requires")
  })

  it("exposes native Nanobot capture behind the same differential source switch", async () => {
    await expect(
      captureNativeNanobotTrace(
        {
          id: "nanobot-native-missing-credentials",
          prompt: "Reply with exactly: nanobot-native-ok",
          assistantText: "nanobot-native-ok",
        },
        { env: {} },
      ),
    ).rejects.toThrow("Native Nanobot differential capture requires")
  })
})
