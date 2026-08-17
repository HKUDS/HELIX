import { createHash } from "node:crypto"

export type OpenCodeToolSchemaBridgeJSONSchemaDefinition = boolean | Record<string, unknown>
export type OpenCodeToolSchemaBridgeJSONSchema = Record<string, unknown> & {
  type?: string
  properties?: Record<string, OpenCodeToolSchemaBridgeJSONSchemaDefinition>
  required?: string[]
  definitions?: Record<string, unknown>
}

export interface OpenCodeToolSchemaBridgePluginToolDefinition {
  description: string
  args?: Record<string, unknown>
}

export interface OpenCodeToolSchemaBridgeParametersDeclare {
  kind: "Schema.declare"
  accepts: "zodParams.safeParse(u).success"
  shapeKeys: string[]
}

export interface OpenCodeToolSchemaBridgeParametersUnknown {
  kind: "Schema.Unknown"
}

export type OpenCodeToolSchemaBridgeParameters =
  | OpenCodeToolSchemaBridgeParametersDeclare
  | OpenCodeToolSchemaBridgeParametersUnknown

export interface OpenCodeToolSchemaBridgeToolDef {
  id: string
  description: string
  parameters: OpenCodeToolSchemaBridgeParameters
  jsonSchema: OpenCodeToolSchemaBridgeJSONSchema
}

export interface OpenCodeToolSchemaBridgeOptions {
  zodObject?: (shape: Record<string, unknown>) => unknown
  zodToJSONSchema?: (schema: unknown) => unknown
  schemaDeclare?: (schema: unknown, shape: Record<string, unknown>) => OpenCodeToolSchemaBridgeParametersDeclare
  schemaUnknown?: () => OpenCodeToolSchemaBridgeParametersUnknown
}

export interface OpenCodeToolSchemaBridge {
  fromPlugin(id: string, def: OpenCodeToolSchemaBridgePluginToolDefinition): OpenCodeToolSchemaBridgeToolDef
  invalidArgumentsMessage(input: { tool: string; detail: string }): string
  isZodType(value: unknown): boolean
  legacyJsonSchema(entries: [string, unknown][]): OpenCodeToolSchemaBridgeJSONSchema
}

export interface OpenCodeToolSchemaBridgeNativeExactFixtureCase {
  id:
    | "missing-args-zod-normalization"
    | "all-zod-uses-zod-json-schema"
    | "legacy-json-schema-filters-definitions"
    | "mixed-zod-falls-back-to-legacy-json-schema"
    | "zod-defs-renamed-to-definitions"
    | "invalid-arguments-message"
  actual: unknown
  expected: unknown
}

export interface OpenCodeToolSchemaBridgeNativeExactFixture {
  schemaVersion: 1
  product: "opencode"
  atomID: "opencode.tool.schema-bridge"
  portID: "tool.schema-adapter"
  upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  evidenceRef: "conformance:opencode-tool-schema-bridge-native-exact-fixture"
  replayRef: "tool-schema-bridge-native-exact:opencode"
  fixtureID: "opencode-tool-schema-bridge:native-exact-fixture"
  exactDiffStatus: "native-exact"
  nativeParityClaim: true
  sourceRefs: string[]
  cases: OpenCodeToolSchemaBridgeNativeExactFixtureCase[]
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeToolSchemaBridgeNativeExactFixtureIssue {
  id: string
  caseID?: string
  message: string
}

export interface OpenCodeToolSchemaBridgeNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeToolSchemaBridgeNativeExactFixtureIssue[]
}

export function createOpenCodeToolSchemaBridge(options: OpenCodeToolSchemaBridgeOptions = {}): OpenCodeToolSchemaBridge {
  const zodObject = options.zodObject ?? openCodeToolSchemaBridgeDefaultZodObject
  const zodToJSONSchema = options.zodToJSONSchema ?? openCodeToolSchemaBridgeDefaultZodToJSONSchema
  const schemaDeclare = options.schemaDeclare ?? openCodeToolSchemaBridgeDefaultSchemaDeclare
  const schemaUnknown = options.schemaUnknown ?? (() => ({ kind: "Schema.Unknown" as const }))

  return {
    fromPlugin(id, def) {
      const args = def.args ?? {}
      const entries = Object.entries(args)
      const allZod = entries.every((entry) => openCodeToolSchemaBridgeIsZodType(entry[1]))
      const zodParams = allZod ? zodObject(args) : undefined
      const jsonSchema = zodParams
        ? openCodeToolSchemaBridgeZodJsonSchema(zodParams, zodToJSONSchema)
        : openCodeToolSchemaBridgeLegacyJsonSchema(entries)
      const parameters = zodParams ? schemaDeclare(zodParams, args) : schemaUnknown()

      return {
        id,
        parameters,
        jsonSchema,
        description: def.description,
      }
    },
    invalidArgumentsMessage: openCodeToolSchemaBridgeInvalidArgumentsMessage,
    isZodType: openCodeToolSchemaBridgeIsZodType,
    legacyJsonSchema: openCodeToolSchemaBridgeLegacyJsonSchema,
  }
}

export function openCodeToolSchemaBridgeInvalidArgumentsMessage(input: { tool: string; detail: string }): string {
  return `The ${input.tool} tool was called with invalid arguments: ${input.detail}.\nPlease rewrite the input so it satisfies the expected schema.`
}

export function openCodeToolSchemaBridgeIsZodType(value: unknown): boolean {
  return typeof value === "object" && value !== null && "_zod" in value
}

export function openCodeToolSchemaBridgeLegacyJsonSchema(entries: [string, unknown][]): OpenCodeToolSchemaBridgeJSONSchema {
  const properties: Record<string, OpenCodeToolSchemaBridgeJSONSchemaDefinition> = {}
  for (const [key, value] of entries) {
    if (isJsonSchemaDefinition(value)) properties[key] = value
  }
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
  }
}

export function openCodeToolSchemaBridgeZodJsonSchema(
  schema: unknown,
  zodToJSONSchema: (schema: unknown) => unknown,
): OpenCodeToolSchemaBridgeJSONSchema {
  const result = normalizeZodJsonSchema(zodToJSONSchema(schema))
  if (!isJsonSchemaObject(result)) throw new Error("plugin tool Zod schema produced a non-object JSON Schema")
  const { $defs, ...rest } = result
  return (
    isJsonSchemaObject($defs)
      ? {
          ...rest,
          definitions: $defs,
        }
      : rest
  ) as OpenCodeToolSchemaBridgeJSONSchema
}

export function captureOpenCodeToolSchemaBridgeNativeExactFixture(): OpenCodeToolSchemaBridgeNativeExactFixture {
  const bridge = createOpenCodeToolSchemaBridge({
    zodObject: (shape) => ({ kind: "z.object", shape: cloneForFixture(shape) }),
    zodToJSONSchema: openCodeToolSchemaBridgeFixtureZodToJSONSchema,
  })
  const cases: OpenCodeToolSchemaBridgeNativeExactFixtureCase[] = []

  const missingArgsActual = bridge.fromPlugin("empty", {
    description: "No plugin args",
  })
  cases.push({
    id: "missing-args-zod-normalization",
    actual: missingArgsActual,
    expected: {
      id: "empty",
      description: "No plugin args",
      parameters: {
        kind: "Schema.declare",
        accepts: "zodParams.safeParse(u).success",
        shapeKeys: [],
      },
      jsonSchema: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        properties: {},
      },
    },
  })

  const zodQuery = zodFixtureArg({ description: "Search query", type: "string" })
  const zodLimit = zodFixtureArg({ type: "number" }, true)
  const allZodActual = bridge.fromPlugin("custom.search", {
    description: "Search project files",
    args: {
      query: zodQuery,
      limit: zodLimit,
    },
  })
  cases.push({
    id: "all-zod-uses-zod-json-schema",
    actual: allZodActual,
    expected: {
      id: "custom.search",
      description: "Search project files",
      parameters: {
        kind: "Schema.declare",
        accepts: "zodParams.safeParse(u).success",
        shapeKeys: ["query", "limit"],
      },
      jsonSchema: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        properties: {
          query: { description: "Search query", type: "string" },
          limit: { type: "number" },
        },
        required: ["query"],
      },
    },
  })

  const legacyActual = bridge.fromPlugin("legacy.tool", {
    description: "Legacy schema object",
    args: {
      query: { type: "string" },
      dryRun: true,
      tags: ["one", "two"],
      count: 2,
      empty: null,
    },
  })
  cases.push({
    id: "legacy-json-schema-filters-definitions",
    actual: legacyActual,
    expected: {
      id: "legacy.tool",
      description: "Legacy schema object",
      parameters: { kind: "Schema.Unknown" },
      jsonSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          dryRun: true,
        },
        required: ["query", "dryRun"],
      },
    },
  })

  const mixedActual = bridge.fromPlugin("mixed.tool", {
    description: "Mixed zod and JSON schema",
    args: {
      query: zodQuery,
      limit: { type: "number" },
    },
  })
  cases.push({
    id: "mixed-zod-falls-back-to-legacy-json-schema",
    actual: mixedActual,
    expected: {
      id: "mixed.tool",
      description: "Mixed zod and JSON schema",
      parameters: { kind: "Schema.Unknown" },
      jsonSchema: {
        type: "object",
        properties: {
          query: zodQuery,
          limit: { type: "number" },
        },
        required: ["query", "limit"],
      },
    },
  })

  const defsBridge = createOpenCodeToolSchemaBridge({
    zodObject: (shape) => ({ kind: "z.object", shape: cloneForFixture(shape), includeDefs: true }),
    zodToJSONSchema: (schema) => ({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        ref: { $ref: "#/$defs/Shared" },
      },
      required: ["ref"],
      $defs: {
        Shared: { type: "string" },
      },
      schemaID: isJsonSchemaObject(schema) && schema.includeDefs === true ? "with-defs" : "without-defs",
    }),
  })
  const defsActual = defsBridge.fromPlugin("defs.tool", {
    description: "Schema with refs",
    args: {
      ref: zodFixtureArg({ $ref: "#/$defs/Shared" }),
    },
  })
  cases.push({
    id: "zod-defs-renamed-to-definitions",
    actual: defsActual,
    expected: {
      id: "defs.tool",
      description: "Schema with refs",
      parameters: {
        kind: "Schema.declare",
        accepts: "zodParams.safeParse(u).success",
        shapeKeys: ["ref"],
      },
      jsonSchema: {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        type: "object",
        properties: {
          ref: { $ref: "#/$defs/Shared" },
        },
        required: ["ref"],
        schemaID: "with-defs",
        definitions: {
          Shared: { type: "string" },
        },
      },
    },
  })

  cases.push({
    id: "invalid-arguments-message",
    actual: bridge.invalidArgumentsMessage({ tool: "bash", detail: "Expected string, received number" }),
    expected: "The bash tool was called with invalid arguments: Expected string, received number.\nPlease rewrite the input so it satisfies the expected schema.",
  })

  const fixtureWithoutFingerprint: Omit<OpenCodeToolSchemaBridgeNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    product: "opencode",
    atomID: "opencode.tool.schema-bridge",
    portID: "tool.schema-adapter",
    upstreamRef: "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
    evidenceRef: "conformance:opencode-tool-schema-bridge-native-exact-fixture",
    replayRef: "tool-schema-bridge-native-exact:opencode",
    fixtureID: "opencode-tool-schema-bridge:native-exact-fixture",
    exactDiffStatus: "native-exact",
    nativeParityClaim: true,
    sourceRefs: [
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/tool/registry.ts#fromPlugin,isZodType,legacyJsonSchema,zodJsonSchema",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/opencode/src/tool/tool.ts#InvalidArgumentsError,define",
      "github:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab:packages/plugin/src/tool.ts#ToolDefinition,tool.schema",
    ],
    cases,
    knownLossiness: [],
  }
  return {
    ...fixtureWithoutFingerprint,
    fingerprint: fingerprintObject(fixtureWithoutFingerprint),
  }
}

export function verifyOpenCodeToolSchemaBridgeNativeExactFixture(
  fixture: OpenCodeToolSchemaBridgeNativeExactFixture,
): OpenCodeToolSchemaBridgeNativeExactFixtureVerification {
  const issues: OpenCodeToolSchemaBridgeNativeExactFixtureIssue[] = []
  const expectedCaseIDs: OpenCodeToolSchemaBridgeNativeExactFixtureCase["id"][] = [
    "missing-args-zod-normalization",
    "all-zod-uses-zod-json-schema",
    "legacy-json-schema-filters-definitions",
    "mixed-zod-falls-back-to-legacy-json-schema",
    "zod-defs-renamed-to-definitions",
    "invalid-arguments-message",
  ]

  function addIssue(id: string, message: string, caseID?: string) {
    issues.push({ id, message, ...(caseID ? { caseID } : {}) })
  }

  if (fixture.schemaVersion !== 1 || fixture.product !== "opencode" || fixture.atomID !== "opencode.tool.schema-bridge") {
    addIssue("opencode-tool-schema-bridge.identity", "OpenCode tool schema bridge fixture identity changed.")
  }
  if (fixture.portID !== "tool.schema-adapter" || fixture.exactDiffStatus !== "native-exact" || fixture.nativeParityClaim !== true) {
    addIssue("opencode-tool-schema-bridge.native-claim", "OpenCode tool schema bridge fixture must remain native-exact tool.schema-adapter evidence.")
  }
  if (fixture.knownLossiness.length !== 0) {
    addIssue("opencode-tool-schema-bridge.lossiness", "Native exact OpenCode tool schema bridge fixture must not retain known lossiness.")
  }
  for (const expectedID of expectedCaseIDs) {
    const testCase = fixture.cases.find((candidate) => candidate.id === expectedID)
    if (!testCase) {
      addIssue("opencode-tool-schema-bridge.case-missing", `Missing ${expectedID} fixture case.`, expectedID)
      continue
    }
    if (stableStringify(testCase.actual) !== stableStringify(testCase.expected)) {
      addIssue("opencode-tool-schema-bridge.case-drift", `OpenCode tool schema bridge case ${expectedID} no longer matches expected native behavior.`, expectedID)
    }
  }
  for (const source of [
    "packages/opencode/src/tool/registry.ts",
    "packages/opencode/src/tool/tool.ts",
    "packages/plugin/src/tool.ts",
  ]) {
    if (!fixture.sourceRefs.some((ref) => ref.includes(source))) {
      addIssue("opencode-tool-schema-bridge.source-refs", `Missing pinned upstream source ref ${source}.`)
    }
  }
  const fingerprint = fixture.fingerprint
  const { fingerprint: _ignored, ...withoutFingerprint } = fixture
  if (fingerprint !== fingerprintObject(withoutFingerprint)) {
    addIssue("opencode-tool-schema-bridge.fingerprint", "OpenCode tool schema bridge fixture fingerprint no longer matches its content.")
  }

  return { ok: issues.length === 0, issues }
}

function openCodeToolSchemaBridgeDefaultZodObject(shape: Record<string, unknown>): unknown {
  return {
    kind: "z.object",
    shape,
  }
}

function openCodeToolSchemaBridgeDefaultZodToJSONSchema(schema: unknown): unknown {
  if (!isJsonSchemaObject(schema)) {
    return {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {},
    }
  }
  const shape = isJsonSchemaObject(schema.shape) ? schema.shape : {}
  const properties: Record<string, OpenCodeToolSchemaBridgeJSONSchemaDefinition> = {}
  const required: string[] = []
  for (const [key, value] of Object.entries(shape)) {
    if (!isJsonSchemaObject(value)) continue
    const jsonSchema = value.jsonSchema
    if (!isJsonSchemaDefinition(jsonSchema)) continue
    properties[key] = jsonSchema
    if (value.optional !== true) required.push(key)
  }
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    properties,
    ...(required.length ? { required } : {}),
  }
}

function openCodeToolSchemaBridgeDefaultSchemaDeclare(
  _schema: unknown,
  shape: Record<string, unknown>,
): OpenCodeToolSchemaBridgeParametersDeclare {
  return {
    kind: "Schema.declare",
    accepts: "zodParams.safeParse(u).success",
    shapeKeys: Object.keys(shape),
  }
}

function openCodeToolSchemaBridgeFixtureZodToJSONSchema(schema: unknown): unknown {
  return openCodeToolSchemaBridgeDefaultZodToJSONSchema(schema)
}

function zodFixtureArg(jsonSchema: OpenCodeToolSchemaBridgeJSONSchemaDefinition, optional = false): Record<string, unknown> {
  return {
    _zod: {
      def: {
        type: "fixture",
      },
    },
    jsonSchema,
    ...(optional ? { optional: true } : {}),
  }
}

function isJsonSchemaDefinition(value: unknown): value is OpenCodeToolSchemaBridgeJSONSchemaDefinition {
  return typeof value === "boolean" || isJsonSchemaObject(value)
}

function isJsonSchemaObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeZodJsonSchema(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizeZodJsonSchema)
  if (!isJsonSchemaObject(value)) return value
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeZodJsonSchema(item)]))
}

function cloneForFixture<T>(input: T): T {
  return JSON.parse(JSON.stringify(input)) as T
}

function fingerprintObject(input: unknown): string {
  return createHash("sha256").update(stableStringify(input)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`
}
