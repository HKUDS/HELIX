import { claudeTapProfile } from "./tools/claude-tap/profile"
import type { ExternalToolID, ExternalToolProduct, ExternalToolProfile, ExternalToolUnsupportedGap } from "./types"

const profiles: Record<ExternalToolID, ExternalToolProfile> = {
  "claude-tap": claudeTapProfile,
}

export function listExternalToolProfiles(): ExternalToolProfile[] {
  return Object.values(profiles)
}

export function getExternalToolProfile(toolID: ExternalToolID): ExternalToolProfile {
  const profile = profiles[toolID]
  if (!profile) throw new Error(`Unknown external tool: ${toolID}`)
  return profile
}

export function isExternalToolID(value: string): value is ExternalToolID {
  return value === "claude-tap"
}

export function isExternalToolProduct(value: string): value is ExternalToolProduct {
  return value === "opencode" || value === "pi-mono" || value === "hermes-agent" || value === "nanobot" || value === "codex"
}

export function externalToolProductSupport(
  toolID: ExternalToolID,
  product: ExternalToolProduct,
): { supported: true } | { supported: false; gap?: ExternalToolUnsupportedGap; reason: string } {
  const profile = getExternalToolProfile(toolID)
  const gap = profile.unsupportedGaps?.find((item) => item.product === product)
  if (profile.supportedProducts.includes(product) && !profile.unsupportedProducts.includes(product)) return { supported: true }
  return {
    supported: false,
    ...(gap ? { gap } : {}),
    reason: gap?.reason ?? `${toolID} does not list ${product} as a supported product.`,
  }
}

export function assertExternalToolProductSupported(toolID: ExternalToolID, product: ExternalToolProduct | undefined, action: string): void {
  if (!product) return
  const support = externalToolProductSupport(toolID, product)
  if (support.supported) return
  const nextAction = support.gap?.nextAction ? ` ${support.gap.nextAction}` : ""
  throw new Error(`${toolID} does not support product ${product} for ${action}. ${support.reason}${nextAction}`)
}
