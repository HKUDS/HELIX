# Helix Modularity Audit

This audit records the current gap between "the recipes can be assembled back into OpenCode/Pi" and "the system is truly lego-like." It should be read together with `docs/lego-block-catalog.md`.

## 1. Atom Standard

A lego atom is acceptable only when all of these are true:

- It owns one capability or one strategy.
- It exposes one public contract through a named port.
- It has a manifest with structured `provides` and `requires`.
- It can be selected or replaced by a recipe binding.
- It has a port-level conformance test or an explicit test-only mock.
- It declares resources such as filesystem, network, shell, env, sqlite, or extension runtime.
- It does not import product personality code unless it is a declared personality atom.

Anything larger than that is a composite, pack, adapter, or product shell.

The current audit gate is block-first: every behavior being extracted needs a catalog row, a general port contract, an explicit common/personality classification, a recipe binding target, and an independent conformance story. The primary recipes now use atom inventories and binding lockfiles instead of package-level module lists, so this audit is focused on the next risk: making those atoms thinner and more executable without losing the shared port vocabulary.

## 2. Package Classification

| Package | Current Tag | Why | Next Split |
| --- | --- | --- | --- |
| `packages/contracts` | composite foundation | Owns IDs, messages, events, modules, recipes, tools, provider contracts, and schemas. | Split by contract namespace only if public API grows too large; keep as one package for now. |
| `packages/lego-runtime` | split kernel facade | `ModuleRegistry` remains as compatibility facade, while catalog, resolver, binding planner, lifecycle runner, assembly graph, and product runtime atoms are independently exported and tested. | Add richer resource grants and recipe override execution hooks as runtime behavior moves from dry-run to live assembly. |
| `packages/lego-session` | composite, highest priority | It combines storage, event logs, projection, branch graph, pagination, migration, compaction records, and context behavior. | `session.id-generator`, `session.event-log`, `session.message-store`, `session.branch-graph`, `session.projector`, `session.pagination`, `session.context-selector`, `session.diff`. |
| `packages/lego-hooks` | port-backed hook facade | `hook-atoms.ts` exposes event bus, source/serial/parallel schedulers, observer/handler chains, cleanup scope, error policies, and tool/command/provider/UI registry atoms; `LegoHookHost` is now a compatibility facade over those atoms. | Continue tightening recipe bindings around hook/personality atom selections. |
| `packages/lego-agent-loop` | port-traced turn facade | `pipeline.ts` exposes turn pipeline ports and trace events, while `product-turn-atoms.ts` exposes OpenCode/Pi/Nanobot turn defaults for assistant part protocol, request shape, retry/continuation, Nanobot runtime context, max iterations, replay, and tool-result truncation. Recipes bind context builder, continuation, retry, compaction, stop, provider-runner, stream reducer, executor, and recorder choices. | Turn the traced strategy catalog into smaller executable factories as behavior moves out of the compatibility loop. |
| `packages/lego-tools` | port-backed pack plus atom bindings | Public `tool-atoms` declares tool atom types and packs, while `ports.ts` provides filesystem/process-runner/permission atoms. Recipes now bind `tools`, `tool.permission-policy`, `tool.executor`, `tool.result-normalizer`, `tool.audit-log`, `filesystem.port`, and `process-runner.port`; assembled products use OpenCode/Pi-shaped default tool registries instead of one generic registry. | Thin default tool definitions so result normalization and audit logging are service-driven at runtime, not only represented in recipe metadata. |
| `packages/lego-provider` | port-backed provider pack | `ports.ts` exposes transport/auth/model-registry/request-shape/stream-parser/event-normalizer/cassette/usage-normalizer atoms, and OpenAI-compatible/OpenRouter/Anthropic/Google all use them. OpenCode uses `/v1` base URL plus `/messages` endpoint semantics; native Pi capture uses a product endpoint submodule that writes Pi's root-base `models.json` override. Recipes bind transport, request shape, event normalizer, model registry, and stream facade choices. | Split provider descriptor presets into explicit atom factories and add more binding-level provider pack swaps. |
| `packages/lego-config` | port-backed config facade | `config-atoms.ts` exposes env/file/workspace/user/CLI sources, deep/priority merge strategies, validators, config file discovery, product config profiles, and Nanobot `${ENV}` config reference resolution; `LegoConfigService` remains a compatibility facade. | Move product precedence descriptors into explicit recipe bindings. |
| `packages/lego-prompt` | port-backed prompt facade | `prompt-atoms.ts` exposes resource loading, filesystem/conventional discovery, product-specific base prompts, product prompt profiles, Nanobot bootstrap-style section rendering, tool rendering, model capability adaptation, and compaction prompt adaptation; `LegoPromptService` remains a compatibility facade. | Replace remaining compatibility prompt facades with recipe-selected atom factories where exact upstream templates are required. |
| `packages/lego-ui` | port-backed UI facade | `ui-atoms.ts` exposes the shared event loop, renderer registry, command router, theme registry, input normalizer, snapshot atom, and product UI profiles; Noop/Transport/TUI exports remain compatibility facades. | Continue binding UI atom choices through recipes and then thin product surfaces. |
| `packages/adapters-opencode` | personality atoms plus split product shells | `plugin-atoms.ts` splits plugin loader, manifest normalizer, event mapper, registry bridge, permission bridge, workspace bridge, shell bridge, and OpenCode special atom descriptors; OpenCode SDK/server/workspace/control-plane/TUI/Web/Desktop/Slack shells now live in separate modules with public subpaths and recipe bindings. Session personality now mirrors the common projection service into an OpenCode-native sqlite table shape while preserving replay/fork/readback. | Thin product shells so they consume only declared services from compiled bindings. |
| `packages/adapters-pi` | personality atoms plus split product shells | `extension-atoms.ts` splits extension loader, manifest normalizer, event mapper, TypeBox/schema bridge, dynamic registry/tool bridge, context bridge, runtime event bridge, and Pi special atom descriptors; Pi SDK/CLI/TUI/RPC/Web/server/package/examples/browser/release shells now live in separate modules with public subpaths and recipe bindings. | Thin product shells so package/release/browser/example behavior consumes only declared services from compiled bindings. |
| `packages/adapters-nanobot` | personality atoms plus split product shells | `nanobot-atoms.ts` splits plugin loader, manifest normalizer, API factory, event mapper, registry bridge, context bridge, runtime event bridge, tool schema bridge, AgentHook event aliases, and Nanobot special atom descriptors; Nanobot SDK/CLI/TUI/Web/server shells live in separate modules with public subpaths and recipe bindings. | Thin product shells so API/channel behavior consumes only declared services from compiled bindings. |
| `packages/recipes` | atom catalog and orchestration | Recipe data, compiler, atom catalog, harness assembly atoms, audits, differential reports, and parity reports are together; live provider parity now has credential gate, live runner, artifact writer/verifier, and cassette generator atoms. | Split recipe catalog/compiler/diff/lockfile/audit/parity modules only when public API pressure justifies it. |
| `packages/cli` | product-agnostic shell | CLI currently drives recipes and live parity. | Keep as shell, but route through recipe inspect/diff/graph/validate commands. |
| `packages/docs-site` | documentation shell | Static site generator mixes TODO parsing, recipe graph rendering, and surface artifact generation. | Add atom graph rendering; keep as product documentation shell. |
| `packages/conformance` | test-only composite | Contains all conformance suites and upstream fixtures. | Split suites by port, keep package as test-only container. |
| `packages/opencode-plugin` | compatibility shim | Product-specific package shim. | Keep as OpenCode personality support atom. |
| `packages/pi-coding-agent` | compatibility shim | Product-specific package shim. | Keep as Pi personality support atom. |

## 3. Heatmap

| Area | Risk | Reason | First Action |
| --- | --- | --- | --- |
| Session | Critical | Biggest semantic split between OpenCode projection and Pi JSONL tree; current service hides many atoms. | Define session port-level conformance and split internals. |
| Runtime binding | Critical | Current string capability map cannot express free lego composition or explicit binding. | Structured capability refs, typed tokens, assembly lockfile. |
| Agent loop | Medium | Retry, continuation, compaction, stream reduction, and tool execution now have ports, binding evidence, product turn defaults, and split executable loop stages, but the compatibility facade still selects common defaults directly. | Move traced turn strategies into executable factories behind the existing ports. |
| Product surfaces | Medium | OpenCode, Pi, Nanobot, and Hermes shells are split, but some shell modules still depend on broad harness snapshots instead of narrower service contracts. | Keep shrinking product shells toward service-only consumers. |
| Tools | Lower | Permission, filesystem, shell execution, executor, result normalization, audit, and tool-pack choices are represented in recipe bindings, but some defaults still live in compatibility definitions. | Make result/audit/executor services fully runtime-selected. |
| Provider | Lower | Provider personalities share transport, auth, model registry, request shape, parser, event-normalizer, usage, and cassette ports; live parity has separate credential, run, artifact, verifier, and cassette atoms. | Move provider descriptor presets into explicit atom factories and broaden provider swap conformance. |
| Hooks | Lower | Hook host internals and product plugin/extension adapter responsibilities are exposed as atom ports and selected by recipe bindings. | Keep thinning compatibility facades as product shells consume declared services only. |
| Prompt/config/UI | Lower | Config, prompt/resource, and UI expose public atom layers, product profiles, and conformance; product-scoped atom routes now resolve back to their owning common plane. | Continue replacing compatibility facades with recipe-selected atom factories. |

## 4. Product-Specific Leakage Points

| Location | Leakage | Desired Boundary |
| --- | --- | --- |
| `adapters-opencode/src/opencode-*.ts` | OpenCode product shells are split and selected by atom-level recipes, but still need thinner service-only dependency surfaces. | `opencode.product-shell.*` modules that consume only declared ports and recipe-installed services. |
| `adapters-pi/src/pi-*.ts` | Pi product shells are split and selected by atom-level recipes, but package/release/browser behavior should keep shrinking toward service consumers. | `pi.product-shell.*` modules that consume only declared ports and recipe-installed services. |
| `adapters-hermes/src/*` | Hermes product surfaces and special atoms are split into child modules, but SDK-facing shells still read broad harness state. | `hermes.product-shell.*` modules that consume declared ports and recipe-installed services. |
| `lego-session` | Product-specific projection and JSONL behaviors are inside one package. | Personality projector/migrator atoms behind common session ports. |
| `lego-agent-loop` | Product-level semantic compatibility now has strategy bindings, but several strategies still execute inside the compatibility loop. | Executable strategy factories selected by recipe. |
| `lego-tools` | Tool atom and pack manifests are explicit, and workspace/process/permission/result/audit/executor choices are bound by recipe. | Runtime service lookup for result/audit/executor behavior everywhere default tools execute. |
| `lego-provider` | Provider stream adapters and live parity evidence now run through port-backed atoms. | Provider descriptor atom factories and recipe-selected provider presets. |

## 5. Boundary Rules To Automate

- Common atoms must not import `@helix/adapters-opencode`, `@helix/adapters-pi`, `@opencode-ai/plugin`, or `@earendil-works/pi-coding-agent`.
- Storage atoms must not import provider, tool, or UI packages.
- Provider atoms must not import session packages.
- Tool atoms must not import UI packages.
- Product shells may import personality atoms and ports, but should not import concrete common implementations unless the recipe binding declares them.
- Packs may import atoms only to expand them; packs should not hide new behavior.

## 6. Scoring Gate

Each proposed atom gets one point for each criterion:

| Criterion | Evidence |
| --- | --- |
| Single responsibility | Manifest provides exactly one primary capability. |
| Port contract | Capability is declared in `docs/lego-block-catalog.md` and contracts. |
| Replaceable | A recipe binding can swap it with another atom or mock. |
| Independently tested | Port-level conformance or test-only mock exists. |
| Boundary clean | Boundary import test covers it. |
| Resource declared | Manifest declares filesystem/network/shell/env/sqlite/extension runtime use. |

Minimum acceptable score before moving behavior into a new atom: 5/6.

## 7. Recommended Next Slice

The first runtime/session/tool/provider slices have proven that port-backed atoms can work inside the existing package layout, and the primary recipes now compile from atom inventories. The next slice should focus on making the current binding graph more executable:

1. Turn traced turn pipeline strategies into small factories behind `turn.*` ports.
2. Use `runOpenCodeDifferential` / `helix differential opencode` as the fidelity queue for OpenCode-native live gaps while keeping the fixture differential matched.
3. Keep `runPiMonoDifferential` / `helix differential pi-mono` green while hardening optional native Pi capture, so harness fidelity stays product-agnostic.
4. Keep the now-closed OpenCode/Pi fixture and native differential rows for assistant parts, Anthropic endpoint semantics, native storage shape, CLI event protocol, and tool registry names green while moving their compatibility code into thinner factories; keep OpenCode stdout-only fallback as a separate CLI view for environments where sqlite evidence is unavailable.
5. Extend the optional native Pi capture from minimal turn/session evidence toward package, extension, TUI, and RPC evidence.
6. Thin product CLI/event shells so they consume only recipe-declared runtime/session/turn/tool services.
7. Keep docs-site and block-ledger conformance as the gate for cataloged/exported/bound/tested/leaking blocks.
