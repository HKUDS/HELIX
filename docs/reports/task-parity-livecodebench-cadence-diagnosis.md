# Task Parity LiveCodeBench Cadence Diagnosis

Generated at: 2026-05-30T06:40:26.824Z

Source summary: reports=6, matched=3, acceptableDrift=3, gapsFound=0, failed=0

## Product Matrix

| Product | Task | Status | Score | Target | Raw Drifts | Estimated After Planned Fixes |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| opencode | livecodebench-1883-b-palindrome-removal | acceptable-drift | 79 | 70 | 7 | 100 |
| pi-mono | livecodebench-1883-b-palindrome-removal | acceptable-drift | 73 | 70 | 8 | 100 |
| nanobot | livecodebench-1883-b-palindrome-removal | acceptable-drift | 76 | 70 | 7 | 100 |

## Drift Ownership

| Product | Drift | Plane | Atom | Level | Confidence | Scoring | Lossiness Refs | Expected Delta | Candidate Fixes |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: | --- |
| opencode | cadence.provider-request-count | native-projector | opencode.native.projector | informational | inferred | informational | providerBoundary:aggregated:aggregate | 8 | refresh opencode native cadence fixture<br>document native projector lossiness |
| opencode | cadence.tool-call-count | nondeterminism | opencode.provider.nondeterminism | informational | inferred | informational | toolLifecycle:semantic:call-result | 8 | record repeated live runs to estimate provider nondeterminism<br>keep deterministic cassette scoring strict |
| opencode | cadence.tool-sequence | nondeterminism | opencode.provider.nondeterminism | informational | inferred | informational | toolLifecycle:semantic:call-result | 8 | record repeated live runs to estimate provider nondeterminism<br>keep deterministic cassette scoring strict |
| opencode | cadence.tool-batch | nondeterminism | opencode.provider.nondeterminism | informational | inferred | informational | toolLifecycle:semantic:call-result | 6 | record repeated live runs to estimate provider nondeterminism<br>keep deterministic cassette scoring strict |
| opencode | cadence.message-part-type | native-projector | opencode.session.message-part-projector.native-like | informational | inferred | informational | messageWrite:semantic:final-message<br>streamDelta:semantic:text-only | 4 | refresh opencode native cadence fixture<br>document native projector lossiness |
| opencode | cadence.final-summary | nondeterminism | opencode.provider.nondeterminism | informational | inferred | informational | messageWrite:semantic:final-message | 3 | record repeated live runs to estimate provider nondeterminism<br>keep deterministic cassette scoring strict |
| opencode | cadence.streaming-delta | native-projector | opencode.provider.stream-projector.native-like | informational | inferred | informational | streamDelta:semantic:text-only | 4 | refresh opencode native cadence fixture<br>document native projector lossiness |
| pi-mono | cadence.provider-request-count | native-projector | pi.native.projector | informational | semantic | informational | providerBoundary:semantic:per-request | 8 | refresh pi native cadence fixture<br>document native projector lossiness |
| pi-mono | cadence.tool-call-count | nondeterminism | pi.provider.nondeterminism | informational | inferred | informational | toolLifecycle:semantic:call-result | 8 | record repeated live runs to estimate provider nondeterminism<br>keep deterministic cassette scoring strict |
| pi-mono | cadence.tool-sequence | nondeterminism | pi.provider.nondeterminism | informational | inferred | informational | toolLifecycle:semantic:call-result | 8 | record repeated live runs to estimate provider nondeterminism<br>keep deterministic cassette scoring strict |
| pi-mono | cadence.tool-batch | nondeterminism | pi.provider.nondeterminism | informational | inferred | informational | toolLifecycle:semantic:call-result | 6 | record repeated live runs to estimate provider nondeterminism<br>keep deterministic cassette scoring strict |
| pi-mono | cadence.message-part-type | native-projector | pi.session.message-part-projector.native-like | informational | semantic | informational | messageWrite:semantic:storage-event<br>streamDelta:semantic:semantic | 4 | refresh pi native cadence fixture<br>document native projector lossiness |
| pi-mono | cadence.final-summary | nondeterminism | pi.provider.nondeterminism | informational | inferred | informational | messageWrite:semantic:storage-event | 3 | record repeated live runs to estimate provider nondeterminism<br>keep deterministic cassette scoring strict |
| pi-mono | cadence.streaming-delta | native-projector | pi.provider.stream-projector.native-like | informational | semantic | informational | streamDelta:semantic:semantic | 4 | refresh pi native cadence fixture<br>document native projector lossiness |
| pi-mono | cadence.early-accept | agent-loop | pi.runtime.acceptance-controller.native-like | informational | semantic | semantic-live | acceptance:semantic:explicit-event | 6 | bind pi.runtime.acceptance-controller.native-like<br>compare task-policy acceptance decisions |
| nanobot | cadence.provider-request-count | native-projector | nanobot.native.projector | informational | inferred | informational | providerBoundary:aggregated:aggregate | 8 | refresh nanobot native cadence fixture<br>document native projector lossiness |
| nanobot | cadence.tool-sequence | nondeterminism | nanobot.provider.nondeterminism | informational | inferred | informational | toolLifecycle:semantic:call-result | 8 | record repeated live runs to estimate provider nondeterminism<br>keep deterministic cassette scoring strict |
| nanobot | cadence.tool-batch | nondeterminism | nanobot.provider.nondeterminism | informational | inferred | informational | toolLifecycle:semantic:call-result | 6 | record repeated live runs to estimate provider nondeterminism<br>keep deterministic cassette scoring strict |
| nanobot | cadence.message-part-type | native-projector | nanobot.session.message-part-projector.native-like | informational | inferred | informational | messageWrite:semantic:final-message<br>streamDelta:semantic:text-only | 4 | refresh nanobot native cadence fixture<br>document native projector lossiness |
| nanobot | cadence.final-summary | nondeterminism | nanobot.provider.nondeterminism | informational | inferred | informational | messageWrite:semantic:final-message | 3 | record repeated live runs to estimate provider nondeterminism<br>keep deterministic cassette scoring strict |
| nanobot | cadence.streaming-delta | native-projector | nanobot.provider.stream-projector.native-like | informational | inferred | informational | streamDelta:semantic:text-only | 4 | refresh nanobot native cadence fixture<br>document native projector lossiness |
| nanobot | cadence.early-accept | agent-loop | nanobot.runtime.acceptance-controller.native-like | informational | inferred | semantic-live | acceptance:semantic:explicit-event | 6 | bind nanobot.runtime.acceptance-controller.native-like<br>compare task-policy acceptance decisions |

## Structural Audit

Top-level categories added: none
Product-specific common optimizations: none
Requires follow-up TODO: no
