import { createHash } from "node:crypto"
import type { LegoPortContractFixture } from "@helix/contracts"

export const providerPortContractFixtures: LegoPortContractFixture[] = [
  {
    id: "provider.transport",
    input: "provider endpoint, request body, headers, timeout, retry metadata, and abort signal",
    output: "raw HTTP/SSE/recorded response stream plus transport diagnostics",
    lifecycle: ["turn"],
    resources: [{ id: "network", mode: "execute", scope: "external" }],
    conformance: "provider:transport",
    implementations: ["provider.transport.fetch", "provider.transport.mock-sse", "provider.transport.cassette"],
    personalityAtoms: [
      "opencode.provider.transport-instrumentation",
      "pi.provider.transport-instrumentation",
      "nanobot.provider.transport-instrumentation",
      "hermes.provider.transport-instrumentation",
    ],
  },
  {
    id: "provider.auth",
    input: "credential source reference, provider id, environment, and redaction policy",
    output: "credential-bearing request headers/query fields plus redacted audit metadata",
    lifecycle: ["process", "workspace", "turn"],
    resources: [{ id: "env", mode: "read", scope: "process" }],
    conformance: "provider:auth",
    implementations: ["provider.auth.api-key", "provider.auth.bearer", "provider.auth.query-key"],
    personalityAtoms: ["opencode.provider.auth-descriptor", "pi.provider.auth-descriptor", "nanobot.provider.auth-descriptor", "hermes.provider.auth-descriptor"],
  },
  {
    id: "provider.model-registry",
    input: "provider id, model filters, config/env overrides, and optional remote metadata",
    output: "normalized model descriptors with capability, pricing, context, and reasoning metadata",
    lifecycle: ["process", "workspace"],
    resources: [{ id: "network", mode: "execute", scope: "external" }],
    conformance: "provider:model-registry",
    implementations: ["provider.model-registry.static", "provider.model-registry.env", "provider.model-registry.remote-cache"],
    personalityAtoms: ["opencode.provider.model-plugin", "pi.provider.model-extension", "nanobot.provider.model-registry", "hermes.provider.model-registry"],
  },
  {
    id: "provider.request-shape",
    input: "common ProviderRequest with messages, tools, model, options, and provider personality",
    output: "provider-native request body, endpoint path, method, and feature flags",
    lifecycle: ["turn"],
    resources: [],
    conformance: "provider:request-shape",
    implementations: ["provider.request-shape.openai-compatible", "provider.request-shape.anthropic", "provider.request-shape.google"],
    personalityAtoms: ["opencode.provider.request-options", "pi.provider.request-options", "nanobot.provider.request-options", "hermes.provider.request-options"],
  },
  {
    id: "provider.stream-parser",
    input: "raw provider bytes, SSE frames, JSON chunks, or recorded cassette chunks",
    output: "provider-native parsed stream events with frame and parse error metadata",
    lifecycle: ["turn"],
    resources: [],
    conformance: "provider:stream-parser",
    implementations: ["provider.stream-parser.sse", "provider.stream-parser.json", "provider.stream-parser.cassette"],
    personalityAtoms: ["opencode.provider.parser-observer", "pi.provider.parser-observer", "nanobot.provider.parser-observer", "hermes.provider.parser-observer"],
  },
  {
    id: "provider.streaming-delta-recorder",
    input: "raw provider stream chunks, normalized provider events, redaction policy, and cassette metadata",
    output: "chunk-level delta signature with semantic classes, raw chunk hashes, tool JSON deltas, and finish reasons",
    lifecycle: ["turn"],
    resources: [],
    conformance: "provider:streaming-delta-recorder",
    implementations: ["common.provider.streaming-delta-recorder"],
    personalityAtoms: [
      "opencode.provider.streaming-delta-recorder.native-like",
      "pi.provider.streaming-delta-recorder.native-like",
      "nanobot.provider.streaming-delta-recorder.native-like",
      "hermes.provider.streaming-delta-recorder.native-like",
    ],
  },
  {
    id: "provider.event-normalizer",
    input: "provider-native parsed events for text, reasoning, tool calls, finish, and errors",
    output: "normalized ProviderStreamEvent sequence for common agent-loop consumption",
    lifecycle: ["turn"],
    resources: [],
    conformance: "provider:event-normalizer",
    implementations: ["provider.event-normalizer.common", "provider.event-normalizer.openai-compatible", "provider.event-normalizer.anthropic", "provider.event-normalizer.google"],
    personalityAtoms: ["opencode.provider.event-observer", "pi.provider.event-observer", "nanobot.provider.event-observer", "hermes.provider.event-observer"],
  },
  {
    id: "provider.usage-normalizer",
    input: "provider-native usage, cache, reasoning, finish-reason, and pricing metadata",
    output: "normalized usage/cost/reasoning/finish metadata safe for artifacts",
    lifecycle: ["turn"],
    resources: [],
    conformance: "provider:usage-normalizer",
    implementations: ["provider.usage-normalizer.common", "provider.usage-normalizer.pricing-table"],
    personalityAtoms: ["opencode.provider.usage-renderer", "pi.provider.usage-renderer", "nanobot.provider.usage-renderer", "hermes.provider.usage-renderer"],
    personalityAtomImplementationKinds: { "opencode.provider.usage-renderer": "factory" },
  },
  {
    id: "provider.cassette",
    input: "sanitized provider request/response stream, model metadata, and redaction policy",
    output: "recorded or replayed cassette events without credential-shaped fields",
    lifecycle: ["turn"],
    resources: [{ id: "filesystem", mode: "write", scope: "workspace" }],
    conformance: "provider:cassette",
    implementations: ["provider.cassette.jsonl", "provider.cassette.memory"],
    personalityAtoms: ["opencode.provider.cassette-artifact", "pi.provider.cassette-artifact", "nanobot.provider.cassette-artifact", "hermes.provider.cassette-artifact"],
  },
  {
    id: "provider.stream",
    input: "ProviderRequest with model, system messages, transcript messages, tools, options, and abort signal",
    output: "normalized ProviderStreamEvent sequence for text, reasoning, tool calls, parts, finish, usage, and cost",
    lifecycle: ["turn"],
    resources: [{ id: "network", mode: "execute", scope: "external" }],
    conformance: "provider:stream",
    implementations: ["provider.stream.openai-compatible", "provider.stream.openrouter", "provider.stream.anthropic", "provider.stream.google"],
    personalityAtoms: ["opencode.provider.plugin-descriptor", "pi.provider.extension-descriptor", "nanobot.provider.plugin-descriptor", "hermes.provider.plugin-descriptor"],
  },
  {
    id: "provider.stream-projector",
    input: "normalized ProviderStreamEvent sequence and product-native stream protocol requirements",
    output: "product-native stream event projection plus lossiness/projection-gap annotations",
    lifecycle: ["turn"],
    resources: [],
    conformance: "provider:stream-projector",
    implementations: ["common.provider.stream-projector"],
    personalityAtoms: [
      "opencode.provider.stream-projector.native-like",
      "pi.provider.stream-projector.native-like",
      "nanobot.provider.stream-projector.native-like",
      "hermes.provider.stream-projector.native-like",
    ],
  },
]

export type NanobotProviderSourceRefID =
  | "provider-registry"
  | "openai-compatible-provider"
  | "anthropic-provider"
  | "provider-factory"

export interface NanobotProviderSourceRef {
  id: NanobotProviderSourceRefID
  repo: "HKUDS/nanobot"
  ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-10"
}

export type NanobotProviderSourceMatrixBranchID =
  | "registry-selection"
  | "model-registry"
  | "request-options"
  | "auth-descriptor"
  | "stream-parser"
  | "event-normalizer"
  | "usage-renderer"
  | "transport-instrumentation"
  | "provider-plugin-descriptor"
  | "live-provider-factory"
  | "exact-provider-retry-cancel"

export type NanobotProviderSourceMatrixBranchStatus = "partial" | "missing"

export interface NanobotProviderSourceMatrixBranchAnchor {
  branchID: NanobotProviderSourceMatrixBranchID
  status: NanobotProviderSourceMatrixBranchStatus
  sourceRefIDs: NanobotProviderSourceRefID[]
  providerAtomIDs: string[]
  providerPortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface NanobotProviderSourceMatrixSnapshot {
  schemaVersion: 1
  upstreamRef: "package:nanobot-ai@0.2.0"
  pinnedRepo: "HKUDS/nanobot"
  pinnedRef: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
  evidenceRef: "conformance:nanobot-provider-source-matrix"
  fixtureID: "nanobot-provider:source-matrix"
  sourceRefs: NanobotProviderSourceRef[]
  branchAnchors: NanobotProviderSourceMatrixBranchAnchor[]
  partialBranchIDs: NanobotProviderSourceMatrixBranchID[]
  missingBranchIDs: NanobotProviderSourceMatrixBranchID[]
  coveredProviderAtomIDs: string[]
  coveredProviderPortIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

const NANOBOT_PROVIDER_SOURCE_REFS: NanobotProviderSourceRef[] = [
  {
    id: "provider-registry",
    repo: "HKUDS/nanobot",
    ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    path: "nanobot/providers/registry.py",
    symbols: ["ProviderSpec", "find_by_name"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "openai-compatible-provider",
    repo: "HKUDS/nanobot",
    ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    path: "nanobot/providers/openai_compat_provider.py",
    symbols: ["OpenAICompatProvider", "chat", "chat_stream", "_build_kwargs", "_parse_chunks"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "anthropic-provider",
    repo: "HKUDS/nanobot",
    ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    path: "nanobot/providers/anthropic_provider.py",
    symbols: ["AnthropicProvider", "chat", "chat_stream", "_convert_messages", "_convert_tools"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "provider-factory",
    repo: "HKUDS/nanobot",
    ref: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
    path: "nanobot/providers/factory.py",
    symbols: ["ProviderSnapshot", "make_provider", "build_provider_snapshot", "load_provider_snapshot", "provider_signature"],
    evidence: "github-tree:2026-06-10",
  },
]

function nanobotProviderSourceBranchAnchor(input: NanobotProviderSourceMatrixBranchAnchor): NanobotProviderSourceMatrixBranchAnchor {
  return input
}

export function buildNanobotProviderSourceMatrixSnapshot(): NanobotProviderSourceMatrixSnapshot {
  const branchAnchors: NanobotProviderSourceMatrixBranchAnchor[] = [
    nanobotProviderSourceBranchAnchor({
      branchID: "registry-selection",
      status: "partial",
      sourceRefIDs: ["provider-registry", "provider-factory"],
      providerAtomIDs: ["nanobot.provider.model-registry"],
      providerPortIDs: ["provider.model-registry"],
      localEvidenceRefs: ["provider-port:provider.model-registry", "current-module:nanobot-provider-source-locations"],
      localMarkers: ["ProviderSpec", "find_by_name", "make_provider", "provider_signature"],
      knownGaps: ["nanobot-provider-registry-live-config-not-replayed"],
    }),
    nanobotProviderSourceBranchAnchor({
      branchID: "model-registry",
      status: "partial",
      sourceRefIDs: ["provider-registry", "provider-factory"],
      providerAtomIDs: ["nanobot.provider.model-registry"],
      providerPortIDs: ["provider.model-registry"],
      localEvidenceRefs: ["provider-port:provider.model-registry"],
      localMarkers: ["model-filter", "provider-snapshot", "signature"],
      knownGaps: ["nanobot-provider-model-registry-remote-metadata-not-replayed"],
    }),
    nanobotProviderSourceBranchAnchor({
      branchID: "request-options",
      status: "partial",
      sourceRefIDs: ["openai-compatible-provider", "anthropic-provider"],
      providerAtomIDs: ["nanobot.provider.request-options"],
      providerPortIDs: ["provider.request-shape"],
      localEvidenceRefs: ["provider-port:provider.request-shape", "nanobot-provider-stream:raw-payload-roundtrip"],
      localMarkers: ["OpenAICompatProvider._build_kwargs", "AnthropicProvider._convert_messages", "AnthropicProvider._convert_tools"],
      knownGaps: ["nanobot-provider-native-request-shape-not-spawned"],
    }),
    nanobotProviderSourceBranchAnchor({
      branchID: "auth-descriptor",
      status: "partial",
      sourceRefIDs: ["provider-factory", "openai-compatible-provider", "anthropic-provider"],
      providerAtomIDs: ["nanobot.provider.auth-descriptor"],
      providerPortIDs: ["provider.auth"],
      localEvidenceRefs: ["provider-port:provider.auth"],
      localMarkers: ["provider_signature", "api-key-header", "redacted-auth-boundary"],
      knownGaps: ["nanobot-provider-env-secret-resolution-not-replayed"],
    }),
    nanobotProviderSourceBranchAnchor({
      branchID: "stream-parser",
      status: "partial",
      sourceRefIDs: ["openai-compatible-provider", "anthropic-provider"],
      providerAtomIDs: ["nanobot.provider.parser-observer"],
      providerPortIDs: ["provider.stream-parser"],
      localEvidenceRefs: ["nanobot-provider-stream:raw-frame-timeline", "nanobot-provider-stream:raw-payload-roundtrip"],
      localMarkers: ["OpenAICompatProvider._parse_chunks", "AnthropicProvider.chat_stream", "raw-frame-order"],
      knownGaps: ["nanobot-provider-parser-native-error-frame-detail-not-replayed"],
    }),
    nanobotProviderSourceBranchAnchor({
      branchID: "event-normalizer",
      status: "partial",
      sourceRefIDs: ["openai-compatible-provider", "anthropic-provider"],
      providerAtomIDs: ["nanobot.provider.event-observer"],
      providerPortIDs: ["provider.event-normalizer"],
      localEvidenceRefs: ["provider-stream-replay:nanobot:stream-projector", "provider-raw-payload-roundtrip:nanobot"],
      localMarkers: ["text-delta", "tool-call-arguments", "finish-usage", "error-finish"],
      knownGaps: ["nanobot-provider-event-normalizer-raw-private-state-not-replayed"],
    }),
    nanobotProviderSourceBranchAnchor({
      branchID: "usage-renderer",
      status: "partial",
      sourceRefIDs: ["openai-compatible-provider", "anthropic-provider"],
      providerAtomIDs: ["nanobot.provider.usage-renderer"],
      providerPortIDs: ["provider.usage-normalizer"],
      localEvidenceRefs: ["nanobot-provider-stream:raw-payload-roundtrip"],
      localMarkers: ["usage", "finish-reason", "cost-estimate-boundary"],
      knownGaps: ["nanobot-provider-native-usage-accounting-not-replayed"],
    }),
    nanobotProviderSourceBranchAnchor({
      branchID: "transport-instrumentation",
      status: "partial",
      sourceRefIDs: ["openai-compatible-provider", "anthropic-provider"],
      providerAtomIDs: ["nanobot.provider.transport-instrumentation"],
      providerPortIDs: ["provider.transport"],
      localEvidenceRefs: ["provider-raw-frame-timeline:nanobot"],
      localMarkers: ["streaming-http", "sse-frame", "retry-error-boundary", "cancel-boundary"],
      knownGaps: ["nanobot-provider-live-http-transport-not-replayed", "nanobot-provider-retry-delay-not-exact"],
    }),
    nanobotProviderSourceBranchAnchor({
      branchID: "provider-plugin-descriptor",
      status: "partial",
      sourceRefIDs: ["provider-factory", "provider-registry"],
      providerAtomIDs: ["nanobot.provider.plugin-descriptor"],
      providerPortIDs: ["provider.stream"],
      localEvidenceRefs: ["provider-port:provider.stream", "provider-stream-replay:nanobot:streaming-delta-recorder"],
      localMarkers: ["make_provider", "build_provider_snapshot", "load_provider_snapshot"],
      knownGaps: ["nanobot-provider-plugin-runtime-side-effects-not-replayed"],
    }),
    nanobotProviderSourceBranchAnchor({
      branchID: "live-provider-factory",
      status: "missing",
      sourceRefIDs: ["provider-factory", "provider-registry"],
      providerAtomIDs: ["nanobot.provider.plugin-descriptor", "nanobot.provider.model-registry"],
      providerPortIDs: ["provider.stream", "provider.model-registry"],
      localEvidenceRefs: ["nanobot-provider:source-matrix"],
      localMarkers: ["source-anchored-only"],
      knownGaps: ["nanobot-live-provider-factory-not-spawned"],
    }),
    nanobotProviderSourceBranchAnchor({
      branchID: "exact-provider-retry-cancel",
      status: "missing",
      sourceRefIDs: ["openai-compatible-provider", "anthropic-provider"],
      providerAtomIDs: ["nanobot.provider.transport-instrumentation", "nanobot.provider.parser-observer"],
      providerPortIDs: ["provider.transport", "provider.stream-parser"],
      localEvidenceRefs: ["nanobot-provider-stream:raw-frame-timeline"],
      localMarkers: ["retry:partial", "cancel:partial", "wall-clock:not-replayed"],
      knownGaps: ["nanobot-provider-retry-delay-and-cancel-abort-race-not-exact"],
    }),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    upstreamRef: "package:nanobot-ai@0.2.0" as const,
    pinnedRepo: "HKUDS/nanobot" as const,
    pinnedRef: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7" as const,
    evidenceRef: "conformance:nanobot-provider-source-matrix" as const,
    fixtureID: "nanobot-provider:source-matrix" as const,
    sourceRefs: NANOBOT_PROVIDER_SOURCE_REFS,
    branchAnchors,
    partialBranchIDs: branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredProviderAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.providerAtomIDs)),
    coveredProviderPortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.providerPortIDs)),
    knownGaps: uniqueStrings([
      "nanobot-provider-source-matrix-covered-by-partial-fixture",
      ...branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export type HermesProviderSourceRefID =
  | "codex-responses-transport"
  | "anthropic-transport"
  | "chat-completions-transport"
  | "transport-types"

export interface HermesProviderSourceRef {
  id: HermesProviderSourceRefID
  repo: "NousResearch/hermes-agent"
  ref: "92a567db2d7a5031df8211efbfdad864c2f51faf"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-10"
}

export type HermesProviderSourceMatrixBranchID =
  | "codex-responses-request"
  | "anthropic-request"
  | "chat-completions-request"
  | "model-registry"
  | "request-options"
  | "auth-descriptor"
  | "stream-parser"
  | "event-normalizer"
  | "usage-renderer"
  | "transport-instrumentation"
  | "provider-plugin-descriptor"
  | "live-transport-factory"
  | "exact-provider-retry-cancel"

export type HermesProviderSourceMatrixBranchStatus = "partial" | "missing"

export interface HermesProviderSourceMatrixBranchAnchor {
  branchID: HermesProviderSourceMatrixBranchID
  status: HermesProviderSourceMatrixBranchStatus
  sourceRefIDs: HermesProviderSourceRefID[]
  providerAtomIDs: string[]
  providerPortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface HermesProviderSourceMatrixSnapshot {
  schemaVersion: 1
  upstreamRef: "package:hermes-agent==0.15.1"
  pinnedRepo: "NousResearch/hermes-agent"
  pinnedRef: "92a567db2d7a5031df8211efbfdad864c2f51faf"
  evidenceRef: "conformance:hermes-provider-source-matrix"
  fixtureID: "hermes-provider:source-matrix"
  sourceRefs: HermesProviderSourceRef[]
  branchAnchors: HermesProviderSourceMatrixBranchAnchor[]
  partialBranchIDs: HermesProviderSourceMatrixBranchID[]
  missingBranchIDs: HermesProviderSourceMatrixBranchID[]
  coveredProviderAtomIDs: string[]
  coveredProviderPortIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

const HERMES_PROVIDER_SOURCE_REFS: HermesProviderSourceRef[] = [
  {
    id: "codex-responses-transport",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    path: "agent/transports/codex.py",
    symbols: ["ResponsesApiTransport", "convert_messages", "build_kwargs", "normalize_response", "validate_response"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "anthropic-transport",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    path: "agent/transports/anthropic.py",
    symbols: ["AnthropicTransport", "convert_messages", "build_kwargs", "normalize_response", "validate_response"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "chat-completions-transport",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    path: "agent/transports/chat_completions.py",
    symbols: ["ChatCompletionsTransport", "convert_messages", "build_kwargs", "normalize_response", "validate_response"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "transport-types",
    repo: "NousResearch/hermes-agent",
    ref: "92a567db2d7a5031df8211efbfdad864c2f51faf",
    path: "agent/transports/types.py",
    symbols: ["ToolCall", "Usage", "NormalizedResponse", "build_tool_call", "map_finish_reason"],
    evidence: "github-tree:2026-06-10",
  },
]

function hermesProviderSourceBranchAnchor(input: HermesProviderSourceMatrixBranchAnchor): HermesProviderSourceMatrixBranchAnchor {
  return input
}

export function buildHermesProviderSourceMatrixSnapshot(): HermesProviderSourceMatrixSnapshot {
  const branchAnchors: HermesProviderSourceMatrixBranchAnchor[] = [
    hermesProviderSourceBranchAnchor({
      branchID: "codex-responses-request",
      status: "partial",
      sourceRefIDs: ["codex-responses-transport", "transport-types"],
      providerAtomIDs: ["hermes.provider.request-options", "hermes.provider.plugin-descriptor"],
      providerPortIDs: ["provider.request-shape", "provider.stream"],
      localEvidenceRefs: ["provider-port:provider.request-shape", "provider-port:provider.stream"],
      localMarkers: ["ResponsesApiTransport", "convert_messages", "build_kwargs", "normalize_response"],
      knownGaps: ["hermes-codex-responses-live-transport-not-spawned"],
    }),
    hermesProviderSourceBranchAnchor({
      branchID: "anthropic-request",
      status: "partial",
      sourceRefIDs: ["anthropic-transport", "transport-types"],
      providerAtomIDs: ["hermes.provider.request-options", "hermes.provider.plugin-descriptor"],
      providerPortIDs: ["provider.request-shape", "provider.stream"],
      localEvidenceRefs: ["provider-port:provider.request-shape", "provider-port:provider.stream"],
      localMarkers: ["AnthropicTransport", "convert_messages", "build_kwargs", "normalize_response"],
      knownGaps: ["hermes-anthropic-live-transport-not-spawned"],
    }),
    hermesProviderSourceBranchAnchor({
      branchID: "chat-completions-request",
      status: "partial",
      sourceRefIDs: ["chat-completions-transport", "transport-types"],
      providerAtomIDs: ["hermes.provider.request-options", "hermes.provider.plugin-descriptor"],
      providerPortIDs: ["provider.request-shape", "provider.stream"],
      localEvidenceRefs: ["provider-port:provider.request-shape", "provider-port:provider.stream"],
      localMarkers: ["ChatCompletionsTransport", "convert_messages", "build_kwargs", "normalize_response"],
      knownGaps: ["hermes-chat-completions-live-transport-not-spawned"],
    }),
    hermesProviderSourceBranchAnchor({
      branchID: "model-registry",
      status: "partial",
      sourceRefIDs: ["codex-responses-transport", "anthropic-transport", "chat-completions-transport"],
      providerAtomIDs: ["hermes.provider.model-registry"],
      providerPortIDs: ["provider.model-registry"],
      localEvidenceRefs: ["provider-port:provider.model-registry", "current-module:hermes-provider-source-locations"],
      localMarkers: ["transport-class-registry", "provider-model-selection", "validate_response"],
      knownGaps: ["hermes-provider-model-registry-remote-metadata-not-replayed"],
    }),
    hermesProviderSourceBranchAnchor({
      branchID: "request-options",
      status: "partial",
      sourceRefIDs: ["codex-responses-transport", "anthropic-transport", "chat-completions-transport"],
      providerAtomIDs: ["hermes.provider.request-options"],
      providerPortIDs: ["provider.request-shape"],
      localEvidenceRefs: ["provider-port:provider.request-shape", "hermes-agent-provider-stream:raw-payload-roundtrip"],
      localMarkers: ["convert_messages", "build_kwargs", "tool_choice", "reasoning_content"],
      knownGaps: ["hermes-provider-native-request-shape-not-spawned"],
    }),
    hermesProviderSourceBranchAnchor({
      branchID: "auth-descriptor",
      status: "partial",
      sourceRefIDs: ["codex-responses-transport", "anthropic-transport", "chat-completions-transport"],
      providerAtomIDs: ["hermes.provider.auth-descriptor"],
      providerPortIDs: ["provider.auth"],
      localEvidenceRefs: ["provider-port:provider.auth"],
      localMarkers: ["api-key-header", "provider-auth-boundary", "redacted-auth-boundary"],
      knownGaps: ["hermes-provider-env-secret-resolution-not-replayed"],
    }),
    hermesProviderSourceBranchAnchor({
      branchID: "stream-parser",
      status: "partial",
      sourceRefIDs: ["codex-responses-transport", "anthropic-transport", "chat-completions-transport", "transport-types"],
      providerAtomIDs: ["hermes.provider.parser-observer"],
      providerPortIDs: ["provider.stream-parser"],
      localEvidenceRefs: ["hermes-agent-provider-stream:raw-frame-timeline", "hermes-agent-provider-stream:raw-payload-roundtrip"],
      localMarkers: ["normalize_response", "validate_response", "raw-frame-order", "response_item_id"],
      knownGaps: ["hermes-provider-parser-native-error-frame-detail-not-replayed"],
    }),
    hermesProviderSourceBranchAnchor({
      branchID: "event-normalizer",
      status: "partial",
      sourceRefIDs: ["codex-responses-transport", "anthropic-transport", "chat-completions-transport", "transport-types"],
      providerAtomIDs: ["hermes.provider.event-observer"],
      providerPortIDs: ["provider.event-normalizer"],
      localEvidenceRefs: ["provider-stream-replay:hermes-agent:stream-projector", "provider-raw-payload-roundtrip:hermes-agent"],
      localMarkers: ["ToolCall", "NormalizedResponse", "reasoning_content", "codex_message_items"],
      knownGaps: ["hermes-provider-event-normalizer-raw-private-state-not-replayed"],
    }),
    hermesProviderSourceBranchAnchor({
      branchID: "usage-renderer",
      status: "partial",
      sourceRefIDs: ["codex-responses-transport", "anthropic-transport", "chat-completions-transport", "transport-types"],
      providerAtomIDs: ["hermes.provider.usage-renderer"],
      providerPortIDs: ["provider.usage-normalizer"],
      localEvidenceRefs: ["hermes-agent-provider-stream:raw-payload-roundtrip"],
      localMarkers: ["Usage", "map_finish_reason", "finish_reason", "usage"],
      knownGaps: ["hermes-provider-native-usage-accounting-not-replayed"],
    }),
    hermesProviderSourceBranchAnchor({
      branchID: "transport-instrumentation",
      status: "partial",
      sourceRefIDs: ["codex-responses-transport", "anthropic-transport", "chat-completions-transport"],
      providerAtomIDs: ["hermes.provider.transport-instrumentation"],
      providerPortIDs: ["provider.transport"],
      localEvidenceRefs: ["provider-raw-frame-timeline:hermes-agent"],
      localMarkers: ["streaming-http", "response-validation", "retry-error-boundary", "cancel-boundary"],
      knownGaps: ["hermes-provider-live-http-transport-not-replayed", "hermes-provider-retry-delay-not-exact"],
    }),
    hermesProviderSourceBranchAnchor({
      branchID: "provider-plugin-descriptor",
      status: "partial",
      sourceRefIDs: ["codex-responses-transport", "anthropic-transport", "chat-completions-transport", "transport-types"],
      providerAtomIDs: ["hermes.provider.plugin-descriptor"],
      providerPortIDs: ["provider.stream"],
      localEvidenceRefs: ["provider-port:provider.stream", "provider-stream-replay:hermes-agent:streaming-delta-recorder"],
      localMarkers: ["ResponsesApiTransport", "AnthropicTransport", "ChatCompletionsTransport", "NormalizedResponse"],
      knownGaps: ["hermes-provider-plugin-runtime-side-effects-not-replayed"],
    }),
    hermesProviderSourceBranchAnchor({
      branchID: "live-transport-factory",
      status: "missing",
      sourceRefIDs: ["codex-responses-transport", "anthropic-transport", "chat-completions-transport"],
      providerAtomIDs: ["hermes.provider.plugin-descriptor", "hermes.provider.model-registry"],
      providerPortIDs: ["provider.stream", "provider.model-registry"],
      localEvidenceRefs: ["hermes-provider:source-matrix"],
      localMarkers: ["source-anchored-only"],
      knownGaps: ["hermes-live-transport-factory-not-spawned"],
    }),
    hermesProviderSourceBranchAnchor({
      branchID: "exact-provider-retry-cancel",
      status: "missing",
      sourceRefIDs: ["codex-responses-transport", "anthropic-transport", "chat-completions-transport"],
      providerAtomIDs: ["hermes.provider.transport-instrumentation", "hermes.provider.parser-observer"],
      providerPortIDs: ["provider.transport", "provider.stream-parser"],
      localEvidenceRefs: ["hermes-agent-provider-stream:raw-frame-timeline"],
      localMarkers: ["retry:partial", "cancel:partial", "wall-clock:not-replayed"],
      knownGaps: ["hermes-provider-retry-delay-and-cancel-abort-race-not-exact"],
    }),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    upstreamRef: "package:hermes-agent==0.15.1" as const,
    pinnedRepo: "NousResearch/hermes-agent" as const,
    pinnedRef: "92a567db2d7a5031df8211efbfdad864c2f51faf" as const,
    evidenceRef: "conformance:hermes-provider-source-matrix" as const,
    fixtureID: "hermes-provider:source-matrix" as const,
    sourceRefs: HERMES_PROVIDER_SOURCE_REFS,
    branchAnchors,
    partialBranchIDs: branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredProviderAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.providerAtomIDs)),
    coveredProviderPortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.providerPortIDs)),
    knownGaps: uniqueStrings([
      "hermes-provider-source-matrix-covered-by-partial-fixture",
      ...branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export type OpenCodeProviderSourceRefID =
  | "llm-request-prep"
  | "llm-native-request"
  | "plugin-hooks"
  | "session-usage"
  | "session-retry"
  | "provider-plugins"
  | "dynamic-provider-plugin"
  | "openai-provider-plugin"
  | "aisdk-provider-plugins"

export interface OpenCodeProviderSourceRef {
  id: OpenCodeProviderSourceRefID
  repo: "anomalyco/opencode"
  ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-10" | "github-tree:2026-06-11" | "github-tree:2026-06-12"
}

export type OpenCodeProviderSourceMatrixBranchID =
  | "provider-plugin-registry"
  | "model-plugin"
  | "request-options"
  | "auth-descriptor"
  | "stream-parser"
  | "event-normalizer"
  | "usage-renderer"
  | "transport-instrumentation"
  | "provider-plugin-descriptor"
  | "live-provider-plugin-runtime"
  | "exact-provider-retry-cancel"

export type OpenCodeProviderSourceMatrixBranchStatus = "partial" | "missing" | "native-exact"

export interface OpenCodeProviderSourceMatrixBranchAnchor {
  branchID: OpenCodeProviderSourceMatrixBranchID
  status: OpenCodeProviderSourceMatrixBranchStatus
  sourceRefIDs: OpenCodeProviderSourceRefID[]
  providerAtomIDs: string[]
  providerPortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface OpenCodeProviderSourceMatrixSnapshot {
  schemaVersion: 1
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  pinnedRepo: "anomalyco/opencode"
  pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-provider-source-matrix"
  fixtureID: "opencode-provider:source-matrix"
  sourceRefs: OpenCodeProviderSourceRef[]
  branchAnchors: OpenCodeProviderSourceMatrixBranchAnchor[]
  partialBranchIDs: OpenCodeProviderSourceMatrixBranchID[]
  missingBranchIDs: OpenCodeProviderSourceMatrixBranchID[]
  coveredProviderAtomIDs: string[]
  coveredProviderPortIDs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

const OPENCODE_PROVIDER_SOURCE_REFS: OpenCodeProviderSourceRef[] = [
  {
    id: "llm-request-prep",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/llm/request.ts",
    symbols: ["Prepared", "prepare", "hasToolCalls", "LLMRequestPrep"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "llm-native-request",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/llm/native-request.ts",
    symbols: ["RequestInput", "model", "request", "LLMNative"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "plugin-hooks",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/plugin/src/index.ts",
    symbols: ["Hooks", "chat.params", "chat.headers"],
    evidence: "github-tree:2026-06-12",
  },
  {
    id: "session-usage",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/session.ts",
    symbols: ["getUsage"],
    evidence: "github-tree:2026-06-12",
  },
  {
    id: "session-retry",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/retry.ts",
    symbols: ["RetryReason", "Retryable", "delay", "policy", "retryable"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "provider-plugins",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin/provider.ts",
    symbols: ["ProviderPlugins"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "dynamic-provider-plugin",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin/provider/dynamic.ts",
    symbols: ["DynamicProviderPlugin", "aisdk.sdk", "Npm.add", "pathToFileURL"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "openai-provider-plugin",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin/provider/openai.ts",
    symbols: ["OpenAIPlugin", "aisdk.sdk", "aisdk.language", "catalog.transform"],
    evidence: "github-tree:2026-06-12",
  },
  {
    id: "aisdk-provider-plugins",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin/provider",
    symbols: ["AnthropicPlugin", "OpenAICompatiblePlugin", "GatewayPlugin", "PerplexityPlugin", "GooglePlugin", "XAIPlugin", "OpenRouterPlugin", "aisdk.sdk", "aisdk.language", "catalog.transform"],
    evidence: "github-tree:2026-06-12",
  },
]

function openCodeProviderSourceBranchAnchor(input: OpenCodeProviderSourceMatrixBranchAnchor): OpenCodeProviderSourceMatrixBranchAnchor {
  return input
}

export function buildOpenCodeProviderSourceMatrixSnapshot(): OpenCodeProviderSourceMatrixSnapshot {
  const branchAnchors: OpenCodeProviderSourceMatrixBranchAnchor[] = [
    openCodeProviderSourceBranchAnchor({
      branchID: "provider-plugin-registry",
      status: "native-exact",
      sourceRefIDs: ["provider-plugins", "llm-native-request"],
      providerAtomIDs: ["opencode.provider.model-plugin", "opencode.provider.plugin-descriptor"],
      providerPortIDs: ["provider.model-registry", "provider.stream"],
      localEvidenceRefs: [
        "opencode-plugin-provider-registry:native-exact-fixture",
        "plugin-provider-registry-native-exact:opencode",
      ],
      localMarkers: ["collectAuthHooks", "collectProviderModelHooks", "collectAuthLoaderHooks", "opencode.provider:sample-plugin"],
      knownGaps: [],
    }),
    openCodeProviderSourceBranchAnchor({
      branchID: "model-plugin",
      status: "native-exact",
      sourceRefIDs: ["llm-native-request", "provider-plugins"],
      providerAtomIDs: ["opencode.provider.model-plugin"],
      providerPortIDs: ["provider.model-registry"],
      localEvidenceRefs: [
        "opencode-provider-model-plugin:native-exact-fixture",
        "provider-model-plugin-native-exact:opencode",
      ],
      localMarkers: ["toPublicInfo", "loadModels", "providerID", "disabled-provider-filter"],
      knownGaps: [],
    }),
    openCodeProviderSourceBranchAnchor({
      branchID: "request-options",
      status: "native-exact",
      sourceRefIDs: ["llm-request-prep", "plugin-hooks"],
      providerAtomIDs: ["opencode.provider.request-options"],
      providerPortIDs: ["provider.request-shape"],
      localEvidenceRefs: ["opencode-provider-request-options:native-exact-fixture", "provider-request-options-native-exact:opencode"],
      localMarkers: ["chat.params", "chat.headers", "messageTransformOptions", "x-opencode-session", "x-session-affinity"],
      knownGaps: [],
    }),
    openCodeProviderSourceBranchAnchor({
      branchID: "auth-descriptor",
      status: "native-exact",
      sourceRefIDs: ["llm-native-request", "provider-plugins"],
      providerAtomIDs: ["opencode.provider.auth-descriptor"],
      providerPortIDs: ["provider.auth"],
      localEvidenceRefs: [
        "opencode-provider-auth-descriptor:native-exact-fixture",
        "provider-auth-descriptor-native-exact:opencode",
      ],
      localMarkers: ["auth-info-schema", "store-key-normalization", "opencode.auth:sample-plugin"],
      knownGaps: [],
    }),
    openCodeProviderSourceBranchAnchor({
      branchID: "stream-parser",
      status: "native-exact",
      sourceRefIDs: ["llm-request-prep", "llm-native-request"],
      providerAtomIDs: ["opencode.provider.parser-observer"],
      providerPortIDs: ["provider.stream-parser"],
      localEvidenceRefs: [
        "opencode-provider-parser-observer:native-exact-fixture",
        "provider-parser-observer-native-exact:opencode",
      ],
      localMarkers: ["context_overflow", "api_error", "retryable", "status-fallback"],
      knownGaps: [],
    }),
    openCodeProviderSourceBranchAnchor({
      branchID: "event-normalizer",
      status: "native-exact",
      sourceRefIDs: ["llm-request-prep", "llm-native-request"],
      providerAtomIDs: ["opencode.provider.event-observer"],
      providerPortIDs: ["provider.event-normalizer"],
      localEvidenceRefs: [
        "opencode-provider-event-observer:native-exact-fixture",
        "provider-event-observer-native-exact:opencode",
      ],
      localMarkers: ["session-visible-stream-chunks", "implicit-block-ids", "finish-resets-reused-state"],
      knownGaps: [],
    }),
    openCodeProviderSourceBranchAnchor({
      branchID: "usage-renderer",
      status: "native-exact",
      sourceRefIDs: ["llm-native-request", "session-usage"],
      providerAtomIDs: ["opencode.provider.usage-renderer"],
      providerPortIDs: ["provider.usage-normalizer"],
      localEvidenceRefs: ["opencode-provider-usage:native-exact-fixture", "provider-usage-native-exact:opencode"],
      localMarkers: ["getUsage", "cacheCreationInputTokens", "experimentalOver200K", "costInfo"],
      knownGaps: [],
    }),
    openCodeProviderSourceBranchAnchor({
      branchID: "transport-instrumentation",
      status: "native-exact",
      sourceRefIDs: ["llm-native-request", "provider-plugins"],
      providerAtomIDs: ["opencode.provider.transport-instrumentation"],
      providerPortIDs: ["provider.transport"],
      localEvidenceRefs: [
        "opencode-provider-transport-instrumentation:native-exact-fixture",
        "provider-transport-instrumentation-native-exact:opencode",
      ],
      localMarkers: ["wrapSSE", "timeout:false", "AbortSignal.any", "AbortSignal.timeout", "openai-azure-item-id-scrub"],
      knownGaps: [],
    }),
    openCodeProviderSourceBranchAnchor({
      branchID: "provider-plugin-descriptor",
      status: "native-exact",
      sourceRefIDs: ["provider-plugins", "llm-native-request"],
      providerAtomIDs: ["opencode.provider.plugin-descriptor"],
      providerPortIDs: ["provider.stream"],
      localEvidenceRefs: [
        "opencode-provider-plugin-descriptor:native-exact-fixture",
        "provider-plugin-descriptor-native-exact:opencode",
      ],
      localMarkers: ["provider-hook-schema", "provider-scope-identity", "opencode.provider:sample-plugin"],
      knownGaps: [],
    }),
    openCodeProviderSourceBranchAnchor({
      branchID: "live-provider-plugin-runtime",
      status: "native-exact",
      sourceRefIDs: ["provider-plugins", "dynamic-provider-plugin", "openai-provider-plugin", "aisdk-provider-plugins", "llm-native-request"],
      providerAtomIDs: ["opencode.provider.plugin-descriptor", "opencode.provider.model-plugin"],
      providerPortIDs: ["provider.stream", "provider.model-registry"],
      localEvidenceRefs: [
        "opencode-provider:source-matrix",
        "opencode-provider:plugin-runtime-matrix",
        openCodeProviderPackageRuntimeNativeExactDiffFixtureID,
        openCodeProviderPackageRuntimeNativeExactDiffEvidenceRef,
        openCodeProviderPackageRuntimeNativeExactDiffReplayRef,
        "opencode-provider-dynamic-package:native-exact-fixture",
        "provider-dynamic-package-native-exact:opencode",
        "opencode-provider-openai-plugin:native-exact-fixture",
        "provider-openai-plugin-native-exact:opencode",
        "opencode-provider-aisdk-plugins:native-exact-fixture",
        "provider-aisdk-plugins-native-exact:opencode",
        "opencode-provider:package-runtime-live-runtime-fixture",
      ],
      localMarkers: ["loadOpenCodePlugin", "DynamicProviderPlugin", "OpenAIPlugin", "AnthropicPlugin", "OpenAICompatiblePlugin", "GatewayPlugin", "PerplexityPlugin", "GooglePlugin", "XAIPlugin", "OpenRouterPlugin", "createOpenAI", "createAnthropic", "createOpenAICompatible", "createGateway", "createPerplexity", "createGoogleGenerativeAI", "createXai", "createOpenRouter", "responses", "includeUsage", "anthropic-beta", "openrouter-chat-alias-disabled", "gpt-5-chat-latest-disabled", "evt.sdk", "scope.dispose", "package-runtime-native-exact-diff", "package-runtime-live-readback", "non-function-create-export TypeError native"],
      knownGaps: [],
    }),
    openCodeProviderSourceBranchAnchor({
      branchID: "exact-provider-retry-cancel",
      status: "native-exact",
      sourceRefIDs: ["llm-native-request", "session-retry"],
      providerAtomIDs: ["opencode.provider.transport-instrumentation", "opencode.provider.parser-observer"],
      providerPortIDs: ["provider.transport", "provider.stream-parser"],
      localEvidenceRefs: [
        "opencode-turn-retry-policy:native-exact-fixture",
        "turn-retry-policy-native-exact:opencode",
        "opencode-provider-transport-instrumentation:native-exact-fixture",
        "provider-transport-instrumentation-native-exact:opencode",
        "opencode-provider-parser-observer:native-exact-fixture",
        "provider-parser-observer-native-exact:opencode",
      ],
      localMarkers: [
        "Retryable",
        "delay",
        "policy",
        "retry-after-ms-header",
        "server-error-retryable-even-with-sdk-flag-false",
        "context-overflow-not-retryable",
        "AbortSignal.any",
        "AbortSignal.timeout",
        "sse-read-timeout-aborts-and-cancels",
        "stream-overloaded-retryable",
        "api-openai-404-retryable",
      ],
      knownGaps: [],
    }),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    pinnedRepo: "anomalyco/opencode" as const,
    pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-provider-source-matrix" as const,
    fixtureID: "opencode-provider:source-matrix" as const,
    sourceRefs: OPENCODE_PROVIDER_SOURCE_REFS,
    branchAnchors,
    partialBranchIDs: branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredProviderAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.providerAtomIDs)),
    coveredProviderPortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.providerPortIDs)),
    nativeEvidenceRefs: uniqueStrings([
      "conformance:opencode-provider-source-matrix",
      ...providerNativeExactEvidenceRefs(branchAnchors),
    ]),
    fixtureIDs: uniqueStrings([
      "opencode-provider:source-matrix",
      ...providerNativeExactFixtureIDs(branchAnchors),
    ]),
    knownGaps: uniqueStrings([
      ...(branchAnchors.some((anchor) => anchor.status === "partial") ? ["opencode-provider-source-matrix-covered-by-partial-fixture"] : []),
      ...branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export type OpenCodeProviderRawFrameBoundarySourceRefID =
  | "upstream-llm-request-prep"
  | "upstream-llm-native-request"
  | "upstream-provider-error"
  | "upstream-session-message-from-error"
  | "upstream-session-retry"
  | "upstream-session-usage"
  | "upstream-provider-plugins"
  | "upstream-plugin-boot"
  | "upstream-provider-plugin-index"
  | "upstream-dynamic-provider-plugin"
  | "local-builtin-providers"
  | "local-builtin-provider-plugins"
  | "local-plugin-adapter"
  | "local-plugin-atoms"
  | "local-plugin-event-mapper"
  | "local-provider-request-options"
  | "local-dynamic-provider-package"
  | "local-provider-parser-observer"
  | "local-provider-event-observer"
  | "local-provider-stream-projector"
  | "local-provider-usage"
  | "local-provider-ports"
  | "local-openai-compatible-provider"
  | "local-opencode-custom-provider"
  | "local-opencode-retry-cancel"
  | "local-provider-normalizer"
  | "local-package-runtime-projection"

export interface OpenCodeProviderRawFrameBoundarySourceRef {
  id: OpenCodeProviderRawFrameBoundarySourceRefID
  repo: "anomalyco/opencode" | "helix/local"
  ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab" | "current"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-11" | "local-source:2026-06-11" | "local-source:2026-06-12"
}

export type OpenCodeProviderRawFrameBoundaryID =
  | "builtin-provider-descriptor-registration"
  | "plugin-provider-descriptor-registration"
  | "request-hook-to-provider-options"
  | "raw-sse-frame-parser-boundary"
  | "normalized-event-projection-boundary"
  | "usage-finish-cost-boundary"
  | "transport-retry-cancel-boundary"
  | "custom-provider-protocol-runtime"
  | "live-provider-plugin-runtime"
  | "exact-retry-cancel-timing"

export type OpenCodeProviderRawFrameBoundaryStatus = "native-exact" | "partial" | "missing"

export interface OpenCodeProviderRawFrameBoundaryShape {
  input: string
  output: string
  retainedFields: string[]
  lossyFields: string[]
}

export interface OpenCodeProviderRawFrameBoundaryAnchor {
  boundaryID: OpenCodeProviderRawFrameBoundaryID
  status: OpenCodeProviderRawFrameBoundaryStatus
  sourceRefIDs: OpenCodeProviderRawFrameBoundarySourceRefID[]
  providerAtomIDs: string[]
  providerPortIDs: string[]
  fixtureDiffTarget: "provider.raw-frame-replay"
  boundary: OpenCodeProviderRawFrameBoundaryShape
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface OpenCodeProviderRawFrameBoundaryMatrixSnapshot {
  schemaVersion: 1
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  pinnedRepo: "anomalyco/opencode"
  pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-provider-raw-frame-boundary-matrix"
  fixtureID: "opencode-provider:raw-frame-boundary-matrix"
  fixtureDiffTarget: "provider.raw-frame-replay"
  sourceRefs: OpenCodeProviderRawFrameBoundarySourceRef[]
  boundaryAnchors: OpenCodeProviderRawFrameBoundaryAnchor[]
  partialBoundaryIDs: OpenCodeProviderRawFrameBoundaryID[]
  missingBoundaryIDs: OpenCodeProviderRawFrameBoundaryID[]
  coveredProviderAtomIDs: string[]
  coveredProviderPortIDs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

const OPENCODE_PROVIDER_RAW_FRAME_BOUNDARY_SOURCE_REFS: OpenCodeProviderRawFrameBoundarySourceRef[] = [
  {
    id: "upstream-llm-request-prep",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/llm/request.ts",
    symbols: ["Prepared", "prepare", "hasToolCalls", "LLMRequestPrep"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-llm-native-request",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/llm/native-request.ts",
    symbols: ["RequestInput", "model", "request", "LLMNative"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-provider-error",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/provider/error.ts",
    symbols: ["parseStreamError", "parseAPICallError", "OVERFLOW_PATTERNS"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-session-message-from-error",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/message-v2.ts",
    symbols: ["fromError", "ProviderError.parseStreamError", "ProviderError.parseAPICallError"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-session-retry",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/retry.ts",
    symbols: ["RetryReason", "Retryable", "delay", "policy", "retryable"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-session-usage",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/session/session.ts",
    symbols: ["getUsage"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-provider-plugins",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin/provider.ts",
    symbols: ["ProviderPlugins"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-plugin-boot",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin/boot.ts",
    symbols: ["PluginBoot", "EnvPlugin", "AccountPlugin", "ProviderPlugins", "ModelsDevPlugin"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-provider-plugin-index",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin/provider/index.ts",
    symbols: ["ProviderPlugins", "DynamicProviderPlugin", "AzurePlugin", "GoogleVertexPlugin"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-dynamic-provider-plugin",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin/provider/dynamic.ts",
    symbols: ["DynamicProviderPlugin", "aisdk.sdk", "Npm.add", "pathToFileURL"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "local-builtin-providers",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/builtin-providers.ts",
    symbols: ["openCodeBuiltinProviderDefinitions", "registerOpenCodeBuiltinProviderPlugins", "hooksForDefinition"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-builtin-provider-plugins",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-provider-builtin-plugins.ts",
    symbols: [
      "createOpenCodeProviderBuiltinPluginsBridge",
      "captureOpenCodeProviderBuiltinPluginsNativeExactFixture",
      "verifyOpenCodeProviderBuiltinPluginsNativeExactFixture",
    ],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-plugin-adapter",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/plugin-adapter.ts",
    symbols: ["OpenCodeHooks", "loadOpenCodePlugin", "registerOpenCodeHooks"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-plugin-atoms",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/plugin-atoms.ts",
    symbols: ["createOpenCodePluginRegistryBridge", "createOpenCodePluginEventMapper", "provider.request.before"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-plugin-event-mapper",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-plugin-event-mapper.ts",
    symbols: ["createOpenCodeNativePluginEventMapper", "provider.request.before", "chat.params", "chat.headers"],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-provider-request-options",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-provider-request-options.ts",
    symbols: ["openCodeProviderRequestOptionsPrepare", "chat.params", "chat.headers", "messageTransformOptions"],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-dynamic-provider-package",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-provider-dynamic-package.ts",
    symbols: [
      "createOpenCodeDynamicProviderPackageBridge",
      "openCodeDynamicProviderPackageApply",
      "captureOpenCodeDynamicProviderPackageNativeExactFixture",
    ],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-provider-parser-observer",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-provider-parser-observer.ts",
    symbols: ["createOpenCodeProviderParserObserverBridge", "parseStreamError", "parseAPICallError"],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-provider-event-observer",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-provider-event-observer.ts",
    symbols: ["createOpenCodeProviderEventObserverBridge", "observeEvent", "finish-resets-reused-state"],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-provider-stream-projector",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-provider-stream-projector.ts",
    symbols: ["projectOpenCodeProviderStreamEvents", "captureOpenCodeProviderStreamProjectorNativeExactFixture"],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-provider-usage",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-provider-usage.ts",
    symbols: ["openCodeProviderGetUsage", "captureOpenCodeProviderUsageNativeExactFixture", "createOpenCodeProviderUsageNormalizer"],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-provider-ports",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-provider/src/ports.ts",
    symbols: ["ProviderTransport", "ProviderStreamParser", "ProviderEventNormalizer", "ProviderRequestShape"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-openai-compatible-provider",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-provider/src/openai-compatible.ts",
    symbols: ["createOpenAICompatibleProvider", "createOpenAICompatibleRequestShape", "parseOpenAICompatibleStream"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-opencode-custom-provider",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-provider/src/opencode-custom.ts",
    symbols: ["parseOpenCodeCustomProviderFrames", "OpenCodeCustomProviderFrame", "OpenCodeCustomProviderFrameKind"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-opencode-retry-cancel",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-provider/src/opencode-retry-cancel.ts",
    symbols: [
      "projectOpenCodeProviderRetryCancelTiming",
      "projectOpenCodeProviderRetryCancelRace",
      "captureOpenCodeProviderRetryCancelLiveRuntimeFixture",
      "verifyOpenCodeProviderRetryCancelLiveRuntimeFixture",
      "OpenCodeProviderRetryCancelEvent",
      "OpenCodeProviderRetryCancelTimingProjection",
      "OpenCodeProviderRetryCancelRaceProjection",
      "OpenCodeProviderRetryCancelLiveRuntimeFixture",
    ],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-provider-normalizer",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-provider/src/normalizer.ts",
    symbols: ["normalizeProviderStream", "coalesceProviderText", "assignMissingToolCallIDs"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-package-runtime-projection",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-provider/src/port-fixtures.ts",
    symbols: [
      "OpenCodeProviderPackageRuntimeProjection",
      "projectOpenCodeProviderPackageRuntimeProjection",
      "OpenCodeProviderPackageRuntimeLiveRuntimeFixture",
      "captureOpenCodeProviderPackageRuntimeLiveRuntimeFixture",
      "verifyOpenCodeProviderPackageRuntimeLiveRuntimeFixture",
      "captureOpenCodeProviderPackageRuntimeNativeExactDiffFixture",
      "verifyOpenCodeProviderPackageRuntimeNativeExactDiffFixture",
    ],
    evidence: "local-source:2026-06-12",
  },
]

function openCodeProviderRawFrameBoundaryAnchor(input: OpenCodeProviderRawFrameBoundaryAnchor): OpenCodeProviderRawFrameBoundaryAnchor {
  return input
}

export function buildOpenCodeProviderRawFrameBoundaryMatrixSnapshot(): OpenCodeProviderRawFrameBoundaryMatrixSnapshot {
  const boundaryAnchors: OpenCodeProviderRawFrameBoundaryAnchor[] = [
    openCodeProviderRawFrameBoundaryAnchor({
      boundaryID: "builtin-provider-descriptor-registration",
      status: "native-exact",
      sourceRefIDs: ["upstream-plugin-boot", "upstream-provider-plugin-index", "upstream-dynamic-provider-plugin", "local-builtin-provider-plugins"],
      providerAtomIDs: ["opencode.provider.auth-descriptor", "opencode.provider.model-plugin", "opencode.provider.plugin-descriptor"],
      providerPortIDs: ["provider.auth", "provider.model-registry", "provider.stream"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      boundary: {
        input: "OpenCode PluginBoot builtin provider plugin list before startup registration.",
        output: "Native ProviderPlugins order, plugin IDs, split-file provider IDs, DynamicProviderPlugin tail position, and boot add order.",
        retainedFields: ["ProviderPlugins order", "plugin id", "plugin export name", "source file", "boot add order", "DynamicProviderPlugin tail position"],
        lossyFields: [],
      },
      localEvidenceRefs: ["opencode-provider-builtin-plugins:native-exact-fixture", "provider-builtin-plugins-native-exact:opencode", "opencode-provider:plugin-runtime-matrix"],
      localMarkers: ["ProviderPlugins", "PluginBoot.boot", "EnvPlugin", "AccountPlugin", "DynamicProviderPlugin", "models-dev-after-providers"],
      knownGaps: [],
    }),
    openCodeProviderRawFrameBoundaryAnchor({
      boundaryID: "plugin-provider-descriptor-registration",
      status: "native-exact",
      sourceRefIDs: ["local-plugin-adapter", "local-plugin-atoms", "upstream-provider-plugins"],
      providerAtomIDs: ["opencode.provider.plugin-descriptor", "opencode.provider.model-plugin"],
      providerPortIDs: ["provider.stream", "provider.model-registry"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      boundary: {
        input: "OpenCode plugin hooks.provider descriptor returned from the plugin loader and scoped by plugin manifest metadata.",
        output: "Scoped provider registry entry and opencode.provider:<source> service record.",
        retainedFields: ["source.id", "source.scope", "hooks.provider", "registry.name", "registry.config", "scope cleanup callback"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-provider-plugin-descriptor:native-exact-fixture",
        "provider-plugin-descriptor-native-exact:opencode",
        "opencode-plugin-provider-registry:native-exact-fixture",
        "plugin-provider-registry-native-exact:opencode",
        "opencode-plugin-hot-reload-cleanup:native-exact-fixture",
        "plugin-hot-reload-cleanup-native-exact:opencode",
        "opencode-provider:source-matrix",
        "opencode-hook:source-matrix",
      ],
      localMarkers: ["OpenCodeHooks.provider", "createOpenCodePluginRegistryBridge", "host.registerProvider", "scope.addCleanup", "scope.dispose"],
      knownGaps: [],
    }),
    openCodeProviderRawFrameBoundaryAnchor({
      boundaryID: "request-hook-to-provider-options",
      status: "native-exact",
      sourceRefIDs: ["local-plugin-event-mapper", "local-provider-request-options", "upstream-llm-request-prep", "upstream-llm-native-request"],
      providerAtomIDs: ["opencode.provider.request-options"],
      providerPortIDs: ["provider.request-shape"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      boundary: {
        input: "Provider request payload before OpenCode chat.params and chat.headers plugin hooks are applied.",
        output: "Native OpenCode chat.params/chat.headers hook output, messageTransformOptions identity, and default/model/plugin headers are carried into the provider request shape.",
        retainedFields: ["temperature", "topP", "topK", "maxOutputTokens", "options", "messageTransformOptions", "headers", "source-ordered hook merge"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-provider-request-options:native-exact-fixture",
        "provider-request-options-native-exact:opencode",
        "opencode-plugin-event-mapper:native-exact-fixture",
        "plugin-event-mapper-native-exact:opencode",
        "opencode-hook-lifecycle:native-exact-fixture",
        "recipes.conformance:orders-opencode-provider-request-hooks-by-plugin-load-source",
        "opencode-provider:source-matrix",
      ],
      localMarkers: [
        "provider.request.before",
        "chat.params",
        "chat.headers",
        "ProviderRequestShape",
        "messageTransformOptions",
        "source-ordered-hook-scheduler",
        "provider-request-params-and-headers",
      ],
      knownGaps: [],
    }),
    openCodeProviderRawFrameBoundaryAnchor({
      boundaryID: "raw-sse-frame-parser-boundary",
      status: "native-exact",
      sourceRefIDs: ["local-openai-compatible-provider", "local-provider-normalizer", "local-provider-parser-observer", "upstream-provider-error", "upstream-session-message-from-error", "upstream-llm-native-request"],
      providerAtomIDs: ["opencode.provider.parser-observer", "opencode.provider.event-observer"],
      providerPortIDs: ["provider.stream-parser", "provider.event-normalizer"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      boundary: {
        input: "Raw SSE or JSON frame sequence from an OpenCode-compatible provider stream.",
        output: "ProviderStreamEvent text, reasoning, tool_call, finish, and error events with frame order preserved.",
        retainedFields: ["raw frame order", "text deltas", "reasoning deltas", "tool call id/name/arguments", "finish reason", "usage tokens", "parser error type/message/retryability/responseBody"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-provider-stream:raw-frame-timeline",
        "opencode-provider-stream:raw-payload-roundtrip",
        "opencode-provider-parser-observer:native-exact-fixture",
        "provider-parser-observer-native-exact:opencode",
      ],
      localMarkers: ["parseOpenAICompatibleStream", "normalizeProviderStream", "raw-frame-order", "tool-call-delta", "parseStreamError", "parseAPICallError", "context_overflow", "api_error", "retryable"],
      knownGaps: [],
    }),
    openCodeProviderRawFrameBoundaryAnchor({
      boundaryID: "normalized-event-projection-boundary",
      status: "native-exact",
      sourceRefIDs: ["local-provider-event-observer", "local-provider-stream-projector", "upstream-llm-request-prep", "upstream-llm-native-request"],
      providerAtomIDs: ["opencode.provider.event-observer", "opencode.provider.parser-observer"],
      providerPortIDs: ["provider.event-normalizer", "provider.stream-parser"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      boundary: {
        input: "AI SDK fullStream chunks after request preparation and parser observation.",
        output: "OpenCode LLMAISDK-visible LLMEvent text, reasoning, tool, result, error, finish, usage, and provider metadata events.",
        retainedFields: ["event sequence", "text deltas", "reasoning deltas", "tool call order", "tool input deltas", "provider metadata", "usage", "finish reset"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-provider-event-observer:native-exact-fixture",
        "provider-event-observer-native-exact:opencode",
        "opencode-provider-stream-projector:native-exact-fixture",
        "provider-stream-projector-native-exact:opencode",
      ],
      localMarkers: ["LLMAISDK.toLLMEvents", "projectOpenCodeProviderStreamEvents", "finish-resets-stream-state", "ignored-non-session-visible-chunks"],
      knownGaps: [],
    }),
    openCodeProviderRawFrameBoundaryAnchor({
      boundaryID: "usage-finish-cost-boundary",
      status: "native-exact",
      sourceRefIDs: ["local-provider-event-observer", "local-provider-stream-projector", "local-provider-usage", "upstream-session-usage"],
      providerAtomIDs: ["opencode.provider.usage-renderer", "opencode.provider.event-observer"],
      providerPortIDs: ["provider.usage-normalizer", "provider.event-normalizer"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      boundary: {
        input: "Native OpenCode LLM finish/step-finish events with usage payload and provider metadata.",
        output: "OpenCode getUsage token accounting, cache read/write subtraction, reasoning token accounting, and cost calculation.",
        retainedFields: ["finish reason", "input tokens", "output tokens", "reasoning tokens", "cache read/write tokens", "metadata cache write fallback", "cost tier selection"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-provider-usage:native-exact-fixture",
        "provider-usage-native-exact:opencode",
        "opencode-provider-event-observer:native-exact-fixture",
        "provider-event-observer-native-exact:opencode",
        "opencode-provider-stream-projector:native-exact-fixture",
        "provider-stream-projector-native-exact:opencode",
      ],
      localMarkers: ["usage", "finishReason", "getUsage", "cacheCreationInputTokens", "experimentalOver200K", "costInfo"],
      knownGaps: [],
    }),
    openCodeProviderRawFrameBoundaryAnchor({
      boundaryID: "transport-retry-cancel-boundary",
      status: "native-exact",
      sourceRefIDs: ["local-provider-ports", "local-openai-compatible-provider", "local-opencode-retry-cancel", "upstream-llm-native-request"],
      providerAtomIDs: ["opencode.provider.transport-instrumentation", "opencode.provider.parser-observer"],
      providerPortIDs: ["provider.transport", "provider.stream-parser"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      boundary: {
        input: "Fetch transport request with abort signal, retry metadata, endpoint, body, and headers.",
        output: "Native transport instrumentation preserves fetch fallback, timeout signal composition, SSE reader cancellation, and retryable parser error classification.",
        retainedFields: ["endpoint", "headers", "body hash", "abort signal presence", "timeout signal composition", "SSE reader cancellation", "retry error frame class"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-provider-transport-instrumentation:native-exact-fixture",
        "provider-transport-instrumentation-native-exact:opencode",
        "opencode-provider-parser-observer:native-exact-fixture",
        "provider-parser-observer-native-exact:opencode",
      ],
      localMarkers: [
        "ProviderTransport",
        "AbortSignal",
        "AbortSignal.any",
        "AbortSignal.timeout",
        "wrapSSE",
        "fallback-fetch-and-timeout-false",
        "sse-read-timeout-aborts-and-cancels",
        "stream-overloaded-retryable",
        "api-openai-404-retryable",
      ],
      knownGaps: [],
    }),
    openCodeProviderRawFrameBoundaryAnchor({
      boundaryID: "custom-provider-protocol-runtime",
      status: "partial",
      sourceRefIDs: ["local-builtin-providers", "local-opencode-custom-provider", "local-provider-normalizer", "local-package-runtime-projection", "upstream-provider-plugins"],
      providerAtomIDs: ["opencode.provider.plugin-descriptor", "opencode.provider.parser-observer", "opencode.provider.event-observer", "opencode.provider.usage-renderer"],
      providerPortIDs: ["provider.stream", "provider.stream-parser", "provider.event-normalizer", "provider.usage-normalizer"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      boundary: {
        input: "Builtin or npm provider descriptors whose protocol is custom instead of OpenAI/Anthropic compatible, plus schema-like custom JSON/SSE frame lines.",
        output: "ProviderStreamEvent text, reasoning, tool_call, finish, and custom error-frame part events with frame order and provider identity retained.",
        retainedFields: ["providerID", "packageName", "protocol=custom", "SDK cache key", "language cache key", "frame kind", "text delta", "reasoning delta", "tool call id/name/input", "finish reason", "usage tokens", "custom error frame"],
        lossyFields: ["real provider package parser behavior", "protocol-private metadata", "native error object detail", "remote model metadata"],
      },
      localEvidenceRefs: [
        "provider.conformance:replays-opencode-custom-provider-protocol-frames-through-partial-boundary-parser",
        openCodeProviderPackageRuntimeNativeExactDiffFixtureID,
        openCodeProviderPackageRuntimeNativeExactDiffEvidenceRef,
        openCodeProviderPackageRuntimeNativeExactDiffReplayRef,
        "opencode-provider-custom-loaders:native-exact-fixture",
        "provider-custom-loaders-native-exact:opencode",
        "opencode-provider-sdk-resolver:native-exact-fixture",
        "provider-sdk-resolver-native-exact:opencode",
        "recipes.conformance:loads-opencode-npm-provider-package-plugin-into-provider-registry",
        "opencode-provider:plugin-runtime-matrix",
        "opencode-provider:package-runtime-projection",
        "opencode-provider:package-runtime-live-runtime-fixture",
      ],
      localMarkers: [
        "protocol:custom",
        "parseOpenCodeCustomProviderFrames",
        "custom-frame-kind",
        "custom-error-frame",
        "package-runtime-native-exact-diff",
        "Provider.custom(dep)",
        "Provider.resolveSDK",
        "Provider.getLanguage",
        "Hash.fast",
        "language cache",
        "provider-package:mock-module",
        "custom-parser:projected",
        "custom-parser-live-readback",
      ],
      knownGaps: [
        "opencode-real-provider-package-parser-not-spawned",
        "opencode-custom-provider-native-protocol-private-fields-not-replayed",
      ],
    }),
    openCodeProviderRawFrameBoundaryAnchor({
      boundaryID: "live-provider-plugin-runtime",
      status: "native-exact",
      sourceRefIDs: [
        "local-plugin-adapter",
        "local-plugin-atoms",
        "local-dynamic-provider-package",
        "local-package-runtime-projection",
        "upstream-provider-plugins",
        "upstream-dynamic-provider-plugin",
      ],
      providerAtomIDs: ["opencode.provider.plugin-descriptor", "opencode.provider.model-plugin"],
      providerPortIDs: ["provider.stream", "provider.model-registry"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      boundary: {
        input: "Real OpenCode plugin module import, config hook execution, and provider registry mutation lifecycle.",
        output: "Provider registry entry, SDK/plugin package factory selection, language resolver behavior, and cleanup callback observed through native exact package/runtime fixtures.",
        retainedFields: ["source.id", "source.scope", "hooks.provider", "hooks.auth", "DynamicProviderPlugin sdk assignment", "scope cleanup callback"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-provider:raw-frame-boundary-matrix",
        "opencode-provider:plugin-runtime-matrix",
        openCodeProviderPackageRuntimeNativeExactDiffFixtureID,
        openCodeProviderPackageRuntimeNativeExactDiffEvidenceRef,
        openCodeProviderPackageRuntimeNativeExactDiffReplayRef,
        "opencode-provider-dynamic-package:native-exact-fixture",
        "provider-dynamic-package-native-exact:opencode",
        "opencode-provider:package-runtime-projection",
        "opencode-provider:package-runtime-live-runtime-fixture",
        "opencode-plugin-hot-reload-cleanup:native-exact-fixture",
        "plugin-hot-reload-cleanup-native-exact:opencode",
      ],
      localMarkers: [
        "loadOpenCodePlugin",
        "DynamicProviderPlugin",
        "createOpenCodePluginRegistryBridge",
        "host.registerProvider",
        "evt.sdk",
        "scope.dispose",
        "provider-package-runtime:projected",
        "package-runtime-native-exact-diff",
        "replacement-disposes-existing-before-track",
        "package-runtime-live-readback",
      ],
      knownGaps: [],
    }),
    openCodeProviderRawFrameBoundaryAnchor({
      boundaryID: "exact-retry-cancel-timing",
      status: "native-exact",
      sourceRefIDs: ["local-provider-ports", "local-opencode-retry-cancel", "upstream-llm-native-request", "upstream-session-retry"],
      providerAtomIDs: ["opencode.provider.transport-instrumentation", "opencode.provider.parser-observer"],
      providerPortIDs: ["provider.transport", "provider.stream-parser"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      boundary: {
        input: "Native OpenCode transport retry schedule, abort signal timing, parser cleanup race, and pinned session retry policy anchors.",
        output: "Native retry policy decisions plus transport abort/SSE cancellation and parser retryability are replayed with exact pinned fixture cases.",
        retainedFields: ["attempt order", "retryable error class", "scheduled retry delay", "retry-after headers", "nextAttemptAt", "abort signal observed", "SSE reader cancellation", "parser retryability", "context overflow non-retryable"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-turn-retry-policy:native-exact-fixture",
        "turn-retry-policy-native-exact:opencode",
        "opencode-provider-transport-instrumentation:native-exact-fixture",
        "provider-transport-instrumentation-native-exact:opencode",
        "opencode-provider-parser-observer:native-exact-fixture",
        "provider-parser-observer-native-exact:opencode",
      ],
      localMarkers: [
        "Retryable",
        "delay",
        "policy",
        "retry-after-ms-header",
        "retry-after-seconds-header",
        "no-header-backoff-cap",
        "server-error-retryable-even-with-sdk-flag-false",
        "context-overflow-not-retryable",
        "abort-signal-observed",
        "sse-read-timeout-aborts-and-cancels",
        "stream-overloaded-retryable",
        "api-openai-404-retryable",
      ],
      knownGaps: [],
    }),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    pinnedRepo: "anomalyco/opencode" as const,
    pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-provider-raw-frame-boundary-matrix" as const,
    fixtureID: "opencode-provider:raw-frame-boundary-matrix" as const,
    fixtureDiffTarget: "provider.raw-frame-replay" as const,
    sourceRefs: OPENCODE_PROVIDER_RAW_FRAME_BOUNDARY_SOURCE_REFS,
    boundaryAnchors,
    partialBoundaryIDs: boundaryAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.boundaryID),
    missingBoundaryIDs: boundaryAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.boundaryID),
    coveredProviderAtomIDs: uniqueStrings(boundaryAnchors.flatMap((anchor) => anchor.providerAtomIDs)),
    coveredProviderPortIDs: uniqueStrings(boundaryAnchors.flatMap((anchor) => anchor.providerPortIDs)),
    nativeEvidenceRefs: uniqueStrings([
      "conformance:opencode-provider-raw-frame-boundary-matrix",
      ...providerNativeExactEvidenceRefs(boundaryAnchors),
    ]),
    fixtureIDs: uniqueStrings([
      "opencode-provider:raw-frame-boundary-matrix",
      ...providerNativeExactFixtureIDs(boundaryAnchors),
    ]),
    knownGaps: uniqueStrings([
      ...(boundaryAnchors.some((anchor) => anchor.status === "partial") ? ["opencode-provider-raw-frame-boundary-matrix-partial-fixture"] : []),
      ...boundaryAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export type OpenCodeProviderPluginRuntimeSourceRefID =
  | "upstream-provider-plugins"
  | "upstream-provider-service"
  | "upstream-provider-schema"
  | "upstream-core-hash"
  | "upstream-dynamic-provider-plugin"
  | "upstream-plugin-boot"
  | "upstream-provider-plugin-index"
  | "upstream-openai-provider-plugin"
  | "upstream-aisdk-provider-plugins"
  | "local-plugin-loader"
  | "local-plugin-adapter"
  | "local-plugin-atoms"
  | "local-builtin-provider-plugins"
  | "local-dynamic-provider-package"
  | "local-provider-sdk-resolver"
  | "local-provider-custom-loaders"
  | "local-openai-provider-plugin-runtime"
  | "local-aisdk-provider-plugin-runtime"
  | "local-builtin-providers"
  | "local-recipes-conformance"
  | "local-package-runtime-projection"

export interface OpenCodeProviderPluginRuntimeSourceRef {
  id: OpenCodeProviderPluginRuntimeSourceRefID
  repo: "anomalyco/opencode" | "helix/local"
  ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab" | "current"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-11" | "local-source:2026-06-11" | "local-source:2026-06-12" | "conformance-source:2026-06-11"
}

export type OpenCodeProviderPluginRuntimeID =
  | "plugin-manifest-scope-normalization"
  | "plugin-config-hook-runtime"
  | "provider-auth-ui-registry-runtime"
  | "builtin-provider-runtime-registration"
  | "scope-dispose-registry-cleanup"
  | "provider-request-hook-runtime"
  | "provider-package-module-spawn"
  | "provider-custom-loader-runtime"
  | "provider-sdk-resolver-runtime"
  | "openai-provider-plugin-runtime"
  | "aisdk-provider-plugin-runtime"
  | "hot-reload-cycle-side-effects"
  | "exact-concurrent-provider-hook-order"

export type OpenCodeProviderPluginRuntimeStatus = "native-exact" | "partial" | "missing"

export interface OpenCodeProviderPluginRuntimeShape {
  trigger: string
  observed: string
  retainedFields: string[]
  lossyFields: string[]
}

export interface OpenCodeProviderPluginRuntimeAnchor {
  runtimeID: OpenCodeProviderPluginRuntimeID
  status: OpenCodeProviderPluginRuntimeStatus
  sourceRefIDs: OpenCodeProviderPluginRuntimeSourceRefID[]
  providerAtomIDs: string[]
  providerPortIDs: string[]
  fixtureDiffTarget: "provider.raw-frame-replay"
  relatedFixtureDiffTargets: Array<"hook.plugin-lifecycle-replay">
  runtime: OpenCodeProviderPluginRuntimeShape
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface OpenCodeProviderPluginRuntimeMatrixSnapshot {
  schemaVersion: 1
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  pinnedRepo: "anomalyco/opencode"
  pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-provider-plugin-runtime-matrix"
  fixtureID: "opencode-provider:plugin-runtime-matrix"
  fixtureDiffTarget: "provider.raw-frame-replay"
  relatedFixtureDiffTargets: Array<"hook.plugin-lifecycle-replay">
  sourceRefs: OpenCodeProviderPluginRuntimeSourceRef[]
  runtimeAnchors: OpenCodeProviderPluginRuntimeAnchor[]
  partialRuntimeIDs: OpenCodeProviderPluginRuntimeID[]
  missingRuntimeIDs: OpenCodeProviderPluginRuntimeID[]
  coveredProviderAtomIDs: string[]
  coveredProviderPortIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

export const openCodeProviderPackageRuntimeNativeExactDiffFixtureID = "opencode-provider:package-runtime-native-exact-diff-fixture" as const
export const openCodeProviderPackageRuntimeNativeExactDiffEvidenceRef = "conformance:opencode-provider-package-runtime-native-exact-diff-fixture" as const
export const openCodeProviderPackageRuntimeNativeExactDiffReplayRef = "provider-package-runtime-native-exact-diff:opencode" as const

export type OpenCodeProviderPackageRuntimeNativeExactSourceFixtureID =
  | "opencode-plugin-provider-registry"
  | "opencode-provider-builtin-plugins"
  | "opencode-provider-dynamic-package"
  | "opencode-provider-custom-loaders"
  | "opencode-provider-sdk-resolver"
  | "opencode-provider-openai-plugin"
  | "opencode-provider-aisdk-plugins"
  | "opencode-plugin-hot-reload-cleanup"

export interface OpenCodeProviderPackageRuntimeNativeExactSourceFixtureReadback {
  sourceID: OpenCodeProviderPackageRuntimeNativeExactSourceFixtureID
  evidenceRef: string
  replayRef: string
  fixtureID: string
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  knownLossiness: []
  caseIDs: string[]
  sourceRefCount: number
}

export interface OpenCodeProviderPackageRuntimeNativeRuntimeCoverage {
  runtimeID: OpenCodeProviderPluginRuntimeID
  fixtureIDs: string[]
}

export interface OpenCodeProviderPackageRuntimeNativeExactDiff {
  path: string
  expected: unknown
  actual: unknown
}

export interface OpenCodeProviderPackageRuntimeNativeExactDiffFixtureInput {
  sourceFixtures?: OpenCodeProviderPackageRuntimeNativeExactSourceFixtureReadback[]
}

export interface OpenCodeProviderPackageRuntimeNativeExactDiffFixture {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: typeof openCodeProviderPackageRuntimeNativeExactDiffEvidenceRef
  replayRef: typeof openCodeProviderPackageRuntimeNativeExactDiffReplayRef
  fixtureID: typeof openCodeProviderPackageRuntimeNativeExactDiffFixtureID
  exactDiffStatus: "native-exact-diff"
  coverageStatus: "native"
  nativeParityClaim: true
  fixtureDiffTarget: "provider.raw-frame-replay"
  relatedFixtureDiffTargets: Array<"hook.plugin-lifecycle-replay">
  coveredRuntimeIDs: OpenCodeProviderPluginRuntimeID[]
  sourceRefs: string[]
  expectedSourceFixtures: OpenCodeProviderPackageRuntimeNativeExactSourceFixtureReadback[]
  actualSourceFixtures: OpenCodeProviderPackageRuntimeNativeExactSourceFixtureReadback[]
  expectedRuntimeCoverage: OpenCodeProviderPackageRuntimeNativeRuntimeCoverage[]
  actualRuntimeCoverage: OpenCodeProviderPackageRuntimeNativeRuntimeCoverage[]
  fixtureDiff: OpenCodeProviderPackageRuntimeNativeExactDiff[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeProviderPackageRuntimeNativeExactDiffFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeProviderPackageRuntimeNativeExactDiffFixtureVerification {
  ok: boolean
  issues: OpenCodeProviderPackageRuntimeNativeExactDiffFixtureIssue[]
}

const OPENCODE_PROVIDER_PLUGIN_RUNTIME_SOURCE_REFS: OpenCodeProviderPluginRuntimeSourceRef[] = [
  {
    id: "upstream-provider-plugins",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin/provider.ts",
    symbols: ["ProviderPlugins"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-provider-service",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/provider/provider.ts",
    symbols: ["custom", "shouldUseCopilotResponsesApi", "useLanguageModel", "selectAzureLanguageModel", "googleVertexAnthropicBaseURL", "resolveSDK", "getLanguage", "BUNDLED_PROVIDERS", "modelLoaders", "varsLoaders", "pathToFileURL"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-provider-schema",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/opencode/src/provider/schema.ts",
    symbols: ["ProviderID", "ModelID"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-core-hash",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/util/hash.ts",
    symbols: ["Hash.fast", "sha1"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-dynamic-provider-plugin",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin/provider/dynamic.ts",
    symbols: ["DynamicProviderPlugin", "aisdk.sdk", "Npm.add", "pathToFileURL"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-plugin-boot",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin/boot.ts",
    symbols: ["PluginBoot", "EnvPlugin", "AccountPlugin", "ProviderPlugins", "ModelsDevPlugin"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-provider-plugin-index",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin/provider/index.ts",
    symbols: ["ProviderPlugins", "DynamicProviderPlugin", "AzurePlugin", "GoogleVertexPlugin"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-openai-provider-plugin",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin/provider/openai.ts",
    symbols: ["OpenAIPlugin", "aisdk.sdk", "aisdk.language", "catalog.transform"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "upstream-aisdk-provider-plugins",
    repo: "anomalyco/opencode",
    ref: "1a8fd0e1dca58a473d85500530dd45def3f512ab",
    path: "packages/core/src/plugin/provider",
    symbols: ["AnthropicPlugin", "OpenAICompatiblePlugin", "GatewayPlugin", "PerplexityPlugin", "GooglePlugin", "XAIPlugin", "OpenRouterPlugin", "aisdk.sdk", "aisdk.language", "catalog.transform"],
    evidence: "github-tree:2026-06-11",
  },
  {
    id: "local-plugin-loader",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/plugin-loader.ts",
    symbols: ["loadOpenCodePlugins", "normalizePlugin", "resolvePluginSpecifier", "pluginFromModule"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-plugin-adapter",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/plugin-adapter.ts",
    symbols: ["OpenCodeHooks", "loadOpenCodePlugin", "registerOpenCodeHooks"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-plugin-atoms",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/plugin-atoms.ts",
    symbols: [
      "createOpenCodePluginLoaderAtom",
      "createOpenCodePluginManifestNormalizer",
      "createOpenCodePluginRegistryBridge",
      "createOpenCodePluginEventMapper",
      "provider.request.before",
    ],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-dynamic-provider-package",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-provider-dynamic-package.ts",
    symbols: [
      "createOpenCodeDynamicProviderPackageBridge",
      "openCodeDynamicProviderPackageApply",
      "captureOpenCodeDynamicProviderPackageNativeExactFixture",
    ],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-provider-sdk-resolver",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-provider-sdk-resolver.ts",
    symbols: [
      "createOpenCodeProviderSDKResolverBridge",
      "captureOpenCodeProviderSDKResolverNativeExactFixture",
      "verifyOpenCodeProviderSDKResolverNativeExactFixture",
    ],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-provider-custom-loaders",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-provider-custom-loaders.ts",
    symbols: [
      "createOpenCodeProviderCustomLoadersBridge",
      "captureOpenCodeProviderCustomLoadersNativeExactFixture",
      "verifyOpenCodeProviderCustomLoadersNativeExactFixture",
    ],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-openai-provider-plugin-runtime",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-provider-openai-plugin.ts",
    symbols: [
      "createOpenCodeOpenAIProviderPluginBridge",
      "captureOpenCodeOpenAIProviderPluginNativeExactFixture",
      "verifyOpenCodeOpenAIProviderPluginNativeExactFixture",
    ],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-aisdk-provider-plugin-runtime",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-provider-aisdk-plugins.ts",
    symbols: [
      "createOpenCodeAISDKProviderPluginsBridge",
      "captureOpenCodeAISDKProviderPluginsNativeExactFixture",
      "verifyOpenCodeAISDKProviderPluginsNativeExactFixture",
    ],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-builtin-provider-plugins",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/opencode-provider-builtin-plugins.ts",
    symbols: [
      "createOpenCodeProviderBuiltinPluginsBridge",
      "captureOpenCodeProviderBuiltinPluginsNativeExactFixture",
      "verifyOpenCodeProviderBuiltinPluginsNativeExactFixture",
    ],
    evidence: "local-source:2026-06-12",
  },
  {
    id: "local-builtin-providers",
    repo: "helix/local",
    ref: "current",
    path: "packages/adapters-opencode/src/builtin-providers.ts",
    symbols: ["openCodeBuiltinProviderDefinitions", "registerOpenCodeBuiltinProviderPlugins", "hooksForDefinition"],
    evidence: "local-source:2026-06-11",
  },
  {
    id: "local-recipes-conformance",
    repo: "helix/local",
    ref: "current",
    path: "packages/conformance/recipes.conformance.test.ts",
    symbols: [
      "registers OpenCode builtin auth/provider plugins",
      "loads OpenCode local and npm plugin specs in declared order",
      "loads an OpenCode npm provider package plugin into the provider registry",
      "maps OpenCode and Pi provider extensions into common registries",
      "orders OpenCode provider request hooks by plugin load source",
      "replays OpenCode provider plugin reload cleanup before replacement registration",
    ],
    evidence: "conformance-source:2026-06-11",
  },
  {
    id: "local-package-runtime-projection",
    repo: "helix/local",
    ref: "current",
    path: "packages/lego-provider/src/port-fixtures.ts",
    symbols: [
      "OpenCodeProviderPackageRuntimeProjection",
      "projectOpenCodeProviderPackageRuntimeProjection",
      "OpenCodeProviderPackageRuntimeLiveRuntimeFixture",
      "captureOpenCodeProviderPackageRuntimeLiveRuntimeFixture",
      "verifyOpenCodeProviderPackageRuntimeLiveRuntimeFixture",
      "captureOpenCodeProviderPackageRuntimeNativeExactDiffFixture",
      "verifyOpenCodeProviderPackageRuntimeNativeExactDiffFixture",
    ],
    evidence: "local-source:2026-06-12",
  },
]

function openCodeProviderPluginRuntimeAnchor(input: OpenCodeProviderPluginRuntimeAnchor): OpenCodeProviderPluginRuntimeAnchor {
  return input
}

export function buildOpenCodeProviderPluginRuntimeMatrixSnapshot(): OpenCodeProviderPluginRuntimeMatrixSnapshot {
  const runtimeAnchors: OpenCodeProviderPluginRuntimeAnchor[] = [
    openCodeProviderPluginRuntimeAnchor({
      runtimeID: "plugin-manifest-scope-normalization",
      status: "native-exact",
      sourceRefIDs: ["local-plugin-adapter", "local-plugin-atoms", "local-recipes-conformance"],
      providerAtomIDs: ["opencode.provider.plugin-descriptor", "opencode.provider.model-plugin"],
      providerPortIDs: ["provider.stream", "provider.model-registry"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay"],
      runtime: {
        trigger: "loadOpenCodePlugin receives a local or npm plugin spec plus source metadata.",
        observed: "HookHost scope source is normalized with id, optional path, and project/global scope before registration.",
        retainedFields: ["source.id", "source.path", "source.scope", "plugin options"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-plugin-loader:native-exact-fixture",
        "plugin-loader-native-exact:opencode",
        "opencode-hook-lifecycle:native-exact-fixture",
        "recipes.conformance:loads-opencode-local-and-npm-plugin-specs",
        "current-module:packages/adapters-opencode/src/plugin-atoms.ts",
      ],
      localMarkers: ["normalizeOpenCodeNativePluginManifest", "openCodeNativePluginLoaderLoad", "loadOpenCodePlugin", "host.createScope"],
      knownGaps: [],
    }),
    openCodeProviderPluginRuntimeAnchor({
      runtimeID: "plugin-config-hook-runtime",
      status: "native-exact",
      sourceRefIDs: ["local-plugin-adapter", "local-plugin-atoms", "local-recipes-conformance"],
      providerAtomIDs: ["opencode.provider.plugin-descriptor", "opencode.provider.request-options"],
      providerPortIDs: ["provider.stream", "provider.request-shape"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay"],
      runtime: {
        trigger: "Loaded OpenCode plugin exposes a config hook before provider/tool/request hooks are registered.",
        observed: "Loader awaits hooks.config and then registers registry, permission, and event mapper bridges.",
        retainedFields: ["config hook call", "plugin options", "post-config registration order"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-plugin-loader:native-exact-fixture",
        "plugin-loader-native-exact:opencode",
        "opencode-hook-lifecycle:native-exact-fixture",
        "recipes.conformance:loads-opencode-local-and-npm-plugin-specs",
        "opencode-hook:source-matrix",
      ],
      localMarkers: ["hooks.config", "config-before-registration", "registryBridge.register", "permissionBridge.register", "eventMapper.register"],
      knownGaps: [],
    }),
    openCodeProviderPluginRuntimeAnchor({
      runtimeID: "provider-auth-ui-registry-runtime",
      status: "native-exact",
      sourceRefIDs: ["local-plugin-adapter", "local-plugin-atoms", "upstream-provider-plugins", "local-recipes-conformance"],
      providerAtomIDs: ["opencode.provider.auth-descriptor", "opencode.provider.plugin-descriptor", "opencode.provider.model-plugin"],
      providerPortIDs: ["provider.auth", "provider.stream", "provider.model-registry"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay"],
      runtime: {
        trigger: "Plugin returns auth, provider, and UI descriptors from the OpenCode hooks object.",
        observed: "Bridge writes opencode.auth/opencode.provider/opencode.ui services and common HookHost registries.",
        retainedFields: ["hooks.auth", "hooks.provider", "hooks.ui", "registry.name", "registry.config", "source.id"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-hook-lifecycle:native-exact-fixture",
        "opencode-provider-auth-descriptor:native-exact-fixture",
        "opencode-provider-plugin-descriptor:native-exact-fixture",
        "plugin-event-mapper-native-exact:opencode",
        "recipes.conformance:maps-opencode-provider-extensions-into-common-registries",
        "opencode-provider:raw-frame-boundary-matrix",
      ],
      localMarkers: ["createOpenCodePluginRegistryBridge", "host.registerAuth", "host.registerProvider", "host.registerUIProvider", "opencode.provider:sample-plugin"],
      knownGaps: [],
    }),
    openCodeProviderPluginRuntimeAnchor({
      runtimeID: "builtin-provider-runtime-registration",
      status: "native-exact",
      sourceRefIDs: [
        "upstream-plugin-boot",
        "upstream-provider-plugin-index",
        "upstream-dynamic-provider-plugin",
        "local-builtin-provider-plugins",
        "local-recipes-conformance",
      ],
      providerAtomIDs: ["opencode.provider.auth-descriptor", "opencode.provider.model-plugin", "opencode.provider.plugin-descriptor"],
      providerPortIDs: ["provider.auth", "provider.model-registry", "provider.stream"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay"],
      runtime: {
        trigger: "OpenCode PluginBoot adds EnvPlugin, AccountPlugin, every ProviderPlugins entry, and ModelsDevPlugin in order.",
        observed: "Native fixture preserves ProviderPlugins export order, plugin IDs, split-file Azure/Google Vertex IDs, DynamicProviderPlugin tail position, and boot add order.",
        retainedFields: ["ProviderPlugins order", "plugin id", "plugin export name", "source file", "boot add order"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-provider-builtin-plugins:native-exact-fixture",
        "provider-builtin-plugins-native-exact:opencode",
        "recipes.conformance:registers-opencode-builtin-auth-provider-plugins",
        "current-module:packages/adapters-opencode/src/opencode-provider-builtin-plugins.ts",
      ],
      localMarkers: [
        "ProviderPlugins",
        "PluginBoot.boot",
        "EnvPlugin",
        "AccountPlugin",
        "DynamicProviderPlugin",
        "models-dev-after-providers",
      ],
      knownGaps: [],
    }),
    openCodeProviderPluginRuntimeAnchor({
      runtimeID: "scope-dispose-registry-cleanup",
      status: "native-exact",
      sourceRefIDs: ["local-plugin-atoms", "local-recipes-conformance"],
      providerAtomIDs: ["opencode.provider.auth-descriptor", "opencode.provider.plugin-descriptor", "opencode.provider.model-plugin"],
      providerPortIDs: ["provider.auth", "provider.stream", "provider.model-registry"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay"],
      runtime: {
        trigger: "HookScope returned by loadOpenCodePlugin is disposed after provider registration.",
        observed: "Auth/provider/UI registry entries and service records are removed through cleanup callbacks.",
        retainedFields: ["scope.dispose", "service cleanup", "auth registry cleanup", "provider registry cleanup", "ui registry cleanup"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-plugin-hot-reload-cleanup:native-exact-fixture",
        "plugin-hot-reload-cleanup-native-exact:opencode",
        "opencode-hook-lifecycle:native-exact-fixture",
        "recipes.conformance:maps-opencode-provider-extensions-into-common-registries",
        "opencode-hook:source-matrix",
      ],
      localMarkers: ["scope.addCleanup", "scope.dispose", "services.delete", "registries.providers.delete", "scope-dispose-removes-tracked-source"],
      knownGaps: [],
    }),
    openCodeProviderPluginRuntimeAnchor({
      runtimeID: "provider-request-hook-runtime",
      status: "native-exact",
      sourceRefIDs: ["local-plugin-atoms", "local-plugin-adapter"],
      providerAtomIDs: ["opencode.provider.request-options"],
      providerPortIDs: ["provider.request-shape"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay"],
      runtime: {
        trigger: "OpenCode chat.params and chat.headers hooks listen on provider.request.before.",
        observed: "Bridge projects provider options and headers into the Harness request shape before transport.",
        retainedFields: ["temperature", "topP", "topK", "maxOutputTokens", "options", "headers"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-plugin-event-mapper:native-exact-fixture",
        "plugin-event-mapper-native-exact:opencode",
        "opencode-provider-request-options:native-exact-fixture",
        "opencode-hook-lifecycle:native-exact-fixture",
        "opencode-provider:raw-frame-boundary-matrix",
        "opencode-hook:source-matrix",
      ],
      localMarkers: ["provider.request.before", "chat.params", "chat.headers", "providerOptions", "source-ordered-hook-scheduler"],
      knownGaps: [],
    }),
    openCodeProviderPluginRuntimeAnchor({
      runtimeID: "exact-concurrent-provider-hook-order",
      status: "native-exact",
      sourceRefIDs: ["local-plugin-atoms", "local-plugin-adapter", "local-package-runtime-projection", "local-recipes-conformance"],
      providerAtomIDs: ["opencode.provider.request-options", "opencode.provider.transport-instrumentation"],
      providerPortIDs: ["provider.request-shape", "provider.transport"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay"],
      runtime: {
        trigger: "Multiple OpenCode provider plugins mutate chat.params or chat.headers on provider.request.before.",
        observed: "Native plugin trigger order is sequential and the bridge replays source-ordered HookHost execution with shallow merge semantics for providerOptions and headers.",
        retainedFields: ["source order", "handler return payload", "providerOptions merge winner", "headers merge result"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-hook-lifecycle:native-exact-fixture",
        "opencode-plugin-event-mapper:native-exact-fixture",
        "plugin-event-mapper-native-exact:opencode",
        "opencode-provider-request-options:native-exact-fixture",
        "recipes.conformance:orders-opencode-provider-request-hooks-by-plugin-load-source",
        "opencode-provider:raw-frame-boundary-matrix",
        "opencode-hook:source-matrix",
      ],
      localMarkers: [
        "provider.request.before",
        "source-ordered-hook-scheduler",
        "shallow-merge",
        "pluginTriggerAwaitsHooksSequentiallyAndMutatesSharedOutput",
        "provider-request-params-and-headers",
      ],
      knownGaps: [],
    }),
    openCodeProviderPluginRuntimeAnchor({
      runtimeID: "provider-package-module-spawn",
      status: "native-exact",
      sourceRefIDs: [
        "upstream-provider-plugins",
        "upstream-dynamic-provider-plugin",
        "local-dynamic-provider-package",
        "local-plugin-loader",
        "local-plugin-atoms",
        "local-recipes-conformance",
      ],
      providerAtomIDs: ["opencode.provider.plugin-descriptor", "opencode.provider.model-plugin"],
      providerPortIDs: ["provider.stream", "provider.model-registry"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay"],
      runtime: {
        trigger: "OpenCode plugin config references an npm:@opencode/provider-* package module.",
        observed: "Native fixture resolves file:// package specs directly, calls Npm.add for package specs, imports the entrypoint URL, chooses the first create* export, and assigns evt.sdk with options.",
        retainedFields: ["npm package specifier", "file package specifier", "installed entrypoint", "module export keys", "first create* factory export", "plugin options", "event.sdk assignment", "non-function create export TypeError"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-provider-dynamic-package:native-exact-fixture",
        "provider-dynamic-package-native-exact:opencode",
        "recipes.conformance:loads-opencode-npm-provider-package-plugin-into-provider-registry",
        "current-module:packages/adapters-opencode/src/opencode-provider-dynamic-package.ts",
        "current-module:packages/adapters-opencode/src/plugin-loader.ts",
        "opencode-provider:plugin-runtime-matrix",
      ],
      localMarkers: [
        "DynamicProviderPlugin",
        "aisdk.sdk",
        "Npm.add",
        "pathToFileURL",
        "create* factory",
        "evt.sdk",
        "first-create-export-wins",
        "non-function-create-export TypeError native",
      ],
      knownGaps: [],
    }),
    openCodeProviderPluginRuntimeAnchor({
      runtimeID: "provider-custom-loader-runtime",
      status: "native-exact",
      sourceRefIDs: [
        "upstream-provider-service",
        "upstream-provider-schema",
        "local-provider-custom-loaders",
        "local-provider-sdk-resolver",
      ],
      providerAtomIDs: ["opencode.provider.model-plugin", "opencode.provider.plugin-descriptor"],
      providerPortIDs: ["provider.model-registry", "provider.stream"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay"],
      runtime: {
        trigger: "OpenCode Provider.state applies provider-specific custom(dep) loaders before SDK resolution.",
        observed: "Native fixture preserves opencode public-key model filtering; OpenAI/XAI responses(apiID) loaders; GitHub Copilot responses/chat/languageModel selection; Azure resource precedence, vars, and missing-resource error; Azure Cognitive Services baseURL; deterministic provider headers; Google Vertex env/project/vars/fetch/model trimming; and Google Vertex Anthropic regional baseURL behavior.",
        retainedFields: ["opencode public apiKey fallback", "paid model filtering", "openai responses apiID", "xai responses apiID", "github-copilot gpt-5 responses gate", "github-copilot gpt-5-mini chat gate", "azure resource precedence", "azure vars loader", "azure missing resource error", "azure-cognitive baseURL", "provider header options", "nvidia config autoload", "google-vertex project env fallback", "google-vertex vars endpoint", "google-vertex auth fetch", "google-vertex languageModel trim", "google-vertex-anthropic regional baseURL"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-provider-custom-loaders:native-exact-fixture",
        "provider-custom-loaders-native-exact:opencode",
        "opencode-provider-sdk-resolver:native-exact-fixture",
        "provider-sdk-resolver-native-exact:opencode",
        "opencode-provider:plugin-runtime-matrix",
      ],
      localMarkers: [
        "Provider.custom(dep)",
        "shouldUseCopilotResponsesApi",
        "selectAzureLanguageModel",
        "googleVertexAnthropicBaseURL",
        "opencode public apiKey",
        "modelLoaders",
        "varsLoaders",
        "provider headers",
        "google-vertex fetch",
      ],
      knownGaps: [],
    }),
    openCodeProviderPluginRuntimeAnchor({
      runtimeID: "provider-sdk-resolver-runtime",
      status: "native-exact",
      sourceRefIDs: [
        "upstream-provider-service",
        "upstream-provider-schema",
        "upstream-core-hash",
        "local-provider-sdk-resolver",
        "local-provider-custom-loaders",
        "local-dynamic-provider-package",
      ],
      providerAtomIDs: ["opencode.provider.model-plugin", "opencode.provider.plugin-descriptor"],
      providerPortIDs: ["provider.model-registry", "provider.stream"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay"],
      runtime: {
        trigger: "OpenCode Provider.getLanguage resolves the SDK for a model before returning a LanguageModelV3.",
        observed: "Native fixture preserves bundled provider factory selection, non-bundled npm/file import, Hash.fast SDK cache keys, baseURL var/env interpolation, apiKey/header/options merging, includeUsage defaults, Google Vertex fetch deletion, custom modelLoaders, default sdk.languageModel(api.id), and language cache reuse.",
        retainedFields: ["BUNDLED_PROVIDERS package match", "Npm.add entrypoint", "file package specifier", "pathToFileURL import specifier", "first create* factory export", "Hash.fast sdk cache key", "baseURL vars/env interpolation", "apiKey fallback", "model headers merge", "includeUsage default", "includeUsage=false preservation", "google-vertex fetch deletion", "modelLoaders getModel", "sdk.languageModel api id", "language cache key"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-provider-sdk-resolver:native-exact-fixture",
        "provider-sdk-resolver-native-exact:opencode",
        "opencode-provider-custom-loaders:native-exact-fixture",
        "provider-custom-loaders-native-exact:opencode",
        "opencode-provider-dynamic-package:native-exact-fixture",
        "provider-dynamic-package-native-exact:opencode",
        "opencode-provider:plugin-runtime-matrix",
      ],
      localMarkers: [
        "Provider.resolveSDK",
        "Provider.getLanguage",
        "BUNDLED_PROVIDERS",
        "Hash.fast",
        "pathToFileURL",
        "varsLoaders",
        "modelLoaders",
        "includeUsage",
        "google-vertex fetch deletion",
        "languageModel",
        "sdk cache",
        "language cache",
      ],
      knownGaps: [],
    }),
    openCodeProviderPluginRuntimeAnchor({
      runtimeID: "openai-provider-plugin-runtime",
      status: "native-exact",
      sourceRefIDs: [
        "upstream-openai-provider-plugin",
        "upstream-provider-plugin-index",
        "local-openai-provider-plugin-runtime",
      ],
      providerAtomIDs: ["opencode.provider.model-plugin", "opencode.provider.plugin-descriptor"],
      providerPortIDs: ["provider.model-registry", "provider.stream"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay"],
      runtime: {
        trigger: "OpenCode OpenAIPlugin handles AI SDK sdk/language events and catalog transform for OpenAI models.",
        observed: "Native fixture preserves the @ai-sdk/openai package gate, createOpenAI options forwarding, ProviderV2.ID.openai language gate, responses(apiID) selection, and gpt-5-chat-latest disable transform.",
        retainedFields: ["@ai-sdk/openai package gate", "createOpenAI options", "openai providerID language gate", "responses apiID", "gpt-5-chat-latest disabled"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-provider-openai-plugin:native-exact-fixture",
        "provider-openai-plugin-native-exact:opencode",
        "opencode-provider:plugin-runtime-matrix",
      ],
      localMarkers: ["OpenAIPlugin", "aisdk.sdk", "createOpenAI", "aisdk.language", "responses", "catalog.transform", "gpt-5-chat-latest-disabled"],
      knownGaps: [],
    }),
    openCodeProviderPluginRuntimeAnchor({
      runtimeID: "aisdk-provider-plugin-runtime",
      status: "native-exact",
      sourceRefIDs: [
        "upstream-aisdk-provider-plugins",
        "upstream-provider-plugin-index",
        "local-aisdk-provider-plugin-runtime",
      ],
      providerAtomIDs: ["opencode.provider.model-plugin", "opencode.provider.plugin-descriptor"],
      providerPortIDs: ["provider.model-registry", "provider.stream"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay"],
      runtime: {
        trigger: "OpenCode deterministic AI SDK provider plugins handle sdk/language events and provider catalog mutation.",
        observed: "Native fixture preserves package gates and options forwarding for Anthropic, OpenAI-compatible, Gateway, Perplexity, Google, XAI, and OpenRouter; XAI responses(apiID) language selection; Anthropic/OpenRouter catalog mutations; and OpenAI-compatible includeUsage defaults.",
        retainedFields: ["@ai-sdk/anthropic package gate", "createAnthropic options", "anthropic-beta header", "existing sdk short circuit", "@ai-sdk/openai-compatible package includes", "includeUsage default", "includeUsage=false preservation", "createOpenAICompatible options", "createGateway options", "createPerplexity options", "createGoogleGenerativeAI options", "createXai options", "xai responses apiID", "createOpenRouter options", "openrouter headers", "openrouter chat alias disabled"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-provider-aisdk-plugins:native-exact-fixture",
        "provider-aisdk-plugins-native-exact:opencode",
        "opencode-provider:plugin-runtime-matrix",
      ],
      localMarkers: ["AnthropicPlugin", "OpenAICompatiblePlugin", "GatewayPlugin", "PerplexityPlugin", "GooglePlugin", "XAIPlugin", "OpenRouterPlugin", "createAnthropic", "createOpenAICompatible", "createGateway", "createPerplexity", "createGoogleGenerativeAI", "createXai", "createOpenRouter", "anthropic-beta", "includeUsage", "openrouter-chat-alias-disabled"],
      knownGaps: [],
    }),
    openCodeProviderPluginRuntimeAnchor({
      runtimeID: "hot-reload-cycle-side-effects",
      status: "native-exact",
      sourceRefIDs: ["local-plugin-atoms", "local-plugin-adapter", "local-package-runtime-projection", "local-recipes-conformance", "upstream-provider-plugins"],
      providerAtomIDs: ["opencode.provider.plugin-descriptor", "opencode.provider.model-plugin", "opencode.provider.request-options"],
      providerPortIDs: ["provider.stream", "provider.model-registry", "provider.request-shape"],
      fixtureDiffTarget: "provider.raw-frame-replay",
      relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay"],
      runtime: {
        trigger: "OpenCode plugin registration replaces an existing provider plugin scope with the same source id.",
        observed: "Hot reload cleanup disposes the old provider plugin scope before tracking the replacement, removing services/registries/request hooks before replacement registration.",
        retainedFields: ["scope.dispose", "service cleanup", "provider registry cleanup", "request hook unregister", "replacement provider registration"],
        lossyFields: [],
      },
      localEvidenceRefs: [
        "opencode-plugin-hot-reload-cleanup:native-exact-fixture",
        "plugin-hot-reload-cleanup-native-exact:opencode",
        "opencode-plugin-loader:native-exact-fixture",
        "plugin-loader-native-exact:opencode",
        "opencode-hook-lifecycle:native-exact-fixture",
        "recipes.conformance:replays-opencode-provider-plugin-reload-cleanup-before-replacement-registration",
        "opencode-provider:plugin-runtime-matrix",
        "opencode-hook:source-matrix",
      ],
      localMarkers: [
        "scope.dispose",
        "services.delete",
        "registries.providers.delete",
        "provider.request.before",
        "replacement-disposes-existing-before-track",
        "scope-dispose-removes-tracked-source",
      ],
      knownGaps: [],
    }),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    pinnedRepo: "anomalyco/opencode" as const,
    pinnedRef: "1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-provider-plugin-runtime-matrix" as const,
    fixtureID: "opencode-provider:plugin-runtime-matrix" as const,
    fixtureDiffTarget: "provider.raw-frame-replay" as const,
    relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay" as const],
    sourceRefs: OPENCODE_PROVIDER_PLUGIN_RUNTIME_SOURCE_REFS,
    runtimeAnchors,
    partialRuntimeIDs: runtimeAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.runtimeID),
    missingRuntimeIDs: runtimeAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.runtimeID),
    coveredProviderAtomIDs: uniqueStrings(runtimeAnchors.flatMap((anchor) => anchor.providerAtomIDs)),
    coveredProviderPortIDs: uniqueStrings(runtimeAnchors.flatMap((anchor) => anchor.providerPortIDs)),
    knownGaps: uniqueStrings(runtimeAnchors.flatMap((anchor) => anchor.knownGaps)),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

const OPENCODE_PROVIDER_PACKAGE_RUNTIME_NATIVE_SOURCE_FIXTURES: OpenCodeProviderPackageRuntimeNativeExactSourceFixtureReadback[] = [
  {
    sourceID: "opencode-plugin-provider-registry",
    evidenceRef: "conformance:opencode-plugin-provider-registry-native-exact-fixture",
    replayRef: "plugin-provider-registry-native-exact:opencode",
    fixtureID: "opencode-plugin-provider-registry:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    knownLossiness: [],
    caseIDs: ["auth-loader-hook-filter", "auth-record-from-plugin-list", "provider-model-hook-filter", "source-scoped-provider-registration"],
    sourceRefCount: 4,
  },
  {
    sourceID: "opencode-provider-builtin-plugins",
    evidenceRef: "conformance:opencode-provider-builtin-plugins-native-exact-fixture",
    replayRef: "provider-builtin-plugins-native-exact:opencode",
    fixtureID: "opencode-provider-builtin-plugins:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    knownLossiness: [],
    caseIDs: ["boot-add-order", "dynamic-provider-last", "provider-plugin-order", "split-file-plugin-ids"],
    sourceRefCount: 3,
  },
  {
    sourceID: "opencode-provider-dynamic-package",
    evidenceRef: "conformance:opencode-provider-dynamic-package-native-exact-fixture",
    replayRef: "provider-dynamic-package-native-exact:opencode",
    fixtureID: "opencode-provider-dynamic-package:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    knownLossiness: [],
    caseIDs: [
      "existing-sdk-short-circuits",
      "file-url-factory-export",
      "first-create-export-wins",
      "missing-create-export-error",
      "missing-entrypoint-error",
      "npm-entrypoint-path-to-file-url",
      "truthy-non-function-create-export-error",
    ],
    sourceRefCount: 2,
  },
  {
    sourceID: "opencode-provider-custom-loaders",
    evidenceRef: "conformance:opencode-provider-custom-loaders-native-exact-fixture",
    replayRef: "provider-custom-loaders-native-exact:opencode",
    fixtureID: "opencode-provider-custom-loaders:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    knownLossiness: [],
    caseIDs: [
      "azure-cognitive-services-base-url",
      "azure-missing-resource-getmodel-error",
      "azure-resource-precedence-vars-and-selection",
      "github-copilot-language-selection",
      "google-vertex-anthropic-base-url-and-trim",
      "google-vertex-project-vars-fetch-and-trim",
      "opencode-auth-keeps-paid-models",
      "opencode-public-key-filters-paid-models",
      "openai-and-xai-use-responses",
      "provider-header-options",
    ],
    sourceRefCount: 2,
  },
  {
    sourceID: "opencode-provider-sdk-resolver",
    evidenceRef: "conformance:opencode-provider-sdk-resolver-native-exact-fixture",
    replayRef: "provider-sdk-resolver-native-exact:opencode",
    fixtureID: "opencode-provider-sdk-resolver:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    knownLossiness: [],
    caseIDs: [
      "bundled-provider-options-cache-and-vars",
      "custom-model-loader-and-language-cache",
      "default-language-model-and-language-cache",
      "file-url-import-create-factory",
      "google-vertex-fetch-deleted-for-non-compatible",
      "missing-entrypoint-init-error",
      "non-bundled-npm-import-create-factory",
      "openai-compatible-include-usage-default",
      "openai-compatible-include-usage-false-preserved",
    ],
    sourceRefCount: 3,
  },
  {
    sourceID: "opencode-provider-openai-plugin",
    evidenceRef: "conformance:opencode-provider-openai-plugin-native-exact-fixture",
    replayRef: "provider-openai-plugin-native-exact:opencode",
    fixtureID: "opencode-provider-openai-plugin:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    knownLossiness: [],
    caseIDs: [
      "catalog-transform-disables-chat-only-alias",
      "language-provider-gate",
      "language-responses-api-id",
      "sdk-create-openai-options",
      "sdk-package-gate",
    ],
    sourceRefCount: 2,
  },
  {
    sourceID: "opencode-provider-aisdk-plugins",
    evidenceRef: "conformance:opencode-provider-aisdk-plugins-native-exact-fixture",
    replayRef: "provider-aisdk-plugins-native-exact:opencode",
    fixtureID: "opencode-provider-aisdk-plugins:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    knownLossiness: [],
    caseIDs: [
      "anthropic-catalog-beta-header",
      "anthropic-sdk-create-options",
      "anthropic-sdk-package-gate",
      "gateway-sdk-create-options",
      "google-sdk-create-options",
      "openai-compatible-existing-sdk-short-circuits",
      "openai-compatible-include-usage-false-preserved",
      "openai-compatible-package-gate",
      "openai-compatible-package-includes-and-usage-default",
      "openrouter-catalog-header-and-alias-disable",
      "openrouter-sdk-create-options",
      "perplexity-sdk-create-options",
      "simple-sdk-package-gates",
      "xai-language-provider-gate",
      "xai-language-responses-api-id",
      "xai-sdk-create-options",
    ],
    sourceRefCount: 8,
  },
  {
    sourceID: "opencode-plugin-hot-reload-cleanup",
    evidenceRef: "conformance:opencode-plugin-hot-reload-cleanup-native-exact-fixture",
    replayRef: "plugin-hot-reload-cleanup-native-exact:opencode",
    fixtureID: "opencode-plugin-hot-reload-cleanup:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    knownLossiness: [],
    caseIDs: ["host-state-isolated", "replacement-disposes-existing-before-track", "scope-dispose-removes-tracked-source"],
    sourceRefCount: 3,
  },
]

const OPENCODE_PROVIDER_PACKAGE_RUNTIME_NATIVE_RUNTIME_COVERAGE: OpenCodeProviderPackageRuntimeNativeRuntimeCoverage[] = [
  {
    runtimeID: "provider-auth-ui-registry-runtime",
    fixtureIDs: ["opencode-plugin-provider-registry:native-exact-fixture"],
  },
  {
    runtimeID: "builtin-provider-runtime-registration",
    fixtureIDs: ["opencode-provider-builtin-plugins:native-exact-fixture"],
  },
  {
    runtimeID: "provider-package-module-spawn",
    fixtureIDs: ["opencode-provider-dynamic-package:native-exact-fixture"],
  },
  {
    runtimeID: "provider-custom-loader-runtime",
    fixtureIDs: ["opencode-provider-custom-loaders:native-exact-fixture", "opencode-provider-sdk-resolver:native-exact-fixture"],
  },
  {
    runtimeID: "provider-sdk-resolver-runtime",
    fixtureIDs: [
      "opencode-provider-sdk-resolver:native-exact-fixture",
      "opencode-provider-custom-loaders:native-exact-fixture",
      "opencode-provider-dynamic-package:native-exact-fixture",
    ],
  },
  {
    runtimeID: "openai-provider-plugin-runtime",
    fixtureIDs: ["opencode-provider-openai-plugin:native-exact-fixture"],
  },
  {
    runtimeID: "aisdk-provider-plugin-runtime",
    fixtureIDs: ["opencode-provider-aisdk-plugins:native-exact-fixture"],
  },
  {
    runtimeID: "scope-dispose-registry-cleanup",
    fixtureIDs: ["opencode-plugin-hot-reload-cleanup:native-exact-fixture"],
  },
  {
    runtimeID: "hot-reload-cycle-side-effects",
    fixtureIDs: ["opencode-plugin-hot-reload-cleanup:native-exact-fixture"],
  },
]

export function expectedOpenCodeProviderPackageRuntimeNativeExactSourceFixtures(): OpenCodeProviderPackageRuntimeNativeExactSourceFixtureReadback[] {
  return OPENCODE_PROVIDER_PACKAGE_RUNTIME_NATIVE_SOURCE_FIXTURES.map(openCodeProviderPackageRuntimeNativeSourceFixtureCopy)
}

export function captureOpenCodeProviderPackageRuntimeNativeExactDiffFixture(
  input: OpenCodeProviderPackageRuntimeNativeExactDiffFixtureInput = {},
): OpenCodeProviderPackageRuntimeNativeExactDiffFixture {
  const expectedSourceFixtures = expectedOpenCodeProviderPackageRuntimeNativeExactSourceFixtures()
  const actualSourceFixtures = (input.sourceFixtures ?? expectedSourceFixtures).map(openCodeProviderPackageRuntimeNativeSourceFixtureCopy)
  const expectedRuntimeCoverage = OPENCODE_PROVIDER_PACKAGE_RUNTIME_NATIVE_RUNTIME_COVERAGE.map(openCodeProviderPackageRuntimeNativeRuntimeCoverageCopy)
  const actualRuntimeCoverage = openCodeProviderPackageRuntimeNativeRuntimeCoverage(actualSourceFixtures)
  const fixtureDiff = diffOpenCodeProviderPackageRuntimeNativeExact(expectedSourceFixtures, actualSourceFixtures)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: openCodeProviderPackageRuntimeNativeExactDiffEvidenceRef,
    replayRef: openCodeProviderPackageRuntimeNativeExactDiffReplayRef,
    fixtureID: openCodeProviderPackageRuntimeNativeExactDiffFixtureID,
    exactDiffStatus: "native-exact-diff" as const,
    coverageStatus: "native" as const,
    nativeParityClaim: true as const,
    fixtureDiffTarget: "provider.raw-frame-replay" as const,
    relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay" as const],
    coveredRuntimeIDs: expectedRuntimeCoverage.map((coverage) => coverage.runtimeID),
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/provider/index.ts#ProviderPlugins",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/boot.ts#PluginBoot.boot",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/provider/dynamic.ts#DynamicProviderPlugin,aisdk.sdk,Npm.add,pathToFileURL,create*",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/provider/provider.ts#custom,resolveSDK,getLanguage,BUNDLED_PROVIDERS,Hash.fast,modelLoaders,varsLoaders",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/provider/openai.ts#OpenAIPlugin,aisdk.sdk,aisdk.language,catalog.transform",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/core/src/plugin/provider#AnthropicPlugin,OpenAICompatiblePlugin,GatewayPlugin,PerplexityPlugin,GooglePlugin,XAIPlugin,OpenRouterPlugin",
    ],
    expectedSourceFixtures,
    actualSourceFixtures,
    expectedRuntimeCoverage,
    actualRuntimeCoverage,
    fixtureDiff,
    knownLossiness: [] as [],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyOpenCodeProviderPackageRuntimeNativeExactDiffFixture(
  fixture: OpenCodeProviderPackageRuntimeNativeExactDiffFixture,
): OpenCodeProviderPackageRuntimeNativeExactDiffFixtureVerification {
  const issues: OpenCodeProviderPackageRuntimeNativeExactDiffFixtureIssue[] = []
  const addIssue = (id: string, message: string): void => {
    issues.push({ id, message })
  }
  if (
    fixture.fixtureID !== openCodeProviderPackageRuntimeNativeExactDiffFixtureID ||
    fixture.evidenceRef !== openCodeProviderPackageRuntimeNativeExactDiffEvidenceRef ||
    fixture.replayRef !== openCodeProviderPackageRuntimeNativeExactDiffReplayRef
  ) {
    addIssue("opencode-provider-package-runtime-native-exact-diff.identity", "OpenCode provider package runtime native exact-diff fixture lost its identity.")
  }
  if (fixture.nativeParityClaim !== true || fixture.exactDiffStatus !== "native-exact-diff" || fixture.coverageStatus !== "native") {
    addIssue("opencode-provider-package-runtime-native-exact-diff.native-claim", "OpenCode provider package runtime exact-diff fixture must retain native coverage.")
  }
  if (fixture.knownLossiness.length !== 0) {
    addIssue("opencode-provider-package-runtime-native-exact-diff.lossiness", "OpenCode provider package runtime exact-diff fixture cannot carry known lossiness.")
  }
  if (fixture.fixtureDiff.length > 0 || diffOpenCodeProviderPackageRuntimeNativeExact(fixture.expectedSourceFixtures, fixture.actualSourceFixtures).length > 0) {
    addIssue("opencode-provider-package-runtime-native-exact-diff.source-fixtures", "OpenCode provider package runtime source fixture manifest diverged from the pinned native exact fixtures.")
  }
  if (diffOpenCodeProviderPackageRuntimeNativeExact(fixture.expectedRuntimeCoverage, fixture.actualRuntimeCoverage).length > 0) {
    addIssue("opencode-provider-package-runtime-native-exact-diff.runtime-coverage", "OpenCode provider package runtime fixture no longer covers the expected native runtime IDs.")
  }
  for (const expected of OPENCODE_PROVIDER_PACKAGE_RUNTIME_NATIVE_SOURCE_FIXTURES) {
    const actual = fixture.actualSourceFixtures.find((candidate) => candidate.sourceID === expected.sourceID)
    if (!actual) {
      addIssue("opencode-provider-package-runtime-native-exact-diff.missing-source-fixture", `OpenCode provider package runtime fixture no longer includes ${expected.sourceID}.`)
      continue
    }
    if (actual.exactDiffStatus !== "native-exact" || actual.nativeParityClaim !== true || actual.knownLossiness.length !== 0) {
      addIssue("opencode-provider-package-runtime-native-exact-diff.source-native-claim", `${expected.sourceID} must remain native exact and lossless.`)
    }
    for (const caseID of expected.caseIDs) {
      if (!actual.caseIDs.includes(caseID)) {
        addIssue("opencode-provider-package-runtime-native-exact-diff.missing-case", `${expected.sourceID} no longer carries ${caseID}.`)
      }
    }
    if (actual.sourceRefCount <= 0) {
      addIssue("opencode-provider-package-runtime-native-exact-diff.source-refs", `${expected.sourceID} must carry upstream source refs.`)
    }
  }
  for (const source of ["packages/core/src/plugin/provider/index.ts", "packages/core/src/plugin/boot.ts", "packages/core/src/plugin/provider/dynamic.ts", "packages/opencode/src/provider/provider.ts", "packages/core/src/plugin/provider/openai.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) {
      addIssue("opencode-provider-package-runtime-native-exact-diff.source", `Missing upstream source ref ${source}.`)
    }
  }
  const { fingerprint, ...withoutFingerprint } = fixture
  if (fingerprintObject(withoutFingerprint) !== fingerprint) {
    addIssue("opencode-provider-package-runtime-native-exact-diff.fingerprint", "OpenCode provider package runtime exact-diff fixture fingerprint no longer matches its contents.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export type OpenCodeProviderPackageRuntimeProjectionEvent =
  | {
      type: "package.import"
      providerID: string
      packageName: string
      exportKeys: string[]
      protocol?: string
      moduleSideEffectKeys?: string[]
      sequence?: number
    }
  | {
      type: "model.metadata"
      providerID: string
      modelID: string
      metadataKeys: string[]
      remoteFetchObserved?: boolean
      sequence?: number
    }
  | {
      type: "custom.parser"
      providerID: string
      frameKind: string
      retainedKeys: string[]
      privateFieldKeys?: string[]
      sequence?: number
    }
  | {
      type: "hot.reload"
      providerID: string
      operation: "dispose" | "reload" | "replace"
      cleanupKeys: string[]
      watcherObserved?: boolean
      sequence?: number
    }
  | {
      type: "provider.hook"
      sourceID: string
      hookName: string
      order: number
      payloadKeys: string[]
      concurrentBoundaryObserved?: boolean
      sequence?: number
    }

export interface OpenCodeProviderPackageRuntimeImportProjection {
  providerID: string
  packageName: string
  protocol: string
  exportKeys: string[]
  moduleSideEffectKeys: string[]
  sequence: number
}

export interface OpenCodeProviderPackageRuntimeModelProjection {
  providerID: string
  modelID: string
  metadataKeys: string[]
  remoteFetchObserved: boolean
  sequence: number
}

export interface OpenCodeProviderPackageRuntimeCustomParserProjection {
  providerID: string
  frameKind: string
  retainedKeys: string[]
  privateFieldKeys: string[]
  sequence: number
}

export interface OpenCodeProviderPackageRuntimeHotReloadProjection {
  providerID: string
  operation: "dispose" | "reload" | "replace"
  cleanupKeys: string[]
  watcherObserved: boolean
  sequence: number
}

export interface OpenCodeProviderPackageRuntimeHookProjection {
  sourceID: string
  hookName: string
  order: number
  payloadKeys: string[]
  concurrentBoundaryObserved: boolean
  sequence: number
}

export interface OpenCodeProviderPackageRuntimeProjection {
  schemaVersion: 1
  fixtureID: "opencode-provider:package-runtime-projection"
  evidenceRef: "conformance:opencode-provider-package-runtime-projection"
  fixtureDiffTarget: "provider.raw-frame-replay"
  relatedFixtureDiffTargets: Array<"hook.plugin-lifecycle-replay">
  coveredRuntimeIDs: Array<
    Extract<
      OpenCodeProviderPluginRuntimeID,
      "builtin-provider-runtime-registration" | "provider-package-module-spawn" | "hot-reload-cycle-side-effects" | "exact-concurrent-provider-hook-order"
    >
  >
  coveredBoundaryIDs: Array<Extract<OpenCodeProviderRawFrameBoundaryID, "custom-provider-protocol-runtime" | "live-provider-plugin-runtime">>
  retainedFields: string[]
  lossyFields: string[]
  eventTypes: Array<OpenCodeProviderPackageRuntimeProjectionEvent["type"]>
  packageImports: OpenCodeProviderPackageRuntimeImportProjection[]
  modelMetadata: OpenCodeProviderPackageRuntimeModelProjection[]
  customParserFrames: OpenCodeProviderPackageRuntimeCustomParserProjection[]
  hotReloads: OpenCodeProviderPackageRuntimeHotReloadProjection[]
  providerHooks: OpenCodeProviderPackageRuntimeHookProjection[]
  knownGaps: string[]
  fingerprint: string
}

export function projectOpenCodeProviderPackageRuntimeProjection(
  events: OpenCodeProviderPackageRuntimeProjectionEvent[],
): OpenCodeProviderPackageRuntimeProjection {
  const sequencedEvents = events.map((event, index) => ({ ...event, sequence: event.sequence ?? index }))
  const packageImports = uniqueBy(
    sequencedEvents.flatMap((event): OpenCodeProviderPackageRuntimeImportProjection[] => {
      if (event.type !== "package.import") return []
      return [{
        providerID: event.providerID,
        packageName: event.packageName,
        protocol: event.protocol ?? "unknown",
        exportKeys: uniqueStrings(event.exportKeys),
        moduleSideEffectKeys: uniqueStrings(event.moduleSideEffectKeys ?? []),
        sequence: event.sequence,
      }]
    }),
    (item) => `${sequenceKey(item.sequence)}:${item.providerID}:${item.packageName}:${item.protocol}:${item.exportKeys.join(",")}:${item.moduleSideEffectKeys.join(",")}`,
  )
  const modelMetadata = uniqueBy(
    sequencedEvents.flatMap((event): OpenCodeProviderPackageRuntimeModelProjection[] => {
      if (event.type !== "model.metadata") return []
      return [{
        providerID: event.providerID,
        modelID: event.modelID,
        metadataKeys: uniqueStrings(event.metadataKeys),
        remoteFetchObserved: event.remoteFetchObserved ?? false,
        sequence: event.sequence,
      }]
    }),
    (item) => `${sequenceKey(item.sequence)}:${item.providerID}:${item.modelID}:${item.metadataKeys.join(",")}:${item.remoteFetchObserved}`,
  )
  const customParserFrames = uniqueBy(
    sequencedEvents.flatMap((event): OpenCodeProviderPackageRuntimeCustomParserProjection[] => {
      if (event.type !== "custom.parser") return []
      return [{
        providerID: event.providerID,
        frameKind: event.frameKind,
        retainedKeys: uniqueStrings(event.retainedKeys),
        privateFieldKeys: uniqueStrings(event.privateFieldKeys ?? []),
        sequence: event.sequence,
      }]
    }),
    (item) => `${sequenceKey(item.sequence)}:${item.providerID}:${item.frameKind}:${item.retainedKeys.join(",")}:${item.privateFieldKeys.join(",")}`,
  )
  const hotReloads = uniqueBy(
    sequencedEvents.flatMap((event): OpenCodeProviderPackageRuntimeHotReloadProjection[] => {
      if (event.type !== "hot.reload") return []
      return [{
        providerID: event.providerID,
        operation: event.operation,
        cleanupKeys: uniqueStrings(event.cleanupKeys),
        watcherObserved: event.watcherObserved ?? false,
        sequence: event.sequence,
      }]
    }),
    (item) => `${sequenceKey(item.sequence)}:${item.providerID}:${item.operation}:${item.cleanupKeys.join(",")}:${item.watcherObserved}`,
  )
  const providerHooks = uniqueBy(
    sequencedEvents.flatMap((event): OpenCodeProviderPackageRuntimeHookProjection[] => {
      if (event.type !== "provider.hook") return []
      return [{
        sourceID: event.sourceID,
        hookName: event.hookName,
        order: event.order,
        payloadKeys: uniqueStrings(event.payloadKeys),
        concurrentBoundaryObserved: event.concurrentBoundaryObserved ?? false,
        sequence: event.sequence,
      }]
    }),
    (item) => `${sequenceKey(item.sequence)}:${sequenceKey(item.order)}:${item.sourceID}:${item.hookName}:${item.payloadKeys.join(",")}:${item.concurrentBoundaryObserved}`,
  )
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    fixtureID: "opencode-provider:package-runtime-projection" as const,
    evidenceRef: "conformance:opencode-provider-package-runtime-projection" as const,
    fixtureDiffTarget: "provider.raw-frame-replay" as const,
    relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay" as const],
    coveredRuntimeIDs: [
      "builtin-provider-runtime-registration",
      "provider-package-module-spawn",
      "hot-reload-cycle-side-effects",
      "exact-concurrent-provider-hook-order",
    ] satisfies OpenCodeProviderPackageRuntimeProjection["coveredRuntimeIDs"],
    coveredBoundaryIDs: [
      "custom-provider-protocol-runtime",
      "live-provider-plugin-runtime",
    ] satisfies OpenCodeProviderPackageRuntimeProjection["coveredBoundaryIDs"],
    retainedFields: [
      "npm package specifier",
      "providerID",
      "packageName",
      "module export keys",
      "provider protocol",
      "remote model metadata keys",
      "custom frame kind",
      "custom frame retained keys",
      "scope cleanup operation",
      "source-ordered provider hook payload keys",
    ],
    lossyFields: [
      "remote model metadata fetch timing",
      "custom provider private protocol fields",
      "native hot reload watcher debounce",
      "module cache invalidation order",
    ],
    eventTypes: uniqueStrings(sequencedEvents.map((event) => event.type)) as OpenCodeProviderPackageRuntimeProjection["eventTypes"],
    packageImports,
    modelMetadata,
    customParserFrames,
    hotReloads,
    providerHooks,
    knownGaps: [
      "opencode-provider-package-runtime-projection-partial-fixture",
      "opencode-real-provider-package-parser-not-spawned",
      "opencode-provider-model-metadata-fetch-not-replayed",
      "opencode-custom-provider-native-protocol-private-fields-not-replayed",
      "opencode-plugin-native-file-watcher-hot-reload-not-replayed",
    ],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export interface OpenCodeProviderPackageRuntimeLiveRuntimeFixtureInput {
  providerID?: string
  packageName?: string
  npmSpecifier?: string
  modelID?: string
  sourceID?: string
  rawFrame?: string
  factoryCallCount?: number
  generationBefore?: number
}

export interface OpenCodeProviderPackageImportLiveRuntimeReadback {
  providerID: string
  packageName: string
  npmSpecifier: string
  importer: "plugin-loader"
  moduleExportKeys: string[]
  moduleSideEffectKeys: string[]
  factoryCallCount: number
  providerRegistryKeys: string[]
  exactSpecifierReadback: boolean
  sequence: number
}

export interface OpenCodeProviderModelMetadataLiveRuntimeReadback {
  providerID: string
  modelID: string
  metadataKeys: string[]
  cacheKey: string
  fetchAttempt: number
  remoteFetchObserved: boolean
  readbackStatus: "metadata-keys-retained"
  sequence: number
}

export interface OpenCodeProviderCustomParserLiveRuntimeReadback {
  providerID: string
  protocol: "custom"
  frameKind: string
  rawFrameHash: string
  rawFrameOrder: number
  retainedKeys: string[]
  privateFieldKeys: string[]
  parsedEventKinds: string[]
  exactRawFrameReadback: boolean
  sequence: number
}

export interface OpenCodeProviderHotReloadLiveRuntimeReadback {
  providerID: string
  sourceID: string
  operation: "dispose" | "reload" | "replace"
  generationBefore: number
  generationAfter: number
  cleanupOperations: string[]
  invalidatedCacheKeys: string[]
  watcherEvent: "change"
  debounceBucket: "deterministic-local"
  replacementRegistryKeys: string[]
  sequence: number
}

export interface OpenCodeProviderHookTimingLiveRuntimeReadback {
  sourceID: string
  hookName: string
  order: number
  handlerID: string
  payloadKeys: string[]
  asyncBoundaryMarker: "source-order-await"
  mergeWinnerKeys: string[]
  concurrentBoundaryObserved: boolean
  sequence: number
}

export interface OpenCodeProviderPackageRuntimeLiveRuntimeFixture {
  schemaVersion: 1
  product: "opencode"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-provider-package-runtime-live-runtime-fixture"
  fixtureID: "opencode-provider:package-runtime-live-runtime-fixture"
  exactDiffStatus: "live-runtime-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  fixtureDiffTarget: "provider.raw-frame-replay"
  relatedFixtureDiffTargets: Array<"hook.plugin-lifecycle-replay">
  coveredRuntimeIDs: OpenCodeProviderPackageRuntimeProjection["coveredRuntimeIDs"]
  coveredBoundaryIDs: OpenCodeProviderPackageRuntimeProjection["coveredBoundaryIDs"]
  packageImportReadback: OpenCodeProviderPackageImportLiveRuntimeReadback[]
  modelMetadataReadback: OpenCodeProviderModelMetadataLiveRuntimeReadback[]
  customParserReadback: OpenCodeProviderCustomParserLiveRuntimeReadback[]
  hotReloadReadback: OpenCodeProviderHotReloadLiveRuntimeReadback[]
  providerHookTimingReadback: OpenCodeProviderHookTimingLiveRuntimeReadback[]
  packageRuntimeProjection: OpenCodeProviderPackageRuntimeProjection
  retainedFields: string[]
  lossyFields: string[]
  knownGaps: string[]
  fingerprint: string
}

export interface OpenCodeProviderPackageRuntimeLiveRuntimeFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeProviderPackageRuntimeLiveRuntimeFixtureVerification {
  ok: boolean
  issues: OpenCodeProviderPackageRuntimeLiveRuntimeFixtureIssue[]
}

export function captureOpenCodeProviderPackageRuntimeLiveRuntimeFixture(
  input: OpenCodeProviderPackageRuntimeLiveRuntimeFixtureInput = {},
): OpenCodeProviderPackageRuntimeLiveRuntimeFixture {
  const providerID = input.providerID ?? "anthropic"
  const packageName = input.packageName ?? "@opencode/provider-anthropic"
  const npmSpecifier = input.npmSpecifier ?? `npm:${packageName}`
  const modelID = input.modelID ?? "claude-opus-4"
  const sourceID = input.sourceID ?? npmSpecifier
  const rawFrame = input.rawFrame ?? '{"type":"tool_call","id":"call_pkg","text":"delta","private":{"nativeIndex":0,"rawVendorPart":"opaque"}}'
  const factoryCallCount = input.factoryCallCount ?? 1
  const generationBefore = input.generationBefore ?? 7
  const moduleExportKeys = uniqueStrings(["default", "provider"])
  const moduleSideEffectKeys = uniqueStrings(["env-read", "models-cache", "registry-warmup"])
  const metadataKeys = uniqueStrings(["contextWindow", "displayName", "price", "supportsTools"])
  const retainedParserKeys = uniqueStrings(["finishReason", "id", "text", "type"])
  const privateFieldKeys = uniqueStrings(["nativeIndex", "rawVendorPart"])
  const cleanupOperations = uniqueStrings(["provider.registry", "request.hook", "scope.cleanup"])
  const invalidatedCacheKeys = uniqueStrings([packageName, npmSpecifier])
  const payloadKeys = uniqueStrings(["headers", "providerOptions"])
  const providerRegistryKeys = uniqueStrings([providerID, `${providerID}:custom`])
  const replacementRegistryKeys = uniqueStrings([`${providerID}:replacement`, providerID])
  const packageImportReadback: OpenCodeProviderPackageImportLiveRuntimeReadback[] = [
    {
      providerID,
      packageName,
      npmSpecifier,
      importer: "plugin-loader",
      moduleExportKeys,
      moduleSideEffectKeys,
      factoryCallCount,
      providerRegistryKeys,
      exactSpecifierReadback: true,
      sequence: 1,
    },
  ]
  const modelMetadataReadback: OpenCodeProviderModelMetadataLiveRuntimeReadback[] = [
    {
      providerID,
      modelID,
      metadataKeys,
      cacheKey: `${providerID}:${modelID}:metadata`,
      fetchAttempt: 1,
      remoteFetchObserved: true,
      readbackStatus: "metadata-keys-retained",
      sequence: 2,
    },
  ]
  const customParserReadback: OpenCodeProviderCustomParserLiveRuntimeReadback[] = [
    {
      providerID,
      protocol: "custom",
      frameKind: "tool_call",
      rawFrameHash: fingerprintObject({ rawFrame }),
      rawFrameOrder: 1,
      retainedKeys: retainedParserKeys,
      privateFieldKeys,
      parsedEventKinds: ["tool_call"],
      exactRawFrameReadback: true,
      sequence: 3,
    },
  ]
  const hotReloadReadback: OpenCodeProviderHotReloadLiveRuntimeReadback[] = [
    {
      providerID,
      sourceID,
      operation: "replace",
      generationBefore,
      generationAfter: generationBefore + 1,
      cleanupOperations,
      invalidatedCacheKeys,
      watcherEvent: "change",
      debounceBucket: "deterministic-local",
      replacementRegistryKeys,
      sequence: 4,
    },
  ]
  const providerHookTimingReadback: OpenCodeProviderHookTimingLiveRuntimeReadback[] = [
    {
      sourceID,
      hookName: "chat.params",
      order: 2,
      handlerID: `${sourceID}:chat.params`,
      payloadKeys,
      asyncBoundaryMarker: "source-order-await",
      mergeWinnerKeys: ["providerOptions"],
      concurrentBoundaryObserved: true,
      sequence: 5,
    },
  ]
  const packageRuntimeProjection = projectOpenCodeProviderPackageRuntimeProjection([
    {
      type: "package.import",
      providerID,
      packageName,
      exportKeys: moduleExportKeys,
      protocol: "custom",
      moduleSideEffectKeys,
      sequence: 1,
    },
    {
      type: "model.metadata",
      providerID,
      modelID,
      metadataKeys,
      remoteFetchObserved: true,
      sequence: 2,
    },
    {
      type: "custom.parser",
      providerID,
      frameKind: "tool_call",
      retainedKeys: retainedParserKeys,
      privateFieldKeys,
      sequence: 3,
    },
    {
      type: "hot.reload",
      providerID,
      operation: "replace",
      cleanupKeys: cleanupOperations,
      watcherObserved: true,
      sequence: 4,
    },
    {
      type: "provider.hook",
      sourceID,
      hookName: "chat.params",
      order: 2,
      payloadKeys,
      concurrentBoundaryObserved: true,
      sequence: 5,
    },
  ])
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-provider-package-runtime-live-runtime-fixture" as const,
    fixtureID: "opencode-provider:package-runtime-live-runtime-fixture" as const,
    exactDiffStatus: "live-runtime-partial" as const,
    coverageStatus: "partial" as const,
    nativeParityClaim: false as const,
    fixtureDiffTarget: "provider.raw-frame-replay" as const,
    relatedFixtureDiffTargets: ["hook.plugin-lifecycle-replay" as const],
    coveredRuntimeIDs: packageRuntimeProjection.coveredRuntimeIDs,
    coveredBoundaryIDs: packageRuntimeProjection.coveredBoundaryIDs,
    packageImportReadback,
    modelMetadataReadback,
    customParserReadback,
    hotReloadReadback,
    providerHookTimingReadback,
    packageRuntimeProjection,
    retainedFields: [
      "npm package specifier readback",
      "module export keys readback",
      "provider registry key readback",
      "remote model metadata key readback",
      "custom protocol raw frame hash",
      "custom protocol private field keys",
      "hot reload cleanup operation readback",
      "module cache invalidation key readback",
      "source ordered provider hook timing readback",
    ],
    lossyFields: [
      "real @opencode/provider-* parser side effects",
      "remote model metadata fetch timing",
      "credential refresh side effects",
      "custom provider protocol private field object identity",
      "native hot reload watcher debounce",
      "native module cache invalidation ordering",
    ],
    knownGaps: [
      "opencode-provider-package-runtime-live-runtime-fixture-partial-native-gap",
      "opencode-real-provider-package-parser-not-spawned",
      "opencode-provider-model-metadata-fetch-not-replayed",
      "opencode-provider-native-hot-reload-order-not-replayed",
      "opencode-provider-credential-refresh-side-effects-not-replayed",
    ],
  }

  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyOpenCodeProviderPackageRuntimeLiveRuntimeFixture(
  fixture: OpenCodeProviderPackageRuntimeLiveRuntimeFixture,
): OpenCodeProviderPackageRuntimeLiveRuntimeFixtureVerification {
  const issues: OpenCodeProviderPackageRuntimeLiveRuntimeFixtureIssue[] = []
  const addIssue = (id: string, message: string): void => {
    issues.push({ id, message })
  }
  if (fixture.fixtureID !== "opencode-provider:package-runtime-live-runtime-fixture" || fixture.evidenceRef !== "conformance:opencode-provider-package-runtime-live-runtime-fixture") {
    addIssue("opencode-provider-package-runtime-live-runtime.identity", "OpenCode provider package runtime live fixture lost its fixture or evidence identity.")
  }
  if (fixture.nativeParityClaim !== false || fixture.exactDiffStatus !== "live-runtime-partial" || fixture.coverageStatus !== "partial") {
    addIssue("opencode-provider-package-runtime-live-runtime.native-claim", "OpenCode provider package runtime live fixture must stay partial and cannot claim native parity.")
  }
  for (const runtimeID of ["builtin-provider-runtime-registration", "provider-package-module-spawn", "hot-reload-cycle-side-effects", "exact-concurrent-provider-hook-order"] as const) {
    if (!fixture.coveredRuntimeIDs.includes(runtimeID)) {
      addIssue("opencode-provider-package-runtime-live-runtime.missing-runtime", `OpenCode provider package runtime live fixture no longer covers ${runtimeID}.`)
    }
  }
  for (const boundaryID of ["custom-provider-protocol-runtime", "live-provider-plugin-runtime"] as const) {
    if (!fixture.coveredBoundaryIDs.includes(boundaryID)) {
      addIssue("opencode-provider-package-runtime-live-runtime.missing-boundary", `OpenCode provider package runtime live fixture no longer covers ${boundaryID}.`)
    }
  }
  if (fixture.packageRuntimeProjection.fixtureID !== "opencode-provider:package-runtime-projection" || fixture.packageRuntimeProjection.evidenceRef !== "conformance:opencode-provider-package-runtime-projection") {
    addIssue("opencode-provider-package-runtime-live-runtime.package-projection", "OpenCode provider package runtime live fixture lost the nested package runtime projection identity.")
  }
  const packageImport = fixture.packageImportReadback.some((record) =>
    record.exactSpecifierReadback === true &&
    record.importer === "plugin-loader" &&
    record.npmSpecifier.startsWith("npm:@opencode/provider-") &&
    record.moduleExportKeys.includes("default") &&
    record.moduleExportKeys.includes("provider") &&
    record.factoryCallCount > 0 &&
    record.providerRegistryKeys.includes(record.providerID),
  )
  if (!packageImport) {
    addIssue("opencode-provider-package-runtime-live-runtime.package-import-readback", "OpenCode provider package runtime live fixture must retain npm package import, module export, factory call, and provider registry readback.")
  }
  const modelMetadata = fixture.modelMetadataReadback.some((record) =>
    record.remoteFetchObserved === true &&
    record.readbackStatus === "metadata-keys-retained" &&
    record.cacheKey.length > 0 &&
    record.fetchAttempt > 0 &&
    record.metadataKeys.includes("contextWindow") &&
    record.metadataKeys.includes("price"),
  )
  if (!modelMetadata) {
    addIssue("opencode-provider-package-runtime-live-runtime.model-metadata-readback", "OpenCode provider package runtime live fixture must retain remote model metadata key readback.")
  }
  const customParser = fixture.customParserReadback.some((record) =>
    record.protocol === "custom" &&
    record.exactRawFrameReadback === true &&
    record.rawFrameHash.length === 16 &&
    record.retainedKeys.includes("text") &&
    record.privateFieldKeys.length > 0 &&
    record.parsedEventKinds.includes(record.frameKind),
  )
  if (!customParser) {
    addIssue("opencode-provider-package-runtime-live-runtime.custom-parser-readback", "OpenCode provider package runtime live fixture must retain custom protocol raw frame, parser event, and private-field readback.")
  }
  const hotReload = fixture.hotReloadReadback.some((record) =>
    record.operation === "replace" &&
    record.generationAfter > record.generationBefore &&
    record.cleanupOperations.includes("provider.registry") &&
    record.cleanupOperations.includes("request.hook") &&
    record.invalidatedCacheKeys.length > 0 &&
    record.replacementRegistryKeys.includes(record.providerID),
  )
  if (!hotReload) {
    addIssue("opencode-provider-package-runtime-live-runtime.hot-reload-readback", "OpenCode provider package runtime live fixture must retain hot reload cleanup, module cache invalidation, and replacement registry readback.")
  }
  const hookTiming = fixture.providerHookTimingReadback.some((record) =>
    record.concurrentBoundaryObserved === true &&
    record.asyncBoundaryMarker === "source-order-await" &&
    record.payloadKeys.includes("providerOptions") &&
    record.mergeWinnerKeys.includes("providerOptions"),
  )
  if (!hookTiming) {
    addIssue("opencode-provider-package-runtime-live-runtime.hook-timing-readback", "OpenCode provider package runtime live fixture must retain source-ordered provider hook timing readback.")
  }
  for (const requiredGap of [
    "opencode-provider-package-runtime-live-runtime-fixture-partial-native-gap",
    "opencode-real-provider-package-parser-not-spawned",
    "opencode-provider-model-metadata-fetch-not-replayed",
    "opencode-provider-native-hot-reload-order-not-replayed",
  ]) {
    if (!fixture.knownGaps.includes(requiredGap)) {
      addIssue("opencode-provider-package-runtime-live-runtime.native-gaps", `OpenCode provider package runtime live fixture no longer records ${requiredGap}.`)
    }
  }
  if (!fixture.retainedFields.includes("custom protocol raw frame hash") || !fixture.retainedFields.includes("source ordered provider hook timing readback") || !fixture.lossyFields.some((field) => /native|side effects|interleaving/i.test(field))) {
    addIssue("opencode-provider-package-runtime-live-runtime.retained-lossy-fields", "OpenCode provider package runtime live fixture must retain local readback keys and name native lossiness.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export type PiProviderSourceRefID =
  | "anthropic-provider"
  | "openai-responses-provider"
  | "builtin-provider-registry"

export interface PiProviderSourceRef {
  id: PiProviderSourceRefID
  repo: "earendil-works/pi"
  ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
  path: string
  symbols: string[]
  evidence: "github-tree:2026-06-10"
}

export type PiProviderSourceMatrixBranchID =
  | "builtin-provider-registration"
  | "anthropic-request"
  | "openai-responses-request"
  | "model-extension"
  | "request-options"
  | "auth-descriptor"
  | "stream-parser"
  | "event-normalizer"
  | "usage-renderer"
  | "transport-instrumentation"
  | "extension-descriptor"
  | "live-api-provider-runtime"
  | "exact-provider-retry-cancel"

export type PiProviderSourceMatrixBranchStatus = "partial" | "missing"

export interface PiProviderSourceMatrixBranchAnchor {
  branchID: PiProviderSourceMatrixBranchID
  status: PiProviderSourceMatrixBranchStatus
  sourceRefIDs: PiProviderSourceRefID[]
  providerAtomIDs: string[]
  providerPortIDs: string[]
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
}

export interface PiProviderSourceMatrixSnapshot {
  schemaVersion: 1
  upstreamRef: "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
  pinnedRepo: "earendil-works/pi"
  pinnedRef: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da"
  evidenceRef: "conformance:pi-provider-source-matrix"
  fixtureID: "pi-provider:source-matrix"
  sourceRefs: PiProviderSourceRef[]
  branchAnchors: PiProviderSourceMatrixBranchAnchor[]
  partialBranchIDs: PiProviderSourceMatrixBranchID[]
  missingBranchIDs: PiProviderSourceMatrixBranchID[]
  coveredProviderAtomIDs: string[]
  coveredProviderPortIDs: string[]
  knownGaps: string[]
  fingerprint: string
}

const PI_PROVIDER_SOURCE_REFS: PiProviderSourceRef[] = [
  {
    id: "anthropic-provider",
    repo: "earendil-works/pi",
    ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    path: "packages/ai/src/providers/anthropic.ts",
    symbols: ["AnthropicOptions", "streamAnthropic", "streamSimpleAnthropic", "buildParams", "convertMessages", "convertTools"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "openai-responses-provider",
    repo: "earendil-works/pi",
    ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    path: "packages/ai/src/providers/openai-responses.ts",
    symbols: ["OpenAIResponsesOptions", "streamOpenAIResponses", "streamSimpleOpenAIResponses", "buildParams"],
    evidence: "github-tree:2026-06-10",
  },
  {
    id: "builtin-provider-registry",
    repo: "earendil-works/pi",
    ref: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
    path: "packages/ai/src/providers/register-builtins.ts",
    symbols: ["registerBuiltInApiProviders", "resetApiProviders", "streamAnthropic", "streamOpenAIResponses"],
    evidence: "github-tree:2026-06-10",
  },
]

function piProviderSourceBranchAnchor(input: PiProviderSourceMatrixBranchAnchor): PiProviderSourceMatrixBranchAnchor {
  return input
}

export function buildPiProviderSourceMatrixSnapshot(): PiProviderSourceMatrixSnapshot {
  const branchAnchors: PiProviderSourceMatrixBranchAnchor[] = [
    piProviderSourceBranchAnchor({
      branchID: "builtin-provider-registration",
      status: "partial",
      sourceRefIDs: ["builtin-provider-registry", "anthropic-provider", "openai-responses-provider"],
      providerAtomIDs: ["pi.provider.model-extension", "pi.provider.extension-descriptor"],
      providerPortIDs: ["provider.model-registry", "provider.stream"],
      localEvidenceRefs: ["provider-port:provider.model-registry", "provider-port:provider.stream", "current-module:pi-provider-source-locations"],
      localMarkers: ["registerBuiltInApiProviders", "resetApiProviders", "streamAnthropic", "streamOpenAIResponses"],
      knownGaps: ["pi-provider-registration-live-extension-runtime-not-replayed"],
    }),
    piProviderSourceBranchAnchor({
      branchID: "anthropic-request",
      status: "partial",
      sourceRefIDs: ["anthropic-provider"],
      providerAtomIDs: ["pi.provider.request-options", "pi.provider.extension-descriptor"],
      providerPortIDs: ["provider.request-shape", "provider.stream"],
      localEvidenceRefs: ["provider-port:provider.request-shape", "provider-port:provider.stream"],
      localMarkers: ["AnthropicOptions", "streamAnthropic", "buildParams", "convertMessages", "convertTools"],
      knownGaps: ["pi-anthropic-live-provider-not-spawned"],
    }),
    piProviderSourceBranchAnchor({
      branchID: "openai-responses-request",
      status: "partial",
      sourceRefIDs: ["openai-responses-provider"],
      providerAtomIDs: ["pi.provider.request-options", "pi.provider.extension-descriptor"],
      providerPortIDs: ["provider.request-shape", "provider.stream"],
      localEvidenceRefs: ["provider-port:provider.request-shape", "provider-port:provider.stream"],
      localMarkers: ["OpenAIResponsesOptions", "streamOpenAIResponses", "buildParams"],
      knownGaps: ["pi-openai-responses-live-provider-not-spawned"],
    }),
    piProviderSourceBranchAnchor({
      branchID: "model-extension",
      status: "partial",
      sourceRefIDs: ["builtin-provider-registry", "anthropic-provider", "openai-responses-provider"],
      providerAtomIDs: ["pi.provider.model-extension"],
      providerPortIDs: ["provider.model-registry"],
      localEvidenceRefs: ["provider-port:provider.model-registry"],
      localMarkers: ["registerBuiltInApiProviders", "provider-model-extension", "buildParams"],
      knownGaps: ["pi-provider-model-extension-remote-metadata-not-replayed"],
    }),
    piProviderSourceBranchAnchor({
      branchID: "request-options",
      status: "partial",
      sourceRefIDs: ["anthropic-provider", "openai-responses-provider"],
      providerAtomIDs: ["pi.provider.request-options"],
      providerPortIDs: ["provider.request-shape"],
      localEvidenceRefs: ["provider-port:provider.request-shape", "pi-mono-provider-stream:raw-payload-roundtrip"],
      localMarkers: ["buildParams", "convertMessages", "convertTools"],
      knownGaps: ["pi-provider-native-request-shape-not-spawned"],
    }),
    piProviderSourceBranchAnchor({
      branchID: "auth-descriptor",
      status: "partial",
      sourceRefIDs: ["anthropic-provider", "openai-responses-provider", "builtin-provider-registry"],
      providerAtomIDs: ["pi.provider.auth-descriptor"],
      providerPortIDs: ["provider.auth"],
      localEvidenceRefs: ["provider-port:provider.auth"],
      localMarkers: ["AnthropicOptions", "OpenAIResponsesOptions", "redacted-auth-boundary"],
      knownGaps: ["pi-provider-env-secret-resolution-not-replayed"],
    }),
    piProviderSourceBranchAnchor({
      branchID: "stream-parser",
      status: "partial",
      sourceRefIDs: ["anthropic-provider", "openai-responses-provider"],
      providerAtomIDs: ["pi.provider.parser-observer"],
      providerPortIDs: ["provider.stream-parser"],
      localEvidenceRefs: ["pi-mono-provider-stream:raw-frame-timeline", "pi-mono-provider-stream:raw-payload-roundtrip"],
      localMarkers: ["streamAnthropic", "streamOpenAIResponses", "raw-frame-order"],
      knownGaps: ["pi-provider-parser-native-error-frame-detail-not-replayed"],
    }),
    piProviderSourceBranchAnchor({
      branchID: "event-normalizer",
      status: "partial",
      sourceRefIDs: ["anthropic-provider", "openai-responses-provider"],
      providerAtomIDs: ["pi.provider.event-observer"],
      providerPortIDs: ["provider.event-normalizer"],
      localEvidenceRefs: ["provider-stream-replay:pi-mono:stream-projector", "provider-raw-payload-roundtrip:pi-mono"],
      localMarkers: ["streamAnthropic", "streamOpenAIResponses", "text-delta", "tool-call-arguments", "finish-usage"],
      knownGaps: ["pi-provider-event-normalizer-raw-private-state-not-replayed"],
    }),
    piProviderSourceBranchAnchor({
      branchID: "usage-renderer",
      status: "partial",
      sourceRefIDs: ["anthropic-provider", "openai-responses-provider"],
      providerAtomIDs: ["pi.provider.usage-renderer"],
      providerPortIDs: ["provider.usage-normalizer"],
      localEvidenceRefs: ["pi-mono-provider-stream:raw-payload-roundtrip"],
      localMarkers: ["streamAnthropic", "streamOpenAIResponses", "usage", "finish-reason"],
      knownGaps: ["pi-provider-native-usage-accounting-not-replayed"],
    }),
    piProviderSourceBranchAnchor({
      branchID: "transport-instrumentation",
      status: "partial",
      sourceRefIDs: ["anthropic-provider", "openai-responses-provider"],
      providerAtomIDs: ["pi.provider.transport-instrumentation"],
      providerPortIDs: ["provider.transport"],
      localEvidenceRefs: ["provider-raw-frame-timeline:pi-mono"],
      localMarkers: ["streamAnthropic", "streamOpenAIResponses", "retry-error-boundary", "cancel-boundary"],
      knownGaps: ["pi-provider-live-transport-not-replayed", "pi-provider-retry-delay-not-exact"],
    }),
    piProviderSourceBranchAnchor({
      branchID: "extension-descriptor",
      status: "partial",
      sourceRefIDs: ["builtin-provider-registry", "anthropic-provider", "openai-responses-provider"],
      providerAtomIDs: ["pi.provider.extension-descriptor"],
      providerPortIDs: ["provider.stream"],
      localEvidenceRefs: ["provider-port:provider.stream", "provider-stream-replay:pi-mono:streaming-delta-recorder"],
      localMarkers: ["registerBuiltInApiProviders", "AnthropicOptions", "OpenAIResponsesOptions"],
      knownGaps: ["pi-provider-extension-runtime-side-effects-not-replayed"],
    }),
    piProviderSourceBranchAnchor({
      branchID: "live-api-provider-runtime",
      status: "missing",
      sourceRefIDs: ["builtin-provider-registry", "anthropic-provider", "openai-responses-provider"],
      providerAtomIDs: ["pi.provider.extension-descriptor", "pi.provider.model-extension"],
      providerPortIDs: ["provider.stream", "provider.model-registry"],
      localEvidenceRefs: ["pi-provider:source-matrix"],
      localMarkers: ["source-anchored-only"],
      knownGaps: ["pi-live-api-provider-runtime-not-spawned"],
    }),
    piProviderSourceBranchAnchor({
      branchID: "exact-provider-retry-cancel",
      status: "missing",
      sourceRefIDs: ["anthropic-provider", "openai-responses-provider"],
      providerAtomIDs: ["pi.provider.transport-instrumentation", "pi.provider.parser-observer"],
      providerPortIDs: ["provider.transport", "provider.stream-parser"],
      localEvidenceRefs: ["pi-mono-provider-stream:raw-frame-timeline"],
      localMarkers: ["retry:partial", "cancel:partial", "wall-clock:not-replayed"],
      knownGaps: ["pi-provider-retry-delay-and-cancel-abort-race-not-exact"],
    }),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    upstreamRef: "upstream:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da" as const,
    pinnedRepo: "earendil-works/pi" as const,
    pinnedRef: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da" as const,
    evidenceRef: "conformance:pi-provider-source-matrix" as const,
    fixtureID: "pi-provider:source-matrix" as const,
    sourceRefs: PI_PROVIDER_SOURCE_REFS,
    branchAnchors,
    partialBranchIDs: branchAnchors.filter((anchor) => anchor.status === "partial").map((anchor) => anchor.branchID),
    missingBranchIDs: branchAnchors.filter((anchor) => anchor.status === "missing").map((anchor) => anchor.branchID),
    coveredProviderAtomIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.providerAtomIDs)),
    coveredProviderPortIDs: uniqueStrings(branchAnchors.flatMap((anchor) => anchor.providerPortIDs)),
    knownGaps: uniqueStrings([
      "pi-provider-source-matrix-covered-by-partial-fixture",
      ...branchAnchors.flatMap((anchor) => anchor.knownGaps),
    ]),
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export type ProviderRawFrameReplayGateProduct = "opencode" | "pi-mono" | "nanobot" | "hermes-agent"
export type ProviderRawFrameReplayGateDimension =
  | "request-shape"
  | "registry-selection"
  | "raw-frame-order"
  | "usage-accounting"
  | "retry-error-cancel"
  | "raw-payload-roundtrip"

export interface ProviderRawFrameReplayGateCase {
  product: ProviderRawFrameReplayGateProduct
  upstreamRef: string
  evidenceRef: string
  fixtureID: string
  requestShape: string[]
  registrySelection: string[]
  rawFrameOrder: string[]
  usageAccounting: string[]
  retryErrorCancel: string[]
  rawPayloadRoundTrip: string[]
  sourceAnchors: string[]
  providerAtomIDs: string[]
  providerPortIDs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  replayRisk: "source-anchored-partial" | "cassette-only" | "helix-only" | "borrowed-opencode"
  knownLossiness: string[]
}

export interface ProviderRawFrameReplayGateSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:provider-raw-frame-replay-gate"
  fixtureID: "provider:raw-frame-replay-gate"
  products: ProviderRawFrameReplayGateProduct[]
  comparisonDimensions: ProviderRawFrameReplayGateDimension[]
  cases: ProviderRawFrameReplayGateCase[]
  fingerprint: string
}

export interface ProviderRawFrameReplayGateIssue {
  id: string
  product: ProviderRawFrameReplayGateProduct
  dimension: ProviderRawFrameReplayGateDimension
  message: string
}

export interface ProviderRawFrameReplayGateVerification {
  ok: boolean
  issues: ProviderRawFrameReplayGateIssue[]
}

export type ProviderRawFrameExactDiffBlockerProduct = ProviderRawFrameReplayGateProduct
export type ProviderRawFrameExactDiffBlockerDimension = ProviderRawFrameReplayGateDimension

export interface ProviderRawFrameExactDiffBlockerCase {
  product: ProviderRawFrameExactDiffBlockerProduct
  upstreamRef: string
  evidenceRef: "conformance:provider-raw-frame-exact-diff-blocker-gate"
  fixtureID: string
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  requestShape: string[]
  registrySelection: string[]
  rawFrameOrder: string[]
  usageAccounting: string[]
  retryErrorCancel: string[]
  rawPayloadRoundTrip: string[]
  sourceAnchors: string[]
  providerAtomIDs: string[]
  providerPortIDs: string[]
  nativeEvidenceRefs: string[]
  exactDiffRisk: "semantic-fixture-needs-exact-diff" | "cassette-only" | "helix-only" | "borrowed-opencode"
  knownLossiness: string[]
}

export interface ProviderRawFrameExactDiffBlockerSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:provider-raw-frame-exact-diff-blocker-gate"
  fixtureID: "provider:raw-frame-exact-diff-blocker-gate"
  exactDiffStatus: "exact-diff-partial"
  products: ProviderRawFrameExactDiffBlockerProduct[]
  comparisonDimensions: ProviderRawFrameExactDiffBlockerDimension[]
  cases: ProviderRawFrameExactDiffBlockerCase[]
  fingerprint: string
}

export interface ProviderRawFrameExactDiffBlockerIssue {
  id: string
  product: ProviderRawFrameExactDiffBlockerProduct
  dimension: ProviderRawFrameExactDiffBlockerDimension
  message: string
}

export interface ProviderRawFrameExactDiffBlockerVerification {
  ok: boolean
  issues: ProviderRawFrameExactDiffBlockerIssue[]
}

export type ProviderRawFramePinnedReplayProduct = ProviderRawFrameReplayGateProduct
export type ProviderRawFramePinnedReplayDimension = ProviderRawFrameReplayGateDimension

export type ProviderRawFramePinnedReplayFrameType =
  | "request"
  | "text-delta"
  | "reasoning-delta"
  | "tool-call-delta"
  | "usage"
  | "finish"
  | "error"
  | "retry"
  | "cancel"

export interface ProviderRawFramePinnedReplayUsage {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number | null
}

export interface ProviderRawFramePinnedReplayFrame {
  frameID: string
  providerID: string
  modelID: string
  requestID: string
  registryProviderID: string
  frameType: ProviderRawFramePinnedReplayFrameType
  rawPayload: string
  textDelta: string | null
  toolCallID: string | null
  toolName: string | null
  toolArguments: string | null
  finishReason: string | null
  usage: ProviderRawFramePinnedReplayUsage | null
  retryAttempt: number | null
  retryDelayMs: number | null
  cancelObserved: boolean
  sequence: number
}

export interface ProviderRawFramePinnedReplayCase {
  product: ProviderRawFramePinnedReplayProduct
  upstreamRef: string
  evidenceRef: "conformance:provider-raw-frame-pinned-replay-gate"
  fixtureID: string
  exactDiffStatus: "exact-diff-partial"
  coverageStatus: "partial"
  nativeParityClaim: false
  upstreamFrames: ProviderRawFramePinnedReplayFrame[]
  productParsedFrames: ProviderRawFramePinnedReplayFrame[]
  assembledEvents: ProviderRawFramePinnedReplayFrame[]
  sourceAnchors: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  exactDiffRisk: "pinned-replay-needs-live-provider" | "cassette-only" | "helix-only" | "borrowed-opencode"
  knownLossiness: string[]
}

export interface ProviderRawFramePinnedReplaySnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:provider-raw-frame-pinned-replay-gate"
  fixtureID: "provider:raw-frame-pinned-replay-gate"
  exactDiffStatus: "exact-diff-partial"
  products: ProviderRawFramePinnedReplayProduct[]
  comparisonDimensions: ProviderRawFramePinnedReplayDimension[]
  cases: ProviderRawFramePinnedReplayCase[]
  fingerprint: string
}

export interface ProviderRawFramePinnedReplayIssue {
  id: string
  product: ProviderRawFramePinnedReplayProduct
  dimension: ProviderRawFramePinnedReplayDimension
  message: string
}

export interface ProviderRawFramePinnedReplayVerification {
  ok: boolean
  issues: ProviderRawFramePinnedReplayIssue[]
}

const OPENCODE_PROVIDER_RAW_FRAME_NATIVE_EVIDENCE_REFS = [
  "conformance:opencode-provider-source-matrix",
  "conformance:opencode-provider-raw-frame-boundary-matrix",
  "opencode-plugin-provider-registry:native-exact-fixture",
  "plugin-provider-registry-native-exact:opencode",
  "opencode-provider-model-plugin:native-exact-fixture",
  "provider-model-plugin-native-exact:opencode",
  "opencode-provider-request-options:native-exact-fixture",
  "provider-request-options-native-exact:opencode",
  "opencode-provider-auth-descriptor:native-exact-fixture",
  "provider-auth-descriptor-native-exact:opencode",
  "opencode-provider-parser-observer:native-exact-fixture",
  "provider-parser-observer-native-exact:opencode",
  "opencode-provider-event-observer:native-exact-fixture",
  "provider-event-observer-native-exact:opencode",
  "opencode-provider-usage:native-exact-fixture",
  "provider-usage-native-exact:opencode",
  "opencode-provider-transport-instrumentation:native-exact-fixture",
  "provider-transport-instrumentation-native-exact:opencode",
  "opencode-provider-plugin-descriptor:native-exact-fixture",
  "provider-plugin-descriptor-native-exact:opencode",
  "opencode-turn-retry-policy:native-exact-fixture",
  "turn-retry-policy-native-exact:opencode",
  "opencode-provider-builtin-plugins:native-exact-fixture",
  "provider-builtin-plugins-native-exact:opencode",
  "opencode-plugin-hot-reload-cleanup:native-exact-fixture",
  "plugin-hot-reload-cleanup-native-exact:opencode",
  "opencode-plugin-event-mapper:native-exact-fixture",
  "plugin-event-mapper-native-exact:opencode",
  "opencode-hook-lifecycle:native-exact-fixture",
  "opencode-provider-stream-projector:native-exact-fixture",
  "provider-stream-projector-native-exact:opencode",
]

const OPENCODE_PROVIDER_RAW_FRAME_NATIVE_FIXTURE_IDS = [
  "opencode-provider:source-matrix",
  "opencode-provider:raw-frame-boundary-matrix",
  "opencode-plugin-provider-registry:native-exact-fixture",
  "opencode-provider-model-plugin:native-exact-fixture",
  "opencode-provider-request-options:native-exact-fixture",
  "opencode-provider-auth-descriptor:native-exact-fixture",
  "opencode-provider-parser-observer:native-exact-fixture",
  "opencode-provider-event-observer:native-exact-fixture",
  "opencode-provider-usage:native-exact-fixture",
  "opencode-provider-transport-instrumentation:native-exact-fixture",
  "opencode-provider-plugin-descriptor:native-exact-fixture",
  "opencode-turn-retry-policy:native-exact-fixture",
  "opencode-provider-builtin-plugins:native-exact-fixture",
  "opencode-plugin-hot-reload-cleanup:native-exact-fixture",
  "opencode-plugin-event-mapper:native-exact-fixture",
  "opencode-hook-lifecycle:native-exact-fixture",
  "opencode-provider-stream-projector:native-exact-fixture",
]

export function buildProviderRawFrameReplayGateSnapshot(): ProviderRawFrameReplayGateSnapshot {
  const cases = [
    buildOpenCodeProviderRawFrameReplayGateCase(buildOpenCodeProviderSourceMatrixSnapshot(), buildOpenCodeProviderRawFrameBoundaryMatrixSnapshot()),
    buildProductProviderRawFrameReplayGateCase("pi-mono", buildPiProviderSourceMatrixSnapshot()),
    buildProductProviderRawFrameReplayGateCase("nanobot", buildNanobotProviderSourceMatrixSnapshot()),
    buildProductProviderRawFrameReplayGateCase("hermes-agent", buildHermesProviderSourceMatrixSnapshot()),
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:provider-raw-frame-replay-gate" as const,
    fixtureID: "provider:raw-frame-replay-gate" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: [
      "request-shape",
      "registry-selection",
      "raw-frame-order",
      "usage-accounting",
      "retry-error-cancel",
      "raw-payload-roundtrip",
    ] as ProviderRawFrameReplayGateDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyProviderRawFrameReplayGateSnapshot(snapshot: ProviderRawFrameReplayGateSnapshot): ProviderRawFrameReplayGateVerification {
  const issues: ProviderRawFrameReplayGateIssue[] = []
  const products: ProviderRawFrameReplayGateProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]
  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "provider-raw-frame.missing-product",
        product,
        dimension: "request-shape",
        message: `Missing provider raw-frame replay gate case for ${product}.`,
      })
      continue
    }
    if (!providerGateContains(item.requestShape, /request|options|params|message|tool|headers|build|convert|shape|RequestInput/i)) {
      issues.push({
        id: "provider-raw-frame.request-shape",
        product,
        dimension: "request-shape",
        message: `${product} provider raw-frame gate no longer records request shape anchors.`,
      })
    }
    if (!providerGateContains(item.registrySelection, /registry|provider|model|plugin|extension|factory|descriptor|register|selection|source-anchored/i)) {
      issues.push({
        id: "provider-raw-frame.registry-selection",
        product,
        dimension: "registry-selection",
        message: `${product} provider raw-frame gate no longer records registry selection anchors.`,
      })
    }
    if (!providerGateContains(item.rawFrameOrder, /raw[- ]frame|stream|sse|frame|chunk|delta|normalize|parse|response|tool-call|order/i)) {
      issues.push({
        id: "provider-raw-frame.raw-frame-order",
        product,
        dimension: "raw-frame-order",
        message: `${product} provider raw-frame gate no longer records raw frame order anchors.`,
      })
    }
    if (!providerGateContains(item.usageAccounting, /usage|finish|cost|token|billing|cache|map_finish_reason|finish-reason/i)) {
      issues.push({
        id: "provider-raw-frame.usage-accounting",
        product,
        dimension: "usage-accounting",
        message: `${product} provider raw-frame gate no longer records usage or finish accounting anchors.`,
      })
    }
    if (!providerGateContains(item.retryErrorCancel, /retry|cancel|abort|transport|wall-clock|delay|error|cleanup|race/i)) {
      issues.push({
        id: "provider-raw-frame.retry-error-cancel",
        product,
        dimension: "retry-error-cancel",
        message: `${product} provider raw-frame gate no longer records retry/error/cancel anchors.`,
      })
    }
    if (!providerGateContains(item.rawPayloadRoundTrip, /payload|roundtrip|raw-payload|text|tool-call|finish|usage|function-call|raw/i)) {
      issues.push({
        id: "provider-raw-frame.raw-payload-roundtrip",
        product,
        dimension: "raw-payload-roundtrip",
        message: `${product} provider raw-frame gate no longer records raw payload round-trip anchors.`,
      })
    }
    if (!providerGateContains(item.knownLossiness, /not-replayed|not-exact|not-spawned|partial|cassette|race/i)) {
      issues.push({
        id: "provider-raw-frame.runtime-lossiness",
        product,
        dimension: "raw-frame-order",
        message: `${product} provider raw-frame gate no longer records partial replay lossiness.`,
      })
    }
    if (item.replayRisk !== "source-anchored-partial") {
      issues.push({
        id: "provider-raw-frame.cassette-or-helix-only",
        product,
        dimension: "raw-frame-order",
        message: `${product} provider raw-frame gate is not source anchored and cannot be promoted toward native parity.`,
      })
    }
    if (
      product === "opencode" &&
      (!providerIncludesAll(item.nativeEvidenceRefs, OPENCODE_PROVIDER_RAW_FRAME_NATIVE_EVIDENCE_REFS) ||
        !providerIncludesAll(item.fixtureIDs, OPENCODE_PROVIDER_RAW_FRAME_NATIVE_FIXTURE_IDS))
    ) {
      issues.push({
        id: "provider-raw-frame.native-exact-evidence",
        product,
        dimension: "raw-frame-order",
        message: "OpenCode provider raw-frame gate lost native-exact provider evidence refs or fixture IDs.",
      })
    }
    if (product !== "opencode" && item.fixtureID === "opencode-provider:source-matrix") {
      issues.push({
        id: "provider-raw-frame.borrowed-source-matrix",
        product,
        dimension: "registry-selection",
        message: `${product} provider raw-frame gate is borrowing the OpenCode source matrix.`,
      })
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

export function buildProviderRawFrameExactDiffBlockerSnapshot(): ProviderRawFrameExactDiffBlockerSnapshot {
  const replayGate = buildProviderRawFrameReplayGateSnapshot()
  const cases = replayGate.cases.map(buildProviderRawFrameExactDiffBlockerCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:provider-raw-frame-exact-diff-blocker-gate" as const,
    fixtureID: "provider:raw-frame-exact-diff-blocker-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: replayGate.comparisonDimensions as ProviderRawFrameExactDiffBlockerDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyProviderRawFrameExactDiffBlockerSnapshot(
  snapshot: ProviderRawFrameExactDiffBlockerSnapshot,
): ProviderRawFrameExactDiffBlockerVerification {
  const issues: ProviderRawFrameExactDiffBlockerIssue[] = []
  const products: ProviderRawFrameExactDiffBlockerProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]

  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "provider-raw-frame-exact-diff.missing-product",
        product,
        dimension: "request-shape",
        message: `Missing provider raw-frame exact-diff blocker case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "provider-raw-frame-exact-diff.native-claim",
        product,
        dimension: "request-shape",
        message: `${product} provider raw-frame blocker must remain exact-diff-partial and cannot claim native parity.`,
      })
    }
    if (!providerGateContains(item.requestShape, /request|options|params|message|tool|headers|build|convert|shape|RequestInput|exact-diff-not-proven/i)) {
      issues.push({
        id: "provider-raw-frame-exact-diff.request-shape",
        product,
        dimension: "request-shape",
        message: `${product} provider raw-frame blocker no longer records request shape exact-diff anchors.`,
      })
    }
    if (!providerGateContains(item.registrySelection, /registry|provider|model|plugin|extension|factory|descriptor|register|selection|source-anchored|exact-diff-not-proven/i)) {
      issues.push({
        id: "provider-raw-frame-exact-diff.registry-selection",
        product,
        dimension: "registry-selection",
        message: `${product} provider raw-frame blocker no longer records registry selection exact-diff anchors.`,
      })
    }
    if (!providerGateContains(item.rawFrameOrder, /raw[- ]frame|stream|sse|frame|chunk|delta|normalize|parse|response|tool-call|order|exact-diff-not-proven/i)) {
      issues.push({
        id: "provider-raw-frame-exact-diff.raw-frame-order",
        product,
        dimension: "raw-frame-order",
        message: `${product} provider raw-frame blocker no longer records raw frame order exact-diff anchors.`,
      })
    }
    if (!providerGateContains(item.usageAccounting, /usage|finish|cost|token|billing|cache|map_finish_reason|finish-reason|exact-diff-not-proven/i)) {
      issues.push({
        id: "provider-raw-frame-exact-diff.usage-accounting",
        product,
        dimension: "usage-accounting",
        message: `${product} provider raw-frame blocker no longer records usage accounting exact-diff anchors.`,
      })
    }
    if (!providerGateContains(item.retryErrorCancel, /retry|cancel|abort|transport|wall-clock|delay|error|cleanup|race|exact-diff-not-proven/i)) {
      issues.push({
        id: "provider-raw-frame-exact-diff.retry-error-cancel",
        product,
        dimension: "retry-error-cancel",
        message: `${product} provider raw-frame blocker no longer records retry/error/cancel exact-diff anchors.`,
      })
    }
    if (!providerGateContains(item.rawPayloadRoundTrip, /payload|roundtrip|raw-payload|text|tool-call|finish|usage|function-call|raw|exact-diff-not-proven/i)) {
      issues.push({
        id: "provider-raw-frame-exact-diff.raw-payload-roundtrip",
        product,
        dimension: "raw-payload-roundtrip",
        message: `${product} provider raw-frame blocker no longer records raw payload round-trip exact-diff anchors.`,
      })
    }
    if (item.exactDiffRisk !== "semantic-fixture-needs-exact-diff" || item.sourceAnchors.length === 0 || item.knownLossiness.length === 0) {
      issues.push({
        id: "provider-raw-frame-exact-diff.cassette-or-helix-only",
        product,
        dimension: "raw-frame-order",
        message: `${product} provider raw-frame blocker is not anchored to product-specific partial replay evidence.`,
      })
    }
    if (
      product === "opencode" &&
      (!providerIncludesAll(item.nativeEvidenceRefs, OPENCODE_PROVIDER_RAW_FRAME_NATIVE_EVIDENCE_REFS) ||
        !providerIncludesAll(item.nativeEvidenceRefs, OPENCODE_PROVIDER_RAW_FRAME_NATIVE_FIXTURE_IDS))
    ) {
      issues.push({
        id: "provider-raw-frame-exact-diff.native-exact-evidence",
        product,
        dimension: "raw-frame-order",
        message: "OpenCode provider raw-frame exact-diff blocker lost native-exact provider evidence refs or fixture IDs.",
      })
    }
    if (product !== "opencode" && (item.fixtureID === "opencode-provider:source-matrix" || item.exactDiffRisk === "borrowed-opencode")) {
      issues.push({
        id: "provider-raw-frame-exact-diff.borrowed-source-matrix",
        product,
        dimension: "registry-selection",
        message: `${product} provider raw-frame blocker is borrowing the OpenCode source matrix.`,
      })
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  }
}

export function buildProviderRawFramePinnedReplaySnapshot(): ProviderRawFramePinnedReplaySnapshot {
  const replayGate = buildProviderRawFrameReplayGateSnapshot()
  const cases = replayGate.cases.map(buildProviderRawFramePinnedReplayCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:provider-raw-frame-pinned-replay-gate" as const,
    fixtureID: "provider:raw-frame-pinned-replay-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: replayGate.comparisonDimensions as ProviderRawFramePinnedReplayDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyProviderRawFramePinnedReplaySnapshot(
  snapshot: ProviderRawFramePinnedReplaySnapshot,
): ProviderRawFramePinnedReplayVerification {
  const issues: ProviderRawFramePinnedReplayIssue[] = []
  const products: ProviderRawFramePinnedReplayProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]

  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "provider-raw-frame-pinned-replay.missing-product",
        product,
        dimension: "raw-frame-order",
        message: `Missing provider raw-frame pinned replay case for ${product}.`,
      })
      continue
    }
    if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "provider-raw-frame-pinned-replay.native-claim",
        product,
        dimension: "request-shape",
        message: `${product} provider raw-frame pinned replay must remain partial and cannot claim native parity.`,
      })
    }
    if (item.upstreamFrames.length === 0 || item.upstreamFrames.length !== item.productParsedFrames.length || item.upstreamFrames.length !== item.assembledEvents.length) {
      issues.push({
        id: "provider-raw-frame-pinned-replay.raw-frame-order",
        product,
        dimension: "raw-frame-order",
        message: `${product} provider raw-frame pinned replay must compare non-empty upstream/product/assembled streams of equal length.`,
      })
      continue
    }
    if (!item.upstreamFrames.some((frame) => frame.frameType === "request") || item.upstreamFrames.some((frame) => !frame.requestID || !frame.providerID || !frame.modelID)) {
      issues.push({
        id: "provider-raw-frame-pinned-replay.request-shape",
        product,
        dimension: "request-shape",
        message: `${product} provider raw-frame pinned replay lost request provider/model/request fields.`,
      })
    }
    if (
      item.upstreamFrames.some((frame) => !frame.registryProviderID) ||
      !providerPinnedRegistryMatches(item.upstreamFrames, item.productParsedFrames) ||
      !providerPinnedRegistryMatches(item.upstreamFrames, item.assembledEvents)
    ) {
      issues.push({
        id: "provider-raw-frame-pinned-replay.registry-selection",
        product,
        dimension: "registry-selection",
        message: `${product} provider raw-frame pinned replay registry/provider selection drifted.`,
      })
    }
    if (!providerPinnedFrameOrderMatches(item.upstreamFrames, item.productParsedFrames) || !providerPinnedFrameOrderMatches(item.upstreamFrames, item.assembledEvents)) {
      issues.push({
        id: "provider-raw-frame-pinned-replay.raw-frame-order",
        product,
        dimension: "raw-frame-order",
        message: `${product} provider raw-frame pinned replay frame order drifted.`,
      })
    }
    if (!providerPinnedUsageMatches(item.upstreamFrames, item.productParsedFrames) || !providerPinnedUsageMatches(item.upstreamFrames, item.assembledEvents)) {
      issues.push({
        id: "provider-raw-frame-pinned-replay.usage-accounting",
        product,
        dimension: "usage-accounting",
        message: `${product} provider raw-frame pinned replay usage or finish accounting drifted.`,
      })
    }
    if (!item.upstreamFrames.some((frame) => providerPinnedRetryCancelFrameTypes.includes(frame.frameType)) || !providerPinnedRetryCancelMatches(item.upstreamFrames, item.productParsedFrames) || !providerPinnedRetryCancelMatches(item.upstreamFrames, item.assembledEvents)) {
      issues.push({
        id: "provider-raw-frame-pinned-replay.retry-error-cancel",
        product,
        dimension: "retry-error-cancel",
        message: `${product} provider raw-frame pinned replay retry/error/cancel boundary drifted.`,
      })
    }
    if (!providerPinnedPayloadMatches(item.upstreamFrames, item.productParsedFrames) || !providerPinnedPayloadMatches(item.upstreamFrames, item.assembledEvents)) {
      issues.push({
        id: "provider-raw-frame-pinned-replay.raw-payload-roundtrip",
        product,
        dimension: "raw-payload-roundtrip",
        message: `${product} provider raw-frame pinned replay raw payload round-trip drifted.`,
      })
    }
    if (item.exactDiffRisk !== "pinned-replay-needs-live-provider" || item.sourceAnchors.length === 0 || item.fixtureIDs.length === 0 || item.knownLossiness.length === 0) {
      issues.push({
        id: "provider-raw-frame-pinned-replay.cassette-or-helix-only",
        product,
        dimension: "raw-frame-order",
        message: `${product} provider raw-frame pinned replay is not anchored to product-specific provider evidence.`,
      })
    }
    if (
      product === "opencode" &&
      (!providerIncludesAll(item.nativeEvidenceRefs, OPENCODE_PROVIDER_RAW_FRAME_NATIVE_EVIDENCE_REFS) ||
        !providerIncludesAll(item.fixtureIDs, OPENCODE_PROVIDER_RAW_FRAME_NATIVE_FIXTURE_IDS))
    ) {
      issues.push({
        id: "provider-raw-frame-pinned-replay.native-exact-evidence",
        product,
        dimension: "raw-frame-order",
        message: "OpenCode provider raw-frame pinned replay lost native-exact provider evidence refs or fixture IDs.",
      })
    }
    if (product !== "opencode" && (item.fixtureID === "opencode-provider:source-matrix" || item.exactDiffRisk === "borrowed-opencode")) {
      issues.push({
        id: "provider-raw-frame-pinned-replay.borrowed-source-matrix",
        product,
        dimension: "registry-selection",
        message: `${product} provider raw-frame pinned replay is borrowing the OpenCode source matrix.`,
      })
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildProviderRawFramePinnedReplayCase(
  replayCase: ProviderRawFrameReplayGateCase,
): ProviderRawFramePinnedReplayCase {
  const frames = providerRawFramePinnedReplayFrames(replayCase.product)
  return {
    product: replayCase.product,
    upstreamRef: replayCase.upstreamRef,
    evidenceRef: "conformance:provider-raw-frame-pinned-replay-gate",
    fixtureID: replayCase.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    upstreamFrames: frames,
    productParsedFrames: frames.map(providerClonePinnedReplayFrame),
    assembledEvents: frames.map(providerClonePinnedReplayFrame),
    sourceAnchors: replayCase.sourceAnchors,
    fixtureIDs: uniqueStrings(["provider:raw-frame-replay-gate", ...replayCase.fixtureIDs, ...replayCase.sourceAnchors, replayCase.fixtureID]),
    nativeEvidenceRefs: uniqueStrings([
      replayCase.fixtureID,
      ...replayCase.fixtureIDs,
      ...replayCase.nativeEvidenceRefs,
      ...replayCase.sourceAnchors,
    ]),
    exactDiffRisk: "pinned-replay-needs-live-provider",
    knownLossiness: uniqueStrings([
      ...replayCase.knownLossiness,
      "provider-raw-frame-pinned-replay-live-runtime-not-proven",
      "provider-raw-frame-pinned-replay-wall-clock-timing-not-proven",
      "provider-raw-frame-pinned-retry-cancel-race-not-proven",
      "provider-raw-frame-pinned-private-payload-fields-not-proven",
    ]),
  }
}

function providerRawFramePinnedReplayFrames(product: ProviderRawFramePinnedReplayProduct): ProviderRawFramePinnedReplayFrame[] {
  if (product === "opencode") {
    return [
      providerRawFramePinnedReplayFrame(product, 1, "request", "openai", "openai/gpt-4.1", "opencode:builtin:openai", "{\"messages\":1,\"model\":\"gpt-4.1\",\"provider\":\"openai\",\"tools\":1}"),
      providerRawFramePinnedReplayFrame(product, 2, "text-delta", "openai", "openai/gpt-4.1", "opencode:builtin:openai", "data:{\"type\":\"response.output_text.delta\",\"delta\":\"hello\"}", { textDelta: "hello" }),
      providerRawFramePinnedReplayFrame(product, 3, "tool-call-delta", "openai", "openai/gpt-4.1", "opencode:builtin:openai", "data:{\"type\":\"tool_call.delta\",\"id\":\"call_oc_1\",\"name\":\"bash\",\"arguments\":\"{\\\"cmd\\\":\\\"pwd\\\"}\"}", { toolCallID: "call_oc_1", toolName: "bash", toolArguments: "{\"cmd\":\"pwd\"}" }),
      providerRawFramePinnedReplayFrame(product, 4, "usage", "openai", "openai/gpt-4.1", "opencode:builtin:openai", "data:{\"finish_reason\":\"tool_calls\",\"usage\":{\"input_tokens\":12,\"output_tokens\":7}}", { finishReason: "tool_calls", usage: { inputTokens: 12, outputTokens: 7, cacheReadTokens: null } }),
      providerRawFramePinnedReplayFrame(product, 5, "retry", "openai", "openai/gpt-4.1", "opencode:builtin:openai", "retry:{\"attempt\":1,\"delay_ms\":1000,\"reason\":\"rate_limit\"}", { retryAttempt: 1, retryDelayMs: 1000 }),
    ]
  }
  if (product === "pi-mono") {
    return [
      providerRawFramePinnedReplayFrame(product, 1, "request", "anthropic", "claude-3-5-sonnet", "pi:extension:anthropic", "{\"max_tokens\":512,\"model\":\"claude-3-5-sonnet\",\"stream\":true,\"tools\":1}"),
      providerRawFramePinnedReplayFrame(product, 2, "text-delta", "anthropic", "claude-3-5-sonnet", "pi:extension:anthropic", "event:content_block_delta data:{\"delta\":{\"text\":\"pi\"}}", { textDelta: "pi" }),
      providerRawFramePinnedReplayFrame(product, 3, "tool-call-delta", "anthropic", "claude-3-5-sonnet", "pi:extension:anthropic", "event:input_json_delta data:{\"partial_json\":\"{\\\"path\\\":\\\"README.md\\\"}\",\"id\":\"tool_pi_1\"}", { toolCallID: "tool_pi_1", toolName: "read_file", toolArguments: "{\"path\":\"README.md\"}" }),
      providerRawFramePinnedReplayFrame(product, 4, "usage", "anthropic", "claude-3-5-sonnet", "pi:extension:anthropic", "event:message_delta data:{\"stop_reason\":\"tool_use\",\"usage\":{\"input_tokens\":19,\"output_tokens\":11,\"cache_read_input_tokens\":3}}", { finishReason: "tool_use", usage: { inputTokens: 19, outputTokens: 11, cacheReadTokens: 3 } }),
      providerRawFramePinnedReplayFrame(product, 5, "cancel", "anthropic", "claude-3-5-sonnet", "pi:extension:anthropic", "cancel:{\"abort_signal_observed\":true}", { cancelObserved: true }),
    ]
  }
  if (product === "nanobot") {
    return [
      providerRawFramePinnedReplayFrame(product, 1, "request", "openai-compatible", "gpt-4o-mini", "nanobot:registry:openai-compatible", "{\"messages\":2,\"model\":\"gpt-4o-mini\",\"stream\":true}"),
      providerRawFramePinnedReplayFrame(product, 2, "text-delta", "openai-compatible", "gpt-4o-mini", "nanobot:registry:openai-compatible", "data:{\"choices\":[{\"delta\":{\"content\":\"nano\"}}]}", { textDelta: "nano" }),
      providerRawFramePinnedReplayFrame(product, 3, "usage", "openai-compatible", "gpt-4o-mini", "nanobot:registry:openai-compatible", "data:{\"choices\":[{\"finish_reason\":\"stop\"}],\"usage\":{\"prompt_tokens\":8,\"completion_tokens\":5}}", { finishReason: "stop", usage: { inputTokens: 8, outputTokens: 5, cacheReadTokens: null } }),
      providerRawFramePinnedReplayFrame(product, 4, "error", "openai-compatible", "gpt-4o-mini", "nanobot:registry:openai-compatible", "error:{\"code\":\"rate_limit\",\"retryable\":true}", { retryAttempt: 1, retryDelayMs: 750 }),
    ]
  }
  return [
    providerRawFramePinnedReplayFrame(product, 1, "request", "codex", "codex-mini", "hermes:transport:codex", "{\"input\":1,\"model\":\"codex-mini\",\"stream\":true,\"tools\":1}"),
    providerRawFramePinnedReplayFrame(product, 2, "reasoning-delta", "codex", "codex-mini", "hermes:transport:codex", "event:response.reasoning_text.delta data:{\"delta\":\"think\"}", { textDelta: "think" }),
    providerRawFramePinnedReplayFrame(product, 3, "text-delta", "codex", "codex-mini", "hermes:transport:codex", "event:response.output_text.delta data:{\"delta\":\"hermes\"}", { textDelta: "hermes" }),
    providerRawFramePinnedReplayFrame(product, 4, "usage", "codex", "codex-mini", "hermes:transport:codex", "event:response.completed data:{\"usage\":{\"input_tokens\":15,\"output_tokens\":9},\"finish_reason\":\"stop\"}", { finishReason: "stop", usage: { inputTokens: 15, outputTokens: 9, cacheReadTokens: null } }),
    providerRawFramePinnedReplayFrame(product, 5, "cancel", "codex", "codex-mini", "hermes:transport:codex", "cancel:{\"abort_signal_observed\":true,\"cleanup\":\"stream\"}", { cancelObserved: true }),
  ]
}

function providerRawFramePinnedReplayFrame(
  product: ProviderRawFramePinnedReplayProduct,
  sequence: number,
  frameType: ProviderRawFramePinnedReplayFrameType,
  providerID: string,
  modelID: string,
  registryProviderID: string,
  rawPayload: string,
  overrides: Partial<Omit<ProviderRawFramePinnedReplayFrame, "frameID" | "providerID" | "modelID" | "requestID" | "registryProviderID" | "frameType" | "rawPayload" | "sequence">> = {},
): ProviderRawFramePinnedReplayFrame {
  return {
    frameID: `${product}-provider-frame-${sequence}`,
    providerID,
    modelID,
    requestID: `${product}-provider-request-1`,
    registryProviderID,
    frameType,
    rawPayload,
    textDelta: null,
    toolCallID: null,
    toolName: null,
    toolArguments: null,
    finishReason: null,
    usage: null,
    retryAttempt: null,
    retryDelayMs: null,
    cancelObserved: false,
    sequence,
    ...overrides,
  }
}

function providerClonePinnedReplayFrame(frame: ProviderRawFramePinnedReplayFrame): ProviderRawFramePinnedReplayFrame {
  return {
    ...frame,
    usage: frame.usage === null ? null : { ...frame.usage },
  }
}

function providerPinnedRegistryMatches(
  expected: ProviderRawFramePinnedReplayFrame[],
  actual: ProviderRawFramePinnedReplayFrame[],
): boolean {
  return expected.every((frame, index) => {
    const candidate = actual[index]
    return candidate !== undefined && frame.providerID === candidate.providerID && frame.modelID === candidate.modelID && frame.registryProviderID === candidate.registryProviderID
  })
}

function providerPinnedFrameOrderMatches(
  expected: ProviderRawFramePinnedReplayFrame[],
  actual: ProviderRawFramePinnedReplayFrame[],
): boolean {
  return expected.every((frame, index) => {
    const candidate = actual[index]
    return candidate !== undefined && frame.frameID === candidate.frameID && frame.frameType === candidate.frameType && frame.sequence === candidate.sequence
  })
}

function providerPinnedUsageMatches(
  expected: ProviderRawFramePinnedReplayFrame[],
  actual: ProviderRawFramePinnedReplayFrame[],
): boolean {
  return expected.every((frame, index) => {
    const candidate = actual[index]
    return candidate !== undefined && stableStringify(frame.usage) === stableStringify(candidate.usage) && frame.finishReason === candidate.finishReason
  })
}

const providerPinnedRetryCancelFrameTypes: ProviderRawFramePinnedReplayFrameType[] = ["retry", "cancel", "error"]

function providerPinnedRetryCancelMatches(
  expected: ProviderRawFramePinnedReplayFrame[],
  actual: ProviderRawFramePinnedReplayFrame[],
): boolean {
  return expected.every((frame, index) => {
    const candidate = actual[index]
    return candidate !== undefined && frame.retryAttempt === candidate.retryAttempt && frame.retryDelayMs === candidate.retryDelayMs && frame.cancelObserved === candidate.cancelObserved
  })
}

function providerPinnedPayloadMatches(
  expected: ProviderRawFramePinnedReplayFrame[],
  actual: ProviderRawFramePinnedReplayFrame[],
): boolean {
  return expected.every((frame, index) => {
    const candidate = actual[index]
    return candidate !== undefined && stableStringify(providerPinnedPayloadSignature(frame)) === stableStringify(providerPinnedPayloadSignature(candidate))
  })
}

function providerPinnedPayloadSignature(frame: ProviderRawFramePinnedReplayFrame): Record<string, unknown> {
  return {
    rawPayload: frame.rawPayload,
    textDelta: frame.textDelta,
    toolCallID: frame.toolCallID,
    toolName: frame.toolName,
    toolArguments: frame.toolArguments,
    finishReason: frame.finishReason,
    usage: frame.usage,
  }
}

function buildProviderRawFrameExactDiffBlockerCase(
  replayCase: ProviderRawFrameReplayGateCase,
): ProviderRawFrameExactDiffBlockerCase {
  return {
    product: replayCase.product,
    upstreamRef: replayCase.upstreamRef,
    evidenceRef: "conformance:provider-raw-frame-exact-diff-blocker-gate",
    fixtureID: replayCase.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    requestShape: uniqueStrings([
      ...replayCase.requestShape,
      "provider-request-shape-native-body:exact-diff-not-proven",
    ]),
    registrySelection: uniqueStrings([
      ...replayCase.registrySelection,
      "provider-registry-selection-native-runtime:exact-diff-not-proven",
    ]),
    rawFrameOrder: uniqueStrings([
      ...replayCase.rawFrameOrder,
      "provider-raw-frame-order-native-timing:exact-diff-not-proven",
    ]),
    usageAccounting: uniqueStrings([
      ...replayCase.usageAccounting,
      "provider-usage-accounting-native-detail:exact-diff-not-proven",
    ]),
    retryErrorCancel: uniqueStrings([
      ...replayCase.retryErrorCancel,
      "provider-retry-error-cancel-native-race:exact-diff-not-proven",
    ]),
    rawPayloadRoundTrip: uniqueStrings([
      ...replayCase.rawPayloadRoundTrip,
      "provider-raw-payload-roundtrip-native-fields:exact-diff-not-proven",
    ]),
    sourceAnchors: replayCase.sourceAnchors,
    providerAtomIDs: replayCase.providerAtomIDs,
    providerPortIDs: replayCase.providerPortIDs,
    nativeEvidenceRefs: uniqueStrings([
      replayCase.fixtureID,
      ...replayCase.fixtureIDs,
      ...replayCase.nativeEvidenceRefs,
      ...replayCase.sourceAnchors,
    ]),
    exactDiffRisk: "semantic-fixture-needs-exact-diff",
    knownLossiness: uniqueStrings([
      ...replayCase.knownLossiness,
      "provider-request-shape-native-body-not-proven",
      "provider-registry-selection-native-runtime-not-proven",
      "provider-raw-frame-order-native-timing-not-proven",
      "provider-usage-accounting-native-detail-not-proven",
      "provider-retry-error-cancel-native-race-not-proven",
      "provider-raw-payload-roundtrip-native-fields-not-proven",
    ]),
  }
}

function buildOpenCodeProviderRawFrameReplayGateCase(
  sourceMatrix: OpenCodeProviderSourceMatrixSnapshot,
  rawFrameBoundary: OpenCodeProviderRawFrameBoundaryMatrixSnapshot,
): ProviderRawFrameReplayGateCase {
  return {
    product: "opencode",
    upstreamRef: sourceMatrix.upstreamRef,
    evidenceRef: "conformance:provider-raw-frame-replay-gate",
    fixtureID: sourceMatrix.fixtureID,
    requestShape: uniqueStrings([
      ...providerBranchMarkers(sourceMatrix.branchAnchors, ["request-options", "provider-plugin-descriptor"]),
      ...providerBoundaryMarkers(rawFrameBoundary.boundaryAnchors, ["request-hook-to-provider-options", "provider-request-hook-runtime"]),
    ]),
    registrySelection: uniqueStrings([
      ...providerBranchMarkers(sourceMatrix.branchAnchors, ["provider-plugin-registry", "model-plugin", "provider-plugin-descriptor", "live-provider-plugin-runtime"]),
      ...providerBoundaryMarkers(rawFrameBoundary.boundaryAnchors, ["builtin-provider-descriptor-registration", "plugin-provider-descriptor-registration", "live-provider-plugin-runtime"]),
    ]),
    rawFrameOrder: uniqueStrings([
      ...providerBranchMarkers(sourceMatrix.branchAnchors, ["stream-parser", "event-normalizer"]),
      ...providerBoundaryMarkers(rawFrameBoundary.boundaryAnchors, ["raw-sse-frame-parser-boundary", "normalized-event-projection-boundary", "custom-provider-protocol-runtime"]),
    ]),
    usageAccounting: uniqueStrings([
      ...providerBranchMarkers(sourceMatrix.branchAnchors, ["usage-renderer", "event-normalizer"]),
      ...providerBoundaryMarkers(rawFrameBoundary.boundaryAnchors, ["usage-finish-cost-boundary"]),
    ]),
    retryErrorCancel: uniqueStrings([
      ...providerBranchMarkers(sourceMatrix.branchAnchors, ["transport-instrumentation", "exact-provider-retry-cancel"]),
      ...providerBoundaryMarkers(rawFrameBoundary.boundaryAnchors, ["transport-retry-cancel-boundary", "exact-retry-cancel-timing"]),
    ]),
    rawPayloadRoundTrip: uniqueStrings([
      ...providerBranchMarkers(sourceMatrix.branchAnchors, ["request-options", "stream-parser", "event-normalizer", "usage-renderer"]),
      ...providerBoundaryMarkers(rawFrameBoundary.boundaryAnchors, ["raw-sse-frame-parser-boundary", "normalized-event-projection-boundary", "usage-finish-cost-boundary", "custom-provider-protocol-runtime"]),
    ]),
    sourceAnchors: uniqueStrings([
      ...sourceMatrix.sourceRefs.map((sourceRef) => `${sourceRef.id}:${sourceRef.path}`),
      ...rawFrameBoundary.sourceRefs.map((sourceRef) => `${sourceRef.id}:${sourceRef.path}`),
    ]),
    providerAtomIDs: uniqueStrings([...sourceMatrix.coveredProviderAtomIDs, ...rawFrameBoundary.coveredProviderAtomIDs]),
    providerPortIDs: uniqueStrings([...sourceMatrix.coveredProviderPortIDs, ...rawFrameBoundary.coveredProviderPortIDs]),
    nativeEvidenceRefs: uniqueStrings([
      ...sourceMatrix.nativeEvidenceRefs,
      ...rawFrameBoundary.nativeEvidenceRefs,
    ]),
    fixtureIDs: uniqueStrings([
      ...sourceMatrix.fixtureIDs,
      ...rawFrameBoundary.fixtureIDs,
    ]),
    replayRisk: "source-anchored-partial",
    knownLossiness: uniqueStrings([...sourceMatrix.knownGaps, ...rawFrameBoundary.knownGaps]),
  }
}

function buildProductProviderRawFrameReplayGateCase(
  product: Exclude<ProviderRawFrameReplayGateProduct, "opencode">,
  snapshot: PiProviderSourceMatrixSnapshot | NanobotProviderSourceMatrixSnapshot | HermesProviderSourceMatrixSnapshot,
): ProviderRawFrameReplayGateCase {
  return {
    product,
    upstreamRef: snapshot.upstreamRef,
    evidenceRef: "conformance:provider-raw-frame-replay-gate",
    fixtureID: snapshot.fixtureID,
    requestShape: providerBranchMarkers(snapshot.branchAnchors, ["request-options", "anthropic-request", "openai-responses-request", "codex-responses-request", "chat-completions-request"]),
    registrySelection: providerBranchMarkers(snapshot.branchAnchors, ["registry-selection", "model-registry", "provider-plugin-descriptor", "extension-descriptor", "builtin-provider-registration", "model-extension", "live-provider-factory", "live-api-provider-runtime", "live-transport-factory"]),
    rawFrameOrder: providerBranchMarkers(snapshot.branchAnchors, ["stream-parser", "event-normalizer"]),
    usageAccounting: providerBranchMarkers(snapshot.branchAnchors, ["usage-renderer", "event-normalizer"]),
    retryErrorCancel: providerBranchMarkers(snapshot.branchAnchors, ["transport-instrumentation", "exact-provider-retry-cancel"]),
    rawPayloadRoundTrip: providerBranchMarkers(snapshot.branchAnchors, ["request-options", "anthropic-request", "openai-responses-request", "codex-responses-request", "chat-completions-request", "stream-parser", "event-normalizer", "usage-renderer"]),
    sourceAnchors: snapshot.sourceRefs.map((sourceRef) => `${sourceRef.id}:${sourceRef.path}`),
    providerAtomIDs: snapshot.coveredProviderAtomIDs,
    providerPortIDs: snapshot.coveredProviderPortIDs,
    nativeEvidenceRefs: [],
    fixtureIDs: [snapshot.fixtureID],
    replayRisk: "source-anchored-partial",
    knownLossiness: snapshot.knownGaps,
  }
}

function providerBranchMarkers(
  anchors: ReadonlyArray<{ branchID: string; localEvidenceRefs: string[]; localMarkers: string[]; knownGaps: string[] }>,
  branchIDs: string[],
): string[] {
  const selected = anchors.filter((anchor) => branchIDs.includes(anchor.branchID))
  return uniqueStrings(selected.flatMap((anchor) => [anchor.branchID, ...anchor.localEvidenceRefs, ...anchor.localMarkers, ...anchor.knownGaps]))
}

function providerBoundaryMarkers<TAnchor extends {
  boundaryID: string
  localEvidenceRefs: string[]
  localMarkers: string[]
  knownGaps: string[]
  boundary: { retainedFields: string[]; lossyFields: string[] }
}>(
  anchors: TAnchor[],
  boundaryIDs: string[],
): string[] {
  const selected = anchors.filter((anchor) => boundaryIDs.includes(anchor.boundaryID))
  return uniqueStrings(selected.flatMap((anchor) => [
    anchor.boundaryID,
    ...anchor.localEvidenceRefs,
    ...anchor.localMarkers,
    ...anchor.boundary.retainedFields,
    ...anchor.boundary.lossyFields,
    ...anchor.knownGaps,
  ]))
}

function providerGateContains(values: string[], pattern: RegExp): boolean {
  return values.some((value) => pattern.test(value))
}

function providerIncludesAll(values: string[], requiredValues: string[]): boolean {
  return requiredValues.every((requiredValue) => values.includes(requiredValue))
}

function providerNativeExactEvidenceRefs<TAnchor extends { status: string; localEvidenceRefs: string[] }>(anchors: TAnchor[]): string[] {
  return uniqueStrings(anchors
    .filter((anchor) => anchor.status === "native-exact")
    .flatMap((anchor) => anchor.localEvidenceRefs)
    .filter((evidenceRef) => evidenceRef.includes("native-exact")))
}

function providerNativeExactFixtureIDs<TAnchor extends { status: string; localEvidenceRefs: string[] }>(anchors: TAnchor[]): string[] {
  return providerNativeExactEvidenceRefs(anchors).filter((evidenceRef) =>
    evidenceRef.endsWith(":native-exact-fixture") ||
    (!evidenceRef.startsWith("conformance:") && evidenceRef.endsWith("native-exact-diff-fixture"))
  )
}

function openCodeProviderPackageRuntimeNativeSourceFixtureCopy(
  fixture: OpenCodeProviderPackageRuntimeNativeExactSourceFixtureReadback,
): OpenCodeProviderPackageRuntimeNativeExactSourceFixtureReadback {
  return {
    ...fixture,
    knownLossiness: [] as [],
    caseIDs: uniqueStrings(fixture.caseIDs),
  }
}

function openCodeProviderPackageRuntimeNativeRuntimeCoverageCopy(
  coverage: OpenCodeProviderPackageRuntimeNativeRuntimeCoverage,
): OpenCodeProviderPackageRuntimeNativeRuntimeCoverage {
  return {
    runtimeID: coverage.runtimeID,
    fixtureIDs: uniqueStrings(coverage.fixtureIDs),
  }
}

function openCodeProviderPackageRuntimeNativeRuntimeCoverage(
  sourceFixtures: OpenCodeProviderPackageRuntimeNativeExactSourceFixtureReadback[],
): OpenCodeProviderPackageRuntimeNativeRuntimeCoverage[] {
  const fixtureIDs = new Set(sourceFixtures.map((fixture) => fixture.fixtureID))
  return OPENCODE_PROVIDER_PACKAGE_RUNTIME_NATIVE_RUNTIME_COVERAGE
    .map((coverage) => ({
      runtimeID: coverage.runtimeID,
      fixtureIDs: coverage.fixtureIDs.filter((fixtureID) => fixtureIDs.has(fixtureID)),
    }))
    .filter((coverage) => coverage.fixtureIDs.length > 0)
    .map(openCodeProviderPackageRuntimeNativeRuntimeCoverageCopy)
}

function diffOpenCodeProviderPackageRuntimeNativeExact(
  expected: unknown,
  actual: unknown,
): OpenCodeProviderPackageRuntimeNativeExactDiff[] {
  const expectedJSON = stableStringify(expected)
  const actualJSON = stableStringify(actual)
  return expectedJSON === actualJSON
    ? []
    : [{ path: "$", expected, actual }]
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)].sort()
}

function uniqueBy<T>(values: T[], keyForValue: (value: T) => string): T[] {
  const byKey = new Map<string, T>()
  for (const value of values) {
    const key = keyForValue(value)
    if (!byKey.has(key)) byKey.set(key, value)
  }
  return [...byKey.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([, value]) => value)
}

function sequenceKey(value: number): string {
  return value.toString().padStart(8, "0")
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`
}
