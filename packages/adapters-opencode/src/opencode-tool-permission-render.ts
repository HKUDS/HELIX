import { createHash } from "node:crypto"

export type OpenCodeToolPermissionReply = "once" | "always" | "reject"

export interface OpenCodeToolPermissionToolRef {
  messageID: string
  callID: string
}

export interface OpenCodeToolPermissionRequestInput {
  id: string
  sessionID: string
  permission: string
  patterns: string[]
  metadata: Record<string, unknown>
  always: string[]
  tool?: OpenCodeToolPermissionToolRef
}

export interface OpenCodeToolPermissionRequestRender {
  id: string
  sessionID: string
  permission: string
  patterns: string[]
  metadata: Record<string, unknown>
  always: string[]
  tool?: OpenCodeToolPermissionToolRef
}

export interface OpenCodeToolPermissionDeniedRule {
  permission: string
  pattern: string
  action: "ask" | "allow" | "deny"
}

export type OpenCodeToolPermissionRenderErrorInput =
  | { type: "rejected" }
  | { type: "corrected"; feedback: string }
  | { type: "denied"; ruleset: OpenCodeToolPermissionDeniedRule[] }
  | { type: "not-found"; requestID: string }

export interface OpenCodeToolPermissionRenderBridge {
  request(input: OpenCodeToolPermissionRequestInput): OpenCodeToolPermissionRequestRender
  error(input: OpenCodeToolPermissionRenderErrorInput): string
  reply(input: { reply: OpenCodeToolPermissionReply; message?: string }): { reply: OpenCodeToolPermissionReply; message?: string }
}

export interface OpenCodeToolPermissionRenderNativeExactFixtureCase {
  id: "request-shape-with-tool" | "rejected-error-message" | "corrected-error-message" | "denied-error-message" | "reply-body-shape"
  actual: unknown
  expected: unknown
}

export interface OpenCodeToolPermissionRenderNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.tool.permission-render-bridge"
  portID: "tool.executor"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-tool-permission-render-native-exact-fixture"
  replayRef: "tool-permission-render-native-exact:opencode"
  fixtureID: "opencode-tool-permission-render:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeToolPermissionRenderNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeToolPermissionRenderNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeToolPermissionRenderNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeToolPermissionRenderNativeExactFixtureIssue[]
}

export function createOpenCodeToolPermissionRenderBridge(): OpenCodeToolPermissionRenderBridge {
  return {
    request: openCodeToolPermissionRenderRequest,
    error: openCodeToolPermissionRenderError,
    reply: openCodeToolPermissionRenderReply,
  }
}

export function openCodeToolPermissionRenderRequest(input: OpenCodeToolPermissionRequestInput): OpenCodeToolPermissionRequestRender {
  return {
    id: input.id,
    sessionID: input.sessionID,
    permission: input.permission,
    patterns: [...input.patterns],
    metadata: openCodeToolPermissionCloneRecord(input.metadata),
    always: [...input.always],
    ...(input.tool ? { tool: { messageID: input.tool.messageID, callID: input.tool.callID } } : {}),
  }
}

export function openCodeToolPermissionRenderReply(input: { reply: OpenCodeToolPermissionReply; message?: string }): { reply: OpenCodeToolPermissionReply; message?: string } {
  return {
    reply: input.reply,
    ...(input.message === undefined ? {} : { message: input.message }),
  }
}

export function openCodeToolPermissionRenderError(input: OpenCodeToolPermissionRenderErrorInput): string {
  if (input.type === "rejected") return "The user rejected permission to use this specific tool call."
  if (input.type === "corrected") return `The user rejected permission to use this specific tool call with the following feedback: ${input.feedback}`
  if (input.type === "denied") {
    return `The user has specified a rule which prevents you from using this specific tool call. Here are some of the relevant rules ${JSON.stringify(input.ruleset)}`
  }
  return `Permission request not found: ${input.requestID}`
}

export function captureOpenCodeToolPermissionRenderNativeExactFixture(): OpenCodeToolPermissionRenderNativeExactFixture {
  const bridge = createOpenCodeToolPermissionRenderBridge()
  const request = bridge.request({
    id: "permission_01HY0000000000000000000000",
    sessionID: "ses_01HY0000000000000000000000",
    permission: "edit",
    patterns: ["src/index.ts", "src/*.ts"],
    metadata: {
      filepath: "/repo/src/index.ts",
      diff: "--- old\n+++ new",
    },
    always: ["*"],
    tool: {
      messageID: "msg_01HY0000000000000000000000",
      callID: "call_edit_1",
    },
  })
  const deniedRuleset: OpenCodeToolPermissionDeniedRule[] = [
    { permission: "edit", pattern: "src/secret.ts", action: "deny" },
    { permission: "bash", pattern: "rm -rf *", action: "deny" },
  ]
  const cases: OpenCodeToolPermissionRenderNativeExactFixtureCase[] = [
    {
      id: "request-shape-with-tool",
      actual: request,
      expected: {
        id: "permission_01HY0000000000000000000000",
        sessionID: "ses_01HY0000000000000000000000",
        permission: "edit",
        patterns: ["src/index.ts", "src/*.ts"],
        metadata: {
          filepath: "/repo/src/index.ts",
          diff: "--- old\n+++ new",
        },
        always: ["*"],
        tool: {
          messageID: "msg_01HY0000000000000000000000",
          callID: "call_edit_1",
        },
      },
    },
    {
      id: "rejected-error-message",
      actual: bridge.error({ type: "rejected" }),
      expected: "The user rejected permission to use this specific tool call.",
    },
    {
      id: "corrected-error-message",
      actual: bridge.error({ type: "corrected", feedback: "Use a narrower file path." }),
      expected: "The user rejected permission to use this specific tool call with the following feedback: Use a narrower file path.",
    },
    {
      id: "denied-error-message",
      actual: bridge.error({ type: "denied", ruleset: deniedRuleset }),
      expected: `The user has specified a rule which prevents you from using this specific tool call. Here are some of the relevant rules ${JSON.stringify(deniedRuleset)}`,
    },
    {
      id: "reply-body-shape",
      actual: [
        bridge.reply({ reply: "once" }),
        bridge.reply({ reply: "always", message: "Approved for project files." }),
        bridge.reply({ reply: "reject", message: "Do not edit secrets." }),
      ],
      expected: [
        { reply: "once" },
        { reply: "always", message: "Approved for project files." },
        { reply: "reject", message: "Do not edit secrets." },
      ],
    },
  ]

  const fixtureWithoutFingerprint: Omit<OpenCodeToolPermissionRenderNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    product: "opencode",
    atomID: "opencode.tool.permission-render-bridge",
    portID: "tool.executor",
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
    evidenceRef: "conformance:opencode-tool-permission-render-native-exact-fixture",
    replayRef: "tool-permission-render-native-exact:opencode",
    fixtureID: "opencode-tool-permission-render:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    sourceRefs: [
      "packages/opencode/src/permission/index.ts#Request,ReplyBody,RejectedError,CorrectedError,DeniedError,Permission.ask",
      "packages/opencode/src/tool/tool.ts#Context.ask",
      "packages/opencode/src/tool/shell.ts#ShellTool.ask",
      "packages/opencode/src/tool/edit.ts#ctx.ask",
    ],
    cases,
    knownLossiness: [],
  }

  return {
    ...fixtureWithoutFingerprint,
    fingerprint: openCodeToolPermissionRenderFingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeToolPermissionRenderNativeExactFixture(
  fixture: OpenCodeToolPermissionRenderNativeExactFixture,
): OpenCodeToolPermissionRenderNativeExactFixtureVerification {
  const issues: OpenCodeToolPermissionRenderNativeExactFixtureIssue[] = []
  const add = (id: string, message: string, caseID?: string) => issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  if (fixture.schemaVersion !== 1) add("opencode-tool-permission-render-native-exact.schema", "Fixture must use schema version 1.")
  if (fixture.atomID !== "opencode.tool.permission-render-bridge" || fixture.portID !== "tool.executor") {
    add("opencode-tool-permission-render-native-exact.target", "Fixture must target opencode.tool.permission-render-bridge and tool.executor.")
  }
  if (!fixture.nativeParityClaim || fixture.exactDiffStatus !== "native-exact") {
    add("opencode-tool-permission-render-native-exact.native-claim", "Permission render fixture must retain native exact status.")
  }
  if (fixture.knownLossiness.length !== 0) {
    add("opencode-tool-permission-render-native-exact.lossiness", "Native permission render fixture cannot retain known lossiness.")
  }
  for (const source of ["packages/opencode/src/permission/index.ts", "packages/opencode/src/tool/tool.ts"]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) add("opencode-tool-permission-render-native-exact.source-ref", `Missing upstream source ref ${source}.`)
  }
  for (const item of fixture.cases) {
    if (!openCodeToolPermissionRenderSameJSON(item.actual, item.expected)) {
      add("opencode-tool-permission-render-native-exact.case", "Case actual output must match expected pinned upstream permission render behavior.", item.id)
    }
  }
  const withoutFingerprint = { ...fixture }
  delete (withoutFingerprint as Partial<OpenCodeToolPermissionRenderNativeExactFixture>).fingerprint
  if (fixture.fingerprint !== openCodeToolPermissionRenderFingerprintObject(withoutFingerprint)) {
    add("opencode-tool-permission-render-native-exact.fingerprint", "Fixture fingerprint must match canonical content.")
  }
  return { ok: issues.length === 0, issues }
}

function openCodeToolPermissionCloneRecord(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
}

function openCodeToolPermissionRenderSameJSON(left: unknown, right: unknown): boolean {
  return openCodeToolPermissionRenderStableJSON(left) === openCodeToolPermissionRenderStableJSON(right)
}

function openCodeToolPermissionRenderFingerprintObject(value: unknown): string {
  return createHash("sha256").update(openCodeToolPermissionRenderStableJSON(value)).digest("hex").slice(0, 16)
}

function openCodeToolPermissionRenderStableJSON(value: unknown): string {
  return JSON.stringify(openCodeToolPermissionRenderSortStable(value))
}

function openCodeToolPermissionRenderSortStable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(openCodeToolPermissionRenderSortStable)
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, openCodeToolPermissionRenderSortStable(entry)]),
    )
  }
  return value
}
