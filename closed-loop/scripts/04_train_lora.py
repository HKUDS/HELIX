"""
04_train_lora.py - Distributed Cloud LoRA Fine-Tuning (Unsloth + TRL)
======================================================================
Executes fast, memory-efficient LoRA SFT and DPO alignment on Modal.com
using an NVIDIA A100 GPU (40GB/80GB).

Key Highlights:
1. Powered by Unsloth FastLanguageModel (2x faster, 70% less VRAM with 4-bit QLoRA).
2. Two-Stage Adaptation:
   - Stage 1 (SFT): Fine-tunes Qwen2.5-Coder-7B on clean, verified successful trajectories.
   - Stage 2 (DPO): Aligns model using contrastive preference pairs (Clean/Complex vs Degraded/Minimal).
3. Checkpoint Persistence:
   Saves merged/standalone LoRA adapter weights directly to a persistent Modal Volume:
   `/vol/checkpoints/helix-lora-final` in volume `helix-adapters`.
4. Closes the Loop:
   Restart `01_modal_vllm.py` after commit so it detects these weights.

Usage:
  # Run on Modal cloud GPU:
  modal run closed-loop/scripts/04_train_lora.py --stage sft_then_dpo --epochs 3
"""

import os
import json
import math
from pathlib import Path
import modal

# ------------------------------------------------------------------------------
# 1. Modal App & Persistent Volume Configuration
# ------------------------------------------------------------------------------
APP_NAME = "helix-lora-training"
VOLUME_NAME = "helix-adapters"
MOUNT_PATH = "/vol/checkpoints"
BASE_MODEL_NAME = "Qwen/Qwen2.5-Coder-7B-Instruct"

app = modal.App(APP_NAME)
volume = modal.Volume.from_name(VOLUME_NAME, create_if_missing=True)

# Container image optimized with Unsloth and HuggingFace TRL stack
training_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch==2.8.0",
        "torchao==0.13.0",
        "torchvision==0.23.0",
        "xformers==0.0.32.post2",
        "transformers==4.56.2",
        "datasets==3.6.0",
        "accelerate==1.10.1",
        "peft==0.17.1",
        "trl==0.23.0",
        "bitsandbytes==0.47.0",
        "unsloth==2025.10.12",
        "unsloth_zoo==2025.10.13",
        "pyyaml==6.0.2",
    )
)

# Mount local processed data into container
LOCAL_DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "processed"
training_image = training_image.add_local_dir(LOCAL_DATA_DIR, remote_path="/data/processed")


def validate_data(data_dir, stage):
    """Fail before GPU/model initialization; never publish untrained adapters."""
    if stage not in {"sft", "dpo", "sft_then_dpo"}:
        raise ValueError(f"Invalid stage: {stage}")
    result = {}
    for name in (["sft", "dpo"] if stage == "sft_then_dpo" else [stage]):
        path = Path(data_dir) / ("sft_data.jsonl" if name == "sft" else "dpo_pairs.jsonl")
        records = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
        if not records:
            raise ValueError(f"Empty training dataset: {path}")
        for rec in records:
            if name == "sft":
                messages = rec.get("messages", [])
                if [m.get("role") for m in messages] != ["system", "user", "assistant"]:
                    raise ValueError("SFT requires system/user/assistant messages")
                texts = [m.get("content") for m in messages]
            else:
                texts = [rec.get(k) for k in ("system", "prompt", "chosen", "rejected")]
                if rec.get("chosen") == rec.get("rejected"):
                    raise ValueError("DPO chosen and rejected must differ")
            if any(not isinstance(t, str) or not t.strip() for t in texts):
                raise ValueError(f"Invalid text in {path}")
        result[name] = records
    return result


def save_history(trainer, stage, run_dir):
    history = [{**row, "stage": stage} for row in trainer.state.log_history]
    losses = [row["loss"] for row in history if "loss" in row]
    if trainer.state.global_step < 1 or not losses or not all(math.isfinite(x) for x in losses):
        raise RuntimeError(f"{stage}: no successful steps or finite loss history")
    path = Path(run_dir) / f"{stage}_loss_history.json"
    path.write_text(json.dumps(history, indent=2, allow_nan=False), encoding="utf-8")
    volume.commit()
    return history


# ------------------------------------------------------------------------------
# 2. Remote Training Function on A100 GPU
# ------------------------------------------------------------------------------
@app.function(
    image=training_image,
    gpu="A100",
    volumes={MOUNT_PATH: volume},
    timeout=7200,  # 2 hours max
)
def train_lora_pipeline(
    stage: str = "sft_then_dpo",
    epochs: int = 3,
    lr: float = 2.0e-4,
    dpo_lr: float = 5.0e-6,
    r: int = 16,
    lora_alpha: int = 32,
    max_steps: int = -1,
):
    data = validate_data("/data/processed", stage)
    if epochs <= 0 or lr <= 0 or dpo_lr <= 0 or max_steps == 0 or max_steps < -1:
        raise ValueError("Positive epochs/rates and max_steps=-1 or positive are required")
    from datetime import datetime, timezone
    from uuid import uuid4
    run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S") + "-" + uuid4().hex[:8]
    run_dir = Path(MOUNT_PATH) / "runs" / run_id
    run_dir.mkdir(parents=True)
    import importlib.metadata
    (run_dir / "versions.json").write_text(json.dumps({name: importlib.metadata.version(name) for name in ("torch", "transformers", "trl", "unsloth", "unsloth_zoo", "peft", "datasets")}, indent=2), encoding="utf-8")
    histories = []
    from unsloth import FastLanguageModel, is_bfloat16_supported
    import torch
    from datasets import Dataset
    from trl import SFTTrainer, SFTConfig, DPOTrainer, DPOConfig

    print("=" * 70)
    print("STARTING HELIX CLOSED-LOOP LORA FINE-TUNING ON MODAL A100")
    print(f"Base Model: {BASE_MODEL_NAME} | Stage: {stage} | LoRA r={r}, alpha={lora_alpha}")
    print("=" * 70)

    # 1. Initialize Base Model & Tokenizer with Unsloth 4-bit optimization
    max_seq_length = 4096
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=BASE_MODEL_NAME,
        max_seq_length=max_seq_length,
        load_in_4bit=True,
        dtype=torch.bfloat16 if is_bfloat16_supported() else torch.float16,
    )

    # 2. Attach LoRA Adapters
    model = FastLanguageModel.get_peft_model(
        model,
        r=r,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_alpha=lora_alpha,
        lora_dropout=0.05,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=42,
    )

    # Paths
    sft_file = Path("/data/processed/sft_data.jsonl")
    dpo_file = Path("/data/processed/dpo_pairs.jsonl")
    final_adapter_dir = os.path.join(MOUNT_PATH, "helix-lora-final")

    # --------------------------------------------------------------------------
    # Stage 1: Supervised Fine-Tuning (SFT)
    # --------------------------------------------------------------------------
    if "sft" in data:
        print(f"\n[Stage 1: SFT] Loading training trajectories from {sft_file}...")
        sft_samples = []
        with open(sft_file, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    rec = json.loads(line)
                    # Convert messages into tokenizer chat template string
                    prompt_text = tokenizer.apply_chat_template(
                        rec["messages"], tokenize=False, add_generation_prompt=False
                    )
                    sft_samples.append({"text": prompt_text})

        print(f"[Stage 1: SFT] Loaded {len(sft_samples)} samples. Beginning SFTTrainer...")
        sft_dataset = Dataset.from_list(sft_samples)

        sft_training_args = SFTConfig(
            dataset_text_field="text",
            max_length=max_seq_length,
            max_steps=max_steps,
            report_to="none",
            output_dir=os.path.join(MOUNT_PATH, "sft_checkpoints"),
            per_device_train_batch_size=2,
            gradient_accumulation_steps=4,
            warmup_ratio=0.0 if max_steps > 0 else 0.1,
            num_train_epochs=epochs,
            learning_rate=lr,
            fp16=not is_bfloat16_supported(),
            bf16=is_bfloat16_supported(),
            logging_steps=1,
            logging_nan_inf_filter=False,
            optim="adamw_8bit",
            weight_decay=0.01,
            lr_scheduler_type="cosine",
            seed=42,
            save_strategy="no",
        )

        sft_trainer = SFTTrainer(
            model=model,
            processing_class=tokenizer,
            train_dataset=sft_dataset,
            args=sft_training_args,
        )
        sft_trainer.train()
        histories.extend(save_history(sft_trainer, "sft", run_dir))
        model.save_pretrained(str(run_dir / "sft_adapter"))
        del sft_trainer
        torch.cuda.empty_cache()
        print("[Stage 1: SFT] Training complete!")

    # --------------------------------------------------------------------------
    # Stage 2: Direct Preference Optimization (DPO)
    # --------------------------------------------------------------------------
    if "dpo" in data:
        reference_name = None
        if "sft" in data:
            model.load_adapter(str(run_dir / "sft_adapter"), adapter_name="sft_reference", is_trainable=False)
            model.set_adapter("default")
            reference_name = "sft_reference"
        print(f"\n[Stage 2: DPO] Loading contrastive pairs from {dpo_file}...")
        dpo_samples = []
        with open(dpo_file, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    rec = json.loads(line)
                    dpo_samples.append({
                        "prompt": [{"role": "system", "content": rec["system"]}, {"role": "user", "content": rec["prompt"]}],
                        "chosen": [{"role": "assistant", "content": rec["chosen"]}],
                        "rejected": [{"role": "assistant", "content": rec["rejected"]}],
                    })

        print(f"[Stage 2: DPO] Loaded {len(dpo_samples)} preference pairs. Beginning DPOTrainer...")
        dpo_dataset = Dataset.from_list(dpo_samples)

        dpo_config = DPOConfig(
            max_length=max_seq_length,
            max_steps=max_steps,
            ref_adapter_name=reference_name,
            report_to="none",
            output_dir=os.path.join(MOUNT_PATH, "dpo_checkpoints"),
            beta=0.1,
            learning_rate=dpo_lr,
            num_train_epochs=epochs,
            per_device_train_batch_size=1,
            gradient_accumulation_steps=8,
            fp16=not is_bfloat16_supported(),
            bf16=is_bfloat16_supported(),
            logging_steps=1,
            logging_nan_inf_filter=False,
            optim="adamw_8bit",
            seed=42,
            save_strategy="no",
        )

        dpo_trainer = DPOTrainer(
            model=model,
            ref_model=None,  # Implicit reference model in PEFT/Unsloth
            processing_class=tokenizer,
            train_dataset=dpo_dataset,
            args=dpo_config,
        )
        dpo_trainer.train()
        histories.extend(save_history(dpo_trainer, "dpo", run_dir))
        print("[Stage 2: DPO] Alignment complete!")

    # --------------------------------------------------------------------------
    # 3. Save Final Adapter Weights to Persistent Modal Volume
    # --------------------------------------------------------------------------
    print(f"\n[Persisting Weights] Saving final LoRA adapter to {final_adapter_dir}...")
    os.makedirs(final_adapter_dir, exist_ok=True)
    model.save_pretrained(final_adapter_dir, selected_adapters=["default"])
    tokenizer.save_pretrained(final_adapter_dir)
    (Path(final_adapter_dir) / "loss_history.json").write_text(json.dumps(histories, indent=2, allow_nan=False), encoding="utf-8")
    (run_dir / "metadata.json").write_text(json.dumps({"run_id": run_id, "stage": stage, "epochs": epochs, "max_steps": max_steps, "sample_counts": {k: len(v) for k, v in data.items()}, "base_model": BASE_MODEL_NAME}, indent=2), encoding="utf-8")

    # Commit changes to Modal Volume so 01_modal_vllm.py immediately detects them
    volume.commit()
    print("[✓] Modal Volume committed successfully!")
    print(f"[✓] Checkpoint ready for REBUILD serving at: {final_adapter_dir}")
    return {"run_id": run_id, "loss_history": histories}


# ------------------------------------------------------------------------------
# 4. Local Entrypoint
# ------------------------------------------------------------------------------
@app.local_entrypoint()
def main(stage: str = "sft_then_dpo", epochs: int = 3, lr: float = 2.0e-4, max_steps: int = -1):
    validate_data(LOCAL_DATA_DIR, stage)
    print("Triggering remote LoRA training on Modal A100 GPU...")
    result = train_lora_pipeline.remote(
        stage=stage,
        epochs=epochs,
        lr=lr,
        max_steps=max_steps,
    )
    output = LOCAL_DATA_DIR.parent / "training_runs" / result["run_id"]
    output.mkdir(parents=True, exist_ok=True)
    (output / "loss_history.json").write_text(json.dumps(result["loss_history"], indent=2), encoding="utf-8")
    print("Training job finished.")

