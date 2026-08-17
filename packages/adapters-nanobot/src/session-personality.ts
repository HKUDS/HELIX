import { JsonlTreeSessionService } from "@helix/lego-session"

export interface NanobotSessionPersonalityOptions {
  storageDir: string
  cwd?: string | undefined
}

export function createNanobotSessionPersonality(options: NanobotSessionPersonalityOptions): JsonlTreeSessionService {
  return new JsonlTreeSessionService({
    storageDir: options.storageDir,
    ...(options.cwd ? { cwd: options.cwd } : {}),
  })
}

export const nanobotReference = {
  repository: "https://github.com/HKUDS/nanobot",
  tag: "v0.2.0",
  commit: "c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7",
  package: "nanobot-ai@0.2.0",
  cli: "nanobot",
  configPath: "~/.nanobot/config.json",
  workspacePath: "~/.nanobot/workspace",
  sessionPath: "<workspace>/sessions/*.jsonl",
  sessionFiles: ["nanobot/session/manager.py", "nanobot/config/paths.py"],
  hookFiles: ["nanobot/agent/hook.py", "nanobot/bus/events.py", "nanobot/agent/runner.py"],
}
