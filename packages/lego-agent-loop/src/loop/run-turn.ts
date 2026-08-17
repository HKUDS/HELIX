import { createID, type LegoMessagePart, type LegoSerializedError } from "@helix/contracts"
import { createAssistantMessage, createUserMessage } from "@helix/lego-session"
import { buildProviderContext } from "../context-builder.ts"
import { emitTurnPipelineTrace } from "../pipeline/index.ts"
import {
  acceptanceEvidenceAvailability,
  acceptanceUnavailableEvidence,
} from "./acceptance-step.ts"
import { envelope, record, serializeError } from "./events.ts"
import { runProviderStep } from "./provider-step.ts"
import type { AgentLoopTurnContext, AgentTurnResult } from "./public-types.ts"
import {
  applyAssistantMetadata,
  applyAssistantPartProtocol,
  cadenceProductFromAssistantProtocol,
  createSyntheticContinueMessage,
  emitSyntheticMessage,
  finalSummaryPolicyFromServices,
  partToTextForPolicy,
  requestBoundaryPolicyFromServices,
  shouldSyntheticContinue,
} from "./summary-step.ts"
import { DEFAULT_MAX_TOOL_RESULT_TEXT_CHARS } from "./types.ts"

export async function runAgentTurn(input: AgentLoopTurnContext): Promise<AgentTurnResult> {
  const sessionInfo = input.turn.sessionID
    ? await input.session.get(input.turn.sessionID)
    : await input.session.create({ cwd: input.cwd ?? process.cwd() })

  const inputResult = await input.hooks.emit(
    envelope("input", sessionInfo.id, { text: input.turn.text, source: "interactive" }),
    input.turn.signal,
  )
  let prompt = input.turn.text
  const inputRecord = record(inputResult)
  if (inputRecord?.["action"] === "handled") {
    await emitTurnPipelineTrace(input.hooks, {
      sessionID: sessionInfo.id,
      atomID: "turn.input-normalizer",
      phase: "end",
      details: { action: "handled" },
      ...(input.turn.signal ? { signal: input.turn.signal } : {}),
    })
    const userMessage = createUserMessage({ sessionID: sessionInfo.id, text: prompt })
    await input.session.appendMessage(userMessage)
    const assistantMessage = createAssistantMessage({ sessionID: sessionInfo.id, text: "" })
    await emitTurnPipelineTrace(input.hooks, {
      sessionID: sessionInfo.id,
      atomID: "turn.result-recorder",
      phase: "end",
      details: { finish: "handled" },
      ...(input.turn.signal ? { signal: input.turn.signal } : {}),
    })
    return {
      session: sessionInfo,
      userMessage,
      assistantMessage,
      transcript: await input.session.messages({ sessionID: sessionInfo.id }),
      blockedTools: [],
      steps: 0,
      finish: "handled",
      contextCompacted: false,
    }
  }
  if (inputRecord?.["action"] === "transform" && typeof inputRecord["text"] === "string") {
    prompt = inputRecord["text"]
  }
  await emitTurnPipelineTrace(input.hooks, {
    sessionID: sessionInfo.id,
    atomID: "turn.input-normalizer",
    phase: "end",
    details: { transformed: prompt !== input.turn.text },
    ...(input.turn.signal ? { signal: input.turn.signal } : {}),
  })

  await input.hooks.emit(envelope("session.start", sessionInfo.id, { sessionID: sessionInfo.id }), input.turn.signal)
  const userMessage = createUserMessage({ sessionID: sessionInfo.id, text: prompt })
  await input.session.appendMessage(userMessage)
  await input.hooks.emit(envelope("turn.start", sessionInfo.id, { turnIndex: 0 }), input.turn.signal)
  await input.hooks.emit(envelope("message.start", sessionInfo.id, { message: userMessage }), input.turn.signal)
  await input.hooks.emit(envelope("message.end", sessionInfo.id, { message: userMessage }), input.turn.signal)

  const before = await input.hooks.emit(
    envelope("before_agent_start", sessionInfo.id, {
      prompt,
      systemPrompt: input.turn.systemPrompt,
      messages: await input.session.messages({ sessionID: sessionInfo.id }),
    }),
    input.turn.signal,
  )
  const beforeRecord = record(before)
  const systemPrompt =
    beforeRecord && typeof beforeRecord["systemPrompt"] === "string" ? beforeRecord["systemPrompt"] : input.turn.systemPrompt
  await emitTurnPipelineTrace(input.hooks, {
    sessionID: sessionInfo.id,
    atomID: "turn.prompt-assembler",
    phase: "end",
    details: { transformed: systemPrompt !== input.turn.systemPrompt },
    ...(input.turn.signal ? { signal: input.turn.signal } : {}),
  })

  const models = await input.turn.provider.models()
  const model = input.turn.model ?? models[0]
  if (!model) throw new Error(`Provider ${input.turn.provider.id} did not expose a model`)

  const parts: LegoMessagePart[] = []
  const blockedTools: Array<{ toolName: string; reason?: string }> = []
  const maxSteps = Math.max(1, input.turn.maxSteps ?? 8)
  const maxRetries = Math.max(0, input.turn.maxRetries ?? 0)
  const retryDelayMs = Math.max(0, input.turn.retryDelayMs ?? 0)
  const maxToolResultTextChars = Math.max(1, input.turn.maxToolResultTextChars ?? DEFAULT_MAX_TOOL_RESULT_TEXT_CHARS)
  const maxSyntheticContinues = Math.max(0, input.turn.maxSyntheticContinues ?? 1)
  const syntheticContinueText = input.turn.syntheticContinueText ?? "Continue."
  const acceptanceContinueText =
    input.turn.syntheticContinueText ??
    "The task is not complete yet. Use the available tools to inspect the workspace, update the required files, and run the verification command before answering."
  const acceptanceActionText = (missingEvidence: string[]): string => {
    const actions: string[] = []
    if (missingEvidence.some((evidence) => evidence.startsWith("workspace.diff.") || evidence.includes("solution.py.modified"))) {
      actions.push("Modify solution.py now; do not stop with analysis only.")
    }
    if (missingEvidence.some((evidence) => evidence === "tool.called.bash" || evidence.startsWith("tool.result.bash."))) {
      actions.push("Run the required verification command with bash, usually `python3 test_solution.py`, and wait for it to finish.")
    }
    if (missingEvidence.some((evidence) => evidence.startsWith("tool.result.bash."))) {
      actions.push("If the tests fail, inspect the failure, update solution.py again, and rerun the verification command before answering.")
    }
    return actions.join(" ")
  }
  const cadenceProduct = input.turn.cadenceProduct ?? cadenceProductFromAssistantProtocol(input.turn.assistantPartProtocol)
  const requestBoundaryPolicy = requestBoundaryPolicyFromServices(input.hooks.services, cadenceProduct)
  const finalSummaryPolicy = finalSummaryPolicyFromServices(input.hooks.services, cadenceProduct)
  const persistedMessages = await input.session.messages({ sessionID: sessionInfo.id })
  const context = await buildProviderContext({
    session: input.session,
    hooks: input.hooks,
    sessionInfo,
    systemPrompt,
    messages: persistedMessages,
    model,
    autoCompact: input.turn.autoCompact ?? true,
    ...(input.turn.maxInputTokens === undefined ? {} : { maxInputTokens: input.turn.maxInputTokens }),
    ...(input.turn.compactionKeepMessages === undefined ? {} : { compactionKeepMessages: input.turn.compactionKeepMessages }),
    ...(input.turn.signal ? { signal: input.turn.signal } : {}),
  })
  await emitTurnPipelineTrace(input.hooks, {
    sessionID: sessionInfo.id,
    atomID: "turn.context-builder",
    phase: "end",
    details: {
      messageCount: context.messages.length,
      compacted: context.compacted,
      tokenEstimate: context.tokenEstimate,
      ...(context.tokenLimit === undefined ? {} : { tokenLimit: context.tokenLimit }),
    },
    ...(input.turn.signal ? { signal: input.turn.signal } : {}),
  })
  await emitTurnPipelineTrace(input.hooks, {
    sessionID: sessionInfo.id,
    atomID: "turn.compaction-policy",
    phase: "decision",
    details: {
      compacted: context.compacted,
      autocontinue: context.autocontinue === true,
      tokenEstimate: context.tokenEstimate,
      ...(context.tokenLimit === undefined ? {} : { tokenLimit: context.tokenLimit }),
    },
    ...(input.turn.signal ? { signal: input.turn.signal } : {}),
  })
  await input.hooks.emit(
    envelope("agent.start", sessionInfo.id, {
      sessionID: sessionInfo.id,
      prompt,
      systemPrompt,
      providerID: input.turn.provider.id,
      model,
      maxSteps,
      maxRetries,
      maxSyntheticContinues,
      contextCompacted: context.compacted,
      tokenEstimate: context.tokenEstimate,
      tokenLimit: context.tokenLimit,
    }),
    input.turn.signal,
  )

  const syntheticContinueEnabled = input.turn.syntheticContinue ?? context.autocontinue ?? false
  let syntheticContinues = 0
  let providerMessages = context.messages
  if (context.autocontinue && syntheticContinueEnabled && syntheticContinues < maxSyntheticContinues) {
    const syntheticMessage = createSyntheticContinueMessage({
      sessionID: sessionInfo.id,
      text: syntheticContinueText,
      reason: "compaction",
      metadata: { source: "compaction_autocontinue" },
    })
    await emitSyntheticMessage(input.hooks, syntheticMessage, input.turn.signal)
    await emitTurnPipelineTrace(input.hooks, {
      sessionID: sessionInfo.id,
      atomID: "turn.continuation-policy",
      phase: "decision",
      details: { reason: "compaction", syntheticContinues: syntheticContinues + 1 },
      ...(input.turn.signal ? { signal: input.turn.signal } : {}),
    })
    providerMessages = [...providerMessages, syntheticMessage]
    syntheticContinues++
  }
  let steps = 0
  let finalFinish: string | undefined
  let finalUsage: unknown
  let finalCost: number | undefined
  let finalError: LegoSerializedError | undefined
  let retries = 0

  for (let step = 0; step < maxSteps; step++) {
    steps = step + 1
    const stepResult = await runProviderStep({
      provider: input.turn.provider,
      hooks: input.hooks,
      session: sessionInfo,
      model,
      systemPrompt,
      messages: providerMessages,
      tools: Array.from(input.hooks.registries.tools.values()),
      step,
      maxSteps,
      maxRetries,
      retryDelayMs,
      maxToolResultTextChars,
      parts,
      blockedTools,
      ...(input.turn.signal ? { signal: input.turn.signal } : {}),
      ...(input.cwd ? { cwd: input.cwd } : {}),
      cadenceProduct,
    })
    retries += stepResult.retries
    if (stepResult.error) {
      finalError = serializeError(stepResult.error)
      finalFinish = "provider_error"
      parts.push({
        id: createID("part"),
        type: "text",
        text: `Provider error: ${finalError.message}`,
      })
      break
    }

    const { finishEvent, stepHadToolCall } = stepResult
    if (finishEvent) {
      finalFinish = finishEvent.finish
      if (finishEvent.usage) finalUsage = finishEvent.usage
      if (finishEvent.cost !== undefined) finalCost = finishEvent.cost
    }

    if (!stepHadToolCall) {
      const evidenceAvailability = acceptanceEvidenceAvailability(stepResult.acceptanceDecision)
      const unavailableEvidence = acceptanceUnavailableEvidence(stepResult.acceptanceDecision)
      const finalSummary = finalSummaryPolicy.decide({
        product: cadenceProduct,
        ...(finishEvent?.finish ? { finish: finishEvent.finish } : {}),
        accepted: false,
        ...(stepResult.acceptanceDecision ? { acceptanceStatus: stepResult.acceptanceDecision.status } : {}),
        evidenceAvailability,
        toolCallCount: 0,
        visibleText: parts.some((part) => partToTextForPolicy(part)) ? "has-text" : "empty",
      })
      await emitTurnPipelineTrace(input.hooks, {
        sessionID: sessionInfo.id,
        atomID: "agent-loop.final-summary",
        phase: "decision",
        step,
        details: {
          decision: finalSummary.decision,
          reason: finalSummary.reasonCode,
          policyAtomID: finalSummary.atomID,
          ...(stepResult.acceptanceDecision ? { acceptanceStatus: stepResult.acceptanceDecision.status } : {}),
          evidenceAvailability,
          evidenceTimingReason: unavailableEvidence.length > 0 ? "acceptance-evidence-unavailable" : "acceptance-evidence-available",
          blockedByUnavailableEvidence: unavailableEvidence,
        },
        ...(input.turn.signal ? { signal: input.turn.signal } : {}),
      })
      const acceptanceDecision = stepResult.acceptanceDecision
      const acceptanceNeedsContinuation =
        acceptanceDecision &&
        ["continue", "summarize", "inconclusive"].includes(acceptanceDecision.status) &&
        unavailableEvidence.length > 0
      if (
        acceptanceNeedsContinuation &&
        syntheticContinueEnabled &&
        syntheticContinues < maxSyntheticContinues &&
        step < maxSteps - 1
      ) {
        const actionText = acceptanceActionText(unavailableEvidence)
        const syntheticMessage = createSyntheticContinueMessage({
          sessionID: sessionInfo.id,
          text: `${acceptanceContinueText}${actionText ? `\n\n${actionText}` : ""}\n\nMissing acceptance evidence: ${unavailableEvidence.join(", ")}.`,
          reason: "acceptance",
          metadata: {
            acceptanceStatus: acceptanceDecision.status,
            blockedByUnavailableEvidence: unavailableEvidence,
            step,
          },
        })
        await emitSyntheticMessage(input.hooks, syntheticMessage, input.turn.signal)
        await emitTurnPipelineTrace(input.hooks, {
          sessionID: sessionInfo.id,
          atomID: "turn.continuation-policy",
          phase: "decision",
          step,
          details: {
            reason: "acceptance",
            acceptanceStatus: acceptanceDecision.status,
            blockedByUnavailableEvidence: unavailableEvidence,
            syntheticContinues: syntheticContinues + 1,
          },
          ...(input.turn.signal ? { signal: input.turn.signal } : {}),
        })
        providerMessages = [
          ...context.messages,
          createAssistantMessage({ sessionID: sessionInfo.id, text: "", parts: structuredClone(parts) }),
          syntheticMessage,
        ]
        syntheticContinues++
        continue
      }
      if (
        finishEvent &&
        shouldSyntheticContinue(finishEvent.finish) &&
        syntheticContinueEnabled &&
        syntheticContinues < maxSyntheticContinues &&
        step < maxSteps - 1
      ) {
        const syntheticMessage = createSyntheticContinueMessage({
          sessionID: sessionInfo.id,
          text: syntheticContinueText,
          reason: "continue",
          metadata: { finish: finishEvent.finish, step },
        })
        await emitSyntheticMessage(input.hooks, syntheticMessage, input.turn.signal)
        await emitTurnPipelineTrace(input.hooks, {
          sessionID: sessionInfo.id,
          atomID: "turn.continuation-policy",
          phase: "decision",
          step,
          details: { reason: "finish", finish: finishEvent.finish, syntheticContinues: syntheticContinues + 1 },
          ...(input.turn.signal ? { signal: input.turn.signal } : {}),
        })
        providerMessages = [
          ...context.messages,
          createAssistantMessage({ sessionID: sessionInfo.id, text: "", parts: structuredClone(parts) }),
          syntheticMessage,
        ]
        syntheticContinues++
        continue
      }
      await emitTurnPipelineTrace(input.hooks, {
        sessionID: sessionInfo.id,
        atomID: "turn.stop-condition",
        phase: "decision",
        step,
        details: { reason: "no-tool-call", finish: finishEvent?.finish ?? "unknown" },
        ...(input.turn.signal ? { signal: input.turn.signal } : {}),
      })
      break
    }
    if (stepResult.acceptedEarly) {
      finalFinish = "accepted"
      const evidenceAvailability = acceptanceEvidenceAvailability(stepResult.acceptanceDecision)
      const unavailableEvidence = acceptanceUnavailableEvidence(stepResult.acceptanceDecision)
      const finalSummary = finalSummaryPolicy.decide({
        product: cadenceProduct,
        accepted: true,
        acceptanceStatus: stepResult.acceptanceDecision?.status ?? "accept",
        evidenceAvailability,
        productStopBeforeSummary: true,
        toolCallCount: parts.filter((part) => part.type === "tool_call").length,
        visibleText: parts.some((part) => partToTextForPolicy(part)) ? "has-text" : "empty",
      })
      await emitTurnPipelineTrace(input.hooks, {
        sessionID: sessionInfo.id,
        atomID: "agent-loop.final-summary",
        phase: "decision",
        step,
        details: {
          decision: finalSummary.decision,
          reason: finalSummary.reasonCode,
          accepted: true,
          policyAtomID: finalSummary.atomID,
          acceptanceStatus: stepResult.acceptanceDecision?.status ?? "accept",
          evidenceAvailability,
          evidenceTimingReason: unavailableEvidence.length > 0 ? "acceptance-evidence-unavailable" : "acceptance-evidence-available",
          blockedByUnavailableEvidence: unavailableEvidence,
        },
        ...(input.turn.signal ? { signal: input.turn.signal } : {}),
      })
      await emitTurnPipelineTrace(input.hooks, {
        sessionID: sessionInfo.id,
        atomID: "turn.stop-condition",
        phase: "decision",
        step,
        details: { reason: "accepted-early", acceptance: stepResult.acceptanceDecision?.reasonCode ?? "accepted" },
        ...(input.turn.signal ? { signal: input.turn.signal } : {}),
      })
      break
    }
    if (step === maxSteps - 1) {
      finalFinish = "max_steps"
      await emitTurnPipelineTrace(input.hooks, {
        sessionID: sessionInfo.id,
        atomID: "turn.stop-condition",
        phase: "decision",
        step,
        details: { reason: "max-steps" },
        ...(input.turn.signal ? { signal: input.turn.signal } : {}),
      })
      break
    }
    const boundary = requestBoundaryPolicy.decide({
      product: cadenceProduct,
      step,
      maxSteps,
      ...(finishEvent?.finish ? { finish: finishEvent.finish } : {}),
      toolCallCount: parts.filter((part) => part.type === "tool_call").length,
      ...(stepResult.acceptanceDecision ? { acceptanceStatus: stepResult.acceptanceDecision.status } : {}),
      evidenceAvailability: acceptanceEvidenceAvailability(stepResult.acceptanceDecision),
      syntheticContinues,
    })
    const unavailableEvidence = acceptanceUnavailableEvidence(stepResult.acceptanceDecision)
    await emitTurnPipelineTrace(input.hooks, {
      sessionID: sessionInfo.id,
      atomID: "agent-loop.request-boundary",
      phase: "decision",
      step,
      details: {
        decision: boundary.decision,
        reason: boundary.reasonCode,
        policyAtomID: boundary.atomID,
        ...(stepResult.acceptanceDecision ? { acceptanceStatus: stepResult.acceptanceDecision.status } : {}),
        evidenceAvailability: acceptanceEvidenceAvailability(stepResult.acceptanceDecision),
        evidenceTimingReason: unavailableEvidence.length > 0 ? "acceptance-evidence-unavailable" : "acceptance-evidence-available",
        blockedByUnavailableEvidence: unavailableEvidence,
      },
      ...(input.turn.signal ? { signal: input.turn.signal } : {}),
    })
    if (boundary.decision === "stop") {
      finalFinish = finalFinish ?? boundary.reasonCode
      break
    }
    providerMessages = [
      ...context.messages,
      createAssistantMessage({ sessionID: sessionInfo.id, text: "", parts: structuredClone(parts) }),
    ]
  }

  const assistantParts = applyAssistantPartProtocol(parts, {
    protocol: input.turn.assistantPartProtocol ?? "common",
    sessionID: sessionInfo.id,
    steps,
    providerID: String(input.turn.provider.id),
    modelID: String(model.modelID),
    ...(finalFinish ? { finish: finalFinish } : {}),
  })
  const assistantMessage = createAssistantMessage({ sessionID: sessionInfo.id, text: "", parts: assistantParts })
  applyAssistantMetadata(assistantMessage, {
    ...(finalFinish ? { finish: finalFinish } : {}),
    ...(finalUsage ? { usage: finalUsage } : {}),
    ...(finalCost === undefined ? {} : { cost: finalCost }),
    ...(finalError ? { error: finalError } : {}),
  })
  await input.hooks.emit(envelope("message.start", sessionInfo.id, { message: assistantMessage }), input.turn.signal)
  await input.session.appendMessage(assistantMessage)
  await emitTurnPipelineTrace(input.hooks, {
    sessionID: sessionInfo.id,
    atomID: "turn.result-recorder",
    phase: "end",
    details: { parts: assistantMessage.parts.length, finish: finalFinish ?? "unknown" },
    ...(input.turn.signal ? { signal: input.turn.signal } : {}),
  })
  await input.hooks.emit(envelope("message.end", sessionInfo.id, { message: assistantMessage }), input.turn.signal)
  await input.hooks.emit(
    envelope("agent.end", sessionInfo.id, {
      sessionID: sessionInfo.id,
      message: assistantMessage,
      blockedTools,
      steps,
      retries,
      syntheticContinues,
      ...(finalFinish ? { finish: finalFinish } : {}),
      ...(finalError ? { error: finalError } : {}),
    }),
    input.turn.signal,
  )
  await input.hooks.emit(
    envelope("turn.end", sessionInfo.id, {
      turnIndex: 0,
      message: assistantMessage,
      steps,
      retries,
      syntheticContinues,
      ...(finalFinish ? { finish: finalFinish } : {}),
      ...(finalError ? { error: finalError } : {}),
    }),
    input.turn.signal,
  )
  await input.hooks.emit(envelope("session.idle", sessionInfo.id, { sessionID: sessionInfo.id }), input.turn.signal)

  return {
    session: sessionInfo,
    userMessage,
    assistantMessage,
    transcript: await input.session.messages({ sessionID: sessionInfo.id }),
    blockedTools,
    steps,
    ...(finalFinish ? { finish: finalFinish } : {}),
    ...(finalUsage ? { usage: finalUsage } : {}),
    ...(finalCost === undefined ? {} : { cost: finalCost }),
    contextCompacted: context.compacted,
    contextTokenEstimate: context.tokenEstimate,
    ...(context.tokenLimit === undefined ? {} : { contextTokenLimit: context.tokenLimit }),
    retries,
    syntheticContinues,
    ...(finalError ? { error: finalError } : {}),
  }
}
