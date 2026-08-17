import { describe, expect, it } from "vitest"
import {
  appendPiMonoJsonlBranchGraphEntry,
  appendPiMonoJsonlStorageEntry,
  buildPiMonoJsonlBranchGraphSnapshot,
  buildPiMonoJsonlSessionHeader,
  buildPiMonoJsonlSessionFileName,
  buildPiMonoSessionBranchSummaryNativeExactFixture,
  buildPiMonoSessionMessagePartProjectorNativeExactFixture,
  buildPiMonoSessionManagerNativeExactFixture,
  buildPiMonoSessionProjectorJsonlV3NativeExactFixture,
  buildPiMonoSessionStoreJsonlV3NativeExactFixture,
  buildPiMonoSessionStoreJsonlV3MigratorNativeExactFixture,
  buildPiMonoSessionContextSelectorNativeExactFixture,
  buildPiMonoSessionContextSnapshot,
  buildPiMonoSessionBranchGraphNativeExactFixture,
  createPiMonoJsonlLeafEntry,
  createPiMonoJsonlStorageSnapshot,
  encodePiMonoSessionCwd,
  getPiMonoJsonlStorageEntries,
  getPiMonoJsonlStorageEntry,
  getPiMonoJsonlStorageLeafID,
  getPiMonoJsonlPathToRoot,
  getPiMonoSessionManagerBranch,
  loadPiMonoMigratableSessionEntries,
  loadPiMonoJsonlStorageSnapshot,
  migratePiMonoSessionEntriesToJsonlV3,
  movePiMonoJsonlBranchWithSummary,
  parsePiMonoMigratableSessionEntries,
  parsePiMonoJsonlSessionEntryLine,
  parsePiMonoJsonlSessionHeaderLine,
  piMonoSessionMessagePartProjectorNativeDescriptor,
  piMonoSessionMessagePartProjectorNativeExactAtomID,
  piMonoSessionMessagePartProjectorNativeExactEvidenceRef,
  piMonoSessionMessagePartProjectorNativeExactFixtureID,
  piMonoSessionMessagePartProjectorNativeExactReplayRef,
  piMonoSessionBranchingSessionManagerNativeExactAtomID,
  piMonoSessionDiffSessionManagerNativeExactAtomID,
  piMonoSessionEventLogSessionManagerNativeExactAtomID,
  piMonoSessionManagerNativeDescriptors,
  piMonoSessionManagerNativeExactAtomIDs,
  piMonoSessionManagerNativeExactEvidenceRef,
  piMonoSessionManagerNativeExactFixtureID,
  piMonoSessionManagerNativeExactPortIDs,
  piMonoSessionManagerNativeExactReplayRef,
  piMonoSessionMessageStoreSessionManagerNativeExactAtomID,
  piMonoSessionReaderSessionManagerNativeExactAtomID,
  piMonoSessionWriterSessionManagerNativeExactAtomID,
  piMonoSessionActivePathNativeExactAtomID,
  piMonoSessionBranchSummaryNativeDescriptor,
  piMonoSessionBranchSummaryNativeExactAtomID,
  piMonoSessionBranchSummaryNativeExactEvidenceRef,
  piMonoSessionBranchSummaryNativeExactFixtureID,
  piMonoSessionBranchSummaryNativeExactReplayRef,
  piMonoSessionBranchGraphActiveLeafNativeExactAtomID,
  piMonoSessionBranchGraphLeafTreeNativeExactAtomID,
  piMonoSessionBranchGraphNativeDescriptors,
  piMonoSessionBranchGraphNativeExactAtomIDs,
  piMonoSessionBranchGraphNativeExactEvidenceRef,
  piMonoSessionBranchGraphNativeExactFixtureID,
  piMonoSessionBranchGraphNativeExactReplayRef,
  piMonoSessionContextSelectorActiveLeafNativeExactAtomID,
  piMonoSessionContextSelectorNativeDescriptors,
  piMonoSessionContextSelectorNativeExactAtomIDs,
  piMonoSessionContextSelectorNativeExactEvidenceRef,
  piMonoSessionContextSelectorNativeExactFixtureID,
  piMonoSessionContextSelectorNativeExactReplayRef,
  piMonoSessionNativeDescriptors,
  piMonoSessionProjectorJsonlNativeDescriptor,
  piMonoSessionProjectorJsonlNativeExactAtomID,
  piMonoSessionProjectorJsonlV3NativeDescriptor,
  piMonoSessionProjectorJsonlV3NativeExactAtomID,
  piMonoSessionProjectorJsonlV3NativeExactEvidenceRef,
  piMonoSessionProjectorJsonlV3NativeExactFixtureID,
  piMonoSessionProjectorJsonlV3NativeExactReplayRef,
  piMonoSessionStoreJsonlV3NativeDescriptor,
  piMonoSessionStoreJsonlV3NativeExactAtomID,
  piMonoSessionStoreJsonlV3NativeExactEvidenceRef,
  piMonoSessionStoreJsonlV3NativeExactFixtureID,
  piMonoSessionStoreJsonlV3NativeExactReplayRef,
  piMonoSessionStoreJsonlV3MigratorNativeDescriptor,
  piMonoSessionStoreJsonlV3MigratorNativeExactAtomID,
  piMonoSessionStoreJsonlV3MigratorNativeExactEvidenceRef,
  piMonoSessionStoreJsonlV3MigratorNativeExactFixtureID,
  piMonoSessionStoreJsonlV3MigratorNativeExactReplayRef,
  serializePiMonoJsonlStorage,
  setPiMonoJsonlStorageLeafID,
  type PiMonoJsonlGenericEntry,
  type PiMonoJsonlLabelEntry,
  type PiMonoMigratableSessionFileEntry,
  type PiMonoSessionNativeError,
  verifyPiMonoSessionBranchSummaryNativeExactFixture,
  verifyPiMonoSessionBranchGraphNativeExactFixture,
  verifyPiMonoSessionContextSelectorNativeExactFixture,
  verifyPiMonoSessionMessagePartProjectorNativeExactFixture,
  verifyPiMonoSessionManagerNativeExactFixture,
  verifyPiMonoSessionProjectorJsonlV3NativeExactFixture,
  verifyPiMonoSessionStoreJsonlV3NativeExactFixture,
  verifyPiMonoSessionStoreJsonlV3MigratorNativeExactFixture,
} from "@helix/lego-session/product-schema/pi"
import { buildAssemblyContract } from "@helix/recipes"

describe("Pi session native exact conformance", () => {
  it("matches upstream JSONL v3 branch graph and active leaf semantics", () => {
    const root: PiMonoJsonlGenericEntry = {
      type: "message",
      id: "root",
      parentId: null,
      timestamp: "2026-06-01T00:00:00.000Z",
      message: { role: "user", content: [{ type: "text", text: "hello" }] },
    }
    const branch: PiMonoJsonlGenericEntry = {
      type: "message",
      id: "branch",
      parentId: "root",
      timestamp: "2026-06-01T00:00:01.000Z",
      message: { role: "assistant", content: [{ type: "text", text: "hi" }] },
    }

    const snapshot = buildPiMonoJsonlBranchGraphSnapshot([root, branch])
    expect(snapshot.currentLeafId).toBe("branch")
    expect(getPiMonoJsonlPathToRoot(snapshot.entries, snapshot.currentLeafId).map((entry) => entry.id)).toEqual([
      "root",
      "branch",
    ])

    const leafEntry = createPiMonoJsonlLeafEntry({
      entries: snapshot.entries,
      currentLeafId: snapshot.currentLeafId,
      targetLeafId: "root",
      timestamp: "1970-01-01T00:00:00.000Z",
      randomBytes: () => new Uint8Array(16),
    })
    expect(leafEntry).toEqual({
      type: "leaf",
      id: "00000000",
      parentId: "branch",
      timestamp: "1970-01-01T00:00:00.000Z",
      targetId: "root",
    })

    const switched = appendPiMonoJsonlBranchGraphEntry(snapshot, leafEntry)
    expect(switched.currentLeafId).toBe("root")
    expect(getPiMonoJsonlPathToRoot(switched.entries, switched.currentLeafId).map((entry) => entry.id)).toEqual(["root"])

    const brokenParent: PiMonoJsonlGenericEntry = {
      type: "message",
      id: "orphan",
      parentId: "missing",
      timestamp: "2026-06-01T00:00:02.000Z",
    }
    expect(() => getPiMonoJsonlPathToRoot([brokenParent], "orphan")).toThrow("Entry missing not found")
  })

  it("matches upstream label cache, strict parser, and repo path encoding helpers", () => {
    const labelAdd: PiMonoJsonlLabelEntry = {
      type: "label",
      id: "label-add",
      parentId: null,
      timestamp: "2026-06-01T00:00:00.000Z",
      targetId: "root",
      label: "  Root  ",
    }
    const labelDelete: PiMonoJsonlLabelEntry = {
      type: "label",
      id: "label-delete",
      parentId: "label-add",
      timestamp: "2026-06-01T00:00:01.000Z",
      targetId: "root",
      label: "   ",
    }

    expect(buildPiMonoJsonlBranchGraphSnapshot([labelAdd]).labelsById).toEqual({ root: "Root" })
    expect(buildPiMonoJsonlBranchGraphSnapshot([labelAdd, labelDelete]).labelsById).toEqual({})

    const header = buildPiMonoJsonlSessionHeader({
      id: "session-a",
      timestamp: "2026-06-01T00:00:00.000Z",
      cwd: "/workspace/app",
      parentSession: "/workspace/parent.jsonl",
    })
    expect(parsePiMonoJsonlSessionHeaderLine(JSON.stringify(header), "/sessions/session-a.jsonl")).toEqual(header)
    expect(parsePiMonoJsonlSessionEntryLine(
      JSON.stringify({ type: "leaf", id: "leaf-a", parentId: "branch", timestamp: "2026-06-01T00:00:02.000Z", targetId: null }),
      "/sessions/session-a.jsonl",
      3,
    )).toMatchObject({ type: "leaf", targetId: null })

    try {
      parsePiMonoJsonlSessionHeaderLine(JSON.stringify({ ...header, version: 2 }), "/sessions/session-a.jsonl")
      throw new Error("expected unsupported version to throw")
    } catch (error) {
      expect((error as PiMonoSessionNativeError).code).toBe("invalid_session")
      expect((error as Error).message).toContain("unsupported session version")
    }

    try {
      parsePiMonoJsonlSessionEntryLine(
        JSON.stringify({ type: "leaf", id: "leaf-a", parentId: null, timestamp: "2026-06-01T00:00:02.000Z" }),
        "/sessions/session-a.jsonl",
        2,
      )
      throw new Error("expected missing leaf target to throw")
    } catch (error) {
      expect((error as PiMonoSessionNativeError).code).toBe("invalid_entry")
      expect((error as Error).message).toContain("has invalid targetId")
    }

    expect(encodePiMonoSessionCwd("/repo:app/src")).toBe("--repo-app-src--")
    expect(buildPiMonoJsonlSessionFileName("2026-06-01T00:00:00.000Z", "session-a")).toBe(
      "2026-06-01T00-00-00-000Z_session-a.jsonl",
    )
  })

  it("publishes native descriptors and verifies the branch graph fixture", () => {
    const fixture = buildPiMonoSessionBranchGraphNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "pi-mono",
      atomIDs: [
        piMonoSessionBranchGraphLeafTreeNativeExactAtomID,
        piMonoSessionBranchGraphActiveLeafNativeExactAtomID,
      ],
      portID: "session.branch-graph",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        piMonoSessionBranchGraphNativeExactEvidenceRef,
        piMonoSessionBranchGraphNativeExactReplayRef,
      ]),
      fixtureIDs: [piMonoSessionBranchGraphNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "append-entry-sets-active-leaf",
      "leaf-entry-switches-active-leaf",
      "label-cache-trims-and-deletes",
      "strict-jsonl-v3-parsing",
      "repo-cwd-path-encoding",
    ])
    expect(verifyPiMonoSessionBranchGraphNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(piMonoSessionBranchGraphNativeDescriptors.map((descriptor) => descriptor.id)).toEqual([
      piMonoSessionBranchGraphLeafTreeNativeExactAtomID,
      piMonoSessionBranchGraphActiveLeafNativeExactAtomID,
    ])
    expect(piMonoSessionNativeDescriptors.map((descriptor) => descriptor.id)).toEqual(expect.arrayContaining([
      "pi.session.id-generator",
      ...piMonoSessionBranchGraphNativeExactAtomIDs,
    ]))

    const mutated = {
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "leaf-entry-switches-active-leaf"
          ? { ...item, output: { ...item.output, currentLeafId: "branch" } }
          : item,
      ),
    }
    expect(verifyPiMonoSessionBranchGraphNativeExactFixture(mutated).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-session-branch-graph-native-exact.fingerprint" }),
      expect.objectContaining({ id: "pi-session-branch-graph-native-exact.cases" }),
    ]))
  })

  it("matches upstream active path and context selector semantics", () => {
    const root: PiMonoJsonlGenericEntry = {
      type: "message",
      id: "root",
      parentId: null,
      timestamp: "2026-06-01T00:00:00.000Z",
      message: { role: "user", content: [{ type: "text", text: "hello" }] },
    }
    const thinking: PiMonoJsonlGenericEntry = {
      type: "thinking_level_change",
      id: "thinking-high",
      parentId: "root",
      timestamp: "2026-06-01T00:00:01.000Z",
      thinkingLevel: "high",
    }
    const assistant: PiMonoJsonlGenericEntry = {
      type: "message",
      id: "assistant",
      parentId: "thinking-high",
      timestamp: "2026-06-01T00:00:02.000Z",
      message: { role: "assistant", provider: "anthropic", model: "claude-3-7-sonnet-20250219", content: [{ type: "text", text: "hi" }] },
    }
    const sibling: PiMonoJsonlGenericEntry = {
      type: "message",
      id: "sibling",
      parentId: "root",
      timestamp: "2026-06-01T00:00:03.000Z",
      message: { role: "user", content: [{ type: "text", text: "side branch" }] },
    }
    const entries = [root, thinking, assistant, sibling]

    expect(getPiMonoSessionManagerBranch(entries, { currentLeafId: "assistant" }).map((entry) => entry.id)).toEqual([
      "root",
      "thinking-high",
      "assistant",
    ])
    expect(buildPiMonoSessionContextSnapshot(entries, "assistant")).toMatchObject({
      pathIDs: ["root", "thinking-high", "assistant"],
      messages: [root.message, assistant.message],
      thinkingLevel: "high",
      model: { provider: "anthropic", modelId: "claude-3-7-sonnet-20250219" },
    })
    expect(buildPiMonoSessionContextSnapshot(entries, null)).toEqual({
      pathIDs: [],
      messages: [],
      thinkingLevel: "off",
      model: null,
    })
    expect(buildPiMonoSessionContextSnapshot(entries).pathIDs).toEqual(["root", "sibling"])
  })

  it("publishes native descriptors and verifies the active path/context selector fixture", () => {
    const fixture = buildPiMonoSessionContextSelectorNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "pi-mono",
      atomIDs: [
        piMonoSessionActivePathNativeExactAtomID,
        piMonoSessionContextSelectorActiveLeafNativeExactAtomID,
      ],
      portIDs: ["session.pagination", "session.context-selector"],
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        piMonoSessionContextSelectorNativeExactEvidenceRef,
        piMonoSessionContextSelectorNativeExactReplayRef,
      ]),
      fixtureIDs: [piMonoSessionContextSelectorNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "get-branch-follows-active-leaf",
      "context-selector-follows-active-leaf",
      "null-leaf-selects-empty-context",
      "undefined-leaf-falls-back-to-last-entry",
    ])
    expect(verifyPiMonoSessionContextSelectorNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(piMonoSessionContextSelectorNativeDescriptors.map((descriptor) => descriptor.id)).toEqual([
      piMonoSessionActivePathNativeExactAtomID,
      piMonoSessionContextSelectorActiveLeafNativeExactAtomID,
    ])
    expect(piMonoSessionNativeDescriptors.map((descriptor) => descriptor.id)).toEqual(expect.arrayContaining([
      ...piMonoSessionContextSelectorNativeExactAtomIDs,
    ]))

    const mutated = {
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "context-selector-follows-active-leaf"
          ? { ...item, output: { ...item.output, thinkingLevel: "off" } }
          : item,
      ),
    }
    expect(verifyPiMonoSessionContextSelectorNativeExactFixture(mutated).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-session-context-selector-native-exact.fingerprint" }),
      expect.objectContaining({ id: "pi-session-context-selector-native-exact.cases" }),
    ]))
  })

  it("matches upstream JSONL v3 session projector message, compaction, thinking, and model semantics", () => {
    const root: PiMonoJsonlGenericEntry = {
      type: "message",
      id: "root",
      parentId: null,
      timestamp: "2026-06-01T00:00:00.000Z",
      message: { role: "user", content: [{ type: "text", text: "hello" }] },
    }
    const custom: PiMonoJsonlGenericEntry = {
      type: "custom_message",
      id: "custom-message",
      parentId: "root",
      timestamp: "2026-06-01T00:00:01.000Z",
      customType: "notice",
      content: "heads up",
      display: true,
      details: { source: "fixture" },
    }
    const branchSummary: PiMonoJsonlGenericEntry = {
      type: "branch_summary",
      id: "branch-summary",
      parentId: "custom-message",
      timestamp: "2026-06-01T00:00:02.000Z",
      fromId: "root",
      summary: "Explored an alternate branch.",
    }
    const label: PiMonoJsonlLabelEntry = {
      type: "label",
      id: "label-root",
      parentId: "branch-summary",
      timestamp: "2026-06-01T00:00:03.000Z",
      targetId: "root",
      label: "Root",
    }

    expect(buildPiMonoSessionContextSnapshot([root, custom, branchSummary, label], "label-root")).toMatchObject({
      pathIDs: ["root", "custom-message", "branch-summary", "label-root"],
      messages: [
        root.message,
        {
          role: "custom",
          customType: "notice",
          content: "heads up",
          display: true,
          details: { source: "fixture" },
          timestamp: Date.parse("2026-06-01T00:00:01.000Z"),
        },
        {
          role: "branchSummary",
          summary: "Explored an alternate branch.",
          fromId: "root",
          timestamp: Date.parse("2026-06-01T00:00:02.000Z"),
        },
      ],
    })

    const compactRoot: PiMonoJsonlGenericEntry = {
      type: "message",
      id: "compact-root",
      parentId: null,
      timestamp: "2026-06-01T00:01:00.000Z",
      message: { role: "user", content: [{ type: "text", text: "older" }] },
    }
    const keptAssistant: PiMonoJsonlGenericEntry = {
      type: "message",
      id: "kept-assistant",
      parentId: "compact-root",
      timestamp: "2026-06-01T00:01:01.000Z",
      message: { role: "assistant", provider: "anthropic", model: "claude-3-7-sonnet-20250219", content: [{ type: "text", text: "kept" }] },
    }
    const keptUser: PiMonoJsonlGenericEntry = {
      type: "message",
      id: "kept-user",
      parentId: "kept-assistant",
      timestamp: "2026-06-01T00:01:02.000Z",
      message: { role: "user", content: [{ type: "text", text: "tail" }] },
    }
    const compaction: PiMonoJsonlGenericEntry = {
      type: "compaction",
      id: "compact",
      parentId: "kept-user",
      timestamp: "2026-06-01T00:01:03.000Z",
      summary: "Earlier details were compacted.",
      firstKeptEntryId: "kept-assistant",
      tokensBefore: 1234,
    }
    const afterCompaction: PiMonoJsonlGenericEntry = {
      type: "message",
      id: "after-compact",
      parentId: "compact",
      timestamp: "2026-06-01T00:01:04.000Z",
      message: { role: "user", content: [{ type: "text", text: "after" }] },
    }
    const compactionContext = buildPiMonoSessionContextSnapshot([
      compactRoot,
      keptAssistant,
      keptUser,
      compaction,
      afterCompaction,
    ], "after-compact")
    expect(compactionContext.messages).toEqual([
      {
        role: "compactionSummary",
        summary: "Earlier details were compacted.",
        tokensBefore: 1234,
        timestamp: Date.parse("2026-06-01T00:01:03.000Z"),
      },
      keptAssistant.message,
      keptUser.message,
      afterCompaction.message,
    ])

    const thinking: PiMonoJsonlGenericEntry = {
      type: "thinking_level_change",
      id: "thinking-high",
      parentId: null,
      timestamp: "2026-06-01T00:02:00.000Z",
      thinkingLevel: "high",
    }
    const assistant: PiMonoJsonlGenericEntry = {
      type: "message",
      id: "assistant-model",
      parentId: "thinking-high",
      timestamp: "2026-06-01T00:02:01.000Z",
      message: { role: "assistant", provider: "anthropic", model: "claude-3-7-sonnet-20250219", content: [{ type: "text", text: "model from assistant" }] },
    }
    const modelChange: PiMonoJsonlGenericEntry = {
      type: "model_change",
      id: "model-google",
      parentId: "assistant-model",
      timestamp: "2026-06-01T00:02:02.000Z",
      provider: "google",
      modelId: "gemini-2.5-pro",
    }
    expect(buildPiMonoSessionContextSnapshot([thinking, assistant, modelChange], "model-google")).toMatchObject({
      messages: [assistant.message],
      thinkingLevel: "high",
      model: { provider: "google", modelId: "gemini-2.5-pro" },
    })

    const ignored = buildPiMonoSessionContextSnapshot([
      { ...thinking, id: "ignored-thinking", thinkingLevel: "medium" },
      { ...modelChange, id: "ignored-model", parentId: "ignored-thinking", provider: "openai", modelId: "gpt-4.1" },
      { ...label, id: "ignored-label", parentId: "ignored-model", targetId: "ignored-model" },
    ], "ignored-label")
    expect(ignored).toMatchObject({
      messages: [],
      thinkingLevel: "medium",
      model: { provider: "openai", modelId: "gpt-4.1" },
    })
  })

  it("matches upstream JSONL v3 storage create/open/append/leaf semantics", () => {
    const filePath = "/sessions/--workspace-app--/2026-06-01T00-00-00-000Z_session-a.jsonl"
    const created = createPiMonoJsonlStorageSnapshot({
      filePath,
      cwd: "/workspace/app",
      sessionId: "session-a",
      timestamp: "2026-06-01T00:00:00.000Z",
      parentSessionPath: "/sessions/parent.jsonl",
    })
    const root: PiMonoJsonlGenericEntry = {
      type: "message",
      id: "root",
      parentId: null,
      timestamp: "2026-06-01T00:00:01.000Z",
      message: { role: "user", content: [{ type: "text", text: "hello" }] },
    }
    const assistant: PiMonoJsonlGenericEntry = {
      type: "message",
      id: "assistant",
      parentId: "root",
      timestamp: "2026-06-01T00:00:02.000Z",
      message: { role: "assistant", content: [{ type: "text", text: "hi" }] },
    }
    const label: PiMonoJsonlLabelEntry = {
      type: "label",
      id: "label-root",
      parentId: "assistant",
      timestamp: "2026-06-01T00:00:03.000Z",
      targetId: "root",
      label: "  Root branch  ",
    }

    expect(created.content).toBe(`${JSON.stringify(buildPiMonoJsonlSessionHeader({
      id: "session-a",
      timestamp: "2026-06-01T00:00:00.000Z",
      cwd: "/workspace/app",
      parentSession: "/sessions/parent.jsonl",
    }))}\n`)
    expect(created.metadata).toEqual({
      id: "session-a",
      createdAt: "2026-06-01T00:00:00.000Z",
      cwd: "/workspace/app",
      path: filePath,
      parentSessionPath: "/sessions/parent.jsonl",
    })

    const appended = appendPiMonoJsonlStorageEntry(created, root)
    expect(appended.content.endsWith(`${JSON.stringify(root)}\n`)).toBe(true)
    expect(appended.currentLeafId).toBe("root")
    expect(getPiMonoJsonlStorageEntry(appended, "root")).toEqual(root)
    expect(getPiMonoJsonlStorageEntries(appended).map((entry) => entry.id)).toEqual(["root"])

    const opened = loadPiMonoJsonlStorageSnapshot([
      created.content.trimEnd(),
      "",
      JSON.stringify(root),
      "  ",
      JSON.stringify(assistant),
      JSON.stringify(label),
      "",
    ].join("\n"), filePath)
    expect(opened.entries.map((entry) => entry.id)).toEqual(["root", "assistant", "label-root"])
    expect(opened.currentLeafId).toBe("label-root")
    expect(opened.labelsById).toEqual({ root: "Root branch" })

    const branch = appendPiMonoJsonlStorageEntry(appended, assistant)
    const switched = setPiMonoJsonlStorageLeafID(branch, {
      leafId: "root",
      timestamp: "1970-01-01T00:00:00.000Z",
      randomBytes: () => new Uint8Array(16),
    })
    expect(switched.entries.at(-1)).toEqual({
      type: "leaf",
      id: "00000000",
      parentId: "assistant",
      timestamp: "1970-01-01T00:00:00.000Z",
      targetId: "root",
    })
    expect(getPiMonoJsonlStorageLeafID(switched)).toBe("root")

    const invalidLeaf = loadPiMonoJsonlStorageSnapshot(serializePiMonoJsonlStorage(
      buildPiMonoJsonlSessionHeader({ id: "session-b", timestamp: "2026-06-01T00:00:00.000Z", cwd: "/workspace/app" }),
      [{ type: "leaf", id: "leaf-missing", parentId: null, timestamp: "2026-06-01T00:00:04.000Z", targetId: "missing" }],
    ), "/sessions/session-b.jsonl")
    expect(() => getPiMonoJsonlStorageLeafID(invalidLeaf)).toThrow("Entry missing not found")
  })

  it("publishes native descriptors and verifies the JSONL v3 storage fixture", () => {
    const fixture = buildPiMonoSessionStoreJsonlV3NativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "pi-mono",
      atomID: piMonoSessionStoreJsonlV3NativeExactAtomID,
      portID: "session.store",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        piMonoSessionStoreJsonlV3NativeExactEvidenceRef,
        piMonoSessionStoreJsonlV3NativeExactReplayRef,
      ]),
      fixtureIDs: [piMonoSessionStoreJsonlV3NativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "create-writes-header-metadata",
      "open-loads-jsonl-v3-ignoring-blank-lines",
      "append-entry-persists-jsonl-and-current-leaf",
      "set-leaf-id-appends-pointer-with-previous-parent",
      "get-leaf-id-validates-loaded-target",
    ])
    expect(verifyPiMonoSessionStoreJsonlV3NativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(piMonoSessionStoreJsonlV3NativeDescriptor).toMatchObject({
      id: piMonoSessionStoreJsonlV3NativeExactAtomID,
      port: "session.store",
      parityCoverage: "native",
      knownLossiness: [],
    })
    expect(piMonoSessionNativeDescriptors.map((descriptor) => descriptor.id)).toEqual(expect.arrayContaining([
      piMonoSessionStoreJsonlV3NativeExactAtomID,
    ]))

    const mutated = {
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "append-entry-persists-jsonl-and-current-leaf"
          ? { ...item, output: { ...item.output, currentLeafId: null } }
          : item,
      ),
    }
    expect(verifyPiMonoSessionStoreJsonlV3NativeExactFixture(mutated).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-session-store-jsonl-v3-native-exact.fingerprint" }),
      expect.objectContaining({ id: "pi-session-store-jsonl-v3-native-exact.cases" }),
    ]))
  })

  it("matches upstream legacy SessionManager migration to JSONL v3 semantics", () => {
    const v1Entries: PiMonoMigratableSessionFileEntry[] = [
      { type: "session", id: "session-v1", timestamp: "2026-06-01T00:00:00.000Z", cwd: "/workspace/app" },
      { type: "message", timestamp: "2026-06-01T00:00:01.000Z", message: { role: "user", content: "hello" } },
      { type: "message", timestamp: "2026-06-01T00:00:02.000Z", message: { role: "assistant", provider: "anthropic", model: "claude", content: [] } },
    ]
    const randomIDs = [
      "aaaaaaaa-1111-4111-8111-111111111111",
      "bbbbbbbb-2222-4222-8222-222222222222",
    ]
    let randomIndex = 0
    const migrated = migratePiMonoSessionEntriesToJsonlV3(v1Entries, { randomUUID: () => randomIDs[randomIndex++]! })

    expect(migrated).toMatchObject({
      startingVersion: 1,
      finalVersion: 3,
      migrated: true,
    })
    expect(migrated.entries.map((entry) => entry.type)).toEqual(["session", "message", "message"])
    expect(migrated.entries[0]).toMatchObject({ version: 3 })
    expect(migrated.entries[1]).toMatchObject({ id: "aaaaaaaa", parentId: null })
    expect(migrated.entries[2]).toMatchObject({ id: "bbbbbbbb", parentId: "aaaaaaaa" })

    const compactionEntries: PiMonoMigratableSessionFileEntry[] = [
      { type: "session", id: "session-compact", timestamp: "2026-06-01T00:01:00.000Z", cwd: "/workspace/app" },
      { type: "message", timestamp: "2026-06-01T00:01:01.000Z", message: { role: "user", content: "older" } },
      { type: "compaction", timestamp: "2026-06-01T00:01:02.000Z", summary: "summary", firstKeptEntryIndex: 1, tokensBefore: 42 },
    ]
    const compactIDs = ["cccccccc-3333-4333-8333-333333333333", "dddddddd-4444-4444-8444-444444444444"]
    let compactIndex = 0
    const compacted = migratePiMonoSessionEntriesToJsonlV3(compactionEntries, { randomUUID: () => compactIDs[compactIndex++]! })
    expect(compacted.entries[2]).toMatchObject({
      id: "dddddddd",
      parentId: "cccccccc",
      firstKeptEntryId: "cccccccc",
    })
    expect(compacted.entries[2]).not.toHaveProperty("firstKeptEntryIndex")

    const duplicateEntries: PiMonoMigratableSessionFileEntry[] = [
      { type: "session", id: "session-duplicate", timestamp: "2026-06-01T00:01:30.000Z", cwd: "/workspace/app" },
      { type: "message", timestamp: "2026-06-01T00:01:31.000Z", message: { role: "user", content: "one" } },
      { type: "message", timestamp: "2026-06-01T00:01:32.000Z", message: { role: "user", content: "two" } },
    ]
    const duplicate = migratePiMonoSessionEntriesToJsonlV3(duplicateEntries, {
      randomUUID: () => "eeeeeeee-5555-4555-8555-555555555555",
    })
    expect(duplicate.entries.slice(1).map((entry) => (entry as { id?: string }).id)).toEqual(["eeeeeeee", "eeeeeeee"])

    const v2Entries: PiMonoMigratableSessionFileEntry[] = [
      { type: "session", version: 2, id: "session-v2", timestamp: "2026-06-01T00:02:00.000Z", cwd: "/workspace/app" },
      { type: "message", id: "hook-msg", parentId: null, timestamp: "2026-06-01T00:02:01.000Z", message: { role: "hookMessage", content: "heads up" } },
    ]
    const migratedV2 = migratePiMonoSessionEntriesToJsonlV3(v2Entries)
    expect(migratedV2).toMatchObject({ startingVersion: 2, finalVersion: 3, migrated: true })
    expect((migratedV2.entries[1] as { message?: { role?: string } }).message?.role).toBe("custom")

    const v3Entries: PiMonoMigratableSessionFileEntry[] = [
      { type: "session", version: 3, id: "session-v3", timestamp: "2026-06-01T00:03:00.000Z", cwd: "/workspace/app" },
      { type: "message", id: "current", parentId: null, timestamp: "2026-06-01T00:03:01.000Z", message: { role: "hookMessage", content: "unchanged" } },
    ]
    const migratedV3 = migratePiMonoSessionEntriesToJsonlV3(v3Entries)
    expect(migratedV3).toMatchObject({ startingVersion: 3, finalVersion: 3, migrated: false })
    expect((migratedV3.entries[1] as { message?: { role?: string } }).message?.role).toBe("hookMessage")

    const parsed = parsePiMonoMigratableSessionEntries([
      "",
      JSON.stringify({ type: "session", version: 2, id: "parsed-session", timestamp: "2026-06-01T00:04:00.000Z", cwd: "/workspace/app" }),
      "{bad json",
      JSON.stringify({ type: "message", id: "parsed-message", parentId: null, timestamp: "2026-06-01T00:04:01.000Z" }),
    ].join("\n"))
    expect(parsed.map((entry) => entry.type)).toEqual(["session", "message"])
    expect(loadPiMonoMigratableSessionEntries(JSON.stringify({ type: "message", id: "not-header" }))).toEqual([])
  })

  it("publishes native descriptors and verifies the JSONL v3 migrator fixture", () => {
    const fixture = buildPiMonoSessionStoreJsonlV3MigratorNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "pi-mono",
      atomID: piMonoSessionStoreJsonlV3MigratorNativeExactAtomID,
      portID: "session.store",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        piMonoSessionStoreJsonlV3MigratorNativeExactEvidenceRef,
        piMonoSessionStoreJsonlV3MigratorNativeExactReplayRef,
      ]),
      fixtureIDs: [piMonoSessionStoreJsonlV3MigratorNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "v1-linear-entries-gain-tree-links",
      "v1-compaction-index-becomes-first-kept-entry-id",
      "v2-hook-message-role-renamed-to-custom",
      "v3-current-version-is-left-unchanged",
      "parser-skips-malformed-and-blank-lines",
    ])
    expect(verifyPiMonoSessionStoreJsonlV3MigratorNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(piMonoSessionStoreJsonlV3MigratorNativeDescriptor).toMatchObject({
      id: piMonoSessionStoreJsonlV3MigratorNativeExactAtomID,
      port: "session.store",
      parityCoverage: "native",
      knownLossiness: [],
    })
    expect(piMonoSessionNativeDescriptors.map((descriptor) => descriptor.id)).toEqual(expect.arrayContaining([
      piMonoSessionStoreJsonlV3MigratorNativeExactAtomID,
    ]))

    const mutated = {
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "v2-hook-message-role-renamed-to-custom"
          ? { ...item, output: { ...item.output, message: { role: "hookMessage" } } }
          : item,
      ),
    }
    expect(verifyPiMonoSessionStoreJsonlV3MigratorNativeExactFixture(mutated).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-session-store-jsonl-v3-migrator-native-exact.fingerprint" }),
      expect.objectContaining({ id: "pi-session-store-jsonl-v3-migrator-native-exact.cases" }),
    ]))
  })

  it("publishes native descriptors and verifies the JSONL v3 projector fixture", () => {
    const fixture = buildPiMonoSessionProjectorJsonlV3NativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "pi-mono",
      atomID: piMonoSessionProjectorJsonlV3NativeExactAtomID,
      portID: "session.projector",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        piMonoSessionProjectorJsonlV3NativeExactEvidenceRef,
        piMonoSessionProjectorJsonlV3NativeExactReplayRef,
      ]),
      fixtureIDs: [piMonoSessionProjectorJsonlV3NativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "message-custom-branch-summary-projection",
      "compaction-keeps-summary-and-tail",
      "model-and-thinking-resolution",
      "non-message-entries-are-ignored",
    ])
    expect(verifyPiMonoSessionProjectorJsonlV3NativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(piMonoSessionProjectorJsonlV3NativeDescriptor).toMatchObject({
      id: piMonoSessionProjectorJsonlV3NativeExactAtomID,
      port: "session.projector",
      parityCoverage: "native",
      knownLossiness: [],
    })
    expect(piMonoSessionProjectorJsonlNativeDescriptor).toMatchObject({
      id: piMonoSessionProjectorJsonlNativeExactAtomID,
      port: "session.projector",
      parityCoverage: "native",
      nativeEvidenceRefs: expect.arrayContaining([
        piMonoSessionProjectorJsonlV3NativeExactEvidenceRef,
        piMonoSessionProjectorJsonlV3NativeExactReplayRef,
      ]),
      fixtureIDs: [piMonoSessionProjectorJsonlV3NativeExactFixtureID],
      knownLossiness: [],
    })
    expect(piMonoSessionNativeDescriptors.map((descriptor) => descriptor.id)).toEqual(expect.arrayContaining([
      piMonoSessionProjectorJsonlNativeExactAtomID,
      piMonoSessionProjectorJsonlV3NativeExactAtomID,
    ]))

    const mutated = {
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "compaction-keeps-summary-and-tail"
          ? { ...item, output: { ...item.output, messages: [] } }
          : item,
      ),
    }
    expect(verifyPiMonoSessionProjectorJsonlV3NativeExactFixture(mutated).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-session-projector-jsonl-v3-native-exact.fingerprint" }),
      expect.objectContaining({ id: "pi-session-projector-jsonl-v3-native-exact.cases" }),
    ]))
  })

  it("projects Pi agent-loop message parts through native SessionManager persistence", () => {
    const fixture = buildPiMonoSessionMessagePartProjectorNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "pi-mono",
      atomID: piMonoSessionMessagePartProjectorNativeExactAtomID,
      portID: "session.message-part-projector",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        piMonoSessionMessagePartProjectorNativeExactEvidenceRef,
        piMonoSessionMessagePartProjectorNativeExactReplayRef,
      ]),
      fixtureIDs: [piMonoSessionMessagePartProjectorNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "assistant-stream-message-lifecycle",
      "tool-result-message-persistence",
      "custom-message-entry-persistence",
      "context-rebuild-preserves-native-message-parts",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      "packages/agent/src/agent-loop.ts#streamAssistantResponse",
      "packages/agent/src/agent-loop.ts#createToolResultMessage,emitToolResultMessage",
      "packages/coding-agent/src/core/agent-session.ts#_handleAgentEvent,_emitExtensionEvent,sendCustomMessage,_replaceMessageInPlace",
      "packages/coding-agent/src/core/session-manager.ts#SessionManager.appendMessage,appendCustomMessageEntry,buildSessionContext",
    ]))
    const contextCase = fixture.cases.find((item) => item.scenarioID === "context-rebuild-preserves-native-message-parts")
    expect(contextCase?.output).toMatchObject({
      messageRoles: ["user", "assistant", "toolResult", "custom"],
      assistantContentTypes: ["text", "thinking", "toolCall"],
      toolResultDetails: { bytes: 51, source: "fixture" },
      customTimestamp: 1780272003100,
    })
    expect(verifyPiMonoSessionMessagePartProjectorNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(piMonoSessionMessagePartProjectorNativeDescriptor).toMatchObject({
      id: piMonoSessionMessagePartProjectorNativeExactAtomID,
      port: "session.message-part-projector",
      parityCoverage: "native",
      knownLossiness: [],
    })
    expect(piMonoSessionNativeDescriptors.map((descriptor) => descriptor.id)).toEqual(expect.arrayContaining([
      piMonoSessionMessagePartProjectorNativeExactAtomID,
    ]))

    const contract = buildAssemblyContract({ product: "pi-mono" })
    const atom = contract.atoms.find((candidate) => candidate.id === piMonoSessionMessagePartProjectorNativeExactAtomID)
    expect(atom).toMatchObject({
      id: piMonoSessionMessagePartProjectorNativeExactAtomID,
      sourcePackage: "@helix/lego-session",
      publicExport: "./product-schema/pi",
      implementationKind: "factory",
      parityCoverage: "native",
      knownLossiness: [],
      nativeEvidenceRefs: expect.arrayContaining([
        piMonoSessionMessagePartProjectorNativeExactEvidenceRef,
        piMonoSessionMessagePartProjectorNativeExactReplayRef,
      ]),
      fixtureIDs: [piMonoSessionMessagePartProjectorNativeExactFixtureID],
    })

    const mutated = {
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "assistant-stream-message-lifecycle"
          ? { ...item, output: { ...item.output, emittedAgentEvents: ["message_start", "message_end"] } }
          : item,
      ),
    }
    expect(verifyPiMonoSessionMessagePartProjectorNativeExactFixture(mutated).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-session-message-part-projector-native-exact.fingerprint" }),
      expect.objectContaining({ id: "pi-session-message-part-projector-native-exact.cases" }),
    ]))
  })

  it("matches upstream Session.moveTo branch summary leaf pointer and context semantics", () => {
    const root: PiMonoJsonlGenericEntry = {
      type: "message",
      id: "root",
      parentId: null,
      timestamp: "2026-06-01T00:00:00.000Z",
      message: { role: "user", content: [{ type: "text", text: "hello" }] },
    }
    const branch: PiMonoJsonlGenericEntry = {
      type: "message",
      id: "branch",
      parentId: "root",
      timestamp: "2026-06-01T00:00:01.000Z",
      message: { role: "assistant", content: [{ type: "text", text: "branch" }] },
    }
    const entries = [root, branch]

    const moved = movePiMonoJsonlBranchWithSummary({
      entries,
      currentLeafId: "branch",
      targetLeafId: "root",
      leafEntryId: "leaf-to-root",
      summaryEntryId: "branch-summary-root",
      leafTimestamp: "2026-06-01T00:10:00.000Z",
      summaryTimestamp: "2026-06-01T00:10:01.000Z",
      summary: {
        summary: "Returned from branch.",
        details: { reason: "fixture" },
        fromHook: true,
      },
    })
    expect(moved.leafEntry).toEqual({
      type: "leaf",
      id: "leaf-to-root",
      parentId: "branch",
      timestamp: "2026-06-01T00:10:00.000Z",
      targetId: "root",
    })
    expect(moved.summaryEntry).toEqual({
      type: "branch_summary",
      id: "branch-summary-root",
      parentId: "root",
      timestamp: "2026-06-01T00:10:01.000Z",
      fromId: "root",
      summary: "Returned from branch.",
      details: { reason: "fixture" },
      fromHook: true,
    })
    expect(moved.currentLeafId).toBe("branch-summary-root")
    expect(moved.entries.map((entry) => entry.id)).toEqual([
      "root",
      "branch",
      "leaf-to-root",
      "branch-summary-root",
    ])
    expect(moved.pathIDs).toEqual(["root", "branch-summary-root"])
    expect(moved.context.messages).toEqual([
      root.message,
      {
        role: "branchSummary",
        summary: "Returned from branch.",
        fromId: "root",
        timestamp: Date.parse("2026-06-01T00:10:01.000Z"),
      },
    ])

    const rootless = movePiMonoJsonlBranchWithSummary({
      entries,
      currentLeafId: "branch",
      targetLeafId: null,
      leafEntryId: "leaf-to-rootless",
      summaryEntryId: "branch-summary-rootless",
      leafTimestamp: "2026-06-01T00:11:00.000Z",
      summaryTimestamp: "2026-06-01T00:11:01.000Z",
      summary: { summary: "Started a rootless branch." },
    })
    expect(rootless.summaryEntry).toMatchObject({
      parentId: null,
      fromId: "root",
      summary: "Started a rootless branch.",
    })
    expect(rootless.currentLeafId).toBe("branch-summary-rootless")
    expect(rootless.pathIDs).toEqual(["branch-summary-rootless"])

    const withoutSummary = movePiMonoJsonlBranchWithSummary({
      entries,
      currentLeafId: "branch",
      targetLeafId: "root",
      leafEntryId: "leaf-only-to-root",
      leafTimestamp: "2026-06-01T00:12:00.000Z",
    })
    expect(withoutSummary.summaryEntry).toBeUndefined()
    expect(withoutSummary.currentLeafId).toBe("root")
    expect(withoutSummary.pathIDs).toEqual(["root"])
    expect(withoutSummary.context.messages).toEqual([root.message])

    expect(() => movePiMonoJsonlBranchWithSummary({
      entries,
      currentLeafId: "branch",
      targetLeafId: "missing",
      leafEntryId: "leaf-missing",
      summaryEntryId: "branch-summary-missing",
      leafTimestamp: "2026-06-01T00:13:00.000Z",
      summaryTimestamp: "2026-06-01T00:13:01.000Z",
      summary: { summary: "Should not be written." },
    })).toThrow("Entry missing not found")
    expect(entries.map((entry) => entry.id)).toEqual(["root", "branch"])
  })

  it("publishes native descriptors and verifies the branch summary fixture", () => {
    const fixture = buildPiMonoSessionBranchSummaryNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "pi-mono",
      atomID: piMonoSessionBranchSummaryNativeExactAtomID,
      portID: "session.compaction-records",
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        piMonoSessionBranchSummaryNativeExactEvidenceRef,
        piMonoSessionBranchSummaryNativeExactReplayRef,
      ]),
      fixtureIDs: [piMonoSessionBranchSummaryNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "move-to-target-appends-leaf-pointer-before-summary",
      "move-to-null-summary-uses-root-from-id",
      "move-without-summary-leaves-active-target",
      "invalid-target-rejected-before-write",
    ])
    expect(verifyPiMonoSessionBranchSummaryNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(piMonoSessionBranchSummaryNativeDescriptor).toMatchObject({
      id: piMonoSessionBranchSummaryNativeExactAtomID,
      port: "session.compaction-records",
      parityCoverage: "native",
      knownLossiness: [],
    })
    expect(piMonoSessionNativeDescriptors.map((descriptor) => descriptor.id)).toEqual(expect.arrayContaining([
      piMonoSessionBranchSummaryNativeExactAtomID,
    ]))

    const mutated = {
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "move-to-target-appends-leaf-pointer-before-summary"
          ? { ...item, output: { ...item.output, currentLeafId: "root" } }
          : item,
      ),
    }
    expect(verifyPiMonoSessionBranchSummaryNativeExactFixture(mutated).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-session-branch-summary-native-exact.fingerprint" }),
      expect.objectContaining({ id: "pi-session-branch-summary-native-exact.cases" }),
    ]))
  })

  it("publishes native descriptors and verifies the SessionManager facade fixture", () => {
    const fixture = buildPiMonoSessionManagerNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "pi-mono",
      atomIDs: [
        piMonoSessionEventLogSessionManagerNativeExactAtomID,
        piMonoSessionReaderSessionManagerNativeExactAtomID,
        piMonoSessionWriterSessionManagerNativeExactAtomID,
        piMonoSessionMessageStoreSessionManagerNativeExactAtomID,
        piMonoSessionBranchingSessionManagerNativeExactAtomID,
        piMonoSessionDiffSessionManagerNativeExactAtomID,
      ],
      portIDs: [
        "session.event-log",
        "session.reader",
        "session.writer",
        "session.message-store",
        "session.branching",
        "session.diff",
      ],
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      nativeEvidenceRefs: expect.arrayContaining([
        piMonoSessionManagerNativeExactEvidenceRef,
        piMonoSessionManagerNativeExactReplayRef,
      ]),
      fixtureIDs: [piMonoSessionManagerNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "writer-create-header-and-reader-list",
      "message-store-appends-native-entries",
      "event-log-reads-append-only-entry-stream",
      "branching-switches-active-leaf-with-summary",
      "diff-returns-entry-and-leaf-transition-records",
      "reader-transcript-follows-active-branch",
    ])
    expect(fixture.cases.find((item) => item.scenarioID === "reader-transcript-follows-active-branch")?.output).toMatchObject({
      pathIDs: ["root", "sibling"],
      excludedEntryIDs: ["assistant"],
    })
    expect(fixture.cases.find((item) => item.scenarioID === "diff-returns-entry-and-leaf-transition-records")?.output).toMatchObject({
      recordTypes: [
        "session.entry.appended",
        "session.entry.appended",
        "session.entry.appended",
        "session.leaf.changed",
      ],
    })
    expect(verifyPiMonoSessionManagerNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(piMonoSessionManagerNativeDescriptors.map((descriptor) => descriptor.id)).toEqual([
      ...piMonoSessionManagerNativeExactAtomIDs,
    ])
    expect(piMonoSessionManagerNativeDescriptors.map((descriptor) => descriptor.port)).toEqual([
      ...piMonoSessionManagerNativeExactPortIDs,
    ])
    expect(piMonoSessionNativeDescriptors.map((descriptor) => descriptor.id)).toEqual(expect.arrayContaining([
      ...piMonoSessionManagerNativeExactAtomIDs,
    ]))

    const mutated = {
      ...fixture,
      cases: fixture.cases.map((item) =>
        item.scenarioID === "branching-switches-active-leaf-with-summary"
          ? { ...item, output: { ...item.output, currentLeafId: "assistant" } }
          : item,
      ),
    }
    expect(verifyPiMonoSessionManagerNativeExactFixture(mutated).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "pi-session-manager-native-exact.fingerprint" }),
      expect.objectContaining({ id: "pi-session-manager-native-exact.cases" }),
    ]))
  })

  it("exposes Pi native session atoms through the native session product schema module", () => {
    const contract = buildAssemblyContract({ product: "pi-mono", generatedAt: "2026-06-13T00:00:00.000Z" })
    for (const atomID of [
      ...piMonoSessionBranchGraphNativeExactAtomIDs,
      ...piMonoSessionContextSelectorNativeExactAtomIDs,
      ...piMonoSessionManagerNativeExactAtomIDs,
      piMonoSessionStoreJsonlV3NativeExactAtomID,
      piMonoSessionProjectorJsonlNativeExactAtomID,
      piMonoSessionProjectorJsonlV3NativeExactAtomID,
      piMonoSessionBranchSummaryNativeExactAtomID,
    ]) {
      expect(contract.atoms.find((atom) => atom.id === atomID)).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        source: expect.objectContaining({
          exportPath: "./product-schema/pi",
          specifier: "@helix/lego-session/product-schema/pi",
        }),
        knownLossiness: [],
      })
    }
    for (const atomID of piMonoSessionManagerNativeExactAtomIDs) {
      expect(contract.atoms.find((atom) => atom.id === atomID)).toMatchObject({
        nativeEvidenceRefs: expect.arrayContaining([
          piMonoSessionManagerNativeExactEvidenceRef,
          piMonoSessionManagerNativeExactReplayRef,
        ]),
        fixtureIDs: [piMonoSessionManagerNativeExactFixtureID],
        knownLossiness: [],
      })
    }
    for (const atomID of piMonoSessionBranchGraphNativeExactAtomIDs) {
      expect(contract.atoms.find((atom) => atom.id === atomID)).toMatchObject({
        nativeEvidenceRefs: expect.arrayContaining([
          piMonoSessionBranchGraphNativeExactEvidenceRef,
          piMonoSessionBranchGraphNativeExactReplayRef,
        ]),
        fixtureIDs: [piMonoSessionBranchGraphNativeExactFixtureID],
      })
    }
    for (const atomID of piMonoSessionContextSelectorNativeExactAtomIDs) {
      expect(contract.atoms.find((atom) => atom.id === atomID)).toMatchObject({
        nativeEvidenceRefs: expect.arrayContaining([
          piMonoSessionContextSelectorNativeExactEvidenceRef,
          piMonoSessionContextSelectorNativeExactReplayRef,
        ]),
        fixtureIDs: [piMonoSessionContextSelectorNativeExactFixtureID],
      })
    }
    expect(contract.atoms.find((atom) => atom.id === piMonoSessionStoreJsonlV3NativeExactAtomID)).toMatchObject({
      nativeEvidenceRefs: expect.arrayContaining([
        piMonoSessionStoreJsonlV3NativeExactEvidenceRef,
        piMonoSessionStoreJsonlV3NativeExactReplayRef,
      ]),
      fixtureIDs: [piMonoSessionStoreJsonlV3NativeExactFixtureID],
      knownLossiness: [],
    })
    for (const atomID of [piMonoSessionProjectorJsonlNativeExactAtomID, piMonoSessionProjectorJsonlV3NativeExactAtomID]) {
      expect(contract.atoms.find((atom) => atom.id === atomID)).toMatchObject({
        nativeEvidenceRefs: expect.arrayContaining([
          piMonoSessionProjectorJsonlV3NativeExactEvidenceRef,
          piMonoSessionProjectorJsonlV3NativeExactReplayRef,
        ]),
        fixtureIDs: [piMonoSessionProjectorJsonlV3NativeExactFixtureID],
        knownLossiness: [],
      })
    }
    expect(contract.atoms.find((atom) => atom.id === piMonoSessionBranchSummaryNativeExactAtomID)).toMatchObject({
      nativeEvidenceRefs: expect.arrayContaining([
        piMonoSessionBranchSummaryNativeExactEvidenceRef,
        piMonoSessionBranchSummaryNativeExactReplayRef,
      ]),
      fixtureIDs: [piMonoSessionBranchSummaryNativeExactFixtureID],
      knownLossiness: [],
    })
    expect(Object.fromEntries(contract.bindings.map((binding) => [binding.capability.id, binding.providerAtom]))).toMatchObject({
      "session.event-log": piMonoSessionEventLogSessionManagerNativeExactAtomID,
      "session.reader": piMonoSessionReaderSessionManagerNativeExactAtomID,
      "session.writer": piMonoSessionWriterSessionManagerNativeExactAtomID,
      "session.message-store": piMonoSessionMessageStoreSessionManagerNativeExactAtomID,
      "session.branching": piMonoSessionBranchingSessionManagerNativeExactAtomID,
      "session.diff": piMonoSessionDiffSessionManagerNativeExactAtomID,
    })
    for (const capability of piMonoSessionManagerNativeExactPortIDs) {
      const binding = contract.bindings.find((candidate) => candidate.capability.id === capability)
      expect(binding).toMatchObject({
        source: "recipe-explicit",
        replaceable: true,
      })
      expect(binding?.canSwapWith).toEqual(expect.arrayContaining([
        expect.stringMatching(/^session\./),
      ]))
    }
  })
})
