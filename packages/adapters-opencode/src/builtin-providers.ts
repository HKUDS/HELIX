import type { LegoHookHost, HookScope } from "@helix/lego-hooks"
import { registerOpenCodeHooks, type OpenCodeHooks } from "./plugin-adapter"

export const openCodeBuiltinProviderIDs = [
  "codex",
  "github-copilot",
  "gitlab",
  "poe",
  "cloudflare",
  "azure",
  "digitalocean",
  "xai",
] as const

export type OpenCodeBuiltinProviderID = (typeof openCodeBuiltinProviderIDs)[number]

export interface OpenCodeBuiltinProviderDefinition {
  id: OpenCodeBuiltinProviderID
  label: string
  packageName: string
  auth: {
    strategy: "api-key" | "oauth" | "cloud-token" | "azure"
    env: string[]
  }
  provider: {
    protocol: "openai-compatible" | "anthropic-compatible" | "custom"
    baseURL?: string
    headers?: Record<string, string>
    models?: string[]
  }
}

export interface LoadedOpenCodeBuiltinProvider {
  definition: OpenCodeBuiltinProviderDefinition
  source: { id: string; scope: "builtin"; metadata: Record<string, unknown> }
  scope: HookScope
}

export interface RegisterOpenCodeBuiltinProviderInput {
  providers?: OpenCodeBuiltinProviderID[]
  env?: Record<string, string | undefined>
}

export const openCodeBuiltinProviderDefinitions: Record<OpenCodeBuiltinProviderID, OpenCodeBuiltinProviderDefinition> = {
  codex: {
    id: "codex",
    label: "Codex",
    packageName: "@opencode/provider-codex",
    auth: { strategy: "api-key", env: ["CODEX_API_KEY", "OPENAI_API_KEY"] },
    provider: { protocol: "openai-compatible", baseURL: "https://api.openai.com/v1" },
  },
  "github-copilot": {
    id: "github-copilot",
    label: "GitHub Copilot",
    packageName: "@opencode/provider-github-copilot",
    auth: { strategy: "oauth", env: ["GITHUB_COPILOT_TOKEN", "GITHUB_TOKEN"] },
    provider: { protocol: "openai-compatible" },
  },
  gitlab: {
    id: "gitlab",
    label: "GitLab",
    packageName: "@opencode/provider-gitlab",
    auth: { strategy: "api-key", env: ["GITLAB_TOKEN", "GITLAB_API_TOKEN"] },
    provider: { protocol: "openai-compatible" },
  },
  poe: {
    id: "poe",
    label: "Poe",
    packageName: "@opencode/provider-poe",
    auth: { strategy: "api-key", env: ["POE_API_KEY"] },
    provider: { protocol: "custom" },
  },
  cloudflare: {
    id: "cloudflare",
    label: "Cloudflare Workers AI",
    packageName: "@opencode/provider-cloudflare",
    auth: { strategy: "cloud-token", env: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"] },
    provider: { protocol: "openai-compatible", baseURL: "https://api.cloudflare.com/client/v4/accounts/{accountID}/ai/v1" },
  },
  azure: {
    id: "azure",
    label: "Azure OpenAI",
    packageName: "@opencode/provider-azure",
    auth: { strategy: "azure", env: ["AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_DEPLOYMENT"] },
    provider: { protocol: "openai-compatible" },
  },
  digitalocean: {
    id: "digitalocean",
    label: "DigitalOcean Gradient AI",
    packageName: "@opencode/provider-digitalocean",
    auth: { strategy: "api-key", env: ["DIGITALOCEAN_API_TOKEN", "DIGITALOCEAN_ACCESS_TOKEN"] },
    provider: { protocol: "openai-compatible" },
  },
  xai: {
    id: "xai",
    label: "xAI",
    packageName: "@opencode/provider-xai",
    auth: { strategy: "api-key", env: ["XAI_API_KEY"] },
    provider: { protocol: "openai-compatible", baseURL: "https://api.x.ai/v1" },
  },
}

export function registerOpenCodeBuiltinProviderPlugins(
  host: LegoHookHost,
  input: RegisterOpenCodeBuiltinProviderInput = {},
): LoadedOpenCodeBuiltinProvider[] {
  const env = input.env ?? process.env
  const providers = input.providers ?? [...openCodeBuiltinProviderIDs]
  return providers.map((id) => {
    const definition = openCodeBuiltinProviderDefinitions[id]
    const source = {
      id: `opencode-builtin-${id}`,
      scope: "builtin" as const,
      metadata: { builtin: true, providerID: id, packageName: definition.packageName },
    }
    const scope = host.createScope(source)
    registerOpenCodeHooks(host, scope, hooksForDefinition(definition, env))
    return { definition, source, scope }
  })
}

function hooksForDefinition(definition: OpenCodeBuiltinProviderDefinition, env: Record<string, string | undefined>): OpenCodeHooks {
  const credential = firstEnv(definition.auth.env, env)
  return {
    auth: {
      id: definition.id,
      label: definition.label,
      strategy: definition.auth.strategy,
      env: definition.auth.env,
      ...(credential ? { credential } : {}),
    },
    provider: {
      id: definition.id,
      label: definition.label,
      packageName: definition.packageName,
      auth: { source: `opencode-builtin-${definition.id}`, env: definition.auth.env },
      ...definition.provider,
    },
  }
}

function firstEnv(keys: string[], env: Record<string, string | undefined>): string | undefined {
  for (const key of keys) {
    const value = env[key]
    if (value) return value
  }
  return undefined
}
