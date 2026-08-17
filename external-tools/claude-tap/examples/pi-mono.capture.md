# Pi Capture

```bash
HELIX_EXTERNAL_CAPTURE=1 npm run helix -- external-tools capture claude-tap \
  --require-tool \
  --product pi-mono \
  --task read-only-answer \
  --out-dir .helix/external-tools/runs/pi-read-only \
  --json \
  -- \
  --tap-client pi -- --model openai-codex/gpt-5.3-codex-spark -p "Reply OK"
```
