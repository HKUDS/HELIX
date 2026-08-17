# Executable Placeholder Audit

Generated: 2026-06-15T13:25:44.502Z
Fingerprint: 44370eff3ea1ca3a

## Summary

| Metric | Count |
| --- | ---: |
| Total required bindings | 416 |
| Executable-required bindings | 333 |
| Compile blockers | 0 |
| Metadata-only executable bindings | 0 |
| Preview-only executable bindings | 0 |
| Mock/fixture executable bindings | 0 |
| Lossy compatible bindings | 10 |
| TODO-027 evidence consumers | 0 |
| Native evidence linked | 285 |
| Native fixtures linked | 267 |
| Known lossiness linked | 41 |
| Metadata overlays | 40 |
| Common/shared OK | 382 |

## Risk Groups

### common-ok

| Product | Port | Provider | Level | Resolution | Owner | Native Evidence | Fixtures | Lossiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hermes-agent | `agent-loop.final-summary` | `common.agent-loop.final-summary.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `agent-loop.request-boundary` | `common.agent-loop.request-boundary.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `config.merge-strategy` | `hermes.config.precedence` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `config.source` | `hermes.config.source` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `config.validator` | `hermes.config.validator` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `event.envelope` | `hermes.event.envelope-bridge` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `event.log` | `hermes.event.runtime-bridge` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `filesystem.port` | `filesystem.workspace-scoped` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `hook.bus` | `hermes.plugin.loader` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `hook.cleanup-scope` | `hermes.plugin.cleanup` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `hook.error-policy` | `hermes.hook.error-defaults` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `hook.handler-chain` | `hermes.plugin.event-mapper` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `hook.observer-chain` | `hermes.hook.observer-adapter` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `hook.scheduler` | `hermes.hook.scheduler-defaults` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `identity.clock` | `hermes.identity.clock-format` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `identity.id-generator` | `hermes.identity.id-generator` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `identity.workspace-resolver` | `hermes.identity.workspace-resolver` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `process-runner.port` | `process-runner.local` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `prompt.compaction-adapter` | `prompt.compaction-adapter.common` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `prompt.model-capability-adapter` | `prompt.model-capability-adapter.common` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `prompt.resource-loader` | `prompt.resource-loader.text` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `prompt.tool-renderer` | `prompt.tool-renderer.common` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `provider.auth` | `hermes.provider.auth-descriptor` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `provider.event-normalizer` | `provider.event-normalizer.openai-compatible` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `provider.model-registry` | `provider.model-registry.static` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `provider.request-shape` | `provider.request-shape.openai-compatible` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `provider.stream-parser` | `hermes.provider.parser-observer` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `provider.stream-projector` | `common.provider.stream-projector` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `provider.stream` | `provider.stream.openai-compatible` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `provider.streaming-delta-recorder` | `common.provider.streaming-delta-recorder` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `provider.transport` | `provider.transport.fetch` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `provider.usage-normalizer` | `hermes.provider.usage-renderer` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `registry.command` | `hermes.registry.command` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `registry.provider` | `hermes.plugin.provider-registry-bridge` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `registry.ui` | `hermes.plugin.ui-registry-bridge` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `resource.discovery` | `resource.discovery.filesystem` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `runtime.acceptance-controller` | `common.runtime.acceptance-controller.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `runtime.acceptance-evidence` | `common.runtime.acceptance-evidence.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `runtime.assembly-graph` | `runtime.assembly-graph.lockfile` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `runtime.binding-planner` | `runtime.binding-planner.lockfile` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `runtime.capability-resolver` | `runtime.capability-resolver.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `runtime.lifecycle-runner` | `runtime.lifecycle-runner.scoped` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `runtime.module-catalog` | `runtime.module-catalog.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `session.branch-graph` | `hermes.session.branch-graph.lineage` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `session.branching` | `session.branching.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `session.compaction-records` | `hermes.session.compaction-trajectory` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `session.context-selector` | `hermes.session.context-selector.thread-history` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `session.diff` | `session.branching.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `session.event-log` | `session.event-log.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `session.id-generator` | `hermes.session.id-generator` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `session.message-part-projector` | `hermes.session.message-part-projector.native-like` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `session.message-store` | `session.message-store.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `session.pagination` | `hermes.session.pagination.updated-at` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `session.projector` | `hermes.session.projector.openai-messages` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `session.reader` | `session.reader.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `session.store` | `hermes.session.store.sqlite-fts` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `session.writer` | `session.writer.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `tool.audit-log` | `hermes.tool.progress-event-bridge` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `tool.definition` | `hermes.tool.definition-registry-bridge` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `tool.executor` | `tool.executor.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `tool.permission-policy` | `hermes.permission.hook-bridge` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `tool.registry` | `hermes.tool.registry-bridge` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `tool.result-normalizer` | `hermes.tool.result-event-bridge` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `tool.schema-adapter` | `hermes.tool.schema-bridge` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `tools` | `tool-pack.shell` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `tools.batch-scheduler` | `common.tools.batch-scheduler.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `tools.result-projector` | `common.tools.result-projector.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `tools.schema` | `common.tools.schema.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `trace.recorder` | `hermes.trace.debug-surface` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| hermes-agent | `turn.compaction-policy` | `hermes.turn.compaction-policy` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| hermes-agent | `turn.context-builder` | `hermes.turn.context-builder` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| hermes-agent | `turn.continuation-policy` | `hermes.turn.continuation-policy` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| hermes-agent | `turn.input-normalizer` | `hermes.turn.input-normalizer` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| hermes-agent | `turn.prompt-assembler` | `hermes.turn.prompt-assembler` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| hermes-agent | `turn.provider-request-builder` | `hermes.turn.provider-request-builder` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| hermes-agent | `turn.provider-stream-runner` | `hermes.turn.provider-stream-runner` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| hermes-agent | `turn.result-recorder` | `hermes.turn.result-recorder` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| hermes-agent | `turn.retry-policy` | `hermes.turn.retry-policy` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| hermes-agent | `turn.stop-condition` | `hermes.turn.stop-condition` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| hermes-agent | `turn.stream-reducer` | `hermes.turn.stream-reducer` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| hermes-agent | `turn.tool-call-planner` | `hermes.turn.tool-call-planner` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| hermes-agent | `turn.tool-executor` | `hermes.turn.tool-executor` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| hermes-agent | `ui.event-loop` | `ui.event-loop.shared-tui` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| hermes-agent | `ui.snapshot` | `hermes.ui.snapshot` | compatible-bridge | keep-with-evidence | TODO-025 | 3 | 1 | hermes-ui-source-matrix-partial-fixture<br>native-parity-not-proven<br>product-bridge |
| hermes-agent | `ui.theme-registry` | `hermes.ui.theme-registry` | compatible-bridge | keep-with-evidence | TODO-025 | 3 | 1 | hermes-ui-source-matrix-partial-fixture<br>native-parity-not-proven<br>product-bridge |
| minimal | `agent-loop.final-summary` | `common.agent-loop.final-summary.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `agent-loop.request-boundary` | `common.agent-loop.request-boundary.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `block.manifest` | `block.manifest.schema` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `capability.ref` | `capability.ref.normalizer` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `conformance.ref` | `conformance.ref.fixture-registry` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `event.envelope` | `event.envelope.common` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `event.log` | `event.log.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `identity.clock` | `identity.clock.system` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `identity.id-generator` | `identity.id-generator.deterministic` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `identity.workspace-resolver` | `identity.workspace-resolver.cwd` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `product.shell` | `product.shell.minimal-cli` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `provider.stream-projector` | `common.provider.stream-projector` | common-shared | keep-with-evidence | TODO-025 | 2 | 2 | none |
| minimal | `provider.streaming-delta-recorder` | `common.provider.streaming-delta-recorder` | common-shared | keep-with-evidence | TODO-025 | 2 | 2 | none |
| minimal | `recipe.binding` | `recipe.binding.lockfile` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `resource.grant` | `resource.grant.validator` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `runtime.acceptance-controller` | `common.runtime.acceptance-controller.default` | common-shared | keep-with-evidence | TODO-025 | 1 | 1 | none |
| minimal | `runtime.acceptance-evidence` | `common.runtime.acceptance-evidence.default` | common-shared | keep-with-evidence | TODO-025 | 1 | 1 | none |
| minimal | `runtime.assembly-graph` | `runtime.assembly-graph.lockfile` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `runtime.binding-planner` | `runtime.binding-planner.lockfile` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `runtime.capability-resolver` | `runtime.capability-resolver.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `runtime.lifecycle-runner` | `runtime.lifecycle-runner.scoped` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `runtime.module-catalog` | `runtime.module-catalog.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `session.context-selector` | `session.context-selector.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `session.event-log` | `session.event-log.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `session.id-generator` | `session.id-generator.deterministic` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `session.message-part-projector` | `common.session.message-part-projector` | common-shared | keep-with-evidence | TODO-025 | 2 | 2 | none |
| minimal | `session.message-store` | `session.message-store.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `session.projector` | `session.projector.common-transcript` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `tools.batch-scheduler` | `common.tools.batch-scheduler.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| minimal | `tools.result-projector` | `common.tools.result-projector.default` | common-shared | keep-with-evidence | TODO-025 | 2 | 2 | none |
| minimal | `tools.schema` | `common.tools.schema.default` | common-shared | keep-with-evidence | TODO-025 | 2 | 2 | none |
| minimal | `trace.recorder` | `trace.recorder.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `agent-loop.final-summary` | `common.agent-loop.final-summary.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `agent-loop.request-boundary` | `common.agent-loop.request-boundary.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `config.merge-strategy` | `nanobot.config.precedence` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `config.source` | `nanobot.config.source` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `config.validator` | `nanobot.config.validator` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `event.envelope` | `nanobot.event.envelope-bridge` | compatible-bridge | keep-with-evidence | TODO-025 | 3 | 1 | nanobot-event-source-matrix-partial-fixture<br>native-parity-not-proven<br>product-bridge |
| nanobot | `event.log` | `nanobot.event.bus-bridge` | compatible-bridge | keep-with-evidence | TODO-025 | 3 | 1 | nanobot-event-source-matrix-partial-fixture<br>native-parity-not-proven<br>product-bridge |
| nanobot | `filesystem.port` | `filesystem.workspace-scoped` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `hook.bus` | `nanobot.plugin.loader` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `hook.cleanup-scope` | `nanobot.plugin.cleanup` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `hook.error-policy` | `nanobot.hook.error-defaults` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `hook.handler-chain` | `nanobot.plugin.event-mapper` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `hook.observer-chain` | `nanobot.hook.observer-adapter` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `hook.scheduler` | `nanobot.hook.scheduler-defaults` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `identity.clock` | `nanobot.identity.clock-format` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `identity.id-generator` | `nanobot.identity.id-generator` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `identity.workspace-resolver` | `nanobot.identity.workspace-resolver` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `process-runner.port` | `process-runner.local` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `prompt.compaction-adapter` | `prompt.compaction-adapter.common` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `prompt.model-capability-adapter` | `prompt.model-capability-adapter.common` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `prompt.resource-loader` | `prompt.resource-loader.text` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `prompt.tool-renderer` | `prompt.tool-renderer.common` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `provider.auth` | `nanobot.provider.auth-descriptor` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `provider.event-normalizer` | `provider.event-normalizer.openai-compatible` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `provider.model-registry` | `provider.model-registry.static` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `provider.request-shape` | `provider.request-shape.openai-compatible` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `provider.stream-parser` | `nanobot.provider.parser-observer` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `provider.stream-projector` | `common.provider.stream-projector` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `provider.stream` | `provider.stream.openai-compatible` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `provider.streaming-delta-recorder` | `common.provider.streaming-delta-recorder` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `provider.transport` | `provider.transport.fetch` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `provider.usage-normalizer` | `nanobot.provider.usage-renderer` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `registry.command` | `nanobot.registry.command` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `registry.provider` | `nanobot.plugin.provider-registry-bridge` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `registry.ui` | `nanobot.plugin.ui-registry-bridge` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `resource.discovery` | `resource.discovery.filesystem` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `runtime.acceptance-controller` | `common.runtime.acceptance-controller.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `runtime.acceptance-evidence` | `common.runtime.acceptance-evidence.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `runtime.assembly-graph` | `runtime.assembly-graph.lockfile` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `runtime.binding-planner` | `runtime.binding-planner.lockfile` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `runtime.capability-resolver` | `runtime.capability-resolver.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `runtime.lifecycle-runner` | `runtime.lifecycle-runner.scoped` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `runtime.module-catalog` | `runtime.module-catalog.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `session.branch-graph` | `nanobot.session.branch-graph.channel-key` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `session.branching` | `session.branching.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `session.compaction-records` | `nanobot.session.goal-state` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `session.context-selector` | `nanobot.session.context-selector.max-messages` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `session.diff` | `session.branching.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `session.event-log` | `session.event-log.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `session.id-generator` | `nanobot.session.id-generator` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `session.message-part-projector` | `nanobot.session.message-part-projector.native-like` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `session.message-store` | `session.message-store.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `session.pagination` | `nanobot.session.pagination.updated-at` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `session.projector` | `nanobot.session.projector.jsonl` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `session.reader` | `session.reader.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `session.store` | `nanobot.session.store.jsonl` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `session.writer` | `session.writer.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `tool.audit-log` | `nanobot.tool.progress-event-bridge` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `tool.definition` | `nanobot.tool.definition-plugin-bridge` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `tool.executor` | `tool.executor.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `tool.permission-policy` | `nanobot.permission.policy-bridge` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `tool.registry` | `nanobot.tool.registry-bridge` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `tool.result-normalizer` | `nanobot.tool.result-event-bridge` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `tool.schema-adapter` | `nanobot.tool.schema-bridge` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| nanobot | `tools` | `tool-pack.shell` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `tools.batch-scheduler` | `common.tools.batch-scheduler.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `tools.result-projector` | `common.tools.result-projector.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `tools.schema` | `common.tools.schema.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `trace.recorder` | `nanobot.trace.debug-surface` | compatible-bridge | keep-with-evidence | TODO-025 | 3 | 1 | nanobot-trace-source-matrix-partial-fixture<br>native-parity-not-proven<br>product-bridge |
| nanobot | `turn.compaction-policy` | `nanobot.turn.compaction-policy` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| nanobot | `turn.context-builder` | `nanobot.turn.context-builder` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| nanobot | `turn.continuation-policy` | `nanobot.turn.continuation-policy` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| nanobot | `turn.input-normalizer` | `nanobot.turn.input-normalizer` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| nanobot | `turn.prompt-assembler` | `nanobot.turn.prompt-assembler` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| nanobot | `turn.provider-request-builder` | `nanobot.turn.provider-request-builder` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| nanobot | `turn.provider-stream-runner` | `nanobot.turn.provider-stream-runner` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| nanobot | `turn.result-recorder` | `nanobot.turn.result-recorder` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| nanobot | `turn.retry-policy` | `nanobot.turn.retry-policy` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| nanobot | `turn.stop-condition` | `nanobot.turn.stop-condition` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| nanobot | `turn.stream-reducer` | `nanobot.turn.stream-reducer` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| nanobot | `turn.tool-call-planner` | `nanobot.turn.tool-call-planner` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| nanobot | `turn.tool-executor` | `nanobot.turn.tool-executor` | native | keep-with-evidence | TODO-025 | 7 | 3 | none |
| nanobot | `ui.event-loop` | `ui.event-loop.shared-tui` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| nanobot | `ui.snapshot` | `nanobot.ui.snapshot` | compatible-bridge | keep-with-evidence | TODO-025 | 3 | 1 | nanobot-ui-source-matrix-partial-fixture<br>native-parity-not-proven<br>product-bridge |
| nanobot | `ui.theme-registry` | `nanobot.ui.theme-registry` | compatible-bridge | keep-with-evidence | TODO-025 | 3 | 1 | nanobot-ui-source-matrix-partial-fixture<br>native-parity-not-proven<br>product-bridge |
| opencode | `agent-loop.final-summary` | `opencode.agent-loop.final-summary.native-like` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `agent-loop.request-boundary` | `opencode.agent-loop.request-boundary.native-like` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `config.merge-strategy` | `opencode.config.precedence` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `config.source` | `opencode.config.source` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `config.validator` | `opencode.config.validator` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `event.envelope` | `opencode.event.envelope-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `event.log` | `opencode.event.syncevent-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `filesystem.port` | `opencode.workspace-filesystem-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `hook.bus` | `opencode.plugin.loader` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `hook.cleanup-scope` | `opencode.plugin.hot-reload-cleanup` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `hook.error-policy` | `opencode.hook.error-defaults` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `hook.handler-chain` | `opencode.plugin.event-mapper` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `hook.observer-chain` | `opencode.hook.observer-adapter` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `hook.scheduler` | `opencode.hook.scheduler-defaults` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `identity.clock` | `opencode.identity.clock-format` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `identity.id-generator` | `opencode.identity.id-generator` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `identity.workspace-resolver` | `opencode.identity.workspace-resolver` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `process-runner.port` | `opencode.shell.env-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `product.shell` | `opencode.product-shell.sdk` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `prompt.compaction-adapter` | `opencode.prompt.compaction-adapter.build-prompt` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| opencode | `prompt.model-capability-adapter` | `opencode.prompt.model-capability-adapter.provider-prompt` | native | keep-with-evidence | TODO-025 | 5 | 1 | none |
| opencode | `prompt.resource-loader` | `opencode.prompt.resource-loader.instruction` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| opencode | `prompt.system-builder` | `opencode.prompt.mode-builder` | native | keep-with-evidence | TODO-025 | 25 | 24 | none |
| opencode | `prompt.tool-renderer` | `opencode.prompt.tool-renderer.provider-tools` | native | keep-with-evidence | TODO-025 | 6 | 1 | none |
| opencode | `provider.auth` | `opencode.provider.auth-descriptor` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `provider.event-normalizer` | `opencode.provider.event-observer` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `provider.model-registry` | `opencode.provider.model-plugin` | native | keep-with-evidence | TODO-025 | 5 | 2 | none |
| opencode | `provider.request-shape` | `opencode.provider.request-options` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `provider.stream-parser` | `opencode.provider.parser-observer` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `provider.stream-projector` | `opencode.provider.stream-projector.native-like` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `provider.stream` | `opencode.provider.plugin-descriptor` | native | keep-with-evidence | TODO-025 | 5 | 2 | none |
| opencode | `provider.streaming-delta-recorder` | `opencode.provider.streaming-delta-recorder.native-like` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `provider.transport` | `opencode.provider.transport-instrumentation` | native | keep-with-evidence | TODO-025 | 5 | 2 | none |
| opencode | `provider.usage-normalizer` | `opencode.provider.usage-renderer` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `registry.command` | `opencode.registry.command` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `registry.provider` | `opencode.plugin.provider-registry-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `registry.ui` | `opencode.plugin.ui-registry-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `resource.discovery` | `opencode.resource.discovery.instruction` | native | keep-with-evidence | TODO-025 | 4 | 1 | none |
| opencode | `runtime.acceptance-controller` | `opencode.runtime.acceptance-controller.native-like` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `runtime.acceptance-evidence` | `opencode.runtime.acceptance-evidence.native-like` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `runtime.assembly-graph` | `opencode.runtime.assembly-graph` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `runtime.binding-planner` | `opencode.runtime.binding-planner` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `runtime.capability-resolver` | `opencode.runtime.capability-resolver` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `runtime.lifecycle-runner` | `opencode.runtime.lifecycle-runner` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `runtime.module-catalog` | `opencode.runtime.module-catalog` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `session.branch-graph` | `opencode.session.branch-graph.fork-before-message` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `session.branching` | `opencode.session.branching.sqlite-service` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `session.compaction-records` | `opencode.session.compaction-event` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `session.context-selector` | `opencode.session.context-selector.message-v2` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `session.diff` | `opencode.session.diff.sqlite-service` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `session.event-log` | `opencode.session.event-log.syncevent` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `session.id-generator` | `opencode.session.id-generator` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `session.message-part-projector` | `opencode.session.message-part-projector.native-like` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `session.message-store` | `opencode.session.message-store.sqlite-service` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `session.pagination` | `opencode.session.pagination.update-time-cursor` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `session.projector` | `opencode.session.projector.message-v2` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `session.reader` | `opencode.session.reader.sqlite-service` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `session.store` | `opencode.session.store.sqlite-projection` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `session.writer` | `opencode.session.writer.sqlite-service` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `tool.audit-log` | `opencode.tool.status-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `tool.definition` | `opencode.tool.definition-plugin-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `tool.executor` | `opencode.tool.permission-render-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `tool.permission-policy` | `opencode.plugin.permission-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `tool.registry` | `opencode.plugin.registry-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `tool.result-normalizer` | `opencode.tool.result-render-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `tool.schema-adapter` | `opencode.tool.schema-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `tools` | `opencode.tool-pack.native` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `tools.batch-scheduler` | `opencode.tools.batch-scheduler.native-like` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `tools.result-projector` | `opencode.tools.result-projector.native-like` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `tools.schema` | `opencode.tools.schema.native-like` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `trace.recorder` | `opencode.trace.debug-surface` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `turn.compaction-policy` | `opencode.turn.compaction-policy` | native | keep-with-evidence | TODO-025 | 17 | 8 | none |
| opencode | `turn.context-builder` | `opencode.turn.context-builder` | native | keep-with-evidence | TODO-025 | 17 | 8 | none |
| opencode | `turn.continuation-policy` | `opencode.turn.continuation-policy` | native | keep-with-evidence | TODO-025 | 17 | 8 | none |
| opencode | `turn.input-normalizer` | `opencode.turn.input-normalizer` | native | keep-with-evidence | TODO-025 | 17 | 8 | none |
| opencode | `turn.prompt-assembler` | `opencode.turn.prompt-assembler` | native | keep-with-evidence | TODO-025 | 17 | 8 | none |
| opencode | `turn.provider-request-builder` | `opencode.turn.provider-request-builder` | native | keep-with-evidence | TODO-025 | 17 | 8 | none |
| opencode | `turn.provider-stream-runner` | `opencode.turn.provider-stream-runner` | native | keep-with-evidence | TODO-025 | 17 | 8 | none |
| opencode | `turn.result-recorder` | `opencode.turn.result-recorder` | native | keep-with-evidence | TODO-025 | 17 | 8 | none |
| opencode | `turn.retry-policy` | `opencode.turn.retry-policy` | native | keep-with-evidence | TODO-025 | 17 | 8 | none |
| opencode | `turn.stop-condition` | `opencode.turn.stop-condition` | native | keep-with-evidence | TODO-025 | 17 | 8 | none |
| opencode | `turn.stream-reducer` | `opencode.turn.stream-reducer` | native | keep-with-evidence | TODO-025 | 17 | 8 | none |
| opencode | `turn.tool-call-planner` | `opencode.turn.tool-call-planner` | native | keep-with-evidence | TODO-025 | 17 | 8 | none |
| opencode | `turn.tool-executor` | `opencode.turn.tool-executor` | native | keep-with-evidence | TODO-025 | 17 | 8 | none |
| opencode | `ui.command-router` | `opencode.ui.command-router` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `ui.event-loop` | `opencode.ui.event-loop` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `ui.input-normalizer` | `opencode.ui.input-normalizer` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `ui.renderer` | `opencode.ui.renderer` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `ui.snapshot` | `opencode.ui.snapshot` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| opencode | `ui.theme-registry` | `opencode.ui.theme-registry` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `agent-loop.final-summary` | `common.agent-loop.final-summary.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `agent-loop.request-boundary` | `common.agent-loop.request-boundary.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `config.merge-strategy` | `pi.config.precedence` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `config.source` | `pi.config.source` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `config.validator` | `pi.config.validator` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `event.envelope` | `pi.event.envelope-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `event.log` | `pi.event.runtime-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `filesystem.port` | `filesystem.workspace-scoped` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `hook.bus` | `pi.extension.loader` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `hook.cleanup-scope` | `pi.extension.cleanup` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `hook.error-policy` | `pi.hook.error-defaults` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `hook.handler-chain` | `pi.extension.event-mapper` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `hook.observer-chain` | `pi.hook.observer-adapter` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `hook.scheduler` | `pi.hook.scheduler-defaults` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `identity.clock` | `pi.identity.clock-format` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `identity.id-generator` | `pi.identity.id-generator` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `identity.workspace-resolver` | `pi.identity.workspace-resolver` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `process-runner.port` | `process-runner.local` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `product.shell` | `pi.product-shell.sdk` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `prompt.compaction-adapter` | `prompt.compaction-adapter.common` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `prompt.model-capability-adapter` | `prompt.model-capability-adapter.common` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `prompt.resource-loader` | `prompt.resource-loader.text` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `prompt.system-builder` | `pi.prompt.coding-agent-builder` | native | keep-with-evidence | TODO-025 | 5 | 3 | none |
| pi-mono | `prompt.tool-renderer` | `prompt.tool-renderer.common` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `provider.auth` | `pi.provider.auth-descriptor` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `provider.event-normalizer` | `provider.event-normalizer.anthropic` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `provider.model-registry` | `provider.model-registry.static` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `provider.request-shape` | `provider.request-shape.anthropic` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `provider.stream-parser` | `pi.provider.parser-observer` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `provider.stream-projector` | `common.provider.stream-projector` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `provider.stream` | `provider.stream.anthropic` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `provider.streaming-delta-recorder` | `common.provider.streaming-delta-recorder` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `provider.transport` | `provider.transport.fetch` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `provider.usage-normalizer` | `pi.provider.usage-renderer` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `registry.command` | `pi.registry.command` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `registry.provider` | `pi.extension.provider-registry-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `registry.ui` | `pi.extension.ui-registry-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `resource.discovery` | `resource.discovery.filesystem` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `runtime.acceptance-controller` | `common.runtime.acceptance-controller.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `runtime.acceptance-evidence` | `common.runtime.acceptance-evidence.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `runtime.assembly-graph` | `runtime.assembly-graph.lockfile` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `runtime.binding-planner` | `runtime.binding-planner.lockfile` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `runtime.capability-resolver` | `runtime.capability-resolver.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `runtime.lifecycle-runner` | `runtime.lifecycle-runner.scoped` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `runtime.module-catalog` | `runtime.module-catalog.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `session.branch-graph` | `pi.session.branch-graph.active-leaf` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `session.branching` | `session.branching.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `session.compaction-records` | `pi.session.branch-summary` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `session.context-selector` | `pi.session.context-selector.active-leaf` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `session.diff` | `session.branching.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `session.event-log` | `session.event-log.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `session.id-generator` | `pi.session.id-generator` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `session.message-part-projector` | `common.session.message-part-projector` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `session.message-store` | `session.message-store.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `session.pagination` | `pi.session.pagination.active-path` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `session.projector` | `pi.session.projector.jsonl-v3` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `session.reader` | `session.reader.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `session.store` | `pi.session.store.jsonl-v3` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `session.writer` | `session.writer.memory` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `tool.audit-log` | `pi.tool.runtime-event-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `tool.definition` | `pi.tool.register-tool-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `tool.executor` | `tool.executor.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `tool.permission-policy` | `pi.permission.event-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `tool.registry` | `pi.extension.dynamic-tool-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `tool.result-normalizer` | `pi.tool.result-event-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `tool.schema-adapter` | `pi.tool.typebox-bridge` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `tools` | `tool-pack.shell` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `tools.batch-scheduler` | `common.tools.batch-scheduler.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `tools.result-projector` | `common.tools.result-projector.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `tools.schema` | `common.tools.schema.default` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `trace.recorder` | `pi.trace.debug-surface` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `turn.compaction-policy` | `pi.turn.compaction-policy` | native | keep-with-evidence | TODO-025 | 6 | 3 | none |
| pi-mono | `turn.context-builder` | `pi.turn.context-builder` | native | keep-with-evidence | TODO-025 | 6 | 3 | none |
| pi-mono | `turn.continuation-policy` | `pi.turn.continuation-policy` | native | keep-with-evidence | TODO-025 | 6 | 3 | none |
| pi-mono | `turn.input-normalizer` | `pi.turn.input-normalizer` | native | keep-with-evidence | TODO-025 | 6 | 3 | none |
| pi-mono | `turn.prompt-assembler` | `pi.turn.prompt-assembler` | native | keep-with-evidence | TODO-025 | 6 | 3 | none |
| pi-mono | `turn.provider-request-builder` | `pi.turn.provider-request-builder` | native | keep-with-evidence | TODO-025 | 6 | 3 | none |
| pi-mono | `turn.provider-stream-runner` | `pi.turn.provider-stream-runner` | native | keep-with-evidence | TODO-025 | 6 | 3 | none |
| pi-mono | `turn.result-recorder` | `pi.turn.result-recorder` | native | keep-with-evidence | TODO-025 | 6 | 3 | none |
| pi-mono | `turn.retry-policy` | `pi.turn.retry-policy` | native | keep-with-evidence | TODO-025 | 6 | 3 | none |
| pi-mono | `turn.stop-condition` | `pi.turn.stop-condition` | native | keep-with-evidence | TODO-025 | 6 | 3 | none |
| pi-mono | `turn.stream-reducer` | `pi.turn.stream-reducer` | native | keep-with-evidence | TODO-025 | 6 | 3 | none |
| pi-mono | `turn.tool-call-planner` | `pi.turn.tool-call-planner` | native | keep-with-evidence | TODO-025 | 6 | 3 | none |
| pi-mono | `turn.tool-executor` | `pi.turn.tool-executor` | native | keep-with-evidence | TODO-025 | 6 | 3 | none |
| pi-mono | `ui.command-router` | `pi.ui.command-router` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `ui.event-loop` | `ui.event-loop.shared-tui` | common-shared | keep-with-evidence | TODO-025 | 0 | 0 | none |
| pi-mono | `ui.input-normalizer` | `pi.ui.input-normalizer` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `ui.renderer` | `pi.ui.renderer` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `ui.snapshot` | `pi.ui.snapshot` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |
| pi-mono | `ui.theme-registry` | `pi.ui.theme-registry` | native | keep-with-evidence | TODO-025 | 3 | 1 | none |

### compile-blocker

_None._

### lossy-compatible

| Product | Port | Provider | Level | Resolution | Owner | Native Evidence | Fixtures | Lossiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hermes-agent | `product.shell` | `hermes.product-shell.sdk` | compatible-bridge | keep-with-evidence | TODO-024 | 3 | 1 | hermes-product-shell-source-matrix-partial-fixture<br>native-parity-not-proven<br>product-bridge |
| hermes-agent | `prompt.system-builder` | `hermes.prompt.agent-builder` | compatible-bridge | keep-with-evidence | TODO-024 | 7 | 5 | hermes-prompt-factory-options-not-full-upstream-registry<br>hermes-prompt-scanner-semantic-not-full-upstream-scanner<br>hermes-upstream-registry-source-matrix-partial-fixture<br>missing-upstream-branch-fixture<br>partial-prompt-family<br>promptware-scanner-covered-by-partial-fixture |
| hermes-agent | `ui.command-router` | `hermes.ui.command-router` | compatible-bridge | keep-with-evidence | TODO-024 | 3 | 1 | hermes-ui-source-matrix-partial-fixture<br>native-parity-not-proven<br>product-bridge |
| hermes-agent | `ui.input-normalizer` | `hermes.ui.input-normalizer` | compatible-bridge | keep-with-evidence | TODO-024 | 3 | 1 | hermes-ui-source-matrix-partial-fixture<br>native-parity-not-proven<br>product-bridge |
| hermes-agent | `ui.renderer` | `hermes.ui.renderer` | compatible-bridge | keep-with-evidence | TODO-024 | 3 | 1 | hermes-ui-source-matrix-partial-fixture<br>native-parity-not-proven<br>product-bridge |
| nanobot | `product.shell` | `nanobot.product-shell.sdk` | compatible-bridge | keep-with-evidence | TODO-024 | 3 | 1 | nanobot-product-shell-source-matrix-partial-fixture<br>native-parity-not-proven<br>product-bridge |
| nanobot | `prompt.system-builder` | `nanobot.prompt.agent-builder` | compatible-bridge | keep-with-evidence | TODO-024 | 15 | 13 | missing-upstream-branch-fixture<br>nanobot-channel-lifecycle-timing-partial-fixture<br>nanobot-channel-registry-source-matrix-partial-fixture<br>nanobot-channel-side-effect-replay-partial-fixture<br>nanobot-platform-prompt-family-partial-fixture<br>nanobot-platform-router-rendering-partial-fixture<br>nanobot-upstream-prompt-source-matrix-partial-fixture<br>partial-prompt-family |
| nanobot | `ui.command-router` | `nanobot.ui.command-router` | compatible-bridge | keep-with-evidence | TODO-024 | 3 | 1 | nanobot-ui-source-matrix-partial-fixture<br>native-parity-not-proven<br>product-bridge |
| nanobot | `ui.input-normalizer` | `nanobot.ui.input-normalizer` | compatible-bridge | keep-with-evidence | TODO-024 | 3 | 1 | nanobot-ui-source-matrix-partial-fixture<br>native-parity-not-proven<br>product-bridge |
| nanobot | `ui.renderer` | `nanobot.ui.renderer` | compatible-bridge | keep-with-evidence | TODO-024 | 3 | 1 | nanobot-ui-source-matrix-partial-fixture<br>native-parity-not-proven<br>product-bridge |

### metadata-ok

| Product | Port | Provider | Level | Resolution | Owner | Native Evidence | Fixtures | Lossiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| hermes-agent | `block.manifest` | `hermes.block.compatibility-metadata` | metadata-only | metadata-overlay-only | TODO-028 | 2 | 0 | bom-or-overlay-only<br>not-executable-provider |
| hermes-agent | `capability.ref` | `hermes.capability.aliases` | metadata-only | metadata-overlay-only | TODO-028 | 2 | 0 | bom-or-overlay-only<br>not-executable-provider |
| hermes-agent | `conformance.ref` | `hermes.conformance.product-gate` | metadata-only | metadata-overlay-only | TODO-028 | 2 | 0 | bom-or-overlay-only<br>not-executable-provider |
| hermes-agent | `provider.cassette` | `hermes.provider.cassette-artifact` | metadata-only | metadata-overlay-only | TODO-028 | 2 | 0 | bom-or-overlay-only<br>not-executable-provider |
| hermes-agent | `recipe.binding` | `hermes.recipe.binding-aliases` | metadata-only | metadata-overlay-only | TODO-028 | 2 | 0 | bom-or-overlay-only<br>not-executable-provider |
| hermes-agent | `resource.grant` | `hermes.resource.grant-defaults` | metadata-only | metadata-overlay-only | TODO-028 | 2 | 0 | bom-or-overlay-only<br>not-executable-provider |
| nanobot | `block.manifest` | `nanobot.block.compatibility-metadata` | metadata-only | metadata-overlay-only | TODO-028 | 2 | 0 | bom-or-overlay-only<br>not-executable-provider |
| nanobot | `capability.ref` | `nanobot.capability.aliases` | metadata-only | metadata-overlay-only | TODO-028 | 2 | 0 | bom-or-overlay-only<br>not-executable-provider |
| nanobot | `conformance.ref` | `nanobot.conformance.product-gate` | metadata-only | metadata-overlay-only | TODO-028 | 2 | 0 | bom-or-overlay-only<br>not-executable-provider |
| nanobot | `provider.cassette` | `nanobot.provider.cassette-artifact` | metadata-only | metadata-overlay-only | TODO-028 | 2 | 0 | bom-or-overlay-only<br>not-executable-provider |
| nanobot | `recipe.binding` | `nanobot.recipe.binding-aliases` | metadata-only | metadata-overlay-only | TODO-028 | 2 | 0 | bom-or-overlay-only<br>not-executable-provider |
| nanobot | `resource.grant` | `nanobot.resource.grant-defaults` | metadata-only | metadata-overlay-only | TODO-028 | 2 | 0 | bom-or-overlay-only<br>not-executable-provider |
| opencode | `block.manifest` | `opencode.block.compatibility-metadata` | metadata-only | metadata-overlay-only | TODO-028 | 2 | 1 | bom-or-overlay-only<br>not-executable-provider<br>opencode-metadata-overlay-demotion-matrix-partial-fixture |
| opencode | `capability.ref` | `opencode.capability.aliases` | metadata-only | metadata-overlay-only | TODO-028 | 2 | 1 | bom-or-overlay-only<br>not-executable-provider<br>opencode-metadata-overlay-demotion-matrix-partial-fixture |
| opencode | `conformance.ref` | `opencode.conformance.product-gate` | metadata-only | metadata-overlay-only | TODO-028 | 2 | 1 | bom-or-overlay-only<br>not-executable-provider<br>opencode-metadata-overlay-demotion-matrix-partial-fixture |
| opencode | `provider.cassette` | `opencode.provider.cassette-artifact` | metadata-only | metadata-overlay-only | TODO-028 | 2 | 1 | bom-or-overlay-only<br>not-executable-provider<br>opencode-metadata-overlay-demotion-matrix-partial-fixture |
| opencode | `recipe.binding` | `opencode.recipe.binding-aliases` | metadata-only | metadata-overlay-only | TODO-028 | 2 | 1 | bom-or-overlay-only<br>not-executable-provider<br>opencode-metadata-overlay-demotion-matrix-partial-fixture |
| opencode | `resource.grant` | `opencode.resource.grant-defaults` | metadata-only | metadata-overlay-only | TODO-028 | 2 | 1 | bom-or-overlay-only<br>not-executable-provider<br>opencode-metadata-overlay-demotion-matrix-partial-fixture |
| pi-mono | `block.manifest` | `pi.block.compatibility-metadata` | metadata-only | metadata-overlay-only | TODO-028 | 1 | 0 | bom-or-overlay-only<br>not-executable-provider |
| pi-mono | `capability.ref` | `pi.capability.aliases` | metadata-only | metadata-overlay-only | TODO-028 | 1 | 0 | bom-or-overlay-only<br>not-executable-provider |
| pi-mono | `conformance.ref` | `pi.conformance.product-gate` | metadata-only | metadata-overlay-only | TODO-028 | 1 | 0 | bom-or-overlay-only<br>not-executable-provider |
| pi-mono | `provider.cassette` | `pi.provider.cassette-artifact` | metadata-only | metadata-overlay-only | TODO-028 | 1 | 0 | bom-or-overlay-only<br>not-executable-provider |
| pi-mono | `recipe.binding` | `pi.recipe.binding-aliases` | metadata-only | metadata-overlay-only | TODO-028 | 1 | 0 | bom-or-overlay-only<br>not-executable-provider |
| pi-mono | `resource.grant` | `pi.resource.grant-defaults` | metadata-only | metadata-overlay-only | TODO-028 | 1 | 0 | bom-or-overlay-only<br>not-executable-provider |

### misleading-coverage

_None._

### preview-only

_None._

## Metadata Overlays

| Product | Port | Executable Provider | Metadata Overlay Atoms |
| --- | --- | --- | --- |
| hermes-agent | `process-runner.port` | `process-runner.local` | `process-runner.disabled` |
| hermes-agent | `provider.cassette` | `hermes.provider.cassette-artifact` | `provider.cassette.jsonl`, `provider.cassette.memory` |
| hermes-agent | `provider.transport` | `provider.transport.fetch` | `provider.transport.mock-sse` |
| hermes-agent | `runtime.assembly-graph` | `runtime.assembly-graph.lockfile` | `hermes.runtime.graph-labels` |
| hermes-agent | `runtime.binding-planner` | `runtime.binding-planner.lockfile` | `hermes.runtime.binding-defaults` |
| hermes-agent | `runtime.capability-resolver` | `runtime.capability-resolver.default` | `hermes.runtime.capability-aliases` |
| hermes-agent | `runtime.lifecycle-runner` | `runtime.lifecycle-runner.scoped` | `hermes.runtime.lifecycle-defaults` |
| hermes-agent | `runtime.module-catalog` | `runtime.module-catalog.memory` | `hermes.runtime.module-aliases` |
| hermes-agent | `ui.renderer` | `hermes.ui.renderer` | `ui.renderer.noop` |
| nanobot | `process-runner.port` | `process-runner.local` | `process-runner.disabled` |
| nanobot | `provider.cassette` | `nanobot.provider.cassette-artifact` | `provider.cassette.jsonl`, `provider.cassette.memory` |
| nanobot | `provider.transport` | `provider.transport.fetch` | `provider.transport.mock-sse` |
| nanobot | `runtime.assembly-graph` | `runtime.assembly-graph.lockfile` | `nanobot.runtime.graph-labels` |
| nanobot | `runtime.binding-planner` | `runtime.binding-planner.lockfile` | `nanobot.runtime.binding-defaults` |
| nanobot | `runtime.capability-resolver` | `runtime.capability-resolver.default` | `nanobot.runtime.capability-aliases` |
| nanobot | `runtime.lifecycle-runner` | `runtime.lifecycle-runner.scoped` | `nanobot.runtime.lifecycle-defaults` |
| nanobot | `runtime.module-catalog` | `runtime.module-catalog.memory` | `nanobot.runtime.module-aliases` |
| nanobot | `ui.renderer` | `nanobot.ui.renderer` | `ui.renderer.noop` |
| opencode | `process-runner.port` | `opencode.shell.env-bridge` | `process-runner.disabled` |
| opencode | `provider.cassette` | `opencode.provider.cassette-artifact` | `provider.cassette.jsonl`, `provider.cassette.memory` |
| opencode | `provider.transport` | `opencode.provider.transport-instrumentation` | `provider.transport.mock-sse` |
| opencode | `runtime.assembly-graph` | `opencode.runtime.assembly-graph` | `opencode.runtime.graph-labels` |
| opencode | `runtime.binding-planner` | `opencode.runtime.binding-planner` | `opencode.runtime.binding-defaults` |
| opencode | `runtime.capability-resolver` | `opencode.runtime.capability-resolver` | `opencode.runtime.capability-aliases` |
| opencode | `runtime.lifecycle-runner` | `opencode.runtime.lifecycle-runner` | `opencode.runtime.lifecycle-defaults` |
| opencode | `runtime.module-catalog` | `opencode.runtime.module-catalog` | `opencode.runtime.module-aliases` |
| opencode | `ui.renderer` | `opencode.ui.renderer` | `ui.renderer.noop` |
| pi-mono | `process-runner.port` | `process-runner.local` | `process-runner.disabled` |
| pi-mono | `provider.cassette` | `pi.provider.cassette-artifact` | `provider.cassette.jsonl`, `provider.cassette.memory` |
| pi-mono | `provider.transport` | `provider.transport.fetch` | `provider.transport.mock-sse` |
| pi-mono | `runtime.assembly-graph` | `runtime.assembly-graph.lockfile` | `pi.runtime.graph-labels` |
| pi-mono | `runtime.binding-planner` | `runtime.binding-planner.lockfile` | `pi.runtime.binding-defaults` |
| pi-mono | `runtime.capability-resolver` | `runtime.capability-resolver.default` | `pi.runtime.capability-aliases` |
| pi-mono | `runtime.lifecycle-runner` | `runtime.lifecycle-runner.scoped` | `pi.runtime.lifecycle-defaults` |
| pi-mono | `runtime.module-catalog` | `runtime.module-catalog.memory` | `pi.runtime.module-aliases` |
| pi-mono | `ui.renderer` | `pi.ui.renderer` | `ui.renderer.noop` |

