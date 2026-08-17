import { describe, expect, it } from "vitest"
import {
  buildPiMonoToolPackCompatibilityNativeExactFixture,
  buildPiMonoToolRegistrationNativeExactFixture,
  createPiMonoEchoTypeBoxSchema,
  normalizePiMonoDynamicToolName,
  piMonoToolPackCompatibilityNativeDescriptor,
  piMonoToolPackCompatibilityNativeExactAtomID,
  piMonoToolRegistrationNativeDescriptors,
  piMonoToolRegistrationNativeExactAtomIDs,
  projectPiMonoDynamicEchoToolRegistration,
  projectPiMonoTypeBoxToolParameters,
  projectPiMonoWrappedToolDefinition,
  verifyPiMonoToolPackCompatibilityNativeExactFixture,
  verifyPiMonoToolRegistrationNativeExactFixture,
} from "@helix/adapters-pi/product-schema/tools"
import { buildAssemblyContract } from "@helix/recipes"

describe("Pi tool registration native exact fixture", () => {
  it("captures the upstream TypeBox registerTool and wrapper behavior as native exact", () => {
    const fixture = buildPiMonoToolRegistrationNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "pi-mono",
      atomIDs: [
        "pi.extension.dynamic-tool-bridge",
        "pi.tool.register-tool-bridge",
        "pi.extension.typebox-bridge",
        "pi.tool.typebox-bridge",
      ],
      portIDs: ["tool.registry", "tool.definition", "tool.schema-adapter"],
      upstreamRef: "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
      evidenceRef: "conformance:pi-tool-registration-native-exact-fixture",
      fixtureID: "pi-tool-registration:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: ["conformance:pi-tool-registration-native-exact-fixture", "tool-registration-native-exact:pi-mono"],
      fixtureIDs: ["pi-tool-registration:native-exact-fixture"],
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/coding-agent/src/core/tools/tool-definition-wrapper.ts#wrapToolDefinition,createToolDefinitionFromAgentTool"),
      expect.stringContaining("packages/coding-agent/src/core/extensions/types.ts#ToolDefinition,ExtensionAPI.registerTool"),
      expect.stringContaining("packages/coding-agent/examples/extensions/dynamic-tools.ts#ECHO_PARAMS,normalizeToolName,dynamicToolsExtension"),
    ]))
    expect(fixture.policy).toMatchObject({
      registerToolAcceptsTypeBoxToolDefinition: true,
      wrapperPreservesRuntimeFields: ["name", "label", "description", "parameters", "prepareArguments", "executionMode", "execute"],
      wrapperExecuteAppendsExtensionContext: true,
      dynamicToolNameValidation: "trim-lowercase-nonempty-lowercase-alphanumeric-underscore",
      dynamicToolRegistrationDeduplicatesByName: true,
      typeBoxParametersPassThroughAsJsonSchema: true,
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "wrap-tool-definition-injects-extension-context",
      "agent-tool-definition-roundtrip-retains-runtime-fields",
      "typebox-parameters-pass-through-as-json-schema",
      "dynamic-echo-tool-name-validation-and-dedupe",
    ])
    expect(fixture.cases.find((item) => item.scenarioID === "wrap-tool-definition-injects-extension-context")?.output).toMatchObject({
      retainedFields: ["description", "execute", "executionMode", "label", "name", "parameters", "prepareArguments"],
      contextInjected: true,
      resultText: "/workspace/pi:hello",
    })
    expect(fixture.cases.find((item) => item.scenarioID === "typebox-parameters-pass-through-as-json-schema")?.output).toMatchObject({
      parameterKind: "typebox",
      jsonSchemaSameObject: true,
      jsonSchemaType: "object",
      requiredFields: ["message"],
      propertyKeys: ["message"],
    })
    expect(fixture.cases.find((item) => item.scenarioID === "dynamic-echo-tool-name-validation-and-dedupe")?.output).toMatchObject({
      normalizedNames: ["echo_session", "echo_session", "runtime_2"],
      rejectedInputs: ["bad-name"],
      registeredNames: ["echo_session", "runtime_2"],
      duplicateSkipped: true,
    })
    expect(verifyPiMonoToolRegistrationNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
  })

  it("exposes native descriptors for the four product tool-registration atoms", () => {
    expect(piMonoToolRegistrationNativeDescriptors.map((descriptor) => [descriptor.id, descriptor.port])).toEqual([
      ["pi.extension.dynamic-tool-bridge", "tool.registry"],
      ["pi.tool.register-tool-bridge", "tool.definition"],
      ["pi.extension.typebox-bridge", "tool.schema-adapter"],
      ["pi.tool.typebox-bridge", "tool.schema-adapter"],
    ])
    expect(piMonoToolRegistrationNativeDescriptors.every((descriptor) => descriptor.implementationKind === "factory")).toBe(true)
    expect(piMonoToolRegistrationNativeDescriptors.every((descriptor) => descriptor.parityCoverage === "native")).toBe(true)
    expect(piMonoToolRegistrationNativeDescriptors.every((descriptor) => descriptor.knownLossiness.length === 0)).toBe(true)
    expect(piMonoToolRegistrationNativeDescriptors.flatMap((descriptor) => descriptor.fixtureIDs)).toEqual(
      expect.arrayContaining(["pi-tool-registration:native-exact-fixture"]),
    )
  })

  it("captures the Pi tool-pack compatibility atom as a native exact aggregate", () => {
    const fixture = buildPiMonoToolPackCompatibilityNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "pi-mono",
      atomID: "pi.tool-pack.compatibility",
      portID: "tools",
      upstreamRef: "github:earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
      evidenceRef: "conformance:pi-tool-pack-compatibility-native-exact-fixture",
      fixtureID: "pi-tool-pack-compatibility:native-exact-fixture",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      knownLossiness: [],
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(fixture.policy).toMatchObject({
      aggregateOnly: true,
      defaultActiveTools: ["read", "bash", "edit", "write"],
      readOnlyTools: ["read", "grep", "find", "ls"],
      allTools: ["read", "bash", "edit", "write", "grep", "find", "ls"],
      noCompatibilityBridgeLossiness: true,
    })
    expect(fixture.componentEvidenceRefs).toEqual(expect.arrayContaining([
      "conformance:pi-tool-registration-native-exact-fixture",
      "conformance:pi-tool-runtime-native-exact-fixture",
      "conformance:pi-tool-schema-native-exact-fixture",
      "conformance:pi-tool-batch-scheduler-native-exact-fixture",
      "conformance:pi-tool-result-projector-native-exact-fixture",
    ]))
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("packages/coding-agent/src/core/tools/index.ts#ToolName,allToolNames,createToolDefinition,createCodingToolDefinitions,createReadOnlyToolDefinitions,createAllToolDefinitions"),
      expect.stringContaining("packages/coding-agent/src/core/sdk.ts#defaultActiveToolNames,allowedToolNames,initialActiveToolNames"),
      expect.stringContaining("packages/agent/src/agent-loop.ts#executeToolCalls,executeToolCallsSequential,executeToolCallsParallel,executePreparedToolCall,createToolResultMessage"),
    ]))
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "default-coding-tool-pack",
      "read-only-tool-pack",
      "all-tool-pack",
      "runtime-pack-ordering",
    ])
    expect(verifyPiMonoToolPackCompatibilityNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
  })

  it("projects helper behavior without partial bridge lossiness", () => {
    expect(normalizePiMonoDynamicToolName(" Echo_Session ")).toBe("echo_session")
    expect(normalizePiMonoDynamicToolName("bad-name")).toBeUndefined()
    expect(projectPiMonoDynamicEchoToolRegistration(["Echo_Session", "echo_session", "ok_2"])).toMatchObject({
      normalizedNames: ["echo_session", "echo_session", "ok_2"],
      registeredNames: ["echo_session", "ok_2"],
      duplicateSkipped: true,
    })
    expect(projectPiMonoTypeBoxToolParameters(createPiMonoEchoTypeBoxSchema())).toMatchObject({
      parameterKind: "typebox",
      jsonSchemaSameObject: true,
      jsonSchemaType: "object",
      requiredFields: ["message"],
      propertyKeys: ["message"],
    })
    expect(projectPiMonoWrappedToolDefinition()).toMatchObject({
      contextInjected: true,
      resultText: "/workspace/pi:hello",
    })
  })

  it("marks the selected assembly atoms product-native exact", () => {
    const contract = buildAssemblyContract({ product: "pi-mono", generatedAt: "2026-06-10T00:00:00.000Z" })
    for (const atomID of piMonoToolRegistrationNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom, atomID).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining(["conformance:pi-tool-registration-native-exact-fixture", "tool-registration-native-exact:pi-mono"]),
        fixtureIDs: ["pi-tool-registration:native-exact-fixture"],
        knownLossiness: [],
        source: {
          packageName: "@helix/adapters-pi",
          exportPath: "./product-schema/tools",
          specifier: "@helix/adapters-pi/product-schema/tools",
        },
      })
    }
  })

  it("marks the Pi tool-pack compatibility aggregate product-native exact", () => {
    const contract = buildAssemblyContract({ product: "pi-mono", generatedAt: "2026-06-10T00:00:00.000Z" })
    const atom = contract.atoms.find((candidate) => candidate.id === piMonoToolPackCompatibilityNativeExactAtomID)

    expect(piMonoToolPackCompatibilityNativeDescriptor).toMatchObject({
      id: "pi.tool-pack.compatibility",
      port: "tools",
      implementationKind: "factory",
      parityCoverage: "native",
      knownLossiness: [],
    })
    expect(atom).toMatchObject({
      implementationKind: "factory",
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([
        "conformance:pi-tool-pack-compatibility-native-exact-fixture",
        "tool-pack-compatibility-native-exact:pi-mono",
        "upstream:https://github.com/earendil-works/pi@7c2775f6f67c38ed491a1ff68240ee4f8ba688da",
      ]),
      fixtureIDs: ["pi-tool-pack-compatibility:native-exact-fixture"],
      knownLossiness: [],
      source: {
        packageName: "@helix/adapters-pi",
        exportPath: "./product-schema/tools",
        specifier: "@helix/adapters-pi/product-schema/tools",
      },
    })
  })

  it("rejects native claims when exact cases or lossiness drift", () => {
    const fixture = buildPiMonoToolRegistrationNativeExactFixture()
    expect(verifyPiMonoToolRegistrationNativeExactFixture({ ...fixture, knownLossiness: ["product-bridge"] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-tool-registration-native-exact.lossiness" }),
    ]))
    expect(verifyPiMonoToolRegistrationNativeExactFixture({
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "dynamic-echo-tool-name-validation-and-dedupe"
          ? { ...item, output: { ...item.output, duplicateSkipped: false } }
          : item,
      ),
    }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-tool-registration-native-exact.cases" }),
    ]))

    const packFixture = buildPiMonoToolPackCompatibilityNativeExactFixture()
    expect(verifyPiMonoToolPackCompatibilityNativeExactFixture({ ...packFixture, knownLossiness: ["product-bridge"] }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-tool-pack-compatibility-native-exact.lossiness" }),
    ]))
    expect(verifyPiMonoToolPackCompatibilityNativeExactFixture({
      ...packFixture,
      cases: packFixture.cases.map((item) =>
        item.scenarioID === "default-coding-tool-pack"
          ? { ...item, output: { ...item.output, toolNames: ["read"] } }
          : item,
      ),
    }).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-tool-pack-compatibility-native-exact.cases" }),
    ]))
  })
})
