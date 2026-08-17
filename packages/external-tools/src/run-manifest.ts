import type { ExternalToolID, ExternalToolProduct } from "./types"

export function defaultExternalToolRunID(toolID: ExternalToolID, product: ExternalToolProduct | undefined, taskID: string | undefined, now: Date): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
  return [toolID, product, taskID, stamp].filter(Boolean).map((part) => String(part).replace(/[^a-zA-Z0-9._-]+/g, "-")).join("-")
}
