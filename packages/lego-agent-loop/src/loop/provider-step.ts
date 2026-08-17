import { type LegoMessagePart, type LegoModel, type ProviderRequest, type ProviderStreamEvent } from "@helix/contracts"
import { normalizeProviderStream } from "@helix/lego-provider"
import { emitTurnPipelineTrace } from "../pipeline/index.ts"
import { evaluateAcceptanceController } from "./acceptance-step.ts"
import { envelope, record, serializeError, sleep } from "./events.ts"
import { consumeProviderEvent, executePreparedToolCalls } from "./tool-step.ts"
import type { PreparedToolCall, ProviderStepInput, ProviderStepResult } from "./types.ts"

export async function runProviderStep(input: ProviderStepInput): Promise<ProviderStepResult> {
  let lastError: unknown
  for (let attempt = 0; attempt <= input.maxRetries; attempt++) {
    let providerRequest: ProviderRequest = {
      model: input.model,
      system: [input.systemPrompt],
      messages: input.messages,
      tools: input.tools,
      ...(input.signal ? { signal: input.signal } : {}),
    }
    const providerPatch = await input.hooks.emit(
      envelope("provider.request.before", input.session.id, {
        providerID: input.provider.id,
        model: input.model,
        step: input.step,
        maxSteps: input.maxSteps,
        attempt,
        maxRetries: input.maxRetries,
        request: providerRequest,
      }),
      input.signal,
    )
    providerRequest = patchProviderRequest(providerRequest, record(providerPatch))
    await emitTurnPipelineTrace(input.hooks, {
      sessionID: input.session.id,
      atomID: "turn.provider-request-builder",
      phase: "end",
      step: input.step,
      attempt,
      details: { modelID: providerRequest.model.modelID, toolCount: providerRequest.tools.length },
      ...(input.signal ? { signal: input.signal } : {}),
    })

    const attemptParts: LegoMessagePart[] = []
    const attemptBlockedTools: Array<{ toolName: string; reason?: string }> = []
    const preparedToolCalls: PreparedToolCall[] = []
    let eventCount = 0
    let stepHadToolCall = false
    let finishEvent: Extract<ProviderStreamEvent, { type: "finish" }> | undefined
    try {
      await emitTurnPipelineTrace(input.hooks, {
        sessionID: input.session.id,
        atomID: "turn.provider-stream-runner",
        phase: "start",
        step: input.step,
        attempt,
        details: { providerID: input.provider.id },
        ...(input.signal ? { signal: input.signal } : {}),
      })
      for await (const event of normalizeProviderStream(input.provider.stream(providerRequest))) {
        eventCount++
        if (event.type === "finish") finishEvent = event
        const consumed = await consumeProviderEvent({
          event,
          session: input.session,
          parts: attemptParts,
          blockedTools: attemptBlockedTools,
          hooks: input.hooks,
          ...(input.signal ? { signal: input.signal } : {}),
          ...(input.cwd ? { cwd: input.cwd } : {}),
        })
        stepHadToolCall = stepHadToolCall || consumed.toolCall
        if (consumed.preparedToolCall) preparedToolCalls.push(consumed.preparedToolCall)
      }
      await emitTurnPipelineTrace(input.hooks, {
        sessionID: input.session.id,
        atomID: "turn.provider-stream-runner",
        phase: "end",
        step: input.step,
        attempt,
        details: { eventCount, finish: finishEvent?.finish ?? "none" },
        ...(input.signal ? { signal: input.signal } : {}),
      })
      await emitTurnPipelineTrace(input.hooks, {
        sessionID: input.session.id,
        atomID: "turn.tool-call-planner",
        phase: "end",
        step: input.step,
        attempt,
        details: {
          planned: preparedToolCalls.map((call) => ({
            toolName: call.toolName,
            mode: call.tool?.executionMode ?? "parallel",
          })),
        },
        ...(input.signal ? { signal: input.signal } : {}),
      })
      await executePreparedToolCalls({
        preparedToolCalls,
        session: input.session,
        parts: attemptParts,
        hooks: input.hooks,
        services: input.hooks.services,
        maxToolResultTextChars: input.maxToolResultTextChars,
        product: input.cadenceProduct,
        ...(input.signal ? { signal: input.signal } : {}),
        ...(input.cwd ? { cwd: input.cwd } : {}),
      })
      await emitTurnPipelineTrace(input.hooks, {
        sessionID: input.session.id,
        atomID: "turn.tool-executor",
        phase: "end",
        step: input.step,
        attempt,
        details: { executed: preparedToolCalls.length },
        ...(input.signal ? { signal: input.signal } : {}),
      })
      input.parts.push(...attemptParts)
      input.blockedTools.push(...attemptBlockedTools)
      const acceptanceDecision = await evaluateAcceptanceController({
        hooks: input.hooks,
        product: input.cadenceProduct,
        step: input.step,
        parts: input.parts,
        ...(input.cwd ? { cwd: input.cwd } : {}),
        ...(input.signal ? { signal: input.signal } : {}),
      })
      if (acceptanceDecision) {
        await emitTurnPipelineTrace(input.hooks, {
          sessionID: input.session.id,
          atomID: "runtime.acceptance-controller",
          phase: acceptanceDecision.status === "accept" ? "end" : "decision",
          step: input.step,
          attempt,
          details: {
            status: acceptanceDecision.status,
            reason: acceptanceDecision.reasonCode,
            policyAtomID: acceptanceDecision.atomID,
            ...(acceptanceDecision.evidence ? { evidence: acceptanceDecision.evidence } : {}),
          },
          ...(input.signal ? { signal: input.signal } : {}),
        })
        if (acceptanceDecision.status === "accept") {
          await input.hooks.emit(
            envelope("runtime.accepted-early", input.session.id, {
              product: input.cadenceProduct,
              step: input.step,
              reason: acceptanceDecision.reasonCode,
              ...(acceptanceDecision.evidence ? { evidence: acceptanceDecision.evidence } : {}),
            }),
            input.signal,
          )
        }
      }
      await input.hooks.emit(
        envelope("provider.response.after", input.session.id, {
          providerID: input.provider.id,
          model: providerRequest.model,
          step: input.step,
          attempt,
          retries: attempt,
          eventCount,
          toolCall: stepHadToolCall,
          ...(finishEvent
            ? {
                finish: finishEvent.finish,
                ...(finishEvent.usage ? { usage: finishEvent.usage } : {}),
                ...(finishEvent.cost === undefined ? {} : { cost: finishEvent.cost }),
              }
            : {}),
        }),
        input.signal,
      )
      return {
        stepHadToolCall,
        ...(finishEvent ? { finishEvent } : {}),
        retries: attempt,
        ...(acceptanceDecision ? { acceptanceDecision } : {}),
        ...(acceptanceDecision?.status === "accept" ? { acceptedEarly: true } : {}),
      }
    } catch (error) {
      lastError = error
      const retrying = attempt < input.maxRetries
      await emitTurnPipelineTrace(input.hooks, {
        sessionID: input.session.id,
        atomID: "turn.retry-policy",
        phase: retrying ? "decision" : "error",
        step: input.step,
        attempt,
        details: { retrying, error: error instanceof Error ? error.message : String(error) },
        ...(input.signal ? { signal: input.signal } : {}),
      })
      await input.hooks.emit(
        envelope("provider.response.after", input.session.id, {
          providerID: input.provider.id,
          model: providerRequest.model,
          step: input.step,
          attempt,
          retries: attempt,
          eventCount,
          error: serializeError(error),
          retrying,
        }),
        input.signal,
      )
      if (!retrying) return { stepHadToolCall: false, retries: attempt, error }
      await sleep(input.retryDelayMs)
    }
  }
  return { stepHadToolCall: false, retries: input.maxRetries, error: lastError }
}

function patchProviderRequest(current: ProviderRequest, patch: Record<string, unknown> | undefined): ProviderRequest {
  if (!patch) return current
  const requestPatch = record(patch["request"])
  const source = requestPatch ?? patch
  const optionsPatch = mergeProviderOptions(source, patch)
  return {
    ...current,
    ...(record(source["model"]) ? { model: source["model"] as LegoModel } : {}),
    ...(Array.isArray(source["system"]) ? { system: source["system"] as string[] } : {}),
    ...(Array.isArray(source["messages"]) ? { messages: source["messages"] as ProviderRequest["messages"] } : {}),
    ...(Array.isArray(source["tools"]) ? { tools: source["tools"] as ProviderRequest["tools"] } : {}),
    ...(optionsPatch ? { options: { ...current.options, ...optionsPatch } } : {}),
  }
}

function mergeProviderOptions(
  source: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const directOptions = record(source["options"])
  const providerOptions = record(patch["providerOptions"])
  const providerOptionsNested = record(providerOptions?.["options"])
  const headers = record(source["headers"])
  const options: Record<string, unknown> = {}

  if (providerOptions) {
    for (const [key, value] of Object.entries(providerOptions)) {
      if (key !== "options" && value !== undefined) options[key] = value
    }
  }
  if (providerOptionsNested) Object.assign(options, providerOptionsNested)
  if (directOptions) Object.assign(options, directOptions)
  if (headers) options["headers"] = { ...(record(options["headers"]) ?? {}), ...headers }

  return Object.keys(options).length > 0 ? options : undefined
}
