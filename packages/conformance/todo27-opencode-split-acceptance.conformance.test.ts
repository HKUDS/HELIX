import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { runCli } from "@helix/cli"
import {
  buildTodo27OpenCodeSplitAcceptance,
  verifyTodo27OpenCodeSplitAcceptance,
  writeTodo27OpenCodeSplitAcceptanceReport,
  type Todo27OpenCodeSplitAcceptance,
} from "@helix/recipes"

describe("TODO-027 OpenCode split acceptance conformance", () => {
  it("summarizes verified OpenCode executable native parity without claiming TODO completion", () => {
    const report = buildTodo27OpenCodeSplitAcceptance({
      generatedAt: "2026-06-12T00:00:00.000Z",
    })
    const verification = verifyTodo27OpenCodeSplitAcceptance(report)
    const promptStage = report.trackedStages.find((stage) => stage.stageID === "prompt.assemble")
    const providerStage = report.trackedStages.find((stage) => stage.stageID === "provider.request")
    const toolStage = report.trackedStages.find((stage) => stage.stageID === "tool.execute")
    const sessionStage = report.trackedStages.find((stage) => stage.stageID === "session.assistant-write")
    const opencodePrompt = report.trackedAtoms.find((atom) => atom.atomID === "opencode.prompt.mode-builder")
    const providerRequestOptions = report.trackedAtoms.find((atom) => atom.atomID === "opencode.provider.request-options")
    const opencodeToolSchema = report.trackedAtoms.find((atom) => atom.atomID === "opencode.tool.schema-bridge")
    const sessionStore = report.trackedAtoms.find((atom) => atom.atomID === "opencode.session.store.sqlite-projection")
    const productShellSdk = report.trackedAtoms.find((atom) => atom.atomID === "opencode.product-shell.sdk")
    const uiEventLoop = report.trackedAtoms.find((atom) => atom.atomID === "opencode.ui.event-loop")
    const toolPackCompatibility = report.trackedAtoms.find((atom) => atom.atomID === "opencode.tool-pack.compatibility")
    const traceDebugSurface = report.trackedAtoms.find((atom) => atom.atomID === "opencode.trace.debug-surface")

    expect(verification.ok).toBe(true)
    expect(report.summary.status).toBe("ready-for-review")
    expect(report.acceptanceScope).toBe("opencode-split-review-only")
    expect(report.todoCompletion).toEqual({
      status: "executable-native-parity-verified-metadata-retained",
      completionClaim: false,
      nativeParityVerified: false,
      executableNativeParityVerified: true,
      productNativeComplete: 108,
    })
    expect(report.upstreamTarget).toEqual({
      ref: "anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
      evidencePolicy: "native-proof-required",
      nativeParityVerified: false,
      executableNativeParityVerified: true,
    })
    expect(report.summary).toMatchObject({
      executableNativeParityVerified: true,
      rewriteOpenWithPartialEvidence: 0,
      previewRetained: 0,
      metadataRetained: 16,
    })
    expect(report.sources.inventory).toMatchObject({
      products: ["opencode"],
      transitionAtoms: 124,
      selectedTransitionAtoms: 119,
      productNativeComplete: 108,
      fixtureLinked: 124,
      lossinessLinked: 16,
      verificationOK: true,
    })
    expect(report.sources.assemblyContract).toMatchObject({
      product: "opencode",
      verificationOK: true,
      taskParity: "linked",
      nativeFixtures: "linked",
    })
    expect(report.sources.flowGraph).toMatchObject({
      product: "opencode",
      source: "assembled",
      mode: "blueprint",
      verificationOK: true,
      parityTargetStages: 19,
      parityTargetSatisfiedStages: 19,
      parityTargetBlockedStages: 0,
    })
    expect(report.sources.executableAudit).toMatchObject({
      products: ["opencode"],
      verificationOK: true,
      compileBlockers: 0,
      metadataOnlyExecutableBindings: 0,
      previewOnlyExecutableBindings: 0,
    })
    expect(report.sources.currentModuleAudit).toMatchObject({
      products: ["opencode"],
      verificationOK: true,
      productNativeComplete: 108,
    })
    expect(promptStage).toMatchObject({
      parityTargetRefs: expect.arrayContaining(["anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"]),
      parityTargetSatisfied: true,
      blockers: [],
    })
    expect(providerStage).toMatchObject({
      parityTargetSatisfied: true,
      blockers: [],
      fixtureIDs: expect.arrayContaining(["opencode-provider-auth-descriptor:native-exact-fixture", "opencode-provider-model-plugin:native-exact-fixture", "opencode-provider-request-options:native-exact-fixture"]),
      moduleClaims: expect.arrayContaining([
        expect.objectContaining({
          atomID: "opencode.provider.auth-descriptor",
          implementationLevel: "native",
          parityTargetSatisfied: true,
          blockers: [],
        }),
        expect.objectContaining({
          atomID: "opencode.provider.model-plugin",
          implementationLevel: "native",
          parityTargetSatisfied: true,
          blockers: [],
        }),
        expect.objectContaining({
          atomID: "opencode.provider.request-options",
          implementationLevel: "native",
          parityTargetSatisfied: true,
          blockers: [],
        }),
      ]),
    })
    expect(toolStage).toMatchObject({
      parityTargetSatisfied: true,
      blockers: [],
      fixtureIDs: expect.arrayContaining([
        "opencode-shell-env:native-exact-fixture",
        "opencode-tool:native-exact-fixture",
        "opencode-turn-tool-executor:native-exact-fixture",
      ]),
      moduleClaims: expect.arrayContaining([
        expect.objectContaining({
          atomID: "opencode.shell.env-bridge",
          implementationLevel: "native",
          parityTargetSatisfied: true,
          blockers: [],
        }),
        expect.objectContaining({
          atomID: "opencode.tool.permission-render-bridge",
          implementationLevel: "native",
          parityTargetSatisfied: true,
          blockers: [],
        }),
        expect.objectContaining({
          atomID: "opencode.tool.status-bridge",
          implementationLevel: "native",
          parityTargetSatisfied: true,
          blockers: [],
        }),
        expect.objectContaining({
          atomID: "opencode.workspace-filesystem-bridge",
          implementationLevel: "native",
          parityTargetSatisfied: true,
          blockers: [],
        }),
      ]),
    })
    expect(sessionStage).toMatchObject({
      parityTargetSatisfied: true,
      blockers: [],
      moduleClaims: expect.arrayContaining([
        expect.objectContaining({
          atomID: "opencode.session.message-store.sqlite-service",
          implementationLevel: "native",
          parityTargetSatisfied: true,
          blockers: [],
        }),
        expect.objectContaining({
          atomID: "opencode.session.writer.sqlite-service",
          implementationLevel: "native",
          parityTargetSatisfied: true,
          blockers: [],
        }),
      ]),
    })
    expect(opencodePrompt).toMatchObject({
      implementationLevel: "native",
      disposition: "product-native-complete",
      fixtureIDs: expect.arrayContaining(["opencode-prompt:system-prompt-core-exact-fixture", "opencode-prompt:llm-request-system-exact-fixture"]),
      knownLossiness: [],
    })
    expect(providerRequestOptions).toMatchObject({
      implementationLevel: "native",
      disposition: "product-native-complete",
      fixtureIDs: expect.arrayContaining(["opencode-provider-request-options:native-exact-fixture"]),
      knownLossiness: [],
    })
    expect(opencodeToolSchema).toMatchObject({
      implementationLevel: "native",
      disposition: "product-native-complete",
      fixtureIDs: expect.arrayContaining(["opencode-tool:native-exact-fixture"]),
      knownLossiness: [],
    })
    expect(sessionStore).toMatchObject({
      implementationLevel: "native",
      disposition: "product-native-complete",
      fixtureIDs: expect.arrayContaining(["opencode-session:native-exact-fixture"]),
      knownLossiness: [],
    })
    expect(productShellSdk).toMatchObject({
      implementationLevel: "native",
      disposition: "product-native-complete",
      fixtureIDs: expect.arrayContaining(["opencode-product-shell:native-exact-fixture"]),
      knownLossiness: [],
    })
    expect(uiEventLoop).toMatchObject({
      implementationLevel: "native",
      disposition: "product-native-complete",
      fixtureIDs: expect.arrayContaining(["opencode-ui:native-exact-fixture"]),
      knownLossiness: [],
    })
    expect(toolPackCompatibility).toMatchObject({
      implementationLevel: "native",
      disposition: "product-native-complete",
      fixtureIDs: expect.arrayContaining(["opencode-tool:native-exact-fixture"]),
      knownLossiness: [],
    })
    expect(traceDebugSurface).toMatchObject({
      implementationLevel: "native",
      disposition: "product-native-complete",
      fixtureIDs: expect.arrayContaining(["opencode-trace-debug-surface:native-exact-fixture"]),
      knownLossiness: [],
    })
    expect(verification.checks.find((check) => check.id === "todo27-opencode-acceptance.native-not-claimed")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "todo27-opencode-acceptance.executable-native-parity-verified")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "todo27-opencode-acceptance.scope-not-todo-complete")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "todo27-opencode-acceptance.assembly-evidence-linked")).toMatchObject({ ok: true })
    expect(verification.checks.find((check) => check.id === "todo27-opencode-acceptance.tracked-stages-blocked")).toMatchObject({ ok: true })
  })

  it("writes JSON and Markdown acceptance artifacts that round-trip through the verifier", () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-todo27-opencode-acceptance-"))
    try {
      const jsonPath = join(dir, "todo27-opencode-split-acceptance.json")
      const markdownPath = join(dir, "todo27-opencode-split-acceptance.md")
      const report = buildTodo27OpenCodeSplitAcceptance({
        generatedAt: "2026-06-12T00:00:00.000Z",
      })

      writeTodo27OpenCodeSplitAcceptanceReport({ report, jsonPath, markdownPath })

      const roundTripped = JSON.parse(readFileSync(jsonPath, "utf8")) as Todo27OpenCodeSplitAcceptance
      const markdown = readFileSync(markdownPath, "utf8")
      expect(verifyTodo27OpenCodeSplitAcceptance(roundTripped).ok).toBe(true)
      expect(roundTripped.summary.fingerprint).toBe(report.summary.fingerprint)
      expect(markdown).toContain("# TODO-027 OpenCode Split Acceptance")
      expect(markdown).toContain("Status: ready-for-review")
      expect(markdown).toContain("Acceptance scope: opencode-split-review-only")
      expect(markdown).toContain("TODO completion: executable-native-parity-verified-metadata-retained")
      expect(markdown).toContain("executableNativeParityVerified=true")
      expect(markdown).toContain("prompt.assemble")
      expect(markdown).toContain("opencode.prompt.mode-builder")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("rejects reports that keep stale OpenCode Flow parity blockers after executable stages are native", () => {
    const report = buildTodo27OpenCodeSplitAcceptance({
      generatedAt: "2026-06-12T00:00:00.000Z",
    })
    const misleading: Todo27OpenCodeSplitAcceptance = {
      ...report,
      summary: {
        ...report.summary,
        status: "ready-for-review",
        parityTargetBlockedStages: 1,
        parityTargetSatisfiedStages: report.sources.flowGraph.parityTargetStages - 1,
      },
      sources: {
        ...report.sources,
        flowGraph: {
          ...report.sources.flowGraph,
          parityTargetBlockedStages: 1,
          parityTargetSatisfiedStages: report.sources.flowGraph.parityTargetStages - 1,
        },
      },
    }

    const verification = verifyTodo27OpenCodeSplitAcceptance(misleading)

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toEqual(
      expect.arrayContaining([
        "todo27-opencode-acceptance.fingerprint",
        "todo27-opencode-acceptance.executable-native-parity-verified",
        "todo27-opencode-acceptance.flow-claims-visible",
        "todo27-opencode-acceptance.status",
      ]),
    )
  })

  it("rejects reports that reinterpret split review readiness as TODO completion", () => {
    const report = buildTodo27OpenCodeSplitAcceptance({
      generatedAt: "2026-06-12T00:00:00.000Z",
    })
    const misleading: Todo27OpenCodeSplitAcceptance = {
      ...report,
      todoCompletion: {
        ...report.todoCompletion,
        completionClaim: true as unknown as false,
        nativeParityVerified: true as unknown as false,
        productNativeComplete: report.sources.inventory.transitionAtoms,
      },
      summary: {
        ...report.summary,
        status: "ready-for-review",
      },
    }

    const verification = verifyTodo27OpenCodeSplitAcceptance(misleading)

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toEqual(
      expect.arrayContaining([
        "todo27-opencode-acceptance.fingerprint",
        "todo27-opencode-acceptance.scope-not-todo-complete",
        "todo27-opencode-acceptance.status",
      ]),
    )
  })

  it("is available through the public CLI and writes verifiable report artifacts", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-todo27-opencode-acceptance-cli-"))
    try {
      const jsonPath = join(dir, "todo27-opencode-split-acceptance.json")
      const markdownPath = join(dir, "todo27-opencode-split-acceptance.md")
      const stdout: string[] = []
      const stderr: string[] = []
      const io = {
        stdout: {
          write(chunk: string) {
            stdout.push(chunk)
            return true
          },
        },
        stderr: {
          write(chunk: string) {
            stderr.push(chunk)
            return true
          },
        },
      }

      expect(await runCli(["todo27-opencode-split-acceptance", "--out", jsonPath, "--markdown", markdownPath, "--json"], io)).toBe(0)
      expect(existsSync(jsonPath)).toBe(true)
      expect(existsSync(markdownPath)).toBe(true)
      const output = JSON.parse(stdout.join("")) as { report: Todo27OpenCodeSplitAcceptance; verification: { ok: boolean } }
      expect(output.verification.ok).toBe(true)
      expect(output.report.summary.status).toBe("ready-for-review")
      expect(output.report.sources.inventory.transitionAtoms).toBe(124)
      expect(await runCli(["verify-todo27-opencode-split-acceptance", "--artifact", jsonPath, "--json"], io)).toBe(0)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
