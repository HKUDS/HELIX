import { homedir } from "node:os"
import { existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import {
  createCliConfigSource,
  createDeepMergeConfigStrategy,
  createEnvConfigSource,
  createStaticConfigSource,
  createUserConfigSource,
  createWorkspaceConfigSource,
  discoverConfigFiles,
  normalizeConfigLayer,
  parseConfigText,
  resolveConfigEnvRefs,
  stringList,
  withMergedList,
  type ConfigLayer,
  type ConfigMergeResult,
  type ConfigMergeStrategyPort,
  type ConfigSourcePort,
} from "./config-atoms"

export class LegoConfigService {
  private readonly layers: ConfigLayer[] = []
  private readonly mergeStrategy: ConfigMergeStrategyPort

  constructor(input: { mergeStrategy?: ConfigMergeStrategyPort; sources?: ConfigSourcePort[] } = {}) {
    this.mergeStrategy = input.mergeStrategy ?? createDeepMergeConfigStrategy()
    for (const source of input.sources ?? []) this.addSource(source)
  }

  addSource(source: ConfigSourcePort): void {
    for (const layer of source.load()) this.addLayer(layer)
  }

  addLayer(layer: Omit<ConfigLayer, "priority"> & { priority?: number }): void {
    this.layers.push(normalizeConfigLayer(layer))
    this.layers.sort((a, b) => a.priority - b.priority)
  }

  merge(): ConfigMergeResult {
    return this.mergeStrategy.merge(this.layers)
  }

  get<T = unknown>(path: string, fallback?: T): T | undefined {
    const merged = this.merge().values
    const value = path.split(".").reduce<unknown>((current, segment) => {
      if (!isRecord(current)) return undefined
      return current[segment]
    }, merged)
    return value === undefined ? fallback : (value as T)
  }
}

export function createOpenCodeConfig(input: {
  global?: Record<string, unknown>
  project?: Record<string, unknown>
  env?: NodeJS.ProcessEnv
  content?: Record<string, unknown>
  cli?: Record<string, unknown>
}): LegoConfigService {
  const service = new LegoConfigService({
    sources: [
      createStaticConfigSource({
        scope: "builtin",
        name: "opencode.defaults",
        values: {
          product: "opencode",
          plugin: [],
          agents: ["build", "plan", "general"],
          session: { storage: "event-projection" },
        },
      }),
    ],
  })
  if (input.global) service.addSource(createStaticConfigSource({ scope: "global", name: "opencode.global", values: input.global }))
  if (input.project) service.addSource(createStaticConfigSource({ scope: "project", name: "opencode.project", values: input.project }))
  if (input.env) service.addSource(createEnvConfigSource({ env: input.env, prefix: "OPENCODE_", name: "opencode.env" }))
  if (input.content) service.addSource(createStaticConfigSource({ scope: "env", name: "opencode.env-content", values: input.content, priority: 35 }))
  if (input.cli) service.addSource(createCliConfigSource({ values: input.cli, name: "opencode.cli" }))
  return service
}

export function createOpenCodeConfigFromFiles(input: {
  cwd: string
  home?: string
  env?: NodeJS.ProcessEnv
  cli?: Record<string, unknown>
}): LegoConfigService {
  const home = input.home ?? homedir()
  const env = input.env ?? process.env
  const configHome = openCodeConfigHome(home, env)
  const projectConfigPaths = openCodeProjectConfigPaths(input.cwd, env)
  const content = openCodeConfigContent(env)
  const global = createUserConfigSource({
    paths: [
      join(configHome, "config.json"),
      join(configHome, "opencode.json"),
      join(configHome, "opencode.jsonc"),
    ],
    name: "opencode.global-files",
  }).load()[0]?.values ?? {}
  const project = createWorkspaceConfigSource({
    paths: projectConfigPaths,
    name: "opencode.project-files",
  }).load()[0]?.values ?? {}
  const globalPluginFiles = openCodePluginFiles([configHome])
  const projectPluginFiles = openCodePluginFiles(openCodeConfigDirectories(input.cwd, env))
  const orderedPlugins = [
    ...stringList(global["plugin"]),
    ...stringList(project["plugin"]),
    ...globalPluginFiles,
    ...projectPluginFiles,
  ]
  return createOpenCodeConfig({
    global,
    project: orderedPlugins.length > 0 ? { ...project, plugin: orderedPlugins } : project,
    ...(input.env ? { env: withoutOpenCodeControlEnv(input.env) } : {}),
    ...(content ? { content } : {}),
    ...(input.cli ? { cli: input.cli } : {}),
  })
}

export function createPiConfig(input: {
  global?: Record<string, unknown>
  project?: Record<string, unknown>
  env?: NodeJS.ProcessEnv
  cli?: Record<string, unknown>
}): LegoConfigService {
  const service = new LegoConfigService({
    sources: [
      createStaticConfigSource({
        scope: "builtin",
        name: "pi.defaults",
        values: {
          product: "pi-mono",
          packages: [],
          extensions: [],
          session: { storage: "jsonl-tree" },
          ui: { kind: "tui" },
        },
      }),
    ],
  })
  if (input.global) service.addSource(createStaticConfigSource({ scope: "global", name: "pi.global", values: input.global }))
  if (input.project) service.addSource(createStaticConfigSource({ scope: "project", name: "pi.project", values: input.project }))
  if (input.env) service.addSource(createEnvConfigSource({ env: input.env, prefix: "PI_", name: "pi.env" }))
  if (input.cli) service.addSource(createCliConfigSource({ values: input.cli, name: "pi.cli" }))
  return service
}

export function createPiConfigFromFiles(input: {
  cwd: string
  home?: string
  env?: NodeJS.ProcessEnv
  cli?: Record<string, unknown>
}): LegoConfigService {
  const home = input.home ?? homedir()
  const global = createUserConfigSource({
    paths: [join(home, ".pi", "agent", "settings.json")],
    name: "pi.global-files",
  }).load()[0]?.values ?? {}
  const project = createWorkspaceConfigSource({
    paths: [join(input.cwd, "settings.json"), join(input.cwd, ".pi", "settings.json")],
    name: "pi.project-files",
  }).load()[0]?.values ?? {}
  const discoveredExtensions = [
    ...discoverConfigFiles(join(home, ".pi", "agent", "extensions"), { includePackageIndex: true }),
    ...discoverConfigFiles(join(input.cwd, ".pi", "extensions"), { includePackageIndex: true }),
  ]
  return createPiConfig({
    global,
    project: discoveredExtensions.length > 0 ? withMergedList(project, "extensions", discoveredExtensions) : project,
    ...(input.env ? { env: input.env } : {}),
    ...(input.cli ? { cli: input.cli } : {}),
  })
}

export function createNanobotConfig(input: {
  global?: Record<string, unknown>
  project?: Record<string, unknown>
  env?: NodeJS.ProcessEnv
  cli?: Record<string, unknown>
}): LegoConfigService {
  const service = new LegoConfigService({
    sources: [
      createStaticConfigSource({
        scope: "builtin",
        name: "nanobot.defaults",
        values: {
          product: "nanobot",
          package: "nanobot-ai",
          configPath: "~/.nanobot/config.json",
          workspace: "~/.nanobot/workspace",
          agents: {
            defaults: {
              provider: "auto",
              model: "anthropic/claude-opus-4-5",
              maxTokens: 8192,
              contextWindowTokens: 65_536,
              temperature: 0.1,
              maxToolIterations: 200,
              maxToolResultChars: 16_000,
              maxMessages: 120,
              timezone: "UTC",
            },
          },
          session: { storage: "jsonl-sessions" },
          ui: { kind: "cli" },
        },
      }),
    ],
  })
  if (input.global) service.addSource(createStaticConfigSource({ scope: "global", name: "nanobot.global", values: input.global }))
  if (input.project) service.addSource(createStaticConfigSource({ scope: "project", name: "nanobot.project", values: input.project }))
  if (input.env) service.addSource(createEnvConfigSource({ env: input.env, prefix: "NANOBOT_", name: "nanobot.env" }))
  if (input.cli) service.addSource(createCliConfigSource({ values: input.cli, name: "nanobot.cli" }))
  return service
}

export function createHermesAgentConfig(input: {
  global?: Record<string, unknown>
  project?: Record<string, unknown>
  env?: NodeJS.ProcessEnv
  cli?: Record<string, unknown>
}): LegoConfigService {
  const service = new LegoConfigService({
    sources: [
      createStaticConfigSource({
        scope: "builtin",
        name: "hermes.defaults",
        values: {
          product: "hermes-agent",
          provider: "auto",
          model: "",
          apiMode: "chat_completions",
          maxIterations: 90,
          enabledToolsets: ["file", "terminal", "web", "todo", "delegation"],
          configPath: "~/.hermes/config.yaml",
          envPath: "~/.hermes/.env",
          session: { storage: "sqlite-fts5" },
          ui: { kind: "cli", tui: true },
          protocols: ["cli", "tui-gateway", "api-server", "acp"],
        },
      }),
    ],
  })
  if (input.global) service.addSource(createStaticConfigSource({ scope: "global", name: "hermes.global", values: input.global }))
  if (input.project) service.addSource(createStaticConfigSource({ scope: "project", name: "hermes.project", values: input.project }))
  if (input.env) service.addSource(createEnvConfigSource({ env: input.env, prefix: "HERMES_", name: "hermes.env" }))
  if (input.cli) service.addSource(createCliConfigSource({ values: input.cli, name: "hermes.cli" }))
  return service
}

export function createHermesAgentConfigFromFiles(input: {
  cwd: string
  home?: string
  env?: NodeJS.ProcessEnv
  cli?: Record<string, unknown>
}): LegoConfigService {
  const home = input.home ?? homedir()
  const global = createUserConfigSource({
    paths: [join(home, ".hermes", "config.json")],
    name: "hermes.global-files",
  }).load()[0]?.values ?? {}
  const project = createWorkspaceConfigSource({
    paths: [join(input.cwd, ".hermes", "config.json"), join(input.cwd, "hermes.config.json")],
    name: "hermes.project-files",
  }).load()[0]?.values ?? {}
  const env = input.env ?? process.env
  return createHermesAgentConfig({
    global: resolveConfigEnvRefs(global, env),
    project: resolveConfigEnvRefs(project, env),
    ...(input.env ? { env: input.env } : {}),
    ...(input.cli ? { cli: input.cli } : {}),
  })
}

export function createNanobotConfigFromFiles(input: {
  cwd: string
  home?: string
  env?: NodeJS.ProcessEnv
  cli?: Record<string, unknown>
}): LegoConfigService {
  const home = input.home ?? homedir()
  const global = createUserConfigSource({
    paths: [join(home, ".nanobot", "config.json")],
    name: "nanobot.global-files",
  }).load()[0]?.values ?? {}
  const project = createWorkspaceConfigSource({
    paths: [join(input.cwd, ".nanobot", "config.json"), join(input.cwd, "nanobot.config.json")],
    name: "nanobot.project-files",
  }).load()[0]?.values ?? {}
  const env = input.env ?? process.env
  return createNanobotConfig({
    global: resolveConfigEnvRefs(global, env),
    project: resolveConfigEnvRefs(project, env),
    ...(input.env ? { env: input.env } : {}),
    ...(input.cli ? { cli: input.cli } : {}),
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function openCodeConfigHome(home: string, env: NodeJS.ProcessEnv): string {
  const configRoot = env["XDG_CONFIG_HOME"]?.trim() || join(home, ".config")
  return resolve(configRoot, "opencode")
}

function openCodeProjectConfigPaths(cwd: string, env: NodeJS.ProcessEnv): string[] {
  const paths = env["OPENCODE_CONFIG"] ? [resolve(env["OPENCODE_CONFIG"])] : []
  if (!isTruthyEnv(env["OPENCODE_DISABLE_PROJECT_CONFIG"])) {
    paths.push(...discoverAncestorFiles(cwd, ["opencode.json", "opencode.jsonc"]))
    for (const dir of discoverAncestorDirectories(cwd, ".opencode")) {
      paths.push(join(dir, "opencode.json"), join(dir, "opencode.jsonc"))
    }
  }
  if (env["OPENCODE_CONFIG_DIR"]) {
    const dir = resolve(env["OPENCODE_CONFIG_DIR"])
    paths.push(join(dir, "opencode.json"), join(dir, "opencode.jsonc"))
  }
  return paths
}

function openCodeConfigDirectories(cwd: string, env: NodeJS.ProcessEnv): string[] {
  const dirs = isTruthyEnv(env["OPENCODE_DISABLE_PROJECT_CONFIG"]) ? [] : discoverAncestorDirectories(cwd, ".opencode")
  return env["OPENCODE_CONFIG_DIR"] ? [...dirs, resolve(env["OPENCODE_CONFIG_DIR"])] : dirs
}

function openCodePluginFiles(directories: string[]): string[] {
  return directories.flatMap((dir) => [
    ...discoverConfigFiles(join(dir, "plugin")),
    ...discoverConfigFiles(join(dir, "plugins")),
  ])
}

function openCodeConfigContent(env: NodeJS.ProcessEnv): Record<string, unknown> | undefined {
  const content = env["OPENCODE_CONFIG_CONTENT"]
  if (!content) return undefined
  try {
    const parsed = parseConfigText(content)
    return isRecord(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

function withoutOpenCodeControlEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const copy = { ...env }
  delete copy["OPENCODE_CONFIG"]
  delete copy["OPENCODE_CONFIG_CONTENT"]
  delete copy["OPENCODE_CONFIG_DIR"]
  delete copy["OPENCODE_DISABLE_PROJECT_CONFIG"]
  return copy
}

function discoverAncestorFiles(cwd: string, filenames: readonly string[]): string[] {
  const files: string[] = []
  for (const dir of ancestorDirectories(cwd).reverse()) {
    for (const filename of filenames) {
      const file = join(dir, filename)
      if (existsSync(file)) files.push(file)
    }
  }
  return files
}

function discoverAncestorDirectories(cwd: string, name: string): string[] {
  const dirs = ancestorDirectories(cwd)
    .map((dir) => join(dir, name))
    .filter((dir) => existsSync(dir))
  return dirs.reverse()
}

function ancestorDirectories(cwd: string): string[] {
  const dirs: string[] = []
  let current = resolve(cwd)
  while (true) {
    dirs.push(current)
    const parent = dirname(current)
    if (parent === current) return dirs
    current = parent
  }
}

function isTruthyEnv(value: string | undefined): boolean {
  return value === "1" || value === "true"
}
