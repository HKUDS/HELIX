import { describe, expect, it } from "vitest"
import {
  buildHermesConfigNativeExactFixture,
  deepMergeHermesConfig,
  expandHermesEnvVars,
  hermesConfigNativeDescriptors,
  hermesConfigNativeExactAtomIDs,
  hermesConfigNativeExactEvidenceRef,
  hermesConfigNativeExactFixtureID,
  hermesConfigNativeExactReplayRef,
  hermesConfigPrecedenceNativeExactAtomID,
  hermesConfigSourceNativeExactAtomID,
  hermesConfigUpstreamRef,
  hermesConfigValidatorNativeExactAtomID,
  loadHermesConfigData,
  normalizeHermesRootModelKeys,
  readHermesRawConfigData,
  validateHermesConfigStructure,
  verifyHermesConfigNativeExactFixture,
} from "@helix/lego-config/product-schema/hermes"
import { buildAssemblyContract } from "@helix/recipes"

describe("Hermes config native exact conformance", () => {
  it("matches upstream raw config read fallbacks", () => {
    expect(readHermesRawConfigData({ parsedYaml: { model: "openrouter/test" } })).toEqual({ model: "openrouter/test" })
    expect(readHermesRawConfigData({ parsedYaml: "model: openrouter/test" })).toEqual({})
    expect(readHermesRawConfigData({ parsedYaml: ["not", "a", "mapping"] })).toEqual({})
    expect(readHermesRawConfigData({ parsedYaml: { model: "ignored" }, configFileExists: false })).toEqual({})
  })

  it("matches upstream DEFAULT_CONFIG merge and env reference expansion semantics", () => {
    const loaded = loadHermesConfigData({
      rawConfig: {
        agent: {
          gateway_timeout: 42,
        },
        toolsets: ["hermes-cli", "browser"],
        custom_providers: [{
          name: "local",
          base_url: "${HERMES_BASE_URL}",
          api_key: "${HERMES_CUSTOM_KEY}",
          headers: {
            "${KEY_NAME}": "${UNSET_HERMES_KEY}",
          },
        }],
      },
      env: {
        HERMES_BASE_URL: "https://example.com/v1",
        HERMES_CUSTOM_KEY: "secret-key",
      },
    })

    expect(loaded.agent).toMatchObject({
      max_turns: 90,
      gateway_timeout: 42,
      restart_drain_timeout: 180,
      api_max_retries: 3,
    })
    expect(loaded.toolsets).toEqual(["hermes-cli", "browser"])
    expect(loaded.custom_providers).toEqual([{
      name: "local",
      base_url: "https://example.com/v1",
      api_key: "secret-key",
      headers: {
        "${KEY_NAME}": "${UNSET_HERMES_KEY}",
      },
    }])

    expect(deepMergeHermesConfig({ nested: { a: 1, b: 2 }, list: [1] }, { nested: { b: 3 }, list: [2] })).toEqual({
      nested: { a: 1, b: 3 },
      list: [2],
    })
    expect(expandHermesEnvVars(["${KNOWN}", "${MISSING}", 7], { KNOWN: "value" })).toEqual(["value", "${MISSING}", 7])
  })

  it("matches upstream legacy max_turns and root model key normalization", () => {
    const loaded = loadHermesConfigData({
      rawConfig: {
        max_turns: 12,
        provider: "opencode-go",
        base_url: "https://example.com/v1",
        context_length: 128000,
        model: "legacy-model",
      },
    })

    expect(loaded.agent).toMatchObject({ max_turns: 12 })
    expect(loaded.model).toEqual({
      default: "legacy-model",
      provider: "opencode-go",
      base_url: "https://example.com/v1",
      context_length: 128000,
    })
    expect(loaded).not.toHaveProperty("max_turns")
    expect(loaded).not.toHaveProperty("provider")
    expect(loaded).not.toHaveProperty("base_url")
    expect(loaded).not.toHaveProperty("context_length")

    expect(normalizeHermesRootModelKeys({
      provider: "stale-provider",
      model: {
        default: "some-model",
        provider: "correct-provider",
      },
    }).model).toEqual({
      default: "some-model",
      provider: "correct-provider",
    })
  })

  it("matches upstream config structure validation semantics", () => {
    const dictIssues = validateHermesConfigStructure({
      custom_providers: {
        name: "Generativelanguage.googleapis.com",
        base_url: "https://generativelanguage.googleapis.com/v1beta",
        api_key: "xxx",
        fallback_model: {
          provider: "openrouter",
          model: "qwen/qwen3.6-plus:free",
        },
      },
    })

    expect(dictIssues).toEqual(expect.arrayContaining([
      expect.objectContaining({ severity: "error", message: expect.stringContaining("custom_providers is a dict") }),
      expect.objectContaining({ severity: "warning", message: "Root-level keys ['api_key', 'base_url'] look like custom_providers entry fields" }),
      expect.objectContaining({ severity: "error", message: "fallback_model appears inside custom_providers instead of at root level" }),
      expect.objectContaining({ severity: "warning", message: expect.stringContaining("no 'model' section") }),
    ]))

    expect(validateHermesConfigStructure({
      fallback_model: [
        { provider: "openrouter" },
        { model: "claude-sonnet-4-6" },
        "openrouter:anthropic/claude-sonnet-4",
      ],
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({ message: "fallback_model[0] is missing 'model' field" }),
      expect.objectContaining({ message: "fallback_model[1] is missing 'provider' field" }),
      expect.objectContaining({ severity: "error", message: "fallback_model[2] should be a dict, got str" }),
    ]))

    expect(validateHermesConfigStructure({
      custom_providers: [{ name: "gemini", base_url: "https://example.com/v1" }],
      model: { provider: "custom", default: "test" },
      fallback_model: { provider: "openrouter", model: "anthropic/claude-sonnet-4" },
    })).toEqual([])
  })

  it("publishes native descriptors and verifies the config fixture", () => {
    const fixture = buildHermesConfigNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "hermes-agent",
      atomIDs: [
        hermesConfigSourceNativeExactAtomID,
        hermesConfigPrecedenceNativeExactAtomID,
        hermesConfigValidatorNativeExactAtomID,
      ],
      portIDs: ["config.source", "config.merge-strategy", "config.validator"],
      upstreamRef: hermesConfigUpstreamRef,
      evidenceRef: hermesConfigNativeExactEvidenceRef,
      fixtureID: hermesConfigNativeExactFixtureID,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: [hermesConfigNativeExactEvidenceRef, hermesConfigNativeExactReplayRef],
      fixtureIDs: [hermesConfigNativeExactFixtureID],
      knownLossiness: [],
      descriptors: hermesConfigNativeDescriptors.map((descriptor) => ({ ...descriptor })),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("config.py#get_config_path"),
      expect.stringContaining("config.py#DEFAULT_CONFIG"),
      expect.stringContaining("config.py#_deep_merge"),
      expect.stringContaining("config.py#ConfigIssue"),
      expect.stringContaining("test_config_validation.py"),
    ]))
    expect(fixture.cases.map((testCase) => testCase.scenarioID)).toEqual([
      "raw-config-read-fallbacks",
      "load-defaults-user-merge-and-env-expansion",
      "legacy-max-turns-and-root-model-normalization",
      "config-structure-validation",
    ])
    expect(verifyHermesConfigNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyHermesConfigNativeExactFixture({ ...fixture, fingerprint: "0000000000000000" }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "hermes-config-native-exact.fingerprint" }),
    ]))
    expect(verifyHermesConfigNativeExactFixture({ ...fixture, knownLossiness: ["native-parity-not-proven"] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "hermes-config-native-exact.lossiness" }),
    ]))
    expect(verifyHermesConfigNativeExactFixture({ ...fixture, sourceRefs: [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "hermes-config-native-exact.upstream" }),
    ]))
  })

  it("selects the Hermes config atoms as native exact assembly providers", () => {
    const contract = buildAssemblyContract({
      product: "hermes-agent",
      includeNativeFixtures: true,
      generatedAt: "2026-06-13T00:00:00.000Z",
    })

    for (const atomID of hermesConfigNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom, atomID).toMatchObject({
        productScope: "product",
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          hermesConfigNativeExactEvidenceRef,
          hermesConfigNativeExactReplayRef,
          "upstream:https://github.com/NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
        ]),
        fixtureIDs: [hermesConfigNativeExactFixtureID],
        knownLossiness: [],
        source: {
          packageName: "@helix/lego-config",
          exportPath: "./product-schema/hermes",
          specifier: "@helix/lego-config/product-schema/hermes",
        },
      })
    }
  })
})
