#!/usr/bin/env node

import { existsSync } from "node:fs"
import { resolve } from "node:path"

const paths = process.argv.slice(2)

if (paths.length === 0) {
  console.error("Expected at least one normalized claude-tap native-capture.json path.")
  process.exit(2)
}

const missing = paths.map((path) => resolve(path)).filter((path) => !existsSync(path))

if (missing.length > 0) {
  console.error("Missing normalized claude-tap capture artifact(s):")
  for (const path of missing) console.error(`  ${path}`)
  console.error("Run the matching external:claude-tap:capture:*:read-only script before verify.")
  process.exit(2)
}
