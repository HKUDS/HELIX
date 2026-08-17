# Pi LiveCodeBench Acceptance

Generated at: 2026-06-14T08:12:29Z

Scope: TODO-030 stage 1, Pi-only single task.

Conclusion: conditional-pass for the single-task gate. This is not a formal TODO-030 pass because the 10-task small batch and 50-task formal batch have not been run. After rebaselining the native-merge conformance expectations, the full test suite passes.

## Inputs

- Product: `pi-mono`
- Task: `livecodebench-1883-b-palindrome-removal`
- Provider: `live`
- Model: `MiniMax-M2.7-highspeed`
- Assembled artifact: `docs/reports/pi-livecodebench-task-parity.json`
- Cadence diagnosis: `docs/reports/pi-livecodebench-cadence-diagnosis.md`
- Native cadence fixture: `docs/reports/pi-livecodebench-native-cadence-fixtures.json`
- Native cadence replay: `docs/reports/pi-livecodebench-native-cadence-replay.json`

## Prerequisites

- `HEAD` matched local `origin/main` before the run.
- Working tree was not clean before the run.
- Pi inventory matched TODO-030 entry conditions: native 87, compatible-bridge 0, native-like 0, preview-shell 7, metadata-only 11.
- Preview-shell and metadata-only items are treated as labels, not core native blockers.

## Result

| Check | Result |
| --- | --- |
| Functional task result | Passed |
| Modified files | `solution.py` only |
| Artifact parity | Passed |
| Policy parity | Passed |
| Session persisted/readback evidence | Passed |
| Task parity verifier | Passed |
| Native cadence fixture verification | Passed |
| Native cadence replay | Passed |
| Cadence parity | Drift |
| Cadence score | 76 / 70 |

## Assembled vs Original

| Metric | Assembled Pi | Native Pi reference |
| --- | ---: | ---: |
| Provider requests | 4 | 9 |
| Tool calls | 4 | 12 |
| Trace events | 91 | 116 |
| Transcript messages | 2 | 2 |
| Modified files | 1 | 1 |

The assembled run used `read>read>edit>bash`. The native reference used `bash>bash>bash>read>read>read>read>edit>edit>edit>bash>bash`.

## Drift Ownership

| Drift | Plane | Atom | Assembled | Original |
| --- | --- | --- | --- | --- |
| `cadence.provider-request-count` | native-projector | `pi.native.projector` | 4 | 9 |
| `cadence.tool-call-count` | nondeterminism | `pi.provider.nondeterminism` | 4 | 12 |
| `cadence.tool-sequence` | nondeterminism | `pi.provider.nondeterminism` | `read>read>edit>bash` | `bash>bash>bash>read>read>read>read>edit>edit>edit>bash>bash` |
| `cadence.tool-batch` | nondeterminism | `pi.provider.nondeterminism` | four single-tool batches | twelve single-tool batches |
| `cadence.final-summary` | nondeterminism | `pi.provider.nondeterminism` | normalized drift | normalized drift |
| `cadence.streaming-delta` | native-projector | `pi.provider.stream-projector.native-like` | pipeline trace stream | native session/message/tool event stream |
| `cadence.early-accept` | agent-loop | `pi.runtime.acceptance-controller.native-like` | false | true |

Acceptance timing remains informational: assembled acceptance visibility is inferred, while native Pi exposes an explicit accepted-early event. The pair still satisfies semantic acceptance evidence.

## Commands

- Passed: `npm run helix -- task-parity --task livecodebench-1883-b-palindrome-removal --product pi-mono --mode assembled,original --provider live --native-original --require-credentials --timeout-ms 300000 --out docs/reports/pi-livecodebench-task-parity.json --json`
- Passed: `npm run helix -- verify-task-parity --artifact docs/reports/pi-livecodebench-task-parity.json --product pi-mono --mode assembled,original --task livecodebench-1883-b-palindrome-removal --json`
- Passed: `npm run helix -- task-parity cadence-diagnose --artifact docs/reports/pi-livecodebench-task-parity.json --out docs/reports/pi-livecodebench-cadence-diagnosis.md --json`
- Passed: `npm run helix -- task-parity native-cadence-fixtures --artifact docs/reports/pi-livecodebench-task-parity.json --out docs/reports/pi-livecodebench-native-cadence-fixtures.json --json`
- Passed: `npm run helix -- task-parity replay-native-cadence --fixture docs/reports/pi-livecodebench-native-cadence-fixtures.json --out docs/reports/pi-livecodebench-native-cadence-replay.json --json`
- Passed: `npm run typecheck`
- Passed: `npm run assembly:contract:verify`
- Passed: `npm test`

`npm test` passed with 87 test files and 703 tests after the TODO27/TODO29 visibility, audit, route, and source-file dispatch expectations were aligned with the native product-schema merge.

## Limitations

- This was a Pi-only run, not the four-product npm script artifact from TODO-030.
- The 10-task small batch and 50-task formal batch remain unrun.
- The current worktree was dirty before the run.
- Full native stop/continue/accept timing is still semantic rather than exact.

## Next Actions

- Run a 10-task Pi LiveCodeBench batch from clean workspaces.
- Repeat live Pi runs to separate provider nondeterminism from structural cadence drift.
- Capture exact Pi native stop/continue/accept timestamp fixtures.
- Keep future conformance rebaselines tied to generated inventory and current-module audit reports.
