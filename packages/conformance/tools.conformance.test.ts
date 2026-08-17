import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { describe, expect, it } from "vitest"
import {
  buildHermesAgentToolSourceMatrixSnapshot,
  buildNanobotToolSourceMatrixSnapshot,
  buildOpenCodeToolSourceMatrixSnapshot,
  buildPiMonoToolSourceMatrixSnapshot,
  buildToolContractEnvelopeExactDiffBlockerSnapshot,
  buildToolContractEnvelopePinnedReplaySnapshot,
  buildToolContractEnvelopeReplayGateSnapshot,
  buildOpenCodeToolSchemaNativeExactFixture,
  captureOpenCodeToolLiveRuntimeFixture,
  createDefaultTools,
  createFileMutationQueue,
  openCodeToolNativeExactEvidenceRef,
  openCodeToolNativeExactFixtureID,
  openCodeToolNativeExactReplayRef,
  openCodeToolSchemaNativeDescriptor,
  projectOpenCodeToolContractRenderProjection,
  projectOpenCodeToolRuntimeProjection,
  verifyOpenCodeToolLiveRuntimeFixture,
  verifyOpenCodeToolSchemaNativeExactFixture,
  verifyToolContractEnvelopeExactDiffBlockerSnapshot,
  verifyToolContractEnvelopePinnedReplaySnapshot,
  verifyToolContractEnvelopeReplayGateSnapshot,
} from "@helix/lego-tools"
import {
  buildToolPublicPortSurfaceGuardSnapshot,
  createAlwaysDenyPermissionPolicy,
  createDisabledProcessRunnerPort,
  createDryRunProcessRunnerPort,
  createMemoryFilesystemPort,
  createReadonlyFilesystemPort,
  filesystemPortToken,
  processRunnerPortToken,
  toolPermissionPolicyToken,
  verifyToolPublicPortSurfaceGuardSnapshot,
} from "@helix/lego-tools/ports"
import {
  buildToolPublicAtomSurfaceGuardSnapshot,
  createDefaultToolPacks,
  createToolPackTools,
  filesystemPortImplementations,
  processRunnerPortImplementations,
  toolAtomTypes,
  toolPackCatalog,
  toolPermissionPolicies,
  toolSchemaAdapters,
  verifyToolPublicAtomSurfaceGuardSnapshot,
} from "@helix/lego-tools/tool-atoms"
import {
  captureOpenCodeToolStatusNativeExactFixture,
  createOpenCodeToolStatusBridge,
  verifyOpenCodeToolStatusNativeExactFixture,
} from "@helix/adapters-opencode/opencode-tool-status"
import {
  captureOpenCodePluginPermissionBridgeNativeExactFixture,
  createOpenCodeNativePluginPermissionBridge,
  verifyOpenCodePluginPermissionBridgeNativeExactFixture,
} from "@helix/adapters-opencode/opencode-plugin-permission-bridge"
import {
  captureOpenCodeToolPermissionRenderNativeExactFixture,
  createOpenCodeToolPermissionRenderBridge,
  verifyOpenCodeToolPermissionRenderNativeExactFixture,
} from "@helix/adapters-opencode/opencode-tool-permission-render"
import {
  captureOpenCodeToolSchemaBridgeNativeExactFixture,
  createOpenCodeToolSchemaBridge,
  verifyOpenCodeToolSchemaBridgeNativeExactFixture,
} from "@helix/adapters-opencode/opencode-tool-schema-bridge"
import {
  captureOpenCodeWorkspaceFilesystemNativeExactFixture,
  createOpenCodeWorkspaceFilesystemBridge,
  verifyOpenCodeWorkspaceFilesystemNativeExactFixture,
} from "@helix/adapters-opencode/opencode-workspace-filesystem"

describe("default tool conformance", () => {
  it("registers the coding-agent core tool surface", () => {
    const tools = createDefaultTools()
    expect(tools.map((tool) => tool.name).sort()).toEqual(
      [
        "bash",
        "edit",
        "echo",
        "find",
        "grep",
        "ls",
        "read",
        "subagent",
        "task",
        "todo",
        "write",
      ].sort(),
    )
  })

  it("declares tool atom types, default packs, and replacement matrices", () => {
    expect(toolAtomTypes.map((atom) => atom.id)).toEqual([
      "tool.definition",
      "tool.schema-adapter",
      "tool.permission-policy",
      "tool.executor",
      "tool.result-normalizer",
      "tool.audit-log",
    ])
    expect(toolPackCatalog.map((pack) => [pack.id, pack.tools])).toEqual([
      ["tool-pack.echo", ["echo"]],
      ["tool-pack.filesystem", ["read", "write", "edit", "ls", "find", "grep"]],
      ["tool-pack.shell", ["bash"]],
      ["tool-pack.meta", ["todo", "task", "subagent"]],
    ])
    expect(toolPackCatalog.find((pack) => pack.id === "tool-pack.filesystem")?.resources).toEqual([
      expect.objectContaining({ id: "filesystem", scope: "workspace" }),
    ])
    expect(toolPackCatalog.find((pack) => pack.id === "tool-pack.shell")?.ports).toContain("process-runner.port")
    expect(createToolPackTools("tool-pack.filesystem").map((tool) => tool.name)).toEqual(["read", "write", "edit", "ls", "find", "grep"])
    expect(Object.keys(createDefaultToolPacks()).sort()).toEqual(["tool-pack.echo", "tool-pack.filesystem", "tool-pack.meta", "tool-pack.shell"])
    expect(filesystemPortImplementations).toEqual(["filesystem.local", "filesystem.memory", "filesystem.readonly", "filesystem.workspace-scoped"])
    expect(processRunnerPortImplementations).toEqual(["process-runner.disabled", "process-runner.local", "process-runner.dry-run", "process-runner.sandbox"])
    expect(toolSchemaAdapters).toEqual([
      "tool.schema.json-schema",
      "tool.schema.typebox",
      "tool.schema.zod-compatible",
      "tool.schema.effect-compatible",
      "tool.schema.typescript-validator",
    ])
    expect(toolPermissionPolicies).toEqual([
      "tool.permission.always-allow",
      "tool.permission.always-deny",
      "tool.permission.ask-hook",
      "tool.permission.workspace-scoped",
      "tool.permission.product-personality",
    ])
  })

  it("guards tool public port and atom surfaces as partial cadence evidence", () => {
    const portSurface = buildToolPublicPortSurfaceGuardSnapshot()
    const atomSurface = buildToolPublicAtomSurfaceGuardSnapshot()

    expect(portSurface).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:tool-public-port-surface-guard",
      fixtureID: "tool:public-port-surface-guard",
      fixtureDiffTarget: "cadence.event-timing-replay",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      portRefs: expect.arrayContaining([
        expect.objectContaining({
          portID: "filesystem.port",
          exposure: "partial-lossy-port",
          exactDiffStatus: "exact-diff-partial",
          nativeParityClaim: false,
          implementations: expect.arrayContaining(["createLocalFilesystemPort", "createWorkspaceScopedFilesystemPort"]),
          knownLossiness: expect.arrayContaining(["tool-public-filesystem-port-side-effects-not-native"]),
        }),
        expect.objectContaining({
          portID: "process-runner.port",
          cadenceRisk: expect.arrayContaining(["tool-batch-order", "process-exit-timing"]),
          knownLossiness: expect.arrayContaining(["tool-public-process-runner-wall-clock-not-native"]),
        }),
        expect.objectContaining({
          portID: "tool.permission-policy",
          cadenceRisk: expect.arrayContaining(["permission-decision", "permission-ui-side-effects"]),
          knownLossiness: expect.arrayContaining(["tool-public-permission-ui-side-effects-not-replayed"]),
        }),
      ]),
      nativeBlockers: expect.arrayContaining([
        "product-native-filesystem-side-effects:not-proven",
        "product-native-process-runner-timing:not-proven",
        "product-native-permission-ui-side-effects:not-proven",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verifyToolPublicPortSurfaceGuardSnapshot(portSurface)).toEqual({ ok: true, issues: [] })

    expect(atomSurface).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:tool-public-atom-surface-guard",
      fixtureID: "tool:public-atom-surface-guard",
      fixtureDiffTarget: "cadence.event-timing-replay",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      atomRefs: expect.arrayContaining([
        expect.objectContaining({
          atomID: "tool.permission-policy",
          exposure: "partial-lossy-atom",
          exactDiffStatus: "exact-diff-partial",
          nativeParityClaim: false,
          cadenceRisk: expect.arrayContaining(["permission-decision", "permission-ui-side-effects"]),
          knownLossiness: expect.arrayContaining(["tool-public-atom-native-cadence-not-proven"]),
        }),
        expect.objectContaining({
          atomID: "tool.executor",
          cadenceRisk: expect.arrayContaining(["tool-batch-order", "process-side-effects"]),
        }),
      ]),
      packRefs: expect.arrayContaining([
        expect.objectContaining({
          packID: "tool-pack.filesystem",
          tools: expect.arrayContaining(["read", "write", "edit", "ls", "find", "grep"]),
          ports: expect.arrayContaining(["filesystem.port", "tool.permission-policy", "tool.executor"]),
          exposure: "partial-lossy-pack",
          nativeParityClaim: false,
        }),
        expect.objectContaining({
          packID: "tool-pack.shell",
          ports: expect.arrayContaining(["process-runner.port", "tool.permission-policy", "tool.executor"]),
        }),
      ]),
      nativeBlockers: expect.arrayContaining([
        "native-tool-schema-shape:not-proven",
        "native-permission-decision-side-effects:not-proven",
        "native-tool-pack-batch-order:not-proven",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verifyToolPublicAtomSurfaceGuardSnapshot(atomSurface)).toEqual({ ok: true, issues: [] })

    const portNativeClaim = {
      ...portSurface,
      nativeParityClaim: true as false,
    }
    expect(verifyToolPublicPortSurfaceGuardSnapshot(portNativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "tool-public-port.native-claim" }),
    ]))

    const missingPermissionPort = {
      ...portSurface,
      portRefs: portSurface.portRefs.filter((ref) => ref.portID !== "tool.permission-policy"),
    }
    expect(verifyToolPublicPortSurfaceGuardSnapshot(missingPermissionPort).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-public-port.missing-port",
        portID: "tool.permission-policy",
      }),
    ]))

    const portLossinessDrop = {
      ...portSurface,
      portRefs: portSurface.portRefs.map((ref) =>
        ref.portID === "filesystem.port"
          ? { ...ref, knownLossiness: [] }
          : ref,
      ),
    }
    expect(verifyToolPublicPortSurfaceGuardSnapshot(portLossinessDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-public-port.lossiness",
        portID: "filesystem.port",
      }),
    ]))

    const atomNativeClaim = {
      ...atomSurface,
      atomRefs: atomSurface.atomRefs.map((ref) =>
        ref.atomID === "tool.executor"
          ? { ...ref, nativeParityClaim: true as false }
          : ref,
      ),
    }
    expect(verifyToolPublicAtomSurfaceGuardSnapshot(atomNativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-public-atom.atom-native-claim",
        atomID: "tool.executor",
      }),
    ]))

    const packCoverageDrop = {
      ...atomSurface,
      packRefs: atomSurface.packRefs.map((ref) =>
        ref.packID === "tool-pack.shell"
          ? { ...ref, ports: [] }
          : ref,
      ),
    }
    expect(verifyToolPublicAtomSurfaceGuardSnapshot(packCoverageDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-public-atom.pack-coverage",
        packID: "tool-pack.shell",
      }),
    ]))

    const misleadingSummary = {
      ...atomSurface,
      summary: "tool public atoms are native parity complete",
    }
    expect(verifyToolPublicAtomSurfaceGuardSnapshot(misleadingSummary).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "tool-public-atom.summary" }),
    ]))
  })

  it("anchors OpenCode tool bridge ports to pinned upstream tool and plugin sources", () => {
    const snapshot = buildOpenCodeToolSourceMatrixSnapshot()

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      pinnedRepo: "anomalyco/opencode",
      pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-tool-source-matrix",
      fixtureID: "opencode-tool:source-matrix",
      nativeExactBranchIDs: [
        "tool-definition-plugin",
        "tool-schema-bridge",
        "permission-ask-hook",
        "plugin-permission-bridge",
        "plugin-tool-registry",
        "permission-render",
        "result-render",
        "status-stream",
        "workspace-filesystem",
      ],
      partialBranchIDs: expect.arrayContaining([
        "live-plugin-tool-runtime",
        "permission-ui-side-effects",
        "exact-workspace-fs-side-effects",
      ]),
      missingBranchIDs: [],
      coveredToolAtomIDs: expect.arrayContaining([
        "opencode.permission.ask-bridge",
        "opencode.plugin.permission-bridge",
        "opencode.plugin.registry-bridge",
        "opencode.tool.definition-plugin-bridge",
        "opencode.tool.permission-render-bridge",
        "opencode.tool.result-render-bridge",
        "opencode.tool.schema-bridge",
        "opencode.tool.status-bridge",
        "opencode.workspace-filesystem-bridge",
      ]),
      coveredToolPortIDs: expect.arrayContaining([
        "filesystem.port",
        "tool.audit-log",
        "tool.definition",
        "tool.executor",
        "tool.permission-policy",
        "tool.registry",
        "tool.result-normalizer",
        "tool.schema-adapter",
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeToolNativeExactEvidenceRef,
        openCodeToolNativeExactReplayRef,
        "conformance:opencode-tool-definition-plugin-native-exact-fixture",
        "conformance:opencode-tool-schema-bridge-native-exact-fixture",
        "conformance:opencode-tool-result-render-native-exact-fixture",
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-tool:source-matrix",
        openCodeToolNativeExactFixtureID,
        "opencode-tool-definition-plugin:native-exact-fixture",
        "opencode-tool-schema-bridge:native-exact-fixture",
        "opencode-tool-result-render:native-exact-fixture",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-tool-source-matrix-covered-by-partial-fixture",
        "opencode-live-plugin-tool-runtime-not-spawned",
        "opencode-permission-ui-side-effects-not-replayed",
        "opencode-workspace-filesystem-side-effects-not-exact",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(snapshot.partialBranchIDs).toEqual([
      "live-plugin-tool-runtime",
      "permission-ui-side-effects",
      "exact-workspace-fs-side-effects",
    ])
    expect(snapshot.sourceRefs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-core",
        path: "packages/opencode/src/tool/tool.ts",
        symbols: expect.arrayContaining(["Tool", "define", "execute", "permissions"]),
      }),
      expect.objectContaining({
        id: "plugin-core",
        path: "packages/core/src/plugin.ts",
        symbols: expect.arrayContaining(["Hooks", "HookFunctions", "PluginV2"]),
      }),
      expect.objectContaining({
        id: "plugin-permission",
        path: "packages/opencode/src/permission/index.ts",
        symbols: expect.arrayContaining(["Permission", "ask", "respond"]),
      }),
      expect.objectContaining({
        id: "file-system",
        path: "packages/opencode/src/file/index.ts",
        symbols: expect.arrayContaining(["File", "read", "write", "list"]),
      }),
      expect.objectContaining({
        id: "local-tool-runtime-projection",
        path: "packages/lego-tools/src/port-fixtures.ts",
        symbols: expect.arrayContaining(["projectOpenCodeToolRuntimeProjection", "OpenCodeToolRuntimeProjection"]),
      }),
      expect.objectContaining({
        id: "local-tool-contract-render-projection",
        path: "packages/lego-tools/src/port-fixtures.ts",
        symbols: expect.arrayContaining(["projectOpenCodeToolContractRenderProjection", "OpenCodeToolContractRenderProjection"]),
      }),
      expect.objectContaining({
        id: "local-tool-live-runtime-fixture",
        path: "packages/lego-tools/src/port-fixtures.ts",
        symbols: expect.arrayContaining(["captureOpenCodeToolLiveRuntimeFixture", "verifyOpenCodeToolLiveRuntimeFixture", "OpenCodeToolLiveRuntimeFixture"]),
      }),
    ]))
    expect(snapshot.branchAnchors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        branchID: "tool-definition-plugin",
        status: "native-exact",
        exactDiffStatus: "native-exact",
        nativeParityClaim: true,
        localEvidenceRefs: expect.arrayContaining(["conformance:opencode-tool-definition-plugin-native-exact-fixture", "tool-definition-plugin-native-exact:opencode"]),
        nativeEvidenceRefs: ["conformance:opencode-tool-definition-plugin-native-exact-fixture", "tool-definition-plugin-native-exact:opencode"],
        fixtureIDs: ["opencode-tool-definition-plugin:native-exact-fixture"],
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "tool-schema-bridge",
        status: "native-exact",
        exactDiffStatus: "native-exact",
        nativeParityClaim: true,
        localEvidenceRefs: expect.arrayContaining(["conformance:opencode-tool-schema-bridge-native-exact-fixture", "tool-schema-bridge-native-exact:opencode"]),
        localMarkers: expect.arrayContaining(["legacy-json-schema", "zod-defs-renamed"]),
        nativeEvidenceRefs: ["conformance:opencode-tool-schema-bridge-native-exact-fixture", "tool-schema-bridge-native-exact:opencode"],
        fixtureIDs: ["opencode-tool-schema-bridge:native-exact-fixture"],
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "permission-ask-hook",
        status: "native-exact",
        exactDiffStatus: "native-exact",
        nativeParityClaim: true,
        nativeEvidenceRefs: ["conformance:opencode-plugin-permission-bridge-native-exact-fixture", "plugin-permission-bridge-native-exact:opencode"],
        fixtureIDs: ["opencode-plugin-permission-bridge:native-exact-fixture"],
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "plugin-permission-bridge",
        status: "native-exact",
        exactDiffStatus: "native-exact",
        nativeParityClaim: true,
        nativeEvidenceRefs: ["conformance:opencode-plugin-permission-bridge-native-exact-fixture", "plugin-permission-bridge-native-exact:opencode"],
        fixtureIDs: ["opencode-plugin-permission-bridge:native-exact-fixture"],
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "plugin-tool-registry",
        status: "native-exact",
        exactDiffStatus: "native-exact",
        nativeParityClaim: true,
        nativeEvidenceRefs: ["conformance:opencode-plugin-tool-registry-native-exact-fixture", "plugin-tool-registry-native-exact:opencode"],
        fixtureIDs: ["opencode-plugin-tool-registry:native-exact-fixture"],
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "permission-render",
        status: "native-exact",
        exactDiffStatus: "native-exact",
        nativeParityClaim: true,
        localEvidenceRefs: expect.arrayContaining(["conformance:opencode-tool-permission-render-native-exact-fixture", "tool-permission-render-native-exact:opencode"]),
        fixtureIDs: ["opencode-tool-permission-render:native-exact-fixture"],
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "result-render",
        status: "native-exact",
        exactDiffStatus: "native-exact",
        nativeParityClaim: true,
        toolAtomIDs: ["opencode.tool.result-render-bridge"],
        toolPortIDs: ["tool.result-normalizer", "tools.result-projector"],
        localEvidenceRefs: expect.arrayContaining(["conformance:opencode-tool-result-render-native-exact-fixture", "tool-result-render-native-exact:opencode"]),
        fixtureIDs: ["opencode-tool-result-render:native-exact-fixture"],
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "status-stream",
        status: "native-exact",
        exactDiffStatus: "native-exact",
        nativeParityClaim: true,
        sourceRefIDs: expect.arrayContaining(["session-tools", "session-processor", "message-v2", "error-util"]),
        localEvidenceRefs: expect.arrayContaining(["conformance:opencode-tool-status-native-exact-fixture", "opencode-tool-status:native-exact-fixture", "tool-status-native-exact:opencode"]),
        localMarkers: expect.arrayContaining(["ToolStatePending", "ToolStateRunning", "ToolStateCompleted", "ToolStateError", "errorMessage"]),
        nativeEvidenceRefs: ["conformance:opencode-tool-status-native-exact-fixture", "tool-status-native-exact:opencode"],
        fixtureIDs: ["opencode-tool-status:native-exact-fixture"],
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "workspace-filesystem",
        status: "native-exact",
        exactDiffStatus: "native-exact",
        nativeParityClaim: true,
        localEvidenceRefs: expect.arrayContaining(["conformance:opencode-workspace-filesystem-native-exact-fixture", "workspace-filesystem-native-exact:opencode"]),
        nativeEvidenceRefs: ["conformance:opencode-workspace-filesystem-native-exact-fixture", "workspace-filesystem-native-exact:opencode"],
        fixtureIDs: ["opencode-workspace-filesystem:native-exact-fixture"],
        knownGaps: [],
      }),
      expect.objectContaining({
        branchID: "live-plugin-tool-runtime",
        status: "partial",
        exactDiffStatus: "exact-diff-partial",
        nativeParityClaim: false,
        sourceRefIDs: expect.arrayContaining(["local-tool-runtime-projection", "local-tool-live-runtime-fixture"]),
        localEvidenceRefs: expect.arrayContaining(["opencode-tool:runtime-projection", "opencode-tool:live-runtime-fixture"]),
        localMarkers: expect.arrayContaining(["plugin-tool-runtime:projected", "plugin-module-side-effects:not-exact", "plugin-lifecycle-readback:partial"]),
      }),
      expect.objectContaining({
        branchID: "permission-ui-side-effects",
        status: "partial",
        exactDiffStatus: "exact-diff-partial",
        nativeParityClaim: false,
        sourceRefIDs: expect.arrayContaining(["local-tool-runtime-projection", "local-tool-live-runtime-fixture"]),
        localEvidenceRefs: expect.arrayContaining(["opencode-tool:runtime-projection", "opencode-tool:live-runtime-fixture"]),
        knownGaps: expect.arrayContaining(["opencode-tool-live-runtime-fixture-partial-native-gap", "opencode-permission-ui-side-effects-not-replayed"]),
      }),
      expect.objectContaining({
        branchID: "exact-workspace-fs-side-effects",
        status: "partial",
        exactDiffStatus: "exact-diff-partial",
        nativeParityClaim: false,
        sourceRefIDs: expect.arrayContaining(["local-tool-runtime-projection", "local-tool-live-runtime-fixture"]),
        localMarkers: expect.arrayContaining(["watch:projected", "filesystem-side-effects:not-exact", "workspace-fs-readback:partial"]),
        knownGaps: expect.arrayContaining(["opencode-tool-live-runtime-fixture-partial-native-gap", "opencode-workspace-filesystem-side-effects-not-exact"]),
      }),
    ]))
  })

  it("keeps OpenCode plugin permission.ask bridge native exact", async () => {
    expect(createOpenCodeNativePluginPermissionBridge()).toHaveProperty("register")

    const fixture = await captureOpenCodePluginPermissionBridgeNativeExactFixture()
    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.plugin.permission-bridge",
      portID: "tool.permission-policy",
      evidenceRef: "conformance:opencode-plugin-permission-bridge-native-exact-fixture",
      replayRef: "plugin-permission-bridge-native-exact:opencode",
      fixtureID: "opencode-plugin-permission-bridge:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      sourceRefs: expect.arrayContaining([
        expect.stringContaining("packages/opencode/src/plugin/index.ts"),
        expect.stringContaining("packages/plugin/src/index.ts"),
        expect.stringContaining("packages/opencode/src/permission/index.ts"),
      ]),
      knownLossiness: [],
      cases: expect.arrayContaining([
        expect.objectContaining({
          id: "default-ask-without-hook",
          actual: undefined,
          expected: undefined,
        }),
        expect.objectContaining({
          id: "source-order-output-mutation",
          actual: expect.objectContaining({
            calls: ["first:edit", "second:ses_ordered"],
            result: { status: "allow" },
          }),
        }),
        expect.objectContaining({
          id: "fail-fast-hook-error",
          actual: expect.objectContaining({
            rejected: true,
            message: "permission hook failed",
            calls: ["before", "throws"],
          }),
        }),
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verifyOpenCodePluginPermissionBridgeNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
  })

  it("proves OpenCode tool permission render bridge as a native exact module fixture", () => {
    const fixture = captureOpenCodeToolPermissionRenderNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.tool.permission-render-bridge",
      portID: "tool.executor",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-tool-permission-render-native-exact-fixture",
      replayRef: "tool-permission-render-native-exact:opencode",
      fixtureID: "opencode-tool-permission-render:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/permission/index.ts"),
      expect.stringContaining("packages/opencode/src/tool/tool.ts"),
      expect.stringContaining("packages/opencode/src/tool/shell.ts"),
      expect.stringContaining("packages/opencode/src/tool/edit.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "request-shape-with-tool",
      "rejected-error-message",
      "corrected-error-message",
      "denied-error-message",
      "reply-body-shape",
    ])
    expect(verifyOpenCodeToolPermissionRenderNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeToolPermissionRenderBridge()
    expect(bridge.error({ type: "corrected", feedback: "Use a project-relative path." })).toBe(
      "The user rejected permission to use this specific tool call with the following feedback: Use a project-relative path.",
    )
    expect(bridge.reply({ reply: "once" })).toEqual({ reply: "once" })

    expect(verifyOpenCodeToolPermissionRenderNativeExactFixture({ ...fixture, knownLossiness: ["partial-permission-render"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-tool-permission-render-native-exact.lossiness" }),
    ]))
  })

  it("proves OpenCode tool schema bridge as a native exact module fixture", () => {
    const fixture = captureOpenCodeToolSchemaBridgeNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.tool.schema-bridge",
      portID: "tool.schema-adapter",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-tool-schema-bridge-native-exact-fixture",
      replayRef: "tool-schema-bridge-native-exact:opencode",
      fixtureID: "opencode-tool-schema-bridge:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/tool/registry.ts"),
      expect.stringContaining("packages/opencode/src/tool/tool.ts"),
      expect.stringContaining("packages/plugin/src/tool.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "missing-args-zod-normalization",
      "all-zod-uses-zod-json-schema",
      "legacy-json-schema-filters-definitions",
      "mixed-zod-falls-back-to-legacy-json-schema",
      "zod-defs-renamed-to-definitions",
      "invalid-arguments-message",
    ])
    expect(verifyOpenCodeToolSchemaBridgeNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeToolSchemaBridge()
    expect(bridge.legacyJsonSchema([
      ["file", { type: "string" }],
      ["unsafe", true],
      ["count", 1],
      ["items", ["x"]],
    ])).toEqual({
      type: "object",
      properties: {
        file: { type: "string" },
        unsafe: true,
      },
      required: ["file", "unsafe"],
    })
    expect(bridge.invalidArgumentsMessage({ tool: "edit", detail: "Missing filePath" })).toBe(
      "The edit tool was called with invalid arguments: Missing filePath.\nPlease rewrite the input so it satisfies the expected schema.",
    )
    expect(verifyOpenCodeToolSchemaBridgeNativeExactFixture({ ...fixture, knownLossiness: ["partial-schema"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-tool-schema-bridge.lossiness" }),
    ]))
  })

  it("proves OpenCode workspace filesystem bridge as a native exact module fixture", () => {
    const fixture = captureOpenCodeWorkspaceFilesystemNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.workspace-filesystem-bridge",
      portID: "filesystem.port",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-workspace-filesystem-native-exact-fixture",
      replayRef: "workspace-filesystem-native-exact:opencode",
      fixtureID: "opencode-workspace-filesystem:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/plugin/index.ts"),
      expect.stringContaining("packages/opencode/src/control-plane/adapters/index.ts"),
      expect.stringContaining("packages/opencode/src/control-plane/types.ts"),
      expect.stringContaining("packages/plugin/src/index.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "builtin-worktree-and-unknown-adapter",
      "project-scoped-custom-adapter-registration",
      "plugin-input-registers-locally-and-forwards",
      "same-type-multiple-plugin-sources",
      "adapter-object-reference-retained",
    ])
    expect(verifyOpenCodeWorkspaceFilesystemNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeWorkspaceFilesystemBridge()
    const registry = bridge.createRegistry()
    const adapter = { name: "Probe", description: "Probe adapter" }
    registry.registerAdapter("prj_probe", "probe", adapter)
    expect(registry.getAdapter("prj_probe", "probe")).toBe(adapter)
    expect(verifyOpenCodeWorkspaceFilesystemNativeExactFixture({ ...fixture, knownLossiness: ["partial-workspace"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-workspace-filesystem.lossiness" }),
    ]))
  })

  it("projects OpenCode tool runtime signals into a lossy partial fixture", () => {
    const projection = projectOpenCodeToolRuntimeProjection([
      {
        type: "plugin.tool",
        toolName: "custom.search",
        pluginID: "plugin-a",
        schemaKeys: ["query", "limit", "query"],
        sequence: 2,
      },
      {
        type: "permission.ui",
        permissionID: "perm-1",
        status: "ask",
        subject: "bash:ls",
        sequence: 1,
      },
      {
        type: "workspace.fs",
        operation: "watch",
        pathKind: "glob",
        policy: "workspace",
        sideEffectKeys: ["change", "rename", "change"],
        sequence: 3,
      },
    ])

    expect(projection).toMatchObject({
      schemaVersion: 1,
      fixtureID: "opencode-tool:runtime-projection",
      evidenceRef: "conformance:opencode-tool-runtime-projection",
      coveredBranchIDs: [
        "live-plugin-tool-runtime",
        "permission-ui-side-effects",
        "exact-workspace-fs-side-effects",
      ],
      retainedFields: expect.arrayContaining([
        "toolName",
        "pluginID",
        "schemaKeys",
        "permissionID",
        "status",
        "subjectObserved",
        "operation",
        "pathKind",
        "policy",
        "sideEffectKeys",
        "sequence",
      ]),
      lossyFields: expect.arrayContaining([
        "native plugin module execution side effects",
        "permission UI render timing",
        "filesystem watch event ordering",
        "workspace filesystem syscall side effects",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-live-plugin-tool-runtime-not-spawned",
        "opencode-permission-ui-side-effects-not-replayed",
        "opencode-workspace-filesystem-side-effects-not-exact",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(projection.pluginToolRuntime).toEqual([
      { toolName: "custom.search", pluginID: "plugin-a", schemaKeys: ["limit", "query"], sequence: 2 },
    ])
    expect(projection.permissionUISideEffects).toEqual([
      { permissionID: "perm-1", status: "ask", subjectObserved: true, sequence: 1 },
    ])
    expect(projection.workspaceFSSideEffects).toEqual([
      { operation: "watch", pathKind: "glob", policy: "workspace", sideEffectKeys: ["change", "rename"], sequence: 3 },
    ])
  })

  it("projects OpenCode tool schema/render/status outputs into a lossy partial fixture", () => {
    const projection = projectOpenCodeToolContractRenderProjection([
      {
        type: "schema",
        toolName: "bash",
        schemaKeys: ["command", "description", "command"],
        requiredKeys: ["command"],
        permissionSubjectField: "command",
        sequence: 1,
      },
      {
        type: "permission.render",
        toolName: "bash",
        permissionID: "perm-1",
        status: "ask",
        renderKeys: ["subject", "status", "subject"],
        subject: "bash:ls",
        sequence: 2,
      },
      {
        type: "result.render",
        toolName: "bash",
        partKind: "text",
        outputKind: "stdout",
        metadataKeys: ["exitCode", "duration", "exitCode"],
        sequence: 3,
      },
      {
        type: "status.bridge",
        toolName: "bash",
        status: "running",
        recordID: "status-1",
        eventKeys: ["tool", "status", "tool"],
        sequence: 4,
      },
    ])

    expect(projection).toMatchObject({
      schemaVersion: 1,
      fixtureID: "opencode-tool:contract-render-projection",
      evidenceRef: "conformance:opencode-tool-contract-render-projection",
      coveredBranchIDs: [
        "tool-schema-bridge",
        "permission-render",
        "result-render",
        "status-stream",
      ],
      retainedFields: expect.arrayContaining([
        "toolName",
        "schemaKeys",
        "requiredKeys",
        "permissionSubjectFieldObserved",
        "permissionID",
        "status",
        "renderKeys",
        "subjectObserved",
        "partKind",
        "outputKind",
        "metadataKeys",
        "recordIDObserved",
        "eventKeys",
        "sequence",
      ]),
      lossyFields: expect.arrayContaining([
        "native Parameters schema object identity",
        "permission render tree and UI timing",
        "tool result raw payload and message-v2 part identity",
        "status record ID and UI order",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-tool-contract-render-full-upstream-fixture-not-proven",
        "opencode-tool-schema-hidden-plugin-fields-not-exact",
        "opencode-permission-render-side-effects-not-exact",
        "opencode-tool-result-render-native-part-detail-not-exact",
        "opencode-tool-status-record-id-and-ui-order-not-exact",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(projection.schemas).toEqual([
      { toolName: "bash", schemaKeys: ["command", "description"], requiredKeys: ["command"], permissionSubjectFieldObserved: true, sequence: 1 },
    ])
    expect(projection.permissionRenders).toEqual([
      { toolName: "bash", permissionID: "perm-1", status: "ask", renderKeys: ["status", "subject"], subjectObserved: true, sequence: 2 },
    ])
    expect(projection.resultRenders).toEqual([
      { toolName: "bash", partKind: "text", outputKind: "stdout", metadataKeys: ["duration", "exitCode"], sequence: 3 },
    ])
    expect(projection.statusBridges).toEqual([
      { toolName: "bash", status: "running", recordIDObserved: true, eventKeys: ["status", "tool"], sequence: 4 },
    ])
  })

  it("captures OpenCode tool live runtime readback without claiming native parity", () => {
    const fixture = captureOpenCodeToolLiveRuntimeFixture({
      toolName: "bash",
      command: "pwd",
    })

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-tool-live-runtime-fixture",
      fixtureID: "opencode-tool:live-runtime-fixture",
      exactDiffStatus: "live-runtime-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      fixtureDiffTarget: "tool.contract-envelope-replay",
      relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay"],
      coveredBranchIDs: expect.arrayContaining([
        "tool-schema-bridge",
        "permission-render",
        "result-render",
        "status-stream",
        "live-plugin-tool-runtime",
        "permission-ui-side-effects",
        "exact-workspace-fs-side-effects",
      ]),
      retainedFields: expect.arrayContaining([
        "tool schema key readback",
        "permission UI request/response order readback",
        "tool result raw payload hash",
        "status record ID and UI order marker",
        "plugin registration and dispose marker",
      ]),
      lossyFields: expect.arrayContaining([
        "real OpenCode plugin tool runtime execution",
        "native Parameters schema object identity",
        "permission UI render tree and wall-clock timing",
        "message-v2 part object identity",
        "plugin lifecycle dispose/reload ordering",
      ]),
      knownGaps: expect.arrayContaining([
        "opencode-tool-live-runtime-fixture-partial-native-gap",
        "opencode-live-plugin-tool-runtime-not-spawned",
        "opencode-permission-ui-side-effects-not-replayed",
        "opencode-workspace-filesystem-side-effects-not-exact",
        "opencode-tool-message-v2-part-identity-not-exact",
        "opencode-tool-plugin-lifecycle-dispose-order-not-exact",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.schemaReadback).toEqual([
      expect.objectContaining({
        toolName: "bash",
        schemaKeys: ["command", "description", "timeout"],
        requiredKeys: ["command"],
        permissionSubjectField: "command",
        schemaObjectHash: expect.stringMatching(/^[a-f0-9]{16}$/),
        pluginID: "opencode.plugin:runtime",
      }),
    ])
    expect(fixture.permissionReadback).toEqual([
      expect.objectContaining({
        toolName: "bash",
        permissionID: "perm_bash_001",
        status: "ask",
        subject: "pwd",
        requestOrder: 2,
        responseOrder: 3,
        uiSideEffectKeys: expect.arrayContaining(["permission-store"]),
      }),
    ])
    expect(fixture.resultReadback).toEqual([
      expect.objectContaining({
        toolName: "bash",
        partKind: "text",
        outputKind: "stdout",
        metadataKeys: expect.arrayContaining(["toolCallID"]),
        messagePartID: "part_tool_001",
        rawPayloadHash: expect.stringMatching(/^[a-f0-9]{16}$/),
        writebackRecordID: "tool-writeback-001",
      }),
    ])
    expect(fixture.statusReadback).toEqual([
      expect.objectContaining({
        toolName: "bash",
        status: "complete",
        recordID: "status_tool_001",
        uiOrder: 4,
        eventKeys: expect.arrayContaining(["status", "tool"]),
      }),
    ])
    expect(fixture.workspaceFSReadback).toEqual([
      expect.objectContaining({
        operation: "write",
        pathKind: "file",
        policy: "workspace-scoped",
        sideEffectKeys: expect.arrayContaining(["watch"]),
        watchEventID: "watch_evt_tool_001",
        syscallHash: expect.stringMatching(/^[a-f0-9]{16}$/),
      }),
    ])
    expect(fixture.pluginLifecycleReadback).toEqual([
      expect.objectContaining({
        pluginID: "opencode.plugin:runtime",
        registeredToolNames: ["bash"],
        disposeOrder: 6,
        reloadGeneration: 1,
        cleanupKeys: expect.arrayContaining(["tool.registry"]),
      }),
    ])
    expect(fixture.toolRuntimeProjection.fixtureID).toBe("opencode-tool:runtime-projection")
    expect(fixture.toolContractRenderProjection.fixtureID).toBe("opencode-tool:contract-render-projection")
    expect(verifyOpenCodeToolLiveRuntimeFixture(fixture)).toEqual({ ok: true, issues: [] })

    const nativeClaim = {
      ...fixture,
      nativeParityClaim: true as false,
    }
    expect(verifyOpenCodeToolLiveRuntimeFixture(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-tool-live-runtime.native-claim" }),
    ]))

    const missingSchema = {
      ...fixture,
      schemaReadback: [],
    }
    expect(verifyOpenCodeToolLiveRuntimeFixture(missingSchema).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-tool-live-runtime.schema-readback" }),
    ]))

    const missingPermission = {
      ...fixture,
      permissionReadback: [],
    }
    expect(verifyOpenCodeToolLiveRuntimeFixture(missingPermission).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-tool-live-runtime.permission-readback" }),
    ]))

    const missingNativeGap = {
      ...fixture,
      knownGaps: fixture.knownGaps.filter((gap) => gap !== "opencode-tool-live-runtime-fixture-partial-native-gap"),
    }
    expect(verifyOpenCodeToolLiveRuntimeFixture(missingNativeGap).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-tool-live-runtime.native-gaps" }),
    ]))
  })

  it("proves OpenCode tool schema as a native exact module fixture", () => {
    const fixture = buildOpenCodeToolSchemaNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.tools.schema.native-like",
      portID: "tools.schema",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-tool-schema-native-exact-fixture",
      fixtureID: "opencode-tool-schema:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: openCodeToolSchemaNativeDescriptor.nativeEvidenceRefs,
      fixtureIDs: openCodeToolSchemaNativeDescriptor.fixtureIDs,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.tools).toEqual([
      { name: "read", aliases: ["read", "open"], requiredFields: ["filePath"], pathField: "filePath", mutating: false },
      { name: "edit", aliases: ["edit"], requiredFields: ["filePath", "oldText", "newText"], pathField: "filePath", mutating: true },
      { name: "write", aliases: ["write", "create_file"], requiredFields: ["filePath", "content"], pathField: "filePath", mutating: true },
      { name: "bash", aliases: ["bash", "shell"], requiredFields: ["cmd"], pathField: "filePath", commandField: "cmd", mutating: true },
      { name: "find", aliases: ["glob", "find"], requiredFields: ["filePath"], pathField: "filePath", mutating: false },
      { name: "grep", aliases: ["grep"], requiredFields: ["filePath", "pattern"], pathField: "filePath", mutating: false },
      { name: "ls", aliases: ["ls"], requiredFields: ["filePath"], pathField: "filePath", mutating: false },
    ])
    expect(fixture.permissionPolicySchema).toEqual({
      subjectField: "filePath",
      mutationRequiresApproval: true,
      readonlyDefault: "allow",
      deniedOutcome: "tool-result-error",
    })
    expect(verifyOpenCodeToolSchemaNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    expect(verifyOpenCodeToolSchemaNativeExactFixture({ ...fixture, knownLossiness: ["partial-tool-cadence-replay"] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-tool-schema-native-exact.lossiness" }),
    ]))
    expect(verifyOpenCodeToolSchemaNativeExactFixture({
      ...fixture,
      tools: fixture.tools.map((tool) => tool.name === "bash" ? { ...tool, requiredFields: ["command"] } : tool),
    }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-tool-schema-native-exact.tools" }),
    ]))
  })

  it("proves OpenCode tool status bridge as a native exact module fixture", () => {
    const fixture = captureOpenCodeToolStatusNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "opencode",
      atomID: "opencode.tool.status-bridge",
      portID: "tool.audit-log",
      upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidenceRef: "conformance:opencode-tool-status-native-exact-fixture",
      replayRef: "tool-status-native-exact:opencode",
      fixtureID: "opencode-tool-status:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/opencode/src/session/tools.ts"),
      expect.stringContaining("packages/opencode/src/session/processor.ts"),
      expect.stringContaining("packages/opencode/src/session/message-v2.ts"),
      expect.stringContaining("packages/opencode/src/util/error.ts"),
    ]))
    expect(fixture.cases.map((item) => item.id)).toEqual([
      "ensure-pending-provider-executed",
      "tool-call-running-provider-metadata",
      "metadata-promotes-pending-to-running",
      "complete-running-tool-call",
      "fail-running-tool-call",
      "ignore-terminal-update",
    ])
    expect(verifyOpenCodeToolStatusNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })

    const bridge = createOpenCodeToolStatusBridge({ now: () => 500, partID: () => "part_inline" })
    const running = bridge.applyToolCall(
      bridge.ensureToolCall({ id: "call_inline", name: "bash", messageID: "msg_inline", sessionID: "ses_inline" }),
      { name: "bash", input: "raw" },
    )
    expect(running.state).toEqual({ status: "running", input: { value: "raw" }, time: { start: 500 } })

    expect(verifyOpenCodeToolStatusNativeExactFixture({ ...fixture, knownLossiness: ["partial-tool-status"] as unknown as [] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "opencode-tool-status-native-exact.lossiness" }),
    ]))
  })

  it("anchors Pi, Nanobot, and Hermes tool bridge ports to pinned upstream tool sources", () => {
    const cases = [
      {
        snapshot: buildPiMonoToolSourceMatrixSnapshot(),
        product: "pi",
        upstreamRef: "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
        evidenceRef: "conformance:pi-tool-source-matrix",
        fixtureID: "pi-tool:source-matrix",
        sourcePaths: [
          "packages/coding-agent/src/core/tools/index.ts",
          "packages/coding-agent/src/core/tools/tool-definition-wrapper.ts",
          "packages/coding-agent/examples/extensions/dynamic-tools.ts",
        ],
        atomIDs: [
          "pi.extension.dynamic-tool-bridge",
          "pi.extension.typebox-bridge",
          "pi.permission.event-bridge",
          "pi.process-runner-bridge",
          "pi.tool.event-render-bridge",
          "pi.tool.register-tool-bridge",
          "pi.tool.result-event-bridge",
          "pi.tool.runtime-event-bridge",
          "pi.tool.typebox-bridge",
          "pi.workspace-filesystem-bridge",
        ],
      },
      {
        snapshot: buildNanobotToolSourceMatrixSnapshot(),
        product: "nanobot",
        upstreamRef: "upstream:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        evidenceRef: "conformance:nanobot-tool-source-matrix",
        fixtureID: "nanobot-tool:source-matrix",
        sourcePaths: [
          "nanobot/agent/tools/filesystem.py",
          "nanobot/agent/tools/registry.py",
          "nanobot/agent/tools/schema.py",
          "nanobot/agent/tools/shell.py",
        ],
        atomIDs: [
          "nanobot.permission.policy-bridge",
          "nanobot.process-runner-bridge",
          "nanobot.tool.definition-plugin-bridge",
          "nanobot.tool.event-render-bridge",
          "nanobot.tool.progress-event-bridge",
          "nanobot.tool.registry-bridge",
          "nanobot.tool.result-event-bridge",
          "nanobot.tool.schema-bridge",
          "nanobot.workspace-filesystem-bridge",
        ],
      },
      {
        snapshot: buildHermesAgentToolSourceMatrixSnapshot(),
        product: "hermes",
        upstreamRef: "upstream:NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
        evidenceRef: "conformance:hermes-tool-source-matrix",
        fixtureID: "hermes-tool:source-matrix",
        sourcePaths: [
          "acp_adapter/tools.py",
          "agent/tool_dispatch_helpers.py",
          "agent/tool_executor.py",
          "agent/tool_guardrails.py",
          "agent/tool_result_classification.py",
        ],
        atomIDs: [
          "hermes.permission.hook-bridge",
          "hermes.process-runner-bridge",
          "hermes.tool.definition-registry-bridge",
          "hermes.tool.permission-render-bridge",
          "hermes.tool.progress-event-bridge",
          "hermes.tool.registry-bridge",
          "hermes.tool.result-event-bridge",
          "hermes.tool.schema-bridge",
          "hermes.workspace-filesystem-bridge",
        ],
      },
    ] as const

    for (const item of cases) {
      expect(item.snapshot).toMatchObject({
        schemaVersion: 1,
        product: item.product,
        upstreamRef: item.upstreamRef,
        evidenceRef: item.evidenceRef,
        fixtureID: item.fixtureID,
        partialBranchIDs: expect.arrayContaining([
          "tool-definition-registry",
          "tool-schema-bridge",
          "permission-policy",
          "executor-render",
          "result-envelope",
          "progress-audit-event",
          "process-runner",
          "workspace-filesystem",
        ]),
        missingBranchIDs: expect.arrayContaining([
          "live-tool-runtime",
          "permission-side-effects",
          "exact-result-writeback",
        ]),
        coveredToolAtomIDs: expect.arrayContaining(Array.from(item.atomIDs)),
        coveredToolPortIDs: expect.arrayContaining([
          "filesystem.port",
          "process-runner.port",
          "tool.audit-log",
          "tool.definition",
          "tool.executor",
          "tool.permission-policy",
          "tool.registry",
          "tool.result-normalizer",
          "tool.schema-adapter",
        ]),
        knownGaps: expect.arrayContaining([
          `${item.product}-tool-source-matrix-covered-by-partial-fixture`,
          `${item.product}-live-tool-runtime-not-spawned`,
          `${item.product}-permission-side-effects-not-replayed`,
          `${item.product}-exact-result-writeback-not-replayed`,
        ]),
        fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
      })
      expect(item.snapshot.sourceRefs.map((sourceRef) => sourceRef.path).sort()).toEqual([...item.sourcePaths].sort())
      expect(item.snapshot.branchAnchors.find((anchor) => anchor.branchID === "result-envelope")).toMatchObject({
        status: "partial",
        toolPortIDs: expect.arrayContaining(["tool.result-normalizer", "tools.result-projector"]),
      })
    }
  })

  it("records tool contract envelope replay positive and negative gates", () => {
    const snapshot = buildToolContractEnvelopeReplayGateSnapshot()
    const verification = verifyToolContractEnvelopeReplayGateSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:tool-contract-envelope-replay-gate",
      fixtureID: "tool:contract-envelope-replay-gate",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: [
        "schema",
        "permission-decision",
        "denial-behavior",
        "progress-event",
        "result-envelope",
        "session-writeback",
      ],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-tool:source-matrix",
      envelopeRisk: "source-anchored-partial",
      sourceAnchors: expect.arrayContaining([
        "tool-core:packages/opencode/src/tool/tool.ts",
        "conformance:opencode-tool-definition-plugin-native-exact-fixture",
        "conformance:opencode-tool-schema-bridge-native-exact-fixture",
        "conformance:opencode-tool-result-render-native-exact-fixture",
        "opencode-workspace-filesystem:native-exact-fixture",
      ]),
      schemaShape: expect.arrayContaining([
        "native-parity-claimed",
        "Parameters",
        "plugin-tool-schema",
        "permissionSubjectField",
        "opencode-tool-definition-plugin:native-exact-fixture",
        "opencode-tool-schema-bridge:native-exact-fixture",
      ]),
      permissionDecision: expect.arrayContaining([
        "native-parity-claimed",
        "permission.ask",
        "allow",
        "deny",
        "permission-tool-result-part",
        "opencode-plugin-permission-bridge:native-exact-fixture",
        "opencode-tool-permission-render:native-exact-fixture",
      ]),
      resultEnvelope: expect.arrayContaining([
        "native-parity-claimed",
        "message-v2-tool-result-parts",
        "resultEnvelope",
        "opencode-tool-cadence:result-envelope-roundtrip",
        "opencode-tool-result-render:native-exact-fixture",
        "opencode-workspace-filesystem:native-exact-fixture",
      ]),
      sessionWriteback: expect.arrayContaining([
        "opencode-tool-cadence:result-writeback-timing",
        "opencode-tool-status:native-exact-fixture",
        "session.write",
        "message-v2-tool-result-record-id",
      ]),
      fixtureIDs: expect.arrayContaining([
        "opencode-tool:source-matrix",
        openCodeToolNativeExactFixtureID,
        "opencode-tool-definition-plugin:native-exact-fixture",
        "opencode-tool-schema-bridge:native-exact-fixture",
        "opencode-plugin-permission-bridge:native-exact-fixture",
        "opencode-plugin-tool-registry:native-exact-fixture",
        "opencode-tool-permission-render:native-exact-fixture",
        "opencode-tool-result-render:native-exact-fixture",
        "opencode-tool-status:native-exact-fixture",
        "opencode-workspace-filesystem:native-exact-fixture",
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeToolNativeExactEvidenceRef,
        openCodeToolNativeExactReplayRef,
        "conformance:opencode-tool-definition-plugin-native-exact-fixture",
        "conformance:opencode-tool-schema-bridge-native-exact-fixture",
        "conformance:opencode-tool-result-render-native-exact-fixture",
      ]),
      knownLossiness: expect.arrayContaining(["opencode-tool-source-matrix-covered-by-partial-fixture", "partial-tool-result-envelope-roundtrip"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")).toMatchObject({
      fixtureID: "pi-tool:source-matrix",
      schemaShape: expect.arrayContaining(["TypeBox", "registerTool", "tool-definition-wrapper"]),
      progressEvent: expect.arrayContaining(["runtime event bridge", "tool audit log", "jsonl-v3-tool-result-record-id"]),
      fixtureIDs: expect.arrayContaining([
        "pi-tool:source-matrix",
        "pi-mono-tool-cadence:schema",
        "pi-mono-tool-cadence:result-projector",
        "pi-mono-tool-cadence:result-event-stream",
        "pi-mono-tool-cadence:result-envelope-roundtrip",
        "pi-mono-tool-cadence:result-writeback-timing",
      ]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.permissionDecision).toEqual(expect.arrayContaining([
      "guard command",
      "workspace restrictions",
      "sandbox policy",
    ]))
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")?.resultEnvelope).toEqual(expect.arrayContaining([
      "make_tool_result_message",
      "file_mutation_result_landed",
      "acp-api-tool-result",
    ]))
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")?.permissionDecision).toEqual(expect.arrayContaining([
      "ToolCallGuardrailDecision",
      "permission hook bridge",
    ]))

    const schemaDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, schemaShape: [] }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopeReplayGateSnapshot(schemaDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract.schema",
        product: "opencode",
        dimension: "schema",
      }),
    ]))

    const permissionDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, permissionDecision: [] }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopeReplayGateSnapshot(permissionDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract.permission-decision",
        product: "pi-mono",
        dimension: "permission-decision",
      }),
    ]))

    const progressDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, progressEvent: [] }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopeReplayGateSnapshot(progressDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract.progress-event",
        product: "nanobot",
        dimension: "progress-event",
      }),
    ]))

    const resultDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, resultEnvelope: [] }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopeReplayGateSnapshot(resultDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract.result-envelope",
        product: "hermes-agent",
        dimension: "result-envelope",
      }),
    ]))

    const commonToolOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, envelopeRisk: "common-tool-only" as const }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopeReplayGateSnapshot(commonToolOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract.common-tool-only",
        product: "opencode",
        dimension: "result-envelope",
      }),
    ]))

    const nativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeEvidenceRefs: [], fixtureIDs: item.fixtureIDs.filter((fixtureID) => fixtureID !== openCodeToolNativeExactFixtureID) }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopeReplayGateSnapshot(nativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract.native-exact-evidence",
        product: "opencode",
        dimension: "schema",
      }),
    ]))

    const borrowedOpenCode = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, fixtureID: "opencode-tool:source-matrix", envelopeRisk: "borrowed-opencode" as const }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopeReplayGateSnapshot(borrowedOpenCode).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract.borrowed-source-matrix",
        product: "pi-mono",
        dimension: "schema",
      }),
    ]))
  })

  it("records tool contract exact-diff blockers without claiming native parity", () => {
    const snapshot = buildToolContractEnvelopeExactDiffBlockerSnapshot()
    const verification = verifyToolContractEnvelopeExactDiffBlockerSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:tool-contract-envelope-exact-diff-blocker-gate",
      fixtureID: "tool:contract-envelope-exact-diff-blocker-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: [
        "schema",
        "permission-decision",
        "denial-behavior",
        "progress-event",
        "result-envelope",
        "session-writeback",
      ],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      fixtureID: "opencode-tool:source-matrix",
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      exactDiffRisk: "semantic-fixture-needs-exact-diff",
      schemaShape: expect.arrayContaining(["tool-schema-native-registry:exact-diff-not-proven"]),
      permissionDecision: expect.arrayContaining(["permission-decision-native-side-effects:exact-diff-not-proven"]),
      denialBehavior: expect.arrayContaining(["denial-behavior-native-ui-hook:exact-diff-not-proven"]),
      progressEvent: expect.arrayContaining(["progress-event-native-order:exact-diff-not-proven"]),
      resultEnvelope: expect.arrayContaining(["result-envelope-native-fields:exact-diff-not-proven"]),
      sessionWriteback: expect.arrayContaining(["session-writeback-native-record-id:exact-diff-not-proven"]),
      fixtureIDs: expect.arrayContaining(["tool:contract-envelope-replay-gate", openCodeToolNativeExactFixtureID, "opencode-tool-cadence:result-envelope-roundtrip"]),
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeToolNativeExactEvidenceRef,
        openCodeToolNativeExactReplayRef,
        "tool-core:packages/opencode/src/tool/tool.ts",
        "opencode-tool-cadence:result-writeback-timing",
      ]),
      knownLossiness: expect.arrayContaining(["result-envelope-native-fields-not-proven", "session-writeback-native-record-id-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")).toMatchObject({
      fixtureID: "pi-tool:source-matrix",
      schemaShape: expect.arrayContaining(["TypeBox", "tool-schema-native-registry:exact-diff-not-proven"]),
      resultEnvelope: expect.arrayContaining(["result-envelope-native-fields:exact-diff-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.permissionDecision).toEqual(expect.arrayContaining([
      "workspace restrictions",
      "permission-decision-native-side-effects:exact-diff-not-proven",
    ]))
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")?.sessionWriteback).toEqual(expect.arrayContaining([
      "session-writeback-native-record-id:exact-diff-not-proven",
      "api-acp-tool-result-event-id",
    ]))

    const schemaDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, schemaShape: [] }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopeExactDiffBlockerSnapshot(schemaDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract-exact-diff.schema",
        product: "opencode",
        dimension: "schema",
      }),
    ]))

    const permissionDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, permissionDecision: [] }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopeExactDiffBlockerSnapshot(permissionDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract-exact-diff.permission-decision",
        product: "pi-mono",
        dimension: "permission-decision",
      }),
    ]))

    const progressDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, progressEvent: [] }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopeExactDiffBlockerSnapshot(progressDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract-exact-diff.progress-event",
        product: "nanobot",
        dimension: "progress-event",
      }),
    ]))

    const writebackDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? { ...item, sessionWriteback: [] }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopeExactDiffBlockerSnapshot(writebackDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract-exact-diff.session-writeback",
        product: "hermes-agent",
        dimension: "session-writeback",
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
    expect(verifyToolContractEnvelopeExactDiffBlockerSnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract-exact-diff.native-claim",
        product: "opencode",
        dimension: "schema",
      }),
    ]))

    const nativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeEvidenceRefs: [], fixtureIDs: item.fixtureIDs.filter((fixtureID) => fixtureID !== openCodeToolNativeExactFixtureID) }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopeExactDiffBlockerSnapshot(nativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract-exact-diff.native-exact-evidence",
        product: "opencode",
        dimension: "schema",
      }),
    ]))

    const commonOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, exactDiffRisk: "common-tool-only" as const }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopeExactDiffBlockerSnapshot(commonOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract-exact-diff.assembled-inferred-only",
        product: "pi-mono",
        dimension: "result-envelope",
      }),
    ]))

    const borrowedOpenCode = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, fixtureID: "opencode-tool:source-matrix", exactDiffRisk: "borrowed-opencode" as const }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopeExactDiffBlockerSnapshot(borrowedOpenCode).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract-exact-diff.borrowed-source-matrix",
        product: "nanobot",
        dimension: "schema",
      }),
    ]))
  })

  it("records tool contract pinned envelope replay fixtures without claiming native parity", () => {
    const snapshot = buildToolContractEnvelopePinnedReplaySnapshot()
    const verification = verifyToolContractEnvelopePinnedReplaySnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:tool-contract-envelope-pinned-replay-gate",
      fixtureID: "tool:contract-envelope-pinned-replay-gate",
      exactDiffStatus: "exact-diff-partial",
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      comparisonDimensions: [
        "schema",
        "permission-decision",
        "denial-behavior",
        "progress-event",
        "result-envelope",
        "session-writeback",
      ],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(snapshot.cases.find((item) => item.product === "opencode")).toMatchObject({
      sourceFixtureID: "opencode-tool:source-matrix",
      exactDiffStatus: "exact-diff-partial",
      coverageStatus: "partial",
      nativeParityClaim: false,
      exactDiffRisk: "pinned-envelope-replay-needs-live-tool-runtime",
      upstreamEnvelopes: expect.arrayContaining([
        expect.objectContaining({
          dimension: "schema",
          fixtureCaseID: "opencode:opencode.schema.bash",
          schemaFingerprint: "schema:bash:command+description+timeout",
          sourceAnchor: "tool-bash:packages/opencode/src/tool/bash.ts",
        }),
        expect.objectContaining({
          dimension: "session-writeback",
          sessionWritebackID: "writeback:sqlite-message-v2-tool-result",
          sideEffectID: "session-writeback:sqlite-record-id",
        }),
      ]),
      fixtureIDs: expect.arrayContaining([
        "tool:contract-envelope-replay-gate",
        openCodeToolNativeExactFixtureID,
        "opencode-tool-cadence:result-envelope-roundtrip",
      ]),
      nativeEvidenceRefs: expect.arrayContaining([
        openCodeToolNativeExactEvidenceRef,
        openCodeToolNativeExactReplayRef,
        "tool-bash:packages/opencode/src/tool/bash.ts",
        "session-writeback:sqlite-record-id",
      ]),
      knownLossiness: expect.arrayContaining(["tool-contract-pinned-envelope-replay-live-tool-runtime-not-proven"]),
    })
    expect(snapshot.cases.find((item) => item.product === "pi-mono")?.upstreamEnvelopes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        dimension: "schema",
        schemaFingerprint: "schema:typebox:path+encoding",
        metadataKeys: ["TypeBox", "path", "encoding", "required"],
      }),
    ]))
    expect(snapshot.cases.find((item) => item.product === "nanobot")?.upstreamEnvelopes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        dimension: "permission-decision",
        permissionDecision: "guarded",
        sideEffectID: "nanobot-permission:workspace-restriction",
      }),
    ]))
    expect(snapshot.cases.find((item) => item.product === "hermes-agent")?.upstreamEnvelopes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        dimension: "result-envelope",
        resultEnvelopeID: "result:make_tool_result_message+metadata",
        sourceAnchor: "hermes-acp-tools:acp_adapter/tools.py",
      }),
    ]))

    const schemaDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              assembledEnvelopes: item.assembledEnvelopes.map((envelope) =>
                envelope.dimension === "schema"
                  ? { ...envelope, schemaFingerprint: "schema:common:tool" }
                  : envelope,
              ),
            }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopePinnedReplaySnapshot(schemaDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract-pinned-replay.schema",
        product: "opencode",
        dimension: "schema",
      }),
    ]))

    const permissionDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? {
              ...item,
              productReplayEnvelopes: item.productReplayEnvelopes.map((envelope) =>
                envelope.dimension === "permission-decision"
                  ? { ...envelope, permissionDecision: "allow" as const }
                  : envelope,
              ),
            }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopePinnedReplaySnapshot(permissionDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract-pinned-replay.permission-decision",
        product: "nanobot",
        dimension: "permission-decision",
      }),
    ]))

    const denialDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? {
              ...item,
              productReplayEnvelopes: item.productReplayEnvelopes.map((envelope) =>
                envelope.dimension === "denial-behavior"
                  ? { ...envelope, denialResultID: "deny:generic-error" }
                  : envelope,
              ),
            }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopePinnedReplaySnapshot(denialDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract-pinned-replay.denial-behavior",
        product: "hermes-agent",
        dimension: "denial-behavior",
      }),
    ]))

    const progressDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? {
              ...item,
              assembledEnvelopes: item.assembledEnvelopes.map((envelope) =>
                envelope.dimension === "progress-event"
                  ? { ...envelope, progressEventID: "progress:running>complete" }
                  : envelope,
              ),
            }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopePinnedReplaySnapshot(progressDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract-pinned-replay.progress-event",
        product: "pi-mono",
        dimension: "progress-event",
      }),
    ]))

    const resultDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "hermes-agent"
          ? {
              ...item,
              assembledEnvelopes: item.assembledEnvelopes.map((envelope) =>
                envelope.dimension === "result-envelope"
                  ? { ...envelope, metadataKeys: ["tool-result"] }
                  : envelope,
              ),
            }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopePinnedReplaySnapshot(resultDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract-pinned-replay.result-envelope",
        product: "hermes-agent",
        dimension: "result-envelope",
      }),
    ]))

    const writebackDrift = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? {
              ...item,
              productReplayEnvelopes: item.productReplayEnvelopes.map((envelope) =>
                envelope.dimension === "session-writeback"
                  ? { ...envelope, sessionWritebackID: "writeback:common-record-id" }
                  : envelope,
              ),
            }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopePinnedReplaySnapshot(writebackDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract-pinned-replay.session-writeback",
        product: "opencode",
        dimension: "session-writeback",
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
    expect(verifyToolContractEnvelopePinnedReplaySnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract-pinned-replay.native-claim",
        product: "opencode",
        dimension: "schema",
      }),
    ]))

    const nativeEvidenceDrop = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "opencode"
          ? { ...item, nativeEvidenceRefs: [], fixtureIDs: item.fixtureIDs.filter((fixtureID) => fixtureID !== openCodeToolNativeExactFixtureID) }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopePinnedReplaySnapshot(nativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract-pinned-replay.native-exact-evidence",
        product: "opencode",
        dimension: "schema",
      }),
    ]))

    const commonOnly = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "pi-mono"
          ? { ...item, exactDiffRisk: "common-tool-only" as const }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopePinnedReplaySnapshot(commonOnly).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract-pinned-replay.common-tool-only",
        product: "pi-mono",
        dimension: "result-envelope",
      }),
    ]))

    const borrowedOpenCode = {
      ...snapshot,
      cases: snapshot.cases.map((item) =>
        item.product === "nanobot"
          ? { ...item, sourceFixtureID: "opencode-tool:source-matrix", exactDiffRisk: "borrowed-opencode" as const }
          : item,
      ),
    }
    expect(verifyToolContractEnvelopePinnedReplaySnapshot(borrowedOpenCode).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "tool-contract-pinned-replay.borrowed-source-matrix",
        product: "nanobot",
        dimension: "schema",
      }),
    ]))
  })

  it("edits files and searches contents through grep/find", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "helix-tools-"))
    const src = join(cwd, "src")
    const file = join(src, "app.ts")
    mkdirSync(src)
    writeFileSync(file, "export const message = 'hello'\n", "utf8")

    const edit = getTool("edit")
    const grep = getTool("grep")
    const find = getTool("find")

    try {
      const editResult = await edit.execute("tc_edit", { path: "src/app.ts", oldText: "hello", newText: "world" }, { cwd })
      expect(editResult.isError).toBeUndefined()
      expect(readFileSync(file, "utf8")).toContain("world")

      const grepResult = await grep.execute("tc_grep", { path: ".", query: "world", glob: "*.ts" }, { cwd })
      expect(JSON.stringify(grepResult.content)).toContain("src/app.ts")
      expect(JSON.stringify(grepResult.content)).toContain("world")

      const findResult = await find.execute("tc_find", { path: ".", query: "app", glob: "*.ts" }, { cwd })
      expect(JSON.stringify(findResult.content)).toContain("src/app.ts")
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("routes filesystem tools through an injected filesystem port", async () => {
    const filesystem = createMemoryFilesystemPort({ "src/app.ts": "export const message = 'hello'\n" })
    const services = new Map<string, unknown>([[filesystemPortToken, filesystem]])
    const ctx = { cwd: "/", services }

    const readResult = await getTool("read").execute("tc_read_port", { path: "src/app.ts" }, ctx)
    expect(JSON.stringify(readResult.content)).toContain("hello")

    const editResult = await getTool("edit").execute("tc_edit_port", { path: "src/app.ts", oldText: "hello", newText: "world" }, ctx)
    expect(editResult.isError).toBeUndefined()
    expect(filesystem.files.get("/src/app.ts")).toContain("world")

    await getTool("write").execute("tc_write_port", { path: "src/new.ts", content: "export const extra = 'world'\n" }, ctx)
    const lsResult = await getTool("ls").execute("tc_ls_port", { path: "src" }, ctx)
    expect(JSON.stringify(lsResult.content)).toContain("app.ts")
    expect(JSON.stringify(lsResult.content)).toContain("new.ts")

    const grepResult = await getTool("grep").execute("tc_grep_port", { path: "src", query: "world", glob: "*.ts" }, ctx)
    expect(JSON.stringify(grepResult.content)).toContain("app.ts")
    expect(JSON.stringify(grepResult.content)).toContain("world")

    const findResult = await getTool("find").execute("tc_find_port", { path: "src", query: "new", glob: "*.ts" }, ctx)
    expect(JSON.stringify(findResult.content)).toContain("new.ts")
  })

  it("can swap filesystem and process runner ports without changing tool definitions", async () => {
    const readonly = createReadonlyFilesystemPort(createMemoryFilesystemPort({ "note.txt": "locked" }))
    const readonlyServices = new Map<string, unknown>([[filesystemPortToken, readonly]])
    await expect(getTool("write").execute("tc_readonly", { path: "note.txt", content: "changed" }, { cwd: "/", services: readonlyServices })).rejects.toThrow(
      "read-only",
    )

    const dryRunServices = new Map<string, unknown>([[processRunnerPortToken, createDryRunProcessRunnerPort()]])
    const dryRunResult = await getTool("bash").execute("tc_bash_dry", { command: "echo hello" }, { cwd: "/", services: dryRunServices })
    expect(JSON.stringify(dryRunResult.content)).toContain("[dry-run] bash -lc echo hello")

    const disabledServices = new Map<string, unknown>([[processRunnerPortToken, createDisabledProcessRunnerPort()]])
    await expect(getTool("bash").execute("tc_bash_disabled", { command: "echo nope" }, { cwd: "/", services: disabledServices })).rejects.toThrow(
      "process runner disabled",
    )
  })

  it("delegates tool permission requests to an injected permission policy atom", async () => {
    const write = getTool("write")
    const services = new Map<string, unknown>([[toolPermissionPolicyToken, createAlwaysDenyPermissionPolicy("recipe policy denied")]])
    if (typeof write.permission !== "function") throw new Error("write permission must be policy-backed")
    const decision = await write.permission({ path: "note.txt", content: "blocked" }, { cwd: "/", services })

    expect(decision).toMatchObject({
      status: "deny",
      action: "file.write",
      subject: "/note.txt",
      reason: "recipe policy denied",
    })
  })

  it("keeps session-scoped todos and records task requests", async () => {
    const todo = getTool("todo")
    const task = getTool("task")
    const ctx = { sessionID: "session-a" }

    await todo.execute("tc_todo_1", { action: "clear" }, ctx)
    await todo.execute("tc_todo_2", { action: "add", id: "item-1", text: "Map upstream tools" }, ctx)
    await todo.execute("tc_todo_3", { action: "update", id: "item-1", status: "completed" }, ctx)
    const listResult = await todo.execute("tc_todo_4", { action: "list" }, ctx)

    expect(JSON.stringify(listResult.content)).toContain("completed")
    expect(JSON.stringify(listResult.content)).toContain("Map upstream tools")

    const taskResult = await task.execute("tc_task", { description: "inspect provider adapter" }, ctx)
    expect(JSON.stringify(taskResult.content)).toContain("inspect provider adapter")
    expect(taskResult.details).toMatchObject({ status: "recorded", request: { sessionID: "session-a" } })
  })

  it("dispatches task and subagent tools through a registered runner", async () => {
    const task = getTool("task")
    const subagent = getTool("subagent")
    const calls: unknown[] = []
    const services = new Map<string, unknown>([
      [
        "subagent.runner",
        {
          runTask(input: unknown) {
            calls.push(input)
            return {
              content: [{ id: "part_runner", type: "text" as const, text: `ran ${(input as { description: string }).description}` }],
              details: { runner: "test" },
            }
          },
        },
      ],
    ])

    const taskResult = await task.execute("tc_task_runner", { description: "inspect provider adapter", agent: "explorer" }, { sessionID: "session-a", services })
    const subagentResult = await subagent.execute("tc_subagent_runner", { prompt: "map files" }, { sessionID: "session-a", services })

    expect(calls).toEqual([
      expect.objectContaining({ description: "inspect provider adapter", agent: "explorer", sessionID: "session-a" }),
      expect.objectContaining({ description: "map files", prompt: "map files", sessionID: "session-a" }),
    ])
    expect(JSON.stringify(taskResult.content)).toContain("ran inspect provider adapter")
    expect(JSON.stringify(subagentResult.content)).toContain("ran map files")
    expect(taskResult.details).toMatchObject({ runner: "test", status: "completed", request: { agent: "explorer" } })
  })

  it("writes files through the write tool", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "helix-write-"))
    const target = join(cwd, "note.txt")
    const write = getTool("write")
    const services = new Map<string, unknown>()

    try {
      const result = await write.execute("tc_write", { path: "note.txt", content: "written" }, { cwd, services })
      expect(result.isError).toBeUndefined()
      expect(existsSync(target)).toBe(true)
      expect(readFileSync(target, "utf8")).toBe("written")
      expect(services.get("file.mutationQueue")).toBeDefined()
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("accepts upstream file_path and text aliases for filesystem tools", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "helix-tool-aliases-"))
    const target = join(cwd, "src", "app.py")
    mkdirSync(join(cwd, "src"))
    writeFileSync(target, "value = 'old'\n", "utf8")

    const read = getTool("read")
    const write = getTool("write")
    const edit = getTool("edit")

    try {
      const readResult = await read.execute("tc_read_alias", { file_path: "src/app.py" }, { cwd })
      expect(JSON.stringify(readResult.content)).toContain("old")

      if (typeof write.permission !== "function") throw new Error("write permission must be policy-backed")
      const decision = await write.permission({ file_path: "src/app.py", text: "value = 'new'\n" }, { cwd })
      expect(decision).toMatchObject({ status: "ask", action: "file.write", subject: target })

      const writeResult = await write.execute("tc_write_alias", { file_path: "src/app.py", text: "value = 'new'\n" }, { cwd })
      expect(writeResult.isError).toBeUndefined()
      expect(readFileSync(target, "utf8")).toBe("value = 'new'\n")

      const editResult = await edit.execute("tc_edit_alias", { file_path: "src/app.py", oldstring: "new", newstring: "fixed" }, { cwd })
      expect(editResult.isError).toBeUndefined()
      expect(readFileSync(target, "utf8")).toBe("value = 'fixed'\n")

      const editResultSnake = await edit.execute("tc_edit_alias_snake", { file_path: "src/app.py", old_text: "fixed", new_string: "done" }, { cwd })
      expect(editResultSnake.isError).toBeUndefined()
      expect(readFileSync(target, "utf8")).toBe("value = 'done'\n")

      const editResultHyphen = await edit.execute("tc_edit_alias_hyphen", { "file-path": "src/app.py", "Old-String": "done", "NEW-TEXT": "hyphen" }, { cwd })
      expect(editResultHyphen.isError).toBeUndefined()
      expect(readFileSync(target, "utf8")).toBe("value = 'hyphen'\n")

      const editResultPlain = await edit.execute("tc_edit_alias_plain", { file_path: "src/app.py", old: "hyphen", new: "plain" }, { cwd })
      expect(editResultPlain.isError).toBeUndefined()
      expect(readFileSync(target, "utf8")).toBe("value = 'plain'\n")

      const editResultFindReplace = await edit.execute(
        "tc_edit_alias_find_replace",
        { file: "src/app.py", find: "plain", replace_text: "replace-text" },
        { cwd },
      )
      expect(editResultFindReplace.isError).toBeUndefined()
      expect(readFileSync(target, "utf8")).toBe("value = 'replace-text'\n")

      const writeResultBody = await write.execute("tc_write_alias_body", { file_path: "src/app.py", text_body: "value = 'body'\n" }, { cwd })
      expect(writeResultBody.isError).toBeUndefined()
      expect(readFileSync(target, "utf8")).toBe("value = 'body'\n")

      const writeResultContent = await write.execute(
        "tc_write_alias_text_content",
        { file_path: "src/app.py", text_content: "value = 'content'\n" },
        { cwd },
      )
      expect(writeResultContent.isError).toBeUndefined()
      expect(readFileSync(target, "utf8")).toBe("value = 'content'\n")

      const writeResultToWrite = await write.execute(
        "tc_write_alias_text_to_write",
        { file_path: "src/app.py", text_to_write: "value = 'to-write'\n" },
        { cwd },
      )
      expect(writeResultToWrite.isError).toBeUndefined()
      expect(readFileSync(target, "utf8")).toBe("value = 'to-write'\n")

      const writeResultContents = await write.execute("tc_write_alias_contents", { file_path: "src/app.py", contents: "value = 'contents'\n" }, { cwd })
      expect(writeResultContents.isError).toBeUndefined()
      expect(readFileSync(target, "utf8")).toBe("value = 'contents'\n")

      const bashResult = await getTool("bash").execute("tc_bash_alias", { command_line: "printf alias-ok" }, { cwd })
      expect(bashResult.isError).toBeUndefined()
      expect(JSON.stringify(bashResult.content)).toContain("alias-ok")
      expect(bashResult.details).toMatchObject({ command: "printf alias-ok", exitCode: 0 })

      const bashResultHyphen = await getTool("bash").execute("tc_bash_alias_hyphen", { "command-line": "printf hyphen-ok" }, { cwd })
      expect(bashResultHyphen.isError).toBeUndefined()
      expect(JSON.stringify(bashResultHyphen.content)).toContain("hyphen-ok")
      expect(bashResultHyphen.details).toMatchObject({ command: "printf hyphen-ok", exitCode: 0 })

      const bashResultCommandString = await getTool("bash").execute("tc_bash_alias_command_string", { command_string: "printf command-string-ok" }, { cwd })
      expect(bashResultCommandString.isError).toBeUndefined()
      expect(JSON.stringify(bashResultCommandString.content)).toContain("command-string-ok")
      expect(bashResultCommandString.details).toMatchObject({ command: "printf command-string-ok", exitCode: 0 })
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  it("serializes file mutations per path while allowing independent paths to overlap", async () => {
    const queue = createFileMutationQueue()
    const samePathOrder: string[] = []
    let samePathRunning = 0
    let samePathMaxRunning = 0

    await Promise.all([
      queue.run("same.txt", async () => {
        samePathOrder.push("first:start")
        samePathRunning++
        samePathMaxRunning = Math.max(samePathMaxRunning, samePathRunning)
        await wait(20)
        samePathRunning--
        samePathOrder.push("first:end")
      }),
      queue.run("same.txt", async () => {
        samePathOrder.push("second:start")
        samePathRunning++
        samePathMaxRunning = Math.max(samePathMaxRunning, samePathRunning)
        await wait(20)
        samePathRunning--
        samePathOrder.push("second:end")
      }),
    ])

    let independentRunning = 0
    let independentMaxRunning = 0
    await Promise.all([
      queue.run("a.txt", async () => {
        independentRunning++
        independentMaxRunning = Math.max(independentMaxRunning, independentRunning)
        await wait(20)
        independentRunning--
      }),
      queue.run("b.txt", async () => {
        independentRunning++
        independentMaxRunning = Math.max(independentMaxRunning, independentRunning)
        await wait(20)
        independentRunning--
      }),
    ])

    expect(samePathMaxRunning).toBe(1)
    expect(samePathOrder).toEqual(["first:start", "first:end", "second:start", "second:end"])
    expect(independentMaxRunning).toBe(2)
  })
})

function getTool(name: string) {
  const tool = createDefaultTools().find((candidate) => candidate.name === name)
  if (!tool) throw new Error(`Missing tool: ${name}`)
  return tool
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}
