import { describe, expect, it } from "vitest"
import { credentialFindings, hostPathFindings, verifyNativeCaptureArtifact } from "../src/index"

describe("external tool redaction", () => {
  const minimalCapture = {
    schemaVersion: 1,
    artifactKind: "external-tool-native-capture",
    generatedAt: "2026-06-14T00:00:00.000Z",
    sourceTool: "claude-tap",
    sourceToolVersion: "unknown",
    sourceArtifact: { hash: `sha256:${"0".repeat(64)}`, bytes: 1, format: "jsonl" },
    product: "pi-mono",
    taskID: "x",
    captureMode: "import-only",
    lossiness: {
      observability: "external-proxy-capture",
      rawPrompt: "fingerprint-only",
      rawProviderPayload: "shape-summary-only",
      rawToolPayload: "fingerprint-only",
      nativeInternals: "unobservable",
    },
    providerRequests: [],
    promptEvidence: [],
    toolEvidence: [],
    streamEvidence: [],
    usageEvidence: [],
    stageEvidence: [
      {
        stage: "provider",
        observability: "external-proxy-capture",
        evidenceCount: 0,
        summary: "provider request evidence",
        fingerprints: [],
      },
    ],
    summary: {
      records: 0,
      providerRequests: 0,
      promptEvidence: 0,
      toolEvidence: 0,
      streamEvents: 0,
      models: [],
      protocols: [],
      statusCodes: [],
    },
    redactionPolicy: {
      version: 1,
      containsRawPrompt: false,
      credentials: "redacted",
      hostPaths: "normalized",
    },
  }

  it("detects credential-shaped strings", () => {
    expect(credentialFindings({ token: "Bearer abcdefghijklmnopqrstuvwxyz123456" })).toContain("bearer-token")
  })

  it("detects unredacted home directory paths without flagging normalized placeholders", () => {
    expect(hostPathFindings({ path: "/home/alice/project/.env" })).toContain("unix-home-path")
    expect(hostPathFindings({ path: "/Users/alice/Library/Application Support/tool/config.json" })).toContain("unix-home-path")
    expect(hostPathFindings({ path: String.raw`C:\Users\alice\AppData\Local\tool\config.json` })).toContain("windows-home-path")
    expect(hostPathFindings({ path: "~/workspace/secret.txt" })).toContain("tilde-home-path")
    expect(hostPathFindings({ path: "<home>/workspace/project", cwd: "$HOME/project", report: "docs/reports/external-tools/native-capture.json" })).toEqual([])
  })

  it("fails artifacts that contain raw payload fields", () => {
    const verification = verifyNativeCaptureArtifact({
      ...minimalCapture,
      body: { prompt: "raw" },
    })

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("raw-payload-keys")
  })

  it("fails artifacts that contain unredacted home directory paths", () => {
    const verification = verifyNativeCaptureArtifact({
      ...minimalCapture,
      providerRequests: [{ requestID: "req", path: "/v1/responses", upstreamBaseURL: "https://api.example.test", workspace: "/home/alice/private-project" }],
    })

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("host-paths")
  })

  it("fails artifacts that contain secret-bearing header names", () => {
    const verification = verifyNativeCaptureArtifact({
      ...minimalCapture,
      authorization: "redacted",
    })

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("raw-payload-keys")
  })

  it("rejects dry-run artifacts as normalized native captures", () => {
    const verification = verifyNativeCaptureArtifact({
      ...minimalCapture,
      captureMode: "dry-run",
    })

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("capture-mode")
  })

  it("rejects malformed source artifact identity", () => {
    const verification = verifyNativeCaptureArtifact({
      ...minimalCapture,
      sourceArtifact: { hash: "sha256:not-a-real-digest", bytes: -1, format: "zip" },
    })

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toEqual(expect.arrayContaining([
      "source-artifact-hash",
      "source-artifact-format",
      "source-artifact-bytes",
    ]))
  })

  it("rejects incomplete normalized capture schema", () => {
    const verification = verifyNativeCaptureArtifact({
      ...minimalCapture,
      generatedAt: "not-a-date",
      sourceToolVersion: "",
      lossiness: { ...minimalCapture.lossiness, nativeInternals: "observable" },
      promptEvidence: undefined,
      toolEvidence: undefined,
      streamEvidence: undefined,
      usageEvidence: undefined,
      summary: { ...minimalCapture.summary, models: undefined },
    })

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toEqual(expect.arrayContaining([
      "generated-at",
      "source-tool-version",
      "lossiness-policy",
      "prompt-evidence",
      "tool-evidence",
      "stream-evidence",
      "usage-evidence",
      "summary",
    ]))
  })

  it("rejects summary counts that drift from evidence arrays", () => {
    const verification = verifyNativeCaptureArtifact({
      ...minimalCapture,
      providerRequests: [{ requestID: "req" }],
      promptEvidence: [{}],
      toolEvidence: [{}],
      streamEvidence: [{}],
      summary: {
        ...minimalCapture.summary,
        records: 999,
        providerRequests: 0,
        promptEvidence: 0,
        toolEvidence: 0,
        streamEvents: 0,
      },
    })

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("summary-counts")
  })

  it("rejects malformed redaction policy values", () => {
    const verification = verifyNativeCaptureArtifact({
      ...minimalCapture,
      redactionPolicy: {
        version: 2,
        containsRawPrompt: false,
        credentials: "available",
        hostPaths: "raw",
      },
    })

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("redaction-policy")
  })

  it("rejects summary observed values that drift from provider requests", () => {
    const verification = verifyNativeCaptureArtifact({
      ...minimalCapture,
      providerRequests: [{ requestID: "req", modelID: "gpt-test", protocol: "openai-responses", status: 200 }],
      summary: {
        ...minimalCapture.summary,
        providerRequests: 1,
        models: ["wrong-model"],
        protocols: ["wrong-protocol"],
        statusCodes: [500],
      },
    })

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("summary-observed-values")
  })

  it("rejects malformed provider request evidence entries", () => {
    const verification = verifyNativeCaptureArtifact({
      ...minimalCapture,
      providerRequests: [
        {
          requestID: "req",
          turn: 0,
          method: "",
          path: "/v1/responses",
          protocol: "openai-responses",
          modelID: "gpt-test",
          status: 200,
          durationMs: 0,
          requestShape: { type: "object", fingerprint: "not-a-sha", keys: [] },
          responseShape: { type: "object", fingerprint: `sha256:${"1".repeat(64)}`, keys: [] },
        },
      ],
      summary: {
        ...minimalCapture.summary,
        providerRequests: 1,
        models: ["gpt-test"],
        protocols: ["openai-responses"],
        statusCodes: [200],
      },
    })

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("provider-request-shape")
  })

  it("rejects malformed prompt evidence entries", () => {
    const verification = verifyNativeCaptureArtifact({
      ...minimalCapture,
      promptEvidence: [
        {
          requestID: "req",
          turn: -1,
          protocol: "openai-responses",
          modelID: "gpt-test",
          userFingerprint: "not-a-sha",
          toolNames: ["bash"],
          toolSchemaFingerprints: ["not-a-sha"],
          messageCount: -1,
        },
      ],
      summary: {
        ...minimalCapture.summary,
        promptEvidence: 1,
      },
    })

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("prompt-evidence-shape")
  })

  it("rejects malformed tool evidence entries", () => {
    const verification = verifyNativeCaptureArtifact({
      ...minimalCapture,
      toolEvidence: [
        {
          requestID: "req",
          turn: 0,
          source: "raw-tool-call",
          toolName: "",
          argumentFingerprint: "not-a-sha",
          order: -1,
        },
      ],
      summary: {
        ...minimalCapture.summary,
        toolEvidence: 1,
      },
    })

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("tool-evidence-shape")
  })

  it("rejects malformed stream evidence entries", () => {
    const verification = verifyNativeCaptureArtifact({
      ...minimalCapture,
      streamEvidence: [
        {
          requestID: "",
          turn: -1,
          protocol: "",
          eventCount: -1,
          reconstructedResponse: {
            eventTypes: ["message", 1],
            chunkTypes: [""],
            textBytes: -1,
            textFingerprint: "not-a-sha",
            toolCallCount: -1,
            toolArgumentBytes: -1,
            semanticFingerprint: "not-a-sha",
          },
          responseFingerprint: "not-a-sha",
        },
      ],
    })

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("stream-evidence-shape")
  })

  it("rejects malformed usage evidence entries", () => {
    const verification = verifyNativeCaptureArtifact({
      ...minimalCapture,
      usageEvidence: [
        {
          requestID: "",
          turn: -1,
          inputTokens: -1,
          outputTokens: -1,
          cacheReadTokens: -1,
          cacheCreateTokens: -1,
          totalTokens: -1,
        },
      ],
    })

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("usage-evidence-shape")
  })

  it("rejects malformed stage evidence entries", () => {
    const verification = verifyNativeCaptureArtifact({
      ...minimalCapture,
      stageEvidence: [
        {
          stage: "provider",
          observability: "raw-native-internals",
          evidenceCount: -1,
          summary: "",
          fingerprints: ["not-a-sha"],
        },
      ],
    })

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("stage-evidence-shape")
  })

  it("rejects stage evidence counts that drift from observed evidence", () => {
    const verification = verifyNativeCaptureArtifact({
      ...minimalCapture,
      stageEvidence: [
        {
          stage: "provider",
          observability: "external-proxy-capture",
          evidenceCount: 1,
          summary: "provider request evidence",
          fingerprints: [],
        },
      ],
    })

    expect(verification.ok).toBe(false)
    expect(verification.issues.map((issue) => issue.id)).toContain("stage-evidence-counts")
  })
})
