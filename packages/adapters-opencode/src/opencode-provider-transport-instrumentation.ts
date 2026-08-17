import { createHash } from "node:crypto"

export type OpenCodeProviderTransportFetch = (input: unknown, init?: OpenCodeProviderTransportFetchInit) => Promise<Response>

export interface OpenCodeProviderTransportFetchInit extends Record<string, unknown> {
  method?: string
  body?: string
  signal?: AbortSignal
  timeout?: unknown
}

export interface OpenCodeProviderTransportModel {
  providerID: string
  api: {
    npm: string
  }
}

export interface OpenCodeProviderTransportOptions extends Record<string, unknown> {
  fetch?: OpenCodeProviderTransportFetch
  timeout?: number | null | false
  chunkTimeout?: number
}

export interface OpenCodeProviderTransportInstrumentationInput {
  model: OpenCodeProviderTransportModel
  options: OpenCodeProviderTransportOptions
  fallbackFetch?: OpenCodeProviderTransportFetch
}

export interface OpenCodeProviderTransportInstrumentedOptions extends Record<string, unknown> {
  fetch: OpenCodeProviderTransportFetch
}

export interface OpenCodeProviderTransportInstrumentationBridge {
  instrument(input: OpenCodeProviderTransportInstrumentationInput): OpenCodeProviderTransportInstrumentedOptions
  wrapSSE(res: Response, ms: number, ctl: AbortController): Response
}

export interface OpenCodeProviderTransportInstrumentationNativeExactFixtureCase {
  id:
    | "openai-post-scrubs-item-ids"
    | "openai-store-true-preserves-item-ids"
    | "non-openai-body-preserved"
    | "fallback-fetch-and-timeout-false"
    | "existing-signal-preserved-and-timeout-disabled"
    | "combined-timeout-signal-and-chunk-timeout-option-removal"
    | "sse-response-is-wrapped-and-readable"
    | "sse-read-timeout-aborts-and-cancels"
  actual: unknown
  expected: unknown
}

export interface OpenCodeProviderTransportInstrumentationNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.provider.transport-instrumentation"
  portID: "provider.transport"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-provider-transport-instrumentation-native-exact-fixture"
  replayRef: "provider-transport-instrumentation-native-exact:opencode"
  fixtureID: "opencode-provider-transport-instrumentation:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeProviderTransportInstrumentationNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeProviderTransportInstrumentationNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeProviderTransportInstrumentationNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeProviderTransportInstrumentationNativeExactFixtureIssue[]
}

export function createOpenCodeProviderTransportInstrumentationBridge(): OpenCodeProviderTransportInstrumentationBridge {
  return {
    instrument: openCodeProviderTransportInstrument,
    wrapSSE: openCodeProviderTransportWrapSSE,
  }
}

export function openCodeProviderTransportInstrument(
  input: OpenCodeProviderTransportInstrumentationInput,
): OpenCodeProviderTransportInstrumentedOptions {
  const options = { ...input.options } as OpenCodeProviderTransportInstrumentedOptions & OpenCodeProviderTransportOptions
  const customFetch = options.fetch
  const chunkTimeout = options.chunkTimeout
  delete options.chunkTimeout

  options.fetch = async (fetchInput: unknown, init?: OpenCodeProviderTransportFetchInit) => {
    const fetchFn = customFetch ?? input.fallbackFetch ?? fetch
    const opts = init ?? {}
    const chunkAbortCtl = typeof chunkTimeout === "number" && chunkTimeout > 0 ? new AbortController() : undefined
    const signals: AbortSignal[] = []

    if (opts.signal) signals.push(opts.signal)
    if (chunkAbortCtl) signals.push(chunkAbortCtl.signal)
    if (options.timeout !== undefined && options.timeout !== null && options.timeout !== false) {
      signals.push(AbortSignal.timeout(options.timeout))
    }

    const combined = signals.length === 0 ? null : signals.length === 1 ? signals[0] : AbortSignal.any(signals)
    if (combined) opts.signal = combined

    if (
      (input.model.api.npm === "@ai-sdk/openai" || input.model.api.npm === "@ai-sdk/azure") &&
      opts.body &&
      opts.method === "POST"
    ) {
      const body = JSON.parse(opts.body)
      const keepIds = body.store === true
      if (!keepIds && Array.isArray(body.input)) {
        for (const item of body.input) {
          if (item && typeof item === "object" && "id" in item) {
            delete item.id
          }
        }
        opts.body = JSON.stringify(body)
      }
    }

    const res = await fetchFn(fetchInput, {
      ...opts,
      timeout: false,
    })

    if (!chunkAbortCtl) return res
    return openCodeProviderTransportWrapSSE(res, Number(chunkTimeout), chunkAbortCtl)
  }

  return options
}

export function openCodeProviderTransportWrapSSE(res: Response, ms: number, ctl: AbortController): Response {
  if (typeof ms !== "number" || ms <= 0) return res
  if (!res.body) return res
  if (!res.headers.get("content-type")?.includes("text/event-stream")) return res

  const reader = res.body.getReader()
  const body = new ReadableStream<Uint8Array>({
    async pull(ctrl) {
      const part = await new Promise<Awaited<ReturnType<typeof reader.read>>>((resolve, reject) => {
        const id = setTimeout(() => {
          const err = new Error("SSE read timed out")
          ctl.abort(err)
          void reader.cancel(err)
          reject(err)
        }, ms)

        reader.read().then(
          (part) => {
            clearTimeout(id)
            resolve(part)
          },
          (err) => {
            clearTimeout(id)
            reject(err)
          },
        )
      })

      if (part.done) {
        ctrl.close()
        return
      }

      ctrl.enqueue(part.value)
    },
    async cancel(reason) {
      ctl.abort(reason)
      await reader.cancel(reason)
    },
  })

  return new Response(body, {
    headers: new Headers(res.headers),
    status: res.status,
    statusText: res.statusText,
  })
}

export async function captureOpenCodeProviderTransportInstrumentationNativeExactFixture(): Promise<OpenCodeProviderTransportInstrumentationNativeExactFixture> {
  const bridge = createOpenCodeProviderTransportInstrumentationBridge()
  const openaiModel = openCodeProviderTransportModel("@ai-sdk/openai")
  const azureModel = openCodeProviderTransportModel("@ai-sdk/azure")
  const anthropicModel = openCodeProviderTransportModel("@ai-sdk/anthropic")

  const scrubCaptured = await openCodeProviderTransportCaptureFetchInit(async (fetchImpl) => {
    const instrumented = bridge.instrument({ model: openaiModel, options: { fetch: fetchImpl } })
    await instrumented.fetch("https://example.test/openai", {
      method: "POST",
      body: JSON.stringify({
        input: [
          { id: "item_1", role: "user", content: "hello" },
          { id: "item_2", role: "assistant", content: "hi" },
        ],
      }),
    })
  })
  const storeTrueCaptured = await openCodeProviderTransportCaptureFetchInit(async (fetchImpl) => {
    const instrumented = bridge.instrument({ model: azureModel, options: { fetch: fetchImpl } })
    await instrumented.fetch("https://example.test/azure", {
      method: "POST",
      body: JSON.stringify({
        store: true,
        input: [{ id: "item_kept", role: "user", content: "hello" }],
      }),
    })
  })
  const nonOpenAICaptured = await openCodeProviderTransportCaptureFetchInit(async (fetchImpl) => {
    const instrumented = bridge.instrument({ model: anthropicModel, options: { fetch: fetchImpl } })
    await instrumented.fetch("https://example.test/anthropic", {
      method: "POST",
      body: JSON.stringify({
        input: [{ id: "anthropic_item", role: "user", content: "hello" }],
      }),
    })
  })
  const fallbackFetchCaptured = await openCodeProviderTransportCaptureFetchInit(async (fetchImpl) => {
    const instrumented = bridge.instrument({ model: anthropicModel, options: {}, fallbackFetch: fetchImpl })
    await instrumented.fetch("https://example.test/fallback", {
      method: "POST",
      body: JSON.stringify({ input: [{ id: "fallback_item", role: "user", content: "hello" }] }),
    })
  })
  const externalSignal = new AbortController().signal
  const existingSignalCaptured = await openCodeProviderTransportCaptureFetchInit(async (fetchImpl) => {
    const instrumented = bridge.instrument({ model: anthropicModel, options: { fetch: fetchImpl, timeout: false } })
    await instrumented.fetch("https://example.test/signal", { signal: externalSignal })
  })
  const combinedSignalCaptured = await openCodeProviderTransportCaptureFetchInit(async (fetchImpl) => {
    const instrumented = bridge.instrument({ model: openaiModel, options: { fetch: fetchImpl, timeout: 25, chunkTimeout: 50 } })
    await instrumented.fetch("https://example.test/combined", { signal: externalSignal })
    return {
      chunkTimeoutRemoved: !("chunkTimeout" in instrumented),
    }
  })

  const sseRead = await openCodeProviderTransportCaptureSSERead(bridge, openaiModel)
  const sseTimeout = await openCodeProviderTransportCaptureSSETimeout(bridge, openaiModel)
  const combinedSignalExtra = combinedSignalCaptured.extra as { chunkTimeoutRemoved?: boolean } | undefined

  const cases: OpenCodeProviderTransportInstrumentationNativeExactFixtureCase[] = [
    {
      id: "openai-post-scrubs-item-ids",
      actual: {
        method: scrubCaptured.method,
        body: scrubCaptured.body,
        timeout: scrubCaptured.timeout,
      },
      expected: {
        method: "POST",
        body: JSON.stringify({
          input: [
            { role: "user", content: "hello" },
            { role: "assistant", content: "hi" },
          ],
        }),
        timeout: false,
      },
    },
    {
      id: "openai-store-true-preserves-item-ids",
      actual: {
        body: storeTrueCaptured.body,
      },
      expected: {
        body: JSON.stringify({
          store: true,
          input: [{ id: "item_kept", role: "user", content: "hello" }],
        }),
      },
    },
    {
      id: "non-openai-body-preserved",
      actual: {
        body: nonOpenAICaptured.body,
      },
      expected: {
        body: JSON.stringify({
          input: [{ id: "anthropic_item", role: "user", content: "hello" }],
        }),
      },
    },
    {
      id: "fallback-fetch-and-timeout-false",
      actual: {
        method: fallbackFetchCaptured.method,
        body: fallbackFetchCaptured.body,
        timeout: fallbackFetchCaptured.timeout,
      },
      expected: {
        method: "POST",
        body: JSON.stringify({ input: [{ id: "fallback_item", role: "user", content: "hello" }] }),
        timeout: false,
      },
    },
    {
      id: "existing-signal-preserved-and-timeout-disabled",
      actual: {
        sameSignal: existingSignalCaptured.signal === externalSignal,
        timeout: existingSignalCaptured.timeout,
      },
      expected: {
        sameSignal: true,
        timeout: false,
      },
    },
    {
      id: "combined-timeout-signal-and-chunk-timeout-option-removal",
      actual: {
        hasSignal: combinedSignalCaptured.signal instanceof AbortSignal,
        sameSignal: combinedSignalCaptured.signal === externalSignal,
        timeout: combinedSignalCaptured.timeout,
        chunkTimeoutRemoved: combinedSignalExtra?.chunkTimeoutRemoved,
      },
      expected: {
        hasSignal: true,
        sameSignal: false,
        timeout: false,
        chunkTimeoutRemoved: true,
      },
    },
    {
      id: "sse-response-is-wrapped-and-readable",
      actual: sseRead,
      expected: {
        status: 201,
        statusText: "Created",
        contentType: "text/event-stream",
        text: "data: ok\n\n",
      },
    },
    {
      id: "sse-read-timeout-aborts-and-cancels",
      actual: sseTimeout,
      expected: {
        errorMessage: "SSE read timed out",
        cancelMessage: "SSE read timed out",
      },
    },
  ]

  const fixtureWithoutFingerprint = {
    schemaVersion: 1 as const,
    product: "opencode" as const,
    atomID: "opencode.provider.transport-instrumentation" as const,
    portID: "provider.transport" as const,
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab" as const,
    evidenceRef: "conformance:opencode-provider-transport-instrumentation-native-exact-fixture" as const,
    replayRef: "provider-transport-instrumentation-native-exact:opencode" as const,
    fixtureID: "opencode-provider-transport-instrumentation:native-exact-fixture" as const,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/provider/provider.ts#wrapSSE,options.fetch,chunkTimeout,AbortSignal.any,AbortSignal.timeout",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/provider/provider.ts#openai-azure-item-id-scrub,timeout:false",
    ],
    cases,
    knownLossiness: [] as [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeProviderTransportFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeProviderTransportInstrumentationNativeExactFixture(
  fixture: OpenCodeProviderTransportInstrumentationNativeExactFixture,
): OpenCodeProviderTransportInstrumentationNativeExactFixtureVerification {
  const issues: OpenCodeProviderTransportInstrumentationNativeExactFixtureIssue[] = []
  if (
    fixture.atomID !== "opencode.provider.transport-instrumentation" ||
    fixture.portID !== "provider.transport" ||
    fixture.fixtureID !== "opencode-provider-transport-instrumentation:native-exact-fixture"
  ) {
    issues.push({ id: "opencode-provider-transport-instrumentation-native-exact.identity", message: "OpenCode transport instrumentation native fixture identity drifted." })
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    issues.push({ id: "opencode-provider-transport-instrumentation-native-exact.native-claim", message: "OpenCode transport instrumentation fixture must claim native-exact parity." })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({ id: "opencode-provider-transport-instrumentation-native-exact.lossiness", message: "OpenCode transport instrumentation native fixture cannot retain known lossiness." })
  }
  if (!fixture.sourceRefs.some((ref) => ref.includes("packages/opencode/src/provider/provider.ts") && ref.includes("1a8fd0e1dca58a473d85500530dd45def3f512ab"))) {
    issues.push({ id: "opencode-provider-transport-instrumentation-native-exact.source", message: "OpenCode transport instrumentation fixture lost upstream provider source." })
  }
  for (const item of fixture.cases) {
    if (!openCodeProviderTransportSameJSON(item.actual, item.expected)) {
      issues.push({ id: "opencode-provider-transport-instrumentation-native-exact.case", caseID: item.id, message: `${item.id} no longer matches pinned transport instrumentation behavior.` })
    }
  }
  for (const required of ["openai-post-scrubs-item-ids", "fallback-fetch-and-timeout-false", "combined-timeout-signal-and-chunk-timeout-option-removal", "sse-read-timeout-aborts-and-cancels"] as const) {
    if (!fixture.cases.some((item) => item.id === required)) {
      issues.push({ id: "opencode-provider-transport-instrumentation-native-exact.coverage", caseID: required, message: `Missing required transport coverage case ${required}.` })
    }
  }
  const { fingerprint: _fingerprint, ...withoutFingerprint } = fixture
  if (fixture.fingerprint !== openCodeProviderTransportFingerprintObject(withoutFingerprint)) {
    issues.push({ id: "opencode-provider-transport-instrumentation-native-exact.fingerprint", message: "OpenCode transport instrumentation native fixture fingerprint is not stable." })
  }
  return { ok: issues.length === 0, issues }
}

async function openCodeProviderTransportCaptureFetchInit(
  run: (fetchImpl: OpenCodeProviderTransportFetch) => Promise<unknown>,
): Promise<OpenCodeProviderTransportFetchInit & { extra?: unknown }> {
  let captured: OpenCodeProviderTransportFetchInit | undefined
  const extra = await run(async (_input, init) => {
    captured = init
    return new Response("ok")
  })
  if (!captured) throw new Error("Expected OpenCode transport fixture fetch call.")
  return { ...captured, ...(extra === undefined ? {} : { extra }) }
}

async function openCodeProviderTransportCaptureSSERead(
  bridge: OpenCodeProviderTransportInstrumentationBridge,
  model: OpenCodeProviderTransportModel,
): Promise<Record<string, unknown>> {
  const instrumented = bridge.instrument({
    model,
    options: {
      chunkTimeout: 50,
      fetch: async () =>
        new Response(
          new ReadableStream<Uint8Array>({
            start(ctrl) {
              ctrl.enqueue(new TextEncoder().encode("data: ok\n\n"))
              ctrl.close()
            },
          }),
          {
            status: 201,
            statusText: "Created",
            headers: { "content-type": "text/event-stream" },
          },
        ),
    },
  })
  const res = await instrumented.fetch("https://example.test/sse")
  return {
    status: res.status,
    statusText: res.statusText,
    contentType: res.headers.get("content-type"),
    text: await res.text(),
  }
}

async function openCodeProviderTransportCaptureSSETimeout(
  bridge: OpenCodeProviderTransportInstrumentationBridge,
  model: OpenCodeProviderTransportModel,
): Promise<Record<string, unknown>> {
  let cancelMessage = ""
  const instrumented = bridge.instrument({
    model,
    options: {
      chunkTimeout: 5,
      fetch: async () =>
        new Response(
          new ReadableStream<Uint8Array>({
            pull() {
              return new Promise<void>(() => {})
            },
            cancel(reason) {
              cancelMessage = reason instanceof Error ? reason.message : String(reason)
            },
          }),
          {
            headers: { "content-type": "text/event-stream" },
          },
        ),
    },
  })
  const res = await instrumented.fetch("https://example.test/sse-timeout")
  let errorMessage = ""
  try {
    await res.body?.getReader().read()
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error)
  }
  return { errorMessage, cancelMessage }
}

function openCodeProviderTransportModel(npm: string): OpenCodeProviderTransportModel {
  return { providerID: npm.split("/").at(-1) ?? npm, api: { npm } }
}

function openCodeProviderTransportSameJSON(left: unknown, right: unknown): boolean {
  return openCodeProviderTransportStableJSON(left) === openCodeProviderTransportStableJSON(right)
}

function openCodeProviderTransportFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeProviderTransportStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeProviderTransportStableJSON(value: unknown): string {
  return JSON.stringify(openCodeProviderTransportSortStable(value))
}

function openCodeProviderTransportSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeProviderTransportSortStable)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, openCodeProviderTransportSortStable(entry)]),
  )
}
