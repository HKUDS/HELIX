# Nanobot Lego Depth

Generated at: 2026-05-30T09:59:33.849Z
Status: ok
Upstream parity mode: native-captured-upstream-like

## Mechanisms

| Mechanism | Plane | Status | Owning atoms | Evidence |
| --- | --- | --- | --- | --- |
| session-store | session | product-atom-covered | nanobot.session.store.jsonl<br>session.message-store.memory<br>session.message-store.service<br>session.store.jsonl-tree<br>session.store.memory<br>session.store.sqlite-projection | product-atom:nanobot.session.store.jsonl<br>port:session.message-store<br>port:session.store |
| session-projector | session | product-atom-covered | nanobot.session.message-part-projector.native-like<br>nanobot.session.projector.jsonl<br>common.session.message-part-projector<br>session.projector.common-transcript | product-atom:nanobot.session.message-part-projector.native-like<br>product-atom:nanobot.session.projector.jsonl<br>port:session.message-part-projector<br>port:session.projector |
| hook-plugin | hook | product-atom-covered | nanobot.hook.error-defaults<br>nanobot.hook.handler-adapter<br>nanobot.hook.observer-adapter<br>nanobot.hook.plugin-bridge<br>nanobot.hook.scheduler-defaults<br>nanobot.plugin.cleanup<br>nanobot.plugin.event-mapper<br>nanobot.plugin.loader<br>nanobot.plugin.provider-registry-bridge<br>nanobot.plugin.ui-registry-bridge | product-atom:nanobot.hook.error-defaults<br>product-atom:nanobot.hook.handler-adapter<br>product-atom:nanobot.hook.observer-adapter<br>product-atom:nanobot.hook.plugin-bridge<br>port:hook.bus<br>port:hook.cleanup-scope<br>port:hook.error-policy<br>port:hook.handler-chain |
| prompt-resource | prompt | product-atom-covered | nanobot.prompt.agent-builder<br>nanobot.prompt.compaction-adapter<br>nanobot.prompt.model-adapter<br>nanobot.prompt.resource-loader<br>nanobot.prompt.tool-renderer<br>nanobot.resource.discovery<br>nanobot.resource.grant-defaults<br>prompt.compaction-adapter.common<br>prompt.model-capability-adapter.common<br>prompt.resource-loader.markdown | product-atom:nanobot.prompt.agent-builder<br>product-atom:nanobot.prompt.compaction-adapter<br>product-atom:nanobot.prompt.model-adapter<br>product-atom:nanobot.prompt.resource-loader<br>port:prompt.compaction-adapter<br>port:prompt.model-capability-adapter<br>port:prompt.resource-loader<br>port:prompt.system-builder |
| runtime-acceptance | runtime | product-atom-covered | nanobot.runtime.acceptance-controller.native-like<br>nanobot.runtime.acceptance-evidence.native-like<br>common.runtime.acceptance-controller.default<br>common.runtime.acceptance-evidence.default | product-atom:nanobot.runtime.acceptance-controller.native-like<br>product-atom:nanobot.runtime.acceptance-evidence.native-like<br>port:runtime.acceptance-controller<br>port:runtime.acceptance-evidence |
| agent-loop-boundary | agent-loop | product-atom-covered | nanobot.agent-loop.final-summary.native-like<br>nanobot.agent-loop.request-boundary.native-like<br>nanobot.turn.context-builder<br>common.agent-loop.final-summary.default<br>common.agent-loop.request-boundary.default<br>turn.context-builder.transcript | product-atom:nanobot.agent-loop.final-summary.native-like<br>product-atom:nanobot.agent-loop.request-boundary.native-like<br>product-atom:nanobot.turn.context-builder<br>port:agent-loop.final-summary<br>port:agent-loop.request-boundary<br>port:turn.context-builder |
| tool-schema-result | tool | product-atom-covered | nanobot.tool.registry-bridge<br>nanobot.tools.result-projector.native-like<br>nanobot.tools.schema.native-like<br>common.tools.result-projector.default<br>common.tools.schema.default | product-atom:nanobot.tool.registry-bridge<br>product-atom:nanobot.tools.result-projector.native-like<br>product-atom:nanobot.tools.schema.native-like<br>port:tool.registry<br>port:tools.result-projector<br>port:tools.schema |
| provider-request-stream | provider | product-atom-covered | nanobot.provider.parser-observer<br>nanobot.provider.plugin-descriptor<br>nanobot.provider.request-options<br>nanobot.provider.stream-projector.native-like<br>nanobot.provider.streaming-delta-recorder.native-like<br>nanobot.provider.transport-instrumentation<br>nanobot.provider.usage-renderer<br>common.provider.stream-projector<br>common.provider.streaming-delta-recorder<br>provider.request-shape.anthropic | product-atom:nanobot.provider.parser-observer<br>product-atom:nanobot.provider.plugin-descriptor<br>product-atom:nanobot.provider.request-options<br>product-atom:nanobot.provider.stream-projector.native-like<br>port:provider.request-shape<br>port:provider.stream<br>port:provider.stream-parser<br>port:provider.stream-projector |
| config-loading | config | product-atom-covered | nanobot.config.precedence<br>nanobot.config.source<br>nanobot.config.validator<br>config.merge.deep<br>config.merge.priority<br>config.merge.replace<br>config.source.env<br>config.source.file<br>config.validator.schema<br>config.validator.typescript | product-atom:nanobot.config.precedence<br>product-atom:nanobot.config.source<br>product-atom:nanobot.config.validator<br>port:config.merge-strategy<br>port:config.source<br>port:config.validator |
| ui-surfaces | ui | product-atom-covered | nanobot.ui.command-router<br>nanobot.ui.input-normalizer<br>nanobot.ui.renderer<br>nanobot.ui.snapshot<br>nanobot.ui.theme-registry<br>ui.command-router.common<br>ui.input-normalizer.common<br>ui.renderer.html<br>ui.renderer.noop<br>ui.renderer.text | product-atom:nanobot.ui.command-router<br>product-atom:nanobot.ui.input-normalizer<br>product-atom:nanobot.ui.renderer<br>product-atom:nanobot.ui.snapshot<br>port:prompt.system-builder<br>port:registry.ui<br>port:turn.context-builder<br>port:turn.provider-request-builder |
| product-shells | product | product-atom-covered | nanobot.product-shell.cli<br>nanobot.product-shell.harness<br>nanobot.product-shell.sdk<br>nanobot.product-shell.server<br>nanobot.product-shell.tui<br>nanobot.product-shell.web-ui | product-atom:nanobot.product-shell.cli<br>product-atom:nanobot.product-shell.harness<br>product-atom:nanobot.product-shell.sdk<br>product-atom:nanobot.product-shell.server<br>port:product.shell |
| task-runner | task | fixture-backed | none | port:tools.schema<br>fixture:nanobot.task.runner.assembled<br>fixture:nanobot.task.runner.native-cli |

## Product Matrix

| Product | Atoms | Common | Product | Shells | Ports | Swap Points | Public Exports | Conformance | Native Fixtures |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| opencode | 285 | 176 | 104 | 18 | 96 | 96 | 100% | 100% | 3% |
| pi-mono | 291 | 176 | 110 | 21 | 96 | 96 | 100% | 100% | 3% |
| nanobot | 281 | 176 | 100 | 11 | 96 | 96 | 100% | 100% | 3% |

## Anti-Overfit

Common imports Nanobot adapter: no
Boundary issues: 0
