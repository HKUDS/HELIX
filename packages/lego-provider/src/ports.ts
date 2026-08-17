import { createHash } from "node:crypto"
import type { LegoModel, ProviderRequest, ProviderStreamEvent, TokenUsage } from "@helix/contracts"
import { normalizeProviderStream, type ProviderStreamNormalizationOptions } from "./normalizer"

export type ProviderAuth =
  | { type: "none" }
  | { type: "api-key"; apiKey: string; header?: string; prefix?: string }
  | { type: "oauth"; token: string; header?: string; prefix?: string }

export type ProviderFetch = (url: string, init: ProviderFetchInit) => Promise<ProviderFetchResponse>

export interface ProviderFetchInit {
  method: string
  headers: Record<string, string>
  body: string
  signal?: AbortSignal
}

export interface ProviderFetchResponse {
  ok: boolean
  status: number
  statusText?: string
  body?: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>
  text(): Promise<string>
}

export interface ProviderTransportPort {
  fetch(url: string, init: ProviderFetchInit): Promise<ProviderFetchResponse>
}

export interface ProviderAuthPort {
  headers(auth: ProviderAuth): Record<string, string>
}

export interface ProviderModelRegistryPort {
  models(): LegoModel[]
}

export interface ProviderRequestShapePort {
  shape(request: ProviderRequest): { body: Record<string, unknown>; endpoint?: string; headers?: Record<string, string> }
}

export interface ProviderStreamParserPort {
  parse(body: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>): AsyncIterable<ProviderStreamEvent>
}

export interface ProviderEventNormalizerPort {
  normalize(events: AsyncIterable<ProviderStreamEvent>, context?: { model?: LegoModel }): AsyncIterable<ProviderStreamEvent>
}

export interface ProviderUsageNormalizerPort {
  normalize(input: { usage?: TokenUsage; cost?: number; model?: LegoModel; finish?: string }): { usage?: TokenUsage; cost?: number; finish?: string }
}

export interface ProviderCassetteRecord {
  url: string
  method: string
  status: number
  statusText?: string
  requestBody?: string
  requestHeaders: Record<string, string>
  chunks: string[]
}

export interface ProviderCassettePort {
  records(): ProviderCassetteRecord[]
  record(entry: ProviderCassetteRecord): void
  replay(match: { url: string; method?: string }): ProviderCassetteRecord | undefined
}

export function createFetchProviderTransport(fetchImpl: ProviderFetch = defaultProviderFetch): ProviderTransportPort {
  return {
    fetch: fetchImpl,
  }
}

export function createMockSSEProviderTransport(responses: Record<string, string[]> | string[]): ProviderTransportPort {
  return {
    async fetch(url, init) {
      const chunks = Array.isArray(responses) ? responses : (responses[url] ?? responses["*"] ?? [])
      return {
        ok: true,
        status: 200,
        body: byteStreamFromText(chunks),
        async text() {
          return chunks.join("")
        },
      }
    },
  }
}

export function createRecordingProviderTransport(inner: ProviderTransportPort, cassette: ProviderCassettePort): ProviderTransportPort {
  return {
    async fetch(url, init) {
      const response = await inner.fetch(url, init)
      if (!response.body) return response
      const ok = response.ok
      const status = response.status
      const statusText = response.statusText
      const chunks = await collectTextChunks(response.body)
      cassette.record({
        url,
        method: init.method,
        status,
        ...(statusText ? { statusText } : {}),
        requestBody: init.body,
        requestHeaders: redactProviderHeaders(init.headers),
        chunks,
      })
      return {
        ok,
        status,
        ...(statusText ? { statusText } : {}),
        body: byteStreamFromText(chunks),
        async text() {
          return chunks.join("")
        },
      }
    },
  }
}

export function createRecordedCassetteProviderTransport(cassette: ProviderCassettePort): ProviderTransportPort {
  return {
    async fetch(url, init) {
      const record = cassette.replay({ url, method: init.method })
      if (!record) {
        return {
          ok: false,
          status: 404,
          statusText: "cassette miss",
          async text() {
            return `No provider cassette record for ${init.method} ${url}`
          },
        }
      }
      return {
        ok: record.status >= 200 && record.status < 300,
        status: record.status,
        ...(record.statusText ? { statusText: record.statusText } : {}),
        body: byteStreamFromText(record.chunks),
        async text() {
          return record.chunks.join("")
        },
      }
    },
  }
}

export function createMemoryProviderCassette(initialRecords: ProviderCassetteRecord[] = []): ProviderCassettePort {
  const entries = [...initialRecords]
  return {
    records() {
      return entries.map((entry) => ({ ...entry, requestHeaders: { ...entry.requestHeaders }, chunks: [...entry.chunks] }))
    },
    record(entry) {
      entries.push({ ...entry, requestHeaders: { ...entry.requestHeaders }, chunks: [...entry.chunks] })
    },
    replay(match) {
      return entries.find((entry) => entry.url === match.url && (!match.method || entry.method === match.method))
    },
  }
}

export function createProviderAuthPort(): ProviderAuthPort {
  return {
    headers: providerAuthHeaders,
  }
}

export function providerAuthHeaders(auth: ProviderAuth): Record<string, string> {
  if (auth.type === "none") return {}
  const header = auth.header ?? "authorization"
  const prefix = auth.prefix ?? "Bearer"
  const token = auth.type === "api-key" ? auth.apiKey : auth.token
  return { [header]: prefix ? `${prefix} ${token}` : token }
}

export function createStaticProviderModelRegistry(providerID: string, models: Array<string | (Partial<LegoModel> & { modelID: string })>): ProviderModelRegistryPort {
  const modelList = models.map((model) => normalizeProviderModel(providerID, model))
  return {
    models() {
      return modelList
    },
  }
}

export function createProviderUsageNormalizer(): ProviderUsageNormalizerPort {
  return {
    normalize(input) {
      const cost = input.cost ?? estimateProviderCost(input.usage, input.model)
      return {
        ...(input.usage ? { usage: input.usage } : {}),
        ...(cost === undefined ? {} : { cost }),
        ...(input.finish ? { finish: input.finish } : {}),
      }
    },
  }
}

export function createProviderEventNormalizer(
  options: ProviderStreamNormalizationOptions = {},
  usageNormalizer: ProviderUsageNormalizerPort = createProviderUsageNormalizer(),
): ProviderEventNormalizerPort {
  return {
    async *normalize(events, context) {
      for await (const event of normalizeProviderStream(events, options)) {
        if (event.type !== "finish") {
          yield event
          continue
        }
        const normalized = usageNormalizer.normalize({
          ...(event.usage ? { usage: event.usage } : {}),
          ...(event.cost === undefined ? {} : { cost: event.cost }),
          ...(context?.model ? { model: context.model } : {}),
          finish: event.finish,
        })
        yield {
          type: "finish",
          finish: normalized.finish ?? event.finish,
          ...(normalized.usage ? { usage: normalized.usage } : {}),
          ...(normalized.cost === undefined ? {} : { cost: normalized.cost }),
        }
      }
    },
  }
}

export function estimateProviderCost(usage: TokenUsage | undefined, model: LegoModel | undefined): number | undefined {
  if (!usage || !model?.cost) return undefined
  const inputCost = usage.input * model.cost.input
  const outputCost = usage.output * model.cost.output
  const cacheReadCost = (usage.cacheRead ?? 0) * (model.cost.cacheRead ?? 0)
  const cacheWriteCost = (usage.cacheWrite ?? 0) * (model.cost.cacheWrite ?? 0)
  return (inputCost + outputCost + cacheReadCost + cacheWriteCost) / 1_000_000
}

export function normalizeProviderModel(providerID: string, model: string | (Partial<LegoModel> & { modelID: string })): LegoModel {
  if (typeof model === "string") return { providerID, modelID: model }
  return { providerID, ...model }
}

export async function defaultProviderFetch(url: string, init: ProviderFetchInit): Promise<ProviderFetchResponse> {
  if (typeof fetch !== "function") throw new Error("global fetch is not available")
  return (await fetch(url, init)) as unknown as ProviderFetchResponse
}

export async function* readProviderTextChunks(body: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>): AsyncIterable<string> {
  const decoder = new TextDecoder()
  if ("getReader" in body && typeof body.getReader === "function") {
    const reader = body.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        yield decoder.decode(value, { stream: true })
      }
    } finally {
      reader.releaseLock()
    }
    const tail = decoder.decode()
    if (tail) yield tail
    return
  }

  for await (const chunk of body) yield decoder.decode(chunk, { stream: true })
  const tail = decoder.decode()
  if (tail) yield tail
}

export function redactProviderHeaders(headers: Record<string, string>): Record<string, string> {
  return { ...headers }
}

export type ProviderCommonPublicSurfaceID =
  | "provider.transport"
  | "provider.auth"
  | "provider.model-registry"
  | "provider.request-shape"
  | "provider.stream-parser"
  | "provider.event-normalizer"
  | "provider.usage-normalizer"
  | "provider.cassette"

export interface ProviderCommonPublicSurfaceRef {
  surfaceID: ProviderCommonPublicSurfaceID
  exportedSymbols: string[]
  exposure: "common-provider-demotion-guard"
  fixtureDiffTarget: "common-provider.native-claim-guard"
  exactDiffStatus: "demotion-guard-only"
  nativeParityClaim: false
  productUpgradeRequirements: string[]
  nativeBlockers: string[]
  knownLossiness: string[]
}

export interface ProviderCommonPublicSurfaceGuardSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:provider-common-public-surface-guard"
  fixtureID: "provider:common-public-surface-guard"
  fixtureDiffTarget: "common-provider.native-claim-guard"
  exactDiffStatus: "demotion-guard-only"
  nativeParityClaim: false
  surfaceRefs: ProviderCommonPublicSurfaceRef[]
  nativeBlockers: string[]
  summary: string
  fingerprint: string
}

export interface ProviderCommonPublicSurfaceGuardIssue {
  id: string
  surfaceID?: ProviderCommonPublicSurfaceID
  message: string
}

export interface ProviderCommonPublicSurfaceGuardVerification {
  ok: boolean
  issues: ProviderCommonPublicSurfaceGuardIssue[]
}

export function buildProviderCommonPublicSurfaceGuardSnapshot(): ProviderCommonPublicSurfaceGuardSnapshot {
  const surfaceRefs: ProviderCommonPublicSurfaceRef[] = [
    {
      surfaceID: "provider.transport",
      exportedSymbols: ["createFetchProviderTransport", "createMockSSEProviderTransport", "ProviderTransportPort", "ProviderFetch"],
      exposure: "common-provider-demotion-guard",
      fixtureDiffTarget: "common-provider.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      nativeParityClaim: false,
      productUpgradeRequirements: ["product-specific transport factory", "live network side-effect fixture", "retry/cancel timing negative regression"],
      nativeBlockers: ["product-native-transport-factory:not-proven", "live-provider-network-side-effects:not-replayed"],
      knownLossiness: ["common-provider-transport-utility-not-product-native", "mock-sse-transport-cassette-only"],
    },
    {
      surfaceID: "provider.auth",
      exportedSymbols: ["createProviderAuthPort", "providerAuthHeaders", "ProviderAuthPort", "ProviderAuth"],
      exposure: "common-provider-demotion-guard",
      fixtureDiffTarget: "common-provider.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      nativeParityClaim: false,
      productUpgradeRequirements: ["product-specific auth source", "secret resolution fixture", "auth error shape negative regression"],
      nativeBlockers: ["product-native-auth-source:not-proven", "native-secret-resolution-side-effects:not-replayed"],
      knownLossiness: ["common-provider-auth-header-shape-only", "native-auth-secret-resolution-not-proven"],
    },
    {
      surfaceID: "provider.model-registry",
      exportedSymbols: ["createStaticProviderModelRegistry", "normalizeProviderModel", "ProviderModelRegistryPort"],
      exposure: "common-provider-demotion-guard",
      fixtureDiffTarget: "common-provider.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      nativeParityClaim: false,
      productUpgradeRequirements: ["product-specific model registry fixture", "remote metadata readback", "plugin registry selection negative regression"],
      nativeBlockers: ["product-native-model-registry:not-proven", "remote-model-metadata-readback:not-proven"],
      knownLossiness: ["static-model-registry-not-product-native", "remote-model-metadata-not-fetched"],
    },
    {
      surfaceID: "provider.request-shape",
      exportedSymbols: ["ProviderRequestShapePort", "ProviderRequest"],
      exposure: "common-provider-demotion-guard",
      fixtureDiffTarget: "common-provider.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      nativeParityClaim: false,
      productUpgradeRequirements: ["product-specific request object fixture", "provider/plugin mutation ordering", "raw request payload negative regression"],
      nativeBlockers: ["product-native-request-object-identity:not-proven", "provider-hook-mutation-order:not-proven"],
      knownLossiness: ["common-provider-request-shape-port-only", "native-request-object-identity-not-proven"],
    },
    {
      surfaceID: "provider.stream-parser",
      exportedSymbols: ["ProviderStreamParserPort", "readProviderTextChunks", "normalizeProviderStream"],
      exposure: "common-provider-demotion-guard",
      fixtureDiffTarget: "common-provider.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      nativeParityClaim: false,
      productUpgradeRequirements: ["product-specific raw frame parser", "provider private frame payload fixture", "parser error object negative regression"],
      nativeBlockers: ["product-native-stream-parser:not-proven", "provider-private-frame-payload:not-proven"],
      knownLossiness: ["common-provider-parser-normalized-only", "provider-private-frame-fields-not-replayed"],
    },
    {
      surfaceID: "provider.event-normalizer",
      exportedSymbols: ["createProviderEventNormalizer", "ProviderEventNormalizerPort"],
      exposure: "common-provider-demotion-guard",
      fixtureDiffTarget: "common-provider.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      nativeParityClaim: false,
      productUpgradeRequirements: ["product-specific event reducer fixture", "raw frame order fixture", "normalized event loss negative regression"],
      nativeBlockers: ["product-native-event-normalizer:not-proven", "raw-frame-order-wall-clock:not-proven"],
      knownLossiness: ["common-provider-event-normalizer-projection-only", "raw-frame-wall-clock-order-not-proven"],
    },
    {
      surfaceID: "provider.usage-normalizer",
      exportedSymbols: ["createProviderUsageNormalizer", "estimateProviderCost", "ProviderUsageNormalizerPort"],
      exposure: "common-provider-demotion-guard",
      fixtureDiffTarget: "common-provider.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      nativeParityClaim: false,
      productUpgradeRequirements: ["product-specific usage frame fixture", "provider pricing metadata fixture", "usage/cost drift negative regression"],
      nativeBlockers: ["product-native-usage-frame:not-proven", "provider-pricing-metadata-readback:not-proven"],
      knownLossiness: ["common-provider-usage-estimator-not-product-native", "provider-pricing-metadata-not-read-back"],
    },
    {
      surfaceID: "provider.cassette",
      exportedSymbols: ["createMemoryProviderCassette", "createRecordingProviderTransport", "createRecordedCassetteProviderTransport", "ProviderCassettePort"],
      exposure: "common-provider-demotion-guard",
      fixtureDiffTarget: "common-provider.native-claim-guard",
      exactDiffStatus: "demotion-guard-only",
      nativeParityClaim: false,
      productUpgradeRequirements: ["live product provider replay", "cassette-vs-live raw payload comparison", "cassette-only native claim negative regression"],
      nativeBlockers: ["live-product-provider-replay:not-proven", "cassette-only-provider-path:not-native"],
      knownLossiness: ["provider-cassette-replay-not-live-provider", "recorded-transport-side-effects-not-native"],
    },
  ]
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:provider-common-public-surface-guard" as const,
    fixtureID: "provider:common-public-surface-guard" as const,
    fixtureDiffTarget: "common-provider.native-claim-guard" as const,
    exactDiffStatus: "demotion-guard-only" as const,
    nativeParityClaim: false as const,
    surfaceRefs,
    nativeBlockers: [
      "product-specific-provider-factory:not-proven",
      "live-provider-transport-side-effects:not-proven",
      "raw-provider-frame-exact-diff:not-proven",
      "provider-retry-cancel-wall-clock:not-proven",
      "provider-plugin-runtime:not-spawned",
    ],
    summary: "lego-provider public ports are common provider utilities and require product-specific exact fixtures before any native provider claim.",
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: providerCommonPublicSurfaceFingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyProviderCommonPublicSurfaceGuardSnapshot(
  snapshot: ProviderCommonPublicSurfaceGuardSnapshot,
): ProviderCommonPublicSurfaceGuardVerification {
  const issues: ProviderCommonPublicSurfaceGuardIssue[] = []
  if (snapshot.nativeParityClaim) {
    issues.push({
      id: "provider-common-public-surface.native-claim",
      message: "Provider common public surface guard cannot claim native provider parity.",
    })
  }
  if (snapshot.fixtureDiffTarget !== "common-provider.native-claim-guard" || snapshot.exactDiffStatus !== "demotion-guard-only") {
    issues.push({
      id: "provider-common-public-surface.guard-status",
      message: "Provider common public surface guard must remain a demotion guard.",
    })
  }
  for (const surfaceID of providerCommonPublicSurfaceIDs()) {
    const ref = snapshot.surfaceRefs.find((item) => item.surfaceID === surfaceID)
    if (!ref) {
      issues.push({
        id: "provider-common-public-surface.missing-surface",
        surfaceID,
        message: `${surfaceID} is no longer represented in the provider common public surface guard.`,
      })
      continue
    }
    if (ref.nativeParityClaim) {
      issues.push({
        id: "provider-common-public-surface.surface-native-claim",
        surfaceID,
        message: `${surfaceID} claims native provider parity without a product-specific exact fixture.`,
      })
    }
    if (
      ref.exposure !== "common-provider-demotion-guard"
      || ref.fixtureDiffTarget !== "common-provider.native-claim-guard"
      || ref.exactDiffStatus !== "demotion-guard-only"
    ) {
      issues.push({
        id: "provider-common-public-surface.partial-status",
        surfaceID,
        message: `${surfaceID} no longer records common-provider demotion guard status.`,
      })
    }
    if (ref.exportedSymbols.length === 0) {
      issues.push({
        id: "provider-common-public-surface.exported-symbols",
        surfaceID,
        message: `${surfaceID} no longer records exported provider symbols.`,
      })
    }
    if (!providerCommonPublicSurfaceRequiresProductFixture(ref.productUpgradeRequirements)) {
      issues.push({
        id: "provider-common-public-surface.product-fixture",
        surfaceID,
        message: `${surfaceID} no longer records product-specific fixture requirements.`,
      })
    }
    if (!providerCommonPublicSurfaceHasNativeBlocker(ref.nativeBlockers)) {
      issues.push({
        id: "provider-common-public-surface.native-blockers",
        surfaceID,
        message: `${surfaceID} no longer records native provider blockers.`,
      })
    }
    if (!providerCommonPublicSurfaceHasLossiness(ref.knownLossiness)) {
      issues.push({
        id: "provider-common-public-surface.lossiness",
        surfaceID,
        message: `${surfaceID} no longer records common-provider lossiness.`,
      })
    }
  }
  if (!providerCommonPublicSurfaceHasNativeBlocker(snapshot.nativeBlockers)) {
    issues.push({
      id: "provider-common-public-surface.snapshot-native-blockers",
      message: "Provider common public surface guard no longer records snapshot native blockers.",
    })
  }
  if (/native (provider )?parity complete/i.test(snapshot.summary) || !/product-specific exact fixtures/i.test(snapshot.summary)) {
    issues.push({
      id: "provider-common-public-surface.summary",
      message: "Provider common public surface summary no longer states the product-specific exact fixture requirement.",
    })
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = snapshot
  if (snapshot.fingerprint !== providerCommonPublicSurfaceFingerprintObject(withoutFingerprint)) {
    issues.push({
      id: "provider-common-public-surface.fingerprint",
      message: "Provider common public surface guard fingerprint is not stable.",
    })
  }
  return { ok: issues.length === 0, issues }
}

function byteStreamFromText(chunks: string[]): AsyncIterable<Uint8Array> {
  const encoder = new TextEncoder()
  return (async function* () {
    for (const chunk of chunks) yield encoder.encode(chunk)
  })()
}

async function collectTextChunks(body: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>): Promise<string[]> {
  const chunks: string[] = []
  for await (const chunk of readProviderTextChunks(body)) chunks.push(chunk)
  return chunks
}

function providerCommonPublicSurfaceIDs(): ProviderCommonPublicSurfaceID[] {
  return [
    "provider.transport",
    "provider.auth",
    "provider.model-registry",
    "provider.request-shape",
    "provider.stream-parser",
    "provider.event-normalizer",
    "provider.usage-normalizer",
    "provider.cassette",
  ]
}

function providerCommonPublicSurfaceRequiresProductFixture(values: string[]): boolean {
  return values.some((value) => /product-specific|live product|product provider/i.test(value))
}

function providerCommonPublicSurfaceHasNativeBlocker(values: string[]): boolean {
  return values.some((value) => /not-proven|not-replayed|not-spawned|not-native/i.test(value))
}

function providerCommonPublicSurfaceHasLossiness(values: string[]): boolean {
  return values.some((value) => /loss|lossy|not-proven|not-native|not-replayed|not-fetched|not-read|only/i.test(value))
}

function providerCommonPublicSurfaceFingerprintObject(value: unknown): string {
  return createHash("sha256").update(providerCommonPublicSurfaceStableStringify(value)).digest("hex").slice(0, 16)
}

function providerCommonPublicSurfaceStableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(providerCommonPublicSurfaceStableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${providerCommonPublicSurfaceStableStringify(record[key])}`).join(",")}}`
}
