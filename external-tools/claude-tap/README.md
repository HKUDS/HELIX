# claude-tap Profile

Helix uses `claude-tap` as an external capture tool. The source is not
vendored into this repository. The importer only consumes `claude-tap` outputs:
Helix calls an installed CLI, `uvx claude-tap`, or an explicit local tool
path, imports the trace artifacts, and normalizes them into Helix native
evidence. `claude-tap` is not a workspace dependency; `doctor` and preflight
report whether the local binary or `uvx` strategy is available.

Upstream and license:

- Upstream repository: <https://github.com/liaohch3/claude-tap>
- Python package: <https://pypi.org/project/claude-tap/>
- License: MIT
- Upstream license file: <https://github.com/liaohch3/claude-tap/blob/main/LICENSE>
- Copyright: Copyright (c) 2025 liaohch3

See `NOTICE.md` and `../../THIRD_PARTY_NOTICES.md` for the public attribution
record. Helix keeps only integration files here; users install
`claude-tap` independently.

Checked-in schema files live under `external-tools/claude-tap/schemas/`:

- `trace-record.schema.json` documents the claude-tap JSONL subset accepted by the importer.
- `compact-trace.schema.json` documents the compact trace bundle subset materialized by the importer.
- `run-manifest.schema.json` documents Helix's external tool run manifest.
- `native-capture.schema.json` documents the sanitized normalized native capture artifact.

The product enum in these schemas follows the profile's `supportedProducts`.
Products listed in `unsupportedProducts`, such as `nanobot`, are intentionally
absent so hand-written artifacts cannot claim unsupported claude-tap evidence.

Supported first-pass products:

- `opencode` via `claude-tap --tap-client opencode`
- `pi-mono` via `claude-tap --tap-client pi`
- `hermes-agent` via `claude-tap --tap-client hermes`

`nanobot` is marked unsupported by this profile until either claude-tap adds
support or Helix provides a separate native capture path. The machine
readable profile records this as a `needs-upstream-support` gap so docs-site
and conformance can prevent Nanobot external capture from being mistaken for
native evidence. `helix external-tools capture/import claude-tap
--product nanobot` is rejected at the gateway until a real Nanobot capture path
exists.

Example import:

```bash
npm run helix -- external-tools import claude-tap \
  --product pi-mono \
  --task read-only-answer \
  --artifact .helix/external-tools/runs/pi-read-only/raw/trace.jsonl \
  --out .helix/external-tools/runs/pi-read-only/normalized/native-capture.json \
  --json
```

Rehearse the TODO32 read-only captures without launching `claude-tap` or
touching the real run directories. The two strategies write separate dry-run
manifest trees under `.helix/external-tools/dry-runs/`. The manifest
records the final capture argv Helix would pass to `claude-tap`,
including `--tap-output-dir <dry-run>/raw`, `--tap-no-open`, `--tap-no-live`,
`--tap-no-update-check`, and `--tap-store-stream-events`:

```bash
npm run external:claude-tap:dry-run:read-only
npm run external:claude-tap:dry-run:uvx:read-only
npm run external:claude-tap:dry-run:verify:read-only
```

Or run the rehearsal and verification together:

```bash
npm run external:claude-tap:dry-run:acceptance:read-only
```

Run `claude-tap` through Helix and write local raw artifacts plus a run manifest:

```bash
HELIX_EXTERNAL_CAPTURE=1 npm run helix -- external-tools capture claude-tap \
  --product pi-mono \
  --task read-only-answer \
  --out-dir .helix/external-tools/runs/pi-read-only \
  --json \
  -- \
  --tap-client pi -- -p "Reply OK"
```

Manual real-capture acceptance scripts are available for the TODO32 Phase 4
checks. They are intentionally gated and are not called by the default test
suite:

```bash
npm run external:claude-tap:preflight
npm run external:claude-tap:doctor:required
HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:opencode:read-only
HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:pi:read-only
HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:hermes:read-only
npm run external:claude-tap:verify:read-only
```

For a machine with `uvx` but no `claude-tap` binary on `PATH`:

```bash
npm run external:claude-tap:doctor:uvx:required
HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:capture:uvx:read-only
npm run external:claude-tap:verify:read-only
```

The same Phase 4 chain can run as one gated local acceptance command. It runs
the dry-run rehearsal acceptance before checking the real capture gates and
launching any product client, then runs the matching post-capture readiness
gate before verify/compare:

```bash
HELIX_EXTERNAL_CAPTURE=1 npm run external:claude-tap:acceptance:uvx:read-only
```

The preflight command checks tool strategy readiness, the explicit real-capture
gate, credential environment variable presence, and expected local artifacts.
It does not launch a product client or print credential values. It loads known
credential keys from `.env` by default and reports only loaded/skipped key
names; pass `--no-dotenv` to the helper script for shell environment only.
`HELIX_EXTERNAL_CAPTURE=1` and
`HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS=1` remain shell-only and are
not honored from `.env`.
Use `--strategy binary`, `--strategy uvx`, or
`--strategy explicitPath --tool-path /path/to/claude-tap` for
strategy-specific capture readiness. `external:claude-tap:preflight:strict`
targets the default binary chain, while
`external:claude-tap:preflight:uvx:strict` targets the uvx chain. The
explicit-path strategy is intentionally manual: preflight recommends generic
`npm run helix -- external-tools ... --tool-path ...` commands instead
of adding fixed npm aliases for local paths. Passing `--tool-path` without an
explicit strategy is treated as `explicitPath`; recommended commands quote
paths with spaces. The explicit-path dry-run rehearsal verifier also receives
the same `--tool-path`, so rehearsal manifests are bound to the local tool
entrypoint before any real capture is attempted.
The same `--strategy` option applies to post-run capture/compare readiness: it
requires each `run-manifest.json` to record the matching invocation strategy.
Pass `--product opencode`, `--product pi-mono`, or `--product hermes-agent` to
limit preflight to a single local run. The report then contains only that
product's artifacts and `nextCommands` point at the matching capture, verify,
and product-specific post-run preflight commands.
Preflight accepts `--product pi` and `--product hermes` as aliases for
`pi-mono` and `hermes-agent`; output is normalized back to the canonical product
ids.
Product-targeted post-run checks reuse the existing npm aliases with extra
arguments after `--`, for example
`npm run external:claude-tap:preflight:compare -- --strategy uvx --product pi-mono`.
The JSON report also includes a target-scoped `missing` array: capture-ready
lists missing consent, credential, or tool strategy gates, while post-run
captures/compare lists the exact product artifact paths that are missing or
not verified. The human preflight output prints the same data under `Missing:`
for manual TODO32 acceptance. Use
`npm run external:claude-tap:preflight:human -- --require-captures --product pi-mono`
to get that readable report through npm while still passing product/target
arguments after `--`.
Each product artifact also includes `readiness.capturesReady` and
`readiness.compareReady`, and the same values appear in the human `Artifacts:`
line for product-by-product Phase 4 progress checks.
Capture-ready preflight does not validate existing run manifests or normalized
captures; it only answers whether the current shell can safely start a real
capture. Use `--require-captures` or `--require-compare` for post-run artifact
verification.
Its `nextCommands` follow the same order as the standard acceptance chain:
dry-run rehearsal, doctor, real capture, matching post-capture readiness gate,
verify, then matching compare readiness gate.

The capture scripts require `--require-tool`, local `.helix/` output, and
the `external-tools/claude-tap/require-real-capture.mjs` gate. The gate requires
`HELIX_EXTERNAL_CAPTURE=1` and one known provider credential environment
variable such as `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`,
`GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `AZURE_OPENAI_API_KEY`,
`AWS_ACCESS_KEY_ID`, `AWS_PROFILE`, or `BEDROCK_API_KEY`. Set
`HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS=1` only for a local or custom
provider that does not expose credentials through environment variables, and set
it in the current shell. The `helix external-tools capture` CLI enforces
the same gate for every non-dry-run capture, even when called directly instead
of through the npm scripts.
The resulting `run-manifest.json` records only the environment variable names
passed to `claude-tap`; credential values and Helix capture gate flags are
not written to the manifest or forwarded as tool environment. Codex host
control variables such as `CODEX_REMOTE_PAYLOAD`, `CODEX_THREAD_ID`,
`CODEX_MANAGED_BY_NPM`, and `CODEX_MANAGED_PACKAGE_ROOT` are also stripped
before launching `claude-tap`; only explicit provider/runtime configuration is
allowed through. Real captures probe `claude-tap --version` through the
selected strategy and store the result as `toolVersion` before launching the
product client. Helix also disables claude-tap's live viewer, browser
auto-open behavior, and update check for scripted captures, while enabling local
stream-event storage so flow/cadence evidence can be reconstructed later; raw
traces and the generated local viewer artifact still stay under the run
directory.
If the launched client exits non-zero, Helix keeps the local manifest,
logs, and any raw trace files as diagnostics only; it does not materialize
`normalized/native-capture.json`, and the run manifest verifier rejects that
run as evidence. The run-manifest schema still allows non-zero `exitCode` so the
diagnostic manifest remains machine-readable.

The verify script checks all three `run-manifest.json` files for required
raw/log/normalized artifacts, verifies each normalized `native-capture.json`
against its manifest source artifact, runs `flow-graph --mode compare` against
each one, writes `flow-compare.json` beside the local run artifacts, and
verifies the comparison artifacts. Missing normalized captures fail before the
CLI verification commands run.
The standard acceptance scripts run `preflight:captures:binary` or
`preflight:captures:uvx` between capture and verify so strategy mismatches fail
before flow comparison artifacts are generated.
`external:claude-tap:preflight:captures` and
`external:claude-tap:preflight:compare` are strict post-run readiness gates for
the normalized capture and flow comparison artifacts, including the run
manifest, raw trace presence, artifact sha256/byte-size entries, known tool
version, env allowlist, product, task, capture mode, and assembled/original
comparison metadata. Use `external:claude-tap:preflight:captures:binary` /
`external:claude-tap:preflight:captures:uvx` or
`external:claude-tap:preflight:compare:binary` /
`external:claude-tap:preflight:compare:uvx` when validating artifacts generated
by a specific acceptance strategy. For explicit-path captures, pass the same
`--strategy explicitPath --tool-path ...` after `--` to
`external:claude-tap:preflight:captures` or
`external:claude-tap:preflight:compare`; preflight then verifies that the
manifest records the same command/resolved command path. For manifest integrity and normalized capture linkage,
preflight uses the same `external-tools verify-run-manifest` and
`external-tools verify --run-manifest` verifiers as the CLI.
The capture readiness gates do not validate existing `flow-compare.json` files;
they report those files as skipped so old comparison artifacts cannot slow down
or block capture readiness. For compare readiness, preflight runs
`verify-flow-graph` on each `flow-compare.json`, so a
locally hand-written comparison shape cannot satisfy `preflight:compare` unless
it is a real Helix flow comparison artifact. Those verifiers also reject
Nanobot `claude-tap` evidence if a manifest or normalized capture is
hand-written outside the capture/import gateway.

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

Dry-run the capture command without launching `claude-tap`:

```bash
npm run helix -- external-tools capture claude-tap \
  --dry-run \
  --product pi-mono \
  --task read-only-answer \
  --out-dir .helix/external-tools/runs/pi-read-only \
  -- \
  --tap-client pi -- -p "Reply OK"
```

Dry-run or launch through `uvx` when you do not want to install `claude-tap`
onto `PATH`:

```bash
npm run helix -- external-tools capture claude-tap \
  --strategy uvx \
  --dry-run \
  --product pi-mono \
  --task read-only-answer \
  --out-dir .helix/external-tools/runs/pi-read-only \
  --json \
  -- \
  --tap-client pi -- -p "Reply OK"
```

Mark a run as capture-only when it is only intended to prove prompt/tool-schema shape:

```bash
HELIX_EXTERNAL_CAPTURE=1 npm run helix -- external-tools capture claude-tap \
  --capture-only \
  --product pi-mono \
  --task prompt-snapshot \
  --out-dir .helix/external-tools/runs/pi-prompt-snapshot \
  --json \
  -- \
  --tap-client pi -- -p "Snapshot prompt and tool schema"
```

Convert a normalized capture into the existing Helix native cadence fixture shape:

```bash
npm run helix -- external-tools to-native-cadence \
  --artifact .helix/external-tools/runs/pi-read-only/normalized/native-capture.json \
  --out docs/reports/external-tools/claude-tap/pi-read-only/native-cadence-fixture.json \
  --json
```
