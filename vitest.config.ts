import { defineConfig } from "vitest/config"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { readFileSync } from "node:fs"

const root = dirname(fileURLToPath(import.meta.url))
const tsconfig = JSON.parse(readFileSync(resolve(root, "tsconfig.json"), "utf8")) as {
  compilerOptions?: { paths?: Record<string, string[]> }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const aliases = Object.entries(tsconfig.compilerOptions?.paths ?? {})
  .filter((entry): entry is [string, [string, ...string[]]] => entry[1].length > 0)
  .sort(([left], [right]) => right.length - left.length)
  .map(([find, [target]]) => ({
    find: new RegExp(`^${escapeRegExp(find)}$`),
    replacement: resolve(root, target),
  }))

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts"],
  },
  resolve: {
    alias: aliases,
  },
})
