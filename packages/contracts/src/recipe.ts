import type { LegoCapabilityInput, LegoLifecycleScope, LegoResourceRef } from "./module"

export interface LegoRecipeModuleRef {
  id: string
  version?: string
  variant?: string
  config?: Record<string, unknown>
}

export interface LegoRecipeBinding {
  port: string
  module: string
  capability?: string
  as?: string
}

export interface LegoRecipePackRef {
  id: string
  version?: string
  atoms?: string[]
}

export interface LegoRecipeBundleRef {
  id: string
  version?: string
  removedAtoms?: string[]
  replacedAtoms?: Record<string, string>
}

export interface LegoRecipeScopeRef {
  id: string
  lifecycle?: LegoLifecycleScope
  resources?: LegoResourceRef[]
}

export interface LegoRecipePolicyRef {
  id: string
  config?: Record<string, unknown>
}

export interface LegoRecipeStrategyRef {
  id: string
  config?: Record<string, unknown>
}

export interface LegoRecipeProductShellRef extends LegoRecipeModuleRef {
  entrypoint?: string
}

export interface LegoRecipe {
  id: "opencode" | "pi-mono" | string
  version: string
  modules: LegoRecipeModuleRef[]
  atoms?: LegoRecipeModuleRef[]
  packs?: LegoRecipePackRef[]
  bundles?: LegoRecipeBundleRef[]
  bindings?: LegoRecipeBinding[]
  requiredCapabilities?: LegoCapabilityInput[]
  scopes?: LegoRecipeScopeRef[]
  resources?: LegoResourceRef[]
  strategies?: LegoRecipeStrategyRef[]
  policies?: LegoRecipePolicyRef[]
  productShells?: LegoRecipeProductShellRef[]
  personalities: string[]
  entrypoints?: Record<string, string>
  conformance?: {
    suite: string[]
  }
  metadata?: Record<string, unknown>
}
