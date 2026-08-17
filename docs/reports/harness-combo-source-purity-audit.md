# Harness Combo Source-Purity Audit

Generated: 2026-06-27T11:18:23.849Z

This audit separates source dimensions from runtime wrapper fields. Source dimensions are `session`, `hooks`, `config`, `prompt`, `tools`, `turn`, and `acceptance`.

## Recipe Artifacts

| Recipe Dir | Recipes | Source-Clean | Wrapper-Clean | Wrapper-Issue Recipes |
| --- | ---: | ---: | ---: | ---: |
| docs/reports/harness-combo-recipes | 1031 | 1031/1031 | 0/1031 | 1031 |
| docs/reports/harness-combo-recipes-decoupled-acceptance | 4096 | 4096/4096 | 0/4096 | 4096 |

## docs/reports/harness-combo-recipes

Source dimension values: clean.

Non-source wrapper field counts:
- atom:contracts: 1031
- metadata.product:opencode-pi-hybrid runtime wrapper: 1031
- personality:opencode-pi-hybrid-personality: 1031
- productShells:not-derived-from-surfaces: 1030
- policy:shell.execution mode=enabled source=harness-combo-generator: 1024
- strategy:tool.permission mode=workspace-scoped source=harness-combo-generator: 1024

## docs/reports/harness-combo-recipes-decoupled-acceptance

Source dimension values: clean.

Non-source wrapper field counts:
- atom:contracts: 4096
- metadata.product:opencode-pi-hybrid runtime wrapper: 4096
- personality:opencode-pi-hybrid-personality: 4096
- policy:shell.execution mode=enabled source=harness-combo-generator: 4096
- strategy:tool.permission mode=workspace-scoped source=harness-combo-generator: 4096
- productShells:not-derived-from-surfaces: 4095

## Script Findings

| File | Pattern | Matches | Meaning |
| --- | --- | ---: | --- |
| scripts/screen-harness-combo-smoke.ts | `product: "opencode-pi-hybrid"` | 1 | Combo screening still routes through the hybrid assembler wrapper. |

Conclusion: historical combo artifacts have clean source-dimension values, but they are not source-pure harness definitions because the generated wrapper injected non-source runtime fields. Old combo scores should be labeled contaminated and rerun with source-only recipes.
