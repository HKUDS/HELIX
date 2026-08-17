import { describe, expect, it } from "vitest"
import { buildHarnessBuilderSlots, slotIDForPort, slotStageForPort } from "../docs-site/src/builder-slots.ts"

describe("builder slot descriptors", () => {
  it("builds stable slots from ports, atoms, and bundles", () => {
    const slots = buildHarnessBuilderSlots({
      atoms: [
        { id: "product.shell.minimal-cli", provides: ["product.shell"], productScope: "common" },
        { id: "session.store.memory", provides: ["session.store"], productScope: "common" },
        { id: "provider.stream.openai-compatible", provides: ["provider.stream"], productScope: "common" },
        { id: "tool.registry.memory", provides: ["tool.registry"], productScope: "common" },
        { id: "prompt.system.common", provides: ["prompt.system-builder"], productScope: "common" },
        { id: "ui.renderer.html", provides: ["ui.renderer"], productScope: "common" },
        { id: "turn.runner.common", provides: ["turn.provider-stream-runner"], productScope: "common" },
      ],
      ports: [
        { id: "product.shell", candidates: [], bundleCandidates: ["bundle.product.minimal-cli"], requiredIn: ["minimal"] },
        { id: "session.store", candidates: ["session.store.memory"], bundleCandidates: [], requiredIn: ["minimal"] },
        { id: "provider.stream", candidates: ["provider.stream.openai-compatible"], bundleCandidates: [], requiredIn: ["minimal"] },
        { id: "tool.registry", candidates: ["tool.registry.memory"], bundleCandidates: [], requiredIn: ["minimal"] },
        { id: "prompt.system-builder", candidates: ["prompt.system.common"], bundleCandidates: [], requiredIn: ["minimal"] },
        { id: "ui.renderer", candidates: ["ui.renderer.html"], bundleCandidates: [], requiredIn: ["minimal"] },
        { id: "turn.provider-stream-runner", candidates: ["turn.runner.common"], bundleCandidates: [], requiredIn: ["minimal"] },
      ],
      bundles: [
        { id: "bundle.product.minimal-cli", label: "Minimal CLI", productScope: "common", atoms: ["product.shell.minimal-cli"], ports: ["product.shell"] },
        { id: "bundle.session.memory", label: "Memory session", productScope: "common", atoms: ["session.store.memory"], ports: ["session.store"] },
      ],
    })

    expect(slots.map((slot) => slot.id)).toEqual([
      "slot.product.shell",
      "slot.session.store",
      "slot.provider.stream",
      "slot.prompt.system-builder",
      "slot.tool.registry",
      "slot.ui.renderer",
      "slot.turn.provider-stream-runner",
    ])
    expect(slots.find((slot) => slot.id === "slot.product.shell")).toMatchObject({
      stage: "interface",
      label: "Product Interface",
      primaryPortID: "product.shell",
      candidateAtomIDs: ["product.shell.minimal-cli"],
      candidateBundleIDs: ["bundle.product.minimal-cli"],
      required: true,
      requiredIn: ["minimal"],
      productScope: "common",
    })
    expect(slots.find((slot) => slot.id === "slot.session.store")?.candidateBundleIDs).toContain("bundle.session.memory")
    expect(slots.find((slot) => slot.id === "slot.provider.stream")?.stage).toBe("provider")
    expect(slots.find((slot) => slot.id === "slot.prompt.system-builder")?.stage).toBe("prompt")
    expect(slots.find((slot) => slot.id === "slot.tool.registry")?.stage).toBe("tools")
    expect(slots.find((slot) => slot.id === "slot.ui.renderer")?.stage).toBe("ui")
    expect(slots.find((slot) => slot.id === "slot.turn.provider-stream-runner")?.stage).toBe("runtime")
  })

  it("normalizes port ids into stable slot ids and stages", () => {
    expect(slotIDForPort("Provider.Stream Runner")).toBe("slot.provider.stream-runner")
    expect(slotStageForPort("product.shell")).toBe("interface")
    expect(slotStageForPort("event.log")).toBe("session")
    expect(slotStageForPort("filesystem.port")).toBe("tools")
    expect(slotStageForPort("registry.ui")).toBe("ui")
    expect(slotStageForPort("runtime.lifecycle-runner")).toBe("runtime")
  })
})
