import type { HermesSpecialAtomDescriptor } from "./types.ts"

export const hermesProviderModelRegistryAtom: HermesSpecialAtomDescriptor = {
  id: "hermes.provider.model-registry",
  port: "provider.model-registry",
  implementation: "Hermes provider registry reference descriptor",
  referenceSource: "reference only: hermes_cli/providers.py; current adapter descriptor does not prove native provider registry execution",
  implementationKind: "metadata-only",
}
