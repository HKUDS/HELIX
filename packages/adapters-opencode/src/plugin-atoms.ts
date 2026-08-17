import { exec } from "node:child_process"
import { promisify } from "node:util"
import {
  inferLegoBlockImplementationKind,
  type LegoBlockImplementationKind,
} from "@helix/contracts"
import type { HookScope, HookSourceInfo, LegoHookHost } from "@helix/lego-hooks"
import type {
  OpenCodeHooks,
  OpenCodePlugin,
  OpenCodePluginInput,
  OpenCodePluginOptions,
  OpenCodeShellDollar,
  OpenCodeShellResult,
  OpenCodeWorkspaceRegistration,
} from "./plugin-adapter"
import {
  openCodeProviderPluginRegisterProvider,
  type OpenCodeProviderPluginDescriptorInfo,
} from "./opencode-provider-plugin-descriptor.ts"
import { createOpenCodeNativePluginPermissionBridge } from "./opencode-plugin-permission-bridge.ts"
import { createOpenCodePluginToolRegistryBridge } from "./opencode-plugin-tool-registry.ts"
import {
  createOpenCodeNativePluginLoaderAtom,
  normalizeOpenCodeNativePluginManifest,
} from "./opencode-plugin-loader.ts"
import { createOpenCodeNativePluginEventMapper } from "./opencode-plugin-event-mapper.ts"
import { createOpenCodePluginUIRegistryBridge } from "./opencode-plugin-ui-registry.ts"

const execAsync = promisify(exec)

export interface OpenCodePluginLoadInput {
  host: LegoHookHost
  plugin: OpenCodePlugin
  pluginInput: OpenCodePluginInput
  options?: OpenCodePluginOptions
  source?: { id?: string; path?: string; scope?: string }
  config?: Record<string, unknown>
}

export interface OpenCodePluginManifestNormalizerAtom {
  normalize(input: { plugin: OpenCodePlugin; source?: OpenCodePluginLoadInput["source"] }): { id: string; path?: string; scope: string }
}

export interface OpenCodePluginLoaderAtom {
  load(input: OpenCodePluginLoadInput): Promise<HookScope>
}

export interface OpenCodePluginRegistrationInput {
  host: LegoHookHost
  scope: HookScope
  hooks: OpenCodeHooks
}

export interface OpenCodePluginRegistryBridgeAtom {
  register(input: OpenCodePluginRegistrationInput): void
}

export interface OpenCodePluginPermissionBridgeAtom {
  register(input: OpenCodePluginRegistrationInput): void
}

export interface OpenCodePluginEventMapperAtom {
  register(input: OpenCodePluginRegistrationInput): void
}

export interface OpenCodeExperimentalWorkspaceBridgeAtom {
  withWorkspace(input: { host: LegoHookHost; source: HookSourceInfo; pluginInput: OpenCodePluginInput }): OpenCodePluginInput
  register(input: { host: LegoHookHost; source: HookSourceInfo; type: string; adapter: unknown }): void
}

export interface OpenCodeSpecialAtomDescriptor {
  id: string
  port: string
  implementation: string
  referenceSource: string
  implementationKind: LegoBlockImplementationKind
}

export interface OpenCodeSpecialAtomProfile {
  product: "opencode"
  atoms(): OpenCodeSpecialAtomDescriptor[]
  atom(id: string): OpenCodeSpecialAtomDescriptor | undefined
}

interface OpenCodeSpecialAtomDescriptorInput {
  id: string
  port: string
  implementation: string
  referenceSource: string
  implementationKind?: LegoBlockImplementationKind
}

function openCodeSpecialAtomDescriptor(input: OpenCodeSpecialAtomDescriptorInput): OpenCodeSpecialAtomDescriptor {
  return {
    id: input.id,
    port: input.port,
    implementation: input.implementation,
    referenceSource: referenceOnly(input.referenceSource),
    implementationKind: input.implementationKind ?? inferLegoBlockImplementationKind(input.id, { personality: "opencode" }),
  }
}

function referenceOnly(source: string): string {
  return source.startsWith("reference only:") ? source : `reference only: ${source}`
}

export function createOpenCodePluginManifestNormalizer(): OpenCodePluginManifestNormalizerAtom {
  return {
    normalize(input) {
      return normalizeOpenCodeNativePluginManifest({
        plugin: input.plugin,
        ...(input.source ? { source: input.source } : {}),
      })
    },
  }
}

export function createOpenCodePluginLoaderAtom(input: {
  manifestNormalizer?: OpenCodePluginManifestNormalizerAtom
  registryBridge?: OpenCodePluginRegistryBridgeAtom
  permissionBridge?: OpenCodePluginPermissionBridgeAtom
  eventMapper?: OpenCodePluginEventMapperAtom
  workspaceBridge?: OpenCodeExperimentalWorkspaceBridgeAtom
} = {}): OpenCodePluginLoaderAtom {
  const manifestNormalizer = input.manifestNormalizer ?? createOpenCodePluginManifestNormalizer()
  const registryBridge = input.registryBridge ?? createOpenCodePluginRegistryBridge()
  const permissionBridge = input.permissionBridge ?? createOpenCodePluginPermissionBridge()
  const eventMapper = input.eventMapper ?? createOpenCodePluginEventMapper()
  const workspaceBridge = input.workspaceBridge ?? createOpenCodeExperimentalWorkspaceBridge()
  return createOpenCodeNativePluginLoaderAtom({
    manifestNormalizer,
    registryBridge,
    permissionBridge,
    eventMapper,
    workspaceBridge,
  })
}

export function createOpenCodePluginRegistryBridge(): OpenCodePluginRegistryBridgeAtom {
  const toolRegistry = createOpenCodePluginToolRegistryBridge()
  const uiRegistry = createOpenCodePluginUIRegistryBridge()
  return {
    register({ host, scope, hooks }) {
      toolRegistry.register({ host, scope, hooks })
      if (hooks.auth) {
        host.services.set(`opencode.auth:${scope.source.id}`, hooks.auth)
        scope.addCleanup(() => {
          host.services.delete(`opencode.auth:${scope.source.id}`)
        })
        scope.addCleanup(host.registerAuth({ name: scope.source.id, config: hooks.auth }, scope.source))
      }
      if (hooks.provider) {
        openCodeProviderPluginRegisterProvider({
          host,
          scope,
          provider: hooks.provider as OpenCodeProviderPluginDescriptorInfo,
        })
      }
      uiRegistry.register({ host, scope, hooks })
    },
  }
}

export function createOpenCodePluginPermissionBridge(): OpenCodePluginPermissionBridgeAtom {
  return createOpenCodeNativePluginPermissionBridge()
}

export function createOpenCodePluginEventMapper(): OpenCodePluginEventMapperAtom {
  return createOpenCodeNativePluginEventMapper()
}

export function createOpenCodeExperimentalWorkspaceBridge(): OpenCodeExperimentalWorkspaceBridgeAtom {
  return {
    withWorkspace({ host, source, pluginInput }) {
      const existing = pluginInput.experimental_workspace
      return {
        ...pluginInput,
        $: pluginInput.$ ?? createOpenCodeShellDollar(pluginInput.directory),
        experimental_workspace: {
          register(type, adapter) {
            registerExperimentalWorkspace(host, source, type, adapter)
            existing?.register(type, adapter)
          },
        },
      }
    },
    register(input) {
      registerExperimentalWorkspace(input.host, input.source, input.type, input.adapter)
    },
  }
}

export function createOpenCodeShellDollar(cwd: string): OpenCodeShellDollar {
  return async (strings, ...values) => {
    const command = typeof strings === "string" ? strings : interpolateShellTemplate(strings, values)
    try {
      const { stdout, stderr } = await execAsync(command, { cwd })
      return {
        command,
        stdout,
        stderr,
        exitCode: 0,
        text() {
          return stdout
        },
      }
    } catch (error) {
      const output = error as { stdout?: string; stderr?: string; code?: number }
      return {
        command,
        stdout: output.stdout ?? "",
        stderr: output.stderr ?? "",
        exitCode: typeof output.code === "number" ? output.code : 1,
        text() {
          return output.stdout ?? ""
        },
      }
    }
  }
}

export function createOpenCodeSpecialAtomProfile(): OpenCodeSpecialAtomProfile {
  return {
    product: "opencode",
    atoms() {
      return openCodeSpecialAtomDescriptors.map((atom) => ({ ...atom }))
    },
    atom(id) {
      const descriptor = openCodeSpecialAtomDescriptors.find((atom) => atom.id === id)
      return descriptor ? { ...descriptor } : undefined
    },
  }
}

const openCodeSpecialAtomDescriptors: OpenCodeSpecialAtomDescriptor[] = [
  openCodeSpecialAtomDescriptor({ id: "opencode.block.compatibility-metadata", port: "block.manifest", implementation: "OpenCode upstream metadata", referenceSource: "recipe metadata" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.capability.aliases", port: "capability.ref", implementation: "OpenCode capability aliases", referenceSource: "runtime module graph" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.recipe.binding-aliases", port: "recipe.binding", implementation: "OpenCode recipe binding aliases", referenceSource: "SDK/server/plugin surfaces" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.conformance.product-gate", port: "conformance.ref", implementation: "OpenCode fixture/live parity gate", referenceSource: "native opencode run" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.identity.id-generator", port: "identity.id-generator", implementation: "session/message/tool id bridge", referenceSource: "session projection" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.identity.clock-format", port: "identity.clock", implementation: "OpenCode timestamp projection", referenceSource: "session events" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.identity.workspace-resolver", port: "identity.workspace-resolver", implementation: "workspace service bridge", referenceSource: "workspace package" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.event.envelope-bridge", port: "event.envelope", implementation: "event envelope bridge", referenceSource: "SyncEvent stream" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.event.syncevent-bridge", port: "event.log", implementation: "SyncEvent projection bridge", referenceSource: "session event log" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.trace.debug-surface", port: "trace.recorder", implementation: "debug/control-plane trace surface", referenceSource: "control plane" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.plugin.loader", port: "hook.bus", implementation: "createOpenCodePluginLoaderAtom", referenceSource: "plugin loader" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.plugin.event-mapper", port: "hook.handler-chain", implementation: "createOpenCodePluginEventMapper", referenceSource: "plugin hook table" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.plugin.registry-bridge", port: "tool.registry", implementation: "createOpenCodePluginRegistryBridge", referenceSource: "plugin tool/provider/ui registries" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.plugin.provider-registry-bridge", port: "registry.provider", implementation: "provider hook registry bridge", referenceSource: "plugin provider hook" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.plugin.ui-registry-bridge", port: "registry.ui", implementation: "UI provider registry bridge", referenceSource: "plugin UI hook" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.plugin.permission-bridge", port: "tool.permission-policy", implementation: "createOpenCodePluginPermissionBridge", referenceSource: "permission.ask hook" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.tool.definition-plugin-bridge", port: "tool.definition", implementation: "tool.definition hook bridge", referenceSource: "plugin tool definition hook" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.tool.result-render-bridge", port: "tool.result-normalizer", implementation: "tool.execute.after bridge", referenceSource: "tool execute hooks" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.tool.status-bridge", port: "tool.audit-log", implementation: "tool execution events", referenceSource: "tool status stream" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.shell.env-bridge", port: "process-runner.port", implementation: "shell.env + $ helper bridge", referenceSource: "Bun $ helper" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.provider.request-options", port: "provider.request-shape", implementation: "chat.params/chat.headers bridge", referenceSource: "provider plugins" }),
  openCodeSpecialAtomDescriptor({ id: "opencode.provider.event-observer", port: "provider.event-normalizer", implementation: "provider response observer", referenceSource: "provider stream" }),
  openCodeSpecialAtomDescriptor({
    id: "opencode.tui.shell",
    port: "ui.event-loop",
    implementation: "shared Helix UI event-loop preview for OpenCode",
    referenceSource: "TUI package; implemented here as shared UI event-loop preview",
    implementationKind: "preview",
  }),
]

function interpolateShellTemplate(strings: TemplateStringsArray, values: unknown[]): string {
  return strings.reduce((command, chunk, index) => {
    const value = index < values.length ? shellEscape(values[index]) : ""
    return `${command}${chunk}${value}`
  }, "")
}

function shellEscape(value: unknown): string {
  const text = String(value)
  if (/^[A-Za-z0-9_/:=.,+-]+$/.test(text)) return text
  return `'${text.replace(/'/g, "'\\''")}'`
}

function registerExperimentalWorkspace(host: LegoHookHost, source: HookSourceInfo, type: string, adapter: unknown): void {
  const registration: OpenCodeWorkspaceRegistration = { type, adapter, source }
  const key = `opencode.experimental_workspace:${type}`
  const registrations = readWorkspaceRegistrations(host.services.get(key))
  registrations.push(registration)
  host.services.set(key, registrations)
  host.services.set(`${key}:${source.id}`, registration)
}

function readWorkspaceRegistrations(value: unknown): OpenCodeWorkspaceRegistration[] {
  return Array.isArray(value) ? [...(value as OpenCodeWorkspaceRegistration[])] : []
}
