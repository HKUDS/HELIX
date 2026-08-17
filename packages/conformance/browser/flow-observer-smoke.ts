import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { promisify } from "node:util"
import { chromium, type Browser, type Page } from "@playwright/test"
import { startDocsServer, type RunningDocsServer } from "../../docs-site/src/server"

declare const document: any
declare function getComputedStyle(element: any): any

const execFileAsync = promisify(execFile)
const root = resolve(process.cwd())
const builderPath = resolve(root, "docs/site/harness-builder.html")
const chromeExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? "/usr/bin/google-chrome"

async function main(): Promise<void> {
  await execFileAsync(resolve(root, "node_modules/.bin/tsx"), ["packages/docs-site/src/index.ts"], { cwd: root })
  let browser: Browser | undefined
  try {
    browser = await chromium.launch({
      headless: true,
      ...(existsSync(chromeExecutable) ? { executablePath: chromeExecutable } : {}),
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    })
    await smokeDesktop(browser)
    await smokeMobile(browser)
    await smokeOnlineTrace(browser)
  } finally {
    await browser?.close()
  }
}

async function smokeDesktop(browser: Browser): Promise<void> {
  const smokePage = await newSmokePage(browser, 1440, 1000)
  const { page } = smokePage
  try {
    const builderURL = pathToFileURL(builderPath).href
    await page.goto(`${builderURL}?builderTestHooks=1`, { waitUntil: "networkidle" })
    await assertFlowHiddenFromBuilder(page)
    await page.click('[data-builder-preset-button="minimal"]')
    await page.click("#moreMenuButton")
    const popupPromise = page.waitForEvent("popup")
    await page.click("#moreFlowButton")
    const observer = await popupPromise
    await observer.waitForLoadState("networkidle")
    try {
      await assertFlowStandalone(observer)
      await observer.waitForSelector(".flow-node")
      await assertFlowExpanded(observer, "desktop")
      await expectFlowDepthLocked(observer)
      await expectFlowProductSelector(observer)
      await expectLaneFilter(observer, "provider")
      await observer.click('[data-flow-node="provider.request"]')
      await observer.locator('[data-flow-node="provider.request"][data-active="true"]').waitFor({ timeout: 5_000 })
      await observer.click("#flowObserverTraceButton")
      await observer.locator('#flowObserverDock[data-flow-mode="trace"]').waitFor({ timeout: 5_000 })
      await observer.waitForFunction(() => document.getElementById("flowObserverSummary")?.textContent?.includes("assembled trace"))
      await observer.locator("#flowObserverSide").getByText(/No assembled trace|尚未捕获/).first().waitFor({ timeout: 5_000 })
    } finally {
      await observer.close()
    }
    await assertFlowHiddenFromBuilder(page)
    await assertNoBrowserErrors(smokePage.errors)
    await page.screenshot({ path: "/tmp/helix-flow-observer-desktop-shell.png", fullPage: true })
  } finally {
    await page.close()
  }
}

async function smokeMobile(browser: Browser): Promise<void> {
  const smokePage = await newSmokePage(browser, 390, 820)
  const { page } = smokePage
  try {
    await page.goto(flowObserverURL(pathToFileURL(builderPath).href, { mode: "blueprint" }), { waitUntil: "networkidle" })
    await assertFlowStandalone(page)
    await page.waitForSelector("[data-flow-stage-list-row]")
    await assertFlowExpanded(page, "mobile")
    await page.click('[data-flow-stage-list-node="provider.request"]')
    await page.locator('[data-flow-stage-list-node="provider.request"][data-active="true"]').waitFor({ timeout: 5_000 })
    await assertNoBrowserErrors(smokePage.errors)
    await page.screenshot({ path: "/tmp/helix-flow-observer-mobile.png", fullPage: true })
  } finally {
    await page.close()
  }
}

async function smokeOnlineTrace(browser: Browser): Promise<void> {
  let running: RunningDocsServer | undefined
  const smokePage = await newSmokePage(browser, 1280, 900)
  const { page } = smokePage
  try {
    running = await startDocsServer({ host: "127.0.0.1", port: 0 })
    const builderURL = new URL("harness-builder.html", `${running.url}/`).toString()
    await page.goto(flowObserverURL(builderURL, { mode: "trace", product: "opencode", source: "latest-assembled-run" }), { waitUntil: "networkidle" })
    await assertFlowStandalone(page)
    await page.waitForSelector(".flow-node")
    await page.locator('#flowObserverDock[data-flow-mode="trace"][data-flow-product="opencode"]').waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText("provider.request.before").first().waitFor({ timeout: 8_000 })
    await page.locator('#flowObserverSide [data-flow-trace-source="ready"]').getByText("source=latest assembled run").first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText(/Trace Metrics|Trace 指标/).first().waitFor({ timeout: 8_000 })
    await page.locator('[data-flow-trace-metric="provider-requests"]').first().waitFor({ timeout: 8_000 })
    await page.locator('[data-flow-trace-metric="tool-batch"]').first().waitFor({ timeout: 8_000 })
    await page.locator('[data-flow-trace-metric="token-estimate"]').first().waitFor({ timeout: 8_000 })
    await page.locator('[data-flow-trace-metric="compaction"]').first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText(/events.*observed stages|event.*observed/).first().waitFor({ timeout: 8_000 })
    await page.locator('.flow-node[data-status="matched"]').first().waitFor({ timeout: 8_000 })
    await page.click('[data-flow-timeline-event="provider.request.before"]')
    await page.locator('.flow-node[data-flow-node="provider.request"][data-active="true"]').first().waitFor({ timeout: 8_000 })
    await page.click('[data-flow-node="prompt.assemble"]')
    await page.locator("#flowObserverSide").getByText("prompt identity").first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText(/partial-sync|needs-original-snapshot|native-like/).first().waitFor({ timeout: 8_000 })
    if (await page.locator("#flowObserverSide").getByText("identity=compatible").count()) {
      throw new Error("Flow Observer rendered compatible prompt identity as an acceptable smoke target")
    }
    await page.locator("#flowObserverSide").getByText("prompt assembly artifact").first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText("before_agent_start").first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText("edge detail").first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText("payload fingerprint=").first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText("source order=").first().waitFor({ timeout: 8_000 })
    await page.locator('#flowObserverSide [data-flow-hook-adapter-source="OpenCode plugin bridge / assembled hook host"]').first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText(/result=continue\/transform|result=observe/).first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText(/sections=|fingerprint=/).first().waitFor({ timeout: 8_000 })
    await page.click("#flowObserverCompareButton")
    await page.locator('#flowObserverDock[data-flow-mode="compare"][data-flow-product="opencode"]').waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText(/Native Evidence|原生证据/).first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText("native evidence linked").first().waitFor({ timeout: 8_000 })
    await page.locator('#flowObserverSide [data-flow-fix-hint="ready"]').first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText("owning plane=").first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText("candidate atom=").first().waitFor({ timeout: 8_000 })
    await page.locator('#flowObserverSide [data-flow-fix-todo="TODO-025"]').first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText(/Lossiness|可观测性/).first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText("unobservable").first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText(/attachment=docs\/reports\/task-parity-native-cadence-fixtures\/attachments\/opencode-/).first().waitFor({ timeout: 8_000 })
    await page.click('[data-flow-node="prompt.assemble"]')
    await page.locator('#flowObserverSide [data-flow-prompt-diff="missing"]').first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText("prompt comparison").first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText("original prompt artifact=missing").first().waitFor({ timeout: 8_000 })
    await page.locator('[data-flow-compare-layout="side-by-side"]').first().waitFor({ timeout: 8_000 })
    await page.locator('#flowObserverViewport [data-flow-drift-node="true"]').first().waitFor({ timeout: 8_000 })
    await expectCompareLayout(page, "side-by-side")
    await page.click("#flowCompareOverlayButton")
    await expectCompareLayout(page, "overlay")
    await page.click("#flowCompareTableButton")
    await expectCompareLayout(page, "diff-table")
    await expectHermesNativeLossiness(page)
    await page.goto(flowObserverURL(builderURL, { mode: "compare", product: "opencode", source: "native-cadence-fixture" }), { waitUntil: "networkidle" })
    await assertFlowStandalone(page)
    await page.locator('#flowObserverDock[data-flow-mode="compare"][data-flow-product="opencode"]').waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText("native evidence linked").first().waitFor({ timeout: 8_000 })
    await page.goto(flowObserverURL(builderURL, { mode: "compare", product: "opencode", task: "context-compaction", source: "task-parity-report" }), { waitUntil: "networkidle" })
    await assertFlowStandalone(page)
    await page.locator('#flowObserverDock[data-flow-mode="compare"][data-flow-product="opencode"]').waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText("context-compaction").first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText("task parity report linked").first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText("task-parity-report").first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText("status=acceptable-drift").first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText("mode=original").first().waitFor({ timeout: 8_000 })
    await page.locator("#flowObserverSide").getByText("runner=task.runner.native-cli").first().waitFor({ timeout: 8_000 })
    await expectEarlyAcceptDiffTable(page, builderURL)
    await assertNoBrowserErrors(smokePage.errors)
  } finally {
    await page.close()
    if (running) await closeDocsServer(running)
  }
}

async function newSmokePage(browser: Browser, width: number, height: number): Promise<{ page: Page; errors: string[] }> {
  const page = await browser.newPage({ viewport: { width, height } })
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.text().includes("Failed to load resource")) return
    if (message.type() === "error" && !message.text().includes("favicon")) errors.push(message.text())
  })
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().includes("favicon")) errors.push(`HTTP ${response.status()} ${response.url()}`)
  })
  return { page, errors }
}

function flowObserverURL(
  builderURL: string,
  options: { mode: string; product?: string; task?: string; source?: string; compareLayout?: string; artifact?: string },
): string {
  const url = new URL(builderURL)
  url.searchParams.set("builderTestHooks", "1")
  url.searchParams.set("flowObserver", "1")
  url.searchParams.set("flowMode", options.mode)
  if (options.product) url.searchParams.set("flowProduct", options.product)
  if (options.task) url.searchParams.set("flowTask", options.task)
  if (options.source) url.searchParams.set("flowEvidenceSource", options.source)
  if (options.compareLayout) url.searchParams.set("flowCompareLayout", options.compareLayout)
  if (options.artifact) url.searchParams.set("flowArtifact", options.artifact)
  return url.toString()
}

async function assertNoBrowserErrors(errors: string[]): Promise<void> {
  if (errors.length > 0) throw new Error(`Flow Observer smoke saw browser errors:\n${errors.join("\n")}`)
}

async function assertFlowStandalone(page: Page): Promise<void> {
  await page.locator('html[data-flow-observer-window="true"]').waitFor({ timeout: 5_000 })
  await page.locator('body[data-flow-observer-window="true"]').waitFor({ timeout: 5_000 })
  await page.locator('#flowObserverDock[data-flow-state="fullscreen"]').waitFor({ timeout: 5_000 })
  const shell = await page.evaluate(() => {
    const top = document.querySelector(".top")
    const layout = document.getElementById("builderLayout")
    const previewDock = document.querySelector(".preview-dock")
    return {
      topDisplay: top ? getComputedStyle(top).display : "",
      layoutDisplay: layout ? getComputedStyle(layout).display : "",
      previewDisplay: previewDock ? getComputedStyle(previewDock).display : "",
    }
  })
  if (shell.topDisplay !== "none") throw new Error(`standalone Flow Observer top shell display was ${shell.topDisplay}`)
  if (shell.layoutDisplay !== "none") throw new Error(`standalone Flow Observer builder layout display was ${shell.layoutDisplay}`)
  if (shell.previewDisplay !== "none") throw new Error(`standalone Flow Observer preview dock display was ${shell.previewDisplay}`)
}

async function closeDocsServer(running: RunningDocsServer): Promise<void> {
  await new Promise<void>((resolveClose, rejectClose) => {
    running.server.close((error) => {
      if (error) rejectClose(error)
      else resolveClose()
    })
  })
}

async function assertFlowHiddenFromBuilder(page: Page): Promise<void> {
  await page.locator('#flowObserverDock[data-flow-state="collapsed"]').waitFor({ state: "attached", timeout: 5_000 })
  const result = await page.evaluate(() => {
    const dock = document.getElementById("flowObserverDock")
    const body = document.getElementById("flowObserverBody")
    return {
      dockDisplay: dock ? getComputedStyle(dock).display : "",
      bodyDisplay: body ? getComputedStyle(body).display : "",
      nodes: document.querySelectorAll(".flow-node").length,
    }
  })
  if (result.dockDisplay !== "none") throw new Error(`Builder Flow Observer display was ${result.dockDisplay}`)
  if (result.bodyDisplay !== "none") throw new Error(`collapsed Flow Observer body display was ${result.bodyDisplay}`)
  if (result.nodes !== 0) throw new Error(`collapsed Flow Observer rendered ${result.nodes} nodes`)
}

async function assertFlowExpanded(page: Page, viewport: string): Promise<void> {
  const result = await page.evaluate(() => {
    const dock = document.getElementById("flowObserverDock")
    const body = document.getElementById("flowObserverBody")
    const nodes = Array.from<any>(document.querySelectorAll(".flow-node")).map((node) => {
      const rect = node.getBoundingClientRect()
      return { width: rect.width, height: rect.height, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }
    })
    const clippedText = Array.from<any>(document.querySelectorAll(".flow-node strong, .flow-node .chip, .flow-edge-badge .chip, [data-flow-stage-list-row] strong, [data-flow-stage-list-row] .chip")).flatMap((item, index) => {
      const rect = item.getBoundingClientRect()
      const text = (item.textContent || "").trim()
      if (!text || rect.width < 1 || rect.height < 1) return []
      const clipped = item.scrollWidth > item.clientWidth + 2 || item.scrollHeight > item.clientHeight + 2
      return clipped ? [`${index}:${text.slice(0, 48)}:${item.clientWidth}x${item.clientHeight}<${item.scrollWidth}x${item.scrollHeight}`] : []
    })
    const tracks = Array.from<any>(document.querySelectorAll("[data-flow-lane-track]")).map((track) => {
      const trackNodes = Array.from<any>(track.querySelectorAll(".flow-node")).map((node) => {
        const rect = node.getBoundingClientRect()
        return {
          id: node.getAttribute("data-flow-node") || "",
          width: rect.width,
          height: rect.height,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          column: node.getAttribute("data-flow-stage-column") || "",
        }
      })
      const trackOverlaps: string[] = []
      for (let index = 0; index < trackNodes.length; index += 1) {
        const item = trackNodes[index]
        if (!item) continue
        for (let otherIndex = index + 1; otherIndex < trackNodes.length; otherIndex += 1) {
          const other = trackNodes[otherIndex]
          if (!other) continue
          const horizontal = Math.min(item.right, other.right) - Math.max(item.left, other.left)
          const vertical = Math.min(item.bottom, other.bottom) - Math.max(item.top, other.top)
          if (horizontal > 1 && vertical > 1) trackOverlaps.push(`${track.getAttribute("data-flow-lane-track") || "lane"}:${item.id || index}->${other.id || otherIndex}`)
        }
      }
      return {
        lane: track.getAttribute("data-flow-lane-track") || "",
        collapsed: track.getAttribute("data-collapsed") || "",
        nodes: trackNodes,
        overlaps: trackOverlaps,
      }
    })
    const stageList = document.querySelector("[data-flow-mobile-stage-list]")
    const stageListRows = Array.from<any>(document.querySelectorAll("[data-flow-stage-list-row]")).map((row) => {
      const rect = row.getBoundingClientRect()
      return {
        id: row.getAttribute("data-flow-stage-list-row") || "",
        width: rect.width,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      }
    })
    const stageListOverlaps: string[] = []
    for (let index = 0; index < stageListRows.length; index += 1) {
      const item = stageListRows[index]
      if (!item) continue
      for (let otherIndex = index + 1; otherIndex < stageListRows.length; otherIndex += 1) {
        const other = stageListRows[otherIndex]
        if (!other) continue
        const horizontal = Math.min(item.right, other.right) - Math.max(item.left, other.left)
        const vertical = Math.min(item.bottom, other.bottom) - Math.max(item.top, other.top)
        if (horizontal > 1 && vertical > 1) stageListOverlaps.push(`mobile-stage-list:${item.id || index}->${other.id || otherIndex}`)
      }
    }
    return {
      state: dock?.getAttribute("data-flow-state"),
      dockHeight: dock ? Math.round(dock.getBoundingClientRect().height) : 0,
      bodyDisplay: body ? getComputedStyle(body).display : "",
      nodes,
      tracks,
      stageListDisplay: stageList ? getComputedStyle(stageList).display : "",
      stageListRows,
      stageListOverlaps,
      clippedText,
      assemblyAtoms: document.querySelectorAll('[data-flow-node-assembly="atom"]').length,
      assemblyPorts: document.querySelectorAll('[data-flow-node-assembly="port"]').length,
      assemblyScopes: document.querySelectorAll('[data-flow-node-assembly="scope"]').length,
      replaceableNodes: document.querySelectorAll('[data-flow-node-replaceable="true"]').length,
      edgeBadges: document.querySelectorAll('[data-flow-edge-badge="ready"]').length,
      edgeDataKinds: Array.from<any>(document.querySelectorAll("[data-flow-edge-data-kind]")).map((item) => item.getAttribute("data-flow-edge-data-kind") || ""),
      edgeHookBadges: document.querySelectorAll('[data-flow-edge-hook-count]:not([data-flow-edge-hook-count="0"])').length,
      summary: document.getElementById("flowObserverSummary")?.textContent || "",
      health: document.getElementById("flowObserverHealth")?.textContent || "",
    }
  })
  if (result.state !== "expanded" && result.state !== "fullscreen") throw new Error(`${viewport} Flow Observer state was ${result.state}`)
  if (result.bodyDisplay !== "grid") throw new Error(`${viewport} Flow Observer body display was ${result.bodyDisplay}`)
  if (result.nodes.length !== 19) throw new Error(`${viewport} Flow Observer rendered ${result.nodes.length} nodes`)
  if (result.tracks.length !== 6) throw new Error(`${viewport} Flow Observer rendered ${result.tracks.length} lane tracks`)
  if (viewport === "mobile") {
    if (result.stageListDisplay === "none") throw new Error("mobile Flow Observer stage list was hidden")
    if (result.stageListRows.length !== 19) throw new Error(`mobile Flow Observer rendered ${result.stageListRows.length} stage list rows`)
    if (result.stageListOverlaps.length > 0) throw new Error(`mobile Flow Observer stage list rows overlapped: ${result.stageListOverlaps.join(", ")}`)
    for (const [index, row] of result.stageListRows.entries()) {
      if (row.width < 280 || row.height < 58) throw new Error(`mobile Flow Observer stage list row ${index} was too small: ${row.width}x${row.height}`)
      if (index > 0 && row.top <= result.stageListRows[index - 1]!.top) throw new Error(`mobile Flow Observer stage list row ${row.id} was not vertically ordered`)
    }
  }
  if (result.clippedText.length > 0) throw new Error(`${viewport} Flow Observer clipped node text: ${result.clippedText.slice(0, 8).join("; ")}`)
  if (result.assemblyAtoms < 1) throw new Error(`${viewport} Flow Observer rendered no node atom chips`)
  if (result.assemblyPorts < 1) throw new Error(`${viewport} Flow Observer rendered no node port chips`)
  if (result.assemblyScopes < 1) throw new Error(`${viewport} Flow Observer rendered no node scope chips`)
  if (result.replaceableNodes < 1) throw new Error(`${viewport} Flow Observer rendered no replaceable node markers`)
  if (result.edgeBadges < 10) throw new Error(`${viewport} Flow Observer rendered only ${result.edgeBadges} edge badges`)
  if (!result.edgeDataKinds.includes("prompt-artifact") && !result.edgeDataKinds.includes("provider-request")) throw new Error(`${viewport} Flow Observer edge badges did not expose semantic data kinds`)
  if (result.edgeHookBadges < 1) throw new Error(`${viewport} Flow Observer rendered no hook edge badges`)
  if (!result.summary.includes("19 stages")) throw new Error(`${viewport} Flow Observer summary was ${result.summary}`)
  if (!result.health) throw new Error(`${viewport} Flow Observer health chip was empty`)
  if (viewport === "mobile") {
    const minHeight = 320
    if (result.dockHeight < minHeight) throw new Error(`${viewport} Flow Observer expanded height was ${result.dockHeight}`)
    return
  }
  for (const track of result.tracks) {
    if (track.collapsed !== "false") throw new Error(`${viewport} Flow Observer lane ${track.lane} was unexpectedly collapsed`)
    if (track.nodes.length === 0) throw new Error(`${viewport} Flow Observer lane ${track.lane} had no nodes`)
    if (track.overlaps.length > 0) throw new Error(`${viewport} Flow Observer lane ${track.lane} nodes overlapped: ${track.overlaps.join(", ")}`)
    for (const [index, node] of track.nodes.entries()) {
      if (node.width < 40 || node.height < 80) throw new Error(`${viewport} Flow Observer lane ${track.lane} node ${index} was too small: ${node.width}x${node.height}`)
      if (index > 0 && node.left <= track.nodes[index - 1]!.left) throw new Error(`${viewport} Flow Observer lane ${track.lane} nodes are not left-to-right ordered`)
      if (!node.column) throw new Error(`${viewport} Flow Observer lane ${track.lane} node ${index} had no stage column`)
    }
  }
  const minHeight = viewport === "mobile" ? 320 : 320
  if (result.dockHeight < minHeight) throw new Error(`${viewport} Flow Observer expanded height was ${result.dockHeight}`)
}

async function expectLaneFilter(page: Page, lane: string): Promise<void> {
  const before = await page.locator(".flow-node").count()
  await page.click(`[data-flow-lane-filter="${lane}"]`)
  await page.locator(`[data-flow-lane-filter="${lane}"][aria-pressed="false"]`).waitFor({ timeout: 5_000 })
  await page.locator(`[data-flow-lane-track="${lane}"][data-collapsed="true"]`).waitFor({ timeout: 5_000 })
  const afterHide = await page.locator(".flow-node").count()
  if (afterHide >= before) throw new Error(`lane filter ${lane} did not reduce rendered nodes: before=${before} after=${afterHide}`)
  await page.click(`[data-flow-lane-filter="${lane}"]`)
  await page.locator(`[data-flow-lane-filter="${lane}"][aria-pressed="true"]`).waitFor({ timeout: 5_000 })
  await page.locator(`[data-flow-lane-track="${lane}"][data-collapsed="false"]`).waitFor({ timeout: 5_000 })
  const afterShow = await page.locator(".flow-node").count()
  if (afterShow !== before) throw new Error(`lane filter ${lane} did not restore rendered nodes: before=${before} after=${afterShow}`)
}

async function expectFlowDepthLocked(page: Page): Promise<void> {
  const depthButtons = await page.locator("#flowObserverDepthButton").count()
  if (depthButtons !== 0) throw new Error(`Flow Observer rendered ${depthButtons} depth toggle buttons`)
  await page.locator('#flowObserverDock[data-flow-depth="depth"]').waitFor({ timeout: 5_000 })
  const depthTransform = await page.evaluate(() => {
    const rail = document.querySelector(".flow-rail")
    return rail ? getComputedStyle(rail).transform : ""
  })
  if (!depthTransform || depthTransform === "none") throw new Error(`2.5D Flow Observer rail transform was ${depthTransform}`)
}

async function expectHermesNativeLossiness(page: Page): Promise<void> {
  await page.selectOption("#flowProductSelect", "hermes-agent")
  await page.locator('#flowObserverDock[data-flow-product="hermes-agent"][data-flow-product-mode="override"]').waitFor({ timeout: 8_000 })
  await page.click("#flowObserverNativeButton")
  await page.locator('#flowObserverDock[data-flow-product="hermes-agent"][data-flow-mode="native"]').waitFor({ timeout: 8_000 })
  await page.locator("#flowObserverSide").getByText("native evidence linked").first().waitFor({ timeout: 8_000 })
  await expectLossinessCount(page, "semantic", 12)
  await expectLossinessCount(page, "aggregated", 5)
  await expectLossinessCount(page, "inferred", 2)
  await expectLossinessCount(page, "unobservable", 0)
  await page.click('[data-flow-node="provider.request"]')
  await page.locator('#flowObserverSide [data-flow-inspector-node="provider.request"]').waitFor({ timeout: 8_000 })
  await page.locator("#flowObserverSide").getByText("lossiness=aggregated").first().waitFor({ timeout: 8_000 })
  await page.locator('#flowObserverSide [data-flow-hook-adapter-source="Hermes native plugin event tap"]').first().waitFor({ timeout: 8_000 })
  await page.click('[data-flow-node="tool.permission"]')
  await page.locator('#flowObserverSide [data-flow-inspector-node="tool.permission"]').waitFor({ timeout: 8_000 })
  await page.locator("#flowObserverSide").getByText("permission.ask").first().waitFor({ timeout: 8_000 })
  await page.locator("#flowObserverSide").getByText("no hook boundary").first().waitFor({ timeout: 8_000 })
  await page.click('[data-flow-node="input.normalize"]')
  await page.locator('#flowObserverSide [data-flow-inspector-node="input.normalize"]').waitFor({ timeout: 8_000 })
  await page.locator("#flowObserverSide").getByText("lossiness=aggregated").first().waitFor({ timeout: 8_000 })
}

async function expectLossinessCount(page: Page, lossiness: string, expected: number): Promise<void> {
  const locator = page.locator(`#flowObserverSide [data-lossiness="${lossiness}"]`).first()
  await locator.waitFor({ timeout: 8_000 })
  const raw = await locator.getAttribute("data-flow-lossiness-count")
  const actual = Number(raw)
  if (actual !== expected) throw new Error(`Hermes native ${lossiness} lossiness count was ${raw}, expected ${expected}`)
}

async function expectFlowProductSelector(page: Page): Promise<void> {
  await page.locator("#flowProductSelect").waitFor({ timeout: 5_000 })
  await page.selectOption("#flowProductSelect", "hermes-agent")
  await page.locator('#flowObserverDock[data-flow-product="hermes-agent"][data-flow-product-mode="override"]').waitFor({ timeout: 5_000 })
  await page.locator('#flowObserverViewport [data-flow-rail="hermes-agent"]').waitFor({ timeout: 5_000 })
  await page.selectOption("#flowProductSelect", "__current")
  await page.locator('#flowObserverDock[data-flow-product-mode="current"]').waitFor({ timeout: 5_000 })
  const currentProduct = await page.locator("#flowObserverDock").getAttribute("data-flow-product")
  if (!currentProduct) throw new Error("Flow Observer current product was empty")
  await page.locator(`#flowObserverViewport [data-flow-rail="${currentProduct}"]`).waitFor({ timeout: 5_000 })
}

async function expectCompareLayout(page: Page, layout: "side-by-side" | "overlay" | "diff-table"): Promise<void> {
  await page.locator(`#flowObserverDock[data-flow-mode="compare"][data-flow-compare-layout="${layout}"]`).waitFor({ timeout: 8_000 })
  await page.locator(`#flowObserverViewport [data-flow-compare-layout="${layout}"]`).first().waitFor({ timeout: 8_000 })
  const result = await page.evaluate((layoutName) => {
    const root = document.querySelector(`#flowObserverViewport [data-flow-compare-layout="${layoutName}"]`)
    return {
      rows: root ? root.querySelectorAll("[data-flow-compare-stage]").length : 0,
      nodes: root ? root.querySelectorAll("[data-flow-node]").length : 0,
      driftNodes: root ? root.querySelectorAll('[data-flow-drift-node="true"]').length : 0,
      driftProjections: root ? root.querySelectorAll("[data-flow-drift-projection]").length : 0,
      diffCategories: root ? Array.from<any>(root.querySelectorAll("[data-flow-diff-category]")).map((item) => item.getAttribute("data-flow-diff-category") || "") : [],
      text: root ? root.textContent || "" : "",
    }
  }, layout)
  if (layout === "side-by-side" && result.rows !== 19) throw new Error(`side-by-side compare rendered ${result.rows} rows`)
  if (layout === "overlay" && result.nodes !== 19) throw new Error(`overlay compare rendered ${result.nodes} nodes`)
  if (layout === "diff-table" && result.rows !== 19) throw new Error(`diff-table compare rendered ${result.rows} rows`)
  if (layout === "side-by-side" && result.driftNodes < 1) throw new Error("side-by-side compare rendered no raised drift nodes")
  if (layout === "diff-table" && result.driftProjections < 1) throw new Error("diff-table compare rendered no drift projection badges")
  if (layout === "diff-table") {
    expectDiffCategories(result.diffCategories, [
      "cadence.provider-request-count",
      "cadence.tool-sequence",
      "cadence.tool-batch",
      "cadence.message-part-type",
      "cadence.streaming-delta",
      "cadence.final-summary",
    ])
  }
  if (!/original/i.test(result.text) || !/assembled/i.test(result.text)) throw new Error(`${layout} compare did not label original and assembled flows`)
}

async function expectEarlyAcceptDiffTable(page: Page, builderURL: string): Promise<void> {
  await page.goto(flowObserverURL(builderURL, { mode: "compare", product: "pi-mono", task: "read-only-answer", source: "task-parity-report", compareLayout: "diff-table" }), {
    waitUntil: "networkidle",
  })
  await assertFlowStandalone(page)
  await page.locator('#flowObserverDock[data-flow-mode="compare"][data-flow-product="pi-mono"]').waitFor({ timeout: 8_000 })
  await page.locator('#flowObserverViewport [data-flow-compare-layout="diff-table"]').first().waitFor({ timeout: 8_000 })
  const categories = await page.evaluate(() => Array.from<any>(document.querySelectorAll('#flowObserverViewport [data-flow-diff-category]')).map((item) => item.getAttribute("data-flow-diff-category") || ""))
  expectDiffCategories(categories, ["cadence.early-accept"])
}

function expectDiffCategories(actual: string[], expected: string[]): void {
  for (const category of expected) {
    if (!actual.includes(category)) throw new Error(`diff-table did not render category ${category}`)
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`)
  process.exitCode = 1
})
