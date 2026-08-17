import { mkdirSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  buildPiMonoConfigNativeExactFixture,
  buildPiMonoConfigPathSet,
  collectPiMonoAncestorAgentsSkillDirs,
  createPiMonoConfigValueResolver,
  loadPiMonoSettingsContent,
  mergePiMonoSettings,
  mergePiMonoSettingsLayers,
  migratePiMonoSettings,
  orderPiMonoConfigResources,
  piMonoConfigNativeDescriptors,
  piMonoConfigNativeExactAtomIDs,
  piMonoConfigNativeExactEvidenceRef,
  piMonoConfigNativeExactFixtureID,
  piMonoConfigNativeExactReplayRef,
  piMonoConfigPrecedenceNativeExactAtomID,
  piMonoConfigSourceNativeExactAtomID,
  piMonoConfigUpstreamRef,
  piMonoConfigValidatorNativeExactAtomID,
  planPiMonoConfigSelectorLifecycle,
  rankPiMonoConfigResourcePrecedence,
  verifyPiMonoConfigNativeExactFixture,
  type PiMonoConfigResolvedResource,
} from "@helix/lego-config/product-schema/pi"
import { buildAssemblyContract } from "@helix/recipes"

describe("Pi config native exact conformance", () => {
  it("matches upstream config path and settings storage semantics", () => {
    const paths = buildPiMonoConfigPathSet({
      cwd: "/repo/app",
      home: "/home/alice",
      env: {
        PI_CODING_AGENT_DIR: "~/custom-agent",
        PI_CODING_AGENT_SESSION_DIR: "/ignored/session-dir",
      },
      gistID: "abc123",
    })

    expect(paths).toMatchObject({
      appName: "pi",
      appTitle: "π",
      configDirName: ".pi",
      envAgentDirName: "PI_CODING_AGENT_DIR",
      envSessionDirName: "PI_CODING_AGENT_SESSION_DIR",
      agentDir: "/home/alice/custom-agent",
      settingsPath: "/home/alice/custom-agent/settings.json",
      sessionsDir: "/home/alice/custom-agent/sessions",
      debugLogPath: "/home/alice/custom-agent/pi-debug.log",
      projectBaseDir: "/repo/app/.pi",
      projectSettingsPath: "/repo/app/.pi/settings.json",
      settingsStoragePaths: {
        globalSettingsPath: "/home/alice/custom-agent/settings.json",
        projectSettingsPath: "/repo/app/.pi/settings.json",
      },
      shareViewerUrl: "https://pi.dev/session/#abc123",
    })
    expect(paths.resourceDirectories.project.extensions).toBe("/repo/app/.pi/extensions")
    expect(paths.resourceDirectories.user.extensions).toBe("/home/alice/custom-agent/extensions")

    const root = mkdtempSync(join(tmpdir(), "pi-config-native-"))
    try {
      const repo = join(root, "repo")
      const nested = join(repo, "packages", "app")
      mkdirSync(join(repo, ".git"), { recursive: true })
      mkdirSync(nested, { recursive: true })
      expect(collectPiMonoAncestorAgentsSkillDirs(nested)).toEqual([
        join(nested, ".agents", "skills"),
        join(repo, "packages", ".agents", "skills"),
        join(repo, ".agents", "skills"),
      ])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it("matches upstream settings migration, load, and merge semantics", () => {
    const migrated = migratePiMonoSettings({
      queueMode: "all",
      websockets: true,
      skills: {
        enableSkillCommands: false,
        customDirectories: ["/repo/skills"],
      },
      retry: {
        maxDelayMs: 120000,
        provider: {
          timeoutMs: 1000,
        },
      },
    })
    expect(migrated).toEqual({
      steeringMode: "all",
      transport: "websocket",
      enableSkillCommands: false,
      skills: ["/repo/skills"],
      retry: {
        provider: {
          timeoutMs: 1000,
          maxRetryDelayMs: 120000,
        },
      },
    })

    expect(loadPiMonoSettingsContent(undefined)).toEqual({ settings: {} })
    expect(loadPiMonoSettingsContent("{not-json").error).toBeTruthy()

    expect(mergePiMonoSettings(
      {
        theme: "dark",
        terminal: { showImages: true, imageWidthCells: 80 },
        extensions: ["global.ts"],
      },
      {
        theme: "light",
        terminal: { showImages: false },
        extensions: ["project.ts"],
        defaultModel: undefined,
      },
    )).toEqual({
      theme: "light",
      terminal: { showImages: false, imageWidthCells: 80 },
      extensions: ["project.ts"],
    })

    expect(mergePiMonoSettingsLayers({
      globalSettings: { theme: "dark", websockets: false },
      projectSettings: { queueMode: "one-at-a-time", theme: "light" },
      overrides: { theme: "override" },
    })).toMatchObject({
      theme: "override",
      transport: "sse",
      steeringMode: "one-at-a-time",
    })
  })

  it("matches upstream resource precedence and canonical first-wins de-dupe", () => {
    const entries: PiMonoConfigResolvedResource[] = [
      resource("/pkg/ext.ts", "package", "user"),
      resource("/user/auto.ts", "top-level", "user", "auto"),
      resource("/project/auto.ts", "top-level", "project", "auto"),
      resource("/user/local.ts", "top-level", "user", "local"),
      resource("/project/local.ts", "top-level", "project", "local"),
      resource("/user/duplicate.ts", "top-level", "user", "local"),
      resource("/project/duplicate.ts", "top-level", "project", "local"),
    ]

    expect([
      rankPiMonoConfigResourcePrecedence(resource("/project/local.ts", "top-level", "project", "local").metadata),
      rankPiMonoConfigResourcePrecedence(resource("/project/auto.ts", "top-level", "project", "auto").metadata),
      rankPiMonoConfigResourcePrecedence(resource("/user/local.ts", "top-level", "user", "local").metadata),
      rankPiMonoConfigResourcePrecedence(resource("/user/auto.ts", "top-level", "user", "auto").metadata),
      rankPiMonoConfigResourcePrecedence(resource("/pkg/ext.ts", "package", "user").metadata),
    ]).toEqual([0, 1, 2, 3, 4])

    const ordered = orderPiMonoConfigResources(entries, (path) => path.endsWith("duplicate.ts") ? "/canonical/duplicate.ts" : path)
    expect(ordered.map((entry) => entry.path)).toEqual([
      "/project/local.ts",
      "/project/duplicate.ts",
      "/project/auto.ts",
      "/user/local.ts",
      "/user/auto.ts",
      "/pkg/ext.ts",
    ])
  })

  it("matches upstream dynamic config value and header resolution semantics", () => {
    let commandCalls = 0
    const resolver = createPiMonoConfigValueResolver({
      env: {
        PI_API_KEY: "env-secret",
        EMPTY_VALUE: "",
        PI_HEADER: "header-secret",
      },
      execute(command) {
        commandCalls += 1
        if (command === "secret") return "command-secret\n"
        if (command === "empty") return "\n"
        return undefined
      },
    })

    expect(resolver.resolveConfigValue("PI_API_KEY")).toBe("env-secret")
    expect(resolver.resolveConfigValue("literal-secret")).toBe("literal-secret")
    expect(resolver.resolveConfigValue("EMPTY_VALUE")).toBe("EMPTY_VALUE")
    expect(resolver.resolveConfigValue("!secret")).toBe("command-secret")
    expect(resolver.resolveConfigValue("!secret")).toBe("command-secret")
    expect(commandCalls).toBe(1)
    expect(resolver.resolveConfigValueUncached("!secret")).toBe("command-secret")
    expect(commandCalls).toBe(2)

    expect(resolver.resolveHeaders({
      "x-env": "PI_HEADER",
      "x-literal": "literal-header",
      "x-empty": "!empty",
    })).toEqual({
      "x-env": "header-secret",
      "x-literal": "literal-header",
    })
    expect(() => resolver.resolveHeadersOrThrow({ "x-fail": "!missing-command" }, "provider")).toThrow(
      "Failed to resolve provider header \"x-fail\" from shell command: missing-command",
    )

    const winResolver = createPiMonoConfigValueResolver({
      platform: "win32",
      execute: () => "default-shell",
      executeWithConfiguredShell: () => ({ executed: false, value: undefined }),
    })
    expect(winResolver.resolveConfigValue("!fallback")).toBe("default-shell")
  })

  it("publishes native descriptors and verifies the config fixture", () => {
    const fixture = buildPiMonoConfigNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "pi-mono",
      atomIDs: [
        piMonoConfigSourceNativeExactAtomID,
        piMonoConfigPrecedenceNativeExactAtomID,
        piMonoConfigValidatorNativeExactAtomID,
      ],
      portIDs: ["config.source", "config.merge-strategy", "config.validator"],
      upstreamRef: piMonoConfigUpstreamRef,
      evidenceRef: piMonoConfigNativeExactEvidenceRef,
      fixtureID: piMonoConfigNativeExactFixtureID,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: [piMonoConfigNativeExactEvidenceRef, piMonoConfigNativeExactReplayRef],
      fixtureIDs: [piMonoConfigNativeExactFixtureID],
      knownLossiness: [],
      descriptors: piMonoConfigNativeDescriptors.map((descriptor) => ({ ...descriptor })),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("config.ts#APP_NAME,CONFIG_DIR_NAME"),
      expect.stringContaining("settings-manager.ts#FileSettingsStorage"),
      expect.stringContaining("package-manager.ts#DefaultPackageManager.resolve"),
      expect.stringContaining("resolve-config-value.ts#resolveConfigValue"),
      expect.stringContaining("config-selector.ts#selectConfig"),
    ]))
    expect(fixture.cases.map((testCase) => testCase.scenarioID)).toEqual([
      "agent-dir-and-config-paths",
      "settings-storage-project-global-paths",
      "settings-merge-and-migrations",
      "resource-directory-precedence",
      "dynamic-config-value-resolution",
      "header-resolution-and-errors",
      "config-selector-lifecycle",
    ])
    expect(planPiMonoConfigSelectorLifecycle()).toMatchObject({
      steps: expect.arrayContaining(["initTheme(settingsManager.getTheme(), true)", "ui.start()"]),
      close: ["ui.stop()", "stopThemeWatcher()", "resolve once"],
      quit: ["ui.stop()", "stopThemeWatcher()", "process.exit(0)"],
    })
    expect(verifyPiMonoConfigNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    expect(verifyPiMonoConfigNativeExactFixture({ ...fixture, fingerprint: "0000000000000000" }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-config-native-exact.fingerprint" }),
    ]))
    expect(verifyPiMonoConfigNativeExactFixture({ ...fixture, knownLossiness: ["native-parity-not-proven"] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-config-native-exact.lossiness" }),
    ]))
    expect(verifyPiMonoConfigNativeExactFixture({ ...fixture, sourceRefs: [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-config-native-exact.upstream" }),
    ]))
  })

  it("selects the Pi config atoms as native exact assembly providers", () => {
    const contract = buildAssemblyContract({
      product: "pi-mono",
      includeNativeFixtures: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    })

    for (const atomID of piMonoConfigNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom, atomID).toMatchObject({
        productScope: "product",
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          piMonoConfigNativeExactEvidenceRef,
          piMonoConfigNativeExactReplayRef,
          "upstream:https://github.com/earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        ]),
        fixtureIDs: [piMonoConfigNativeExactFixtureID],
        knownLossiness: [],
        source: {
          packageName: "@helix/lego-config",
          exportPath: "./product-schema/pi",
          specifier: "@helix/lego-config/product-schema/pi",
        },
      })
    }
  })
})

function resource(
  path: string,
  origin: "package" | "top-level",
  scope: "project" | "user",
  source = origin === "package" ? "package" : "local",
): PiMonoConfigResolvedResource {
  return {
    path,
    enabled: true,
    metadata: {
      source,
      scope,
      origin,
    },
  }
}
