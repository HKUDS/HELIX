# Helix Lego Block Catalog

This document is the planning authority for the next modularity phase. Its job is to define the full set of lego blocks before implementation moves further, so OpenCode, Pi Mono, and future agent harnesses can be assembled from the same general interfaces.

## 0. Authority And Phase Gate

This catalog is the source of truth for "what lego blocks exist." Implementation work should not start by moving files around. It should start by deciding which row in this catalog the behavior belongs to, which general port it implements, and whether it is common, product-personality, pack, or product-shell code.

Before a block is treated as modular, it needs five pieces of evidence:

- catalog row: the port or atom appears in this document,
- interface: the port has input, output, lifecycle, resource, error, and trace semantics,
- binding: a recipe can bind the port to a specific atom,
- export: the atom, pack, port, or shell is reachable through a package root or explicit subpath when it is meant for external composition,
- conformance: there is a port-level suite, fixture replay, or test-only mock proving the contract independently from OpenCode/Pi product tests.

This inventory is now frozen enough to drive executable atom-level recipes. The current primary recipes have `modules: []`,
declare their atom inventory directly, and use recipe bindings as the source of truth for which atom satisfies each general
port. The desired assembly shape is:

```text
common atoms + OpenCode personality atoms + OpenCode product shells => opencode.full
common atoms + Pi personality atoms       + Pi product shells       => pi-mono.full
common atoms + Nanobot personality atoms  + Nanobot product shells  => nanobot.full
common atoms only                         + minimal shell           => coding-agent.minimal
```

TODO-007 adds a machine-readable assembly contract over that shape. The contract
does not introduce a new lego category; it is a verifier artifact built from the
existing recipe/compiler, port fixtures, atom catalog, product descriptors, task
parity reports, and native cadence fixtures. For each product it records:

- selected atoms and their common/product/reserved/fixture-only classification,
- port contracts and selected providers,
- compiled binding graph and capability graph,
- product shell surfaces and public source routes,
- replaceable swap points for session, runtime, provider, tool, prompt, hook, UI,
  and task-observation submodules,
- stable atom/binding/port/surface/capability/swap fingerprints,
- task parity and native cadence fixture linkage.

The generated artifacts live in `docs/reports/assembly-contract-*.json` and can
be regenerated with `npm run assembly:contract`. The static docs site renders the
same contracts in the "Assembly Contracts" panel.

## 1. Block Model

Helix should distinguish six concepts:

| Concept | Meaning | Example |
| --- | --- | --- |
| `port` | A general interface/capability. It defines what can be plugged in, not how it is implemented. | `session.reader`, `provider.stream`, `tool.executor` |
| `common atom` | A product-neutral implementation or strategy for one port. | `session.pagination.cursor`, `turn.retry.fixed` |
| `personality atom` | A product-specific implementation or adapter behind a general port. | `opencode.session.syncevent-projector`, `pi.session.jsonl-v3-migrator` |
| `product shell` | A thin user-facing surface assembled from ports. It should not own common behavior. | `opencode.server`, `pi.rpc`, `pi.tui` |
| `pack` | A convenience bundle that expands into atoms. It is not the real boundary. | `tool-pack.filesystem`, `provider-pack.anthropic` |
| `recipe` | A declared binding graph that chooses atoms, packs, policies, and product shells. | `opencode.full`, `pi-mono.full`, `coding-agent.minimal` |

The key rule: a product is assembled by binding ports to atoms. Product-specific code should appear as personality atoms or product shells, not leak into common atoms.

## 2. General Lego Interface

Every lego block should expose the same outer shape. The executable definitions live in `@helix/contracts` as
`LegoBlockManifest`, `PortContract`, `AtomFactory`, `BindingSpec`, `ResourceGrant`, and `ConformanceRef`; the snippets below
show the shared vocabulary used by every plane.

```ts
interface LegoBlockManifest {
  id: string
  version: string
  type: "port" | "atom" | "strategy" | "pack" | "product-shell"
  layer:
    | "foundation"
    | "identity"
    | "event"
    | "session"
    | "hook"
    | "turn"
    | "tool"
    | "provider"
    | "prompt"
    | "config"
    | "ui"
    | "product"
    | "runtime"
    | "conformance"
  personality: "common" | "opencode" | "pi-mono" | string
  provides: CapabilityRef[]
  requires: CapabilityRef[]
  optional?: CapabilityRef[]
  resources?: ResourceGrant[]
  lifecycleScopes?: Array<"process" | "workspace" | "session" | "turn" | "tool-call">
  configSchema?: unknown
  conformance?: ConformanceRef[]
}

interface CapabilityRef {
  id: string
  version?: string
  kind: "port" | "implementation" | "strategy" | "registry" | "surface"
  multiplicity?: "single" | "multi"
  stability?: "experimental" | "stable"
}

interface ResourceGrant {
  id: "filesystem" | "network" | "shell" | "env" | "sqlite" | "extension-runtime"
  mode?: "read" | "write" | "execute"
  scope?: "workspace" | "user" | "process" | "external" | "session" | "turn" | "tool-call"
  optional?: boolean
  reason?: string
}

interface ConformanceRef {
  id: string
  suite?: string
  fixture?: string
  command?: string
  required?: boolean
}
```

This shape gives recipes enough information to validate:

- whether all required ports are bound,
- whether a chosen implementation is product-neutral or product-specific,
- whether two atoms conflict over the same single-binding port,
- whether the recipe grants enough resources,
- whether a block can be tested independently.

## 3. Naming Convention

Use stable, explicit IDs:

```text
<domain>.<capability>[.<role>][.<variant>]
```

Examples:

- `session.reader`
- `session.store.jsonl-tree`
- `session.projector.opencode-syncevent`
- `turn.provider-request-builder.openai-chat`
- `tool.permission-policy.ask-hook`
- `ui.event-loop.shared-tui`
- `opencode.product-shell.server`
- `pi.product-shell.rpc`

Ports use general names. Implementations and personality atoms include variants.

## 3.1 General Port Interface

Every plane uses the same interface vocabulary. The concrete TypeScript names may live in different packages, but the conceptual shape is shared:

```ts
interface PortContract<Input, Output> {
  id: string
  input: Input
  output: Output
  cardinality: "single" | "multi"
  lifecycle: Array<"process" | "workspace" | "session" | "turn" | "tool-call">
  resources: ResourceGrant[]
  errors: string[]
  traces: string[]
  conformance: ConformanceRef[]
}

interface AtomFactory<Config, Ports, Implementation> {
  manifest: LegoBlockManifest
  create(config: Config, ports: Ports): Implementation | Promise<Implementation>
}

interface BindingSpec {
  port: string
  atom: string
  personality?: "common" | "opencode" | "pi-mono" | string
  scope?: "process" | "workspace" | "session" | "turn" | "tool-call"
  resources?: ResourceGrant[]
  multiplicity?: "single" | "multi"
}
```

The important rule is that atoms receive dependencies through declared ports. They should not reach sideways into concrete singletons, product shells, or another product's personality package.

The machine-readable inventory starts from `LegoPortContractFixture` rows and normalizes them into the same `PortContract`
shape. Each port row now carries or derives:

- error semantics through stable `*.contract-error` identifiers,
- trace semantics through stable `*.trace` identifiers,
- at least one `test.<port>.mock` atom for independent conformance planning,
- common implementation blocks classified as replaceable atoms, packs, or product shells,
- personality implementation blocks classified as OpenCode or Pi atoms/shells.

This keeps the catalog block-first while avoiding a second manually maintained table for obvious default test/error/trace IDs.

## 4. Common Port Catalog

These are the general interfaces every product can compose against.

### 4.0 Complete Block Inventory Index

This is the high-level ledger. Detailed rows below define the individual ports.

| Plane | General Ports / Lego Blocks | Common Atoms | OpenCode Personality Atoms | Pi Personality Atoms | Nanobot Personality Atoms | Product Shells / Packs |
| --- | --- | --- | --- | --- | --- | --- |
| Foundation | `block.manifest`, `capability.ref`, `resource.grant`, `recipe.binding`, `conformance.ref` | schema validators, manifest normalizer, fixture registry | OpenCode compatibility metadata | Pi compatibility metadata | Nanobot compatibility metadata | n/a |
| Runtime | `runtime.module-catalog`, `runtime.capability-resolver`, `runtime.binding-planner`, `runtime.lifecycle-runner`, `runtime.assembly-graph`, `runtime.acceptance-controller`, `runtime.acceptance-evidence` | catalog/resolver/planner/lifecycle/graph atoms, default acceptance controller/evidence | OpenCode module/capability aliases, binding/lifecycle defaults, graph labels, native-like acceptance controller/evidence | Pi module/capability aliases, binding/lifecycle defaults, graph labels, native-like acceptance controller/evidence | Nanobot module/capability aliases, binding/lifecycle defaults, graph labels, native-like acceptance controller/evidence | recipe compiler and docs graph renderers |
| Identity/time | `identity.id-generator`, `identity.clock`, `identity.workspace-resolver` | deterministic/random IDs, deterministic/system clock, cwd workspace | `ses_` IDs, OpenCode workspace mapping | UUID IDs, Pi project-local sessions | Nanobot workspace/config path mapping | n/a |
| Event/trace | `event.envelope`, `event.log`, `trace.recorder` | common envelope, memory/JSONL trace/event logs | SyncEvent bridge, debug surface | runtime event bridge, debug surface | Nanobot bus/debug bridge | n/a |
| Session | `session.reader`, `session.writer`, `session.store`, `session.event-log`, `session.branch-graph`, `session.projector`, `session.message-part-projector`, `session.pagination`, `session.context-selector`, `session.compaction-records`, `session.diff` | memory store, common projector, common message part projector, cursor/chronological paging, transcript/context selectors | projection writer/store, MessageV2/SyncEvent projector, message part projector, update-time cursor paging, fork-before-message | JSONL tree store, v1/v2/v3 migrator, message part projector, active-leaf path, branch summary | JSONL session store/projector, message part projector, channel-key graph, max-message context, goal state | `pack.session-memory` |
| Hooks/registries | `hook.bus`, `hook.observer-chain`, `hook.handler-chain`, `hook.scheduler`, `hook.cleanup-scope`, `hook.error-policy`, `tool.registry`, `registry.command`, `registry.provider`, `registry.ui` | source-ordered bus/chains, serial/parallel/source scheduler, common registries | plugin loader, manifest normalizer, event mapper, registry/permission/provider/UI bridges | extension loader, TypeBox bridge, event mapper, dynamic tool/runtime/UI bridges | plugin loader, event mapper, tool/provider/UI bridges | plugin/extension compatibility shims |
| Turn pipeline | `turn.input-normalizer`, `turn.context-builder`, `turn.prompt-assembler`, `turn.provider-request-builder`, `turn.provider-stream-runner`, `turn.stream-reducer`, `turn.tool-call-planner`, `turn.tool-executor`, `turn.result-recorder`, `turn.retry-policy`, `turn.continuation-policy`, `turn.compaction-policy`, `turn.stop-condition`, `agent-loop.request-boundary`, `agent-loop.final-summary` | text input, transcript context, common prompt/request/reducer/executor/recorder, fixed/exponential retry, synthetic continue, token/manual compaction, default request/final-summary policies | prompt/processor compatibility strategies, OpenCode turn defaults, native-like request/final summary policies | AgentHarness compatibility strategies, Pi turn defaults, native-like request/final summary policies | Nanobot runtime-context injection, max-iteration/message/tool-result defaults, native-like request/final summary policies | n/a |
| Tools | `tool.definition`, `tool.schema-adapter`, `tools.schema`, `tools.batch-scheduler`, `tool.permission-policy`, `tool.executor`, `tool.result-normalizer`, `tools.result-projector`, `tool.audit-log`, `filesystem.port`, `process-runner.port` | JSON Schema/TypeBox/Zod/Effect/plain adapters, schema snapshots, batch scheduler, allow/deny/ask/workspace policies, local/memory/readonly/scoped fs, local/disabled/dry-run/sandbox process runners | OpenCode permission/render/schema/result/batch bridges | Pi tool/event/render/schema/result/batch bridges | Nanobot tool schema/permission/result/progress/batch bridges | `tool-pack.echo`, `tool-pack.filesystem`, `tool-pack.shell`, `tool-pack.meta` |
| Provider | `provider.transport`, `provider.auth`, `provider.model-registry`, `provider.request-shape`, `provider.stream-parser`, `provider.streaming-delta-recorder`, `provider.event-normalizer`, `provider.usage-normalizer`, `provider.cassette`, `provider.stream`, `provider.stream-projector` | fetch transport, test-only mock transport, cassette replay, API key/bearer/query auth, static/env registry, delta recorder, common usage/cost, common stream facade/projector | OpenCode provider descriptors, delta projector, and option hooks | Pi provider descriptors, delta projector, and extension hooks | Nanobot provider descriptors/options/usage/delta bridge | provider packs/presets: OpenAI-compatible, OpenRouter, Anthropic, Google |
| Config/prompt/resources | `config.source`, `config.merge-strategy`, `config.validator`, `resource.discovery`, `prompt.resource-loader`, `prompt.system-builder`, `prompt.tool-renderer`, `prompt.model-capability-adapter`, `prompt.compaction-adapter` | env/file/CLI sources, merge/validation, filesystem resource discovery, common prompt/tool/model renderers | OpenCode config/prompt profiles, modes, rules, plugin prompt resources | Pi config/prompt profiles, skills, themes, extension resources | Nanobot `~/.nanobot/config.json`, env refs, root bootstrap templates, skills, agent prompt defaults | n/a |
| UI/control | `ui.event-loop`, `ui.renderer`, `ui.command-router`, `ui.theme-registry`, `ui.input-normalizer`, `ui.snapshot` | shared TUI event loop, text/no-op renderers, command/theme/input/snapshot atoms | OpenCode UI profile plus TUI/Web/Desktop/Slack adapters | Pi UI profile plus TUI/RPC/Web/package/release adapters | Nanobot UI profile plus TUI/Web/API adapters | OpenCode/Pi/Nanobot product shells |
| Product shells | `product.shell` entries consume declared ports | minimal CLI shell | `opencode.harness/sdk/server/workspace/control-plane/tui/web/desktop/slack` | `pi.harness/sdk/cli/tui/rpc/web-ui/server/package-manager/extension-examples/browser-smoke/release-hardening` | `nanobot.harness/sdk/cli/tui/web-ui/server` | product shells are not common atoms |

### 4.0.1 Foundation And Block Metadata

| Port | Purpose | Common Implementations | Personality Implementations |
| --- | --- | --- | --- |
| `block.manifest` | Validate a block's id, version, type, layer, personality, capabilities, lifecycle, resources, and conformance refs. | manifest schema, manifest normalizer | OpenCode compatibility metadata, Pi compatibility metadata |
| `capability.ref` | Normalize provides/requires/optional capability references for recipes, manifests, and lockfiles. | capability ref normalizer | product capability aliases |
| `resource.grant` | Validate resource declarations against recipe grants before side-effect atoms run. | grant validator | product default grants |
| `recipe.binding` | Materialize the `port -> atom` choice that recipes and lockfiles use as the single source of truth. | lockfile binding planner | product binding aliases/defaults |
| `conformance.ref` | Link a port or atom to its independent test suite, fixture replay, or product recipe gate. | fixture registry | product conformance gates |

### 4.0.2 Runtime Composition

| Port | Purpose | Common Implementations | Personality Implementations |
| --- | --- | --- | --- |
| `runtime.module-catalog` | Register and list module, atom, pack, and product-shell manifests. | in-memory catalog | OpenCode module aliases, Pi module aliases, Nanobot module aliases |
| `runtime.capability-resolver` | Validate required capabilities, optional fallbacks, dependency order, and ambiguity. | default resolver | product capability aliases |
| `runtime.binding-planner` | Produce deterministic binding evidence for explicit and implicit recipe edges. | lockfile binding planner | product defaults |
| `runtime.lifecycle-runner` | Init/start modules and dispose process/workspace/session/turn/tool-call scopes. | scoped lifecycle runner | product lifecycle defaults |
| `runtime.assembly-graph` | Emit recipe graph and lockfile views for audit, docs, CLI, and replay diagnostics. | lockfile assembly graph | product graph labels |
| `runtime.acceptance-controller` | Decide accept, continue, summarize, fail, or inconclusive from task policy evidence. | default policy validator | product-native acceptance and early-stop controllers |
| `runtime.acceptance-evidence` | Normalize task policy, workspace diff, tool evidence, visible summary, and forbidden/required checks before acceptance. | default evidence normalizer | product-native acceptance evidence atoms selected by recipe binding |

### 4.1 Identity And Time

| Port | Purpose | Common Implementations | Personality Implementations |
| --- | --- | --- | --- |
| `identity.id-generator` | Generate stable IDs for sessions/messages/parts/tool calls. | deterministic, random-id | OpenCode `ses_` style, Pi UUID style, Nanobot session keys |
| `identity.clock` | Provide timestamps for sessions/events/messages. | system clock, deterministic clock | product-specific timestamp formatting |
| `identity.workspace-resolver` | Resolve workspace/project identity. | cwd workspace, configured workspace | OpenCode project/workspace mapping, Pi project-local sessions |

### 4.2 Event And Trace

| Port | Purpose | Common Implementations | Personality Implementations |
| --- | --- | --- | --- |
| `event.envelope` | Normalize event metadata. | common envelope builder | OpenCode SyncEvent bridge, Pi runtime event bridge, Nanobot bus event bridge |
| `event.log` | Append/read event stream. | in-memory, JSONL, SQLite | OpenCode projection log, Pi session runtime log |
| `trace.recorder` | Record assembly/turn/tool traces. | in-memory trace, JSONL trace | product debug surface adapters |

Runtime composition is also split into lego-shaped internals:

- `runtime.module-catalog`: register and list available module manifests.
- `runtime.capability-resolver`: validate required capabilities and produce deterministic dependency order.
- `runtime.binding-planner`: materialize recipe `port -> atom` edges and ambiguity evidence.
- `runtime.lifecycle-runner`: init/start resolved modules, register capability services, and dispose process/workspace/session/turn/tool-call scopes from narrow to broad.
- `runtime.assembly-graph`: emit graph and lockfile views for audits and dry-run assembly.

### 4.3 Session Plane

| Port | Purpose | Common Implementations | Personality Implementations |
| --- | --- | --- | --- |
| `session.id-generator` | Generate session IDs behind the session plane, including deterministic test ids and product-shaped IDs. | deterministic session id generator | OpenCode `ses_` session ids, Pi UUID session ids |
| `session.reader` | Read session metadata and transcript. | common transcript reader | OpenCode SDK reader, Pi session manager reader |
| `session.writer` | Append/update messages and parts. | common message writer | OpenCode projection writer, Pi append-only writer |
| `session.store` | Persist session state. | memory store, JSONL store, SQLite store | OpenCode SQLite projection, Pi JSONL v3 store, Nanobot JSONL session store |
| `session.event-log` | Persist raw events before projection. | memory event log, JSONL event log | OpenCode SyncEvent log, Pi runtime event log |
| `session.message-store` | Own message/part append, update, remove, and transcript readback operations. | memory message store, service-backed message store | product storage writers behind the common store contract |
| `session.branching` | Provide fork, branch, and diff operations while the branch graph is being split into smaller atoms. | memory branching, service-backed branching | OpenCode fork behavior, Pi branch behavior |
| `session.branch-graph` | Manage parent/child message/session graph. | common branch graph | OpenCode fork-before-message, Pi leaf tree |
| `session.projector` | Convert raw product data into common transcript. | common event projector | OpenCode MessageV2 projector, Pi v1/v2/v3 migrator, Nanobot JSONL projector |
| `session.message-part-projector` | Project common transcript parts into product-native part/event types with lossiness annotations. | common part projector | OpenCode SQLite parts, Pi message updates, Nanobot assistant/tool deltas |
| `session.pagination` | Page transcript messages. | cursor paging, chronological paging | OpenCode update-time/id paging, Pi active-path paging |
| `session.context-selector` | Select provider context. | full transcript, active branch, compacted context | Pi active leaf path, OpenCode prompt context |
| `session.compaction-records` | Persist compaction summary and retained messages. | common compaction record | OpenCode compaction event, Pi branch summary |
| `session.diff` | Compare forks/branches/snapshots. | common message diff | OpenCode session diff, Pi branch diff |

### 4.4 Hook And Registry Plane

| Port | Purpose | Common Implementations | Personality Implementations |
| --- | --- | --- | --- |
| `hook.bus` | Emit product-neutral lifecycle events. | ordered hook bus | OpenCode plugin event bridge, Pi extension event bridge, Nanobot plugin/event bridge |
| `hook.observer-chain` | Observe without handling. | source-ordered observers | plugin/extension ordering adapters |
| `hook.handler-chain` | Mutate, block, cancel, or handle events. | source-ordered handlers | OpenCode/Pi semantic mappers |
| `hook.scheduler` | Control async execution and ordering. | serial, parallel, source-ordered | product compatibility scheduler |
| `hook.cleanup-scope` | Dispose scoped handlers. | process/workspace/session scopes | plugin hot-reload cleanup, extension cleanup |
| `hook.error-policy` | Continue or fail on hook errors. | fail-fast, collect-and-continue | product-specific defaults |
| `tool.registry` | Register tools dynamically. | common tool registry | OpenCode `tool.definition` plus `invalid/question` builtin registry entries, Pi `registerTool` |
| `registry.command` | Register commands. | common command registry | OpenCode commands, Pi commands |
| `registry.provider` | Register provider descriptors. | common provider registry | OpenCode provider plugins, Pi providers |
| `registry.ui` | Register renderers/UI providers. | common UI registry | OpenCode UI providers, Pi message renderers |

The executable hook atom layer lives in `packages/lego-hooks/src/hook-atoms.ts`. It exports source-ordered, serial, and parallel schedulers; observer and handler chains; collect-and-continue and fail-fast error policies; cleanup scopes; the event bus facade; and source-aware tool, command, provider, and UI registry atoms. `LegoHookHost` remains the compatibility surface, but now delegates to these atoms instead of hiding bus, registry, cleanup, and error behavior inside one class.

The product personality hook adapters are also split into atoms. `packages/adapters-opencode/src/plugin-atoms.ts` exports OpenCode plugin loader, manifest normalizer, event mapper, registry bridge, permission bridge, experimental workspace bridge, and shell bridge atoms. `packages/adapters-pi/src/extension-atoms.ts` exports Pi extension loader, manifest normalizer, event mapper, TypeBox/schema bridge, dynamic registry/tool bridge, context bridge, and runtime event bridge atoms. `packages/adapters-nanobot/src/nanobot-atoms.ts` now mirrors that split with plugin manifest normalization, API factory, event mapper, registry bridge, runtime event bridge, context bridge, and tool schema bridge atoms. The legacy adapter entrypoints delegate to those atoms so existing recipes keep working while future recipes can bind personality behavior explicitly.

### 4.5 Turn Pipeline

| Port | Purpose | Common Implementations | Personality Implementations |
| --- | --- | --- | --- |
| `turn.input-normalizer` | Convert user/product input into common turn input. | text input normalizer | OpenCode chat input, Pi CLI/TUI input, Nanobot CLI/channel input |
| `turn.context-builder` | Build provider context from session state. | transcript context builder | OpenCode prompt context, Pi active branch context |
| `turn.prompt-assembler` | Build system/developer/tool instructions. | common prompt assembler | OpenCode mode prompt, Pi coding-agent prompt |
| `turn.provider-request-builder` | Shape a provider request. | common request builder | provider/personality-specific request strategies |
| `turn.provider-stream-runner` | Execute provider stream. | common stream runner | product instrumentation adapters |
| `turn.stream-reducer` | Convert provider stream events into message parts. | common reducer | provider-specific event reducers |
| `turn.tool-call-planner` | Decide tool call execution ordering. | ordered, parallel-batch | product compatibility planner |
| `turn.tool-executor` | Execute approved tool calls. | common executor | product-rendered execution hooks |
| `turn.result-recorder` | Persist assistant/tool results. | common recorder | OpenCode projection recorder, Pi JSONL recorder |
| `turn.retry-policy` | Decide retry/backoff behavior. | none, fixed, exponential | product defaults |
| `turn.continuation-policy` | Handle `length` or continuation finish reasons. | none, synthetic-continue | OpenCode/Pi compatibility strategies |
| `turn.compaction-policy` | Trigger/contextualize compaction. | token threshold, manual | product-specific compaction semantics |
| `turn.stop-condition` | End or continue multi-step loop. | no-tool-calls, max-steps | product compatibility stop logic |
| `agent-loop.request-boundary` | Decide provider request boundaries after stream/tool/acceptance events. | default boundary policy | OpenCode/Pi/Nanobot/Hermes native-like request boundary policies |
| `agent-loop.final-summary` | Decide whether accepted tool results need no summary, concise summary, native final message, or a forced provider round. | default final summary policy | OpenCode/Pi/Nanobot/Hermes native-like final response policies |

`packages/lego-agent-loop/src/pipeline/*` owns the explicit turn pipeline catalog, strategy selector, and trace emitter, while `product-turn/*` owns OpenCode/Pi/Nanobot/Hermes turn profiles. `cadence/*` owns request-boundary, tool-batch, final-summary, and descriptor generation. `ports/*` owns the fixture catalog. The legacy files `pipeline.ts`, `product-turn-atoms.ts`, `cadence-policies.ts`, and `port-fixtures.ts` are compatibility shims over those source groups. The running loop emits `turn.pipeline.trace` from every listed atom so conformance can compare provider request shaping, stream reduction, tool planning/execution, retry, continuation, compaction, stop, and result recording behavior across product personalities. `selectTurnPipelineStrategies` makes OpenCode/Pi/neutral strategy choices explicit, and `packages/recipes/src/pipeline-swaps.ts` records recipe-level swaps for OpenCode + Pi continuation policy, Pi + OpenCode cursor context, and neutral minimal policy sets. OpenCode now selects a `turn.result-recorder` submodule that exposes native logical assistant parts (`step-start`, `reasoning`, `text`, `step-finish`), Pi keeps its native text-first part stream, Nanobot injects runtime metadata into the user turn with its upstream-style max iteration, replay, and tool-result limits, and Hermes uses its sequential persistent turn profile behind the same ports.

### 4.6 Tool Plane

| Port | Purpose | Common Implementations | Personality Implementations |
| --- | --- | --- | --- |
| `tools` | Pack-level tool selection port used alongside atom-level `tool.*`, `filesystem.port`, and `process-runner.port` bindings. | echo/filesystem/shell/meta packs | OpenCode/Pi compatibility tool-pack bridges |
| `tool.definition` | Describe one callable tool. | common tool definition | product schema/render bridges |
| `tool.schema-adapter` | Normalize parameter schemas. | JSON Schema, TypeBox-like, Zod-like, Effect-like | product-native schema bridge |
| `tools.schema` | Snapshot provider-visible tool names, aliases, required fields, and mutation class. | common tool schema snapshot | OpenCode/Pi/Nanobot native-like schema snapshots |
| `tools.batch-scheduler` | Plan parallel, sequential, native-order, or dependency-aware tool batches. | default batch scheduler | OpenCode/Pi/Nanobot native-like batch schedulers |
| `tool.permission-policy` | Allow, deny, or ask before execution. | allow, deny, ask-hook, workspace-scope | OpenCode/Pi/Nanobot permission defaults |
| `tool.executor` | Run a tool. | in-process executor | product-specific wrappers |
| `tool.result-normalizer` | Normalize tool output. | text/json/error normalizer | product rendering adapters |
| `tools.result-projector` | Project common tool results into product-native result envelopes. | common result projector | OpenCode/Pi/Nanobot native-like result projectors |
| `tool.audit-log` | Record tool execution facts. | in-memory/JSONL audit | product status surfaces |
| `filesystem.port` | Read/write workspace files. | local, memory, read-only, scoped | product workspace adapters |
| `process-runner.port` | Execute shell/process commands. | disabled, dry-run, local | product/sandbox adapters |

Tool packs:

- `tool-pack.echo`
- `tool-pack.filesystem`
- `tool-pack.shell`
- `tool-pack.meta`

The first machine-readable slice of this plane lives in `packages/lego-tools/src/tool-atoms.ts`. It exports the six tool atom types, the four default pack manifests, filesystem/process-runner replacement matrices, schema adapter variants, permission policy variants, and pack factories that return the current default `LegoToolDefinition`s.
The executable port layer lives in `packages/lego-tools/src/ports.ts`. File tools resolve `filesystem.port`, bash resolves `process-runner.port`, and permission preflight resolves `tool.permission-policy` from hook services. The harness installs recipe-selected defaults, while tests can swap memory/read-only filesystem ports, dry-run/disabled process runners, and allow/deny/ask/workspace/personality permission policy atoms.
Assembled product defaults now narrow the registry to native shapes: OpenCode uses `bash`, `edit`, `glob`, `grep`, `read`, `skill`, `task`, `todowrite`, `webfetch`, and `write`; Pi uses `bash`, `edit`, `read`, and `write`.

### 4.7 Provider Plane

| Port | Purpose | Common Implementations | Personality Implementations |
| --- | --- | --- | --- |
| `provider.transport` | Send HTTP/SSE or recorded provider traffic. | fetch, mock SSE, cassette | product instrumentation transport |
| `provider.auth` | Add credentials without leaking them into artifacts. | API key, bearer, query key | provider-specific auth atoms |
| `provider.model-registry` | List/select model metadata. | static, env, remote cache | OpenCode provider plugin registry, Pi provider registry |
| `provider.request-shape` | Convert common request to provider body. | OpenAI-compatible, Anthropic, Google | provider personality presets |
| `provider.stream-parser` | Parse provider stream chunks. | SSE parser, JSON stream parser | provider-specific parser |
| `provider.streaming-delta-recorder` | Record chunk-level stream delta signatures for cassette and diagnosis. | common delta recorder | product-native stream delta observers |
| `provider.event-normalizer` | Convert provider deltas to common events. | common normalizer | provider-specific finish/tool/reasoning mapping |
| `provider.usage-normalizer` | Normalize tokens/cost/cache/reasoning usage. | common usage mapper | provider-specific usage mapper |
| `provider.cassette` | Store/replay sanitized provider stream. | JSONL cassette | live parity cassette generator |
| `provider.stream` | Expose normalized streaming provider events to the agent loop after transport, parser, and normalization atoms run. | common stream facade plus internal fixture/cassette replay | OpenAI-compatible, OpenRouter, Anthropic, Google provider personalities |
| `provider.stream-projector` | Project normalized provider events into product-native stream protocols with projection-gap annotations. | common stream projector | OpenCode/Pi/Nanobot native-like stream projectors |

`packages/lego-provider/src/ports.ts` is the executable provider port layer. It exports fetch/mock/cassette transports, auth header generation, static model registry, request-shape and stream-parser interfaces, an event normalizer, a usage/cost normalizer, and sanitized recording/replay cassette support. OpenAI-compatible, OpenRouter, Anthropic, and Google provider personalities now all run through those ports, so transport/auth/model/request/parser/normalizer atoms can be swapped without changing provider personality code. Anthropic Messages transport uses the native `/v1` base URL plus `/messages` endpoint policy expected by OpenCode's AI SDK path. Pi's native CLI capture keeps a product-specific endpoint submodule under the same provider category because upstream Pi accepts the proxy root in `models.json` and appends the Anthropic path internally. `packages/recipes/src/live-provider-parity.ts` sits one layer above this as recipe evidence atoms: credential gate, live runner, artifact writer, artifact verifier, and cassette generator.

### 4.8 Prompt, Config, And Resources

| Port | Purpose | Common Implementations | Personality Implementations |
| --- | --- | --- | --- |
| `config.source` | Load config from env/files/CLI/workspace. | env, file, CLI override | OpenCode config files, Pi config files |
| `config.merge-strategy` | Merge layered config. | deep merge, replace, priority merge | product-specific precedence |
| `config.validator` | Validate config. | schema validator | product-specific compatibility validator |
| `resource.discovery` | Discover rules/prompts/skills/themes/assets. | filesystem discovery | OpenCode prompt files, Pi skills/themes |
| `prompt.resource-loader` | Load prompt resources. | text/markdown loader | product conventions |
| `prompt.system-builder` | Build system prompt. | common builder | OpenCode modes, Pi coding-agent prompt |
| `prompt.tool-renderer` | Render available tools into prompt. | common renderer | provider/product-specific renderer |
| `prompt.model-capability-adapter` | Adapt prompt to model capabilities. | capability-aware renderer | provider-specific quirks |
| `prompt.compaction-adapter` | Adapt compaction summaries and retained context into provider-ready prompts or continuation instructions. | common compaction prompt adapter | OpenCode compaction prompt, Pi branch-summary prompt |

`packages/lego-config/src/config-atoms.ts` is the executable config atom layer. It exports source ports for env, file, workspace, user, CLI override, static defaults, merge strategies, validators, config file discovery helpers, product config profiles, and `${ENV}` reference resolution used by Nanobot config files; `LegoConfigService` now acts as the product-compatible facade over those atoms.

`packages/lego-prompt/src/prompt-atoms.ts` is the executable prompt/resource atom layer. It exports the resource loader, filesystem discovery, OpenCode/Pi/Nanobot conventional resource discovery, product prompt profiles, system prompt builder, tool renderer, model capability adapter, compaction adapter, and prompt resource normalization helpers; `LegoPromptService` now acts as the product-compatible facade over those atoms.

### 4.9 UI And Control Surface

| Port | Purpose | Common Implementations | Personality Implementations |
| --- | --- | --- | --- |
| `ui.event-loop` | Process UI commands and state transitions. | shared TUI event loop | OpenCode/Pi/Nanobot compatibility adapters |
| `ui.renderer` | Render transcript/tool/status. | text renderer, no-op renderer | OpenCode/Pi renderers |
| `ui.command-router` | Route slash commands/actions. | common router | product command adapters |
| `ui.theme-registry` | Register/select themes. | common theme registry | Pi themes, OpenCode themes |
| `ui.input-normalizer` | Normalize key/input events. | common key/input normalizer | product TUI adapters |
| `ui.snapshot` | Produce UI state for tests/servers. | common snapshot | product UI snapshots |

`packages/lego-ui/src/ui-atoms.ts` is the executable UI atom layer. It exports the shared TUI event loop, renderer registry, command router, theme registry, input normalizer, snapshot atom, and OpenCode/Pi/Nanobot UI product profiles; `NoopUI`, `TransportUI`, and `createTUIEventLoop` remain product-compatible facades over those blocks.

### 4.10 Product Shells

Product shells are intentionally not common behavior. They expose assembled ports to users.

| Port | Purpose | Common Implementations | Personality Implementations |
| --- | --- | --- | --- |
| `product.shell` | Expose assembled ports through SDK/CLI/TUI/RPC/Web/server/product entrypoints without owning common behavior. | minimal CLI shell | OpenCode SDK/server/TUI/Web/Desktop/Slack, Pi SDK/CLI/TUI/RPC/Web/server/package/release shells, Hermes SDK/CLI/TUI/ACP/gateway/web/API shells |

OpenCode shells:

- `opencode.product-shell.sdk`
- `opencode.product-shell.server`
- `opencode.product-shell.workspace`
- `opencode.product-shell.control-plane`
- `opencode.product-shell.tui`
- `opencode.product-shell.web`
- `opencode.product-shell.desktop`
- `opencode.product-shell.slack`

These OpenCode shells now have executable modules and public package routes: `@helix/adapters-opencode/opencode-sdk`, `/opencode-server`, `/opencode-workspace`, `/opencode-control-plane`, `/opencode-tui`, `/opencode-web`, `/opencode-desktop`, and `/opencode-slack`. `@helix/adapters-opencode/product-surface` remains the registration and compatibility facade.

Pi shells:

- `pi.product-shell.sdk`
- `pi.product-shell.cli`
- `pi.product-shell.tui`
- `pi.product-shell.rpc`
- `pi.product-shell.web-ui`
- `pi.product-shell.server`
- `pi.product-shell.package-manager`
- `pi.product-shell.extension-examples`
- `pi.product-shell.browser-smoke`
- `pi.product-shell.release-hardening`

These Pi shells now have executable modules and public package routes: `@helix/adapters-pi/pi-sdk`, `/pi-cli`, `/pi-tui`, `/pi-rpc`, `/pi-web-ui`, `/pi-server`, `/pi-package-manager`, `/pi-extension-examples`, `/pi-browser-smoke`, and `/pi-release-hardening`. `@helix/adapters-pi/product-surface` remains the registration and compatibility facade.

Nanobot shells:

- `nanobot.product-shell.sdk`
- `nanobot.product-shell.cli`
- `nanobot.product-shell.tui`
- `nanobot.product-shell.web-ui`
- `nanobot.product-shell.server`

These Nanobot shells have executable modules and public package routes: `@helix/adapters-nanobot/nanobot-sdk`, `/nanobot-cli`, `/nanobot-tui`, `/nanobot-web-ui`, `/nanobot-server`, and `/product-surface`. `@helix/adapters-nanobot` is the package root for the Nanobot personality and thin shell registration.

Hermes shells:

- `hermes.product-shell.sdk`
- `hermes.product-shell.cli`
- `hermes.product-shell.tui`
- `hermes.product-shell.acp`
- `hermes.product-shell.gateway`
- `hermes.product-shell.web-dashboard`
- `hermes.product-shell.api-server`

These Hermes shells have executable modules and public package routes: `@helix/adapters-hermes/hermes-sdk`, `/hermes-cli`, `/hermes-tui`, `/hermes-acp`, `/hermes-gateway`, `/hermes-web-dashboard`, `/hermes-api-server`, and `/product-surface`. `@helix/adapters-hermes/product-surface` remains the registration facade over `src/surfaces/*`, while `@helix/adapters-hermes/hermes-atoms` remains a compatibility route over plugin, tool, prompt, provider, and session atom child modules.

## 5. Common vs Personality Split

| Area | Common Lego Blocks | OpenCode Personality Blocks | Pi Mono Personality Blocks | Nanobot Personality Blocks | Hermes Personality Blocks |
| --- | --- | --- | --- | --- | --- |
| Session | reader/writer/store/branch/projector/context ports and common implementations | SyncEvent projector, MessageV2 adapter, fork/paging compatibility | JSONL v3 store, v1/v2 migrator, active leaf path | JSONL store/projector, channel-key graph, max-message context | SQLite/FTS store descriptor and message projection cadence |
| Hooks | bus, observer/handler chains, cleanup, registries | plugin loader, event mapper, provider/auth/UI plugin bridge | extension loader, TypeBox bridge, dynamic tool/runtime bridge | plugin loader, event mapper, tool/provider/UI bridge | plugin loader/API bridge and hook event naming |
| Turn loop | pipeline ports, retry/continuation/compaction strategies | prompt/processor compatibility strategies | AgentHarness compatibility strategies | agent-loop prompt/context/result strategies | Hermes cadence, acceptance, and finalization profile |
| Tools | tool definitions, schema adapters, permission policies, fs/process ports | OpenCode permission/render bridges | Pi tool/event/render bridges | Nanobot schema/permission/result/progress bridges | tool registry schema/dispatch normalization |
| Provider | transport/auth/model/request/stream/usage ports | OpenCode provider plugin descriptors | Pi provider extension descriptors | Nanobot provider descriptor/options/usage bridges | models.dev/provider overlay descriptor |
| Prompt/config | layered config, resource discovery, system builder | OpenCode config/prompt conventions | Pi config/skills/themes conventions | Nanobot config/templates/skills conventions | stable/context/volatile prompt builder descriptor |
| UI | event loop, renderer, command router, theme registry | OpenCode TUI/Web/Desktop/Slack shells | Pi TUI/RPC/Web/package/release shells | Nanobot CLI/TUI/Web/API shells | CLI/TUI/ACP/gateway/Web/API shells |

## 6. Assembly Examples

### 6.1 OpenCode Full

```text
recipe opencode.full
  modules                     -> []
  atoms                       -> common atoms + OpenCode personality atoms
  session.store               -> opencode.session.store.sqlite-projection
  session.projector           -> opencode.session.projector.message-v2
  session.pagination          -> opencode.session.pagination.update-time-cursor
  hook.bus                    -> opencode.plugin.loader
  hook.handler-chain          -> opencode.plugin.event-mapper
  tool.registry               -> opencode.plugin.registry-bridge
  registry.provider           -> opencode.plugin.provider-registry-bridge
  turn.context-builder        -> opencode.turn.context-builder
  turn.continuation-policy    -> opencode.turn.continuation-policy
  tools                       -> tool-pack.shell
  tool.permission-policy      -> opencode.plugin.permission-bridge
  tool.executor               -> tool.executor.default
  tool.result-normalizer      -> opencode.tool.result-render-bridge
  tool.audit-log              -> opencode.tool.status-bridge
  provider.request-shape      -> provider.request-shape.openai-compatible
  provider.event-normalizer   -> provider.event-normalizer.openai-compatible
  ui.event-loop               -> ui.event-loop.shared-tui
  product shells              -> opencode sdk/server/workspace/control-plane/tui/web/desktop/slack
```

### 6.2 Pi Mono Full

```text
recipe pi-mono.full
  modules                     -> []
  atoms                       -> common atoms + Pi personality atoms
  session.store               -> pi.session.store.jsonl-v3
  session.projector           -> pi.session.projector.jsonl-v3
  session.pagination          -> pi.session.pagination.active-path
  session.context-selector    -> pi.session.context-selector.active-leaf
  hook.bus                    -> pi.extension.loader
  hook.handler-chain          -> pi.extension.event-mapper
  tool.registry               -> pi.extension.dynamic-tool-bridge
  registry.provider           -> pi.extension.provider-registry-bridge
  turn.context-builder        -> pi.turn.context-builder
  turn.continuation-policy    -> pi.turn.continuation-policy
  tools                       -> tool-pack.shell
  tool.permission-policy      -> pi.permission.event-bridge
  tool.executor               -> tool.executor.default
  tool.result-normalizer      -> pi.tool.result-event-bridge
  tool.audit-log              -> pi.tool.runtime-event-bridge
  provider.request-shape      -> provider.request-shape.anthropic
  provider.event-normalizer   -> provider.event-normalizer.anthropic
  ui.event-loop               -> ui.event-loop.shared-tui
  product shells              -> pi sdk/cli/tui/rpc/web/server/package/examples/browser/release
```

### 6.3 Neutral Minimal Agent

```text
recipe coding-agent.minimal
  modules                    -> []
  atoms                      -> common atoms only
  session.id-generator        -> session.id-generator.deterministic
  session.event-log           -> session.event-log.memory
  session.message-store       -> session.message-store.memory
  session.projector           -> session.projector.common-transcript
  session.context-selector    -> session.context-selector.memory
  tools                       -> tool-pack.echo
  tool.executor               -> tool.executor.echo-only
  provider.stream             -> provider.stream.openai-compatible
  product shell               -> product.shell.minimal-cli
```

The neutral recipe is important because it proves common lego blocks are not just OpenCode/Pi/Nanobot glue.

### 6.4 Nanobot Full

```text
recipe nanobot.full
  modules                     -> []
  atoms                       -> common atoms + Nanobot personality atoms
  session.store               -> nanobot.session.store.jsonl
  session.projector           -> nanobot.session.projector.jsonl
  session.pagination          -> nanobot.session.pagination.updated-at
  session.context-selector    -> nanobot.session.context-selector.max-messages
  hook.bus                    -> nanobot.plugin.loader
  hook.handler-chain          -> nanobot.plugin.event-mapper
  tool.registry               -> nanobot.tool.registry-bridge
  registry.provider           -> nanobot.plugin.provider-registry-bridge
  turn.context-builder        -> nanobot.turn.context-builder
  turn.continuation-policy    -> nanobot.turn.continuation-policy
  tools                       -> tool-pack.shell
  tool.permission-policy      -> nanobot.permission.policy-bridge
  tool.executor               -> tool.executor.default
  tool.result-normalizer      -> nanobot.tool.result-event-bridge
  tool.audit-log              -> nanobot.tool.progress-event-bridge
  provider.request-shape      -> nanobot.provider.request-options
  provider.event-normalizer   -> nanobot.provider.event-observer
  ui.event-loop               -> nanobot.tui.shell
  product shells              -> nanobot sdk/cli/tui/web-ui/server
```

The executable graph counts currently prove that these are atom-level assemblies rather than package-level recipes:

- `opencode.full`: 280 compiled graph nodes, 96 lockfile bindings, 271 atoms, 9 product shells, 0 package modules.
- `pi-mono.full`: 286 compiled graph nodes, 96 lockfile bindings, 275 atoms, 11 product shells, 0 package modules.
- `nanobot.full`: 276 compiled graph nodes, 96 lockfile bindings, 270 atoms, 6 product shells, 0 package modules.
- `coding-agent.minimal`: 177 compiled graph nodes, 32 lockfile bindings, 176 common atoms, 1 product shell, 0 package modules.

Current swap recipes prove the same graph can be re-bound without changing product code:

- `opencode.session-jsonl`: OpenCode shell with JSONL-tree session variant.
- `pi.session-projection`: Pi shell with event-projection session variant.
- `minimal.filesystem-tools`: neutral recipe with full common tool pack.
- `minimal.no-shell`: neutral recipe with echo-only tools and no shell resource.
- `opencode.echo-tools`: OpenCode shell with `tool-pack.echo` instead of default filesystem/shell tools.
- `pi.echo-tools`: Pi shell with `tool-pack.echo` instead of default filesystem/shell tools.

`packages/recipes/src/recipe-targets.ts` freezes the target shapes directly from the executable block inventory, and
`packages/recipes/src/recipes.ts` now consumes the same inventory through `packages/recipes/src/atom-catalog.ts`. The
primary recipes emit `opencode.full`, `pi-mono.full`, `nanobot.full`, and `coding-agent.minimal` as atom graphs; swap recipes change the
relevant binding only for session storage, tool packs, and provider/tool policies.

Recipe overrides are now a first-class dry-run helper rather than raw binding edits. `applyRecipeOverrides` can add the replacement module, remove existing providers for the same port, and pin the requested port as a recipe-level lockfile binding. Current override conformance covers storage, provider, permission policy, UI facade, and tool-pack replacement.

## 7. Composition Rules

- A common atom may depend only on contracts and declared common ports.
- A personality atom may implement or adapt a common port, but it must declare its personality.
- A product shell may depend on declared ports and personality atoms, but it should not implement common behavior.
- A pack expands into atoms; recipes and lockfiles should record the expanded atoms.
- A strategy atom should not own storage. It should receive storage through ports.
- Recipe-level strategies and policies should be diffable independently from package identity.
- A storage atom should not call providers, tools, or UI.
- Tool execution should depend on permission, filesystem, and process-runner ports, not direct globals.
- Provider atoms should not know about sessions. They emit normalized provider events only.
- UI atoms should consume state/events through ports, not reach into concrete session stores.
- Conformance should exist at the port level first, then product recipe level.
- Source boundary lint must keep common atoms, provider atoms, tool atoms, and product shells inside their declared dependency lanes.
- Atoms, packs, and product shells that are meant to be composed externally need a package root export or explicit subpath export; tests should import those public paths instead of reaching into package internals.
- Publishable package tarballs should be dry-run checked, and package dependency lanes should prevent common atoms or one product personality from carrying unrelated personality code.

## 8. First Implementation Target

The first modularity implementation target should be:

1. Add structure to manifests and capability references.
2. Introduce typed service tokens.
3. Generate an assembly lockfile showing every port binding.
4. Define port-level conformance suites for session, hook, turn, tool, provider, and UI.
5. Split `lego-session` internally into atoms first, without immediately moving files into many packages.

This gives the project a stable lego vocabulary before doing broad file movement.

## 9. Current Session Atom Slice

The first implemented atom slice keeps `lego-session` as one package but exposes port-level atoms from `packages/lego-session/src/atoms.ts`:

- `session.id-generator`: deterministic, OpenCode-style `ses_`, and Pi UUID-style generators.
- `session.event-log`: in-memory, append-only JSONL, and ProjectionSessionService-backed event log atoms.
- `session.reader`: service-backed read/list/messages/transcript atom.
- `session.writer`: service-backed create/touch/title/remove atom.
- `session.message-store`: service-backed and common in-memory message and part mutation atoms.
- `session.branching`: service-backed and common in-memory fork/branch/diff atoms.
- `session.projector`: common transcript, OpenCode SyncEvent, and Pi JSONL v1/v2/v3 migration projector atoms.
- `session.pagination`: service-backed and common in-memory cursor paging atoms.
- `session.context-selector`: service-backed full transcript/Pi active-branch selector plus common in-memory selector.

`packages/conformance/session-atoms.conformance.test.ts` is the first port-level suite proving these can be tested independently of the larger `SessionService` conformance.
`packages/conformance/hooks.conformance.test.ts` now includes direct atom-level coverage for hook bus, scheduler, observer/handler chains, cleanup scope, error-policy, and source-aware registries. It also keeps the hook strategy matrix for observe-only, mutation, cancel/handled short-circuiting, async cleanup, error-continue, and fail-fast behavior, then mounts the same common hook atom through an OpenCode plugin and a Pi extension to prove both personality surfaces can share the same hook bus semantics.
`packages/conformance/personality-adapters.conformance.test.ts` gates the OpenCode/Pi/Nanobot personality hook atoms directly: OpenCode plugin loading, manifest normalization, event mapping, registry/permission/workspace bridges; Pi extension loading, TypeBox/schema normalization, event mapping, dynamic registry/tool bridge, and runtime resource event emission; and Nanobot plugin loading, manifest normalization, event mapping, tool/command/provider/UI registry bridge, context bridge, and resource event emission.
`packages/conformance/tools.conformance.test.ts` now gates the tool atom catalog and default pack split through the public `@helix/lego-tools/tool-atoms` subpath. It verifies `tool.definition`, `tool.schema-adapter`, `tool.permission-policy`, `tool.executor`, `tool.result-normalizer`, `tool.audit-log`, the echo/filesystem/shell/meta pack membership, filesystem/process-runner port matrices, schema adapter matrices, permission policy matrices, and live port swaps for filesystem, process runner, and permission policy atoms.
`packages/conformance/provider.conformance.test.ts` now gates the executable provider port split: OpenAI-compatible, OpenRouter, Anthropic, and Google providers can swap transport, auth, model registry, request shape, stream parser, event normalizer, and cassette replay, and a provider parser matrix verifies reasoning, tool-use, finish reason, usage, and cost normalization behavior. `packages/conformance/live-provider-parity.conformance.test.ts` gates the higher-level parity atoms with local SSE live execution, artifact writer/verifier coverage, and sanitized cassette recording.
`packages/conformance/task-parity.conformance.test.ts` gates the real-task parity report layer. It runs 12 deterministic smoke fixtures through OpenCode/Pi/Nanobot assembled and original-contract modes, verifies output/artifact/trace/policy/env-allowlist/cost evidence plus provider retry, context compaction, task extension tools, and session fork evidence, writes offline artifacts, and checks the artifact verifier/diff path without credential-shaped fields. It also exercises the opt-in `task.runner.native-cli` prerequisite path for OpenCode, Pi, and Nanobot so live native sampling is separate from default offline contract replay.
The parity artifact layer now has a split JSON layout for task parity, native cadence fixtures, and live provider parity: stable summary JSON, structured evidence JSON, raw attachments, and a manifest with hashes and byte sizes. `packages/conformance/task-parity.conformance.test.ts` and `packages/conformance/live-provider-parity.conformance.test.ts` verify both legacy compatibility and split artifact integrity.
`packages/conformance/nanobot-lego-depth.conformance.test.ts` gates the Nanobot split-depth report, making Nanobot accountable to the same lego interface planes as OpenCode/Pi while still allowing product-specific atoms under those planes.
`packages/recipes/src/recipes.ts` now includes atom-level OpenCode, Pi, Nanobot, and neutral recipes plus swap recipes. The three primary recipes have empty `modules` arrays, explicit atom inventories, product shell lists, harness assembly atoms, and lockfile bindings for provider/hook/turn/tool decisions such as event normalizers, registries, executors, result normalizers, and audit logs. `packages/conformance/recipes.conformance.test.ts` dry-runs Pi/OpenCode session atom swaps, product tool-pack swaps, recipe override matrix cases, resource declarations, binding-level recipe diffs, route ownership for product-scoped atoms, harness assembly atoms, and strategy/policy diffs through recipe lockfile bindings.
`packages/conformance/boundary-lint.conformance.test.ts` gates product-specific leakage across common atoms, provider atoms, tool atoms, and product shell imports.
`packages/conformance/package-exports.conformance.test.ts` gates the publishing granularity: representative atoms, packs, and product shells must load through package exports such as `@helix/lego-session/atoms`, `@helix/lego-runtime/runtime-atoms`, `@helix/lego-hooks/hook-atoms`, `@helix/adapters-opencode/plugin-atoms`, `@helix/adapters-pi/extension-atoms`, `@helix/adapters-nanobot/nanobot-atoms`, `@helix/recipes/harness-atoms`, and product-surface subpaths, while tests are scanned for unexported deep package imports.
`packages/conformance/package-boundary.conformance.test.ts` gates package tarball and dependency boundaries with `npm pack --dry-run --json`, making sure exported entrypoints are included and common/personality package lanes stay separate.
`packages/conformance/modular-acceptance.conformance.test.ts` is the M12 gate: it verifies complete recipe conformance declarations for OpenCode, Pi, Nanobot, and the neutral recipe, maps current common atoms to independent suites, and validates the archived live provider artifact as product-level evidence.
`packages/conformance/surface-swap.conformance.test.ts` drives OpenCode and Pi TUI shells through the same `ui.event-loop` input trace, proving a shared UI atom can sit under both product personalities.
`packages/conformance/port-contract-fixtures.conformance.test.ts` gates the port contract fixture catalog. The exported fixtures now cover the common catalog planes for foundation metadata, runtime composition, identity/time, event/trace, session, hook/registry, turn pipeline, tool, provider, config, prompt/resource, UI, and product-shell ports, with lifecycle/resource/conformance/implementation/personality metadata for every port.
`packages/conformance/block-ledger.conformance.test.ts` is the block-first ledger gate. It parses this catalog, compares cataloged ports with executable port fixtures, verifies explicit recipe binding ports are cataloged, checks compiled recipe modules have public export routes or grouped product-shell/atom routes, and folds source-boundary leakage into one report.
`packages/conformance/personality-inventory.conformance.test.ts` gates the OpenCode/Pi/Nanobot difference classification. It requires SyncEvent/MessageV2 projection, OpenCode plugin loader/event/permission/provider/UI bridges, prompt/processor/provider descriptor strategies, runtime binding/lifecycle defaults, Pi JSONL v3/migrator and active-leaf context, extension loader/TypeBox/dynamic-tool/runtime-event bridges, AgentHarness prompt strategy, Nanobot session/plugin/tool/prompt/UI/runtime atoms, and provider descriptors to appear as personality atoms or product shells in the executable fixture inventory.
`packages/conformance/recipe-targets.conformance.test.ts` gates the atom-level recipe target shapes: OpenCode/Pi full targets must be common atoms plus their own personality atoms and product shells, the neutral target must carry no product personality, and the session/tool-pack/provider-transport swaps must be binding-only target changes.
`packages/conformance/pipeline-swaps.conformance.test.ts` gates recipe-level pipeline swaps as strategy selections rather than adapter conditionals.
`packages/conformance/product-shell-surfaces.conformance.test.ts` gates each product shell independently, separating OpenCode SDK/workspace/control-plane/TUI/Web/Desktop/Slack/server smoke from Pi SDK/CLI/TUI/RPC/Web/server/package/example/browser/release smoke.
`packages/docs-site/src/index.ts` now renders a Package Atoms panel, grouping every compiled recipe module under its package lane so the atom inventory can be scanned by package as well as by port binding and recipe diff. It also renders a Block Ledger panel showing cataloged/fixture/conformance/bound/export/leakage coverage from the same audit used by conformance. The generated builder workbench exposes browser-testable data attributes for presets, planes, ports, atoms, bindings, commands, diagnostics, and swap impact, and `packages/conformance/browser/builder-e2e.ts` drives the real browser export/import/CLI round-trip.
