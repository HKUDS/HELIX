# OpenCode Capture

```bash
HELIX_EXTERNAL_CAPTURE=1 npm run helix -- external-tools capture claude-tap \
  --require-tool \
  --product opencode \
  --task read-only-answer \
  --out-dir .helix/external-tools/runs/opencode-read-only \
  --json \
  -- \
  --tap-client opencode -- run "Reply OK"
```
