import { createHash } from "node:crypto"
import type { JSONShapeSummary } from "./types"

const CREDENTIAL_PATTERNS: Array<{ id: string; pattern: RegExp }> = [
  { id: "openai-api-key", pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { id: "anthropic-api-key", pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
  { id: "aws-access-key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { id: "google-oauth-token", pattern: /\bya29\.[A-Za-z0-9_-]{20,}\b/ },
  { id: "bearer-token", pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{24,}\b/i },
  { id: "generic-access-token", pattern: /\b(access_token|refresh_token|api_key|x-api-key)\b\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{16,}/i },
]

const HOST_PATH_PATTERNS: Array<{ id: string; pattern: RegExp }> = [
  { id: "unix-home-path", pattern: /(^|[^A-Za-z0-9_])(?:\/home\/[A-Za-z0-9._-]+|\/Users\/[A-Za-z0-9._-]+|\/root)(?:\/[^"'\s,}\]]*)?/ },
  { id: "windows-home-path", pattern: /(^|[^A-Za-z0-9_])[A-Za-z]:[\\/]+Users[\\/]+[^\\/:"'\s,}\]]+(?:[\\/][^"'\s,}\]]*)?/ },
  { id: "tilde-home-path", pattern: /(^|[^A-Za-z0-9_])~[\\/][^"'\s,}\]]*/ },
]

export function sha256Text(text: string): string {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`
}

export function stableJSONStringify(value: unknown): string {
  return JSON.stringify(sortJSON(value)) ?? "undefined"
}

export function fingerprintValue(value: unknown): string {
  return sha256Text(stableJSONStringify(value))
}

export function shapeSummary(value: unknown): JSONShapeSummary {
  const type = Array.isArray(value) ? "array" : value === null ? "null" : typeof value
  const keys = value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value as Record<string, unknown>).sort() : []
  const stringBytes = typeof value === "string" ? Buffer.byteLength(value, "utf8") : undefined
  const itemCount = Array.isArray(value) ? value.length : undefined
  return {
    type,
    fingerprint: fingerprintValue(value),
    keys,
    ...(itemCount === undefined ? {} : { itemCount }),
    ...(stringBytes === undefined ? {} : { stringBytes }),
  }
}

export function credentialFindings(value: unknown): string[] {
  const text = typeof value === "string" ? value : stableJSONStringify(value)
  return CREDENTIAL_PATTERNS.filter((candidate) => candidate.pattern.test(text)).map((candidate) => candidate.id)
}

export function hostPathFindings(value: unknown): string[] {
  const text = typeof value === "string" ? value : stableJSONStringify(value)
  return HOST_PATH_PATTERNS.filter((candidate) => candidate.pattern.test(text)).map((candidate) => candidate.id)
}

function sortJSON(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJSON)
  if (!value || typeof value !== "object") return value
  const record = value as Record<string, unknown>
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key, sortJSON(record[key])]))
}
