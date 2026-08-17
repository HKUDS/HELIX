import type { ExternalToolProfile } from "../../types"

export const claudeTapProfile: ExternalToolProfile = {
  id: "claude-tap",
  label: "claude-tap",
  homepage: "https://github.com/liaohch3/claude-tap",
  repository: "https://github.com/liaohch3/claude-tap",
  license: "MIT",
  licenseURL: "https://github.com/liaohch3/claude-tap/blob/main/LICENSE",
  packageURL: "https://pypi.org/project/claude-tap/",
  copyrightNotice: "Copyright (c) 2025 liaohch3",
  noticePath: "external-tools/claude-tap/NOTICE.md",
  vendoredSource: false,
  supportedProducts: ["opencode", "pi-mono", "hermes-agent", "codex"],
  unsupportedProducts: ["nanobot"],
  unsupportedGaps: [
    {
      product: "nanobot",
      status: "needs-upstream-support",
      reason: "claude-tap does not expose a nanobot tap client in the current Helix profile.",
      nextAction: "Add a Helix-owned Nanobot capture path or wait for upstream claude-tap Nanobot client support before using external capture as Nanobot native evidence.",
    },
  ],
  supportedArtifactFormats: ["jsonl", "json", "compact"],
  supportedCaptureModes: ["real-capture", "capture-only", "import-only", "dry-run"],
  defaultInvocation: {
    strategy: "binary",
    command: "claude-tap",
    args: [],
  },
  versionCommand: {
    command: "claude-tap",
    args: ["--version"],
  },
  securityNotes: [
    "Raw trace artifacts stay under .helix/ by default.",
    "Published Helix reports store prompt/tool/provider payloads as shape summaries and fingerprints.",
    "capture-only evidence can prove prompt and tool schema shape, not task success.",
  ],
  redactionPolicyRef: "external-tools.redaction.v1",
  minVersion: "0.1.114",
  knownVersionRange: ">=0.1.114",
  installHints: ["uv tool install claude-tap", "pip install claude-tap"],
  captureExamples: [
    {
      product: "pi-mono",
      command: "claude-tap --tap-client pi -- --model openai-codex/gpt-5.3-codex-spark -p \"Reply OK\"",
    },
    {
      product: "opencode",
      command: "claude-tap --tap-client opencode -- run \"Reply OK\"",
    },
    {
      product: "hermes-agent",
      command: "claude-tap --tap-client hermes",
    },
  ],
  lossinessNotes: [
    "Network proxy records provider-visible payloads and stream reconstruction, not private in-process native internals.",
    "Helix normalized artifacts keep fingerprints and summaries by default instead of raw prompt or tool payloads.",
  ],
  upstreamSupportMatrixRef: "https://github.com/liaohch3/claude-tap/blob/main/docs/support-matrix.md",
}
