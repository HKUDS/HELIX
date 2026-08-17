# Recipes

Recipes describe which lego modules and personalities are assembled into a product harness.

## Shape

```json
{
  "id": "opencode",
  "version": "0.1.0",
  "modules": [],
  "atoms": [
    { "id": "session.store.memory" },
    { "id": "opencode.session.store.sqlite-projection" },
    { "id": "opencode.plugin.loader" },
    { "id": "tool.executor.default" },
    { "id": "provider.event-normalizer.openai-compatible" }
  ],
  "productShells": [
    { "id": "opencode.product-shell.sdk" },
    { "id": "opencode.product-shell.server" }
  ],
  "bindings": [
    { "port": "session.store", "module": "opencode.session.store.sqlite-projection" },
    { "port": "hook.bus", "module": "opencode.plugin.loader" },
    { "port": "tool.executor", "module": "tool.executor.default" },
    { "port": "provider.event-normalizer", "module": "provider.event-normalizer.openai-compatible" }
  ],
  "requiredCapabilities": ["session.store", "hook.bus", "tool.executor", "provider.event-normalizer"],
  "personalities": ["opencode-session-personality", "opencode-plugin-personality"],
  "entrypoints": {
    "cli": "@helix/cli run opencode",
    "sdk": "hooks.services['opencode.sdk']",
    "server": "hooks.services['opencode.server.factory']"
  },
  "conformance": {
    "suite": ["session", "hooks", "agent-loop", "tools"]
  }
}
```

## Current Recipes

- `recipes/minimal/recipe.json`
- `recipes/opencode/recipe.json`
- `recipes/pi-mono/recipe.json`
- `recipes/opencode-pi-hybrid/recipe.json`
- `recipes/nanobot/recipe.json`
- `recipes/hermes-agent/recipe.json`
- `packages/recipes/src/recipes.ts` (`coding-agent.minimal`, `opencode`, `pi-mono`, `opencode-pi-hybrid`, `nanobot`, `hermes-agent`, and swap recipes)

The root JSON files are the public declarative artifacts. They are generated from the executable TypeScript recipe exports so users can inspect, validate, assemble, and version a recipe without importing the workspace package. The TypeScript recipe exports remain the in-repo source of truth used by tests, CLI commands, and docs generation.

`productShells` are entry surfaces inside one assembled harness, not separate harnesses. For example, an OpenCode harness can list SDK, TUI, Web, server, and other product shells in the same recipe; the `product.shell` binding chooses the primary shell used for port coverage, while `entrypoints` names every installed surface the user can launch.

`packages/recipes/src/compiler.ts` provides the runtime schema guard, dependency-checked recipe compiler, pack expansion, recipe override helper, and product recipe diff. The compiler turns a recipe into a module graph with common/personality module partitions.
It accepts `atoms`, `packs`, `bindings`, `scopes`, `resources`, `strategies`, `policies`, and `productShells`; packs expand into atom module refs, and the assembly lockfile records both expanded packs and port-to-module bindings so recipe validation can run as a dry-run before any product harness is started. The primary OpenCode, Pi, OpenCode/Pi hybrid, Nanobot, Hermes Agent, and neutral recipes now set `modules: []`, derive their atom inventories from `packages/recipes/src/atom-catalog.ts`, and use bindings for provider/hook/turn/tool choices including registries, event normalizers, executors, result normalizers, and audit logs. `applyRecipeOverrides` can inject replacement atoms, remove existing providers for the same port, and pin the replacement as a recipe-level required capability.

`packages/recipes/src/assembly-contract.ts` provides TODO-007 assembly contracts
for `opencode`, `pi-mono`, `opencode-pi-hybrid`, `nanobot`, `hermes-agent`, and `coding-agent.minimal`. It compiles
the recipe, joins it with port fixtures and product cadence/task descriptors,
classifies common/product/reserved/fixture-only atoms, emits swap-point metadata,
links task parity/native cadence evidence, and calculates stable fingerprints.
The CLI exposes this as:

```bash
npm run helix -- assemble \
  --product opencode,pi-mono,nanobot,minimal \
  --with-task-parity \
  --with-native-fixtures \
  --out-dir docs/reports \
  --strict \
  --json
```

The verifier rejects missing providers, binding/port drift, product leakage in
common atoms, missing product surfaces, missing required swap points, broken
fingerprints, missing required parity/native-fixture linkage, and credential-
shaped values.

`packages/recipes/src/flow-graph.ts` provides the TODO-025 information-flow
view over those contracts. It maps assembled atoms/ports and original fixture or
cadence evidence onto one canonical stage order, records hook boundaries on
edges, keeps prompt artifacts redacted to section/source summaries plus
fingerprints, and emits comparison diffs with observability lossiness. The CLI
can write the reusable docs artifacts:

```bash
npm run flow:graphs
```

That command writes `docs/reports/flow-graph-{product}.json` for every assembled
product preset and `docs/reports/flow-graph-compare-{product}-read-only-answer.json`
for OpenCode, Pi Mono, Nanobot, and Hermes Agent native comparisons. Each artifact
is immediately checked with `verify-flow-graph`, including schema fingerprints
and redaction guards for credential-shaped strings plus common raw prompt,
provider request/response, tool argument, and tool result payload field names.
Single native/compare graphs can also read a native cadence fixture or task
parity evidence artifact directly:

```bash
npm run helix -- flow-graph \
  --product opencode \
  --mode native \
  --task read-only-answer \
  --artifact docs/reports/task-parity-native-cadence-fixtures/manifest.json \
  --json
```

The `--artifact` input accepts legacy native fixture sets, legacy task parity
reports, split `summary.json`, or split `manifest.json`; split attachments are
verified against their recorded sha256 before they can become original-flow
evidence.
The online Flow Observer API uses the same manifest when it exists, returns a
small native evidence status with artifact path and hash metadata, and displays
`no native evidence linked` when a product/task has no matching native fixture
without blocking the assembled blueprint.
In Compare Native mode the dock can switch between side-by-side canonical stage
alignment, an overlay that stacks original and assembled evidence tracks, and a
diff table that lists stage status, metric summaries, owning plane, and candidate
atom hints without changing the main assembly board. Diff-table rows keep every
stage-level category as `data-flow-diff-category` chips, so multiple cadence
drifts on one stage are not collapsed into a single map entry. The browser
smoke covers provider request, tool sequence/batch, message part, stream, final
summary, and early-accept categories across native-fixture and task-parity-report
evidence sources, and it verifies that the selected edge inspector exposes a
product adapter source tag for hook handlers rather than only a generic source
path. The prompt inspector now renders an assembled-vs-original summary diff
without raw prompt text: matching native prompt artifacts can be compared by
fingerprint, while products that only expose prompt-stage events or no prompt
fixture are labeled `native-event-only` or `missing` and remain non-blocking
native parity evidence. Native hook evidence is now split between aggregated event taps when a
plugin/extension event is visible and explicit unobservable hook boundaries when
the original product exposes no hook event for that canonical edge. A dedicated
`flow-graph-compare.conformance.test.ts` gate now verifies that every product
comparison keeps assembled/original stage ids, order, lanes, planes, edge
sequence, diff anchors, and original evidence refs aligned. The shared flow
artifact verifier recomputes graph/comparison/run fingerprints, edge payload
fingerprints, prompt artifact hashes, and original evidence refs so serialized
flow JSON cannot silently drift from the evidence it claims to summarize.
Hermes Agent native-visible flow stays explicitly lossy in the UI: aggregated,
inferred, and unobservable stages are counted in the lossiness legend and shown
again in the selected-stage observability inspector.
The same observer toolbar can collapse individual information lanes
(`surface/session/prompt/provider/tool/runtime`). Blueprint and Trace keep each
lane as a horizontal track over the same 19 canonical stage columns, preserving a
collapsed header when a lane is hidden so the 2.5D graph does not reshuffle. A
toolbar toggle can flatten that same graph into pure 2D by removing perspective,
skew, shadow, and lane depth offsets without changing stage columns. Compare
drift stages keep their stage column, rise slightly with `data-flow-drift-node`,
and project into diff-table badges marked by `data-flow-drift-projection`.
Mobile viewports also receive a stage-list projection marked
`data-flow-mobile-stage-list`, using the same ordered canonical stages and the
same selected-stage inspector.
Blueprint/Trace stage nodes expose compact selected-assembly chips for primary
atom, primary port, atom scope, and replaceability, while long atom/port lists
remain in the inspector. Edge badges on those nodes summarize the outbound data
kind and hook count, while the inspector keeps the full hook chain, payload
fingerprint, and source metadata. Native/compare views carry a five-level
lossiness legend so inferred or unobservable original behavior is visible as a
first-class state instead of being presented as exact trace data.
Selecting a stage now exposes edge detail for adjacent boundaries: hook chain
order, payload fingerprint, transform/permission/early-stop capability, result
type, and source order/id/name/path/scope metadata are summarized without
showing handler implementation code. Trace mode also includes compact run
metrics for step/attempt, provider requests, tool batch, finish reason, token
estimate, and compaction status, with timeline events wired back to the matching
canonical stage selection. Harness `runTurn` and `runFixtureTurn` results expose
a summary-only `runtimeTrace` timeline for those same EventEnvelope stages,
redacting prompt text, provider requests, tool inputs/results, and host paths.
The trace also carries a hook source snapshot with per-event observer/handler
counts, source order/id/name/scope, and path fingerprints rather than handler
code or raw filesystem paths.
Prompt service builds return a summary-only artifact for the prompt.assemble
stage; harness turns emit it as `turn.pipeline.trace` with sections, resource
summaries, fingerprint, token estimate, product profile, and sanitized preview.
Builder-launched TUI sessions share that collector, write redacted
`runtime-traces.jsonl` records beside the TUI storage, and show the latest trace
summary in the TUI card.
Compare Native stage selection also shows a fix hint
for each diff, including owning plane, candidate assembled atom, confidence, and
a TODO-025 traceability link. The Flow Observer task selector is populated from
task parity coverage and passes the selected task through Trace, Native, and
Compare requests, letting the online API pick task-specific native cadence
fixtures such as `context-compaction`. The observer product selector can follow
the current Builder assembly or temporarily switch the flow view to another
product preset without mutating the recipe draft. The Builder right column has an
`Assembly Flow` tab that opens this observer as a dedicated inspection view while
leaving the main assembly board intact. The evidence selector now
switches Trace to the latest assembled run artifact returned by
`/api/harness-flow/run`, and switches Native/Compare between native cadence
fixtures and task parity reports. Native-capture artifacts remain disabled until
the upload/path selection and verification contract exists.

`packages/recipes/src/reverse-assembly.ts` provides `auditReverseAssembly`, which assembles OpenCode, Pi Mono, Nanobot, and Hermes Agent from their recipes and verifies product modules, runtime services, product-surface behavior, provider-backed product turns, internal deterministic hook fixtures, agent-loop semantic replay, real upstream fixture replay, pinned upstream e2e parity where upstream fixtures exist, recipe diff, and common-package boundary rules.
`packages/recipes/src/boundary-lint.ts` provides `auditSourceBoundaries`, the reusable source import gate for common atoms, provider atoms, tool atoms, and product shells.

Public composition entrypoints are also part of the recipe contract. The workspace package exports now expose stable subpaths for representative atoms, packs, ports, and product shells, including `@helix/lego-session/atoms`, `@helix/lego-session/message-part-projector`, `@helix/lego-runtime/port-fixtures`, `@helix/lego-runtime/runtime-atoms`, `@helix/lego-runtime/acceptance-controller`, `@helix/lego-config/config-atoms`, `@helix/lego-prompt/prompt-atoms`, `@helix/lego-ui/ui-atoms`, `@helix/lego-agent-loop/cadence-policies`, `@helix/lego-tools/default-tools`, `@helix/lego-tools/tool-atoms`, `@helix/lego-tools/ports`, `@helix/lego-tools/cadence-atoms`, `@helix/lego-provider/ports`, `@helix/lego-provider/streaming-delta-recorder`, `@helix/recipes/packs`, `@helix/recipes/harness-atoms`, `@helix/recipes/block-ledger`, `@helix/recipes/atom-catalog`, split OpenCode product shell entries (`@helix/adapters-opencode/opencode-sdk`, `/opencode-server`, `/opencode-workspace`, `/opencode-control-plane`, `/opencode-tui`, `/opencode-web`, `/opencode-desktop`, `/opencode-slack`), split Pi product shell entries (`@helix/adapters-pi/pi-sdk`, `/pi-cli`, `/pi-tui`, `/pi-rpc`, `/pi-web-ui`, `/pi-server`, `/pi-package-manager`, `/pi-extension-examples`, `/pi-browser-smoke`, `/pi-release-hardening`), split Nanobot entries (`@helix/adapters-nanobot/nanobot-sdk`, `/nanobot-cli`, `/nanobot-tui`, `/nanobot-web-ui`, `/nanobot-server`, `/nanobot-atoms`), split Hermes Agent entries (`@helix/adapters-hermes/hermes-sdk`, `/hermes-cli`, `/hermes-tui`, `/hermes-api-server`, `/hermes-acp`, `/hermes-gateway`, `/hermes-web-dashboard`, `/hermes-atoms`), and product surface compatibility entries for OpenCode/Pi/Nanobot/Hermes Agent. `packages/conformance/package-exports.conformance.test.ts` imports those subpaths in an isolated runtime smoke and scans tests so they cannot rely on unexported deep package paths.

Publishing boundaries have their own conformance gate. `packages/conformance/package-boundary.conformance.test.ts` runs `npm pack --dry-run --json` for every publishable workspace package, checks that package export targets are present in the tarball, and verifies dependency lanes so common packages do not depend on product personalities and one product personality does not pull in the other.

`packages/recipes/src/agent-loop-semantics.ts` provides `runAgentLoopSemanticReplay`, which assembles the full product recipes and runs the same product-level semantic replay through OpenCode plugin hooks, Pi extension hooks, Nanobot hook aliases, and Hermes shell hooks. The replay covers input/system transforms, provider options, permission gates, tool arg mutation, result patching, compaction autocontinue, retry, multi-step tool context, and synthetic continuation.
`@helix/lego-hooks/hook-atoms` exposes the common hook lego layer used by those personalities: event bus, scheduler, observer/handler chains, cleanup scope, error policy, and source-aware tool/command/provider/UI registries. `LegoHookHost` keeps the product adapters stable while delegating to those atoms.
`@helix/lego-config/config-atoms`, `@helix/lego-prompt/prompt-atoms`, and `@helix/lego-ui/ui-atoms` expose the config, prompt/resource, and UI lego layers: source/merge/validator atoms, product config profiles, Nanobot env-reference resolution, resource loading/discovery, product prompt profiles, prompt building, tool rendering, model capability adaptation, compaction prompt adaptation, event-loop, renderer, command-router, theme-registry, input-normalizer, snapshot atoms, and product UI profiles. The old service classes and facade exports remain compatibility entrypoints over those atoms.
`@helix/adapters-opencode/plugin-atoms` and `@helix/adapters-pi/extension-atoms` expose the product personality hook lego layer: plugin/extension loaders, manifest normalizers, event mappers, registry bridges, permission/runtime bridges, and Pi schema normalization. The old adapter functions remain compatibility entrypoints over those atoms.
`packages/lego-agent-loop/src/pipeline.ts` provides the explicit turn pipeline catalog and `turn.pipeline.trace` payload shape, while `product-turn-atoms.ts` records OpenCode/Pi/Nanobot turn defaults. `cadence-policies.ts` adds recipe-selectable request boundary, tool batch scheduler, final summary, and acceptance-controller service tokens without introducing a separate cadence category. `opencode.full`, `pi-mono.full`, and `nanobot.full` bind product native-like cadence atoms; `coding-agent.minimal` keeps the common defaults. Agent-loop conformance now forces one rich turn through every pipeline atom trace, including compaction, retry, stream reduction, tool planning/execution, batch scheduling, acceptance-controller evaluation, request-boundary decisions, final-summary decisions, synthetic continuation, stop decision, and result recording; config/prompt/UI conformance additionally checks Nanobot runtime-context injection during assembled turns.

`packages/recipes/src/product-workflow-parity.ts` provides `runUpstreamProductWorkflowParity`, which is the OpenCode/Pi upstream-fixture workflow gate: provider-stream tool calls through `runTurn(provider)`, OpenCode server/TUI event/Web/Desktop/Slack surfaces, Pi CLI/RPC/TUI event/Web UI/server surfaces, and pinned upstream fixtures read back through those product SDKs. Nanobot's parallel evidence is covered by its baseline/differential, reverse-assembly surface checks, live provider parity, and task parity artifacts.

`packages/recipes/src/upstream-e2e-parity.ts` provides `runUpstreamE2EParity`, which maps pinned upstream smoke/test specs into deterministic offline checks: OpenCode session timeline source/target readback, paging order, fork/diff behavior, and Pi dynamic tools, runtime events, cancellation, and branching behavior.

`packages/recipes/src/opencode-differential.ts` provides `runOpenCodeDifferential`, the first golden-trace style comparison between
assembled `opencode.full` and original OpenCode. By default it uses an observed native `opencode-ai@1.15.11` fixture shape;
with `--native-original` it launches `npx opencode-ai@1.15.11`, captures JSON stdout, and extracts sqlite `message`/`part`
rows from an isolated temporary OpenCode data directory when upstream writes one. If native `run --format json` returns only
stdout events, the capture uses `step_start`/`text` events as the CLI assistant view and leaves sqlite as a separate storage
evidence row. SQLite readback works with either `sqlite3 -json` or Node's `node:sqlite` fallback, and OpenCode stdout `text`
events are treated as optional because current native runs can expose the same assistant text through sqlite while only
printing `step_start` to stdout. The assembled OpenCode trace now matches the fixture on transcript
roles, visible answer, logical assistant part types, Anthropic endpoint semantics, native sqlite table shape, and default tool
registry names, including native-style CLI JSON event output. The same module also exposes
`runPiMonoDifferential`, which keeps Pi Mono on the same report shape using the pinned Pi JSONL fixture shape by default and
can optionally launch `@earendil-works/pi-coding-agent` to capture Pi's native JSON event stream plus v3 JSONL session file.
The native Pi capture path writes Pi's own `models.json` provider override and uses Pi's root-base Anthropic endpoint policy,
which differs from OpenCode's AI SDK `/v1` base URL policy.
Pi differential comparison also normalizes native streaming details that do not affect the reusable lego contract: provider
thinking/reasoning blocks are optional around the visible text part, and multiple `message_update` deltas are treated as the
same CLI protocol as one coalesced update.

`packages/recipes/src/live-provider-parity.ts` provides `runLiveProviderParity`, which runs both product harnesses through OpenAI-compatible, OpenRouter, Anthropic, or Google streaming provider adapters and reads the created sessions back through product SDKs. It is offline-safe by default, reports `skipped` when credentials are absent, and becomes a hard gate through `auditReverseAssembly({ runLiveProviderParity: true })`. The same module now exposes lego-shaped atoms for `createLiveProviderCredentialGate`, `createLiveProviderRunner`, `createLiveProviderArtifactWriter`, `createLiveProviderArtifactVerifier`, and `createLiveProviderCassetteGenerator`; the archived JSON verifier still checks passed status, provider/model evidence, both product turn/readback checks, and absence of credential-shaped fields.

`packages/recipes/src/task-parity.ts` provides `runProductTaskParity` and `runProductTaskParitySuite`, the deterministic real-task matrix for assembled/original-contract OpenCode, Pi, Nanobot, and Hermes Agent. Task fixtures live under `packages/conformance/fixtures/tasks/` and carry `workspace/`, `prompt.md`, `expected.md`, `policy.json`, and `README.md`. The current smoke suite covers 12 tasks: read-only answer, single-file edit, multi-file refactor, test fix, shell-output analysis, permission denial, tool error recovery, provider retry, context compaction, session fork, extension tool registration, and UI/CLI command routing. The report verifies output, artifact/workspace diff, trace, policy, env allowlist, cost/latency, retry, compaction, task extension, and session-fork evidence. The default `original` mode still uses a native CLI contract replay adapter (`nativeAvailable: false`) so the report model and conformance gate are stable offline. Passing `--native-original` switches original mode to isolated native CLI runners: OpenCode/Pi through `npx`, Nanobot through `uvx --from nanobot-ai==0.2.0 nanobot agent`, and Hermes Agent through `uvx --from hermes-agent==0.15.1 hermes chat`, with temp HOME/XDG/session/npm/uv cache, task env allowlist, product package spec, live Anthropic model credentials, and process-group timeout cleanup. Cadence parity is reported through `cadenceEvidence`, `observationShape`, `acceptanceTimingEvidence`, and `fixtureReplay` on each report and `cadenceParity/cadenceScore/cadenceScoreBreakdown/cadenceDrifts` on each pair. Drift metadata records owning plane, owning atom, candidate fixes, expected score delta, native fixture requirement, observability metadata, and a minimal reproduction signature. The public scripts keep this as a product smoke/parity gate rather than bundling downstream benchmark runners.

## Docs Site

The assembly console now supports both online and static modes. The online mode serves the builder from a local Node server, exposes recipe/atom data at `/api/builder-data`, and stores recipe drafts through an in-memory `/api/recipes/drafts` store that can be replaced by a database-backed store later. The static mode remains available for deterministic conformance artifacts.

```bash
npm run docs:dev
npm run docs:site
npm run test:builder:e2e
```

`npm run docs:dev` starts the online builder at `http://127.0.0.1:5173/harness-builder.html`. `npm run docs:site` writes `docs/site/index.html`, showing OpenCode/Pi/Nanobot/minimal module lists, package-grouped atom inventory, assembly contract fingerprints/swap points/classification, block-ledger catalog/fixture/binding/export coverage, recipe diff swap map, port binding diff, strategy/policy diff, boundary lint leakage status, conformance entrypoints, and TODO completion status. The generator lives in `packages/docs-site` so the visualization can be tested like any other lego package.
It also writes `docs/site/harness-builder.html`, `docs/site/opencode-web.html`, `docs/site/opencode-desktop-shell.html`, `docs/site/opencode-desktop-manifest.json`, `docs/site/pi-web-ui.html`, and `docs/site/pi-browser-smoke.html`, all generated from assembled product surfaces. The browser e2e starts a temporary static server, opens the docs index in Chromium/Chrome, navigates into the builder, switches OpenCode/Pi/Nanobot/minimal presets, searches atoms, swaps a port provider, downloads a recipe, validates/graphs/assembles it through the real CLI, imports it back, checks invalid JSON diagnostics, and runs responsive smoke viewports. It does not read `.env` or call live providers.

The builder is now an online-capable assembly workbench rather than a display-only page. It exposes stable data attributes for preset, plane, port, atom, binding, command, diagnostic, and swap-impact regions; imports preserve unknown atoms/bindings as custom metadata; exports include generated CLI commands and diagnostics; online mode can save draft recipes through the server; and the command panel emits `validate recipe-file`, `graph recipe-file`, `assemble --recipe-file`, and task-parity commands for the current recipe. Its layout has a start phase for choosing a preset or launching the zero-to-one wizard, then a build phase that hides presets, widens the assembly board, and moves the atom palette into the working area. The `NEW` flow starts from a harness body and creates a custom recipe with its primary interface block; additional SDK/CLI/TUI/Web/server shells are added from the same lego block palette as session, provider, tools, prompt, UI, and runtime atoms. The staged guide walks required ports one stage at a time: Interface, Session, Provider, Tools, Prompt, UI, and Runtime.

The current CLI smoke path is:

```bash
npm run helix -- run opencode --provider openai-compatible --model "$HELIX_LIVE_MODEL" --api-key "$HELIX_LIVE_API_KEY" --max-steps 4 --max-retries 1 --synthetic-continue --prompt hello --json
npm run helix -- run opencode --provider openai-compatible --model "$HELIX_LIVE_MODEL" --api-key "$HELIX_LIVE_API_KEY" --prompt hello --native-json-events
npm run helix -- run pi-mono --provider anthropic --model "$HELIX_LIVE_MODEL" --api-key "$HELIX_LIVE_API_KEY" --prompt hello --json
npm run helix -- inspect recipe opencode.full --json
npm run helix -- graph recipe coding-agent.minimal --json
npm run helix -- graph recipe opencode.full --json
npm run helix -- diff recipe opencode.full pi-mono.full
npm run helix -- validate recipe minimal.no-shell --json
npm run helix -- validate recipe pi-mono.full --json
npm run helix -- compose --recipe opencode.full --override session.store=session.store.memory --json
npm run helix -- assemble --product opencode --explain --json
npm run assembly:contract
npm run assembly:contract:verify
npm run helix -- run opencode --provider openrouter --model openai/gpt-4.1 --prompt hello --json
npm run helix -- live-provider-parity --provider openrouter --model openai/gpt-4.1 --require-credentials --out docs/reports/live-provider-parity.json --json
npm run helix -- verify-live-provider-parity --artifact docs/reports/live-provider-parity.json --provider openrouter --model openai/gpt-4.1 --json
npm run helix -- differential opencode --json
npm run helix -- differential opencode --native-original --model claude-sonnet-4-5 --json
npm run helix -- differential pi-mono --json
npm run helix -- differential pi-mono --native-original --model claude-sonnet-4-5 --json
npm run live:provider
npm run live:provider:verify
npm run task:parity
npm run task:parity:verify
npm run task:parity:cadence
npm run task:parity:cadence:verify
npm run task:parity:split
npm run task:parity:split:verify
npm run task:parity:native-cadence:split
npm run task:parity:native-cadence:split:replay
npm run live:provider:split
npm run live:provider:split:verify
npm run nanobot:lego-depth
npm run helix -- task-parity --task read-only-answer --product opencode --mode original --provider live --native-original --model "$HELIX_LIVE_MODEL" --json
```

The live provider parity gate can also be run from Node when credentials are available:

```bash
HELIX_LIVE_PROVIDER=openrouter \
HELIX_LIVE_MODEL=openai/gpt-4.1 \
OPENROUTER_API_KEY=... \
node --import tsx -e 'import { runLiveProviderParity } from "@helix/recipes"; console.log(JSON.stringify(await runLiveProviderParity({ requireCredentials: true }), null, 2))'
```

## Verification

Recipe conformance is tested in `packages/conformance/recipes.conformance.test.ts`.
The full modular acceptance matrix is tested in `packages/conformance/modular-acceptance.conformance.test.ts`; it verifies the declared suite gates for `opencode.full`, `pi-mono.full`, `nanobot.full`, and `coding-agent.minimal`, checks every current common atom has an independent suite, and validates the archived live provider artifact as completion evidence.
Split artifact conformance covers schema v2 summary/evidence/manifest writers for task parity, native cadence fixtures, and live provider parity. The verifiers still accept legacy monolithic artifacts, but new split summaries keep strict parity, semantic parity, policy parity, task success, cadence score, and attachment integrity separate so review can inspect stable JSON first and raw transcripts only on demand.
`packages/conformance/nanobot-lego-depth.conformance.test.ts` gates the Nanobot depth report and the `nanobot lego-depth` CLI command. It verifies Nanobot has product atoms across session, hook, prompt, runtime, agent-loop, tool, provider, config, UI, product shell, and task runner mechanisms, and that common packages do not import Nanobot adapters.
The block-first ledger is tested in `packages/conformance/block-ledger.conformance.test.ts`; it parses `docs/lego-block-catalog.md`, compares cataloged ports with exported port fixtures, verifies explicit recipe binding ports are cataloged, checks public module export routes, and includes boundary leakage in the report.
Port contract fixtures are tested in `packages/conformance/port-contract-fixtures.conformance.test.ts`, covering the common catalog planes for identity, event/trace, session, hook/registry, turn pipeline, tool, provider, config, prompt/resource, and UI. Each fixture records input/output shape, lifecycle scope, resource permission, conformance suite, reusable implementations, and personality atoms.
Product shell surfaces are tested in `packages/conformance/product-shell-surfaces.conformance.test.ts`. Each OpenCode/Pi/Nanobot surface now has its own smoke case, so SDK, workspace/control-plane, TUI, Web/Desktop/Slack, CLI/RPC/server/package/example/browser/release, and Nanobot CLI/Web/server shells can fail independently instead of being hidden inside one broad recipe test.

Current coverage:

- OpenCode recipe assembles an OpenCode-native sqlite-shaped harness backed by the common projection service and replay surface.
- OpenCode recipe compiles as an atom-level graph: 280 graph nodes, 96 lockfile bindings, 271 atoms, 9 product shells, and 0 package modules.
- OpenCode recipe exposes SDK, Node HTTP server, workspace, control-plane, TUI, Web, Desktop, and Slack product surfaces.
- Pi Mono recipe assembles a JSONL-tree-backed harness.
- Pi Mono recipe compiles as an atom-level graph: 286 graph nodes, 96 lockfile bindings, 275 atoms, 11 product shells, and 0 package modules.
- Pi Mono recipe exposes SDK, CLI, TUI, RPC, Web UI, Node HTTP server, package manager, extension examples, browser smoke, and release/shrinkwrap hardening surfaces.
- Nanobot recipe assembles a JSONL/session-backed harness with SDK, CLI, TUI, Web UI, and server surfaces.
- Nanobot recipe compiles as an atom-level graph: 276 graph nodes, 96 lockfile bindings, 270 atoms, 6 product shells, and 0 package modules.
- `coding-agent.minimal` compiles as an atom-level neutral recipe from common atoms only: 177 graph nodes, 32 lockfile bindings, 176 atoms, 1 minimal product shell, and 0 package modules.
- Swap recipes compile for `opencode.session-jsonl`, `pi.session-projection`, `minimal.filesystem-tools`, `minimal.no-shell`, `opencode.echo-tools`, and `pi.echo-tools`.
- `opencode.full`, `pi-mono.full`, `nanobot.full`, and `coding-agent.minimal` declare complete conformance gates rather than relying on implicit test coverage.
- Current common atoms are checked against independent conformance suites so reusable atoms can be tested outside OpenCode/Pi product tests.
- Current port contract fixtures cover foundation metadata, runtime composition, identity, event/trace, session, hook/registry, turn, tool definition/schema/permission/executor/result/audit/filesystem/process, provider transport/auth/model/request/parser/normalizer/cassette/stream, config, prompt/resource, UI, and product-shell ports with lifecycle, resource, implementation, and personality metadata.
- Block ledger conformance keeps the catalog, port fixtures, explicit recipe binding ports, package export routes, docs-site coverage, and product-specific leakage checks synchronized.
- Product shell surface conformance gives every OpenCode/Pi/Nanobot user-facing shell an independent smoke gate and records it as a recipe-level suite.
- All three full product recipes expose config, prompt, and UI services.
- All three full product recipes can run provider-backed turns through their public surfaces; deterministic fixture turns remain internal conformance helpers.
- All three full product recipes can be launched through the common CLI entrypoint with real streaming providers.
- Recipe JSON is parsed, dependency-checked, and compiled into a module graph.
- Recipe dry-run commands can inspect, graph, diff, validate, and compose recipe overrides through the CLI without starting product execution.
- Recipe override conformance covers storage, provider, permission policy, UI facade, and tool-pack replacement through lockfile bindings.
- Assembled harnesses install recipe-selected tool ports into services: `filesystem.port`, `process-runner.port`, and `tool.permission-policy`.
- Tool conformance covers the public tool atom catalog, default pack split, filesystem/process-runner port replacement matrices, schema adapter matrix, permission policy matrix, and live runtime swaps for those ports.
- Provider conformance covers the public provider port layer for OpenAI-compatible/OpenRouter/Anthropic/Google: swappable transport/auth/model-registry/request-shape/stream-parser/event-normalizer ports, sanitized recording/replay cassette transport, and a usage/reasoning/tool-use/finish/cost normalization matrix.
- Config/prompt/UI conformance covers public `config-atoms`, `prompt-atoms`, and `ui-atoms`: env/file/workspace/user/CLI sources, merge/validation/discovery, product config profiles, Nanobot env references, resource loading, OpenCode/Pi/Nanobot resource convention differences, product prompt profiles, product-selected base prompts during assembled turns, Nanobot runtime-context injection, system builder hooks, tool rendering, model capability prompt adaptation, compaction resources, config-selected prompt overrides, renderer registry, command routing, theme selection, input normalization, snapshots, product UI profiles, and the shared event loop.
- Recipe-level swap dry-runs prove Pi can bind to the common in-memory message store, OpenCode can bind to the common projector, and the neutral recipe can bind common ID/store/context atoms together.
- Recipe compilation rejects missing capabilities, incompatible capability versions, personality leakage, ambiguous single-provider bindings, and known side-effect capabilities without resource declarations.
- Module resource declarations cover filesystem, network, shell, env, sqlite, and local extension execution resources.
- Boundary lint rejects common packages importing personality adapters, atoms importing product surfaces, provider atoms importing session atoms, tool atoms importing UI, and product shells importing undeclared behavior packages.
- Package export smoke proves atoms, packs, and product shells can be imported through stable public subpaths, and keeps tests off unexported deep package imports.
- Package boundary smoke dry-runs publishable npm tarballs and rejects dependency edges that would carry unrelated OpenCode/Pi personality packages.
- Reverse assembly audit verifies that all three full product recipes can be assembled back into their product harness surfaces.
- Reverse assembly audit also exercises SDK/package manager flows, rendered product surfaces, pinned upstream fixture replay, semantic replay, upstream product workflow parity, and pinned upstream e2e parity.
- Upstream product workflow parity runs provider-stream turns, interactive TUI event-loop/RPC/live server workflows, and product-SDK reads of pinned upstream fixtures for OpenCode/Pi; Nanobot is covered by its dedicated baseline/differential plus shared reverse-assembly/live/task gates.
- Pinned upstream e2e parity maps OpenCode timeline smoke paging/fork/readback and Pi dynamic-tool/runtime-event/branching tests into deterministic assembled-product checks.
- Live provider parity verifies the same assembled products against an HTTP streaming provider adapter; credential-backed external runs are opt-in so offline gates remain deterministic, and archived results have a verifier before they count as completion evidence.
- Product task parity runs 12 deterministic smoke tasks across OpenCode/Pi/Nanobot assembled and original-contract modes, verifies task policies/env allowlists, workspace diffs, traces, visible answers, retry, compaction, extension-tool, session-fork evidence, and no credential-shaped artifact fields, and archives `docs/reports/task-parity.json`. The opt-in native original runner covers OpenCode/Pi CLI processes and Nanobot's `uvx` Python CLI process. Third-stage cadence artifacts add stable pair-level drift IDs and scores without turning live transcript/trace differences into task failures.
- Product-level agent-loop semantic replay verifies that all three full product recipes map their personality hooks onto the same common loop behavior.
- OpenCode differential conformance compares assembled `opencode.full` to fixture or optional live native OpenCode trace capture and turns known fidelity differences into explicit next actions. The fixture differential is currently matched.
- Pi Mono differential conformance keeps the same report shape available against pinned Pi fixture traces and optional native Pi CLI capture, so fidelity work does not become OpenCode-only. The fixture differential is currently matched.
- Recipe diff commands identify common modules, personality variant changes, binding-level port provider changes, and recipe-level strategy/policy changes across full product recipes.
- Default tool behavior is covered by the shared tools conformance suite.
- OpenCode plugin hooks can mutate tool args and patch tool results.
- OpenCode SDK/server surfaces can list sessions, run provider-backed turns, expose recipe graph/control-plane state, render TUI/Web/Desktop surfaces, dispatch live TUI events, and handle Slack-style slash commands.
- Pi extensions can register tools and block tool calls.
- Pi SDK/CLI/RPC can run provider-backed turns, list/read sessions, expose workspace state, and plan packages; Pi TUI/Web UI render from that same assembled surface; Pi TUI handles theme/model/submit events and invalid theme input safely; Pi server exposes those through live HTTP routes.
- Pi package manager can plan package/extension specs, load extensions through the compatibility loader, materialize examples, write browser smoke HTML, and produce deterministic shrinkwrap output.
- Surface swap smoke drives OpenCode TUI and Pi TUI through the same shared `ui.event-loop` event sequence, proving the TUI product shells consume a common UI atom shape.
- Large upstream-shaped fixture replay covers Pi JSONL tree and OpenCode projection traces with 128 transcript messages each.
- Real upstream-derived fixture replay covers Pi's pinned `large-session.jsonl` fixture and OpenCode's pinned session timeline fixture export.
- Pinned upstream e2e references live in `packages/conformance/fixtures/upstream/e2e-manifest.json`, preserving the source commits, paths, and blob SHAs used by `runUpstreamE2EParity`.
