import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import WebSocket from "ws"
import { describe, expect, it } from "vitest"
import { buildDocsSite, buildHarnessBuilderData, renderDocsSite, writeDocsSite } from "@helix/docs-site"
import { nanobotBuiltinBootstrapAssets } from "@helix/lego-prompt"
import { compileRecipe, HarnessProfileStore } from "@helix/recipes"
import { startDocsServer } from "../docs-site/src/server.ts"

describe("docs site", () => {
  it("does not display product factory atoms as native without TODO27 proof", () => {
    const data = buildDocsSite({ cwd: process.cwd(), generatedAt: "2026-05-27T00:00:00.000Z" })
    const nativeSource = {
      packageDir: "packages/lego-agent-loop",
      packageName: "@helix/lego-agent-loop",
      exportPath: "./product-turn/opencode/context-builder",
      specifier: "@helix/lego-agent-loop/product-turn/opencode/context-builder",
    }
    const mutated = {
      ...data,
      assemblyContracts: data.assemblyContracts.map((contract) =>
        contract.product === "opencode"
          ? {
              ...contract,
              atoms: contract.atoms.map((atom) => {
                if (atom.id === "opencode.turn.context-builder") {
                  return {
                    ...atom,
                    implementationKind: "factory" as const,
                    selectionReason: "product turn factory still backed by partial replay evidence",
                    parityCoverage: "profile-compatible" as const,
                    knownLossiness: ["partial-product-turn-replay"],
                    nativeEvidenceRefs: ["conformance:opencode-turn-replay-snapshot"],
                    fixtureIDs: ["opencode-turn:context-builder"],
                    source: nativeSource,
                    sourcePackage: nativeSource.packageName,
                    publicExport: nativeSource.exportPath,
                  }
                }
                if (atom.id === "opencode.turn.prompt-assembler") {
                  return {
                    ...atom,
                    implementationKind: "factory" as const,
                    selectionReason: "upstream native implementation with complete fixture coverage",
                    parityCoverage: "native" as const,
                    knownLossiness: [],
                    nativeEvidenceRefs: ["upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"],
                    fixtureIDs: ["opencode-turn:prompt-assembler-native"],
                    source: {
                      ...nativeSource,
                      exportPath: "./product-turn/opencode/prompt-assembler",
                      specifier: "@helix/lego-agent-loop/product-turn/opencode/prompt-assembler",
                    },
                    sourcePackage: nativeSource.packageName,
                    publicExport: "./product-turn/opencode/prompt-assembler",
                  }
                }
                if (atom.id === "opencode.prompt.mode-builder") {
                  return {
                    ...atom,
                    selectionReason: "upstream native implementation with incomplete fixture coverage",
                    parityCoverage: "native" as const,
                    knownLossiness: ["partial-prompt-family"],
                    nativeEvidenceRefs: [],
                    fixtureIDs: [],
                  }
                }
                return atom
              }),
            }
          : contract,
      ),
    }
    const builderData = buildHarnessBuilderData(mutated)

    expect(builderData.atoms.find((atom) => atom.id === "opencode.turn.context-builder")).toMatchObject({
      implementationKind: "factory",
      implementationLevel: "profile-compatible",
      implementationLabel: "Profile compatible",
      implementationSummary: expect.stringContaining("shared Helix turn implementation plus product profile"),
    })
    expect(builderData.atoms.find((atom) => atom.id === "opencode.turn.prompt-assembler")).toMatchObject({
      implementationKind: "factory",
      implementationLevel: "native",
      implementationLabel: "Native",
      implementationSummary: expect.stringContaining("product-native implementation"),
    })
    expect(builderData.atoms.find((atom) => atom.id === "opencode.prompt.mode-builder")).toMatchObject({
      implementationKind: "factory",
      implementationLevel: "compatible-bridge",
      implementationLabel: "Compatible bridge",
      implementationSummary: expect.stringContaining("not a native product implementation"),
    })
  }, 15000)

  it("generates a static assembly console from recipes and TODO progress", () => {
    const data = buildDocsSite({ cwd: process.cwd(), generatedAt: "2026-05-27T00:00:00.000Z" })

    expect(data.recipes.opencode.graph.map((module) => module.id)).toContain("turn.tool-executor.common")
    expect(data.recipes.piMono.graph.map((module) => module.id)).toContain("turn.tool-executor.common")
    expect(data.recipes.nanobot.graph.map((module) => module.id)).toContain("turn.tool-executor.common")
    expect(data.recipes.hermesAgent.graph.map((module) => module.id)).toContain("turn.tool-executor.common")
    expect(data.recipes.minimal.graph.map((module) => module.id)).toContain("product.shell.minimal-cli")
    expect(data.recipes.swaps.map((recipe) => recipe.id)).toEqual(
      expect.arrayContaining([
        "opencode.session-jsonl",
        "pi.session-projection",
        "minimal.filesystem-tools",
        "minimal.no-shell",
        "opencode.echo-tools",
        "pi.echo-tools",
      ]),
    )
    expect(data.boundaries.ok).toBe(true)
    expect(data.ledger.ok).toBe(true)
    expect(data.ledger.coverage.catalogedPorts).toBe(data.ledger.coverage.fixturePorts)
    expect(data.ledger.coverage.publicModulesWithRoute).toBe(data.ledger.coverage.publicModules)
    expect(data.assemblyContracts.map((contract) => contract.product)).toEqual(["opencode", "pi-mono", "nanobot", "hermes-agent", "minimal"])
    expect(data.assemblyContracts.every((contract) => contract.fingerprints.contract.length === 16)).toBe(true)
    expect(data.nanobotDepth.ok).toBe(true)
    expect(data.nanobotDepth.mechanisms.every((mechanism) => mechanism.status !== "missing")).toBe(true)
    expect(data.taskParity?.summary).toMatchObject({ reports: 96, gapsFound: 0, failed: 0 })
    expect(data.nativeFixtureSummary).toMatchObject({
      artifactKind: "native-cadence-fixture-summary",
      summaryPath: "docs/reports/task-parity-native-cadence-fixtures/summary.json",
      manifestPath: "docs/reports/task-parity-native-cadence-fixtures/manifest.json",
      attachmentPolicy: "lazy-fetch-by-attachment-path",
    })
    expect(data.nativeFixtureSummary?.fixtures.length).toBeGreaterThan(0)
    expect(data.nativeFixtureSummary?.fixtures.find((fixture) => fixture.product === "opencode" && fixture.taskID === "context-compaction")?.attachmentPath).toMatch(
      /^docs\/reports\/task-parity-native-cadence-fixtures\/attachments\/opencode-context-compaction-/,
    )
    expect(JSON.stringify(data.nativeFixtureSummary)).not.toContain("nativeEvents")
    expect(data.diff.changedBindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ port: "session.store" }),
      ]),
    )
    expect(data.todo.total).toBeGreaterThan(0)

    const outDir = mkdtempSync(join(tmpdir(), "helix-docs-site-"))
    try {
      const outputPath = writeDocsSite({
        cwd: process.cwd(),
        outDir,
        generatedAt: "2026-05-27T00:00:00.000Z",
      })
      const opencodeWebPath = join(outDir, "opencode-web.html")
      const opencodeDesktopManifestPath = join(outDir, "opencode-desktop-manifest.json")
      const opencodeDesktopShellPath = join(outDir, "opencode-desktop-shell.html")
      const smokePath = join(outDir, "pi-browser-smoke.html")
      const nanobotWebPath = join(outDir, "nanobot-web-ui.html")
      const hermesDashboardPath = join(outDir, "hermes-web-dashboard.html")
      const builderPath = join(outDir, "harness-builder.html")
      const html = readFileSync(outputPath, "utf8")
      const opencodeWebHTML = readFileSync(opencodeWebPath, "utf8")
      const opencodeDesktopShellHTML = readFileSync(opencodeDesktopShellPath, "utf8")
      const smokeHTML = readFileSync(smokePath, "utf8")
      const nanobotWebHTML = readFileSync(nanobotWebPath, "utf8")
      const hermesDashboardHTML = readFileSync(hermesDashboardPath, "utf8")
      const builderHTML = readFileSync(builderPath, "utf8")

      expect(existsSync(outputPath)).toBe(true)
      expect(existsSync(opencodeWebPath)).toBe(true)
      expect(existsSync(opencodeDesktopManifestPath)).toBe(true)
      expect(existsSync(opencodeDesktopShellPath)).toBe(true)
      expect(existsSync(smokePath)).toBe(true)
      expect(existsSync(nanobotWebPath)).toBe(true)
      expect(existsSync(hermesDashboardPath)).toBe(true)
      expect(existsSync(builderPath)).toBe(true)
      expect(html).toContain("Helix Assembly Console")
      expect(html).toContain('data-recipe="opencode"')
      expect(html).toContain('data-recipe="pi-mono"')
      expect(html).toContain('data-recipe="nanobot"')
      expect(html).toContain('data-recipe="hermes-agent"')
      expect(html).toContain('data-recipe="coding-agent.minimal"')
      expect(html).toContain('data-module="session.store.memory"')
      expect(html).toContain("Package Atoms")
      expect(html).toContain("Block Ledger")
      expect(html).toContain("Assembly Contracts")
      expect(html).toContain("Task Parity")
      expect(html).toContain("External Tools")
      expect(html).toContain("Nanobot Depth")
      expect(html).toContain('data-ledger-ok="true"')
      expect(html).toContain('data-nanobot-lego-depth="ok"')
      expect(html).toContain('data-nanobot-mechanism="prompt-resource"')
      expect(html).toContain('data-task-parity-summary="96:48:0:0"')
      expect(html).toContain('data-task-parity-pair="test-fix:opencode"')
      expect(html).toContain('data-task-parity-open-gaps="0"')
      expect(html).toContain('data-task-parity-acceptance-timing-drift=')
      expect(html).toContain("acceptance.full-native-timing-unverified")
      expect(html).toContain("full-upstream-stop-continue-timing-not-replayed")
      expect(html).toContain('data-ledger-port="session.id-generator"')
      expect(html).toContain('data-assembly-contract-product="opencode"')
      expect(html).toContain('data-assembly-contract-product="pi-mono"')
      expect(html).toContain('data-assembly-contract-product="nanobot"')
      expect(html).toContain('data-assembly-contract-product="hermes-agent"')
      expect(html).toContain('data-assembly-contract-ok="true"')
      expect(html).toContain('data-assembly-swap-point="opencode:session.store"')
      expect(html).toContain('data-external-tools="ready"')
      expect(html).toContain('data-external-tool="claude-tap"')
      expect(html).toContain('data-external-tool-not-atom="true"')
      expect(html).toContain('data-external-tool-default-strategy="binary"')
      expect(html).toContain('data-package-atoms="@helix/lego-session"')
      expect(html).toContain('data-package-atom="session.projector.common-transcript"')
      expect(html).toContain('data-diff-module="opencode.product-shell.sdk"')
      expect(html).toContain('data-binding-port="session.store"')
      expect(html).toContain('data-strategy-id="turn.context-builder"')
      expect(html).toContain('data-policy-id="shell.execution"')
      expect(html).toContain('data-boundary-rule="common-no-personality-imports"')
      expect(html).toContain('data-boundary-ok="true"')
      expect(html).toContain("TODO Gate")
      expect(html).toContain("opencode-web.html")
      expect(html).toContain("harness-builder.html")
      expect(html).toContain("pi-browser-smoke.html")
      expect(html).toContain("nanobot-web-ui.html")
      expect(html).toContain("hermes-web-dashboard.html")
      expect(builderHTML).toContain('data-harness-builder="ready"')
      expect(builderHTML).toContain('data-builder-preset-button="opencode"')
      expect(builderHTML).toContain('data-builder-preset-button="pi-mono"')
      expect(builderHTML).toContain('data-builder-preset-button="nanobot"')
      expect(builderHTML).toContain('data-builder-preset-button="hermes-agent"')
      expect(builderHTML).toContain('data-builder-predefined="opencode"')
      expect(builderHTML).toContain('data-builder-predefined="hermes-agent"')
      expect(builderHTML).toContain('data-builder-preset-claim="upstream-parity-target"')
      expect(builderHTML).toContain('data-builder-preset-composition-claim="upstream-parity-target"')
      expect(builderHTML).toContain('data-builder-preset-parity-target-satisfied="false"')
      expect(builderHTML).toContain('data-builder-preset-parity-targets="opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"')
      expect(builderHTML).toContain('data-builder-preset-evidence-policy="native-proof-required"')
      expect(builderHTML).toContain('data-builder-preset-native-parity="false"')
      expect(builderHTML).toContain('data-builder-preset-compile-status="passed"')
      expect(builderHTML).toContain("data-builder-blueprint-compile-status")
      expect(builderHTML).toContain("data-builder-bom-compile-status")
      expect(builderHTML).toContain("data-builder-bom-binding-module-claim")
      expect(builderHTML).toContain("data-builder-bom-binding-parity-target-satisfied")
      expect(builderHTML).toContain("data-flow-module-claim")
      expect(builderHTML).toContain("data-flow-parity-target-satisfied")
      expect(builderHTML).toContain('data-flow-draft-blueprint="false"')
      expect(builderHTML).toContain("function buildFlowDraftBlueprint")
      expect(builderHTML).toContain("builder-draft-flow:")
      expect(builderHTML).toContain("上游一致性目标")
      expect(builderHTML).toContain("Native parity not verified")
      expect(builderHTML).toContain('data-builder-layout="ready"')
      expect(builderHTML).toContain('data-builder-phase="start"')
      expect(builderHTML).toContain('data-builder-zone="materials"')
      expect(builderHTML).toContain('data-builder-zone="assembly"')
      expect(builderHTML).toContain('data-builder-zone="audit"')
      expect(builderHTML).toContain("assembly-status-panel")
      expect(builderHTML).toContain('data-builder-assembly-status="ready"')
      expect(builderHTML).toContain('data-builder-assembly-status-title="ready"')
      expect(builderHTML).toContain('data-builder-status-badge="compat" hidden')
      expect(builderHTML).toContain('id="auditTitle"')
      expect(builderHTML).toContain('data-builder-inspector-tabs="three-card-tabs"')
      expect(builderHTML).toContain('data-builder-inspector-tab="blueprint"')
      expect(builderHTML).toContain('data-builder-inspector-tab="preview"')
      expect(builderHTML).toContain('data-builder-inspector-tab="details"')
      expect(builderHTML).toContain('data-builder-current-assembly="ready"')
      expect(builderHTML).toContain('data-builder-current-assembly-section="ready"')
      expect(builderHTML).toContain('data-builder-current-assembly-subsection="metrics"')
      expect(builderHTML).toContain('data-builder-current-assembly-subsection="readiness"')
      expect(builderHTML).toContain("validation-copy")
      expect(builderHTML).not.toContain(".validation-card > span:first-child")
      expect(builderHTML).toContain('data-builder-current-assembly-subsection="summary"')
      expect(builderHTML).toContain('data-builder-current-assembly-subsection="diagnostics"')
      expect(builderHTML).toContain('data-builder-current-assembly-summary="ready"')
      expect(builderHTML).toContain('data-builder-current-assembly-detail="ready"')
      expect(builderHTML).toContain('data-builder-pending-change-subsection="impact"')
      expect(builderHTML).toContain('data-builder-details-open="true"')
      expect(builderHTML).toContain('id="detailsOpenButton"')
      expect(builderHTML).toContain('aria-expanded="false" aria-controls="detailsDrawer"')
      expect(builderHTML).toContain('data-builder-details-drawer="closed"')
      expect(builderHTML).toContain('id="detailsDrawer"')
      expect(builderHTML).toContain('role="tabpanel" aria-labelledby="detailsOpenButton"')
      expect(builderHTML).toContain('id="detailsCloseButton"')
      expect(builderHTML).toContain('data-builder-details-model="single-panel"')
      expect(builderHTML).toContain('data-builder-details-layout="collapsible-sections"')
      expect(builderHTML).toContain("collapsible-section")
      expect(builderHTML).toContain('data-builder-details-nav="ready"')
      expect(builderHTML).toContain("data-builder-details-nav-target")
      expect(builderHTML).toContain("data-builder-details-section-target")
      expect(builderHTML).toContain("data-builder-details-section-active")
      expect(builderHTML).toContain('data-builder-details-materials="ready"')
      expect(builderHTML).toContain('data-builder-details-materials-list="ready"')
      expect(builderHTML).toContain('data-builder-details-audit="ready"')
      expect(builderHTML).toContain('data-builder-details-raw="ready"')
      expect(builderHTML).toContain('data-builder-details-commands="ready"')
      expect(builderHTML).toContain('data-builder-pending-change-panel="ready"')
      expect(builderHTML).toContain('data-builder-inspector-panel="blueprint"')
      expect(builderHTML).toContain('data-builder-inspector-panel="preview"')
      expect(builderHTML).toContain('data-builder-inspector-panel="activation"')
      expect(builderHTML).toContain('data-builder-inspector-panel="bom"')
      expect(builderHTML).toContain('data-builder-inspector-panel="audit"')
      expect(builderHTML).toContain('data-builder-inspector-panel="raw"')
      expect(builderHTML).not.toContain('data-builder-inspector-tab="bom"')
      expect(builderHTML).not.toContain('data-builder-inspector-tab="audit"')
      expect(builderHTML).not.toContain('data-builder-inspector-tab="raw"')
      expect(builderHTML).not.toContain('data-builder-inspector-tab="commands"')
      expect(builderHTML).not.toContain('data-builder-inspector-tab="activation"')
      expect(builderHTML).toContain('data-builder-bom="ready"')
      expect(builderHTML).toContain("bom.implementationStates")
      expect(builderHTML).toContain("data-builder-bom-implementation-summary")
      expect(builderHTML).toContain("data-builder-bom-implementation-state")
      expect(builderHTML).toContain("data-builder-bom-state-lossiness")
      expect(builderHTML).toContain('data-builder-start="ready"')
      expect(builderHTML).toContain('data-builder-palette="ready"')
      expect(builderHTML).toContain('data-builder-board="ready"')
      expect(builderHTML).toContain('data-builder-export="ready"')
      expect(builderHTML).toContain('data-builder-compile="ready"')
      expect(builderHTML).toContain("builder.compile.metadata-only-provider")
      expect(builderHTML).toContain("builder.compile.primary-preview-shell")
      expect(builderHTML).toContain("builder.compile.prompt-identity-placeholder")
      expect(builderHTML).toContain("builder.compile.prompt-identity-unverified")
      expect(builderHTML).toContain("Metadata only，不能作为可执行实现通过编译")
      expect(builderHTML).toContain('data-flow-observer="ready"')
      expect(builderHTML).toContain('data-flow-observer-status="ready"')
      expect(builderHTML).toContain('data-flow-state="collapsed"')
      expect(builderHTML).toContain("flowBlueprints")
      expect(builderHTML).toContain("flowCatalogs")
      expect(builderHTML).toContain("opencode.fixture-native")
      expect(builderHTML).toContain("hermes-agent.visible-native")
      expect(builderHTML).toContain("lossinessRules")
      expect(builderHTML).toContain("dataSources")
      expect(builderHTML).toContain("turn-pipeline-trace")
      expect(builderHTML).toContain("context-compaction-events")
      expect(builderHTML).toContain("read-only-answer")
      expect(builderHTML).toContain("flowTasks")
      expect(builderHTML).toContain("nativeFixtureSummary")
      expect(builderHTML).toContain("lazy-fetch-by-attachment-path")
      expect(builderHTML).not.toContain("\"nativeEvents\"")
      expect(builderHTML).not.toContain("\"nativeChunks\"")
      expect(builderHTML).toContain("flow-observer-trace")
      expect(builderHTML).toContain("flow-observer-compare")
      expect(builderHTML).toContain("openFlowObserverWindow")
      expect(builderHTML).toContain('url.searchParams.set("flowObserver", "1")')
      expect(builderHTML).toContain('html[data-flow-observer-window="true"] #builderLayout')
      expect(builderHTML).not.toContain("data-flow-evidence-source-option")
      expect(builderHTML).toContain('{ id: "external-capture"')
      expect(builderHTML).toContain("data-flow-external-capture")
      expect(builderHTML).toContain("docs/reports/external-tools/claude-tap/pi-read-only/native-capture.json")
      expect(builderHTML).toContain('data-flow-product-selector="ready"')
      expect(builderHTML).toContain("flowProductSelect")
      expect(builderHTML).toContain("flow.product.current")
      expect(builderHTML).not.toContain('data-flow-task-selector="ready"')
      expect(builderHTML).not.toContain("flowTaskSelect")
      expect(builderHTML).toContain("context-compaction")
      expect(builderHTML).not.toContain('data-flow-evidence-source-selector="ready"')
      expect(builderHTML).not.toContain("flowEvidenceSourceSelect")
      expect(builderHTML).toContain('data-flow-native-artifact-field="ready"')
      expect(builderHTML).toContain("flowNativeArtifactPathInput")
      expect(builderHTML).toContain("native-capture-artifact")
      expect(builderHTML).toContain("task-parity-report")
      expect(builderHTML).toContain("latest-assembled-run")
      expect(builderHTML).toContain("native-capture-artifact")
      expect(builderHTML).toContain('data-flow-trace-source="ready"')
      expect(builderHTML).toContain("flow-compare-layout")
      expect(builderHTML).toContain('data-flow-compare-layout="side-by-side"')
      expect(builderHTML).toContain('data-flow-compare-layout="overlay"')
      expect(builderHTML).toContain('data-flow-compare-layout="diff-table"')
      expect(builderHTML).toContain('data-flow-lane-filter="provider"')
      expect(builderHTML).toContain("data-flow-lane-tracks")
      expect(builderHTML).toContain("data-flow-lane-track")
      expect(builderHTML).toContain('data-flow-layout="horizontal-stage-rail"')
      expect(builderHTML).toContain('data-flow-lane-layout="unframed-stage-row"')
      expect(builderHTML).toContain("grid-template-columns: repeat(19, minmax(72px, 1fr));")
      expect(builderHTML).toContain("data-flow-stage-column")
      expect(builderHTML).toContain("data-flow-mobile-stage-list")
      expect(builderHTML).toContain("data-flow-stage-list-node")
      expect(builderHTML).toContain('data-flow-node-label-mode="summary"')
      expect(builderHTML).toContain("data-flow-inspector-node")
      expect(builderHTML).toContain("flow-inspector-grid")
      expect(builderHTML).toContain("data-flow-node-assembly")
      expect(builderHTML).toContain("data-flow-node-primary-atom")
      expect(builderHTML).toContain("data-flow-node-primary-port")
      expect(builderHTML).toContain("data-flow-node-replaceable")
      expect(builderHTML).toContain("data-flow-drift-node")
      expect(builderHTML).toContain("data-flow-drift-projection")
      expect(builderHTML).toContain("data-flow-draft-change")
      expect(builderHTML).toContain("draft.binding-preview")
      expect(builderHTML).toContain('data-flow-prompt-debug="ready"')
      expect(builderHTML).toContain("full prompt hidden; enable Prompt debug")
      expect(builderHTML).toContain("data-flow-diff-category")
      expect(builderHTML).toContain("data-flow-edge-badge")
      expect(builderHTML).toContain("data-flow-edge-data-kind")
      expect(builderHTML).toContain("data-flow-edge-hook-count")
      expect(builderHTML).toContain("flow.side.lossiness")
      expect(builderHTML).toContain("data-flow-lossiness-count")
      expect(builderHTML).toContain("data-flow-native-projection-loss")
      expect(builderHTML).toContain("data-flow-native-stage")
      expect(builderHTML).toContain("data-flow-native-stage-loss")
      expect(builderHTML).toContain("data-flow-bridge-layer")
      expect(builderHTML).toContain("data-flow-bridge-implementation")
      expect(builderHTML).toContain("flowNativeProjectionFieldsForStage")
      expect(builderHTML).toContain("projectionLossDetails")
      expect(builderHTML).toContain("flow.side.traceMetrics")
      expect(builderHTML).toContain("data-flow-trace-metrics")
      expect(builderHTML).toContain("data-flow-trace-metric")
      expect(builderHTML).toContain("provider-requests")
      expect(builderHTML).toContain("token-estimate")
      expect(builderHTML).toContain('key: "compaction"')
      expect(builderHTML).toContain("data-flow-timeline-event")
      expect(builderHTML).toContain("flow.lossiness.unobservable")
      expect(builderHTML).toContain("lossiness=")
      expect(builderHTML).toContain("data-flow-prompt-diff")
      expect(builderHTML).toContain("prompt comparison")
      expect(builderHTML).toContain("original prompt artifact=missing")
      expect(builderHTML).toContain("adapter=")
      expect(builderHTML).toContain("fixture=")
      expect(builderHTML).toContain("metadata.evidenceSources")
      expect(builderHTML).toContain("data-flow-edge-detail")
      expect(builderHTML).toContain("payload fingerprint=")
      expect(builderHTML).toContain("source order=")
      expect(builderHTML).toContain("data-flow-hook-adapter-source")
      expect(builderHTML).toContain("adapter kind=")
      expect(builderHTML).toContain("data-flow-hook-boundary")
      expect(builderHTML).toContain("hook boundary unobservable")
      expect(builderHTML).toContain("data-flow-fix-hint")
      expect(builderHTML).toContain("owning plane=")
      expect(builderHTML).toContain("candidate atom=")
      expect(builderHTML).toContain("data-flow-fix-todo")
      expect(builderHTML).toContain("flow-observer-pin")
      expect(builderHTML).not.toContain("flowObserverDepthButton")
      expect(builderHTML).not.toContain("flow-depth-toggle")
      expect(builderHTML).not.toContain("data-flow-depth-toggle")
      expect(builderHTML).toContain("data-flow-depth")
      expect(builderHTML).not.toContain('id="topTuiButton"')
      expect(builderHTML).toContain('data-builder-right-card-tab="flow"')
      expect(builderHTML).toContain('data-builder-assembly-flow-tab="ready"')
      expect(builderHTML).toContain('data-builder-assembly-flow-card="ready"')
      expect(builderHTML).toContain('data-builder-assembly-flow-panel="ready"')
      expect(builderHTML).toContain('data-builder-assembly-flow-mode-button="blueprint"')
      expect(builderHTML).toContain('data-builder-assembly-flow-mode-button="trace"')
      expect(builderHTML).toContain('data-builder-assembly-flow-mode-button="compare"')
      expect(builderHTML).toContain('data-builder-right-card-tab="tui"')
      expect(builderHTML).toContain('data-builder-tui-dock="closed"')
      expect(builderHTML).toContain('data-builder-layout-resizer="ready"')
      expect(builderHTML).toContain("编译通过")
      expect(builderHTML).toContain('data-builder-tui-panel="ready"')
      expect(builderHTML).toContain("data-builder-tui-start")
      expect(builderHTML).toContain("data-builder-tui-stop")
      expect(builderHTML).toContain("data-builder-tui-restart")
      expect(builderHTML).toContain("data-builder-tui-input")
      expect(builderHTML).toContain("data-builder-tui-output")
      expect(builderHTML).toContain("data-builder-tui-status")
      expect(builderHTML).toContain("data-builder-tui-session")
      expect(builderHTML).toContain("data-builder-tui-provider")
      expect(builderHTML).toContain("data-builder-tui-runtime-trace")
      expect(builderHTML).toContain("tui.runtimeTrace")
      expect(builderHTML).toContain("data-builder-tui-log")
      expect(builderHTML).toContain("data-builder-command")
      expect(builderHTML).toContain("data-copy-command")
      expect(builderHTML).toContain("data-builder-bundle-action")
      expect(builderHTML).toContain("data-builder-bundle-action-button")
      expect(builderHTML).toContain("data-builder-bundle-source")
      expect(builderHTML).toContain("data-builder-slot-bundle-source")
      expect(builderHTML).toContain("data-builder-blueprint-bundle-source")
      expect(builderHTML).toContain("data-builder-blueprint-latest-impact")
      expect(builderHTML).toContain("data-builder-bom-bundle-source")
      expect(builderHTML).toContain("data-builder-implementation-level")
      expect(builderHTML).toContain("data-builder-bom-implementation-level")
      expect(builderHTML).toContain('"implementationKind":"bridge"')
      expect(builderHTML).toContain('"implementationKind":"metadata-only"')
      expect(builderHTML).toContain("Native-like")
      expect(builderHTML).toContain("Compatible bridge")
      expect(builderHTML).toContain("Preview shell")
      expect(builderHTML).toContain("Metadata only")
      expect(builderHTML).toContain("Common shared")
      expect(builderHTML).toContain("inferredBundleIDs")
      expect(builderHTML).toContain("data-builder-atom-promotion")
      expect(builderHTML).toContain("data-promote-bundle")
      expect(builderHTML).toContain("data-complete-bundle")
      expect(builderHTML).toContain("data-replace-bundle")
      expect(builderHTML).toContain('data-builder-binding="candidate"')
      expect(builderHTML).toContain('data-builder-diagnostic')
      expect(builderHTML).toContain('data-builder-plane')
      expect(builderHTML).toContain("data-builder-lane-help")
      expect(builderHTML).toContain("lane.description.agent-loop")
      expect(builderHTML).toContain('id="viewFilter"')
      expect(builderHTML).toContain('data-action="import"')
      expect(builderHTML).toContain('data-action="new"')
      expect(builderHTML).toContain('data-action="run-open"')
      expect(builderHTML).toContain('data-action="run-start"')
      expect(builderHTML).toContain('data-action="activation-install"')
      expect(builderHTML).toContain('data-action="activation-provider"')
      expect(builderHTML).toContain('data-action="activation-telegram"')
      expect(builderHTML).toContain('data-action="activation-smoke"')
      expect(builderHTML).toContain('data-action="show-start"')
      expect(builderHTML).toContain('data-action="toggle-locale"')
      expect(builderHTML).toContain('data-builder-locale="en"')
      expect(builderHTML).toContain('id="localeToggle"')
      expect(builderHTML).toContain('id="runModal"')
      expect(builderHTML).toContain('data-builder-live-run="ready"')
      expect(builderHTML).toContain('id="removeImpactModal"')
      expect(builderHTML).toContain('data-builder-remove-impact="ready"')
      expect(builderHTML).toContain("data-builder-contract-fingerprint")
      expect(builderHTML).toContain("data-builder-remove-impact-audit")
      expect(builderHTML).toContain('data-action="remove-impact-confirm"')
      expect(builderHTML).toContain("Removal impact returned an empty response")
      expect(builderHTML).toContain("data-remove-preview")
      expect(builderHTML).toContain('data-action="wizard-create"')
      expect(builderHTML).toContain('data-builder-wizard="ready"')
      expect(builderHTML).toContain("data-wizard-product")
      expect(builderHTML).toContain("data-builder-wizard-product")
      expect(builderHTML).toContain("data-builder-lane")
      expect(builderHTML).toContain("data-builder-lane-toggle")
      expect(builderHTML).toContain("data-builder-lane-collapsed")
      expect(builderHTML).toContain("data-builder-lane-body")
      expect(builderHTML).toContain("data-builder-assembly-view-toggle")
      expect(builderHTML).toContain("data-builder-assembly-view-option")
      expect(builderHTML).toContain("data-builder-slot-assembly-lane")
      expect(builderHTML).toContain("assemblyView.technical")
      expect(builderHTML).toContain("data-builder-slot")
      expect(builderHTML).toContain("data-builder-slot-preview")
      expect(builderHTML).toContain("data-builder-slot-ghost-fit")
      expect(builderHTML).toContain("data-builder-slot-ghost-fit-module")
      expect(builderHTML).toContain("data-builder-slot-interface-state")
      expect(builderHTML).toContain("data-builder-slot-interface-meter")
      expect(builderHTML).toContain("data-builder-slot-required")
      expect(builderHTML).toContain("data-builder-slot-warning-count")
      expect(builderHTML).toContain("data-builder-slot-warning")
      expect(builderHTML).toContain("data-builder-slot-detail-warning")
      expect(builderHTML).toContain("data-builder-loose-area")
      expect(builderHTML).toContain("data-builder-loose-atom")
      expect(builderHTML).toContain("data-builder-loose-unknown")
      expect(builderHTML).toContain("data-builder-bom-loose-unknown")
      expect(builderHTML).toContain("data-builder-slot-atom-role")
      expect(builderHTML).toContain("data-builder-slot-atom-role-group")
      expect(builderHTML).toContain("data-builder-slot-atoms-toggle")
      expect(builderHTML).toContain("data-builder-slot-atoms-expanded")
      expect(builderHTML).toContain("data-builder-active-atom-audit")
      expect(builderHTML).toContain("data-builder-preview-panel")
      expect(builderHTML).toContain("data-builder-preview-tab")
      expect(builderHTML).toContain("data-builder-slot-family-preview")
      expect(builderHTML).toContain("data-builder-slot-family-replacement")
      expect(builderHTML).toContain("data-builder-slot-family-conflict")
      expect(builderHTML).toContain("data-builder-bundle-family")
      expect(builderHTML).toContain("data-builder-bundle-family-policy")
      expect(builderHTML).toContain("data-replace-family-bundle")
      expect(builderHTML).toContain("data-builder-family-diagnostic")
      expect(builderHTML).toContain("data-builder-family-conflict")
      expect(builderHTML).toContain("data-builder-family-fix")
      expect(builderHTML).toContain("data-builder-family-winner")
      expect(builderHTML).toContain("data-builder-family-winner-bundle")
      expect(builderHTML).toContain("data-builder-activation")
      expect(builderHTML).toContain("data-activation-panel")
      expect(builderHTML).toContain("activationWorkspaceDir")
      expect(builderHTML).toContain("activationStorageDir")
      expect(builderHTML).toContain("data-activation-permissions")
      expect(builderHTML).toContain("activationWebhookURL")
      expect(builderHTML).toContain("activationWebhookSecretEnv")
      expect(builderHTML).toContain("activation-restart")
      expect(builderHTML).toContain("data-profile-status")
      expect(builderHTML).toContain("data-telegram-status")
      expect(builderHTML).toContain("data-gateway-status")
      expect(builderHTML).toContain("data-gateway-logs")
      expect(builderHTML).toContain("data-builder-preview-dock")
      expect(builderHTML).toContain("data-builder-preview-dock-density")
      expect(builderHTML).toContain("data-builder-preview-dock-role")
      expect(builderHTML).toContain("data-builder-preview-dock-summary")
      expect(builderHTML).toContain("data-builder-preview-dock-actions")
      expect(builderHTML).toContain("data-builder-binding-preview")
      expect(builderHTML).toContain("data-binding-preview-confirm")
      expect(builderHTML).toContain("data-binding-preview-cancel")
      expect(builderHTML).toContain('data-builder-wizard-preview="interface"')
      expect(builderHTML).toContain('data-builder-wizard-preview="chassis"')
      expect(builderHTML).toContain('data-builder-wizard-preview="kit"')
      expect(builderHTML).toContain('data-builder-wizard-preview="kit-slots"')
      expect(builderHTML).toContain('data-builder-wizard-preview="bundles"')
      expect(builderHTML).toContain("data-builder-wizard-profile")
      expect(builderHTML).toContain("data-builder-wizard-kit")
      expect(builderHTML).toContain("kit.product")
      expect(builderHTML).toContain("data-builder-blueprint-kit")
      expect(builderHTML).toContain("data-builder-wizard-stage")
      expect(builderHTML).toContain("data-builder-port-stage")
      expect(builderHTML).toContain('data-builder-guide="ready"')
      expect(builderHTML).toContain("data-builder-guide-active")
      expect(builderHTML).toContain("data-builder-guide-step-conflicts")
      expect(builderHTML).toContain("data-builder-guide-step-next")
      expect(builderHTML).toContain("data-builder-guide-acceptance")
      expect(builderHTML).toContain("data-builder-guide-acceptance-check")
      expect(builderHTML).toContain("data-builder-acceptance-check")
      expect(builderHTML).toContain('data-builder-validation="ready"')
      expect(builderHTML).toContain("data-builder-validation-status")
      expect(builderHTML).toContain('id="recipeImport"')
      expect(builderHTML).toContain("helix-builder")
      expect(builderHTML).toContain("opencode.product-shell.sdk")
      expect(builderHTML).toContain("nanobot.product-shell.cli")
      expect(builderHTML).toContain("hermes.product-shell.sdk")
      expect(builderHTML).toContain("hybrid-mix")
      expect(builderHTML).toContain("session.store")
      expect(builderHTML).toContain("provider.transport")
      const builderPayload = /<script id="builder-data" type="application\/json">([^<]+)<\/script>/.exec(builderHTML)?.[1]
      expect(builderPayload).toBeTruthy()
      const builderData = JSON.parse(builderPayload ?? "{}") as {
        presets: Array<{
          id: string
          product: string
          recipeID: string
          compileStatus: string
          compileDiagnostics: string[]
          assemblyClaim: string
          assemblyClaimLabel: string
          compositionClaim: string
          parityTargets: Array<{
            id: string
            product: string
            repo: string
            ref: string
            packageVersion?: string
            requiredPlanes: string[]
            fixtureMatrix: string[]
          }>
          parityTargetSatisfied: boolean
          parityTargetSummary: string
          evidencePolicy: string
          nativeParityVerified: boolean
          nativeParitySummary: string
          atoms: string[]
          bundles: string[]
          bundleStates: Array<{ id: string; status: string; selectedAtoms: string[] }>
          bindings: Array<{
            portID: string
            providerAtomID: string
            moduleClaim: {
              level: string
              label: string
              sourceProduct: string
              sourceScope: string
              parityTargetProduct?: string
              parityTargetRef?: string
              portCompatible: boolean
              behaviorCompatible: boolean
              parityCompatible: string
              parityTargetSatisfied: boolean
              evidenceRefs: string[]
              fixtureIDs: string[]
              knownLossiness: string[]
              blockers: string[]
              summary: string
            }
          }>
          recipe: {
            id: string
            version: string
            modules: Array<{ id: string }>
            atoms: Array<{ id: string }>
            productShells: Array<{ id: string }>
            bundles?: Array<{ id: string; removedAtoms?: string[] }>
            bindings: Array<{ port: string; module: string }>
            requiredCapabilities: string[]
            personalities: string[]
          }
        }>
        atoms: Array<{
          id: string
          scope: string
          selectedIn: string[]
          bundleIDs?: string[]
          implementationKind?: string
          implementationLevel?: string
          implementationLabel?: string
          implementationSummary?: string
          nativeEvidenceRefs?: string[]
          upstreamVersion?: string
          upstreamCommit?: string
          fixtureIDs?: string[]
          parityCoverage?: string
          knownLossiness?: string[]
          moduleConfirmationStatus?: string
          moduleConfirmationSummary?: string
          moduleConfirmationSourceFiles?: string[]
          moduleConfirmationSourceOwners?: string[]
          moduleConfirmationFixtureTargets?: string[]
        }>
        ports: Array<{ id: string; multiplicity: string; selectedByProduct: Record<string, string>; bundleCandidates?: string[] }>
        bundles: Array<{ id: string; label: string; atoms: string[]; optionalAtomIDs?: string[]; ports: string[]; exclusiveFamilyID?: string; exclusiveFamilyPolicy?: string }>
        implementationStates: Array<{
          level: string
          label: string
          count: number
          selectedCount: number
          evidenceCount: number
          lossinessCount: number
          exampleAtomIDs: string[]
        }>
        moduleConfirmation?: {
          artifactKind: string
          artifactPath: string
          fingerprint: string
          byModuleConfirmationStatus: Record<string, number>
          atomConfirmations: Array<{
            atomID: string
            moduleConfirmationStatus: string
            currentSourceFiles: string[]
            sourceOwners: string[]
            fixtureDiffTargets: string[]
          }>
          currentSourceFiles: Array<{ currentSourceFile: string; moduleConfirmationStatus: string }>
          sourceOwners: Array<{ sourceOwnerPackagePath: string; moduleConfirmationStatus: string }>
        } | null
        flowBlueprints: Array<{
          product: string
          recipeID?: string
          contractFingerprint?: string
          nodes: Array<{
            id?: string
            metrics?: {
              implementationLevels?: string[]
              bridgeLayers?: Array<{ layer?: string; implementationLevel?: string; atomIDs?: string[] }>
              moduleClaims?: Array<{
                atomID?: string
                sourceProduct?: string
                implementationLevel?: string
                parityTargetProduct?: string
                parityTargetRef?: string
                parityCompatible?: string
                parityTargetSatisfied?: boolean
                evidenceRefs?: string[]
                fixtureIDs?: string[]
                knownLossiness?: string[]
                blockers?: string[]
              }>
              parityTargetRefs?: string[]
              parityTargetSatisfied?: boolean
              parityTargetBlockers?: string[]
              moduleConfirmationStatuses?: string[]
              moduleConfirmationSourceFiles?: string[]
              moduleConfirmationFixtureTargets?: string[]
            }
          }>
          summary: { fingerprint: string }
        }>
        slots: Array<{ id: string; stage: string; primaryPortID: string; candidateBundleIDs: string[]; candidateAtomIDs: string[]; required: boolean }>
        commandTemplates: string[]
      }
      expect(builderData.presets.map((preset) => preset.id)).toEqual(["opencode", "pi-mono", "nanobot", "hermes-agent", "minimal", "hybrid-mix"])
      expect(builderData.presets.filter((preset) => ["opencode", "pi-mono", "nanobot", "hermes-agent"].includes(preset.id))).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "opencode",
            assemblyClaim: "upstream-parity-target",
            assemblyClaimLabel: expect.stringContaining("上游一致性目标"),
            compositionClaim: "upstream-parity-target",
            evidencePolicy: "native-proof-required",
            parityTargetSatisfied: false,
            parityTargets: expect.arrayContaining([
              expect.objectContaining({
                product: "opencode",
                repo: "anomalyco/opencode",
                ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
                requiredPlanes: expect.arrayContaining(["prompt", "provider", "session", "product", "ui"]),
                fixtureMatrix: expect.arrayContaining([
                  "opencode-prompt:upstream-system-output-matrix",
                  "opencode-provider:raw-frame-boundary-matrix",
                  "opencode-provider:retry-cancel-race-projection",
                  "opencode-provider:retry-cancel-live-runtime-fixture",
                  "opencode-tool:contract-render-projection",
                  "opencode-tool:live-runtime-fixture",
                  "opencode-tool:source-matrix",
                  "opencode-hook:live-runtime-fixture",
                  "opencode-hook:source-matrix",
                  "opencode-event:live-runtime-fixture",
                  "opencode-event:source-matrix",
                  "opencode-foundation-trace:runtime-projection",
                  "opencode-foundation-trace:source-matrix",
                  "opencode-product-shell:live-runtime-fixture",
                  "opencode-product-shell:runtime-projection",
                  "opencode-product-shell:source-matrix",
                  "opencode-ui:live-runtime-fixture",
                  "opencode-ui:source-matrix",
                ]),
              }),
            ]),
            parityTargetSummary: expect.stringContaining("Targets anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"),
            nativeParityVerified: false,
            nativeParitySummary: expect.stringContaining("do not treat it as native-equivalent"),
          }),
        ]),
      )
      expect(builderData.presets.filter((preset) => ["opencode", "pi-mono", "nanobot", "hermes-agent"].includes(preset.id)).every((preset) => preset.assemblyClaim === "upstream-parity-target" && preset.compositionClaim === "upstream-parity-target" && preset.parityTargets.length === 1)).toBe(true)
      expect(builderData.presets.find((preset) => preset.id === "minimal")).toMatchObject({
        assemblyClaim: "helix-minimal",
        compositionClaim: "helix-minimal",
        parityTargets: [],
        evidencePolicy: "no-native-claim",
        nativeParityVerified: false,
      })
      const opencodeFlowBlueprint = builderData.flowBlueprints.find((graph) => graph.product === "opencode")
      const hybridFlowBlueprint = builderData.flowBlueprints.find((graph) => graph.recipeID === "hybrid.mix.demo")
      expect(opencodeFlowBlueprint?.nodes).toHaveLength(19)
      expect(opencodeFlowBlueprint?.summary.fingerprint).toMatch(/^[a-f0-9]{16}$/)
      expect(hybridFlowBlueprint).toMatchObject({
        product: "custom",
        recipeID: "hybrid.mix.demo",
        contractFingerprint: "hybrid-mix",
      })
      expect(hybridFlowBlueprint?.nodes).toHaveLength(19)
      expect(hybridFlowBlueprint?.summary.fingerprint).toMatch(/^[a-f0-9]{16}$/)
      expect(builderData.moduleConfirmation).toMatchObject({
        artifactKind: "current-module-confirmation-index",
        artifactPath: "docs/reports/current-module-placeholder-audit.json",
        fingerprint: "ce386d45f16fbeda",
        byModuleConfirmationStatus: expect.objectContaining({
          "upstream-divergent-exact-diff-missing": 0,
          "semantic-fixture-needs-exact-diff": 0,
          "demotion-guard-confirmed": 153,
          "manual-anchor-needed": 0,
          "no-open-divergence": 15,
        }),
      })
      expect(builderData.moduleConfirmation?.sourceOwners).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sourceOwnerPackagePath: "packages/adapters-opencode",
            moduleConfirmationStatus: "demotion-guard-confirmed",
          }),
        ]),
      )
      expect(builderData.moduleConfirmation?.currentSourceFiles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            currentSourceFile: "packages/adapters-opencode/src/opencode-turn-context-builder.ts",
            moduleConfirmationStatus: "demotion-guard-confirmed",
          }),
          expect.objectContaining({
            currentSourceFile: "packages/adapters-opencode/src/opencode-provider-auth-descriptor.ts",
            moduleConfirmationStatus: "demotion-guard-confirmed",
          }),
        ]),
      )
      expect(builderData.atoms.find((atom) => atom.id === "opencode.turn.context-builder")).toMatchObject({
        moduleConfirmationStatus: "demotion-guard-confirmed",
        moduleConfirmationSourceFiles: expect.arrayContaining(["packages/adapters-opencode/src/opencode-turn-context-builder.ts"]),
        moduleConfirmationFixtureTargets: expect.arrayContaining(["metadata.executable-blocker"]),
      })
      expect(builderData.atoms.find((atom) => atom.id === "opencode.product-shell.web")).toMatchObject({
        moduleConfirmationStatus: "demotion-guard-confirmed",
        moduleConfirmationSourceFiles: expect.arrayContaining(["packages/adapters-opencode/src/product-schema/product-shell.ts"]),
        moduleConfirmationFixtureTargets: expect.arrayContaining(["metadata.executable-blocker"]),
      })
      expect(opencodeFlowBlueprint?.nodes.find((node) => node.id === "prompt.assemble")?.metrics).toMatchObject({
        implementationLevels: ["native"],
        moduleConfirmationStatuses: expect.arrayContaining(["demotion-guard-confirmed"]),
        moduleConfirmationFixtureTargets: expect.arrayContaining(["metadata.executable-blocker"]),
        parityTargetRefs: expect.arrayContaining(["anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"]),
        parityTargetSatisfied: true,
        parityTargetBlockers: [],
        moduleClaims: expect.arrayContaining([
          expect.objectContaining({
            atomID: "opencode.prompt.mode-builder",
            sourceProduct: "opencode",
            implementationLevel: "native",
            parityTargetProduct: "opencode",
            parityTargetRef: "anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
            parityCompatible: "satisfied",
            parityTargetSatisfied: true,
            evidenceRefs: expect.arrayContaining(["conformance:opencode-system-prompt-core-exact-fixture", "conformance:opencode-llm-request-system-exact-fixture"]),
            fixtureIDs: expect.arrayContaining(["opencode-prompt:system-prompt-core-exact-fixture", "opencode-prompt:llm-request-system-exact-fixture"]),
            blockers: [],
          }),
          expect.objectContaining({
            atomID: "opencode.turn.prompt-assembler",
            sourceProduct: "opencode",
            implementationLevel: "native",
            parityCompatible: "satisfied",
            parityTargetSatisfied: true,
            evidenceRefs: expect.arrayContaining(["conformance:opencode-turn-prompt-assembler-native-exact-fixture", "turn-prompt-assembler-native-exact:opencode"]),
            fixtureIDs: expect.arrayContaining(["opencode-turn-prompt-assembler:native-exact-fixture"]),
            blockers: [],
          }),
        ]),
      })
      expect(hybridFlowBlueprint?.nodes.find((node) => node.id === "prompt.assemble")?.metrics).toMatchObject({
        implementationLevels: expect.arrayContaining(["native"]),
        parityTargetRefs: expect.arrayContaining(["HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"]),
        parityTargetSatisfied: false,
        parityTargetBlockers: expect.arrayContaining(["experimental-hybrid-composition", "module-claim-common-shared", "source-product-mismatch"]),
        moduleClaims: expect.arrayContaining([
          expect.objectContaining({
            atomID: "nanobot.prompt.agent-builder",
            sourceProduct: "nanobot",
            implementationLevel: "native",
            parityTargetProduct: "nanobot",
            parityTargetRef: "HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
            parityCompatible: "partial",
            parityTargetSatisfied: false,
            blockers: expect.arrayContaining(["experimental-hybrid-composition"]),
          }),
        ]),
      })
      expect(hybridFlowBlueprint?.nodes.find((node) => node.id === "session.assistant-write")?.metrics).toMatchObject({
        parityTargetRefs: expect.arrayContaining(["earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"]),
        parityTargetSatisfied: false,
        parityTargetBlockers: expect.arrayContaining(["experimental-hybrid-composition"]),
        moduleClaims: expect.arrayContaining([
          expect.objectContaining({
            atomID: "pi.session.store.jsonl-v3",
            sourceProduct: "pi-mono",
            implementationLevel: "native",
            parityTargetProduct: "pi-mono",
            parityTargetRef: "earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
            parityCompatible: "partial",
            parityTargetSatisfied: false,
            blockers: ["experimental-hybrid-composition"],
          }),
        ]),
      })
      expect(opencodeFlowBlueprint?.nodes.find((node) => node.id === "context.build")?.metrics).toMatchObject({
        moduleConfirmationStatuses: ["demotion-guard-confirmed"],
        moduleConfirmationSourceFiles: expect.arrayContaining(["packages/adapters-opencode/src/opencode-turn-context-builder.ts"]),
        moduleConfirmationFixtureTargets: expect.arrayContaining([
          "common-provider.native-claim-guard",
          "metadata.executable-blocker",
        ]),
        nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-turn-context-builder-native-exact-fixture", "turn-context-builder-native-exact:opencode"]),
        fixtureIDs: expect.arrayContaining(["opencode-turn-context-builder:native-exact-fixture"]),
      })
      expect(opencodeFlowBlueprint?.nodes.find((node) => node.id === "acceptance.check")?.metrics).toMatchObject({
        parityCoverage: "native",
        implementationLevels: ["native"],
        parityTargetSatisfied: true,
        parityTargetBlockers: [],
        nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-runtime-acceptance-native-exact-fixture", "runtime-acceptance-native-exact:opencode"]),
        fixtureIDs: expect.arrayContaining(["opencode-runtime-acceptance:native-exact-fixture"]),
      })
      expect(builderData.presets.find((preset) => preset.id === "opencode")?.bindings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            portID: "session.store",
            providerAtomID: "opencode.session.store.sqlite-projection",
            moduleClaim: expect.objectContaining({
              level: "native",
              sourceProduct: "opencode",
              parityTargetProduct: "opencode",
              parityTargetRef: "anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
              portCompatible: true,
              behaviorCompatible: true,
              parityCompatible: "satisfied",
              parityTargetSatisfied: true,
              evidenceRefs: expect.arrayContaining(["conformance:opencode-session-native-exact-fixture", "session-native-exact:opencode"]),
              fixtureIDs: expect.arrayContaining(["opencode-session:native-exact-fixture"]),
              blockers: [],
            }),
          }),
        ]),
      )
      expect(builderData.presets.find((preset) => preset.id === "opencode")?.bindings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            portID: "prompt.system-builder",
            providerAtomID: "opencode.prompt.mode-builder",
            moduleClaim: expect.objectContaining({
              level: "native",
              sourceProduct: "opencode",
              parityTargetProduct: "opencode",
              parityCompatible: "satisfied",
              parityTargetSatisfied: true,
              evidenceRefs: expect.arrayContaining(["conformance:opencode-system-prompt-core-exact-fixture", "conformance:opencode-llm-request-system-exact-fixture"]),
              fixtureIDs: expect.arrayContaining(["opencode-prompt:system-prompt-core-exact-fixture", "opencode-prompt:llm-request-system-exact-fixture"]),
              blockers: [],
              summary: expect.stringContaining("satisfies anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"),
            }),
          }),
        ]),
      )
      expect(builderData.presets.find((preset) => preset.id === "opencode")?.atoms).toEqual(
        expect.arrayContaining(["provider.auth.bearer", "config.merge.replace", "event.log.jsonl", "tool.permission.always-deny"]),
      )
      expect(builderData.presets.find((preset) => preset.id === "opencode")?.bundleStates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "bundle.config.sources", selectedAtoms: expect.arrayContaining(["config.merge.deep", "config.merge.priority"]) }),
        ]),
      )
      expect(builderData.presets.find((preset) => preset.id === "pi-mono")?.bindings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ portID: "session.store", providerAtomID: "pi.session.store.jsonl-v3" }),
        ]),
      )
      expect(builderData.presets.find((preset) => preset.id === "nanobot")?.atoms).toContain("nanobot.product-shell.cli")
      expect(builderData.slots).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "slot.session.store", stage: "session", primaryPortID: "session.store", required: true }),
        ]),
      )
      expect(builderData.slots.find((slot) => slot.id === "slot.session.store")?.candidateBundleIDs.length).toBeGreaterThan(0)
      expect(builderData.presets.find((preset) => preset.id === "hermes-agent")?.atoms).toContain("hermes.product-shell.sdk")
      expect(builderData.presets.find((preset) => preset.id === "hermes-agent")?.bindings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ portID: "session.store", providerAtomID: "hermes.session.store.sqlite-fts" }),
        ]),
      )
      expect(builderData.bundles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "bundle.agent-loop.turn-runner" }),
          expect.objectContaining({ id: "bundle.hermes.session-sqlite-fts" }),
        ]),
      )
      expect(builderData.bundles.find((bundle) => bundle.id === "bundle.config.sources")?.optionalAtomIDs).toContain("config.merge.replace")
      expect(builderData.bundles.find((bundle) => bundle.id === "bundle.tool.schema-permission")?.optionalAtomIDs).toContain("tool.permission.always-deny")
      expect(builderData.bundles.find((bundle) => bundle.id === "bundle.opencode.turn-loop")).toMatchObject({
        exclusiveFamilyID: "family.turn-loop",
        exclusiveFamilyPolicy: "replace",
      })
      expect(builderData.bundles.find((bundle) => bundle.id === "bundle.nanobot.turn-loop")).toMatchObject({
        exclusiveFamilyID: "family.turn-loop",
        exclusiveFamilyPolicy: "replace",
      })
      expect(builderData.bundles.find((bundle) => bundle.id === "bundle.opencode.product-shells")?.exclusiveFamilyID).toBeUndefined()
      expect(builderData.presets.find((preset) => preset.id === "opencode")?.bundles).toContain("bundle.opencode.session")
      expect(builderData.presets.find((preset) => preset.id === "opencode")?.recipe.bundles).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: "bundle.opencode.session" })]),
      )
      const productSupportAliases = {
        opencode: ["opencode.resource.discovery", "opencode.prompt.resource-loader", "opencode.prompt.tool-renderer", "opencode.prompt.model-adapter", "opencode.prompt.compaction-adapter"],
        "pi-mono": ["pi.resource.discovery", "pi.prompt.resource-loader", "pi.prompt.tool-renderer", "pi.prompt.model-adapter", "pi.prompt.compaction-adapter"],
        nanobot: ["nanobot.resource.discovery", "nanobot.prompt.resource-loader", "nanobot.prompt.tool-renderer", "nanobot.prompt.model-adapter", "nanobot.prompt.compaction-adapter"],
        "hermes-agent": ["hermes.resource.discovery", "hermes.prompt.resource-loader", "hermes.prompt.tool-renderer", "hermes.prompt.model-adapter", "hermes.prompt.compaction-adapter"],
      }
      const promptSupportBindingsFor = (presetID: string) => [
        expect.objectContaining({
          portID: "resource.discovery",
          providerAtomID: presetID === "opencode" ? "opencode.resource.discovery.instruction" : presetID === "pi-mono" ? "pi.resource.discovery.project-context" : "resource.discovery.filesystem",
        }),
        expect.objectContaining({
          portID: "prompt.resource-loader",
          providerAtomID: presetID === "opencode" ? "opencode.prompt.resource-loader.instruction" : presetID === "pi-mono" ? "pi.prompt.resource-loader.project-context" : "prompt.resource-loader.text",
        }),
        expect.objectContaining({
          portID: "prompt.tool-renderer",
          providerAtomID: presetID === "opencode" ? "opencode.prompt.tool-renderer.provider-tools" : presetID === "pi-mono" ? "pi.prompt.tool-renderer.runtime-tools" : "prompt.tool-renderer.common",
        }),
        expect.objectContaining({
          portID: "prompt.model-capability-adapter",
          providerAtomID: presetID === "opencode" ? "opencode.prompt.model-capability-adapter.provider-prompt" : presetID === "pi-mono" ? "pi.prompt.model-capability-adapter.runtime-model" : "prompt.model-capability-adapter.common",
        }),
        expect.objectContaining({
          portID: "prompt.compaction-adapter",
          providerAtomID: presetID === "opencode" ? "opencode.prompt.compaction-adapter.build-prompt" : presetID === "pi-mono" ? "pi.prompt.compaction-adapter.summary-mode" : "prompt.compaction-adapter.common",
        }),
      ]
      expect(builderData.presets.filter((preset) => preset.product !== "minimal").every((preset) => preset.compileStatus === "passed" && preset.nativeParityVerified === false)).toBe(true)
      expect(builderData.presets.every((preset) => preset.compileDiagnostics.length === 0)).toBe(true)
      for (const [presetID, aliases] of Object.entries(productSupportAliases)) {
        const preset = builderData.presets.find((candidate) => candidate.id === presetID)
        for (const alias of aliases) expect(preset?.atoms, `${presetID}:${alias}`).not.toContain(alias)
        expect(preset?.bindings, presetID).toEqual(expect.arrayContaining(promptSupportBindingsFor(presetID)))
      }
      const hybridPreset = builderData.presets.find((preset) => preset.id === "hybrid-mix")
      expect(hybridPreset?.recipeID).toBe("hybrid.mix.demo")
      expect(hybridPreset).toMatchObject({
        assemblyClaim: "mixed-compatible-runnable",
        compositionClaim: "experimental-hybrid",
        parityTargetSatisfied: false,
        evidencePolicy: "compatibility-bridge-visible",
        nativeParityVerified: false,
      })
      expect(hybridPreset?.parityTargets.map((target) => target.product)).toEqual(expect.arrayContaining(["opencode", "pi-mono", "nanobot", "hermes-agent"]))
      expect(builderData.implementationStates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ level: "native", count: 389, selectedCount: 389, evidenceCount: 389, lossinessCount: 0 }),
          expect.objectContaining({ level: "native-like", count: 0, selectedCount: 0, evidenceCount: 0, lossinessCount: 0 }),
          expect.objectContaining({ level: "compatible-bridge", count: 0, selectedCount: 0, evidenceCount: 0, lossinessCount: 0 }),
          expect.objectContaining({ level: "preview-shell", count: 0, selectedCount: 0, evidenceCount: 0, lossinessCount: 0 }),
          expect.objectContaining({ level: "metadata-only", count: 92, selectedCount: 49, evidenceCount: 67, lossinessCount: 92 }),
          expect.objectContaining({ level: "common-shared", count: 171, selectedCount: 171, evidenceCount: 7, lossinessCount: 0 }),
        ]),
      )
      expect(builderData.implementationStates.find((item) => item.level === "profile-compatible")).toMatchObject({
        count: 0,
        selectedCount: 0,
        evidenceCount: 0,
        lossinessCount: 0,
        exampleAtomIDs: [],
      })
      expect(builderData.implementationStates.find((item) => item.level === "compatible-bridge")?.exampleAtomIDs).toEqual([])
      expect(hybridPreset?.atoms).toEqual(
        expect.arrayContaining([
          "product.shell.minimal-cli",
          "opencode.product-shell.web",
          "pi.product-shell.rpc",
          "pi.session.store.jsonl-v3",
          "nanobot.product-shell.cli",
          "nanobot.prompt.agent-builder",
          "hermes.product-shell.web-dashboard",
        ]),
      )
      expect(hybridPreset?.bindings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ portID: "product.shell", providerAtomID: "opencode.product-shell.sdk", moduleClaim: expect.objectContaining({ sourceProduct: "opencode", parityCompatible: "partial", parityTargetSatisfied: false, blockers: expect.arrayContaining(["experimental-hybrid-composition"]) }) }),
          expect.objectContaining({ portID: "session.store", providerAtomID: "pi.session.store.jsonl-v3", moduleClaim: expect.objectContaining({ sourceProduct: "pi-mono", parityCompatible: "partial", parityTargetSatisfied: false }) }),
          expect.objectContaining({ portID: "prompt.system-builder", providerAtomID: "nanobot.prompt.agent-builder", moduleClaim: expect.objectContaining({ sourceProduct: "nanobot", parityCompatible: "partial", parityTargetSatisfied: false }) }),
          expect.objectContaining({ portID: "tool.registry", providerAtomID: "pi.extension.dynamic-tool-bridge", moduleClaim: expect.objectContaining({ sourceProduct: "pi-mono", parityCompatible: "partial", parityTargetSatisfied: false }) }),
        ]),
      )
      for (const preset of builderData.presets) {
        const compiled = compileRecipe(preset.recipe)
        expect(compiled.id).toBe(`custom.${preset.id}`)
        expect(compiled.bindings.length).toBe(preset.bindings.length)
        expect(compiled.modules.map((module) => module.id)).toEqual(expect.arrayContaining(preset.atoms.slice(0, 6)))
      }
      expect(builderData.atoms).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "opencode.product-shell.sdk", scope: "product", selectedIn: expect.arrayContaining(["opencode"]) }),
          expect.objectContaining({ id: "nanobot.product-shell.cli", scope: "product", selectedIn: expect.arrayContaining(["nanobot"]) }),
          expect.objectContaining({ id: "hermes.product-shell.sdk", scope: "product", selectedIn: expect.arrayContaining(["hermes-agent"]) }),
          expect.objectContaining({ id: "opencode.agent-loop.request-boundary.native-like", implementationKind: "factory", implementationLevel: "native", implementationLabel: "Native" }),
          expect.objectContaining({
            id: "opencode.tui.shell",
            implementationKind: "factory",
            implementationLevel: "native",
            implementationLabel: "Native",
            implementationSummary: expect.stringContaining("product-native implementation"),
            nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-product-shell-native-exact-fixture", "product-shell-native-exact:opencode"]),
            fixtureIDs: ["opencode-product-shell:native-exact-fixture"],
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "pi.tui.shell",
            implementationKind: "factory",
            implementationLevel: "native",
            implementationLabel: "Native",
            nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-ui-native-exact-fixture", "ui-native-exact:pi-mono"]),
            fixtureIDs: ["pi-ui:native-exact-fixture"],
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "nanobot.tui.shell",
            implementationKind: "factory",
            implementationLevel: "native",
            implementationLabel: "Native",
            nativeEvidenceRefs: expect.arrayContaining(["conformance:nanobot-ui-native-exact-fixture", "ui-native-exact:nanobot"]),
            fixtureIDs: ["nanobot-ui:native-exact-fixture"],
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "hermes.tui.shell",
            implementationKind: "factory",
            implementationLevel: "native",
            implementationLabel: "Native",
            implementationSummary: expect.stringContaining("product-native implementation"),
            nativeEvidenceRefs: expect.arrayContaining(["conformance:hermes-ui-native-exact-fixture", "ui-native-exact:hermes-agent"]),
            fixtureIDs: ["hermes-ui:native-exact-fixture"],
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "opencode.product-shell.web",
            implementationKind: "factory",
            implementationLevel: "native",
            implementationLabel: "Native",
            implementationSummary: expect.stringContaining("product-native implementation"),
            nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-product-shell-native-exact-fixture", "product-shell-native-exact:opencode"]),
            fixtureIDs: ["opencode-product-shell:native-exact-fixture"],
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "pi.product-shell.web-ui",
            implementationKind: "factory",
            implementationLevel: "native",
            implementationLabel: "Native",
            implementationSummary: expect.stringContaining("product-native implementation"),
            nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-product-shell-native-exact-fixture", "product-shell-native-exact:pi-mono"]),
            fixtureIDs: ["pi-product-shell:native-exact-fixture"],
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "nanobot.product-shell.web-ui",
            implementationKind: "factory",
            implementationLevel: "native",
            implementationLabel: "Native",
            implementationSummary: expect.stringContaining("product-native implementation"),
            nativeEvidenceRefs: expect.arrayContaining(["conformance:nanobot-product-shell-native-exact-fixture", "product-shell-native-exact:nanobot"]),
            fixtureIDs: expect.arrayContaining(["nanobot-product-shell:native-exact-fixture"]),
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "hermes.product-shell.web-dashboard",
            implementationKind: "factory",
            implementationLevel: "native",
            implementationLabel: "Native",
            implementationSummary: expect.stringContaining("product-native implementation"),
            nativeEvidenceRefs: expect.arrayContaining(["conformance:hermes-product-shell-native-exact-fixture", "product-shell-native-exact:hermes-agent"]),
            fixtureIDs: expect.arrayContaining(["hermes-product-shell:native-exact-fixture", "hermes-ui:native-exact-fixture"]),
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "hermes.product-shell.tui",
            implementationKind: "factory",
            implementationLevel: "native",
            implementationLabel: "Native",
            nativeEvidenceRefs: expect.arrayContaining(["conformance:hermes-product-shell-native-exact-fixture", "product-shell-native-exact:hermes-agent"]),
            fixtureIDs: expect.arrayContaining(["hermes-product-shell:native-exact-fixture", "hermes-ui:native-exact-fixture"]),
            knownLossiness: [],
          }),
          expect.objectContaining({ id: "opencode.product-shell.sdk", implementationKind: "factory", implementationLevel: "native", implementationLabel: "Native" }),
          expect.objectContaining({
            id: "opencode.prompt.mode-builder",
            implementationKind: "factory",
            implementationLevel: "native",
            implementationLabel: "Native",
            implementationSummary: expect.stringContaining("product-native implementation"),
            fixtureIDs: expect.arrayContaining(["opencode-prompt:system-prompt-core-exact-fixture", "opencode-prompt:llm-request-system-exact-fixture"]),
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "pi.prompt.coding-agent-builder",
            implementationKind: "factory",
            implementationLevel: "native",
            implementationLabel: "Native",
            implementationSummary: expect.stringContaining("product-native implementation"),
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "nanobot.prompt.agent-builder",
            implementationKind: "factory",
            implementationLevel: "native",
            implementationLabel: "Native",
            implementationSummary: expect.stringContaining("product-native implementation"),
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "hermes.prompt.agent-builder",
            implementationKind: "factory",
            implementationLevel: "native",
            implementationLabel: "Native",
            implementationSummary: expect.stringContaining("product-native implementation"),
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "opencode.turn.context-builder",
            implementationKind: "factory",
            implementationLevel: "native",
            implementationLabel: "Native",
            implementationSummary: expect.stringContaining("product-native implementation"),
          }),
          expect.objectContaining({
            id: "pi.turn.prompt-assembler",
            implementationKind: "factory",
            implementationLevel: "native",
            implementationLabel: "Native",
            implementationSummary: expect.stringContaining("product-native implementation"),
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "nanobot.turn.stream-reducer",
            implementationKind: "factory",
            implementationLevel: "native",
            implementationLabel: "Native",
            implementationSummary: expect.stringContaining("product-native implementation"),
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "hermes.turn.tool-executor",
            implementationKind: "factory",
            implementationLevel: "native",
            implementationLabel: "Native",
            implementationSummary: expect.stringContaining("product-native implementation"),
            knownLossiness: [],
          }),
          expect.objectContaining({ id: "prompt.resource-loader.text", implementationKind: "factory", implementationLevel: "common-shared", implementationLabel: "Common shared" }),
          expect.objectContaining({ id: "opencode.runtime.module-aliases", implementationKind: "metadata-only", implementationLevel: "metadata-only", implementationLabel: "Metadata only" }),
          expect.objectContaining({ id: "turn.input-normalizer.text", implementationKind: "factory", implementationLevel: "common-shared", implementationLabel: "Common shared" }),
        ]),
      )
      const runtimeMetadataSuffixes = ["module-aliases", "capability-aliases", "binding-defaults", "lifecycle-defaults", "graph-labels"]
      for (const prefix of ["opencode", "pi", "nanobot", "hermes"]) {
        for (const suffix of runtimeMetadataSuffixes) {
          const atomID = `${prefix}.runtime.${suffix}`
          const atom = builderData.atoms.find((candidate) => candidate.id === atomID)
          expect(atom, atomID).toMatchObject({
            implementationKind: "metadata-only",
            implementationLevel: "metadata-only",
            implementationLabel: "Metadata only",
            implementationSummary: expect.stringContaining("do not count as an executable native implementation"),
          })
        }
      }
      const productTurnKeys = [
        "input-normalizer",
        "context-builder",
        "prompt-assembler",
        "provider-request-builder",
        "provider-stream-runner",
        "stream-reducer",
        "tool-call-planner",
        "tool-executor",
        "result-recorder",
        "retry-policy",
        "continuation-policy",
        "compaction-policy",
        "stop-condition",
      ]
      const productTurnPrefixes = ["opencode", "pi", "nanobot", "hermes"]
      for (const prefix of productTurnPrefixes) {
        for (const key of productTurnKeys) {
          const atomID = `${prefix}.turn.${key}`
          const atom = builderData.atoms.find((candidate) => candidate.id === atomID)
          expect(atom, atomID).toMatchObject({
            implementationKind: "factory",
            implementationLevel: "native",
            implementationLabel: "Native",
            parityCoverage: "native",
            knownLossiness: [],
          })
        }
      }
      const nativeExactAtoms = [
        {
          atomID: "opencode.agent-loop.request-boundary.native-like",
          conformance: "conformance:opencode-agent-loop-request-boundary-native-exact-fixture",
          evidence: "agent-loop-request-boundary-native-exact:opencode",
          fixtureID: "opencode-agent-loop-request-boundary:native-exact-fixture",
        },
        {
          atomID: "opencode.agent-loop.final-summary.native-like",
          conformance: "conformance:opencode-agent-loop-final-summary-native-exact-fixture",
          evidence: "agent-loop-final-summary-native-exact:opencode",
          fixtureID: "opencode-agent-loop-final-summary:native-exact-fixture",
        },
        {
          atomID: "opencode.tools.batch-scheduler.native-like",
          conformance: "conformance:opencode-tool-native-exact-fixture",
          evidence: "tool-native-exact:opencode",
          fixtureID: "opencode-tool:native-exact-fixture",
        },
        {
          atomID: "opencode.tools.result-projector.native-like",
          conformance: "conformance:opencode-tool-native-exact-fixture",
          evidence: "tool-native-exact:opencode",
          fixtureID: "opencode-tool:native-exact-fixture",
        },
        {
          atomID: "pi.agent-loop.request-boundary.native-like",
          conformance: "conformance:pi-agent-loop-request-boundary-native-exact-fixture",
          evidence: "agent-loop-request-boundary-native-exact:pi-mono",
          fixtureID: "pi-agent-loop-request-boundary:native-exact-fixture",
        },
        {
          atomID: "pi.agent-loop.final-summary.native-like",
          conformance: "conformance:pi-agent-loop-final-summary-native-exact-fixture",
          evidence: "agent-loop-final-summary-native-exact:pi-mono",
          fixtureID: "pi-agent-loop-final-summary:native-exact-fixture",
        },
        {
          atomID: "pi.tools.batch-scheduler.native-like",
          conformance: "conformance:pi-tool-batch-scheduler-native-exact-fixture",
          evidence: "tool-batch-scheduler-native-exact:pi-mono",
          fixtureID: "pi-tool-batch-scheduler:native-exact-fixture",
        },
        {
          atomID: "pi.tools.schema.native-like",
          conformance: "conformance:pi-tool-schema-native-exact-fixture",
          evidence: "tool-schema-native-exact:pi-mono",
          fixtureID: "pi-tool-schema:native-exact-fixture",
        },
        {
          atomID: "pi.tools.result-projector.native-like",
          conformance: "conformance:pi-tool-result-projector-native-exact-fixture",
          evidence: "tool-result-projector-native-exact:pi-mono",
          fixtureID: "pi-tool-result-projector:native-exact-fixture",
        },
        {
          atomID: "nanobot.agent-loop.request-boundary.native-like",
          conformance: "conformance:nanobot-agent-loop-request-boundary-native-exact-fixture",
          evidence: "agent-loop-request-boundary-native-exact:nanobot",
          fixtureID: "nanobot-agent-loop-request-boundary:native-exact-fixture",
        },
        {
          atomID: "nanobot.agent-loop.final-summary.native-like",
          conformance: "conformance:nanobot-agent-loop-final-summary-native-exact-fixture",
          evidence: "agent-loop-final-summary-native-exact:nanobot",
          fixtureID: "nanobot-agent-loop-final-summary:native-exact-fixture",
        },
        {
          atomID: "nanobot.tools.batch-scheduler.native-like",
          conformance: "conformance:nanobot-tool-batch-scheduler-native-exact-fixture",
          evidence: "tool-batch-scheduler-native-exact:nanobot",
          fixtureID: "nanobot-tool-batch-scheduler:native-exact-fixture",
        },
        {
          atomID: "nanobot.tools.result-projector.native-like",
          conformance: "conformance:nanobot-tool-native-exact-fixture",
          evidence: "tool-native-exact:nanobot",
          fixtureID: "nanobot-tool:native-exact-fixture",
        },
        {
          atomID: "nanobot.tools.schema.native-like",
          conformance: "conformance:nanobot-tool-native-exact-fixture",
          evidence: "tool-native-exact:nanobot",
          fixtureID: "nanobot-tool:native-exact-fixture",
        },
        {
          atomID: "hermes.agent-loop.request-boundary.native-like",
          conformance: "conformance:hermes-agent-loop-request-boundary-native-exact-fixture",
          evidence: "agent-loop-request-boundary-native-exact:hermes-agent",
          fixtureID: "hermes-agent-loop-request-boundary:native-exact-fixture",
        },
        {
          atomID: "hermes.agent-loop.final-summary.native-like",
          conformance: "conformance:hermes-agent-loop-final-summary-native-exact-fixture",
          evidence: "agent-loop-final-summary-native-exact:hermes-agent",
          fixtureID: "hermes-agent-loop-final-summary:native-exact-fixture",
        },
        {
          atomID: "hermes.tools.batch-scheduler.native-like",
          conformance: "conformance:hermes-tool-batch-scheduler-native-exact-fixture",
          evidence: "tool-batch-scheduler-native-exact:hermes-agent",
          fixtureID: "hermes-tool-batch-scheduler:native-exact-fixture",
        },
        {
          atomID: "hermes.tools.result-projector.native-like",
          conformance: "conformance:hermes-tool-native-exact-fixture",
          evidence: "tool-native-exact:hermes-agent",
          fixtureID: "hermes-tool:native-exact-fixture",
        },
        {
          atomID: "hermes.tools.schema.native-like",
          conformance: "conformance:hermes-tool-native-exact-fixture",
          evidence: "tool-native-exact:hermes-agent",
          fixtureID: "hermes-tool:native-exact-fixture",
        },
        {
          atomID: "pi.provider.streaming-delta-recorder.native-like",
          conformance: "conformance:pi-provider-descriptor-native-exact-fixture",
          evidence: "provider-descriptor-native-exact:pi-mono",
          fixtureID: "pi-provider-descriptor:native-exact-fixture",
        },
        {
          atomID: "pi.provider.stream-projector.native-like",
          conformance: "conformance:pi-provider-descriptor-native-exact-fixture",
          evidence: "provider-descriptor-native-exact:pi-mono",
          fixtureID: "pi-provider-descriptor:native-exact-fixture",
        },
        {
          atomID: "pi.session.message-part-projector.native-like",
          conformance: "conformance:pi-session-message-part-projector-native-exact-fixture",
          evidence: "session-message-part-projector-native-exact:pi-mono",
          fixtureID: "pi-session-message-part-projector:native-exact-fixture",
        },
        {
          atomID: "opencode.session.message-part-projector.native-like",
          conformance: "conformance:opencode-session-native-exact-fixture",
          evidence: "session-native-exact:opencode",
          fixtureID: "opencode-session:native-exact-fixture",
        },
        {
          atomID: "nanobot.session.message-part-projector.native-like",
          conformance: "conformance:nanobot-session-native-exact-fixture",
          evidence: "session-native-exact:nanobot",
          fixtureID: "nanobot-session:native-exact-fixture",
        },
        {
          atomID: "hermes.session.message-part-projector.native-like",
          conformance: "conformance:hermes-session-acp-native-exact-fixture",
          evidence: "session-acp-native-exact:hermes-agent",
          fixtureID: "hermes-session-acp:native-exact-fixture",
        },
        {
          atomID: "opencode.runtime.acceptance-controller.native-like",
          conformance: "conformance:opencode-runtime-acceptance-native-exact-fixture",
          evidence: "runtime-acceptance-native-exact:opencode",
          fixtureID: "opencode-runtime-acceptance:native-exact-fixture",
        },
        {
          atomID: "opencode.runtime.acceptance-evidence.native-like",
          conformance: "conformance:opencode-runtime-acceptance-native-exact-fixture",
          evidence: "runtime-acceptance-native-exact:opencode",
          fixtureID: "opencode-runtime-acceptance:native-exact-fixture",
        },
        {
          atomID: "pi.runtime.acceptance-controller.native-like",
          conformance: "conformance:pi-runtime-acceptance-native-exact-fixture",
          evidence: "runtime-acceptance-native-exact:pi-mono",
          fixtureID: "pi-runtime-acceptance:native-exact-fixture",
        },
        {
          atomID: "pi.runtime.acceptance-evidence.native-like",
          conformance: "conformance:pi-runtime-acceptance-native-exact-fixture",
          evidence: "runtime-acceptance-native-exact:pi-mono",
          fixtureID: "pi-runtime-acceptance:native-exact-fixture",
        },
      ]
      for (const { atomID, conformance, evidence, fixtureID } of nativeExactAtoms) {
        const atom = builderData.atoms.find((candidate) => candidate.id === atomID)
        const upstreamRef = atomID.startsWith("opencode.")
          ? "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
          : atomID.startsWith("pi.")
            ? "upstream:https://github.com/earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
            : atomID.startsWith("nanobot.")
              ? "upstream:https://github.com/HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
              : "upstream:https://github.com/NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf"
        expect(atom, atomID).toMatchObject({
          implementationKind: "factory",
          implementationLevel: "native",
          implementationLabel: "Native",
          parityCoverage: "native",
          nativeEvidenceRefs: expect.arrayContaining([conformance, evidence, upstreamRef]),
          fixtureIDs: expect.arrayContaining([fixtureID]),
          knownLossiness: [],
        })
      }
      const opencodeNativeToolSchemaAtom = builderData.atoms.find((candidate) => candidate.id === "opencode.tools.schema.native-like")
      expect(opencodeNativeToolSchemaAtom).toMatchObject({
        implementationKind: "factory",
        implementationLevel: "native",
        implementationLabel: "Native",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          "conformance:opencode-tool-schema-native-exact-fixture",
          "tool-schema-native-exact:opencode",
          "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
        ]),
        fixtureIDs: ["opencode-tool-schema:native-exact-fixture"],
        knownLossiness: [],
      })
      const providerNativeAtoms = [
        {
          atomID: "nanobot.provider.streaming-delta-recorder.native-like",
          conformance: "conformance:nanobot-provider-native-exact-fixture",
          evidence: "provider-native-exact:nanobot",
          fixtureID: "nanobot-provider:native-exact-fixture",
        },
        {
          atomID: "nanobot.provider.stream-projector.native-like",
          conformance: "conformance:nanobot-provider-native-exact-fixture",
          evidence: "provider-native-exact:nanobot",
          fixtureID: "nanobot-provider:native-exact-fixture",
        },
        {
          atomID: "hermes.provider.streaming-delta-recorder.native-like",
          conformance: "conformance:hermes-provider-native-exact-fixture",
          evidence: "provider-native-exact:hermes-agent",
          fixtureID: "hermes-provider:native-exact-fixture",
        },
        {
          atomID: "hermes.provider.stream-projector.native-like",
          conformance: "conformance:hermes-provider-native-exact-fixture",
          evidence: "provider-native-exact:hermes-agent",
          fixtureID: "hermes-provider:native-exact-fixture",
        },
        {
          atomID: "opencode.provider.streaming-delta-recorder.native-like",
          conformance: "conformance:opencode-provider-stream-projector-native-exact-fixture",
          evidence: "provider-stream-projector-native-exact:opencode",
          fixtureID: "opencode-provider-stream-projector:native-exact-fixture",
        },
        {
          atomID: "opencode.provider.stream-projector.native-like",
          conformance: "conformance:opencode-provider-stream-projector-native-exact-fixture",
          evidence: "provider-stream-projector-native-exact:opencode",
          fixtureID: "opencode-provider-stream-projector:native-exact-fixture",
        },
        {
          atomID: "opencode.provider.event-observer",
          conformance: "conformance:opencode-provider-event-observer-native-exact-fixture",
          evidence: "provider-event-observer-native-exact:opencode",
          fixtureID: "opencode-provider-event-observer:native-exact-fixture",
        },
        {
          atomID: "opencode.provider.parser-observer",
          conformance: "conformance:opencode-provider-parser-observer-native-exact-fixture",
          evidence: "provider-parser-observer-native-exact:opencode",
          fixtureID: "opencode-provider-parser-observer:native-exact-fixture",
        },
        {
          atomID: "opencode.provider.transport-instrumentation",
          conformance: "conformance:opencode-provider-transport-instrumentation-native-exact-fixture",
          evidence: "provider-transport-instrumentation-native-exact:opencode",
          fixtureID: "opencode-provider-transport-instrumentation:native-exact-fixture",
        },
      ]
      for (const { atomID, conformance, evidence, fixtureID } of providerNativeAtoms) {
        const atom = builderData.atoms.find((candidate) => candidate.id === atomID)
        expect(atom, atomID).toMatchObject({
          implementationKind: "factory",
          implementationLevel: "native",
          implementationLabel: "Native",
          parityCoverage: "native",
          nativeEvidenceRefs: expect.arrayContaining([conformance, evidence]),
          fixtureIDs: expect.arrayContaining([fixtureID]),
          knownLossiness: [],
        })
      }
      expect(builderData.atoms.find((candidate) => candidate.id === "opencode.provider.usage-renderer")).toMatchObject({
        implementationKind: "factory",
        implementationLevel: "native",
        implementationLabel: "Native",
        nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-provider-usage-native-exact-fixture", "provider-usage-native-exact:opencode"]),
        fixtureIDs: expect.arrayContaining(["opencode-provider-usage:native-exact-fixture"]),
        knownLossiness: [],
      })
      expect(builderData.atoms.find((candidate) => candidate.id === "opencode.provider.auth-descriptor")).toMatchObject({
        implementationKind: "factory",
        implementationLevel: "native",
        implementationLabel: "Native",
        nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-provider-auth-descriptor-native-exact-fixture", "provider-auth-descriptor-native-exact:opencode"]),
        fixtureIDs: expect.arrayContaining(["opencode-provider-auth-descriptor:native-exact-fixture"]),
        knownLossiness: [],
      })
      expect(builderData.atoms.find((candidate) => candidate.id === "opencode.provider.plugin-descriptor")).toMatchObject({
        implementationKind: "factory",
        implementationLevel: "native",
        implementationLabel: "Native",
        nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-provider-plugin-descriptor-native-exact-fixture", "provider-plugin-descriptor-native-exact:opencode"]),
        fixtureIDs: expect.arrayContaining(["opencode-provider-plugin-descriptor:native-exact-fixture"]),
        knownLossiness: [],
      })
      expect(builderData.atoms.find((candidate) => candidate.id === "opencode.provider.model-plugin")).toMatchObject({
        implementationKind: "factory",
        implementationLevel: "native",
        implementationLabel: "Native",
        nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-provider-model-plugin-native-exact-fixture", "provider-model-plugin-native-exact:opencode"]),
        fixtureIDs: expect.arrayContaining(["opencode-provider-model-plugin:native-exact-fixture"]),
        knownLossiness: [],
      })
      expect(builderData.atoms.find((candidate) => candidate.id === "opencode.provider.request-options")).toMatchObject({
        implementationKind: "factory",
        implementationLevel: "native",
        implementationLabel: "Native",
        nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-provider-request-options-native-exact-fixture", "provider-request-options-native-exact:opencode"]),
        fixtureIDs: expect.arrayContaining(["opencode-provider-request-options:native-exact-fixture"]),
        knownLossiness: [],
      })
      expect(builderData.atoms.find((candidate) => candidate.id === "opencode.trace.debug-surface")).toMatchObject({
        implementationKind: "factory",
        implementationLevel: "native",
        implementationLabel: "Native",
        nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-trace-debug-surface-native-exact-fixture", "trace-debug-surface-native-exact:opencode"]),
        fixtureIDs: expect.arrayContaining(["opencode-trace-debug-surface:native-exact-fixture"]),
        knownLossiness: [],
      })
      expect(builderData.atoms.find((candidate) => candidate.id === "opencode.tool.status-bridge")).toMatchObject({
        implementationKind: "factory",
        implementationLevel: "native",
        implementationLabel: "Native",
        nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-tool-native-exact-fixture", "tool-native-exact:opencode"]),
        fixtureIDs: expect.arrayContaining(["opencode-tool:native-exact-fixture"]),
        knownLossiness: [],
      })
      const piProviderNativeAtoms = [
        "pi.provider.auth-descriptor",
        "pi.provider.event-observer",
        "pi.provider.extension-descriptor",
        "pi.provider.model-extension",
        "pi.provider.parser-observer",
        "pi.provider.request-options",
        "pi.provider.transport-instrumentation",
        "pi.provider.usage-renderer",
      ]
      for (const atomID of piProviderNativeAtoms) {
        const atom = builderData.atoms.find((candidate) => candidate.id === atomID)
        expect(atom, atomID).toMatchObject({
          implementationKind: "factory",
          implementationLevel: "native",
          implementationLabel: "Native",
          implementationSummary: expect.stringContaining("product-native implementation"),
          parityCoverage: "native",
          nativeEvidenceRefs: expect.arrayContaining([
            "conformance:pi-provider-descriptor-native-exact-fixture",
            "provider-descriptor-native-exact:pi-mono",
            "upstream:https://github.com/earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
          ]),
          fixtureIDs: expect.arrayContaining(["pi-provider-descriptor:native-exact-fixture"]),
          knownLossiness: [],
        })
      }
      const nanobotProviderNativeAtoms = [
        "nanobot.provider.auth-descriptor",
        "nanobot.provider.event-observer",
        "nanobot.provider.model-registry",
        "nanobot.provider.parser-observer",
        "nanobot.provider.plugin-descriptor",
        "nanobot.provider.request-options",
        "nanobot.provider.transport-instrumentation",
        "nanobot.provider.usage-renderer",
      ]
      for (const atomID of nanobotProviderNativeAtoms) {
        const atom = builderData.atoms.find((candidate) => candidate.id === atomID)
        expect(atom, atomID).toMatchObject({
          implementationKind: "factory",
          implementationLevel: "native",
          implementationLabel: "Native",
          implementationSummary: expect.stringContaining("product-native implementation"),
          parityCoverage: "native",
          nativeEvidenceRefs: expect.arrayContaining([
            "conformance:nanobot-provider-native-exact-fixture",
            "provider-native-exact:nanobot",
            "upstream:https://github.com/HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
          ]),
          fixtureIDs: expect.arrayContaining(["nanobot-provider:native-exact-fixture"]),
          knownLossiness: [],
        })
      }
      const hermesProviderNativeAtoms = [
        "hermes.provider.auth-descriptor",
        "hermes.provider.event-observer",
        "hermes.provider.model-registry",
        "hermes.provider.parser-observer",
        "hermes.provider.plugin-descriptor",
        "hermes.provider.request-options",
        "hermes.provider.transport-instrumentation",
        "hermes.provider.usage-renderer",
      ]
      for (const atomID of hermesProviderNativeAtoms) {
        const atom = builderData.atoms.find((candidate) => candidate.id === atomID)
        expect(atom, atomID).toMatchObject({
          implementationKind: "factory",
          implementationLevel: "native",
          implementationLabel: "Native",
          implementationSummary: expect.stringContaining("product-native implementation"),
          parityCoverage: "native",
          nativeEvidenceRefs: expect.arrayContaining([
            "conformance:hermes-provider-native-exact-fixture",
            "provider-native-exact:hermes-agent",
            "upstream:https://github.com/NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
          ]),
          fixtureIDs: expect.arrayContaining(["hermes-provider:native-exact-fixture"]),
          knownLossiness: [],
        })
      }
      const nativeRuntimeAcceptanceAtoms = [
        {
          atomID: "nanobot.runtime.acceptance-controller.native-like",
          evidenceRef: "conformance:nanobot-runtime-acceptance-native-exact-fixture",
          replayRef: "runtime-acceptance-native-exact:nanobot",
          fixtureID: "nanobot-runtime-acceptance:native-exact-fixture",
          upstreamRef: "upstream:https://github.com/HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        },
        {
          atomID: "hermes.runtime.acceptance-controller.native-like",
          evidenceRef: "conformance:hermes-runtime-acceptance-native-exact-fixture",
          replayRef: "runtime-acceptance-native-exact:hermes-agent",
          fixtureID: "hermes-runtime-acceptance:native-exact-fixture",
          upstreamRef: "upstream:https://github.com/NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
        },
        {
          atomID: "nanobot.runtime.acceptance-evidence.native-like",
          evidenceRef: "conformance:nanobot-runtime-acceptance-native-exact-fixture",
          replayRef: "runtime-acceptance-native-exact:nanobot",
          fixtureID: "nanobot-runtime-acceptance:native-exact-fixture",
          upstreamRef: "upstream:https://github.com/HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
        },
        {
          atomID: "hermes.runtime.acceptance-evidence.native-like",
          evidenceRef: "conformance:hermes-runtime-acceptance-native-exact-fixture",
          replayRef: "runtime-acceptance-native-exact:hermes-agent",
          fixtureID: "hermes-runtime-acceptance:native-exact-fixture",
          upstreamRef: "upstream:https://github.com/NousResearch/hermes-agent@92a567db2d7a5031df8211efbfdad864c2f51faf",
        },
      ]
      for (const { atomID, evidenceRef, replayRef, fixtureID, upstreamRef } of nativeRuntimeAcceptanceAtoms) {
        const atom = builderData.atoms.find((candidate) => candidate.id === atomID)
        expect(atom, atomID).toMatchObject({
          implementationKind: "factory",
          implementationLevel: "native",
          implementationLabel: "Native",
          implementationSummary: expect.stringContaining("product-native implementation"),
          parityCoverage: "native",
          nativeEvidenceRefs: expect.arrayContaining([evidenceRef, replayRef, upstreamRef]),
          fixtureIDs: [fixtureID],
          knownLossiness: [],
        })
      }
      expect(
        builderData.atoms.every((atom) => atom.implementationKind && atom.implementationLevel && atom.implementationLabel && atom.implementationSummary),
      ).toBe(true)
      expect(
        builderData.atoms.every((atom) =>
          Array.isArray(atom.nativeEvidenceRefs) &&
          Array.isArray(atom.fixtureIDs) &&
          Boolean(atom.parityCoverage) &&
          Array.isArray(atom.knownLossiness),
        ),
      ).toBe(true)
      const opencodePromptAtom = builderData.atoms.find((atom) => atom.id === "opencode.prompt.mode-builder")
      const piPromptAtom = builderData.atoms.find((atom) => atom.id === "pi.prompt.coding-agent-builder")
      const nanobotPromptAtom = builderData.atoms.find((atom) => atom.id === "nanobot.prompt.agent-builder")
      const hermesPromptAtom = builderData.atoms.find((atom) => atom.id === "hermes.prompt.agent-builder")
      expect(opencodePromptAtom).toMatchObject({
        implementationKind: "factory",
        implementationLevel: "native",
        implementationSummary: expect.stringContaining("product-native implementation"),
        parityCoverage: "native",
        fixtureIDs: expect.arrayContaining(["opencode-prompt:system-prompt-core-exact-fixture", "opencode-prompt:llm-request-system-exact-fixture"]),
        knownLossiness: [],
      })
      expect(piPromptAtom).toMatchObject({
        implementationKind: "factory",
        implementationLevel: "native",
        implementationSummary: expect.stringContaining("product-native implementation"),
        parityCoverage: "native",
        fixtureIDs: expect.arrayContaining(["pi-prompt:native-exact-fixture"]),
        knownLossiness: [],
      })
      expect(nanobotPromptAtom).toMatchObject({
        implementationKind: "factory",
        implementationLevel: "native",
        implementationSummary: expect.stringContaining("product-native implementation"),
        parityCoverage: "native",
        fixtureIDs: expect.arrayContaining(["nanobot-prompt:native-exact-fixture"]),
        knownLossiness: [],
      })
      expect(hermesPromptAtom).toMatchObject({
        implementationKind: "factory",
        implementationLevel: "native",
        implementationSummary: expect.stringContaining("product-native implementation"),
        parityCoverage: "native",
        fixtureIDs: expect.arrayContaining(["hermes-prompt:native-exact-fixture"]),
        knownLossiness: [],
      })
      for (const promptAtom of [opencodePromptAtom, piPromptAtom, nanobotPromptAtom, hermesPromptAtom]) {
        expect(promptAtom?.implementationSummary).not.toContain("Product identity prompt snapshot is synced")
      }
      const nanobotBootstrapEvidenceRefs = nanobotBuiltinBootstrapAssets().map((asset) => `pinned-asset:nanobot-bootstrap/${asset.name}@sha256:${asset.sha256}`)
      const nanobotBootstrapFixtureIDs = nanobotBuiltinBootstrapAssets().map((asset) => `nanobot-bootstrap:${asset.name}`)
      expect(builderData.atoms).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "opencode.prompt.mode-builder",
            parityCoverage: "native",
            nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-system-prompt-core-exact-fixture", "conformance:opencode-llm-request-system-exact-fixture"]),
            fixtureIDs: expect.arrayContaining(["opencode-prompt:system-prompt-core-exact-fixture", "opencode-prompt:llm-request-system-exact-fixture"]),
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "pi.prompt.coding-agent-builder",
            parityCoverage: "native",
            nativeEvidenceRefs: expect.arrayContaining([
              "conformance:pi-prompt-family-matrix",
              "conformance:pi-prompt-native-exact-fixture",
              "conformance:pi-prompt-upstream-source-matrix",
              "prompt-native-exact:pi-mono",
              "upstream:https://github.com/earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
            ]),
            fixtureIDs: expect.arrayContaining(["pi-prompt:family-matrix", "pi-prompt:native-exact-fixture", "pi-prompt:upstream-source-matrix"]),
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "opencode.turn.context-builder",
            parityCoverage: "native",
            upstreamCommit: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
            nativeEvidenceRefs: expect.arrayContaining([
              "conformance:opencode-turn-context-builder-native-exact-fixture",
              "turn-context-builder-native-exact:opencode",
              "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
            ]),
            fixtureIDs: expect.arrayContaining(["opencode-turn-context-builder:native-exact-fixture"]),
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "opencode.tui.shell",
            parityCoverage: "native",
            nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-product-shell-native-exact-fixture", "product-shell-native-exact:opencode"]),
            fixtureIDs: ["opencode-product-shell:native-exact-fixture"],
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "opencode.runtime.module-aliases",
            parityCoverage: "metadata",
            knownLossiness: expect.arrayContaining(["not-executable-provider"]),
          }),
          expect.objectContaining({
            id: "opencode.tools.schema.native-like",
            parityCoverage: "native",
            nativeEvidenceRefs: expect.arrayContaining([
              "conformance:opencode-tool-schema-native-exact-fixture",
              "tool-schema-native-exact:opencode",
              "upstream:https://github.com/anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
            ]),
            fixtureIDs: ["opencode-tool-schema:native-exact-fixture"],
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "nanobot.prompt.agent-builder",
            parityCoverage: "native",
            nativeEvidenceRefs: expect.arrayContaining([
              "conformance:nanobot-prompt-native-exact-fixture",
              "conformance:nanobot-prompt-upstream-source-matrix",
              "conformance:nanobot-channel-lifecycle-timing",
              "conformance:nanobot-channel-side-effect-replay",
              "conformance:nanobot-channel-registry-source-matrix",
              "conformance:nanobot-platform-prompt-matrix",
              "conformance:nanobot-platform-router-rendering",
              "conformance:nanobot-workspace-template-sync",
              "package:nanobot-ai@0.2.0",
              "upstream:https://github.com/HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
              ...nanobotBootstrapEvidenceRefs,
            ]),
            fixtureIDs: expect.arrayContaining(["nanobot-prompt:native-exact-fixture", "nanobot-prompt:upstream-source-matrix", "nanobot-prompt:channel-lifecycle-timing", "nanobot-prompt:channel-side-effect-replay", "nanobot-prompt:channel-registry-source-matrix", "nanobot-prompt:platform-matrix", "nanobot-prompt:platform-router-rendering", "nanobot-workspace-sync:templates", ...nanobotBootstrapFixtureIDs]),
            knownLossiness: [],
          }),
          expect.objectContaining({
            id: "hermes.prompt.agent-builder",
            parityCoverage: "native",
            nativeEvidenceRefs: expect.arrayContaining([
              "conformance:hermes-prompt-factory-options",
              "conformance:hermes-prompt-native-exact-fixture",
              "conformance:hermes-prompt-scanner",
              "conformance:hermes-prompt-registry-snapshot",
              "conformance:hermes-prompt-upstream-registry-source-matrix",
              "conformance:hermes-skills-index-cache",
            ]),
            fixtureIDs: expect.arrayContaining(["hermes-prompt:factory-options", "hermes-prompt:native-exact-fixture", "hermes-prompt:prompt-scanner", "hermes-prompt:registry-snapshot", "hermes-prompt:upstream-registry-source-matrix", "hermes-skills:index-cache"]),
            knownLossiness: [],
          }),
        ]),
      )
      expect(builderHTML).toContain("data-builder-native-evidence")
      expect(builderHTML).toContain("data-builder-known-lossiness")
      expect(builderData.ports).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "provider.transport",
            multiplicity: "single",
            selectedByProduct: expect.objectContaining({ opencode: "opencode.provider.transport-instrumentation" }),
          }),
          expect.objectContaining({
            id: "provider.model-registry",
            selectedByProduct: expect.objectContaining({ opencode: "opencode.provider.model-plugin" }),
          }),
          expect.objectContaining({
            id: "provider.request-shape",
            selectedByProduct: expect.objectContaining({ opencode: "opencode.provider.request-options" }),
          }),
          expect.objectContaining({
            id: "provider.event-normalizer",
            selectedByProduct: expect.objectContaining({ opencode: "opencode.provider.event-observer" }),
          }),
        ]),
      )
      expect(builderData.commandTemplates).toEqual(
        expect.arrayContaining([
          "npm run helix -- assemble --recipe-file <file> --explain --json",
          "npm run helix -- graph recipe-file <file> --json",
        ]),
      )
      expect(opencodeWebHTML).toContain('data-opencode-web="ready"')
      expect(opencodeWebHTML).toContain("opencode.product-shell.slack")
      expect(JSON.parse(readFileSync(opencodeDesktopManifestPath, "utf8"))).toMatchObject({ appID: "dev.opencode.helix" })
      expect(opencodeDesktopShellHTML).toContain('data-opencode-desktop-shell="ready"')
      expect(smokeHTML).toContain('data-pi-browser-smoke="ready"')
      expect(smokeHTML).toContain("pi.product-shell.release-hardening")
      expect(nanobotWebHTML).toContain('data-nanobot-web-ui="ready"')
      expect(nanobotWebHTML).toContain("nanobot.product-shell.cli")
      expect(hermesDashboardHTML).toContain('data-hermes-dashboard="ready"')
      expect(hermesDashboardHTML).toContain("hermes.product-shell.sdk")
    } finally {
      rmSync(outDir, { recursive: true, force: true })
    }
  }, 15_000)

  it("surfaces external tool install hints, imported artifacts, verifier status, and local-only state", () => {
    const runDir = join(process.cwd(), ".helix/external-tools/runs/docs-site-conformance")
    const normalizedDir = join(runDir, "normalized")
    mkdirSync(normalizedDir, { recursive: true })
    try {
      writeFileSync(
        join(normalizedDir, "native-capture.json"),
        `${JSON.stringify(
          {
            schemaVersion: 1,
            artifactKind: "external-tool-native-capture",
            generatedAt: "2026-06-14T00:00:00.000Z",
            sourceTool: "claude-tap",
            sourceToolVersion: "0.1.114",
            sourceArtifact: { format: "jsonl", hash: `sha256:${"0".repeat(64)}`, bytes: 42 },
            product: "pi-mono",
            taskID: "read-only-answer",
            captureMode: "import-only",
            lossiness: {
              observability: "external-proxy-capture",
              rawPrompt: "fingerprint-only",
              rawProviderPayload: "shape-summary-only",
              rawToolPayload: "fingerprint-only",
              nativeInternals: "unobservable",
            },
            providerRequests: [
              {
                requestID: "docs-site-conformance",
                turn: 1,
                method: "POST",
                path: "/v1/responses",
                protocol: "openai-responses",
                modelID: "gpt-test",
                status: 200,
                durationMs: 10,
                requestShape: { type: "object", fingerprint: `sha256:${"1".repeat(64)}`, keys: ["model"] },
                responseShape: { type: "object", fingerprint: `sha256:${"2".repeat(64)}`, keys: ["status"] },
              },
            ],
            promptEvidence: [],
            toolEvidence: [],
            streamEvidence: [],
            usageEvidence: [],
            stageEvidence: [
              { stage: "provider", observability: "external-proxy-capture", evidenceCount: 1, summary: "provider request observed", fingerprints: [`sha256:${"1".repeat(64)}`] },
            ],
            redactionPolicy: { version: 1, containsRawPrompt: false, credentials: "redacted", hostPaths: "normalized" },
            summary: { records: 1, providerRequests: 1, promptEvidence: 0, toolEvidence: 0, streamEvents: 0, models: ["gpt-test"], protocols: ["openai-responses"], statusCodes: [200] },
          },
          null,
          2,
        )}\n`,
      )

      const data = buildDocsSite({ cwd: process.cwd(), generatedAt: "2026-06-14T00:00:00.000Z" })
      const tool = data.externalTools.tools.find((item) => item.id === "claude-tap")
      expect(tool).toMatchObject({
        installStatus: "not-checked",
        installHints: expect.arrayContaining(["uv tool install claude-tap"]),
        unsupportedGaps: [
          expect.objectContaining({
            product: "nanobot",
            status: "needs-upstream-support",
            nextAction: expect.stringContaining("Helix-owned Nanobot capture path"),
          }),
        ],
        lastImportedArtifact: expect.objectContaining({
          artifactPath: ".helix/external-tools/runs/docs-site-conformance/normalized/native-capture.json",
          product: "pi-mono",
          taskID: "read-only-answer",
          storage: "local-only",
          localOnly: true,
        }),
        lastVerifierResult: expect.objectContaining({
          ok: true,
          localOnly: true,
          status: "local-only",
        }),
      })
      const html = renderDocsSite(data)
      expect(html).toContain('data-external-tool-install-status="not-checked"')
      expect(html).toContain('data-external-tool-last-artifact=".helix/external-tools/runs/docs-site-conformance/normalized/native-capture.json"')
      expect(html).toContain('data-external-tool-last-verifier-ok="true"')
      expect(html).toContain('data-external-tool-local-only="true"')
      expect(html).toContain('data-external-tool-unsupported-gap="nanobot:needs-upstream-support"')
      expect(html).toContain('data-external-tool-unsupported-gap-chip="claude-tap"')
      expect(html).toContain("uv tool install claude-tap")
    } finally {
      rmSync(runDir, { recursive: true, force: true })
    }
  }, 15_000)

  it("serves the online builder API and in-memory recipe drafts", async () => {
    const profileRoot = mkdtempSync(join(tmpdir(), "helix-docs-profile-"))
    const docsEnv = {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      USER: process.env.USER,
      DOCS_PROVIDER_KEY: "docs-provider-secret",
      DOCS_TELEGRAM_TOKEN: "docs-telegram-secret",
      HELIX_DISABLE_LIVE_PROVIDER: "1",
    } as NodeJS.ProcessEnv
    const running = await startDocsServer({
      cwd: process.cwd(),
      port: 0,
      env: docsEnv,
      profileStore: new HarnessProfileStore({ rootDir: profileRoot, cwd: process.cwd(), env: docsEnv }),
    })
    try {
      const health = (await fetchJSON(`${running.url}/api/health`)) as { ok?: boolean; mode?: string; storage?: string }
      expect(health).toMatchObject({ ok: true, mode: "online", storage: "memory" })

      const externalToolsStatus = (await fetchJSON(`${running.url}/api/external-tools/status`)) as {
        tools?: Array<{ id?: string; installStatus?: string; installed?: boolean; detectedVersion?: string; installHints?: string[]; doctor?: { ok?: boolean; command?: string } }>
      }
      const claudeTapStatus = externalToolsStatus.tools?.find((tool) => tool.id === "claude-tap")
      expect(claudeTapStatus).toMatchObject({
        id: "claude-tap",
        installStatus: expect.stringMatching(/^(installed|missing)$/),
        installed: expect.any(Boolean),
        installHints: expect.arrayContaining(["uv tool install claude-tap"]),
        doctor: expect.objectContaining({ command: "claude-tap" }),
      })
      if (claudeTapStatus?.installStatus === "installed") expect(claudeTapStatus.detectedVersion).toEqual(expect.any(String))

      const builderHTML = await fetchText(`${running.url}/harness-builder.html`)
      expect(builderHTML).toContain("__harnessBuilderServer")
      expect(builderHTML).toContain('data-harness-builder="loading"')
      expect(builderHTML).toContain('id="builderLoading"')
      expect(builderHTML).toContain('data-action="save"')
      expect(builderHTML).toContain('data-action="run-open"')
      expect(builderHTML).toContain("/api/harness-impact/remove")
      expect(builderHTML).toContain("/api/harnesses")
      expect(builderHTML).toContain("/api/harness-tui-sessions")
      expect(await fetchText(`${running.url}/vendor/xterm/xterm.css`)).toContain(".xterm")
      expect(await fetchText(`${running.url}/vendor/xterm/xterm.js`)).toContain("Terminal")

      const builderDataResponse = await fetch(`${running.url}/api/builder-data`, {
        headers: { "accept-encoding": "gzip" },
      })
      expect(builderDataResponse.ok).toBe(true)
      expect(builderDataResponse.headers.get("content-encoding")).toBe("gzip")
      const builderData = (await builderDataResponse.json()) as {
        presets: Array<{ id: string; recipe?: unknown }>
        atoms: Array<{
          id?: string
          implementationLevel?: string
          implementationLabel?: string
          implementationSummary?: string
          nativeEvidenceRefs?: string[]
          upstreamCommit?: string
          fixtureIDs?: string[]
          parityCoverage?: string
          knownLossiness?: string[]
        }>
        ports: unknown[]
        bundles: Array<{ id: string; atoms: string[]; ports: string[]; exclusiveFamilyID?: string }>
        slots: Array<{ id: string; primaryPortID: string; required: boolean }>
        flowCatalogs: Array<{
          product: string
          defaultTaskIDs: string[]
          nativeAdapter: { adapterID: string }
          dataSources: Array<{
            id: string
            scope: string
            stageIDs: string[]
            observedEventTypes: string[]
            liveProviderSummary?: { artifactPath: string; provider?: string; products: Array<{ product: string; status: string; ok: boolean }> }
            surfaceResults?: Array<{
              surfaceID: string
              resultKind: string
              captureModes: string[]
              routeOrMethod?: string
              liveProviderArtifact?: { coverage: string; artifactPath: string; productStatus: string; ok: boolean; attachmentPath?: string }
            }>
          }>
          stages: Array<{ id: string; assembled: { portIDs: string[] }; original: { observability: { lossiness: string } } }>
          lossinessRules: Array<{ lossiness: string; hardBlocker: boolean }>
        }>
        flowTasks: Array<{ id: string; products: string[] }>
        liveProviderSummary?: {
          artifactPath: string
          products: Array<{ product: string; status: string; ok: boolean; attachmentPath?: string }>
        } | null
        nativeFixtureSummary?: {
          attachmentPolicy?: string
          fixtureCount?: number
          manifestAttachmentCount?: number
          fixtures: Array<{ product: string; taskID: string; attachmentPath: string; sha256: string }>
        } | null
      }
      expect(builderData.presets.map((preset) => preset.id)).toEqual(["opencode", "pi-mono", "nanobot", "hermes-agent", "minimal", "hybrid-mix"])
      expect(builderData.atoms.length).toBeGreaterThan(0)
      expect(builderData.atoms.every((atom) => atom.implementationLevel && atom.implementationLabel && atom.implementationSummary)).toBe(true)
      expect(
        builderData.atoms.every((atom) =>
          Array.isArray(atom.nativeEvidenceRefs) &&
          Array.isArray(atom.fixtureIDs) &&
          Boolean(atom.parityCoverage) &&
          Array.isArray(atom.knownLossiness),
        ),
      ).toBe(true)
      expect(builderData.atoms).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "opencode.product-shell.web", implementationLevel: "native" }),
          expect.objectContaining({ id: "opencode.runtime.module-aliases", implementationLevel: "metadata-only" }),
          expect.objectContaining({ id: "opencode.agent-loop.request-boundary.native-like", implementationLevel: "native" }),
          expect.objectContaining({
            id: "opencode.turn.context-builder",
            implementationLevel: "native",
            implementationLabel: "Native",
            parityCoverage: "native",
            upstreamCommit: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
            nativeEvidenceRefs: expect.arrayContaining(["conformance:opencode-turn-context-builder-native-exact-fixture", "turn-context-builder-native-exact:opencode"]),
            knownLossiness: [],
          }),
        ]),
      )
      expect(builderData.ports.length).toBeGreaterThan(0)
      expect(builderData.bundles).toEqual(expect.arrayContaining([expect.objectContaining({ id: "bundle.opencode.session" })]))
      expect(builderData.bundles.find((bundle) => bundle.id === "bundle.opencode.session")?.exclusiveFamilyID).toBe("family.session")
      expect(builderData.slots).toEqual(expect.arrayContaining([expect.objectContaining({ primaryPortID: "session.store", required: true })]))
      expect(builderData.flowCatalogs.map((catalog) => catalog.nativeAdapter.adapterID)).toEqual(expect.arrayContaining(["opencode.fixture-native", "pi-mono.fixture-native", "nanobot.fixture-native", "hermes-agent.visible-native"]))
      expect(builderData.flowCatalogs.find((catalog) => catalog.product === "opencode")?.defaultTaskIDs).toEqual(["read-only-answer", "single-file-edit", "tool-error-retry", "context-compaction"])
      expect(builderData.flowCatalogs.find((catalog) => catalog.product === "opencode")?.stages.find((stage) => stage.id === "provider.request")?.assembled.portIDs).toContain("provider.request-shape")
      expect(builderData.flowCatalogs.find((catalog) => catalog.product === "hermes-agent")?.stages.find((stage) => stage.id === "provider.request")?.original.observability.lossiness).toBe("aggregated")
      expect(builderData.flowCatalogs.find((catalog) => catalog.product === "opencode")?.lossinessRules.find((rule) => rule.lossiness === "unobservable")?.hardBlocker).toBe(false)
      expect(builderData.flowCatalogs.find((catalog) => catalog.product === "opencode")?.dataSources.find((source) => source.id === "turn-pipeline-trace")?.stageIDs).toContain("prompt.assemble")
      expect(builderData.flowCatalogs.find((catalog) => catalog.product === "opencode")?.dataSources.find((source) => source.id === "tool-events")?.observedEventTypes).toEqual(expect.arrayContaining(["tool.call", "permission.ask", "tool.execution_start", "tool.execution_end", "tool.result"]))
      expect(builderData.flowCatalogs.find((catalog) => catalog.product === "opencode")?.dataSources.find((source) => source.id === "product-surface-results")?.surfaceResults).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            surfaceID: "opencode.product-shell.sdk",
            resultKind: "provider-backed-turn",
            routeOrMethod: "runTurn(input)",
            liveProviderArtifact: expect.objectContaining({ coverage: "verified-sdk-readback", artifactPath: "docs/reports/live-provider-parity-split/summary.json" }),
          }),
          expect.objectContaining({
            surfaceID: "opencode.product-shell.server",
            resultKind: "server-route-turn",
            routeOrMethod: "POST /v1/run",
            liveProviderArtifact: expect.objectContaining({ coverage: "provider-path-linked" }),
          }),
          expect.objectContaining({ surfaceID: "opencode.product-shell.web", resultKind: "render-snapshot", captureModes: ["snapshot"] }),
        ]),
      )
      expect(builderData.flowCatalogs.find((catalog) => catalog.product === "opencode")?.dataSources.find((source) => source.id === "product-surface-results")?.liveProviderSummary).toMatchObject({
        artifactPath: "docs/reports/live-provider-parity-split/summary.json",
        products: expect.arrayContaining([expect.objectContaining({ product: "opencode", status: "passed", ok: true })]),
      })
      expect(builderData.flowCatalogs.find((catalog) => catalog.product === "pi-mono")?.dataSources.find((source) => source.id === "product-surface-results")?.surfaceResults).toEqual(
        expect.arrayContaining([expect.objectContaining({ surfaceID: "pi.product-shell.rpc", resultKind: "rpc-turn", routeOrMethod: "run.turn" })]),
      )
      expect(builderData.flowCatalogs.find((catalog) => catalog.product === "hermes-agent")?.dataSources.find((source) => source.id === "product-surface-results")?.surfaceResults).toEqual(
        expect.arrayContaining([expect.objectContaining({ surfaceID: "hermes.product-shell.gateway", liveProviderArtifact: expect.objectContaining({ coverage: "provider-path-linked", productStatus: "passed" }) })]),
      )
      expect(builderData.liveProviderSummary).toMatchObject({
        artifactPath: "docs/reports/live-provider-parity-split/summary.json",
        products: expect.arrayContaining([
          expect.objectContaining({ product: "opencode", status: "passed", ok: true }),
          expect.objectContaining({ product: "hermes-agent", status: "passed", ok: true }),
        ]),
      })
      expect(builderData.flowTasks.map((task) => task.id)).toEqual(expect.arrayContaining(["read-only-answer", "context-compaction", "single-file-edit", "tool-error-retry"]))
      expect(builderData.flowTasks.find((task) => task.id === "context-compaction")?.products).toContain("opencode")
      expect(builderData.nativeFixtureSummary).toMatchObject({
        attachmentPolicy: "lazy-fetch-by-attachment-path",
        fixtureCount: builderData.nativeFixtureSummary?.manifestAttachmentCount,
      })
      expect(builderData.nativeFixtureSummary?.fixtures.find((fixture) => fixture.product === "opencode" && fixture.taskID === "read-only-answer")?.sha256).toMatch(/^[a-f0-9]{64}$/)

      const flowBlueprint = (await fetchJSON(`${running.url}/api/harness-flow/blueprint?product=opencode`)) as {
        product?: string
        mode?: string
        nodes?: Array<{
          id?: string
          metrics?: {
            implementationLevels?: string[]
            bridgeLayers?: Array<{ layer?: string; implementationLevel?: string; atomIDs?: string[] }>
          }
        }>
        summary?: { fingerprint?: string }
      }
      expect(flowBlueprint).toMatchObject({ product: "opencode", mode: "blueprint" })
      expect(flowBlueprint.nodes).toHaveLength(19)
      expect(flowBlueprint.summary?.fingerprint).toMatch(/^[a-f0-9]{16}$/)
      const providerStreamMetrics = flowBlueprint.nodes?.find((node) => node.id === "provider.stream")?.metrics
      expect(providerStreamMetrics?.implementationLevels).toEqual(["native"])
      expect(providerStreamMetrics?.bridgeLayers ?? []).toEqual([])

      const flowCompare = (await fetchJSON(`${running.url}/api/harness-flow/compare?product=opencode&task=read-only-answer`)) as {
        product?: string
        diffs?: unknown[]
        nativeEvidence?: {
          status?: string
          artifactPath?: string
          attachmentPath?: string
          sha256?: string
          message?: string
          projectionLossDetails?: Array<{ field?: string; lossiness?: string; reason?: string }>
        }
        original?: { evidence?: Array<{ metadata?: { artifactPath?: string; artifactHash?: string; captureMode?: string; projectionLossDetails?: Array<{ field?: string; lossiness?: string }> } }> }
        summary?: { fingerprint?: string }
      }
      expect(flowCompare.product).toBe("opencode")
      expect(flowCompare.diffs?.length).toBeGreaterThan(0)
      expect(flowCompare.summary?.fingerprint).toMatch(/^[a-f0-9]{16}$/)
      expect(flowCompare.nativeEvidence).toMatchObject({
        status: "linked",
        artifactPath: "docs/reports/task-parity-native-cadence-fixtures/manifest.json",
        message: "native evidence linked",
      })
      expect(flowCompare.nativeEvidence?.attachmentPath).toMatch(/^docs\/reports\/task-parity-native-cadence-fixtures\/attachments\/opencode-/)
      expect(flowCompare.nativeEvidence?.sha256).toMatch(/^[a-f0-9]{64}$/)
      expect(flowCompare.nativeEvidence?.projectionLossDetails).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "acceptance", lossiness: "unobservable" }),
          expect.objectContaining({ field: "providerRawFrame", lossiness: "semantic" }),
          expect.objectContaining({ field: "providerRawPayload", lossiness: "semantic" }),
          expect.objectContaining({ field: "providerTiming", lossiness: "inferred" }),
        ]),
      )
      expect(flowCompare.original?.evidence?.some((item) => item.metadata?.captureMode === "native-cadence-fixture" && Boolean(item.metadata.artifactHash))).toBe(true)
      expect(flowCompare.original?.evidence?.some((item) => item.metadata?.projectionLossDetails?.some((loss) => loss.field === "acceptance" && loss.lossiness === "unobservable"))).toBe(true)
      expect(flowCompare.original?.evidence?.some((item) => item.metadata?.projectionLossDetails?.some((loss) => loss.field === "providerTiming" && loss.lossiness === "inferred"))).toBe(true)

      const artifactCompare = (await fetchJSON(
        `${running.url}/api/harness-flow/compare?product=opencode&task=read-only-answer&source=native-capture-artifact&artifact=docs/reports/task-parity-native-cadence-fixtures/manifest.json`,
      )) as {
        nativeEvidence?: {
          status?: string
          source?: string
          artifactPath?: string
          attachmentPath?: string
          sha256?: string
          projectionLossDetails?: Array<{ field?: string; lossiness?: string; reason?: string }>
        }
        summary?: { fingerprint?: string }
      }
      expect(artifactCompare.summary?.fingerprint).toMatch(/^[a-f0-9]{16}$/)
      expect(artifactCompare.nativeEvidence).toMatchObject({
        status: "linked",
        source: "native-capture-artifact",
        artifactPath: "docs/reports/task-parity-native-cadence-fixtures/manifest.json",
      })
      expect(artifactCompare.nativeEvidence?.attachmentPath).toMatch(/^docs\/reports\/task-parity-native-cadence-fixtures\/attachments\/opencode-/)
      expect(artifactCompare.nativeEvidence?.sha256).toMatch(/^[a-f0-9]{64}$/)
      expect(artifactCompare.nativeEvidence?.projectionLossDetails).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "acceptance", lossiness: "unobservable" }),
          expect.objectContaining({ field: "providerRawFrame", lossiness: "semantic" }),
          expect.objectContaining({ field: "providerRawPayload", lossiness: "semantic" }),
          expect.objectContaining({ field: "providerTiming", lossiness: "inferred" }),
        ]),
      )

      const badNativeArtifact = join(tmpdir(), `helix-bad-native-artifact-${Date.now()}.json`)
      writeFileSync(badNativeArtifact, JSON.stringify({ schemaVersion: 1, fixtures: [] }), "utf8")
      try {
        const badNativeResponse = await fetch(
          `${running.url}/api/harness-flow/compare?product=opencode&task=read-only-answer&source=native-capture-artifact&artifact=${encodeURIComponent(badNativeArtifact)}`,
        )
        const badNativePayload = (await badNativeResponse.json()) as { ok?: boolean; nativeEvidence?: { status?: string; source?: string } }
        expect(badNativeResponse.status).toBe(400)
        expect(badNativePayload).toMatchObject({
          ok: false,
          nativeEvidence: {
            status: "unverified",
            source: "native-capture-artifact",
          },
        })
      } finally {
        rmSync(badNativeArtifact, { force: true })
      }

      const externalCapturePath = join(profileRoot, "claude-tap-native-capture.json")
      writeFileSync(
        externalCapturePath,
        `${JSON.stringify(
          {
            schemaVersion: 1,
            artifactKind: "external-tool-native-capture",
            generatedAt: "2026-06-14T00:00:00.000Z",
            sourceTool: "claude-tap",
            sourceToolVersion: "unknown",
            sourceArtifact: {
              format: "jsonl",
              hash: `sha256:${"a".repeat(64)}`,
              bytes: 256,
            },
            product: "opencode",
            taskID: "read-only-answer",
            captureMode: "import-only",
            lossiness: {
              observability: "external-proxy-capture",
              rawPrompt: "fingerprint-only",
              rawProviderPayload: "shape-summary-only",
              rawToolPayload: "fingerprint-only",
              nativeInternals: "unobservable",
            },
            providerRequests: [
              {
                requestID: "external-docs-1",
                turn: 1,
                method: "POST",
                path: "/v1/responses",
                protocol: "openai-responses",
                modelID: "docs-test-model",
                status: 200,
                durationMs: 42,
                requestShape: { type: "object", fingerprint: `sha256:${"b".repeat(64)}`, keys: ["model"] },
                responseShape: { type: "object", fingerprint: `sha256:${"c".repeat(64)}`, keys: ["output"] },
              },
            ],
            promptEvidence: [
              {
                requestID: "external-docs-1",
                turn: 1,
                protocol: "openai-responses",
                modelID: "docs-test-model",
                userFingerprint: `sha256:${"d".repeat(64)}`,
                toolNames: [],
                toolSchemaFingerprints: [],
                messageCount: 1,
              },
            ],
            toolEvidence: [],
            streamEvidence: [
              {
                requestID: "external-docs-1",
                turn: 1,
                protocol: "openai-responses",
                eventCount: 2,
                finishReason: "stop",
                responseFingerprint: `sha256:${"e".repeat(64)}`,
              },
            ],
            usageEvidence: [],
            stageEvidence: [
              {
                stage: "provider",
                observability: "external-proxy-capture",
                evidenceCount: 1,
                summary: "provider request summary",
                fingerprints: [`sha256:${"f".repeat(64)}`],
              },
            ],
            redactionPolicy: {
              version: 1,
              containsRawPrompt: false,
              credentials: "redacted",
              hostPaths: "normalized",
            },
            summary: {
              records: 1,
              providerRequests: 1,
              promptEvidence: 1,
              toolEvidence: 0,
              streamEvents: 2,
              models: ["docs-test-model"],
              protocols: ["openai-responses"],
              statusCodes: [200],
            },
          },
          null,
          2,
        )}\n`,
        "utf8",
      )
      const externalCompare = (await fetchJSON(
        `${running.url}/api/harness-flow/compare?product=opencode&task=read-only-answer&source=external-capture&artifact=${encodeURIComponent(externalCapturePath)}`,
      )) as {
        nativeEvidence?: {
          status?: string
          source?: string
          sourceTool?: string
          captureMode?: string
          artifactPath?: string
          projectionLossDetails?: Array<{ field?: string; lossiness?: string }>
          lossiness?: { nativeInternals?: string; rawProviderPayload?: string }
        }
        original?: { evidence?: Array<{ metadata?: { source?: string; captureMode?: string; sourceTool?: string; projectionLossDetails?: Array<{ field?: string; lossiness?: string }> } }> }
        summary?: { fingerprint?: string }
      }
      expect(externalCompare.summary?.fingerprint).toMatch(/^[a-f0-9]{16}$/)
      expect(externalCompare.nativeEvidence).toMatchObject({
        status: "linked",
        source: "external-capture",
        sourceTool: "claude-tap",
        captureMode: "import-only",
        lossiness: { nativeInternals: "unobservable", rawProviderPayload: "shape-summary-only" },
      })
      expect(externalCompare.nativeEvidence?.artifactPath).toBe(externalCapturePath)
      expect(externalCompare.nativeEvidence?.projectionLossDetails).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: "workspace", lossiness: "unobservable" }),
          expect.objectContaining({ field: "providerRawPayload", lossiness: "semantic" }),
        ]),
      )
      expect(externalCompare.original?.evidence?.some((item) => item.metadata?.source === "external-capture" && item.metadata.captureMode === "import-only" && item.metadata.sourceTool === "claude-tap")).toBe(true)

      const contextCompare = (await fetchJSON(`${running.url}/api/harness-flow/compare?product=opencode&task=context-compaction`)) as {
        nativeEvidence?: { status?: string; attachmentPath?: string; taskID?: string }
        summary?: { fingerprint?: string }
      }
      expect(contextCompare.summary?.fingerprint).toMatch(/^[a-f0-9]{16}$/)
      expect(contextCompare.nativeEvidence).toMatchObject({ status: "linked", taskID: "context-compaction" })
      expect(contextCompare.nativeEvidence?.attachmentPath).toMatch(/opencode-context-compaction-/)

      const taskParityCompare = (await fetchJSON(`${running.url}/api/harness-flow/compare?product=opencode&task=context-compaction&source=task-parity-report`)) as {
        nativeEvidence?: { status?: string; source?: string; taskID?: string; reportMode?: string; reportStatus?: string; runnerID?: string }
        original?: { evidence?: Array<{ label?: string; kind?: string; metadata?: Record<string, unknown> }> }
        summary?: { fingerprint?: string }
      }
      expect(taskParityCompare.summary?.fingerprint).toMatch(/^[a-f0-9]{16}$/)
      expect(taskParityCompare.nativeEvidence).toMatchObject({
        status: "linked",
        source: "task-parity-report",
        taskID: "context-compaction",
        reportMode: "original",
        runnerID: "task.runner.native-cli",
      })
      expect(JSON.stringify(taskParityCompare.original?.evidence ?? [])).toContain("task parity report")

      const hermesNative = (await fetchJSON(`${running.url}/api/harness-flow/native?product=hermes-agent&task=read-only-answer`)) as {
        product?: string
        nodes?: unknown[]
        nativeEvidence?: { status?: string; message?: string; artifactPath?: string; projectionLossDetails?: Array<{ field?: string; lossiness?: string; reason?: string }> }
      }
      expect(hermesNative.product).toBe("hermes-agent")
      expect(hermesNative.nodes).toHaveLength(19)
      expect(hermesNative.nativeEvidence).toMatchObject({
        status: "linked",
        message: "native evidence linked",
        artifactPath: "docs/reports/task-parity-native-cadence-fixtures/manifest.json",
      })
      expect(hermesNative.nativeEvidence?.projectionLossDetails?.length).toBeGreaterThan(0)

      const runDefaults = (await fetchJSON(`${running.url}/api/harness-run-defaults`)) as {
        provider?: string
        modelID?: string
        baseURL?: string
        hasServerAPIKey?: boolean
        apiKey?: string
      }
      expect(runDefaults.provider).toBeTruthy()
      expect(runDefaults.baseURL).toMatch(/^https:\/\//)
      expect(runDefaults).not.toHaveProperty("apiKey")
      expect(JSON.stringify(runDefaults)).not.toContain("sk-")

      const opencodeRecipe = builderData.presets.find((preset) => preset.id === "opencode")?.recipe as
        | {
            id?: string
            version?: string
            atoms?: Array<{ id: string }>
            bindings?: Array<{ port: string; module: string }>
            metadata?: Record<string, unknown>
          }
        | undefined
      expect(opencodeRecipe).toBeTruthy()
      const customOpenCodeRecipe = {
        ...opencodeRecipe!,
        id: "custom.opencode-nanobot-prompt",
        atoms: [
          ...((opencodeRecipe?.atoms ?? []) as Array<{ id: string }>).filter((atom) => atom.id !== "opencode.prompt.mode-builder"),
          { id: "nanobot.prompt.agent-builder" },
        ],
        bindings: ((opencodeRecipe?.bindings ?? []) as Array<{ port: string; module: string }>).map((binding) =>
          binding.port === "prompt.system-builder"
            ? { ...binding, module: "nanobot.prompt.agent-builder" }
            : binding,
        ),
        personalities: ["common", "opencode", "nanobot"],
        metadata: {
          ...((opencodeRecipe?.metadata ?? {}) as Record<string, unknown>),
          product: "opencode",
          basedOn: "opencode",
          sourceFingerprint: "custom-opencode-nanobot-prompt",
        },
      }
      const customDraft = (await fetchJSON(`${running.url}/api/recipes/drafts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipe: customOpenCodeRecipe }),
      })) as { id: string; url: string }
      const persistedDraftFlow = (await fetchJSON(`${running.url}/api/harness-flow/blueprint?draft=${encodeURIComponent(customDraft.id)}`)) as {
        product?: string
        recipeID?: string
        contractFingerprint?: string
        draftSource?: string
        draftID?: string
        nodes?: Array<{
          id?: string
          metrics?: {
            parityTargetRefs?: string[]
            parityTargetSatisfied?: boolean
            parityTargetBlockers?: string[]
            moduleClaims?: Array<{
              atomID?: string
              sourceProduct?: string
              implementationLevel?: string
              parityTargetProduct?: string
              parityTargetRef?: string
              parityCompatible?: string
              parityTargetSatisfied?: boolean
              blockers?: string[]
            }>
          }
        }>
        summary?: { fingerprint?: string }
      }
      expect(persistedDraftFlow).toMatchObject({
        product: "opencode",
        recipeID: "custom.opencode-nanobot-prompt",
        draftSource: "persisted-draft",
        draftID: customDraft.id,
      })
      expect(persistedDraftFlow.summary?.fingerprint).toMatch(/^[a-f0-9]{16}$/)
      expect(persistedDraftFlow.nodes?.find((node) => node.id === "prompt.assemble")?.metrics).toMatchObject({
        parityTargetRefs: expect.arrayContaining(["anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"]),
        parityTargetSatisfied: false,
        parityTargetBlockers: expect.arrayContaining(["custom-draft-composition", "source-product-mismatch"]),
        moduleClaims: expect.arrayContaining([
          expect.objectContaining({
            atomID: "nanobot.prompt.agent-builder",
            sourceProduct: "nanobot",
            implementationLevel: "native",
            parityTargetProduct: "opencode",
            parityTargetRef: "anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
            parityCompatible: "partial",
            parityTargetSatisfied: false,
            blockers: expect.arrayContaining(["custom-draft-composition", "source-product-mismatch"]),
          }),
        ]),
      })
      const requestBodyDraftFlow = (await fetchJSON(`${running.url}/api/harness-flow/blueprint`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipe: customOpenCodeRecipe }),
      })) as typeof persistedDraftFlow
      expect(requestBodyDraftFlow).toMatchObject({
        product: "opencode",
        recipeID: "custom.opencode-nanobot-prompt",
        draftSource: "request-body",
      })
      expect(requestBodyDraftFlow.nodes?.find((node) => node.id === "prompt.assemble")?.metrics?.moduleClaims).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            atomID: "nanobot.prompt.agent-builder",
            sourceProduct: "nanobot",
            parityTargetSatisfied: false,
            blockers: expect.arrayContaining(["custom-draft-composition", "source-product-mismatch"]),
          }),
        ]),
      )
      const flowRun = (await fetchJSON(`${running.url}/api/harness-flow/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product: "opencode",
          taskID: "read-only-answer",
          recipe: opencodeRecipe,
          prompt: "docs secret prompt",
          maxSteps: 2,
          toolSequence: ["shell"],
        }),
      })) as {
        schemaVersion?: number
        runID?: string
        captureMode?: string
        promptFingerprint?: string
        events?: Array<{ type?: string }>
        graph?: { mode?: string; nodes?: unknown[]; summary?: { fingerprint?: string } }
        summary?: { finish?: string; events?: number; fingerprint?: string }
      }
      expect(flowRun.schemaVersion).toBe(1)
      expect(flowRun.runID).toMatch(/^flow-run-/)
      expect(flowRun.captureMode).toBe("fixture")
      expect(flowRun.promptFingerprint).toMatch(/^[a-f0-9]{16}$/)
      expect(JSON.stringify(flowRun)).not.toContain("docs secret prompt")
      expect(flowRun.events?.map((event) => event.type)).toEqual(expect.arrayContaining(["provider.request.before", "tool.call", "message.end"]))
      expect(flowRun.graph?.mode).toBe("trace")
      expect(flowRun.graph?.nodes).toHaveLength(19)
      expect(flowRun.summary?.fingerprint).toMatch(/^[a-f0-9]{16}$/)

      const profileStatus = (await fetchJSON(`${running.url}/api/harnesses`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "docs-activation", recipe: opencodeRecipe }),
      })) as { profile?: { name?: string }; validation?: { ok?: boolean; missing?: string[] } }
      expect(profileStatus.profile?.name).toBe("docs-activation")
      expect(profileStatus.validation?.missing).toEqual(expect.arrayContaining(["provider", "telegram"]))

      const providerStatus = (await fetchJSON(`${running.url}/api/harnesses/docs-activation/provider`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: "openai-compatible", modelID: "docs-test-model", apiKeyEnv: "DOCS_PROVIDER_KEY" }),
      })) as { provider?: { kind?: string; modelID?: string; apiKeyEnv?: string }; validation?: { ok?: boolean; missing?: string[] } }
      expect(providerStatus.provider).toMatchObject({ kind: "openai-compatible", modelID: "docs-test-model", apiKeyEnv: "DOCS_PROVIDER_KEY" })
      expect(providerStatus.validation?.missing).toEqual(expect.arrayContaining(["telegram"]))

      await expect(fetchJSON(`${running.url}/api/harnesses/docs-activation/provider`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: "fake" }),
      })).rejects.toThrow(/HTTP 400/)

      const telegramStatus = (await fetchJSON(`${running.url}/api/harnesses/docs-activation/channels/telegram`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "polling", botTokenEnv: "DOCS_TELEGRAM_TOKEN", allowedChatIDs: ["docs-chat"] }),
      })) as { telegram?: { mode?: string; botTokenEnv?: string }; validation?: { ok?: boolean } }
      expect(telegramStatus.telegram?.mode).toBe("polling")
      expect(telegramStatus.telegram?.botTokenEnv).toBe("DOCS_TELEGRAM_TOKEN")
      expect(telegramStatus.validation?.ok).toBe(true)

      await expect(fetchJSON(`${running.url}/api/harnesses/docs-activation/channels/telegram`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "fake", botTokenEnv: "DOCS_TELEGRAM_TOKEN", allowedChatIDs: ["docs-chat"] }),
      })).rejects.toThrow(/HTTP 400/)

      const activationSmoke = (await fetchJSON(`${running.url}/api/harnesses/docs-activation/gateway/smoke-local`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "/status", chatID: "docs-chat" }),
      })) as { ok?: boolean; source?: string; sentMessages?: Array<{ chatID?: string; text?: string }> }
      expect(activationSmoke.ok).toBe(true)
      expect(activationSmoke.source).toBe("local-fixture")
      expect(activationSmoke.sentMessages).toEqual([expect.objectContaining({ chatID: "docs-chat", text: expect.stringContaining("Profile docs-activation") })])

      await expect(fetchJSON(`${running.url}/api/harness-tui-sessions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "draft-recipe", recipe: opencodeRecipe, providerMode: "fake", cols: 90, rows: 24 }),
      })).rejects.toThrow(/HTTP 400/)

      const tuiSession = (await fetchJSON(`${running.url}/api/harness-tui-sessions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "draft-recipe", recipe: opencodeRecipe, cols: 90, rows: 24 }),
      })) as { sessionID: string; source?: string; state?: string; command?: string; argv?: string[]; shell?: string; initialCommand?: string; recipeFingerprint?: string; outputTail?: string; storageDir?: string }
      expect(tuiSession.sessionID).toMatch(/^tui-/)
      expect(tuiSession.source).toBe("draft-recipe")
      expect(tuiSession.state).toBe("running")
      expect(tuiSession.shell).toMatch(/^(?:bash|zsh|sh)$/)
      expect(tuiSession.argv).toEqual(expect.arrayContaining(["-i"]))
      expect(tuiSession.initialCommand).toContain("npm run -s")
      expect(tuiSession.initialCommand).toContain("-- tui")
      expect(tuiSession.initialCommand).toContain("--recipe-file")
      expect(tuiSession.recipeFingerprint).toMatch(/^[0-9a-f]{16}$/)
      expect(tuiSession.storageDir).toBeTruthy()
      if (!tuiSession.storageDir) throw new Error("Expected TUI session storageDir")
      mkdirSync(tuiSession.storageDir, { recursive: true })
      writeFileSync(join(tuiSession.storageDir, "runtime-traces.jsonl"), `${JSON.stringify({
        schemaVersion: 1,
        runtimeTrace: {
          source: "builder-test-session",
          events: [{ type: "input" }, { type: "provider.request.before" }, { type: "message.end" }],
          summary: { events: 3, fingerprint: "1234567890abcdef" },
        },
      })}\n`, "utf8")

      const socket = new WebSocket(`${running.url.replace(/^http/, "ws")}/api/harness-tui-sessions/${encodeURIComponent(tuiSession.sessionID)}/socket`)
      const socketOutput: string[] = []
      const socketStatuses: unknown[] = []
      socket.on("message", (message) => {
        const event = JSON.parse(message.toString()) as { type?: string; data?: string; session?: unknown }
        if (event.type === "output" && typeof event.data === "string") socketOutput.push(event.data)
        if (event.type === "status") socketStatuses.push(event.session)
      })
      await waitForWebSocketOpen(socket)
      await waitForCondition(() => socketOutput.join("").includes(" TUI\r\n") || socketOutput.join("").includes(" TUI\n"), "TUI banner output", 8_000)
      socket.send(JSON.stringify({ type: "resize", cols: 80, rows: 20 }))
      socket.send(JSON.stringify({ type: "input", data: "hello\r" }))
      await waitForCondition(() => socketOutput.join("").includes("Live provider is not configured"), "missing live provider TUI output", 8_000)
      socket.send(JSON.stringify({ type: "input", data: "second\r" }))
      await waitForCondition(
        () => (socketOutput.join("").match(/Live provider is not configured/g)?.length ?? 0) >= 2,
        "second missing live provider TUI output",
        8_000,
      )
      expect(socketStatuses.length).toBeGreaterThan(0)

      const tuiStatus = (await fetchJSON(`${running.url}/api/harness-tui-sessions/${encodeURIComponent(tuiSession.sessionID)}`)) as {
        state?: string
        cols?: number
        rows?: number
        outputTail?: string
        runtimeTraceSummary?: { turns?: number; events?: number; latestFingerprint?: string; latestSource?: string; latestEventTypes?: string[] }
      }
      expect(tuiStatus.state).toBe("running")
      expect(tuiStatus.cols).toBe(80)
      expect(tuiStatus.rows).toBe(20)
      expect(tuiStatus.outputTail).toContain("Live provider is not configured")
      expect(tuiStatus.runtimeTraceSummary).toMatchObject({
        turns: 1,
        events: 3,
        latestFingerprint: "1234567890abcdef",
        latestSource: "builder-test-session",
        latestEventTypes: ["input", "provider.request.before", "message.end"],
      })

      const tuiLogs = (await fetchJSON(`${running.url}/api/harness-tui-sessions/${encodeURIComponent(tuiSession.sessionID)}/logs`)) as { text?: string; path?: string }
      expect(tuiLogs.path).toContain("session.log")
      expect(tuiLogs.text).toContain("Live provider is not configured")

      const socketClosed = waitForWebSocketClose(socket)
      const stoppedTui = (await fetchJSON(`${running.url}/api/harness-tui-sessions/${encodeURIComponent(tuiSession.sessionID)}`, { method: "DELETE" })) as { state?: string }
      expect(stoppedTui.state).toBe("stopped")
      await socketClosed

      const profileTui = (await fetchJSON(`${running.url}/api/harness-tui-sessions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "installed-profile", profileName: "docs-activation" }),
      })) as { sessionID: string; source?: string; profileName?: string; state?: string; providerSummary?: { kind?: string } }
      expect(profileTui.source).toBe("installed-profile")
      expect(profileTui.profileName).toBe("docs-activation")
      expect(profileTui.state).toBe("running")
      expect(profileTui.providerSummary?.kind).toBe("profile-live")
      const tuiList = (await fetchJSON(`${running.url}/api/harness-tui-sessions`)) as { sessions?: Array<{ sessionID?: string }> }
      expect(tuiList.sessions?.map((session) => session.sessionID)).toEqual(expect.arrayContaining([profileTui.sessionID]))
      await fetchJSON(`${running.url}/api/harness-tui-sessions/${encodeURIComponent(profileTui.sessionID)}`, { method: "DELETE" })

      const removalImpact = (await fetchJSON(`${running.url}/api/harness-impact/remove`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          atomID: "opencode.session.store.sqlite-projection",
          recipe: opencodeRecipe,
        }),
      })) as {
        ok?: boolean
        severity?: string
        couplingGroup?: string
        bundleID?: string
        bundleLabel?: string
        sharedAtoms?: Array<{ id: string; sharedByBundles?: string[] }>
        bundleRemovalAtomIDs?: string[]
        removedBindings?: Array<{ portID: string; providerAtomID: string }>
        requiredBreaks?: Array<{ portID: string }>
        ambiguityAfter?: Array<{ portID: string }>
      }
      expect(removalImpact.ok).toBe(true)
      expect(removalImpact.severity).toBe("blocked")
      expect(removalImpact.couplingGroup).toBe("bundle.opencode.session")
      expect(removalImpact.bundleID).toBe("bundle.opencode.session")
      expect(removalImpact.bundleLabel).toContain("OpenCode")
      expect(removalImpact.bundleRemovalAtomIDs).toEqual(expect.arrayContaining(["opencode.session.store.sqlite-projection"]))
      expect(removalImpact.removedBindings).toEqual(
        expect.arrayContaining([expect.objectContaining({ portID: "session.store", providerAtomID: "opencode.session.store.sqlite-projection" })]),
      )
      expect(removalImpact.ambiguityAfter).toEqual(expect.arrayContaining([expect.objectContaining({ portID: "session.store" })]))

      const rejectedRun = await fetch(`${running.url}/api/harness-runs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recipe: {
            id: "conformance.recipe",
            version: "0.1.0",
            modules: [],
            atoms: [],
            productShells: [],
            bindings: [],
            requiredCapabilities: [],
            personalities: ["common"],
          },
          provider: "openai-compatible",
          model: "test-model",
          apiKey: "sk-conformance-secret",
          baseURL: "http://127.0.0.1:9/v1",
          prompt: "hello",
        }),
      })
      expect(rejectedRun.status).toBe(400)
      const rejectedRunBody = (await rejectedRun.json()) as { error?: string }
      expect(rejectedRunBody.error).toContain("https://")
      expect(JSON.stringify(rejectedRunBody)).not.toContain("sk-conformance-secret")

      const draft = (await fetchJSON(`${running.url}/api/recipes/drafts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recipe: {
            id: "conformance.recipe",
            version: "0.1.0",
            modules: [],
            atoms: [],
            productShells: [],
            bindings: [],
            requiredCapabilities: [],
            personalities: ["common"],
          },
        }),
      })) as { id: string; url: string; recipe: { id: string } }
      expect(draft.id).toMatch(/^draft-/)
      expect(draft.recipe.id).toBe("conformance.recipe")

      const readback = (await fetchJSON(`${running.url}${draft.url}`)) as { id: string; recipe: { id: string } }
      expect(readback.id).toBe(draft.id)
      expect(readback.recipe.id).toBe("conformance.recipe")
    } finally {
      running.tuiSessions.stopAll()
      await new Promise<void>((resolveClose) => running.server.close(() => resolveClose()))
      rmSync(profileRoot, { recursive: true, force: true })
    }
  }, 60_000)
})

async function fetchJSON(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, init)
  if (!response.ok) throw new Error(`GET ${url} failed with HTTP ${response.status}`)
  return response.json()
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`GET ${url} failed with HTTP ${response.status}`)
  return response.text()
}

function waitForWebSocketOpen(socket: WebSocket): Promise<void> {
  if (socket.readyState === WebSocket.OPEN) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("WebSocket open timed out.")), 10_000)
    socket.once("open", () => {
      clearTimeout(timer)
      resolve()
    })
    socket.once("error", (error) => {
      clearTimeout(timer)
      reject(error)
    })
  })
}

function waitForWebSocketClose(socket: WebSocket): Promise<void> {
  if (socket.readyState === WebSocket.CLOSED) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("WebSocket close timed out.")), 10_000)
    socket.once("close", () => {
      clearTimeout(timer)
      resolve()
    })
    socket.once("error", (error) => {
      clearTimeout(timer)
      reject(error)
    })
  })
}

function waitForCondition(condition: () => boolean, label: string, timeoutMs = 20_000): Promise<void> {
  const startedAt = Date.now()
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      if (condition()) {
        clearInterval(timer)
        resolve()
        return
      }
      if (Date.now() - startedAt > timeoutMs) {
        clearInterval(timer)
        reject(new Error(`Timed out waiting for ${label}.`))
      }
    }, 50)
  })
}
