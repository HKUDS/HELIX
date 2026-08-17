import type { AssembledHarness, AssembleHarnessOptions, HarnessProduct } from "./harness"
import { assembleHermesAgentHarness, assembleNanobotHarness, assembleOpenCodeHarness, assembleOpenCodePiHybridHarness, assemblePiMonoHarness } from "./harness"

export interface HarnessAssemblyAtom {
  readonly id: string
  readonly product: HarnessProduct
  assemble(options?: AssembleHarnessOptions): AssembledHarness
}

export function createHarnessAssemblyAtom(product: HarnessProduct): HarnessAssemblyAtom {
  return {
    id: `${productAtomPrefix(product)}.product-shell.harness`,
    product,
    assemble(options = {}) {
      if (product === "opencode") return assembleOpenCodeHarness(options)
      if (product === "pi-mono") return assemblePiMonoHarness(options)
      if (product === "opencode-pi-hybrid") return assembleOpenCodePiHybridHarness(options)
      if (product === "hermes-agent") return assembleHermesAgentHarness(options)
      return assembleNanobotHarness(options)
    },
  }
}

export function createOpenCodeHarnessAssemblyAtom(): HarnessAssemblyAtom {
  return createHarnessAssemblyAtom("opencode")
}

export function createPiMonoHarnessAssemblyAtom(): HarnessAssemblyAtom {
  return createHarnessAssemblyAtom("pi-mono")
}

export function createNanobotHarnessAssemblyAtom(): HarnessAssemblyAtom {
  return createHarnessAssemblyAtom("nanobot")
}

export function createHermesAgentHarnessAssemblyAtom(): HarnessAssemblyAtom {
  return createHarnessAssemblyAtom("hermes-agent")
}

function productAtomPrefix(product: HarnessProduct): string {
  if (product === "pi-mono") return "pi"
  if (product === "hermes-agent") return "hermes"
  if (product === "opencode-pi-hybrid") return "opencode-pi"
  return product
}
