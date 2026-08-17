# Migration Plan

This document tracks how to move from the current skeleton toward the full TODO.

## Phase 1: Core Contracts

Implemented:

- ID contracts.
- message/part contracts.
- event envelope contracts.
- tool/provider/recipe/module contracts.
- runtime schema validation and round-trip helpers for session/message/part/tool/event/hook/provider boundaries.
- runtime module registry with capability resolution, DI context, lifecycle assembly, and graph snapshot conformance.
- conversion fixtures from real OpenCode and Pi session materials.

## Phase 2: Session

Implemented:

- JSONL tree service for Pi-style sessions.
- Pi-style session headers persist `leafID`, so branch paths survive reopen.
- Pi-style JSONL tree preserves v3 entry types for messages, thinking/model changes, compaction, branch summaries, custom entries, custom messages, and labels.
- Pi-style `branchWithSummary` and `createBranchedSession` are represented, including label preservation and parent-chain repair when extracting a single path.
- Pi-style session manager compatibility now covers `continueRecent`, `open`, `forkFrom`, project-local `list`, and recursive `listAll`; Pi extension contexts use the real recursive list when available.
- Pi-style session context building now walks the active tree path, resolves thinking/model state, emits compaction and branch summaries, includes custom message entries, and keeps custom/label state entries out of LLM context.
- Pi v3 JSONL fixtures now prove read, branch, compaction entry append, and resume behavior without mutating the source fixture.
- Pi JSONL migration now loads v1/v2 records into the common v3 tree model by deriving stable entry ids, repairing parent chains, mapping legacy compaction indexes to `firstKeptEntryId`, and rewriting v3 field names on the next session write.
- Event projection service for OpenCode-style sessions, including diff events, snapshots, revert, fork-before-message, cursor-based message paging, child session indexing, and SQLite-backed projection persistence.
- OpenCode-style SyncEvent replay now preserves core `Session.Info` fields and projects MessageV2 user/assistant info plus stored text/reasoning/tool/compaction/custom parts into the common message contract.
- Reusable provider context builder with context transforms, token estimates, overflow compaction, and direct conformance coverage.
- Shared session conformance tests.

Next:

- Expand exact Pi session migration fixtures toward more legacy edge cases.
- Expand exact OpenCode MessageV2 projection fixtures toward large traces and edge-case part types.

## Phase 3: Hooks

Implemented:

- Source-ordered observers and handlers.
- Early stop semantics.
- Cleanup semantics.
- Registry surface.
- OpenCode plugin adapter.
- `@opencode-ai/plugin` compatibility shim and `experimental_workspace.register` capture.
- Ordered OpenCode local/npm plugin loading across global config, project config, global plugin directory, and project plugin directory.
- Bun-compatible `$` shell helper injection for OpenCode plugins.
- Pi extension adapter.
- `@earendil-works/pi-coding-agent` compatibility shim and ordered Pi local/npm/git extension loading from settings and extension directories, including jiti-like TypeScript extension loading and disposable hot reload.

Next:

- Complete all OpenCode hook mappings.
- Complete all Pi event result semantics.
- Add reload/session replacement tests.
- Add source-aware error reporting snapshots.

## Phase 4: Agent Loop

Implemented:

- `packages/lego-provider` with normalized provider stream events and internal fixture/cassette replay for deterministic tests.
- Provider stream normalization for chunk coalescing and missing tool call ids.
- OpenAI-compatible streaming provider adapter with API-key/OAuth bearer auth, tools, tool calls, reasoning, and usage mapping.
- Anthropic messages streaming provider adapter with tools, thinking, tool_use blocks, and usage mapping.
- Google Gemini streaming provider adapter with system instructions, function declarations, finish reason normalization, and usage metadata mapping.
- OpenRouter preset on top of the OpenAI-compatible adapter, including base URL and app attribution headers.
- OpenCode provider plugins and Pi provider extensions now share the common provider registry.
- `packages/lego-tools` with default echo/read/write/edit/grep/find/ls/bash/todo/task/subagent definitions.
- `packages/lego-agent-loop` with a common internal fixture turn loop for deterministic tests.
- `AgentLoop` interface with multi-step tool calling and max-step cut-off.
- Synthetic continue for continuation finishes and compaction autocontinue.
- Provider retry with observable failed attempts and provider-error assistant messages.
- Context overflow detection and auto-compaction summary injection.
- Agent/provider/tool lifecycle events around provider requests and tool execution.
- Permission gate for ask-scoped tools via `permission.ask` and the UI facade.
- Sequential tool preflight with parallel/sequential tool execution modes.
- Tool result text truncation before transcript append.
- Path-scoped file mutation queue for default write/edit tools.
- OpenCode-compatible `shell.env` hooks feeding bash tool environment variables.
- Pi extension contexts expose the shared UI facade, a readonly session manager, custom event bus delivery, and message renderer registration.
- Task/subagent tool dispatch through hook host services.
- `packages/recipes` now calls the common loop instead of owning turn orchestration.
- Agent-loop golden replay now snapshots a normalized multi-step tool transcript shape independent of generated IDs.

Next:

- Expand tool lifecycle orchestration to cover streaming tool updates.
- Expand permission policy to cover agent modes, path policies, command policies, and persisted approvals.
- Add richer compaction policies.

## Phase 5: Reverse Assembly

Current proof:

- The recipes can assemble a minimal OpenCode-like harness and a minimal Pi-like harness.
- Both pass shared tests.
- Both wire config, prompt, UI, session, hooks, tools, provider, and agent-loop modules.
- Prompt resources now cover conventional Pi/OpenCode files, extension-discovered resources, reference attachments, and snapshot-tested rendering.
- OpenCode prompt personality now exposes build, plan, general/subagent, and compaction base prompts through the common prompt service.
- Config loading now covers product defaults, global/project files, env, CLI overrides, and OpenCode/Pi plugin or extension directories.
- UI facade now covers no-op interaction, transport-backed TUI/RPC/Web/Desktop adapters, status/chrome, widgets, overlays, editor/autocomplete hooks, and message/tool renderer registries.
- Hook registries now include auth and UI provider contributions alongside tools, commands, shortcuts, flags, providers, and message renderers, with scoped cleanup.
- OpenCode plugin hooks now cover input, command preflight, context message transforms, provider params/headers, permission, tool call/result, tool definition, shell env, and compaction policy mapping.
- Product-level semantic replay now runs OpenCode plugins and Pi extensions through the same common loop, covering input/system transforms, provider options, permission, tool arg mutation, result patching, compaction autocontinue, retry, multi-step tool context, and synthetic continuation.
- Both can be launched through `packages/cli` with `helix run <product>`.
- The CLI can select real streaming provider adapters with `--provider`, `--model`, `--api-key`, and `--base-url`.
- Upstream-shaped Pi JSONL and OpenCode projection-event fixtures replay into common transcripts; Pi session files now serialize v3-style `parentId` tree links and ISO timestamps while loading old alias fields and migrating v1/v2 records into the common tree model.
- Real upstream-derived fixtures are now replayed offline: Pi's pinned `large-session.jsonl` fixture and OpenCode's pinned session timeline fixture export both validate against the common transcript contract.
- Session semantics now sit above explicit storage lego boundaries: `JsonlTreeFileStorage` for Pi append-only JSONL, plus `ProjectionMemoryStorage` and `ProjectionSQLiteStorage` for event-sourced projection state.
- OpenCode assembly now registers builtin auth/provider plugin descriptors for Codex, GitHub Copilot, GitLab, Poe, Cloudflare, Azure, DigitalOcean, and xAI.
- OpenCode projection sessions now create descending `ses_` IDs and use update-time plus ID ordering to match upstream list semantics.
- Pi assembly now registers SDK, CLI, TUI, RPC, Web UI, Node HTTP server, package manager, extension examples, browser smoke, and release hardening product surfaces through the recipe graph and reverse assembly audit.
- Upstream product workflow parity now proves provider-stream tool turns, OpenCode server/TUI/Web/Desktop/Slack workflows, Pi CLI/RPC/TUI/Web UI/server workflows, and product-SDK reads of pinned upstream fixtures.
- Pinned upstream e2e parity now maps OpenCode session timeline smoke paging/fork/readback and Pi dynamic tool/runtime event/branching tests into deterministic offline reverse assembly checks.
- Shared TUI event loop parity now covers OpenCode and Pi command/theme/model/submit dispatch through local surfaces and live `POST /v1/tui/event` routes, including Pi invalid theme input returning a structured error instead of crashing.
- Live provider parity now has a first-class recipe verifier that can run both assembled products through OpenAI-compatible, OpenRouter, Anthropic, or Google streaming adapters and fail the reverse assembly audit when credentials are explicitly required. Archived live provider results also have an artifact verifier so skipped, incomplete, stale, or credential-leaking reports cannot count as completion evidence.

Remaining proof:

- Execute and archive credential-backed real external provider parity runs where provider credentials are available.
