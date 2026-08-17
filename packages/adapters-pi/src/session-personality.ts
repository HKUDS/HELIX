import { JsonlTreeSessionService } from "@helix/lego-session"

export interface PiSessionPersonalityOptions {
  storageDir: string
  cwd?: string | undefined
}

export function createPiSessionPersonality(options: PiSessionPersonalityOptions): JsonlTreeSessionService {
  return new JsonlTreeSessionService({
    storageDir: options.storageDir,
    ...(options.cwd ? { cwd: options.cwd } : {}),
  })
}

export const piReference = {
  repository: "https://github.com/earendil-works/pi",
  branch: "main",
  commit: "7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
  sessionFiles: ["packages/coding-agent/src/core/session-manager.ts", "packages/coding-agent/docs/session-format.md"],
  extensionFiles: [
    "packages/coding-agent/src/core/extensions/types.ts",
    "packages/coding-agent/src/core/extensions/runner.ts",
    "packages/coding-agent/docs/extensions.md",
    "packages/agent/docs/hooks.md",
  ],
}
