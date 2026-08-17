import { createHash } from "node:crypto"

export const nanobotRuntimeAcceptanceUpstreamRef = "github:HKUDS/nanobot@c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7"
export const nanobotRuntimeAcceptanceControllerNativeExactAtomID = "nanobot.runtime.acceptance-controller.native-like"
export const nanobotRuntimeAcceptanceEvidenceNativeExactAtomID = "nanobot.runtime.acceptance-evidence.native-like"
export const nanobotRuntimeAcceptanceNativeExactAtomIDs = [
  nanobotRuntimeAcceptanceControllerNativeExactAtomID,
  nanobotRuntimeAcceptanceEvidenceNativeExactAtomID,
] as const
export const nanobotRuntimeAcceptanceNativeExactFixtureID = "nanobot-runtime-acceptance:native-exact-fixture"
export const nanobotRuntimeAcceptanceNativeExactEvidenceRef = "conformance:nanobot-runtime-acceptance-native-exact-fixture"
export const nanobotRuntimeAcceptanceNativeExactReplayRef = "runtime-acceptance-native-exact:nanobot"

export type NanobotRuntimeAcceptanceNativeExactAtomID = (typeof nanobotRuntimeAcceptanceNativeExactAtomIDs)[number]
export type NanobotRuntimeAcceptancePortID = "runtime.acceptance-controller" | "runtime.acceptance-evidence"
export type NanobotRuntimeAcceptanceNativeScenarioID =
  | "empty-tool-result-normalization"
  | "finalization-and-length-recovery-prompts"
  | "external-lookup-repeat-budget"
  | "workspace-violation-hard-boundary"
  | "runtime-state-protocol-surface"

export interface NanobotRuntimeAcceptanceNativeDescriptor {
  id: NanobotRuntimeAcceptanceNativeExactAtomID
  port: NanobotRuntimeAcceptancePortID
  product: "nanobot"
  implementationKind: "factory"
  selectionReason: string
  parityCoverage: "native"
  nativeEvidenceRefs: [typeof nanobotRuntimeAcceptanceNativeExactEvidenceRef, typeof nanobotRuntimeAcceptanceNativeExactReplayRef]
  fixtureIDs: [typeof nanobotRuntimeAcceptanceNativeExactFixtureID]
  knownLossiness: []
}

export interface NanobotRuntimeAcceptanceNativeExactCase {
  scenarioID: NanobotRuntimeAcceptanceNativeScenarioID
  input: Record<string, unknown>
  output: Record<string, unknown>
  upstreamBehavior: string
}

export interface NanobotRuntimeAcceptanceNativeExactFixture {
  schemaVersion: 1
  product: "nanobot"
  atomIDs: typeof nanobotRuntimeAcceptanceNativeExactAtomIDs
  portIDs: readonly ["runtime.acceptance-controller", "runtime.acceptance-evidence"]
  upstreamRef: typeof nanobotRuntimeAcceptanceUpstreamRef
  evidenceRef: typeof nanobotRuntimeAcceptanceNativeExactEvidenceRef
  fixtureID: typeof nanobotRuntimeAcceptanceNativeExactFixtureID
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  policy: {
    emptyToolResultsBecomePromptSafeMarker: true
    blankTextTriggersFinalizationRecovery: true
    lengthRecoveryContinuesWithoutRecap: true
    externalLookupThrottleAfterThirdSameSignature: true
    workspaceBoundaryEscalatesAfterThirdNormalizedTarget: true
    runtimeStateProtocolExposesMutableRuntimeLimits: true
  }
  cases: NanobotRuntimeAcceptanceNativeExactCase[]
  sourceRefs: string[]
  nativeEvidenceRefs: string[]
  fixtureIDs: string[]
  knownLossiness: []
  descriptors: readonly NanobotRuntimeAcceptanceNativeDescriptor[]
  intentionallyBridgeAtoms: readonly []
  fingerprint: string
}

export interface NanobotRuntimeAcceptanceNativeExactIssue {
  id: string
  message: string
}

export interface NanobotRuntimeAcceptanceNativeExactVerification {
  ok: boolean
  issues: NanobotRuntimeAcceptanceNativeExactIssue[]
}

function nanobotRuntimeAcceptancePortForAtomID(id: NanobotRuntimeAcceptanceNativeExactAtomID): NanobotRuntimeAcceptancePortID {
  return id === nanobotRuntimeAcceptanceControllerNativeExactAtomID
    ? "runtime.acceptance-controller"
    : "runtime.acceptance-evidence"
}

export const nanobotRuntimeAcceptanceNativeDescriptors = nanobotRuntimeAcceptanceNativeExactAtomIDs.map((id): NanobotRuntimeAcceptanceNativeDescriptor => ({
  id,
  port: nanobotRuntimeAcceptancePortForAtomID(id),
  product: "nanobot",
  implementationKind: "factory",
  selectionReason: "Nanobot upstream native implementation for runtime acceptance behavior from runtime.py and RuntimeState: empty tool-result repair, finalization and length recovery prompts, repeat lookup/workspace violation throttles, and live runtime state protocol.",
  parityCoverage: "native",
  nativeEvidenceRefs: [nanobotRuntimeAcceptanceNativeExactEvidenceRef, nanobotRuntimeAcceptanceNativeExactReplayRef],
  fixtureIDs: [nanobotRuntimeAcceptanceNativeExactFixtureID],
  knownLossiness: [],
}))

export const nanobotRuntimeAcceptanceNativeDescriptorByAtomID = Object.fromEntries(
  nanobotRuntimeAcceptanceNativeDescriptors.map((descriptor) => [descriptor.id, descriptor]),
) as Record<NanobotRuntimeAcceptanceNativeExactAtomID, NanobotRuntimeAcceptanceNativeDescriptor>

export function projectNanobotRuntimeToolResult(toolName: string, content: unknown): string {
  const text = nanobotToolResultText(content)
  return nanobotIsBlankText(text)
    ? `Tool ${toolName} returned no visible content.`
    : text
}

export function projectNanobotExternalLookupAttempts(
  attempts: Array<{ toolName: string; args: Record<string, unknown> }>,
): Array<{ signature: string; count: number; decision: "allow" | "block"; error?: string }> {
  const counts = new Map<string, number>()
  return attempts.map((attempt) => {
    const signature = nanobotExternalLookupSignature(attempt.toolName, attempt.args)
    const count = (counts.get(signature) ?? 0) + 1
    counts.set(signature, count)
    return count > 2
      ? {
        signature,
        count,
        decision: "block" as const,
        error: "Repeated external lookup detected. Stop retrying the same external lookup and use the existing result or ask for different input.",
      }
      : { signature, count, decision: "allow" as const }
  })
}

export function projectNanobotWorkspaceViolationAttempts(
  attempts: Array<{ toolName: string; args: Record<string, unknown> }>,
): Array<{ signature: string; count: number; decision: "allow" | "block"; error?: string }> {
  const counts = new Map<string, number>()
  return attempts.map((attempt) => {
    const signature = nanobotWorkspaceViolationSignature(attempt.toolName, attempt.args)
    const count = (counts.get(signature) ?? 0) + 1
    counts.set(signature, count)
    return count > 2
      ? {
        signature,
        count,
        decision: "block" as const,
        error: "Repeated workspace boundary violation detected. Stop accessing paths outside the workspace and explain the boundary to the user.",
      }
      : { signature, count, decision: "allow" as const }
  })
}

export function buildNanobotRuntimeStateProtocolSnapshot(): Record<string, unknown> {
  return {
    protocolClass: "RuntimeState",
    properties: [
      "model",
      "max_iterations",
      "current_iteration",
      "tool_names",
      "workspace",
      "provider_retry_mode",
      "max_tool_result_chars",
      "context_window_tokens",
      "web_config",
      "exec_config",
      "subagents",
      "model_preset",
    ],
    mutableRuntimeFields: ["_runtime_vars", "_last_usage"],
    subagentLimitSyncHook: "_sync_subagent_runtime_limits",
    runtimeVarsRoundTrip: {
      set: ["workspace_policy", "remaining_iterations"],
      get: ["workspace_policy", "remaining_iterations"],
    },
    usageRoundTrip: {
      lastUsageField: "_last_usage",
      projectedKeys: ["input_tokens", "output_tokens", "total_tokens"],
    },
  }
}

export function buildNanobotRuntimeAcceptanceNativeExactFixture(): NanobotRuntimeAcceptanceNativeExactFixture {
  const lookupAttempts = projectNanobotExternalLookupAttempts([
    { toolName: "web_search", args: { query: "runtime acceptance" } },
    { toolName: "web_search", args: { query: "runtime acceptance" } },
    { toolName: "web_search", args: { query: "runtime acceptance" } },
  ])
  const workspaceViolationAttempts = projectNanobotWorkspaceViolationAttempts([
    { toolName: "read_file", args: { path: "/etc/passwd" } },
    { toolName: "read_file", args: { path: "/etc/passwd/" } },
    { toolName: "shell", args: { command: "cat /etc/passwd" } },
  ])
  const cases: NanobotRuntimeAcceptanceNativeExactCase[] = [
    {
      scenarioID: "empty-tool-result-normalization",
      input: {
        toolResults: [
          { toolName: "shell", content: "" },
          { toolName: "read_file", content: [{ type: "text", text: "   " }] },
          { toolName: "web_search", content: "result body" },
        ],
      },
      output: {
        normalized: [
          projectNanobotRuntimeToolResult("shell", ""),
          projectNanobotRuntimeToolResult("read_file", [{ type: "text", text: "   " }]),
          projectNanobotRuntimeToolResult("web_search", "result body"),
        ],
        blankInputsDetected: ["empty-string", "blank-text-block"],
      },
      upstreamBehavior: "ensure_nonempty_tool_result converts empty or blank visible text into a synthetic visible marker so downstream finalization never sees a silent tool result.",
    },
    {
      scenarioID: "finalization-and-length-recovery-prompts",
      input: {
        stopReasons: ["empty-final-answer", "length"],
        lastVisibleText: "",
      },
      output: {
        finalizationRetryPrompt: "Your final answer was empty. Provide the final response now using the available tool results.",
        lengthRecoveryPrompt: "Output limit reached. Continue exactly where you left off with no recap and no apology.",
        retryPromptWhenBlankText: true,
        continuesWithoutRecap: true,
      },
      upstreamBehavior: "runtime.py treats blank visible assistant text as a failed finalization and uses a separate length-recovery prompt that continues from the cutoff instead of restarting or summarizing.",
    },
    {
      scenarioID: "external-lookup-repeat-budget",
      input: {
        maxRepeatExternalLookups: 2,
        attempts: [
          { toolName: "web_search", args: { query: "runtime acceptance" } },
          { toolName: "web_search", args: { query: "runtime acceptance" } },
          { toolName: "web_search", args: { query: "runtime acceptance" } },
        ],
      },
      output: {
        attempts: lookupAttempts,
        blockedAttempt: lookupAttempts[2],
      },
      upstreamBehavior: "external_lookup_signature keys repeated URL or query based lookups and repeated_external_lookup_error blocks the third equivalent external lookup.",
    },
    {
      scenarioID: "workspace-violation-hard-boundary",
      input: {
        maxRepeatWorkspaceViolations: 2,
        attempts: [
          { toolName: "read_file", args: { path: "/etc/passwd" } },
          { toolName: "read_file", args: { path: "/etc/passwd/" } },
          { toolName: "shell", args: { command: "cat /etc/passwd" } },
        ],
      },
      output: {
        attempts: workspaceViolationAttempts,
        normalizedTarget: "target:/etc/passwd",
        blockedAttempt: workspaceViolationAttempts[2],
      },
      upstreamBehavior: "_normalize_violation_target collapses equivalent absolute targets before repeated_workspace_violation_error blocks further access outside the workspace.",
    },
    {
      scenarioID: "runtime-state-protocol-surface",
      input: {
        runtimeStateProtocol: "nanobot.agent.tools.runtime_state.RuntimeState",
        subagents: ["researcher", "coder"],
      },
      output: buildNanobotRuntimeStateProtocolSnapshot(),
      upstreamBehavior: "RuntimeState exposes live model, iteration, tool, workspace, provider retry, tool-result, context, web/exec, subagent, runtime vars, usage, and model preset state plus a subagent limit sync hook.",
    },
  ]
  const snapshotWithoutFingerprint: Omit<NanobotRuntimeAcceptanceNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1 as const,
    product: "nanobot" as const,
    atomIDs: [...nanobotRuntimeAcceptanceNativeExactAtomIDs] as typeof nanobotRuntimeAcceptanceNativeExactAtomIDs,
    portIDs: ["runtime.acceptance-controller", "runtime.acceptance-evidence"] as const,
    upstreamRef: nanobotRuntimeAcceptanceUpstreamRef,
    evidenceRef: nanobotRuntimeAcceptanceNativeExactEvidenceRef,
    fixtureID: nanobotRuntimeAcceptanceNativeExactFixtureID,
    exactDiffStatus: "native-exact" as const,
    nativeParityClaim: true as const,
    policy: {
      emptyToolResultsBecomePromptSafeMarker: true as const,
      blankTextTriggersFinalizationRecovery: true as const,
      lengthRecoveryContinuesWithoutRecap: true as const,
      externalLookupThrottleAfterThirdSameSignature: true as const,
      workspaceBoundaryEscalatesAfterThirdNormalizedTarget: true as const,
      runtimeStateProtocolExposesMutableRuntimeLimits: true as const,
    },
    cases,
    sourceRefs: [
      "nanobot/utils/runtime.py#empty_tool_result_message,ensure_nonempty_tool_result,is_blank_text,build_finalization_retry_message,build_length_recovery_message,external_lookup_signature,repeated_external_lookup_error,workspace_violation_signature,_normalize_violation_target,repeated_workspace_violation_error",
      "nanobot/agent/tools/runtime_state.py#RuntimeState,model,max_iterations,current_iteration,tool_names,workspace,provider_retry_mode,max_tool_result_chars,context_window_tokens,web_config,exec_config,subagents,_runtime_vars,_last_usage,_sync_subagent_runtime_limits,model_preset",
    ],
    nativeEvidenceRefs: [nanobotRuntimeAcceptanceNativeExactEvidenceRef, nanobotRuntimeAcceptanceNativeExactReplayRef],
    fixtureIDs: [nanobotRuntimeAcceptanceNativeExactFixtureID],
    knownLossiness: [] as [],
    descriptors: nanobotRuntimeAcceptanceNativeDescriptors,
    intentionallyBridgeAtoms: [] as const,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyNanobotRuntimeAcceptanceNativeExactFixture(
  fixture: NanobotRuntimeAcceptanceNativeExactFixture,
): NanobotRuntimeAcceptanceNativeExactVerification {
  const canonical = buildNanobotRuntimeAcceptanceNativeExactFixture()
  const issues: NanobotRuntimeAcceptanceNativeExactIssue[] = []
  const addIssue = (id: string, message: string): void => {
    issues.push({ id, message })
  }
  if (fixture.fingerprint !== canonical.fingerprint || fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    addIssue("nanobot-runtime-acceptance-native-exact.fingerprint", "Fixture fingerprint no longer matches canonical Nanobot runtime acceptance behavior.")
  }
  if (
    fixture.product !== "nanobot" ||
    JSON.stringify(fixture.atomIDs) !== JSON.stringify(nanobotRuntimeAcceptanceNativeExactAtomIDs) ||
    JSON.stringify(fixture.portIDs) !== JSON.stringify(["runtime.acceptance-controller", "runtime.acceptance-evidence"])
  ) {
    addIssue("nanobot-runtime-acceptance-native-exact.identity", "Fixture must remain scoped to Nanobot runtime acceptance controller/evidence atoms.")
  }
  if (
    fixture.upstreamRef !== nanobotRuntimeAcceptanceUpstreamRef ||
    !fixture.sourceRefs.some((ref) => ref.includes("runtime.py#empty_tool_result_message")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("repeated_external_lookup_error")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("repeated_workspace_violation_error")) ||
    !fixture.sourceRefs.some((ref) => ref.includes("runtime_state.py#RuntimeState"))
  ) {
    addIssue("nanobot-runtime-acceptance-native-exact.upstream", "Fixture must stay pinned to Nanobot runtime.py and RuntimeState upstream sources.")
  }
  if (fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    addIssue("nanobot-runtime-acceptance-native-exact.native-claim", "Nanobot runtime acceptance fixture must explicitly claim native-exact parity.")
  }
  if (fixture.knownLossiness.length !== 0 || fixture.intentionallyBridgeAtoms.length !== 0 || nanobotRuntimeAcceptanceNativeDescriptors.some((descriptor) => descriptor.knownLossiness.length !== 0)) {
    addIssue("nanobot-runtime-acceptance-native-exact.lossiness", "Native exact Nanobot runtime acceptance fixture must not carry known lossiness markers.")
  }
  if (!fixture.nativeEvidenceRefs.includes(nanobotRuntimeAcceptanceNativeExactEvidenceRef) || !fixture.nativeEvidenceRefs.includes(nanobotRuntimeAcceptanceNativeExactReplayRef)) {
    addIssue("nanobot-runtime-acceptance-native-exact.evidence", "Nanobot runtime acceptance native exact evidence refs are missing.")
  }
  if (!fixture.fixtureIDs.includes(nanobotRuntimeAcceptanceNativeExactFixtureID)) {
    addIssue("nanobot-runtime-acceptance-native-exact.fixture", "Nanobot runtime acceptance native exact fixture ID is missing.")
  }
  for (const atomID of nanobotRuntimeAcceptanceNativeExactAtomIDs) {
    const descriptor = fixture.descriptors.find((item) => item.id === atomID)
    if (!descriptor || descriptor.parityCoverage !== "native" || descriptor.implementationKind !== "factory" || descriptor.knownLossiness.length !== 0) {
      addIssue("nanobot-runtime-acceptance-native-exact.descriptor", `Descriptor for ${atomID} is not native exact.`)
    }
  }
  if (JSON.stringify(fixture.policy) !== JSON.stringify(canonical.policy)) {
    addIssue("nanobot-runtime-acceptance-native-exact.policy", "Nanobot runtime acceptance policy drifted from upstream runtime behavior.")
  }
  if (JSON.stringify(fixture.cases) !== JSON.stringify(canonical.cases)) {
    addIssue("nanobot-runtime-acceptance-native-exact.cases", "Nanobot runtime acceptance cases drifted from the native exact fixture.")
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function nanobotToolResultText(content: unknown): string {
  if (typeof content === "string") return content
  if (Array.isArray(content)) {
    const parts = content
      .map((item) => {
        if (typeof item === "string") return item
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>
          return typeof record["text"] === "string" ? record["text"] : ""
        }
        return ""
      })
      .join("")
    return parts
  }
  if (content === null || content === undefined) return ""
  return String(content)
}

function nanobotIsBlankText(value: string): boolean {
  return value.trim().length === 0
}

function nanobotExternalLookupSignature(toolName: string, args: Record<string, unknown>): string {
  const query = typeof args["query"] === "string"
    ? args["query"]
    : typeof args["search_query"] === "string"
      ? args["search_query"]
      : undefined
  const url = typeof args["url"] === "string"
    ? args["url"]
    : typeof args["href"] === "string"
      ? args["href"]
      : undefined
  return url
    ? `${toolName}:url:${url.trim().toLowerCase()}`
    : `${toolName}:query:${(query ?? stableStringify(args)).trim().toLowerCase()}`
}

function nanobotWorkspaceViolationSignature(toolName: string, args: Record<string, unknown>): string {
  void toolName
  const directTarget = ["path", "file", "file_path", "target", "source", "destination"]
    .map((key) => args[key])
    .find((value): value is string => typeof value === "string" && value.trim().length > 0)
  const commandTarget = typeof args["command"] === "string"
    ? args["command"].match(/(?:^|\s)(\/[^\s'"]+)/)?.[1]
    : undefined
  return `target:${nanobotNormalizeViolationTarget(directTarget ?? commandTarget ?? stableStringify(args))}`
}

function nanobotNormalizeViolationTarget(target: string): string {
  const trimmed = target.trim().replace(/\\/g, "/").replace(/\/+$/g, "")
  return (trimmed.length > 0 ? trimmed : "/").toLowerCase()
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}
