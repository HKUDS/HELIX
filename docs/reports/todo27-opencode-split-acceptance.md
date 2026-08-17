# TODO-027 OpenCode Split Acceptance

Generated: 2026-06-15T09:42:49.269Z
Status: ready-for-review
Acceptance scope: opencode-split-review-only
TODO completion: executable-native-parity-verified-metadata-retained (completionClaim=false, nativeParityVerified=false, executableNativeParityVerified=true, productNativeComplete=108)
Fingerprint: 9e131ed2f49d6188
Upstream target: anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab

## Sources

| Source | OK | Fingerprint | Key counts |
| --- | --- | --- | --- |
| Assembly contract | yes | 8fc1974f111d3f7d | atoms 299, product atoms 119 |
| Flow graph | yes | a0f24a648cae6c69 | blocked stages 0/19 |
| Executable audit | yes | 44627efa9b6403d3 | compile blockers 0 |
| Current-module audit | yes | f0315a5abda17d33 | native complete 108 |
| TODO27 inventory | yes | 096d5a8372c51807 | fixtures 124/124 |

## Tracked Stages

| Stage | Atoms | Target satisfied | Blockers |
| --- | ---: | --- | --- |
| prompt.assemble | 7 | yes | none |
| provider.request | 4 | yes | none |
| tool.execute | 5 | yes | none |
| session.assistant-write | 5 | yes | none |

## Tracked Atoms

| Atom | Level | Disposition | Fixtures | Lossiness |
| --- | --- | --- | ---: | ---: |
| `opencode.prompt.mode-builder` | native | product-native-complete | 24 | 0 |
| `opencode.turn.provider-request-builder` | native | product-native-complete | 8 | 0 |
| `opencode.provider.request-options` | native | product-native-complete | 1 | 0 |
| `opencode.tool.schema-bridge` | native | product-native-complete | 1 | 0 |
| `opencode.session.store.sqlite-projection` | native | product-native-complete | 1 | 0 |
| `opencode.runtime.acceptance-controller.native-like` | native | product-native-complete | 1 | 0 |
| `opencode.product-shell.sdk` | native | product-native-complete | 1 | 0 |
| `opencode.ui.event-loop` | native | product-native-complete | 1 | 0 |
| `opencode.ui.renderer` | native | product-native-complete | 1 | 0 |
| `opencode.tool-pack.compatibility` | native | product-native-complete | 1 | 0 |
| `opencode.trace.debug-surface` | native | product-native-complete | 1 | 0 |
