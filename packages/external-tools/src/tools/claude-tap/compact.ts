const COMPACT_TRACE_MARKER = "__claude_tap_compact_trace__"
const COMPACT_RECORD_MARKER = "__claude_tap_compact_record__"
const BLOB_REF_MARKER = "__claude_tap_blob_ref__"

export function isClaudeTapCompactBundle(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false
  const marker = (value as Record<string, unknown>)[COMPACT_TRACE_MARKER]
  return Boolean(marker && typeof marker === "object" && (marker as { version?: unknown }).version === 1)
}

export function materializeClaudeTapCompactBundle(bundle: Record<string, unknown>): Record<string, unknown>[] {
  const records = bundle.records
  const blobs = bundle.blobs
  if (!Array.isArray(records) || !blobs || typeof blobs !== "object") throw new Error("Invalid claude-tap compact trace bundle.")
  return records.flatMap((payload) => {
    const record = materializeCompactRecord(payload, blobs as Record<string, unknown>)
    return record ? [record] : []
  })
}

function materializeCompactRecord(payload: unknown, blobs: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!payload || typeof payload !== "object") return undefined
  const recordPayload = payload as Record<string, unknown>
  const marker = recordPayload[COMPACT_RECORD_MARKER]
  if (!marker || typeof marker !== "object") return recordPayload
  if ((marker as { version?: unknown }).version !== 1) throw new Error("Unsupported claude-tap compact record version.")
  const record = recordPayload.record
  if (!record || typeof record !== "object") return undefined
  const refs = Array.isArray((marker as { refs?: unknown }).refs) ? ((marker as { refs: unknown[] }).refs) : []
  let materialized: unknown = record
  for (const ref of refs) {
    const path = ref && typeof ref === "object" ? parseJSONPointer((ref as { path?: unknown }).path) : undefined
    if (path) materialized = replaceBlobAtPath(materialized, path, blobs)
  }
  return materialized && typeof materialized === "object" ? (materialized as Record<string, unknown>) : undefined
}

function parseJSONPointer(value: unknown): string[] | undefined {
  if (typeof value !== "string" || !value.startsWith("/")) return undefined
  return value.slice(1).split("/").map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"))
}

function replaceBlobAtPath(value: unknown, path: string[], blobs: Record<string, unknown>): unknown {
  if (path.length === 0) return blobPayload(value, blobs)
  const [head, ...tail] = path
  if (Array.isArray(value)) {
    const index = Number(head)
    if (!Number.isInteger(index) || index < 0 || index >= value.length) return value
    const copy = [...value]
    copy[index] = replaceBlobAtPath(copy[index], tail, blobs)
    return copy
  }
  if (!value || typeof value !== "object" || head === undefined) return value
  const record = value as Record<string, unknown>
  if (!(head in record)) return value
  return { ...record, [head]: replaceBlobAtPath(record[head], tail, blobs) }
}

function blobPayload(value: unknown, blobs: Record<string, unknown>): unknown {
  if (!value || typeof value !== "object") return value
  const ref = (value as Record<string, unknown>)[BLOB_REF_MARKER]
  if (!ref || typeof ref !== "object") return value
  const hash = (ref as { hash?: unknown }).hash
  if (typeof hash !== "string") return value
  const blob = blobs[hash]
  if (!blob || typeof blob !== "object") return value
  return (blob as { payload?: unknown }).payload
}
