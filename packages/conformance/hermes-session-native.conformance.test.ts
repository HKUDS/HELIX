import { describe, expect, it } from "vitest"
import {
  buildHermesSessionNativeExactFixture,
  buildHermesTrajectoryEntry,
  convertHermesScratchpadToThink,
  createHermesACPSession,
  createHermesACPSessionAtom,
  decodeHermesSessionContent,
  encodeHermesSessionContent,
  forkHermesACPSession,
  hermesCwdFromModelConfig,
  hermesSessionBranchGraphLineageNativeExactAtomID,
  hermesSessionCompactionTrajectoryNativeExactAtomID,
  hermesSessionContextSelectorThreadHistoryNativeExactAtomID,
  hermesSessionIDGeneratorNativeExactAtomID,
  hermesSessionMessagePartProjectorNativeExactAtomID,
  hermesSessionNativeDescriptors,
  hermesSessionNativeExactAtomIDs,
  hermesSessionNativeExactEvidenceRef,
  hermesSessionNativeExactFixtureID,
  hermesSessionNativeExactReplayRef,
  hermesSessionPaginationUpdatedAtNativeExactAtomID,
  hermesSessionProjectorOpenAIMessagesNativeExactAtomID,
  hermesSessionSQLiteNativeFacts,
  hermesSessionStoreSqliteFtsNativeExactAtomID,
  hasHermesIncompleteScratchpad,
  listHermesACPSessions,
  projectHermesOpenAIConversation,
  replaceHermesSessionMessages,
  sanitizeHermesContext,
  verifyHermesSessionNativeExactFixture,
  type HermesACPSessionState,
} from "@helix/adapters-hermes/product-schema/session"
import { buildAssemblyContract, verifyAssemblyContract } from "@helix/recipes"

describe("Hermes ACP session native exact fixture", () => {
  it("matches upstream SessionManager create, fork, list, cwd filter, title, and updated-at behavior", () => {
    const atom = createHermesACPSessionAtom()
    const created = createHermesACPSession({
      cwd: "E:\\Projects\\AI\\paperclip",
      sessionUUID: "d1f80a7c-2f6d-41b8-9a10-8dfc4d0c71bd",
      isWSL: true,
      agentModel: "nous/hermes-4",
    })
    const original: HermesACPSessionState = {
      session_id: created.session_id,
      cwd: "/work/base",
      model: "nous/hermes-4",
      history: [
        { role: "user", content: "original context" },
        { role: "assistant", content: { nested: ["reply"] } },
      ],
    }
    const forked = forkHermesACPSession(original, {
      cwd: "D:\\work\\project",
      sessionUUID: "16a9a8ff-9056-4da0-9a5b-66c0f383dc40",
      isWSL: true,
      agentModel: "",
    })

    expect(created).toEqual({
      session_id: "d1f80a7c-2f6d-41b8-9a10-8dfc4d0c71bd",
      cwd: "/mnt/e/Projects/AI/paperclip",
      model: "nous/hermes-4",
      history: [],
    })
    expect(forked).toMatchObject({
      session_id: "16a9a8ff-9056-4da0-9a5b-66c0f383dc40",
      cwd: "/mnt/d/work/project",
      model: "nous/hermes-4",
      history: original.history,
    })
    expect(atom.forkSession({ original: null, sessionUUID: "c7b77809-16e4-4b21-8a07-81fb12f91afe" })).toBeNull()
    if (forked) forked.history[1] = { role: "assistant", content: { nested: ["mutated"] } }
    expect(original.history[1]).toEqual({ role: "assistant", content: { nested: ["reply"] } })

    const memoryListing = atom.listSessions({
      nowSeconds: 1_700_000_020.5,
      cwd: "/mnt/e/Projects/AI/browser-link-3",
      memorySessions: [
        {
          session_id: "mem-old",
          cwd: "/mnt/e/Projects/AI/browser-link-3",
          model: "hermes-old",
          history: [{ role: "user", content: "  Investigate broken ACP history in Zed  " }],
        },
        {
          session_id: "mem-empty",
          cwd: "/mnt/e/Projects/AI/browser-link-3",
          model: "ignored",
          history: [],
        },
        {
          session_id: "mem-drop",
          cwd: "/tmp/other",
          model: "ignored",
          history: [{ role: "user", content: "wrong cwd" }],
        },
      ],
      persistedRows: [
        {
          id: "mem-old",
          title: " Fix Zed ACP history ",
          started_at: 1_700_000_000,
          last_active: 1_700_000_001.25,
        },
      ],
    })
    expect(memoryListing).toEqual([
      {
        session_id: "mem-old",
        cwd: "/mnt/e/Projects/AI/browser-link-3",
        model: "hermes-old",
        history_len: 1,
        title: "Fix Zed ACP history",
        updated_at: "2023-11-14T22:13:21.250000+00:00",
      },
    ])

    const persistedListing = listHermesACPSessions({
      cwd: "E:\\Projects\\AI\\browser-link-3",
      persistedRows: [
        {
          id: "persist-newer",
          model: "nous/hermes-4",
          model_config: JSON.stringify({ cwd: "/mnt/e/Projects/AI/browser-link-3" }),
          message_count: 3,
          preview: " Resume browser-link investigation ",
          last_active: "2026-06-13T12:10:42Z",
        },
        {
          id: "persist-older",
          model: "openrouter/auto",
          model_config: JSON.stringify({ cwd: "E:\\Projects\\AI\\browser-link-3" }),
          message_count: 1,
          preview: "Older thread",
          started_at: 1_700_000_000,
        },
        {
          id: "persist-empty",
          model_config: JSON.stringify({ cwd: "/mnt/e/Projects/AI/browser-link-3" }),
          message_count: 0,
          preview: "hidden",
        },
        {
          id: "persist-drop",
          model_config: JSON.stringify({ cwd: "/tmp/other" }),
          message_count: 1,
          preview: "wrong cwd",
        },
      ],
    })
    expect(persistedListing.map((item) => item.session_id)).toEqual(["persist-newer", "persist-older"])
    expect(persistedListing.map((item) => item.title)).toEqual(["Resume browser-link investigation", "Older thread"])
    expect(persistedListing.map((item) => item.updated_at)).toEqual([
      "2026-06-13T12:10:42Z",
      "2023-11-14T22:13:20+00:00",
    ])
    expect(hermesCwdFromModelConfig("{bad json")).toBe(".")
  })

  it("matches upstream SessionDB SQLite/FTS storage, OpenAI replay, and trajectory projection", () => {
    expect(hermesSessionSQLiteNativeFacts.schemaVersion).toBe(14)
    expect(hermesSessionSQLiteNativeFacts.ftsTables).toEqual(["messages_fts", "messages_fts_trigram"])
    expect(hermesSessionSQLiteNativeFacts.ftsTriggers).toEqual(expect.arrayContaining(["messages_fts_insert", "messages_fts_trigram_update"]))
    expect(decodeHermesSessionContent(encodeHermesSessionContent([{ type: "text", text: "hi" }]))).toEqual([{ type: "text", text: "hi" }])

    const stored = replaceHermesSessionMessages({
      sessionID: "d1f80a7c-2f6d-41b8-9a10-8dfc4d0c71bd",
      startTimestamp: 1_700_000_100,
      messages: [
        { role: "user", content: "  Hello Hermes\n", platform_message_id: "platform-1" },
        {
          role: "assistant",
          content: "<memory-context>hidden</memory-context> Visible answer ",
          reasoning: "plan",
          reasoning_content: "<think>plan</think>",
          reasoning_details: [{ type: "summary_text", text: "plan" }],
          codex_reasoning_items: [{ id: "rs_1" }],
          codex_message_items: [{ id: "msg_1" }],
          finish_reason: "stop",
        },
        {
          role: "assistant",
          content: null,
          tool_calls: [{ id: "codex_exec_1", type: "function", function: { name: "exec_command", arguments: "{\"command\":\"pwd\"}" } }],
        },
        { role: "tool", content: "/work/project", tool_call_id: "codex_exec_1", tool_name: "exec_command" },
        { role: "user", content: [{ type: "text", text: "Look" }], observed: true },
        { role: "assistant", content: "inactive", active: 0 },
      ],
    })
    expect(stored.messageCount).toBe(6)
    expect(stored.toolCallCount).toBe(1)
    expect(stored.rows.map((row) => Number((row.timestamp - 1_700_000_100).toFixed(6)))).toEqual([0, 0.000001, 0.000002, 0.000003, 0.000004, 0.000005])
    expect(String(stored.rows[4]?.content)).toContain("\u0000json:")
    expect(stored.ftsIndexedContent[2]).toContain("exec_command")

    const replayed = projectHermesOpenAIConversation(stored.rows)
    expect(replayed.map((message) => message.role)).toEqual(["user", "assistant", "assistant", "tool", "user"])
    expect(replayed[0]).toMatchObject({ content: "Hello Hermes", message_id: "platform-1" })
    expect(replayed[1]).toMatchObject({
      content: "Visible answer",
      finish_reason: "stop",
      reasoning: "plan",
      reasoning_content: "<think>plan</think>",
      reasoning_details: [{ type: "summary_text", text: "plan" }],
      codex_reasoning_items: [{ id: "rs_1" }],
      codex_message_items: [{ id: "msg_1" }],
    })
    expect(replayed[2]?.tool_calls).toEqual([{ id: "codex_exec_1", type: "function", function: { name: "exec_command", arguments: "{\"command\":\"pwd\"}" } }])
    expect(replayed[4]).toMatchObject({ content: [{ type: "text", text: "Look" }], observed: true })
    expect(projectHermesOpenAIConversation(stored.rows, { includeInactive: true })).toHaveLength(6)
    expect(sanitizeHermesContext("[System note: The following is recalled memory context, NOT new user input. Treat as authoritative reference data.]\n<memory-context>x</memory-context>ok")).toBe("ok")

    const trajectory = buildHermesTrajectoryEntry({
      trajectory: [{ from: "gpt", value: convertHermesScratchpadToThink("<REASONING_SCRATCHPAD>plan</REASONING_SCRATCHPAD>done") }],
      model: "nous/hermes-4",
      completed: true,
      timestamp: "2026-06-13T12:10:42.949000",
    })
    expect(trajectory.filename).toBe("trajectory_samples.jsonl")
    expect(trajectory.entry.conversations[0]?.value).toBe("<think>plan</think>done")
    expect(trajectory.line.endsWith("\n")).toBe(true)
    expect(buildHermesTrajectoryEntry({ trajectory: [], model: "nous/hermes-4", completed: false }).filename).toBe("failed_trajectories.jsonl")
    expect(hasHermesIncompleteScratchpad("<REASONING_SCRATCHPAD>plan")).toBe(true)
    expect(hasHermesIncompleteScratchpad("<REASONING_SCRATCHPAD>plan</REASONING_SCRATCHPAD>")).toBe(false)
  })

  it("publishes and verifies the Hermes ACP session native fixture", () => {
    const fixture = buildHermesSessionNativeExactFixture()

    expect(fixture).toMatchObject({
      schemaVersion: 1,
      product: "hermes-agent",
      atomIDs: [
        hermesSessionIDGeneratorNativeExactAtomID,
        hermesSessionBranchGraphLineageNativeExactAtomID,
        hermesSessionPaginationUpdatedAtNativeExactAtomID,
        hermesSessionContextSelectorThreadHistoryNativeExactAtomID,
        hermesSessionStoreSqliteFtsNativeExactAtomID,
        hermesSessionProjectorOpenAIMessagesNativeExactAtomID,
        hermesSessionMessagePartProjectorNativeExactAtomID,
        hermesSessionCompactionTrajectoryNativeExactAtomID,
      ],
      portIDs: [
        "session.id-generator",
        "session.branch-graph",
        "session.pagination",
        "session.context-selector",
        "session.store",
        "session.projector",
        "session.message-part-projector",
        "session.compaction-records",
      ],
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      evidenceRef: hermesSessionNativeExactEvidenceRef,
      fixtureID: hermesSessionNativeExactFixtureID,
      knownLossiness: [],
      intentionallyBridgeAtoms: [],
      policy: {
        acpCreateSessionUsesUUID4AndTranslatedCwd: true,
        acpForkSessionUsesFreshUUID4AndDeepCopiedHistory: true,
        listSessionsMergesMemoryWithDBRows: true,
        listSessionsFiltersByNormalizedCwd: true,
        listSessionsSortsByUpdatedAtDescending: true,
        sqliteStoreUsesWalFallbackAndFts5Triggers: true,
        replaceMessagesDeletesAndReinsertsAtomically: true,
        openaiConversationReplayDecodesStructuredContentAndReasoning: true,
        messagePartProjectorReplaysToolCallsReasoningStructuredContentAndObservedRows: true,
        compactionTrajectoryWritesJsonlAndConvertsScratchpadTags: true,
      },
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "create-session-uuid-and-translated-cwd",
      "fork-session-deep-copies-history-and-model",
      "list-memory-sessions-title-preview-and-updated-at",
      "list-persisted-sessions-cwd-filter-and-sort",
      "sqlite-fts-schema-and-replace-messages",
      "openai-message-replay-and-sanitized-context",
      "trajectory-scratchpad-and-jsonl-entry",
    ])
    expect(fixture.sourceRefs).toEqual(expect.arrayContaining([
      expect.stringContaining("acp_adapter/session.py#SessionManager.create_session"),
      expect.stringContaining("tests/acp/test_session.py#TestCreateSession"),
      expect.stringContaining("hermes_state.py#SCHEMA_SQL"),
      expect.stringContaining("SessionDB.replace_messages"),
      expect.stringContaining("agent/trajectory.py#convert_scratchpad_to_think"),
    ]))
    expect(verifyHermesSessionNativeExactFixture(fixture)).toEqual({ ok: true, issues: [] })
    expect(hermesSessionNativeDescriptors.map((descriptor) => descriptor.id)).toEqual([...hermesSessionNativeExactAtomIDs])
    for (const descriptor of hermesSessionNativeDescriptors) {
      expect(descriptor).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([hermesSessionNativeExactEvidenceRef, hermesSessionNativeExactReplayRef]),
        fixtureIDs: [hermesSessionNativeExactFixtureID],
        knownLossiness: [],
      })
    }
  })

  it("rejects drift away from Hermes ACP session native behavior", () => {
    const fixture = buildHermesSessionNativeExactFixture()

    expect(verifyHermesSessionNativeExactFixture({ ...fixture, fingerprint: "bad" }).ok).toBe(false)
    expect(verifyHermesSessionNativeExactFixture({ ...fixture, knownLossiness: ["hermes-session-source-matrix-partial-fixture"] }).issues.map((item) => item.id)).toContain(
      "hermes-session-native-exact.lossiness",
    )
    expect(verifyHermesSessionNativeExactFixture({ ...fixture, cases: [{ ...fixture.cases[0]!, output: { sessionIDIsUUID4: false } }, ...fixture.cases.slice(1)] }).issues.map((item) => item.id)).toContain(
      "hermes-session-native-exact.cases",
    )
  })

  it("promotes Hermes ACP session atoms to native factory descriptors in the assembly contract", () => {
    const contract = buildAssemblyContract({
      product: "hermes-agent",
      generatedAt: "2026-06-13T00:00:00.000Z",
    })
    const verification = verifyAssemblyContract(contract)

    expect(verification.ok).toBe(true)
    for (const atomID of hermesSessionNativeExactAtomIDs) {
      const atom = contract.atoms.find((candidate) => candidate.id === atomID)
      expect(atom, atomID).toMatchObject({
        id: atomID,
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([hermesSessionNativeExactEvidenceRef, hermesSessionNativeExactReplayRef]),
        fixtureIDs: [hermesSessionNativeExactFixtureID],
        knownLossiness: [],
        source: {
          packageDir: "adapters-hermes",
          exportPath: "./product-schema/session",
        },
      })
      expect(atom?.nativeEvidenceRefs).not.toContain("conformance:hermes-session-source-matrix")
      expect(atom?.fixtureIDs).not.toContain("hermes-session:source-matrix")
    }
    expect(contract.bindings.find((binding) => binding.portID === "session.message-part-projector")).toMatchObject({
      providerAtomID: hermesSessionMessagePartProjectorNativeExactAtomID,
      bindingSource: "recipe-explicit",
    })
  })
})
