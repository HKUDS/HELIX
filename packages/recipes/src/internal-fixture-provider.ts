import type { LegoModel, LegoProviderAdapter, ProviderRequest, ProviderStreamEvent } from "@helix/contracts"

export interface InternalFixtureProviderScript {
  events?: ProviderStreamEvent[]
  steps?: ProviderStreamEvent[][]
}

export interface InternalFixtureProviderStep {
  assistantText?: string
  reasoningText?: string
  toolCalls?: Array<{ toolName: string; input: Record<string, unknown>; id?: string }>
  finish?: string
  usage?: { input: number; output: number; reasoning?: number; cacheRead?: number; cacheWrite?: number }
  cost?: number
}

export class InternalFixtureProviderAdapter implements LegoProviderAdapter {
  readonly id = "internal-fixture"
  private callIndex = 0

  constructor(private readonly script: InternalFixtureProviderScript) {}

  models(): LegoModel[] {
    return [
      {
        providerID: "internal-fixture",
        modelID: "internal-fixture-model",
        name: "Internal Fixture Model",
        contextWindow: 128000,
        maxOutputTokens: 4096,
        input: ["text", "image"],
        cost: { input: 0, output: 0 },
      },
    ]
  }

  async *stream(_request: ProviderRequest): AsyncIterable<ProviderStreamEvent> {
    for (const event of this.nextEvents()) {
      yield structuredClone(event)
    }
  }

  private nextEvents(): ProviderStreamEvent[] {
    if (this.script.steps) {
      return this.script.steps[this.callIndex++] ?? [{ type: "finish", finish: "stop", usage: { input: 0, output: 0 }, cost: 0 }]
    }
    this.callIndex++
    return this.script.events ?? [{ type: "finish", finish: "stop", usage: { input: 0, output: 0 }, cost: 0 }]
  }
}

export function createInternalFixtureProviderFromTurn(input: {
  assistantText?: string
  toolCalls?: Array<{ toolName: string; input: Record<string, unknown>; id?: string }>
  steps?: InternalFixtureProviderStep[]
}): InternalFixtureProviderAdapter {
  if (input.steps?.length) return createInternalFixtureProviderFromSteps(input.steps)
  return createInternalFixtureProviderFromSteps([
    {
      ...(input.assistantText ? { assistantText: input.assistantText } : {}),
      ...(input.toolCalls ? { toolCalls: input.toolCalls } : {}),
    },
  ])
}

export function createInternalFixtureProviderFromSteps(steps: InternalFixtureProviderStep[]): InternalFixtureProviderAdapter {
  return new InternalFixtureProviderAdapter({ steps: steps.map(eventsFromStep) })
}

function eventsFromStep(input: InternalFixtureProviderStep): ProviderStreamEvent[] {
  const events: ProviderStreamEvent[] = []
  if (input.assistantText) events.push({ type: "text", text: input.assistantText })
  if (input.reasoningText) events.push({ type: "reasoning", text: input.reasoningText })
  for (const call of input.toolCalls ?? []) {
    events.push({ type: "tool_call", toolName: call.toolName, input: call.input, ...(call.id ? { id: call.id } : {}) })
  }
  events.push({
    type: "finish",
    finish: input.finish ?? "stop",
    usage: input.usage ?? { input: 0, output: 0 },
    cost: input.cost ?? 0,
  })
  return events
}
