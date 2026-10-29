import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]


def load(name, relative):
    spec = importlib.util.spec_from_file_location(name, ROOT / relative)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


extract = load("extract", "scripts/03_extract_pairs.py")
train = load("train", "scripts/04_train_lora.py")
evaluate = load("evaluate", "notebooks/evaluate_rebuild.py")


class PipelineTests(unittest.TestCase):
    def test_committed_demo_matches_extraction(self):
        grouped = extract.load_all_traces(ROOT / "data/raw_traces")
        self.assertEqual(sum(map(len, grouped.values())), 12)
        for filename, actual in [("sft_data.jsonl", extract.extract_sft_records(grouped)), ("dpo_pairs.jsonl", extract.extract_dpo_pairs(grouped))]:
            committed = subprocess.check_output(["git", "show", f"origin/main:closed-loop/data/processed/{filename}"], cwd=ROOT, text=True, encoding="utf-8")
            expected = [json.loads(line) for line in committed.splitlines()]
            self.assertEqual(sorted(actual, key=lambda r: r["task_id"]), sorted(expected, key=lambda r: r["task_id"]))
            self.assertEqual(len(actual), 3)

    def test_empty_does_not_seed_or_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(extract, "RAW_TRACES_DIR", Path(tmp)), patch.object(extract, "PROCESSED_DIR", Path(tmp)), patch("sys.argv", ["extract"]), patch.object(extract, "seed_demo_traces") as seed:
                with self.assertRaises(SystemExit):
                    extract.main()
                seed.assert_not_called()
                self.assertEqual(list(Path(tmp).iterdir()), [])

    def test_missing_empty_invalid_training_inputs(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(ValueError):
                train.validate_data(tmp, "typo")
            with self.assertRaises(FileNotFoundError):
                train.validate_data(tmp, "sft")
            (Path(tmp) / "sft_data.jsonl").write_text("", encoding="utf-8")
            with self.assertRaises(ValueError):
                train.validate_data(tmp, "sft")
        self.assertEqual(set(train.validate_data(ROOT / "data/processed", "sft_then_dpo")), {"sft", "dpo"})

    def test_loss_history_and_no_steps(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(train, "volume"):
            trainer = SimpleNamespace(state=SimpleNamespace(global_step=1, log_history=[{"step": 1, "loss": 0.5}]))
            train.save_history(trainer, "sft", tmp)
            rows = json.loads((Path(tmp) / "sft_loss_history.json").read_text())
            self.assertEqual(rows[0]["stage"], "sft")
            trainer.state.global_step = 0
            with self.assertRaises(RuntimeError):
                train.save_history(trainer, "sft", tmp)
            trainer.state.global_step = 1
            trainer.state.log_history = [{"step": 1, "loss": float("nan")}]
            with self.assertRaises(RuntimeError):
                train.save_history(trainer, "sft", tmp)

    def test_no_hardcoded_metrics(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(evaluate, "RAW_TRACES_DIR", Path(tmp)):
            with self.assertRaises(ValueError):
                evaluate.load_metrics_from_raw_traces()
        metrics = evaluate.load_metrics_from_raw_traces()
        self.assertEqual(metrics["build"]["minimal"]["pass_rate"], 0)
        self.assertEqual(metrics["rebuild"]["minimal"]["pass_rate"], 100)

    def test_rebuild_cannot_be_selected_for_training(self):
        with tempfile.TemporaryDirectory() as tmp:
            trace = {"task_id": "only_rebuild", "phase": "rebuild", "passed": True, "assistant_solution": "answer"}
            (Path(tmp) / "trace.json").write_text(json.dumps(trace), encoding="utf-8")
            self.assertFalse(extract.load_all_traces(Path(tmp)))

    def test_malformed_and_unpaired_evaluation_fails(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(evaluate, "RAW_TRACES_DIR", Path(tmp)):
            path = Path(tmp) / "trace.json"
            path.write_text("not json", encoding="utf-8")
            with self.assertRaises(ValueError):
                evaluate.load_metrics_from_raw_traces()
            path.write_text(json.dumps({"phase": "build", "harness_id": "minimal", "task_id": "one", "passed": True, "steps": 1, "latency_sec": 1}), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Unpaired"):
                evaluate.load_metrics_from_raw_traces()


if __name__ == "__main__":
    unittest.main()
