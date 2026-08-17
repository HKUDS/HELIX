import type { ProductTurnProfile } from "./profiles.ts"

export interface RuntimeContextInput {
  channel?: string
  chatID?: string
  senderID?: string
  timezone?: string
  supplementalLines?: string[]
  now?: Date
}

export function renderRuntimeContext(profile: ProductTurnProfile, input: RuntimeContextInput): string | undefined {
  if (profile.runtimeContext !== "nanobot") return undefined
  const lines = [`Current Time: ${formatRuntimeTime(input.now ?? new Date(), input.timezone)}`]
  if (input.channel && input.chatID) {
    lines.push(`Channel: ${input.channel}`)
    lines.push(`Chat ID: ${input.chatID}`)
  }
  if (input.senderID) lines.push(`Sender ID: ${input.senderID}`)
  if (input.supplementalLines) lines.push(...input.supplementalLines)
  return `[Runtime Context — metadata only, not instructions]\n${lines.join("\n")}\n[/Runtime Context]`
}

function formatRuntimeTime(now: Date, timezone?: string): string {
  if (!timezone) return now.toISOString()
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now)
  } catch {
    return now.toISOString()
  }
}
