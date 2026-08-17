import { describe, expect, it } from "vitest"
import {
  buildHermesChatCompletionsKwargs,
  buildHermesProviderNativeExactFixture,
  buildHermesResponsesAPIKwargs,
  extractHermesAnthropicCacheStats,
  extractHermesChatCompletionCacheStats,
  hermesProviderNativeDescriptors,
  hermesProviderNativeExactAtomIDs,
  hermesProviderNativeExactEvidenceRef,
  hermesProviderNativeExactFixtureID,
  hermesProviderNativeExactReplayRef,
  normalizeHermesAnthropicResponse,
  normalizeHermesChatCompletionResponse,
  normalizeHermesResponsesAdapterResult,
  sanitizeHermesChatCompletionMessages,
  validateHermesAnthropicResponse,
  validateHermesChatCompletionResponse,
  validateHermesResponsesAPIResponse,
  verifyHermesProviderNativeExactFixture,
} from "@helix/adapters-hermes/product-schema/provider"
import { hermesToolCallProviderField } from "@helix/adapters-hermes/product-schema/events"
import { buildAssemblyContract } from "@helix/recipes"

describe("Hermes provider native exact conformance", () => {
  it("builds Responses API kwargs like the upstream transport wrapper", () => {
    const result = buildHermesResponsesAPIKwargs({
      model: "gpt-5.5-codex",
      messages: [{ role: "system", content: "System prompt" }, { role: "user", content: "hello" }],
      tools: [{ name: "read_file" }],
      reasoningConfig: { effort: "minimal" },
      sessionID: "session-1",
      maxTokens: 1024,
      timeout: 15,
      isCodexBackend: true,
      convertMessages: (messages, options) => ({ messages, issuer: options.currentIssuerKind }),
      convertTools: (tools) => tools?.map((tool) => ({ converted: tool.name })) ?? [],
    })

    expect(result.issuerKind).toBe("codex")
    expect(result.payloadMessages).toEqual([{ role: "user", content: "hello" }])
    expect(result.reasoningEffort).toBe("low")
    expect(result.kwargs).toMatchObject({
      model: "gpt-5.5-codex",
      instructions: "System prompt",
      input: { messages: [{ role: "user", content: "hello" }], issuer: "codex" },
      store: false,
      tools: [{ converted: "read_file" }],
      tool_choice: "auto",
      parallel_tool_calls: true,
      prompt_cache_key: "session-1",
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      timeout: 15,
      extra_headers: {
        session_id: "session-1",
        "x-client-request-id": "session-1",
      },
    })
    expect(result.kwargs).not.toHaveProperty("max_output_tokens")

    const xai = buildHermesResponsesAPIKwargs({
      model: "grok-4",
      messages: [{ role: "user", content: "hello" }],
      tools: [],
      sessionID: "xai-session",
      isXAIResponses: true,
      requestOverrides: { service_tier: "priority" },
      grokSupportsReasoningEffort: () => true,
    })
    expect(xai.kwargs).toMatchObject({
      include: ["reasoning.encrypted_content"],
      reasoning: { effort: "medium" },
      extra_headers: { "x-grok-conv-id": "xai-session" },
      extra_body: { prompt_cache_key: "xai-session" },
    })
    expect(xai.kwargs).not.toHaveProperty("tools")
    expect(xai.kwargs).not.toHaveProperty("service_tier")
  })

  it("normalizes Responses, Chat Completions, and Anthropic responses like upstream", () => {
    const responses = normalizeHermesResponsesAdapterResult({
      message: {
        content: "done",
        reasoning: "trace",
        codex_reasoning_items: [{ id: "rs_1" }],
        tool_calls: [{ id: "fc_1", call_id: "call_1", response_item_id: "ri_1", function: { name: "exec", arguments: "{\"cmd\":\"pwd\"}" } }],
      },
      finishReason: "tool_calls",
    })
    expect(responses.finish_reason).toBe("tool_calls")
    expect(responses.reasoning).toBe("trace")
    expect(responses.tool_calls?.[0]?.name).toBe("exec")
    expect(hermesToolCallProviderField(responses.tool_calls![0]!, "call_id")).toBe("call_1")
    expect(hermesToolCallProviderField(responses.tool_calls![0]!, "response_item_id")).toBe("ri_1")
    expect(responses.provider_data?.codex_reasoning_items).toEqual([{ id: "rs_1" }])
    expect(validateHermesResponsesAPIResponse({ output: [{ id: "out" }] })).toBe(true)
    expect(validateHermesResponsesAPIResponse({ output: [] })).toBe(false)

    const sanitized = sanitizeHermesChatCompletionMessages([
      {
        role: "assistant",
        content: null,
        tool_name: "local",
        _thinking_prefill: true,
        codex_message_items: [{ id: "old" }],
        tool_calls: [{ id: "tc_1", call_id: "call_1", response_item_id: "ri_1", function: { name: "lookup", arguments: "{}" } }],
      },
    ])
    expect(sanitized).toEqual([
      {
        role: "assistant",
        content: null,
        tool_calls: [{ id: "tc_1", function: { name: "lookup", arguments: "{}" } }],
      },
    ])

    const chat = normalizeHermesChatCompletionResponse({
      choices: [
        {
          finish_reason: null,
          message: {
            content: "answer",
            reasoning: "visible",
            model_extra: { reasoning_content: "hidden" },
            reasoning_details: [{ type: "detail" }],
            tool_calls: [
              {
                id: "chat_tool",
                function: { name: "gemini_tool", arguments: "{\"x\":1}" },
                model_extra: { extra_content: { google: { thought_signature: "sig" } } },
              },
            ],
          },
        },
      ],
      usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5, prompt_tokens_details: { cached_tokens: 1, cache_write_tokens: 4 } },
    })
    expect(chat).toMatchObject({
      content: "answer",
      finish_reason: "stop",
      reasoning: "visible",
      usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 },
      provider_data: { reasoning_content: "hidden", reasoning_details: [{ type: "detail" }] },
    })
    expect(hermesToolCallProviderField(chat.tool_calls![0]!, "extra_content")).toEqual({ google: { thought_signature: "sig" } })
    expect(extractHermesChatCompletionCacheStats({ usage: { prompt_tokens_details: { cached_tokens: 1, cache_write_tokens: 4 } } })).toEqual({
      cached_tokens: 1,
      creation_tokens: 4,
    })
    expect(validateHermesChatCompletionResponse({ choices: [{}] })).toBe(true)

    const anthropicRaw = {
      content: [
        { type: "text", text: "alpha" },
        { type: "thinking", thinking: "plan", signature: "sig" },
        { type: "tool_use", id: "tu_1", name: "mcp_echo", input: { value: "hi" } },
      ],
      stop_reason: "tool_use",
      usage: { cache_read_input_tokens: 7, cache_creation_input_tokens: 8 },
    }
    const anthropic = normalizeHermesAnthropicResponse(anthropicRaw, { stripToolPrefix: true, registeredToolNames: ["echo"] })
    expect(anthropic).toMatchObject({
      content: "alpha",
      finish_reason: "tool_calls",
      reasoning: "plan",
      provider_data: { reasoning_details: [{ type: "thinking", thinking: "plan", signature: "sig" }] },
    })
    expect(anthropic.tool_calls?.[0]).toMatchObject({ id: "tu_1", name: "echo", arguments: '{"value": "hi"}' })
    expect(extractHermesAnthropicCacheStats(anthropicRaw)).toEqual({ cached_tokens: 7, creation_tokens: 8 })
    expect(validateHermesAnthropicResponse({ content: [], stop_reason: "end_turn" })).toBe(true)
  })

  it("preserves Chat Completions request wrapper details", () => {
    const kwargs = buildHermesChatCompletionsKwargs({
      model: "gpt-5",
      messages: [{ role: "system", content: "developer please" }, { role: "user", content: "hi" }],
      tools: [{ type: "function", function: { name: "search" } }],
      timeout: 9,
      maxTokens: 100,
      maxTokensParam: (value) => ({ max_completion_tokens: value }),
      requestOverrides: { extra_body: { custom: true } },
      extraBodyAdditions: { provider: { order: ["openai"] } },
    })

    expect(kwargs).toMatchObject({
      model: "gpt-5",
      messages: [{ role: "developer", content: "developer please" }, { role: "user", content: "hi" }],
      tools: [{ type: "function", function: { name: "search" } }],
      timeout: 9,
      max_completion_tokens: 100,
      extra_body: { provider: { order: ["openai"] }, custom: true },
    })
  })

  it("builds a native exact fixture with no bridge lossiness", () => {
    const fixture = buildHermesProviderNativeExactFixture()
    const verification = verifyHermesProviderNativeExactFixture(fixture)

    expect(verification).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      product: "hermes-agent",
      atomIDs: [...hermesProviderNativeExactAtomIDs],
      evidenceRef: hermesProviderNativeExactEvidenceRef,
      fixtureID: hermesProviderNativeExactFixtureID,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
    })
    expect(fixture.nativeEvidenceRefs).toEqual(expect.arrayContaining([
      hermesProviderNativeExactEvidenceRef,
      hermesProviderNativeExactReplayRef,
    ]))
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("agent/transports/codex.py#ResponsesApiTransport"),
      expect.stringContaining("agent/transports/anthropic.py#AnthropicTransport"),
      expect.stringContaining("agent/transports/chat_completions.py#ChatCompletionsTransport"),
      expect.stringContaining("agent/transports/types.py#ToolCall"),
    ]))
  })

  it("selects Hermes provider atoms as native in assembly without source-matrix bridge lossiness", () => {
    const contract = buildAssemblyContract({
      product: "hermes-agent",
      includeTaskParity: true,
      includeNativeFixtures: true,
      generatedAt: "2026-06-13T00:00:00.000Z",
    })

    for (const descriptor of hermesProviderNativeDescriptors) {
      const atom = contract.atoms.find((candidate) => candidate.id === descriptor.id)
      expect(atom, descriptor.id).toMatchObject({
        implementationKind: descriptor.implementationKind,
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([
          hermesProviderNativeExactEvidenceRef,
          hermesProviderNativeExactReplayRef,
        ]),
        fixtureIDs: expect.arrayContaining([hermesProviderNativeExactFixtureID]),
        knownLossiness: [],
        source: {
          packageName: "@helix/adapters-hermes",
          exportPath: "./product-schema/provider",
        },
      })
      expect(atom?.nativeEvidenceRefs).not.toContain("conformance:hermes-provider-source-matrix")
      expect(atom?.fixtureIDs).not.toContain("hermes-provider:source-matrix")
    }
    expect(contract.atoms.find((candidate) => candidate.id === "hermes.provider.request-options")?.provides).toContain("provider.request-shape")
    expect(contract.atoms.find((candidate) => candidate.id === "hermes.provider.transport-instrumentation")?.provides).toContain("provider.transport")
  })
})
