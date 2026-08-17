# Parity Reports

This directory contains archived parity artifacts used as modular completion evidence.

## Live Provider

- `live-provider-parity.json`: generated on 2026-05-30 from the `anthropic`
  adapter with model `MiniMax-M2.7-highspeed`; OpenCode, Pi Mono, and Nanobot
  all passed live provider turn plus SDK readback checks.
- `live-provider-parity-summary.json` and `live-provider-parity-split/`: schema
  v2 split artifact generated from the same evidence shape. The summary file is
  stable enough for review, while the split directory holds structured evidence,
  raw transcript attachments, and a manifest with sha256/byte-size coverage.

Generate the final artifact from an environment that has real provider credentials:

```bash
HELIX_LIVE_PROVIDER=openrouter \
HELIX_LIVE_MODEL=openai/gpt-4.1 \
OPENROUTER_API_KEY=... \
npm run live:provider
```

Then verify that the artifact is acceptable completion evidence:

```bash
npm run live:provider:verify
npm run live:provider:split:verify
```

`npm run live:provider` only writes the final JSON path when the required live
run passes. Skipped, failed, stale, incomplete, or credential-shaped artifacts are
rejected by the verifier and do not satisfy the remaining TODO gate.

Generate a fresh split live artifact when credentials are available:

```bash
npm run live:provider:split
```

## External Tool Captures

External capture tools such as `claude-tap` write raw local evidence under
`.helix/external-tools/runs/<run-id>/`. That directory is ignored and is
not a report location. Raw JSONL, compact bundles, HTML viewers, stdout/stderr
logs, prompts, provider payloads, credentials, cookies, and host-specific paths
must not be copied into `docs/reports/`.
The CLI refuses capture output directories, `--tap-output-dir` overrides, and
raw import source artifacts that point into `docs/reports/`.
Any non-dry-run `external-tools capture` command is additionally gated by
`HELIX_EXTERNAL_CAPTURE=1` from the current shell plus provider
credentials or the explicit local/custom-provider no-credentials override.
The explicit gate flags are not honored from `.env`.
Before local external capture evidence is accepted as complete, run
`npm run external:claude-tap:preflight:captures` or
`npm run external:claude-tap:preflight:compare`. These strict gates validate the
run manifest, raw trace presence, normalized capture schema, tool version,
env allowlist, artifact sha256/byte-size entries, and flow comparison metadata.
For a single local run, use `external-tools verify-run-manifest` to check the
manifest-listed files, required raw/log/normalized artifacts, and recorded bytes
and sha256 values. Use `external-tools verify --run-manifest` to check that the
normalized capture links back to the manifest's raw source artifact hash.

Publish only normalized output produced by the Helix importer:

```bash
npm run helix -- external-tools import claude-tap \
  --product pi-mono \
  --task read-only-answer \
  --artifact .helix/external-tools/runs/pi-read-only/raw/trace.jsonl \
  --publish-report \
  --out-dir docs/reports/external-tools/claude-tap/pi-read-only \
  --json
```

The published `native-capture.json` must verify with:

```bash
npm run helix -- external-tools verify \
  --artifact docs/reports/external-tools/claude-tap/pi-read-only/native-capture.json \
  --json
```

Flow Graph native/compare modes can read the verified normalized capture
directly:

```bash
npm run helix -- flow-graph \
  --product pi-mono \
  --mode compare \
  --artifact docs/reports/external-tools/claude-tap/pi-read-only/native-capture.json \
  --json
```

The online Flow Observer can also read the normalized capture directly:

```bash
npm run docs:dev
curl "http://127.0.0.1:5173/api/harness-flow/compare?product=pi-mono&task=read-only-answer&source=external-capture&artifact=docs/reports/external-tools/claude-tap/pi-read-only/native-capture.json"
```

In that mode the UI shows the external tool, tool version, capture mode, source
artifact hash, product/task, and projection lossiness. It must not list the
external tool as a lego atom or product adapter.
The External Tools panel additionally shows installed/missing status, detected
version when the dev server can run `doctor`, install hints when missing, the
last normalized imported artifact, the last verifier result, and local-only
status for non-publishable artifacts.

Published external captures must pass the redaction verifier before being
linked from reports. The verifier rejects credential-shaped strings, raw
provider payload fields, secret-bearing header keys, and unredacted home
directory paths such as `/home/<user>/...`, `/Users/<user>/...`, or
`C:\\Users\\<user>\\...`.

When an explicit native-cadence fixture artifact is needed, convert the
verified normalized capture instead of linking the raw trace:

```bash
npm run helix -- external-tools to-native-cadence \
  --artifact docs/reports/external-tools/claude-tap/pi-read-only/native-capture.json \
  --out docs/reports/external-tools/claude-tap/pi-read-only/native-cadence-fixture.json \
  --json
```

Assembly contracts can also link the normalized capture directly as an
`externalTool` evidence ref:

```bash
npm run helix -- assemble \
  --product pi-mono \
  --with-external-capture docs/reports/external-tools/claude-tap/pi-read-only/native-capture.json \
  --json
```

Task parity can read the normalized capture as an `original` reference without
running the native CLI again:

```bash
npm run helix -- task-parity \
  --product pi-mono \
  --task read-only-answer \
  --mode original \
  --external-capture docs/reports/external-tools/claude-tap/pi-read-only/native-capture.json \
  --json
```

`capture-only` artifacts may be used to inspect prompt and tool-schema evidence,
but `external-tools to-native-cadence`, `flow-graph --mode native|compare`, and
`task-parity --external-capture` reject them because they do not prove task
success.

## Assembly Contracts

- `assembly-contract-opencode.json`
- `assembly-contract-pi-mono.json`
- `assembly-contract-nanobot.json`
- `assembly-contract-minimal.json`
- `assembly-contract-summary.md`

These are TODO-007 machine-readable assembly contracts. Each artifact is generated
from the executable recipe compiler and records product, recipe, selected atoms,
ports, bindings, surfaces, capabilities, swap points, common/product/reserved/
fixture-only atom classification, task parity linkage, native cadence fixture
linkage, stable fingerprints, and verifier diagnostics.

Generate and verify the current contract set:

```bash
npm run assembly:contract
npm run assembly:contract:verify
```

Individual artifact verification is also available:

```bash
npm run helix -- verify-assembly-contract \
  --artifact docs/reports/assembly-contract-opencode.json \
  --require-task-parity \
  --require-native-fixtures \
  --json
```

The contract hash intentionally excludes `generatedAt`; atom, binding, port,
surface, capability, and swap-point fingerprints remain stable across regenerated
timestamps and change when the semantic assembly changes.

## Product Task Parity

- `task-parity.json`: deterministic smoke artifact for assembled/original-contract
  OpenCode, Pi, and Nanobot across 12 real-task fixtures: read-only answer,
  single-file edit, multi-file refactor, test fix, shell output analysis,
  permission denial, tool error recovery, provider retry, context compaction,
  session fork, extension tool registration, and UI/CLI command routing.
- `task-parity-livecodebench.json`: credential-backed LiveCodeBench-derived
  repair task (`test_release_v5`, question `1883_B`) across assembled and
  original OpenCode/Pi/Nanobot. All six reports are `matched` or
  `acceptable-drift`, all modify only `solution.py`, and all include the
  `bash` result `livecodebench-1883-b tests passed`.
- `task-parity-cadence.json`: deterministic cassette cadence artifact for the
  smoke suite. It adds `cadenceEvidence`, `observationShape`,
  `acceptanceTimingEvidence`, and `fixtureReplay` to every report, plus
  `cadenceParity`, `cadenceScore`, weighted `cadenceScoreBreakdown` model v2,
  `cadenceLevel`, and `cadenceDrifts` to every assembled-vs-original pair.
- `task-parity-livecodebench-cadence.json`: credential-backed LiveCodeBench
  cadence artifact. It keeps report-level task gaps at zero while preserving
  stable pair-level `cadence.*` drift IDs for live transcript, trace, provider
  request, tool sequence, and early-accept differences. Every drift carries an
  owning plane, owning atom, candidate fixes, expected score delta, native
  fixture requirement, minimal reproduction signature, and observability
  metadata that separates exact, semantic, inferred, and informational scoring.
- `task-parity-livecodebench-cadence-diagnosis.md`: generated diagnosis report
  for the latest live cadence artifact. It contains the product score matrix,
  drift ownership/observability matrix, planned-fix score estimates, and a
  structural audit of whether product-specific behavior leaked into common
  atoms.
- `task-parity-livecodebench-native-cadence-fixtures.json`: replayable native
  cadence fixtures derived from original harness reports. These fixtures contain
  redacted provider shape, native version, task ID, cadence signature,
  observation shape, normalized native events/chunks, message part projection,
  and projection loss metadata. They let live scoring prove the native
  projection boundary before comparing drift.
- `task-parity-split-summary.json` and `task-parity-split/`: schema v2 split
  smoke artifact. The summary contains the pair/status/gap matrix and explicit
  semantic-vs-strict parity fields; evidence and raw per-report attachments live
  next to it with manifest hashes.
- `task-parity-native-cadence-fixtures-summary.json` and
  `task-parity-native-cadence-fixtures/`: schema v2 native cadence fixture set.
  The manifest indexes per-product fixture attachments so replay can validate
  cadence signatures without loading one giant JSON blob.
- `nanobot-lego-depth.json` and `nanobot-lego-depth.md`: Nanobot split-depth
  audit. It compares Nanobot against OpenCode/Pi across session, hook, prompt,
  runtime, agent-loop, tool, provider, config, UI, product-shell, and task-runner
  mechanisms and checks the common packages do not import Nanobot adapters.

Generate and verify the cassette smoke artifact:

```bash
npm run task:parity
npm run task:parity:verify
npm run task:parity:split
npm run task:parity:split:verify
npm run task:parity:native-cadence:split
npm run task:parity:native-cadence:split:replay
npm run nanobot:lego-depth
```

The current `original` task runner is a native CLI contract replay, not a live
upstream CLI invocation. It is useful for validating the common report model,
fixture isolation, workspace diffs, trace evidence, policy evidence, product
personality outputs, provider retry, compaction, task-level extension tools, and
session fork evidence.

Opt into native original sampling with credentials:

```bash
npm run helix -- task-parity \
  --task read-only-answer \
  --product opencode \
  --mode original \
  --provider live \
  --native-original \
  --model "$HELIX_LIVE_MODEL" \
  --json
```

The opt-in native runner now isolates HOME/XDG/session/npm/uv cache, applies
each task's env allowlist, and cleans up timed-out process groups. OpenCode and
Pi native CLI commands are wired through `npx`; Nanobot native CLI is wired
through `uvx --from nanobot-ai==0.2.0 nanobot agent`.

Generate and verify the public smoke/cadence artifacts:

```bash
npm run task:parity
npm run task:parity:verify
npm run task:parity:cadence
npm run task:parity:cadence:verify
npm run task:parity:native-cadence:split
npm run task:parity:native-cadence:split:replay
```

The smoke/cadence path is intentionally still pair-drifted at transcript/trace
level: the assembled and original harnesses satisfy the same task contract and
produce compatible workspace artifact shapes, but their user-visible summaries
and native event streams are not byte-identical. TODO-004 cadence evidence makes
that drift explicit instead of treating it as a task failure. Deterministic cassette runs
target `exact-cadence`; live runs target semantic cadence with a score of 70 or
higher unless an exception report explains a native projector gap, observation
lossiness, acceptance-timing boundary, or provider nondeterminism. Re-run
diagnosis, native cadence fixture generation, and fixture replay after every
live capture so score changes, replay boundaries, and remaining ownership stay
visible.

Legacy monolithic artifacts remain compatibility fixtures for the verifier.
Current review should prefer the split summary plus manifest: the main JSON tells
whether task success, semantic parity, strict trace parity, strict cadence, and
policy parity changed, while the attachments explain raw transcript/event
differences only when needed.
