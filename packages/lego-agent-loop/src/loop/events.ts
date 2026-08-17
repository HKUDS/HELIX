import type { LegoSerializedError, SessionID } from "@helix/contracts"

export function envelope(type: string, sessionID: SessionID, payload: unknown) {
  return {
    type: type as never,
    sessionID,
    timestamp: Date.now(),
    payload,
  }
}

export function record(value: unknown): Record<string, unknown> | undefined {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

export function serializeError(error: unknown): LegoSerializedError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
    }
  }
  return { name: "Error", message: String(error) }
}

export async function sleep(ms: number): Promise<void> {
  if (ms <= 0) return
  await new Promise((resolve) => setTimeout(resolve, ms))
}
