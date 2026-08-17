import { join } from "node:path"
import { ProjectionSessionService, ProjectionSQLiteStorage } from "@helix/lego-session"

export interface HermesSessionPersonalityOptions {
  storageDir: string
  cwd?: string | undefined
  sqlitePath?: string | undefined
}

export function createHermesSessionPersonality(options: HermesSessionPersonalityOptions): ProjectionSessionService {
  return new ProjectionSessionService({
    storage: new ProjectionSQLiteStorage(options.sqlitePath ?? join(options.storageDir, "hermes-sessions.sqlite")),
    ...(options.cwd ? { cwd: options.cwd } : {}),
  })
}

export const hermesReference = {
  repository: "https://github.com/NousResearch/hermes-agent",
  version: "0.15.1",
  releaseDate: "2026.5.29",
  commit: "92a567db2d7a5031df8211efbfdad864c2f51faf",
  package: "hermes-agent==0.15.1",
  cli: "hermes",
  configPath: "~/.hermes/config.yaml",
  envPath: "~/.hermes/.env",
  sessionPath: "~/.hermes/hermes.db",
  coreFiles: ["run_agent.py", "model_tools.py", "toolsets.py", "hermes_cli/main.py"],
  shellFiles: ["hermes_cli/main.py", "hermes_cli/web_server.py", "gateway/platforms/api_server.py", "acp_adapter/"],
  docs: ["website/docs/developer-guide/architecture.md", "website/docs/developer-guide/programmatic-integration.md"],
}
