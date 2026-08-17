import { createID, type ProviderStreamEvent } from "@helix/contracts"

export interface ProviderStreamNormalizationOptions {
  coalesceText?: boolean
  ensureToolCallIDs?: boolean
}

type PendingTextEvent = Extract<ProviderStreamEvent, { type: "text" | "reasoning" }>

export async function* normalizeProviderStream(
  events: AsyncIterable<ProviderStreamEvent>,
  options: ProviderStreamNormalizationOptions = {},
): AsyncIterable<ProviderStreamEvent> {
  const coalesceText = options.coalesceText ?? true
  const ensureToolCallIDs = options.ensureToolCallIDs ?? true
  let pendingText: PendingTextEvent | undefined

  for await (const event of events) {
    if (coalesceText && (event.type === "text" || event.type === "reasoning")) {
      if (pendingText?.type === event.type) {
        pendingText = { ...pendingText, text: `${pendingText.text}${event.text}` }
      } else {
        if (pendingText) yield pendingText
        pendingText = event
      }
      continue
    }

    if (pendingText) {
      yield pendingText
      pendingText = undefined
    }

    if (ensureToolCallIDs && event.type === "tool_call" && !event.id) {
      yield { ...event, id: createID("toolcall") }
      continue
    }
    yield event
  }

  if (pendingText) yield pendingText
}
