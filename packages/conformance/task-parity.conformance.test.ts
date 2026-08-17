import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  createProductTaskNativeCadenceFixtureSet,
  createProductTaskNativeCadenceFixtureSplitSet,
  createProductTaskParityArtifact,
  createProductTaskParitySplitArtifactSet,
  diagnoseProductTaskCadenceArtifact,
  diffProductTaskParityArtifacts,
  formatProductTaskCadenceDiagnosis,
  replayProductTaskNativeCadenceFixture,
  productTaskCadenceDescriptors,
  productTaskRunnerDescriptors,
  runProductTaskParity,
  runProductTaskParitySuite,
  verifyProductTaskNativeCadenceFixtureSet,
  verifyProductTaskParityArtifact,
  writeProductTaskNativeCadenceFixtureSplitSet,
  writeProductTaskParityArtifact,
  writeProductTaskParitySplitArtifactSet,
  readProductTaskParitySplitArtifactSet,
  type ProductTaskParityArtifact,
  type ProductTaskParityExternalCaptureInput,
} from "@helix/recipes"

const conformanceProducts = ["opencode", "pi-mono", "nanobot", "hermes-agent"] as const
const credentialLeakPattern = /bearer\s+[a-z0-9._-]{12,}|secret-token|\bsk-[a-z0-9]/i

describe("product task parity", () => {
  it("runs deterministic task parity for OpenCode, Pi, Nanobot, and Hermes assembled/original paths", async () => {
    const expectedTaskIDs = [
      "branch-or-fork",
      "context-compaction",
      "extension-plugin-tool",
      "multi-file-refactor",
      "permission-denied",
      "provider-retry",
      "read-only-answer",
      "shell-output-analysis",
      "single-file-edit",
      "test-fix",
      "tool-error-retry",
      "ui-or-cli-command",
    ]
    const artifact = await runProductTaskParitySuite({
      suite: "smoke",
      provider: "cassette",
      products: [...conformanceProducts],
      modes: ["assembled", "original"],
    })

    expect([...new Set(artifact.reports.map((report) => report.taskID))].sort()).toEqual(expectedTaskIDs)
    expect(artifact.reports).toHaveLength(96)
    expect(artifact.pairs).toHaveLength(48)
    expect(artifact.summary).toMatchObject({ reports: 96, gapsFound: 0, failed: 0 })
    expect(artifact.reports.map((report) => `${report.product}:${report.mode}`)).toEqual(
      expect.arrayContaining([
        "opencode:assembled",
        "opencode:original",
        "pi-mono:assembled",
        "pi-mono:original",
        "nanobot:assembled",
        "nanobot:original",
        "hermes-agent:assembled",
        "hermes-agent:original",
      ]),
    )
    expect(artifact.reports.every((report) => report.status === "matched" || report.status === "acceptable-drift")).toBe(true)
    expect(artifact.reports.every((report) => report.traceEvidence.events > 0)).toBe(true)
    expect(artifact.reports.every((report) => report.cadenceEvidence.level === "exact-cadence")).toBe(true)
    expect(artifact.reports.every((report) => report.observationShape.providerBoundary.visibility !== "none")).toBe(true)
    expect(artifact.reports.every((report) => report.acceptanceTimingEvidence.timeline.policySatisfiedAt !== "unavailable")).toBe(true)
    expect(artifact.reports.every((report) => report.fixtureReplay.verified)).toBe(true)
    expect(artifact.reports.every((report) => report.productEvidence.recipeID.length > 0)).toBe(true)
    expect(artifact.pairs.every((pair) => pair.outputParity && pair.artifactParity && pair.traceParity && pair.policyParity)).toBe(true)
    expect(artifact.pairs.every((pair) => pair.cadenceParity && pair.cadenceScore === 100 && pair.cadenceDrifts.length === 0)).toBe(true)
    expect(
      artifact.pairs.every(
        (pair) =>
          pair.acceptanceTimingDrifts.length === 1 &&
          pair.acceptanceTimingDrifts.every(
            (drift) =>
              drift.category === "acceptance.full-native-timing-unverified" &&
              drift.owningPlane === "runtime" &&
              drift.owningAtomID.endsWith(".runtime.acceptance-controller.native-like") &&
              drift.blockingLevel === "informational" &&
              drift.requiresNativeFixture &&
              drift.evidenceRefs.includes(`runtime-acceptance-replay:${pair.product}:acceptance-controller`) &&
              drift.evidenceRefs.includes(`runtime-acceptance-timing-boundary:${pair.product}`) &&
              drift.evidenceRefs.includes(`runtime-acceptance-lifecycle:${pair.product}`) &&
              drift.evidenceRefs.includes(`runtime-acceptance-persistence-cleanup:${pair.product}`) &&
              drift.lossinessRefs.includes("full-upstream-stop-continue-timing-not-replayed") &&
              drift.lossinessRefs.includes("partial-runtime-acceptance-timing-boundary") &&
              drift.lossinessRefs.includes("partial-runtime-acceptance-lifecycle") &&
              drift.lossinessRefs.includes("partial-runtime-acceptance-persistence-cleanup") &&
              drift.lossinessRefs.includes("cleanup-side-effect-order-not-full-native") &&
              Boolean(drift.assembled.satisfiedAt) &&
              Boolean(drift.original.satisfiedAt),
          ),
      ),
    ).toBe(true)
    expect(
      artifact.pairs.every(
        (pair) =>
          pair.cadenceScoreBreakdown.modelVersion === 2 &&
          pair.cadenceScoreBreakdown.targetScore === 100 &&
          pair.cadenceScoreBreakdown.rawDriftCount === 0,
      ),
    ).toBe(true)
    expect(
      artifact.reports.find((report) => report.taskID === "provider-retry" && report.product === "opencode" && report.mode === "assembled")
        ?.costLatency.retries,
    ).toBeGreaterThanOrEqual(1)
    expect(
      artifact.reports.find((report) => report.taskID === "context-compaction" && report.product === "pi-mono" && report.mode === "assembled")
        ?.costLatency.contextCompacted,
    ).toBe(true)
    expect(
      artifact.reports.find((report) => report.taskID === "branch-or-fork" && report.product === "nanobot" && report.mode === "assembled")
        ?.sessionEvidence.forked,
    ).toBe(true)
    expect(
      artifact.reports.find((report) => report.taskID === "permission-denied" && report.product === "opencode" && report.mode === "assembled")
        ?.toolEvidence.results,
    ).toEqual(expect.arrayContaining([expect.objectContaining({ toolName: "write", isError: true })]))
  }, 30000)

  it("captures concrete workspace diffs for edit tasks", async () => {
    const report = await runProductTaskParity({
      taskID: "single-file-edit",
      product: "pi-mono",
      mode: "assembled",
      provider: "cassette",
    })

    expect(report.status).toBe("matched")
    expect(report.workspaceDiff).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "src/greeting.ts",
          status: "modified",
          after: expect.stringContaining("Hello from lego"),
        }),
      ]),
    )
    expect(report.toolEvidence.calls).toEqual(expect.arrayContaining([expect.objectContaining({ toolName: "edit", status: "completed" })]))
  })

  it("exposes opt-in native CLI original runner prerequisites separately from contract replay", async () => {
    for (const product of conformanceProducts) {
      const report = await runProductTaskParity({
        taskID: "read-only-answer",
        product,
        mode: "original",
        provider: "live",
        native: {
          enabled: true,
          requireCredentials: true,
          env: {},
        },
      })

      expect(report.runner).toMatchObject({
        id: "task.runner.native-cli",
        evidence: "native-cli",
        nativeAvailable: true,
      })
      expect(report.productEvidence.nativeAdapter).toBe("native-cli")
      expect(report.status).toBe("failed")
      expect(report.checks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "task.runner.native-credentials",
            ok: false,
          }),
        ]),
      )
    }
  })

  it("uses external capture artifacts as original task parity references", async () => {
    const externalCapture: ProductTaskParityExternalCaptureInput = {
      generatedAt: "2026-06-14T00:00:00.000Z",
      sourceTool: "claude-tap",
      sourceToolVersion: "0.1.114",
      sourceArtifact: {
        format: "jsonl",
        hash: "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        bytes: 128,
      },
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
      providerRequests: [{ requestID: "req-external-1", modelID: "gpt-test", status: 200, durationMs: 42 }],
      promptEvidence: [{ requestID: "req-external-1", messageCount: 1, toolNames: ["read"] }],
      toolEvidence: [{ requestID: "req-external-1", source: "request-schema", toolName: "read", argumentFingerprint: "sha256:tool", order: 0 }],
      streamEvidence: [{ requestID: "req-external-1", eventCount: 0, finishReason: "completed" }],
      stageEvidence: [{ stage: "provider", observability: "external-proxy-capture", evidenceCount: 1 }],
      summary: {
        records: 1,
        providerRequests: 1,
        promptEvidence: 1,
        toolEvidence: 1,
        streamEvents: 0,
        models: ["gpt-test"],
      },
    }
    const report = await runProductTaskParity({
      taskID: "read-only-answer",
      product: "pi-mono",
      mode: "original",
      native: { externalCapture },
    })
    const artifact = createProductTaskParityArtifact({ suite: "unit", provider: "fixture", reports: [report] })

    expect(report.status).toBe("acceptable-drift")
    expect(report.runner).toMatchObject({
      id: "task.runner.external-capture",
      evidence: "external-tool-capture",
      externalCapture: {
        sourceTool: "claude-tap",
        captureMode: "import-only",
      },
    })
    expect(report.productEvidence.nativeAdapter).toBe("external-tool-capture")
    expect(report.observationShape.workspace.lossiness).toBe("unobservable")
    expect(report.fixtureReplay).toMatchObject({ source: "external-tool-capture", verified: true })
    expect(report.cadenceEvidence.providerRequests[0]).toMatchObject({ source: "external-tool-capture", boundaryEvidence: "cli-event" })
    expect(verifyProductTaskParityArtifact({ artifact, expectedProducts: ["pi-mono"], expectedModes: ["original"], expectedTaskIDs: ["read-only-answer"] })).toMatchObject({
      ok: true,
      issues: [],
    })
  })

  it("freezes task runner submodules, including reserved native server/RPC runner shape", () => {
    for (const product of conformanceProducts) {
      const descriptors = productTaskRunnerDescriptors(product)

      expect(descriptors.map((descriptor) => descriptor.id)).toEqual([
        "task.runner.assembled",
        "task.runner.native-cli",
        "task.runner.external-capture",
        "task.runner.native-server",
      ])
      expect(descriptors.find((descriptor) => descriptor.id === "task.runner.external-capture")).toMatchObject({
        evidence: ["external-tool-capture"],
        products: [product],
        supported: true,
        required: false,
      })
      expect(descriptors.find((descriptor) => descriptor.id === "task.runner.native-server")).toMatchObject({
        evidence: ["native-server"],
        products: [product],
        supported: false,
        required: false,
      })
      const nativeCli = descriptors.find((descriptor) => descriptor.id === "task.runner.native-cli")
      if (product === "opencode") {
        expect(nativeCli).toMatchObject({
          parityCoverage: "native",
          fixtureIDs: expect.arrayContaining(["task-parity-live:opencode:read-only-answer:native-cli"]),
          nativeEvidenceRefs: expect.arrayContaining([
            "artifact:docs/reports/task-parity-live-opencode-smoke.json#opencode:original:read-only-answer:native-cli",
            "upstream:npm:opencode-ai@1.15.11:bin/opencode.exe",
          ]),
          knownLossiness: [],
        })
      } else {
        expect(nativeCli?.parityCoverage).toBeUndefined()
      }

      expect(productTaskCadenceDescriptors(product)).toEqual([
        expect.objectContaining({ id: `${product}.turn.cadence-emitter`, plane: "turn", product, provides: "cadence.emitter" }),
        expect.objectContaining({ plane: "trace", product, provides: "cadence.projector" }),
      ])
    }
  })

  it("verifies and diffs offline artifacts without credential-shaped fields", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-task-parity-"))
    const out = join(dir, "task-parity.json")
    try {
      const artifact = await runProductTaskParitySuite({
        taskIDs: ["read-only-answer"],
        products: ["opencode"],
        modes: ["assembled", "original"],
        provider: "cassette",
      })
      writeProductTaskParityArtifact(out, artifact)
      const archived = JSON.parse(readFileSync(out, "utf8")) as ProductTaskParityArtifact
      const verification = verifyProductTaskParityArtifact({
        artifact: archived,
        expectedProducts: ["opencode"],
        expectedModes: ["assembled", "original"],
        expectedTaskIDs: ["read-only-answer"],
      })

      expect(verification.ok).toBe(true)
      expect(verification.issues).toEqual([])
      expect(readFileSync(out, "utf8")).not.toMatch(credentialLeakPattern)
      expect(diffProductTaskParityArtifacts(artifact, archived)).toEqual({ ok: true, changed: [] })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("writes and verifies split v2 task parity artifacts with hashed attachments", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-task-parity-split-"))
    try {
      const artifact = await runProductTaskParitySuite({
        taskIDs: ["read-only-answer"],
        products: [...conformanceProducts],
        modes: ["assembled", "original"],
        provider: "cassette",
      })
      const split = createProductTaskParitySplitArtifactSet({
        artifact,
        generatedAt: new Date("2026-05-30T00:00:00.000Z"),
        command: "test split artifact",
      })
      writeProductTaskParitySplitArtifactSet({ outDir: dir, artifactSet: split, summaryOut: join(dir, "task-parity-summary.json") })
      const reread = readProductTaskParitySplitArtifactSet(join(dir, "summary.json"))
      const verification = verifyProductTaskParityArtifact({
        artifact: reread,
        expectedProducts: [...conformanceProducts],
        expectedModes: ["assembled", "original"],
        expectedTaskIDs: ["read-only-answer"],
      })

      expect(split.summary.schemaVersion).toBe(2)
      expect(split.summary.summary.semanticParity).toBe(true)
      expect(split.summary.pairs.every((pair) => typeof pair.taskSuccessParity === "boolean" && typeof pair.strictCadenceParity === "boolean")).toBe(true)
      expect(split.summary.pairs.every((pair) => pair.acceptanceTimingDrifts === 1)).toBe(true)
      expect(split.evidence.reports.filter((report) => report.mode === "assembled").every((report) => report.acceptanceTimingDrifts.length === 0)).toBe(true)
      expect(split.evidence.reports.filter((report) => report.mode === "original").every((report) => report.acceptanceTimingDrifts.length === 1)).toBe(true)
      expect(split.summary.attachments.length).toBeGreaterThan(0)
      expect(split.summary.attachments.every((attachment) => attachment.sha256.length === 64 && attachment.byteSize > 0)).toBe(true)
      expect(new Set(split.manifest.attachments.map((attachment) => attachment.path)).size).toBe(split.manifest.attachments.length)
      expect(readFileSync(join(dir, "summary.json"), "utf8")).not.toContain('"reports": [')
      expect(readFileSync(join(dir, "manifest.json"), "utf8")).toContain("attachments/")
      expect(verification.ok).toBe(true)
      expect(verification.issues).toEqual([])

      const longTaskArtifact = structuredClone(artifact)
      for (const report of longTaskArtifact.reports) report.taskID = "livecodebench-1883-b-palindrome-removal"
      for (const pair of longTaskArtifact.pairs) pair.taskID = "livecodebench-1883-b-palindrome-removal"
      const longTaskSplit = createProductTaskParitySplitArtifactSet({ artifact: longTaskArtifact, generatedAt: new Date("2026-05-30T00:00:00.000Z") })
      const longTaskPaths = longTaskSplit.manifest.attachments.map((attachment) => attachment.path)
      expect(new Set(longTaskPaths).size).toBe(longTaskPaths.length)
      expect(longTaskPaths).toEqual(
        expect.arrayContaining([
          expect.stringContaining("opencode-assembled"),
          expect.stringContaining("opencode-original"),
          expect.stringContaining("pi-mono-assembled"),
          expect.stringContaining("pi-mono-original"),
          expect.stringContaining("nanobot-assembled"),
          expect.stringContaining("nanobot-original"),
          expect.stringContaining("hermes-agent-assembled"),
          expect.stringContaining("hermes-agent-original"),
        ]),
      )

      const tampered = structuredClone(reread)
      tampered.attachments[0]!.content = { tampered: true }
      expect(verifyProductTaskParityArtifact({ artifact: tampered }).issues.map((issue) => issue.id).join("\n")).toContain("artifact.attachment.hash")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("rejects stale pair gaps and missing cadence fields without throwing", async () => {
    const base = await runProductTaskParitySuite({
      taskIDs: ["read-only-answer"],
      products: ["opencode"],
      modes: ["assembled", "original"],
      provider: "cassette",
    })
    const staleReports = structuredClone(base.reports).map((report) => {
      const stale = report as unknown as Record<string, unknown>
      delete stale["cadenceEvidence"]
      delete stale["observationShape"]
      delete stale["acceptanceTimingEvidence"]
      delete stale["fixtureReplay"]
      return stale
    })
    const staleArtifact = {
      ...base,
      provider: "live",
      reports: staleReports,
      pairs: [
        {
          taskID: "read-only-answer",
          product: "opencode",
          status: "gaps-found",
          outputParity: false,
          artifactParity: true,
          traceParity: false,
          policyParity: false,
          costLatencyParity: false,
          gaps: [],
        },
      ],
      summary: { reports: 2, matched: 1, acceptableDrift: 1, gapsFound: 0, failed: 0 },
    }

    expect(() => verifyProductTaskParityArtifact({ artifact: staleArtifact })).not.toThrow()
    const verification = verifyProductTaskParityArtifact({ artifact: staleArtifact })

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toEqual(
      expect.arrayContaining([
        "artifact.pair-status-consistent",
        "artifact.cadence.report-evidence",
        "artifact.observation-shape",
        "artifact.cadence.pair-evidence",
        "artifact.acceptance-timing.pair-evidence",
        "artifact.cadence.score-breakdown",
        "artifact.cadence.drift-metadata",
        "artifact.acceptance-timing.drift-metadata",
      ]),
    )
  })

  it("diagnoses cadence drift ownership and candidate fixes from archived artifacts", () => {
    const artifact = {
      schemaVersion: 1,
      generatedAt: "2026-05-29T00:00:00.000Z",
      suite: "livecodebench",
      provider: "live",
      reports: [],
      summary: { reports: 2, matched: 2, acceptableDrift: 0, gapsFound: 0, failed: 0 },
      pairs: [
        {
          taskID: "sample",
          product: "pi-mono",
          status: "acceptable-drift",
          outputParity: true,
          artifactParity: true,
          traceParity: true,
          policyParity: true,
          cadenceParity: false,
          cadenceScore: 84,
          cadenceLevel: "semantic-cadence",
          cadenceScoreBreakdown: {
            modelVersion: 2,
            rawDriftCount: 1,
            weightedPenalty: 16,
            targetScore: 70,
            items: [
              {
                id: "cadence.tool-batch:assembled=read|edit:original=read/edit",
                category: "cadence.tool-batch",
                weight: 16,
                appliedPenalty: 16,
                owningPlane: "tool",
                blockingLevel: "score-impacting",
                comparisonConfidence: "exact",
                scoringMode: "strict",
              },
            ],
          },
          cadenceDrifts: [
            {
              id: "cadence.tool-batch:assembled=read|edit:original=read/edit",
              category: "cadence.tool-batch",
              message: "Tool batch signature differs.",
              assembled: "read|edit",
              original: "read/edit",
              owner: "product-cadence-atom",
              nextAction: "adjust-personality-adapter",
              metadata: {
                blockingLevel: "score-impacting",
                owningPlane: "tool",
                owningAtomID: "pi.tools.batch-scheduler.native-like",
                candidateFixes: ["Tune Pi native-like tool batch scheduler."],
                expectedScoreDelta: 12,
                requiresNativeFixture: false,
                observability: {
                  assembledVisibility: "observed",
                  originalVisibility: "observed",
                  comparisonConfidence: "exact",
                  scoringMode: "strict",
                  lossinessRefs: ["toolLifecycle:lossless:call-result"],
                },
                reproduction: {
                  assembledRequestCount: 2,
                  originalRequestCount: 2,
                  assembledToolSequence: ["read", "edit"],
                  originalToolSequence: ["read", "edit"],
                  assembledBatchSignature: ["read|edit"],
                  originalBatchSignature: ["read", "edit"],
                  assembledPartTypes: ["text", "tool_call", "tool_result"],
                  originalPartTypes: ["text", "tool_call", "tool_result"],
                  assembledStopReasons: ["tool_calls", "stop"],
                  originalStopReasons: ["tool_calls", "stop"],
                },
              },
            },
          ],
        },
      ],
    } as unknown as ProductTaskParityArtifact

    const diagnosis = diagnoseProductTaskCadenceArtifact(artifact, { generatedAt: new Date("2026-05-29T00:00:00.000Z") })
    const markdown = formatProductTaskCadenceDiagnosis(diagnosis)

    expect(diagnosis.products[0]?.drifts[0]).toMatchObject({
      owningPlane: "tool",
      owningAtomID: "pi.tools.batch-scheduler.native-like",
      candidateFixes: ["Tune Pi native-like tool batch scheduler."],
    })
    expect(markdown).toContain("cadence.tool-batch:assembled=read|edit:original=read/edit")
    expect(markdown).toContain("pi.tools.batch-scheduler.native-like")
  })

  it("uses provider boundary observability before assigning request-count drift to the common loop", async () => {
    const base = await runProductTaskParitySuite({
      taskIDs: ["read-only-answer"],
      products: ["opencode"],
      modes: ["assembled", "original"],
      provider: "cassette",
    })
    const reports = structuredClone(base.reports)
    const original = reports.find((report) => report.mode === "original")
    if (!original) throw new Error("missing original report")
    original.cadenceEvidence = {
      ...original.cadenceEvidence,
      providerRequests: [
        {
          index: 0,
          modelID: original.providerEvidence.modelID,
          toolCallCount: 0,
          eventCount: original.traceEvidence.events,
          source: "native-cli",
          visibility: "aggregated",
          boundaryEvidence: "cli-event",
        },
      ],
      costShape: {
        ...original.cadenceEvidence.costShape,
        providerRequests: original.cadenceEvidence.costShape.providerRequests + 1,
      },
    }
    const aggregatedArtifact = createProductTaskParityArtifact({ suite: "unit", provider: "cassette", reports })
    const aggregatedDrift = aggregatedArtifact.pairs[0]?.cadenceDrifts.find((drift) => drift.category === "cadence.provider-request-count")

    expect(aggregatedDrift).toMatchObject({
      owner: "native-projector",
      metadata: {
        blockingLevel: "informational",
        observability: expect.objectContaining({ originalVisibility: "aggregated", scoringMode: "informational" }),
      },
    })

    original.cadenceEvidence = {
      ...original.cadenceEvidence,
      providerRequests: original.cadenceEvidence.providerRequests.map((request) => ({ ...request, visibility: "observed" as const })),
    }
    const observedArtifact = createProductTaskParityArtifact({ suite: "unit", provider: "cassette", reports })
    const observedDrift = observedArtifact.pairs[0]?.cadenceDrifts.find((drift) => drift.category === "cadence.provider-request-count")

    expect(observedDrift).toMatchObject({
      owner: "common-loop",
      metadata: {
        observability: expect.objectContaining({ originalVisibility: "observed", scoringMode: "strict" }),
      },
    })
  })

  it("splits native cadence fixtures from live nondeterminism artifacts", async () => {
    const artifact = await runProductTaskParitySuite({
      taskIDs: ["read-only-answer"],
      products: [...conformanceProducts],
      modes: ["assembled", "original"],
      provider: "cassette",
    })
    const fixtureSet = createProductTaskNativeCadenceFixtureSet({
      artifact,
      generatedAt: new Date("2026-05-29T00:00:00.000Z"),
    })
    const verification = verifyProductTaskNativeCadenceFixtureSet(fixtureSet)

    expect(fixtureSet.fixtures).toHaveLength(4)
    expect(fixtureSet.fixtures.map((fixture) => fixture.product).sort()).toEqual(["hermes-agent", "nanobot", "opencode", "pi-mono"])
    expect(fixtureSet.fixtures.every((fixture) => fixture.fixtureVersion === 1 && fixture.redactionSummary.credentials === "redacted")).toBe(true)
    expect(fixtureSet.fixtures.every((fixture) => fixture.observationShape.providerBoundary.visibility !== "none")).toBe(true)
    expect(fixtureSet.fixtures.every((fixture) => fixture.nativeEvents.length > 0 && fixture.nativeChunks.length > 0)).toBe(true)
    expect(fixtureSet.fixtures.every((fixture) => fixture.messageParts.length > 0 && Array.isArray(fixture.projectionLosses))).toBe(true)
    expect(fixtureSet.fixtures.every((fixture) => fixture.projectionLosses.some((loss) => loss.field === "providerRawFrame" && loss.reason.includes("raw-frame evidence")))).toBe(true)
    expect(fixtureSet.fixtures.every((fixture) => fixture.projectionLosses.some((loss) => loss.field === "providerRawPayload" && loss.reason.includes("raw payload round-trip evidence")))).toBe(true)
    expect(fixtureSet.fixtures.every((fixture) => fixture.projectionLosses.some((loss) => loss.field === "providerTiming" && loss.lossiness === "inferred"))).toBe(true)
    expect(verification.ok).toBe(true)
    expect(verification.issues).toEqual([])
    expect(replayProductTaskNativeCadenceFixture(fixtureSet.fixtures[0]!).costShape.providerRequests).toBe(
      fixtureSet.fixtures[0]!.cadenceSignature.costShape.providerRequests,
    )
    expect(JSON.stringify(fixtureSet)).not.toMatch(new RegExp(`${credentialLeakPattern.source}|/tmp/helix-`, "i"))
  })

  it("writes native cadence fixtures as split v2 summaries plus replay attachments", async () => {
    const dir = mkdtempSync(join(tmpdir(), "helix-native-cadence-split-"))
    try {
      const artifact = await runProductTaskParitySuite({
        taskIDs: ["read-only-answer"],
        products: ["nanobot"],
        modes: ["assembled", "original"],
        provider: "cassette",
      })
      const fixtureSet = createProductTaskNativeCadenceFixtureSet({ artifact })
      const split = createProductTaskNativeCadenceFixtureSplitSet({ fixtureSet, generatedAt: new Date("2026-05-30T00:00:00.000Z") })
      writeProductTaskNativeCadenceFixtureSplitSet({ outDir: dir, fixtureSet: split })
      const verification = verifyProductTaskNativeCadenceFixtureSet(split)

      expect(split.summary.schemaVersion).toBe(2)
      expect(split.summary.fixtures).toEqual([expect.objectContaining({ product: "nanobot", attachment: expect.objectContaining({ sha256: expect.any(String) }) })])
      expect(verification.ok).toBe(true)
      expect(readFileSync(join(dir, "summary.json"), "utf8")).not.toContain('"nativeEvents"')
      expect(readFileSync(join(dir, "manifest.json"), "utf8")).toContain("attachments/")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
