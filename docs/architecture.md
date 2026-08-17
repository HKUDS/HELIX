# Helix Architecture

Helix decomposes coding-agent harnesses into two layers:

- Common lego modules: contracts, runtime, session, hooks, tools, providers, prompts, config, UI.
- Product adapters: product-scoped OpenCode, Pi Mono, Nanobot, and Hermes Agent behavior behind shared lego ports.

The next modularity phase tightens this into a port-and-atom model:

- `port`: the general interface that allows free composition.
- `common atom`: a reusable product-neutral implementation or strategy.
- `personality atom`: a product-specific implementation or bridge behind a general port.
- `product shell`: a thin SDK/CLI/TUI/Web/server surface assembled from ports.
- `pack`: a convenience bundle that expands into atoms.
- `recipe`: the binding graph that chooses which atom satisfies each port.

The canonical catalog for this model is `docs/lego-block-catalog.md`. Current planning is intentionally block-first: a behavior should be cataloged as a general port, common atom, personality atom, pack, or product shell before it is moved into a new module. OpenCode, Pi, and Nanobot should then be rebuilt by recipe bindings over those general ports rather than by copying any product's directory shape.

The current implementation now starts from the atom assembly graph:

```text
recipe
  -> common atoms
  -> selected personality atoms
  -> recipe port bindings
  -> thin product shells
  -> conformance gates
```

## Common Contracts

`packages/contracts` defines the shared vocabulary:

- branded IDs for sessions, messages, parts, providers, models, modules
- message and part unions
- event envelopes and hook result shapes
- module manifests
- executable lego block interfaces: `LegoBlockManifest`, `PortContract`, `AtomFactory`, `BindingSpec`, `ResourceGrant`, and `ConformanceRef`
- tool/provider/recipe interfaces
- runtime schemas for lego block manifests, port contracts, bindings, resource grants, conformance refs, session transcripts, messages, parts, tools, provider requests/events, event envelopes, and hook results

No common contract imports OpenCode, Pi, or Nanobot code.

## Boundary Rules

- Common lego packages expose product-neutral contracts or product-keyed conventions only; OpenCode/Pi/Nanobot runtime compatibility code lives in `packages/adapters-*` and `packages/recipes`.
- The OpenCode Effect Layer and Pi plain TypeScript class style stay behind personality adapters. Common packages do not import Effect.
- Session storage is unified by interface and conformance rather than by one storage engine: Pi and Nanobot keep JSONL-backed semantics, while OpenCode keeps event/projection semantics with memory or SQLite storage.
- Hook compatibility is semantic, not just nominal: source ordering, observe/handle separation, mutable payloads, block/cancel/handled early stop, error policy, cleanup, and registries are covered by conformance.
- Provider compatibility keeps provider-specific room through model metadata, request options, custom headers, auth modes, provider-specific body fields, usage/cost mapping, and stream normalization.
- Extension/plugin safety is explicit: local OpenCode plugins, Pi extensions, and Nanobot plugins are treated as trusted local code with system access, while tool execution still flows through common permission gates where policies ask, allow, or deny.
- Public composition is enforced through package exports: atoms, packs, and product shells that recipes compose externally are reachable through package roots or explicit subpaths, and tests are kept off unexported deep imports.
- Publish boundaries are checked before release shape drifts: npm pack dry-runs verify publishable tarballs contain their exported entrypoints, and dependency checks stop common packages or one product personality from pulling unrelated personality packages.

## Runtime

`packages/lego-runtime` contains a module registry and recipe assembler. It validates that modules, atoms, packs, and product shells referenced by a recipe exist and that their declared capabilities satisfy dependencies. Primary recipes now compile from explicit atom inventories with empty package-level `modules` arrays.

## Session

`packages/lego-session` currently has two implementations behind one `SessionService` contract. Both are split across a service semantic layer and a replaceable `SessionStorage` boundary:

- `JsonlTreeFileStorage` + `JsonlTreeSessionService`: Pi-style append-only JSONL tree with branch support, `continueRecent`, `forkFrom`, project-local `list`, recursive `listAll`, `branchWithSummary`, single-path branched-session extraction, persisted `leafID`/serialized `leafId` in the session header, Pi v3 JSONL field names (`parentId`, `fromId`, `targetId`, `firstKeptEntryId`) and ISO timestamps on disk, deterministic Pi JSONL v1/v2 migration into the v3 tree model, legacy alias loading for earlier Helix fixtures, Pi v3 entry types for messages, thinking/model changes, compaction, branch summaries, custom entries, custom messages, and labels, plus Pi-shaped context construction from the active leaf path.
- `ProjectionMemoryStorage` / `ProjectionSQLiteStorage` + `ProjectionSessionService`: OpenCode-style event/projection session service with descending `ses_` IDs, update-time/id sorting, diff events, snapshots, revert, fork-before-message, child session indexing, cursor-based message paging, SyncEvent replay, Session.Info field preservation, MessageV2 message/part projection, and optional SQLite-backed persistence for the projected state.

Both implementations are tested by the same conformance suite, including the common `pageMessages` cursor contract.

## Hooks

`packages/lego-hooks` provides:

- ordered observers
- ordered handlers
- early stop for `block`, `cancel`, and `handled`
- source-aware scopes
- cleanup handling
- registries for tools, commands, shortcuts, flags, providers, auth providers, UI providers, and message renderers

These are now exposed as lego atoms through `@helix/lego-hooks/hook-atoms`: event bus, scheduler, observer chain, handler chain, cleanup scope, error policy, and tool/command/provider/UI registries. `LegoHookHost` is the compatibility facade that assembles those atoms for existing product adapters.

Adapters translate product-specific extension/plugin APIs into this host.

## Personalities

`packages/adapters-opencode` maps OpenCode plugin hooks such as `chat.message`, `chat.params`, `chat.headers`, `command.execute.before`, `tool.execute.before`, `tool.execute.after`, `permission.ask`, `tool.definition`, and experimental context/system/compaction hooks into common events. Auth, provider, and UI contributions are registered into first-class hook registries. The workspace also provides an `@opencode-ai/plugin` shim, ordered local/npm plugin loading, builtin auth/provider descriptors for Codex/GitHub Copilot/GitLab/Poe/Cloudflare/Azure/DigitalOcean/xAI, Bun-compatible `$` shell injection, and records `experimental_workspace.register` adapters in the common hook service registry.

`packages/adapters-pi` maps Pi extension APIs such as `pi.on`, `registerTool`, `registerCommand`, `registerFlag`, and provider/UI provider/message renderer registration into common hooks and registries. Extension handlers receive `ctx.ui`, a readonly `ctx.sessionManager`, and can communicate through custom `pi.events.emit` events. The workspace also provides an `@earendil-works/pi-coding-agent` shim plus ordered local/npm/git extension loading with jiti-like TypeScript transpilation for local `.ts` extensions and disposable hot-reload handles.

`packages/adapters-nanobot` maps Nanobot session/config/provider/tool/plugin concepts into the same common session, hook, provider, tool, prompt, config, and UI ports. It keeps upstream-facing behavior behind Nanobot personality atoms such as `nanobot.session.*`, `nanobot.plugin.*`, `nanobot.turn.*`, `nanobot.tool.*`, `nanobot.provider.*`, `nanobot.config.*`, `nanobot.prompt.*`, and `nanobot.ui.*`, and exposes thin SDK/CLI/TUI/Web/server product shells.

Those personality adapters now expose atom subpaths: `@helix/adapters-opencode/plugin-atoms` for plugin loading, manifest normalization, event mapping, registry/permission/workspace bridges, and OpenCode special atom descriptors; `@helix/adapters-pi/extension-atoms` for extension loading, TypeBox/schema normalization, dynamic registry/tool bridging, context bridging, runtime event emission, and Pi special atom descriptors; and `@helix/adapters-nanobot/nanobot-atoms` for Nanobot plugin loading, manifest normalization, API/context/event bridges, tool schema normalization, runtime event emission, command/provider/UI registry bridges, AgentHook event-name aliases, and Nanobot special atom descriptors.

## Recipes

`packages/lego-provider`, `packages/lego-tools`, and `packages/lego-agent-loop` now provide the first common execution path:

- Internal deterministic provider fixtures emit scripted stream events for conformance-only replay.
- provider streams pass through a normalizer that coalesces adjacent text/reasoning chunks and fills missing tool call ids.
- `OpenAICompatibleProviderAdapter` maps the common provider contract to OpenAI-compatible chat-completions streaming, including API-key/OAuth bearer headers, tools, text, reasoning, tool calls, and usage.
- OpenAI-compatible, OpenRouter, Anthropic, and Google providers now run through provider lego ports from `packages/lego-provider/src/ports.ts`: fetch/mock/cassette transport, auth header generation, static model registry, request shape, stream parser, event normalizer, usage/cost normalizer, and sanitized recording/replay cassette.
- `AnthropicProviderAdapter` maps the same contract to Anthropic messages streaming through the provider port layer, including API key headers, tools, text, thinking, tool_use blocks, and usage. The common/OpenCode policy follows the Anthropic Messages/AI SDK shape: a base URL ending in `/v1` plus a `/messages` endpoint. Native Pi CLI capture has its own provider endpoint submodule because upstream Pi appends its Anthropic path internally; for Anthropic-compatible proxy roots such as MiniMax it strips a trailing `/v1` before writing Pi's `models.json`.
- `GoogleProviderAdapter` maps the same contract to Gemini `streamGenerateContent` through the provider port layer, including API key/OAuth headers, system instructions, function declarations, text, function calls, finish reasons, and usage metadata.
- `createOpenRouterProvider` is an OpenAI-compatible port-backed preset with the OpenRouter base URL and optional app attribution headers.
- OpenCode provider plugins, Pi provider extensions, and Nanobot provider descriptors all land in the common hook host provider registry.
- default tools provide echo/read/write/edit/grep/find/ls/bash/todo/task/subagent; product packs narrow that registry to OpenCode-shaped `bash/edit/glob/grep/invalid/question/read/skill/task/todowrite/webfetch/write`, Pi-shaped `bash/edit/read/write`, or Nanobot's common shell/filesystem/meta tool surface. `packages/lego-tools/src/tool-atoms.ts` is the machine-readable catalog for tool lego blocks, while `packages/lego-tools/src/ports.ts` provides the executable port layer: local/memory/read-only/workspace-scoped filesystem ports, local/disabled/dry-run/sandbox process runners, and allow/deny/ask/workspace/personality permission policies. Assembled recipes install these ports into hook services, so file tools, bash, and permission preflight now resolve through recipe-selected lego interfaces with local defaults as compatibility fallbacks.
- `AgentLoop` / `runAgentTurn` handles input hooks, session writes, provider stream events, tool preflight, tool execution, tool results, max-step looping, assistant part protocol adaptation, and transcript append. OpenCode assembly now records native-style `step-start/reasoning/text/step-finish` logical parts through the existing `turn.result-recorder` plane, Pi keeps its native text-first part shape, and Nanobot uses the common assistant part protocol behind Nanobot turn atoms.
- `buildProviderContext` is exported as the reusable context builder boundary for context transforms, token estimates, overflow compaction, and compaction lifecycle events.
- multi-step turns feed completed tool call/result parts back into the next provider request until a step has no tool call or `maxSteps` is reached.
- tool preflight always follows provider event order, while executable tool calls run in parallel batches unless a tool declares `executionMode: "sequential"`.
- synthetic continue can inject an internal synthetic message after continuation finishes such as `length`, or after compaction hooks request `autocontinue`.
- provider steps support retry; failed attempts emit `provider.response.after` with serialized errors and exhausted retries become `provider_error` assistant messages.
- context building emits `context`, estimates input tokens, and can trigger overflow compaction through `session.before_compact`, `session.compacting`, `session.compact`, and `session.compacted`.
- the common loop emits `agent.start/end`, `provider.request.before`, `provider.response.after`, `tool.execution_start`, and `tool.execution_end` lifecycle events.
- product-level semantic replay now runs the same rich turn through OpenCode plugins, Pi extensions, and Nanobot hook adapters: input/system transforms, provider option/header patches, ask-scoped permissions, tool argument mutation, tool result patching, overflow compaction with autocontinue, transient provider retry, multi-step tool context, and `length` synthetic continue.
- tools use the `tool.permission-policy` service for allow/deny/ask decisions; ask-scoped policies still route through `permission.ask`, support plugin/extension allow or deny, and fall back to the UI facade when handlers leave the request in `ask`.
- oversized tool result text is truncated before transcript append, with a per-turn `maxToolResultTextChars` override.
- file-mutating default tools use a path-scoped mutation queue so parallel execution can keep same-file writes ordered without blocking independent paths.
- bash execution emits `shell.env`, allowing OpenCode-compatible plugins or other hook handlers to inject environment variables.
- task/subagent tools dispatch through a harness-provided `subagent.runner` or `task.runner` service, with a safe recorded-request fallback.

`packages/lego-config`, `packages/lego-prompt`, and `packages/lego-ui` provide the first common harness shell:

- product-specific config layering for OpenCode, Pi, and Nanobot, backed by `@helix/lego-config/config-atoms` source/merge/validator atoms for env, files, workspace, user, CLI overrides, discovery of plugin/extension directories, product config profiles, and Nanobot-style `${ENV}` reference resolution.
- conventional prompt resource discovery, extension-discovered resources, reference attachments, system prompt assembly, and product-specific OpenCode/Pi/Nanobot base prompt atoms, backed by `@helix/lego-prompt/prompt-atoms` loader/discovery/builder/tool-renderer/model/compaction ports. Nanobot prompt assembly preserves its root bootstrap file order and section separators.
- no-op UI facade for non-interactive runs and tests, a shared TUI event loop for command/theme/model/submit interactions, plus transport-backed TUI/RPC/Web/Desktop adapters for chrome, widget, overlay, editor, autocomplete, notifications, and message/tool renderer registry contracts, backed by `@helix/lego-ui/ui-atoms` event-loop/renderer/router/theme/input/snapshot ports and product UI profiles.

`packages/recipes` exports:

- `codingAgentMinimalRecipe`
- `opencodeRecipe`
- `piMonoRecipe`
- `nanobotRecipe`
- `swapRecipes`
- `defaultAtomRecipeModuleCatalog`
- `recipeBindingPorts`
- `assembleOpenCodeHarness`
- `assemblePiMonoHarness`
- `assembleNanobotHarness`
- `createHarnessAssemblyAtom`
- `auditReverseAssembly`
- `auditSourceBoundaries`
- `runAgentLoopSemanticReplay`
- `runLiveProviderParity`
- `runOpenCodeDifferential`
- `runNanobotDifferential`
- `buildAssemblyContract`
- `verifyAssemblyContract`

`buildAssemblyContract` is the TODO-007 assembly contract layer. It is not a new
lego category; it is a machine-readable view over the existing recipe compiler,
port fixtures, atom catalog, product shell routes, cadence descriptors, task
parity reports, and native cadence fixtures. The contract explains which atoms
were selected, which general ports they provide or consume, which swap points are
replaceable, which atoms are common/product/reserved/fixture-only, which product
surfaces are exposed, and which stable fingerprints identify the atom set,
binding graph, port coverage, surfaces, capabilities, and swap map. The CLI
commands `assemble` and `verify-assembly-contract` generate and validate these
contracts for OpenCode, Pi Mono, Nanobot, and the neutral minimal harness.

`packages/recipes/src/flow-graph.ts` is the TODO-025 assembly-vs-native
information-flow layer on top of those contracts. It does not draw package import
dependencies; it maps assembled ports/atoms, runtime event envelopes, native
fixture/cadence evidence, and task-parity summaries onto the same canonical
surface/session/prompt/provider/tool/runtime stage order. Hook behavior is
attached to edge boundaries, prompt behavior is represented as redacted prompt
assembly artifacts with fingerprints and section/source summaries, and every
original comparison carries observability lossiness instead of pretending
inferred native internals are exact. `npm run flow:graphs` writes the reusable
`docs/reports/flow-graph-{product}.json` blueprints and
`docs/reports/flow-graph-compare-{product}-read-only-answer.json` comparison
artifacts, then validates them through the shared flow artifact verifier.
For targeted native inspection, `helix flow-graph --mode native|compare
--artifact <native-cadence-fixture|task-parity-report|external-native-capture>`
reads native fixture sets, task parity reports, split summaries, split
manifests, or verified normalized external captures before using them as
original-flow evidence. External captures are product/task checked, refused when
marked `capture-only`, and projected with explicit lossiness instead of raw
provider payloads. The online Flow Observer API follows the same evidence
contract: linked fixtures expose only path/hash/version metadata to the UI,
while missing product/task fixtures are surfaced as `no native evidence linked`
and do not block the assembled flow view. Compare Native rendering stays in the
collapsible Flow Observer dock and offers side-by-side stage alignment, overlay
tracks, and a diff table so native evidence can be inspected without displacing
the main assembly board. The observer toolbar can filter canonical lanes; in
Blueprint and Trace modes those lanes render as collapsible horizontal tracks
with stable 19-column stage alignment and slight depth offsets, so hiding a lane
collapses it to a header instead of reshuffling the graph. A 2.5D toggle can
remove the skew/depth/shadow treatment and leave the same lane/stage grid as a
plain 2D reading mode. Compare drift stages are lightly lifted through
`data-flow-drift-node` and mirrored into diff-table projection chips through
`data-flow-drift-projection`, without changing canonical stage columns. On
narrow mobile viewports the same canonical stages are also mirrored into a
stage-list projection (`data-flow-mobile-stage-list`) so stage order and
selection remain readable without forcing the wide 2.5D canvas to be the primary
mobile surface. Each stage node now shows compact assembly chips for its primary
selected atom, port, atom scope, and
replaceability, while longer atom/port lists stay in the inspector. Node boundary
badges summarize each outbound edge's data kind and hook count, with full hook
chain order and payload fingerprints still available in the selected-stage
inspector. Native/compare side panels include the lossless/semantic/aggregated/
inferred/unobservable legend so native projection gaps stay visible. Stage selection also
shows adjacent edge detail with hook chain order, payload fingerprint,
transform/permission/early-stop capability, result type, source metadata, and
product adapter tags such as OpenCode plugin bridge or Pi extension bridge
without exposing handler function bodies. The prompt stage inspector adds a
summary-only assembled-vs-original comparison: it can compare sanitized prompt
fingerprints when both sides expose prompt artifacts, but otherwise marks the
native side as event-only or missing prompt evidence and keeps that state out of
the required native parity gate. Original/native hook boundaries stay
lossiness-aware: a visible native plugin or extension event becomes an aggregated
event tap, while a boundary with no native event is rendered as unobservable
rather than a guessed handler chain. In Trace mode the same side panel
summarizes step/attempt, provider request count, tool batch, finish reason, token
estimate, and compaction status, and timeline events can be clicked to focus the
canonical stage they exercised. Assembled `runTurn` and `runFixtureTurn` results
now include a redacted `runtimeTrace.events` EventEnvelope timeline plus registry
summary and hook source snapshot, so Flow Graph code can consume live/fixture
runs without storing raw prompt, provider request, tool input/result, handler
code, or host filesystem paths. The hook snapshot keeps per-event observer and
handler counts plus source order/id/name/scope with path fingerprints. Prompt
service builds also return a summary-only prompt artifact and emit it as a
`turn.pipeline.trace` prompt-assemble event, preserving sections, resource
summaries, fingerprint, token estimate, product profile, and sanitized preview
without raw prompt text. Builder TUI sessions set the same collector source to `builder-test-session`, append each
turn to `runtime-traces.jsonl` under the session storage directory, and surface
turn/event/fingerprint counts in the right-column TUI card. When
Compare Native finds a stage diff, the
selected-stage inspector now surfaces a fix hint with the drift category, owning
plane, candidate assembled atom, confidence, and TODO-025 traceability link. The
Flow Observer toolbar also exposes a task selector populated from task parity
coverage, so `read-only-answer`, `single-file-edit`, `tool-error-retry`,
`context-compaction`, and other recorded tasks route Trace, Native, and Compare
requests through the matching task-specific fixture lookup instead of a hardcoded
default. A product selector in the same observer toolbar can either follow the
current Builder assembly or temporarily inspect another product preset, such as
Hermes Agent, without calling the Builder preset loader or mutating the recipe
draft. The Builder right column also exposes an `Assembly Flow` tab as the
discoverable entry point for this view; selecting it expands the collapsible
Flow Observer under the assembly board instead of replacing the main assembly
workspace. The adjacent evidence selector switches Trace to the latest assembled
run returned by `/api/harness-flow/run`, and switches Native/Compare between the
split native cadence fixture manifest and task parity reports. The native-capture
artifact source remains visible as a disabled future choice until upload/path
selection and verification contracts are available. The dedicated
`flow-graph-compare.conformance.test.ts` gate checks every product comparison
keeps assembled and original graphs on the same canonical stage spine, edge
sequence, diff anchors, and resolvable original evidence refs. The flow artifact
verifier also recomputes graph/comparison/run fingerprints, edge payload
fingerprints, and prompt artifact hashes, so stale or partially edited flow JSON
is rejected before the UI treats it as evidence. It also rejects credential-
shaped strings and common raw prompt, provider request, provider response, tool
argument, and tool result payload field names outside the explicit redaction
policy block. Hermes Agent native-visible
flows are intentionally presented as lossy original evidence: the Flow Observer
lossiness legend and selected-stage inspector expose aggregated, inferred, and
unobservable counts/states instead of implying complete native internals. The
diff table keeps all diff categories for a stage as `data-flow-diff-category`
chips, so tool count and tool sequence drift on the same canonical stage remain
separately inspectable. Browser coverage now checks native-fixture categories
for provider request, tool sequence/batch, message part, stream, and final
summary drift, plus the task-parity-report path for early-accept drift.

## External Evidence Gateway

`external-tools/` and `packages/external-tools` are the TODO-032 boundary for
local capture tools such as `claude-tap`. They are not lego atoms, product
adapters, providers, or product shells. Helix calls an installed external
binary, records a run manifest, imports its artifacts, and normalizes them into
redacted evidence that existing verifiers, native cadence fixtures, and Flow
Graph / Flow Observer paths can consume.

The first profile is `claude-tap`. Real captures run through
`helix external-tools capture claude-tap`, which writes a local
`.helix/external-tools/runs/<run-id>/` directory with `raw/`, `logs/`,
`normalized/`, and `run-manifest.json`. The manifest records the resolved
binary, command arguments, cwd, env allowlist, capture mode, start/finish time,
exit code, and sha256/byte-size coverage for discovered artifacts. The env
allowlist is the actual set of variable names passed to the external tool; the
manifest never stores values, and Helix's explicit capture gate flags are
not passed through to the tool process. Before launching a real capture,
Helix probes the tool version through the selected invocation strategy and
stores it as `toolVersion`. For
`claude-tap`, Helix injects `--tap-output-dir <run>/raw`,
`--tap-no-open`, `--tap-no-live`, and `--tap-no-update-check` before the client
arguments; the arguments after `--` remain the user-supplied client invocation.
The strict post-run preflight gates validate that the manifest is a trustworthy
index: required raw/log/normalized artifacts must stay inside the run directory
and their recorded byte sizes, sha256 hashes, known tool version, product/task,
capture mode, and env allowlist must match the files on disk.
The same manifest verification is available for one run through
`external-tools verify-run-manifest --manifest <run-manifest.json>`, and the
normalized-capture linkage is available through
`external-tools verify --artifact <native-capture.json> --run-manifest
<run-manifest.json>`, so a normalized capture can be checked against the raw
source artifact hash without copying external tool source into Helix.
The strict claude-tap preflight scripts reuse those verifiers for manifest and
normalized capture checks, and `preflight:compare` also runs
`verify-flow-graph` for the local `flow-compare.json` artifacts instead of
maintaining a separate product-side interpretation.
The `claude-tap` integration records upstream attribution as
`https://github.com/liaohch3/claude-tap`, license `MIT`, license file
`https://github.com/liaohch3/claude-tap/blob/main/LICENSE`, PyPI package
`https://pypi.org/project/claude-tap/`, and copyright
`Copyright (c) 2025 liaohch3`. Helix does not vendor the upstream
`claude-tap` source; only Helix-owned adapter/profile/schema/fixture files
are checked in under `external-tools/claude-tap`.
Capture-ready preflight can be strategy-targeted with `--strategy binary` or
`--strategy uvx`; the binary and uvx acceptance chains use the matching
strategy gate before their matching doctor/capture commands.
Capture-ready preflight intentionally skips existing run manifest and
normalized-capture verification, because its job is to decide whether the
current shell can start a real capture. Post-run artifact checks begin at the
captures gate.
The same option is reused by post-run capture/compare preflight so each
`run-manifest.json` must prove that its recorded invocation strategy matches
the acceptance chain being validated.
Preflight can also be product-targeted with `--product opencode`,
`--product pi-mono`, or `--product hermes-agent`; the same verifier-backed gates
then inspect only that local run directory and recommend the product-specific
capture, verify, and post-run preflight commands.
The standard claude-tap acceptance scripts run the matching post-capture gate
before verify/compare, so incomplete or mixed-strategy local runs fail before
new flow comparison artifacts are produced.
Post-capture gates intentionally skip `flow-compare.json` verification; only
post-compare gates run `verify-flow-graph`, keeping old comparison artifacts out
of capture readiness.
Any non-dry-run `external-tools capture` invocation requires
`HELIX_EXTERNAL_CAPTURE=1` in the current shell plus a known provider
credential such as `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`,
`AZURE_OPENAI_API_KEY`, or the explicit no-credentials override for local/custom
providers; both explicit gate flags are intentionally ignored when loaded from
`.env`.

Published evidence is import-first. `external-tools import` reads JSONL, JSON
export, or compact `.ctap.json`, then writes a `NativeCaptureArtifact` with
provider request shape summaries, prompt/tool fingerprints, usage and stream
summaries, stage evidence, redaction policy, and explicit lossiness. It does not
vendor external tool source or store raw prompt/provider/tool payloads in
publishable reports. Flow Graph native/compare mode can consume verified
non-`capture-only` captures directly, `task-parity --external-capture` can read
one matching capture as an `original` native reference report, and
`external-tools to-native-cadence` can also export the same projection as an
explicit native cadence fixture. `capture-only` evidence is allowed for prompt
and tool-schema inspection, but is refused as native cadence task-success
evidence.

`packages/lego-runtime` now exposes the composition kernel as separate lego pieces: `ModuleCatalog` owns module registration, `CapabilityResolver` validates and sorts providers, `BindingPlanner` records port-to-atom edges, `LifecycleRunner` performs init/start, scoped disposal, and capability service registration, and `AssemblyGraph` produces graph/lockfile views. `ModuleRegistry` remains the compatibility facade over those pieces. Lifecycle scopes cover process, workspace, session, turn, and tool-call disposal boundaries. `@helix/lego-runtime/runtime-atoms` adds product runtime atoms for OpenCode, Pi, and Nanobot: module aliases, capability aliases, binding defaults, lifecycle defaults, and graph labels.

`packages/lego-agent-loop` keeps the runtime loop stable while its executable stages and block metadata are split by source group. `src/loop/*` owns the turn runner, provider step, tool step, summary/continuation decisions, acceptance checks, and shared loop event helpers. `src/pipeline/*` owns explicit turn pipeline ids, strategy selection, and `turn.pipeline.trace` emission. `src/product-turn/*` owns OpenCode, Pi, Nanobot, and Hermes turn profiles, atom id factories, runtime-context rendering, and turn defaults. `src/cadence/*` owns request-boundary, tool-batch, final-summary, and descriptor registries. `src/ports/*` owns the port fixture catalog consumed by the block ledger and assembly contracts. The compatibility shims `agent-loop.ts`, `pipeline.ts`, `product-turn-atoms.ts`, `cadence-policies.ts`, and `port-fixtures.ts` re-export those directories so existing imports keep working.

TODO-004 extends cadence fidelity without adding a new top-level lego category. Request boundaries and final summaries are `agent-loop` ports; tool batching, schema snapshots, aliases, and result envelopes stay under `tools`; early task acceptance stays under `runtime`; message-part projection stays under `session`; streaming delta recording and stream projection stay under `provider`. Recipes bind `common.*.default` atoms for neutral/minimal assembly and product-scoped `opencode.*`, `pi.*`, `nanobot.*`, or `hermes.*.native-like` atoms when a full harness needs native cadence behavior. The common agent loop only asks the selected service for a decision and emits the generic pipeline atom ID, while the product atom ID is carried as trace metadata.

`packages/docs-site` uses the recipe compiler, assembly contract builder, block ledger audit, source boundary lint, and TODO parser to generate `docs/site/index.html`, a static assembly console for the OpenCode/Pi/Nanobot/minimal module graph, package-grouped atom inventory, contract fingerprints/swap points/classification, catalog/fixture/binding/export coverage, personality swap map, port binding diff, strategy/policy diff, boundary leakage status, and checklist status.

The OpenCode recipe now registers product-surface services through `packages/adapters-opencode/src/product-surface.ts`, a compatibility facade over split `opencode-*` shell modules:

- `opencode.sdk`: in-process SDK for graph inspection, session listing, session transcript lookup, workspace/control-plane snapshots, and provider-backed turns.
- `opencode.server.factory`: Node HTTP server factory with health, graph, sessions, workspace, control-plane, TUI event, and provider-backed run routes.
- `opencode.workspace`: local workspace/config/registry/service snapshot.
- `opencode.control-plane`: product-level status for modules, entrypoints, providers, auth providers, registry counts, and server routes.
- `opencode.tui`: terminal/TUI snapshot, shared interactive event loop, and plain-text renderer.
- `opencode.web`: offline Web cockpit HTML for graph, tools, providers, and TUI state.
- `opencode.desktop`: desktop manifest and HTML shell around the Web surface.
- `opencode.slack`: Slack manifest, home view, and slash-command bridge.

The Pi recipe registers product-surface services through `packages/adapters-pi/src/product-surface.ts`, a compatibility facade over split `pi-*` shell modules:

- `pi.sdk`: workspace/session/package/release facade over the assembled Pi harness.
- `pi.cli`: command/help renderer plus provider-backed runner for Pi CLI parity checks.
- `pi.tui`: terminal snapshot, shared interactive event loop, and plain-text renderer over the Pi SDK workspace.
- `pi.rpc`: in-process RPC methods for workspace, session, run, package, and release operations.
- `pi.web-ui`: offline Web UI HTML for graph, package plan, RPC methods, services, and TUI state.
- `pi.server.factory`: Node HTTP server factory with health, workspace, graph, sessions, TUI render/event, Web UI, package, release, RPC, and provider-backed run routes.
- `pi.package-manager`: deterministic package/extension planning, compatibility-loader extension loading, and shrinkwrap generation from Pi settings.
- `pi.extension-examples`: materializable TypeScript examples for tools, events, and provider registration.
- `pi.browser-smoke`: offline browser smoke HTML for recipe graph, package specs, and JSONL session storage.
- `pi.release-hardening`: release verification checks and deterministic shrinkwrap writer.

The Nanobot recipe registers product-surface services through `packages/adapters-nanobot/src/product-surface.ts`, a compatibility facade over split `nanobot-*` shell modules:

- `nanobot.sdk`: in-process SDK for workspace snapshots, session lookup, tool/provider registry inspection, and provider-backed turns.
- `nanobot.cli`: command/help renderer plus provider-backed runner for Nanobot CLI parity checks.
- `nanobot.tui`: terminal snapshot, shared interactive event loop, and plain-text renderer over the Nanobot SDK workspace.
- `nanobot.web-ui`: offline Web UI HTML for graph, services, tools, providers, and TUI state.
- `nanobot.server.factory`: Node HTTP server factory with health, Web UI, TUI snapshot, and agent-turn routes.

The Hermes recipe registers product-surface services through `packages/adapters-hermes/src/product-surface.ts`, a compatibility facade over `src/surfaces/*` assembly and registration modules plus split Hermes shell modules:

- `hermes.sdk`: in-process SDK for workspace snapshots, graph inspection, session lookup, and provider-backed turns.
- `hermes.cli`: command/help renderer plus provider-backed runner for Hermes CLI parity checks.
- `hermes.tui`: terminal snapshot, shared interactive event loop, and plain-text renderer over the Hermes SDK workspace.
- `hermes.acp`: in-process ACP method surface for workspace, session, and run operations.
- `hermes.gateway`: platform event dispatch facade over the Hermes SDK.
- `hermes.web-dashboard`: offline dashboard HTML for graph, registries, providers, and services.
- `hermes.api-server.factory`: Node HTTP server factory over the SDK, CLI, TUI, ACP, gateway, and dashboard surfaces.

Hermes special atoms are split under `packages/adapters-hermes/src/atoms/*`: plugin loader/API bridge, tool registry normalization, prompt builder descriptor, provider model-registry descriptor, session SQLite/FTS descriptor, and profile assembly. `hermes-atoms.ts` remains the compatibility shim for `@helix/adapters-hermes/hermes-atoms`.

`packages/recipes/src/nanobot-lego-depth.ts` audits this Nanobot split against the OpenCode/Pi contracts. It requires Nanobot coverage across existing session, hook, prompt/resource, runtime, agent-loop, tool, provider, config, UI, product-shell, and task-runner planes; reports product-vs-common atom depth in `docs/reports/nanobot-lego-depth.json`; and fails if common packages import Nanobot adapters. This keeps Nanobot as a composition of the same lego interfaces rather than a single special adapter.

`packages/conformance/product-shell-surfaces.conformance.test.ts` keeps these product shells modular by giving every surface its own smoke case. Recipe tests still prove the assembled product exists, while this suite isolates failures to one shell at a time.

`auditReverseAssembly` assembles all three full products, dependency-checks their recipes, verifies expected product modules and runtime services, runs provider-backed product turns plus internal deterministic hook fixtures, exercises product-surface behavior, runs product-level agent-loop semantic replay, replays pinned upstream-derived fixtures, runs pinned upstream e2e parity, and scans common packages to ensure they do not import OpenCode/Pi/Nanobot personality packages.

`runAgentLoopSemanticReplay` assembles all three full products and executes the same product-hooked semantic replay through the common agent loop. It is the product-level proof that OpenCode/Pi/Nanobot personalities map their hook names onto the same lifecycle, permission, tool, retry, compaction, and continuation semantics.

`runUpstreamProductWorkflowParity` remains the OpenCode/Pi upstream-fixture workflow gate. It runs real provider-stream turns through `runTurn(provider)`, drives OpenCode server/TUI-event/Web/Desktop/Slack surfaces, drives Pi CLI/RPC/TUI-event/Web UI/server surfaces, and verifies that pinned upstream fixture sessions can be read through those product SDKs. Nanobot's analogous evidence currently lives in its baseline/differential, reverse-assembly surface checks, live provider parity, and task parity artifacts.

`runUpstreamE2EParity` is the deeper offline upstream e2e gate. It records pinned upstream smoke/test source references, replays OpenCode's session timeline smoke fixture through assembled product SDK/server/TUI/Web surfaces, verifies paging order plus fork/diff readback, and maps Pi's dynamic tool registration, runtime session events, cancellation, and branching tests onto the common lego harness.

`runOpenCodeDifferential` is the first fidelity-oriented differential gate. It compares the current assembled `opencode.full`
trace with either an observed native `opencode-ai@1.15.11` fixture shape or an optional live native capture launched through
an isolated native package prefix that installs `opencode-ai@1.15.11` and invokes `.bin/opencode` directly. The capture path isolates `HOME`/XDG directories, separates stable package cache from product state, injects `OPENCODE_CONFIG_CONTENT`, normalizes
Anthropic base URLs for the AI SDK convention, parses JSON stdout events, reconstructs a stdout-only assistant view when
native sqlite is not produced, and reads the native sqlite `session/message/part` tables when they are produced using either
`sqlite3 -json` or the Node `node:sqlite` fallback. The report compares role sequence, visible text, native assistant part protocol, Anthropic
endpoint composition, OpenCode sqlite schema, CLI JSON event protocol, and tool registry names. The current fixture
differential is matched across those rows; optional live native capture remains the harder fidelity queue because it depends
on the installed upstream package and provider behavior.

`runPiMonoDifferential` keeps the same differential shape available for Pi Mono. By default it compares assembled `pi-mono.full`
with the pinned Pi JSONL fixture shape; with `--native-original` it launches `npx @earendil-works/pi-coding-agent`, captures
Pi's `--mode json` event stream, writes a native `models.json` provider override when `HELIX_LIVE_BASE_URL` is set,
and reads the v3 JSONL session file from an isolated `--session-dir`.
The comparison keeps OpenCode strict, while Pi normalizes optional reasoning/thinking blocks and repeated streaming
`message_update` deltas so live native captures can be compared against the same assembled turn contract.

`runNanobotDifferential` adds the same fixture/native-report shape for Nanobot. Fixture mode compares assembled `nanobot.full` with the pinned `nanobot-ai==0.2.0` JSONL/session/provider contract. With `--native-original`, it now launches `uvx --from nanobot-ai==0.2.0 nanobot agent` directly in an isolated home/workspace, writes a Nanobot config that binds the Anthropic-compatible provider, normalizes Anthropic base URLs to the root API base expected by Nanobot's native provider, captures stdout JSON events, and projects final assistant text plus `metadata/message` session evidence from Nanobot's workspace `sessions/*.jsonl`. The current live differential command matches assembled Nanobot exactly for transcript roles, visible text, assistant part type, endpoint suffix, native session schema, CLI event protocol, and tool registry. Native real-task parity also runs through TODO-002's shared task runner, filters Nanobot bootstrap/session files out of task workspace diffs, and records `native.accepted-early` when the declarative task verifier has already been satisfied.

`runProductTaskParity` now has a credential-backed native smoke path for OpenCode, Pi, and Nanobot. `docs/reports/task-parity-live.json` is the current read-only six-path artifact: assembled OpenCode/Pi/Nanobot plus original upstream CLIs all pass as `matched` or `acceptable-drift`, verifier confirms no credential-shaped fields, and pair-level differences are preserved as output/trace/policy/cost drift while artifact parity remains true. Third-stage cadence evidence is now part of every report and pair. Deterministic cassette runs can reach `exact-cadence`; live native runs expose `cadenceParity`, weighted `cadenceScoreBreakdown` model v2, report-level `observationShape`/`acceptanceTimingEvidence`, and stable `cadence.*` drift IDs with owning plane, owning atom, candidate fixes, score delta, reproduction metadata, and observability metadata. TODO-006 keeps native observation and timing evidence under the existing provider/session/tool/runtime/agent-loop planes, so native projection lossiness and early-accept timing are visible without adding a new top-level lego category. The pair-level report treats task-success with cadence drift as `acceptable-drift` while artifact parity and policy parity remain true for all three products.

The task runner submodules are now explicit through `productTaskRunnerDescriptors()`: `task.runner.assembled` for Helix recipes, `task.runner.native-cli` for either contract replay or real upstream CLI subprocesses, and reserved `task.runner.native-server` for future harnesses that require server/RPC entrypoints. Current OpenCode, Pi Mono, and Nanobot task parity paths do not require native server/RPC, so the native-server descriptor is intentionally present but marked `supported: false` and `required: false` for those products.

`runLiveProviderParity` is the credential-backed live provider gate. It can run assembled products through OpenAI-compatible, OpenRouter, Anthropic, or Google streaming adapters, then read the resulting sessions back through product SDKs. Internally it is now assembled from lego atoms: credential gate, live runner, artifact writer, artifact verifier, and cassette generator. The default archived gate covers OpenCode, Pi Mono, and Nanobot, and `verifyLiveProviderParityArtifact` requires all three product turn/readback checks before the artifact counts as completion evidence. The report must be passed, have no missing credential inputs, include provider/model/session/step evidence, and avoid credential-shaped fields. The default reverse assembly audit keeps live execution opt-in so ordinary offline conformance does not depend on private provider credentials; `auditReverseAssembly({ runLiveProviderParity: true })` makes missing credentials a failing check.

`packages/cli` provides the first runnable recipe entrypoint:

```bash
npm run helix -- run opencode --provider openai-compatible --model "$HELIX_LIVE_MODEL" --api-key "$HELIX_LIVE_API_KEY" --prompt hello --json
npm run helix -- run opencode --provider openai-compatible --model "$HELIX_LIVE_MODEL" --api-key "$HELIX_LIVE_API_KEY" --prompt hello --native-json-events
npm run helix -- run pi-mono --provider anthropic --model "$HELIX_LIVE_MODEL" --api-key "$HELIX_LIVE_API_KEY" --prompt hello --json
npm run helix -- run opencode --provider openrouter --model "$HELIX_LIVE_MODEL" --api-key "$HELIX_LIVE_API_KEY" --prompt hello --json
npm run helix -- live-provider-parity --provider openrouter --model openai/gpt-4.1 --require-credentials --out docs/reports/live-provider-parity.json --json
npm run helix -- verify-live-provider-parity --artifact docs/reports/live-provider-parity.json --provider openrouter --model openai/gpt-4.1 --json
npm run helix -- differential opencode --json
npm run helix -- differential opencode --native-original --model claude-sonnet-4-5 --json
npm run helix -- differential pi-mono --json
npm run helix -- differential pi-mono --native-original --model claude-sonnet-4-5 --json
npm run helix -- run nanobot --provider anthropic --model "$HELIX_LIVE_MODEL" --api-key "$HELIX_LIVE_API_KEY" --prompt hello --json
npm run helix -- differential nanobot --json
npm run task:parity:live
npm run task:parity:cadence
npm run task:parity:cadence:verify
npm run helix -- verify-task-parity --artifact docs/reports/task-parity-live.json --product opencode,pi-mono,nanobot --mode assembled,original --task read-only-answer --json
npm run task:parity:native-cadence:split
npm run task:parity:native-cadence:split:replay
npm run test:browser:flow-observer
npm run live:provider
npm run live:provider:verify
```

Public run paths require real provider configuration. Internal deterministic provider fixtures remain available for conformance-only replay, but they are not product capabilities, install smoke paths, or evidence that a product preset is ready for user traffic.

## Current Verification

The current gate is:

```bash
npm run typecheck
npm test
```

The tests cover session behavior, session atom conformance and swap dry-runs, hook atom conformance, personality adapter atom conformance, hook semantics and strategy matrix behavior, cross-personality common hook reuse through OpenCode plugin, Pi extension, and Nanobot hook surfaces, runtime composition cases, scoped lifecycle disposal, block-ledger catalog/fixture/binding/export coverage, agent-loop lifecycle ordering, pipeline trace coverage, product-level agent-loop semantic replay, OpenCode native/fixture differential trace reporting, Pi fixture/native differential trace reporting, Nanobot fixture differential trace reporting, upstream product workflow parity, pinned upstream e2e parity, live provider parity with a local HTTP SSE provider, internal deterministic fixture turns, neutral minimal recipe compilation, OpenCode SDK/server/control-plane/TUI-event/Web/Desktop/Slack surfaces, Pi SDK/CLI/TUI-event/RPC/Web UI/server/package/example/browser-smoke/release surfaces, Nanobot SDK/CLI/TUI/Web UI/server surfaces, large upstream-shaped and real upstream-derived fixture replay, reverse assembly behavior audit, real provider CLI selection, and the CLI entrypoint.
They also include package export smoke for representative atoms, packs, and product shells, plus a test import scan that rejects unexported deep package imports. The builder LiveCodeBench path exports a custom recipe from the browser workspace, validates and assembles it through `--recipe-file`, then runs the same real LiveCodeBench task against that frontend-built harness artifact.
Package boundary conformance dry-runs publishable npm tarballs and checks dependency lanes for common packages, OpenCode personality packages, Pi personality packages, and Nanobot personality packages.
The modular acceptance matrix ties those gates back to the recipes: `opencode.full`, `pi-mono.full`, `nanobot.full`, and `coding-agent.minimal` must declare their complete suites, current common atoms must have independent suite coverage, and the archived live provider parity artifact must pass verification before it counts as product-level evidence.
Surface swap conformance drives product TUI shells through the same shared `ui.event-loop` event sequence, checking that OpenCode and Pi consume the common UI atom semantics instead of owning separate interaction loops; Nanobot uses the same UI event-loop contract in its product shell smoke tests.
Port contract fixture conformance checks that each common catalog port has input/output, lifecycle, resources, conformance, implementations, and personality atom metadata before it can be treated as a lego interface.
