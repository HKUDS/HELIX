import { createHash } from "node:crypto"
import {
  buildRuntimeAcceptanceReplaySnapshot,
  runtimeAcceptanceReplayProducts,
  type RuntimeAcceptanceReplayAtomKey,
  type RuntimeAcceptanceReplayProduct,
} from "./acceptance-controller"
import {
  openCodeRuntimeAcceptanceNativeDescriptors,
} from "./product-schema/opencode"
import { piMonoRuntimeAcceptanceNativeDescriptors } from "./product-schema/pi"
import { nanobotRuntimeAcceptanceNativeDescriptors } from "./product-schema/nanobot"
import { hermesRuntimeAcceptanceNativeDescriptors } from "./product-schema/hermes"

export type RuntimeProductPersonality = "opencode" | "pi-mono" | "nanobot" | "hermes-agent"

export interface RuntimeModuleAliasAtom {
  readonly product: RuntimeProductPersonality
  aliases(): Record<string, string>
  resolve(alias: string): string | undefined
}

export interface RuntimeCapabilityAliasAtom {
  readonly product: RuntimeProductPersonality
  aliases(): Record<string, string>
  resolve(alias: string): string | undefined
}

export interface RuntimeBindingDefaultsAtom {
  readonly product: RuntimeProductPersonality
  defaults(): Record<string, string>
  moduleForPort(port: string): string | undefined
}

export interface RuntimeLifecycleDefaultsAtom {
  readonly product: RuntimeProductPersonality
  scopes(): Record<string, string[]>
  scopesFor(moduleID: string): string[]
}

export interface RuntimeGraphLabelsAtom {
  readonly product: RuntimeProductPersonality
  labels(): Record<string, string>
  labelFor(moduleID: string): string
}

export interface RuntimeProductAtoms {
  readonly product: RuntimeProductPersonality
  moduleAliases: RuntimeModuleAliasAtom
  capabilityAliases: RuntimeCapabilityAliasAtom
  bindingDefaults: RuntimeBindingDefaultsAtom
  lifecycleDefaults: RuntimeLifecycleDefaultsAtom
  graphLabels: RuntimeGraphLabelsAtom
}

export interface RuntimeProductProfile {
  product: RuntimeProductPersonality
  moduleAliases: Record<string, string>
  capabilityAliases: Record<string, string>
  bindingDefaults: Record<string, string>
  lifecycleScopes: Record<string, string[]>
  graphLabels: Record<string, string>
}

export function createRuntimeProductAtoms(product: RuntimeProductPersonality): RuntimeProductAtoms {
  const profile = runtimeProductProfile(product)
  return {
    product,
    moduleAliases: createRuntimeModuleAliasAtom(profile),
    capabilityAliases: createRuntimeCapabilityAliasAtom(profile),
    bindingDefaults: createRuntimeBindingDefaultsAtom(profile),
    lifecycleDefaults: createRuntimeLifecycleDefaultsAtom(profile),
    graphLabels: createRuntimeGraphLabelsAtom(profile),
  }
}

export function createOpenCodeRuntimeAtoms(): RuntimeProductAtoms {
  return createRuntimeProductAtoms("opencode")
}

export function createPiMonoRuntimeAtoms(): RuntimeProductAtoms {
  return createRuntimeProductAtoms("pi-mono")
}

export function createNanobotRuntimeAtoms(): RuntimeProductAtoms {
  return createRuntimeProductAtoms("nanobot")
}

export function createHermesAgentRuntimeAtoms(): RuntimeProductAtoms {
  return createRuntimeProductAtoms("hermes-agent")
}

export function createRuntimeModuleAliasAtom(profile: RuntimeProductProfile): RuntimeModuleAliasAtom {
  return {
    product: profile.product,
    aliases: () => ({ ...profile.moduleAliases }),
    resolve(alias) {
      return profile.moduleAliases[alias]
    },
  }
}

export function createRuntimeCapabilityAliasAtom(profile: RuntimeProductProfile): RuntimeCapabilityAliasAtom {
  return {
    product: profile.product,
    aliases: () => ({ ...profile.capabilityAliases }),
    resolve(alias) {
      return profile.capabilityAliases[alias]
    },
  }
}

export function createRuntimeBindingDefaultsAtom(profile: RuntimeProductProfile): RuntimeBindingDefaultsAtom {
  return {
    product: profile.product,
    defaults: () => ({ ...profile.bindingDefaults }),
    moduleForPort(port) {
      return profile.bindingDefaults[port]
    },
  }
}

export function createRuntimeLifecycleDefaultsAtom(profile: RuntimeProductProfile): RuntimeLifecycleDefaultsAtom {
  return {
    product: profile.product,
    scopes: () => cloneStringArrayRecord(profile.lifecycleScopes),
    scopesFor(moduleID) {
      return [...(profile.lifecycleScopes[moduleID] ?? profile.lifecycleScopes["*"] ?? ["process"])]
    },
  }
}

export function createRuntimeGraphLabelsAtom(profile: RuntimeProductProfile): RuntimeGraphLabelsAtom {
  return {
    product: profile.product,
    labels: () => ({ ...profile.graphLabels }),
    labelFor(moduleID) {
      return profile.graphLabels[moduleID] ?? moduleID
    },
  }
}

export function runtimeProductProfile(product: RuntimeProductPersonality): RuntimeProductProfile {
  const profile = runtimeProductProfiles[product]
  return {
    product: profile.product,
    moduleAliases: { ...profile.moduleAliases },
    capabilityAliases: { ...profile.capabilityAliases },
    bindingDefaults: { ...profile.bindingDefaults },
    lifecycleScopes: cloneStringArrayRecord(profile.lifecycleScopes),
    graphLabels: { ...profile.graphLabels },
  }
}

const commonLifecycleScopes: Record<string, string[]> = {
  "*": ["process"],
  "hook.bus": ["process", "workspace", "session", "turn", "tool-call"],
  "tool.registry": ["process", "workspace", "session"],
  "provider.stream": ["process", "workspace"],
  "prompt.system-builder": ["process", "workspace", "session", "turn"],
  "product.shell": ["process", "workspace", "session", "turn"],
}

const runtimeProductProfiles: Record<RuntimeProductPersonality, RuntimeProductProfile> = {
  opencode: {
    product: "opencode",
    moduleAliases: {
      cli: "opencode.product-shell.tui",
      sdk: "opencode.product-shell.sdk",
      server: "opencode.product-shell.server",
      workspace: "opencode.product-shell.workspace",
      plugin: "opencode.plugin.loader",
      "session-db": "opencode.session.store.sqlite-projection",
    },
    capabilityAliases: {
      "app.plugins": "hook.bus",
      "app.providers": "registry.provider",
      "app.ui": "registry.ui",
      "chat.system": "prompt.system-builder",
      "session.events": "session.projector",
    },
    bindingDefaults: {
      "product.shell": "opencode.product-shell.sdk",
      "session.store": "opencode.session.store.sqlite-projection",
      "hook.bus": "opencode.plugin.loader",
      "hook.handler-chain": "opencode.plugin.event-mapper",
      "prompt.system-builder": "opencode.prompt.mode-builder",
      "turn.context-builder": "opencode.turn.context-builder",
      "turn.continuation-policy": "opencode.turn.continuation-policy",
      "ui.renderer": "opencode.ui.renderer",
    },
    lifecycleScopes: commonLifecycleScopes,
    graphLabels: {
      "opencode.product-shell.sdk": "OpenCode SDK",
      "opencode.plugin.loader": "OpenCode plugin loader",
      "opencode.prompt.mode-builder": "OpenCode prompt modes",
      "opencode.session.store.sqlite-projection": "OpenCode SQLite session projection",
    },
  },
  "pi-mono": {
    product: "pi-mono",
    moduleAliases: {
      cli: "pi.product-shell.cli",
      sdk: "pi.product-shell.sdk",
      rpc: "pi.product-shell.rpc",
      server: "pi.product-shell.server",
      extension: "pi.extension.loader",
      "session-jsonl": "pi.session.store.jsonl-v3",
    },
    capabilityAliases: {
      "agent.extensions": "hook.bus",
      "agent.context": "turn.context-builder",
      "agent.prompt": "prompt.system-builder",
      "agent.runtime-events": "event.log",
      "agent.ui": "ui.renderer",
    },
    bindingDefaults: {
      "product.shell": "pi.product-shell.sdk",
      "session.store": "pi.session.store.jsonl-v3",
      "session.context-selector": "pi.session.context-selector.active-leaf",
      "hook.bus": "pi.extension.loader",
      "hook.handler-chain": "pi.extension.event-mapper",
      "prompt.system-builder": "pi.prompt.coding-agent-builder",
      "turn.context-builder": "pi.turn.context-builder",
      "turn.continuation-policy": "pi.turn.continuation-policy",
      "ui.renderer": "pi.ui.renderer",
    },
    lifecycleScopes: commonLifecycleScopes,
    graphLabels: {
      "pi.product-shell.sdk": "Pi SDK",
      "pi.extension.loader": "Pi extension loader",
      "pi.prompt.coding-agent-builder": "Pi coding-agent prompt",
      "pi.session.store.jsonl-v3": "Pi JSONL v3 session store",
    },
  },
  nanobot: {
    product: "nanobot",
    moduleAliases: {
      cli: "nanobot.product-shell.cli",
      sdk: "nanobot.product-shell.sdk",
      server: "nanobot.product-shell.server",
      plugin: "nanobot.plugin.loader",
      "session-jsonl": "nanobot.session.store.jsonl",
      workspace: "nanobot.session.branch-graph.channel-key",
    },
    capabilityAliases: {
      "agent.plugins": "hook.bus",
      "agent.context": "turn.context-builder",
      "agent.prompt": "prompt.system-builder",
      "agent.bus": "event.log",
      "agent.workspace": "identity.workspace-resolver",
    },
    bindingDefaults: {
      "product.shell": "nanobot.product-shell.sdk",
      "session.store": "nanobot.session.store.jsonl",
      "session.context-selector": "nanobot.session.context-selector.max-messages",
      "hook.bus": "nanobot.plugin.loader",
      "hook.handler-chain": "nanobot.plugin.event-mapper",
      "prompt.system-builder": "nanobot.prompt.agent-builder",
      "turn.context-builder": "nanobot.turn.context-builder",
      "turn.continuation-policy": "nanobot.turn.continuation-policy",
      "ui.renderer": "nanobot.ui.renderer",
    },
    lifecycleScopes: commonLifecycleScopes,
    graphLabels: {
      "nanobot.product-shell.sdk": "Nanobot SDK",
      "nanobot.plugin.loader": "Nanobot plugin loader",
      "nanobot.prompt.agent-builder": "Nanobot agent prompt",
      "nanobot.session.store.jsonl": "Nanobot JSONL session store",
    },
  },
  "hermes-agent": {
    product: "hermes-agent",
    moduleAliases: {
      cli: "hermes.product-shell.cli",
      sdk: "hermes.product-shell.sdk",
      tui: "hermes.product-shell.tui",
      "api-server": "hermes.product-shell.api-server",
      acp: "hermes.product-shell.acp",
      gateway: "hermes.product-shell.gateway",
      dashboard: "hermes.product-shell.web-dashboard",
      plugin: "hermes.plugin.loader",
      "session-db": "hermes.session.store.sqlite-fts",
    },
    capabilityAliases: {
      "agent.plugins": "hook.bus",
      "agent.provider-runtime": "provider.request-shape",
      "agent.tools": "tool.registry",
      "agent.prompt": "prompt.system-builder",
      "agent.gateway": "product.shell",
      "agent.trajectory": "session.projector",
    },
    bindingDefaults: {
      "product.shell": "hermes.product-shell.sdk",
      "session.store": "hermes.session.store.sqlite-fts",
      "session.context-selector": "hermes.session.context-selector.thread-history",
      "hook.bus": "hermes.plugin.loader",
      "hook.handler-chain": "hermes.plugin.event-mapper",
      "prompt.system-builder": "hermes.prompt.agent-builder",
      "turn.context-builder": "hermes.turn.context-builder",
      "turn.continuation-policy": "hermes.turn.continuation-policy",
      "ui.renderer": "hermes.ui.renderer",
    },
    lifecycleScopes: commonLifecycleScopes,
    graphLabels: {
      "hermes.product-shell.sdk": "Hermes Agent SDK",
      "hermes.product-shell.cli": "Hermes CLI",
      "hermes.product-shell.tui": "Hermes TUI gateway",
      "hermes.product-shell.api-server": "Hermes OpenAI-compatible API server",
      "hermes.plugin.loader": "Hermes plugin loader",
      "hermes.prompt.agent-builder": "Hermes prompt builder",
      "hermes.session.store.sqlite-fts": "Hermes SQLite FTS session store",
    },
  },
}

function cloneStringArrayRecord(input: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, [...value]]))
}

export interface RuntimeAcceptanceNativeLikeSurfaceAtomRef {
  product: RuntimeAcceptanceReplayProduct
  key: RuntimeAcceptanceReplayAtomKey
  atomID: string
  portID: "runtime.acceptance-controller" | "runtime.acceptance-evidence"
  implementationLevel: "native-like" | "native"
  exactDiffStatus: "exact-diff-partial" | "native-exact"
  nativeParityClaim: boolean
  evidenceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: string[]
  replayFingerprint: string
}

export interface RuntimeAcceptanceNativeLikeSurfaceGuardSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:runtime-acceptance-native-like-surface-guard"
  fixtureID: "runtime:acceptance-native-like-surface-guard"
  exactDiffStatus: "exact-diff-partial"
  nativeParityClaim: false
  products: RuntimeAcceptanceReplayProduct[]
  atomRefs: RuntimeAcceptanceNativeLikeSurfaceAtomRef[]
  nativeBlockers: string[]
  summary: string
  fingerprint: string
}

export interface RuntimeAcceptanceNativeLikeSurfaceGuardIssue {
  id: string
  atomID?: string
  product?: RuntimeAcceptanceReplayProduct
  message: string
}

export interface RuntimeAcceptanceNativeLikeSurfaceGuardVerification {
  ok: boolean
  issues: RuntimeAcceptanceNativeLikeSurfaceGuardIssue[]
}

export function buildRuntimeAcceptanceNativeLikeSurfaceGuardSnapshot(): RuntimeAcceptanceNativeLikeSurfaceGuardSnapshot {
  const replaySnapshots = runtimeAcceptanceReplayProducts.map((product) => buildRuntimeAcceptanceReplaySnapshot(product))
  const atomRefs: RuntimeAcceptanceNativeLikeSurfaceAtomRef[] = replaySnapshots.flatMap((snapshot) =>
    snapshot.atoms.map((atom) => {
      const nativeDescriptor = runtimeAcceptanceNativeExactDescriptor(atom.atomID)
      const nativeEvidenceRefs = nativeDescriptor ? [...nativeDescriptor.nativeEvidenceRefs] : []
      const nativeFixtureIDs = nativeDescriptor ? [...nativeDescriptor.fixtureIDs] : []
      return {
        product: snapshot.product,
        key: atom.key,
        atomID: atom.atomID,
        portID: atom.portID,
        implementationLevel: nativeDescriptor ? "native" as const : "native-like" as const,
        exactDiffStatus: nativeDescriptor ? "native-exact" as const : "exact-diff-partial" as const,
        nativeParityClaim: nativeDescriptor ? true : false,
        evidenceRefs: runtimeAcceptanceNativeLikeSurfaceUnique([
          snapshot.evidenceRef,
          snapshot.timingBoundary.evidenceRef,
          snapshot.lifecycle.evidenceRef,
          snapshot.persistenceCleanup.evidenceRef,
          ...atom.upstreamEvidenceRefs,
          ...nativeEvidenceRefs,
        ]),
        nativeEvidenceRefs,
        fixtureIDs: runtimeAcceptanceNativeLikeSurfaceUnique([
          ...snapshot.fixtureIDs,
          atom.fixtureID,
          atom.timingBoundaryFixtureID ?? "",
          atom.lifecycleFixtureID ?? "",
          atom.persistenceCleanupFixtureID ?? "",
          ...nativeFixtureIDs,
        ].filter(Boolean)),
        knownLossiness: nativeDescriptor
          ? []
          : runtimeAcceptanceNativeLikeSurfaceUnique([
            ...snapshot.knownGaps,
            ...atom.lossyFields,
          ]),
        replayFingerprint: snapshot.fingerprint,
      }
    }),
  )
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:runtime-acceptance-native-like-surface-guard" as const,
    fixtureID: "runtime:acceptance-native-like-surface-guard" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    nativeParityClaim: false as const,
    products: [...runtimeAcceptanceReplayProducts],
    atomRefs,
    nativeBlockers: [
      "guard-snapshot:not-product-native-runtime",
      "common-runtime-registry-lifecycle:guard-only",
      "live-side-effect-readback:guard-only",
      "interrupt-path:assembled-guard-only",
    ],
    summary: "Runtime acceptance guard remains a partial guard artifact while all product acceptance-controller and acceptance-evidence atoms are pinned to native-exact upstream behavior.",
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: runtimeAcceptanceNativeLikeSurfaceFingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyRuntimeAcceptanceNativeLikeSurfaceGuardSnapshot(
  snapshot: RuntimeAcceptanceNativeLikeSurfaceGuardSnapshot,
): RuntimeAcceptanceNativeLikeSurfaceGuardVerification {
  const issues: RuntimeAcceptanceNativeLikeSurfaceGuardIssue[] = []
  if (snapshot.exactDiffStatus !== "exact-diff-partial" || snapshot.nativeParityClaim !== false) {
    issues.push({
      id: "runtime-acceptance-native-like.native-claim",
      message: "Runtime acceptance native-like surface guard must remain partial and cannot claim native parity.",
    })
  }
  for (const product of runtimeAcceptanceReplayProducts) {
    for (const key of ["acceptance-controller", "acceptance-evidence"] as RuntimeAcceptanceReplayAtomKey[]) {
      const atom = snapshot.atomRefs.find((item) => item.product === product && item.key === key)
      if (!atom) {
        issues.push({
          id: "runtime-acceptance-native-like.missing-atom",
          product,
          message: `Missing runtime acceptance ${key} native-like atom surface for ${product}.`,
        })
        continue
      }
      const nativeDescriptor = runtimeAcceptanceNativeExactDescriptor(atom.atomID)
      if (nativeDescriptor) {
        if (
          atom.implementationLevel !== "native"
          || atom.exactDiffStatus !== "native-exact"
          || atom.nativeParityClaim !== true
        ) {
          issues.push({
            id: "runtime-acceptance-native-like.atom-native-exact",
            atomID: atom.atomID,
            product,
            message: `${atom.atomID} must remain promoted to product native-exact acceptance behavior.`,
          })
        }
        if (
          !nativeDescriptor.nativeEvidenceRefs.every((ref) => atom.nativeEvidenceRefs.includes(ref))
          || !nativeDescriptor.nativeEvidenceRefs.every((ref) => atom.evidenceRefs.includes(ref))
        ) {
          issues.push({
            id: "runtime-acceptance-native-like.native-exact-evidence",
            atomID: atom.atomID,
            product,
            message: `${atom.atomID} no longer exposes product native-exact evidence refs.`,
          })
        }
        if (!nativeDescriptor.fixtureIDs.every((fixtureID) => atom.fixtureIDs.includes(fixtureID))) {
          issues.push({
            id: "runtime-acceptance-native-like.native-exact-fixture",
            atomID: atom.atomID,
            product,
            message: `${atom.atomID} no longer exposes the product native-exact fixture ID.`,
          })
        }
        if (atom.knownLossiness.length > 0) {
          issues.push({
            id: "runtime-acceptance-native-like.native-exact-lossiness",
            atomID: atom.atomID,
            product,
            message: `${atom.atomID} must not carry partial/lossy markers after native-exact promotion.`,
          })
        }
      } else if (
        atom.implementationLevel !== "native-like"
        || atom.exactDiffStatus !== "exact-diff-partial"
        || atom.nativeParityClaim !== false
        || !atom.atomID.endsWith(".native-like")
      ) {
        issues.push({
          id: "runtime-acceptance-native-like.atom-native-claim",
          atomID: atom.atomID,
          product,
          message: `${atom.atomID} must remain native-like partial evidence, not native parity.`,
        })
      }
      if (!nativeDescriptor && (!atom.evidenceRefs.some((ref) => ref.includes("runtime-acceptance-lifecycle")) || !atom.evidenceRefs.some((ref) => ref.includes("runtime-acceptance-persistence-cleanup")))) {
        issues.push({
          id: "runtime-acceptance-native-like.evidence",
          atomID: atom.atomID,
          product,
          message: `${atom.atomID} no longer exposes lifecycle and persistence/cleanup evidence refs.`,
        })
      }
      if (!nativeDescriptor && (!atom.fixtureIDs.some((fixtureID) => fixtureID.includes("timing-boundary")) || !atom.fixtureIDs.some((fixtureID) => fixtureID.includes("persistence-cleanup")))) {
        issues.push({
          id: "runtime-acceptance-native-like.fixtures",
          atomID: atom.atomID,
          product,
          message: `${atom.atomID} no longer exposes timing and persistence/cleanup fixture refs.`,
        })
      }
      if (!nativeDescriptor && !atom.knownLossiness.some((lossiness) => /partial|not-replayed|not-exact|lossy/.test(lossiness))) {
        issues.push({
          id: "runtime-acceptance-native-like.lossiness",
          atomID: atom.atomID,
          product,
          message: `${atom.atomID} no longer carries runtime acceptance partial/lossy markers.`,
        })
      }
      if (!/^[a-f0-9]{16}$/.test(atom.replayFingerprint)) {
        issues.push({
          id: "runtime-acceptance-native-like.replay-fingerprint",
          atomID: atom.atomID,
          product,
          message: `${atom.atomID} no longer carries a stable replay fingerprint.`,
        })
      }
    }
  }
  if (!snapshot.nativeBlockers.some((blocker) => /guard|common|readback|interrupt/.test(blocker))) {
    issues.push({
      id: "runtime-acceptance-native-like.native-blockers",
      message: "Runtime acceptance native-like guard no longer records native blockers.",
    })
  }
  if (!/partial|guard/.test(snapshot.summary) || /native parity complete|product-native complete|native complete/i.test(snapshot.summary)) {
    issues.push({
      id: "runtime-acceptance-native-like.summary",
      message: "Runtime acceptance native-like summary must describe the remaining guard artifact without complete-native wording.",
    })
  }
  if (!/^[a-f0-9]{16}$/.test(snapshot.fingerprint)) {
    issues.push({
      id: "runtime-acceptance-native-like.fingerprint",
      message: "Runtime acceptance native-like surface guard fingerprint is not stable.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function runtimeAcceptanceNativeLikeSurfaceUnique(values: string[]): string[] {
  return [...new Set(values)].filter(Boolean)
}

const runtimeAcceptanceNativeExactDescriptors = [
  ...openCodeRuntimeAcceptanceNativeDescriptors,
  ...piMonoRuntimeAcceptanceNativeDescriptors,
  ...nanobotRuntimeAcceptanceNativeDescriptors,
  ...hermesRuntimeAcceptanceNativeDescriptors,
] as const

function runtimeAcceptanceNativeExactDescriptor(atomID: string) {
  return runtimeAcceptanceNativeExactDescriptors.find((descriptor) => descriptor.id === atomID)
}

function runtimeAcceptanceNativeLikeSurfaceFingerprintObject(value: unknown): string {
  return createHash("sha256").update(runtimeAcceptanceNativeLikeSurfaceStableStringify(value)).digest("hex").slice(0, 16)
}

function runtimeAcceptanceNativeLikeSurfaceStableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(runtimeAcceptanceNativeLikeSurfaceStableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${runtimeAcceptanceNativeLikeSurfaceStableStringify(record[key])}`).join(",")}}`
}
