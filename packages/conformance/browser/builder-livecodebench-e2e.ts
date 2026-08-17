import { execFile } from "node:child_process"
import { createReadStream, existsSync, mkdirSync, readFileSync } from "node:fs"
import { createServer, type ServerResponse } from "node:http"
import { dirname, extname, resolve } from "node:path"
import { promisify } from "node:util"
import { chromium, type Browser, type Page } from "@playwright/test"
import { assertLiveCodeBenchProviderPreflight } from "./builder-livecodebench-preflight.ts"

const execFileAsync = promisify(execFile)
const root = resolve(process.cwd())
const siteDir = resolve(root, "docs/site")
const chromeExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? "/usr/bin/google-chrome"
const taskID = "livecodebench-1883-b-palindrome-removal"
const recipePath = resolve(root, "docs/reports/frontend-builder-livecodebench-recipe.json")
const artifactPath = resolve(root, "docs/reports/frontend-builder-livecodebench-task-parity.json")

async function main(): Promise<void> {
  assertLiveCodeBenchProviderPreflight()
  mkdirSync(dirname(recipePath), { recursive: true })
  await execFileAsync(resolve(root, "node_modules/.bin/tsx"), ["packages/docs-site/src/index.ts"], { cwd: root })
  const server = await startStaticServer(siteDir)
  let browser: Browser | undefined
  try {
    browser = await chromium.launch({
      headless: true,
      ...(existsSync(chromeExecutable) ? { executablePath: chromeExecutable } : {}),
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    })
    const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1440, height: 900 } })
    await buildRecipeFromFrontend(page, server.url)
    await runCliJSON(["validate", "recipe-file", recipePath, "--json"], "validate frontend-built recipe")
    const assembled = (await runCliJSON(["assemble", "--recipe-file", recipePath, "--explain", "--json"], "assemble frontend-built recipe")) as {
      verification?: { ok?: boolean }
    }
    if (assembled.verification?.ok !== true) throw new Error("frontend-built recipe contract did not verify")
    const artifact = (await runCliJSON(
      [
        "task-parity",
        "--recipe-file",
        recipePath,
        "--task",
        taskID,
        "--provider",
        "live",
        "--mode",
        "assembled",
        "--require-credentials",
        "--timeout-ms",
        "300000",
        "--out",
        artifactPath,
        "--json",
      ],
      "run LiveCodeBench task parity for frontend-built recipe",
    )) as { summary?: { reports?: number; failed?: number; gapsFound?: number } }
    if (artifact.summary?.reports !== 1 || artifact.summary.failed !== 0 || artifact.summary.gapsFound !== 0) {
      throw new Error(`frontend-built LiveCodeBench artifact was not clean: ${JSON.stringify(artifact.summary)}`)
    }
    const verification = (await runCliJSON(
      ["verify-task-parity", "--artifact", artifactPath, "--product", "opencode", "--mode", "assembled", "--task", taskID, "--json"],
      "verify frontend-built LiveCodeBench artifact",
    )) as { ok?: boolean }
    if (verification.ok !== true) throw new Error("frontend-built LiveCodeBench artifact did not verify")
    process.stdout.write(`Frontend builder LiveCodeBench e2e passed. Recipe: ${recipePath} Artifact: ${artifactPath}\n`)
  } finally {
    await browser?.close()
    await new Promise<void>((resolveClose) => server.server.close(() => resolveClose()))
  }
}

async function buildRecipeFromFrontend(page: Page, baseURL: string): Promise<void> {
  await page.goto(`${baseURL}/harness-builder.html`, { waitUntil: "networkidle" })
  await page.waitForSelector('[data-harness-builder="ready"]')
  await page.click('[data-action="new"]')
  await page.click('[data-wizard-product="opencode"]')
  await page.click('[data-wizard-profile="starter"]')
  await page.click('[data-action="wizard-create"]')
  await page.waitForSelector('[data-builder-atom="opencode.product-shell.sdk"][data-state-selected="true"]', { state: "attached" })
  await page.waitForSelector('[data-builder-guide-shell="ready"][data-builder-guide-collapsed="true"][data-builder-guide-mode="active"]')
  await page.click('[data-builder-guide-toggle="true"]')
  await page.selectOption("#libraryModeFilter", "atom")
  await page.selectOption("#viewFilter", "all")
  await page.fill("#atomSearch", "opencode.product-shell.web")
  await page.click('[data-add="opencode.product-shell.web"]')
  await page.fill("#atomSearch", "")
  await page.click('[data-action="guide-next"]')
  await page.evaluate("document.querySelector('[data-slot-select=\"slot.session.store\"]')?.click()")
  const memoryCandidate = page.locator('[data-builder-binding="candidate"][data-bind-port="session.store"][data-bind-provider="session.store.memory"]').first()
  if ((await memoryCandidate.count()) === 0) throw new Error("session.store memory candidate was not rendered")
  await page.evaluate("document.querySelector('[data-builder-binding=\"candidate\"][data-bind-port=\"session.store\"][data-bind-provider=\"session.store.memory\"]')?.click()")
  await page.waitForSelector('[data-builder-pending-change="active"]')
  await page.waitForSelector('[data-builder-inspector-panel="preview"][data-builder-inspector-active="true"] [data-builder-binding-preview="session.store"][data-builder-binding-preview-provider="session.store.memory"]')
  await page.evaluate("document.querySelector('[data-binding-preview-confirm=\"true\"]')?.click()")
  await page.waitForFunction(`(() => {
    const element = document.querySelector("#exportText")
    const recipe = JSON.parse(element && "value" in element ? element.value || "{}" : "{}")
    return Array.isArray(recipe.bindings) && recipe.bindings.some((binding) => binding.port === "session.store" && binding.module === "session.store.memory")
  })()`)
  await page.waitForSelector('[data-builder-pending-change="empty"]', { state: "attached" })
  const downloadPromise = page.waitForEvent("download")
  await page.click('[data-action="download"]')
  const download = await downloadPromise
  await download.saveAs(recipePath)
  const recipe = JSON.parse(readFileSync(recipePath, "utf8")) as {
    id?: string
    metadata?: Record<string, unknown>
    bindings?: Array<{ port?: string; module?: string }>
    entrypoints?: Record<string, string>
  }
  if (recipe.id !== "custom.opencode") throw new Error(`frontend builder exported unexpected recipe id ${recipe.id}`)
  if (recipe.metadata?.generatedBy !== "helix-builder") throw new Error("frontend builder recipe did not carry generatedBy metadata")
  if (recipe.entrypoints?.web !== "opencode.product-shell.web") throw new Error("frontend builder recipe did not preserve the web entrypoint")
  if (!recipe.bindings?.some((binding) => binding.port === "session.store" && binding.module === "session.store.memory")) {
    throw new Error("frontend builder recipe did not preserve the session.store.memory binding")
  }
}

async function runCliJSON(args: string[], label: string): Promise<unknown> {
  try {
    const result = await execFileAsync(resolve(root, "node_modules/.bin/tsx"), ["packages/cli/src/index.ts", ...args], {
      cwd: root,
      timeout: 360_000,
      maxBuffer: 1024 * 1024 * 64,
    })
    const trimmed = result.stdout.trim()
    return trimmed ? (JSON.parse(trimmed) as unknown) : {}
  } catch (error) {
    const execError = error as { stdout?: string; stderr?: string; message?: string }
    throw new Error(`${label} failed: ${execError.stderr || execError.stdout || execError.message || String(error)}`)
  }
}

async function startStaticServer(dir: string): Promise<{ server: ReturnType<typeof createServer>; url: string }> {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1")
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname
    const path = resolve(dir, `.${pathname}`)
    if (!path.startsWith(dir) || !existsSync(path)) {
      response.writeHead(404)
      response.end("not found")
      return
    }
    response.writeHead(200, { "content-type": contentType(path) })
    createReadStream(path).pipe(response as ServerResponse)
  })
  await new Promise<void>((resolveListen) => server.listen(0, "127.0.0.1", () => resolveListen()))
  const address = server.address()
  if (!address || typeof address === "string") throw new Error("static server did not bind to a TCP port")
  return { server, url: `http://127.0.0.1:${address.port}` }
}

function contentType(path: string): string {
  const ext = extname(path)
  if (ext === ".html") return "text/html; charset=utf-8"
  if (ext === ".css") return "text/css; charset=utf-8"
  if (ext === ".js") return "text/javascript; charset=utf-8"
  if (ext === ".json") return "application/json; charset=utf-8"
  return "application/octet-stream"
}

void main()
