import { describe, expect, it } from "vitest"
import {
  buildOpenCodeConfigNativeExactFixture,
  deduplicateOpenCodePluginOrigins,
  loadOpenCodeConfigFromVirtualFiles,
  loadOpenCodeConfigText,
  openCodeConfigNativeDescriptors,
  openCodeConfigNativeExactAtomIDs,
  openCodeConfigNativeExactEvidenceRef,
  openCodeConfigNativeExactFixtureID,
  openCodeConfigNativeExactReplayRef,
  openCodeConfigPrecedenceNativeExactAtomID,
  openCodeConfigSourceNativeExactAtomID,
  openCodeConfigUpstreamRef,
  openCodeConfigValidatorNativeExactAtomID,
  openCodeGlobalConfigMergeFiles,
  openCodeProjectConfigFiles,
  parseOpenCodePluginSpecifier,
  resolveOpenCodePluginSpec,
  validateOpenCodeConfigSchema,
  verifyOpenCodeConfigNativeExactFixture,
  type OpenCodeConfigNativeError,
} from "@helix/lego-config/product-schema/opencode"
import { buildAssemblyContract } from "@helix/recipes"

describe("OpenCode config native exact conformance", () => {
  it("matches upstream global, project, and local .opencode merge/discovery behavior", () => {
    const files = [
      {
        path: "/home/alice/.config/opencode/config.json",
        text: JSON.stringify({
          model: "global/config",
          instructions: ["global.md", "shared.md"],
          plugin: ["global-only@1.0.0", "shared-plugin@1.0.0"],
        }),
      },
      {
        path: "/home/alice/.config/opencode/opencode.json",
        text: JSON.stringify({ model: "global/opencode" }),
      },
      {
        path: "/repo/opencode.json",
        text: JSON.stringify({
          model: "project/model",
          instructions: ["project.md", "shared.md"],
          plugin: ["shared-plugin@2.0.0"],
        }),
      },
      {
        path: "/repo/app/.opencode/opencode.json",
        text: JSON.stringify({
          model: "local/model",
          instructions: ["local.md"],
          plugin: ["local-only@1.0.0"],
        }),
      },
    ]

    expect(openCodeGlobalConfigMergeFiles("/home/alice/.config/opencode")).toEqual([
      "/home/alice/.config/opencode/config.json",
      "/home/alice/.config/opencode/opencode.json",
      "/home/alice/.config/opencode/opencode.jsonc",
    ])
    expect(openCodeProjectConfigFiles({
      directory: "/repo/app",
      worktree: "/repo",
      existingFiles: files.map((file) => file.path),
    })).toEqual(["/repo/opencode.json"])

    const readback = loadOpenCodeConfigFromVirtualFiles({
      globalConfigDir: "/home/alice/.config/opencode",
      home: "/home/alice",
      directory: "/repo/app",
      worktree: "/repo",
      files,
      systemUsername: "ada",
    })

    expect(readback.config.model).toBe("local/model")
    expect(readback.config.instructions).toEqual(["global.md", "shared.md", "project.md", "local.md"])
    expect(readback.config.plugin).toEqual(["global-only@1.0.0", "shared-plugin@2.0.0", "local-only@1.0.0"])
    expect(readback.config.plugin_origins).toEqual([
      expect.objectContaining({ spec: "global-only@1.0.0", scope: "global" }),
      expect.objectContaining({ spec: "shared-plugin@2.0.0", scope: "local" }),
      expect.objectContaining({ spec: "local-only@1.0.0", scope: "local" }),
    ])
    expect(readback.loadedSources).toEqual(expect.arrayContaining([
      "/home/alice/.config/opencode/config.json",
      "/home/alice/.config/opencode/opencode.json",
      "/repo/opencode.json",
      "/repo/app/.opencode/opencode.json",
    ]))
  })

  it("matches upstream JSONC parsing, config token substitution, and top-level validation", () => {
    const loaded = loadOpenCodeConfigText({
      source: "/repo/app/opencode.jsonc",
      text: `{
        // "{file:missing.txt}" stays untouched in a comment
        "username": "{env:USER_NAME}",
        "shell": "{file:secret.txt}",
        "small_model": "{env:MISSING_NAME}",
        "theme": "legacy",
      }`,
      env: { USER_NAME: "ada" },
      files: [{ path: "/repo/app/secret.txt", text: "token-value\n" }],
    })

    expect(loaded).toEqual({
      username: "ada",
      shell: "token-value",
      small_model: "",
    })

    const permission = loadOpenCodeConfigText({
      source: "/repo/app/opencode.json",
      text: JSON.stringify({ permission: { bash: "allow", "*": "deny", edit: "ask" } }),
    })
    expect(Object.keys(permission.permission as Record<string, unknown>)).toEqual(["bash", "*", "edit"])

    try {
      validateOpenCodeConfigSchema({ invalid_field: true }, "test")
      throw new Error("expected validation to fail")
    } catch (error) {
      expect((error as OpenCodeConfigNativeError).data.issues[0]).toMatchObject({
        code: "unrecognized_keys",
        keys: ["invalid_field"],
        path: [],
      })
    }
  })

  it("matches upstream plugin resolution and origin de-duplication behavior", () => {
    const files = [
      { path: "/repo/app/plugin.ts", text: "export default {}" },
      { path: "/repo/app/plugin-dir/package.json", text: "{}" },
      { path: "/repo/app/plugin-index/index.ts", text: "export default {}" },
    ]
    const configFilepath = "/repo/app/opencode.json"

    expect(resolveOpenCodePluginSpec({ plugin: "oh-my-opencode@2.4.3", configFilepath, files })).toBe("oh-my-opencode@2.4.3")
    expect(resolveOpenCodePluginSpec({ plugin: "./plugin.ts", configFilepath, files })).toBe("file:///repo/app/plugin.ts")
    expect(resolveOpenCodePluginSpec({ plugin: "./plugin-dir", configFilepath, files })).toBe("file:///repo/app/plugin-dir")
    expect(resolveOpenCodePluginSpec({ plugin: "./plugin-index", configFilepath, files })).toBe("file:///repo/app/plugin-index/index.ts")
    expect(parseOpenCodePluginSpecifier("@scope/pkg@1.2.3")).toEqual({ pkg: "@scope/pkg", version: "1.2.3" })

    expect(deduplicateOpenCodePluginOrigins([
      { spec: "global-plugin@1.0.0", source: "global", scope: "global" },
      { spec: "shared-plugin@1.0.0", source: "global", scope: "global" },
      { spec: "file:///repo/app/plugin.ts", source: "local", scope: "local" },
      { spec: "shared-plugin@2.0.0", source: "local", scope: "local" },
      { spec: "file:///repo/app/plugin.ts", source: "local-later", scope: "local" },
    ])).toEqual([
      expect.objectContaining({ spec: "global-plugin@1.0.0" }),
      expect.objectContaining({ spec: "shared-plugin@2.0.0" }),
      expect.objectContaining({ spec: "file:///repo/app/plugin.ts", source: "local-later" }),
    ])
  })

  it("matches upstream permission, autoshare, username, and project-disable flag behavior", () => {
    const permissionReadback = loadOpenCodeConfigFromVirtualFiles({
      globalConfigDir: "/home/alice/.config/opencode",
      home: "/home/alice",
      directory: "/repo/app",
      files: [{
        path: "/home/alice/.config/opencode/config.json",
        text: JSON.stringify({
          tools: { write: true, bash: false },
          permission: { bash: "ask" },
          autoshare: true,
        }),
      }],
      opencodePermission: "{invalid",
      systemUsernameThrows: true,
    })

    expect(permissionReadback.config.permission).toEqual({ edit: "allow", bash: "ask" })
    expect(permissionReadback.config.share).toBe("auto")
    expect(permissionReadback.config.username).toBe("user")
    expect(permissionReadback.diagnostics.map((item) => item.code)).toContain("invalid_opencode_permission_ignored")

    const disabledProjectReadback = loadOpenCodeConfigFromVirtualFiles({
      globalConfigDir: "/home/alice/.config/opencode",
      home: "/home/alice",
      directory: "/repo/app",
      worktree: "/repo",
      files: [
        { path: "/repo/app/opencode.json", text: JSON.stringify({ model: "project/model" }) },
        { path: "/tmp/opencode-config-dir/opencode.json", text: JSON.stringify({ model: "configdir/model" }) },
      ],
      configDir: "/tmp/opencode-config-dir",
      disableProjectConfig: true,
      systemUsername: "ada",
    })

    expect(disabledProjectReadback.config.model).toBe("configdir/model")
    expect(disabledProjectReadback.directories).toEqual(["/home/alice/.config/opencode", "/tmp/opencode-config-dir"])
    expect(disabledProjectReadback.loadedSources).not.toContain("/repo/app/opencode.json")
  })

  it("publishes native descriptors and verifies the config fixture", () => {
    const fixture = buildOpenCodeConfigNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomIDs: [
        openCodeConfigSourceNativeExactAtomID,
        openCodeConfigPrecedenceNativeExactAtomID,
        openCodeConfigValidatorNativeExactAtomID,
      ],
      portIDs: ["config.source", "config.merge-strategy", "config.validator"],
      upstreamRef: openCodeConfigUpstreamRef,
      evidenceRef: openCodeConfigNativeExactEvidenceRef,
      fixtureID: openCodeConfigNativeExactFixtureID,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: [openCodeConfigNativeExactEvidenceRef, openCodeConfigNativeExactReplayRef],
      fixtureIDs: [openCodeConfigNativeExactFixtureID],
      knownLossiness: [],
      descriptors: openCodeConfigNativeDescriptors.map((descriptor) => ({ ...descriptor })),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("config.ts#Info"),
      expect.stringContaining("paths.ts#files"),
      expect.stringContaining("parse.ts#jsonc"),
      expect.stringContaining("plugin.ts#Spec"),
      expect.stringContaining("variable.ts#substitute"),
      expect.stringContaining("config.test.ts#"),
    ]))
    expect(fixture.cases.map((testCase) => testCase.scenarioID)).toEqual([
      "global-project-local-merge-and-discovery",
      "jsonc-schema-and-variable-substitution",
      "plugin-resolution-origin-deduplication",
      "permission-tools-share-and-username",
      "project-disable-and-config-dir",
    ])
    expect(verifyOpenCodeConfigNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeConfigNativeExactFixture({ ...fixture, knownLossiness: ["native-parity-not-proven"] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-config-native-exact.lossiness" }),
    ]))
    expect(verifyOpenCodeConfigNativeExactFixture({ ...fixture, sourceRefs: [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-config-native-exact.upstream" }),
    ]))
  })

  it("selects OpenCode config atoms as native exact assembly providers", () => {
    const contract = buildAssemblyContract({
      product: "opencode",
      includeNativeFixtures: true,
      generatedAt: "2026-06-13T00:00:00.000Z",
    })

    for (const atomID of openCodeConfigNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom, atomID).toMatchObject({
        productScope: "product",
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          openCodeConfigNativeExactEvidenceRef,
          openCodeConfigNativeExactReplayRef,
          "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
        ]),
        fixtureIDs: [openCodeConfigNativeExactFixtureID],
        knownLossiness: [],
        source: {
          packageName: "@helix/lego-config",
          exportPath: "./product-schema/opencode",
        },
      })
    }
  })
})
