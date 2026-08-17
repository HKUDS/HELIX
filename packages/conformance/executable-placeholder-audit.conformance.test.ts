import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  buildAssemblyContract,
  buildExecutablePlaceholderAudit,
  executableImplementationLevelForAtom,
  executablePortRuleFor,
  verifyExecutablePlaceholderAudit,
  writeExecutablePlaceholderAuditReports,
  type AssemblyContract,
  type AssemblyContractProduct,
  type ExecutablePlaceholderAudit,
} from "@helix/recipes"

describe("executable placeholder audit conformance", () => {
  it("classifies executable-required ports from the shared rule source", () => {
    for (const portID of [
      "product.shell",
      "runtime.module-catalog",
      "provider.stream",
      "resource.discovery",
      "prompt.system-builder",
      "turn.context-builder",
      "tool.executor",
      "session.message-store",
      "hook.bus",
      "ui.renderer",
    ]) {
      expect(executablePortRuleFor(portID), portID).toMatchObject({ portID, executableRequired: true })
    }

    expect(executablePortRuleFor("config.source")).toMatchObject({
      portID: "config.source",
      executableRequired: false,
    })
  })

  it("does not infer native executable level from selection reason without proof", () => {
    const proofless = {
      id: "opencode.custom.native-proof-candidate",
      productScope: "opencode",
      selectionReason: "native parity complete without proof",
    }

    expect(executableImplementationLevelForAtom(proofless)).toBe("compatible-bridge")
    expect(
      executableImplementationLevelForAtom({
        ...proofless,
        implementationKind: "factory",
        scope: "product",
        productScope: "opencode",
        parityCoverage: "native",
        nativeEvidenceRefs: [],
        fixtureIDs: [],
        knownLossiness: [],
      }),
    ).toBe("compatible-bridge")
    expect(
      executableImplementationLevelForAtom({
        ...proofless,
        implementationKind: "factory",
        scope: "product",
        productScope: "opencode",
        parityCoverage: "native",
        nativeEvidenceRefs: ["upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"],
        fixtureIDs: ["opencode-custom:native-proof"],
        knownLossiness: [],
      }),
    ).toBe("native")
    expect(
      executableImplementationLevelForAtom({
        ...proofless,
        implementationKind: "factory",
        scope: "product",
        productScope: "opencode",
        parityCoverage: "native",
        nativeEvidenceRefs: ["upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"],
        fixtureIDs: ["opencode-custom:native-proof"],
        knownLossiness: ["partial-replay"],
      }),
    ).toBe("compatible-bridge")
  })

  it("builds a verifiable audit for canonical products with runtime metadata retained only as overlays", () => {
    const products: AssemblyContractProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent", "minimal"]
    const audit = buildExecutablePlaceholderAudit({
      products,
      generatedAt: "2026-06-10T00:00:00.000Z",
    })
    const verification = verifyExecutablePlaceholderAudit(audit)
    const opencodeRuntime = audit.items.find((item) => item.product === "opencode" && item.portID === "runtime.capability-resolver")
    const opencodePrompt = audit.items.find((item) => item.product === "opencode" && item.portID === "prompt.system-builder")
    const opencodeTurn = audit.items.find((item) => item.product === "opencode" && item.portID === "turn.context-builder")
    const todo027Consumers = audit.items.filter((item) => item.ownerTODO === "TODO-027")

    expect(verification.ok).toBe(true)
    expect(audit.schemaVersion).toBe(1)
    expect(audit.artifactKind).toBe("executable-placeholder-audit")
    expect(audit.products).toEqual([...products].sort())
    expect(audit.summary.fingerprint).toMatch(/^[a-f0-9]{16}$/)
    expect(audit.summary.compileBlockers).toBe(0)
    expect(audit.summary.executableRequired).toBeGreaterThan(0)
    expect(audit.summary.metadataOverlays).toBeGreaterThan(0)
    expect(audit.summary.todo027EvidenceConsumers).toBe(0)
    expect(audit.summary.nativeEvidenceLinked).toBeGreaterThan(0)
    expect(audit.summary.nativeFixtureLinked).toBeGreaterThan(0)
    expect(audit.summary.knownLossinessLinked).toBeGreaterThan(0)
    expect(todo027Consumers).toEqual([])
    expect(opencodeRuntime).toMatchObject({
      selectedAtomID: "opencode.runtime.capability-resolver",
      executableRequired: true,
      implementationLevel: "native",
      risk: "common-ok",
      compileStatus: "passed",
      ownerTODO: "TODO-025",
      metadataOverlayAtoms: expect.arrayContaining(["opencode.runtime.capability-aliases"]),
    })
    expect(opencodePrompt).toMatchObject({
      selectedAtomID: "opencode.prompt.mode-builder",
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-system-prompt-core-exact-fixture", "conformance:opencode-llm-request-system-exact-fixture"]),
      fixtureIDs: expect.arrayContaining(["opencode-prompt:system-prompt-core-exact-fixture", "opencode-prompt:llm-request-system-exact-fixture"]),
      knownLossiness: [],
    })
    expect(opencodeTurn).toMatchObject({
      selectedAtomID: "opencode.turn.context-builder",
      implementationLevel: "native",
      parityCoverage: "native",
      risk: "common-ok",
      ownerTODO: "TODO-025",
      nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-turn-context-builder-native-exact-fixture", "conformance:opencode-turn-replay-snapshot"]),
      fixtureIDs: expect.arrayContaining(["opencode-turn-context-builder:native-exact-fixture", "opencode-turn:context-builder"]),
      knownLossiness: [],
    })
    expect(verification.checks.find((check) => check.id === "executable-audit.todo027-native-evidence-consumed")).toMatchObject({ ok: true })
  })

  it("classifies synthetic partial product turn factories as profile-compatible", () => {
    const contract = buildAssemblyContract({ product: "opencode", generatedAt: "2026-06-10T00:00:00.000Z" })
    const turnAtom = contract.atoms.find((atom) => atom.id === "opencode.turn.context-builder")
    if (!turnAtom) throw new Error("Missing OpenCode turn context-builder atom")
    const partialProductFactory = {
      ...turnAtom,
      implementationKind: "factory",
      selectionReason: "product turn factory still backed by partial replay evidence",
      parityCoverage: "profile-compatible",
      nativeEvidenceRefs: ["conformance:opencode-turn-replay-snapshot", "turn-replay:opencode:context-builder"],
      fixtureIDs: ["opencode-turn:context-builder"],
      knownLossiness: ["common-runner-not-full-native-loop", "partial-product-turn-replay", "shared-turn-profile"],
      source: {
        packageDir: "packages/lego-agent-loop",
        packageName: "@helix/lego-agent-loop",
        exportPath: "./product-turn/opencode/context-builder",
        specifier: "@helix/lego-agent-loop/product-turn/opencode/context-builder",
      },
      sourcePackage: "@helix/lego-agent-loop",
      publicExport: "./product-turn/opencode/context-builder",
    } satisfies AssemblyContract["atoms"][number]
    const mutated: AssemblyContract = {
      ...contract,
      atoms: contract.atoms.map((atom) => (atom.id === partialProductFactory.id ? partialProductFactory : atom)),
    }

    const audit = buildExecutablePlaceholderAudit({
      contracts: [mutated],
      generatedAt: "2026-06-10T00:00:00.000Z",
    })
    const verification = verifyExecutablePlaceholderAudit(audit)
    const turnBinding = audit.items.find((item) => item.portID === "turn.context-builder")

    expect(verification.ok).toBe(true)
    expect(executableImplementationLevelForAtom(partialProductFactory)).toBe("profile-compatible")
    expect(turnBinding).toMatchObject({
      selectedAtomID: "opencode.turn.context-builder",
      implementationKind: "factory",
      implementationLevel: "profile-compatible",
      parityCoverage: "profile-compatible",
      risk: "lossy-compatible",
      expectedResolution: "keep-with-evidence",
      compileStatus: "passed",
      ownerTODO: "TODO-027",
      nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-turn-replay-snapshot", "turn-replay:opencode:context-builder"]),
      fixtureIDs: expect.arrayContaining(["opencode-turn:context-builder"]),
      knownLossiness: expect.arrayContaining(["partial-product-turn-replay"]),
    })
  })

  it("writes JSON and Markdown reports that round-trip through the verifier", () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-executable-audit-"))
    try {
      const jsonPath = join(dir, "executable-placeholder-audit.json")
      const markdownPath = join(dir, "executable-placeholder-audit.md")
      const audit = buildExecutablePlaceholderAudit({
        products: ["opencode"],
        generatedAt: "2026-06-10T00:00:00.000Z",
      })

      writeExecutablePlaceholderAuditReports({ audit, jsonPath, markdownPath })

      const roundTripped = JSON.parse(readFileSync(jsonPath, "utf8")) as ExecutablePlaceholderAudit
      const markdown = readFileSync(markdownPath, "utf8")
      expect(verifyExecutablePlaceholderAudit(roundTripped).ok).toBe(true)
      expect(roundTripped.summary.fingerprint).toBe(audit.summary.fingerprint)
      expect(markdown).toContain("# Executable Placeholder Audit")
      expect(markdown).toContain("## Metadata Overlays")
      expect(markdown).toContain("TODO-027 evidence consumers")
      expect(markdown).toContain("Native Evidence")
      expect(markdown).toContain("Fixtures")
      expect(markdown).toContain("Lossiness")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("flags metadata-only providers as compile blockers in generated audit artifacts", () => {
    const contract = buildAssemblyContract({ product: "opencode", generatedAt: "2026-06-10T00:00:00.000Z" })
    const metadataProvider = "opencode.runtime.capability-aliases"
    const broken: AssemblyContract = {
      ...contract,
      ports: contract.ports.map((port) =>
        port.id === "runtime.capability-resolver"
          ? { ...port, providerAtoms: [metadataProvider], selectedProviderAtom: metadataProvider }
          : port,
      ),
      bindings: contract.bindings.map((binding) =>
        binding.portID === "runtime.capability-resolver"
          ? { ...binding, providerAtomID: metadataProvider, providerAtom: metadataProvider }
          : binding,
      ),
    }
    const audit = buildExecutablePlaceholderAudit({
      contracts: [broken],
      generatedAt: "2026-06-10T00:00:00.000Z",
    })
    const verification = verifyExecutablePlaceholderAudit(audit)
    const blocker = audit.items.find((item) => item.portID === "runtime.capability-resolver")

    expect(verification.ok).toBe(false)
    expect(audit.summary.compileBlockers).toBe(1)
    expect(blocker).toMatchObject({
      selectedAtomID: metadataProvider,
      risk: "compile-blocker",
      expectedResolution: "rebind-existing-executable",
      compileStatus: "blocked",
      ownerTODO: "TODO-028",
    })
    expect(verification.issues.map((issue) => issue.id)).toContain("executable-audit.compile-blockers.none")
  })

  it("flags product prompt support metadata aliases as executable compile blockers", () => {
    const products: Array<{ product: AssemblyContractProduct; prefix: string }> = [
      { product: "opencode", prefix: "opencode" },
      { product: "pi-mono", prefix: "pi" },
      { product: "nanobot", prefix: "nanobot" },
      { product: "hermes-agent", prefix: "hermes" },
    ]
    const supportPorts = [
      { portID: "resource.discovery", aliasID: (prefix: string) => `${prefix}.resource.discovery`, commonProvider: "resource.discovery.filesystem" },
      { portID: "prompt.resource-loader", aliasID: (prefix: string) => `${prefix}.prompt.resource-loader`, commonProvider: "prompt.resource-loader.text" },
      { portID: "prompt.tool-renderer", aliasID: (prefix: string) => `${prefix}.prompt.tool-renderer`, commonProvider: "prompt.tool-renderer.common" },
      { portID: "prompt.model-capability-adapter", aliasID: (prefix: string) => `${prefix}.prompt.model-adapter`, commonProvider: "prompt.model-capability-adapter.common" },
      { portID: "prompt.compaction-adapter", aliasID: (prefix: string) => `${prefix}.prompt.compaction-adapter`, commonProvider: "prompt.compaction-adapter.common" },
    ]
    const brokenContracts: AssemblyContract[] = products.map(({ product, prefix }) => {
      const contract = buildAssemblyContract({ product, generatedAt: "2026-06-10T00:00:00.000Z" })
      const metadataAtoms: AssemblyContract["atoms"] = supportPorts.map(({ portID, aliasID }) => {
        const metadataProvider = aliasID(prefix)
        const executableProvider = contract.ports.find((port) => port.id === portID)?.selectedProviderAtom
        const executableAtom = contract.atoms.find((atom) => atom.id === executableProvider)
        if (!executableAtom) throw new Error(`Missing executable prompt support atom for ${product}:${portID}`)
        return {
          ...executableAtom,
          id: metadataProvider,
          scope: "product",
          productScope: "product",
          personality: product,
          implementationKind: "metadata-only",
          selected: true,
          selectedBy: [product],
          selectionReason: "metadata-only product prompt support alias; executable binding uses the shared common prompt support atom",
          provides: [portID],
          nativeEvidenceRefs: [`metadata-overlay:${product}:${portID}`],
          fixtureIDs: [],
          parityCoverage: "metadata",
          knownLossiness: ["bom-or-overlay-only", "not-executable-provider"],
        }
      })
      const metadataAtomIDs = new Set(metadataAtoms.map((atom) => atom.id))
      return {
        ...contract,
        atoms: [...contract.atoms.filter((atom) => !metadataAtomIDs.has(atom.id)), ...metadataAtoms],
        ports: contract.ports.map((port) => {
          const supportPort = supportPorts.find((item) => item.portID === port.id)
          if (!supportPort) return port
          const metadataProvider = supportPort.aliasID(prefix)
          return { ...port, providerAtoms: [metadataProvider], selectedProviderAtom: metadataProvider, productProviderAtoms: [metadataProvider] }
        }),
        bindings: contract.bindings.map((binding) => {
          const supportPort = supportPorts.find((item) => item.portID === binding.portID)
          if (!supportPort) return binding
          const metadataProvider = supportPort.aliasID(prefix)
          return { ...binding, providerAtomID: metadataProvider, providerAtom: metadataProvider }
        }),
      }
    })
    const audit = buildExecutablePlaceholderAudit({
      contracts: brokenContracts,
      generatedAt: "2026-06-10T00:00:00.000Z",
    })
    const verification = verifyExecutablePlaceholderAudit(audit)

    expect(verification.ok).toBe(false)
    expect(audit.summary.compileBlockers).toBe(products.length * supportPorts.length)
    for (const { product, prefix } of products) {
      for (const { portID, aliasID, commonProvider } of supportPorts) {
        const metadataProvider = aliasID(prefix)
        expect(audit.items.find((item) => item.product === product && item.portID === portID)).toMatchObject({
          selectedAtomID: metadataProvider,
          executableRequired: true,
          implementationLevel: "metadata-only",
          risk: "compile-blocker",
          expectedResolution: "rebind-existing-executable",
          compileStatus: "blocked",
          ownerTODO: "TODO-028",
          candidateExecutableProviders: expect.arrayContaining([commonProvider]),
        })
      }
    }
    expect(verification.issues.find((issue) => issue.id === "executable-audit.compile-blockers.none")?.refs).toEqual(
      expect.arrayContaining(products.flatMap(({ product, prefix }) => supportPorts.map(({ portID, aliasID }) => `${product}:${portID}:${aliasID(prefix)}`))),
    )
  })

  it("keeps the TODO-027 executable keep-with-evidence queue drained after product turn nativeization", () => {
    const audit = buildExecutablePlaceholderAudit({
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      generatedAt: "2026-06-10T00:00:00.000Z",
    })
    const verification = verifyExecutablePlaceholderAudit(audit)
    const todo027KeepWithEvidenceItems = audit.items.filter((item) => item.ownerTODO === "TODO-027" && item.expectedResolution === "keep-with-evidence")

    expect(verification.ok).toBe(true)
    expect(audit.summary.todo027EvidenceConsumers).toBe(0)
    expect(todo027KeepWithEvidenceItems).toEqual([])
  })
})
