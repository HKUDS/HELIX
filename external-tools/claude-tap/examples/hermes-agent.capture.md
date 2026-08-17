# Hermes Agent Capture

```bash
HELIX_EXTERNAL_CAPTURE=1 npm run helix -- external-tools capture claude-tap \
  --require-tool \
  --product hermes-agent \
  --task read-only-answer \
  --out-dir .helix/external-tools/runs/hermes-read-only \
  --json \
  -- \
  --tap-client hermes -- chat "Reply OK"
```
