import { createHash } from "node:crypto"
import type { LegoHookHost } from "@helix/lego-hooks"
import {
  createConventionalPromptResourceDiscoveryAtom,
  createPromptResourceLoaderAtom,
  createPromptSystemBuilderAtom,
  normalizeDiscoveredResources,
  type ConventionalPromptResourceDiscoveryPort,
  type PromptBuildResult,
  type PromptReferenceAttachment,
  type PromptResource,
  type PromptResourceKind,
  type PromptResourceLoaderPort,
  type PromptSystemBuilderPort,
  type SystemPromptInput,
} from "./prompt-atoms"

export interface PromptBuildArtifactResource {
  kind: PromptResourceKind
  name: string
  source: PromptResource["source"]
  pathFingerprint?: string
  contentFingerprint: string
}

export interface PromptBuildArtifactReference {
  name: string
  mime?: string
  pathFingerprint?: string
  contentFingerprint: string
}

export interface PromptBuildArtifact {
  schemaVersion: 1
  stageID: "prompt.assemble"
  artifactKind: "trace"
  captureMode: "prompt-service"
  productProfile: string
  mode?: string
  promptFingerprint: string
  sections: string[]
  sectionSources: Record<string, string>
  resources: PromptBuildArtifactResource[]
  references: PromptBuildArtifactReference[]
  resourceCount: number
  referenceCount: number
  messageCount: number
  tokenEstimate: number
  sanitizedPreview: string
}

export type PromptBuildResultWithArtifact = PromptBuildResult & {
  artifact: PromptBuildArtifact
}

export {
  createConventionalPromptResourceDiscoveryAtom,
  createFilesystemResourceDiscoveryAtom,
  createPromptCompactionAdapterAtom,
  createPromptModelCapabilityAdapterAtom,
  createPromptResourceFromText,
  createPromptResourceLoaderAtom,
  createPromptSystemBuilderAtom,
  createPromptToolRendererAtom,
  defaultBasePrompt,
  buildNanobotSkillIndexSnapshot,
  hermesAgentPrompt,
  nanobotBuiltinBootstrapAsset,
  nanobotBuiltinBootstrapAssets,
  nanobotDreamPhase1Prompt,
  nanobotDreamPhase2Prompt,
  nanobotAgentPrompt,
  planNanobotWorkspaceTemplateSync,
  syncNanobotWorkspaceTemplates,
  writeNanobotSkillIndexCache,
  normalizeDiscoveredResources,
  openCodeAgentPrompt,
  piMonoAgentPrompt,
  projectPromptPath,
  renderReferenceAttachment,
  renderResource,
  type ConventionalPromptResourceDiscoveryPort,
  type NanobotBootstrapFileName,
  type NanobotBuiltinBootstrapAsset,
  type NanobotSkillAvailability,
  type NanobotSkillIndexEntry,
  type NanobotSkillIndexSnapshot,
  type NanobotSkillIndexSource,
  type NanobotWorkspacePromptVisibility,
  type NanobotWorkspaceTemplateAction,
  type NanobotWorkspaceTemplatePath,
  type NanobotWorkspaceTemplateRole,
  type NanobotWorkspaceTemplateSource,
  type NanobotWorkspaceTemplateSyncEntry,
  type NanobotWorkspaceTemplateSyncResult,
  type OpenCodeAgentPromptMode,
  type PromptBuildResult,
  type PromptCompactionAdapterPort,
  type PromptModelCapabilityAdapterPort,
  type PromptReferenceAttachment,
  type PromptResource,
  type PromptResourceKind,
  type PromptResourceLoaderPort,
  type PromptSystemBuilderPort,
  type PromptToolRendererPort,
  type ResourceDiscoveryPort,
  type SystemPromptInput,
} from "./prompt-atoms"

export class LegoPromptService {
  private readonly resources: PromptResource[] = []
  private readonly resourceLoader: PromptResourceLoaderPort
  private readonly conventionalDiscovery: ConventionalPromptResourceDiscoveryPort
  private readonly systemBuilder: PromptSystemBuilderPort

  constructor(input: {
    resourceLoader?: PromptResourceLoaderPort
    conventionalDiscovery?: ConventionalPromptResourceDiscoveryPort
    systemBuilder?: PromptSystemBuilderPort
  } = {}) {
    this.resourceLoader = input.resourceLoader ?? createPromptResourceLoaderAtom()
    this.conventionalDiscovery = input.conventionalDiscovery ?? createConventionalPromptResourceDiscoveryAtom()
    this.systemBuilder = input.systemBuilder ?? createPromptSystemBuilderAtom()
  }

  addResource(resource: PromptResource): void {
    this.resources.push(resource)
  }

  addResources(resources: PromptResource[]): void {
    for (const resource of resources) this.addResource(resource)
  }

  attachHooks(hooks: LegoHookHost): void {
    hooks.on("resources.discover", (event) => {
      const resources = normalizeDiscoveredResources(event.payload)
      this.addResources(resources)
      return { resources }
    })
  }

  discoverFromFiles(input: {
    cwd: string
    paths: string[]
    kind: PromptResourceKind
    source: PromptResource["source"]
  }): PromptResource[] {
    const resources = this.resourceLoader.load(input)
    this.addResources(resources)
    return resources
  }

  discoverConventionalResources(cwd: string, product: "opencode" | "pi-mono" | "nanobot" | string): PromptResource[] {
    const resources = this.conventionalDiscovery.discoverConventional(cwd, product)
    this.addResources(resources)
    return resources
  }

  async build(input: SystemPromptInput, hooks?: LegoHookHost): Promise<PromptBuildResultWithArtifact> {
    const result = await this.systemBuilder.build(
      {
        ...input,
        resources: [...this.resources, ...(input.resources ?? [])],
      },
      hooks,
    )
    return {
      ...result,
      artifact: buildPromptBuildArtifact(input, result),
    }
  }
}

function buildPromptBuildArtifact(input: SystemPromptInput, result: PromptBuildResult): PromptBuildArtifact {
  const resources = result.resources.map(summarizePromptResource)
  const references = result.references.map(summarizePromptReference)
  const sections = promptArtifactSections(input, result)
  const sectionSources = promptArtifactSectionSources(input, sections, resources, references)
  const promptFingerprint = hashStable({
    product: input.product,
    mode: input.mode ?? "build",
    systemPrompt: result.systemPrompt,
    resources,
    references,
  })
  return {
    schemaVersion: 1,
    stageID: "prompt.assemble",
    artifactKind: "trace",
    captureMode: "prompt-service",
    productProfile: input.product,
    ...(input.mode ? { mode: input.mode } : {}),
    promptFingerprint,
    sections,
    sectionSources,
    resources,
    references,
    resourceCount: resources.length,
    referenceCount: references.length,
    messageCount: result.messages.length,
    tokenEstimate: estimatePromptTokens(result.systemPrompt, result.messages.length),
    sanitizedPreview: `redacted prompt artifact ${promptFingerprint}`,
  }
}

function summarizePromptResource(resource: PromptResource): PromptBuildArtifactResource {
  return {
    kind: resource.kind,
    name: resource.name,
    source: resource.source,
    ...(resource.path ? { pathFingerprint: hashStable(resource.path) } : {}),
    contentFingerprint: hashStable(resource.content),
  }
}

function summarizePromptReference(reference: PromptReferenceAttachment): PromptBuildArtifactReference {
  return {
    name: reference.name,
    ...(reference.mime ? { mime: reference.mime } : {}),
    ...(reference.path ? { pathFingerprint: hashStable(reference.path) } : {}),
    contentFingerprint: hashStable(reference.content),
  }
}

function promptArtifactSections(input: SystemPromptInput, result: PromptBuildResult): string[] {
  return uniqueStrings([
    "base identity",
    input.cwd ? "environment" : "",
    input.model ? "model capability adjustments" : "",
    result.resources.length > 0 ? "resources" : "",
    result.references.length > 0 ? "references" : "",
    result.messages.length > 0 ? "context" : "",
  ].filter(Boolean))
}

function promptArtifactSectionSources(
  input: SystemPromptInput,
  sections: readonly string[],
  resources: readonly PromptBuildArtifactResource[],
  references: readonly PromptBuildArtifactReference[],
): Record<string, string> {
  const sources: Record<string, string> = {}
  for (const section of sections) {
    if (section === "base identity") sources[section] = `${input.product}.prompt.system-builder`
    else if (section === "environment") sources[section] = "runtime.cwd+model"
    else if (section === "model capability adjustments") sources[section] = "prompt.model-capability-adapter"
    else if (section === "resources") sources[section] = resources.map((resource) => `${resource.kind}:${resource.name}`).slice(0, 12).join(",")
    else if (section === "references") sources[section] = references.map((reference) => reference.name).slice(0, 12).join(",")
    else if (section === "context") sources[section] = "session.transcript"
  }
  return sources
}

function estimatePromptTokens(systemPrompt: string, messageCount: number): number {
  return Math.max(1, Math.ceil(systemPrompt.length / 4) + messageCount * 32)
}

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values))
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    const encoded = JSON.stringify(value)
    return encoded === undefined ? JSON.stringify(String(value)) : encoded
  }
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`
}
