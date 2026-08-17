import { describe, expect, it } from "vitest"
import {
  adaptToolParameters,
  assertSchema,
  bindingSpecSchema,
  blockManifestSchema,
  conformanceRefSchema,
  createID,
  createAtomFactory,
  createBindingSpec,
  createLegoBlockManifest,
  createPortContract,
  eventEnvelopeSchema,
  hookResultSchema,
  messageSchema,
  portContractFromFixture,
  portContractSchema,
  providerRequestSchema,
  providerStreamEventSchema,
  resourceGrantSchema,
  roundTripWithSchema,
  sessionTranscriptSchema,
  toolDefinitionSchema,
  type AtomFactory,
  type BindingSpec,
  type LegoBlockManifest,
  type EventEnvelope,
  type LegoMessage,
  type PortContract,
  type LegoToolDefinition,
  type ProviderRequest,
  type ProviderStreamEvent,
  type ResourceGrant,
  type SessionTranscript,
  buildOpenCodeEventSourceMatrixSnapshot,
  foundationPortContractFixtures,
} from "@helix/contracts"
import { createAssistantMessage, createUserMessage } from "@helix/lego-session"

describe("contracts runtime schema conformance", () => {
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
        id: "session-projectors",
        path: "packages/opencode/src/session/projectors.ts",
        symbols: expect.arrayContaining(["DeepPartial", "toPartialRow"]),
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
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "syncevent-stream-projection")).toMatchObject({
      status: "partial",
      eventAtomIDs: ["opencode.event.envelope-bridge", "opencode.event.syncevent-bridge"],
      eventPortIDs: ["event.envelope", "event.log"],
      knownGaps: expect.arrayContaining(["opencode-live-syncevent-bus-runtime-not-replayed"]),
    })
    expect(snapshot.branchAnchors.find((anchor) => anchor.branchID === "live-syncevent-bus-runtime")).toMatchObject({
      status: "partial",
      eventAtomIDs: ["opencode.event.envelope-bridge", "opencode.event.syncevent-bridge"],
      localEvidenceRefs: expect.arrayContaining(["opencode-event:runtime-projection", "opencode-event:live-runtime-fixture"]),
      knownGaps: expect.arrayContaining(["opencode-event-live-runtime-fixture-partial-native-gap"]),
    })
  })

  it("round-trips a serializable session transcript with nested parts", () => {
    const sessionID = createID("session")
    const user = createUserMessage({ sessionID, text: "hello" })
    const assistant = createAssistantMessage({
      sessionID,
      text: "",
      parts: [
        { id: createID("part"), type: "text", text: "thinking done" },
        { id: createID("part"), type: "reasoning", text: "private-ish reasoning summary" },
        {
          id: createID("part"),
          type: "tool_call",
          toolCallID: createID("toolcall"),
          toolName: "echo",
          input: { text: "hi" },
          status: "completed",
        },
        {
          id: createID("part"),
          type: "tool_result",
          toolCallID: createID("toolcall"),
          toolName: "echo",
          content: [{ id: createID("part"), type: "text", text: "hi" }],
          details: { echoed: true },
        },
        {
          id: createID("part"),
          type: "compaction",
          reason: "overflow",
          summary: "older context",
          metadata: { tokenEstimate: 100, tokenLimit: 20 },
        },
        { id: createID("part"), type: "custom", customType: "renderer", data: { kind: "badge" }, display: "badge" },
      ],
    })
    const transcript: SessionTranscript = { sessionID, messages: [user, assistant], metadata: { source: "schema-test" } }

    expect(sessionTranscriptSchema.validate(transcript)).toEqual({ ok: true, issues: [] })
    expect(roundTripWithSchema(sessionTranscriptSchema, transcript)).toEqual(transcript)
    expect(messageSchema.is(assistant)).toBe(true)
  })

  it("validates tool, provider, event, stream, and hook contracts at runtime", () => {
    const sessionID = createID("session")
    const user = createUserMessage({ sessionID, text: "hello" })
    const tool: LegoToolDefinition = {
      name: "echo",
      description: "Echo text.",
      parameters: { type: "object", properties: { text: { type: "string" } } },
      renderCall(input) {
        return `echo ${String(input["text"] ?? "")}`
      },
      renderResult(result) {
        return result.content.map((part) => (part.type === "text" ? part.text : "")).join("")
      },
      execute() {
        return { content: [{ id: createID("part"), type: "text", text: "ok" }] }
      },
    }
    const request: ProviderRequest = {
      model: { providerID: "fake", modelID: "model-a", contextWindow: 128 },
      system: ["system"],
      messages: [user],
      tools: [tool],
      options: { temperature: 0 },
    }
    const events: ProviderStreamEvent[] = [
      { type: "text", text: "hello" },
      { type: "reasoning", text: "think" },
      { type: "tool_call", id: "call_1", toolName: "echo", input: { text: "hi" } },
      { type: "finish", finish: "stop", usage: { input: 1, output: 2 } },
    ]
    const envelope: EventEnvelope = {
      type: "provider.request.before",
      sessionID,
      timestamp: Date.now(),
      payload: { requestID: "req_1" },
      metadata: { providerID: "fake" },
    }

    assertSchema(toolDefinitionSchema, tool)
    assertSchema(providerRequestSchema, request)
    for (const event of events) assertSchema(providerStreamEventSchema, event)
    expect(roundTripWithSchema(eventEnvelopeSchema, envelope)).toEqual(envelope)
    expect(hookResultSchema.parse({ status: "allow" })).toEqual({ status: "allow" })
  })

  it("reports useful paths for invalid contract values", () => {
    const invalidMessage: unknown = {
      id: createID("message"),
      sessionID: createID("session"),
      role: "assistant",
      time: { created: Date.now() },
      parts: [{ id: createID("part"), type: "tool_call", toolName: "echo", input: {}, status: "done" }],
    }
    const result = messageSchema.validate(invalidMessage)

    expect(result.ok).toBe(false)
    expect(result.issues.map((issue) => issue.path)).toEqual(
      expect.arrayContaining(["$.parts[0].toolCallID", "$.parts[0].status"]),
    )
    expect(() => providerStreamEventSchema.parse({ type: "finish" })).toThrow(/finish/)
  })

  it("adapts common tool schema provider shapes without importing those libraries", () => {
    const typeBoxKind = Symbol("TypeBox.Kind")
    const typebox = { [typeBoxKind]: "Object", type: "object", properties: {} }

    expect(adaptToolParameters({ type: "object", properties: {} })).toMatchObject({ kind: "json-schema" })
    expect(adaptToolParameters(typebox)).toMatchObject({ kind: "typebox", jsonSchema: typebox })
    expect(adaptToolParameters({ "~standard": { version: 1 } })).toMatchObject({ kind: "standard-schema" })
    expect(adaptToolParameters({ _def: { typeName: "ZodObject" }, safeParse: () => ({ success: true }) })).toMatchObject({
      kind: "zod",
    })
    expect(adaptToolParameters({ ast: { _tag: "TypeLiteral" } })).toMatchObject({ kind: "effect-schema" })
  })

  it("validates the executable lego block interface shared by every plane", async () => {
    const grant: ResourceGrant = {
      id: "filesystem",
      mode: "read",
      scope: "workspace",
      reason: "load prompt resources",
    }
    const manifest: LegoBlockManifest = createLegoBlockManifest({
      id: "prompt.resource-loader.filesystem",
      version: "0.1.0",
      type: "atom",
      layer: "prompt",
      personality: "common",
      provides: [{ id: "prompt.resource-loader", kind: "implementation", multiplicity: "single" }],
      requires: ["resource.discovery"],
      optional: ["prompt.model-capability-adapter"],
      resources: [grant],
      lifecycleScopes: ["workspace", "session"],
      conformance: ["prompt:resource-loader"],
    })
    const contract: PortContract<string, string> = createPortContract({
      id: "prompt.resource-loader",
      input: "resource discovery request and prompt references",
      output: "ordered prompt resource parts",
      cardinality: "single",
      lifecycle: ["workspace", "session"],
      resources: [grant],
      errors: ["resource.not_found", "resource.denied"],
      traces: ["prompt.resource-loader.read"],
      conformance: ["prompt:resource-loader"],
    })
    const binding: BindingSpec = createBindingSpec({
      port: "prompt.resource-loader",
      atom: "prompt.resource-loader.filesystem",
      personality: "common",
      scope: "workspace",
      resources: [grant],
      capability: { id: "prompt.resource-loader", kind: "port", multiplicity: "single" },
      multiplicity: "single",
    })
    const factory: AtomFactory<{ root: string }, { discovery: unknown }, { id: string }> = createAtomFactory({
      manifest,
      create(config) {
        return { id: config.root }
      },
    })

    expect(manifest.implementationKind).toBe("factory")
    expect(blockManifestSchema.validate(manifest)).toEqual({ ok: true, issues: [] })
    expect(blockManifestSchema.validate({ ...manifest, implementationKind: "compatible" })).toMatchObject({ ok: false })
    expect(portContractSchema.validate(contract)).toEqual({ ok: true, issues: [] })
    expect(resourceGrantSchema.parse(grant)).toEqual(grant)
    expect(conformanceRefSchema.parse(contract.conformance[0])).toEqual({ id: "prompt:resource-loader", required: true })
    expect(bindingSpecSchema.parse(binding)).toEqual(binding)
    await expect(Promise.resolve(factory.create({ root: "workspace" }, { discovery: {} }))).resolves.toEqual({ id: "workspace" })
  })

  it("materializes catalog fixtures as port contracts with conformance, error, and trace semantics", () => {
    const contracts = foundationPortContractFixtures.map((fixture) => portContractFromFixture(fixture))

    for (const contract of contracts) {
      expect(portContractSchema.validate(contract), contract.id).toEqual({ ok: true, issues: [] })
      expect(contract.errors, `${contract.id}:errors`).toEqual([`${contract.id}.contract-error`])
      expect(contract.traces, `${contract.id}:traces`).toEqual([`${contract.id}.trace`])
      expect(contract.conformance[0]?.id, `${contract.id}:conformance`).toMatch(/^[a-z0-9-]+:/)
    }
  })
})
