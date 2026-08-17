import { createHash } from "node:crypto"
import type { LegoResourceRef, LegoToolDefinition } from "@helix/contracts"
import {
  createBashTool,
  createEchoTool,
  createEditTool,
  createFindTool,
  createGrepTool,
  createLsTool,
  createReadTool,
  createSubagentTool,
  createTaskTool,
  createTodoTool,
  createWriteTool,
} from "./default-tools"

export type ToolAtomKind =
  | "tool.definition"
  | "tool.schema-adapter"
  | "tool.permission-policy"
  | "tool.executor"
  | "tool.result-normalizer"
  | "tool.audit-log"

export interface ToolAtomType {
  id: ToolAtomKind
  input: string
  output: string
  conformance: string
}

export type ToolPackID = "tool-pack.echo" | "tool-pack.filesystem" | "tool-pack.shell" | "tool-pack.meta"

export interface ToolPackCatalogEntry {
  id: ToolPackID
  tools: string[]
  atoms: ToolAtomKind[]
  resources: LegoResourceRef[]
  ports: string[]
}

export type FilesystemPortImplementation = "filesystem.local" | "filesystem.memory" | "filesystem.readonly" | "filesystem.workspace-scoped"
export type ProcessRunnerPortImplementation = "process-runner.disabled" | "process-runner.local" | "process-runner.dry-run" | "process-runner.sandbox"
export type ToolPermissionPolicyID =
  | "tool.permission.always-allow"
  | "tool.permission.always-deny"
  | "tool.permission.ask-hook"
  | "tool.permission.workspace-scoped"
  | "tool.permission.product-personality"
export type ToolSchemaAdapterID =
  | "tool.schema.json-schema"
  | "tool.schema.typebox"
  | "tool.schema.zod-compatible"
  | "tool.schema.effect-compatible"
  | "tool.schema.typescript-validator"

export const toolAtomTypes: ToolAtomType[] = [
  {
    id: "tool.definition",
    input: "tool name, description, parameters, renderer metadata",
    output: "LegoToolDefinition",
    conformance: "tools",
  },
  {
    id: "tool.schema-adapter",
    input: "product-native schema shape",
    output: "normalized tool parameter contract",
    conformance: "tools",
  },
  {
    id: "tool.permission-policy",
    input: "tool call context",
    output: "allow/deny/ask decision",
    conformance: "tools",
  },
  {
    id: "tool.executor",
    input: "approved tool call",
    output: "LegoToolResult",
    conformance: "tools",
  },
  {
    id: "tool.result-normalizer",
    input: "raw tool result",
    output: "normalized message parts and metadata",
    conformance: "tools",
  },
  {
    id: "tool.audit-log",
    input: "tool execution lifecycle event",
    output: "tool audit record",
    conformance: "tools",
  },
]

export const toolPackCatalog: ToolPackCatalogEntry[] = [
  {
    id: "tool-pack.echo",
    tools: ["echo"],
    atoms: ["tool.definition", "tool.executor", "tool.result-normalizer"],
    resources: [],
    ports: ["tool.executor"],
  },
  {
    id: "tool-pack.filesystem",
    tools: ["read", "write", "edit", "ls", "find", "grep"],
    atoms: ["tool.definition", "tool.schema-adapter", "tool.permission-policy", "tool.executor", "tool.result-normalizer", "tool.audit-log"],
    resources: [{ id: "filesystem", mode: "write", scope: "workspace" }],
    ports: ["filesystem.port", "tool.permission-policy", "tool.executor"],
  },
  {
    id: "tool-pack.shell",
    tools: ["bash"],
    atoms: ["tool.definition", "tool.schema-adapter", "tool.permission-policy", "tool.executor", "tool.result-normalizer", "tool.audit-log"],
    resources: [{ id: "shell", mode: "execute", scope: "process" }],
    ports: ["process-runner.port", "tool.permission-policy", "tool.executor"],
  },
  {
    id: "tool-pack.meta",
    tools: ["todo", "task", "subagent"],
    atoms: ["tool.definition", "tool.executor", "tool.result-normalizer", "tool.audit-log"],
    resources: [],
    ports: ["tool.executor", "subagent.runner"],
  },
]

export const filesystemPortImplementations: FilesystemPortImplementation[] = [
  "filesystem.local",
  "filesystem.memory",
  "filesystem.readonly",
  "filesystem.workspace-scoped",
]

export const processRunnerPortImplementations: ProcessRunnerPortImplementation[] = [
  "process-runner.disabled",
  "process-runner.local",
  "process-runner.dry-run",
  "process-runner.sandbox",
]

export const toolPermissionPolicies: ToolPermissionPolicyID[] = [
  "tool.permission.always-allow",
  "tool.permission.always-deny",
  "tool.permission.ask-hook",
  "tool.permission.workspace-scoped",
  "tool.permission.product-personality",
]

export const toolSchemaAdapters: ToolSchemaAdapterID[] = [
  "tool.schema.json-schema",
  "tool.schema.typebox",
  "tool.schema.zod-compatible",
  "tool.schema.effect-compatible",
  "tool.schema.typescript-validator",
]

export function createToolPackTools(packID: ToolPackID): LegoToolDefinition[] {
  switch (packID) {
    case "tool-pack.echo":
      return [createEchoTool()]
    case "tool-pack.filesystem":
      return [
        createReadTool() as LegoToolDefinition,
        createWriteTool() as LegoToolDefinition,
        createEditTool() as LegoToolDefinition,
        createLsTool() as LegoToolDefinition,
        createFindTool() as LegoToolDefinition,
        createGrepTool() as LegoToolDefinition,
      ]
    case "tool-pack.shell":
      return [createBashTool() as LegoToolDefinition]
    case "tool-pack.meta":
      return [createTodoTool() as LegoToolDefinition, createTaskTool() as LegoToolDefinition, createSubagentTool() as LegoToolDefinition]
  }
}

export function createDefaultToolPacks(): Record<ToolPackID, LegoToolDefinition[]> {
  return Object.fromEntries(toolPackCatalog.map((pack) => [pack.id, createToolPackTools(pack.id)])) as Record<ToolPackID, LegoToolDefinition[]>
}

export interface ToolPublicAtomSurfaceAtomRef {
  atomID: ToolAtomKind
  exposure: "partial-lossy-atom"
  exactDiffStatus: "exact-diff-partial"
  nativeParityClaim: false
  cadenceRisk: string[]
  knownLossiness: string[]
}

export interface ToolPublicAtomSurfacePackRef {
  packID: ToolPackID
  tools: string[]
  atoms: ToolAtomKind[]
  ports: string[]
  exposure: "partial-lossy-pack"
  exactDiffStatus: "exact-diff-partial"
  nativeParityClaim: false
  knownLossiness: string[]
}

export interface ToolPublicAtomSurfaceGuardSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:tool-public-atom-surface-guard"
  fixtureID: "tool:public-atom-surface-guard"
  fixtureDiffTarget: "cadence.event-timing-replay"
  exactDiffStatus: "exact-diff-partial"
  nativeParityClaim: false
  atomRefs: ToolPublicAtomSurfaceAtomRef[]
  packRefs: ToolPublicAtomSurfacePackRef[]
  nativeBlockers: string[]
  summary: string
  fingerprint: string
}

export interface ToolPublicAtomSurfaceGuardIssue {
  id: string
  atomID?: ToolAtomKind
  packID?: ToolPackID
  message: string
}

export interface ToolPublicAtomSurfaceGuardVerification {
  ok: boolean
  issues: ToolPublicAtomSurfaceGuardIssue[]
}

export function buildToolPublicAtomSurfaceGuardSnapshot(): ToolPublicAtomSurfaceGuardSnapshot {
  const atomRefs = toolAtomTypes.map((atom): ToolPublicAtomSurfaceAtomRef => ({
    atomID: atom.id,
    exposure: "partial-lossy-atom",
    exactDiffStatus: "exact-diff-partial",
    nativeParityClaim: false,
    cadenceRisk: toolPublicAtomCadenceRisk(atom.id),
    knownLossiness: [
      `tool-public-atom-${atom.id.replaceAll(".", "-")}-partial-fixture`,
      "tool-public-atom-native-cadence-not-proven",
    ],
  }))
  const packRefs = toolPackCatalog.map((pack): ToolPublicAtomSurfacePackRef => ({
    packID: pack.id,
    tools: [...pack.tools],
    atoms: [...pack.atoms],
    ports: [...pack.ports],
    exposure: "partial-lossy-pack",
    exactDiffStatus: "exact-diff-partial",
    nativeParityClaim: false,
    knownLossiness: [
      `tool-public-pack-${pack.id.replaceAll(".", "-")}-partial-fixture`,
      "tool-public-pack-native-batch-order-not-proven",
    ],
  }))
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:tool-public-atom-surface-guard" as const,
    fixtureID: "tool:public-atom-surface-guard" as const,
    fixtureDiffTarget: "cadence.event-timing-replay" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    nativeParityClaim: false as const,
    atomRefs,
    packRefs,
    nativeBlockers: [
      "native-tool-schema-shape:not-proven",
      "native-permission-decision-side-effects:not-proven",
      "native-progress-event-order:not-proven",
      "native-result-envelope-writeback:not-proven",
      "native-tool-pack-batch-order:not-proven",
    ],
    summary: "Tool public atoms and packs expose partial/lossy cadence evidence only; native schema, permission, progress, result envelope, writeback, and pack batch ordering still need exact fixtures.",
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: toolPublicAtomSurfaceFingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyToolPublicAtomSurfaceGuardSnapshot(
  snapshot: ToolPublicAtomSurfaceGuardSnapshot,
): ToolPublicAtomSurfaceGuardVerification {
  const issues: ToolPublicAtomSurfaceGuardIssue[] = []
  if (snapshot.exactDiffStatus !== "exact-diff-partial" || snapshot.nativeParityClaim !== false) {
    issues.push({
      id: "tool-public-atom.native-claim",
      message: "Tool public atom surface must remain exact-diff-partial and cannot claim native parity.",
    })
  }
  for (const atomID of toolAtomTypes.map((atom) => atom.id)) {
    const ref = snapshot.atomRefs.find((item) => item.atomID === atomID)
    if (!ref) {
      issues.push({
        id: "tool-public-atom.missing-atom",
        atomID,
        message: `${atomID} is no longer represented in the tool public atom surface guard.`,
      })
      continue
    }
    if (ref.exposure !== "partial-lossy-atom" || ref.exactDiffStatus !== "exact-diff-partial" || ref.nativeParityClaim !== false) {
      issues.push({
        id: "tool-public-atom.atom-native-claim",
        atomID,
        message: `${atomID} must remain a partial/lossy public atom surface.`,
      })
    }
    if (!ref.cadenceRisk.some((risk) => /schema|permission|executor|result|audit|order|writeback|side-effects/.test(risk))) {
      issues.push({
        id: "tool-public-atom.cadence-risk",
        atomID,
        message: `${atomID} no longer records cadence/tool timing risk.`,
      })
    }
    if (!toolPublicAtomSurfaceHasLossiness(ref.knownLossiness)) {
      issues.push({
        id: "tool-public-atom.lossiness",
        atomID,
        message: `${atomID} no longer carries partial/lossy evidence markers.`,
      })
    }
  }
  for (const packID of toolPackCatalog.map((pack) => pack.id)) {
    const ref = snapshot.packRefs.find((item) => item.packID === packID)
    if (!ref) {
      issues.push({
        id: "tool-public-atom.missing-pack",
        packID,
        message: `${packID} is no longer represented in the tool public atom surface guard.`,
      })
      continue
    }
    if (ref.exposure !== "partial-lossy-pack" || ref.exactDiffStatus !== "exact-diff-partial" || ref.nativeParityClaim !== false) {
      issues.push({
        id: "tool-public-atom.pack-native-claim",
        packID,
        message: `${packID} must remain a partial/lossy public pack surface.`,
      })
    }
    if (ref.tools.length === 0 || ref.atoms.length === 0 || ref.ports.length === 0) {
      issues.push({
        id: "tool-public-atom.pack-coverage",
        packID,
        message: `${packID} no longer lists tool, atom, and port coverage.`,
      })
    }
    if (!toolPublicAtomSurfaceHasLossiness(ref.knownLossiness)) {
      issues.push({
        id: "tool-public-atom.pack-lossiness",
        packID,
        message: `${packID} no longer carries partial/lossy pack evidence markers.`,
      })
    }
  }
  if (!snapshot.nativeBlockers.some((blocker) => /schema|permission|progress|result|batch/.test(blocker))) {
    issues.push({
      id: "tool-public-atom.native-blockers",
      message: "Tool public atom surface guard no longer records native blockers.",
    })
  }
  if (!/partial|lossy/.test(snapshot.summary) || /native parity complete|product-native complete|native complete/i.test(snapshot.summary)) {
    issues.push({
      id: "tool-public-atom.summary",
      message: "Tool public atom surface summary must describe partial/lossy evidence without complete-native wording.",
    })
  }
  if (!/^[a-f0-9]{16}$/.test(snapshot.fingerprint)) {
    issues.push({
      id: "tool-public-atom.fingerprint",
      message: "Tool public atom surface guard fingerprint is not stable.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function toolPublicAtomCadenceRisk(atomID: ToolAtomKind): string[] {
  switch (atomID) {
    case "tool.definition":
      return ["native-tool-schema-shape", "tool-registry-definition-order"]
    case "tool.schema-adapter":
      return ["schema-validation-side-effects", "native-schema-error-shape"]
    case "tool.permission-policy":
      return ["permission-decision", "permission-ui-side-effects", "continuation-boundary"]
    case "tool.executor":
      return ["tool-batch-order", "process-side-effects", "retry-boundary"]
    case "tool.result-normalizer":
      return ["result-envelope-writeback", "provider-metadata-order"]
    case "tool.audit-log":
      return ["progress-event-order", "audit-side-effects"]
  }
}

function toolPublicAtomSurfaceHasLossiness(values: string[]): boolean {
  return values.some((value) => /partial|lossy|not-native|not-proven|not-exact|not-replayed/.test(value))
}

function toolPublicAtomSurfaceFingerprintObject(value: unknown): string {
  return createHash("sha256").update(toolPublicAtomSurfaceStableStringify(value)).digest("hex").slice(0, 16)
}

function toolPublicAtomSurfaceStableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(toolPublicAtomSurfaceStableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${toolPublicAtomSurfaceStableStringify(record[key])}`).join(",")}}`
}
