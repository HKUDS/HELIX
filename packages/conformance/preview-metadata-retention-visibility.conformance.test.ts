import { describe, expect, it } from "vitest"
import { buildDocsSite, buildHarnessBuilderData } from "@helix/docs-site"
import {
  buildAssembledFlowBlueprint,
  buildAssemblyContract,
  buildCurrentModulePlaceholderAudit,
  buildExecutablePlaceholderAudit,
  buildTodo27NativeRewriteInventory,
  executableImplementationLevelForAtom,
} from "@helix/recipes"

const PRODUCTS = ["hermes-agent", "nanobot", "opencode", "pi-mono"] as const

const METADATA_PRODUCT_COUNTS = {
  "hermes-agent": 12,
  nanobot: 17,
  opencode: 16,
  "pi-mono": 11,
}

const METADATA_REQUIRED_PORT_COUNTS = {
  "block.manifest": 4,
  "capability.ref": 4,
  "conformance.ref": 4,
  "provider.cassette": 4,
  "recipe.binding": 4,
  "resource.grant": 4,
}

function countBy<T>(items: T[], keyFor: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = keyFor(item)
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})
}

function metricStrings(graph: ReturnType<typeof buildAssembledFlowBlueprint>, key: "nativeEvidenceRefs" | "knownLossiness"): Set<string> {
  return new Set(graph.nodes.flatMap((node) => (node.metrics?.[key] ?? []) as string[]))
}

function bridgeAtomIDs(graph: ReturnType<typeof buildAssembledFlowBlueprint>, implementationLevel: string): Set<string> {
  return new Set(
    graph.nodes.flatMap((node) =>
      (node.metrics?.bridgeLayers ?? [])
        .filter((layer) => layer.implementationLevel === implementationLevel)
        .flatMap((layer) => layer.atomIDs),
    ),
  )
}

describe("preview shell and metadata retention visibility", () => {
  it("keeps preview shells completed while metadata overlays remain visibly non-executable", () => {
    const generatedAt = "2026-06-10T00:00:00.000Z"
    const docsSite = buildDocsSite({ cwd: process.cwd(), generatedAt })
    const builderData = buildHarnessBuilderData(docsSite)
    const inventory = buildTodo27NativeRewriteInventory({ generatedAt })
    const currentModuleAudit = buildCurrentModulePlaceholderAudit({
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      generatedAt,
    })
    const executableAudit = buildExecutablePlaceholderAudit({
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent", "minimal"],
      generatedAt,
    })

    const previewItems = inventory.items.filter((item) => item.implementationLevel === "preview-shell")
    const metadataItems = inventory.items.filter((item) => item.implementationLevel === "metadata-only")
    const metadataIDs = new Set(metadataItems.map((item) => item.atomID))
    const builderPreviewAtoms = builderData.atoms.filter((atom) => atom.implementationLevel === "preview-shell")
    const builderMetadataAtoms = builderData.atoms.filter((atom) => metadataIDs.has(atom.id))
    const currentPreviewAtoms = currentModuleAudit.items.filter((item) => item.kind === "product-atom" && item.implementationLevel === "preview-shell")
    const currentMetadataAtoms = currentModuleAudit.items.filter((item) => item.kind === "product-atom" && metadataIDs.has(item.atomID ?? ""))
    const currentMetadataBindings = currentModuleAudit.items.filter((item) => item.kind === "required-binding" && metadataIDs.has(item.atomID ?? ""))
    const executablePreviewItems = executableAudit.items.filter((item) => item.implementationLevel === "preview-shell")
    const executableMetadataItems = executableAudit.items.filter((item) => metadataIDs.has(item.selectedAtomID))

    expect(inventory.summary).toMatchObject({
      productNativeComplete: 389,
      previewRetained: 0,
      metadataRetained: 56,
      uncategorized: 0,
      byImplementationLevel: expect.objectContaining({
        "preview-shell": 0,
        "metadata-only": 56,
        native: 389,
      }),
    })
    expect(previewItems).toHaveLength(0)
    expect(metadataItems).toHaveLength(56)
    expect(countBy(metadataItems, (item) => item.ownerSection)).toEqual({ "TODO-028 Metadata Overlay Boundary": 56 })
    expect(countBy(metadataItems, (item) => item.product)).toMatchObject(METADATA_PRODUCT_COUNTS)

    expect(builderData.implementationStates.find((state) => state.level === "preview-shell")).toMatchObject({
      count: 0,
      selectedCount: 0,
      evidenceCount: 0,
      lossinessCount: 0,
      exampleAtomIDs: [],
    })
    expect(builderData.implementationStates.find((state) => state.level === "metadata-only")).toMatchObject({
      count: 92,
      selectedCount: 49,
      evidenceCount: 67,
      lossinessCount: 92,
    })
    expect(builderPreviewAtoms).toHaveLength(0)
    expect(builderMetadataAtoms).toHaveLength(56)
    expect(currentPreviewAtoms).toHaveLength(0)
    expect(currentMetadataAtoms).toHaveLength(56)
    expect(currentMetadataBindings).toHaveLength(24)
    expect(countBy(currentMetadataBindings, (item) => item.portID ?? "unknown")).toMatchObject(METADATA_REQUIRED_PORT_COUNTS)

    expect(executableAudit.summary).toMatchObject({
      metadataOnlyExecutableBindings: 0,
      previewOnlyExecutableBindings: 0,
      metadataOverlays: 40,
      byRisk: expect.objectContaining({
        "metadata-ok": 24,
        "preview-only": 0,
      }),
    })
    expect(executablePreviewItems).toHaveLength(0)
    expect(executableMetadataItems).toHaveLength(24)
    expect(countBy(executableMetadataItems, (item) => item.portID)).toMatchObject(METADATA_REQUIRED_PORT_COUNTS)

    for (const item of executableMetadataItems) {
      expect(item).toMatchObject({
        implementationLevel: "metadata-only",
        parityCoverage: "metadata",
        executableRequired: false,
        risk: "metadata-ok",
        expectedResolution: "metadata-overlay-only",
        ownerTODO: "TODO-028",
        compileStatus: "not-required",
        knownLossiness: expect.arrayContaining(["bom-or-overlay-only", "not-executable-provider"]),
      })
    }

    for (const product of PRODUCTS) {
      const contract = buildAssemblyContract({ product, generatedAt })
      const atomByID = new Map(contract.atoms.map((atom) => [atom.id, atom]))
      const graph = buildAssembledFlowBlueprint(contract, generatedAt)
      const flowPreviewBridgeAtomIDs = bridgeAtomIDs(graph, "preview-shell")
      const flowMetadataBridgeAtomIDs = bridgeAtomIDs(graph, "metadata-only")
      const flowNativeEvidenceRefs = metricStrings(graph, "nativeEvidenceRefs")
      const flowLossiness = metricStrings(graph, "knownLossiness")
      const resourceGrantMetadata = metadataItems.find((item) => item.product === product && item.atomID.endsWith(".resource.grant-defaults"))

      expect(flowPreviewBridgeAtomIDs.size, product).toBe(0)
      expect(resourceGrantMetadata, product).toBeDefined()
      if (resourceGrantMetadata) {
        expect(flowMetadataBridgeAtomIDs, resourceGrantMetadata.atomID).toContain(resourceGrantMetadata.atomID)
        for (const ref of resourceGrantMetadata.nativeEvidenceRefs) expect(flowNativeEvidenceRefs, resourceGrantMetadata.atomID).toContain(ref)
        for (const lossiness of resourceGrantMetadata.knownLossiness) expect(flowLossiness, resourceGrantMetadata.atomID).toContain(lossiness)
      }

      for (const item of metadataItems.filter((candidate) => candidate.product === product)) {
        const atom = atomByID.get(item.atomID)
        const builderAtom = builderData.atoms.find((candidate) => candidate.id === item.atomID)
        const currentAtom = currentMetadataAtoms.find((candidate) => candidate.product === item.product && candidate.atomID === item.atomID)

        expect(item).toMatchObject({
          ownerSection: "TODO-028 Metadata Overlay Boundary",
          disposition: "metadata-retained",
          implementationLevel: "metadata-only",
          parityCoverage: "metadata",
          blocker: expect.stringContaining("must not bind executable ports"),
          knownLossiness: expect.arrayContaining(["bom-or-overlay-only", "not-executable-provider"]),
        })
        expect(atom, item.atomID).toMatchObject({
          implementationKind: "metadata-only",
          parityCoverage: "metadata",
          nativeEvidenceRefs: expect.arrayContaining(item.nativeEvidenceRefs),
          knownLossiness: expect.arrayContaining(item.knownLossiness),
        })
        expect(atom ? executableImplementationLevelForAtom(atom) : "missing", item.atomID).toBe("metadata-only")
        expect(builderAtom, item.atomID).toMatchObject({
          implementationKind: "metadata-only",
          implementationLevel: "metadata-only",
          implementationLabel: "Metadata only",
          parityCoverage: "metadata",
          nativeEvidenceRefs: expect.arrayContaining(item.nativeEvidenceRefs),
          knownLossiness: expect.arrayContaining(item.knownLossiness),
        })
        expect(builderAtom?.implementationSummary, item.atomID).toContain("do not count as an executable native implementation")
        expect(currentAtom, item.atomID).toMatchObject({
          implementationLevel: "metadata-only",
          parityCoverage: "metadata",
          mismatchKind: "metadata-only",
          evidenceStrength: "todo27-inventory",
          sourceVerificationStatus: "metadata-overlay-source",
          ownerTODO: "TODO-028",
          nextAction: "Keep as metadata overlay and prevent executable binding.",
          evidenceRefs: expect.arrayContaining(item.nativeEvidenceRefs.map((ref) => `native-evidence:${ref}`)),
          knownLossiness: expect.arrayContaining(item.knownLossiness),
        })
      }
    }
  }, 15_000)
})
