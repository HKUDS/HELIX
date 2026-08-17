import { createHash } from "node:crypto"

export interface OpenCodeToolDefinitionPluginHookInput {
  toolID: string
}

export interface OpenCodeToolDefinitionPluginHookOutput {
  description: string
  parameters: unknown
  jsonSchema?: unknown
}

export interface OpenCodeToolDefinitionPluginHookRecord {
  "tool.definition"?: (
    input: OpenCodeToolDefinitionPluginHookInput,
    output: OpenCodeToolDefinitionPluginHookOutput,
  ) => Promise<void> | void
}

export interface OpenCodeToolDefinitionPluginTool {
  id: string
  description: string
  parameters: unknown
  jsonSchema?: unknown
}

export interface OpenCodeToolDefinitionPluginProjectedTool {
  id: string
  description: string
  parameters: unknown
  jsonSchema?: unknown
}

export interface OpenCodeToolDefinitionPluginBridge {
  apply(input: {
    tool: OpenCodeToolDefinitionPluginTool
    hooks: OpenCodeToolDefinitionPluginHookRecord[]
    appendDescription?: Array<string | undefined>
  }): Promise<OpenCodeToolDefinitionPluginProjectedTool>
}

export interface OpenCodeToolDefinitionPluginNativeExactFixtureCase {
  id: "no-hook-retains-json-schema" | "source-order-mutable-output" | "json-schema-override" | "fail-fast-error"
  actual: unknown
  expected: unknown
}

export interface OpenCodeToolDefinitionPluginNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.tool.definition-plugin-bridge"
  portID: "tool.definition"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-tool-definition-plugin-native-exact-fixture"
  replayRef: "tool-definition-plugin-native-exact:opencode"
  fixtureID: "opencode-tool-definition-plugin:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeToolDefinitionPluginNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeToolDefinitionPluginNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeToolDefinitionPluginNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeToolDefinitionPluginNativeExactFixtureIssue[]
}

export function createOpenCodeToolDefinitionPluginBridge(): OpenCodeToolDefinitionPluginBridge {
  return {
    apply: openCodeToolDefinitionPluginApply,
  }
}

export async function openCodeToolDefinitionPluginApply(input: {
  tool: OpenCodeToolDefinitionPluginTool
  hooks: OpenCodeToolDefinitionPluginHookRecord[]
  appendDescription?: Array<string | undefined>
}): Promise<OpenCodeToolDefinitionPluginProjectedTool> {
  const output: OpenCodeToolDefinitionPluginHookOutput = {
    description: input.tool.description,
    parameters: input.tool.parameters,
    jsonSchema: input.tool.jsonSchema,
  }

  for (const hook of input.hooks) {
    const fn = hook["tool.definition"]
    if (!fn) continue
    await fn({ toolID: input.tool.id }, output)
  }

  const description = [output.description, ...(input.appendDescription ?? [])].filter(Boolean).join("\n")
  const jsonSchema =
    output.parameters === input.tool.parameters || output.jsonSchema !== input.tool.jsonSchema
      ? output.jsonSchema
      : undefined

  return omitUndefined({
    id: input.tool.id,
    description,
    parameters: output.parameters,
    jsonSchema,
  })
}

export async function captureOpenCodeToolDefinitionPluginNativeExactFixture(): Promise<OpenCodeToolDefinitionPluginNativeExactFixture> {
  const bridge = createOpenCodeToolDefinitionPluginBridge()
  const baseTool: OpenCodeToolDefinitionPluginTool = {
    id: "bash",
    description: "Run a shell command",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string" },
      },
      required: ["command"],
    },
    jsonSchema: {
      type: "object",
      properties: {
        command: { type: "string" },
      },
      required: ["command"],
      additionalProperties: false,
    },
  }
  const cases: OpenCodeToolDefinitionPluginNativeExactFixtureCase[] = []

  const noHookActual = await bridge.apply({ tool: baseTool, hooks: [{}, {}] })
  cases.push({
    id: "no-hook-retains-json-schema",
    actual: noHookActual,
    expected: cloneForFixture(baseTool),
  })

  const sourceOrderLog: string[] = []
  const replacedParameters = {
    type: "object",
    properties: {
      command: { type: "string" },
      timeout: { type: "number" },
    },
    required: ["command"],
  }
  const sourceOrderActual = await bridge.apply({
    tool: baseTool,
    hooks: [
      {
        "tool.definition": async (hookInput, output) => {
          sourceOrderLog.push(`first:${hookInput.toolID}:${output.description}`)
          output.description = "First plugin description"
          output.parameters = replacedParameters
        },
      },
      {},
      {
        "tool.definition": (hookInput, output) => {
          sourceOrderLog.push(`second:${hookInput.toolID}:${output.description}`)
          output.description = `${output.description} + second plugin`
        },
      },
    ],
    appendDescription: ["Available agent types and the tools they have access to:"],
  })
  cases.push({
    id: "source-order-mutable-output",
    actual: { tool: sourceOrderActual, hookLog: sourceOrderLog },
    expected: {
      tool: {
        id: "bash",
        description: "First plugin description + second plugin\nAvailable agent types and the tools they have access to:",
        parameters: replacedParameters,
      },
      hookLog: ["first:bash:Run a shell command", "second:bash:First plugin description"],
    },
  })

  const jsonSchemaOverride = {
    type: "object",
    properties: {
      command: { type: "string", minLength: 1 },
    },
    required: ["command"],
  }
  const jsonSchemaOverrideActual = await bridge.apply({
    tool: baseTool,
    hooks: [
      {
        "tool.definition": (_hookInput, output) => {
          output.description = "Schema-overridden command"
          output.jsonSchema = jsonSchemaOverride
        },
      },
    ],
  })
  cases.push({
    id: "json-schema-override",
    actual: jsonSchemaOverrideActual,
    expected: {
      id: "bash",
      description: "Schema-overridden command",
      parameters: baseTool.parameters,
      jsonSchema: jsonSchemaOverride,
    },
  })

  const failureLog: string[] = []
  let failureActual: unknown
  try {
    await bridge.apply({
      tool: baseTool,
      hooks: [
        {
          "tool.definition": () => {
            failureLog.push("first")
          },
        },
        {
          "tool.definition": () => {
            failureLog.push("second")
            throw new Error("definition plugin failed")
          },
        },
        {
          "tool.definition": () => {
            failureLog.push("third")
          },
        },
      ],
    })
    failureActual = { threw: false, hookLog: failureLog }
  } catch (error) {
    failureActual = { threw: true, message: error instanceof Error ? error.message : String(error), hookLog: failureLog }
  }
  cases.push({
    id: "fail-fast-error",
    actual: failureActual,
    expected: { threw: true, message: "definition plugin failed", hookLog: ["first", "second"] },
  })

  const fixtureWithoutFingerprint: Omit<OpenCodeToolDefinitionPluginNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    product: "opencode",
    atomID: "opencode.tool.definition-plugin-bridge",
    portID: "tool.definition",
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
    evidenceRef: "conformance:opencode-tool-definition-plugin-native-exact-fixture",
    replayRef: "tool-definition-plugin-native-exact:opencode",
    fixtureID: "opencode-tool-definition-plugin:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    sourceRefs: [
      "packages/opencode/src/tool/registry.ts#ToolRegistry.tools,plugin.trigger,tool.definition,jsonSchema",
      "packages/opencode/src/plugin/index.ts#Plugin.trigger,Plugin.list,source-order",
      "packages/plugin/src/index.ts#Hooks.tool.definition",
    ],
    cases,
    knownLossiness: [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeToolDefinitionPluginNativeExactFixture(
  fixture: OpenCodeToolDefinitionPluginNativeExactFixture,
): OpenCodeToolDefinitionPluginNativeExactFixtureVerification {
  const issues: OpenCodeToolDefinitionPluginNativeExactFixtureIssue[] = []
  const expectedCaseIDs: OpenCodeToolDefinitionPluginNativeExactFixtureCase["id"][] = [
    "no-hook-retains-json-schema",
    "source-order-mutable-output",
    "json-schema-override",
    "fail-fast-error",
  ]

  function addIssue(id: string, message: string, caseID?: string) {
    issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  }

  if (fixture.schemaVersion !== 1 || fixture.product !== "opencode" || fixture.atomID !== "opencode.tool.definition-plugin-bridge") {
    addIssue("opencode-tool-definition-plugin.identity", "OpenCode tool definition plugin fixture identity changed.")
  }
  if (fixture.portID !== "tool.definition" || fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    addIssue("opencode-tool-definition-plugin.native-claim", "OpenCode tool definition plugin fixture must remain a native-exact tool.definition proof.")
  }
  if (fixture.knownLossiness.length !== 0) {
    addIssue("opencode-tool-definition-plugin.lossiness", "Native exact OpenCode tool definition plugin fixture must not retain known lossiness.")
  }
  for (const expectedID of expectedCaseIDs) {
    const testCase = fixture.cases.find((candidate) => candidate.id === expectedID)
    if (!testCase) {
      addIssue("opencode-tool-definition-plugin.case-missing", `Missing ${expectedID} fixture case.`, expectedID)
      continue
    }
    if (stableStringify(testCase.actual) !== stableStringify(testCase.expected)) {
      addIssue("opencode-tool-definition-plugin.case-drift", `OpenCode tool definition plugin case ${expectedID} no longer matches expected native behavior.`, expectedID)
    }
  }
  if (!fixture.sourceRefs.some((ref) => ref.includes("packages/opencode/src/tool/registry.ts")) || !fixture.sourceRefs.some((ref) => ref.includes("packages/plugin/src/index.ts"))) {
    addIssue("opencode-tool-definition-plugin.source-refs", "OpenCode tool definition plugin fixture must keep pinned upstream tool registry and plugin hook source refs.")
  }
  const fingerprint = fixture.fingerprint
  const { fingerprint: _ignored, ...withoutFingerprint } = fixture
  if (fingerprint !== fingerprintObject(withoutFingerprint)) {
    addIssue("opencode-tool-definition-plugin.fingerprint", "OpenCode tool definition plugin fixture fingerprint no longer matches its content.")
  }

  return { ok: issues.length === 0, issues }
}

function omitUndefined<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as T
}

function cloneForFixture<T>(input: T): T {
  return JSON.parse(JSON.stringify(input)) as T
}

function fingerprintObject(input: unknown): string {
  return createHash("sha256").update(stableStringify(input)).digest("hex").slice(0, 16)
}

function stableStringify(input: unknown): string {
  return JSON.stringify(sortForStableStringify(input))
}

function sortForStableStringify(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(sortForStableStringify)
  if (!input || typeof input !== "object") return input
  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>)
      .filter(([, value]) => value !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [key, sortForStableStringify(value)]),
  )
}
