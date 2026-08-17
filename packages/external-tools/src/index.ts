import { resolve } from "node:path"
import { assertExternalToolProductSupported, getExternalToolProfile, isExternalToolID, isExternalToolProduct, listExternalToolProfiles } from "./registry"
import { readTextArtifact, writeNativeCaptureArtifact } from "./artifact-store"
import { importClaudeTapTrace } from "./tools/claude-tap/import-jsonl"
import type { ExternalToolCaptureMode, ExternalToolID, ExternalToolProduct, NativeCaptureArtifact } from "./types"

export * from "./types"
export * from "./registry"
export * from "./profile-schema"
export * from "./redaction"
export * from "./run-manifest"
export * from "./runner"
export * from "./artifact-store"
export * from "./verifiers"
export * from "./native-cadence"
export * from "./tools/claude-tap/import-jsonl"
export * from "./tools/claude-tap/detect"
export * from "./tools/claude-tap/import-compact"
export * from "./tools/claude-tap/launch"
export * from "./tools/claude-tap/normalize"
export * from "./tools/claude-tap/verifier"

export { getExternalToolProfile, isExternalToolID, isExternalToolProduct, listExternalToolProfiles, writeNativeCaptureArtifact }

export interface ImportExternalToolArtifactOptions {
  toolID: ExternalToolID
  artifactPath: string
  product: ExternalToolProduct
  taskID?: string
  sourceToolVersion?: string
  captureMode?: ExternalToolCaptureMode
}

export function importExternalToolArtifact(options: ImportExternalToolArtifactOptions): NativeCaptureArtifact {
  if (options.toolID !== "claude-tap") throw new Error(`Unsupported external tool importer: ${options.toolID}`)
  assertExternalToolProductSupported(options.toolID, options.product, "import")
  const { text, bytes } = readTextArtifact(resolve(options.artifactPath))
  return importClaudeTapTrace({
    text,
    artifactBytes: bytes,
    product: options.product,
    ...(options.taskID ? { taskID: options.taskID } : {}),
    ...(options.sourceToolVersion ? { sourceToolVersion: options.sourceToolVersion } : {}),
    ...(options.captureMode ? { captureMode: options.captureMode } : {}),
  })
}

export function externalToolProfileSummary(): unknown {
  return {
    tools: listExternalToolProfiles().map((profile) => ({
      id: profile.id,
      label: profile.label,
      homepage: profile.homepage,
      repository: profile.repository,
      license: profile.license,
      licenseURL: profile.licenseURL,
      packageURL: profile.packageURL,
      copyrightNotice: profile.copyrightNotice,
      noticePath: profile.noticePath,
      vendoredSource: profile.vendoredSource,
      supportedProducts: profile.supportedProducts,
      unsupportedProducts: profile.unsupportedProducts,
      unsupportedGaps: profile.unsupportedGaps,
      supportedArtifactFormats: profile.supportedArtifactFormats,
      supportedCaptureModes: profile.supportedCaptureModes,
      minVersion: profile.minVersion,
    })),
  }
}
