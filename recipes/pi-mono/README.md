# Pi Mono Recipe

This recipe assembles the current Pi Mono product profile from lego atoms and product shells.

Current capabilities:

- Pi-style JSONL append-only session tree.
- Pi extension API adapter.
- Pi config and prompt service wiring.
- Live provider stream and default tools as the first reversible execution path.
- No-op UI facade for non-interactive execution plus shared interactive TUI event loop.
- Extension-registered tools.
- Extension-blocked tool calls.
- Deterministic turn fixtures for conformance tests.
- Live external provider parity through the shared OpenAI-compatible/OpenRouter/Anthropic/Google adapters.
- Pi product surfaces for SDK, CLI, TUI, RPC, Web UI, Node HTTP server, package/extension planning, extension examples, browser smoke, and release shrinkwrap hardening.
- Live TUI event route: `POST /v1/tui/event` for theme/model/submit workflows and structured invalid-theme errors.
- CLI smoke entrypoint: `npm run helix -- run pi-mono --provider anthropic --model "$HELIX_LIVE_MODEL" --api-key "$HELIX_LIVE_API_KEY" --prompt hello --json`.

Module map:

| Lego module | Variant | Upstream responsibility it preserves |
| --- | --- | --- |
| `contracts` | common | Stable ids, messages, events, providers, tools, and recipe contracts. |
| `lego-runtime` | common | Module registry, dependency graph, lifecycle, and assembly context. |
| `lego-session` | `jsonl-tree` | Pi-style append-only JSONL session tree, parent links, leaf tracking, and resume shape. |
| `lego-hooks` | `pi-compatible` | Extension API events, scoped registration, cleanup, and registry mutation. |
| `lego-config` | `pi-compatible` | Pi-like settings layering and typed access. |
| `lego-prompt` | `pi-compatible` | Product prompt resources and system prompt assembly. |
| `lego-provider` | `anthropic` | Provider stream boundary used by the live-provider harness. |
| `lego-tools` | `default` | Shared tool definitions plus recipe-selected filesystem, process-runner, and permission policy ports. |
| `lego-ui` | `noop` | UI facade for non-interactive runs, permission fallback, and shared TUI event loop. |
| `lego-agent-loop` | `common` | Turn loop, provider streaming, tool lifecycle, compaction, retry, and transcript append. |
| `pi-package-manager` | `extension-packages` | Pi settings package/extension specs, package plan, extension loading, and shrinkwrap data. |
| `pi-sdk` | `typescript-sdk` | Workspace/session/package/release facade over the assembled Pi harness. |
| `pi-cli` | `node-cli` | Pi command/help surface plus provider-backed run entrypoint for CLI parity checks. |
| `pi-tui` | `terminal` | Terminal snapshot, event dispatch, and text renderer over the Pi SDK workspace. |
| `pi-rpc` | `in-process-rpc` | Workspace, session, provider-backed run, package, and release RPC methods. |
| `pi-web-ui` | `static-html` | Offline Web UI artifact for graph, package plan, RPC methods, services, and TUI state. |
| `pi-server` | `node-http` | Live HTTP routes for health, workspace, graph, sessions, TUI render/event, Web UI, packages, release, RPC, and provider-backed run workflows. |
| `pi-extension-examples` | `typescript-examples` | Materializable TypeScript extension examples for tools, events, and providers. |
| `pi-browser-smoke` | `static-html` | Offline browser smoke artifact for recipe graph, package specs, and session storage. |
| `pi-release-hardening` | `shrinkwrap` | Release verification and deterministic package shrinkwrap output. |

Reference upstream:

- `earendil-works/pi`
- branch `main`
- commit `7c2775f6f67c38ed491a1ff68240ee4f8ba688da`
