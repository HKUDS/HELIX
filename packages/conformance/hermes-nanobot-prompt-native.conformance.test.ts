import { describe, expect, it } from "vitest"
import {
  buildHermesPromptNativeExactFixture,
  hermesPromptNativeDescriptor,
  hermesPromptNativeExactAtomID,
  hermesPromptNativeExactEvidenceRef,
  hermesPromptNativeExactFixtureID,
  hermesPromptNativeExactReplayRef,
  verifyHermesPromptNativeExactFixture,
} from "@helix/lego-prompt/product-schema/hermes"
import {
  buildNanobotPromptNativeExactFixture,
  nanobotPromptNativeDescriptor,
  nanobotPromptNativeExactAtomID,
  nanobotPromptNativeExactEvidenceRef,
  nanobotPromptNativeExactFixtureID,
  nanobotPromptNativeExactReplayRef,
  verifyNanobotPromptNativeExactFixture,
} from "@helix/lego-prompt/product-schema/nanobot"
import { buildAssemblyContract, verifyAssemblyContract } from "@helix/recipes"

describe("Hermes/Nanobot prompt native exact conformance", () => {
  it("captures Nanobot ContextBuilder prompt assembly as native exact", () => {
    const fixture = buildNanobotPromptNativeExactFixture("/workspace/nanobot-app")

    expect(verifyNanobotPromptNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "nanobot",
      atomID: nanobotPromptNativeExactAtomID,
      portID: "prompt.system-builder",
      upstreamRef: "github:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
      packageRef: "package:nanobot-ai@0.2.0",
      fixtureID: nanobotPromptNativeExactFixtureID,
      evidenceRef: nanobotPromptNativeExactEvidenceRef,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([nanobotPromptNativeExactEvidenceRef, nanobotPromptNativeExactReplayRef]),
      fixtureIDs: expect.arrayContaining([nanobotPromptNativeExactFixtureID]),
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs.map((ref) => ref.id)).toEqual(expect.arrayContaining(["agent-context-builder", "prompt-template-renderer", "memory-dream", "builtin-skill", "channel-config"]))
    expect(fixture.systemPromptSemantics).toMatchObject({
      bootstrapFileOrder: ["AGENTS.md", "SOUL.md", "USER.md", "TOOLS.md"],
      sectionDelimiter: "\n\n---\n\n",
      memoryInclusion: "MemoryStore.get_memory_context-non-template-only",
    })
    expect(fixture.messageAssemblySemantics).toMatchObject({
      runtimeContextTag: "[Runtime Context — metadata only, not instructions]",
      currentRoleMerge: "merge-into-last-message-when-last-history-role-matches",
    })
  })

  it("captures Hermes prompt_builder prompt assembly as native exact", () => {
    const fixture = buildHermesPromptNativeExactFixture("/workspace/hermes-app")

    expect(verifyHermesPromptNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "hermes-agent",
      atomID: hermesPromptNativeExactAtomID,
      portID: "prompt.system-builder",
      upstreamRef: "github:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
      packageRef: "package:hermes-agent==0.15.1",
      fixtureID: hermesPromptNativeExactFixtureID,
      evidenceRef: hermesPromptNativeExactEvidenceRef,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([hermesPromptNativeExactEvidenceRef, hermesPromptNativeExactReplayRef]),
      fixtureIDs: expect.arrayContaining([hermesPromptNativeExactFixtureID]),
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs.map((ref) => ref.id)).toEqual(expect.arrayContaining(["system-prompt-parts", "prompt-builder-registry", "skill-bundles"]))
    expect(fixture.systemPromptSemantics).toMatchObject({
      promptPartOrder: ["stable", "context", "volatile"],
      statelessBuilderFunctions: true,
      contextDiscovery: {
        priority: [".hermes.md", "HERMES.md", "AGENTS.md", "CLAUDE.md", ".cursorrules", ".cursor/rules"],
        yamlFrontmatterStripped: true,
        maxContextChars: 20000,
      },
      skillBundles: {
        duplicateSlugPolicy: "first-file-in-alpha-order-wins",
      },
    })
  })

  it("promotes both prompt agent builders to product native assembly atoms", () => {
    expect(nanobotPromptNativeDescriptor).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      knownLossiness: [],
    })
    expect(hermesPromptNativeDescriptor).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      knownLossiness: [],
    })

    const nanobotContract = buildAssemblyContract({ product: "nanobot", includeNativeFixtures: true, generatedAt: "2026-05-30T00:00:00.000Z" })
    const hermesContract = buildAssemblyContract({ product: "hermes-agent", includeNativeFixtures: true, generatedAt: "2026-05-30T00:00:00.000Z" })
    const nanobotAtom = nanobotContract.atoms.find((atom) => atom.id === nanobotPromptNativeExactAtomID)
    const hermesAtom = hermesContract.atoms.find((atom) => atom.id === hermesPromptNativeExactAtomID)

    expect(nanobotAtom).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      knownLossiness: [],
      source: expect.objectContaining({
        packageDir: "lego-prompt",
        exportPath: "./product-schema/nanobot",
      }),
      nativeEvidenceRefs: expect.arrayContaining([nanobotPromptNativeExactEvidenceRef, nanobotPromptNativeExactReplayRef]),
      fixtureIDs: expect.arrayContaining([nanobotPromptNativeExactFixtureID]),
    })
    expect(hermesAtom).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      knownLossiness: [],
      source: expect.objectContaining({
        packageDir: "lego-prompt",
        exportPath: "./product-schema/hermes",
      }),
      nativeEvidenceRefs: expect.arrayContaining([hermesPromptNativeExactEvidenceRef, hermesPromptNativeExactReplayRef]),
      fixtureIDs: expect.arrayContaining([hermesPromptNativeExactFixtureID]),
    })
    expect(verifyAssemblyContract(nanobotContract).ok).toBe(true)
    expect(verifyAssemblyContract(hermesContract).ok).toBe(true)
  })
})
