# OpenCode Recipe

This recipe assembles the current OpenCode product profile from lego atoms and product shells.

Current capabilities:

- OpenCode-style projection session service.
- OpenCode plugin hook adapter.
- OpenCode config and prompt service wiring.
- Live provider stream and default tools as the first reversible execution path.
- No-op UI facade for non-interactive execution plus shared interactive TUI event loop.
- Plugin-mutated tool arguments.
- Plugin-patched tool results.
- Deterministic turn fixtures for conformance tests.
- Live external provider parity through the shared OpenAI-compatible/OpenRouter/Anthropic/Google adapters.
- OpenCode product surfaces for in-process SDK, Node HTTP server, workspace snapshot, and control-plane snapshot.
- TUI/Web/Desktop/Slack product surfaces for terminal rendering, live TUI events, offline Web cockpit, desktop shell manifest, and slash-command style Slack bridge.
- CLI smoke entrypoint: `npm run helix -- run opencode --provider openai-compatible --model "$HELIX_LIVE_MODEL" --api-key "$HELIX_LIVE_API_KEY" --prompt hello --json`.

Module map:

| Lego module | Variant | Upstream responsibility it preserves |
| --- | --- | --- |
| `contracts` | common | Stable ids, messages, events, providers, tools, and recipe contracts. |
| `lego-runtime` | common | Module registry, dependency graph, lifecycle, and assembly context. |
| `lego-session` | `event-projection` | OpenCode-style session projection and sync-event-shaped transcript behavior. |
| `lego-hooks` | `opencode-compatible` | Plugin hook names, ordered handlers, short-circuiting, and result mutation. |
| `lego-config` | `opencode-compatible` | OpenCode-like global/project/CLI/env config layering. |
| `lego-prompt` | `opencode-compatible` | Product prompt resources and system prompt assembly. |
| `lego-provider` | `openai-compatible` | Provider stream boundary used by the live-provider harness. |
| `lego-tools` | `default` | Shared tool definitions plus recipe-selected filesystem, process-runner, and permission policy ports. |
| `lego-ui` | `noop` | UI facade for non-interactive runs, permission fallback, and shared TUI event loop. |
| `lego-agent-loop` | `common` | Turn loop, provider streaming, tool lifecycle, compaction, retry, and transcript append. |
| `opencode-sdk` | `node-sdk` | In-process SDK around the assembled recipe harness. |
| `opencode-workspace` | `local-workspace` | Workspace/config/registry/service snapshot for product surfaces. |
| `opencode-tui` | `terminal` | Terminal/TUI surface snapshot, event dispatch, and text renderer over the assembled harness. |
| `opencode-web` | `static-html` | Offline Web cockpit artifact for graph, tools, providers, and TUI state. |
| `opencode-desktop` | `desktop-shell` | Desktop shell manifest and HTML wrapper around the Web surface. |
| `opencode-slack` | `slack-app` | Slack app manifest, home view, and slash-command bridge. |
| `opencode-server` | `node-http` | HTTP server exposing health, graph, sessions, workspace, control-plane, TUI event, and provider-backed run routes. |
| `opencode-control-plane` | `in-process` | Control-plane snapshot of recipe modules, registries, providers, auth providers, and routes. |

Reference upstream:

- `anomalyco/opencode`
- branch `dev`
- commit `1a8fd0e1dca58a473d85500530dd45def3f512ab`
