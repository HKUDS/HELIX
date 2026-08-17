import { describe, expect, it } from "vitest"
import {
  buildPiMonoIdentityClockNativeExactFixture,
  buildPiMonoIdentityIDGeneratorNativeExactFixture,
  buildPiMonoIdentityWorkspaceResolverNativeExactFixture,
  createPiIdentityClockFormatAtom,
  createPiIdentityIDGeneratorAtom,
  createPiIdentityWorkspaceResolverAtom,
  formatPiIdentityClockTimestamp,
  piMonoIdentityClockNativeDescriptor,
  piMonoIdentityClockNativeExactEvidenceRef,
  piMonoIdentityClockNativeExactFixtureID,
  piMonoIdentityIDGeneratorNativeDescriptor,
  piMonoIdentityIDGeneratorNativeExactEvidenceRef,
  piMonoIdentityIDGeneratorNativeExactFixtureID,
  piMonoIdentityWorkspaceResolverNativeDescriptor,
  piMonoIdentityWorkspaceResolverNativeExactEvidenceRef,
  piMonoIdentityWorkspaceResolverNativeExactFixtureID,
  verifyPiMonoIdentityClockNativeExactFixture,
  verifyPiMonoIdentityIDGeneratorNativeExactFixture,
  verifyPiMonoIdentityWorkspaceResolverNativeExactFixture,
} from "@helix/adapters-pi/product-schema/pi"

describe("Pi identity clock native exact fixture", () => {
  it("proves Pi timestamp formatting as upstream Date#toISOString behavior", () => {
    const clock = createPiIdentityClockFormatAtom({
      now: () => new Date("2026-06-12T00:00:00.007Z"),
    })
    const fixture = buildPiMonoIdentityClockNativeExactFixture()
    const verification = verifyPiMonoIdentityClockNativeExactFixture(fixture)

    expect(clock.timestamp()).toBe("2026-06-12T00:00:00.007Z")
    expect(clock.now()).toEqual({ timestamp: "2026-06-12T00:00:00.007Z" })
    expect(clock.timestamp({ now: 1767225599999 })).toBe("2025-12-31T23:59:59.999Z")
    expect(formatPiIdentityClockTimestamp("1970-01-01T00:00:00.000Z")).toBe("1970-01-01T00:00:00.000Z")
    expect(fixture).toMatchObject({
      product: "pi-mono",
      atomID: "pi.identity.clock-format",
      portID: "identity.clock",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      evidenceRef: piMonoIdentityClockNativeExactEvidenceRef,
      fixtureID: piMonoIdentityClockNativeExactFixtureID,
      knownLossiness: [],
      policy: {
        timestampsUseDateToISOString: true,
        serializedTimestampsAreUTCISOString: true,
        timestampPrecisionIsMilliseconds: true,
        jsonlSessionHeaderUsesStringTimestamp: true,
        jsonlSessionEntriesUseStringTimestamp: true,
        noLocaleOrTimezoneFormatting: true,
      },
    })
    expect(fixture.cases.map((item) => item.output)).toEqual([
      "1970-01-01T00:00:00.000Z",
      "2026-06-12T00:00:00.007Z",
      "2025-12-31T23:59:59.999Z",
    ])
    expect(fixture.sourceRefs).toEqual(
      expect.arrayContaining([
        expect.stringContaining("repo-utils.ts#createTimestamp"),
        expect.stringContaining("jsonl-storage.ts#JsonlSessionStorage.create"),
        expect.stringContaining("session-manager.ts#newSession"),
      ]),
    )
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(piMonoIdentityClockNativeDescriptor).toMatchObject({
      id: "pi.identity.clock-format",
      implementationKind: "factory",
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([piMonoIdentityClockNativeExactEvidenceRef, "identity-clock-native-exact:pi-mono"]),
      fixtureIDs: [piMonoIdentityClockNativeExactFixtureID],
      knownLossiness: [],
    })
  })

  it("rejects drift away from the native exact timestamp fixture", () => {
    const fixture = buildPiMonoIdentityClockNativeExactFixture()

    expect(verifyPiMonoIdentityClockNativeExactFixture({ ...fixture, fingerprint: "bad" }).ok).toBe(false)
    expect(verifyPiMonoIdentityClockNativeExactFixture({ ...fixture, knownLossiness: ["locale-timezone-not-proven"] }).issues.map((item) => item.id)).toContain(
      "pi-identity-clock-native-exact.lossiness",
    )
    expect(verifyPiMonoIdentityClockNativeExactFixture({ ...fixture, cases: [{ ...fixture.cases[0]!, output: "06/12/2026" }, ...fixture.cases.slice(1)] }).issues.map((item) => item.id)).toContain(
      "pi-identity-clock-native-exact.cases",
    )
  })
})

describe("Pi identity id generator native exact fixture", () => {
  it("proves Pi UUIDv7 session and entry ID behavior", () => {
    const generator = createPiIdentityIDGeneratorAtom({
      now: () => 0,
      randomBytes: () => new Uint8Array(16),
    })
    const fixture = buildPiMonoIdentityIDGeneratorNativeExactFixture()
    const verification = verifyPiMonoIdentityIDGeneratorNativeExactFixture(fixture)
    const collisionCase = fixture.cases.find((item) => item.scenarioID === "entry-id-full-uuidv7-after-short-collisions")

    expect(generator.sessionID({ timestamp: 0 })).toBe("00000000-0000-7000-8000-000000000000")
    expect(generator.entryID({ timestamp: 0 })).toBe("00000000")
    expect(fixture).toMatchObject({
      product: "pi-mono",
      atomID: "pi.identity.id-generator",
      portID: "identity.id-generator",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      evidenceRef: piMonoIdentityIDGeneratorNativeExactEvidenceRef,
      fixtureID: piMonoIdentityIDGeneratorNativeExactFixtureID,
      knownLossiness: [],
      policy: {
        sessionIDsUseUUIDV7: true,
        entryIDsUseFirstEightUUIDV7Chars: true,
        entryIDsRetryShortIDCollisionsOneHundredTimes: true,
        entryIDsFallBackToFullUUIDV7AfterCollisions: true,
        uuidV7EmbedsUnixMilliseconds: true,
        uuidV7SetsVersionAndVariantBits: true,
      },
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "session-id-full-uuidv7",
      "entry-id-short-uuidv7-prefix",
      "entry-id-full-uuidv7-after-short-collisions",
    ])
    expect(fixture.cases[0]?.output).toBe("00000000-0000-7000-8000-000000000000")
    expect(fixture.cases[1]?.output).toBe("00000000")
    expect(collisionCase?.output).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(fixture.sourceRefs).toEqual(
      expect.arrayContaining([
        expect.stringContaining("repo-utils.ts#createSessionId"),
        expect.stringContaining("jsonl-storage.ts#generateEntryId"),
        expect.stringContaining("uuid.ts#fillRandomBytes,uuidv7,formatUuid"),
      ]),
    )
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(piMonoIdentityIDGeneratorNativeDescriptor).toMatchObject({
      id: "pi.identity.id-generator",
      implementationKind: "factory",
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([piMonoIdentityIDGeneratorNativeExactEvidenceRef, "identity-id-generator-native-exact:pi-mono"]),
      fixtureIDs: [piMonoIdentityIDGeneratorNativeExactFixtureID],
      knownLossiness: [],
    })
  })

  it("rejects drift away from the native exact ID fixture", () => {
    const fixture = buildPiMonoIdentityIDGeneratorNativeExactFixture()

    expect(verifyPiMonoIdentityIDGeneratorNativeExactFixture({ ...fixture, fingerprint: "bad" }).ok).toBe(false)
    expect(verifyPiMonoIdentityIDGeneratorNativeExactFixture({ ...fixture, knownLossiness: ["random-id-format-not-proven"] }).issues.map((item) => item.id)).toContain(
      "pi-identity-id-generator-native-exact.lossiness",
    )
    expect(verifyPiMonoIdentityIDGeneratorNativeExactFixture({ ...fixture, cases: [{ ...fixture.cases[0]!, output: "not-a-uuid" }, ...fixture.cases.slice(1)] }).issues.map((item) => item.id)).toContain(
      "pi-identity-id-generator-native-exact.cases",
    )
  })
})

describe("Pi identity workspace resolver native exact fixture", () => {
  it("proves Pi cwd, session dir, session header, and missing cwd guard behavior", () => {
    const resolver = createPiIdentityWorkspaceResolverAtom({
      baseDir: "/workspace",
      agentDir: "/home/pi/.pi/agent",
      cwdExists: (path) => path !== "/missing/project",
    })
    const fixture = buildPiMonoIdentityWorkspaceResolverNativeExactFixture()
    const verification = verifyPiMonoIdentityWorkspaceResolverNativeExactFixture(fixture)

    expect(resolver.cwd({ cwd: "project/app" })).toBe("/workspace/project/app")
    expect(resolver.encodedCwd({ cwd: "project/app" })).toBe("--workspace-project-app--")
    expect(resolver.sessionDir({ cwd: "project/app" })).toBe("/home/pi/.pi/agent/sessions/--workspace-project-app--")
    expect(resolver.sessionHeader({ cwd: "/workspace/project", sessionID: "pi-session-fixture", timestamp: "2026-06-12T00:00:00.000Z" })).toEqual({
      type: "session",
      version: 3,
      id: "pi-session-fixture",
      timestamp: "2026-06-12T00:00:00.000Z",
      cwd: "/workspace/project",
    })
    expect(resolver.openCwd({ sessionHeaderCwd: "/workspace/project", fallbackCwd: "/fallback" })).toBe("/workspace/project")
    expect(resolver.openCwd({ cwdOverride: "/override/project", sessionHeaderCwd: "/workspace/project" })).toBe("/override/project")
    expect(resolver.missingSessionCwdIssue({
      sessionFile: "/sessions/missing.jsonl",
      sessionHeaderCwd: "/missing/project",
      fallbackCwd: "/workspace/current",
    })).toEqual({
      sessionFile: "/sessions/missing.jsonl",
      sessionCwd: "/missing/project",
      fallbackCwd: "/workspace/current",
    })
    expect(fixture).toMatchObject({
      product: "pi-mono",
      atomID: "pi.identity.workspace-resolver",
      portID: "identity.workspace-resolver",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      evidenceRef: piMonoIdentityWorkspaceResolverNativeExactEvidenceRef,
      fixtureID: piMonoIdentityWorkspaceResolverNativeExactFixtureID,
      knownLossiness: [],
      policy: {
        runtimeCwdUsesProcessCwd: true,
        cwdResolutionUsesResolvePath: true,
        defaultSessionDirUsesAgentDirSessions: true,
        sessionDirsEncodeCwdWithDashWrappedPath: true,
        sessionHeadersPersistCwd: true,
        openSessionUsesHeaderCwdUnlessOverride: true,
        missingSessionCwdGuardRequiresExistingPath: true,
      },
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "default-session-dir-encodes-resolved-cwd",
      "session-header-persists-resolved-cwd",
      "open-session-prefers-header-cwd",
      "open-session-cwd-override-wins",
      "missing-session-cwd-issue",
    ])
    expect(fixture.sourceRefs).toEqual(
      expect.arrayContaining([
        expect.stringContaining("utils/paths.ts#normalizePath,resolvePath"),
        expect.stringContaining("session-manager.ts#getDefaultSessionDir"),
        expect.stringContaining("session-cwd.ts#getMissingSessionCwdIssue"),
        expect.stringContaining("jsonl-repo.ts#encodeCwd"),
        expect.stringContaining("jsonl-storage.ts#SessionHeader"),
      ]),
    )
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(piMonoIdentityWorkspaceResolverNativeDescriptor).toMatchObject({
      id: "pi.identity.workspace-resolver",
      implementationKind: "factory",
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([piMonoIdentityWorkspaceResolverNativeExactEvidenceRef, "identity-workspace-resolver-native-exact:pi-mono"]),
      fixtureIDs: [piMonoIdentityWorkspaceResolverNativeExactFixtureID],
      knownLossiness: [],
    })
  })

  it("rejects drift away from the native exact workspace resolver fixture", () => {
    const fixture = buildPiMonoIdentityWorkspaceResolverNativeExactFixture()

    expect(verifyPiMonoIdentityWorkspaceResolverNativeExactFixture({ ...fixture, fingerprint: "bad" }).ok).toBe(false)
    expect(verifyPiMonoIdentityWorkspaceResolverNativeExactFixture({ ...fixture, knownLossiness: ["workspace-path-not-proven"] }).issues.map((item) => item.id)).toContain(
      "pi-identity-workspace-resolver-native-exact.lossiness",
    )
    expect(verifyPiMonoIdentityWorkspaceResolverNativeExactFixture({ ...fixture, cases: fixture.cases.slice(0, -1) }).issues.map((item) => item.id)).toContain(
      "pi-identity-workspace-resolver-native-exact.cases",
    )
  })
})
