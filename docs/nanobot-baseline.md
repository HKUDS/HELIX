# Nanobot Baseline

## Upstream Pin

- Repository: `https://github.com/HKUDS/nanobot`
- Baseline tag: `v0.2.0`
- Baseline commit: `c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7`
- Python package: `nanobot-ai==0.2.0`
- CLI entrypoint: `nanobot`
- License: MIT, as declared in upstream `pyproject.toml`.
- Runtime requirement: Python `>=3.11`, as declared in upstream `pyproject.toml`.
- Stable install commands:
  - `uv tool install nanobot-ai`
  - `pip install nanobot-ai`
- Minimal native setup:
  - `nanobot onboard`
  - edit `~/.nanobot/config.json`
  - `nanobot agent -m "Hello!"`
- Default config path: `~/.nanobot/config.json`
- Default workspace path: `~/.nanobot/workspace`
- Session storage path: `<workspace>/sessions/*.jsonl`
- CLI history path: `~/.nanobot/history/cli_history`

The local baseline inspection was done against `/tmp/helix-nanobot-src` cloned at `v0.2.0`.

## Core Concepts

| Nanobot concept | Upstream source | Lego mapping |
| --- | --- | --- |
| session | `nanobot/session/manager.py` | `session.store`, `session.projector`, `session.context-selector`, `session.pagination` |
| message | `Session.messages[]` JSONL records | common `LegoMessage` transcript |
| part/tool call | provider/tool runner messages | `tool.definition`, `tool.executor`, `tool.result-normalizer` |
| tool registry | `nanobot/agent/tools/loader.py` | `tool.registry`, `tools`, `tool.schema-adapter` |
| provider | `nanobot/providers/*` | `provider.transport`, `provider.auth`, `provider.request-shape`, `provider.stream` |
| hook/event bus | `nanobot/agent/hook.py`, `nanobot/bus/*` | `hook.bus`, `hook.handler-chain`, `event.envelope`, `event.log` |
| config | `nanobot/config/schema.py`, `nanobot/config/loader.py` | `config.source`, `config.merge-strategy`, `config.validator` |
| prompt/resource | `nanobot/templates/*`, `nanobot/skills/*` | `resource.discovery`, `prompt.resource-loader`, `prompt.system-builder` |
| UI | `nanobot/cli/commands.py`, `nanobot/web/*` | `ui.event-loop`, `ui.renderer`, `product.shell` |

## Reuse Points

- Session storage is a JSONL message log with metadata, so it maps to the existing JSONL/tree session plane.
- Provider support is OpenAI-compatible, Anthropic, OpenRouter, Gemini, Bedrock, and other adapters, so existing provider transport/auth/request-shape ports remain sufficient.
- Tools are named, schema-backed executor units, so existing tool registry/schema/executor/result ports are sufficient.
- CLI/TUI/Web/API surfaces are product shells. They should stay out of common ports.
- Channels and gateway runtime are product-specific product shell/plugin behavior unless their semantics prove reusable across OpenCode, Pi, and Nanobot.

## Nanobot Personality Atoms

Nanobot adds atoms only under existing top-level planes:

- `nanobot.session.*` for JSONL session shape, channel-key branch mapping, context max-message selection, and goal-state compaction metadata.
- `nanobot.plugin.*` / `nanobot.hook.*` for plugin/event mapping into the common hook host.
- `nanobot.tool.*` for native tool schema/result/progress rendering bridges.
- `nanobot.provider.*` for provider descriptors and native provider observation.
- `nanobot.config.*`, `nanobot.prompt.*`, `nanobot.ui.*` for product defaults and shell rendering.
- `nanobot.product-shell.*` for SDK, CLI, TUI, Web UI, and server/API surfaces.

## Pinned Fixture Contract

The initial offline fixture contract is:

- single-turn answer: user plus assistant text.
- tool call plus result: common tool executor path using the recipe-selected default tools.
- multi-turn readback: `NanobotSDK.getSession()` over the assembled session service.
- error/cancel path: modelled through shared provider/tool error ports; native subprocess parity is deferred to TODO-002 real-task evaluation.

This fixture is intentionally minimal. It proves lego assembly, not full native behavior parity.
