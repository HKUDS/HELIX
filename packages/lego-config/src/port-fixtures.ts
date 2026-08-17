import { createHash } from "node:crypto"
import { isAbsolute, resolve, sep } from "node:path"
import type { LegoPortContractFixture } from "@helix/contracts"
import { createOpenCodeConfig, createOpenCodeConfigFromFiles } from "./config"
import { createOpenCodeConfigAtoms, stringList, type ConfigLayer, type ConfigValidationIssue } from "./config-atoms"
import {
  openCodeConfigNativeExactEvidenceRef,
  openCodeConfigNativeExactFixtureID,
  openCodeConfigNativeExactReplayRef,
} from "./product-schema/opencode"

export type OpenCodeConfigSourceRefID =
  | "config-skills"
  | "plugin-env"
  | "local-config-native-exact-fixture"
  | "local-config-runtime-projection"
  | "local-config-live-runtime-fixture"

export interface OpenCodeConfigSourceRef {
  id: OpenCodeConfigSourceRefID
  repo: "anomalyco/opencode" | "helix/local"
  ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab" | "current"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-11" | "local-source:2026-06-12" | "local-source:2026-06-15"
}

export type OpenCodeConfigSourceMatrixBranchID =
  | "default-config-shape"
  | "global-project-file-discovery"
  | "plugin-directory-discovery"
  | "env-cli-precedence"
  | "config-validator-product-guard"
  | "live-config-runtime"
  | "plugin-env-side-effects"
  | "exact-config-schema-validation"

export type OpenCodeConfigSourceMatrixBranchStatus = "native-exact" | "partial" | "missing"

export interface OpenCodeConfigSourceMatrixBranchAnchor {
  branchID: OpenCodeConfigSourceMatrixBranchID
  status: OpenCodeConfigSourceMatrixBranchStatus
  sourceRefIDs: OpenCodeConfigSourceRefID[]
  configAtomIDs: string[]
  configPortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface OpenCodeConfigSourceMatrixSnapshot {
  schemaVersion: 1
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  pinnedRepo: "anomalyco/opencode"
  pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-config-source-matrix"
  fixtureID: "opencode-config:source-matrix"
  sourceRefs: OpenCodeConfigSourceRef[]
  branchAnchors: OpenCodeConfigSourceMatrixBranchAnchor[]
  nativeExactBranchIDs: OpenCodeConfigSourceMatrixBranchID[]
  partialBranchIDs: OpenCodeConfigSourceMatrixBranchID[]
  missingBranchIDs: OpenCodeConfigSourceMatrixBranchID[]
  coveredConfigAtomIDs: string[]
  coveredConfigPortIDs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

export type OpenCodeConfigRuntimeProjectionEvent =
  | {
    type: "runtime.config"
    sourceKind: "builtin" | "global" | "project" | "env" | "cli"
    configPath?: string
    keys: string[]
    sequence: number
  }
  | {
    type: "plugin.env"
    pluginID: string
    sourceKind: "global" | "project" | "workspace"
    envKeys: string[]
    sideEffectKeys: string[]
    sequence: number
  }
  | {
    type: "schema.validation"
    schemaID: string
    productGuard: boolean
    requiredPaths: string[]
    invalidKeys: string[]
    diagnosticCodes: string[]
    sequence: number
  }

export interface OpenCodeConfigRuntimeProjection {
  schemaVersion: 1
  fixtureID: "opencode-config:runtime-projection"
  evidenceRef: "conformance:opencode-config-runtime-projection"
  coveredBranchIDs: Array<Extract<OpenCodeConfigSourceMatrixBranchID, "live-config-runtime" | "plugin-env-side-effects" | "exact-config-schema-validation">>
  retainedFields: string[]
  lossyFields: string[]
  runtimeConfigLayers: Array<{ sourceKind: "builtin" | "global" | "project" | "env" | "cli"; configPath: string | null; keys: string[]; sequence: number }>
  pluginEnvSideEffects: Array<{ pluginID: string; sourceKind: "global" | "project" | "workspace"; envKeys: string[]; sideEffectKeys: string[]; sequence: number }>
  schemaValidation: Array<{ schemaID: string; productGuard: boolean; requiredPaths: string[]; invalidKeys: string[]; diagnosticCodes: string[]; sequence: number }>
  knownGaps: string[]
  fingerprint: string
}

export type OpenCodeConfigLiveRuntimeFixtureBranchID =
  | Extract<OpenCodeConfigSourceMatrixBranchID, "live-config-runtime" | "plugin-env-side-effects" | "exact-config-schema-validation">
  | "fallback-default-readback"

export interface OpenCodeConfigLiveRuntimeFixtureInput {
  cwd: string
  home: string
  env?: Record<string, string | undefined>
  cli?: Record<string, unknown>
}

export interface OpenCodeConfigLiveRuntimeFixture {
  schemaVersion: 1
  fixtureID: "opencode-config:live-runtime-fixture"
  evidenceRef: "conformance:opencode-config-live-runtime-fixture"
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  exactDiffStatus: "live-runtime-partial"
  nativeParityClaim: false
  capturedBranchIDs: OpenCodeConfigLiveRuntimeFixtureBranchID[]
  retainedFields: string[]
  lossyFields: string[]
  discoveredConfigPaths: {
    global: string[]
    project: string[]
    pluginDirectories: string[]
  }
  runtimeLayers: Array<{ scope: ConfigLayer["scope"]; name: string; priority: number; keys: string[] }>
  precedenceReadback: {
    product: "opencode" | string | null
    modelID: string | null
    modelProvider: string | null
    sessionStorage: string | null
    pluginEntries: string[]
  }
  validation: {
    ok: boolean
    requiredPaths: string[]
    issueCodes: string[]
    productGuard: boolean
  }
  invalidConfigReadback: {
    ok: boolean
    issueCodes: string[]
  }
  fallbackDefaultReadback: {
    product: "opencode" | string | null
    agents: string[]
    sessionStorage: string | null
    pluginEntries: string[]
  }
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeConfigLiveRuntimeFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeConfigLiveRuntimeFixtureVerification {
  ok: boolean
  issues: OpenCodeConfigLiveRuntimeFixtureIssue[]
}

export type ProductConfigSourceMatrixProduct = "pi-mono" | "nanobot" | "hermes-agent"
export type ProductConfigSourceMatrixBranchStatus = "partial" | "missing"

export interface ProductConfigSourceRef {
  id: string
  product: ProductConfigSourceMatrixProduct
  repo: "earendil-works/pi" | "HKUDS/nanobot" | "NousResearch/hermes-agent"
  ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da" | "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7" | "92a567db2d7a5031df8211efbfdad864c2f51faf"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-11"
}

export interface ProductConfigSourceMatrixBranchAnchor {
  product: ProductConfigSourceMatrixProduct
  branchID: string
  status: ProductConfigSourceMatrixBranchStatus
  sourceRefIDs: string[]
  configAtomIDs: string[]
  configPortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface ProductConfigSourceMatrixSnapshot {
  schemaVersion: 1
  product: ProductConfigSourceMatrixProduct
  upstreamRef: string
  pinnedRepo: ProductConfigSourceRef["repo"]
  pinnedRef: ProductConfigSourceRef["ref"]
  evidenceRef: string
  fixtureID: string
  sourceRefs: ProductConfigSourceRef[]
  branchAnchors: ProductConfigSourceMatrixBranchAnchor[]
  partialBranchIDs: string[]
  missingBranchIDs: string[]
  coveredConfigAtomIDs: string[]
  coveredConfigPortIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

const OPENCODE_CONFIG_SOURCE_REFS: OpenCodeConfigSourceRef[] = [
  {
    id: "config-skills",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/config/skills.ts",
    symbols: ["Info", "ConfigSkills"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "plugin-env",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin/env.ts",
    symbols: ["EnvPlugin"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "local-config-native-exact-fixture",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-config/src/product-schema/opencode.ts",
    symbols: ["buildOpenCodeConfigNativeExactFixture", "verifyOpenCodeConfigNativeExactFixture", "openCodeConfigNativeDescriptors"],
    evidence: "local-source:2026-06-15",
  },
  {
    id: "local-config-runtime-projection",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-config/src/port-fixtures.ts",
    symbols: ["projectOpenCodeConfigRuntimeProjection", "OpenCodeConfigRuntimeProjection"],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-config-live-runtime-fixture",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-config/src/port-fixtures.ts",
    symbols: ["captureOpenCodeConfigLiveRuntimeFixture", "verifyOpenCodeConfigLiveRuntimeFixture"],
    evidence: "local-source:2026-06-12",
  },
]

const PI_CONFIG_SOURCE_REFS: ProductConfigSourceRef[] = [
  {
    id: "pi-config-paths",
    product: "pi-mono",
    repo: "earendil-works/pi",
    ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    path: "packages/coding-agent/src/config.ts",
    symbols: ["CONFIG_DIR_NAME", "getAgentDir", "getSettingsPath", "getToolsDir", "getSessionsDir"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "pi-config-selector",
    product: "pi-mono",
    repo: "earendil-works/pi",
    ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    path: "packages/coding-agent/src/cli/config-selector.ts",
    symbols: ["ConfigSelectorOptions", "selectConfig"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "pi-config-value-resolution",
    product: "pi-mono",
    repo: "earendil-works/pi",
    ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    path: "packages/coding-agent/src/core/resolve-config-value.ts",
    symbols: ["resolveConfigValue", "resolveHeaders", "executeWithConfiguredShell", "clearConfigValueCache"],
    evidence: "github-tree:2026-06-11",
  },
]

const NANOBOT_CONFIG_SOURCE_REFS: ProductConfigSourceRef[] = [
  {
    id: "nanobot-config-loader",
    product: "nanobot",
    repo: "HKUDS/nanobot",
    ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    path: "nanobot/config/loader.py",
    symbols: ["load_config", "save_config", "resolve_config_env_vars", "_migrate_config"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "nanobot-config-paths",
    product: "nanobot",
    repo: "HKUDS/nanobot",
    ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    path: "nanobot/config/paths.py",
    symbols: ["get_config_path", "get_workspace_path", "get_data_dir", "is_default_workspace"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "nanobot-config-schema",
    product: "nanobot",
    repo: "HKUDS/nanobot",
    ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    path: "nanobot/config/schema.py",
    symbols: ["Config", "AgentDefaults", "ProvidersConfig", "_validate_model_preset", "resolve_preset"],
    evidence: "github-tree:2026-06-11",
  },
]

const HERMES_CONFIG_SOURCE_REFS: ProductConfigSourceRef[] = [
  {
    id: "hermes-desktop-config-settings",
    product: "hermes-agent",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    path: "apps/desktop/src/app/settings/config-settings.tsx",
    symbols: ["ConfigField", "ConfigSettings"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "hermes-session-config-hook",
    product: "hermes-agent",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    path: "apps/desktop/src/app/session/hooks/use-hermes-config.ts",
    symbols: ["HermesConfigOptions", "useHermesConfig", "refreshHermesConfig"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "hermes-skills-config",
    product: "hermes-agent",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    path: "hermes_cli/skills_config.py",
    symbols: ["PLATFORMS", "get_disabled_skills", "save_disabled_skills", "skills_command"],
    evidence: "github-tree:2026-06-11",
  },
]

function openCodeConfigSourceBranchAnchor(input: OpenCodeConfigSourceMatrixBranchAnchor): OpenCodeConfigSourceMatrixBranchAnchor {
  return input
}

function productConfigSourceBranchAnchor(input: ProductConfigSourceMatrixBranchAnchor): ProductConfigSourceMatrixBranchAnchor {
  return input
}

export function projectOpenCodeConfigRuntimeProjection(
  events: OpenCodeConfigRuntimeProjectionEvent[],
): OpenCodeConfigRuntimeProjection {
  const runtimeConfigLayers = events
    .filter((event): event is Extract<OpenCodeConfigRuntimeProjectionEvent, { type: "runtime.config" }> => event.type === "runtime.config")
    .map((event) => ({
      sourceKind: event.sourceKind,
      configPath: typeof event.configPath === "string" && event.configPath.length > 0 ? event.configPath : null,
      keys: uniqueStrings(event.keys),
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.sourceKind.localeCompare(right.sourceKind))

  const pluginEnvSideEffects = events
    .filter((event): event is Extract<OpenCodeConfigRuntimeProjectionEvent, { type: "plugin.env" }> => event.type === "plugin.env")
    .map((event) => ({
      pluginID: event.pluginID,
      sourceKind: event.sourceKind,
      envKeys: uniqueStrings(event.envKeys),
      sideEffectKeys: uniqueStrings(event.sideEffectKeys),
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.pluginID.localeCompare(right.pluginID))

  const schemaValidation = events
    .filter((event): event is Extract<OpenCodeConfigRuntimeProjectionEvent, { type: "schema.validation" }> => event.type === "schema.validation")
    .map((event) => ({
      schemaID: event.schemaID,
      productGuard: event.productGuard === true,
      requiredPaths: uniqueStrings(event.requiredPaths),
      invalidKeys: uniqueStrings(event.invalidKeys),
      diagnosticCodes: uniqueStrings(event.diagnosticCodes),
      sequence: event.sequence,
    }))
    .sort((left, right) => left.sequence - right.sequence || left.schemaID.localeCompare(right.schemaID))

  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    fixtureID: "opencode-config:runtime-projection" as const,
    evidenceRef: "conformance:opencode-config-runtime-projection" as const,
    coveredBranchIDs: [
      "live-config-runtime",
      "plugin-env-side-effects",
      "exact-config-schema-validation",
    ] as OpenCodeConfigRuntimeProjection["coveredBranchIDs"],
    retainedFields: [
      "sourceKind",
      "configPath",
      "keys",
      "pluginID",
      "envKeys",
      "sideEffectKeys",
      "schemaID",
      "productGuard",
      "requiredPaths",
      "invalidKeys",
      "diagnosticCodes",
      "sequence",
    ],
    lossyFields: [
      "native config file parser branch identity",
      "live config loader process and cwd side effects",
      "plugin EnvPlugin module evaluation side effects",
      "env and CLI precedence conflict diagnostic ordering",
      "exact config schema validation error object identity",
      "fallback default readback from upstream runtime",
    ],
    runtimeConfigLayers,
    pluginEnvSideEffects,
    schemaValidation,
    knownGaps: [
      "opencode-live-config-runtime-not-spawned",
      "opencode-plugin-env-side-effects-not-replayed",
      "opencode-exact-config-schema-validation-not-proven",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function captureOpenCodeConfigLiveRuntimeFixture(
  input: OpenCodeConfigLiveRuntimeFixtureInput,
): OpenCodeConfigLiveRuntimeFixture {
  const config = createOpenCodeConfigFromFiles(input)
  const merged = config.merge()
  const atoms = createOpenCodeConfigAtoms()
  const validation = atoms.validate(merged.values)
  const invalidValidation = atoms.validate({ ...merged.values, product: "helix" })
  const fallbackDefaults = createOpenCodeConfig({}).merge().values
  const pathInput = { cwd: input.cwd, home: input.home }
  const pluginEntries = stringList(merged.values["plugin"]).map((entry) => normalizeOpenCodeConfigLivePath(entry, pathInput))
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    fixtureID: "opencode-config:live-runtime-fixture" as const,
    evidenceRef: "conformance:opencode-config-live-runtime-fixture" as const,
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    exactDiffStatus: "live-runtime-partial" as const,
    nativeParityClaim: false as const,
    capturedBranchIDs: [
      "live-config-runtime",
      "plugin-env-side-effects",
      "exact-config-schema-validation",
      "fallback-default-readback",
    ] as OpenCodeConfigLiveRuntimeFixtureBranchID[],
    retainedFields: [
      "runtime layer scope/name/priority/key order",
      "normalized config discovery paths",
      "plugin entry source order",
      "env and CLI precedence readback",
      "product guard validation issue path",
      "fallback default readback",
    ],
    lossyFields: [
      "upstream native opencode process startup side effects",
      "plugin module evaluation side effects",
      "exact upstream schema error object identity",
      "upstream fallback default readback through native loader",
    ],
    discoveredConfigPaths: {
      global: [normalizeOpenCodeConfigLivePath(resolve(input.home, ".config", "opencode", "opencode.json"), pathInput)],
      project: [
        normalizeOpenCodeConfigLivePath(resolve(input.cwd, "opencode.json"), pathInput),
        normalizeOpenCodeConfigLivePath(resolve(input.cwd, ".opencode", "opencode.json"), pathInput),
      ],
      pluginDirectories: [
        normalizeOpenCodeConfigLivePath(resolve(input.home, ".config", "opencode", "plugins"), pathInput),
        normalizeOpenCodeConfigLivePath(resolve(input.cwd, ".opencode", "plugins"), pathInput),
      ],
    },
    runtimeLayers: merged.layers.map((layer) => ({
      scope: layer.scope,
      name: layer.name,
      priority: layer.priority,
      keys: configValuePaths(layer.values),
    })),
    precedenceReadback: {
      product: stringOrNull(merged.values["product"]),
      modelID: stringOrNull(config.get("model.id")),
      modelProvider: stringOrNull(config.get("model.provider")),
      sessionStorage: stringOrNull(config.get("session.storage")),
      pluginEntries,
    },
    validation: {
      ok: validation.ok,
      requiredPaths: atoms.profile().requiredPaths,
      issueCodes: validationIssueCodes(validation.issues),
      productGuard: invalidValidation.issues.some((issue) => issue.path === "product"),
    },
    invalidConfigReadback: {
      ok: invalidValidation.ok,
      issueCodes: validationIssueCodes(invalidValidation.issues),
    },
    fallbackDefaultReadback: {
      product: stringOrNull(fallbackDefaults["product"]),
      agents: stringList(fallbackDefaults["agents"]),
      sessionStorage: stringOrNull(readConfigPath(fallbackDefaults, "session.storage")),
      pluginEntries: stringList(fallbackDefaults["plugin"]),
    },
    knownGaps: [
      "opencode-upstream-native-config-runtime-not-spawned",
      "opencode-plugin-env-module-side-effects-not-replayed",
      "opencode-exact-upstream-config-schema-error-object-not-proven",
      "opencode-fallback-default-native-readback-not-proven",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyOpenCodeConfigLiveRuntimeFixture(
  fixture: OpenCodeConfigLiveRuntimeFixture,
): OpenCodeConfigLiveRuntimeFixtureVerification {
  const issues: OpenCodeConfigLiveRuntimeFixtureIssue[] = []
  if (fixture.fixtureID !== "opencode-config:live-runtime-fixture" || fixture.evidenceRef !== "conformance:opencode-config-live-runtime-fixture") {
    issues.push({
      id: "opencode-config-live-runtime-fixture.identity",
      message: "OpenCode config live runtime fixture has an unexpected fixture or evidence ID.",
    })
  }
  if (fixture.exactDiffStatus !== "live-runtime-partial" || fixture.nativeParityClaim !== false) {
    issues.push({
      id: "opencode-config-live-runtime-fixture.native-claim",
      message: "OpenCode config live runtime fixture must remain partial and cannot claim native parity.",
    })
  }
  for (const branchID of ["live-config-runtime", "plugin-env-side-effects", "exact-config-schema-validation", "fallback-default-readback"] as const) {
    if (!fixture.capturedBranchIDs.includes(branchID)) {
      issues.push({
        id: `opencode-config-live-runtime-fixture.missing-${branchID}`,
        message: `OpenCode config live runtime fixture no longer captures ${branchID}.`,
      })
    }
  }
  for (const scope of ["builtin", "global", "project", "env", "cli"] as const) {
    if (!fixture.runtimeLayers.some((layer) => layer.scope === scope)) {
      issues.push({
        id: `opencode-config-live-runtime-fixture.missing-${scope}-layer`,
        message: `OpenCode config live runtime fixture is missing a ${scope} layer.`,
      })
    }
  }
  if (fixture.precedenceReadback.product !== "opencode" || fixture.precedenceReadback.modelID !== "cli-file" || fixture.precedenceReadback.modelProvider !== "project") {
    issues.push({
      id: "opencode-config-live-runtime-fixture.precedence-readback",
      message: "OpenCode config live runtime fixture no longer proves project/env/CLI precedence readback.",
    })
  }
  if (
    !fixture.precedenceReadback.pluginEntries.includes("npm:@global/opencode-plugin") ||
    !fixture.precedenceReadback.pluginEntries.includes("npm:@project/opencode-plugin") ||
    !fixture.precedenceReadback.pluginEntries.includes("<home>/.config/opencode/plugins/global.ts") ||
    !fixture.precedenceReadback.pluginEntries.includes("<cwd>/.opencode/plugins/local.ts")
  ) {
    issues.push({
      id: "opencode-config-live-runtime-fixture.plugin-discovery",
      message: "OpenCode config live runtime fixture no longer captures ordered global/project plugin entries.",
    })
  }
  if (!fixture.validation.ok || !fixture.validation.productGuard || fixture.invalidConfigReadback.ok || !fixture.invalidConfigReadback.issueCodes.includes("config.validation.product")) {
    issues.push({
      id: "opencode-config-live-runtime-fixture.validation",
      message: "OpenCode config live runtime fixture no longer captures product guard validation readback.",
    })
  }
  if (
    fixture.fallbackDefaultReadback.product !== "opencode" ||
    fixture.fallbackDefaultReadback.sessionStorage !== "event-projection" ||
    !fixture.fallbackDefaultReadback.agents.includes("build") ||
    fixture.fallbackDefaultReadback.pluginEntries.length !== 0
  ) {
    issues.push({
      id: "opencode-config-live-runtime-fixture.fallback-default",
      message: "OpenCode config live runtime fixture no longer captures fallback default readback.",
    })
  }
  if (!fixture.knownGaps.includes("opencode-upstream-native-config-runtime-not-spawned") || !fixture.knownGaps.includes("opencode-exact-upstream-config-schema-error-object-not-proven")) {
    issues.push({
      id: "opencode-config-live-runtime-fixture.native-gaps",
      message: "OpenCode config live runtime fixture lost the upstream native exact-diff blockers.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function buildOpenCodeConfigSourceMatrixSnapshot(): OpenCodeConfigSourceMatrixSnapshot {
  const nativeExactConfigEvidenceRefs = [
    openCodeConfigNativeExactEvidenceRef,
    openCodeConfigNativeExactReplayRef,
    openCodeConfigNativeExactFixtureID,
  ]
  const branchAnchors: OpenCodeConfigSourceMatrixBranchAnchor[] = [
    openCodeConfigSourceBranchAnchor({
      branchID: "default-config-shape",
      status: "native-exact",
      sourceRefIDs: ["config-skills", "local-config-native-exact-fixture"],
      configAtomIDs: ["opencode.config.source", "opencode.config.validator"],
      configPortIDs: ["config.source", "config.validator"],
      localEvidenceRefs: ["config:source", "config:validator", ...nativeExactConfigEvidenceRefs],
      localMarkers: ["product:opencode", "agents:build/plan/general", "session.storage:event-projection", "opencode-config-native-exact"],
      knownGaps: [],
    }),
    openCodeConfigSourceBranchAnchor({
      branchID: "global-project-file-discovery",
      status: "native-exact",
      sourceRefIDs: ["config-skills", "local-config-native-exact-fixture"],
      configAtomIDs: ["opencode.config.source"],
      configPortIDs: ["config.source"],
      localEvidenceRefs: ["config:source", "config-prompt-ui:opencode-config-files", ...nativeExactConfigEvidenceRefs],
      localMarkers: ["~/.config/opencode/config.json", "~/.config/opencode/opencode.json", "opencode.json", ".opencode/opencode.json", "opencode-config-native-exact"],
      knownGaps: [],
    }),
    openCodeConfigSourceBranchAnchor({
      branchID: "plugin-directory-discovery",
      status: "native-exact",
      sourceRefIDs: ["config-skills", "local-config-native-exact-fixture"],
      configAtomIDs: ["opencode.config.source"],
      configPortIDs: ["config.source"],
      localEvidenceRefs: ["config-prompt-ui:opencode-config-files", "opencode-hook:source-matrix", ...nativeExactConfigEvidenceRefs],
      localMarkers: ["~/.config/opencode/plugins", ".opencode/plugins", "plugin origin dedupe native", "path plugin target native", "opencode-config-native-exact"],
      knownGaps: [],
    }),
    openCodeConfigSourceBranchAnchor({
      branchID: "env-cli-precedence",
      status: "native-exact",
      sourceRefIDs: ["config-skills", "local-config-native-exact-fixture"],
      configAtomIDs: ["opencode.config.precedence", "opencode.config.source"],
      configPortIDs: ["config.merge-strategy", "config.source"],
      localEvidenceRefs: ["config:merge-strategy", "config:source", ...nativeExactConfigEvidenceRefs],
      localMarkers: ["builtin", "global", "project", "env", "cli", "OPENCODE_", "OPENCODE_CONFIG_DIR", "OPENCODE_CONFIG_CONTENT", "opencode-config-native-exact"],
      knownGaps: [],
    }),
    openCodeConfigSourceBranchAnchor({
      branchID: "config-validator-product-guard",
      status: "native-exact",
      sourceRefIDs: ["config-skills", "local-config-native-exact-fixture"],
      configAtomIDs: ["opencode.config.validator"],
      configPortIDs: ["config.validator"],
      localEvidenceRefs: ["config:validator", ...nativeExactConfigEvidenceRefs],
      localMarkers: ["product guard", "requiredPaths", "ConfigSkills", "top-level unknown-key rejection", "opencode-config-native-exact"],
      knownGaps: [],
    }),
    openCodeConfigSourceBranchAnchor({
      branchID: "live-config-runtime",
      status: "partial",
      sourceRefIDs: ["config-skills", "plugin-env", "local-config-runtime-projection", "local-config-live-runtime-fixture"],
      configAtomIDs: ["opencode.config.source", "opencode.config.precedence", "opencode.config.validator"],
      configPortIDs: ["config.source", "config.merge-strategy", "config.validator"],
      localEvidenceRefs: ["opencode-config:source-matrix", "opencode-config:runtime-projection", "opencode-config:live-runtime-fixture", "conformance:opencode-config-live-runtime-fixture"],
      localMarkers: ["config-runtime:projected", "config-runtime:live-fixture-captured", "source-anchored-partial"],
      knownGaps: ["opencode-upstream-native-config-runtime-not-spawned"],
    }),
    openCodeConfigSourceBranchAnchor({
      branchID: "plugin-env-side-effects",
      status: "partial",
      sourceRefIDs: ["plugin-env", "local-config-runtime-projection", "local-config-live-runtime-fixture"],
      configAtomIDs: ["opencode.config.source", "opencode.config.precedence"],
      configPortIDs: ["config.source", "config.merge-strategy"],
      localEvidenceRefs: ["opencode-config:source-matrix", "opencode-config:runtime-projection", "opencode-config:live-runtime-fixture", "opencode-hook:source-matrix"],
      localMarkers: ["EnvPlugin", "plugin-env:projected", "plugin-discovery:live-fixture-captured", "plugin-module-side-effects:not-replayed"],
      knownGaps: ["opencode-plugin-env-module-side-effects-not-replayed"],
    }),
    openCodeConfigSourceBranchAnchor({
      branchID: "exact-config-schema-validation",
      status: "native-exact",
      sourceRefIDs: ["config-skills", "local-config-native-exact-fixture", "local-config-runtime-projection", "local-config-live-runtime-fixture"],
      configAtomIDs: ["opencode.config.validator"],
      configPortIDs: ["config.validator"],
      localEvidenceRefs: ["opencode-config:source-matrix", "opencode-config:runtime-projection", "opencode-config:live-runtime-fixture", "conformance:opencode-config-live-runtime-fixture", ...nativeExactConfigEvidenceRefs],
      localMarkers: ["schema-validation:projected", "schema-validation:live-product-guard-captured", "jsonc parser native", "top-level extra-key native", "deprecated tui key normalization native"],
      knownGaps: [],
    }),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    pinnedRepo: "anomalyco/opencode" as const,
    pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-config-source-matrix" as const,
    fixtureID: "opencode-config:source-matrix" as const,
    sourceRefs: OPENCODE_CONFIG_SOURCE_REFS,
    branchAnchors,
    nativeExactBranchIDs: branchAnchors.filter((anchor) => anchor.status === "native-exact").map((anchor) => anchor.branchID),
    partialBranchIDs: branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredConfigAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.configAtomIDs)),
    coveredConfigPortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.configPortIDs)),
    nativeEvidenceRefs: uniqueStrings([
      "conformance:opencode-config-source-matrix",
      ...branchAnchors
        .filter((anchor) => anchor.status === "native-exact")
        .flatMap((anchor) => anchor.localEvidenceRefs)
        .filter((ref) => ref === openCodeConfigNativeExactEvidenceRef || ref === openCodeConfigNativeExactReplayRef),
    ]),
    fixtureIDs: uniqueStrings([
      "opencode-config:source-matrix",
      ...branchAnchors
        .filter((anchor) => anchor.status === "native-exact")
        .flatMap((anchor) => anchor.localEvidenceRefs)
        .filter((ref) => ref === openCodeConfigNativeExactFixtureID),
    ]),
    knownGaps: uniqueStrings([
      ...(branchAnchors.some((anchor) => anchor.status === "partial") ? ["opencode-config-source-matrix-covered-by-partial-fixture"] : []),
      ...branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function buildPiMonoConfigSourceMatrixSnapshot(): ProductConfigSourceMatrixSnapshot {
  const branchAnchors: ProductConfigSourceMatrixBranchAnchor[] = [
    productConfigSourceBranchAnchor({
      product: "pi-mono",
      branchID: "default-config-shape",
      status: "partial",
      sourceRefIDs: ["pi-config-paths"],
      configAtomIDs: ["pi.config.source", "pi.config.validator"],
      configPortIDs: ["config.source", "config.validator"],
      localEvidenceRefs: ["config:source", "config:validator"],
      localMarkers: ["product:pi-mono", "session.storage:jsonl-tree", "ui.kind:tui"],
      knownGaps: ["pi-config-defaults-not-full-upstream-schema"],
    }),
    productConfigSourceBranchAnchor({
      product: "pi-mono",
      branchID: "global-project-file-discovery",
      status: "partial",
      sourceRefIDs: ["pi-config-paths", "pi-config-selector"],
      configAtomIDs: ["pi.config.source"],
      configPortIDs: ["config.source"],
      localEvidenceRefs: ["config:source"],
      localMarkers: ["~/.pi/agent/settings.json", "settings.json", ".pi/settings.json"],
      knownGaps: ["pi-config-file-format-branches-not-exhaustive"],
    }),
    productConfigSourceBranchAnchor({
      product: "pi-mono",
      branchID: "extension-directory-discovery",
      status: "partial",
      sourceRefIDs: ["pi-config-paths", "pi-config-selector"],
      configAtomIDs: ["pi.config.source", "pi.config.precedence"],
      configPortIDs: ["config.source", "config.merge-strategy"],
      localEvidenceRefs: ["config:source", "pi-prompt:upstream-source-matrix"],
      localMarkers: ["~/.pi/agent/extensions", ".pi/extensions", "package index"],
      knownGaps: ["pi-extension-runtime-side-effects-not-replayed"],
    }),
    productConfigSourceBranchAnchor({
      product: "pi-mono",
      branchID: "dynamic-config-value-resolution",
      status: "partial",
      sourceRefIDs: ["pi-config-value-resolution"],
      configAtomIDs: ["pi.config.source", "pi.config.precedence", "pi.config.validator"],
      configPortIDs: ["config.source", "config.merge-strategy", "config.validator"],
      localEvidenceRefs: ["config:source", "config:merge-strategy"],
      localMarkers: ["resolveConfigValue", "configured shell", "header resolution"],
      knownGaps: ["pi-dynamic-config-shell-side-effects-not-replayed"],
    }),
    productConfigSourceBranchAnchor({
      product: "pi-mono",
      branchID: "live-config-runtime",
      status: "missing",
      sourceRefIDs: ["pi-config-paths", "pi-config-selector", "pi-config-value-resolution"],
      configAtomIDs: ["pi.config.source", "pi.config.precedence", "pi.config.validator"],
      configPortIDs: ["config.source", "config.merge-strategy", "config.validator"],
      localEvidenceRefs: ["pi-config:source-matrix"],
      localMarkers: ["source-anchored-only", "live-runtime:not-spawned"],
      knownGaps: ["pi-live-config-runtime-not-spawned"],
    }),
    productConfigSourceBranchAnchor({
      product: "pi-mono",
      branchID: "exact-config-schema-validation",
      status: "missing",
      sourceRefIDs: ["pi-config-paths", "pi-config-value-resolution"],
      configAtomIDs: ["pi.config.validator"],
      configPortIDs: ["config.validator"],
      localEvidenceRefs: ["pi-config:source-matrix"],
      localMarkers: ["schema-validation:not-exact", "dynamic-values:partial"],
      knownGaps: ["pi-exact-config-schema-validation-not-proven"],
    }),
  ]
  return buildProductConfigSourceMatrixSnapshot({
    product: "pi-mono",
    pinnedRepo: "earendil-works/pi",
    pinnedRef: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    evidenceRef: "conformance:pi-config-source-matrix",
    fixtureID: "pi-config:source-matrix",
    sourceRefs: PI_CONFIG_SOURCE_REFS,
    branchAnchors,
    knownGapPrefix: "pi-config-source-matrix-covered-by-partial-fixture",
  })
}

export function buildNanobotConfigSourceMatrixSnapshot(): ProductConfigSourceMatrixSnapshot {
  const branchAnchors: ProductConfigSourceMatrixBranchAnchor[] = [
    productConfigSourceBranchAnchor({
      product: "nanobot",
      branchID: "default-config-shape",
      status: "partial",
      sourceRefIDs: ["nanobot-config-schema"],
      configAtomIDs: ["nanobot.config.source", "nanobot.config.validator"],
      configPortIDs: ["config.source", "config.validator"],
      localEvidenceRefs: ["config:source", "config:validator"],
      localMarkers: ["product:nanobot", "agents.defaults", "session.storage:jsonl-sessions"],
      knownGaps: ["nanobot-config-defaults-not-full-upstream-schema"],
    }),
    productConfigSourceBranchAnchor({
      product: "nanobot",
      branchID: "global-project-file-discovery",
      status: "partial",
      sourceRefIDs: ["nanobot-config-loader", "nanobot-config-paths"],
      configAtomIDs: ["nanobot.config.source"],
      configPortIDs: ["config.source"],
      localEvidenceRefs: ["config:source"],
      localMarkers: ["~/.nanobot/config.json", ".nanobot/config.json", "nanobot.config.json"],
      knownGaps: ["nanobot-config-file-format-branches-not-exhaustive"],
    }),
    productConfigSourceBranchAnchor({
      product: "nanobot",
      branchID: "env-ref-resolution",
      status: "partial",
      sourceRefIDs: ["nanobot-config-loader"],
      configAtomIDs: ["nanobot.config.source", "nanobot.config.precedence"],
      configPortIDs: ["config.source", "config.merge-strategy"],
      localEvidenceRefs: ["config:source", "config:merge-strategy"],
      localMarkers: ["resolve_config_env_vars", "${NANOBOT_PROVIDER}", "${NANOBOT_MODEL}"],
      knownGaps: ["nanobot-env-ref-resolution-side-effects-not-replayed"],
    }),
    productConfigSourceBranchAnchor({
      product: "nanobot",
      branchID: "provider-preset-validation",
      status: "partial",
      sourceRefIDs: ["nanobot-config-schema"],
      configAtomIDs: ["nanobot.config.validator"],
      configPortIDs: ["config.validator"],
      localEvidenceRefs: ["config:validator", "nanobot-provider:source-matrix"],
      localMarkers: ["resolve_preset", "_validate_model_preset", "ProviderConfig"],
      knownGaps: ["nanobot-pydantic-validation-not-exact"],
    }),
    productConfigSourceBranchAnchor({
      product: "nanobot",
      branchID: "live-config-runtime",
      status: "missing",
      sourceRefIDs: ["nanobot-config-loader", "nanobot-config-paths", "nanobot-config-schema"],
      configAtomIDs: ["nanobot.config.source", "nanobot.config.precedence", "nanobot.config.validator"],
      configPortIDs: ["config.source", "config.merge-strategy", "config.validator"],
      localEvidenceRefs: ["nanobot-config:source-matrix"],
      localMarkers: ["source-anchored-only", "live-runtime:not-spawned"],
      knownGaps: ["nanobot-live-config-runtime-not-spawned"],
    }),
    productConfigSourceBranchAnchor({
      product: "nanobot",
      branchID: "migration-save-side-effects",
      status: "missing",
      sourceRefIDs: ["nanobot-config-loader"],
      configAtomIDs: ["nanobot.config.source", "nanobot.config.precedence"],
      configPortIDs: ["config.source", "config.merge-strategy"],
      localEvidenceRefs: ["nanobot-config:source-matrix"],
      localMarkers: ["_migrate_config", "save_config", "filesystem-side-effects:not-replayed"],
      knownGaps: ["nanobot-config-migration-save-side-effects-not-replayed"],
    }),
  ]
  return buildProductConfigSourceMatrixSnapshot({
    product: "nanobot",
    pinnedRepo: "HKUDS/nanobot",
    pinnedRef: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    evidenceRef: "conformance:nanobot-config-source-matrix",
    fixtureID: "nanobot-config:source-matrix",
    sourceRefs: NANOBOT_CONFIG_SOURCE_REFS,
    branchAnchors,
    knownGapPrefix: "nanobot-config-source-matrix-covered-by-partial-fixture",
  })
}

export function buildHermesAgentConfigSourceMatrixSnapshot(): ProductConfigSourceMatrixSnapshot {
  const branchAnchors: ProductConfigSourceMatrixBranchAnchor[] = [
    productConfigSourceBranchAnchor({
      product: "hermes-agent",
      branchID: "desktop-config-settings",
      status: "partial",
      sourceRefIDs: ["hermes-desktop-config-settings", "hermes-session-config-hook"],
      configAtomIDs: ["hermes.config.source", "hermes.config.validator"],
      configPortIDs: ["config.source", "config.validator"],
      localEvidenceRefs: ["config:source", "config:validator"],
      localMarkers: ["ConfigSettings", "HermesConfigOptions", "recordingLimit"],
      knownGaps: ["hermes-desktop-config-react-side-effects-not-replayed"],
    }),
    productConfigSourceBranchAnchor({
      product: "hermes-agent",
      branchID: "skills-platform-config",
      status: "partial",
      sourceRefIDs: ["hermes-skills-config"],
      configAtomIDs: ["hermes.config.source", "hermes.config.precedence"],
      configPortIDs: ["config.source", "config.merge-strategy"],
      localEvidenceRefs: ["config:source", "hermes-prompt:upstream-registry-source-matrix"],
      localMarkers: ["PLATFORMS", "get_disabled_skills", "save_disabled_skills"],
      knownGaps: ["hermes-skills-config-side-effects-not-replayed"],
    }),
    productConfigSourceBranchAnchor({
      product: "hermes-agent",
      branchID: "env-cli-precedence",
      status: "partial",
      sourceRefIDs: ["hermes-session-config-hook", "hermes-skills-config"],
      configAtomIDs: ["hermes.config.source", "hermes.config.precedence"],
      configPortIDs: ["config.source", "config.merge-strategy"],
      localEvidenceRefs: ["config:source", "config:merge-strategy"],
      localMarkers: ["HERMES_", "~/.hermes/config.yaml", "hermes.config.json"],
      knownGaps: ["hermes-cli-desktop-precedence-not-exact"],
    }),
    productConfigSourceBranchAnchor({
      product: "hermes-agent",
      branchID: "live-cli-config-runtime",
      status: "missing",
      sourceRefIDs: ["hermes-desktop-config-settings", "hermes-session-config-hook", "hermes-skills-config"],
      configAtomIDs: ["hermes.config.source", "hermes.config.precedence", "hermes.config.validator"],
      configPortIDs: ["config.source", "config.merge-strategy", "config.validator"],
      localEvidenceRefs: ["hermes-config:source-matrix"],
      localMarkers: ["source-anchored-only", "live-runtime:not-spawned"],
      knownGaps: ["hermes-live-cli-config-runtime-not-spawned"],
    }),
    productConfigSourceBranchAnchor({
      product: "hermes-agent",
      branchID: "exact-config-schema-validation",
      status: "missing",
      sourceRefIDs: ["hermes-desktop-config-settings", "hermes-session-config-hook"],
      configAtomIDs: ["hermes.config.validator"],
      configPortIDs: ["config.validator"],
      localEvidenceRefs: ["hermes-config:source-matrix"],
      localMarkers: ["schema-validation:not-exact", "desktop-options:partial"],
      knownGaps: ["hermes-exact-config-schema-validation-not-proven"],
    }),
  ]
  return buildProductConfigSourceMatrixSnapshot({
    product: "hermes-agent",
    pinnedRepo: "NousResearch/hermes-agent",
    pinnedRef: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    evidenceRef: "conformance:hermes-config-source-matrix",
    fixtureID: "hermes-config:source-matrix",
    sourceRefs: HERMES_CONFIG_SOURCE_REFS,
    branchAnchors,
    knownGapPrefix: "hermes-config-source-matrix-covered-by-partial-fixture",
  })
}

function buildProductConfigSourceMatrixSnapshot(input: {
  product: ProductConfigSourceMatrixProduct
  pinnedRepo: ProductConfigSourceRef["repo"]
  pinnedRef: ProductConfigSourceRef["ref"]
  evidenceRef: string
  fixtureID: string
  sourceRefs: ProductConfigSourceRef[]
  branchAnchors: ProductConfigSourceMatrixBranchAnchor[]
  knownGapPrefix: string
}): ProductConfigSourceMatrixSnapshot {
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: input.product,
    upstreamRef: `upstream:${input.pinnedRepo}@${input.pinnedRef}`,
    pinnedRepo: input.pinnedRepo,
    pinnedRef: input.pinnedRef,
    evidenceRef: input.evidenceRef,
    fixtureID: input.fixtureID,
    sourceRefs: input.sourceRefs,
    branchAnchors: input.branchAnchors,
    partialBranchIDs: input.branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: input.branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredConfigAtomIDs: uniqueStrings(input.branchAnchors.flatMap((anchor) => anchor.configAtomIDs)),
    coveredConfigPortIDs: uniqueStrings(input.branchAnchors.flatMap((anchor) => anchor.configPortIDs)),
    knownGaps: uniqueStrings([input.knownGapPrefix, ...input.branchAnchors.flatMap((anchor) => anchor.knownGaps)]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export type ConfigDiscoveryPrecedenceGateProduct = "opencode" | ProductConfigSourceMatrixProduct
export type ConfigDiscoveryPrecedenceGateDimension = "discovery-path" | "merge-order" | "default-value" | "validation" | "product-override"

export interface ConfigDiscoveryPrecedenceGateCase {
  product: ConfigDiscoveryPrecedenceGateProduct
  upstreamRef: OpenCodeConfigSourceMatrixSnapshot["upstreamRef"] | string
  evidenceRef: OpenCodeConfigSourceMatrixSnapshot["evidenceRef"] | string
  fixtureID: OpenCodeConfigSourceMatrixSnapshot["fixtureID"] | string
  exactDiffStatus: "source-matrix-partial" | "native-exact"
  coverageStatus: "partial" | "native"
  nativeParityClaim: boolean
  discoveryPath: string[]
  mergeOrder: string[]
  defaultValue: string[]
  validation: string[]
  productOverride: string[]
  sourceAnchors: string[]
  configAtomIDs: string[]
  configPortIDs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  configRisk: "source-anchored-partial" | "native-exact" | "helix-only"
  knownLossiness: string[]
}

export interface ConfigDiscoveryPrecedenceGateSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:config-discovery-precedence-gate"
  fixtureID: "config:discovery-precedence-gate"
  products: ConfigDiscoveryPrecedenceGateProduct[]
  comparisonDimensions: ConfigDiscoveryPrecedenceGateDimension[]
  cases: ConfigDiscoveryPrecedenceGateCase[]
  fingerprint: string
}

export interface ConfigDiscoveryPrecedenceGateIssue {
  id: string
  product: ConfigDiscoveryPrecedenceGateProduct
  dimension: ConfigDiscoveryPrecedenceGateDimension
  message: string
}

export interface ConfigDiscoveryPrecedenceGateVerification {
  ok: boolean
  issues: ConfigDiscoveryPrecedenceGateIssue[]
}

export function buildConfigDiscoveryPrecedenceGateSnapshot(): ConfigDiscoveryPrecedenceGateSnapshot {
  const cases = [
    buildOpenCodeConfigDiscoveryPrecedenceGateCase(buildOpenCodeConfigSourceMatrixSnapshot()),
    buildProductConfigDiscoveryPrecedenceGateCase(buildPiMonoConfigSourceMatrixSnapshot()),
    buildProductConfigDiscoveryPrecedenceGateCase(buildNanobotConfigSourceMatrixSnapshot()),
    buildProductConfigDiscoveryPrecedenceGateCase(buildHermesAgentConfigSourceMatrixSnapshot()),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:config-discovery-precedence-gate" as const,
    fixtureID: "config:discovery-precedence-gate" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: ["discovery-path", "merge-order", "default-value", "validation", "product-override"] as ConfigDiscoveryPrecedenceGateDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyConfigDiscoveryPrecedenceGateSnapshot(snapshot: ConfigDiscoveryPrecedenceGateSnapshot): ConfigDiscoveryPrecedenceGateVerification {
  const issues: ConfigDiscoveryPrecedenceGateIssue[] = []
  const products: ConfigDiscoveryPrecedenceGateProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "config-discovery-precedence.missing-product",
        product,
        dimension: "discovery-path",
        message: `Missing config discovery precedence gate case for ${product}.`,
      })
      continue
    }
    if (!configGateContains(item.discoveryPath, /config|settings|directory|path|file|plugin|extension|desktop/i)) {
      issues.push({
        id: "config-discovery-precedence.discovery-path",
        product,
        dimension: "discovery-path",
        message: `${product} config gate no longer records discovery path anchors.`,
      })
    }
    if (!configGateContains(item.mergeOrder, /builtin|global|project|env|cli|precedence|dynamic|desktop/i)) {
      issues.push({
        id: "config-discovery-precedence.merge-order",
        product,
        dimension: "merge-order",
        message: `${product} config gate no longer records merge order anchors.`,
      })
    }
    if (!configGateContains(item.defaultValue, /default|product:|agents|session|ui|recording/i)) {
      issues.push({
        id: "config-discovery-precedence.default-value",
        product,
        dimension: "default-value",
        message: `${product} config gate no longer records default value anchors.`,
      })
    }
    if (!configGateContains(item.validation, /validator|schema|validate|guard|preset|Config/i)) {
      issues.push({
        id: "config-discovery-precedence.validation",
        product,
        dimension: "validation",
        message: `${product} config gate no longer records validation anchors.`,
      })
    }
    if (!configGateContains(item.productOverride, /product:|env|cli|override|selector|preset|platform|dynamic|shell|header|extension|HERMES_|OPENCODE_|NANOBOT_/i)) {
      issues.push({
        id: "config-discovery-precedence.product-override",
        product,
        dimension: "product-override",
        message: `${product} config gate no longer records product override anchors.`,
      })
    }
    if (product === "opencode") {
      if (
        item.exactDiffStatus !== "native-exact" ||
        item.coverageStatus !== "native" ||
        item.nativeParityClaim !== true ||
        item.configRisk !== "native-exact" ||
        !item.nativeEvidenceRefs.includes(openCodeConfigNativeExactEvidenceRef) ||
        !item.nativeEvidenceRefs.includes(openCodeConfigNativeExactReplayRef) ||
        !item.fixtureIDs.includes(openCodeConfigNativeExactFixtureID) ||
        item.knownLossiness.length > 0
      ) {
        issues.push({
          id: "config-discovery-precedence.native-exact-evidence",
          product,
          dimension: "merge-order",
          message: `${product} config discovery precedence gate no longer exposes native-exact evidence cleanly.`,
        })
      }
    } else if (
      item.exactDiffStatus !== "source-matrix-partial" ||
      item.coverageStatus !== "partial" ||
      item.nativeParityClaim !== false ||
      item.configRisk !== "source-anchored-partial"
    ) {
      issues.push({
        id: "config-discovery-precedence.helix-only-config",
        product,
        dimension: "merge-order",
        message: `${product} config gate is Helix-only and cannot be promoted toward native parity.`,
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildOpenCodeConfigDiscoveryPrecedenceGateCase(snapshot: OpenCodeConfigSourceMatrixSnapshot): ConfigDiscoveryPrecedenceGateCase {
  return {
    product: "opencode",
    upstreamRef: snapshot.upstreamRef,
    evidenceRef: snapshot.evidenceRef,
    fixtureID: openCodeConfigNativeExactFixtureID,
    exactDiffStatus: "native-exact",
    coverageStatus: "native",
    nativeParityClaim: true,
    discoveryPath: configBranchMarkers(snapshot.branchAnchors, ["global-project-file-discovery", "plugin-directory-discovery", "live-config-runtime"]),
    mergeOrder: configBranchMarkers(snapshot.branchAnchors, ["env-cli-precedence", "plugin-env-side-effects"]),
    defaultValue: configBranchMarkers(snapshot.branchAnchors, ["default-config-shape"]),
    validation: configBranchMarkers(snapshot.branchAnchors, ["config-validator-product-guard", "exact-config-schema-validation"]),
    productOverride: configBranchMarkers(snapshot.branchAnchors, ["env-cli-precedence", "plugin-directory-discovery", "config-validator-product-guard"]),
    sourceAnchors: snapshot.sourceRefs.map((sourceRef) => `${sourceRef.id}:${sourceRef.path}`),
    configAtomIDs: snapshot.coveredConfigAtomIDs,
    configPortIDs: snapshot.coveredConfigPortIDs,
    nativeEvidenceRefs: uniqueStrings([snapshot.evidenceRef, openCodeConfigNativeExactEvidenceRef, openCodeConfigNativeExactReplayRef]),
    fixtureIDs: uniqueStrings([snapshot.fixtureID, openCodeConfigNativeExactFixtureID]),
    configRisk: "native-exact",
    knownLossiness: [],
  }
}

function buildProductConfigDiscoveryPrecedenceGateCase(snapshot: ProductConfigSourceMatrixSnapshot): ConfigDiscoveryPrecedenceGateCase {
  return {
    product: snapshot.product,
    upstreamRef: snapshot.upstreamRef,
    evidenceRef: snapshot.evidenceRef,
    fixtureID: snapshot.fixtureID,
    exactDiffStatus: "source-matrix-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    discoveryPath: configBranchMarkers(snapshot.branchAnchors, ["global-project-file-discovery", "extension-directory-discovery", "desktop-config-settings", "skills-platform-config", "live-config-runtime", "live-cli-config-runtime"]),
    mergeOrder: configBranchMarkers(snapshot.branchAnchors, ["env-cli-precedence", "dynamic-config-value-resolution", "env-ref-resolution", "skills-platform-config"]),
    defaultValue: configBranchMarkers(snapshot.branchAnchors, ["default-config-shape", "desktop-config-settings"]),
    validation: configBranchMarkers(snapshot.branchAnchors, ["provider-preset-validation", "desktop-config-settings", "exact-config-schema-validation"]),
    productOverride: configBranchMarkers(snapshot.branchAnchors, ["dynamic-config-value-resolution", "env-ref-resolution", "provider-preset-validation", "env-cli-precedence", "skills-platform-config"]),
    sourceAnchors: snapshot.sourceRefs.map((sourceRef) => `${sourceRef.id}:${sourceRef.path}`),
    configAtomIDs: snapshot.coveredConfigAtomIDs,
    configPortIDs: snapshot.coveredConfigPortIDs,
    nativeEvidenceRefs: [snapshot.evidenceRef],
    fixtureIDs: [snapshot.fixtureID],
    configRisk: "source-anchored-partial",
    knownLossiness: snapshot.knownGaps,
  }
}

function configBranchMarkers<TAnchor extends { branchID: string; localMarkers: string[]; knownGaps: string[] }>(anchors: TAnchor[], branchIDs: string[]): string[] {
  const selected = anchors.filter((anchor) => branchIDs.includes(anchor.branchID))
  return uniqueStrings(selected.flatMap((anchor) => [anchor.branchID, ...anchor.localMarkers, ...anchor.knownGaps]))
}

function configGateContains(values: string[], pattern: RegExp): boolean {
  return values.some((value) => pattern.test(value))
}

export type ConfigRuntimeValidationBlockerGateProduct = ConfigDiscoveryPrecedenceGateProduct
export type ConfigRuntimeValidationBlockerGateDimension = "live-runtime" | "side-effects" | "schema-validation" | "invalid-config" | "fallback-default"

export interface ConfigRuntimeValidationBlockerGateCase {
  product: ConfigRuntimeValidationBlockerGateProduct
  upstreamRef: OpenCodeConfigSourceMatrixSnapshot["upstreamRef"] | string
  evidenceRef: OpenCodeConfigSourceMatrixSnapshot["evidenceRef"] | string
  fixtureID: OpenCodeConfigSourceMatrixSnapshot["fixtureID"] | string
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  liveRuntime: string[]
  sideEffects: string[]
  schemaValidation: string[]
  invalidConfig: string[]
  fallbackDefault: string[]
  sourceAnchors: string[]
  evidenceRefs: string[]
  runtimeRisk: "source-matrix-runtime-blocker" | "helix-only"
  knownLossiness: string[]
  nativeBlockers: string[]
}

export interface ConfigRuntimeValidationBlockerGateSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:config-runtime-validation-blocker-gate"
  fixtureID: "config:runtime-validation-blocker-gate"
  exactDiffStatus: "exact-diff-partial"
  products: ConfigRuntimeValidationBlockerGateProduct[]
  comparisonDimensions: ConfigRuntimeValidationBlockerGateDimension[]
  cases: ConfigRuntimeValidationBlockerGateCase[]
  fingerprint: string
}

export interface ConfigRuntimeValidationBlockerGateIssue {
  id: string
  product: ConfigRuntimeValidationBlockerGateProduct
  dimension: ConfigRuntimeValidationBlockerGateDimension
  message: string
}

export interface ConfigRuntimeValidationBlockerGateVerification {
  ok: boolean
  issues: ConfigRuntimeValidationBlockerGateIssue[]
}

export function buildConfigRuntimeValidationBlockerGateSnapshot(): ConfigRuntimeValidationBlockerGateSnapshot {
  const cases = [
    buildOpenCodeConfigRuntimeValidationBlockerGateCase(buildOpenCodeConfigSourceMatrixSnapshot()),
    buildProductConfigRuntimeValidationBlockerGateCase(buildPiMonoConfigSourceMatrixSnapshot()),
    buildProductConfigRuntimeValidationBlockerGateCase(buildNanobotConfigSourceMatrixSnapshot()),
    buildProductConfigRuntimeValidationBlockerGateCase(buildHermesAgentConfigSourceMatrixSnapshot()),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:config-runtime-validation-blocker-gate" as const,
    fixtureID: "config:runtime-validation-blocker-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: ["live-runtime", "side-effects", "schema-validation", "invalid-config", "fallback-default"] as ConfigRuntimeValidationBlockerGateDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyConfigRuntimeValidationBlockerGateSnapshot(
  snapshot: ConfigRuntimeValidationBlockerGateSnapshot,
): ConfigRuntimeValidationBlockerGateVerification {
  const issues: ConfigRuntimeValidationBlockerGateIssue[] = []
  const products: ConfigRuntimeValidationBlockerGateProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "config-runtime-validation.missing-product",
        product,
        dimension: "live-runtime",
        message: `Missing config runtime validation blocker gate case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "config-runtime-validation.native-claim",
        product,
        dimension: "live-runtime",
        message: `${product} config runtime gate must remain exact-diff-partial and cannot claim native parity.`,
      })
    }
    if (!configGateContains(item.liveRuntime, /runtime|spawned|live|cli|desktop|source-anchored/i)) {
      issues.push({
        id: "config-runtime-validation.live-runtime",
        product,
        dimension: "live-runtime",
        message: `${product} config runtime gate no longer records live runtime blockers.`,
      })
    }
    if (!configGateContains(item.sideEffects, /side-effects|plugin|extension|shell|save|filesystem|desktop|migration|EnvPlugin/i)) {
      issues.push({
        id: "config-runtime-validation.side-effects",
        product,
        dimension: "side-effects",
        message: `${product} config runtime gate no longer records side-effect blockers.`,
      })
    }
    if (!configGateContains(item.schemaValidation, /schema|validation|validator|validate|preset|Config|options|requiredPaths/i)) {
      issues.push({
        id: "config-runtime-validation.schema-validation",
        product,
        dimension: "schema-validation",
        message: `${product} config runtime gate no longer records schema validation blockers.`,
      })
    }
    if (!configGateContains(item.invalidConfig, /invalid|error|diagnostic|guard|validation|fallback|schema/i)) {
      issues.push({
        id: "config-runtime-validation.invalid-config",
        product,
        dimension: "invalid-config",
        message: `${product} config runtime gate no longer records invalid config/error shape blockers.`,
      })
    }
    if (!configGateContains(item.fallbackDefault, /default|fallback|product:|agents|recording|session|ui|preset/i)) {
      issues.push({
        id: "config-runtime-validation.fallback-default",
        product,
        dimension: "fallback-default",
        message: `${product} config runtime gate no longer records fallback/default blockers.`,
      })
    }
    if (item.runtimeRisk !== "source-matrix-runtime-blocker" || item.sourceAnchors.length === 0 || item.knownLossiness.length === 0) {
      issues.push({
        id: "config-runtime-validation.helix-only",
        product,
        dimension: "live-runtime",
        message: `${product} config runtime gate is not anchored to source-matrix partial evidence.`,
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildOpenCodeConfigRuntimeValidationBlockerGateCase(
  snapshot: OpenCodeConfigSourceMatrixSnapshot,
): ConfigRuntimeValidationBlockerGateCase {
  return {
    product: "opencode",
    upstreamRef: snapshot.upstreamRef,
    evidenceRef: snapshot.evidenceRef,
    fixtureID: snapshot.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    liveRuntime: configBranchMarkers(snapshot.branchAnchors, ["live-config-runtime"]),
    sideEffects: configBranchMarkers(snapshot.branchAnchors, ["plugin-env-side-effects", "env-cli-precedence"]),
    schemaValidation: configBranchMarkers(snapshot.branchAnchors, ["config-validator-product-guard", "exact-config-schema-validation"]),
    invalidConfig: uniqueStrings([
      "invalid-config-error-shape:not-exact",
      "validation-diagnostic-source:partial",
      ...configBranchMarkers(snapshot.branchAnchors, ["config-validator-product-guard", "exact-config-schema-validation"]),
    ]),
    fallbackDefault: uniqueStrings([
      "fallback-default-runtime:not-replayed",
      ...configBranchMarkers(snapshot.branchAnchors, ["default-config-shape"]),
    ]),
    sourceAnchors: snapshot.sourceRefs.map((sourceRef) => `${sourceRef.id}:${sourceRef.path}`),
    evidenceRefs: [
      snapshot.evidenceRef,
      snapshot.fixtureID,
      "config:discovery-precedence-gate",
      openCodeConfigNativeExactEvidenceRef,
      openCodeConfigNativeExactReplayRef,
      openCodeConfigNativeExactFixtureID,
    ],
    runtimeRisk: "source-matrix-runtime-blocker",
    knownLossiness: snapshot.knownGaps,
    nativeBlockers: configRuntimeValidationNativeBlockers(),
  }
}

function buildProductConfigRuntimeValidationBlockerGateCase(
  snapshot: ProductConfigSourceMatrixSnapshot,
): ConfigRuntimeValidationBlockerGateCase {
  return {
    product: snapshot.product,
    upstreamRef: snapshot.upstreamRef,
    evidenceRef: snapshot.evidenceRef,
    fixtureID: snapshot.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    liveRuntime: configBranchMarkers(snapshot.branchAnchors, ["live-config-runtime", "live-cli-config-runtime"]),
    sideEffects: configBranchMarkers(snapshot.branchAnchors, ["extension-directory-discovery", "dynamic-config-value-resolution", "env-ref-resolution", "migration-save-side-effects", "skills-platform-config", "desktop-config-settings"]),
    schemaValidation: configBranchMarkers(snapshot.branchAnchors, ["provider-preset-validation", "desktop-config-settings", "exact-config-schema-validation"]),
    invalidConfig: uniqueStrings([
      "invalid-config-error-shape:not-exact",
      "validation-diagnostic-source:partial",
      ...configBranchMarkers(snapshot.branchAnchors, ["provider-preset-validation", "desktop-config-settings", "exact-config-schema-validation"]),
    ]),
    fallbackDefault: uniqueStrings([
      "fallback-default-runtime:not-replayed",
      ...configBranchMarkers(snapshot.branchAnchors, ["default-config-shape", "desktop-config-settings"]),
    ]),
    sourceAnchors: snapshot.sourceRefs.map((sourceRef) => `${sourceRef.id}:${sourceRef.path}`),
    evidenceRefs: [snapshot.evidenceRef, snapshot.fixtureID, "config:discovery-precedence-gate"],
    runtimeRisk: "source-matrix-runtime-blocker",
    knownLossiness: snapshot.knownGaps,
    nativeBlockers: configRuntimeValidationNativeBlockers(),
  }
}

function configRuntimeValidationNativeBlockers(): string[] {
  return [
    "live-config-runtime-requires-product-native-process-or-loader",
    "plugin-env-extension-desktop-side-effects-require-native-replay",
    "schema-validation-requires-upstream-invalid-config-error-shape",
    "fallback-default-behavior-requires-product-native-runtime-readback",
    "partial-source-matrix-must-not-promote-config-native-parity",
  ]
}

export type ConfigExactDiffBlockerProduct = ConfigRuntimeValidationBlockerGateProduct
export type ConfigExactDiffBlockerDimension = ConfigRuntimeValidationBlockerGateDimension

export interface ConfigExactDiffBlockerCase {
  product: ConfigExactDiffBlockerProduct
  upstreamRef: ConfigRuntimeValidationBlockerGateCase["upstreamRef"]
  fixtureID: ConfigRuntimeValidationBlockerGateCase["fixtureID"]
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  liveRuntime: string[]
  sideEffects: string[]
  schemaValidation: string[]
  invalidConfig: string[]
  fallbackDefault: string[]
  sourceAnchors: string[]
  nativeEvidenceRefs: string[]
  exactDiffRisk: "source-matrix-needs-live-exact-diff" | "helix-only"
  knownLossiness: string[]
  nativeBlockers: string[]
}

export interface ConfigExactDiffBlockerSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:config-exact-diff-blocker-gate"
  fixtureID: "config:exact-diff-blocker-gate"
  exactDiffStatus: "exact-diff-partial"
  products: ConfigExactDiffBlockerProduct[]
  comparisonDimensions: ConfigExactDiffBlockerDimension[]
  cases: ConfigExactDiffBlockerCase[]
  fingerprint: string
}

export interface ConfigExactDiffBlockerIssue {
  id: string
  product: ConfigExactDiffBlockerProduct
  dimension: ConfigExactDiffBlockerDimension
  message: string
}

export interface ConfigExactDiffBlockerVerification {
  ok: boolean
  issues: ConfigExactDiffBlockerIssue[]
}

export function buildConfigExactDiffBlockerSnapshot(): ConfigExactDiffBlockerSnapshot {
  const runtimeGate = buildConfigRuntimeValidationBlockerGateSnapshot()
  const cases = runtimeGate.cases.map(buildConfigExactDiffBlockerCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:config-exact-diff-blocker-gate" as const,
    fixtureID: "config:exact-diff-blocker-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: ["live-runtime", "side-effects", "schema-validation", "invalid-config", "fallback-default"] as ConfigExactDiffBlockerDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyConfigExactDiffBlockerSnapshot(
  snapshot: ConfigExactDiffBlockerSnapshot,
): ConfigExactDiffBlockerVerification {
  const issues: ConfigExactDiffBlockerIssue[] = []
  const products: ConfigExactDiffBlockerProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "config-exact-diff.missing-product",
        product,
        dimension: "live-runtime",
        message: `Missing config exact-diff blocker case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "config-exact-diff.native-claim",
        product,
        dimension: "live-runtime",
        message: `${product} config exact-diff blocker must remain exact-diff-partial and cannot claim native parity.`,
      })
    }
    if (!configGateContains(item.liveRuntime, /runtime|spawned|live|cli|desktop|exact-diff-not-proven/i)) {
      issues.push({
        id: "config-exact-diff.live-runtime",
        product,
        dimension: "live-runtime",
        message: `${product} config exact-diff blocker no longer records live runtime gaps.`,
      })
    }
    if (!configGateContains(item.sideEffects, /side-effects|plugin|extension|shell|save|filesystem|desktop|migration|EnvPlugin|exact-diff-not-proven/i)) {
      issues.push({
        id: "config-exact-diff.side-effects",
        product,
        dimension: "side-effects",
        message: `${product} config exact-diff blocker no longer records side-effect gaps.`,
      })
    }
    if (!configGateContains(item.schemaValidation, /schema|validation|validator|validate|preset|Config|options|requiredPaths|exact-diff-not-proven/i)) {
      issues.push({
        id: "config-exact-diff.schema-validation",
        product,
        dimension: "schema-validation",
        message: `${product} config exact-diff blocker no longer records schema validation gaps.`,
      })
    }
    if (!configGateContains(item.invalidConfig, /invalid|error|diagnostic|guard|validation|fallback|schema|exact-diff-not-proven/i)) {
      issues.push({
        id: "config-exact-diff.invalid-config",
        product,
        dimension: "invalid-config",
        message: `${product} config exact-diff blocker no longer records invalid config/error gaps.`,
      })
    }
    if (!configGateContains(item.fallbackDefault, /default|fallback|product:|agents|recording|session|ui|preset|readback|exact-diff-not-proven/i)) {
      issues.push({
        id: "config-exact-diff.fallback-default",
        product,
        dimension: "fallback-default",
        message: `${product} config exact-diff blocker no longer records fallback/default gaps.`,
      })
    }
    if (item.exactDiffRisk !== "source-matrix-needs-live-exact-diff" || item.sourceAnchors.length === 0 || item.knownLossiness.length === 0) {
      issues.push({
        id: "config-exact-diff.helix-only",
        product,
        dimension: "live-runtime",
        message: `${product} config exact-diff blocker is not anchored to source-matrix partial evidence.`,
      })
    }
    if (item.nativeBlockers.length === 0 || !configGateContains(item.nativeBlockers, /native|partial|exact|runtime/i)) {
      issues.push({
        id: "config-exact-diff.native-blockers",
        product,
        dimension: "live-runtime",
        message: `${product} config exact-diff blocker lost native blocker evidence.`,
      })
    }
    if (
      product === "opencode" &&
      (
        !item.nativeEvidenceRefs.includes(openCodeConfigNativeExactEvidenceRef) ||
        !item.nativeEvidenceRefs.includes(openCodeConfigNativeExactReplayRef) ||
        !item.nativeEvidenceRefs.includes(openCodeConfigNativeExactFixtureID)
      )
    ) {
      issues.push({
        id: "config-exact-diff.native-exact-evidence",
        product,
        dimension: "schema-validation",
        message: "OpenCode config exact-diff blocker no longer carries native-exact config evidence.",
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildConfigExactDiffBlockerCase(
  item: ConfigRuntimeValidationBlockerGateCase,
): ConfigExactDiffBlockerCase {
  const knownLossiness = uniqueStrings([
    ...item.knownLossiness,
    "config-live-runtime-exact-diff-not-proven",
    "config-side-effects-exact-diff-not-proven",
    "config-schema-validation-exact-diff-not-proven",
    "config-invalid-error-shape-exact-diff-not-proven",
    "config-fallback-default-readback-exact-diff-not-proven",
  ])
  const nativeBlockers = uniqueStrings([
    ...item.nativeBlockers,
    "config-exact-diff-requires-product-native-config-runtime",
    "config-exact-diff-requires-product-native-side-effect-readback",
  ])
  return {
    product: item.product,
    upstreamRef: item.upstreamRef,
    fixtureID: item.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    liveRuntime: uniqueStrings([...item.liveRuntime, "live-config-runtime:exact-diff-not-proven"]),
    sideEffects: uniqueStrings([...item.sideEffects, "config-side-effects:exact-diff-not-proven"]),
    schemaValidation: uniqueStrings([...item.schemaValidation, "schema-validation:exact-diff-not-proven"]),
    invalidConfig: uniqueStrings([...item.invalidConfig, "invalid-config-error-shape:exact-diff-not-proven"]),
    fallbackDefault: uniqueStrings([...item.fallbackDefault, "fallback-default-readback:exact-diff-not-proven"]),
    sourceAnchors: item.sourceAnchors,
    nativeEvidenceRefs: uniqueStrings([item.fixtureID, ...item.evidenceRefs, ...item.sourceAnchors, ...nativeBlockers]),
    exactDiffRisk: "source-matrix-needs-live-exact-diff",
    knownLossiness,
    nativeBlockers,
  }
}

export type ConfigPinnedDiscoveryPrecedenceReplayProduct = ConfigDiscoveryPrecedenceGateProduct
export type ConfigPinnedDiscoveryPrecedenceReplayDimension = ConfigDiscoveryPrecedenceGateDimension

export interface ConfigPinnedDiscoveryPrecedenceReplayRecord {
  dimension: ConfigPinnedDiscoveryPrecedenceReplayDimension
  sequence: number
  value: string
  sourceAnchors: string[]
  evidenceRefs: string[]
  knownLossiness: string[]
}

export interface ConfigPinnedDiscoveryPrecedenceReplayCase {
  product: ConfigPinnedDiscoveryPrecedenceReplayProduct
  upstreamRef: ConfigDiscoveryPrecedenceGateCase["upstreamRef"]
  fixtureID: ConfigDiscoveryPrecedenceGateCase["fixtureID"]
  exactDiffStatus: "exact-diff-partial" | "native-exact"
  coverageStatus: "partial" | "native"
  nativeParityClaim: boolean
  upstreamRecords: ConfigPinnedDiscoveryPrecedenceReplayRecord[]
  productReplayRecords: ConfigPinnedDiscoveryPrecedenceReplayRecord[]
  assembledRecords: ConfigPinnedDiscoveryPrecedenceReplayRecord[]
  sourceAnchors: string[]
  configAtomIDs: string[]
  configPortIDs: string[]
  evidenceRefs: string[]
  exactDiffRisk: "pinned-discovery-precedence-replay-needs-live-config-runtime" | "native-exact" | "helix-only"
  knownLossiness: string[]
}

export interface ConfigPinnedDiscoveryPrecedenceReplaySnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:config-pinned-discovery-precedence-replay-gate"
  fixtureID: "config:pinned-discovery-precedence-replay-gate"
  exactDiffStatus: "exact-diff-partial"
  products: ConfigPinnedDiscoveryPrecedenceReplayProduct[]
  comparisonDimensions: ConfigPinnedDiscoveryPrecedenceReplayDimension[]
  cases: ConfigPinnedDiscoveryPrecedenceReplayCase[]
  fingerprint: string
}

export interface ConfigPinnedDiscoveryPrecedenceReplayIssue {
  id: string
  product: ConfigPinnedDiscoveryPrecedenceReplayProduct
  dimension: ConfigPinnedDiscoveryPrecedenceReplayDimension
  message: string
}

export interface ConfigPinnedDiscoveryPrecedenceReplayVerification {
  ok: boolean
  issues: ConfigPinnedDiscoveryPrecedenceReplayIssue[]
}

const configPinnedDiscoveryPrecedenceReplayDimensions: ConfigPinnedDiscoveryPrecedenceReplayDimension[] = [
  "discovery-path",
  "merge-order",
  "default-value",
  "validation",
  "product-override",
]

export function buildConfigPinnedDiscoveryPrecedenceReplaySnapshot(): ConfigPinnedDiscoveryPrecedenceReplaySnapshot {
  const gate = buildConfigDiscoveryPrecedenceGateSnapshot()
  const cases = gate.cases.map(buildConfigPinnedDiscoveryPrecedenceReplayCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:config-pinned-discovery-precedence-replay-gate" as const,
    fixtureID: "config:pinned-discovery-precedence-replay-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: configPinnedDiscoveryPrecedenceReplayDimensions,
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyConfigPinnedDiscoveryPrecedenceReplaySnapshot(
  snapshot: ConfigPinnedDiscoveryPrecedenceReplaySnapshot,
): ConfigPinnedDiscoveryPrecedenceReplayVerification {
  const issues: ConfigPinnedDiscoveryPrecedenceReplayIssue[] = []
  const products: ConfigPinnedDiscoveryPrecedenceReplayProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "config-pinned-replay.missing-product",
        product,
        dimension: "discovery-path",
        message: `Missing config pinned discovery precedence replay case for ${product}.`,
      })
      continue
    }
    const nativeExact = product === "opencode"
    if (nativeExact) {
      if (item.exactDiffStatus !== "native-exact" || item.coverageStatus !== "native" || item.nativeParityClaim !== true) {
        issues.push({
          id: "config-pinned-replay.native-claim",
          product,
          dimension: "discovery-path",
          message: `${product} config pinned replay must remain native-exact after OpenCode config fixture promotion.`,
        })
      }
    } else if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "config-pinned-replay.native-claim",
        product,
        dimension: "discovery-path",
        message: `${product} config pinned replay must remain exact-diff-partial and cannot claim native parity.`,
      })
    }
    if (
      !configPinnedReplayOrderMatches(item.upstreamRecords)
      || !configPinnedReplayOrderMatches(item.productReplayRecords)
      || !configPinnedReplayOrderMatches(item.assembledRecords)
    ) {
      issues.push({
        id: "config-pinned-replay.order",
        product,
        dimension: "merge-order",
        message: `${product} config pinned replay record order drifted from the pinned comparison dimensions.`,
      })
    }
    for (const dimension of configPinnedDiscoveryPrecedenceReplayDimensions) {
      const upstreamRecord = configPinnedReplayRecord(item.upstreamRecords, dimension)
      const productReplayRecord = configPinnedReplayRecord(item.productReplayRecords, dimension)
      const assembledRecord = configPinnedReplayRecord(item.assembledRecords, dimension)
      if (
        !upstreamRecord
        || !productReplayRecord
        || !assembledRecord
        || !configPinnedReplayRecordMatches(upstreamRecord, productReplayRecord)
        || !configPinnedReplayRecordMatches(upstreamRecord, assembledRecord)
      ) {
        issues.push({
          id: `config-pinned-replay.${dimension}`,
          product,
          dimension,
          message: `${product} config pinned replay ${dimension} no longer matches upstream/product/assembled records.`,
        })
        continue
      }
      if (!configPinnedReplayRecordHasDimensionContent(upstreamRecord)) {
        issues.push({
          id: `config-pinned-replay.${dimension}`,
          product,
          dimension,
          message: `${product} config pinned replay ${dimension} no longer records source-anchored config evidence.`,
        })
      }
    }
    if (nativeExact) {
      if (
        item.exactDiffRisk !== "native-exact" ||
        !item.evidenceRefs.includes(openCodeConfigNativeExactEvidenceRef) ||
        !item.evidenceRefs.includes(openCodeConfigNativeExactReplayRef) ||
        !item.evidenceRefs.includes(openCodeConfigNativeExactFixtureID) ||
        item.knownLossiness.length > 0
      ) {
        issues.push({
          id: "config-pinned-replay.native-exact-evidence",
          product,
          dimension: "discovery-path",
          message: `${product} config pinned replay no longer exposes OpenCode native-exact config evidence cleanly.`,
        })
      }
    } else if (item.exactDiffRisk !== "pinned-discovery-precedence-replay-needs-live-config-runtime" || item.knownLossiness.length === 0) {
      issues.push({
        id: "config-pinned-replay.helix-only",
        product,
        dimension: "discovery-path",
        message: `${product} config pinned replay is not carrying the required live-runtime exact-diff risk.`,
      })
    }
    if (item.sourceAnchors.length === 0 || !item.evidenceRefs.includes("config:discovery-precedence-gate")) {
      issues.push({
        id: "config-pinned-replay.source-anchors",
        product,
        dimension: "discovery-path",
        message: `${product} config pinned replay lost source anchors or discovery/precedence gate evidence.`,
      })
    }
    if (item.product !== "opencode" && item.sourceAnchors.some((anchor) => anchor.includes("packages/opencode/"))) {
      issues.push({
        id: "config-pinned-replay.borrowed-source-matrix",
        product,
        dimension: "discovery-path",
        message: `${product} config pinned replay borrowed OpenCode source anchors.`,
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildConfigPinnedDiscoveryPrecedenceReplayCase(
  item: ConfigDiscoveryPrecedenceGateCase,
): ConfigPinnedDiscoveryPrecedenceReplayCase {
  const openCodeNative = item.product === "opencode"
  const evidenceRefs = uniqueStrings([
    item.evidenceRef,
    item.fixtureID,
    "config:discovery-precedence-gate",
    ...item.nativeEvidenceRefs,
    ...item.fixtureIDs,
  ])
  const knownLossiness = openCodeNative
    ? []
    : uniqueStrings([
      ...item.knownLossiness,
      "config-pinned-discovery-precedence-replay-partial-fixture",
      "config-pinned-discovery-precedence-replay-needs-live-runtime",
    ])
  const records = configPinnedDiscoveryPrecedenceReplayRecords(item, evidenceRefs, knownLossiness)
  return {
    product: item.product,
    upstreamRef: item.upstreamRef,
    fixtureID: item.fixtureID,
    exactDiffStatus: openCodeNative ? "native-exact" : "exact-diff-partial",
    coverageStatus: openCodeNative ? "native" : "partial",
    nativeParityClaim: openCodeNative,
    upstreamRecords: records.map(configPinnedReplayRecordClone),
    productReplayRecords: records.map(configPinnedReplayRecordClone),
    assembledRecords: records.map(configPinnedReplayRecordClone),
    sourceAnchors: item.sourceAnchors,
    configAtomIDs: item.configAtomIDs,
    configPortIDs: item.configPortIDs,
    evidenceRefs,
    exactDiffRisk: openCodeNative ? "native-exact" : "pinned-discovery-precedence-replay-needs-live-config-runtime",
    knownLossiness,
  }
}

function configPinnedDiscoveryPrecedenceReplayRecords(
  item: ConfigDiscoveryPrecedenceGateCase,
  evidenceRefs: string[],
  knownLossiness: string[],
): ConfigPinnedDiscoveryPrecedenceReplayRecord[] {
  return configPinnedDiscoveryPrecedenceReplayDimensions.map((dimension, index) => ({
    dimension,
    sequence: index + 1,
    value: configPinnedDiscoveryPrecedenceReplayValue(item, dimension),
    sourceAnchors: item.sourceAnchors,
    evidenceRefs,
    knownLossiness,
  }))
}

function configPinnedDiscoveryPrecedenceReplayValue(
  item: ConfigDiscoveryPrecedenceGateCase,
  dimension: ConfigPinnedDiscoveryPrecedenceReplayDimension,
): string {
  if (dimension === "discovery-path") return item.discoveryPath.join(">")
  if (dimension === "merge-order") return item.mergeOrder.join(">")
  if (dimension === "default-value") return item.defaultValue.join(">")
  if (dimension === "validation") return item.validation.join(">")
  return item.productOverride.join(">")
}

function configPinnedReplayRecordClone(
  record: ConfigPinnedDiscoveryPrecedenceReplayRecord,
): ConfigPinnedDiscoveryPrecedenceReplayRecord {
  return {
    ...record,
    sourceAnchors: [...record.sourceAnchors],
    evidenceRefs: [...record.evidenceRefs],
    knownLossiness: [...record.knownLossiness],
  }
}

function configPinnedReplayRecord(
  records: ConfigPinnedDiscoveryPrecedenceReplayRecord[],
  dimension: ConfigPinnedDiscoveryPrecedenceReplayDimension,
): ConfigPinnedDiscoveryPrecedenceReplayRecord | undefined {
  return records.find((record) => record.dimension === dimension)
}

function configPinnedReplayRecordMatches(
  upstreamRecord: ConfigPinnedDiscoveryPrecedenceReplayRecord,
  candidateRecord: ConfigPinnedDiscoveryPrecedenceReplayRecord,
): boolean {
  return configPinnedReplayRecordSignature(upstreamRecord) === configPinnedReplayRecordSignature(candidateRecord)
}

function configPinnedReplayOrderMatches(records: ConfigPinnedDiscoveryPrecedenceReplayRecord[]): boolean {
  return records.map((record) => `${record.sequence}:${record.dimension}`).join("|") === configPinnedDiscoveryPrecedenceReplayDimensions.map((dimension, index) => `${index + 1}:${dimension}`).join("|")
}

function configPinnedReplayRecordSignature(record: ConfigPinnedDiscoveryPrecedenceReplayRecord | undefined): string {
  if (!record) return "missing"
  return [
    record.sequence,
    record.dimension,
    record.value,
    record.sourceAnchors.join(","),
    record.evidenceRefs.join(","),
    record.knownLossiness.join(","),
  ].join("|")
}

function configPinnedReplayRecordHasDimensionContent(record: ConfigPinnedDiscoveryPrecedenceReplayRecord): boolean {
  const haystack = [record.value, ...record.sourceAnchors, ...record.evidenceRefs, ...record.knownLossiness]
  if (record.dimension === "discovery-path") return configGateContains(haystack, /config|settings|directory|path|file|plugin|extension|desktop|skills/i)
  if (record.dimension === "merge-order") return configGateContains(haystack, /builtin|global|project|env|cli|precedence|dynamic|desktop|skills/i)
  if (record.dimension === "default-value") return configGateContains(haystack, /default|product:|agents|session|ui|recording/i)
  if (record.dimension === "validation") return configGateContains(haystack, /validator|schema|validate|guard|preset|Config|settings/i)
  return configGateContains(haystack, /product:|env|cli|override|selector|preset|platform|dynamic|shell|header|extension|HERMES_|OPENCODE_|NANOBOT_|PLATFORMS/i)
}

export const configPortContractFixtures: LegoPortContractFixture[] = [
  {
    id: "config.source",
    input: "environment variables, CLI flags, workspace files, user files, product defaults, and secret references",
    output: "layered config fragments with source, precedence, and redaction metadata",
    lifecycle: ["process", "workspace"],
    resources: [
      { id: "env", mode: "read", scope: "process" },
      { id: "filesystem", mode: "read", scope: "workspace" },
    ],
    conformance: "config:source",
    implementations: ["config.source.env", "config.source.file", "config.source.cli-override"],
    personalityAtoms: ["opencode.config.source", "pi.config.source", "nanobot.config.source", "hermes.config.source"],
  },
  {
    id: "config.merge-strategy",
    input: "ordered config fragments, precedence policy, conflict policy, and product defaults",
    output: "merged config object plus conflict diagnostics and redacted audit metadata",
    lifecycle: ["process", "workspace"],
    resources: [],
    conformance: "config:merge-strategy",
    implementations: ["config.merge.deep", "config.merge.replace", "config.merge.priority"],
    personalityAtoms: ["opencode.config.precedence", "pi.config.precedence", "nanobot.config.precedence", "hermes.config.precedence"],
  },
  {
    id: "config.validator",
    input: "merged config object, schema, product compatibility rules, and redaction policy",
    output: "validated typed config or structured validation diagnostics",
    lifecycle: ["process", "workspace"],
    resources: [],
    conformance: "config:validator",
    implementations: ["config.validator.schema", "config.validator.typescript"],
    personalityAtoms: ["opencode.config.validator", "pi.config.validator", "nanobot.config.validator", "hermes.config.validator"],
  },
]

function normalizeOpenCodeConfigLivePath(value: string, input: { cwd: string; home: string }): string {
  if (!isAbsolute(value)) return value
  const resolved = resolve(value)
  const cwd = resolve(input.cwd)
  const home = resolve(input.home)
  if (resolved === cwd) return "<cwd>"
  if (resolved.startsWith(`${cwd}${sep}`)) return `<cwd>/${resolved.slice(cwd.length + 1).split(sep).join("/")}`
  if (resolved === home) return "<home>"
  if (resolved.startsWith(`${home}${sep}`)) return `<home>/${resolved.slice(home.length + 1).split(sep).join("/")}`
  return resolved.split(sep).join("/")
}

function configValuePaths(value: unknown, prefix = ""): string[] {
  if (!isRecord(value)) return prefix ? [prefix] : []
  const entries = Object.entries(value)
  if (entries.length === 0) return prefix ? [prefix] : []
  return uniqueStrings(entries.flatMap(([key, item]) => configValuePaths(item, prefix ? `${prefix}.${key}` : key)))
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null
}

function readConfigPath(value: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!isRecord(current)) return undefined
    return current[segment]
  }, value)
}

function validationIssueCodes(issues: ConfigValidationIssue[]): string[] {
  return uniqueStrings(issues.map((issue) => `config.validation.${issue.path}`))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)].filter(Boolean).sort()
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`
}
