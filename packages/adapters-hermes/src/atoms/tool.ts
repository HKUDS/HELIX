import { adaptToolParameters, type LegoToolDefinition } from "@helix/contracts"
import type { HermesSpecialAtomDescriptor } from "./types.ts"

export const hermesToolRegistryBridgeAtom: HermesSpecialAtomDescriptor = {
  id: "hermes.tool.registry-bridge",
  port: "tool.registry",
  implementation: "Hermes tool registry schema/dispatch bridge",
  referenceSource: "reference only: model_tools.py",
  implementationKind: "bridge",
}

export function normalizeHermesTool(tool: LegoToolDefinition): LegoToolDefinition {
  return {
    ...tool,
    parameters: adaptToolParameters(tool.parameters),
  }
}
