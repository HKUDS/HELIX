import type { HermesSpecialAtomDescriptor } from "./types.ts"

export const hermesPromptAgentBuilderAtom: HermesSpecialAtomDescriptor = {
  id: "hermes.prompt.agent-builder",
  port: "prompt.system-builder",
  implementation: "Hermes prompt builder reference descriptor",
  referenceSource: "reference only: agent/prompt_builder.py; current adapter descriptor does not prove stable/context/volatile native parity",
  implementationKind: "metadata-only",
}
