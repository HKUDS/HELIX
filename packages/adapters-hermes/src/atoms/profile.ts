import { hermesPluginLoaderAtom } from "./plugin.ts"
import { hermesPromptAgentBuilderAtom } from "./prompt.ts"
import { hermesProviderModelRegistryAtom } from "./provider.ts"
import { hermesSessionStoreSqliteFtsAtom } from "./session.ts"
import { hermesToolRegistryBridgeAtom } from "./tool.ts"
import { hermesTuiShellAtom } from "./ui.ts"
import type { HermesSpecialAtomDescriptor, HermesSpecialAtomProfile } from "./types.ts"

export function createHermesSpecialAtomProfile(): HermesSpecialAtomProfile {
  const atoms: HermesSpecialAtomDescriptor[] = [
    hermesPluginLoaderAtom,
    hermesToolRegistryBridgeAtom,
    hermesPromptAgentBuilderAtom,
    hermesProviderModelRegistryAtom,
    hermesSessionStoreSqliteFtsAtom,
    hermesTuiShellAtom,
  ]
  return {
    product: "hermes-agent",
    atoms: () => atoms.map((atom) => ({ ...atom })),
    atom(id) {
      const atom = atoms.find((item) => item.id === id)
      return atom ? { ...atom } : undefined
    },
  }
}
