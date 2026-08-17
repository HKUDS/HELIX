#!/usr/bin/env node

import { resolve } from "node:path"
import { credentialEnvNames, loadCredentialDotEnv } from "./credential-env.mjs"

const consentEnv = "HELIX_EXTERNAL_CAPTURE"
const allowNoCredentialsEnv = "HELIX_EXTERNAL_CAPTURE_ALLOW_NO_CREDENTIALS"

loadCredentialDotEnv(resolve(process.cwd(), ".env"), process.env)

if (process.env[consentEnv] !== "1") {
  console.error(`Refusing real claude-tap capture. Set ${consentEnv}=1 to confirm this is an intentional local capture run.`)
  process.exit(2)
}

const hasKnownCredential = credentialEnvNames.some((name) => {
  const value = process.env[name]
  return typeof value === "string" && value.trim().length > 0
})

if (!hasKnownCredential && process.env[allowNoCredentialsEnv] !== "1") {
  console.error(
    `Refusing real claude-tap capture without provider credentials. Set one of ${credentialEnvNames.join(", ")} or set ${allowNoCredentialsEnv}=1 for a local/custom provider.`,
  )
  process.exit(2)
}
