import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { resolve } from "node:path"

export type ConfigScope = "builtin" | "global" | "project" | "env" | "cli" | "extension"
export type ConfigProductPersonality = "opencode" | "pi-mono" | "nanobot" | "hermes-agent"

export interface ConfigLayer {
  scope: ConfigScope
  name: string
  values: Record<string, unknown>
  priority: number
}

export interface ConfigMergeResult {
  values: Record<string, unknown>
  layers: ConfigLayer[]
}

export interface ConfigSourcePort {
  load(): ConfigLayer[]
}

export interface ConfigMergeStrategyPort {
  merge(layers: readonly ConfigLayer[]): ConfigMergeResult
}

export interface ConfigValidationIssue {
  path: string
  message: string
}

export interface ConfigValidationReport<TValue = Record<string, unknown>> {
  ok: boolean
  value?: TValue
  issues: ConfigValidationIssue[]
}

export interface ConfigValidatorPort<TValue = Record<string, unknown>> {
  validate(value: Record<string, unknown>): ConfigValidationReport<TValue>
}

export interface ConfigProductPathInput {
  cwd: string
  home: string
}

export interface ConfigProductProfile {
  product: ConfigProductPersonality
  atomPrefix: "opencode" | "pi" | "nanobot" | "hermes"
  envPrefix: string
  defaults: Record<string, unknown>
  globalPaths(input: ConfigProductPathInput): string[]
  projectPaths(input: ConfigProductPathInput): string[]
  extensionDirectories(input: ConfigProductPathInput): Array<{ path: string; includePackageIndex?: boolean }>
  precedence: ConfigScope[]
  requiredPaths: string[]
}

export interface ConfigProductAtoms {
  readonly product: ConfigProductPersonality
  profile(): ConfigProductProfile
  atomID(kind: "source" | "precedence" | "validator"): string
  source(input: { cwd: string; home: string; env?: Record<string, string | undefined>; cli?: Record<string, unknown> }): ConfigSourcePort[]
  precedence(): ConfigScope[]
  validate(value: Record<string, unknown>): ConfigValidationReport
}

export function createStaticConfigSource(layer: Omit<ConfigLayer, "priority"> & { priority?: number }): ConfigSourcePort {
  return {
    load() {
      return [normalizeConfigLayer(layer)]
    },
  }
}

export function createEnvConfigSource(input: {
  env: Record<string, string | undefined>
  prefix: string
  scope?: ConfigScope
  name?: string
  priority?: number
}): ConfigSourcePort {
  return createStaticConfigSource({
    scope: input.scope ?? "env",
    name: input.name ?? `${input.prefix.toLowerCase()}env`,
    values: envLayer(input.env, input.prefix),
    ...(input.priority === undefined ? {} : { priority: input.priority }),
  })
}

export function createFileConfigSource(input: {
  paths: string[]
  scope: ConfigScope
  name: string
  priority?: number
}): ConfigSourcePort {
  return createStaticConfigSource({
    scope: input.scope,
    name: input.name,
    values: readConfigFiles(input.paths),
    ...(input.priority === undefined ? {} : { priority: input.priority }),
  })
}

export function createWorkspaceConfigSource(input: { paths: string[]; name?: string; priority?: number }): ConfigSourcePort {
  return createFileConfigSource({
    paths: input.paths,
    scope: "project",
    name: input.name ?? "workspace.config",
    ...(input.priority === undefined ? {} : { priority: input.priority }),
  })
}

export function createUserConfigSource(input: { paths: string[]; name?: string; priority?: number }): ConfigSourcePort {
  return createFileConfigSource({
    paths: input.paths,
    scope: "global",
    name: input.name ?? "user.config",
    ...(input.priority === undefined ? {} : { priority: input.priority }),
  })
}

export function createCliConfigSource(input: { values: Record<string, unknown>; name?: string; priority?: number }): ConfigSourcePort {
  return createStaticConfigSource({
    scope: "cli",
    name: input.name ?? "cli.override",
    values: input.values,
    ...(input.priority === undefined ? {} : { priority: input.priority }),
  })
}

export function createDeepMergeConfigStrategy(): ConfigMergeStrategyPort {
  return {
    merge(layers) {
      const ordered = [...layers].sort((a, b) => a.priority - b.priority)
      const values: Record<string, unknown> = {}
      for (const layer of ordered) mergeInto(values, layer.values)
      return { values, layers: ordered }
    },
  }
}

export function createPriorityConfigMergeStrategy(): ConfigMergeStrategyPort {
  return createDeepMergeConfigStrategy()
}

export function createConfigValidator<TValue extends Record<string, unknown> = Record<string, unknown>>(input: {
  name?: string
  validate?: (value: Record<string, unknown>) => ConfigValidationIssue[]
  transform?: (value: Record<string, unknown>) => TValue
} = {}): ConfigValidatorPort<TValue> {
  return {
    validate(value) {
      const issues = input.validate?.(value) ?? []
      return {
        ok: issues.length === 0,
        ...(issues.length === 0 ? { value: input.transform ? input.transform(value) : (value as TValue) } : {}),
        issues,
      }
    },
  }
}

export function createConfigProductAtoms(product: ConfigProductPersonality): ConfigProductAtoms {
  const profile = configProductProfile(product)
  return {
    product,
    profile: () => cloneConfigProductProfile(profile),
    atomID(kind) {
      return `${profile.atomPrefix}.config.${kind}`
    },
    source(input) {
      const sources: ConfigSourcePort[] = [
        createStaticConfigSource({ scope: "builtin", name: `${product}.defaults`, values: profile.defaults }),
        createUserConfigSource({ paths: profile.globalPaths(input), name: `${product}.global-files` }),
        createWorkspaceConfigSource({ paths: profile.projectPaths(input), name: `${product}.project-files` }),
      ]
      if (input.env) sources.push(createEnvConfigSource({ env: input.env, prefix: profile.envPrefix, name: `${product}.env` }))
      if (input.cli) sources.push(createCliConfigSource({ values: input.cli, name: `${product}.cli` }))
      return sources
    },
    precedence() {
      return [...profile.precedence]
    },
    validate(value) {
      return validateProductConfig(product, value)
    },
  }
}

export function createOpenCodeConfigAtoms(): ConfigProductAtoms {
  return createConfigProductAtoms("opencode")
}

export function createPiMonoConfigAtoms(): ConfigProductAtoms {
  return createConfigProductAtoms("pi-mono")
}

export function createNanobotConfigAtoms(): ConfigProductAtoms {
  return createConfigProductAtoms("nanobot")
}

export function createHermesAgentConfigAtoms(): ConfigProductAtoms {
  return createConfigProductAtoms("hermes-agent")
}

export function configProductProfile(product: ConfigProductPersonality): ConfigProductProfile {
  return cloneConfigProductProfile(configProductProfiles[product])
}

export function normalizeConfigLayer(layer: Omit<ConfigLayer, "priority"> & { priority?: number }): ConfigLayer {
  return {
    ...layer,
    values: structuredClone(layer.values),
    priority: layer.priority ?? priorityForScope(layer.scope),
  }
}

export function priorityForScope(scope: ConfigScope): number {
  switch (scope) {
    case "builtin":
      return 0
    case "global":
      return 10
    case "project":
      return 20
    case "env":
      return 30
    case "cli":
      return 40
    case "extension":
      return 50
  }
}

export function readConfigFiles(paths: string[]): Record<string, unknown> {
  const config: Record<string, unknown> = {}
  for (const path of paths) {
    try {
      if (!statSync(path).isFile()) continue
      const parsed = parseConfigText(readFileSync(path, "utf8")) as unknown
      if (isRecord(parsed)) mergeInto(config, parsed)
    } catch {
      continue
    }
  }
  return config
}

export function parseConfigText(text: string): unknown {
  return JSON.parse(stripTrailingJsonCommas(stripJsonComments(text)))
}

export function resolveConfigEnvRefs<T>(value: T, env: Record<string, string | undefined> = process.env): T {
  if (typeof value === "string") return value.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_match, name: string) => {
    const replacement = env[name]
    if (replacement === undefined) throw new Error(`Environment variable '${name}' referenced in config is not set`)
    return replacement
  }) as T
  if (Array.isArray(value)) return value.map((item) => resolveConfigEnvRefs(item, env)) as T
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveConfigEnvRefs(item, env)])) as T
  }
  return value
}

export function discoverConfigFiles(directory: string, options: { includePackageIndex?: boolean } = {}): string[] {
  if (!existsSync(directory)) return []
  try {
    return readdirSync(directory)
      .flatMap((entry) => {
        const path = resolve(directory, entry)
        if (/\.(cjs|js|mjs|ts)$/.test(entry)) return [path]
        if (!options.includePackageIndex) return []
        try {
          if (!statSync(path).isDirectory()) return []
        } catch {
          return []
        }
        return ["index.ts", "index.mjs", "index.js", "index.cjs"]
          .map((file) => resolve(path, file))
          .filter((candidate) => existsSync(candidate))
      })
      .sort()
  } catch {
    return []
  }
}

export function withMergedList(input: Record<string, unknown>, key: string, values: string[]): Record<string, unknown> {
  const existing = Array.isArray(input[key]) ? input[key].filter((value): value is string => typeof value === "string") : []
  return { ...input, [key]: [...existing, ...values] }
}

export function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

export function mergeInto(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(source)) {
    if (isRecord(value) && isRecord(target[key])) {
      mergeInto(target[key] as Record<string, unknown>, value)
      continue
    }
    target[key] = structuredClone(value)
  }
}

export function envLayer(env: Record<string, string | undefined>, prefix: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith(prefix) || value === undefined) continue
    const path = key
      .slice(prefix.length)
      .toLowerCase()
      .split("__")
      .filter(Boolean)
    let cursor = result
    for (const [index, segment] of path.entries()) {
      if (index === path.length - 1) {
        cursor[segment] = parseEnvValue(value)
      } else {
        cursor[segment] = isRecord(cursor[segment]) ? cursor[segment] : {}
        cursor = cursor[segment] as Record<string, unknown>
      }
    }
  }
  return result
}

export function parseEnvValue(value: string): unknown {
  if (value === "true") return true
  if (value === "false") return false
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value)
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function validateProductConfig(product: ConfigProductPersonality, value: Record<string, unknown>): ConfigValidationReport {
  const issues: ConfigValidationIssue[] = []
  if (value["product"] !== product) {
    issues.push({ path: "product", message: `expected ${product}` })
  }
  if (product === "nanobot") {
    const agents = isRecord(value["agents"]) ? value["agents"] : undefined
    const defaults = agents && isRecord(agents["defaults"]) ? agents["defaults"] : undefined
    if (!defaults || typeof defaults["model"] !== "string") issues.push({ path: "agents.defaults.model", message: "model is required" })
    if (!defaults || typeof defaults["provider"] !== "string") issues.push({ path: "agents.defaults.provider", message: "provider is required" })
  }
  return {
    ok: issues.length === 0,
    ...(issues.length === 0 ? { value } : {}),
    issues,
  }
}

function cloneConfigProductProfile(profile: ConfigProductProfile): ConfigProductProfile {
  return {
    ...profile,
    defaults: structuredClone(profile.defaults),
    precedence: [...profile.precedence],
    requiredPaths: [...profile.requiredPaths],
  }
}

const configProductProfiles: Record<ConfigProductPersonality, ConfigProductProfile> = {
  opencode: {
    product: "opencode",
    atomPrefix: "opencode",
    envPrefix: "OPENCODE_",
    defaults: {
      product: "opencode",
      plugin: [],
      agents: ["build", "plan", "general"],
      session: { storage: "event-projection" },
    },
    globalPaths: ({ home }) => [resolve(home, ".config", "opencode", "opencode.json")],
    projectPaths: ({ cwd }) => [resolve(cwd, "opencode.json"), resolve(cwd, ".opencode", "opencode.json")],
    extensionDirectories: ({ cwd, home }) => [
      { path: resolve(home, ".config", "opencode", "plugins") },
      { path: resolve(cwd, ".opencode", "plugins") },
    ],
    precedence: ["builtin", "global", "project", "env", "cli", "extension"],
    requiredPaths: ["product", "session.storage"],
  },
  "pi-mono": {
    product: "pi-mono",
    atomPrefix: "pi",
    envPrefix: "PI_",
    defaults: {
      product: "pi-mono",
      packages: [],
      extensions: [],
      session: { storage: "jsonl-tree" },
      ui: { kind: "tui" },
    },
    globalPaths: ({ home }) => [resolve(home, ".pi", "agent", "settings.json")],
    projectPaths: ({ cwd }) => [resolve(cwd, "settings.json"), resolve(cwd, ".pi", "settings.json")],
    extensionDirectories: ({ cwd, home }) => [
      { path: resolve(home, ".pi", "agent", "extensions"), includePackageIndex: true },
      { path: resolve(cwd, ".pi", "extensions"), includePackageIndex: true },
    ],
    precedence: ["builtin", "global", "project", "env", "cli", "extension"],
    requiredPaths: ["product", "session.storage", "ui.kind"],
  },
  nanobot: {
    product: "nanobot",
    atomPrefix: "nanobot",
    envPrefix: "NANOBOT_",
    defaults: {
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
    globalPaths: ({ home }) => [resolve(home, ".nanobot", "config.json")],
    projectPaths: ({ cwd }) => [resolve(cwd, ".nanobot", "config.json"), resolve(cwd, "nanobot.config.json")],
    extensionDirectories: ({ cwd, home }) => [
      { path: resolve(home, ".nanobot", "plugins") },
      { path: resolve(cwd, ".nanobot", "plugins") },
      { path: resolve(cwd, "skills"), includePackageIndex: true },
    ],
    precedence: ["builtin", "global", "project", "env", "cli", "extension"],
    requiredPaths: ["product", "agents.defaults.model", "agents.defaults.provider", "session.storage"],
  },
  "hermes-agent": {
    product: "hermes-agent",
    atomPrefix: "hermes",
    envPrefix: "HERMES_",
    defaults: {
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
    globalPaths: ({ home }) => [resolve(home, ".hermes", "config.json"), resolve(home, ".hermes", "config.yaml")],
    projectPaths: ({ cwd }) => [resolve(cwd, ".hermes", "config.json"), resolve(cwd, ".hermes", "config.yaml"), resolve(cwd, "hermes.config.json")],
    extensionDirectories: ({ cwd, home }) => [
      { path: resolve(home, ".hermes", "plugins") },
      { path: resolve(cwd, ".hermes", "plugins") },
      { path: resolve(home, ".hermes", "skills"), includePackageIndex: true },
      { path: resolve(cwd, "skills"), includePackageIndex: true },
    ],
    precedence: ["builtin", "global", "project", "env", "cli", "extension"],
    requiredPaths: ["product", "session.storage", "ui.kind"],
  },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function stripJsonComments(input: string): string {
  let output = ""
  let inString = false
  let escaped = false
  for (let index = 0; index < input.length; index++) {
    const char = input[index]
    const next = input[index + 1]
    if (inString) {
      output += char
      if (escaped) escaped = false
      else if (char === "\\") escaped = true
      else if (char === "\"") inString = false
      continue
    }
    if (char === "\"") {
      inString = true
      output += char
      continue
    }
    if (char === "/" && next === "/") {
      while (index < input.length && input[index] !== "\n") index++
      output += "\n"
      continue
    }
    if (char === "/" && next === "*") {
      index += 2
      while (index < input.length && !(input[index] === "*" && input[index + 1] === "/")) index++
      index++
      continue
    }
    output += char
  }
  return output
}

function stripTrailingJsonCommas(input: string): string {
  let output = ""
  let inString = false
  let escaped = false
  for (let index = 0; index < input.length; index++) {
    const char = input[index]
    if (inString) {
      output += char
      if (escaped) escaped = false
      else if (char === "\\") escaped = true
      else if (char === "\"") inString = false
      continue
    }
    if (char === "\"") {
      inString = true
      output += char
      continue
    }
    if (char === ",") {
      let nextIndex = index + 1
      while (/\s/.test(input[nextIndex] ?? "")) nextIndex++
      if (input[nextIndex] === "}" || input[nextIndex] === "]") continue
    }
    output += char
  }
  return output
}
