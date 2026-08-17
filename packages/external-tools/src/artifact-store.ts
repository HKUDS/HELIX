import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import type { NativeCaptureArtifact } from "./types"

export function readTextArtifact(path: string): { text: string; bytes: number } {
  const text = readFileSync(path, "utf8")
  return { text, bytes: statSync(path).size }
}

export function writeNativeCaptureArtifact(path: string, artifact: NativeCaptureArtifact): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(artifact, null, 2)}\n`, "utf8")
}
