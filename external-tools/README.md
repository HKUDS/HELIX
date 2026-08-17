# External Tools

External tools are local evidence collectors used by Helix. They are not lego atoms, product adapters, providers, or product shells.

An importer is only a Helix-side artifact adapter. It does not vendor the
external tool's source code or reimplement the tool as part of this repository;
it records a tool profile, invokes an installed binary / `uvx` package /
explicit path, then normalizes the resulting local artifacts through schemas
and verifiers. External tools also stay out of workspace package dependencies;
installation is a user/local environment concern checked by `doctor` and
preflight commands.

The intended flow is:

```text
native CLI run
  -> external tool capture
  -> raw local artifact under .helix/
  -> Helix importer
  -> normalized native evidence
  -> verifier / Flow Observer / assembly contract refs
```

Raw artifacts stay local by default. Published reports must be normalized and verified so they contain shape summaries, fingerprints, source hashes, and lossiness metadata instead of raw prompts, credentials, provider payloads, or host paths.

Current tool profiles:

- `claude-tap`: local proxy and trace viewer for agent API traffic.

Third-party attribution for `claude-tap`:

- Upstream repository: <https://github.com/liaohch3/claude-tap>
- Python package: <https://pypi.org/project/claude-tap/>
- License: MIT
- Upstream license file: <https://github.com/liaohch3/claude-tap/blob/main/LICENSE>
- Copyright: Copyright (c) 2025 liaohch3

Helix does not vendor the upstream `claude-tap` source code. The checked-in
files are Helix-owned profile metadata, schemas, fixtures, preflight
helpers, and docs for importing locally generated `claude-tap` artifacts. The
same notice is recorded in `external-tools/claude-tap/NOTICE.md` and
`THIRD_PARTY_NOTICES.md`.

`claude-tap` currently marks `nanobot` as unsupported. The profile and docs UI
surface this as a `needs-upstream-support` gap: use a Helix-owned
Nanobot capture path or wait for upstream claude-tap Nanobot client support
before treating external capture as Nanobot native evidence. Helix also
rejects `claude-tap` capture/import requests with `--product nanobot`, so a
profile gap cannot be turned into misleading normalized evidence by accident.

The workspace implementation mirrors the external-tool boundary:

- `packages/external-tools/src/run-manifest.ts` owns run identifiers.
- `packages/external-tools/src/runner.ts` owns generic process execution and artifact collection.
- `packages/external-tools/src/tools/claude-tap/launch.ts` owns claude-tap argv injection.
- `packages/external-tools/src/tools/claude-tap/import-jsonl.ts` and `import-compact.ts` own trace parsing.
- `packages/external-tools/src/tools/claude-tap/normalize.ts` owns normalized run outputs.
- `packages/external-tools/src/tools/claude-tap/verifier.ts` provides the claude-tap verifier entrypoint.
- `packages/external-tools/src/verifiers.ts` owns normalized capture and run-manifest linkage checks.

Check installed tools:

```bash
npm run helix -- external-tools list --json
npm run helix -- external-tools doctor claude-tap --json
```

Invocation strategies:

- `binary` runs `claude-tap` from `PATH` and is the default profile strategy.
- `uvx` runs `uvx claude-tap ...` without making `claude-tap` a default project
  or CI dependency.
- `explicitPath` runs the path supplied with `--tool-path`.

All three strategies are written to `run-manifest.json` as the actual command,
resolved command, argv, cwd, and env allowlist. The allowlist is the set of
environment variable names passed through to the external tool; values are not
written to the manifest, and the explicit Helix capture gate flags are
not passed through. Helix also strips Codex host control variables such
as `CODEX_REMOTE_PAYLOAD`, `CODEX_THREAD_ID`,
`CODEX_MANAGED_BY_NPM`, and `CODEX_MANAGED_PACKAGE_ROOT`; external tools get
provider/runtime configuration, not the Codex app's internal thread payload.
Real captures also probe the tool version through the same invocation strategy
and write it to `toolVersion` before launching the product client. Preview an
invocation without launching the tool:

```bash
npm run helix -- external-tools capture claude-tap \
  --strategy uvx \
  --dry-run \
  --product pi-mono \
  --task read-only-answer \
  --json \
  -- \
  --tap-client pi -- -p "Reply OK"
```

For the TODO32 read-only product set, use the rehearsal scripts. They write
dry-run manifests under `.helix/external-tools/dry-runs/binary/` or
`.helix/external-tools/dry-runs/uvx/` and never touch the real capture
directories:

```bash
npm run external:claude-tap:dry-run:read-only
npm run external:claude-tap:dry-run:uvx:read-only
npm run external:claude-tap:dry-run:verify:read-only
```

Or run the rehearsal and verification together:

```bash
npm run external:claude-tap:dry-run:acceptance:read-only
```

Default local captures should live under `.helix/external-tools/runs/<run-id>/`, which is treated as local workspace state rather than a committed report location.

Run a local capture:

```bash
HELIX_EXTERNAL_CAPTURE=1 npm run helix -- external-tools capture claude-tap \
  --product pi-mono \
  --task read-only-answer \
  --out-dir .helix/external-tools/runs/pi-read-only \
  --json \
  -- \
  --tap-client pi -- -p "Reply OK"
```

Manual real-capture acceptance is kept behind explicit scripts and is not part
of `npm test`:

```bash
npm run external:claude-tap:preflight
npm run external:claude-tap:doctor:required
HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:opencode:read-only
HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:pi:read-only
HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:hermes:read-only
npm run external:claude-tap:verify:read-only
```

If `claude-tap` is not installed on `PATH`, use the equivalent `uvx` path:

```bash
npm run external:claude-tap:doctor:uvx:required
HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:uvx:read-only
npm run external:claude-tap:verify:read-only
```

Once the environment is ready, the full local acceptance chain is available as
one command. It runs the dry-run rehearsal acceptance before checking the real
capture gates and launching any product client, then runs the matching
post-capture readiness gate before verify/compare:

```bash
HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:acceptance:uvx:read-only
```

Use `external:claude-tap:acceptance:read-only` instead when `claude-tap` is
installed directly on `PATH`.

`external:claude-tap:preflight` does not launch a product client or send model
requests. It reports tool strategy readiness, whether the consent/credential
gates are satisfied, and which local run artifacts already exist. It only
prints credential environment variable names, never values. The preflight helper
loads only known credential keys from `.env` using "do not override existing
environment variables" behavior; pass `--no-dotenv` to the helper script when
you want shell environment only. The real-capture consent flag
`HELIX_EXTERNAL_CAPTURE=1` and the local/custom-provider override
`HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS=1` are intentionally
shell-only and are not honored from `.env`.
Pass `--strategy binary`, `--strategy uvx`, or
`--strategy explicitPath --tool-path /path/to/claude-tap` to require the same
invocation strategy that a real capture will use. The binary acceptance chain
uses `external:claude-tap:preflight:strict`; the uvx acceptance chain uses
`external:claude-tap:preflight:uvx:strict`. The explicit-path strategy is a
manual/local path and preflight recommends generic
`npm run helix -- external-tools ... --tool-path ...` commands instead
of adding product-specific npm aliases. Passing `--tool-path` without an
explicit strategy is treated as `explicitPath`; recommended commands quote
paths with spaces. The explicit-path dry-run rehearsal verifier also receives
the same `--tool-path`, so rehearsal manifests are bound to the local tool
entrypoint before any real capture is attempted.
For post-run capture/compare readiness, the same strategy option also requires
each `run-manifest.json` to record the matching invocation strategy.
Pass `--product opencode`, `--product pi-mono`, or `--product hermes-agent` to
inspect a single run directory. Product-targeted preflight keeps the same
capture-ready and post-run gates, but its artifact list and `nextCommands`
collapse to the matching capture, verify, and post-run preflight commands.
For convenience, preflight also accepts `--product pi` as an alias for
`pi-mono` and `--product hermes` as an alias for `hermes-agent`; reports and
recommended commands use the canonical product ids.
For product-targeted post-run checks, reuse the existing npm aliases and pass
the product/strategy after `--`, for example
`npm run external:claude-tap:preflight:captures -- --strategy uvx --product pi-mono`.
The JSON report includes a `missing` array scoped to the current target:
capture-ready reports missing consent, credential, or tool-strategy gates;
post-run captures/compare reports the exact product artifact paths that are
missing or not verified. The human preflight output prints the same information
under `Missing:` so manual TODO32 acceptance can be driven without parsing JSON.
Use `npm run external:claude-tap:preflight:human -- --require-captures --product pi-mono`
when you want the readable report through an npm alias.
Each artifact entry also exposes `readiness.capturesReady` and
`readiness.compareReady`; the human `Artifacts:` line prints the same booleans
so partial Phase 4 progress can be checked product by product.
Capture-ready preflight does not validate existing run manifests or normalized
captures; it only answers whether the current shell can safely start a real
capture. Use `--require-captures` or `--require-compare` for post-run artifact
verification.
Its `nextCommands` follow the same order as the standard acceptance chain:
dry-run rehearsal, doctor, real capture, matching post-capture readiness gate,
verify, then matching compare readiness gate.

The capture scripts also require a known provider credential environment
variable such as `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`,
`GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `AZURE_OPENAI_API_KEY`,
`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, or `BEDROCK_API_KEY`. For a local or custom
provider with credentials stored
outside environment variables, set
`HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS=1` as an additional explicit
override in the current shell. The `helix external-tools capture` CLI
enforces the same gate for every non-dry-run capture, even when called without
an npm alias. The binary scripts use `--require-tool`, so a missing `claude-tap`
binary is a hard failure. The `uvx` scripts still use `--require-tool` but run
`uvx claude-tap ...` as the explicit manual strategy.

After the three captures finish, `external:claude-tap:verify:read-only` verifies
each `run-manifest.json` for required raw/log/normalized artifacts, verifies
each normalized capture against its manifest source artifact, writes an
assembled-vs-external comparison to `flow-compare.json` in each local run
directory, and verifies those flow graph comparison artifacts. The verify
scripts first check that the expected `normalized/native-capture.json` files
exist; they do not auto-run capture.
The standard acceptance scripts run `preflight:captures:binary` or
`preflight:captures:uvx` between capture and verify so strategy mismatches fail
before flow comparison artifacts are generated.
Use `npm run external:claude-tap:preflight:captures` to require all three
normalized captures, and `npm run external:claude-tap:preflight:compare` to
require all three flow comparison artifacts. These post-run gates also validate
the run manifest, raw trace presence, product, task, capture mode, artifact
sha256/byte-size entries, known tool version, env allowlist, and
assembled/original comparison metadata. Use
`npm run external:claude-tap:preflight:captures:binary` /
`npm run external:claude-tap:preflight:captures:uvx` or
`npm run external:claude-tap:preflight:compare:binary` or
`npm run external:claude-tap:preflight:compare:uvx` when a post-run gate must
prove the artifacts came from the matching acceptance strategy. For
explicit-path captures, pass the same `--strategy explicitPath --tool-path ...`
after `--` to `external:claude-tap:preflight:captures` or
`external:claude-tap:preflight:compare`; preflight then verifies that
`run-manifest.json` records the same command/resolved command path. The verify scripts and preflight gate
reuse `external-tools verify-run-manifest` for manifest integrity and
`external-tools verify --run-manifest` for capture/manifest linkage checks;
`preflight:captures:*` reports existing `flow-compare.json` files as skipped so
old comparison artifacts cannot slow down or block capture readiness.
`preflight:compare` reuses `verify-flow-graph` for each local `flow-compare.json`.
Those verifiers also check the tool profile's product support matrix, so a
hand-written Nanobot `claude-tap` manifest or normalized capture is rejected.

Helix records `run-manifest.json`, `logs/stdout.log`, `logs/stderr.log`,
the environment variable names passed to the external tool, and hashes for
files under the run directory. For `claude-tap`, the capture runner injects
`--tap-output-dir <run>/raw`, `--tap-no-open`, `--tap-no-live`,
`--tap-no-update-check`, and `--tap-store-stream-events` before the client
arguments.
When a successful capture writes a raw trace and the command includes
`--product`, Helix also materializes `normalized/native-capture.json`,
`normalized/runtime-trace.jsonl`, and `normalized/prompt-snapshot.md` using
redacted summaries and fingerprints.
If the external process exits non-zero, the local run directory still keeps the
manifest, logs, and any raw diagnostic files, but no normalized native evidence
is materialized and `external-tools verify-run-manifest` rejects the run. The
checked-in run-manifest schema allows a non-zero `exitCode` so diagnostic
manifests are parseable; successful evidence is still enforced by the verifier.
Capture output directories and explicit `--tap-output-dir` overrides are refused when they point into `docs/reports/`.

Verify a single local run's manifest:

```bash
npm run helix -- external-tools verify-run-manifest \
  --manifest .helix/external-tools/runs/pi-read-only/run-manifest.json \
  --product pi-mono \
  --task read-only-answer \
  --capture-mode real-capture \
  --require-artifact raw/trace.jsonl:raw-trace \
  --require-artifact normalized/native-capture.json:other \
  --require-artifact logs/stdout.log:log \
  --require-artifact logs/stderr.log:log \
  --json
```

Then verify the normalized capture/source raw artifact linkage:

```bash
npm run helix -- external-tools verify \
  --artifact .helix/external-tools/runs/pi-read-only/normalized/native-capture.json \
  --run-manifest .helix/external-tools/runs/pi-read-only/run-manifest.json \
  --json
```

Import an existing artifact into normalized evidence:

```bash
npm run helix -- external-tools import claude-tap \
  --product pi-mono \
  --task read-only-answer \
  --artifact .helix/external-tools/runs/pi-read-only/raw/trace.jsonl \
  --out .helix/external-tools/runs/pi-read-only/normalized/native-capture.json \
  --json
```

Publish only verified, normalized output:

```bash
npm run helix -- external-tools import claude-tap \
  --product pi-mono \
  --task read-only-answer \
  --artifact .helix/external-tools/runs/pi-read-only/raw/trace.jsonl \
  --publish-report \
  --out-dir docs/reports/external-tools/claude-tap/pi-read-only \
  --json
```

The verifier rejects credential-shaped values, raw provider payload fields,
secret-bearing header names, and unredacted home directory paths. Keep raw trace
files under `.helix/` or another local-only path, and publish only
normalized `native-capture.json` artifacts. `external-tools import` refuses raw
source artifacts located under `docs/reports/`.
Provider request evidence stores header names, counts, redacted-name markers,
and fingerprints only; header values are not copied into normalized artifacts.
Helix asks claude-tap to store stream events in the local raw run so this
summary can be reconstructed during later verification. When a trace includes
SSE events, the importer reconstructs a stream summary with event types, chunk
types, text/tool-argument byte counts, finish reason, and fingerprints without
storing raw stream chunks in normalized artifacts.
Bedrock EventStream captures are treated the same way: JSON or base64 JSON
chunks are summarized into `bedrock-eventstream` evidence without copying raw
chunk text into the normalized artifact.

Convert normalized evidence into the native cadence fixture shape when you need an explicit native-cadence artifact:

```bash
npm run helix -- external-tools to-native-cadence \
  --artifact .helix/external-tools/runs/pi-read-only/normalized/native-capture.json \
  --out docs/reports/external-tools/claude-tap/pi-read-only/native-cadence-fixture.json \
  --json
```

Use the verified normalized capture directly as Flow Graph native evidence:

```bash
npm run helix -- flow-graph \
  --product pi-mono \
  --mode compare \
  --artifact docs/reports/external-tools/claude-tap/pi-read-only/native-capture.json \
  --json
```

`flow-graph --mode native|compare` verifies the capture, rejects `capture-only`
artifacts as task-success evidence, checks the requested product/task, and then
projects the capture into the same native cadence evidence shape used by the
Flow Observer comparison path.

The online docs server exposes the same path through Flow Observer. Select
`External Capture` in the evidence selector, or call the API directly:

```bash
curl "http://127.0.0.1:5173/api/harness-flow/compare?product=pi-mono&task=read-only-answer&source=external-capture&artifact=docs/reports/external-tools/claude-tap/pi-read-only/native-capture.json"
```

The observer keeps the capture as external evidence: it shows source tool,
tool version, capture mode, source artifact hash, product/task, and projection
lossiness instead of displaying the tool as a product atom.

The docs-site External Tools panel also shows the tool profile, install hints,
last normalized artifact, verifier result, and local-only/publishable status.
When served through `npm run docs:dev`, `/api/external-tools/status` runs a
short `doctor` check so the panel can refresh installed/missing and detected
version without installing anything automatically.

Use the same verified capture as a task-parity `original` reference when you
want an original-mode report without spawning the native CLI again:

```bash
npm run helix -- task-parity \
  --product pi-mono \
  --task read-only-answer \
  --mode original \
  --external-capture docs/reports/external-tools/claude-tap/pi-read-only/native-capture.json \
  --json
```

`task-parity --external-capture` accepts exactly one matching product/task,
records `task.runner.external-capture`, preserves the capture mode and lossiness
metadata, and rejects `capture-only` artifacts as original task reference
evidence.

Link a verified normalized capture into an assembly contract as `externalTool` evidence:

```bash
npm run helix -- assemble \
  --product pi-mono \
  --with-external-capture docs/reports/external-tools/claude-tap/pi-read-only/native-capture.json \
  --json
```

Use an explicit native-cadence fixture with the Flow Graph / Flow Observer native path when you need to publish the projected fixture separately:

```bash
npm run helix -- flow-graph \
  --product pi-mono \
  --mode native \
  --artifact docs/reports/external-tools/claude-tap/pi-read-only/native-cadence-fixture.json \
  --json
```
