import { describe, expect, it } from "vitest"
import {
  buildNanobotAnthropicKwargsProjection,
  buildNanobotOpenAICompatKwargsProjection,
  buildNanobotProviderNativeExactFixture,
  findNanobotProviderSpecProjection,
  nanobotProviderNativeExactAtomIDs,
  nanobotProviderNativeExactEvidenceRef,
  nanobotProviderNativeExactFixtureID,
  nanobotProviderNativeExactReplayRef,
  nanobotProviderNativeDescriptors,
  nanobotProviderUpstreamRef,
  parseNanobotAnthropicResponseProjection,
  parseNanobotOpenAICompatResponseProjection,
  projectNanobotProviderCore,
  projectNanobotProviderEnv,
  sanitizeNanobotOpenAICompatMessagesProjection,
  verifyNanobotProviderNativeExactFixture,
} from "@helix/adapters-nanobot/product-schema/provider"

describe("Nanobot provider native exact conformance", () => {
  it("matches upstream registry lookup, env setup, backend selection, and fallback signature behavior", () => {
    const openRouter = findNanobotProviderSpecProjection("openrouter")
    expect(openRouter).toMatchObject({
      name: "openrouter",
      backend: "openai_compat",
      envKey: "OPENROUTER_API_KEY",
      isGateway: true,
      supportsPromptCaching: true,
      label: "OpenRouter",
    })

    const env = projectNanobotProviderEnv({
      specName: "openrouter",
      apiKey: "sk-or-new",
      apiBase: "https://openrouter.ai/api/v1",
      env: { OPENROUTER_API_KEY: "sk-or-old" },
    })
    expect(env).toMatchObject({
      envKey: "OPENROUTER_API_KEY",
      effectiveBase: "https://openrouter.ai/api/v1",
      wroteKey: true,
      gatewayOverwritesApiKey: true,
      env: { OPENROUTER_API_KEY: "sk-or-new" },
    })

    const direct = projectNanobotProviderCore({ model: "custom/model", providerName: "custom" })
    expect(direct).toMatchObject({
      backend: "openai_compat",
      providerClass: "OpenAICompatProvider",
      requiresApiKey: false,
    })
    expect(direct.error).toBeUndefined()

    const missingOpenAIKey = projectNanobotProviderCore({ model: "gpt-5", providerName: "openai" })
    expect(missingOpenAIKey).toMatchObject({
      backend: "openai_compat",
      providerClass: "OpenAICompatProvider",
      requiresApiKey: true,
      error: "No API key configured for provider 'openai'.",
    })

    const provider = projectNanobotProviderCore({
      model: "anthropic/claude-sonnet-4-20250514",
      providerName: "openrouter",
      apiKey: "sk-or-primary",
      contextWindowTokens: 200000,
      fallbackModels: [
        {
          model: "claude-sonnet-4-20250514",
          providerName: "anthropic",
          apiKey: "anthropic-key",
          contextWindowTokens: 180000,
        },
      ],
    })
    expect(provider).toMatchObject({
      providerName: "openrouter",
      backend: "openai_compat",
      providerClass: "OpenAICompatProvider",
      requiresApiKey: true,
      contextWindowTokens: 180000,
    })
    expect(provider.fallbackSignatures).toHaveLength(1)
  })

  it("matches OpenAI-compatible message sanitization, kwargs, reasoning, cache, and parse behavior", () => {
    const sanitized = sanitizeNanobotOpenAICompatMessagesProjection([
      {
        role: "assistant",
        content: "will be nulled",
        tool_calls: [{ id: "long-provider-tool-id", function: { name: "lookup", arguments: "{\"city\":\"Paris\"}" } }],
        private: "removed",
      },
      { role: "tool", tool_call_id: "long-provider-tool-id", content: "sunny" },
    ])
    expect(sanitized[0]).toMatchObject({
      role: "assistant",
      content: null,
      tool_calls: [{ id: expect.stringMatching(/^[a-f0-9]{9}$/), function: { name: "lookup", arguments: "{\"city\":\"Paris\"}" } }],
    })
    expect(sanitized[1]?.tool_call_id).toBe((sanitized[0]?.tool_calls as Array<{ id: string }>)[0]?.id)
    expect(sanitized[0]).not.toHaveProperty("private")

    const kwargs = buildNanobotOpenAICompatKwargsProjection({
      specName: "volcengine",
      defaultModel: "volcengine/deepseek-v3",
      messages: [
        { role: "system", content: "System" },
        { role: "user", content: "Question" },
        { role: "assistant", content: "prefill" },
      ],
      tools: [{ type: "function", function: { name: "lookup", parameters: { type: "object" } } }],
      maxTokens: 0,
      temperature: 0.2,
      reasoningEffort: "high",
      toolChoice: "required",
      extraBody: { chat_template_kwargs: { enable_thinking: false } },
    })
    expect(kwargs).toMatchObject({
      model: "volcengine/deepseek-v3",
      max_completion_tokens: 1,
      reasoning_effort: "high",
      tool_choice: "required",
      extra_body: {
        thinking: { type: "enabled" },
        chat_template_kwargs: { enable_thinking: false },
      },
    })
    expect(kwargs).not.toHaveProperty("temperature")
    expect(kwargs).toHaveProperty("tools")

    const parsed = parseNanobotOpenAICompatResponseProjection({
      choices: [
        {
          finish_reason: null,
          message: {
            content: "",
            reasoning: "visible reasoning",
            tool_calls: [
              {
                id: "tc_provider",
                function: { name: "lookup", arguments: "{\"city\":\"Paris\"}", provider_hint: "fn" },
                extra_content: { google: { thought_signature: "sig" } },
                provider_route: "openrouter",
              },
            ],
          },
        },
        { finish_reason: "tool_calls", message: { content: "answer" } },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 3, total_tokens: 13, prompt_tokens_details: { cached_tokens: 4 } },
    })
    expect(parsed).toMatchObject({
      content: "answer",
      finishReason: "stop",
      reasoningContent: "visible reasoning",
      usage: { prompt_tokens: 10, completion_tokens: 3, total_tokens: 13, cached_tokens: 4 },
    })
    expect(parsed.toolCalls[0]).toMatchObject({
      id: expect.stringMatching(/^[a-f0-9]{9}$/),
      name: "lookup",
      arguments: { city: "Paris" },
      extraContent: { google: { thought_signature: "sig" } },
      providerSpecificFields: { provider_route: "openrouter" },
      functionProviderSpecificFields: { provider_hint: "fn" },
    })
  })

  it("matches Anthropic message conversion, cache markers, thinking kwargs, and response parsing", () => {
    const kwargs = buildNanobotAnthropicKwargsProjection({
      defaultModel: "anthropic/claude-sonnet-4-20250514",
      messages: [
        { role: "system", content: "System prompt" },
        { role: "user", content: [{ type: "image_url", image_url: { url: "data:image/png;base64,abc" } }, { type: "text", text: "describe" }] },
        { role: "assistant", content: "using tool", thinking_blocks: [{ type: "thinking", thinking: "plan", signature: "sig" }], tool_calls: [{ id: "toolu_1", function: { name: "lookup", arguments: "{\"q\":\"x\"}" } }] },
        { role: "tool", tool_call_id: "toolu_1", content: "result" },
        { role: "user", content: "finish" },
      ],
      tools: [{ type: "function", function: { name: "lookup", description: "Lookup", parameters: { type: "object" } } }],
      maxTokens: 2048,
      reasoningEffort: "medium",
      toolChoice: { function: { name: "lookup" } },
      extraHeaders: { "anthropic-beta": "prompt-caching-2024-07-31" },
    })

    expect(kwargs).toMatchObject({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      temperature: 1.0,
      thinking: { type: "enabled", budget_tokens: 4096 },
      tool_choice: { type: "auto" },
      extra_headers: { "anthropic-beta": "prompt-caching-2024-07-31" },
    })
    expect(kwargs.system).toEqual([{ type: "text", text: "System prompt", cache_control: { type: "ephemeral" } }])
    expect(kwargs.tools).toEqual([
      { name: "lookup", input_schema: { type: "object" }, description: "Lookup", cache_control: { type: "ephemeral" } },
    ])
    expect((kwargs.messages as Array<Record<string, unknown>>)[0]).toMatchObject({
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: "image/png", data: "abc" } },
        { type: "text", text: "describe" },
      ],
    })

    const parsed = parseNanobotAnthropicResponseProjection({
      content: [
        { type: "text", text: "hello" },
        { type: "thinking", thinking: "hidden", signature: "sig" },
        { type: "tool_use", id: "toolu_2", name: "lookup", input: { q: "x" } },
      ],
      stop_reason: "tool_use",
      usage: { input_tokens: 10, output_tokens: 5, cache_creation_input_tokens: 2, cache_read_input_tokens: 3 },
    })
    expect(parsed).toEqual({
      content: "hello",
      finishReason: "tool_calls",
      toolCalls: [{ id: "toolu_2", name: "lookup", arguments: { q: "x" } }],
      usage: { prompt_tokens: 15, completion_tokens: 5, total_tokens: 20, cache_creation_input_tokens: 2, cache_read_input_tokens: 3, cached_tokens: 3 },
      thinkingBlocks: [{ type: "thinking", thinking: "hidden", signature: "sig" }],
    })
  })

  it("publishes a native exact fixture and descriptors without bridge lossiness", () => {
    const fixture = buildNanobotProviderNativeExactFixture()
    expect(verifyNanobotProviderNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "nanobot",
      atomIDs: [...nanobotProviderNativeExactAtomIDs],
      upstreamRef: nanobotProviderUpstreamRef,
      evidenceRef: nanobotProviderNativeExactEvidenceRef,
      fixtureID: nanobotProviderNativeExactFixtureID,
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: [nanobotProviderNativeExactEvidenceRef, nanobotProviderNativeExactReplayRef],
      fixtureIDs: [nanobotProviderNativeExactFixtureID],
      knownLossiness: [],
      descriptors: nanobotProviderNativeDescriptors.map((descriptor) => ({ ...descriptor })),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("nanobot/providers/registry.py#ProviderSpec,PROVIDERS,find_by_name"),
      expect.stringContaining("nanobot/providers/factory.py#_make_provider_core,make_provider,provider_signature,build_provider_snapshot"),
      expect.stringContaining("nanobot/providers/openai_compat_provider.py#OpenAICompatProvider._setup_env,_sanitize_messages,_build_kwargs,_parse,_parse_chunks"),
      expect.stringContaining("nanobot/providers/anthropic_provider.py#AnthropicProvider._convert_messages,_convert_tools,_apply_cache_control,_build_kwargs,_parse_response"),
    ]))
    expect(fixture.cases.map((testCase) => testCase.scenarioID)).toEqual([
      "registry-factory-signature-and-fallback",
      "openai-compatible-env-headers-and-local-transport",
      "openai-compatible-message-sanitize-and-kwargs",
      "openai-compatible-response-and-usage-parser",
      "anthropic-message-tool-cache-and-thinking-kwargs",
      "anthropic-response-usage-and-tool-parser",
    ])
  })
})
