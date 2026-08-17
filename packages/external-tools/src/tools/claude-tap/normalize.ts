import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { writeNativeCaptureArtifact } from "../../artifact-store"
import type { ExternalToolCaptureMode, ExternalToolProduct, NativeCaptureArtifact } from "../../types"
import { importClaudeTapTrace, parseClaudeTapTraceText } from "./import-jsonl"

export interface MaterializeClaudeTapNormalizedRunArtifactsInput {
  product: ExternalToolProduct
  taskID?: string
  captureMode: ExternalToolCaptureMode
  sourceToolVersion: string
  rawDir: string
  normalizedDir: string
}

export function materializeClaudeTapNormalizedRunArtifacts(input: MaterializeClaudeTapNormalizedRunArtifactsInput): void {
  const rawArtifactPath = firstRawTraceArtifact(input.rawDir)
  if (!rawArtifactPath) return
  const text = readFileSync(rawArtifactPath, "utf8")
  materializeClaudeTapRawRunArtifacts(input.rawDir, text)
  const artifact = importClaudeTapTrace({
    text,
    artifactBytes: Buffer.byteLength(text, "utf8"),
    product: input.product,
    ...(input.taskID ? { taskID: input.taskID } : {}),
    sourceToolVersion: input.sourceToolVersion,
    captureMode: input.captureMode,
  })
  writeNativeCaptureArtifact(resolve(input.normalizedDir, "native-capture.json"), artifact)
  writeFileSync(resolve(input.normalizedDir, "runtime-trace.jsonl"), runtimeTraceJSONL(artifact), "utf8")
  writeFileSync(resolve(input.normalizedDir, "prompt-snapshot.md"), promptSnapshotMarkdown(artifact), "utf8")
}

function materializeClaudeTapRawRunArtifacts(rawDir: string, text: string): void {
  const parsed = parseClaudeTapTraceText(text)
  const jsonlPath = resolve(rawDir, "trace.jsonl")
  const compactPath = resolve(rawDir, "trace.ctap.json")
  const viewerPath = resolve(rawDir, "viewer.html")
  if (!existsFile(jsonlPath)) {
    writeFileSync(jsonlPath, `${parsed.records.map((record) => JSON.stringify(record)).join("\n")}${parsed.records.length > 0 ? "\n" : ""}`, "utf8")
  }
  if (!existsFile(compactPath)) {
    writeFileSync(
      compactPath,
      `${JSON.stringify(
        {
          __claude_tap_compact_trace__: {
            version: 1,
            encoding: "json-blob-ref",
            record_count: parsed.records.length,
            blob_count: 0,
          },
          records: parsed.records,
          blobs: {},
        },
        null,
        2,
      )}\n`,
      "utf8",
    )
  }
  if (!existsFile(viewerPath)) {
    writeFileSync(viewerPath, claudeTapLocalViewerHTML(parsed.records.length), "utf8")
  }
}

function claudeTapLocalViewerHTML(recordCount: number): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>claude-tap local capture</title>
</head>
<body data-claude-tap-local-viewer="true">
  <h1>claude-tap local capture</h1>
  <p>This local-only viewer placeholder keeps raw trace files in the run directory and does not embed prompt, header, provider, or tool payloads.</p>
  <p>Records: ${recordCount}</p>
</body>
</html>
`
}

function existsFile(path: string): boolean {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

function firstRawTraceArtifact(rawDir: string): string | undefined {
  return walkFiles(rawDir)
    .filter((path) => path.endsWith(".jsonl") || path.endsWith(".ctap.json") || path.endsWith(".json"))
    .sort((left, right) => rawTracePriority(left) - rawTracePriority(right) || left.localeCompare(right))[0]
}

function rawTracePriority(path: string): number {
  if (path.endsWith(".jsonl")) return 0
  if (path.endsWith(".ctap.json")) return 1
  if (path.endsWith(".json")) return 2
  return 99
}

function runtimeTraceJSONL(artifact: NativeCaptureArtifact): string {
  const streamByRequestID = new Map(artifact.streamEvidence.map((stream) => [stream.requestID, stream]))
  return artifact.providerRequests
    .map((request) => {
      const stream = streamByRequestID.get(request.requestID)
      return JSON.stringify({
        schemaVersion: 1,
        artifactKind: "external-tool-runtime-trace-event",
        requestID: request.requestID,
        turn: request.turn,
        protocol: request.protocol,
        modelID: request.modelID,
        status: request.status,
        durationMs: request.durationMs,
        streamEvents: stream?.eventCount ?? 0,
        ...(stream?.finishReason ? { finishReason: stream.finishReason } : {}),
        requestShapeFingerprint: request.requestShape.fingerprint,
        responseShapeFingerprint: request.responseShape.fingerprint,
      })
    })
    .join("\n")
    .concat(artifact.providerRequests.length > 0 ? "\n" : "")
}

function promptSnapshotMarkdown(artifact: NativeCaptureArtifact): string {
  const lines = [
    "# External Tool Prompt Snapshot",
    "",
    `sourceTool: ${artifact.sourceTool}`,
    `sourceToolVersion: ${artifact.sourceToolVersion}`,
    `product: ${artifact.product}`,
    `taskID: ${artifact.taskID}`,
    `captureMode: ${artifact.captureMode}`,
    "",
    "Raw prompt text is not stored here. This snapshot keeps fingerprints, tool names, and message counts only.",
    "",
    ...artifact.promptEvidence.flatMap((prompt, index) => [
      `## Prompt ${index + 1}`,
      "",
      `requestID: ${prompt.requestID}`,
      `turn: ${prompt.turn}`,
      `protocol: ${prompt.protocol}`,
      `modelID: ${prompt.modelID}`,
      `messageCount: ${prompt.messageCount}`,
      `toolNames: ${prompt.toolNames.join(", ") || "none"}`,
      `systemFingerprint: ${prompt.systemFingerprint ?? "none"}`,
      `developerFingerprint: ${prompt.developerFingerprint ?? "none"}`,
      `userFingerprint: ${prompt.userFingerprint ?? "none"}`,
      `toolSchemaFingerprints: ${prompt.toolSchemaFingerprints.join(", ") || "none"}`,
      "",
    ]),
  ]
  return `${lines.join("\n")}\n`
}

function walkFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name)
    if (entry.isDirectory()) return walkFiles(path)
    return entry.isFile() ? [path] : []
  })
}
