import { createHash } from "node:crypto"
import type { EventEnvelope } from "@helix/contracts"
import type { HookSourceInfo, HookSourceRegistryRecord, LegoHookHost } from "@helix/lego-hooks"
import type { HarnessProduct } from "./harness"

export interface HarnessRuntimeTrace {
  product: HarnessProduct
  source: "runTurn" | "runFixtureTurn" | "builder-test-session"
  events: EventEnvelope[]
  registrySnapshot: HarnessRuntimeRegistrySnapshot
  hookSourceSnapshot: HarnessRuntimeHookSourceSnapshot
  summary: {
    events: number
    uniqueEventTypes: number
    fingerprint: string
    redaction: "summary-only"
  }
}

export interface HarnessRuntimeRegistrySnapshot {
  tools: Array<{ name: string; executionMode?: string }>
  commands: Array<{ name: string; source?: RuntimeTraceSourceSummary }>
  shortcuts: Array<{ key: string; source?: RuntimeTraceSourceSummary }>
  flags: Array<{ name: string; type: string; source?: RuntimeTraceSourceSummary }>
  providers: Array<{ name: string; source?: RuntimeTraceSourceSummary }>
  auth: Array<{ name: string; source?: RuntimeTraceSourceSummary }>
  uiProviders: Array<{ name: string; source?: RuntimeTraceSourceSummary }>
  messageRenderers: Array<{ customType: string; source?: RuntimeTraceSourceSummary }>
}

export interface HarnessRuntimeHookSourceSnapshot {
  observers: RuntimeTraceHookSourceRecord[]
  handlers: RuntimeTraceHookSourceRecord[]
  events: Array<{
    event: string
    observerCount: number
    handlerCount: number
    sourceOrder: RuntimeTraceHookSourceRecord[]
  }>
}

export interface RuntimeTraceHookSourceRecord {
  kind: "observer" | "handler"
  event?: string
  source: RuntimeTraceSourceSummary
}

export interface RuntimeTraceSourceSummary {
  id: string
  name?: string
  scope?: string
  order: number
  pathFingerprint?: string
}

export interface HarnessRuntimeTraceCollector {
  attach(hooks: LegoHookHost): () => void
  finish(hooks: LegoHookHost): HarnessRuntimeTrace
}

export function createHarnessRuntimeTraceCollector(input: {
  product: HarnessProduct
  source: HarnessRuntimeTrace["source"]
}): HarnessRuntimeTraceCollector {
  const events: EventEnvelope[] = []
  return {
    attach(hooks) {
      return hooks.observe((event) => {
        events.push(sanitizeEventEnvelope(event))
      }, {
        id: "harness.runtime-trace.collector",
        name: "Harness runtime trace collector",
        scope: "internal",
        order: Number.MAX_SAFE_INTEGER,
      })
    },
    finish(hooks) {
      const eventTypes = events.map((event) => String(event.type))
      const registrySnapshot = snapshotRuntimeRegistries(hooks)
      const hookSourceSnapshot = snapshotRuntimeHookSources(hooks, eventTypes)
      return {
        product: input.product,
        source: input.source,
        events,
        registrySnapshot,
        hookSourceSnapshot,
        summary: {
          events: events.length,
          uniqueEventTypes: new Set(eventTypes).size,
          fingerprint: hashStable({
            product: input.product,
            source: input.source,
            events: eventTypes,
            registries: registrySnapshot,
            hookSources: hookSourceSnapshot,
          }),
          redaction: "summary-only",
        },
      }
    },
  }
}

export function snapshotRuntimeHookSources(hooks: LegoHookHost, eventTypes: readonly string[] = []): HarnessRuntimeHookSourceSnapshot {
  const snapshot = hooks.snapshotHookSources(eventTypes)
  return {
    observers: snapshot.observers.map(summarizeHookSourceRecord),
    handlers: snapshot.handlers.map(summarizeHookSourceRecord),
    events: snapshot.events.map((event) => ({
      event: event.event,
      observerCount: event.observerCount,
      handlerCount: event.handlerCount,
      sourceOrder: event.sourceOrder.map(summarizeHookSourceRecord),
    })),
  }
}

export function snapshotRuntimeRegistries(hooks: LegoHookHost): HarnessRuntimeRegistrySnapshot {
  return {
    tools: Array.from(hooks.registries.tools.values())
      .map((tool) => ({
        name: tool.name,
        ...(tool.executionMode ? { executionMode: tool.executionMode } : {}),
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    commands: Array.from(hooks.registries.commands.values())
      .map((command) => ({
        name: command.name,
        ...(command.source ? { source: summarizeSource(command.source) } : {}),
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    shortcuts: Array.from(hooks.registries.shortcuts.values())
      .map((shortcut) => ({
        key: shortcut.key,
        ...(shortcut.source ? { source: summarizeSource(shortcut.source) } : {}),
      }))
      .sort((left, right) => left.key.localeCompare(right.key)),
    flags: Array.from(hooks.registries.flags.values())
      .map((flag) => ({
        name: flag.name,
        type: flag.type,
        ...(flag.source ? { source: summarizeSource(flag.source) } : {}),
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    providers: Array.from(hooks.registries.providers.values())
      .map((provider) => ({
        name: provider.name,
        ...(provider.source ? { source: summarizeSource(provider.source) } : {}),
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    auth: Array.from(hooks.registries.auth.values())
      .map((auth) => ({
        name: auth.name,
        ...(auth.source ? { source: summarizeSource(auth.source) } : {}),
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    uiProviders: Array.from(hooks.registries.uiProviders.values())
      .map((provider) => ({
        name: provider.name,
        ...(provider.source ? { source: summarizeSource(provider.source) } : {}),
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    messageRenderers: Array.from(hooks.registries.messageRenderers.values())
      .map((renderer) => ({
        customType: renderer.customType,
        ...(renderer.source ? { source: summarizeSource(renderer.source) } : {}),
      }))
      .sort((left, right) => left.customType.localeCompare(right.customType)),
  }
}

function summarizeHookSourceRecord(record: HookSourceRegistryRecord): RuntimeTraceHookSourceRecord {
  return {
    kind: record.kind,
    ...(record.event ? { event: record.event } : {}),
    source: summarizeSource(record.source),
  }
}

function sanitizeEventEnvelope(event: EventEnvelope): EventEnvelope {
  return {
    type: event.type,
    ...(event.sessionID ? { sessionID: event.sessionID } : {}),
    ...(event.traceID ? { traceID: event.traceID } : {}),
    timestamp: event.timestamp,
    ...(event.source ? { source: event.source } : {}),
    payload: sanitizePayload(String(event.type), event.payload),
    metadata: {
      ...(event.metadata ? sanitizeRecord(event.metadata) : {}),
      payloadFingerprint: hashStable(summarizeValue(event.payload)),
    },
  }
}

function sanitizePayload(eventType: string, payload: unknown): Record<string, unknown> {
  const record = asRecord(payload)
  if (!record) return { valueType: typeof payload, valueFingerprint: hashStable(summarizeValue(payload)) }
  const summary: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (key === "request") {
      summary.request = summarizeProviderRequest(value)
      continue
    }
    if (key === "message") {
      summary.message = summarizeMessage(value)
      continue
    }
    if (key === "messages") {
      summary.messages = summarizeMessages(value)
      continue
    }
    if (key === "input") {
      summary.input = summarizeInput(value)
      continue
    }
    if (key === "content" || key === "output") {
      summary[`${key}Summary`] = summarizeContent(value)
      continue
    }
    if (key === "details") {
      summary.details = sanitizeRecord(asRecord(value) ?? {})
      continue
    }
    if (key === "resources") {
      summary.resources = summarizePromptResources(value)
      continue
    }
    if (key === "sectionSources") {
      summary.sectionSources = summarizeStringRecord(value)
      continue
    }
    if (key === "cwd" || key === "path" || key === "workspace" || key === "env") {
      summary[`${key}Fingerprint`] = hashStable(summarizeValue(value))
      continue
    }
    if (isSafeScalarKey(key, value)) {
      summary[key] = value
      continue
    }
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      summary[key] = value.slice(0, 12)
      continue
    }
    if (key === "prompt" || key === "systemPrompt" || key === "text") {
      summary[`${key}Length`] = typeof value === "string" ? value.length : 0
      summary[`${key}Fingerprint`] = hashStable(summarizeValue(value))
      continue
    }
    summary[`${key}Fingerprint`] = hashStable(summarizeValue(value))
  }
  summary.eventType = eventType
  return summary
}

function sanitizeRecord(record: Record<string, unknown>): Record<string, unknown> {
  const summary: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (isSafeScalarKey(key, value)) {
      summary[key] = value
    } else if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      summary[key] = value.slice(0, 12)
    } else if (key === "error" && typeof value === "string") {
      summary.errorFingerprint = hashStable(value)
    } else {
      summary[`${key}Fingerprint`] = hashStable(summarizeValue(value))
    }
  }
  return summary
}

function summarizeProviderRequest(value: unknown): Record<string, unknown> {
  const record = asRecord(value)
  if (!record) return { fingerprint: hashStable(summarizeValue(value)) }
  const model = asRecord(record.model)
  return {
    fingerprint: hashStable(summarizeValue(value)),
    modelID: typeof model?.modelID === "string" ? model.modelID : undefined,
    providerID: typeof model?.providerID === "string" ? model.providerID : undefined,
    systemCount: Array.isArray(record.system) ? record.system.length : 0,
    messageCount: Array.isArray(record.messages) ? record.messages.length : 0,
    toolCount: Array.isArray(record.tools) ? record.tools.length : 0,
  }
}

function summarizeMessage(value: unknown): Record<string, unknown> {
  const record = asRecord(value)
  if (!record) return { fingerprint: hashStable(summarizeValue(value)) }
  return {
    fingerprint: hashStable(summarizeValue(value)),
    role: typeof record.role === "string" ? record.role : undefined,
    partTypes: Array.isArray(record.parts) ? record.parts.map((part) => asRecord(part)?.type).filter(Boolean).slice(0, 12) : [],
    partCount: Array.isArray(record.parts) ? record.parts.length : 0,
  }
}

function summarizeMessages(value: unknown): Record<string, unknown> {
  if (!Array.isArray(value)) return { fingerprint: hashStable(summarizeValue(value)) }
  return {
    fingerprint: hashStable(summarizeValue(value)),
    count: value.length,
    roles: value.map((item) => asRecord(item)?.role).filter(Boolean).slice(0, 12),
  }
}

function summarizeInput(value: unknown): Record<string, unknown> {
  const record = asRecord(value)
  return {
    fingerprint: hashStable(summarizeValue(value)),
    keys: record ? Object.keys(record).sort().slice(0, 24) : [],
  }
}

function summarizeContent(value: unknown): Record<string, unknown> {
  const items = Array.isArray(value) ? value : [value]
  return {
    fingerprint: hashStable(summarizeValue(value)),
    count: Array.isArray(value) ? value.length : value === undefined ? 0 : 1,
    partTypes: items.map((item) => asRecord(item)?.type).filter(Boolean).slice(0, 12),
  }
}

function summarizePromptResources(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return []
  return value.slice(0, 24).map((item) => {
    const record = asRecord(item)
    if (!record) return { fingerprint: hashStable(summarizeValue(item)) }
    const summary: Record<string, unknown> = {}
    for (const key of ["kind", "name", "source", "pathFingerprint", "contentFingerprint"]) {
      const field = record[key]
      if (typeof field === "string") summary[key] = field
    }
    return Object.keys(summary).length > 0 ? summary : { fingerprint: hashStable(summarizeValue(item)) }
  })
}

function summarizeStringRecord(value: unknown): Record<string, string> {
  const record = asRecord(value)
  if (!record) return {}
  return Object.fromEntries(Object.entries(record)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .slice(0, 24))
}

function summarizeSource(source: HookSourceInfo): RuntimeTraceSourceSummary {
  return {
    id: source.id,
    ...(source.name ? { name: source.name } : {}),
    ...(source.scope ? { scope: source.scope } : {}),
    order: source.order,
    ...(source.path ? { pathFingerprint: hashStable(source.path) } : {}),
  }
}

function isSafeScalarKey(key: string, value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") return false
  return [
    "action",
    "agent",
    "attempt",
    "atomID",
    "compact",
    "compacted",
    "artifactHash",
    "artifactKind",
    "captureMode",
    "decision",
    "eventCount",
    "finish",
    "isError",
    "maxRetries",
    "maxSteps",
    "mode",
    "modelID",
    "messageCount",
    "phase",
    "productProfile",
    "providerID",
    "promptAtomID",
    "promptFingerprint",
    "reason",
    "referenceCount",
    "resourceCount",
    "retries",
    "retrying",
    "role",
    "sessionID",
    "source",
    "status",
    "stageID",
    "step",
    "steps",
    "sanitizedPreview",
    "syntheticContinues",
    "tokenEstimate",
    "tokenLimit",
    "toolCall",
    "toolCallID",
    "toolName",
    "turnIndex",
  ].includes(key)
}

function summarizeValue(value: unknown): unknown {
  if (value === undefined || value === null) return value
  if (typeof value === "string") return { type: "string", length: value.length }
  if (typeof value === "number" || typeof value === "boolean") return value
  if (Array.isArray(value)) return value.map(summarizeValue)
  const record = asRecord(value)
  if (!record) return { type: typeof value }
  return Object.fromEntries(Object.entries(record).map(([key, item]) => {
    if (key === "cwd" || key === "path" || key === "workspace" || key === "env") return [key, { redacted: true }]
    if (key === "text" || key === "prompt" || key === "systemPrompt" || key === "content" || key === "output") {
      return [key, typeof item === "string" ? { type: "string", length: item.length } : summarizeValue(item)]
    }
    return [key, summarizeValue(item)]
  }))
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined
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
