import { describe, expect, it } from "vitest"
import {
  buildHermesIdentityNativeExactFixture,
  createHermesIdentityClockAtom,
  createHermesIdentityIDGeneratorAtom,
  createHermesIdentityWorkspaceResolverAtom,
  hermesBuildSessionTitle,
  hermesFormatUpdatedAt,
  hermesHome,
  hermesIdentityNativeDescriptors,
  hermesIdentityNativeExactAtomIDs,
  hermesIdentityNativeExactEvidenceRef,
  hermesIdentityNativeExactFixtureID,
  hermesIdentityNativeExactReplayRef,
  hermesNormalizeCwdForCompare,
  hermesTranslateACPCwd,
  hermesUpdatedAtSortKey,
  hermesWindowsPathToWSL,
  isHermesACPSessionID,
  verifyHermesIdentityNativeExactFixture,
} from "@helix/adapters-hermes/product-schema/identity"
import { buildAssemblyContract, verifyAssemblyContract } from "@helix/recipes"

describe("Hermes identity native exact fixture", () => {
  it("proves Hermes ACP session ID, clock, title, and workspace behavior from pinned upstream sources", () => {
    const ids = createHermesIdentityIDGeneratorAtom()
    const clock = createHermesIdentityClockAtom()
    const workspace = createHermesIdentityWorkspaceResolverAtom()
    const fixture = buildHermesIdentityNativeExactFixture()
    const verification = verifyHermesIdentityNativeExactFixture(fixture)

    expect(ids.createSessionID({ randomUUID: "8f14e45f-ea24-4f6d-9f8f-2d37c6bfe9d1" })).toBe("8f14e45f-ea24-4f6d-9f8f-2d37c6bfe9d1")
    expect(ids.forkSessionID({ randomUUID: "5bb1a275-792d-40f8-a5d0-e1351f4ad5b8" })).toBe("5bb1a275-792d-40f8-a5d0-e1351f4ad5b8")
    expect(ids.isSessionID({ sessionID: "8f14e45f-ea24-4f6d-9f8f-2d37c6bfe9d1" })).toBe(true)
    expect(isHermesACPSessionID("8f14e45f-ea24-5f6d-9f8f-2d37c6bfe9d1")).toBe(false)
    expect(ids.buildSessionTitle({ title: "  Fix Zed ACP history  ", preview: "ignored", cwd: "/work/browser-link-3/" })).toBe("Fix Zed ACP history")
    expect(hermesBuildSessionTitle("", " Investigate broken ACP history in Zed ", "/work/browser-link-3/")).toBe("Investigate broken ACP history in Zed")
    expect(hermesBuildSessionTitle("", "", "/work/browser-link-3/")).toBe("browser-link-3")
    expect(hermesBuildSessionTitle("", "", "")).toBe("New thread")

    expect(clock.formatUpdatedAt({ value: 1_700_000_000.123456 })).toBe("2023-11-14T22:13:20.123456+00:00")
    expect(clock.formatUpdatedAt({ value: "2026-06-13T12:10:42+00:00" })).toBe("2026-06-13T12:10:42+00:00")
    expect(hermesFormatUpdatedAt("")).toBeNull()
    expect(clock.updatedAtSortKey({ value: "2026-06-13T12:10:42Z" })).toBe(Date.UTC(2026, 5, 13, 12, 10, 42) / 1000)
    expect(hermesUpdatedAtSortKey("1700000000")).toBe(1_700_000_000)
    expect(hermesUpdatedAtSortKey("")).toBe(Number.NEGATIVE_INFINITY)

    expect(workspace.windowsPathToWSL({ path: "E:\\Projects\\AI\\paperclip" })).toBe("/mnt/e/Projects/AI/paperclip")
    expect(hermesWindowsPathToWSL("D:/work/project")).toBe("/mnt/d/work/project")
    expect(workspace.translateACPCwd({ cwd: "E:\\Projects\\AI\\paperclip", isWSL: true })).toBe("/mnt/e/Projects/AI/paperclip")
    expect(hermesTranslateACPCwd("E:\\Projects\\AI\\paperclip", false)).toBe("E:\\Projects\\AI\\paperclip")
    expect(workspace.translateACPCwd({ cwd: "/mnt/e/Projects/AI/paperclip", isWSL: true })).toBe("/mnt/e/Projects/AI/paperclip")
    expect(workspace.normalizeCwdForCompare({ cwd: "E:\\Projects\\AI\\browser-link-3", homeDir: "/home/hermes" })).toBe("/mnt/e/Projects/AI/browser-link-3")
    expect(hermesNormalizeCwdForCompare("/mnt/E/Projects/AI/browser-link-3/../browser-link-3", "/home/hermes")).toBe("/mnt/e/Projects/AI/browser-link-3")
    expect(hermesNormalizeCwdForCompare("~/code/../paperclip", "/home/hermes")).toBe("/home/hermes/paperclip")
    expect(workspace.sameWorkspace({ left: "E:\\Projects\\AI\\browser-link-3", right: "/mnt/e/Projects/AI/browser-link-3", homeDir: "/home/hermes" })).toBe(true)
    expect(workspace.hermesHome({ homeDir: "/home/hermes" })).toBe("/home/hermes/.hermes")
    expect(hermesHome(" /profiles/research ", "/home/hermes")).toBe("/profiles/research")
    expect(workspace.stateDBPath({ envHermesHome: "/profiles/research", homeDir: "/home/hermes" })).toBe("/profiles/research/state.db")

    expect(fixture).toMatchObject({
      product: "hermes-agent",
      atomIDs: [...hermesIdentityNativeExactAtomIDs],
      portIDs: ["identity.clock", "identity.id-generator", "identity.workspace-resolver"],
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      evidenceRef: hermesIdentityNativeExactEvidenceRef,
      fixtureID: hermesIdentityNativeExactFixtureID,
      knownLossiness: [],
      policy: {
        acpSessionIDsUsePythonUUID4String: true,
        titlesPreferExplicitThenPreviewThenCwdLeaf: true,
        updatedAtKeepsNonEmptyStringsAndFormatsNumericEpochUTC: true,
        wslTranslatesWindowsDrivePathsToMntDrive: true,
        sessionDBLivesUnderHermesHomeStateDB: true,
      },
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "acp-session-uuid-and-title",
      "updated-at-utc-isoformat-and-sort-key",
      "wsl-cwd-translation",
      "cwd-normalization-and-filter-match",
      "hermes-home-state-db-path",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("acp_adapter/session.py#_win_path_to_wsl"),
      expect.stringContaining("hermes_constants.py#get_hermes_home"),
      expect.stringContaining("tests/acp/test_session.py#TestCreateSession"),
    ]))
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(hermesIdentityNativeDescriptors).toHaveLength(3)
    for (const descriptor of hermesIdentityNativeDescriptors) {
      expect(descriptor).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([hermesIdentityNativeExactEvidenceRef, hermesIdentityNativeExactReplayRef]),
        fixtureIDs: [hermesIdentityNativeExactFixtureID],
        knownLossiness: [],
      })
    }
  })

  it("rejects drift away from Hermes native identity behavior", () => {
    const fixture = buildHermesIdentityNativeExactFixture()

    expect(verifyHermesIdentityNativeExactFixture({ ...fixture, fingerprint: "bad" }).ok).toBe(false)
    expect(verifyHermesIdentityNativeExactFixture({ ...fixture, knownLossiness: ["hermes-identity-source-matrix-partial-fixture"] }).issues.map((item) => item.id)).toContain(
      "hermes-identity-native-exact.lossiness",
    )
    expect(verifyHermesIdentityNativeExactFixture({ ...fixture, cases: [{ ...fixture.cases[0]!, output: { sessionIDIsUUID4: false } }, ...fixture.cases.slice(1)] }).issues.map((item) => item.id)).toContain(
      "hermes-identity-native-exact.cases",
    )
  })

  it("promotes Hermes identity atoms to native factory descriptors in the assembly contract", () => {
    const contract = buildAssemblyContract({
      product: "hermes-agent",
      generatedAt: "2026-06-13T00:00:00.000Z",
    })
    const verification = verifyAssemblyContract(contract)

    expect(verification.ok).toBe(true)
    for (const atomID of hermesIdentityNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom).toMatchObject({
        id: atomID,
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([hermesIdentityNativeExactEvidenceRef, hermesIdentityNativeExactReplayRef]),
        fixtureIDs: [hermesIdentityNativeExactFixtureID],
        knownLossiness: [],
        source: {
          packageDir: "adapters-hermes",
          exportPath: "./product-schema/identity",
        },
      })
      expect(atom?.nativeEvidenceRefs).not.toContain("conformance:hermes-identity-source-matrix")
      expect(atom?.fixtureIDs).not.toContain("hermes-identity:source-matrix")
    }
  })
})
