import type { LegoModel } from "@helix/contracts"
import {
  createOpenAICompatibleProvider,
  type OpenAICompatibleProviderAdapter,
  type ProviderAuth,
  type ProviderFetch,
} from "./openai-compatible"
import type {
  ProviderAuthPort,
  ProviderEventNormalizerPort,
  ProviderModelRegistryPort,
  ProviderRequestShapePort,
  ProviderStreamParserPort,
  ProviderTransportPort,
} from "./ports"

export interface OpenRouterProviderOptions {
  id?: string
  apiKey?: string
  auth?: ProviderAuth
  authPort?: ProviderAuthPort
  siteURL?: string
  appName?: string
  headers?: Record<string, string>
  models: Array<string | (Partial<LegoModel> & { modelID: string })>
  fetch?: ProviderFetch
  transport?: ProviderTransportPort
  modelRegistry?: ProviderModelRegistryPort
  requestShape?: ProviderRequestShapePort
  streamParser?: ProviderStreamParserPort
  eventNormalizer?: ProviderEventNormalizerPort
}

export function createOpenRouterProvider(options: OpenRouterProviderOptions): OpenAICompatibleProviderAdapter {
  return createOpenAICompatibleProvider({
    id: options.id ?? "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    auth: options.auth ?? (options.apiKey ? { type: "api-key", apiKey: options.apiKey } : { type: "none" }),
    headers: {
      ...(options.siteURL ? { "http-referer": options.siteURL } : {}),
      ...(options.appName ? { "x-title": options.appName } : {}),
      ...(options.headers ?? {}),
    },
    models: options.models,
    ...(options.authPort ? { authPort: options.authPort } : {}),
    ...(options.fetch ? { fetch: options.fetch } : {}),
    ...(options.transport ? { transport: options.transport } : {}),
    ...(options.modelRegistry ? { modelRegistry: options.modelRegistry } : {}),
    ...(options.requestShape ? { requestShape: options.requestShape } : {}),
    ...(options.streamParser ? { streamParser: options.streamParser } : {}),
    ...(options.eventNormalizer ? { eventNormalizer: options.eventNormalizer } : {}),
  })
}
