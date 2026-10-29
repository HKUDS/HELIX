# LoRA validation and smoke run

## Local verification

Run from the repository root with Python, Modal SDK, matplotlib and numpy installed:

```sh
python closed-loop/scripts/03_extract_pairs.py
python -m unittest discover -s closed-loop/tests -v
python closed-loop/notebooks/evaluate_rebuild.py --demo
```

The committed 24 traces are synthetic: 12 BUILD and 12 REBUILD over three tasks and four harnesses. Extraction uses BUILD only and yields three SFT records and three correctness DPO pairs. Tests compare the parsed records against `origin/main`'s committed demo JSONL. Empty inputs fail without seeding or overwriting outputs; demo generation requires `--seed-demo`.

Evaluation no longer substitutes hardcoded metrics. Missing phases/harnesses, duplicate or unmatched tasks and malformed measurements fail explicitly. The sample PNG is labelled synthetic. Real mode requires model and test-result provenance; this is a sanity check, not proof that arbitrary input JSON is authentic.

## GPU smoke run

```sh
modal setup
modal run closed-loop/scripts/04_train_lora.py --stage sft_then_dpo --epochs 1 --max-steps 3
```

This is three optimizer steps per stage on three demo records, not a meaningful quality experiment. `max_steps` overrides epoch count; SFT warmup is disabled for bounded smoke runs. Both stages must have valid, nonempty input before the model is loaded. Histories require completed optimizer steps and finite loss values. Each stage writes `runs/<run-id>/<stage>_loss_history.json` to volume `helix-adapters`; the final adapter includes combined `loss_history.json`. The entrypoint downloads combined history into `data/training_runs/<run-id>/loss_history.json`. Step numbers restart for each stage, and the plot uses separate axes.

Smoke result on an NVIDIA A100 40 GB using Torch 2.8.0, Transformers 4.56.2, TRL 0.23.0 and Unsloth 2025.10.12: SFT losses were 1.7607, 1.6045, 1.3536 (15.97 sec); DPO losses were 0.6931, 0.6931, 0.6706 (8.83 sec). The adapter was committed to the shared Modal volume and loss JSON downloaded locally. This validates execution and persistence, not generalization or pass rate. Three demo examples were reused for every update; DPO reaches reward accuracy 1.0 on its third update, which is training-set behavior only.

To plot actual training loss without any benchmark traces:

```sh
python closed-loop/notebooks/evaluate_rebuild.py --loss-only --loss-history PATH_TO_RUN/loss_history.json --output PATH_TO_RUN/loss_curve.png
```

The SFT checkpoint is retained per run and loaded as the DPO reference adapter. Standalone `--stage dpo` starts from the base model. CLI `--epochs` applies to both stages. The historical YAML config is not loaded by this script; CLI and script constants are authoritative.

The final adapter is in volume `helix-adapters`, directory `helix-lora-final`, matching the inference server. Restart the inference instance to detect it. Merely committing the volume does not reload a running server.

## Real before/after evaluation

Collect verified BUILD and REBUILD traces for the same held-out tasks and harnesses using base model and trained adapter respectively. Keep them in a separate directory so demo files cannot mix into measurements. Existing sample tasks used for training are not a held-out evaluation.

```sh
python closed-loop/notebooks/evaluate_rebuild.py --traces-dir PATH_TO_REAL_TRACES --output PATH_TO_REPORT/comparison.png --loss-history PATH_TO_RUN/loss_history.json
```

This generates the measured pass-rate/steps plot and a separate loss plot. It does not perform inference or manufacture traces. No real benchmark result should be claimed until actual model outputs have passed through the harness test runner.

## API references

- [Modal 1.0 migration](https://modal.com/docs/guide/modal-1-0-migration): image data mounting and GPU strings.
- [TRL SFT trainer](https://huggingface.co/docs/trl/v0.23.0/en/sft_trainer).
- [TRL DPO trainer](https://huggingface.co/docs/trl/v0.23.0/en/dpo_trainer).

The Python regression suite checks data handling and persistence helpers without loading model weights. GPU runtime validation is a separate step.
