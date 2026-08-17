import type { EventEnvelope, HookResult, LegoEventType } from "./events"
import type { LegoMessage, LegoMessagePart, SessionTranscript } from "./message"
import type { BindingSpec, ConformanceRef, LegoBlockManifest, PortContract, ResourceGrant } from "./module"
import type { ProviderRequest, ProviderStreamEvent } from "./provider"
import type { LegoToolDefinition } from "./tool"

export interface ValidationIssue {
  path: string
  message: string
}

export interface ValidationResult {
  ok: boolean
  issues: ValidationIssue[]
}

export interface LegoSchema<T> {
  name: string
  validate(value: unknown): ValidationResult
  is(value: unknown): value is T
  parse(value: unknown): T
}

type IssueSink = ValidationIssue[]
type Validator = (value: unknown, path: string, issues: IssueSink) => void

export function defineSchema<T>(name: string, validator: Validator): LegoSchema<T> {
  return {
    name,
    validate(value) {
      const issues: ValidationIssue[] = []
      validator(value, "$", issues)
      return { ok: issues.length === 0, issues }
    },
    is(value): value is T {
      return this.validate(value).ok
    },
    parse(value): T {
      const result = this.validate(value)
      if (!result.ok) {
        const detail = result.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ")
        throw new Error(`${name} validation failed${detail ? `: ${detail}` : ""}`)
      }
      return value as T
    },
  }
}

export function assertSchema<T>(schema: LegoSchema<T>, value: unknown): asserts value is T {
  schema.parse(value)
}

export function roundTripWithSchema<T>(schema: LegoSchema<T>, value: T): T {
  return schema.parse(JSON.parse(JSON.stringify(value)) as unknown)
}

export const messagePartSchema = defineSchema<LegoMessagePart>("LegoMessagePart", validateMessagePart)
export const messageSchema = defineSchema<LegoMessage>("LegoMessage", validateMessage)
export const sessionTranscriptSchema = defineSchema<SessionTranscript>("SessionTranscript", validateSessionTranscript)
export const toolDefinitionSchema = defineSchema<LegoToolDefinition>("LegoToolDefinition", validateToolDefinition)
export const providerRequestSchema = defineSchema<ProviderRequest>("ProviderRequest", validateProviderRequest)
export const providerStreamEventSchema = defineSchema<ProviderStreamEvent>("ProviderStreamEvent", validateProviderStreamEvent)
export const eventEnvelopeSchema = defineSchema<EventEnvelope>("EventEnvelope", validateEventEnvelope)
export const hookResultSchema = defineSchema<HookResult>("HookResult", validateHookResult)
export const resourceGrantSchema = defineSchema<ResourceGrant>("ResourceGrant", validateResourceGrant)
export const conformanceRefSchema = defineSchema<ConformanceRef>("ConformanceRef", validateConformanceRef)
export const blockManifestSchema = defineSchema<LegoBlockManifest>("LegoBlockManifest", validateLegoBlockManifest)
export const portContractSchema = defineSchema<PortContract>("PortContract", validatePortContract)
export const bindingSpecSchema = defineSchema<BindingSpec>("BindingSpec", validateBindingSpec)

function validateSessionTranscript(value: unknown, path: string, issues: IssueSink): void {
  const transcript = requireRecord(value, path, issues)
  if (!transcript) return
  requireString(transcript["sessionID"], `${path}.sessionID`, issues)
  validateArray(transcript["messages"], `${path}.messages`, issues, validateMessage)
  optionalRecord(transcript["metadata"], `${path}.metadata`, issues)
}

function validateMessage(value: unknown, path: string, issues: IssueSink): void {
  const message = requireRecord(value, path, issues)
  if (!message) return
  requireString(message["id"], `${path}.id`, issues)
  requireString(message["sessionID"], `${path}.sessionID`, issues)
  const role = requireString(message["role"], `${path}.role`, issues)
  if (role && !oneOf(role, ["user", "assistant", "tool", "synthetic", "shell"])) {
    issues.push({ path: `${path}.role`, message: `expected one of user, assistant, tool, synthetic, shell` })
  }
  validateTime(message["time"], `${path}.time`, issues)
  optionalRecord(message["metadata"], `${path}.metadata`, issues)

  if (role === "tool") validateArray(message["parts"], `${path}.parts`, issues, validateToolResultPart)
  else validateArray(message["parts"], `${path}.parts`, issues, validateMessagePart)

  if (role === "shell") {
    requireString(message["command"], `${path}.command`, issues)
    requireString(message["output"], `${path}.output`, issues)
    optionalNumber(message["exitCode"], `${path}.exitCode`, issues)
  }
  if (role === "synthetic") optionalString(message["reason"], `${path}.reason`, issues)
  optionalString(message["agent"], `${path}.agent`, issues)
  if (message["model"] !== undefined) validateModelRef(message["model"], `${path}.model`, issues)
  optionalString(message["finish"], `${path}.finish`, issues)
  if (message["usage"] !== undefined) validateTokenUsage(message["usage"], `${path}.usage`, issues)
  optionalNumber(message["cost"], `${path}.cost`, issues)
  if (message["error"] !== undefined) validateSerializedError(message["error"], `${path}.error`, issues)
}

function validateMessagePart(value: unknown, path: string, issues: IssueSink): void {
  const part = requireRecord(value, path, issues)
  if (!part) return
  requireString(part["id"], `${path}.id`, issues)
  const type = requireString(part["type"], `${path}.type`, issues)
  if (!type) return
  if (!oneOf(type, ["text", "reasoning", "tool_call", "tool_result", "compaction", "custom"])) {
    issues.push({ path: `${path}.type`, message: `unknown message part type: ${type}` })
    return
  }
  if (type === "text" || type === "reasoning") {
    requireString(part["text"], `${path}.text`, issues)
    return
  }
  if (type === "tool_call") {
    requireString(part["toolCallID"], `${path}.toolCallID`, issues)
    requireString(part["toolName"], `${path}.toolName`, issues)
    requireRecord(part["input"], `${path}.input`, issues)
    const status = requireString(part["status"], `${path}.status`, issues)
    if (status && !oneOf(status, ["pending", "running", "completed", "error"])) {
      issues.push({ path: `${path}.status`, message: `expected one of pending, running, completed, error` })
    }
    optionalRecord(part["metadata"], `${path}.metadata`, issues)
    return
  }
  if (type === "tool_result") {
    validateToolResultPart(value, path, issues)
    return
  }
  if (type === "compaction") {
    const reason = requireString(part["reason"], `${path}.reason`, issues)
    if (reason && !oneOf(reason, ["manual", "overflow", "branch", "hook"])) {
      issues.push({ path: `${path}.reason`, message: `expected one of manual, overflow, branch, hook` })
    }
    requireString(part["summary"], `${path}.summary`, issues)
    optionalString(part["firstKeptMessageID"], `${path}.firstKeptMessageID`, issues)
    optionalRecord(part["metadata"], `${path}.metadata`, issues)
    return
  }
  requireString(part["customType"], `${path}.customType`, issues)
  optionalString(part["display"], `${path}.display`, issues)
}

function validateToolResultPart(value: unknown, path: string, issues: IssueSink): void {
  const part = requireRecord(value, path, issues)
  if (!part) return
  requireString(part["id"], `${path}.id`, issues)
  const type = requireString(part["type"], `${path}.type`, issues)
  if (type !== "tool_result") issues.push({ path: `${path}.type`, message: `expected tool_result` })
  requireString(part["toolCallID"], `${path}.toolCallID`, issues)
  requireString(part["toolName"], `${path}.toolName`, issues)
  validateArray(part["content"], `${path}.content`, issues, validateMessagePart)
  optionalBoolean(part["isError"], `${path}.isError`, issues)
}

function validateToolDefinition(value: unknown, path: string, issues: IssueSink): void {
  const tool = requireRecord(value, path, issues)
  if (!tool) return
  requireString(tool["name"], `${path}.name`, issues)
  optionalString(tool["label"], `${path}.label`, issues)
  requireString(tool["description"], `${path}.description`, issues)
  const executionMode = optionalString(tool["executionMode"], `${path}.executionMode`, issues)
  if (executionMode && !oneOf(executionMode, ["parallel", "sequential"])) {
    issues.push({ path: `${path}.executionMode`, message: `expected parallel or sequential` })
  }
  if (tool["permission"] !== undefined) validatePermission(tool["permission"], `${path}.permission`, issues)
  if (tool["renderCall"] !== undefined && typeof tool["renderCall"] !== "function") {
    issues.push({ path: `${path}.renderCall`, message: `expected function` })
  }
  if (tool["renderResult"] !== undefined && typeof tool["renderResult"] !== "function") {
    issues.push({ path: `${path}.renderResult`, message: `expected function` })
  }
  if (typeof tool["execute"] !== "function") issues.push({ path: `${path}.execute`, message: `expected function` })
}

function validateProviderRequest(value: unknown, path: string, issues: IssueSink): void {
  const request = requireRecord(value, path, issues)
  if (!request) return
  validateModel(request["model"], `${path}.model`, issues)
  validateStringArray(request["system"], `${path}.system`, issues)
  validateArray(request["messages"], `${path}.messages`, issues, validateMessage)
  validateArray(request["tools"], `${path}.tools`, issues, validateToolDefinition)
  optionalRecord(request["options"], `${path}.options`, issues)
}

function validateProviderStreamEvent(value: unknown, path: string, issues: IssueSink): void {
  const event = requireRecord(value, path, issues)
  if (!event) return
  const type = requireString(event["type"], `${path}.type`, issues)
  if (!type) return
  if (!oneOf(type, ["text", "reasoning", "tool_call", "finish", "part"])) {
    issues.push({ path: `${path}.type`, message: `unknown provider stream event type: ${type}` })
    return
  }
  if (type === "text" || type === "reasoning") {
    requireString(event["text"], `${path}.text`, issues)
    return
  }
  if (type === "tool_call") {
    requireString(event["toolName"], `${path}.toolName`, issues)
    requireRecord(event["input"], `${path}.input`, issues)
    optionalString(event["id"], `${path}.id`, issues)
    return
  }
  if (type === "finish") {
    requireString(event["finish"], `${path}.finish`, issues)
    if (event["usage"] !== undefined) validateTokenUsage(event["usage"], `${path}.usage`, issues)
    optionalNumber(event["cost"], `${path}.cost`, issues)
    return
  }
  validateMessagePart(event["part"], `${path}.part`, issues)
}

function validateEventEnvelope(value: unknown, path: string, issues: IssueSink): void {
  const event = requireRecord(value, path, issues)
  if (!event) return
  const type = requireString(event["type"], `${path}.type`, issues)
  if (type && !oneOf(type, legoEventTypes)) issues.push({ path: `${path}.type`, message: `unknown lego event type: ${type}` })
  optionalString(event["sessionID"], `${path}.sessionID`, issues)
  optionalString(event["traceID"], `${path}.traceID`, issues)
  requireNumber(event["timestamp"], `${path}.timestamp`, issues)
  optionalString(event["source"], `${path}.source`, issues)
  if (!("payload" in event)) issues.push({ path: `${path}.payload`, message: `expected payload` })
  optionalRecord(event["metadata"], `${path}.metadata`, issues)
}

function validateHookResult(value: unknown, path: string, issues: IssueSink): void {
  if (value === undefined) return
  const result = requireRecord(value, path, issues)
  if (!result) return
  if (result["action"] !== undefined) {
    const action = requireString(result["action"], `${path}.action`, issues)
    if (action && !oneOf(action, ["continue", "transform", "handled"])) {
      issues.push({ path: `${path}.action`, message: `expected continue, transform, or handled` })
    }
  }
  if (result["status"] !== undefined) {
    const status = requireString(result["status"], `${path}.status`, issues)
    if (status && !oneOf(status, ["ask", "deny", "allow"])) {
      issues.push({ path: `${path}.status`, message: `expected ask, deny, or allow` })
    }
  }
  optionalBoolean(result["block"], `${path}.block`, issues)
  optionalBoolean(result["cancel"], `${path}.cancel`, issues)
  optionalString(result["reason"], `${path}.reason`, issues)
  if (result["content"] !== undefined) validateArray(result["content"], `${path}.content`, issues, validateMessagePart)
  if (result["messages"] !== undefined) validateArray(result["messages"], `${path}.messages`, issues, validateMessage)
  if (result["env"] !== undefined) validateRecordOfStrings(result["env"], `${path}.env`, issues)
}

function validateLegoBlockManifest(value: unknown, path: string, issues: IssueSink): void {
  const manifest = requireRecord(value, path, issues)
  if (!manifest) return
  requireString(manifest["id"], `${path}.id`, issues)
  requireString(manifest["version"], `${path}.version`, issues)
  validateBlockType(manifest["type"], `${path}.type`, issues)
  validateBlockImplementationKind(manifest["implementationKind"], `${path}.implementationKind`, issues)
  validateBlockLayer(manifest["layer"], `${path}.layer`, issues)
  requireString(manifest["personality"], `${path}.personality`, issues)
  validateArray(manifest["provides"], `${path}.provides`, issues, validateCapabilityRef)
  validateArray(manifest["requires"], `${path}.requires`, issues, validateCapabilityRef)
  if (manifest["optional"] !== undefined) validateArray(manifest["optional"], `${path}.optional`, issues, validateCapabilityRef)
  if (manifest["resources"] !== undefined) validateArray(manifest["resources"], `${path}.resources`, issues, validateResourceGrant)
  if (manifest["lifecycleScopes"] !== undefined) validateArray(manifest["lifecycleScopes"], `${path}.lifecycleScopes`, issues, validateLifecycleScope)
  if (manifest["conformance"] !== undefined) validateArray(manifest["conformance"], `${path}.conformance`, issues, validateConformanceRef)
}

function validatePortContract(value: unknown, path: string, issues: IssueSink): void {
  const contract = requireRecord(value, path, issues)
  if (!contract) return
  requireString(contract["id"], `${path}.id`, issues)
  if (!("input" in contract)) issues.push({ path: `${path}.input`, message: `expected input` })
  if (!("output" in contract)) issues.push({ path: `${path}.output`, message: `expected output` })
  validateMultiplicity(contract["cardinality"], `${path}.cardinality`, issues)
  validateArray(contract["lifecycle"], `${path}.lifecycle`, issues, validateLifecycleScope)
  validateArray(contract["resources"], `${path}.resources`, issues, validateResourceGrant)
  validateStringArray(contract["errors"], `${path}.errors`, issues)
  validateStringArray(contract["traces"], `${path}.traces`, issues)
  validateArray(contract["conformance"], `${path}.conformance`, issues, validateConformanceRef)
}

function validateBindingSpec(value: unknown, path: string, issues: IssueSink): void {
  const binding = requireRecord(value, path, issues)
  if (!binding) return
  requireString(binding["port"], `${path}.port`, issues)
  requireString(binding["atom"], `${path}.atom`, issues)
  optionalString(binding["personality"], `${path}.personality`, issues)
  if (binding["scope"] !== undefined) validateLifecycleScope(binding["scope"], `${path}.scope`, issues)
  if (binding["resources"] !== undefined) validateArray(binding["resources"], `${path}.resources`, issues, validateResourceGrant)
  if (binding["capability"] !== undefined) validateCapabilityRef(binding["capability"], `${path}.capability`, issues)
  if (binding["multiplicity"] !== undefined) validateMultiplicity(binding["multiplicity"], `${path}.multiplicity`, issues)
}

function validateCapabilityRef(value: unknown, path: string, issues: IssueSink): void {
  const capability = requireRecord(value, path, issues)
  if (!capability) return
  requireString(capability["id"], `${path}.id`, issues)
  optionalString(capability["version"], `${path}.version`, issues)
  const kind = optionalString(capability["kind"], `${path}.kind`, issues)
  if (kind && !oneOf(kind, capabilityKinds)) issues.push({ path: `${path}.kind`, message: `expected one of ${capabilityKinds.join(", ")}` })
  optionalString(capability["variant"], `${path}.variant`, issues)
  if (capability["multiplicity"] !== undefined) validateMultiplicity(capability["multiplicity"], `${path}.multiplicity`, issues)
  const stability = optionalString(capability["stability"], `${path}.stability`, issues)
  if (stability && !oneOf(stability, ["experimental", "stable"])) {
    issues.push({ path: `${path}.stability`, message: `expected experimental or stable` })
  }
  optionalString(capability["personality"], `${path}.personality`, issues)
}

function validateResourceGrant(value: unknown, path: string, issues: IssueSink): void {
  const grant = requireRecord(value, path, issues)
  if (!grant) return
  requireString(grant["id"], `${path}.id`, issues)
  const mode = optionalString(grant["mode"], `${path}.mode`, issues)
  if (mode && !oneOf(mode, ["read", "write", "execute"])) issues.push({ path: `${path}.mode`, message: `expected read, write, or execute` })
  const scope = optionalString(grant["scope"], `${path}.scope`, issues)
  if (scope && !oneOf(scope, resourceScopes)) issues.push({ path: `${path}.scope`, message: `expected one of ${resourceScopes.join(", ")}` })
  optionalBoolean(grant["optional"], `${path}.optional`, issues)
  optionalString(grant["reason"], `${path}.reason`, issues)
}

function validateConformanceRef(value: unknown, path: string, issues: IssueSink): void {
  const ref = requireRecord(value, path, issues)
  if (!ref) return
  requireString(ref["id"], `${path}.id`, issues)
  optionalString(ref["suite"], `${path}.suite`, issues)
  optionalString(ref["fixture"], `${path}.fixture`, issues)
  optionalString(ref["command"], `${path}.command`, issues)
  optionalBoolean(ref["required"], `${path}.required`, issues)
}

function validateBlockType(value: unknown, path: string, issues: IssueSink): void {
  const type = requireString(value, path, issues)
  if (type && !oneOf(type, blockTypes)) issues.push({ path, message: `expected one of ${blockTypes.join(", ")}` })
}

function validateBlockImplementationKind(value: unknown, path: string, issues: IssueSink): void {
  const kind = requireString(value, path, issues)
  if (kind && !oneOf(kind, blockImplementationKinds)) issues.push({ path, message: `expected one of ${blockImplementationKinds.join(", ")}` })
}

function validateBlockLayer(value: unknown, path: string, issues: IssueSink): void {
  const layer = requireString(value, path, issues)
  if (layer && !oneOf(layer, blockLayers)) issues.push({ path, message: `expected one of ${blockLayers.join(", ")}` })
}

function validateLifecycleScope(value: unknown, path: string, issues: IssueSink): void {
  const scope = requireString(value, path, issues)
  if (scope && !oneOf(scope, lifecycleScopes)) issues.push({ path, message: `expected one of ${lifecycleScopes.join(", ")}` })
}

function validateMultiplicity(value: unknown, path: string, issues: IssueSink): void {
  const multiplicity = requireString(value, path, issues)
  if (multiplicity && !oneOf(multiplicity, ["single", "multi"])) issues.push({ path, message: `expected single or multi` })
}

function validateTime(value: unknown, path: string, issues: IssueSink): void {
  const time = requireRecord(value, path, issues)
  if (!time) return
  requireNumber(time["created"], `${path}.created`, issues)
  optionalNumber(time["updated"], `${path}.updated`, issues)
  optionalNumber(time["completed"], `${path}.completed`, issues)
}

function validateModel(value: unknown, path: string, issues: IssueSink): void {
  const model = requireRecord(value, path, issues)
  if (!model) return
  requireString(model["providerID"], `${path}.providerID`, issues)
  requireString(model["modelID"], `${path}.modelID`, issues)
  optionalString(model["name"], `${path}.name`, issues)
  optionalNumber(model["contextWindow"], `${path}.contextWindow`, issues)
  optionalNumber(model["maxOutputTokens"], `${path}.maxOutputTokens`, issues)
  optionalRecord(model["metadata"], `${path}.metadata`, issues)
  if (model["input"] !== undefined) validateStringArray(model["input"], `${path}.input`, issues)
  if (model["cost"] !== undefined) validateModelCost(model["cost"], `${path}.cost`, issues)
}

function validateModelRef(value: unknown, path: string, issues: IssueSink): void {
  const model = requireRecord(value, path, issues)
  if (!model) return
  requireString(model["providerID"], `${path}.providerID`, issues)
  requireString(model["modelID"], `${path}.modelID`, issues)
}

function validateModelCost(value: unknown, path: string, issues: IssueSink): void {
  const cost = requireRecord(value, path, issues)
  if (!cost) return
  requireNumber(cost["input"], `${path}.input`, issues)
  requireNumber(cost["output"], `${path}.output`, issues)
  optionalNumber(cost["cacheRead"], `${path}.cacheRead`, issues)
  optionalNumber(cost["cacheWrite"], `${path}.cacheWrite`, issues)
}

function validateTokenUsage(value: unknown, path: string, issues: IssueSink): void {
  const usage = requireRecord(value, path, issues)
  if (!usage) return
  requireNumber(usage["input"], `${path}.input`, issues)
  requireNumber(usage["output"], `${path}.output`, issues)
  optionalNumber(usage["reasoning"], `${path}.reasoning`, issues)
  optionalNumber(usage["cacheRead"], `${path}.cacheRead`, issues)
  optionalNumber(usage["cacheWrite"], `${path}.cacheWrite`, issues)
}

function validateSerializedError(value: unknown, path: string, issues: IssueSink): void {
  const error = requireRecord(value, path, issues)
  if (!error) return
  requireString(error["name"], `${path}.name`, issues)
  requireString(error["message"], `${path}.message`, issues)
  optionalString(error["stack"], `${path}.stack`, issues)
}

function validatePermission(value: unknown, path: string, issues: IssueSink): void {
  if (typeof value === "function") return
  if (typeof value === "string") {
    if (!oneOf(value, ["ask", "deny", "allow"])) issues.push({ path, message: `expected ask, deny, or allow` })
    return
  }
  const request = requireRecord(value, path, issues)
  if (!request) return
  const status = optionalString(request["status"], `${path}.status`, issues)
  if (status && !oneOf(status, ["ask", "deny", "allow"])) issues.push({ path: `${path}.status`, message: `expected ask, deny, or allow` })
  optionalString(request["action"], `${path}.action`, issues)
  optionalString(request["subject"], `${path}.subject`, issues)
  optionalString(request["reason"], `${path}.reason`, issues)
  optionalRecord(request["metadata"], `${path}.metadata`, issues)
}

function validateArray(value: unknown, path: string, issues: IssueSink, validateItem: Validator): void {
  if (!Array.isArray(value)) {
    issues.push({ path, message: `expected array` })
    return
  }
  value.forEach((item, index) => validateItem(item, `${path}[${index}]`, issues))
}

function validateStringArray(value: unknown, path: string, issues: IssueSink): void {
  validateArray(value, path, issues, requireString)
}

function validateRecordOfStrings(value: unknown, path: string, issues: IssueSink): void {
  const recordValue = requireRecord(value, path, issues)
  if (!recordValue) return
  for (const [key, candidate] of Object.entries(recordValue)) requireString(candidate, `${path}.${key}`, issues)
}

function requireRecord(value: unknown, path: string, issues: IssueSink): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    issues.push({ path, message: `expected object` })
    return undefined
  }
  return value
}

function optionalRecord(value: unknown, path: string, issues: IssueSink): Record<string, unknown> | undefined {
  if (value === undefined) return undefined
  return requireRecord(value, path, issues)
}

function requireString(value: unknown, path: string, issues: IssueSink): string | undefined {
  if (typeof value !== "string") {
    issues.push({ path, message: `expected string` })
    return undefined
  }
  return value
}

function optionalString(value: unknown, path: string, issues: IssueSink): string | undefined {
  if (value === undefined) return undefined
  return requireString(value, path, issues)
}

function requireNumber(value: unknown, path: string, issues: IssueSink): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    issues.push({ path, message: `expected finite number` })
    return undefined
  }
  return value
}

function optionalNumber(value: unknown, path: string, issues: IssueSink): number | undefined {
  if (value === undefined) return undefined
  return requireNumber(value, path, issues)
}

function optionalBoolean(value: unknown, path: string, issues: IssueSink): boolean | undefined {
  if (value === undefined) return undefined
  if (typeof value !== "boolean") {
    issues.push({ path, message: `expected boolean` })
    return undefined
  }
  return value
}

function oneOf<T extends string>(value: string, options: readonly T[]): value is T {
  return (options as readonly string[]).includes(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

const legoEventTypes = [
  "session.created",
  "session.updated",
  "session.deleted",
  "session.resumed",
  "session.forked",
  "session.start",
  "session.before_switch",
  "session.before_fork",
  "session.before_compact",
  "session.compact",
  "session.shutdown",
  "session.before_tree",
  "session.tree",
  "session.compacting",
  "session.compacted",
  "session.idle",
  "input",
  "context",
  "before_agent_start",
  "agent.start",
  "agent.end",
  "turn.start",
  "turn.end",
  "message.start",
  "message.update",
  "message.end",
  "tool.call",
  "tool.result",
  "tool.definition",
  "tool.execution_start",
  "tool.execution_update",
  "tool.execution_end",
  "command.before",
  "provider.request.before",
  "provider.response.after",
  "permission.ask",
  "model.select",
  "thinking_level.select",
  "shell.env",
  "user_bash",
  "resources.discover",
  "turn.pipeline.trace",
  "runtime.accepted-early",
] as const satisfies readonly LegoEventType[]

const blockTypes = ["port", "atom", "strategy", "pack", "product-shell"] as const

const blockImplementationKinds = ["factory", "bridge", "metadata-only", "preview"] as const

const blockLayers = [
  "foundation",
  "identity",
  "event",
  "session",
  "hook",
  "turn",
  "tool",
  "provider",
  "prompt",
  "config",
  "ui",
  "product",
  "runtime",
  "conformance",
] as const

const capabilityKinds = ["port", "implementation", "strategy", "registry", "surface"] as const

const resourceScopes = ["workspace", "user", "process", "external", "session", "turn", "tool-call"] as const

const lifecycleScopes = ["process", "workspace", "session", "turn", "tool-call"] as const
