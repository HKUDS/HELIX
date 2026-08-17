import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { importClaudeTapTrace, parseClaudeTapTraceText, verifyNativeCaptureArtifact } from "../src/index"

describe("claude-tap importer", () => {
  it("normalizes JSONL traces into safe native capture evidence", () => {
    const text = readFileSync(resolve("external-tools/claude-tap/fixtures/minimal-jsonl.trace.jsonl"), "utf8")
    const artifact = importClaudeTapTrace({
      text,
      artifactBytes: Buffer.byteLength(text),
      product: "pi-mono",
      taskID: "read-only-answer",
      sourceToolVersion: "0.1.114",
    })

    expect(artifact.summary.records).toBe(1)
    expect(artifact.summary.models).toEqual(["gpt-test"])
    expect(artifact.providerRequests[0]?.protocol).toBe("openai-responses")
    expect(artifact.providerRequests[0]?.requestHeaderSummary).toMatchObject({
      count: 1,
      names: ["authorization"],
      redactedNames: ["authorization"],
    })
    expect(artifact.providerRequests[0]?.responseHeaderSummary).toMatchObject({
      count: 1,
      names: ["content-type"],
      redactedNames: [],
    })
    expect(artifact.promptEvidence[0]?.toolNames).toEqual(["bash"])
    expect(JSON.stringify(artifact)).not.toContain("Reply OK")
    expect(JSON.stringify(artifact)).not.toContain("You are Pi")
    expect(JSON.stringify(artifact)).not.toContain("***")
    expect(verifyNativeCaptureArtifact(artifact).ok).toBe(true)
    expect(verifyNativeCaptureArtifact({ ...artifact, product: "nanobot" }).issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "product-supported" })]),
    )
  })

  it("materializes minimal compact traces", () => {
    const text = readFileSync(resolve("external-tools/claude-tap/fixtures/minimal-compact.trace.ctap.json"), "utf8")
    const parsed = parseClaudeTapTraceText(text)

    expect(parsed.format).toBe("compact")
    expect(parsed.records).toHaveLength(1)
    expect(parsed.records[0]?.request).toBeTruthy()
  })

  it("normalizes compact traces into verified native capture evidence", () => {
    const text = readFileSync(resolve("external-tools/claude-tap/fixtures/minimal-compact.trace.ctap.json"), "utf8")
    const artifact = importClaudeTapTrace({
      text,
      artifactBytes: Buffer.byteLength(text),
      product: "opencode",
      taskID: "compact-import-smoke",
      sourceToolVersion: "0.1.114",
    })

    expect(artifact.sourceArtifact.format).toBe("compact")
    expect(artifact.summary.records).toBe(1)
    expect(artifact.providerRequests[0]).toMatchObject({
      requestID: "req_compact_fixture_1",
      protocol: "anthropic-messages",
      modelID: "claude-test",
      status: 200,
    })
    expect(artifact.promptEvidence[0]?.toolNames).toEqual(["read"])
    expect(artifact.usageEvidence[0]).toMatchObject({ inputTokens: 10, outputTokens: 2 })
    expect(JSON.stringify(artifact)).not.toContain("Reply OK")
    expect(JSON.stringify(artifact)).not.toContain("You are OpenCode")
    expect(verifyNativeCaptureArtifact(artifact).ok).toBe(true)
  })

  it("normalizes OpenAI Chat Completions prompts, tools, and usage without raw payloads", () => {
    const text = JSON.stringify({
      records: [
        {
          timestamp: "2026-06-14T00:00:00.000Z",
          request_id: "req_chat_1",
          turn: 1,
          duration_ms: 33,
          request: {
            method: "POST",
            path: "/v1/chat/completions",
            body: {
              model: "gpt-chat-test",
              messages: [
                { role: "system", content: "You are a chat agent." },
                { role: "user", content: "Use the search tool for private prompt text." },
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "search",
                    parameters: { type: "object", properties: { q: { type: "string" } } },
                  },
                },
              ],
            },
          },
          response: {
            status: 200,
            body: {
              choices: [
                {
                  message: {
                    role: "assistant",
                    tool_calls: [
                      {
                        id: "call_chat_1",
                        type: "function",
                        function: { name: "search", arguments: "{\"q\":\"private search query\"}" },
                      },
                    ],
                  },
                  finish_reason: "tool_calls",
                },
              ],
              usage: { prompt_tokens: 20, completion_tokens: 5, total_tokens: 25 },
            },
          },
        },
      ],
    })
    const artifact = importClaudeTapTrace({
      text,
      artifactBytes: Buffer.byteLength(text),
      product: "opencode",
      taskID: "chat-completions-smoke",
      sourceToolVersion: "0.1.114",
    })

    expect(artifact.providerRequests[0]).toMatchObject({
      requestID: "req_chat_1",
      protocol: "openai-chat-completions",
      modelID: "gpt-chat-test",
      status: 200,
    })
    expect(artifact.promptEvidence[0]?.toolNames).toEqual(["search"])
    expect(artifact.toolEvidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: "request-schema", toolName: "search" }),
      expect.objectContaining({ source: "response-call", toolName: "search", callID: "call_chat_1" }),
    ]))
    expect(artifact.usageEvidence[0]).toMatchObject({ inputTokens: 20, outputTokens: 5, totalTokens: 25 })
    expect(JSON.stringify(artifact)).not.toContain("private prompt text")
    expect(JSON.stringify(artifact)).not.toContain("private search query")
    expect(verifyNativeCaptureArtifact(artifact).ok).toBe(true)
  })

  it("normalizes Gemini streamGenerateContent prompts, function calls, and usage aliases", () => {
    const text = JSON.stringify({
      records: [
        {
          timestamp: "2026-06-14T00:00:00.000Z",
          request_id: "req_gemini_1",
          turn: 1,
          duration_ms: 44,
          request: {
            method: "POST",
            path: "/v1beta/models/gemini-2.5-test:streamGenerateContent",
            body: {
              system_instruction: { parts: [{ text: "You are Gemini." }] },
              contents: [
                { role: "user", parts: [{ text: "Reply with a private function call." }] },
              ],
              tools: [
                {
                  functionDeclarations: [
                    { name: "lookup", parameters: { type: "object", properties: { q: { type: "string" } } } },
                  ],
                },
              ],
            },
          },
          response: {
            status: 200,
            body: {
              candidates: [
                {
                  content: {
                    parts: [
                      { functionCall: { name: "lookup", args: { q: "private gemini query" } } },
                      { text: "private gemini text" },
                    ],
                  },
                  finishReason: "STOP",
                },
              ],
              usageMetadata: {
                promptTokenCount: 11,
                candidatesTokenCount: 3,
                totalTokenCount: 14,
                cachedContentTokenCount: 2,
              },
            },
          },
        },
      ],
    })
    const artifact = importClaudeTapTrace({
      text,
      artifactBytes: Buffer.byteLength(text),
      product: "hermes-agent",
      taskID: "gemini-smoke",
      sourceToolVersion: "0.1.114",
    })

    expect(artifact.providerRequests[0]).toMatchObject({
      requestID: "req_gemini_1",
      protocol: "gemini",
      modelID: "gemini-2.5-test",
      status: 200,
    })
    expect(artifact.promptEvidence[0]).toMatchObject({
      protocol: "gemini",
      modelID: "gemini-2.5-test",
      toolNames: ["lookup"],
      messageCount: 1,
    })
    expect(artifact.toolEvidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: "request-schema", toolName: "lookup" }),
      expect.objectContaining({ source: "response-call", toolName: "lookup" }),
    ]))
    expect(artifact.usageEvidence[0]).toMatchObject({ inputTokens: 11, outputTokens: 3, cacheReadTokens: 2, totalTokens: 14 })
    expect(JSON.stringify(artifact)).not.toContain("private function call")
    expect(JSON.stringify(artifact)).not.toContain("private gemini query")
    expect(JSON.stringify(artifact)).not.toContain("private gemini text")
    expect(verifyNativeCaptureArtifact(artifact).ok).toBe(true)
  })

  it("parses claude-tap JSON export records", () => {
    const jsonl = readFileSync(resolve("external-tools/claude-tap/fixtures/minimal-jsonl.trace.jsonl"), "utf8")
    const record = JSON.parse(jsonl) as Record<string, unknown>
    const text = JSON.stringify({ records: [record] })
    const artifact = importClaudeTapTrace({
      text,
      artifactBytes: Buffer.byteLength(text),
      product: "opencode",
      taskID: "json-export-smoke",
      sourceToolVersion: "0.1.114",
    })

    expect(artifact.sourceArtifact.format).toBe("json")
    expect(artifact.summary.records).toBe(1)
    expect(artifact.providerRequests[0]?.requestID).toBe("req_fixture_1")
    expect(verifyNativeCaptureArtifact(artifact).ok).toBe(true)
  })

  it("reconstructs SSE response summaries without storing raw stream chunks", () => {
    const text = JSON.stringify({
      records: [
        {
          timestamp: "2026-06-14T00:00:00.000Z",
          request_id: "req_sse_1",
          turn: 1,
          duration_ms: 90,
          request: {
            method: "POST",
            path: "/v1/responses",
            body: { model: "gpt-test", input: [{ role: "user", content: "Say hi" }] },
          },
          response: {
            status: 200,
            sse_events: [
              { event: "response.output_text.delta", data: { type: "response.output_text.delta", delta: "Hello " } },
              { event: "response.output_text.delta", data: JSON.stringify({ type: "response.output_text.delta", delta: "stream" }) },
              { event: "response.function_call_arguments.delta", data: { type: "response.function_call_arguments.delta", delta: "{\"cmd\":\"pwd\"}" } },
              { event: "response.completed", data: { type: "response.completed", response: { status: "completed" } } },
            ],
          },
        },
      ],
    })

    const artifact = importClaudeTapTrace({
      text,
      artifactBytes: Buffer.byteLength(text),
      product: "pi-mono",
      taskID: "sse-reconstruction",
      sourceToolVersion: "0.1.114",
    })
    const reconstruction = artifact.streamEvidence[0]?.reconstructedResponse

    expect(artifact.summary.streamEvents).toBe(4)
    expect(artifact.streamEvidence[0]?.finishReason).toBe("completed")
    expect(reconstruction).toMatchObject({
      eventTypes: ["response.completed", "response.function_call_arguments.delta", "response.output_text.delta"],
      chunkTypes: ["response.completed", "response.function_call_arguments.delta", "response.output_text.delta"],
      textBytes: Buffer.byteLength("Hello stream", "utf8"),
      toolArgumentBytes: Buffer.byteLength("{\"cmd\":\"pwd\"}", "utf8"),
      toolCallCount: 1,
      finishReason: "completed",
    })
    expect(reconstruction?.textFingerprint).toMatch(/^sha256:/)
    expect(reconstruction?.toolArgumentFingerprint).toMatch(/^sha256:/)
    expect(JSON.stringify(artifact)).not.toContain("Hello stream")
    expect(JSON.stringify(artifact)).not.toContain("pwd")
    expect(verifyNativeCaptureArtifact(artifact).ok).toBe(true)
  })

  it("recognizes Bedrock EventStream records and summarizes chunks safely", () => {
    const text = JSON.stringify({
      records: [
        {
          timestamp: "2026-06-14T00:00:00.000Z",
          request_id: "req_bedrock_1",
          turn: 1,
          duration_ms: 110,
          request: {
            method: "POST",
            path: "/model/anthropic.claude-3-haiku-20240307-v1:0/invoke-with-response-stream",
            body: {
              anthropic_version: "bedrock-2023-05-31",
              system: "You are a Bedrock agent.",
              messages: [{ role: "user", content: "Say hi" }],
            },
          },
          response: {
            status: 200,
            eventstream_events: [
              { eventType: "chunk", payload: { type: "content_block_delta", delta: { type: "text_delta", text: "Bedrock " } } },
              { eventType: "chunk", chunk: { bytes: Buffer.from(JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: "stream" } }), "utf8").toString("base64") } },
              { eventType: "chunk", payload: { type: "message_delta", delta: { stop_reason: "end_turn" } } },
            ],
          },
        },
      ],
    })

    const artifact = importClaudeTapTrace({
      text,
      artifactBytes: Buffer.byteLength(text),
      product: "hermes-agent",
      taskID: "bedrock-eventstream",
      sourceToolVersion: "0.1.114",
    })
    const stream = artifact.streamEvidence[0]

    expect(artifact.providerRequests[0]?.protocol).toBe("bedrock-eventstream")
    expect(artifact.promptEvidence[0]?.protocol).toBe("bedrock-eventstream")
    expect(stream?.eventCount).toBe(3)
    expect(stream?.finishReason).toBe("end_turn")
    expect(stream?.reconstructedResponse).toMatchObject({
      eventTypes: ["chunk"],
      chunkTypes: ["content_block_delta", "message_delta"],
      textBytes: Buffer.byteLength("Bedrock stream", "utf8"),
      toolCallCount: 0,
    })
    expect(JSON.stringify(artifact)).not.toContain("Bedrock stream")
    expect(JSON.stringify(artifact)).not.toContain("You are a Bedrock agent")
    expect(verifyNativeCaptureArtifact(artifact).ok).toBe(true)
  })
})
