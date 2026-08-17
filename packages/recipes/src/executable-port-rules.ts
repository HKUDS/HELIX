import type { LegoBlockImplementationKind } from "@helix/contracts"

export type ExecutableAuditProduct = "opencode" | "pi-mono" | "nanobot" | "hermes-agent" | "minimal" | "custom"

export type ExecutableImplementationLevel =
  | "native"
  | "native-like"
  | "profile-compatible"
  | "compatible-bridge"
  | "common-shared"
  | "preview-shell"
  | "metadata-only"

export type ExecutableBindingRisk =
  | "compile-blocker"
  | "misleading-coverage"
  | "lossy-compatible"
  | "preview-only"
  | "metadata-ok"
  | "common-ok"

export type ExecutableBindingResolution =
  | "rebind-existing-executable"
  | "metadata-overlay-only"
  | "add-product-adapter"
  | "native-rewrite"
  | "rename-or-demote"
  | "keep-with-evidence"

export interface ExecutablePortRule {
  portID: string
  executableRequired: boolean
  ruleID: string
  plane: string
  reason: string
}

export interface ExecutableAtomProfileInput {
  id: string
  kind?: string
  scope?: string
  productScope?: string
  stability?: string
  implementationKind?: LegoBlockImplementationKind
  selectionReason?: string
  parityCoverage?: string
  nativeEvidenceRefs?: string[]
  fixtureIDs?: string[]
  knownLossiness?: string[]
  provides?: string[]
}

const runtimeExecutablePorts = new Set([
  "runtime.module-catalog",
  "runtime.capability-resolver",
  "runtime.binding-planner",
  "runtime.lifecycle-runner",
  "runtime.assembly-graph",
  "runtime.acceptance-controller",
  "runtime.acceptance-evidence",
])

const providerExecutablePorts = new Set([
  "provider.stream",
  "provider.transport",
  "provider.auth",
  "provider.model-registry",
  "provider.request-shape",
  "provider.stream-parser",
  "provider.event-normalizer",
  "provider.streaming-delta-recorder",
  "provider.stream-projector",
])

export function executablePortRuleFor(portID: string): ExecutablePortRule {
  const plane = executablePortPlane(portID)
  const executableRequired = requiresExecutableProvider(portID)
  return {
    portID,
    executableRequired,
    ruleID: executableRequired ? `executable-port.${plane}` : `metadata-port.${plane}`,
    plane,
    reason: executableRequired ? executablePortReason(portID, plane) : "Port can accept metadata-only atoms when they are used as BOM, labels, aliases, defaults, or evidence overlays.",
  }
}

export function executablePortRuleCatalog(portIDs: string[]): ExecutablePortRule[] {
  return [...new Set(portIDs)].sort().map(executablePortRuleFor)
}

export function requiresExecutableProvider(portID: string): boolean {
  if (portID === "product.shell") return true
  if (runtimeExecutablePorts.has(portID)) return true
  if (providerExecutablePorts.has(portID)) return true
  if (portID === "resource.discovery" || portID.startsWith("prompt.")) return true
  if (portID.startsWith("turn.") || portID.startsWith("agent-loop.")) return true
  if (portID === "tools" || portID.startsWith("tools.") || portID.startsWith("tool.") || portID === "filesystem.port" || portID === "process-runner.port") return true
  if (portID.startsWith("session.")) return true
  if (portID.startsWith("hook.") || portID.startsWith("registry.")) return true
  if (portID === "ui.event-loop" || portID === "ui.command-router" || portID === "ui.input-normalizer" || portID === "ui.renderer") return true
  return false
}

export function executableImplementationLevelForAtom(atom: ExecutableAtomProfileInput | undefined): ExecutableImplementationLevel {
  if (!atom) return "metadata-only"
  const id = atom.id.toLowerCase()
  const reason = (atom.selectionReason ?? "").toLowerCase()
  const kind = atom.kind ?? ""
  const scope = atom.scope ?? ""
  const productScope = atom.productScope ?? ""
  const stability = atom.stability ?? ""
  const provides = atom.provides ?? []
  if (atom.implementationKind === "metadata-only") return "metadata-only"
  if (atom.implementationKind === "preview") return "preview-shell"
  if (atom.implementationKind === "factory") {
    if (scope === "common" || productScope === "common" || id.startsWith("common.")) return "common-shared"
    if (hasExecutableNativeProof(atom, reason)) return "native"
    if (isProductTurnProfileAtomID(id)) return "profile-compatible"
    if (isProductShellID(id, kind, provides) && isPreviewShellID(id)) return "preview-shell"
    if (isProductShellID(id, kind, provides)) return "compatible-bridge"
    if (isNativeLikeAtomID(id, kind)) return "native-like"
    return "compatible-bridge"
  }
  if (scope === "fixture-only" || scope === "reserved" || stability === "native-fixture" || id.startsWith("test.") || id.includes(".mock")) return "metadata-only"
  if (isNativeLikeAtomID(id, kind)) {
    return productScope === "common" || id.startsWith("common.") ? "common-shared" : "native-like"
  }
  if (isMetadataOnlyAtomID(id)) return "metadata-only"
  if (scope === "common" || productScope === "common" || id.startsWith("common.")) return "common-shared"
  if (isProductTurnProfileAtomID(id)) return "profile-compatible"
  if (isProductShellID(id, kind, provides) && isPreviewShellID(id)) return "preview-shell"
  if (isProductShellID(id, kind, provides)) return "compatible-bridge"
  if (hasExecutableNativeProof(atom, reason)) return "native"
  return "compatible-bridge"
}

function hasExecutableNativeProof(atom: ExecutableAtomProfileInput, reason: string): boolean {
  return (
    atom.parityCoverage === "native" &&
    (atom.nativeEvidenceRefs ?? []).length > 0 &&
    (atom.fixtureIDs ?? []).length > 0 &&
    (atom.knownLossiness ?? []).length === 0 &&
    (reason.includes("native parity complete") || reason.includes("upstream native implementation"))
  )
}

export function isExecutableImplementationLevel(level: ExecutableImplementationLevel): boolean {
  return level !== "metadata-only" && level !== "preview-shell"
}

export function isMockFixtureOrCassetteAtomID(atomID: string): boolean {
  const id = atomID.toLowerCase()
  return id.startsWith("test.") || id.includes(".mock") || id.includes("mock-sse") || id.includes("cassette") || id.includes("fake-provider")
}

export function isMetadataOverlayAtom(atom: ExecutableAtomProfileInput | undefined): boolean {
  return executableImplementationLevelForAtom(atom) === "metadata-only"
}

function executablePortReason(portID: string, plane: string): string {
  if (portID === "product.shell") return "Primary product surface must be a runnable shell or SDK entrypoint, not an inspection-only preview."
  if (plane === "runtime") return "Runtime assembly, lifecycle, acceptance, and binding ports perform executable orchestration work."
  if (plane === "provider") return "Provider ports participate in live request, auth, parsing, streaming, or normalization paths."
  if (plane === "prompt") return "Prompt/resource ports build provider-facing prompt payloads and cannot be descriptor-only when required."
  if (plane === "agent-loop") return "Turn and agent-loop ports execute request boundary, provider, tool, compaction, and final summary semantics."
  if (plane === "tool") return "Tool ports execute or project user-visible tool calls, permissions, filesystem, process, and result behavior."
  if (plane === "session") return "Session ports create, persist, project, branch, page, or select conversation state."
  if (plane === "hook") return "Hook and registry ports dispatch product extension/plugin behavior."
  if (plane === "ui") return "UI ports process interactive events, routing, rendering, and snapshots."
  return "Required port must bind to an executable provider."
}

function executablePortPlane(portID: string): string {
  if (portID === "product.shell") return "product"
  if (portID.startsWith("runtime.")) return "runtime"
  if (portID.startsWith("provider.")) return "provider"
  if (portID === "resource.discovery" || portID.startsWith("prompt.")) return "prompt"
  if (portID.startsWith("turn.") || portID.startsWith("agent-loop.")) return "agent-loop"
  if (portID === "tools" || portID.startsWith("tools.") || portID.startsWith("tool.") || portID === "filesystem.port" || portID === "process-runner.port") return "tool"
  if (portID.startsWith("session.")) return "session"
  if (portID.startsWith("hook.") || portID.startsWith("registry.")) return "hook"
  if (portID.startsWith("ui.")) return "ui"
  return "foundation"
}

function isNativeLikeAtomID(id: string, kind: string): boolean {
  return (
    id.includes(".native-like") ||
    kind === "cadence-policy" ||
    kind === "tool-cadence" ||
    kind === "message-part-projector" ||
    kind === "streaming-delta" ||
    kind === "runtime-acceptance"
  )
}

function isProductTurnProfileAtomID(id: string): boolean {
  return (
    ["opencode.turn.", "pi.turn.", "nanobot.turn.", "hermes.turn."].some((prefix) => id.startsWith(prefix)) &&
    [
      "input-normalizer",
      "context-builder",
      "prompt-assembler",
      "provider-request-builder",
      "provider-stream-runner",
      "stream-reducer",
      "tool-call-planner",
      "tool-executor",
      "result-recorder",
      "retry-policy",
      "continuation-policy",
      "compaction-policy",
      "stop-condition",
    ].some((suffix) => id.endsWith(`.turn.${suffix}`))
  )
}

function isProductShellID(id: string, kind: string, provides: string[]): boolean {
  return kind === "product-shell" || provides.includes("product.shell") || id.includes(".product-shell.") || id.startsWith("product.shell.")
}

function isPreviewShellID(id: string): boolean {
  return [
    ".product-shell.tui",
    ".product-shell.web",
    ".product-shell.web-ui",
    ".product-shell.web-dashboard",
    ".product-shell.desktop",
    ".product-shell.browser-smoke",
    ".product-shell.control-plane",
    ".product-shell.workspace",
    ".product-shell.package-manager",
    ".product-shell.extension-examples",
    ".product-shell.release-hardening",
  ].some((part) => id.includes(part))
}

function isMetadataOnlyAtomID(id: string): boolean {
  return [
    ".runtime.module-aliases",
    ".runtime.capability-aliases",
    ".runtime.binding-defaults",
    ".runtime.lifecycle-defaults",
    ".runtime.graph-labels",
    ".block.compatibility-metadata",
    ".capability.aliases",
    ".resource.grant-defaults",
    ".recipe.binding-aliases",
    ".conformance.product-gate",
    ".provider.cassette-artifact",
    "provider.cassette",
    "provider.transport.mock-sse",
    "process-runner.disabled",
    "ui.renderer.noop",
  ].some((part) => id.includes(part))
}
