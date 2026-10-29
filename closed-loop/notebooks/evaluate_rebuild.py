"""
evaluate_rebuild.py - Differential Performance Evaluation: Theta_0 vs Theta_1
==============================================================================
Aggregates and visualizes benchmark results comparing:
  - Theta_0 (BUILD Phase): Pretrained Base Model (Qwen2.5-Coder-7B-Instruct)
  - Theta_1 (REBUILD Phase): Model adapted via SFT + DPO on Sibling Trajectories

Demonstrates the core hypothesis of HELIX Closed-Loop:
A zero-scaffolding / minimal harness achieves dramatic performance gains
once the underlying model internalizes reasoning and tool-calling discipline
distilled from complex harnesses (OpenCode & Hermes Agent).

Generates:
  - Tabular markdown comparison summary in console.
  - Publication-grade comparison charts saved to `closed-loop/data/rebuild_comparison_plot.png`.

Usage:
  python closed-loop/notebooks/evaluate_rebuild.py
  python closed-loop/notebooks/evaluate_rebuild.py --save-plot
"""

import argparse
import json
import math
from pathlib import Path
from typing import Any, Dict, List, Tuple

try:
    import matplotlib.pyplot as plt
    import numpy as np
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
CLOSED_LOOP_ROOT = PROJECT_ROOT / "closed-loop"
RAW_TRACES_DIR = CLOSED_LOOP_ROOT / "data" / "raw_traces"
OUTPUT_PLOT_PATH = CLOSED_LOOP_ROOT / "data" / "rebuild_comparison_plot.png"

HARNESS_ORDER = ["minimal", "pi-mono", "hermes-agent", "opencode"]
HARNESS_LABELS = {
    "minimal": "Minimal (Zero-Scaffolding)",
    "pi-mono": "Pi Mono (Baseline)",
    "hermes-agent": "Hermes Agent (Session)",
    "opencode": "OpenCode (Complex Scaffolding)",
}

def load_metrics_from_raw_traces() -> Dict[str, Dict[str, Dict[str, float]]]:
    """Scans RAW_TRACES_DIR for build_*.json and rebuild_*.json files."""
    results: Dict[str, Dict[str, List[Dict[str, Any]]]] = {
        "build": {h: [] for h in HARNESS_ORDER},
        "rebuild": {h: [] for h in HARNESS_ORDER},
    }

    if not RAW_TRACES_DIR.exists():
        raise ValueError("Trace directory does not exist")

    for p in RAW_TRACES_DIR.glob("*.json"):
        try:
            with open(p, "r", encoding="utf-8") as f:
                trace = json.load(f)
            phase = trace.get("phase")
            h_id = trace.get("harness_id", "")
            if phase in results and h_id in results[phase]:
                if not trace.get("task_id") or type(trace.get("passed")) is not bool:
                    raise ValueError("Missing task ID or boolean passed result")
                for field in ("steps", "latency_sec"):
                    value = trace.get(field)
                    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
                        raise ValueError(f"Invalid {field}")
                results[phase][h_id].append(trace)
        except Exception as exc:
            raise ValueError(f"Invalid trace: {p}") from exc

    for h in HARNESS_ORDER:
        b_ids = [t.get("task_id") for t in results["build"][h]]
        r_ids = [t.get("task_id") for t in results["rebuild"][h]]
        if set(b_ids) != set(r_ids) or len(b_ids) != len(set(b_ids)) or len(r_ids) != len(set(r_ids)):
            raise ValueError(f"Unpaired or duplicate tasks for {h}")

    # Aggregate
    aggregated: Dict[str, Dict[str, Dict[str, float]]] = {"build": {}, "rebuild": {}}
    for phase in ["build", "rebuild"]:
        for h_id in HARNESS_ORDER:
            traces = results[phase][h_id]
            if traces:
                passed_count = sum(1 for t in traces if t.get("passed") is True)
                pass_rate = round(100.0 * passed_count / len(traces), 1)
                avg_steps = round(sum(t.get("steps", 1) for t in traces) / len(traces), 2)
                avg_latency = round(sum(t.get("latency_sec", 0.0) for t in traces) / len(traces), 2)
                aggregated[phase][h_id] = {
                    "pass_rate": pass_rate,
                    "avg_steps": avg_steps,
                    "avg_latency": avg_latency,
                }

    # Require measured data for both phases and all harnesses.
    for phase in ["build", "rebuild"]:
        for h in HARNESS_ORDER:
            if h not in aggregated[phase]:
                raise ValueError(f"Missing traces for {phase}/{h}; no synthetic fallback is allowed")

    return aggregated


def print_markdown_summary(data: Dict[str, Dict[str, Dict[str, float]]]) -> None:
    print("\n" + "=" * 80)
    print("HELIX CLOSED-LOOP PERFORMANCE SUMMARY: BUILD (Theta_0) vs REBUILD (Theta_1)")
    print("=" * 80)
    print(f"{'Harness':<30} | {'Base Pass@1':<12} | {'LoRA Pass@1':<12} | {'Accuracy Diff':<13} | {'Steps Diff':<10}")
    print("-" * 80)

    for h in HARNESS_ORDER:
        b = data["build"][h]
        r = data["rebuild"][h]
        delta_pass = r["pass_rate"] - b["pass_rate"]
        delta_steps = r["avg_steps"] - b["avg_steps"]

        sign = "+" if delta_pass >= 0 else ""
        step_sign = "+" if delta_steps >= 0 else ""
        h_name = HARNESS_LABELS[h]

        print(
            f"{h_name:<30} | "
            f"{b['pass_rate']:>10.1f}% | "
            f"{r['pass_rate']:>10.1f}% | "
            f"{sign}{delta_pass:>9.1f}%  | "
            f"{step_sign}{delta_steps:>8.2f}"
        )
    print("=" * 80 + "\n")


def generate_comparison_plot(data: Dict[str, Dict[str, Dict[str, float]]], output_path: Path, demo: bool = False) -> None:
    plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.5), dpi=300)
    if demo:
        fig.suptitle("SYNTHETIC DEMO — not measured LoRA improvement", color="darkred")

    x = np.arange(len(HARNESS_ORDER))
    width = 0.35

    # Data arrays
    build_pass = [data["build"][h]["pass_rate"] for h in HARNESS_ORDER]
    rebuild_pass = [data["rebuild"][h]["pass_rate"] for h in HARNESS_ORDER]
    build_steps = [data["build"][h]["avg_steps"] for h in HARNESS_ORDER]
    rebuild_steps = [data["rebuild"][h]["avg_steps"] for h in HARNESS_ORDER]

    labels = [HARNESS_LABELS[h].split(" (")[0] for h in HARNESS_ORDER]

    # --- Plot 1: Pass@1 Accuracy Comparison ---
    rects1 = ax1.bar(x - width/2, build_pass, width, label="BUILD: Base Model (Theta_0)", color="#94a3b8", edgecolor="#475569")
    rects2 = ax1.bar(x + width/2, rebuild_pass, width, label="REBUILD: LoRA Model (Theta_1)", color="#3b82f6", edgecolor="#1d4ed8")

    ax1.set_ylabel("Pass@1 Accuracy (%)", fontsize=11, fontweight="bold")
    ax1.set_title("Harness Accuracy Before & After Closed-Loop LoRA", fontsize=12, fontweight="bold", pad=12)
    ax1.set_xticks(x)
    ax1.set_xticklabels(labels, fontsize=10, rotation=15)
    ax1.set_ylim(0, 115)
    ax1.legend(loc="upper left", framealpha=0.9)

    # Annotate deltas
    for i, (b, r) in enumerate(zip(build_pass, rebuild_pass)):
        delta = r - b
        ax1.annotate(
            f"{delta:+.1f} pp",
            xy=(x[i] + width/2, r),
            xytext=(0, 4),
            textcoords="offset points",
            ha="center",
            va="bottom",
            fontsize=9,
            fontweight="bold",
            color="#1d4ed8",
        )

    # --- Plot 2: Step Count Efficiency ---
    rects3 = ax2.bar(x - width/2, build_steps, width, label="BUILD: Base Model (Theta_0)", color="#cbd5e1", edgecolor="#64748b")
    rects4 = ax2.bar(x + width/2, rebuild_steps, width, label="REBUILD: LoRA Model (Theta_1)", color="#10b981", edgecolor="#047857")

    ax2.set_ylabel("Average Agent Steps per Task", fontsize=11, fontweight="bold")
    ax2.set_title("Agent Trajectory Step Efficiency", fontsize=12, fontweight="bold", pad=12)
    ax2.set_xticks(x)
    ax2.set_xticklabels(labels, fontsize=10, rotation=15)
    ax2.set_ylim(0, max(build_steps + rebuild_steps) * 1.3)
    ax2.legend(loc="upper right", framealpha=0.9)

    for i, (b, r) in enumerate(zip(build_steps, rebuild_steps)):
        ax2.annotate(
            f"{r:.1f}",
            xy=(x[i] + width/2, r),
            xytext=(0, 3),
            textcoords="offset points",
            ha="center",
            va="bottom",
            fontsize=9,
            fontweight="bold",
            color="#047857",
        )

    plt.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, bbox_inches="tight")
    plt.close()
    print(f"[OK] Saved high-resolution comparison chart to: {output_path}")


def generate_loss_plot(history_path: Path, output_path: Path):
    history = json.loads(history_path.read_text(encoding="utf-8"))
    stages = sorted({r["stage"] for r in history if "loss" in r})
    if not stages:
        raise ValueError("No logged training loss found")
    fig, axes = plt.subplots(1, len(stages), squeeze=False, figsize=(6 * len(stages), 4))
    for ax, stage in zip(axes[0], stages):
        rows = [r for r in history if r.get("stage") == stage and "loss" in r and "learning_rate" in r]
        ax.plot([r["step"] for r in rows], [r["loss"] for r in rows], marker="o")
        ax.set(title=f"{stage.upper()} training loss", xlabel="Optimizer step", ylabel="Loss")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    fig.savefig(output_path, dpi=200)
    plt.close(fig)


def main():
    global RAW_TRACES_DIR
    parser = argparse.ArgumentParser(description="Evaluate & visualize HELIX Rebuild performance")
    parser.add_argument("--save-plot", action="store_true", default=True, help="Save matplotlib comparison chart")
    parser.add_argument("--traces-dir", type=Path, default=RAW_TRACES_DIR)
    parser.add_argument("--output", type=Path, default=OUTPUT_PLOT_PATH)
    parser.add_argument("--loss-history", type=Path)
    parser.add_argument("--loss-only", action="store_true", help="Plot training loss without benchmark traces")
    parser.add_argument("--demo", action="store_true", help="Explicitly label plots of synthetic sample traces")
    args = parser.parse_args()
    if args.loss_only:
        if not HAS_MATPLOTLIB or args.loss_history is None:
            raise SystemExit("--loss-only requires --loss-history and matplotlib/numpy")
        generate_loss_plot(args.loss_history, args.output)
        return
    RAW_TRACES_DIR = args.traces_dir
    if not args.demo:
        for p in RAW_TRACES_DIR.glob("*.json"):
            trace = json.loads(p.read_text(encoding="utf-8"))
            if not trace.get("model") or not isinstance(trace.get("test_result"), dict):
                raise SystemExit(f"{p.name}: no real evaluation provenance; use --demo for sample traces")

    data = load_metrics_from_raw_traces()
    print_markdown_summary(data)

    if args.save_plot:
        if HAS_MATPLOTLIB:
            if args.demo:
                print("DEMO ONLY: synthetic traces; not measured LoRA improvement")
            generate_comparison_plot(data, args.output, demo=args.demo)
            if args.loss_history:
                generate_loss_plot(args.loss_history, args.output.with_name("loss_curve.png"))
        else:
            raise SystemExit("matplotlib/numpy are required to render plots")


if __name__ == "__main__":
    main()
