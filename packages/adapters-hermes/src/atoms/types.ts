import type { LegoBlockImplementationKind } from "@helix/contracts"

export interface HermesSpecialAtomDescriptor {
  id: string
  port: string
  implementation: string
  referenceSource: string
  implementationKind: LegoBlockImplementationKind
}

export interface HermesSpecialAtomProfile {
  product: "hermes-agent"
  atoms(): HermesSpecialAtomDescriptor[]
  atom(id: string): HermesSpecialAtomDescriptor | undefined
}
