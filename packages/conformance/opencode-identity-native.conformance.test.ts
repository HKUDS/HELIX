import { describe, expect, it } from "vitest"
import {
  buildOpenCodeIdentityNativeExactFixture,
  createOpenCodeIdentityClockAtom,
  createOpenCodeIdentityIDGeneratorAtom,
  createOpenCodeIdentityWorkspaceResolverAtom,
  openCodeIdentityClockNativeExactAtomID,
  openCodeIdentityIDGeneratorNativeExactAtomID,
  openCodeIdentityNativeExactAtomIDs,
  openCodeIdentityNativeExactEvidenceRef,
  openCodeIdentityNativeExactFixtureID,
  openCodeIdentityNativeExactReplayRef,
  openCodeIdentityNativeDescriptors,
  openCodeIdentityWorkspaceResolverNativeExactAtomID,
  verifyOpenCodeIdentityNativeExactFixture,
} from "@helix/adapters-opencode/product-schema/identity"
import { buildAssemblyContract, routeForAtomBlock } from "@helix/recipes"

describe("OpenCode identity native exact fixture", () => {
  it("replays upstream identifier, title, and session path behavior", () => {
    const fixture = buildOpenCodeIdentityNativeExactFixture()
    expect(fixture).toMatchObject({
      product: "opencode",
      atomIDs: [
        openCodeIdentityClockNativeExactAtomID,
        openCodeIdentityIDGeneratorNativeExactAtomID,
        openCodeIdentityWorkspaceResolverNativeExactAtomID,
      ],
      portIDs: ["identity.clock", "identity.id-generator", "identity.workspace-resolver"],
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: openCodeIdentityNativeExactEvidenceRef,
      fixtureID: openCodeIdentityNativeExactFixtureID,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: [openCodeIdentityNativeExactEvidenceRef, openCodeIdentityNativeExactReplayRef],
      fixtureIDs: [openCodeIdentityNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/core/src/util/identifier.ts#Identifier.create"),
      expect.stringContaining("packages/opencode/src/id/id.ts#ascending,descending,create,timestamp"),
      expect.stringContaining("packages/opencode/src/session/session.ts#createDefaultTitle"),
    ]))
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "descending-session-and-ascending-child-ids",
      "default-title-clock-and-fork-title",
      "workspace-session-path",
      "id-validation-and-timestamp-readback",
    ])
    expect(fixture.cases[0]?.output).toMatchObject({
      sessionID: "ses_ff3e53804ffe0123456789ABCD",
      nextSessionIDSameTimestamp: "ses_ff3e53804ffd123456789ABCDE",
      messageID: "msg_00c1ac7fb001EFGHIJKLMNOPQR",
      partID: "prt_00c1ac7fb002STUVWXYZabcdef",
      workspaceID: "wrk_00c1ac7fb003ghijklmnopqrst",
    })
    expect(fixture.cases[1]?.output).toMatchObject({
      parentTitle: "New session - 2026-06-13T12:10:42.949Z",
      childTitle: "Child session - 2026-06-13T12:11:00.001Z",
      parentTitleIsDefault: true,
      childTitleIsDefault: true,
      explicitTitleIsDefault: false,
      firstForkTitle: "Investigate replay (fork #1)",
      secondForkTitle: "Investigate replay (fork #2)",
    })
    expect(fixture.cases[2]?.output).toEqual({
      nestedPath: "packages/app",
      rootPath: "",
      siblingPath: "../cli",
    })
  })

  it("exposes native atom factories matching the pinned upstream semantics", () => {
    const ids = createOpenCodeIdentityIDGeneratorAtom()
    const clock = createOpenCodeIdentityClockAtom()
    const workspace = createOpenCodeIdentityWorkspaceResolverAtom()
    const timestamp = 1_718_190_000_123

    expect(ids.sessionID({ timestamp, randomBytes: Array.from({ length: 14 }, (_unused, index) => index) })).toBe("ses_ff3e53804ffe0123456789ABCD")
    expect(ids.messageID({ timestamp, randomBytes: Array.from({ length: 14 }, (_unused, index) => index + 14) })).toBe("msg_00c1ac7fb001EFGHIJKLMNOPQR")
    expect(ids.partID({ timestamp, randomBytes: Array.from({ length: 14 }, (_unused, index) => index + 28) })).toBe("prt_00c1ac7fb002STUVWXYZabcdef")
    expect(ids.workspaceID({ timestamp, randomBytes: Array.from({ length: 14 }, (_unused, index) => index + 42) })).toBe("wrk_00c1ac7fb003ghijklmnopqrst")
    expect(ids.messageID({ given: "msg_existing" })).toBe("msg_existing")
    expect(() => ids.partID({ given: "msg_wrong_prefix" })).toThrow("ID msg_wrong_prefix does not start with prt")
    expect(ids.timestampFromAscendingID({ id: "msg_00c1ac7fb001EFGHIJKLMNOPQR" })).toBe(203_081_723)
    expect(clock.createDefaultTitle({ now: "2026-06-13T12:10:42.949Z" })).toBe("New session - 2026-06-13T12:10:42.949Z")
    expect(clock.createDefaultTitle({ now: "2026-06-13T12:11:00.001Z", isChild: true })).toBe("Child session - 2026-06-13T12:11:00.001Z")
    expect(clock.isDefaultTitle({ title: "Child session - 2026-06-13T12:11:00.001Z" })).toBe(true)
    expect(clock.forkTitle({ title: "Investigate replay (fork #2)" })).toBe("Investigate replay (fork #3)")
    expect(workspace.sessionPath({ worktree: "/workspace/opencode", cwd: "/workspace/opencode/packages/app" })).toBe("packages/app")
  })

  it("verifies fixture identity, evidence, and no lossiness", () => {
    const fixture = buildOpenCodeIdentityNativeExactFixture()
    expect(verifyOpenCodeIdentityNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeIdentityNativeExactFixture({ ...fixture, fingerprint: "0000000000000000" }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-identity-native-exact.fingerprint" }),
    ]))
    expect(verifyOpenCodeIdentityNativeExactFixture({ ...fixture, knownLossiness: ["native-parity-not-proven"] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-identity-native-exact.lossiness" }),
    ]))
    expect(verifyOpenCodeIdentityNativeExactFixture({ ...fixture, nativeParityClaim: false as true }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-identity-native-exact.native-claim" }),
    ]))
  })

  it("routes and assembles OpenCode identity atoms as native exact product atoms", () => {
    for (const atomID of openCodeIdentityNativeExactAtomIDs) {
      expect(routeForAtomBlock(atomID)).toMatchObject({
        packageName: "@helix/adapters-opencode",
        exportPath: "./product-schema/identity",
      })
    }

    const contract = buildAssemblyContract({
      product: "opencode",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })
    for (const descriptor of openCodeIdentityNativeDescriptors) {
      const atom = contract.atoms.find((candidate) => candidate.id === descriptor.id)
      expect(atom, descriptor.id).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        source: expect.objectContaining({
          specifier: "@helix/adapters-opencode/product-schema/identity",
        }),
        nativeEvidenceRefs: expect.arrayContaining([
          openCodeIdentityNativeExactEvidenceRef,
          openCodeIdentityNativeExactReplayRef,
          "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
        ]),
        fixtureIDs: [openCodeIdentityNativeExactFixtureID],
        knownLossiness: [],
      })
      expect(atom?.nativeEvidenceRefs).not.toContain("conformance:opencode-identity-source-matrix")
      expect(atom?.fixtureIDs).not.toContain("opencode-identity:source-matrix")
    }
  })
})
