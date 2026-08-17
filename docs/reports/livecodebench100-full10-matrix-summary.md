# LiveCodeBench100 Full-10 Matrix Summary

Generated: 2026-07-17T06:04:51.851Z

Matrix dir: `docs/reports/livecodebench100-full10-matrix`
Combo manifest: `docs/reports/harness-combo-recipes/manifest.json`
Candidate set: `default`
Attempts per task: 10

## Full Search Setting

`full` is the union over searched runnable harnesses: a task is counted as solved if any candidate succeeds in any observed attempt. This is a search-space coverage metric, not a single deployable fixed harness.

| Setting | Candidates | Complete Tasks | Score | vs `pi-mono` | Successful Slots | Slot Rate | Observed Attempts |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| full | 4 | 100/100 | 87/100 | +11 | 2179/4000 | 0.5447 | 4000 |

## Fixed Harness Rows

| Candidate | Runnable | Complete 10x | Early-stop Score | Early-stop Attempts | Full-10 Successes | Full-10 Slot Rate | Observed Attempts |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| opencode-pi-hybrid | yes | 100/100 | 75/100 | 372 | 552/1000 | 0.552 | 1000 |
| combo-sh-opencode-cfg-opencode-prompt-pi-mono-tools-opencode-turn-pi-mono | yes | 100/100 | 77/100 | 380 | 544/1000 | 0.544 | 1000 |
| all-real-harness-attempts | no | no | - | - | - | - | - |
| pi-mono | yes | 100/100 | 76/100 | 396 | 535/1000 | 0.535 | 1000 |
| combo-sh-opencode-cfg-pi-mono-prompt-pi-mono-tools-opencode-turn-pi-mono | yes | 100/100 | 78/100 | 368 | 548/1000 | 0.548 | 1000 |

`all-real-harness-attempts` is excluded because it is a portfolio row, not a runnable fixed harness.

## Source-Purity Audit

The `lego` object intentionally excludes permission strategy; permission is a runtime policy, not one of the declared source dimensions.

| Candidate | Audit Status | Permission Policy | Non-source Wrapper Fields |
| --- | --- | --- | --- |
| opencode-pi-hybrid | built-in-hybrid-product | opencode-plugin-hooks+pi-extension-events | personality:opencode-pi-hybrid-personality |
| combo-sh-opencode-cfg-opencode-prompt-pi-mono-tools-opencode-turn-pi-mono | legacy-generated-wrapper-contaminated | workspace-scoped | atom:contracts<br>productShells:not-derived-from-surfaces<br>strategy:tool.permission mode=workspace-scoped source=harness-combo-generator<br>policy:shell.execution mode=enabled source=harness-combo-generator<br>personality:opencode-pi-hybrid-personality<br>metadata.product:opencode-pi-hybrid runtime wrapper |
| pi-mono | source-product-recipe | product-personality | none |
| combo-sh-opencode-cfg-pi-mono-prompt-pi-mono-tools-opencode-turn-pi-mono | legacy-generated-wrapper-contaminated | workspace-scoped | atom:contracts<br>productShells:not-derived-from-surfaces<br>strategy:tool.permission mode=workspace-scoped source=harness-combo-generator<br>policy:shell.execution mode=enabled source=harness-combo-generator<br>personality:opencode-pi-hybrid-personality<br>metadata.product:opencode-pi-hybrid runtime wrapper |

Rows with source issues or non-source wrapper fields should be treated as contaminated until rerun from source-only generated recipes.

