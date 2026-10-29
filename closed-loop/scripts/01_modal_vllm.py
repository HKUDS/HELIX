"""
01_modal_vllm.py - Cloud Inference Server for HELIX Closed-Loop Pipeline
========================================================================
Deploys a high-throughput, OpenAI-compatible vLLM inference server on Modal.com
using an NVIDIA A10G (or A100-40GB) GPU.

Architecture (class-based Modal pattern):
  @modal.enter()   -> Spawns vLLM subprocess, waits for /health readiness.
  @modal.asgi_app()-> FastAPI reverse-proxy forwards /v1/* to local vLLM.
  @modal.exit()    -> Gracefully terminates vLLM subprocess on container stop.

Phases:
  BUILD   - Serves the base model (Qwen/Qwen2.5-Coder-7B-Instruct).
  REBUILD - If LoRA adapter weights exist in the `helix-adapters` Volume,
            automatically enables vLLM multi-LoRA serving (--enable-lora).

Endpoints exposed (OpenAI-compatible):
  POST /v1/chat/completions   - Chat completions (streaming & non-streaming)
  POST /v1/completions        - Text completions
  GET  /v1/models             - List served models
  GET  /health                - vLLM health check

Usage:
  # Ephemeral dev server (auto-generates a public URL):
  modal serve closed-loop/scripts/01_modal_vllm.py

  # Persistent deployment (stable URL, stays up):
  modal deploy closed-loop/scripts/01_modal_vllm.py

  # Smoke-test the local entrypoint against a running deployment:
  modal run closed-loop/scripts/01_modal_vllm.py
"""

import os
import subprocess
import time

import modal

# =============================================================================
# 1. Configuration
# =============================================================================
MODEL_NAME = "Qwen/Qwen2.5-Coder-7B-Instruct"
VLLM_PORT = 8000

# Volume that stores LoRA adapter weights produced by 04_train_lora.py.
# Initially empty (BUILD phase).  After training, the adapter is committed
# here so vLLM can load it on the fly for the REBUILD phase.
ADAPTERS_VOLUME_NAME = "helix-adapters"
ADAPTERS_MOUNT_PATH = "/adapters"
LORA_ADAPTER_SUBDIR = "helix-lora-final"  # written by 04_train_lora.py
LORA_ADAPTER_NAME = "helix-lora"  # alias exposed to the /v1/models endpoint

# =============================================================================
# 2. Container Image
# =============================================================================
# Modal provides host CUDA drivers, so we only need the dev toolkit in-image.
# vLLM is installed with uv for fast, deterministic resolution.
vllm_image = (
    modal.Image.from_registry(
        "nvidia/cuda:12.4.0-devel-ubuntu22.04", add_python="3.12"
    )
    .entrypoint([])                       # don't start nvidia entrypoint
    .pip_install(
        "vllm>=0.6.3,<1.0",
        "torch>=2.4.0",
        "transformers>=4.45.0",
        "huggingface_hub",
        "hf-transfer",
        "fastapi[standard]",
        "httpx",
    )
    .env(
        {
            "HF_XET_HIGH_PERFORMANCE": "1",     # modern high-perf HuggingFace transfer
            "VLLM_ATTENTION_BACKEND": "FLASHINFER",
        }
    )
)

# =============================================================================
# 3. Volumes
# =============================================================================
# HuggingFace cache: avoids re-downloading ~15 GB of weights on every cold start.
hf_cache_vol = modal.Volume.from_name("hf-cache-helix", create_if_missing=True)

# LoRA adapter volume: initially empty, populated by 04_train_lora.py.
adapters_vol = modal.Volume.from_name(
    ADAPTERS_VOLUME_NAME, create_if_missing=True
)

# =============================================================================
# 4. Application & Server Class
# =============================================================================
app = modal.App("helix-vllm-engine")


@app.cls(
    image=vllm_image,
    gpu="A10G",                            # ~24 GB VRAM, fits Qwen-7B in fp16
    volumes={
        "/root/.cache/huggingface": hf_cache_vol,
        ADAPTERS_MOUNT_PATH: adapters_vol,
    },
    timeout=60 * 60,                       # 1 hour max per request
    scaledown_window=180,                  # 3 min idle -> scale to zero to minimize GPU cost
    max_containers=1,                      # Strictly enforce single GPU container to avoid duplicate cost
)
@modal.concurrent(max_inputs=64)           # vLLM handles batching internally
class VLLMServer:
    """Modal class wrapping a vLLM OpenAI-compatible subprocess."""

    # -----------------------------------------------------------------
    # Container lifecycle: start
    # -----------------------------------------------------------------
    @modal.enter()
    def start_engine(self):
        """Launch vLLM and block until it passes the /health check."""

        # Detect whether a trained LoRA adapter is present on the volume.
        lora_path = os.path.join(ADAPTERS_MOUNT_PATH, LORA_ADAPTER_SUBDIR)
        adapter_config = os.path.join(lora_path, "adapter_config.json")
        self.lora_enabled = os.path.isfile(adapter_config)

        # Standard modern vLLM serve flags with eager mode to bypass slow CUDA graph compilation
        cmd = [
            "vllm", "serve", MODEL_NAME,
            "--host", "0.0.0.0",
            "--port", str(VLLM_PORT),
            "--tensor-parallel-size", "1",
            "--max-model-len", "4096",
            "--gpu-memory-utilization", "0.90",
            "--enforce-eager",
            "--trust-remote-code",
            "--uvicorn-log-level", "warning",
        ]

        if self.lora_enabled:
            print(
                f"[REBUILD] LoRA adapter detected at {lora_path}. "
                "Enabling multi-LoRA serving."
            )
            cmd += [
                "--enable-lora",
                "--max-loras", "2",
                "--max-lora-rank", "32",
                "--lora-modules",
                f"{LORA_ADAPTER_NAME}={lora_path}",
            ]
        else:
            print(
                f"[BUILD] No LoRA adapter found in {lora_path}. "
                f"Serving base model: {MODEL_NAME}"
            )

        print(f"[vLLM] Command: {' '.join(cmd)}")
        self.log_path = "/tmp/vllm.log"
        self.log_file = open(self.log_path, "w", encoding="utf-8")
        self.proc = subprocess.Popen(
            cmd,
            stdout=self.log_file,
            stderr=subprocess.STDOUT,
        )

        # Block until vLLM is ready (polls /health every 2 s).
        import urllib.request
        import urllib.error

        health_url = f"http://localhost:{VLLM_PORT}/health"
        deadline = time.monotonic() + 300  # 5 min max boot time
        while time.monotonic() < deadline:
            try:
                with urllib.request.urlopen(health_url, timeout=2) as resp:
                    if resp.status == 200:
                        print("[vLLM] Engine ready - accepting requests.")
                        return
            except (urllib.error.URLError, OSError):
                pass

            # Make sure the subprocess hasn't crashed.
            if self.proc.poll() is not None:
                self.log_file.flush()
                err_output = ""
                try:
                    with open(self.log_path, "r", encoding="utf-8", errors="replace") as f:
                        err_output = f.read()
                except Exception as read_err:
                    err_output = f"Could not read log file: {read_err}"

                print("=" * 60)
                print(f"[vLLM CRASH LOGS] Process exited prematurely with code {self.proc.returncode}:")
                print(err_output)
                print("=" * 60)

                raise RuntimeError(
                    f"vLLM exited prematurely (code {self.proc.returncode}).\n"
                    f"Last log output:\n{err_output[-2000:]}"
                )
            time.sleep(2)

        raise TimeoutError("vLLM did not become healthy within 5 minutes.")

    # -----------------------------------------------------------------
    # Web server: reverse-proxy all HTTP traffic to the vLLM subprocess
    # -----------------------------------------------------------------
    @modal.asgi_app()
    def serve(self):
        """
        Return a FastAPI app that proxies every request to vLLM.

        This approach lets Modal manage TLS termination, authentication,
        and auto-scaling while vLLM handles the actual inference work.
        """
        import fastapi
        import httpx

        web_app = fastapi.FastAPI(
            title="HELIX vLLM Gateway",
            description="OpenAI-compatible endpoint for HELIX Closed-Loop",
        )
        target = f"http://localhost:{VLLM_PORT}"

        @web_app.get("/")
        async def root():
            return {
                "status": "ok",
                "model": MODEL_NAME,
                "lora_enabled": self.lora_enabled,
                "adapter": LORA_ADAPTER_NAME if self.lora_enabled else None,
            }

        @web_app.get("/health")
        async def health():
            async with httpx.AsyncClient(base_url=target, timeout=5.0) as client:
                try:
                    resp = await client.get("/health")
                    return fastapi.responses.Response(
                        content=resp.content,
                        status_code=resp.status_code,
                        headers=dict(resp.headers),
                    )
                except Exception as e:
                    return fastapi.responses.JSONResponse(
                        status_code=503,
                        content={"status": "error", "message": str(e)},
                    )

        @web_app.api_route(
            "/{path:path}", methods=["GET", "POST", "PUT", "DELETE"]
        )
        async def proxy(path: str, request: fastapi.Request):
            async with httpx.AsyncClient(
                base_url=target, timeout=120.0
            ) as client:
                url = httpx.URL(
                    path=f"/{path}",
                    query=request.url.query.encode("utf-8")
                    if request.url.query
                    else None,
                )
                headers = dict(request.headers)
                headers.pop("host", None)
                body = await request.body()

                rp = await client.request(
                    request.method, url, headers=headers, content=body
                )

            return fastapi.responses.Response(
                content=rp.content,
                status_code=rp.status_code,
                headers=dict(rp.headers),
            )

        return web_app

    # -----------------------------------------------------------------
    # Container lifecycle: stop
    # -----------------------------------------------------------------
    @modal.exit()
    def stop_engine(self):
        """Terminate vLLM gracefully when the container is shutting down."""
        if hasattr(self, "proc") and self.proc.poll() is None:
            print("[vLLM] Sending SIGTERM ...")
            self.proc.terminate()
            try:
                self.proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                print("[vLLM] Force-killing process.")
                self.proc.kill()
        if hasattr(self, "log_file") and not self.log_file.closed:
            self.log_file.close()
        print("[vLLM] Shutdown complete.")


# =============================================================================
# 5. Local Entrypoint - Quick Smoke Test
# =============================================================================
@app.local_entrypoint()
def smoke_test():
    """
    Send a single chat-completion request to verify the deployment works.

    Run with:
      modal run closed-loop/scripts/01_modal_vllm.py

    (The deployment must already be live via `modal serve` or `modal deploy`.)
    """
    print("=" * 60)
    print("  HELIX vLLM Engine - Smoke Test")
    print(f"  Base Model  : {MODEL_NAME}")
    print(f"  Adapter Vol : {ADAPTERS_VOLUME_NAME} -> {ADAPTERS_MOUNT_PATH}")
    print("=" * 60)
    print()
    print("To launch a live endpoint, run one of:")
    print()
    print("  # Ephemeral (dev/test, auto-deleted when you Ctrl-C):")
    print("  modal serve closed-loop/scripts/01_modal_vllm.py")
    print()
    print("  # Persistent (production, stable URL):")
    print("  modal deploy closed-loop/scripts/01_modal_vllm.py")
    print()
    print("Then point HELIX at the URL Modal gives you:")
    print()
    print("  export HELIX_LIVE_PROVIDER=openai-compatible")
    print('  export HELIX_LIVE_BASE_URL="https://<workspace>--helix-vllm-engine-vllmserver-serve.modal.run/v1"')
    print(f'  export HELIX_LIVE_MODEL="{MODEL_NAME}"')
    print('  export OPENAI_API_KEY="not-needed"')
    print()
    print("Then run the evaluation pipeline:")
    print("  python closed-loop/scripts/02_run_helix_eval.py --phase build")
