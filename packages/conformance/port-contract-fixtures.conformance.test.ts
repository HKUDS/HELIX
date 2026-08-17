import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  buildHermesEventSourceMatrixSnapshot,
  buildHermesIdentitySourceMatrixSnapshot,
  buildHermesProductShellSourceMatrixSnapshot,
  buildHermesTraceSourceMatrixSnapshot,
  buildHermesUISourceMatrixSnapshot,
  buildEventEnvelopeExactDiffBlockerSnapshot,
  buildEventEnvelopePinnedReplaySnapshot,
  buildEventEnvelopeReplayGateSnapshot,
  buildEventPublicExportSurfaceGuard,
  buildIdentityFormattingExactDiffBlockerSnapshot,
  buildIdentityFormattingPinnedReplaySnapshot,
  buildIdentityFormattingRoundTripGateSnapshot,
  buildIdentityPublicExportSurfaceGuard,
  buildNanobotEventSourceMatrixSnapshot,
  buildNanobotIdentitySourceMatrixSnapshot,
  buildNanobotProductShellSourceMatrixSnapshot,
  buildNanobotTraceSourceMatrixSnapshot,
  buildNanobotUISourceMatrixSnapshot,
  buildOpenCodeEventSourceMatrixSnapshot,
  buildOpenCodeFoundationTraceSourceMatrixSnapshot,
  buildOpenCodeIdentitySourceMatrixSnapshot,
  buildOpenCodeMetadataOverlayDemotionMatrixSnapshot,
  buildOpenCodeProductShellSourceMatrixSnapshot,
  buildOpenCodeUISourceMatrixSnapshot,
  buildPiEventSourceMatrixSnapshot,
  buildPiIdentitySourceMatrixSnapshot,
  buildPiProductShellSourceMatrixSnapshot,
  buildPiTraceSourceMatrixSnapshot,
  buildPiUISourceMatrixSnapshot,
  buildTraceDebugCaptureExactDiffBlockerSnapshot,
  buildTraceDebugCapturePinnedReplaySnapshot,
  buildTraceDebugCaptureReplayGateSnapshot,
  contractPortContractFixtures,
  captureOpenCodeEventLiveRuntimeFixture,
  captureOpenCodeIdentityLiveRuntimeFixture,
  captureOpenCodeProductShellLiveRuntimeFixture,
  captureOpenCodeUILiveRuntimeFixture,
  normalizePortContractFixture,
  projectOpenCodeEventRuntimeProjection,
  projectOpenCodeFoundationTraceRuntimeProjection,
  projectOpenCodeIdentityRuntimeProjection,
  projectOpenCodeProductShellRuntimeProjection,
  projectOpenCodeUIRuntimeProjection,
  type LegoPortContractFixture,
  verifyEventEnvelopeExactDiffBlockerSnapshot,
  verifyEventEnvelopePinnedReplaySnapshot,
  verifyEventEnvelopeReplayGateSnapshot,
  verifyEventPublicExportSurfaceGuard,
  verifyIdentityFormattingExactDiffBlockerSnapshot,
  verifyIdentityFormattingPinnedReplaySnapshot,
  verifyIdentityFormattingRoundTripGateSnapshot,
  verifyIdentityPublicExportSurfaceGuard,
  verifyOpenCodeEventLiveRuntimeFixture,
  verifyOpenCodeIdentityLiveRuntimeFixture,
  verifyOpenCodeProductShellLiveRuntimeFixture,
  verifyOpenCodeUILiveRuntimeFixture,
  verifyTraceDebugCaptureExactDiffBlockerSnapshot,
  verifyTraceDebugCapturePinnedReplaySnapshot,
  verifyTraceDebugCaptureReplayGateSnapshot,
} from "@helix/contracts"
import { runtimePortContractFixtures } from "@helix/lego-runtime"
import { sessionPortContractFixtures } from "@helix/lego-session"
import { hookPortContractFixtures } from "@helix/lego-hooks"
import { toolPortContractFixtures } from "@helix/lego-tools"
import { providerPortContractFixtures } from "@helix/lego-provider"
import { turnPortContractFixtures } from "@helix/lego-agent-loop"
import { configPortContractFixtures } from "@helix/lego-config"
import { promptPortContractFixtures } from "@helix/lego-prompt"
import { uiPortContractFixtures } from "@helix/lego-ui"
import {
  captureOpenCodeTraceDebugSurfaceNativeExactFixture,
  verifyOpenCodeTraceDebugSurfaceNativeExactFixture,
} from "@helix/adapters-opencode/opencode-trace-debug-surface"
import {
  captureOpenCodeProviderAuthNativeExactFixture,
  verifyOpenCodeProviderAuthNativeExactFixture,
} from "@helix/adapters-opencode/opencode-provider-auth-descriptor"
import {
  captureOpenCodeProviderPluginNativeExactFixture,
  verifyOpenCodeProviderPluginNativeExactFixture,
} from "@helix/adapters-opencode/opencode-provider-plugin-descriptor"
import {
  captureOpenCodePluginProviderRegistryNativeExactFixture,
  verifyOpenCodePluginProviderRegistryNativeExactFixture,
} from "@helix/adapters-opencode/opencode-plugin-provider-registry"
import {
  captureOpenCodePluginLoaderNativeExactFixture,
  verifyOpenCodePluginLoaderNativeExactFixture,
} from "@helix/adapters-opencode/opencode-plugin-loader"
import {
  captureOpenCodePluginHotReloadCleanupNativeExactFixture,
  verifyOpenCodePluginHotReloadCleanupNativeExactFixture,
} from "@helix/adapters-opencode/opencode-plugin-hot-reload-cleanup"
import {
  captureOpenCodePluginEventMapperNativeExactFixture,
  verifyOpenCodePluginEventMapperNativeExactFixture,
} from "@helix/adapters-opencode/opencode-plugin-event-mapper"
import {
  captureOpenCodePluginToolRegistryNativeExactFixture,
  verifyOpenCodePluginToolRegistryNativeExactFixture,
} from "@helix/adapters-opencode/opencode-plugin-tool-registry"
import {
  captureOpenCodeToolDefinitionPluginNativeExactFixture,
  verifyOpenCodeToolDefinitionPluginNativeExactFixture,
} from "@helix/adapters-opencode/opencode-tool-definition-plugin"
import {
  captureOpenCodeProviderModelPluginNativeExactFixture,
  verifyOpenCodeProviderModelPluginNativeExactFixture,
} from "@helix/adapters-opencode/opencode-provider-model-plugin"
import {
  captureOpenCodeHookSchedulerNativeExactFixture,
  verifyOpenCodeHookSchedulerNativeExactFixture,
} from "@helix/adapters-opencode/opencode-hook-scheduler"
import {
  captureOpenCodeHookErrorDefaultsNativeExactFixture,
  verifyOpenCodeHookErrorDefaultsNativeExactFixture,
} from "@helix/adapters-opencode/opencode-hook-error-defaults"
import {
  captureOpenCodeHookObserverNativeExactFixture,
  verifyOpenCodeHookObserverNativeExactFixture,
} from "@helix/adapters-opencode/opencode-hook-observer"
import {
  captureOpenCodeHookHandlerNativeExactFixture,
  verifyOpenCodeHookHandlerNativeExactFixture,
} from "@helix/adapters-opencode/opencode-hook-handler"
import {
  captureOpenCodeCommandRegistryNativeExactFixture,
  verifyOpenCodeCommandRegistryNativeExactFixture,
} from "@helix/adapters-opencode/opencode-command-registry"
import {
  captureOpenCodeShellEnvNativeExactFixture,
  verifyOpenCodeShellEnvNativeExactFixture,
} from "@helix/adapters-opencode/opencode-shell-env"
import {
  captureOpenCodeToolResultRenderNativeExactFixture,
  verifyOpenCodeToolResultRenderNativeExactFixture,
} from "@helix/adapters-opencode/opencode-tool-result-render"
import {
  captureOpenCodePluginPermissionBridgeNativeExactFixture,
  verifyOpenCodePluginPermissionBridgeNativeExactFixture,
} from "@helix/adapters-opencode/opencode-plugin-permission-bridge"
import {
  captureOpenCodeEventEnvelopeNativeExactFixture,
  createOpenCodeEventEnvelopeBridge,
  verifyOpenCodeEventEnvelopeNativeExactFixture,
} from "@helix/adapters-opencode/opencode-event-envelope"
import {
  captureOpenCodeSyncEventLogNativeExactFixture,
  createOpenCodeSyncEventLogBridge,
  verifyOpenCodeSyncEventLogNativeExactFixture,
} from "@helix/adapters-opencode/opencode-sync-event-log"
import {
  openCodeEventNativeExactEvidenceRef,
  openCodeEventNativeExactFixtureID,
  openCodeEventNativeExactReplayRef,
} from "@helix/adapters-opencode/product-schema/events"
import {
  openCodeIdentityNativeExactEvidenceRef,
  openCodeIdentityNativeExactFixtureID,
  openCodeIdentityNativeExactReplayRef,
} from "@helix/adapters-opencode/product-schema/identity"

const openCodeEventNativeGateEvidenceRefs = [
  "conformance:opencode-event-envelope-native-exact-fixture",
  "event-envelope-native-exact:opencode",
  "conformance:opencode-sync-event-log-native-exact-fixture",
  "sync-event-log-native-exact:opencode",
  openCodeEventNativeExactEvidenceRef,
  openCodeEventNativeExactReplayRef,
]

const openCodeEventNativeGateFixtureIDs = [
  "opencode-event-envelope:native-exact-fixture",
  "opencode-sync-event-log:native-exact-fixture",
  openCodeEventNativeExactFixtureID,
]

const openCodeIdentityNativeGateEvidenceRefs = [
  "conformance:opencode-identity-id-generator-native-exact-fixture",
  "conformance:opencode-identity-clock-title-native-exact-fixture",
  "conformance:opencode-identity-workspace-session-path-native-exact-fixture",
  openCodeIdentityNativeExactEvidenceRef,
  openCodeIdentityNativeExactReplayRef,
]

const openCodeIdentityNativeGateFixtureIDs = [
  "opencode-identity:id-generator-native-exact-fixture",
  "opencode-identity:clock-title-native-exact-fixture",
  "opencode-identity:workspace-session-path-native-exact-fixture",
  openCodeIdentityNativeExactFixtureID,
]

const expectedPortIDs = [
  "block.manifest",
  "capability.ref",
  "resource.grant",
  "recipe.binding",
  "conformance.ref",
  "runtime.module-catalog",
  "runtime.capability-resolver",
  "runtime.binding-planner",
  "runtime.lifecycle-runner",
  "runtime.assembly-graph",
  "runtime.acceptance-controller",
  "runtime.acceptance-evidence",
  "identity.id-generator",
  "identity.clock",
  "identity.workspace-resolver",
  "event.envelope",
  "event.log",
  "trace.recorder",
  "session.store",
  "session.reader",
  "session.writer",
  "session.branching",
  "session.branch-graph",
  "session.projector",
  "session.message-part-projector",
  "session.message-store",
  "session.pagination",
  "session.context-selector",
  "session.id-generator",
  "session.event-log",
  "session.compaction-records",
  "session.diff",
  "hook.bus",
  "hook.observer-chain",
  "hook.handler-chain",
  "hook.scheduler",
  "hook.cleanup-scope",
  "hook.error-policy",
  "tool.registry",
  "registry.command",
  "registry.provider",
  "registry.ui",
  "turn.input-normalizer",
  "turn.context-builder",
  "turn.prompt-assembler",
  "turn.provider-request-builder",
  "turn.provider-stream-runner",
  "turn.stream-reducer",
  "turn.tool-call-planner",
  "turn.tool-executor",
  "turn.result-recorder",
  "turn.retry-policy",
  "turn.continuation-policy",
  "turn.compaction-policy",
  "turn.stop-condition",
  "agent-loop.request-boundary",
  "agent-loop.final-summary",
  "tools",
  "tools.schema",
  "tools.batch-scheduler",
  "tools.result-projector",
  "tool.definition",
  "tool.schema-adapter",
  "tool.permission-policy",
  "tool.executor",
  "tool.result-normalizer",
  "tool.audit-log",
  "filesystem.port",
  "process-runner.port",
  "provider.transport",
  "provider.auth",
  "provider.model-registry",
  "provider.request-shape",
  "provider.stream-parser",
  "provider.event-normalizer",
  "provider.usage-normalizer",
  "provider.cassette",
  "provider.stream",
  "provider.streaming-delta-recorder",
  "provider.stream-projector",
  "config.source",
  "config.merge-strategy",
  "config.validator",
  "resource.discovery",
  "prompt.resource-loader",
  "prompt.system-builder",
  "prompt.tool-renderer",
  "prompt.model-capability-adapter",
  "prompt.compaction-adapter",
  "ui.event-loop",
  "ui.renderer",
  "ui.command-router",
  "ui.theme-registry",
  "ui.input-normalizer",
  "ui.snapshot",
  "product.shell",
]

describe("port contract fixtures", () => {
  it("anchors OpenCode identity bridges to pinned upstream identity sources", () => {
    const snapshot = buildOpenCodeIdentitySourceMatrixSnapshot()

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      pinnedRepo: "anomalyco/opencode",
      pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-identity-source-matrix",
      fixtureID: "opencode-identity:source-matrix",
      partialBranchIDs: expect.arrayContaining([
        "session-title-format",
        "session-path-workspace",
        "local-id-kind-serialization",
        "upstream-id-generator-runtime",
        "exact-clock-timestamp-format",
        "workspace-filesystem-side-effects",
      ]),
      missingBranchIDs: [],
      coveredIdentityAtomIDs: expect.arrayContaining([
        "opencode.identity.clock-format",
        "opencode.identity.id-generator",
        "opencode.identity.workspace-resolver",
      ]),
      coveredIdentityPortIDs: expect.arrayContaining(["identity.clock", "identity.id-generator", "identity.workspace-resolver"]),
      nativeEvidenceRefs: expect.arrayContaining(openCodeIdentityNativeGateEvidenceRefs),
      fixtureIDs: expect.arrayContaining([
        "opencode-identity:source-matrix",
        ...openCodeIdentityNativeGateFixtureIDs,
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-identity-source-matrix-covered-by-partial-fixture",
        "opencode-upstream-id-generator-runtime-not-replayed",
        "opencode-exact-clock-timestamp-format-not-proven",
        "opencode-workspace-filesystem-side-effects-not-replayed",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(snapshot.sourceRefs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-service",
        path: "packages/opencode/src/session/session.ts",
        symbols: expect.arrayContaining(["createDefaultTitle", "isDefaultTitle", "sessionPath"]),
      }),
      expect.objectContaining({
        id: "contracts-id-helper",
        path: "packages/contracts/src/ids.ts",
        symbols: expect.arrayContaining(["createID", "formatUuid", "uuidv7"]),
      }),
      expect.objectContaining({
        id: "local-identity-runtime-projection",
        path: "packages/contracts/src/port-fixtures.ts",
        symbols: expect.arrayContaining(["projectOpenCodeIdentityRuntimeProjection", "OpenCodeIdentityRuntimeProjection"]),
      }),
      expect.objectContaining({
        id: "local-identity-live-runtime-fixture",
        path: "packages/contracts/src/port-fixtures.ts",
        symbols: expect.arrayContaining(["captureOpenCodeIdentityLiveRuntimeFixture", "verifyOpenCodeIdentityLiveRuntimeFixture"]),
      }),
    ]))
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "local-id-kind-serialization")).toMatchObject({
      status: "partial",
      identityAtomIDs: ["opencode.identity.id-generator"],
      identityPortIDs: ["identity.id-generator"],
      knownGaps: expect.arrayContaining(["opencode-upstream-id-generator-runtime-not-replayed"]),
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "exact-clock-timestamp-format")).toMatchObject({
      status: "partial",
      identityAtomIDs: ["opencode.identity.clock-format"],
      identityPortIDs: ["identity.clock"],
      sourceRefIDs: expect.arrayContaining(["local-identity-runtime-projection"]),
      localEvidenceRefs: expect.arrayContaining([
        "opencode-identity:runtime-projection",
        "opencode-identity:live-runtime-fixture",
        "conformance:opencode-identity-clock-title-native-exact-fixture",
        "opencode-identity:clock-title-native-exact-fixture",
        openCodeIdentityNativeExactEvidenceRef,
        openCodeIdentityNativeExactFixtureID,
      ]),
      localMarkers: expect.arrayContaining(["clock-title:native-exact"]),
    })
  })

  it("projects OpenCode identity runtime signals into a lossy partial fixture", () => {
    const projection = projectOpenCodeIdentityRuntimeProjection([
      {
        type: "id.generated",
        idKind: "session",
        idValue: "ses_01HYABCDE1234567890",
        source: "Session.create",
        sequence: 2,
      },
      {
        type: "id.generated",
        idKind: "message",
        idValue: "msg_01HYABCDE1234567890",
        sequence: 1,
      },
      {
        type: "clock.timestamp",
        formatted: "2026-06-12T00:00:00.000Z",
        title: "New Session - 2026-06-12",
        timezone: "UTC",
        sequence: 3,
      },
      {
        type: "workspace.path",
        cwd: "/workspace/project",
        sessionPath: "/workspace/project/.opencode/session/ses_1",
        realpath: "/workspace/project",
        fsChecks: ["mkdir", "stat", "stat"],
        sequence: 4,
      },
    ])

    expect(projection).toMatchObject({
      schemaVersion: 1,
      fixtureID: "opencode-identity:runtime-projection",
      evidenceRef: "conformance:opencode-identity-runtime-projection",
      coveredBranchIDs: [
        "upstream-id-generator-runtime",
        "exact-clock-timestamp-format",
        "workspace-filesystem-side-effects",
      ],
      retainedFields: expect.arrayContaining(["idKind", "idPrefix", "idLength", "formatted", "titleObserved", "cwd", "sessionPath", "fsChecks"]),
      lossyFields: expect.arrayContaining([
        "native id generator entropy source",
        "wall-clock timestamp instant",
        "workspace realpath syscall side effects",
        "session directory fs create/read ordering",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-upstream-id-generator-runtime-not-replayed",
        "opencode-exact-clock-timestamp-format-not-proven",
        "opencode-workspace-filesystem-side-effects-not-replayed",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(projection.idRuntime).toEqual([
      { idKind: "message", idPrefix: "msg", idLength: 23, source: null, sequence: 1 },
      { idKind: "session", idPrefix: "ses", idLength: 23, source: "Session.create", sequence: 2 },
    ])
    expect(projection.clockRuntime).toEqual([
      { formatted: "2026-06-12T00:00:00.000Z", titleObserved: true, timezone: "UTC", sequence: 3 },
    ])
    expect(projection.workspaceRuntime).toEqual([
      {
        cwd: "/workspace/project",
        sessionPath: "/workspace/project/.opencode/session/ses_1",
        realpathObserved: true,
        fsChecks: ["mkdir", "stat"],
        sequence: 4,
      },
    ])
  })

  it("captures OpenCode identity live runtime fixture without promoting native parity", () => {
    const cwd = mkdtempSync(join(tmpdir(), "helix-opencode-identity-"))
    try {
      const fixture = captureOpenCodeIdentityLiveRuntimeFixture({
        cwd,
        seeds: {
          session: "01HYSESSIONFIXTURE",
          message: "01HYMESSAGEFIXTURE",
          part: "01HYPARTFIXTURE",
          workspace: "01HYWORKSPACEFIXTURE",
        },
        now: "2026-06-12T00:00:00.000Z",
        timezone: "UTC",
      })

      expect(verifyOpenCodeIdentityLiveRuntimeFixture(fixture)).toEqual({ ok: true, issues: [] })
      expect(fixture).toMatchObject({
        schemaVersion: 1,
        fixtureID: "opencode-identity:live-runtime-fixture",
        evidenceRef: "conformance:opencode-identity-live-runtime-fixture",
        upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
        exactDiffStatus: "live-runtime-partial",
        nativeParityClaim: false,
        capturedBranchIDs: expect.arrayContaining([
          "session-title-format",
          "session-path-workspace",
          "local-id-kind-serialization",
          "upstream-id-generator-runtime",
          "exact-clock-timestamp-format",
          "workspace-filesystem-side-effects",
        ]),
        retainedFields: expect.arrayContaining([
          "seeded local ID values and prefixes",
          "ISO clock readback",
          "normalized workspace/session path",
          "session directory existence before/after mkdir",
        ]),
        lossyFields: expect.arrayContaining([
          "upstream native ID entropy source",
          "exact upstream clock locale/timezone environment",
          "upstream workspace resolver syscall ordering",
        ]),
        knownGaps: expect.arrayContaining([
          "opencode-upstream-native-identity-runtime-not-spawned",
          "opencode-upstream-id-generator-entropy-not-proven",
          "opencode-workspace-filesystem-side-effects-not-upstream-exact",
        ]),
        fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      })
      expect(fixture.idReadback).toEqual([
        { kind: "session", value: "ses_01HYSESSIONFIXTURE", prefix: "ses", length: 22, seedProvided: true, sequence: 1 },
        { kind: "message", value: "msg_01HYMESSAGEFIXTURE", prefix: "msg", length: 22, seedProvided: true, sequence: 2 },
        { kind: "part", value: "prt_01HYPARTFIXTURE", prefix: "prt", length: 19, seedProvided: true, sequence: 3 },
        { kind: "workspace", value: "ws_01HYWORKSPACEFIXTURE", prefix: "ws", length: 23, seedProvided: true, sequence: 4 },
      ])
      expect(fixture.clockReadback).toEqual({
        isoTimestamp: "2026-06-12T00:00:00.000Z",
        timezone: "UTC",
        defaultTitle: "New Session",
        isDefaultTitle: true,
        sequence: 5,
      })
      expect(fixture.workspaceReadback).toMatchObject({
        cwd: "<cwd>",
        realpath: "<cwd>",
        sessionPath: "<cwd>/.opencode/session/ses_01HYSESSIONFIXTURE",
        sessionDirectoryBeforeExists: false,
        sessionDirectoryAfterExists: true,
        fsChecks: expect.arrayContaining(["exists:before", "mkdir:recursive", "exists:after", "realpath"]),
        sequence: 6,
      })

      const nativeClaim = { ...fixture, nativeParityClaim: true } as unknown as typeof fixture
      expect(verifyOpenCodeIdentityLiveRuntimeFixture(nativeClaim).issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "opencode-identity-live-runtime-fixture.native-claim" }),
      ]))

      const idDrop = {
        ...fixture,
        idReadback: fixture.idReadback.filter((item) => item.kind !== "session"),
      }
      expect(verifyOpenCodeIdentityLiveRuntimeFixture(idDrop).issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "opencode-identity-live-runtime-fixture.id-session" }),
      ]))

      const workspaceDrop = {
        ...fixture,
        workspaceReadback: {
          ...fixture.workspaceReadback,
          sessionDirectoryAfterExists: false,
        },
      }
      expect(verifyOpenCodeIdentityLiveRuntimeFixture(workspaceDrop).issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "opencode-identity-live-runtime-fixture.workspace" }),
      ]))

      const gapDrop = {
        ...fixture,
        knownGaps: fixture.knownGaps.filter((gap) => gap !== "opencode-upstream-native-identity-runtime-not-spawned"),
      }
      expect(verifyOpenCodeIdentityLiveRuntimeFixture(gapDrop).issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: "opencode-identity-live-runtime-fixture.native-gaps" }),
      ]))
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("anchors Pi, Nanobot, and Hermes identity bridges to product source matrix partial fixtures", () => {
    const snapshots = [
      buildPiIdentitySourceMatrixSnapshot(),
      buildNanobotIdentitySourceMatrixSnapshot(),
      buildHermesIdentitySourceMatrixSnapshot(),
    ]

    expect(snapshots.map((snapshot) => snapshot.product)).toEqual(["pi", "nanobot", "hermes"])
    for (const snapshot of snapshots) {
      const prefix = snapshot.product
      expect(snapshot).toMatchObject({
        schemaVersion: 1,
        evidenceRef: `conformance:${prefix}-identity-source-matrix`,
        fixtureID: `${prefix}-identity:source-matrix`,
        partialBranchIDs: expect.arrayContaining([
          "id-format-surface",
          "timestamp-format-surface",
          "workspace-path-surface",
          "title-serialization-surface",
        ]),
        missingBranchIDs: expect.arrayContaining([
          "upstream-id-generator-runtime",
          "exact-clock-runtime-format",
          "workspace-filesystem-side-effects",
        ]),
        coveredIdentityAtomIDs: expect.arrayContaining([
          `${prefix}.identity.clock-format`,
          `${prefix}.identity.id-generator`,
          `${prefix}.identity.workspace-resolver`,
        ]),
        coveredIdentityPortIDs: expect.arrayContaining(["identity.clock", "identity.id-generator", "identity.workspace-resolver"]),
        knownGaps: expect.arrayContaining([
          `${prefix}-identity-source-matrix-covered-by-partial-fixture`,
        ]),
        fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      })
      expect(snapshot.sourceRefs.some((ref) => ref.repo === "helix/local" && ref.path === "packages/contracts/src/port-fixtures.ts")).toBe(true)
      expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "id-format-surface")).toMatchObject({
        status: "partial",
        identityAtomIDs: [`${prefix}.identity.id-generator`],
        identityPortIDs: ["identity.id-generator"],
      })
      expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "exact-clock-runtime-format")).toMatchObject({
        status: "missing",
        identityAtomIDs: [`${prefix}.identity.clock-format`],
        identityPortIDs: ["identity.clock"],
      })
    }
  })

  it("records identity formatting round-trip positive and negative gates", () => {
    const snapshot = buildIdentityFormattingRoundTripGateSnapshot()
    const verification = verifyIdentityFormattingRoundTripGateSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:identity-formatting-round-trip-gate",
      fixtureID: "identity:formatting-round-trip-gate",
      products: ["opencode", "pi", "nanobot", "hermes"],
      comparisonDimensions: ["id-format", "timestamp-format", "workspace-path", "title-format", "serialization"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-identity:source-matrix",
      evidenceRefs: expect.arrayContaining([
        "conformance:opencode-identity-source-matrix",
        "contracts-schema:id-generator",
        ...openCodeIdentityNativeGateEvidenceRefs,
        ...openCodeIdentityNativeGateFixtureIDs,
      ]),
      nativeEvidenceRefs: expect.arrayContaining(openCodeIdentityNativeGateEvidenceRefs),
      fixtureIDs: expect.arrayContaining([
        "opencode-identity:source-matrix",
        ...openCodeIdentityNativeGateFixtureIDs,
      ]),
      formatRisk: "source-anchored-partial",
      knownLossiness: expect.arrayContaining(["opencode-identity-source-matrix-covered-by-partial-fixture"]),
      idFormat: expect.arrayContaining(["createID", "uuidv7"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi")?.sourceAnchors).toEqual(expect.arrayContaining([expect.stringContaining("pi-session-uuid:packages/agent/src/harness/session/uuid.ts")]))
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.workspacePath).toEqual(expect.arrayContaining(["get_workspace_path", "is_default_workspace"]))
    expect(snapshot.cases.find((item) => item.product === "hermes")?.timestampFormat).toEqual(expect.arrayContaining(["_format_updated_at", "_updated_at_sort_key"]))

    const idDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, idFormat: [] }
          : item,
      ),
    }
    expect(verifyIdentityFormattingRoundTripGateSnapshot(idDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting.id-format",
        product: "opencode",
        dimension: "id-format",
      }),
    ]))

    const workspaceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, workspacePath: [] }
          : item,
      ),
    }
    expect(verifyIdentityFormattingRoundTripGateSnapshot(workspaceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting.workspace-path",
        product: "nanobot",
        dimension: "workspace-path",
      }),
    ]))

    const harnessOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi"
          ? { ...item, formatRisk: "helix-only" as const }
          : item,
      ),
    }
    expect(verifyIdentityFormattingRoundTripGateSnapshot(harnessOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting.helix-only-format",
        product: "pi",
        dimension: "id-format",
      }),
    ]))

    const nativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeEvidenceRefs: [], fixtureIDs: [] }
          : item,
      ),
    }
    expect(verifyIdentityFormattingRoundTripGateSnapshot(nativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting.native-exact-evidence",
        product: "opencode",
        dimension: "id-format",
      }),
    ]))
  })

  it("records identity formatting exact-diff blockers without claiming native parity", () => {
    const snapshot = buildIdentityFormattingExactDiffBlockerSnapshot()
    const verification = verifyIdentityFormattingExactDiffBlockerSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:identity-formatting-exact-diff-blocker-gate",
      fixtureID: "identity:formatting-exact-diff-blocker-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi", "nanobot", "hermes"],
      comparisonDimensions: ["id-format", "timestamp-format", "workspace-path", "title-format", "serialization"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-identity:source-matrix",
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      idFormat: expect.arrayContaining(["createID", "uuidv7", "product-native-id-generator:not-exact"]),
      timestampFormat: expect.arrayContaining(["exact-clock-runtime:not-exact"]),
      sourceAnchors: expect.arrayContaining(["session-service:packages/opencode/src/session/session.ts"]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-identity-source-matrix",
        "contracts-schema:id-generator",
        ...openCodeIdentityNativeGateEvidenceRefs,
        ...openCodeIdentityNativeGateFixtureIDs,
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-identity:source-matrix",
        ...openCodeIdentityNativeGateFixtureIDs,
      ]),
      exactDiffRisk: "semantic-fixture-needs-exact-diff",
    })
    expect(snapshot.cases.find((item) => item.product === "pi")).toMatchObject({
      sourceAnchors: expect.arrayContaining(["pi-session-uuid:packages/agent/src/harness/session/uuid.ts"]),
      idFormat: expect.arrayContaining(["product-native-id-generator:not-exact"]),
      titleFormat: expect.arrayContaining(["title-generation:not-exact"]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")).toMatchObject({
      workspacePath: expect.arrayContaining(["get_workspace_path", "is_default_workspace", "workspace-filesystem-side-effects:not-exact"]),
    })
    expect(snapshot.cases.find((item) => item.product === "hermes")).toMatchObject({
      timestampFormat: expect.arrayContaining(["_format_updated_at", "_updated_at_sort_key", "exact-clock-runtime:not-exact"]),
      serialization: expect.arrayContaining(["persisted-readback:not-exact"]),
    })

    const idDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, idFormat: [] }
          : item,
      ),
    }
    expect(verifyIdentityFormattingExactDiffBlockerSnapshot(idDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting-exact-diff.id-format",
        product: "opencode",
        dimension: "id-format",
      }),
    ]))

    const timestampDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes"
          ? { ...item, timestampFormat: [] }
          : item,
      ),
    }
    expect(verifyIdentityFormattingExactDiffBlockerSnapshot(timestampDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting-exact-diff.timestamp-format",
        product: "hermes",
        dimension: "timestamp-format",
      }),
    ]))

    const workspaceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, workspacePath: [] }
          : item,
      ),
    }
    expect(verifyIdentityFormattingExactDiffBlockerSnapshot(workspaceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting-exact-diff.workspace-path",
        product: "nanobot",
        dimension: "workspace-path",
      }),
    ]))

    const titleDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi"
          ? { ...item, titleFormat: [] }
          : item,
      ),
    }
    expect(verifyIdentityFormattingExactDiffBlockerSnapshot(titleDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting-exact-diff.title-format",
        product: "pi",
        dimension: "title-format",
      }),
    ]))

    const serializationDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, serialization: [] }
          : item,
      ),
    }
    expect(verifyIdentityFormattingExactDiffBlockerSnapshot(serializationDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting-exact-diff.serialization",
        product: "opencode",
        dimension: "serialization",
      }),
    ]))

    const nativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeEvidenceRefs: [], fixtureIDs: [] }
          : item,
      ),
    }
    expect(verifyIdentityFormattingExactDiffBlockerSnapshot(nativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting-exact-diff.native-exact-evidence",
        product: "opencode",
        dimension: "id-format",
      }),
    ]))

    const nativeClaim = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes"
          ? { ...item, nativeParityClaim: true as false }
          : item,
      ),
    }
    expect(verifyIdentityFormattingExactDiffBlockerSnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting-exact-diff.native-claim",
        product: "hermes",
        dimension: "id-format",
      }),
    ]))

    const harnessOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi"
          ? { ...item, exactDiffRisk: "helix-only" as const }
          : item,
      ),
    }
    expect(verifyIdentityFormattingExactDiffBlockerSnapshot(harnessOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting-exact-diff.helix-only",
        product: "pi",
        dimension: "id-format",
      }),
    ]))
  })

  it("records identity formatting pinned replay fixtures without upgrading native parity", () => {
    const snapshot = buildIdentityFormattingPinnedReplaySnapshot()
    const verification = verifyIdentityFormattingPinnedReplaySnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:identity-formatting-pinned-replay-gate",
      fixtureID: "identity:formatting-pinned-replay-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi", "nanobot", "hermes"],
      comparisonDimensions: ["id-format", "timestamp-format", "workspace-path", "title-format", "serialization"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-identity:source-matrix",
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      exactDiffRisk: "pinned-formatting-replay-needs-live-native-runtime",
      upstreamRecords: expect.arrayContaining([
        expect.objectContaining({ dimension: "id-format", value: "opencode:sessionID:ses_pinned_01/createID(uuidv7)", sourceAnchor: "session-service:createDefaultTitle" }),
        expect.objectContaining({ dimension: "serialization", sourceAnchor: "session-service:Session" }),
      ]),
      productReplayRecords: expect.arrayContaining([
        expect.objectContaining({ dimension: "timestamp-format", evidenceAnchor: "opencode-identity:runtime-projection" }),
      ]),
      replayAnchors: expect.arrayContaining([
        "conformance:opencode-identity-source-matrix",
        "opencode-identity:source-matrix",
        "contracts-schema:id-generator",
        ...openCodeIdentityNativeGateEvidenceRefs,
        ...openCodeIdentityNativeGateFixtureIDs,
      ]),
      sourceAnchors: expect.arrayContaining(["session-service:packages/opencode/src/session/session.ts"]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-identity-source-matrix",
        "contracts-schema:id-generator",
        ...openCodeIdentityNativeGateEvidenceRefs,
        ...openCodeIdentityNativeGateFixtureIDs,
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-identity:source-matrix",
        ...openCodeIdentityNativeGateFixtureIDs,
      ]),
      knownLossiness: expect.arrayContaining(["identity-formatting-pinned-replay-live-native-id-generator-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi")).toMatchObject({
      upstreamRecords: expect.arrayContaining([
        expect.objectContaining({ dimension: "id-format", sourceAnchor: "pi-session-uuid:uuid" }),
        expect.objectContaining({ dimension: "workspace-path", sourceAnchor: "pi-agent-harness:workspace" }),
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")).toMatchObject({
      upstreamRecords: expect.arrayContaining([
        expect.objectContaining({ dimension: "workspace-path", sourceAnchor: "nanobot-config-paths:get_workspace_path" }),
        expect.objectContaining({ dimension: "serialization", sourceAnchor: "nanobot-goal-state:parse_goal_state" }),
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "hermes")).toMatchObject({
      upstreamRecords: expect.arrayContaining([
        expect.objectContaining({ dimension: "timestamp-format", sourceAnchor: "hermes-acp-session:_format_updated_at" }),
        expect.objectContaining({ dimension: "serialization", sourceAnchor: "hermes-acp-session:_persist" }),
      ]),
    })

    const idDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              productReplayRecords: item.productReplayRecords.map((record) =>
                record.dimension === "id-format"
                  ? { ...record, value: "opencode:sessionID:drifted" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyIdentityFormattingPinnedReplaySnapshot(idDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting-pinned-replay.id-format",
        product: "opencode",
        dimension: "id-format",
      }),
    ]))

    const timestampDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes"
          ? {
              ...item,
              assembledRecords: item.assembledRecords.map((record) =>
                record.dimension === "timestamp-format"
                  ? { ...record, value: "hermes:updated_at:local-clock" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyIdentityFormattingPinnedReplaySnapshot(timestampDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting-pinned-replay.timestamp-format",
        product: "hermes",
        dimension: "timestamp-format",
      }),
    ]))

    const workspaceDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? {
              ...item,
              assembledRecords: item.assembledRecords.map((record) =>
                record.dimension === "workspace-path"
                  ? { ...record, value: "nanobot:workspace:/tmp/helix-only" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyIdentityFormattingPinnedReplaySnapshot(workspaceDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting-pinned-replay.workspace-path",
        product: "nanobot",
        dimension: "workspace-path",
      }),
    ]))

    const titleDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi"
          ? {
              ...item,
              productReplayRecords: item.productReplayRecords.map((record) =>
                record.dimension === "title-format"
                  ? { ...record, value: "pi:initial-message-title:local-only" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyIdentityFormattingPinnedReplaySnapshot(titleDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting-pinned-replay.title-format",
        product: "pi",
        dimension: "title-format",
      }),
    ]))

    const serializationDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes"
          ? {
              ...item,
              assembledRecords: item.assembledRecords.map((record) =>
                record.dimension === "serialization"
                  ? { ...record, value: "hermes:persisted-session:{id,title}" }
                  : record,
              ),
            }
          : item,
      ),
    }
    expect(verifyIdentityFormattingPinnedReplaySnapshot(serializationDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting-pinned-replay.serialization",
        product: "hermes",
        dimension: "serialization",
      }),
    ]))

    const nativeClaim = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeParityClaim: true as false }
          : item,
      ),
    }
    expect(verifyIdentityFormattingPinnedReplaySnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting-pinned-replay.native-claim",
        product: "opencode",
        dimension: "id-format",
      }),
    ]))

    const nativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeEvidenceRefs: [], fixtureIDs: [] }
          : item,
      ),
    }
    expect(verifyIdentityFormattingPinnedReplaySnapshot(nativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting-pinned-replay.native-exact-evidence",
        product: "opencode",
        dimension: "id-format",
      }),
    ]))

    const harnessOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi"
          ? { ...item, exactDiffRisk: "helix-only" as const }
          : item,
      ),
    }
    expect(verifyIdentityFormattingPinnedReplaySnapshot(harnessOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting-pinned-replay.helix-only",
        product: "pi",
        dimension: "id-format",
      }),
    ]))

    const borrowedSourceMatrix = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, sourceAnchors: ["opencode-session-service:packages/opencode/src/session/session.ts"] }
          : item,
      ),
    }
    expect(verifyIdentityFormattingPinnedReplaySnapshot(borrowedSourceMatrix).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-formatting-pinned-replay.borrowed-source-matrix",
        product: "nanobot",
        dimension: "id-format",
      }),
    ]))
  })

  it("guards identity public exports as partial lossy fixtures", () => {
    const surface = buildIdentityPublicExportSurfaceGuard()
    const verification = verifyIdentityPublicExportSurfaceGuard(surface)

    expect(surface).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:identity-public-export-surface-guard",
      fixtureID: "identity:public-export-surface-guard",
      publicSurfacePolicy: "partial-lossy-only",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      exportedBuilders: [
        "buildIdentityFormattingRoundTripGateSnapshot",
        "buildIdentityFormattingExactDiffBlockerSnapshot",
        "buildIdentityFormattingPinnedReplaySnapshot",
      ],
      exportedVerifiers: [
        "verifyIdentityFormattingRoundTripGateSnapshot",
        "verifyIdentityFormattingExactDiffBlockerSnapshot",
        "verifyIdentityFormattingPinnedReplaySnapshot",
      ],
      comparisonDimensions: ["id-format", "timestamp-format", "workspace-path", "title-format", "serialization"],
      fixtureRefs: expect.arrayContaining([
        expect.objectContaining({
          fixtureID: "identity:formatting-round-trip-gate",
          exposure: "partial-lossy-fixture",
          exactDiffStatus: "exact-diff-partial",
          nativeParityClaim: false,
          knownLossiness: expect.arrayContaining(["identity-public-export-surface-native-parity-not-proven"]),
          fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        }),
        expect.objectContaining({
          fixtureID: "identity:formatting-exact-diff-blocker-gate",
          exposure: "partial-lossy-fixture",
          exactDiffStatus: "exact-diff-partial",
          nativeParityClaim: false,
          knownLossiness: expect.arrayContaining(["identity-native-id-generator-not-proven"]),
        }),
        expect.objectContaining({
          fixtureID: "identity:formatting-pinned-replay-gate",
          exposure: "partial-lossy-fixture",
          exactDiffStatus: "exact-diff-partial",
          nativeParityClaim: false,
          knownLossiness: expect.arrayContaining(["identity-formatting-pinned-replay-live-native-id-generator-not-proven"]),
        }),
      ]),
      nativeBlockers: expect.arrayContaining([
        "product-native-id-generator:not-proven",
        "exact-clock-runtime:not-proven",
        "persisted-product-readback:not-proven",
      ]),
    })
    expect(verification).toEqual({ ok: true, issues: [] })

    const nativeClaim = {
      ...surface,
      nativeParityClaim: true as false,
    }
    expect(verifyIdentityPublicExportSurfaceGuard(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "identity-public-export.native-claim" }),
    ]))

    const builderDrop = {
      ...surface,
      exportedBuilders: surface.exportedBuilders.filter((builder) => builder !== "buildIdentityFormattingPinnedReplaySnapshot"),
    }
    expect(verifyIdentityPublicExportSurfaceGuard(builderDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-public-export.builder",
        exportedName: "buildIdentityFormattingPinnedReplaySnapshot",
      }),
    ]))

    const fixtureNativeClaim = {
      ...surface,
      fixtureRefs: surface.fixtureRefs.map((fixtureRef) =>
        fixtureRef.fixtureID === "identity:formatting-pinned-replay-gate"
          ? { ...fixtureRef, nativeParityClaim: true as false }
          : fixtureRef,
      ),
    }
    expect(verifyIdentityPublicExportSurfaceGuard(fixtureNativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-public-export.fixture-native-claim",
        fixtureID: "identity:formatting-pinned-replay-gate",
      }),
    ]))

    const lossinessDrop = {
      ...surface,
      fixtureRefs: surface.fixtureRefs.map((fixtureRef) =>
        fixtureRef.fixtureID === "identity:formatting-round-trip-gate"
          ? { ...fixtureRef, knownLossiness: [] }
          : fixtureRef,
      ),
    }
    expect(verifyIdentityPublicExportSurfaceGuard(lossinessDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "identity-public-export.lossiness",
        fixtureID: "identity:formatting-round-trip-gate",
      }),
    ]))

    const misleadingSummary = {
      ...surface,
      summary: "identity native parity complete",
    }
    expect(verifyIdentityPublicExportSurfaceGuard(misleadingSummary).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "identity-public-export.summary" }),
    ]))
  })

  it("anchors OpenCode product shell bridges to pinned upstream shell sources", () => {
    const snapshot = buildOpenCodeProductShellSourceMatrixSnapshot()

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      pinnedRepo: "anomalyco/opencode",
      pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-product-shell-source-matrix",
      fixtureID: "opencode-product-shell:source-matrix",
      partialBranchIDs: expect.arrayContaining([
        "harness-surface-assembly",
        "sdk-run-turn-surface",
        "server-api-routes",
        "slack-command-surface",
        "shell-env-helper",
        "workspace-snapshot-surface",
        "control-plane-snapshot-surface",
        "desktop-shell-bundle-surface",
        "native-cli-pty-transcript",
        "native-web-state-replay",
        "native-server-route-runtime",
        "session-readback-side-effects",
        "shell-env-side-effects",
      ]),
      missingBranchIDs: [],
      coveredProductShellAtomIDs: expect.arrayContaining([
        "opencode.product-shell.harness",
        "opencode.product-shell.sdk",
        "opencode.product-shell.server",
        "opencode.product-shell.slack",
        "opencode.product-shell.control-plane",
        "opencode.product-shell.desktop",
        "opencode.product-shell.workspace",
        "opencode.shell.env-bridge",
      ]),
      coveredProductShellPortIDs: expect.arrayContaining(["product.shell", "process-runner.port"]),
      knownGaps: expect.arrayContaining([
        "opencode-product-shell-source-matrix-covered-by-partial-fixture",
        "opencode-product-shell-live-runtime-fixture-partial-native-gap",
        "opencode-native-cli-pty-transcript-not-replayed",
        "opencode-native-web-state-replay-not-proven",
        "opencode-native-server-route-runtime-not-replayed",
        "opencode-product-shell-session-readback-not-replayed",
        "opencode-shell-env-side-effects-not-replayed",
        "opencode-control-plane-native-status-runtime-not-replayed",
        "opencode-desktop-native-shell-runtime-not-replayed",
        "opencode-workspace-native-project-state-not-replayed",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(snapshot.coveredProductShellAtomIDs).not.toEqual(expect.arrayContaining([
      "opencode.product-shell.tui",
      "opencode.product-shell.web",
    ]))
    expect(snapshot.sourceRefs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "cli-bootstrap",
        path: "packages/opencode/src/cli/bootstrap.ts",
        symbols: ["bootstrap"],
      }),
      expect.objectContaining({
        id: "tui-app",
        path: "packages/opencode/src/cli/cmd/tui/app.tsx",
        symbols: expect.arrayContaining(["rendererConfig", "errorMessage", "tui", "App"]),
      }),
      expect.objectContaining({
        id: "web-app",
        path: "packages/app/src/app.tsx",
        symbols: expect.arrayContaining(["UiI18nBridge", "QueryProvider", "AppBaseProviders", "ConnectionGate", "AppInterface"]),
      }),
      expect.objectContaining({
        id: "server-listener",
        path: "packages/opencode/src/server/server.ts",
        symbols: expect.arrayContaining(["Listener", "Default", "openapi", "listen"]),
      }),
      expect.objectContaining({
        id: "api-spec",
        path: "packages/opencode/specs/v2/api.ts",
        symbols: expect.arrayContaining(["opencode", "sessionID"]),
      }),
      expect.objectContaining({
        id: "local-sdk",
        path: "packages/adapters-opencode/src/opencode-sdk.ts",
        symbols: expect.arrayContaining(["createOpenCodeSDK", "runTurn"]),
      }),
      expect.objectContaining({
        id: "local-server",
        path: "packages/adapters-opencode/src/opencode-server.ts",
        symbols: expect.arrayContaining(["createOpenCodeServer", "openCodeServerRoutes"]),
      }),
      expect.objectContaining({
        id: "local-control-plane",
        path: "packages/adapters-opencode/src/opencode-control-plane.ts",
        symbols: expect.arrayContaining(["createOpenCodeControlPlane", "snapshot", "openCodeServerRoutes"]),
      }),
      expect.objectContaining({
        id: "local-web",
        path: "packages/adapters-opencode/src/opencode-web.ts",
        symbols: expect.arrayContaining(["createOpenCodeWeb", "createOpenCodeWebFromSDK", "render"]),
      }),
      expect.objectContaining({
        id: "local-desktop",
        path: "packages/adapters-opencode/src/opencode-desktop.ts",
        symbols: expect.arrayContaining(["createOpenCodeDesktop", "renderOpenCodeDesktopShellHTML", "writeBundle"]),
      }),
      expect.objectContaining({
        id: "local-slack",
        path: "packages/adapters-opencode/src/opencode-slack.ts",
        symbols: expect.arrayContaining(["createOpenCodeSlackFromSDK", "handleCommand"]),
      }),
      expect.objectContaining({
        id: "local-plugin-atoms",
        path: "packages/adapters-opencode/src/plugin-atoms.ts",
        symbols: expect.arrayContaining(["createOpenCodeShellDollar", "createOpenCodeSpecialAtomProfile"]),
      }),
      expect.objectContaining({
        id: "local-product-shell-runtime-projection",
        path: "packages/contracts/src/port-fixtures.ts",
        symbols: expect.arrayContaining(["projectOpenCodeProductShellRuntimeProjection"]),
      }),
      expect.objectContaining({
        id: "local-product-shell-live-runtime-fixture",
        path: "packages/contracts/src/port-fixtures.ts",
        symbols: expect.arrayContaining(["captureOpenCodeProductShellLiveRuntimeFixture", "verifyOpenCodeProductShellLiveRuntimeFixture", "OpenCodeProductShellLiveRuntimeFixture"]),
      }),
    ]))
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "sdk-run-turn-surface")).toMatchObject({
      status: "partial",
      productShellAtomIDs: ["opencode.product-shell.sdk"],
      productShellPortIDs: ["product.shell"],
      sourceRefIDs: expect.arrayContaining(["server-listener", "api-spec", "local-sdk"]),
      knownGaps: expect.arrayContaining(["opencode-sdk-run-turn-native-session-readback-not-replayed"]),
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "workspace-snapshot-surface")).toMatchObject({
      status: "partial",
      productShellAtomIDs: ["opencode.product-shell.workspace"],
      productShellPortIDs: ["product.shell"],
      sourceRefIDs: expect.arrayContaining(["local-workspace", "local-plugin-atoms"]),
      knownGaps: expect.arrayContaining(["opencode-workspace-native-project-state-not-replayed"]),
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "control-plane-snapshot-surface")).toMatchObject({
      status: "partial",
      productShellAtomIDs: ["opencode.product-shell.control-plane"],
      productShellPortIDs: ["product.shell"],
      sourceRefIDs: expect.arrayContaining(["server-listener", "api-spec", "local-control-plane"]),
      knownGaps: expect.arrayContaining(["opencode-control-plane-native-status-runtime-not-replayed"]),
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "desktop-shell-bundle-surface")).toMatchObject({
      status: "partial",
      productShellAtomIDs: ["opencode.product-shell.desktop"],
      productShellPortIDs: ["product.shell"],
      sourceRefIDs: expect.arrayContaining(["web-app", "local-web", "local-desktop"]),
      knownGaps: expect.arrayContaining(["opencode-desktop-native-shell-runtime-not-replayed"]),
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "shell-env-side-effects")).toMatchObject({
      status: "partial",
      productShellAtomIDs: ["opencode.shell.env-bridge"],
      productShellPortIDs: ["process-runner.port"],
      localEvidenceRefs: expect.arrayContaining(["opencode-product-shell:runtime-projection"]),
      knownGaps: expect.arrayContaining(["opencode-product-shell-live-runtime-fixture-partial-native-gap", "opencode-shell-env-side-effects-not-replayed"]),
    })
  })

  it("projects OpenCode product shell runtime signals into a lossy partial fixture", () => {
    const projection = projectOpenCodeProductShellRuntimeProjection([
      {
        type: "cli.pty",
        command: "opencode run",
        chunk: "assistant response",
        exitCode: 0,
      },
      {
        type: "web.state",
        route: "/session/sess-1",
        stateKeys: ["messages", "connection", "messages"],
      },
      {
        type: "server.route",
        method: "post",
        path: "/v1/session/sess-1/message",
        status: 200,
      },
      {
        type: "session.readback",
        sessionID: "sess-1",
        fields: ["id", "messages", "updatedAt", "messages"],
      },
      {
        type: "shell.env",
        cwd: "/workspace",
        envKeys: ["OPENCODE_CONFIG", "PATH", "PATH"],
        command: "echo ok",
      },
    ])

    expect(projection).toMatchObject({
      schemaVersion: 1,
      fixtureID: "opencode-product-shell:runtime-projection",
      evidenceRef: "conformance:opencode-product-shell-runtime-projection",
      coveredBranchIDs: [
        "native-cli-pty-transcript",
        "native-web-state-replay",
        "native-server-route-runtime",
        "session-readback-side-effects",
        "shell-env-side-effects",
      ],
      retainedFields: expect.arrayContaining(["command", "chunkClass", "route", "status", "sessionID", "envKeys"]),
      lossyFields: expect.arrayContaining([
        "raw PTY byte stream",
        "browser DOM lifecycle",
        "native server listener lifecycle",
        "subprocess environment side effects",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-native-cli-pty-transcript-not-replayed",
        "opencode-native-web-state-replay-not-proven",
        "opencode-native-server-route-runtime-not-replayed",
        "opencode-product-shell-session-readback-not-replayed",
        "opencode-shell-env-side-effects-not-replayed",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(projection.cliTranscript).toEqual([
      { command: "opencode run", chunkClass: "text", exitCode: 0 },
    ])
    expect(projection.webState).toEqual([
      { route: "/session/sess-1", stateKeys: ["connection", "messages"] },
    ])
    expect(projection.serverRoutes).toEqual([
      { method: "POST", path: "/v1/session/sess-1/message", status: 200 },
    ])
    expect(projection.sessionReadback).toEqual([
      { sessionID: "sess-1", fields: ["id", "messages", "updatedAt"] },
    ])
    expect(projection.shellEnv).toEqual([
      { cwdObserved: true, envKeys: ["OPENCODE_CONFIG", "PATH"], commandObserved: true },
    ])
  })

  it("captures OpenCode product shell live runtime readback without claiming native parity", () => {
    const fixture = captureOpenCodeProductShellLiveRuntimeFixture({
      command: "opencode run",
      cliChunk: "assistant response",
      route: "/session/sess_shell_fixture",
      stateKeys: ["messages", "connection", "messages"],
      method: "post",
      path: "/v1/session/sess_shell_fixture/message",
      status: 200,
      sessionID: "sess_shell_fixture",
      sessionFields: ["id", "messages", "updatedAt", "messages"],
      cwd: "/workspace/opencode",
      envKeys: ["OPENCODE_CONFIG", "PATH", "PATH"],
      shellCommand: "echo ok",
    })

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      evidenceRef: "conformance:opencode-product-shell-live-runtime-fixture",
      fixtureID: "opencode-product-shell:live-runtime-fixture",
      exactDiffStatus: "live-runtime-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      fixtureDiffTarget: "product-shell.cli-api-pty-transcript",
      relatedFixtureDiffTargets: expect.arrayContaining(["ui.tui-interaction-replay", "session.storage-round-trip"]),
      coveredBranchIDs: expect.arrayContaining([
        "harness-surface-assembly",
        "sdk-run-turn-surface",
        "server-api-routes",
        "slack-command-surface",
        "shell-env-helper",
        "workspace-snapshot-surface",
        "control-plane-snapshot-surface",
        "desktop-shell-bundle-surface",
        "native-cli-pty-transcript",
        "native-web-state-replay",
        "native-server-route-runtime",
        "session-readback-side-effects",
        "shell-env-side-effects",
      ]),
      productShellRuntimeProjection: expect.objectContaining({
        fixtureID: "opencode-product-shell:runtime-projection",
        evidenceRef: "conformance:opencode-product-shell-runtime-projection",
      }),
      knownGaps: expect.arrayContaining([
        "opencode-product-shell-live-runtime-fixture-partial-native-gap",
        "opencode-native-cli-pty-transcript-not-replayed",
        "opencode-native-web-state-replay-not-proven",
        "opencode-native-server-route-runtime-not-replayed",
        "opencode-product-shell-session-readback-not-replayed",
        "opencode-shell-env-side-effects-not-replayed",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.ptyReadback).toEqual([
      expect.objectContaining({ command: "opencode run", chunkClass: "text", terminalMode: "alternate-screen", exitCode: 0, transcriptHash: expect.stringMatching(/^[a-f0-9]{16}$/) }),
    ])
    expect(fixture.webStateReadback).toEqual([
      expect.objectContaining({ route: "/session/sess_shell_fixture", stateKeys: ["connection", "messages"], hydrationMarker: "client-hydrated", stateHash: expect.stringMatching(/^[a-f0-9]{16}$/) }),
    ])
    expect(fixture.serverRouteReadback).toEqual([
      expect.objectContaining({ method: "POST", path: "/v1/session/sess_shell_fixture/message", status: 200, listenerMarker: "local-route-table", routeHash: expect.stringMatching(/^[a-f0-9]{16}$/) }),
    ])
    expect(fixture.sessionReadback).toEqual([
      expect.objectContaining({ sessionID: "sess_shell_fixture", fields: ["id", "messages", "updatedAt"], storageMarker: "sqlite-readback", readbackHash: expect.stringMatching(/^[a-f0-9]{16}$/) }),
    ])
    expect(fixture.shellEnvReadback).toEqual([
      expect.objectContaining({ cwdObserved: true, envKeys: ["OPENCODE_CONFIG", "PATH"], commandObserved: true, subprocessMarker: "shell-env-projected", envHash: expect.stringMatching(/^[a-f0-9]{16}$/) }),
    ])
    expect(verifyOpenCodeProductShellLiveRuntimeFixture(fixture)).toEqual({ ok: true, issues: [] })

    const nativeClaim = { ...fixture, nativeParityClaim: true } as unknown as typeof fixture
    expect(verifyOpenCodeProductShellLiveRuntimeFixture(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-product-shell-live-runtime.native-claim" }),
    ]))
    const missingPTYReadback = { ...fixture, ptyReadback: [] }
    expect(verifyOpenCodeProductShellLiveRuntimeFixture(missingPTYReadback).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-product-shell-live-runtime.pty-readback" }),
    ]))
    const missingServerReadback = { ...fixture, serverRouteReadback: [] }
    expect(verifyOpenCodeProductShellLiveRuntimeFixture(missingServerReadback).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-product-shell-live-runtime.server-readback" }),
    ]))
    const missingNativeGap = {
      ...fixture,
      knownGaps: fixture.knownGaps.filter((gap) => gap !== "opencode-product-shell-live-runtime-fixture-partial-native-gap"),
    }
    expect(verifyOpenCodeProductShellLiveRuntimeFixture(missingNativeGap).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-product-shell-live-runtime.native-gaps" }),
    ]))
  })

  it("anchors Pi, Nanobot, and Hermes product shell bridges to pinned upstream shell sources", () => {
    const snapshots = [
      {
        snapshot: buildPiProductShellSourceMatrixSnapshot(),
        product: "pi",
        upstreamRef: "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        pinnedRepo: "earendil-works/pi",
        pinnedRef: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        evidenceRef: "conformance:pi-product-shell-source-matrix",
        fixtureID: "pi-product-shell:source-matrix",
        partialBranchIDs: [
          "harness-surface-assembly",
          "sdk-run-turn-surface",
          "cli-command-surface",
          "rpc-or-acp-route-surface",
          "server-api-routes",
          "web-ui-static-session-export",
          "browser-smoke-bundle-gate",
          "release-hardening-shrinkwrap",
        ],
        atomIDs: [
          "pi.product-shell.browser-smoke",
          "pi.product-shell.cli",
          "pi.product-shell.harness",
          "pi.product-shell.release-hardening",
          "pi.product-shell.rpc",
          "pi.product-shell.sdk",
          "pi.product-shell.server",
          "pi.product-shell.web-ui",
        ],
        nativeCliAtomIDs: ["pi.product-shell.cli", "pi.product-shell.harness", "pi.product-shell.rpc", "pi.product-shell.sdk", "pi.product-shell.server"],
        sourceRef: {
          id: "upstream-cli",
          path: "packages/coding-agent/src/cli.ts",
          symbols: expect.arrayContaining(["APP_NAME", "configureHttpDispatcher", "main"]),
        },
      },
      {
        snapshot: buildNanobotProductShellSourceMatrixSnapshot(),
        product: "nanobot",
        upstreamRef: "upstream:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        pinnedRepo: "HKUDS/nanobot",
        pinnedRef: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        evidenceRef: "conformance:nanobot-product-shell-source-matrix",
        fixtureID: "nanobot-product-shell:source-matrix",
        partialBranchIDs: ["harness-surface-assembly", "sdk-run-turn-surface", "cli-command-surface", "server-api-routes"],
        atomIDs: ["nanobot.product-shell.cli", "nanobot.product-shell.harness", "nanobot.product-shell.sdk", "nanobot.product-shell.server"],
        nativeCliAtomIDs: ["nanobot.product-shell.cli", "nanobot.product-shell.harness", "nanobot.product-shell.sdk", "nanobot.product-shell.server"],
        sourceRef: {
          id: "upstream-cli",
          path: "nanobot/cli/commands.py",
          symbols: expect.arrayContaining(["main", "onboard", "serve", "gateway"]),
        },
      },
      {
        snapshot: buildHermesProductShellSourceMatrixSnapshot(),
        product: "hermes",
        upstreamRef: "upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
        pinnedRepo: "NousResearch/hermes-agent",
        pinnedRef: "92a567db2d7a5031df8211efbfdad864c2f51faf",
        evidenceRef: "conformance:hermes-product-shell-source-matrix",
        fixtureID: "hermes-product-shell:source-matrix",
        partialBranchIDs: ["harness-surface-assembly", "sdk-run-turn-surface", "cli-command-surface", "rpc-or-acp-route-surface", "server-api-routes", "gateway-surface"],
        atomIDs: ["hermes.product-shell.acp", "hermes.product-shell.api-server", "hermes.product-shell.cli", "hermes.product-shell.gateway", "hermes.product-shell.harness", "hermes.product-shell.sdk"],
        nativeCliAtomIDs: ["hermes.product-shell.acp", "hermes.product-shell.api-server", "hermes.product-shell.cli", "hermes.product-shell.gateway", "hermes.product-shell.harness", "hermes.product-shell.sdk"],
        sourceRef: {
          id: "upstream-cli",
          path: "cli.py",
          symbols: expect.arrayContaining(["HermesCLI", "ChatConsole", "main", "run"]),
        },
      },
    ] as const

    for (const { snapshot, product, upstreamRef, pinnedRepo, pinnedRef, evidenceRef, fixtureID, partialBranchIDs, atomIDs, nativeCliAtomIDs, sourceRef } of snapshots) {
      expect(snapshot).toMatchObject({
        schemaVersion: 1,
        product,
        upstreamRef,
        pinnedRepo,
        pinnedRef,
        evidenceRef,
        fixtureID,
        partialBranchIDs: expect.arrayContaining(Array.from(partialBranchIDs)),
        missingBranchIDs: expect.arrayContaining([
          "native-cli-pty-transcript",
          "native-server-route-runtime",
          "session-readback-side-effects",
        ]),
        coveredProductShellAtomIDs: expect.arrayContaining(Array.from(atomIDs)),
        coveredProductShellPortIDs: ["product.shell"],
        knownGaps: expect.arrayContaining([
          `${product}-product-shell-source-matrix-covered-by-partial-fixture`,
          `${product}-native-cli-pty-transcript-not-replayed`,
          `${product}-native-server-route-runtime-not-replayed`,
          `${product}-product-shell-session-readback-not-replayed`,
        ]),
        fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      })
      expect(snapshot.sourceRefs).toEqual(expect.arrayContaining([expect.objectContaining(sourceRef)]))
      expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "native-cli-pty-transcript")).toMatchObject({
        status: "missing",
        productShellAtomIDs: expect.arrayContaining(Array.from(nativeCliAtomIDs)),
        productShellPortIDs: ["product.shell"],
      })
    }
  })

  it("anchors OpenCode UI bridges to pinned upstream TUI and local UI sources", () => {
    const snapshot = buildOpenCodeUISourceMatrixSnapshot()

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      pinnedRepo: "anomalyco/opencode",
      pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-ui-source-matrix",
      fixtureID: "opencode-ui:source-matrix",
      partialBranchIDs: expect.arrayContaining([
        "command-route-surface",
        "input-keymap-surface",
        "renderer-message-surface",
        "theme-registry-surface",
        "snapshot-state-surface",
        "native-pty-input-transcript",
        "native-render-tree-snapshot",
        "native-theme-palette-runtime",
        "native-command-side-effects",
        "native-focus-resize-timing",
      ]),
      missingBranchIDs: [],
      coveredUIAtomIDs: expect.arrayContaining([
        "opencode.ui.command-router",
        "opencode.ui.input-normalizer",
        "opencode.ui.renderer",
        "opencode.ui.snapshot",
        "opencode.ui.theme-registry",
      ]),
      coveredUIPortIDs: expect.arrayContaining(["ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"]),
      knownGaps: expect.arrayContaining([
        "opencode-ui-source-matrix-covered-by-partial-fixture",
        "opencode-ui-native-pty-input-transcript-not-replayed",
        "opencode-ui-native-render-tree-snapshot-not-replayed",
        "opencode-ui-native-theme-palette-runtime-not-replayed",
        "opencode-ui-command-side-effects-not-replayed",
        "opencode-ui-native-focus-resize-timing-not-replayed",
        "opencode-ui-live-runtime-fixture-partial-native-gap",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(snapshot.sourceRefs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tui-app-shell",
        path: "packages/opencode/src/cli/cmd/tui/app.tsx",
        symbols: expect.arrayContaining(["appBindingCommands", "rendererConfig", "tui", "App"]),
      }),
      expect.objectContaining({
        id: "tui-keymap",
        path: "packages/opencode/src/cli/cmd/tui/keymap.tsx",
        symbols: expect.arrayContaining(["COMMAND_PALETTE_COMMAND", "registerOpencodeKeymap", "useBindings"]),
      }),
      expect.objectContaining({
        id: "tui-session-route",
        path: "packages/opencode/src/cli/cmd/tui/routes/session/index.tsx",
        symbols: expect.arrayContaining(["Session", "sessionBindingCommands"]),
      }),
      expect.objectContaining({
        id: "local-ui-atoms",
        path: "packages/lego-ui/src/ui-atoms.ts",
        symbols: expect.arrayContaining(["createOpenCodeUIAtoms", "createUICommandRouterAtom", "createUIThemeRegistryAtom"]),
      }),
      expect.objectContaining({
        id: "local-ui-port-fixture",
        path: "packages/lego-ui/src/port-fixtures.ts",
        symbols: expect.arrayContaining(["uiPortContractFixtures", "ui.renderer", "ui.command-router"]),
      }),
      expect.objectContaining({
        id: "local-ui-runtime-projection",
        path: "packages/contracts/src/port-fixtures.ts",
        symbols: expect.arrayContaining(["projectOpenCodeUIRuntimeProjection", "OpenCodeUIRuntimeProjection"]),
      }),
      expect.objectContaining({
        id: "local-ui-live-runtime-fixture",
        path: "packages/contracts/src/port-fixtures.ts",
        symbols: expect.arrayContaining(["captureOpenCodeUILiveRuntimeFixture", "verifyOpenCodeUILiveRuntimeFixture", "OpenCodeUILiveRuntimeFixture"]),
      }),
    ]))
    expect(snapshot.coveredUIAtomIDs).not.toEqual(expect.arrayContaining([
      "opencode.tui.shell",
      "opencode.product-shell.tui",
      "opencode.product-shell.web",
    ]))
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "renderer-message-surface")).toMatchObject({
      status: "partial",
      uiAtomIDs: ["opencode.ui.renderer"],
      uiPortIDs: ["ui.renderer"],
      sourceRefIDs: expect.arrayContaining(["tui-session-route", "web-app-shell", "local-ui-atoms", "local-ui-live-runtime-fixture"]),
      localEvidenceRefs: expect.arrayContaining(["opencode-ui:live-runtime-fixture"]),
      knownGaps: expect.arrayContaining(["opencode-ui-live-runtime-fixture-partial-native-gap", "opencode-ui-native-render-tree-snapshot-not-replayed"]),
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "native-focus-resize-timing")).toMatchObject({
      status: "partial",
      uiAtomIDs: expect.arrayContaining(["opencode.ui.command-router", "opencode.ui.renderer", "opencode.ui.snapshot"]),
      uiPortIDs: expect.arrayContaining(["ui.command-router", "ui.renderer", "ui.snapshot"]),
      sourceRefIDs: expect.arrayContaining(["local-ui-runtime-projection", "local-ui-live-runtime-fixture"]),
      localEvidenceRefs: expect.arrayContaining(["opencode-ui:runtime-projection", "opencode-ui:live-runtime-fixture"]),
      knownGaps: expect.arrayContaining(["opencode-ui-live-runtime-fixture-partial-native-gap"]),
    })
  })

  it("projects OpenCode UI runtime signals into a lossy partial fixture", () => {
    const projection = projectOpenCodeUIRuntimeProjection([
      {
        type: "pty.input",
        key: "enter",
        command: "submit",
        sequence: 2,
      },
      {
        type: "pty.input",
        key: "ctrl+p",
        sequence: 1,
      },
      {
        type: "render.tree",
        surface: "web",
        nodeKinds: ["message", "tool", "message"],
        messagePartKinds: ["text", "tool"],
      },
      {
        type: "render.tree",
        surface: "tui",
        nodeKinds: ["screen", "prompt"],
      },
      {
        type: "theme.palette",
        themeID: "tokyo-night",
        tokenKeys: ["accent", "background", "accent"],
        mode: "dark",
      },
      {
        type: "command.effect",
        commandID: "command.palette.open",
        effectKinds: ["dialog.open", "focus.change", "dialog.open"],
        route: "/session/sess-1",
      },
      {
        type: "focus.resize",
        focusTarget: "prompt",
        width: 120,
        height: 40,
        frame: 3,
      },
    ])

    expect(projection).toMatchObject({
      schemaVersion: 1,
      fixtureID: "opencode-ui:runtime-projection",
      evidenceRef: "conformance:opencode-ui-runtime-projection",
      coveredBranchIDs: [
        "native-pty-input-transcript",
        "native-render-tree-snapshot",
        "native-theme-palette-runtime",
        "native-command-side-effects",
        "native-focus-resize-timing",
      ],
      retainedFields: expect.arrayContaining(["key", "sequence", "surface", "nodeKinds", "themeID", "commandID", "width", "height"]),
      lossyFields: expect.arrayContaining([
        "raw PTY byte stream",
        "OpenTUI render tree identity/layout",
        "native theme palette RGB/style resolution",
        "focus/resize wall-clock timing",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-ui-native-pty-input-transcript-not-replayed",
        "opencode-ui-native-render-tree-snapshot-not-replayed",
        "opencode-ui-native-theme-palette-runtime-not-replayed",
        "opencode-ui-command-side-effects-not-replayed",
        "opencode-ui-native-focus-resize-timing-not-replayed",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(projection.ptyInputs).toEqual([
      { key: "ctrl+p", command: null, sequence: 1 },
      { key: "enter", command: "submit", sequence: 2 },
    ])
    expect(projection.renderTrees).toEqual([
      { surface: "tui", nodeKinds: ["prompt", "screen"], messagePartKinds: [] },
      { surface: "web", nodeKinds: ["message", "tool"], messagePartKinds: ["text", "tool"] },
    ])
    expect(projection.themePalettes).toEqual([
      { themeID: "tokyo-night", tokenKeys: ["accent", "background"], mode: "dark" },
    ])
    expect(projection.commandEffects).toEqual([
      { commandID: "command.palette.open", effectKinds: ["dialog.open", "focus.change"], route: "/session/sess-1" },
    ])
    expect(projection.focusResize).toEqual([
      { focusTarget: "prompt", width: 120, height: 40, frame: 3 },
    ])
  })

  it("captures OpenCode UI live runtime readback without claiming native parity", () => {
    const fixture = captureOpenCodeUILiveRuntimeFixture({
      key: "ctrl+p",
      command: "command.palette.open",
      surface: "tui",
      themeID: "tokyo-night",
      mode: "dark",
      route: "/session/sess-1",
      width: 120,
      height: 40,
    })

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      evidenceRef: "conformance:opencode-ui-live-runtime-fixture",
      fixtureID: "opencode-ui:live-runtime-fixture",
      exactDiffStatus: "live-runtime-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      fixtureDiffTarget: "ui.tui-interaction-replay",
      relatedFixtureDiffTargets: ["product-shell.cli-api-pty-transcript"],
      coveredBranchIDs: expect.arrayContaining([
        "command-route-surface",
        "input-keymap-surface",
        "renderer-message-surface",
        "theme-registry-surface",
        "snapshot-state-surface",
        "native-pty-input-transcript",
        "native-render-tree-snapshot",
        "native-theme-palette-runtime",
        "native-command-side-effects",
        "native-focus-resize-timing",
      ]),
      retainedFields: expect.arrayContaining([
        "PTY key sequence and normalized key readback",
        "command route and dialog state readback",
        "render tree node and message part kind readback",
        "theme token and palette hash readback",
        "focus target and resize frame readback",
      ]),
      lossyFields: expect.arrayContaining([
        "raw PTY byte stream",
        "OpenTUI render tree identity/layout",
        "native theme palette RGB/style resolution",
        "focus/resize wall-clock timing",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-ui-live-runtime-fixture-partial-native-gap",
        "opencode-ui-native-pty-input-transcript-not-replayed",
        "opencode-ui-native-render-tree-snapshot-not-replayed",
        "opencode-ui-native-theme-palette-runtime-not-replayed",
        "opencode-ui-command-side-effects-not-replayed",
        "opencode-ui-native-focus-resize-timing-not-replayed",
        "opencode-ui-browser-dom-lifecycle-not-replayed",
        "opencode-ui-opentui-layout-identity-not-exact",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.ptyReadback).toEqual([
      expect.objectContaining({
        key: "ctrl+p",
        command: "command.palette.open",
        rawSequenceHash: expect.stringMatching(/^[a-f0-9]{16}$/),
        normalizedKey: "ctrl+p",
        terminalMode: "alternate-screen",
      }),
    ])
    expect(fixture.renderTreeReadback).toEqual([
      expect.objectContaining({
        surface: "tui",
        nodeKinds: expect.arrayContaining(["message", "prompt", "tool"]),
        messagePartKinds: expect.arrayContaining(["text", "tool-call", "tool-result"]),
        layoutHash: expect.stringMatching(/^[a-f0-9]{16}$/),
        renderPassID: "render_pass_ui_fixture_001",
      }),
    ])
    expect(fixture.themeReadback).toEqual([
      expect.objectContaining({
        themeID: "tokyo-night",
        tokenKeys: expect.arrayContaining(["accent", "background", "foreground"]),
        mode: "dark",
        paletteHash: expect.stringMatching(/^[a-f0-9]{16}$/),
        source: "ThemeProvider",
      }),
    ])
    expect(fixture.commandEffectReadback).toEqual([
      expect.objectContaining({
        commandID: "command.palette.open",
        effectKinds: expect.arrayContaining(["dialog.open", "focus.change"]),
        route: "/session/sess-1",
        dialogState: "opened",
        focusAfter: "command-palette",
      }),
    ])
    expect(fixture.focusResizeReadback).toEqual([
      expect.objectContaining({
        focusTarget: "prompt",
        width: 120,
        height: 40,
        frame: 5,
        frameHash: expect.stringMatching(/^[a-f0-9]{16}$/),
      }),
    ])
    expect(fixture.uiRuntimeProjection).toMatchObject({
      fixtureID: "opencode-ui:runtime-projection",
      evidenceRef: "conformance:opencode-ui-runtime-projection",
      coveredBranchIDs: ["native-pty-input-transcript", "native-render-tree-snapshot", "native-theme-palette-runtime", "native-command-side-effects", "native-focus-resize-timing"],
    })
    expect(verifyOpenCodeUILiveRuntimeFixture(fixture)).toEqual({ ok: true, issues: [] })

    const nativeClaim = {
      ...fixture,
      nativeParityClaim: true as unknown as false,
    }
    expect(verifyOpenCodeUILiveRuntimeFixture(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-ui-live-runtime.native-claim" }),
    ]))

    const missingPTYReadback = {
      ...fixture,
      ptyReadback: [],
    }
    expect(verifyOpenCodeUILiveRuntimeFixture(missingPTYReadback).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-ui-live-runtime.pty-readback" }),
    ]))

    const missingRenderReadback = {
      ...fixture,
      renderTreeReadback: [],
    }
    expect(verifyOpenCodeUILiveRuntimeFixture(missingRenderReadback).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-ui-live-runtime.render-tree-readback" }),
    ]))

    const missingNativeGap = {
      ...fixture,
      knownGaps: fixture.knownGaps.filter((gap) => gap !== "opencode-ui-live-runtime-fixture-partial-native-gap"),
    }
    expect(verifyOpenCodeUILiveRuntimeFixture(missingNativeGap).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-ui-live-runtime.native-gaps" }),
    ]))
  })

  it("anchors Pi, Nanobot, and Hermes UI bridges to product source matrix partial fixtures", () => {
    const cases = [
      {
        product: "pi",
        atomPrefix: "pi",
        build: buildPiUISourceMatrixSnapshot,
        upstreamRef: "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        pinnedRepo: "earendil-works/pi",
        pinnedRef: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        evidenceRef: "conformance:pi-ui-source-matrix",
        fixtureID: "pi-ui:source-matrix",
        upstreamPath: "packages/tui/src/tui.ts",
        localTUIPath: "packages/adapters-pi/src/pi-tui.ts",
        localWebPath: "packages/adapters-pi/src/pi-web-ui.ts",
      },
      {
        product: "nanobot",
        atomPrefix: "nanobot",
        build: buildNanobotUISourceMatrixSnapshot,
        upstreamRef: "upstream:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        pinnedRepo: "HKUDS/nanobot",
        pinnedRef: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        evidenceRef: "conformance:nanobot-ui-source-matrix",
        fixtureID: "nanobot-ui:source-matrix",
        upstreamPath: "nanobot/cli/stream.py",
        localTUIPath: "packages/adapters-nanobot/src/nanobot-tui.ts",
        localWebPath: "packages/adapters-nanobot/src/nanobot-web-ui.ts",
      },
      {
        product: "hermes",
        atomPrefix: "hermes",
        build: buildHermesUISourceMatrixSnapshot,
        upstreamRef: "upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
        pinnedRepo: "NousResearch/hermes-agent",
        pinnedRef: "92a567db2d7a5031df8211efbfdad864c2f51faf",
        evidenceRef: "conformance:hermes-ui-source-matrix",
        fixtureID: "hermes-ui:source-matrix",
        upstreamPath: "agent/display.py",
        localTUIPath: "packages/adapters-hermes/src/hermes-tui.ts",
        localWebPath: "packages/adapters-hermes/src/hermes-web-dashboard.ts",
      },
    ] as const

    for (const entry of cases) {
      const snapshot = entry.build()
      const expectedAtomIDs = [
        `${entry.atomPrefix}.ui.command-router`,
        `${entry.atomPrefix}.ui.input-normalizer`,
        `${entry.atomPrefix}.ui.renderer`,
        `${entry.atomPrefix}.ui.snapshot`,
        `${entry.atomPrefix}.ui.theme-registry`,
      ]

      expect(snapshot, entry.product).toMatchObject({
        schemaVersion: 1,
        product: entry.product,
        upstreamRef: entry.upstreamRef,
        pinnedRepo: entry.pinnedRepo,
        pinnedRef: entry.pinnedRef,
        evidenceRef: entry.evidenceRef,
        fixtureID: entry.fixtureID,
        partialBranchIDs: expect.arrayContaining([
          "command-route-surface",
          "input-keymap-surface",
          "renderer-message-surface",
          "theme-registry-surface",
          "snapshot-state-surface",
        ]),
        missingBranchIDs: expect.arrayContaining([
          "native-pty-input-transcript",
          "native-render-tree-snapshot",
          "native-theme-palette-runtime",
          "native-command-side-effects",
          "native-focus-resize-timing",
        ]),
        coveredUIAtomIDs: expect.arrayContaining(expectedAtomIDs),
        coveredUIPortIDs: expect.arrayContaining(["ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"]),
        knownGaps: expect.arrayContaining([
          `${entry.atomPrefix}-ui-source-matrix-covered-by-partial-fixture`,
          `${entry.atomPrefix}-ui-native-pty-input-transcript-not-replayed`,
          `${entry.atomPrefix}-ui-native-render-tree-snapshot-not-replayed`,
          `${entry.atomPrefix}-ui-native-theme-palette-runtime-not-replayed`,
          `${entry.atomPrefix}-ui-command-side-effects-not-replayed`,
          `${entry.atomPrefix}-ui-native-focus-resize-timing-not-replayed`,
        ]),
        fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      })
      expect(snapshot.sourceRefs).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: "upstream-tui-shell",
          path: entry.upstreamPath,
        }),
        expect.objectContaining({
          id: "local-ui-atoms",
          path: "packages/lego-ui/src/ui-atoms.ts",
        }),
        expect.objectContaining({
          id: "local-tui-event-loop",
          path: "packages/lego-ui/src/tui-event-loop.ts",
        }),
        expect.objectContaining({
          id: "local-product-tui",
          path: entry.localTUIPath,
        }),
        expect.objectContaining({
          id: "local-product-web",
          path: entry.localWebPath,
        }),
      ]))
      expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "renderer-message-surface")).toMatchObject({
        status: "partial",
        uiAtomIDs: [`${entry.atomPrefix}.ui.renderer`],
        uiPortIDs: ["ui.renderer"],
        sourceRefIDs: expect.arrayContaining(["upstream-renderer-surface", "upstream-web-surface", "local-ui-atoms", "local-product-web"]),
        knownGaps: expect.arrayContaining([`${entry.atomPrefix}-ui-native-render-tree-snapshot-not-replayed`]),
      })
      expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "native-focus-resize-timing")).toMatchObject({
        status: "missing",
        uiAtomIDs: expect.arrayContaining(expectedAtomIDs),
        uiPortIDs: expect.arrayContaining(["ui.command-router", "ui.input-normalizer", "ui.renderer", "ui.snapshot", "ui.theme-registry"]),
      })
    }
  })

  it("anchors OpenCode foundation and trace bridges to pinned source matrix evidence", () => {
    const snapshot = buildOpenCodeFoundationTraceSourceMatrixSnapshot()

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      pinnedRepo: "anomalyco/opencode",
      pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-foundation-trace-source-matrix",
      fixtureID: "opencode-foundation-trace:source-matrix",
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-trace-debug-surface-native-exact-fixture",
        "trace-debug-surface-native-exact:opencode",
      ]),
      fixtureIDs: expect.arrayContaining(["opencode-trace-debug-surface:native-exact-fixture"]),
      nativeExactBranchIDs: expect.arrayContaining([
        "trace-message-shape-surface",
        "trace-status-surface",
        "native-trace-event-ordering",
        "native-trace-redaction-readback",
      ]),
      partialBranchIDs: [],
      missingBranchIDs: [],
      coveredFoundationTraceAtomIDs: expect.arrayContaining([
        "opencode.trace.debug-surface",
      ]),
      coveredFoundationTracePortIDs: expect.arrayContaining(["trace.recorder"]),
      knownGaps: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(snapshot.sourceRefs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-service",
        path: "packages/opencode/src/session/session.ts",
        symbols: expect.arrayContaining(["Info", "ProjectInfo", "GlobalInfo"]),
      }),
      expect.objectContaining({
        id: "session-message",
        path: "packages/opencode/src/session/message.ts",
        symbols: expect.arrayContaining(["ToolCall", "ToolResult", "MessagePart"]),
      }),
      expect.objectContaining({
        id: "session-status",
        path: "packages/opencode/src/session/status.ts",
        symbols: expect.arrayContaining(["Info", "Event", "Service"]),
      }),
      expect.objectContaining({
        id: "local-tool-port-fixtures",
        path: "packages/lego-tools/src/port-fixtures.ts",
        symbols: expect.arrayContaining(["toolPortContractFixtures", "tools"]),
      }),
      expect.objectContaining({
        id: "local-contract-port-fixtures",
        path: "packages/contracts/src/port-fixtures.ts",
        symbols: expect.arrayContaining(["eventPortContractFixtures", "trace.recorder"]),
      }),
      expect.objectContaining({
        id: "local-foundation-trace-runtime-projection",
        path: "packages/contracts/src/port-fixtures.ts",
        symbols: expect.arrayContaining(["projectOpenCodeFoundationTraceRuntimeProjection"]),
      }),
    ]))
    expect(snapshot.branchAnchors.find((anchor) => (anchor.branchID as string) === "foundation-tool-pack-surface")).toBeUndefined()
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "trace-message-shape-surface")).toMatchObject({
      status: "native-exact",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-trace-debug-surface-native-exact-fixture",
        "trace-debug-surface-native-exact:opencode",
      ]),
      fixtureIDs: ["opencode-trace-debug-surface:native-exact-fixture"],
      knownGaps: [],
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "trace-status-surface")).toMatchObject({
      status: "native-exact",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-trace-debug-surface-native-exact-fixture",
        "trace-debug-surface-native-exact:opencode",
      ]),
      fixtureIDs: ["opencode-trace-debug-surface:native-exact-fixture"],
      knownGaps: [],
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "native-trace-event-ordering")).toMatchObject({
      status: "native-exact",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      foundationTraceAtomIDs: ["opencode.trace.debug-surface"],
      foundationTracePortIDs: ["trace.recorder"],
      localEvidenceRefs: expect.arrayContaining([
        "opencode-foundation-trace:runtime-projection",
        "conformance:opencode-trace-debug-surface-native-exact-fixture",
        "trace-debug-surface-native-exact:opencode",
      ]),
      localMarkers: expect.arrayContaining(["message-part-sequence:native-exact", "status-service-order:native-exact"]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-trace-debug-surface-native-exact-fixture",
        "trace-debug-surface-native-exact:opencode",
      ]),
      fixtureIDs: ["opencode-trace-debug-surface:native-exact-fixture"],
      knownGaps: [],
    })
  })

  it("projects OpenCode foundation and trace runtime signals into a lossy partial fixture", () => {
    const projection = projectOpenCodeFoundationTraceRuntimeProjection([
      {
        type: "tool-pack.registered",
        toolPackID: "opencode.default",
        toolIDs: ["bash", "edit", "bash"],
        source: "opencode",
      },
      {
        type: "trace.event",
        traceID: "trace-1",
        sequence: 2,
        eventType: "status.updated",
      },
      {
        type: "trace.event",
        traceID: "trace-1",
        sequence: 1,
        eventType: "message.part",
        redacted: true,
        readbackID: "row-1",
      },
      {
        type: "trace.readback",
        traceID: "trace-1",
        eventTypes: ["message.part", "status.updated"],
        redactedFields: ["provider.apiKey", "tool.output"],
      },
    ])

    expect(projection).toMatchObject({
      schemaVersion: 1,
      fixtureID: "opencode-foundation-trace:runtime-projection",
      evidenceRef: "conformance:opencode-foundation-trace-runtime-projection",
      coveredBranchIDs: [
        "native-trace-event-ordering",
        "native-trace-redaction-readback",
      ],
      retainedFields: expect.arrayContaining(["sequence", "redactedFields"]),
      lossyFields: expect.arrayContaining([
        "wall-clock trace event timing",
        "native trace storage readback cursor",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-trace-native-storage-cursor-not-replayed",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(projection.toolPackRuntime).toEqual([
      {
        toolPackID: "opencode.default",
        toolIDs: ["bash", "edit"],
        source: "opencode",
      },
    ])
    expect(projection.traceOrdering).toEqual([
      { traceID: "trace-1", sequence: 1, eventType: "message.part" },
      { traceID: "trace-1", sequence: 2, eventType: "status.updated" },
    ])
    expect(projection.redactionReadback).toEqual([
      {
        traceID: "trace-1",
        redactedEventTypes: ["message.part"],
        readbackEventTypes: ["message.part", "status.updated"],
        redactedFields: ["provider.apiKey", "tool.output"],
      },
    ])
  })

  it("anchors Pi, Nanobot, and Hermes trace bridges to product source matrix partial fixtures", () => {
    const snapshots = [
      buildPiTraceSourceMatrixSnapshot(),
      buildNanobotTraceSourceMatrixSnapshot(),
      buildHermesTraceSourceMatrixSnapshot(),
    ]

    expect(snapshots.map((snapshot) => snapshot.product)).toEqual(["pi", "nanobot", "hermes"])
    for (const snapshot of snapshots) {
      const prefix = snapshot.product
      expect(snapshot).toMatchObject({
        schemaVersion: 1,
        evidenceRef: `conformance:${prefix}-trace-source-matrix`,
        fixtureID: `${prefix}-trace:source-matrix`,
        partialBranchIDs: expect.arrayContaining([
          "debug-event-surface",
          "span-order-surface",
          "redaction-surface",
          "trace-readback-surface",
        ]),
        missingBranchIDs: expect.arrayContaining([
          "native-trace-event-ordering",
          "native-trace-redaction-readback",
          "native-trace-storage-readback",
        ]),
        coveredTraceAtomIDs: [`${prefix}.trace.debug-surface`],
        coveredTracePortIDs: ["trace.recorder"],
        knownGaps: expect.arrayContaining([
          `${prefix}-trace-source-matrix-covered-by-partial-fixture`,
        ]),
        fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      })
      expect(snapshot.sourceRefs.some((ref) => ref.repo === "helix/local" && ref.path === "packages/contracts/src/port-fixtures.ts")).toBe(true)
      expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "debug-event-surface")).toMatchObject({
        status: "partial",
        traceAtomIDs: [`${prefix}.trace.debug-surface`],
        tracePortIDs: ["trace.recorder"],
      })
      expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "native-trace-event-ordering")).toMatchObject({
        status: "missing",
        traceAtomIDs: [`${prefix}.trace.debug-surface`],
        tracePortIDs: ["trace.recorder"],
      })
    }
  })

  it("records trace debug capture replay partial gates without claiming native parity", () => {
    const snapshot = buildTraceDebugCaptureReplayGateSnapshot()
    const verification = verifyTraceDebugCaptureReplayGateSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:trace-debug-capture-replay-gate",
      fixtureID: "trace:debug-capture-replay-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi", "nanobot", "hermes"],
      comparisonDimensions: ["debug-event", "span-order", "redaction", "trace-readback", "flow-projection"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-foundation-trace:source-matrix",
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      replayRisk: "source-matrix-plus-projection-partial",
      runtimeProjectionFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      evidenceRefs: expect.arrayContaining([
        "conformance:opencode-foundation-trace-source-matrix",
        "conformance:opencode-foundation-trace-runtime-projection",
        "conformance:opencode-trace-debug-surface-native-exact-fixture",
        "trace-debug-surface-native-exact:opencode",
        "opencode-trace-debug-surface:native-exact-fixture",
        "opencode-differential:trace-compare",
      ]),
      spanOrder: expect.arrayContaining(["native-trace-event-ordering", "native-exact", "message-part-sequence:native-exact", "status-service-order:native-exact"]),
      debugEvent: expect.arrayContaining(["trace-message-shape-surface", "trace-status-surface", "native-exact", "opencode-trace-debug-surface:native-exact-fixture"]),
      flowProjection: expect.arrayContaining(["flow-projection-loss-detail", "opencode-flow-projection-loss-detail"]),
      nativeBlockers: expect.arrayContaining([
        "debug-event-requires-product-native-capture",
        "flow-projection-must-retain-loss-detail-and-block-assembled-native-claim",
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "hermes")).toMatchObject({
      fixtureID: "hermes-trace:source-matrix",
      traceReadback: expect.arrayContaining(["trace-readback-surface", "trajectory-readback", "HermesTrace"]),
      knownLossiness: expect.arrayContaining(["hermes-native-trajectory-readback-not-replayed"]),
    })

    const debugDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, debugEvent: [] }
          : item,
      ),
    }
    expect(verifyTraceDebugCaptureReplayGateSnapshot(debugDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture.debug-event",
        product: "opencode",
        dimension: "debug-event",
      }),
    ]))

    const spanDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi"
          ? { ...item, spanOrder: [] }
          : item,
      ),
    }
    expect(verifyTraceDebugCaptureReplayGateSnapshot(spanDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture.span-order",
        product: "pi",
        dimension: "span-order",
      }),
    ]))

    const redactionDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, redaction: [] }
          : item,
      ),
    }
    expect(verifyTraceDebugCaptureReplayGateSnapshot(redactionDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture.redaction",
        product: "nanobot",
        dimension: "redaction",
      }),
    ]))

    const readbackDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes"
          ? { ...item, traceReadback: [] }
          : item,
      ),
    }
    expect(verifyTraceDebugCaptureReplayGateSnapshot(readbackDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture.trace-readback",
        product: "hermes",
        dimension: "trace-readback",
      }),
    ]))

    const flowDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, flowProjection: [] }
          : item,
      ),
    }
    expect(verifyTraceDebugCaptureReplayGateSnapshot(flowDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture.flow-projection",
        product: "opencode",
        dimension: "flow-projection",
      }),
    ]))

    const nativeClaim = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi"
          ? { ...item, nativeParityClaim: true as false }
          : item,
      ),
    }
    expect(verifyTraceDebugCaptureReplayGateSnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture.native-claim",
        product: "pi",
        dimension: "flow-projection",
      }),
    ]))

    const assembledOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes"
          ? { ...item, replayRisk: "assembled-only-native-claim" as const }
          : item,
      ),
    }
    expect(verifyTraceDebugCaptureReplayGateSnapshot(assembledOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture.assembled-only-native-claim",
        product: "hermes",
        dimension: "flow-projection",
      }),
    ]))
  })

  it("proves OpenCode trace debug surface as a native exact module fixture", () => {
    const fixture = captureOpenCodeTraceDebugSurfaceNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.trace.debug-surface",
      portID: "trace.recorder",
      evidenceRef: "conformance:opencode-trace-debug-surface-native-exact-fixture",
      replayRef: "trace-debug-surface-native-exact:opencode",
      fixtureID: "opencode-trace-debug-surface:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.objectContaining({
          path: "packages/opencode/src/session/message.ts",
          symbols: expect.arrayContaining(["MessagePart", "ToolInvocation", "ToolInvocationPart"]),
        }),
        expect.objectContaining({
          path: "packages/opencode/src/session/status.ts",
          symbols: expect.arrayContaining(["Info", "Event", "Service", "set"]),
        }),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "message-part-shape" }),
        expect.objectContaining({ id: "status-service-order" }),
        expect.objectContaining({ id: "trace-readback-redaction" }),
      ]),
    })
    expect(fixture.cases.find((testCase) => testCase.id === "status-service-order")?.actual).toMatchObject({
      events: [
        expect.objectContaining({ type: "session.status", sequence: 0, status: { type: "busy" } }),
        expect.objectContaining({ type: "session.status", sequence: 1, status: expect.objectContaining({ type: "retry", attempt: 2 }) }),
        expect.objectContaining({ type: "session.status", sequence: 2, status: { type: "idle" } }),
        expect.objectContaining({ type: "session.idle", sequence: 3 }),
      ],
      current: { type: "idle" },
      list: [],
    })
    expect(verifyOpenCodeTraceDebugSurfaceNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeTraceDebugSurfaceNativeExactFixture({ ...fixture, knownLossiness: ["partial-trace"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-trace-debug-surface-native-exact.lossiness" }),
    ]))
  })

  it("proves OpenCode provider auth descriptor as a native exact module fixture", () => {
    const fixture = captureOpenCodeProviderAuthNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.provider.auth-descriptor",
      portID: "provider.auth",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-provider-auth-descriptor-native-exact-fixture",
      replayRef: "provider-auth-descriptor-native-exact:opencode",
      fixtureID: "opencode-provider-auth-descriptor:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/opencode/src/auth/index.ts"),
        expect.stringContaining("packages/core/src/plugin/provider/index.ts"),
        expect.stringContaining("packages/opencode/src/provider/provider.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "auth-info-schema" }),
        expect.objectContaining({ id: "store-key-normalization" }),
        expect.objectContaining({ id: "plugin-auth-registration" }),
      ]),
    })
    expect(fixture.cases.find((testCase) => testCase.id === "store-key-normalization")?.actual).toEqual({
      openai: { type: "api", key: "new", metadata: { resourceName: "westus" } },
    })
    expect(fixture.cases.find((testCase) => testCase.id === "plugin-auth-registration")?.actual).toMatchObject({
      beforeCleanup: {
        services: expect.arrayContaining([
          [
            "opencode.auth:sample-plugin",
            expect.objectContaining({ type: "oauth", access: "access" }),
          ],
        ]),
        cleanupCount: 2,
      },
      afterCleanup: { services: [] },
    })
    expect(verifyOpenCodeProviderAuthNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeProviderAuthNativeExactFixture({ ...fixture, knownLossiness: ["partial-auth"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-auth.lossiness" }),
    ]))
  })

  it("proves OpenCode provider plugin descriptor as a native exact module fixture", () => {
    const fixture = captureOpenCodeProviderPluginNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.provider.plugin-descriptor",
      portID: "provider.stream",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-provider-plugin-descriptor-native-exact-fixture",
      replayRef: "provider-plugin-descriptor-native-exact:opencode",
      fixtureID: "opencode-provider-plugin-descriptor:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/plugin/src/index.ts"),
        expect.stringContaining("packages/opencode/src/plugin/index.ts"),
        expect.stringContaining("packages/opencode/src/provider/provider.ts"),
        expect.stringContaining("packages/core/src/plugin/provider/index.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "provider-hook-schema" }),
        expect.objectContaining({ id: "provider-scope-identity" }),
        expect.objectContaining({ id: "plugin-provider-registration" }),
      ]),
    })
    expect(fixture.cases.find((testCase) => testCase.id === "provider-hook-schema")?.actual).toEqual([
      { id: "openai-compatible", hasModelsLoader: false },
      { id: "dynamic-provider", hasModelsLoader: true },
    ])
    expect(fixture.cases.find((testCase) => testCase.id === "plugin-provider-registration")?.actual).toMatchObject({
      beforeCleanup: {
        services: expect.arrayContaining([
          [
            "opencode.provider:sample-plugin",
            expect.objectContaining({ id: "custom-provider", packageName: "@example/provider" }),
          ],
        ]),
        cleanupCount: 2,
      },
      afterCleanup: { services: [] },
    })
    expect(verifyOpenCodeProviderPluginNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeProviderPluginNativeExactFixture({ ...fixture, knownLossiness: ["partial-provider-plugin"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-plugin.lossiness" }),
    ]))
  })

  it("proves OpenCode plugin provider registry bridge as a native exact module fixture", () => {
    const fixture = captureOpenCodePluginProviderRegistryNativeExactFixture()

    expect(fixture).toMatchObject({
	      schemaVersion: 1,
	      product: "opencode",
	      atomID: "opencode.plugin.provider-registry-bridge",
	      coveredAtomIDs: expect.arrayContaining(["opencode.plugin.provider-registry-bridge", "opencode.registry.provider-plugin"]),
	      portID: "registry.provider",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-plugin-provider-registry-native-exact-fixture",
      replayRef: "plugin-provider-registry-native-exact:opencode",
      fixtureID: "opencode-plugin-provider-registry:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/plugin/src/index.ts"),
        expect.stringContaining("packages/opencode/src/plugin/index.ts"),
        expect.stringContaining("packages/opencode/src/provider/auth.ts"),
        expect.stringContaining("packages/opencode/src/provider/provider.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "auth-record-from-plugin-list" }),
        expect.objectContaining({ id: "provider-model-hook-filter" }),
        expect.objectContaining({ id: "auth-loader-hook-filter" }),
        expect.objectContaining({ id: "source-scoped-provider-registration" }),
      ]),
    })
    expect(fixture.cases.find((testCase) => testCase.id === "auth-record-from-plugin-list")?.actual).toMatchObject({
      openai: expect.objectContaining({ marker: "last-wins" }),
      anthropic: expect.objectContaining({ marker: "stored-auth" }),
    })
    expect(fixture.cases.find((testCase) => testCase.id === "provider-model-hook-filter")?.actual).toEqual([
      { providerID: "openai", hasModelsLoader: true, marker: "database-match" },
    ])
    expect(fixture.cases.find((testCase) => testCase.id === "auth-loader-hook-filter")?.actual).toEqual([
      { providerID: "anthropic", hasLoader: true, marker: "stored-auth" },
    ])
    expect(fixture.cases.find((testCase) => testCase.id === "source-scoped-provider-registration")?.actual).toMatchObject({
      beforeCleanup: {
        services: expect.arrayContaining([
          [
            "opencode.provider:sample-plugin",
            expect.objectContaining({ id: "custom-provider", packageName: "@example/provider", hasModelsLoader: true }),
          ],
        ]),
        cleanupCount: 2,
      },
      afterCleanup: { services: [] },
    })
    expect(verifyOpenCodePluginProviderRegistryNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodePluginProviderRegistryNativeExactFixture({ ...fixture, knownLossiness: ["partial-provider-registry"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-plugin-provider-registry.lossiness" }),
    ]))
  })

  it("proves OpenCode plugin loader as a native exact module fixture", async () => {
    const fixture = await captureOpenCodePluginLoaderNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.plugin.loader",
      portID: "hook.bus",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-plugin-loader-native-exact-fixture",
      replayRef: "plugin-loader-native-exact:opencode",
      fixtureID: "opencode-plugin-loader:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/plugin/src/index.ts"),
        expect.stringContaining("packages/core/src/plugin.ts"),
        expect.stringContaining("packages/core/src/plugin/boot.ts"),
        expect.stringContaining("packages/adapters-opencode/src/plugin-atoms.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "source-config-registration-order" }),
        expect.objectContaining({ id: "manifest-fallback-source" }),
        expect.objectContaining({ id: "no-config-hook-registration" }),
      ]),
    })
    expect(fixture.cases.find((testCase) => testCase.id === "source-config-registration-order")?.actual).toMatchObject({
      source: { id: "sample-plugin", scope: "project", order: 0 },
      pluginInput: {
        directory: "/workspace",
        worktree: "/workspace",
        hasDollar: true,
        hasWorkspaceRegister: true,
        options: { enabled: true, mode: "test" },
      },
      beforeCleanup: [
        "workspace:sample-plugin",
        "plugin:/workspace:enabled,mode",
        "config:model,theme",
        "registry:sample-plugin:chat.message,config,tool",
        "permission:sample-plugin:chat.message,config,tool",
        "event:sample-plugin:chat.message,config,tool",
      ],
    })
    expect(verifyOpenCodePluginLoaderNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodePluginLoaderNativeExactFixture({ ...fixture, knownLossiness: ["partial-plugin-loader"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-plugin-loader.lossiness" }),
    ]))
  })

  it("proves OpenCode plugin hot reload cleanup as a native exact module fixture", async () => {
    const fixture = await captureOpenCodePluginHotReloadCleanupNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.plugin.hot-reload-cleanup",
      portID: "hook.cleanup-scope",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-plugin-hot-reload-cleanup-native-exact-fixture",
      replayRef: "plugin-hot-reload-cleanup-native-exact:opencode",
      fixtureID: "opencode-plugin-hot-reload-cleanup:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/core/src/plugin.ts"),
        expect.stringContaining("packages/core/src/plugin/boot.ts"),
        expect.stringContaining("packages/adapters-opencode/src/opencode-plugin-loader.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "replacement-disposes-existing-before-track" }),
        expect.objectContaining({ id: "scope-dispose-removes-tracked-source" }),
        expect.objectContaining({ id: "host-state-isolated" }),
      ]),
    })
    expect(fixture.cases.find((testCase) => testCase.id === "replacement-disposes-existing-before-track")?.actual).toEqual({
      disposedExisting: true,
      eventsAfterReplace: ["cleanup:first"],
      tracked: ["plugin-a"],
    })
    expect(verifyOpenCodePluginHotReloadCleanupNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodePluginHotReloadCleanupNativeExactFixture({ ...fixture, knownLossiness: ["partial-hot-reload"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-plugin-hot-reload-cleanup.lossiness" }),
    ]))
  })

  it("proves OpenCode plugin event mapper as a native exact module fixture", async () => {
    const fixture = await captureOpenCodePluginEventMapperNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.plugin.event-mapper",
      portID: "hook.handler-chain",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-plugin-event-mapper-native-exact-fixture",
      replayRef: "plugin-event-mapper-native-exact:opencode",
      fixtureID: "opencode-plugin-event-mapper:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/plugin/src/index.ts"),
        expect.stringContaining("packages/core/src/plugin.ts"),
        expect.stringContaining("packages/adapters-opencode/src/plugin-atoms.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "event-observer-and-tool-before" }),
        expect.objectContaining({ id: "provider-request-params-and-headers" }),
        expect.objectContaining({ id: "input-context-system-session-and-text-hooks" }),
        expect.objectContaining({ id: "delegated-hook-bridges" }),
      ]),
    })
    expect(fixture.cases.find((testCase) => testCase.id === "provider-request-params-and-headers")?.actual).toEqual({
      providerCalls: ["params", "headers"],
      providerResult: {
        providerOptions: {
          temperature: 0.75,
          topP: 1,
          topK: 0,
          maxOutputTokens: 128,
          options: { seed: "base", patched: true },
        },
        headers: { "x-opencode-plugin": "1" },
      },
    })
    expect(verifyOpenCodePluginEventMapperNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodePluginEventMapperNativeExactFixture({ ...fixture, knownLossiness: ["partial-event-mapper"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-plugin-event-mapper.lossiness" }),
    ]))
  })

  it("proves OpenCode command registry as a native exact module fixture", async () => {
    const fixture = await captureOpenCodeCommandRegistryNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.registry.command",
      portID: "registry.command",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-command-registry-native-exact-fixture",
      replayRef: "command-registry-native-exact:opencode",
      fixtureID: "opencode-command-registry:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/plugin/src/index.ts"),
        expect.stringContaining("packages/opencode/src/session/prompt.ts"),
        expect.stringContaining("packages/opencode/src/plugin/index.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "no-command-hook-noop" }),
        expect.objectContaining({ id: "source-order-shared-output" }),
        expect.objectContaining({ id: "event-session-fallback" }),
        expect.objectContaining({ id: "cleanup-removes-hook" }),
        expect.objectContaining({ id: "fail-fast-hook-error" }),
      ]),
    })
    expect(fixture.cases.find((testCase) => testCase.id === "source-order-shared-output")?.actual).toMatchObject({
      result: {
        parts: [
          { type: "text", text: "first" },
          { type: "text", text: "second:ses_ordered" },
        ],
      },
      calls: ["first:/build:0", "second:--fast:1"],
    })
    expect(fixture.cases.find((testCase) => testCase.id === "event-session-fallback")?.actual).toMatchObject({
      input: { command: "/fallback", sessionID: "ses_event", arguments: "" },
    })
    expect(fixture.cases.find((testCase) => testCase.id === "cleanup-removes-hook")?.actual).toEqual({
      before: { parts: [{ type: "text", text: "before-cleanup" }] },
      after: undefined,
    })
    expect(fixture.cases.find((testCase) => testCase.id === "fail-fast-hook-error")?.actual).toEqual({
      rejected: true,
      errorName: "Error",
      message: "command hook failed",
      calls: ["first", "throws"],
    })
    expect(verifyOpenCodeCommandRegistryNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeCommandRegistryNativeExactFixture({ ...fixture, knownLossiness: ["partial-command-registry"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-command-registry.lossiness" }),
    ]))
  })

  it("proves OpenCode shell.env bridge as a native exact module fixture", async () => {
    const fixture = await captureOpenCodeShellEnvNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.shell.env-bridge",
      portID: "process-runner.port",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-shell-env-native-exact-fixture",
      replayRef: "shell-env-native-exact:opencode",
      fixtureID: "opencode-shell-env:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/plugin/src/index.ts"),
        expect.stringContaining("packages/opencode/src/session/prompt.ts"),
        expect.stringContaining("packages/opencode/src/plugin/index.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "no-shell-env-hook-noop" }),
        expect.objectContaining({ id: "source-order-shared-env" }),
        expect.objectContaining({ id: "optional-session-call-fields" }),
        expect.objectContaining({ id: "cleanup-removes-hook" }),
        expect.objectContaining({ id: "fail-fast-hook-error" }),
      ]),
    })
    expect(fixture.cases.find((testCase) => testCase.id === "source-order-shared-env")?.actual).toEqual({
      result: { env: { FIRST: "1", SECOND: "1:ses_ordered", SHARED: "second" } },
      calls: ["first:/repo:0", "second:call_ordered:1:first"],
    })
    expect(fixture.cases.find((testCase) => testCase.id === "optional-session-call-fields")?.actual).toEqual({
      input: { cwd: "/optional" },
      result: { env: { CWD: "/optional", HAS_CALL: "no", HAS_SESSION: "no" } },
    })
    expect(fixture.cases.find((testCase) => testCase.id === "fail-fast-hook-error")?.actual).toEqual({
      rejected: true,
      errorName: "Error",
      message: "shell env hook failed",
      calls: ["first", "throws"],
    })
    expect(verifyOpenCodeShellEnvNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeShellEnvNativeExactFixture({ ...fixture, knownLossiness: ["partial-shell-env"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-shell-env.lossiness" }),
    ]))
  })

  it("proves OpenCode tool.execute.after result render bridge as a native exact module fixture", async () => {
    const fixture = await captureOpenCodeToolResultRenderNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.tool.result-render-bridge",
      portID: "tool.result-normalizer",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-tool-result-render-native-exact-fixture",
      replayRef: "tool-result-render-native-exact:opencode",
      fixtureID: "opencode-tool-result-render:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/plugin/src/index.ts"),
        expect.stringContaining("packages/opencode/src/session/prompt.ts"),
        expect.stringContaining("packages/opencode/src/plugin/index.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "no-tool-after-hook-noop" }),
        expect.objectContaining({ id: "source-order-shared-output" }),
        expect.objectContaining({ id: "nested-tool-result-text" }),
        expect.objectContaining({ id: "cleanup-removes-hook" }),
        expect.objectContaining({ id: "fail-fast-hook-error" }),
      ]),
    })
    expect(fixture.cases.find((testCase) => testCase.id === "source-order-shared-output")?.actual).toEqual({
      result: {
        title: "bash:first:second",
        content: [{ id: "prt_opencode-tool-result-render", type: "text", text: "base|first:ses_ordered|second:printf hi" }],
        details: { initial: true, first: true, second: true },
      },
      calls: ["first:bash:bash:base:initial", "second:call_ordered:bash:first:base|first:ses_ordered:first,initial"],
    })
    expect(fixture.cases.find((testCase) => testCase.id === "nested-tool-result-text")?.actual).toEqual({
      input: { tool: "read", sessionID: "ses_nested", callID: "call_nested", args: { path: "README.md" } },
      result: {
        title: "read",
        content: [{ id: "prt_opencode-tool-result-render", type: "text", text: "outer\ninner|flattened" }],
        details: { textSeen: "outer\ninner|flattened" },
      },
    })
    expect(fixture.cases.find((testCase) => testCase.id === "fail-fast-hook-error")?.actual).toEqual({
      rejected: true,
      errorName: "Error",
      message: "tool result hook failed",
      calls: ["first", "throws"],
    })
    expect(verifyOpenCodeToolResultRenderNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeToolResultRenderNativeExactFixture({ ...fixture, knownLossiness: ["partial-tool-result-render"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-tool-result-render.lossiness" }),
    ]))
	  })

	  it("proves OpenCode permission.ask bridge as a native exact module fixture", async () => {
	    const fixture = await captureOpenCodePluginPermissionBridgeNativeExactFixture()

	    expect(fixture).toMatchObject({
	      schemaVersion: 1,
	      product: "opencode",
	      atomID: "opencode.plugin.permission-bridge",
	      coveredAtomIDs: expect.arrayContaining(["opencode.plugin.permission-bridge", "opencode.permission.ask-bridge"]),
	      portID: "tool.permission-policy",
	      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
	      evidenceRef: "conformance:opencode-plugin-permission-bridge-native-exact-fixture",
	      replayRef: "plugin-permission-bridge-native-exact:opencode",
	      fixtureID: "opencode-plugin-permission-bridge:native-exact-fixture",
	      exactDiffStatus: "native-exact",
	      nativeParityClaim: true,
	      knownLossiness: [],
	      sourceRefs: expect.arrayContaining([
	        expect.stringContaining("packages/opencode/src/plugin/index.ts"),
	        expect.stringContaining("packages/plugin/src/index.ts"),
	        expect.stringContaining("packages/opencode/src/permission/index.ts"),
	      ]),
	      cases: expect.arrayContaining([
	        expect.objectContaining({ id: "default-ask-without-hook" }),
	        expect.objectContaining({ id: "source-order-output-mutation" }),
	        expect.objectContaining({ id: "fail-fast-hook-error" }),
	      ]),
	    })
	    expect(fixture.cases.find((testCase) => testCase.id === "default-ask-without-hook")?.actual).toBeUndefined()
	    expect(fixture.cases.find((testCase) => testCase.id === "source-order-output-mutation")?.actual).toEqual({
	      calls: ["first:edit", "second:ses_ordered"],
	      result: { status: "allow" },
	      payloadAfterEmit: { permission: "edit", patterns: ["src/index.ts"], sessionID: "ses_ordered" },
	    })
	    expect(fixture.cases.find((testCase) => testCase.id === "fail-fast-hook-error")?.actual).toEqual({
	      rejected: true,
	      errorName: "Error",
	      message: "permission hook failed",
	      calls: ["before", "throws"],
	    })
	    expect(verifyOpenCodePluginPermissionBridgeNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
	    expect(verifyOpenCodePluginPermissionBridgeNativeExactFixture({ ...fixture, knownLossiness: ["partial-permission-bridge"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
	      expect.objectContaining({ id: "opencode-plugin-permission-bridge.lossiness" }),
	    ]))
	  })

	  it("proves OpenCode plugin tool registry bridge as a native exact module fixture", () => {
	    const fixture = captureOpenCodePluginToolRegistryNativeExactFixture()

    expect(fixture).toMatchObject({
	      schemaVersion: 1,
	      product: "opencode",
	      atomID: "opencode.plugin.registry-bridge",
	      coveredAtomIDs: expect.arrayContaining(["opencode.plugin.registry-bridge", "opencode.registry.tool-definition"]),
	      portID: "tool.registry",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-plugin-tool-registry-native-exact-fixture",
      replayRef: "plugin-tool-registry-native-exact:opencode",
      fixtureID: "opencode-plugin-tool-registry:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/plugin/src/index.ts"),
        expect.stringContaining("packages/plugin/src/tool.ts"),
        expect.stringContaining("packages/opencode/src/tool/registry.ts"),
        expect.stringContaining("packages/opencode/src/plugin/index.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "no-tools-noop" }),
        expect.objectContaining({ id: "source-scoped-tool-registration" }),
        expect.objectContaining({ id: "definition-reference-retained" }),
      ]),
    })
    expect(fixture.cases.find((testCase) => testCase.id === "source-scoped-tool-registration")?.actual).toMatchObject({
      beforeCleanup: {
        services: expect.arrayContaining([
          [
            "opencode.tool:formatter",
            expect.objectContaining({
              definition: expect.objectContaining({ description: "Format a source file", hasExecute: true }),
              source: expect.objectContaining({ id: "sample-plugin", scope: "project" }),
            }),
          ],
          [
            "opencode.tool:reviewer",
            expect.objectContaining({
              definition: expect.objectContaining({ description: "Review a source file", hasExecute: true }),
              source: expect.objectContaining({ id: "sample-plugin", scope: "project" }),
            }),
          ],
        ]),
        cleanupCount: 2,
      },
      afterCleanup: { services: [] },
    })
    expect(fixture.cases.find((testCase) => testCase.id === "definition-reference-retained")?.actual).toMatchObject({
      sameDefinitionReference: true,
      serviceKey: "opencode.tool:identity",
      cleanupCount: 1,
      definition: expect.objectContaining({ description: "Keep exact object identity", hasExecute: true }),
    })
    expect(verifyOpenCodePluginToolRegistryNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodePluginToolRegistryNativeExactFixture({ ...fixture, knownLossiness: ["partial-tool-registry"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-plugin-tool-registry.lossiness" }),
    ]))
  })

  it("proves OpenCode tool definition plugin bridge as a native exact module fixture", async () => {
    const fixture = await captureOpenCodeToolDefinitionPluginNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.tool.definition-plugin-bridge",
      portID: "tool.definition",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-tool-definition-plugin-native-exact-fixture",
      replayRef: "tool-definition-plugin-native-exact:opencode",
      fixtureID: "opencode-tool-definition-plugin:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/opencode/src/tool/registry.ts"),
        expect.stringContaining("packages/opencode/src/plugin/index.ts"),
        expect.stringContaining("packages/plugin/src/index.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "no-hook-retains-json-schema" }),
        expect.objectContaining({ id: "source-order-mutable-output" }),
        expect.objectContaining({ id: "json-schema-override" }),
        expect.objectContaining({ id: "fail-fast-error" }),
      ]),
    })
    expect(fixture.cases.find((testCase) => testCase.id === "source-order-mutable-output")?.actual).toMatchObject({
      tool: {
        description: "First plugin description + second plugin\nAvailable agent types and the tools they have access to:",
        parameters: expect.objectContaining({
          properties: expect.objectContaining({ timeout: expect.objectContaining({ type: "number" }) }),
        }),
      },
      hookLog: ["first:bash:Run a shell command", "second:bash:First plugin description"],
    })
    expect(fixture.cases.find((testCase) => testCase.id === "source-order-mutable-output")?.actual).not.toHaveProperty("tool.jsonSchema")
    expect(fixture.cases.find((testCase) => testCase.id === "json-schema-override")?.actual).toMatchObject({
      jsonSchema: expect.objectContaining({
        properties: expect.objectContaining({ command: expect.objectContaining({ minLength: 1 }) }),
      }),
    })
    expect(fixture.cases.find((testCase) => testCase.id === "fail-fast-error")?.actual).toEqual({
      threw: true,
      message: "definition plugin failed",
      hookLog: ["first", "second"],
    })
    expect(verifyOpenCodeToolDefinitionPluginNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeToolDefinitionPluginNativeExactFixture({ ...fixture, knownLossiness: ["partial-tool-definition"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-tool-definition-plugin.lossiness" }),
    ]))
  })

  it("proves OpenCode provider model plugin as a native exact module fixture", async () => {
    const fixture = await captureOpenCodeProviderModelPluginNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.provider.model-plugin",
      portID: "provider.model-registry",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-provider-model-plugin-native-exact-fixture",
      replayRef: "provider-model-plugin-native-exact:opencode",
      fixtureID: "opencode-provider-model-plugin:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/plugin/src/index.ts"),
        expect.stringContaining("packages/opencode/src/provider/provider.ts"),
        expect.stringContaining("packages/core/src/plugin/provider/index.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "public-info-sanitization" }),
        expect.objectContaining({ id: "model-loader-context" }),
        expect.objectContaining({ id: "disabled-provider-filter" }),
      ]),
    })
    expect(fixture.cases.find((testCase) => testCase.id === "public-info-sanitization")?.actual).toMatchObject({
      id: "dynamic-provider",
      options: {
        baseURL: "https://provider.example.test/v1",
        quota: "9007199254740993",
      },
      models: {
        old: {
          id: "old",
          providerID: "dynamic-provider",
          name: "Old Model",
        },
      },
    })
    expect(fixture.cases.find((testCase) => testCase.id === "model-loader-context")?.actual).toMatchObject({
      loaderObservations: [
        {
          context: { auth: { type: "api", key: "redacted" } },
        },
      ],
      mappedModels: {
        "dynamic-small": {
          id: "dynamic-small",
          providerID: "dynamic-provider",
          name: "Dynamic Small",
        },
      },
    })
    expect(fixture.cases.find((testCase) => testCase.id === "disabled-provider-filter")?.actual).toEqual({
      allowed: true,
      disabled: false,
    })
    expect(verifyOpenCodeProviderModelPluginNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeProviderModelPluginNativeExactFixture({ ...fixture, knownLossiness: ["partial-provider-model-plugin"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-provider-model-plugin.lossiness" }),
    ]))
  })

  it("proves OpenCode hook scheduler defaults as a native exact module fixture", async () => {
    const fixture = await captureOpenCodeHookSchedulerNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.hook.scheduler-defaults",
      portID: "hook.scheduler",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-hook-scheduler-native-exact-fixture",
      replayRef: "hook-scheduler-native-exact:opencode",
      fixtureID: "opencode-hook-scheduler:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/opencode/src/plugin/index.ts"),
        expect.stringContaining("packages/plugin/src/index.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "source-order-output-mutation" }),
        expect.objectContaining({ id: "empty-name-noop" }),
        expect.objectContaining({ id: "list-readback" }),
        expect.objectContaining({ id: "error-propagation" }),
        expect.objectContaining({ id: "truthy-non-function-error" }),
      ]),
    })
    expect(fixture.cases.find((testCase) => testCase.id === "source-order-output-mutation")?.actual).toEqual({
      calls: ["first:session-1", "second"],
      output: {
        temperature: 0.25,
        options: {
          first: "from-input",
          second: true,
        },
      },
      returnedSameReference: true,
    })
    expect(fixture.cases.find((testCase) => testCase.id === "empty-name-noop")?.actual).toEqual({
      calls: [],
      output: { status: "ask" },
      returnedSameReference: true,
    })
    expect(fixture.cases.find((testCase) => testCase.id === "error-propagation")?.actual).toMatchObject({
      rejected: true,
      errorName: "Error",
      message: "plugin hook failed",
      calls: ["before", "throws"],
      output: { steps: ["before"] },
    })
    expect(fixture.cases.find((testCase) => testCase.id === "truthy-non-function-error")?.actual).toMatchObject({
      rejected: true,
      errorName: "TypeError",
      messageIncludesNotFunction: true,
    })
    expect(verifyOpenCodeHookSchedulerNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeHookSchedulerNativeExactFixture({ ...fixture, knownLossiness: ["partial-hook-scheduler"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-hook-scheduler.lossiness" }),
    ]))
  })

  it("proves OpenCode hook error defaults as a native exact module fixture", async () => {
    const fixture = await captureOpenCodeHookErrorDefaultsNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.hook.error-defaults",
      portID: "hook.error-policy",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-hook-error-defaults-native-exact-fixture",
      replayRef: "hook-error-defaults-native-exact:opencode",
      fixtureID: "opencode-hook-error-defaults:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/opencode/src/plugin/index.ts"),
        expect.stringContaining("packages/plugin/src/index.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "handler-fail-fast" }),
        expect.objectContaining({ id: "observer-fail-fast" }),
      ]),
    })
    expect(fixture.cases.find((testCase) => testCase.id === "handler-fail-fast")?.actual).toEqual({
      rejected: true,
      errorName: "Error",
      message: "handler failed",
      calls: ["first"],
      errors: ["handler failed"],
    })
    expect(fixture.cases.find((testCase) => testCase.id === "observer-fail-fast")?.actual).toEqual({
      rejected: true,
      errorName: "Error",
      message: "observer failed",
      calls: ["first"],
      errors: ["observer failed"],
    })
    expect(verifyOpenCodeHookErrorDefaultsNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeHookErrorDefaultsNativeExactFixture({ ...fixture, knownLossiness: ["partial-hook-error-defaults"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-hook-error-defaults.lossiness" }),
    ]))
  })

  it("proves OpenCode hook observer adapter as a native exact module fixture", async () => {
    const fixture = await captureOpenCodeHookObserverNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.hook.observer-adapter",
      portID: "hook.observer-chain",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-hook-observer-native-exact-fixture",
      replayRef: "hook-observer-native-exact:opencode",
      fixtureID: "opencode-hook-observer:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/opencode/src/plugin/index.ts"),
        expect.stringContaining("packages/plugin/src/index.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "source-order-fire-and-forget" }),
        expect.objectContaining({ id: "nullish-observer-skip" }),
        expect.objectContaining({ id: "truthy-non-function-error" }),
      ]),
    })
    expect(fixture.cases.find((testCase) => testCase.id === "source-order-fire-and-forget")?.actual).toMatchObject({
      immediateCalls: ["first:start", "second"],
      afterMicrotaskCalls: ["first:start", "second", "first:after-await"],
      payloads: [
        { eventType: "session.updated", sameEventReference: true },
        { eventType: "session.updated", sameEventReference: true },
      ],
    })
    expect(fixture.cases.find((testCase) => testCase.id === "nullish-observer-skip")?.actual).toEqual({
      calls: ["called"],
    })
    expect(fixture.cases.find((testCase) => testCase.id === "truthy-non-function-error")?.actual).toMatchObject({
      rejected: true,
      errorName: "TypeError",
      messageIncludesNotFunction: true,
    })
    expect(verifyOpenCodeHookObserverNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeHookObserverNativeExactFixture({ ...fixture, knownLossiness: ["partial-hook-observer"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-hook-observer.lossiness" }),
    ]))
  })

  it("proves OpenCode hook handler adapter as a native exact module fixture", async () => {
    const fixture = await captureOpenCodeHookHandlerNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.hook.handler-adapter",
      portID: "hook.handler-chain",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-hook-handler-native-exact-fixture",
      replayRef: "hook-handler-native-exact:opencode",
      fixtureID: "opencode-hook-handler:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/opencode/src/plugin/index.ts"),
        expect.stringContaining("packages/plugin/src/index.ts"),
      ]),
      cases: expect.arrayContaining([
        expect.objectContaining({ id: "mutable-output-source-order" }),
        expect.objectContaining({ id: "falsey-handler-skip" }),
        expect.objectContaining({ id: "fail-fast-handler-error" }),
      ]),
    })
    expect(fixture.cases.find((testCase) => testCase.id === "mutable-output-source-order")?.actual).toEqual({
      calls: ["first:session-1", "second"],
      output: {
        message: { role: "user", content: "second" },
        parts: [
          { type: "text", text: "first" },
          { type: "text", text: "second" },
        ],
      },
      returnedSameReference: true,
    })
    expect(fixture.cases.find((testCase) => testCase.id === "falsey-handler-skip")?.actual).toEqual({
      calls: ["called"],
      output: { args: { keep: true, updated: true } },
      returnedSameReference: true,
    })
    expect(fixture.cases.find((testCase) => testCase.id === "fail-fast-handler-error")?.actual).toMatchObject({
      rejected: true,
      errorName: "Error",
      message: "handler failed",
      calls: ["before", "throws"],
      output: { headers: { "x-before": "1" } },
    })
    expect(verifyOpenCodeHookHandlerNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(verifyOpenCodeHookHandlerNativeExactFixture({ ...fixture, knownLossiness: ["partial-hook-handler"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-hook-handler.lossiness" }),
    ]))
  })

  it("records trace debug capture pinned replay fixtures without claiming native parity", () => {
    const snapshot = buildTraceDebugCapturePinnedReplaySnapshot()
    const verification = verifyTraceDebugCapturePinnedReplaySnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:trace-debug-capture-pinned-replay-gate",
      fixtureID: "trace:debug-capture-pinned-replay-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi", "nanobot", "hermes"],
      comparisonDimensions: ["debug-event", "span-order", "redaction", "trace-readback", "flow-projection"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-foundation-trace:source-matrix",
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      exactDiffRisk: "pinned-debug-capture-replay-needs-product-native-trace",
      runtimeProjectionFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      evidenceRefs: expect.arrayContaining([
        "conformance:opencode-foundation-trace-source-matrix",
        "conformance:opencode-foundation-trace-runtime-projection",
        "trace:debug-capture-replay-gate",
      ]),
      knownLossiness: expect.arrayContaining(["trace-debug-capture-pinned-replay-needs-product-native-capture"]),
      upstreamRecords: expect.arrayContaining([
        expect.objectContaining({
          dimension: "debug-event",
          sequence: 1,
          value: expect.stringContaining("trace-message-shape-surface"),
        }),
        expect.objectContaining({
          dimension: "flow-projection",
          sequence: 5,
          value: expect.stringContaining("flow-projection-loss-detail"),
        }),
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi")?.upstreamRecords.find((record) => record.dimension === "span-order")?.value).toContain("span-order-surface")
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.upstreamRecords.find((record) => record.dimension === "redaction")?.value).toContain("redaction-surface")
    expect(snapshot.cases.find((item) => item.product === "hermes")?.upstreamRecords.find((record) => record.dimension === "trace-readback")?.value).toContain("HermesTrace")

    const debugDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
            ...item,
            productReplayRecords: item.productReplayRecords.map((record) =>
              record.dimension === "debug-event"
                ? { ...record, value: "debug-event:lost" }
                : record,
            ),
          }
          : item,
      ),
    }
    expect(verifyTraceDebugCapturePinnedReplaySnapshot(debugDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture-pinned-replay.debug-event",
        product: "opencode",
        dimension: "debug-event",
      }),
    ]))

    const spanDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi"
          ? {
            ...item,
            assembledRecords: item.assembledRecords.map((record) =>
              record.dimension === "span-order"
                ? { ...record, value: "span-order:lost" }
                : record,
            ),
          }
          : item,
      ),
    }
    expect(verifyTraceDebugCapturePinnedReplaySnapshot(spanDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture-pinned-replay.span-order",
        product: "pi",
        dimension: "span-order",
      }),
    ]))

    const redactionDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? {
            ...item,
            productReplayRecords: item.productReplayRecords.map((record) =>
              record.dimension === "redaction"
                ? { ...record, value: "redaction:lost" }
                : record,
            ),
          }
          : item,
      ),
    }
    expect(verifyTraceDebugCapturePinnedReplaySnapshot(redactionDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture-pinned-replay.redaction",
        product: "nanobot",
        dimension: "redaction",
      }),
    ]))

    const readbackDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes"
          ? {
            ...item,
            assembledRecords: item.assembledRecords.map((record) =>
              record.dimension === "trace-readback"
                ? { ...record, value: "trace-readback:lost" }
                : record,
            ),
          }
          : item,
      ),
    }
    expect(verifyTraceDebugCapturePinnedReplaySnapshot(readbackDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture-pinned-replay.trace-readback",
        product: "hermes",
        dimension: "trace-readback",
      }),
    ]))

    const flowDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
            ...item,
            assembledRecords: item.assembledRecords.map((record) =>
              record.dimension === "flow-projection"
                ? { ...record, value: "flow-projection:lost" }
                : record,
            ),
          }
          : item,
      ),
    }
    expect(verifyTraceDebugCapturePinnedReplaySnapshot(flowDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture-pinned-replay.flow-projection",
        product: "opencode",
        dimension: "flow-projection",
      }),
    ]))

    const orderDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, upstreamRecords: [...item.upstreamRecords].reverse() }
          : item,
      ),
    }
    expect(verifyTraceDebugCapturePinnedReplaySnapshot(orderDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture-pinned-replay.order",
        product: "opencode",
        dimension: "span-order",
      }),
    ]))

    const nativeClaim = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi"
          ? { ...item, nativeParityClaim: true as false }
          : item,
      ),
    }
    expect(verifyTraceDebugCapturePinnedReplaySnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture-pinned-replay.native-claim",
        product: "pi",
        dimension: "flow-projection",
      }),
    ]))

    const assembledOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes"
          ? { ...item, exactDiffRisk: "assembled-only-native-claim" as const }
          : item,
      ),
    }
    expect(verifyTraceDebugCapturePinnedReplaySnapshot(assembledOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture-pinned-replay.assembled-only-native-claim",
        product: "hermes",
        dimension: "flow-projection",
      }),
    ]))

    const blockerDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeBlockers: [] }
          : item,
      ),
    }
    expect(verifyTraceDebugCapturePinnedReplaySnapshot(blockerDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture-pinned-replay.native-blockers",
        product: "opencode",
        dimension: "flow-projection",
      }),
    ]))

    const borrowedSourceMatrix = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi"
          ? { ...item, sourceAnchors: ["session-message:packages/opencode/src/session/message.ts"] }
          : item,
      ),
    }
    expect(verifyTraceDebugCapturePinnedReplaySnapshot(borrowedSourceMatrix).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture-pinned-replay.borrowed-source-matrix",
        product: "pi",
        dimension: "debug-event",
      }),
    ]))
  })

  it("records trace debug capture exact-diff blockers without claiming native parity", () => {
    const snapshot = buildTraceDebugCaptureExactDiffBlockerSnapshot()
    const verification = verifyTraceDebugCaptureExactDiffBlockerSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:trace-debug-capture-exact-diff-blocker-gate",
      fixtureID: "trace:debug-capture-exact-diff-blocker-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi", "nanobot", "hermes"],
      comparisonDimensions: ["debug-event", "span-order", "redaction", "trace-readback", "flow-projection"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-foundation-trace:source-matrix",
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      exactDiffRisk: "semantic-fixture-needs-exact-diff",
      runtimeProjectionFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      debugEvent: expect.arrayContaining(["trace-debug-event-native-capture:exact-diff-not-proven"]),
      spanOrder: expect.arrayContaining(["trace-span-order-native-sequence:exact-diff-not-proven"]),
      redaction: expect.arrayContaining(["trace-redaction-native-readback:exact-diff-not-proven"]),
      traceReadback: expect.arrayContaining(["trace-readback-native-storage:exact-diff-not-proven"]),
      flowProjection: expect.arrayContaining(["trace-flow-projection-native-loss-detail:exact-diff-not-proven"]),
      nativeEvidenceRefs: expect.arrayContaining([
        "opencode-foundation-trace:source-matrix",
        "conformance:opencode-foundation-trace-source-matrix",
        "conformance:opencode-trace-debug-surface-native-exact-fixture",
        "trace-debug-surface-native-exact:opencode",
        "opencode-trace-debug-surface:native-exact-fixture",
        "debug-event-requires-product-native-capture",
      ]),
      knownLossiness: expect.arrayContaining(["trace-debug-event-native-capture-not-proven", "trace-flow-projection-native-loss-detail-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi")).toMatchObject({
      fixtureID: "pi-trace:source-matrix",
      spanOrder: expect.arrayContaining(["trace-span-order-native-sequence:exact-diff-not-proven"]),
      flowProjection: expect.arrayContaining(["pi-differential-trace.compare", "trace-flow-projection-native-loss-detail:exact-diff-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.redaction).toEqual(expect.arrayContaining([
      "trace-redaction-native-readback:exact-diff-not-proven",
    ]))
    expect(snapshot.cases.find((item) => item.product === "hermes")?.traceReadback).toEqual(expect.arrayContaining([
      "trace-readback-surface",
      "trace-readback-native-storage:exact-diff-not-proven",
    ]))

    const debugDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, debugEvent: [] }
          : item,
      ),
    }
    expect(verifyTraceDebugCaptureExactDiffBlockerSnapshot(debugDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture-exact-diff.debug-event",
        product: "opencode",
        dimension: "debug-event",
      }),
    ]))

    const spanDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi"
          ? { ...item, spanOrder: [] }
          : item,
      ),
    }
    expect(verifyTraceDebugCaptureExactDiffBlockerSnapshot(spanDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture-exact-diff.span-order",
        product: "pi",
        dimension: "span-order",
      }),
    ]))

    const redactionDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, redaction: [] }
          : item,
      ),
    }
    expect(verifyTraceDebugCaptureExactDiffBlockerSnapshot(redactionDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture-exact-diff.redaction",
        product: "nanobot",
        dimension: "redaction",
      }),
    ]))

    const readbackDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes"
          ? { ...item, traceReadback: [] }
          : item,
      ),
    }
    expect(verifyTraceDebugCaptureExactDiffBlockerSnapshot(readbackDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture-exact-diff.trace-readback",
        product: "hermes",
        dimension: "trace-readback",
      }),
    ]))

    const flowDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, flowProjection: [] }
          : item,
      ),
    }
    expect(verifyTraceDebugCaptureExactDiffBlockerSnapshot(flowDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture-exact-diff.flow-projection",
        product: "opencode",
        dimension: "flow-projection",
      }),
    ]))

    const nativeClaim = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi"
          ? { ...item, nativeParityClaim: true as false }
          : item,
      ),
    }
    expect(verifyTraceDebugCaptureExactDiffBlockerSnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture-exact-diff.native-claim",
        product: "pi",
        dimension: "flow-projection",
      }),
    ]))

    const assembledOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes"
          ? { ...item, exactDiffRisk: "assembled-only-native-claim" as const }
          : item,
      ),
    }
    expect(verifyTraceDebugCaptureExactDiffBlockerSnapshot(assembledOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture-exact-diff.assembled-only-native-claim",
        product: "hermes",
        dimension: "flow-projection",
      }),
    ]))

    const blockerDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeBlockers: [] }
          : item,
      ),
    }
    expect(verifyTraceDebugCaptureExactDiffBlockerSnapshot(blockerDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "trace-debug-capture-exact-diff.native-blockers",
        product: "opencode",
        dimension: "flow-projection",
      }),
    ]))
  })

  it("anchors OpenCode event bridges to pinned upstream session event sources", () => {
    const snapshot = buildOpenCodeEventSourceMatrixSnapshot()

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      pinnedRepo: "anomalyco/opencode",
      pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-event-source-matrix",
      fixtureID: "opencode-event:source-matrix",
      partialBranchIDs: expect.arrayContaining([
        "event-envelope-shape",
        "syncevent-stream-projection",
        "message-v2-event-stream",
        "session-projector-row-mapping",
        "event-log-readback",
        "live-syncevent-bus-runtime",
        "exact-event-ordering",
        "sqlite-event-side-effects",
      ]),
      missingBranchIDs: [],
      coveredEventAtomIDs: expect.arrayContaining([
        "opencode.event.envelope-bridge",
        "opencode.event.syncevent-bridge",
      ]),
      coveredEventPortIDs: expect.arrayContaining(["event.envelope", "event.log"]),
      nativeEvidenceRefs: expect.arrayContaining(openCodeEventNativeGateEvidenceRefs),
      fixtureIDs: expect.arrayContaining([
        "opencode-event:source-matrix",
        ...openCodeEventNativeGateFixtureIDs,
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-event-source-matrix-covered-by-partial-fixture",
        "opencode-live-syncevent-bus-runtime-not-replayed",
        "opencode-event-ordering-not-exact",
        "opencode-sqlite-event-side-effects-not-replayed",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(snapshot.sourceRefs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-service",
        path: "packages/opencode/src/session/session.ts",
        symbols: expect.arrayContaining(["Event", "Session", "fromRow", "toRow"]),
      }),
      expect.objectContaining({
        id: "message-v2",
        path: "packages/opencode/src/session/message-v2.ts",
        symbols: expect.arrayContaining(["Event", "Part", "MessageV2", "stream"]),
      }),
      expect.objectContaining({
        id: "session-projectors-next",
        path: "packages/opencode/src/session/projectors-next.ts",
        symbols: expect.arrayContaining(["encodeDateTimes", "encodeMessageData", "sqlite"]),
      }),
      expect.objectContaining({
        id: "local-event-runtime-projection",
        path: "packages/contracts/src/port-fixtures.ts",
        symbols: expect.arrayContaining(["projectOpenCodeEventRuntimeProjection", "OpenCodeEventRuntimeProjection"]),
      }),
      expect.objectContaining({
        id: "local-event-live-runtime-fixture",
        path: "packages/contracts/src/port-fixtures.ts",
        symbols: expect.arrayContaining(["captureOpenCodeEventLiveRuntimeFixture", "verifyOpenCodeEventLiveRuntimeFixture", "OpenCodeEventLiveRuntimeFixture"]),
      }),
    ]))
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "live-syncevent-bus-runtime")).toMatchObject({
      status: "partial",
      eventAtomIDs: expect.arrayContaining(["opencode.event.envelope-bridge", "opencode.event.syncevent-bridge"]),
      eventPortIDs: expect.arrayContaining(["event.envelope", "event.log"]),
      sourceRefIDs: expect.arrayContaining(["local-event-runtime-projection", "local-event-live-runtime-fixture"]),
      localEvidenceRefs: expect.arrayContaining(["opencode-event:runtime-projection", "opencode-event:live-runtime-fixture"]),
      knownGaps: expect.arrayContaining(["opencode-event-live-runtime-fixture-partial-native-gap"]),
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "event-envelope-shape")).toMatchObject({
      localEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-event-envelope-native-exact-fixture",
        "opencode-event-envelope:native-exact-fixture",
        openCodeEventNativeExactEvidenceRef,
        openCodeEventNativeExactFixtureID,
      ]),
      localMarkers: expect.arrayContaining(["event-envelope:native-exact"]),
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "sqlite-event-side-effects")).toMatchObject({
      status: "partial",
      eventAtomIDs: ["opencode.event.syncevent-bridge"],
      eventPortIDs: ["event.log"],
      localEvidenceRefs: expect.arrayContaining(["opencode-event:live-runtime-fixture"]),
      localMarkers: expect.arrayContaining(["sqlite-side-effects:projected", "storage-write:not-exact", "sqlite-transaction:live-readback"]),
      knownGaps: expect.arrayContaining(["opencode-event-live-runtime-fixture-partial-native-gap", "opencode-sqlite-event-side-effects-not-replayed"]),
    })
  })

  it("proves OpenCode event envelope bridge as a native exact module fixture", () => {
    const fixture = captureOpenCodeEventEnvelopeNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.event.envelope-bridge",
      portID: "event.envelope",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-event-envelope-native-exact-fixture",
      replayRef: "event-envelope-native-exact:opencode",
      fixtureID: "opencode-event-envelope:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/bus/bus-event.ts"),
      expect.stringContaining("packages/opencode/src/bus/index.ts"),
      expect.stringContaining("packages/opencode/src/bus/global.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "define-registers-effect-payload",
      "publish-delivers-typed-wildcard-and-global",
      "publish-without-typed-subscriber-keeps-wildcard",
      "global-bus-sync-event-id-fallback",
      "global-bus-generated-id-fallback",
      "dispose-publishes-instance-disposed-wildcard",
    ])
    expect(verifyOpenCodeEventEnvelopeNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeEventEnvelopeBridge({ createID: () => "evt_test" })
    const event = bridge.emitGlobal({ payload: { type: "manual" } })
    expect(event).toEqual({ payload: { id: "evt_test", type: "manual" } })
    expect(verifyOpenCodeEventEnvelopeNativeExactFixture({ ...fixture, knownLossiness: ["partial-event"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-event-envelope.lossiness" }),
    ]))
  })

  it("proves OpenCode SyncEvent log bridge as a native exact module fixture", () => {
    const fixture = captureOpenCodeSyncEventLogNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.event.syncevent-bridge",
      portID: "event.log",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-sync-event-log-native-exact-fixture",
      replayRef: "sync-event-log-native-exact:opencode",
      fixtureID: "opencode-sync-event-log:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/sync/index.ts"),
      expect.stringContaining("packages/opencode/src/sync/event.sql.ts"),
      expect.stringContaining("packages/opencode/src/session/session.ts"),
      expect.stringContaining("packages/opencode/src/session/message-v2.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "define-bus-schema-versioned-type-and-freeze",
      "run-projects-persists-and-publishes",
      "run-errors-for-missing-aggregate-and-old-version",
      "replay-sequence-owner-and-replay-all-rules",
      "remove-and-claim-update-sequence-state",
    ])
    expect(verifyOpenCodeSyncEventLogNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeSyncEventLogBridge()
    expect(bridge.versionedType("message.updated", 1)).toBe("message.updated.1")
    expect(verifyOpenCodeSyncEventLogNativeExactFixture({ ...fixture, knownLossiness: ["partial-sync"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-sync-event-log.lossiness" }),
    ]))
  })

  it("projects OpenCode event runtime signals into a lossy partial fixture", () => {
    const projection = projectOpenCodeEventRuntimeProjection([
      {
        type: "syncevent.bus",
        eventType: "message.update",
        sessionID: "sess-1",
        traceID: "trace-1",
        source: "session",
        payloadKeys: ["messageID", "parts", "parts"],
        sequence: 2,
      },
      {
        type: "syncevent.bus",
        eventType: "session.created",
        payloadKeys: ["sessionID"],
        sequence: 1,
      },
      {
        type: "event.order",
        streamID: "sess-1",
        eventType: "message.update",
        sequence: 2,
        timestamp: "2026-06-12T00:00:02.000Z",
      },
      {
        type: "event.order",
        streamID: "sess-1",
        eventType: "session.created",
        sequence: 1,
      },
      {
        type: "sqlite.write",
        table: "session_event",
        operation: "insert",
        rowKeys: ["id", "payload", "payload", "time"],
        transactionID: "tx-1",
        sequence: 1,
      },
    ])

    expect(projection).toMatchObject({
      schemaVersion: 1,
      fixtureID: "opencode-event:runtime-projection",
      evidenceRef: "conformance:opencode-event-runtime-projection",
      coveredBranchIDs: [
        "live-syncevent-bus-runtime",
        "exact-event-ordering",
        "sqlite-event-side-effects",
      ],
      retainedFields: expect.arrayContaining(["eventType", "sessionID", "payloadKeys", "sequence", "streamID", "timestampObserved", "table", "rowKeys"]),
      lossyFields: expect.arrayContaining([
        "native SyncEvent bus subscription lifecycle",
        "exact async event interleaving",
        "raw payload/private fields",
        "sqlite transaction side effects",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-live-syncevent-bus-runtime-not-replayed",
        "opencode-event-ordering-not-exact",
        "opencode-sqlite-event-side-effects-not-replayed",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(projection.busRuntime).toEqual([
      { eventType: "session.created", sessionID: null, traceID: null, source: null, payloadKeys: ["sessionID"], sequence: 1 },
      { eventType: "message.update", sessionID: "sess-1", traceID: "trace-1", source: "session", payloadKeys: ["messageID", "parts"], sequence: 2 },
    ])
    expect(projection.eventOrdering).toEqual([
      { streamID: "sess-1", eventType: "session.created", sequence: 1, timestampObserved: false },
      { streamID: "sess-1", eventType: "message.update", sequence: 2, timestampObserved: true },
    ])
    expect(projection.sqliteSideEffects).toEqual([
      { table: "session_event", operation: "insert", rowKeys: ["id", "payload", "time"], transactionID: "tx-1", sequence: 1 },
    ])
  })

  it("captures OpenCode event live runtime readback without claiming native parity", () => {
    const fixture = captureOpenCodeEventLiveRuntimeFixture({
      sessionID: "sess-1",
      traceID: "trace-1",
      streamID: "sess-1",
      transactionID: "tx-1",
    })

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      evidenceRef: "conformance:opencode-event-live-runtime-fixture",
      fixtureID: "opencode-event:live-runtime-fixture",
      exactDiffStatus: "live-runtime-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      fixtureDiffTarget: "event.envelope-replay",
      relatedFixtureDiffTargets: ["session.storage-round-trip"],
      coveredBranchIDs: expect.arrayContaining([
        "event-envelope-shape",
        "syncevent-stream-projection",
        "message-v2-event-stream",
        "session-projector-row-mapping",
        "event-log-readback",
        "live-syncevent-bus-runtime",
        "exact-event-ordering",
        "sqlite-event-side-effects",
      ]),
      retainedFields: expect.arrayContaining([
        "SyncEvent bus payload key readback",
        "ordered event stream timestamp readback",
        "sqlite table/row/transaction readback",
        "event log cursor and envelope key readback",
      ]),
      lossyFields: expect.arrayContaining([
        "native SyncEvent bus subscription lifecycle",
        "native async event interleaving",
        "raw event payload/private fields",
        "native sqlite transaction side effects",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-event-live-runtime-fixture-partial-native-gap",
        "opencode-live-syncevent-bus-runtime-not-replayed",
        "opencode-event-ordering-not-exact",
        "opencode-sqlite-event-side-effects-not-replayed",
        "opencode-event-raw-payload-private-fields-not-replayed",
        "opencode-event-projector-side-effects-not-replayed",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.busReadback).toEqual([
      expect.objectContaining({
        eventType: "message.update",
        sessionID: "sess-1",
        traceID: "trace-1",
        payloadKeys: expect.arrayContaining(["messageID", "parts", "sessionID"]),
        subscriberCount: 2,
        deliveryID: "delivery_event_fixture_001",
        payloadHash: expect.stringMatching(/^[a-f0-9]{16}$/),
      }),
    ])
    expect(fixture.orderingReadback).toEqual([
      expect.objectContaining({
        eventType: "session.created",
        previousEventType: null,
        monotonicOrderMarker: "source-order-0001",
      }),
      expect.objectContaining({
        eventType: "message.update",
        previousEventType: "session.created",
        monotonicOrderMarker: "source-order-0002",
        timestampHash: expect.stringMatching(/^[a-f0-9]{16}$/),
      }),
    ])
    expect(fixture.sqliteReadback).toEqual([
      expect.objectContaining({
        table: "session_event",
        operation: "insert",
        rowKeys: expect.arrayContaining(["payload", "sessionID", "time"]),
        transactionID: "tx-1",
        cursorKey: "updated_at:id",
        fsyncMarker: "deterministic-local",
      }),
    ])
    expect(fixture.eventLogReadback).toEqual([
      expect.objectContaining({
        streamID: "sess-1",
        eventTypes: ["session.created", "message.update"],
        envelopeKeys: expect.arrayContaining(["payload", "sessionID", "traceID"]),
        messagePartKinds: expect.arrayContaining(["text", "tool-call", "tool-result"]),
        readbackCursor: "updated_at:id:0002",
      }),
    ])
    expect(fixture.eventRuntimeProjection).toMatchObject({
      fixtureID: "opencode-event:runtime-projection",
      evidenceRef: "conformance:opencode-event-runtime-projection",
      coveredBranchIDs: ["live-syncevent-bus-runtime", "exact-event-ordering", "sqlite-event-side-effects"],
    })
    expect(verifyOpenCodeEventLiveRuntimeFixture(fixture)).toEqual({ ok: true, issues: [] })

    const nativeClaim = {
      ...fixture,
      nativeParityClaim: true as unknown as false,
    }
    expect(verifyOpenCodeEventLiveRuntimeFixture(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-event-live-runtime.native-claim" }),
    ]))

    const missingBusReadback = {
      ...fixture,
      busReadback: [],
    }
    expect(verifyOpenCodeEventLiveRuntimeFixture(missingBusReadback).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-event-live-runtime.bus-readback" }),
    ]))

    const missingSqliteReadback = {
      ...fixture,
      sqliteReadback: [],
    }
    expect(verifyOpenCodeEventLiveRuntimeFixture(missingSqliteReadback).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-event-live-runtime.sqlite-readback" }),
    ]))

    const missingNativeGap = {
      ...fixture,
      knownGaps: fixture.knownGaps.filter((gap) => gap !== "opencode-event-live-runtime-fixture-partial-native-gap"),
    }
    expect(verifyOpenCodeEventLiveRuntimeFixture(missingNativeGap).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-event-live-runtime.native-gaps" }),
    ]))
  })

  it("anchors Pi, Nanobot, and Hermes event bridges to product source matrix partial fixtures", () => {
    const snapshots = [
      buildPiEventSourceMatrixSnapshot(),
      buildNanobotEventSourceMatrixSnapshot(),
      buildHermesEventSourceMatrixSnapshot(),
    ]

    expect(snapshots.map((snapshot) => snapshot.product)).toEqual(["pi", "nanobot", "hermes"])
    for (const snapshot of snapshots) {
      const prefix = snapshot.product
      const expectedAtoms =
        prefix === "pi"
          ? ["pi.event.envelope-bridge", "pi.event.runtime-bridge", "pi.extension.runtime-event-bridge"]
          : prefix === "nanobot"
            ? ["nanobot.event.envelope-bridge", "nanobot.event.bus-bridge"]
            : ["hermes.event.envelope-bridge", "hermes.event.runtime-bridge"]

      expect(snapshot).toMatchObject({
        schemaVersion: 1,
        evidenceRef: `conformance:${prefix}-event-source-matrix`,
        fixtureID: `${prefix}-event:source-matrix`,
        partialBranchIDs: expect.arrayContaining([
          "event-envelope-shape-surface",
          "runtime-event-stream-surface",
          "event-persistence-surface",
          "dropped-field-negative-surface",
        ]),
        missingBranchIDs: expect.arrayContaining([
          "native-event-ordering",
          "native-event-persistence-readback",
          "native-dropped-field-negative",
        ]),
        coveredEventAtomIDs: expect.arrayContaining(expectedAtoms),
        coveredEventPortIDs: expect.arrayContaining(["event.envelope", "event.log"]),
        knownGaps: expect.arrayContaining([
          `${prefix}-event-source-matrix-covered-by-partial-fixture`,
        ]),
        fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      })
      expect(snapshot.sourceRefs.some((ref) => ref.repo === "helix/local" && ref.path === "packages/contracts/src/port-fixtures.ts")).toBe(true)
      expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "event-envelope-shape-surface")).toMatchObject({
        status: "partial",
        eventAtomIDs: [expectedAtoms[0]],
        eventPortIDs: ["event.envelope"],
      })
      expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "native-event-ordering")).toMatchObject({
        status: "missing",
        eventAtomIDs: expect.arrayContaining(expectedAtoms),
        eventPortIDs: expect.arrayContaining(["event.envelope", "event.log"]),
      })
    }
  })

  it("records event envelope replay positive and negative gates", () => {
    const snapshot = buildEventEnvelopeReplayGateSnapshot()
    const verification = verifyEventEnvelopeReplayGateSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:event-envelope-replay-gate",
      fixtureID: "event:envelope-replay-gate",
      products: ["opencode", "pi", "nanobot", "hermes"],
      comparisonDimensions: ["field-shape", "event-order", "dropped-field-negative", "persistence", "replay"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-event:source-matrix",
      evidenceRefs: expect.arrayContaining([
        "conformance:opencode-event-source-matrix",
        "contracts-schema:event-envelope",
        ...openCodeEventNativeGateEvidenceRefs,
        ...openCodeEventNativeGateFixtureIDs,
      ]),
      nativeEvidenceRefs: expect.arrayContaining(openCodeEventNativeGateEvidenceRefs),
      fixtureIDs: expect.arrayContaining([
        "opencode-event:source-matrix",
        ...openCodeEventNativeGateFixtureIDs,
      ]),
      knownLossiness: expect.arrayContaining(["opencode-event-source-matrix-covered-by-partial-fixture"]),
      fieldShape: expect.arrayContaining(["type", "timestamp", "payload"]),
      eventOrder: expect.arrayContaining(["event-envelope-shape", "event-log-readback"]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")).toMatchObject({
      fixtureID: "nanobot-event:source-matrix",
      persistence: expect.arrayContaining(["event-persistence-surface"]),
      replay: expect.arrayContaining([expect.stringContaining("upstream-channel-envelope:nanobot/channels/websocket.py")]),
    })

    const fieldDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, fieldShape: item.fieldShape.filter((field) => field !== "payload") }
          : item,
      ),
    }
    expect(verifyEventEnvelopeReplayGateSnapshot(fieldDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-envelope.field-shape",
        product: "opencode",
        dimension: "field-shape",
      }),
    ]))

    const orderingDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi"
          ? { ...item, eventOrder: [...item.eventOrder].reverse() }
          : item,
      ),
    }
    expect(verifyEventEnvelopeReplayGateSnapshot(orderingDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-envelope.event-order",
        product: "pi",
        dimension: "event-order",
      }),
    ]))

    const persistenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes"
          ? { ...item, persistence: [] }
          : item,
      ),
    }
    expect(verifyEventEnvelopeReplayGateSnapshot(persistenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-envelope.persistence",
        product: "hermes",
        dimension: "persistence",
      }),
    ]))

    const nativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeEvidenceRefs: [], fixtureIDs: [] }
          : item,
      ),
    }
    expect(verifyEventEnvelopeReplayGateSnapshot(nativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-envelope.native-exact-evidence",
        product: "opencode",
        dimension: "replay",
      }),
    ]))
  })

  it("records event envelope exact-diff blockers without claiming native parity", () => {
    const snapshot = buildEventEnvelopeExactDiffBlockerSnapshot()
    const verification = verifyEventEnvelopeExactDiffBlockerSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:event-envelope-exact-diff-blocker-gate",
      fixtureID: "event:envelope-exact-diff-blocker-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi", "nanobot", "hermes"],
      comparisonDimensions: ["field-shape", "event-order", "dropped-field-negative", "persistence", "replay"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-event:source-matrix",
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      fieldShape: expect.arrayContaining(["type", "timestamp", "payload", "upstream-required-field-shape:not-exact"]),
      eventOrder: expect.arrayContaining(["event-envelope-shape", "event-log-readback", "native-event-ordering:not-exact"]),
      sourceAnchors: expect.arrayContaining([
        "message-v2:packages/opencode/src/session/message-v2.ts",
        "session-projectors-next:packages/opencode/src/session/projectors-next.ts",
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-event-source-matrix",
        "contracts-schema:event-envelope",
        ...openCodeEventNativeGateEvidenceRefs,
        ...openCodeEventNativeGateFixtureIDs,
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-event:source-matrix",
        ...openCodeEventNativeGateFixtureIDs,
      ]),
      exactDiffRisk: "semantic-fixture-needs-exact-diff",
    })
    expect(snapshot.cases.find((item) => item.product === "pi")).toMatchObject({
      sourceAnchors: expect.arrayContaining(["upstream-message-envelope:packages/agent/src/harness/messages.ts"]),
      eventOrder: expect.arrayContaining(["event-envelope-shape-surface", "runtime-event-stream-surface"]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")).toMatchObject({
      sourceAnchors: expect.arrayContaining(["upstream-channel-envelope:nanobot/channels/websocket.py"]),
      persistence: expect.arrayContaining(["event-persistence-surface", "persistence-readback:not-exact"]),
    })
    expect(snapshot.cases.find((item) => item.product === "hermes")).toMatchObject({
      sourceAnchors: expect.arrayContaining(["upstream-codex-event-projector:agent/transports/codex_event_projector.py"]),
      replay: expect.arrayContaining(["upstream-event-stream:exact-diff-not-proven"]),
    })

    const fieldDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, fieldShape: item.fieldShape.filter((field) => field !== "payload") }
          : item,
      ),
    }
    expect(verifyEventEnvelopeExactDiffBlockerSnapshot(fieldDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-envelope-exact-diff.field-shape",
        product: "opencode",
        dimension: "field-shape",
      }),
    ]))

    const orderDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi"
          ? { ...item, eventOrder: [] }
          : item,
      ),
    }
    expect(verifyEventEnvelopeExactDiffBlockerSnapshot(orderDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-envelope-exact-diff.event-order",
        product: "pi",
        dimension: "event-order",
      }),
    ]))

    const negativeDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, droppedFieldNegative: [] }
          : item,
      ),
    }
    expect(verifyEventEnvelopeExactDiffBlockerSnapshot(negativeDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-envelope-exact-diff.dropped-field-negative",
        product: "nanobot",
        dimension: "dropped-field-negative",
      }),
    ]))

    const persistenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes"
          ? { ...item, persistence: [] }
          : item,
      ),
    }
    expect(verifyEventEnvelopeExactDiffBlockerSnapshot(persistenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-envelope-exact-diff.persistence",
        product: "hermes",
        dimension: "persistence",
      }),
    ]))

    const replayDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, replay: [] }
          : item,
      ),
    }
    expect(verifyEventEnvelopeExactDiffBlockerSnapshot(replayDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-envelope-exact-diff.replay",
        product: "opencode",
        dimension: "replay",
      }),
    ]))

    const nativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeEvidenceRefs: [], fixtureIDs: [] }
          : item,
      ),
    }
    expect(verifyEventEnvelopeExactDiffBlockerSnapshot(nativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-envelope-exact-diff.native-exact-evidence",
        product: "opencode",
        dimension: "replay",
      }),
    ]))

    const nativeClaim = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi"
          ? { ...item, nativeParityClaim: true as false }
          : item,
      ),
    }
    expect(verifyEventEnvelopeExactDiffBlockerSnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-envelope-exact-diff.native-claim",
        product: "pi",
        dimension: "field-shape",
      }),
    ]))

    const harnessOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes"
          ? { ...item, exactDiffRisk: "helix-only" as const }
          : item,
      ),
    }
    expect(verifyEventEnvelopeExactDiffBlockerSnapshot(harnessOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-envelope-exact-diff.helix-only",
        product: "hermes",
        dimension: "replay",
      }),
    ]))
  })

  it("records event envelope pinned replay fixtures without upgrading native parity", () => {
    const snapshot = buildEventEnvelopePinnedReplaySnapshot()
    const verification = verifyEventEnvelopePinnedReplaySnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:event-envelope-pinned-replay-gate",
      fixtureID: "event:envelope-pinned-replay-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi", "nanobot", "hermes"],
      comparisonDimensions: ["field-shape", "event-order", "dropped-field-negative", "persistence", "replay"],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-event:source-matrix",
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      exactDiffRisk: "pinned-stream-needs-live-readback",
      upstreamEvents: expect.arrayContaining([
        expect.objectContaining({ type: "session.created", source: "session/projectors-next", persistenceRef: "opencode:pinned-readback:1" }),
        expect.objectContaining({ type: "message.part.updated", source: "session/message-v2", persistenceRef: "opencode:pinned-readback:2" }),
      ]),
      assembledEvents: expect.arrayContaining([
        expect.objectContaining({ type: "session.created", source: "session/projectors-next", persistenceRef: "opencode:pinned-readback:1" }),
      ]),
      droppedFieldNegative: ["type", "timestamp", "payload"],
      persistenceReadback: expect.arrayContaining(["pinned-event-stream-readback:exact-match", "product-native-persistence-readback:fixture-level-only"]),
      replayAnchors: expect.arrayContaining([
        "conformance:opencode-event-source-matrix",
        "opencode-event:source-matrix",
        ...openCodeEventNativeGateEvidenceRefs,
        ...openCodeEventNativeGateFixtureIDs,
      ]),
      sourceAnchors: expect.arrayContaining(["message-v2:packages/opencode/src/session/message-v2.ts"]),
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:opencode-event-source-matrix",
        "contracts-schema:event-envelope",
        ...openCodeEventNativeGateEvidenceRefs,
        ...openCodeEventNativeGateFixtureIDs,
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-event:source-matrix",
        ...openCodeEventNativeGateFixtureIDs,
      ]),
      knownLossiness: expect.arrayContaining(["event-envelope-product-native-persistence-readback-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi")).toMatchObject({
      upstreamEvents: expect.arrayContaining([
        expect.objectContaining({ type: "agent-session.started", source: "agent-session-runtime" }),
        expect.objectContaining({ type: "extension.runtime-event", source: "extension-runner" }),
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")).toMatchObject({
      upstreamEvents: expect.arrayContaining([
        expect.objectContaining({ type: "progress.started", source: "progress-hook" }),
        expect.objectContaining({ type: "websocket.delta", source: "websocket-channel" }),
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "hermes")).toMatchObject({
      upstreamEvents: expect.arrayContaining([
        expect.objectContaining({ type: "codex.response.created", source: "codex-event-projector" }),
        expect.objectContaining({ type: "runtime.tool-call", source: "transport-runtime" }),
      ]),
    })

    const fieldDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              assembledEvents: item.assembledEvents.map((event, index) =>
                index === 0
                  ? { ...event, payload: { ...event.payload, title: "Drifted title" } }
                  : event,
              ),
            }
          : item,
      ),
    }
    expect(verifyEventEnvelopePinnedReplaySnapshot(fieldDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-envelope-pinned-replay.field-shape",
        product: "opencode",
        dimension: "field-shape",
      }),
    ]))

    const orderDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi"
          ? { ...item, assembledEvents: [...item.assembledEvents].reverse() }
          : item,
      ),
    }
    expect(verifyEventEnvelopePinnedReplaySnapshot(orderDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-envelope-pinned-replay.event-order",
        product: "pi",
        dimension: "event-order",
      }),
    ]))

    const persistenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, persistenceReadback: [] }
          : item,
      ),
    }
    expect(verifyEventEnvelopePinnedReplaySnapshot(persistenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-envelope-pinned-replay.persistence",
        product: "nanobot",
        dimension: "persistence",
      }),
    ]))

    const negativeDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes"
          ? { ...item, droppedFieldNegative: ["type", "timestamp", "unknown-field"] }
          : item,
      ),
    }
    expect(verifyEventEnvelopePinnedReplaySnapshot(negativeDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-envelope-pinned-replay.dropped-field-negative",
        product: "hermes",
        dimension: "dropped-field-negative",
      }),
    ]))

    const nativeClaim = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi"
          ? { ...item, nativeParityClaim: true as false }
          : item,
      ),
    }
    expect(verifyEventEnvelopePinnedReplaySnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-envelope-pinned-replay.native-claim",
        product: "pi",
        dimension: "replay",
      }),
    ]))

    const nativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeEvidenceRefs: [], fixtureIDs: [] }
          : item,
      ),
    }
    expect(verifyEventEnvelopePinnedReplaySnapshot(nativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-envelope-pinned-replay.native-exact-evidence",
        product: "opencode",
        dimension: "replay",
      }),
    ]))

    const harnessOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, exactDiffRisk: "helix-only" as const }
          : item,
      ),
    }
    expect(verifyEventEnvelopePinnedReplaySnapshot(harnessOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-envelope-pinned-replay.helix-only",
        product: "opencode",
        dimension: "replay",
      }),
    ]))
  })

  it("guards event public exports as partial lossy fixtures", () => {
    const surface = buildEventPublicExportSurfaceGuard()
    const verification = verifyEventPublicExportSurfaceGuard(surface)

    expect(surface).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:event-public-export-surface-guard",
      fixtureID: "event:public-export-surface-guard",
      publicSurfacePolicy: "partial-lossy-only",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      exportedBuilders: [
        "buildEventEnvelopeReplayGateSnapshot",
        "buildEventEnvelopeExactDiffBlockerSnapshot",
        "buildEventEnvelopePinnedReplaySnapshot",
      ],
      exportedVerifiers: [
        "verifyEventEnvelopeReplayGateSnapshot",
        "verifyEventEnvelopeExactDiffBlockerSnapshot",
        "verifyEventEnvelopePinnedReplaySnapshot",
      ],
      comparisonDimensions: ["field-shape", "event-order", "dropped-field-negative", "persistence", "replay"],
      fixtureRefs: expect.arrayContaining([
        expect.objectContaining({
          fixtureID: "event:envelope-replay-gate",
          exposure: "partial-lossy-fixture",
          exactDiffStatus: "exact-diff-partial",
          nativeParityClaim: false,
          knownLossiness: expect.arrayContaining(["event-public-export-surface-native-parity-not-proven"]),
          fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        }),
        expect.objectContaining({
          fixtureID: "event:envelope-exact-diff-blocker-gate",
          exposure: "partial-lossy-fixture",
          exactDiffStatus: "exact-diff-partial",
          nativeParityClaim: false,
          knownLossiness: expect.arrayContaining(["event-envelope-native-ordering-not-proven"]),
        }),
        expect.objectContaining({
          fixtureID: "event:envelope-pinned-replay-gate",
          exposure: "partial-lossy-fixture",
          exactDiffStatus: "exact-diff-partial",
          nativeParityClaim: false,
          knownLossiness: expect.arrayContaining(["event-envelope-product-native-persistence-readback-not-proven"]),
        }),
      ]),
      nativeBlockers: expect.arrayContaining([
        "native-event-ordering:not-proven",
        "product-native-event-persistence-readback:not-proven",
        "dropped-field-negative:not-exhaustive",
      ]),
    })
    expect(verification).toEqual({ ok: true, issues: [] })

    const nativeClaim = {
      ...surface,
      nativeParityClaim: true as false,
    }
    expect(verifyEventPublicExportSurfaceGuard(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "event-public-export.native-claim" }),
    ]))

    const builderDrop = {
      ...surface,
      exportedBuilders: surface.exportedBuilders.filter((builder) => builder !== "buildEventEnvelopePinnedReplaySnapshot"),
    }
    expect(verifyEventPublicExportSurfaceGuard(builderDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-public-export.builder",
        exportedName: "buildEventEnvelopePinnedReplaySnapshot",
      }),
    ]))

    const fixtureNativeClaim = {
      ...surface,
      fixtureRefs: surface.fixtureRefs.map((fixtureRef) =>
        fixtureRef.fixtureID === "event:envelope-pinned-replay-gate"
          ? { ...fixtureRef, nativeParityClaim: true as false }
          : fixtureRef,
      ),
    }
    expect(verifyEventPublicExportSurfaceGuard(fixtureNativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-public-export.fixture-native-claim",
        fixtureID: "event:envelope-pinned-replay-gate",
      }),
    ]))

    const lossinessDrop = {
      ...surface,
      fixtureRefs: surface.fixtureRefs.map((fixtureRef) =>
        fixtureRef.fixtureID === "event:envelope-replay-gate"
          ? { ...fixtureRef, knownLossiness: [] }
          : fixtureRef,
      ),
    }
    expect(verifyEventPublicExportSurfaceGuard(lossinessDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "event-public-export.lossiness",
        fixtureID: "event:envelope-replay-gate",
      }),
    ]))

    const misleadingSummary = {
      ...surface,
      summary: "event envelope native parity complete",
    }
    expect(verifyEventPublicExportSurfaceGuard(misleadingSummary).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "event-public-export.summary" }),
    ]))
  })

  it("anchors OpenCode metadata overlays to demotion matrix evidence without upgrading them to executable ports", () => {
    const snapshot = buildOpenCodeMetadataOverlayDemotionMatrixSnapshot()

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      pinnedRepo: "anomalyco/opencode",
      pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-metadata-overlay-demotion-matrix",
      fixtureID: "opencode-metadata:overlay-demotion-matrix",
      partialBranchIDs: expect.arrayContaining([
        "foundation-alias-overlay",
        "product-conformance-gate-overlay",
        "prompt-resource-grant-overlay",
        "provider-cassette-overlay",
        "runtime-defaults-overlay",
        "trace-sqlite-projection-overlay",
        "turn-cadence-emitter-overlay",
        "metadata-executable-negative-guard",
      ]),
      coveredMetadataAtomIDs: expect.arrayContaining([
        "opencode.block.compatibility-metadata",
        "opencode.capability.aliases",
        "opencode.conformance.product-gate",
        "opencode.provider.cassette-artifact",
        "opencode.recipe.binding-aliases",
        "opencode.resource.grant-defaults",
        "opencode.runtime.binding-defaults",
        "opencode.runtime.capability-aliases",
        "opencode.runtime.graph-labels",
        "opencode.runtime.lifecycle-defaults",
        "opencode.runtime.module-aliases",
        "opencode.trace.sqlite-part-projection",
        "opencode.turn.cadence-emitter",
      ]),
      coveredMetadataPortIDs: expect.arrayContaining([
        "block.manifest",
        "capability.ref",
        "conformance.ref",
        "provider.cassette",
        "recipe.binding",
        "resource.grant",
        "runtime.binding-planner",
        "runtime.capability-resolver",
        "runtime.assembly-graph",
        "runtime.lifecycle-runner",
        "runtime.module-catalog",
        "cadence.projector",
        "cadence.emitter",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-metadata-overlay-demotion-matrix-covered-by-partial-fixture",
        "opencode-metadata-overlay-native-runtime-not-proven",
        "opencode-metadata-overlay-executable-negative-guard-only",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(snapshot.sourceRefs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "session-prompt-reference",
        path: "packages/opencode/src/session/prompt/reference.ts",
        symbols: expect.arrayContaining(["ReferencePromptMetadata", "ReferencePrompt"]),
      }),
      expect.objectContaining({
        id: "upstream-runtime",
        path: "packages/opencode/src/cli/cmd/run/runtime.ts",
        symbols: expect.arrayContaining(["Runtime", "RuntimeInput"]),
      }),
      expect.objectContaining({
        id: "local-executable-port-rules",
        path: "packages/recipes/src/assembly-contract.ts",
        symbols: expect.arrayContaining(["metadataOverlayFixtureIDs", "knownLossinessForAtom"]),
      }),
    ]))
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "metadata-executable-negative-guard")).toMatchObject({
      status: "partial",
      metadataAtomIDs: expect.arrayContaining(["opencode.runtime.module-aliases", "opencode.turn.cadence-emitter"]),
      metadataPortIDs: expect.arrayContaining(["runtime.module-catalog", "cadence.emitter"]),
      localMarkers: expect.arrayContaining(["metadata-overlay-source", "not-executable-provider", "demotion-guard-only"]),
      knownGaps: expect.arrayContaining(["opencode-metadata-overlay-executable-negative-guard-only"]),
    })
  })

  it("publishes contract fixtures for every currently declared lego port", () => {
    const fixtures = allPortContractFixtures()
    expect(fixtures.map((fixture) => fixture.id).sort()).toEqual([...expectedPortIDs].sort())
  })

  it("makes each port fixture explicit enough for independent conformance planning", () => {
    for (const fixture of allPortContractFixtures()) {
      expect(fixture.input, `${fixture.id}:input`).not.toEqual("")
      expect(fixture.output, `${fixture.id}:output`).not.toEqual("")
      expect(fixture.lifecycle.length, `${fixture.id}:lifecycle`).toBeGreaterThan(0)
      expect(fixture.conformance, `${fixture.id}:conformance`).toMatch(/^[a-z0-9-]+:/)
      expect(fixture.implementations.length, `${fixture.id}:implementations`).toBeGreaterThan(0)
      expect(Array.isArray(fixture.resources), `${fixture.id}:resources`).toBe(true)
      expect(Array.isArray(fixture.personalityAtoms), `${fixture.id}:personalityAtoms`).toBe(true)
      const inventory = normalizePortContractFixture(fixture)
      expect(inventory.errors.length, `${fixture.id}:errors`).toBeGreaterThan(0)
      expect(inventory.traces.length, `${fixture.id}:traces`).toBeGreaterThan(0)
      expect(inventory.testAtoms.length, `${fixture.id}:testAtoms`).toBeGreaterThan(0)
      expect(inventory.portContract.errors, `${fixture.id}:portContract.errors`).toEqual(inventory.errors)
      expect(inventory.portContract.traces, `${fixture.id}:portContract.traces`).toEqual(inventory.traces)
      expect(inventory.commonBlocks.length, `${fixture.id}:commonBlocks`).toBeGreaterThan(0)
      expect(inventory.testBlocks.every((block) => block.type === "atom" && block.personality === "common"), `${fixture.id}:testBlocks`).toBe(true)
      expect(inventory.blocks.every((block) => block.port === fixture.id && block.id.length > 0), `${fixture.id}:blocks`).toBe(true)
    }
  })

  it("keeps product-specific adapters behind personality atoms in the fixture catalog", () => {
    const fixtures = allPortContractFixtures()
    const commonImplementations = fixtures.flatMap((fixture) => fixture.implementations)
    const personalityAtoms = fixtures.flatMap((fixture) => fixture.personalityAtoms)

    expect(commonImplementations.some((id) => id.startsWith("opencode.") || id.startsWith("pi."))).toBe(false)
    expect(personalityAtoms).toEqual(expect.arrayContaining(["opencode.hook.plugin-bridge", "pi.hook.extension-bridge"]))
    expect(personalityAtoms).toEqual(expect.arrayContaining(["opencode.tui.shell", "pi.tui.shell"]))
  })

  it("marks product prompt support aliases as metadata-only and keeps common prompt support executable", () => {
    const fixtures = allPortContractFixtures().map((fixture) => normalizePortContractFixture(fixture))
    const byPort = new Map(fixtures.map((fixture) => [fixture.id, fixture]))
    const productNativePromptSupportAtoms = new Set([
      "opencode.resource.discovery.instruction",
      "opencode.prompt.resource-loader.instruction",
      "opencode.prompt.tool-renderer.provider-tools",
      "opencode.prompt.model-capability-adapter.provider-prompt",
      "opencode.prompt.compaction-adapter.build-prompt",
      "pi.resource.discovery.project-context",
      "pi.prompt.resource-loader.project-context",
      "pi.prompt.tool-renderer.runtime-tools",
      "pi.prompt.model-capability-adapter.runtime-model",
      "pi.prompt.compaction-adapter.summary-mode",
    ])
    const supportPorts = [
      "resource.discovery",
      "prompt.resource-loader",
      "prompt.tool-renderer",
      "prompt.model-capability-adapter",
      "prompt.compaction-adapter",
    ]

    for (const portID of supportPorts) {
      const fixture = byPort.get(portID)
      if (!fixture) throw new Error(`missing prompt support fixture ${portID}`)
      expect(fixture.commonBlocks.every((block) => block.implementationKind === "factory"), portID).toBe(true)
      expect(
        fixture.personalityBlocks.every((block) => block.implementationKind === "metadata-only" || productNativePromptSupportAtoms.has(block.id)),
        portID,
      ).toBe(true)
    }
  })

  it("distinguishes replaceable atoms, packs, test atoms, and product shells in the inventory", () => {
    const fixtures = allPortContractFixtures().map((fixture) => normalizePortContractFixture(fixture))
    const tools = fixtures.find((fixture) => fixture.id === "tools")
    const productShell = fixtures.find((fixture) => fixture.id === "product.shell")
    if (!tools || !productShell) throw new Error("missing tools or product shell inventory rows")

    expect(tools.commonBlocks).toEqual(expect.arrayContaining([expect.objectContaining({ id: "tool-pack.echo", type: "pack", personality: "common" })]))
    expect(tools.testBlocks).toEqual(expect.arrayContaining([expect.objectContaining({ id: "test.tools.mock", type: "atom", source: "test" })]))
    expect(productShell.commonBlocks).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "product.shell.minimal-cli", type: "product-shell", personality: "common" })]),
    )
    expect(productShell.personalityBlocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "opencode.product-shell.server", type: "product-shell", personality: "opencode" }),
        expect.objectContaining({ id: "opencode.product-shell.tui", type: "product-shell", personality: "opencode", implementationKind: "factory" }),
        expect.objectContaining({ id: "opencode.product-shell.web", type: "product-shell", personality: "opencode", implementationKind: "preview" }),
        expect.objectContaining({ id: "pi.product-shell.tui", type: "product-shell", personality: "pi-mono", implementationKind: "factory" }),
        expect.objectContaining({ id: "pi.product-shell.rpc", type: "product-shell", personality: "pi-mono" }),
        expect.objectContaining({ id: "pi.product-shell.web-ui", type: "product-shell", personality: "pi-mono", implementationKind: "factory" }),
        expect.objectContaining({ id: "pi.product-shell.browser-smoke", type: "product-shell", personality: "pi-mono", implementationKind: "factory" }),
        expect.objectContaining({ id: "pi.product-shell.release-hardening", type: "product-shell", personality: "pi-mono", implementationKind: "factory" }),
        expect.objectContaining({ id: "nanobot.product-shell.tui", type: "product-shell", personality: "nanobot", implementationKind: "factory" }),
        expect.objectContaining({ id: "nanobot.product-shell.web-ui", type: "product-shell", personality: "nanobot", implementationKind: "factory" }),
        expect.objectContaining({ id: "hermes.product-shell.tui", type: "product-shell", personality: "hermes-agent", implementationKind: "factory" }),
        expect.objectContaining({ id: "hermes.product-shell.web-dashboard", type: "product-shell", personality: "hermes-agent", implementationKind: "factory" }),
      ]),
    )
  })
})

function allPortContractFixtures(): LegoPortContractFixture[] {
  return [
    ...sessionPortContractFixtures,
    ...contractPortContractFixtures,
    ...runtimePortContractFixtures,
    ...hookPortContractFixtures,
    ...turnPortContractFixtures,
    ...toolPortContractFixtures,
    ...providerPortContractFixtures,
    ...configPortContractFixtures,
    ...promptPortContractFixtures,
    ...uiPortContractFixtures,
  ]
}
