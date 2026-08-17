import { describe, expect, it } from "vitest"
import {
  buildNanobotConfigNativeExactFixture,
  dumpNanobotConfigForSave,
  getNanobotConfigPath,
  getNanobotDataDir,
  getNanobotRuntimeSubdir,
  getNanobotWorkspacePath,
  loadNanobotConfigData,
  migrateNanobotConfigData,
  nanobotConfigNativeDescriptors,
  nanobotConfigNativeExactAtomIDs,
  nanobotConfigNativeExactEvidenceRef,
  nanobotConfigNativeExactFixtureID,
  nanobotConfigNativeExactReplayRef,
  nanobotConfigPrecedenceNativeExactAtomID,
  nanobotConfigSourceNativeExactAtomID,
  nanobotConfigUpstreamRef,
  nanobotConfigValidatorNativeExactAtomID,
  resolveNanobotConfigEnvVars,
  resolveNanobotModelPreset,
  validateNanobotConfigStructure,
  verifyNanobotConfigNativeExactFixture,
} from "@helix/lego-config/product-schema/nanobot"
import { buildAssemblyContract } from "@helix/recipes"

describe("Nanobot config native exact conformance", () => {
  it("matches upstream config path and runtime directory behavior", () => {
    expect(getNanobotConfigPath({ homeDir: "/home/nano" })).toBe("/home/nano/.nanobot/config.json")
    expect(getNanobotConfigPath({ homeDir: "/home/nano", currentConfigPath: "/tmp/bots/one/config.json" })).toBe("/tmp/bots/one/config.json")
    expect(getNanobotDataDir({ homeDir: "/home/nano", currentConfigPath: "/tmp/bots/one/config.json" })).toBe("/tmp/bots/one")
    expect(getNanobotRuntimeSubdir({ homeDir: "/home/nano", currentConfigPath: "/tmp/bots/one/config.json", name: "logs" })).toBe("/tmp/bots/one/logs")
    expect(getNanobotWorkspacePath({ homeDir: "/home/nano" })).toBe("/home/nano/.nanobot/workspace")
    expect(getNanobotWorkspacePath({ homeDir: "/home/nano", workspace: "~/work" })).toBe("/home/nano/work")
  })

  it("matches upstream load defaults, legacy migrations, and validation fallback", () => {
    const loaded = loadNanobotConfigData({
      rawConfig: {
        agents: {
          defaults: {
            maxTokens: 1234,
            memoryWindow: 42,
          },
        },
        tools: {
          exec: {
            restrictToWorkspace: true,
          },
          myEnabled: false,
          mySet: true,
        },
        channels: {
          qq: {
            msgFormat: "plain",
          },
        },
      },
    })

    expect(loaded.agents).toMatchObject({
      defaults: {
        model: "anthropic/claude-opus-4-5",
        provider: "auto",
        max_tokens: 1234,
        context_window_tokens: 65_536,
        max_messages: 120,
      },
    })
    expect((loaded.agents as Record<string, any>).defaults).not.toHaveProperty("memoryWindow")
    expect(loaded.tools).toMatchObject({
      restrict_to_workspace: true,
      exec: expect.not.objectContaining({ restrictToWorkspace: true }),
      my: {
        enable: false,
        allow_set: true,
      },
    })
    expect(loaded.channels).toMatchObject({
      qq: {
        msgFormat: "plain",
      },
    })

    expect(loadNanobotConfigData({ configFileExists: false }).agents).toMatchObject({
      defaults: { model: "anthropic/claude-opus-4-5" },
    })
    expect(loadNanobotConfigData({ parseError: true, rawConfig: { agents: { defaults: { model: "ignored" } } } }).agents).toMatchObject({
      defaults: { model: "anthropic/claude-opus-4-5" },
    })
    expect(loadNanobotConfigData({ rawConfig: { modelPresets: { default: { model: "reserved" } } } }).model_presets).toEqual({})

    expect(migrateNanobotConfigData({
      tools: {
        myEnabled: false,
        mySet: false,
        my: { enable: true, allowSet: true },
      },
    })).toEqual({
      tools: {
        my: { enable: true, allowSet: true },
      },
    })
  })

  it("matches upstream explicit env reference resolution semantics", () => {
    const raw = loadNanobotConfigData({
      rawConfig: {
        agents: { defaults: { dream: { cron: "5 11 * * *" } } },
        providers: {
          groq: {
            apiKey: "${TEST_API_KEY}",
            apiBase: "https://${HOST}/v1",
          },
        },
      },
    })

    expect((raw.providers as Record<string, any>).groq.api_key).toBe("${TEST_API_KEY}")
    const resolved = resolveNanobotConfigEnvVars(raw, { TEST_API_KEY: "resolved-key", HOST: "example.com" }) as Record<string, any>
    expect(resolved.providers.groq.api_key).toBe("resolved-key")
    expect(resolved.providers.groq.api_base).toBe("https://example.com/v1")
    expect(resolved.agents.defaults.dream.cron).toBe("5 11 * * *")
    expect(() => resolveNanobotConfigEnvVars("${DOES_NOT_EXIST}", {})).toThrow("Environment variable 'DOES_NOT_EXIST' referenced in config is not set")
  })

  it("matches upstream model preset validation, resolution, and save dump policy", () => {
    const config = loadNanobotConfigData({
      rawConfig: {
        modelPresets: {
          fast: {
            model: "openai/gpt-4.1",
            provider: "openai",
            maxTokens: 4096,
            contextWindowTokens: 32_768,
            temperature: 0.5,
            reasoningEffort: "low",
          },
        },
        agents: {
          defaults: {
            modelPreset: "fast",
            fallbackModels: ["fast"],
          },
        },
      },
    })

    expect(resolveNanobotModelPreset(config)).toMatchObject({
      model: "openai/gpt-4.1",
      provider: "openai",
      max_tokens: 4096,
      context_window_tokens: 32_768,
      temperature: 0.5,
      reasoning_effort: "low",
    })
    expect(resolveNanobotModelPreset(config, "default")).toMatchObject({
      model: "anthropic/claude-opus-4-5",
      provider: "auto",
    })
    expect(() => resolveNanobotModelPreset(config, "missing")).toThrow("model_preset 'missing' not found in model_presets")

    expect(validateNanobotConfigStructure({ modelPresets: { default: { model: "custom-model" } } })).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "model_presets.default", message: expect.stringContaining("reserved") }),
    ]))
    expect(validateNanobotConfigStructure({
      agents: { defaults: { modelPreset: "unknown", fallbackModels: ["ghost"], consolidationRatio: 0.01 } },
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "agents.defaults.model_preset" }),
      expect.objectContaining({ path: "agents.defaults.fallback_models.0" }),
      expect.objectContaining({ path: "agents.defaults.consolidation_ratio" }),
    ]))

    const dumped = dumpNanobotConfigForSave({
      agents: { defaults: { dream: { cron: "0 */4 * * *", intervalH: 5 } } },
      providers: { openaiCodex: { apiKey: "oauth-secret" }, groq: { apiKey: "${GROQ_API_KEY}" } },
      tools: { my: { allowSet: true } },
    })
    expect((dumped.agents as Record<string, any>).defaults.dream.intervalH).toBe(5)
    expect((dumped.agents as Record<string, any>).defaults.dream).not.toHaveProperty("cron")
    expect((dumped.providers as Record<string, any>).groq.apiKey).toBe("${GROQ_API_KEY}")
    expect(dumped.providers).not.toHaveProperty("openaiCodex")
    expect((dumped.tools as Record<string, any>).my.allowSet).toBe(true)
  })

  it("publishes native descriptors and verifies the config fixture", () => {
    const fixture = buildNanobotConfigNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "nanobot",
      atomIDs: [
        nanobotConfigSourceNativeExactAtomID,
        nanobotConfigPrecedenceNativeExactAtomID,
        nanobotConfigValidatorNativeExactAtomID,
      ],
      portIDs: ["config.source", "config.merge-strategy", "config.validator"],
      upstreamRef: nanobotConfigUpstreamRef,
      evidenceRef: nanobotConfigNativeExactEvidenceRef,
      fixtureID: nanobotConfigNativeExactFixtureID,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: [nanobotConfigNativeExactEvidenceRef, nanobotConfigNativeExactReplayRef],
      fixtureIDs: [nanobotConfigNativeExactFixtureID],
      knownLossiness: [],
      descriptors: nanobotConfigNativeDescriptors.map((descriptor) => ({ ...descriptor })),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("nanobot/config/loader.py#set_config_path"),
      expect.stringContaining("nanobot/config/paths.py#get_config_path"),
      expect.stringContaining("nanobot/config/schema.py#Base"),
      expect.stringContaining("tests/config/test_env_interpolation.py"),
      expect.stringContaining("tests/config/test_model_presets.py"),
    ]))
    expect(fixture.cases.map((testCase) => testCase.scenarioID)).toEqual([
      "config-path-and-defaults",
      "load-migration-and-validation-fallback",
      "env-ref-resolution-preserves-excluded-fields",
      "model-preset-validation-and-resolution",
      "save-dump-alias-and-exclude-policy",
    ])
    expect(verifyNanobotConfigNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyNanobotConfigNativeExactFixture({ ...fixture, fingerprint: "0000000000000000" }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "fingerprint" }),
    ]))
    expect(verifyNanobotConfigNativeExactFixture({ ...fixture, knownLossiness: ["native-parity-not-proven"] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "lossiness" }),
    ]))
    expect(verifyNanobotConfigNativeExactFixture({ ...fixture, sourceRefs: [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "source-refs" }),
    ]))
  })

  it("selects the Nanobot config atoms as native exact assembly providers", () => {
    const contract = buildAssemblyContract({
      product: "nanobot",
      includeNativeFixtures: true,
      generatedAt: "2026-06-13T00:00:00.000Z",
    })

    for (const atomID of nanobotConfigNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom, atomID).toMatchObject({
        productScope: "product",
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          nanobotConfigNativeExactEvidenceRef,
          nanobotConfigNativeExactReplayRef,
          "upstream:https://github.com/HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        ]),
        fixtureIDs: [nanobotConfigNativeExactFixtureID],
        knownLossiness: [],
        source: {
          packageName: "@helix/lego-config",
          exportPath: "./product-schema/nanobot",
          specifier: "@helix/lego-config/product-schema/nanobot",
        },
      })
    }
  })
})
