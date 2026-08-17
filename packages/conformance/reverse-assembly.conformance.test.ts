import { describe, expect, it } from "vitest"
import { auditReverseAssembly } from "@helix/recipes"

describe("reverse assembly audit", () => {
  it("proves product recipes can be assembled back into harness surfaces", async () => {
    const report = await auditReverseAssembly({ cwd: process.cwd() })

    expect(report.ok).toBe(true)
    expect(report.issues).toEqual([])
    expect(report.products.map((product) => product.product)).toEqual(["opencode", "pi-mono", "nanobot", "hermes-agent"])
    expect(report.products.find((product) => product.product === "opencode")?.graph.map((module) => module.id)).toEqual(
      expect.arrayContaining(["opencode.product-shell.sdk", "opencode.product-shell.web", "opencode.product-shell.slack", "opencode.product-shell.control-plane"]),
    )
    expect(report.products.find((product) => product.product === "pi-mono")?.graph.map((module) => module.id)).toEqual(
      expect.arrayContaining([
        "pi.product-shell.sdk",
        "pi.product-shell.cli",
        "pi.product-shell.tui",
        "pi.product-shell.rpc",
        "pi.product-shell.web-ui",
        "pi.product-shell.server",
        "pi.product-shell.package-manager",
        "pi.product-shell.release-hardening",
      ]),
    )
    expect(report.products.find((product) => product.product === "nanobot")?.graph.map((module) => module.id)).toEqual(
      expect.arrayContaining([
        "nanobot.product-shell.sdk",
        "nanobot.product-shell.cli",
        "nanobot.product-shell.tui",
        "nanobot.product-shell.web-ui",
        "nanobot.product-shell.server",
      ]),
    )
    expect(report.products.find((product) => product.product === "hermes-agent")?.graph.map((module) => module.id)).toEqual(
      expect.arrayContaining([
        "hermes.product-shell.sdk",
        "hermes.product-shell.cli",
        "hermes.product-shell.tui",
        "hermes.product-shell.api-server",
        "hermes.product-shell.acp",
        "hermes.product-shell.gateway",
        "hermes.product-shell.web-dashboard",
      ]),
    )
    expect(report.products.find((product) => product.product === "opencode")?.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining(["opencode:sdk-session-behavior", "opencode:surface-behavior", "opencode:tui-event-loop-behavior"]),
    )
    expect(report.products.find((product) => product.product === "pi-mono")?.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "pi-mono:package-behavior",
        "pi-mono:surface-behavior",
        "pi-mono:sdk-cli-rpc-behavior",
        "pi-mono:tui-web-ui-behavior",
        "pi-mono:tui-event-loop-behavior",
        "pi-mono:server-live-transport-behavior",
      ]),
    )
    expect(report.products.find((product) => product.product === "nanobot")?.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "nanobot:sdk-cli-behavior",
        "nanobot:tui-web-ui-behavior",
        "nanobot:tui-event-loop-behavior",
        "nanobot:server-live-transport-behavior",
      ]),
    )
    expect(report.products.find((product) => product.product === "hermes-agent")?.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "hermes:sdk-cli-behavior",
        "hermes:tui-dashboard-behavior",
        "hermes:tui-event-loop-behavior",
        "hermes:acp-gateway-behavior",
        "hermes:api-server-live-transport-behavior",
      ]),
    )
    expect(report.shared.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "recipe-diff",
        "shared-common-core",
        "agent-loop-semantic-replay",
        "upstream-fixtures:pi-replay",
        "upstream-fixtures:opencode-replay",
        "upstream-product-workflow-parity",
        "upstream-e2e-parity",
      ]),
    )
  }, 120_000)
})
