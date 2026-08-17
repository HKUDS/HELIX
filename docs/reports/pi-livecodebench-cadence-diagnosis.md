# Task Parity LiveCodeBench Cadence Diagnosis

Generated at: 2026-06-14T08:08:16.462Z

Source summary: reports=2, matched=1, acceptableDrift=1, gapsFound=0, failed=0

## Product Matrix

| Product | Task | Status | Score | Target | Raw Drifts | Estimated After Planned Fixes |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| pi-mono | livecodebench-1883-b-palindrome-removal | acceptable-drift | 76 | 70 | 7 | 100 |

## Drift Ownership

| Product | Drift | Plane | Atom | Level | Confidence | Scoring | Lossiness Refs | Expected Delta | Candidate Fixes |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: | --- |
| pi-mono | cadence.provider-request-count | native-projector | pi.native.projector | informational | semantic | informational | providerBoundary:semantic:per-request | 8 | refresh pi native cadence fixture<br>document native projector lossiness |
| pi-mono | cadence.tool-call-count | nondeterminism | pi.provider.nondeterminism | informational | inferred | informational | toolLifecycle:semantic:call-result | 8 | record repeated live runs to estimate provider nondeterminism<br>keep deterministic cassette scoring strict |
| pi-mono | cadence.tool-sequence | nondeterminism | pi.provider.nondeterminism | informational | inferred | informational | toolLifecycle:semantic:call-result | 8 | record repeated live runs to estimate provider nondeterminism<br>keep deterministic cassette scoring strict |
| pi-mono | cadence.tool-batch | nondeterminism | pi.provider.nondeterminism | informational | inferred | informational | toolLifecycle:semantic:call-result | 6 | record repeated live runs to estimate provider nondeterminism<br>keep deterministic cassette scoring strict |
| pi-mono | cadence.final-summary | nondeterminism | pi.provider.nondeterminism | informational | inferred | informational | messageWrite:semantic:storage-event | 3 | record repeated live runs to estimate provider nondeterminism<br>keep deterministic cassette scoring strict |
| pi-mono | cadence.streaming-delta | native-projector | pi.provider.stream-projector.native-like | informational | semantic | informational | streamDelta:semantic:semantic | 4 | refresh pi native cadence fixture<br>document native projector lossiness |
| pi-mono | cadence.early-accept | agent-loop | pi.runtime.acceptance-controller.native-like | informational | semantic | semantic-live | acceptance:semantic:explicit-event | 6 | bind pi.runtime.acceptance-controller.native-like<br>compare task-policy acceptance decisions |

## Structural Audit

Top-level categories added: none
Product-specific common optimizations: none
Requires follow-up TODO: no
