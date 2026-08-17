import { describe, expect, it } from "vitest"
import {
  buildNanobotIdentityNativeExactFixture,
  createNanobotIdentityClockAtom,
  createNanobotIdentityIDGeneratorAtom,
  createNanobotIdentityWorkspaceResolverAtom,
  formatNanobotIdentityCurrentTimeString,
  formatNanobotIdentityISODateTime,
  nanobotIdentityNativeDescriptors,
  nanobotIdentityNativeExactAtomIDs,
  nanobotIdentityNativeExactEvidenceRef,
  nanobotIdentityNativeExactFixtureID,
  nanobotIdentityNativeExactReplayRef,
  nanobotIsDefaultWorkspace,
  nanobotSafeFilename,
  nanobotSessionSafeKey,
  nanobotWorkspacePath,
  verifyNanobotIdentityNativeExactFixture,
} from "@helix/adapters-nanobot/product-schema/identity"
import { buildAssemblyContract, verifyAssemblyContract } from "@helix/recipes"

describe("Nanobot identity native exact fixture", () => {
  it("proves Nanobot session key, clock, and workspace identity behavior from pinned upstream sources", () => {
    const ids = createNanobotIdentityIDGeneratorAtom()
    const clock = createNanobotIdentityClockAtom()
    const workspace = createNanobotIdentityWorkspaceResolverAtom()
    const fixture = buildNanobotIdentityNativeExactFixture()
    const verification = verifyNanobotIdentityNativeExactFixture(fixture)

    expect(ids.sessionKey({ channel: "websocket", chatID: "room:alpha/unsafe" })).toBe("websocket:room:alpha/unsafe")
    expect(ids.safeKey({ key: "websocket:room:alpha/unsafe" })).toBe("websocket_room_alpha_unsafe")
    expect(ids.sessionPath({ workspace: "/home/nano/.nanobot/workspace", key: "websocket:room:alpha/unsafe" })).toBe("/home/nano/.nanobot/workspace/sessions/websocket_room_alpha_unsafe.jsonl")
    expect(nanobotSessionSafeKey("cli:local<demo>?*")).toBe("cli_local_demo___")
    expect(nanobotSafeFilename("  bad/path:name  ")).toBe("bad_path_name")

    expect(clock.timestamp({ year: 2026, month: 6, day: 13, hour: 12, minute: 10, second: 42, microsecond: 949000 })).toBe("2026-06-13T12:10:42.949000")
    expect(formatNanobotIdentityISODateTime({ year: 2026, month: 6, day: 13, hour: 12, minute: 10 })).toBe("2026-06-13T12:10:00")
    expect(clock.currentTimeString({ year: 2026, month: 6, day: 13, hour: 20, minute: 10, timezoneName: "Asia/Shanghai", offsetMinutes: 480 })).toBe("2026-06-13 20:10 (Saturday) (Asia/Shanghai, UTC+08:00)")
    expect(formatNanobotIdentityCurrentTimeString({ year: 1970, month: 1, day: 1, hour: 0, minute: 0, timezoneName: "UTC", offsetMinutes: 0 })).toBe("1970-01-01 00:00 (Thursday) (UTC, UTC+00:00)")

    expect(workspace.configPath({ homeDir: "/home/nano" })).toBe("/home/nano/.nanobot/config.json")
    expect(workspace.dataDir({ configPath: "/tmp/nanobot/config.json" })).toBe("/tmp/nanobot")
    expect(workspace.runtimeSubdir({ configPath: "/tmp/nanobot/config.json", name: "logs" })).toBe("/tmp/nanobot/logs")
    expect(workspace.workspacePath({ homeDir: "/home/nano" })).toBe("/home/nano/.nanobot/workspace")
    expect(workspace.workspacePath({ workspace: "~/work/project", homeDir: "/home/nano" })).toBe("/home/nano/work/project")
    expect(workspace.isDefaultWorkspace({ homeDir: "/home/nano", baseDir: "/srv/nanobot" })).toBe(true)
    expect(workspace.isDefaultWorkspace({ workspace: "~/work/project", homeDir: "/home/nano", baseDir: "/srv/nanobot" })).toBe(false)
    expect(nanobotWorkspacePath(undefined, "/home/nano")).toBe("/home/nano/.nanobot/workspace")
    expect(nanobotIsDefaultWorkspace(".nanobot/workspace", "/srv", "/srv")).toBe(true)

    expect(fixture).toMatchObject({
      product: "nanobot",
      atomIDs: [...nanobotIdentityNativeExactAtomIDs],
      portIDs: ["identity.clock", "identity.id-generator", "identity.workspace-resolver"],
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      evidenceRef: nanobotIdentityNativeExactEvidenceRef,
      fixtureID: nanobotIdentityNativeExactFixtureID,
      knownLossiness: [],
      policy: {
        sessionIdentityUsesChannelChatKey: true,
        safeSessionFilenamesReplaceColonThenUnsafePathChars: true,
        sessionFilesLiveUnderWorkspaceSessions: true,
        messageTimestampsUsePythonDatetimeIsoformat: true,
        runtimeClockUsesTimezoneNameAndUTCOffset: true,
        defaultWorkspaceUsesHomeNanobotWorkspace: true,
      },
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "session-key-safe-filename-and-path",
      "message-and-session-clock-isoformat",
      "timezone-runtime-context-clock",
      "default-workspace-and-runtime-paths",
      "custom-workspace-default-comparison",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("nanobot/session/manager.py#Session.key"),
      expect.stringContaining("nanobot/config/paths.py#get_config_path"),
      expect.stringContaining("nanobot/utils/helpers.py#ensure_dir,timestamp,current_time_str,safe_filename"),
    ]))
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(nanobotIdentityNativeDescriptors).toHaveLength(3)
    for (const descriptor of nanobotIdentityNativeDescriptors) {
      expect(descriptor).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([nanobotIdentityNativeExactEvidenceRef, nanobotIdentityNativeExactReplayRef]),
        fixtureIDs: [nanobotIdentityNativeExactFixtureID],
        knownLossiness: [],
      })
    }
  })

  it("rejects drift away from Nanobot native identity behavior", () => {
    const fixture = buildNanobotIdentityNativeExactFixture()

    expect(verifyNanobotIdentityNativeExactFixture({ ...fixture, fingerprint: "bad" }).ok).toBe(false)
    expect(verifyNanobotIdentityNativeExactFixture({ ...fixture, knownLossiness: ["nanobot-identity-source-matrix-partial-fixture"] }).issues.map((item) => item.id)).toContain(
      "nanobot-identity-native-exact.lossiness",
    )
    expect(verifyNanobotIdentityNativeExactFixture({ ...fixture, cases: [{ ...fixture.cases[0]!, output: { safeKey: "unsafe/slash" } }, ...fixture.cases.slice(1)] }).issues.map((item) => item.id)).toContain(
      "nanobot-identity-native-exact.cases",
    )
  })

  it("promotes Nanobot identity atoms to native factory descriptors in the assembly contract", () => {
    const contract = buildAssemblyContract({
      product: "nanobot",
      generatedAt: "2026-06-13T00:00:00.000Z",
    })
    const verification = verifyAssemblyContract(contract)

    expect(verification.ok).toBe(true)
    for (const atomID of nanobotIdentityNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom).toMatchObject({
        id: atomID,
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([nanobotIdentityNativeExactEvidenceRef, nanobotIdentityNativeExactReplayRef]),
        fixtureIDs: [nanobotIdentityNativeExactFixtureID],
        knownLossiness: [],
        source: {
          packageDir: "adapters-nanobot",
          exportPath: "./product-schema/identity",
        },
      })
      expect(atom?.nativeEvidenceRefs).not.toContain("conformance:nanobot-identity-source-matrix")
      expect(atom?.fixtureIDs).not.toContain("nanobot-identity:source-matrix")
    }
  })
})
