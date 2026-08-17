import { execFile } from "node:child_process"
import { createReadStream, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createServer, type ServerResponse } from "node:http"
import { tmpdir } from "node:os"
import { basename, extname, join, resolve } from "node:path"
import { promisify } from "node:util"
import { chromium, type Browser, type ConsoleMessage, type Page } from "@playwright/test"
import { HarnessProfileStore } from "@helix/recipes"
import { startDocsServer } from "../../docs-site/src/server.ts"

const execFileAsync = promisify(execFile)
const root = resolve(process.cwd())
const siteDir = resolve(root, "docs/site")
const chromeExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? "/usr/bin/google-chrome"

async function main(): Promise<void> {
  const artifactDir = mkdtempSync(join(tmpdir(), "helix-builder-e2e-"))
  await execFileAsync(resolve(root, "node_modules/.bin/tsx"), ["packages/docs-site/src/index.ts"], { cwd: root })
  const server = await startStaticServer(siteDir)
  let browser: Browser | undefined
  const pageErrors: string[] = []
  const consoleErrors: string[] = []

  try {
    browser = await chromium.launch({
      headless: true,
      ...(existsSync(chromeExecutable) ? { executablePath: chromeExecutable } : {}),
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    })
    const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1440, height: 900 } })
    page.on("pageerror", (error) => pageErrors.push(error.message))
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().includes("favicon") && !message.text().includes("404")) consoleErrors.push(message.text())
    })

    await page.goto(`${server.url}/index.html`, { waitUntil: "networkidle" })
    await assertVisible(page, 'a[href="./harness-builder.html"]', "index builder link")
    await page.goto(`${server.url}/harness-builder.html?builderTestHooks=1`, { waitUntil: "networkidle" })
    await page.waitForSelector('[data-harness-builder="ready"]')
    await assertVisible(page, '[data-harness-builder="ready"][data-builder-locale="en"][data-builder-phase="start"][data-builder-progress="choose"]', "default English start state")
    await assertText(page, "#boardTitle", "Current harness", "default English assembly title")
    await assertText(page, "#sideTitle", "Choose a base", "default English start title")
    await assertText(page, "#auditTitle", "Review", "default English review title")
    await assertVisible(page, '[data-builder-zone="materials"]', "materials zone")
    await assertVisible(page, '[data-builder-start="ready"]', "start actions")
    await assertVisible(page, "#startIntro", "single start introduction")
    await assertCountAtLeast(page, "[data-builder-preset-button]", 6, "base harness choices")
    if (await page.locator('[data-builder-zone="assembly"]').isVisible()) throw new Error("start phase exposed the empty assembly zone")
    if (await page.locator('[data-builder-zone="audit"]').isVisible()) throw new Error("start phase exposed the empty review zone")
    if (await page.locator('#topCompileButton[data-builder-compile="ready"]').isVisible()) throw new Error("start phase exposed validation before choosing a base")
    await page.click('[data-builder-preset-button="minimal"]')
    await assertVisible(page, '[data-harness-builder="ready"][data-builder-phase="build"][data-builder-progress="customize"]', "minimal build state")
    await assertVisible(page, '[data-builder-zone="assembly"]', "assembly zone")
    await assertVisible(page, '[data-builder-zone="audit"]', "review zone")
    await assertVisible(page, '#topCompileButton[data-builder-compile="ready"]', "compile top-level CTA")
    await assertVisible(page, '[data-builder-assembly-status="ready"] [data-builder-assembly-status-title="ready"]', "assembly status shell")
    if (await page.locator("#auditBadge").isVisible().catch(() => false)) throw new Error("assembly status header rendered the legacy status badge as a primary visual")
    await assertInspectorTabs(page, "default builder")
    await assertVisible(page, '[data-builder-current-assembly="ready"] [data-builder-current-assembly-section="ready"][data-builder-inspector-panel="blueprint"][data-builder-inspector-active="true"]', "current assembly panel")
    await assertVisible(page, '#detailsOpenButton[aria-expanded="false"][aria-controls="detailsDrawer"]', "details button collapsed accessibility state")
    const boardBeforeDetails = await page.locator('[data-builder-zone="assembly"]').first().boundingBox()
    await openDetails(page)
    const boardAfterDetails = await page.locator('[data-builder-zone="assembly"]').first().boundingBox()
    if (!boardBeforeDetails || !boardAfterDetails) throw new Error("could not measure assembly board around details drawer open")
    if (
      Math.abs(boardBeforeDetails.x - boardAfterDetails.x) > 1 ||
      Math.abs(boardBeforeDetails.y - boardAfterDetails.y) > 1 ||
      Math.abs(boardBeforeDetails.width - boardAfterDetails.width) > 1 ||
      Math.abs(boardBeforeDetails.height - boardAfterDetails.height) > 1
    ) {
      throw new Error("opening the details drawer changed the desktop assembly board layout")
    }
    await assertVisible(page, '[data-builder-details-drawer="open"][role="tabpanel"][aria-labelledby="detailsOpenButton"]', "details tabpanel semantics")
    await assertVisible(page, '[data-builder-details-drawer="open"][data-builder-details-model="single-panel"][data-builder-details-layout="collapsible-sections"][data-builder-details-state-source="current-render-pass"][data-builder-details-sections-visible="all"][data-builder-details-section-count="5"]', "details single panel structure")
    for (const section of ["materials", "audit", "raw", "commands", "activation"]) {
      await assertVisible(page, `[data-builder-details-drawer="open"] [data-builder-details-section="${section}"]`, `details ${section} section is present in the single drawer`)
    }
    await assertVisible(page, '#detailsOpenButton[aria-expanded="true"][aria-controls="detailsDrawer"]', "details button expanded accessibility state")
    const focusedAfterDetailsOpen = await page.evaluate("document.activeElement && document.activeElement.id") as string | undefined
    if (focusedAfterDetailsOpen !== "detailsOpenButton") throw new Error(`details panel did not keep focus on the active details tab after opening (focused ${focusedAfterDetailsOpen || "nothing"})`)
    await assertVisible(page, '[data-builder-details-drawer="open"][data-builder-details-active-section="materials"] [data-builder-details-section="materials"][data-builder-details-section-active="true"] #bomTitle', "materials details section")
    await page.click('[data-builder-details-nav-target="audit"]')
    await assertVisible(page, '[data-builder-details-drawer="open"][data-builder-details-active-section="audit"] [data-builder-details-section="audit"][data-builder-details-section-active="true"] #coverageTitle', "audit evidence details section")
    await openDetailsSubsection(page, "activation")
    await assertVisible(page, '[data-builder-details-drawer="open"] [data-builder-inspector-panel="activation"][data-builder-inspector-active="true"] [data-builder-activation="ready"]', "activation details section")
    await assertVisible(page, '[data-builder-inspector-panel="activation"] [data-profile-status]', "activation profile status")
    await assertVisible(page, '[data-builder-inspector-panel="activation"] [data-telegram-status]', "activation telegram status")
    await assertVisible(page, '[data-builder-inspector-panel="activation"] [data-gateway-status]', "activation gateway status")
    await assertVisible(page, '[data-builder-inspector-panel="activation"] [data-gateway-logs]', "activation gateway logs")
    await assertVisible(page, '[data-builder-details-drawer="open"] [data-builder-details-nav="ready"] [data-builder-details-nav-target="raw"]', "details raw nav")
    await page.click('[data-builder-details-nav-target="raw"]')
    await assertVisible(page, '[data-builder-details-drawer="open"][data-builder-details-active-section="raw"] [data-builder-details-section="raw"][data-builder-details-section-active="true"] #exportText', "active raw details section")
    await page.click('[data-builder-details-nav-target="commands"]')
    await assertVisible(page, '[data-builder-details-drawer="open"][data-builder-details-active-section="commands"] [data-builder-details-section="commands"][data-builder-details-section-active="true"]', "active command details section")
    await page.click('[data-builder-details-nav-target="raw"]')
    await page.evaluate(`(() => {
      window.__HELIX_COPIED_RAW_RECIPE__ = ""
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText(value) {
            window.__HELIX_COPIED_RAW_RECIPE__ = String(value)
            return Promise.resolve()
          },
        },
      })
    })()`)
    await page.click('[data-copy-raw-recipe="true"]')
    const copiedRawRecipe = await page.evaluate("window.__HELIX_COPIED_RAW_RECIPE__") as string
    const visibleRawRecipe = await page.inputValue("#exportText")
    JSON.parse(copiedRawRecipe)
    if (copiedRawRecipe !== visibleRawRecipe) throw new Error("copy JSON did not write the current Raw Recipe export")
    await page.keyboard.press("Escape")
    await page.locator('[data-builder-details-drawer="closed"]').first().waitFor({ state: "attached", timeout: 5_000 })
    await assertVisible(page, '#detailsOpenButton[aria-expanded="false"][aria-controls="detailsDrawer"]', "details button restored accessibility state after Escape")
    const focusedAfterDetailsEscape = await page.evaluate("document.activeElement && document.activeElement.id") as string | undefined
    if (focusedAfterDetailsEscape !== "detailsOpenButton") throw new Error(`details drawer did not restore focus to the open button after Escape (focused ${focusedAfterDetailsEscape || "nothing"})`)
    await page.click('[data-action="toggle-locale"]')
    await assertVisible(page, '[data-harness-builder="ready"][data-builder-locale="zh"]', "Chinese locale")
    await assertText(page, "#boardTitle", "当前 Harness", "Chinese assembly title")
    await assertText(page, "#sideTitle", "模块库", "Chinese materials title")
    await assertText(page, "#auditTitle", "检查结果", "Chinese review title")
    await page.click('[data-action="toggle-locale"]')
    await assertVisible(page, '[data-harness-builder="ready"][data-builder-locale="en"]', "restored English locale")
    await clickMoreAction(page, "#presetButton")
    await assertVisible(page, '[data-builder-layout="ready"][data-builder-phase="start"]', "builder start phase")
    await assertVisible(page, '[data-builder-start="ready"]', "builder start actions")
    await assertOccamDefaultModel(page, "start phase", false)
    if ((await page.locator('[data-builder-slot]').count()) !== 0) throw new Error("start phase rendered assembly slots before choosing a preset")
    if ((await page.locator('[data-state-selected="true"]').count()) !== 0) throw new Error("start phase preselected atoms before choosing a preset")
    await page.click('[data-builder-preset-button="minimal"]')
    await page.click('[data-action="run-open"]')
    await assertVisible(page, '[data-builder-live-run="ready"]', "live run modal")
    await assertVisible(page, '#runBaseURL', "live run base URL input")
    await assertVisible(page, '#runAPIKey', "live run API key input")
    await assertVisible(page, '#runModel', "live run model input")
    await page.click('[data-action="run-cancel"]')
    await assertNoBrowserErrors(page, pageErrors, consoleErrors, artifactDir)
    await exerciseOnlineTui(page, pageErrors, consoleErrors, artifactDir)
    await page.goto(`${server.url}/harness-builder.html?builderTestHooks=1`, { waitUntil: "networkidle" })
    await page.waitForSelector('[data-harness-builder="ready"]')

    await exercisePreset(page, "opencode", "opencode.product-shell.sdk", "pi.product-shell.sdk")
    await exerciseCurrentAssemblySelectionDetails(page)
    await exerciseFamilyReplacementHelperHooks(page)
    await exerciseProductShellAddDoesNotReplaceFamily(page)
    await exerciseAssemblyChrome(page)
    await exerciseSlotAtomExpansion(page)
    await exerciseExclusiveFamilyReplacement(page)
    await exercisePreset(page, "pi-mono", "pi.product-shell.sdk", "opencode.product-shell.sdk")
    await exercisePreset(page, "nanobot", "nanobot.product-shell.cli", "opencode.product-shell.sdk")
    await exercisePreset(page, "hermes-agent", "hermes.product-shell.sdk", "opencode.product-shell.sdk")
    await exercisePreset(page, "hybrid-mix", "nanobot.prompt.agent-builder")
    await assertSelectedAtom(page, "opencode.product-shell.web", "hybrid opencode web shell")
    await assertSelectedAtom(page, "pi.session.store.jsonl-v3", "hybrid pi session store")
    await assertSelectedAtom(page, "product.shell.minimal-cli", "hybrid common minimal shell")
    await assertSelectedAtom(page, "hermes.product-shell.web-dashboard", "hybrid hermes dashboard shell")
    await assertVisible(page, '[data-builder-validation-status="ready"]', "hybrid ready validation")
    const hybridRecipe = JSON.parse(await page.inputValue("#exportText")) as {
      id: string
      productShells: Array<{ id: string }>
      bindings: Array<{ port: string; module: string }>
    }
    if (hybridRecipe.id !== "custom.hybrid-mix") throw new Error(`hybrid recipe id was ${hybridRecipe.id}`)
    for (const shell of ["product.shell.minimal-cli", "opencode.product-shell.web", "pi.product-shell.rpc", "nanobot.product-shell.cli", "hermes.product-shell.web-dashboard"]) {
      if (!hybridRecipe.productShells.some((item) => item.id === shell)) throw new Error(`hybrid recipe did not include ${shell}`)
    }
    for (const binding of [
      ["session.store", "pi.session.store.jsonl-v3"],
      ["prompt.system-builder", "nanobot.prompt.agent-builder"],
      ["tool.registry", "pi.extension.dynamic-tool-bridge"],
    ] as const) {
      if (!hybridRecipe.bindings.some((item) => item.port === binding[0] && item.module === binding[1])) {
        throw new Error(`hybrid recipe did not bind ${binding[0]} to ${binding[1]}`)
      }
    }
    await page.selectOption("#libraryModeFilter", "atom")
    await page.fill("#atomSearch", "nanobot prompt")
    await page.selectOption("#viewFilter", "selected")
    await assertCountAtLeast(page, '[data-builder-atom*="nanobot"][data-state-selected="true"]', 1, "nanobot selected prompt/filter atoms")
    await page.selectOption("#viewFilter", "replaceable")
    await assertCountAtLeast(page, '[data-builder-atom][data-state-selected="true"]', 1, "replaceable selected atoms")

    await clickMoreAction(page, "#presetButton")
    await page.click('[data-builder-preset-button="minimal"]')
    await assertSelectedAtom(page, "product.shell.minimal-cli", "minimal shell")
    const selectedProductSpecific = await page.locator('[data-state-selected="true"][data-scope="product"]').count()
    if (selectedProductSpecific !== 0) throw new Error(`minimal preset should not select product-specific atoms, found ${selectedProductSpecific}`)
    await exerciseBundleLayer(page)

    await clickMoreAction(page, "#topNewButton")
    await assertVisible(page, '[data-builder-wizard="ready"]', "new harness wizard")
    await assertVisible(page, '[data-builder-wizard-step="entry"][data-active="true"]', "new harness wizard entry step")
    await assertVisible(page, '[data-builder-wizard-step="kit"][data-active="true"]', "new harness wizard kit step")
    await assertVisible(page, '[data-builder-wizard-step="blueprint"][data-active="true"]', "new harness wizard blueprint step")
    await assertTextContains(page, '[data-builder-wizard-step="blueprint"]', "Assembly", "new harness wizard assembly step copy")
    await assertTextNotContains(page, '[data-builder-wizard-step="blueprint"]', "Blueprint", "new harness wizard legacy blueprint copy")
    await assertVisible(page, '[data-builder-wizard-profile="bare"][data-builder-wizard-kit="kit.bare-chassis"][aria-pressed="true"]', "new harness defaults to bare chassis")
    await assertVisible(page, '[data-builder-wizard-profile="product"][data-builder-wizard-kit="kit.product"]', "new harness wizard product kit profile")
    for (const product of ["minimal", "opencode", "pi-mono", "nanobot", "hermes-agent"]) {
      await assertVisible(page, `[data-builder-wizard-entry-product="${product}"]`, `new harness wizard ${product} entry product`)
    }
    await page.click('[data-wizard-product="minimal"]')
    await assertVisible(page, '[data-builder-wizard-preview="interface"]', "minimal wizard primary interface")
    await assertVisible(page, '[data-builder-wizard-preview="kit"][data-builder-wizard-kit="kit.bare-chassis"][data-builder-wizard-mode="bare"]', "minimal wizard stays on bare interface kit before explicit kit choice")
    await page.click('[data-wizard-profile="starter"]')
    await assertVisible(page, '[data-builder-wizard-profile="starter"][data-builder-wizard-kit="kit.starter"]', "starter kit wizard profile")
    await assertVisible(page, '[data-builder-wizard-preview="chassis"][data-builder-wizard-chassis="chassis.minimal"]', "minimal wizard chassis preview")
    await assertVisible(page, '[data-builder-wizard-preview="kit"][data-builder-wizard-kit="kit.starter"][data-builder-wizard-mode="starter"]', "starter kit wizard preview")
    await assertVisible(page, '[data-builder-wizard-preview="kit-slots"]', "starter kit slot preview")
    await assertVisible(page, '[data-builder-wizard-preview="bundles"]', "starter kit bundle preview")
    await assertVisible(page, '[data-builder-wizard-preview="ports"]', "new harness wizard port preview")
    await assertVisible(page, '[data-builder-wizard-stage="interface"]', "new harness wizard interface stage")
    await assertVisible(page, '[data-builder-wizard-stage="session"]', "new harness wizard session stage")
    await page.click('[data-action="wizard-create"]')
    await assertSelectedAtom(page, "product.shell.minimal-cli", "wizard-created minimal shell")
    await assertVisible(page, '[data-builder-blueprint-kit="kit.starter"][data-builder-blueprint-chassis="chassis.minimal"][data-builder-blueprint-assembly-mode="starter"]', "wizard-created starter kit blueprint")
    await assertVisible(page, '[data-builder-validation-status="ready"]', "wizard-created ready validation")
    await assertVisible(page, '[data-builder-guide-shell="ready"][data-builder-guide-collapsed="true"][data-builder-guide-mode="active"]', "wizard-created guide stays collapsed until user expands it")
    await page.click('[data-builder-guide-toggle="true"]')
    await assertVisible(page, '[data-builder-guide-shell="ready"][data-builder-guide-collapsed="false"][data-builder-guide-mode="active"] [data-builder-guide-body="ready"]', "wizard-created guide expands by user choice")
    await assertVisible(page, '[data-builder-guide-active="interface"]', "wizard-created active interface guide")
    await assertVisible(page, '[data-builder-guide-acceptance="ready"]', "wizard-created assembly acceptance")
    await assertVisible(page, '[data-builder-acceptance-check="validate"][data-ready="true"]', "wizard-created validate acceptance check")
    await assertVisible(page, '[data-builder-acceptance-check="ports"][data-ready="true"]', "wizard-created required ports acceptance check")
    await assertVisible(page, '[data-builder-acceptance-check="recipe"][data-ready="true"]', "wizard-created recipe export acceptance check")
    await assertVisible(page, '[data-builder-acceptance-check="commands"][data-ready="true"]', "wizard-created command acceptance check")
    await openDetailsSection(page, "audit")
    await assertVisible(page, '[data-builder-details-drawer="open"][data-builder-details-active-section="audit"] [data-builder-inspector-panel="audit"][data-builder-inspector-active="true"]', "active audit inspector panel")
    await assertVisible(page, '[data-builder-port-stage="interface"]', "wizard-created interface port stage")
    if ((await page.locator('[data-builder-port-stage="session"]').count()) !== 0) throw new Error("wizard should only show the active interface stage before next")
    await page.fill("#atomSearch", "")
    await page.selectOption("#libraryModeFilter", "bundle")
    await page.selectOption("#scopeFilter", "all")
    await page.selectOption("#viewFilter", "all")
    await page.selectOption("#planeFilter", "event")
    await assertCountAtLeast(page, '#palette [data-builder-bundle][data-builder-plane="event"]', 1, "manual event plane filter bundle candidates")
    await page.selectOption("#libraryModeFilter", "atom")
    await assertCountAtLeast(page, '#palette [data-builder-atom][data-builder-plane="event"]', 1, "manual event plane filter candidates")
    if ((await page.locator("#palette [data-builder-palette-empty]").count()) !== 0) throw new Error("manual event plane filter rendered an empty palette")
    await page.selectOption("#planeFilter", "all")
    await page.click('[data-action="guide-next"]')
    if ((await page.locator("[data-builder-guide-active]").count()) !== 0) throw new Error("ready wizard guide should finish when no slot gaps remain")
    const wizardRecipe = JSON.parse(await page.inputValue("#exportText")) as {
      id: string
      requiredCapabilities: string[]
      bindings: Array<{ port: string; module: string }>
      bundles?: Array<{ id: string }>
      metadata?: { builderAssembly?: { chassisID?: string; kitID?: string; mode?: string; exportShape?: string; runtimeAbstraction?: boolean; installedBundleIDs?: string[] } }
    }
    if (wizardRecipe.id !== "custom.minimal") throw new Error(`wizard recipe id was ${wizardRecipe.id}`)
    if (!wizardRecipe.requiredCapabilities.includes("product.shell")) throw new Error("wizard recipe did not include product.shell as required capability")
    if (!wizardRecipe.bindings.some((binding) => binding.port === "product.shell" && binding.module === "product.shell.minimal-cli")) {
      throw new Error("wizard recipe did not bind the minimal product shell")
    }
    if (wizardRecipe.metadata?.builderAssembly?.kitID !== "kit.starter") throw new Error("wizard recipe did not export starter kit metadata")
    if (wizardRecipe.metadata?.builderAssembly?.chassisID !== "chassis.minimal") throw new Error("wizard recipe did not export minimal chassis metadata")
    if (wizardRecipe.metadata?.builderAssembly?.mode !== "starter") throw new Error("wizard recipe did not export starter assembly mode")
    if (wizardRecipe.metadata?.builderAssembly?.runtimeAbstraction !== false) throw new Error("wizard kit metadata should stay builder-only")
    if (wizardRecipe.metadata?.builderAssembly?.exportShape !== "bundles-atoms-bindings") throw new Error("wizard recipe did not keep TODO-013 export shape metadata")
    if (!wizardRecipe.bundles?.length || !wizardRecipe.metadata?.builderAssembly?.installedBundleIDs?.length) throw new Error("wizard recipe did not export installed bundle refs")
    await page.click('[data-builder-guide-toggle="true"]')
    await assertVisible(page, '[data-builder-guide-shell="ready"][data-builder-guide-collapsed="true"][data-builder-guide-mode="overview"]', "guide re-collapsed before next wizard")
    await clickMoreAction(page, "#topNewButton")
    await page.click('[data-wizard-product="minimal"]')
    await page.click('[data-wizard-profile="bare"]')
    await assertVisible(page, '[data-builder-wizard-preview="kit"][data-builder-wizard-kit="kit.bare-chassis"][data-builder-wizard-mode="bare"]', "bare chassis wizard preview")
    await page.click('[data-action="wizard-create"]')
    await assertVisible(page, '[data-builder-blueprint-kit="kit.bare-chassis"][data-builder-blueprint-chassis="chassis.minimal"][data-builder-blueprint-assembly-mode="bare"]', "bare chassis blueprint")
    await assertVisible(page, '[data-builder-validation-status="blocked"]', "bare wizard blocked validation")
    await assertVisible(page, '[data-builder-validation-next-port]', "bare wizard next port prompt")
    await assertVisible(page, '[data-builder-current-assembly] [data-builder-current-assembly-action="blocking-reason"][data-builder-current-assembly-blocking-status="blocked"]:not([data-builder-current-assembly-diagnostic-count="0"]) [data-builder-diagnostic]', "bare wizard current blocking reason")
    await assertVisible(page, '[data-builder-guide-shell="ready"][data-builder-guide-collapsed="true"][data-builder-guide-mode="active"]', "bare wizard guide stays collapsed until user expands it")
    await page.click('[data-builder-guide-toggle="true"]')
    await assertVisible(page, '[data-builder-guide-active="session"]', "bare wizard active missing session guide")
    await assertVisible(page, '[data-builder-guide-step-conflicts="interface"]', "bare wizard interface conflict counter")
    await assertVisible(page, '[data-builder-guide-step-next="interface"]', "bare wizard interface next suggestion")
    await assertVisible(page, '[data-builder-guide-step-next="session"]', "bare wizard session next suggestion")
    await assertVisible(page, '[data-builder-slot-stage="session"][data-builder-slot-status="empty"][aria-current="true"]', "bare wizard focused a missing session slot")
    await assertVisible(page, '[data-builder-slot-stage="session"][data-builder-slot-required="true"][aria-current="true"]', "bare wizard missing session slot is required")
    await assertVisible(page, '[data-builder-slot-stage="session"] [data-builder-slot-warning="slot.required-port.missing"]', "bare wizard missing session slot warning")
    await openDetailsSection(page, "audit")
    await assertVisible(page, '[data-builder-details-drawer="open"][data-builder-details-active-section="audit"] [data-builder-inspector-panel="audit"][data-builder-inspector-active="true"]', "active audit inspector panel")
    await assertVisible(page, '[data-builder-port-stage="session"]', "bare wizard session port stage")
    if ((await page.locator('[data-builder-port-stage="interface"]').count()) !== 0) throw new Error("bare wizard should only show the active missing session stage after next")

    await clickMoreAction(page, "#topNewButton")
    await page.click('[data-wizard-product="opencode"]')
    await page.click('[data-wizard-profile="livecodebench"]')
    await assertVisible(page, '[data-builder-wizard-profile="livecodebench"][data-builder-wizard-kit="kit.livecodebench"]', "LiveCodeBench kit wizard profile")
    await assertVisible(page, '[data-builder-wizard-preview="kit"][data-builder-wizard-kit="kit.livecodebench"][data-builder-wizard-mode="livecodebench"]', "LiveCodeBench kit wizard preview")
    await assertVisible(page, '[data-builder-wizard-preview="kit-slots"]', "LiveCodeBench kit slot preview")
    await page.click('[data-action="wizard-create"]')
    await assertVisible(page, '[data-builder-blueprint-kit="kit.livecodebench"][data-builder-blueprint-chassis="chassis.opencode"][data-builder-blueprint-assembly-mode="livecodebench"]', "LiveCodeBench kit blueprint")
    const livecodebenchRecipe = JSON.parse(await page.inputValue("#exportText")) as { bundles?: Array<{ id: string }>; metadata?: { builderAssembly?: { kitID?: string; mode?: string; runtimeAbstraction?: boolean } } }
    if (livecodebenchRecipe.metadata?.builderAssembly?.kitID !== "kit.livecodebench") throw new Error("LiveCodeBench wizard recipe did not export kit metadata")
    if (livecodebenchRecipe.metadata?.builderAssembly?.mode !== "livecodebench") throw new Error("LiveCodeBench wizard recipe did not export assembly mode")
    if (livecodebenchRecipe.metadata?.builderAssembly?.runtimeAbstraction !== false) throw new Error("LiveCodeBench kit metadata should stay builder-only")
    if (!livecodebenchRecipe.bundles?.length) throw new Error("LiveCodeBench kit did not export bundle refs")

    await clickMoreAction(page, "#topNewButton")
    await page.click('[data-wizard-product="opencode"]')
    await assertVisible(page, '[data-builder-wizard-preview="interface"]', "opencode wizard primary interface")
    await page.click('[data-wizard-profile="starter"]')
    await page.click('[data-action="wizard-create"]')
    await assertSelectedAtom(page, "opencode.product-shell.sdk", "wizard-created opencode sdk shell")
    await page.selectOption("#libraryModeFilter", "atom")
    await page.selectOption("#viewFilter", "all")
    await page.fill("#atomSearch", "opencode.product-shell.web")
    await page.click('[data-add="opencode.product-shell.web"]')
    await page.fill("#atomSearch", "opencode.product-shell.tui")
    await page.click('[data-add="opencode.product-shell.tui"]')
    await assertSelectedAtom(page, "opencode.product-shell.web", "wizard-created opencode web shell")
    await assertSelectedAtom(page, "opencode.product-shell.tui", "wizard-created opencode tui shell")
    await assertCountAtLeast(page, '[data-builder-lane="interface"] [data-builder-atom="opencode.product-shell.web"]', 1, "opencode web shell in interface lane")
    const opencodeWizardRecipe = JSON.parse(await page.inputValue("#exportText")) as {
      id: string
      productShells: Array<{ id: string }>
      bindings: Array<{ port: string; module: string }>
      entrypoints?: Record<string, string>
    }
    const shellIDs = opencodeWizardRecipe.productShells.map((shell) => shell.id)
    if (opencodeWizardRecipe.id !== "custom.opencode") throw new Error(`opencode wizard recipe id was ${opencodeWizardRecipe.id}`)
    for (const shell of ["opencode.product-shell.sdk", "opencode.product-shell.web", "opencode.product-shell.tui"]) {
      if (!shellIDs.includes(shell)) throw new Error(`opencode wizard recipe did not keep ${shell} in productShells`)
    }
    if (!opencodeWizardRecipe.bindings.some((binding) => binding.port === "product.shell" && binding.module === "opencode.product-shell.sdk")) {
      throw new Error("opencode wizard recipe did not bind the primary SDK product shell")
    }
    if (opencodeWizardRecipe.entrypoints?.web !== "opencode.product-shell.web" || opencodeWizardRecipe.entrypoints?.tui !== "opencode.product-shell.tui") {
      throw new Error("opencode wizard recipe did not export selected interface block entrypoints")
    }

    await clickMoreAction(page, "#presetButton")
    await page.click('[data-builder-preset-button="opencode"]')
    await page.selectOption("#libraryModeFilter", "atom")
    await page.fill("#atomSearch", "")
    await page.selectOption("#viewFilter", "all")
    await page.evaluate("document.querySelector('[data-slot-select=\"slot.session.store\"]')?.click()")
    await assertVisible(page, '[data-builder-binding="candidate"][data-bind-port="session.store"]', "session.store binding candidates")
    const memoryCandidate = page.locator('[data-builder-binding="candidate"][data-bind-port="session.store"][data-bind-provider="session.store.memory"]').first()
    if ((await memoryCandidate.count()) === 0) throw new Error("session.store memory candidate was not rendered")
    const preSwapRecipe = JSON.parse(await page.inputValue("#exportText")) as { bindings: Array<{ port: string; module: string }> }
    await page.evaluate("document.querySelector('[data-builder-binding=\"candidate\"][data-bind-port=\"session.store\"][data-bind-provider=\"session.store.memory\"]')?.click()")
    await assertPendingChangeActive(page, "session.store binding pending change")
    await assertNoPreviewInBlueprint(page, "session.store binding preview")
    await assertVisible(page, '[data-builder-inspector-panel="preview"][data-builder-inspector-active="true"] [data-builder-binding-preview="session.store"][data-builder-binding-preview-provider="session.store.memory"]', "session.store binding preview")
    await assertTextContains(page, '[data-builder-binding-preview="session.store"]', "Pending Binding Change", "session.store binding pending change copy")
    await assertTextNotContains(page, '[data-builder-binding-preview="session.store"]', "Binding Preview", "session.store legacy binding preview copy")
    await assertVisible(page, '[data-builder-binding-preview="session.store"] [data-builder-binding-preview-slot]', "session.store binding preview slot")
    await assertVisible(page, '[data-builder-binding-preview="session.store"] [data-builder-binding-preview-atom="session.store.memory"]', "session.store binding preview provider")
    await assertVisible(page, '[data-builder-binding-preview="session.store"] [data-builder-binding-preview-capability]', "session.store binding preview affected capability")
    await assertTextContains(page, '[data-builder-binding-preview="session.store"]', "validate", "session.store binding preview validation command")
    await assertVisible(page, '[data-builder-preview-dock="ready"][data-builder-preview-dock-action="bind"]:not([hidden]) [data-binding-preview-confirm="true"]', "session.store binding preview dock")
    await assertCompactPreviewDock(page, "session.store binding preview dock")
    const previewRecipe = JSON.parse(await page.inputValue("#exportText")) as { bindings: Array<{ port: string; module: string }> }
    if (previewRecipe.bindings.some((binding) => binding.port === "session.store" && binding.module === "session.store.memory")) {
      throw new Error("binding preview committed the session.store swap before confirmation")
    }
    if (JSON.stringify(previewRecipe.bindings) !== JSON.stringify(preSwapRecipe.bindings)) {
      throw new Error("binding preview changed exported bindings before confirmation")
    }
    await page.evaluate("document.querySelector('[data-binding-preview-confirm=\"true\"]')?.click()")
    await page.waitForFunction(`(() => {
      const element = document.querySelector("#exportText")
      const recipe = JSON.parse(element && "value" in element ? element.value || "{}" : "{}")
      return Array.isArray(recipe.bindings) && recipe.bindings.some((binding) => binding.port === "session.store" && binding.module === "session.store.memory")
    })()`)
    await assertPendingChangeCleared(page, "confirmed session.store binding pending change")
    await assertVisible(page, '[data-builder-blueprint-latest-impact="session.store"][data-builder-blueprint-latest-impact-kind="binding"]', "session.store latest impact in blueprint")
    await openDetailsSection(page, "audit")
    await assertVisible(page, '[data-builder-details-drawer="open"][data-builder-details-active-section="audit"] [data-builder-inspector-panel="audit"][data-builder-inspector-active="true"]', "active audit inspector panel")
    await page.click('[data-builder-details-nav-target="commands"]')
    await assertVisible(page, '[data-builder-details-drawer="open"][data-builder-details-active-section="commands"] [data-builder-details-section="commands"][data-builder-details-section-active="true"] [data-builder-command]', "active command details section with commands")
    await assertVisible(page, '[data-builder-command="validate"]', "validate command")
    await assertTextContains(page, '[data-builder-command="validate"] [data-copy-command="validate"]', "COPY validate", "explicit validate copy label")
    await assertTextContains(page, '[data-builder-command="assemble"] [data-copy-command="assemble"]', "COPY assemble", "explicit assemble copy label")
    await assertTextContains(page, '[data-builder-command="graph"] [data-copy-command="graph"]', "COPY graph", "explicit graph copy label")
    await assertTextContains(page, '[data-builder-command="task-parity"] [data-copy-command="task-parity"]', "COPY task parity", "explicit task parity copy label")
    await page.evaluate(`(() => {
      window.__HELIX_COPIED_COMMAND__ = ""
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText(value) {
            window.__HELIX_COPIED_COMMAND__ = String(value)
            return Promise.resolve()
          },
        },
      })
    })()`)
    const validateCommand = await page.locator('[data-builder-command="validate"] code').first().textContent()
    await page.click('[data-builder-command="validate"] [data-copy-command="validate"]')
    const copiedCommand = await page.evaluate("window.__HELIX_COPIED_COMMAND__") as string
    if (copiedCommand !== validateCommand) throw new Error("copy validate did not write the visible validate command")
    await assertVisible(page, '[data-builder-contract-fingerprint]', "contract fingerprint audit")
    await assertVisible(page, '[data-builder-impact="session.store"]', "session.store swap impact")
    await assertVisible(page, '[data-builder-remove-impact-audit="empty"]', "empty remove impact audit")
    await openDetailsSection(page, "audit")
    await assertVisible(page, '[data-builder-details-section="audit"][data-builder-inspector-panel="audit"][data-builder-inspector-active="true"] [data-builder-diagnostic]', "diagnostics panel")
    await assertDetailsMaterialsMatchExport(page, "opencode swapped recipe")
    await assertDetailsAuditMatchesExport(page, "opencode swapped recipe")
    await closeDetails(page)
    await page.selectOption("#libraryModeFilter", "atom")
    await page.fill("#atomSearch", "session.store.memory")
    await assertVisible(page, '[data-remove="session.store.memory"]', "session.store memory remove action")
    await page.click('[data-remove="session.store.memory"]')
    await assertTextContains(page, "#removeImpactBody", "Impact analysis is temporarily unavailable", "remove impact unavailable copy")
    await page.evaluate("document.querySelector('[data-action=\"remove-impact-cancel\"]')?.click()")
    await page.locator("#removeImpactModal").waitFor({ state: "hidden", timeout: 5_000 })
    await openDetailsSection(page, "audit")
    await assertVisible(page, '[data-builder-remove-impact-audit="unavailable"]', "static remove impact audit status")
    await closeDetails(page)

    const downloadPromise = page.waitForEvent("download")
    await page.click('[data-action="download"]')
    const download = await downloadPromise
    const exportedPath = join(artifactDir, download.suggestedFilename())
    await download.saveAs(exportedPath)
    const firstRecipe = JSON.parse(readFileSync(exportedPath, "utf8")) as {
      id: string
      modules?: Array<{ id: string }>
      atoms?: Array<{ id: string }>
      productShells?: Array<{ id: string }>
      bundles?: Array<{ id: string; removedAtoms?: string[] }>
      bindings: Array<{ port: string; module: string }>
      metadata?: Record<string, unknown>
    }
    if (!basename(exportedPath).startsWith("helix-opencode-recipe")) throw new Error(`unexpected export filename ${basename(exportedPath)}`)
    if (firstRecipe.metadata?.generatedBy !== "helix-builder") throw new Error("exported recipe metadata.generatedBy is not helix-builder")
    if (!firstRecipe.bindings.some((binding) => binding.port === "session.store" && binding.module === "session.store.memory")) {
      throw new Error("exported recipe did not preserve the session.store swap")
    }
    if (!firstRecipe.bundles?.some((bundle) => bundle.id === "bundle.opencode.session")) {
      throw new Error("exported recipe did not preserve opencode session bundle")
    }

    await runCliJSON(["validate", "recipe-file", exportedPath, "--json"], "validate exported recipe")
    await runCliJSON(["graph", "recipe-file", exportedPath, "--json"], "graph exported recipe")
    const assembled = await runCliJSON(["assemble", "--recipe-file", exportedPath, "--explain", "--json"], "assemble exported recipe") as {
      verification?: { ok?: boolean }
    }
    if (assembled.verification?.ok !== true) throw new Error("assembled recipe-file contract did not verify")

    const removedSessionAtom = "opencode.session.store.sqlite-projection"
    const customizedPath = join(artifactDir, "customized-session-bundle.json")
    const customizedRecipe = JSON.parse(JSON.stringify(firstRecipe)) as typeof firstRecipe
    customizedRecipe.id = "custom.opencode-customized-session"
    for (const key of ["modules", "atoms", "productShells"] as const) {
      if (Array.isArray(customizedRecipe[key])) {
        customizedRecipe[key] = customizedRecipe[key]?.filter((item) => item.id !== removedSessionAtom)
      }
    }
    const customizedSessionBundle = customizedRecipe.bundles?.find((bundle) => bundle.id === "bundle.opencode.session")
    if (!customizedSessionBundle) throw new Error("customized fixture could not find opencode session bundle")
    customizedSessionBundle.removedAtoms = Array.from(new Set([...(customizedSessionBundle.removedAtoms ?? []), removedSessionAtom]))
    writeFileSync(customizedPath, JSON.stringify(customizedRecipe, null, 2), "utf8")
    await clickMoreAction(page, "#clearButton")
    await page.setInputFiles("#recipeImport", customizedPath)
    if ((await page.locator(`[data-builder-atom="${removedSessionAtom}"][data-state-selected="true"]`).count()) !== 0) {
      throw new Error("customized import re-added the removed session atom")
    }
    await page.selectOption("#libraryModeFilter", "bundle")
    await page.fill("#atomSearch", "bundle.opencode.session")
    await assertVisible(page, '[data-builder-bundle="bundle.opencode.session"][data-builder-bundle-state="customized"]', "customized import preserved session bundle state")
    await assertVisible(page, '[data-builder-slot="slot.session.store"][data-builder-slot-status="customized"]', "customized import preserved session slot state")
    await assertVisible(page, '[data-builder-slot="slot.session.store"] [data-builder-slot-warning="slot.bundle.customized"]', "customized import rendered slot warning")
    await assertVisible(page, '[data-builder-family-diagnostic="builder.exclusive-family.customized-member"][data-builder-family-conflict="family.session"]', "customized import rendered family customized diagnostic")
    const customizedRoundTrip = JSON.parse(await page.inputValue("#exportText")) as { bundles?: Array<{ id: string; removedAtoms?: string[] }> }
    if (!customizedRoundTrip.bundles?.find((bundle) => bundle.id === "bundle.opencode.session")?.removedAtoms?.includes(removedSessionAtom)) {
      throw new Error("re-export after customized import lost removedAtoms")
    }

    await clickMoreAction(page, "#clearButton")
    if ((await page.locator('[data-state-selected="true"]').count()) !== 0) throw new Error("clear action left selected atoms in the builder")
    await page.setInputFiles("#recipeImport", exportedPath)
    await page.waitForFunction(`(() => {
      const element = document.querySelector("#exportText")
      const recipe = JSON.parse(element && "value" in element ? element.value || "{}" : "{}")
      return Array.isArray(recipe.bindings) && recipe.bindings.some((binding) => binding.port === "session.store" && binding.module === "session.store.memory")
    })()`)
    const secondRecipe = JSON.parse(await page.inputValue("#exportText")) as {
      id: string
      atoms?: Array<{ id: string }>
      productShells?: Array<{ id: string }>
      bundles?: Array<{ id: string }>
      bindings: Array<{ port: string; module: string }>
      requiredCapabilities?: string[]
      metadata?: Record<string, unknown>
    }
    assertRawRecipeRoundTrip(firstRecipe, secondRecipe, "exported opencode raw recipe")
    if (!secondRecipe.bindings.some((binding) => binding.port === "session.store" && binding.module === "session.store.memory")) {
      throw new Error("re-export after import lost the session.store binding")
    }
    if (!secondRecipe.bundles?.some((bundle) => bundle.id === "bundle.opencode.session")) {
      throw new Error("re-export after import lost the session bundle")
    }

    const conflictPath = join(artifactDir, "exclusive-family-conflict.json")
    const conflictRecipe = JSON.parse(readFileSync(exportedPath, "utf8")) as {
      id: string
      bundles?: Array<{ id: string }>
      metadata?: { diagnostics?: { diagnosticIDs?: string[] }; builderAssembly?: { familyReplacements?: unknown[] } }
    }
    conflictRecipe.id = "custom.exclusive-family-conflict"
    conflictRecipe.bundles = [...(conflictRecipe.bundles ?? []), { id: "bundle.nanobot.turn-loop" }]
    writeFileSync(conflictPath, JSON.stringify(conflictRecipe, null, 2), "utf8")
    await page.setInputFiles("#recipeImport", conflictPath)
    await assertVisible(page, '[data-builder-family-diagnostic="builder.exclusive-family.multiple-active"][data-builder-family-conflict="family.turn-loop"]', "imported exclusive family conflict diagnostic")
    await assertVisible(page, '[data-builder-family-diagnostic="builder.exclusive-family.stale-atoms"][data-builder-family-conflict="family.turn-loop"]', "imported stale family atoms diagnostic")
    await page.click('[data-builder-family-winner="family.turn-loop"][data-builder-family-winner-bundle="bundle.nanobot.turn-loop"]')
    const winnerRecipe = JSON.parse(await page.inputValue("#exportText")) as {
      atoms?: Array<{ id: string }>
      bundles?: Array<{ id: string }>
      bindings?: Array<{ port: string; module: string }>
      metadata?: { diagnostics?: { diagnosticIDs?: string[]; exclusiveFamilyConflicts?: Array<{ familyID: string; bundleIDs: string[] }> }; builderAssembly?: { familyReplacements?: Array<{ newBundleID: string; oldBundleIDs: string[] }> } }
    }
    if (!winnerRecipe.bundles?.some((bundle) => bundle.id === "bundle.nanobot.turn-loop")) throw new Error("family winner did not keep nanobot turn-loop")
    if (winnerRecipe.bundles?.some((bundle) => bundle.id === "bundle.opencode.turn-loop")) throw new Error("family winner left opencode turn-loop bundle")
    if (winnerRecipe.atoms?.some((atom) => atom.id === "opencode.turn.context-builder")) throw new Error("family winner left stale opencode turn atom")
    if (!winnerRecipe.bindings?.some((binding) => binding.port === "turn.context-builder" && binding.module === "nanobot.turn.context-builder")) {
      throw new Error("family winner did not migrate turn.context-builder binding")
    }
    if (winnerRecipe.metadata?.diagnostics?.exclusiveFamilyConflicts?.length) throw new Error("family winner export still contains exclusive family conflicts")
    if (!winnerRecipe.metadata?.builderAssembly?.familyReplacements?.some((item) => item.newBundleID === "bundle.nanobot.turn-loop" && item.oldBundleIDs.includes("bundle.opencode.turn-loop"))) {
      throw new Error("family winner did not record builderAssembly.familyReplacements")
    }

    const danglingPath = join(artifactDir, "exclusive-family-dangling-binding.json")
    const danglingRecipe = JSON.parse(readFileSync(exportedPath, "utf8")) as {
      id: string
      atoms?: Array<{ id: string }>
      bundles?: Array<{ id: string }>
      bindings?: Array<{ port: string; module: string }>
    }
    danglingRecipe.id = "custom.exclusive-family-dangling-binding"
    danglingRecipe.bundles = (danglingRecipe.bundles ?? []).filter((bundle) => bundle.id !== "bundle.opencode.turn-loop")
    danglingRecipe.atoms = (danglingRecipe.atoms ?? []).filter((atom) => atom.id !== "opencode.turn.context-builder")
    danglingRecipe.bindings = (danglingRecipe.bindings ?? []).map((binding) => binding.port === "turn.context-builder" ? { ...binding, module: "opencode.turn.context-builder" } : binding)
    writeFileSync(danglingPath, JSON.stringify(danglingRecipe, null, 2), "utf8")
    await page.setInputFiles("#recipeImport", danglingPath)
    await assertVisible(page, '[data-builder-family-diagnostic="builder.exclusive-family.dangling-binding"][data-builder-family-conflict="family.turn-loop"]', "imported dangling family binding diagnostic")

    const atomOnlyPath = join(artifactDir, "atom-only-minimal.json")
    writeFileSync(atomOnlyPath, JSON.stringify({
      id: "custom.atom-only-minimal",
      version: "0.1.0",
      modules: [],
      atoms: [],
      productShells: [{ id: "product.shell.minimal-cli" }],
      bindings: [{ port: "product.shell", module: "product.shell.minimal-cli" }],
      requiredCapabilities: ["product.shell"],
      personalities: ["common"],
      metadata: { generatedBy: "atom-only-fixture", product: "minimal", sourceFingerprint: "atom-only" },
    }, null, 2), "utf8")
    await page.setInputFiles("#recipeImport", atomOnlyPath)
    await assertVisible(page, '[data-builder-blueprint-kit="kit.inferred-import"][data-builder-blueprint-assembly-mode="import-inferred"]', "atom-only import inferred kit blueprint")
    await assertVisible(page, '[data-builder-slot="slot.product.shell"]:not([data-builder-slot-status="empty"]) [data-builder-slot-bundle-source="inferred"]', "atom-only import inferred product shell slot bundle")
    await page.selectOption("#libraryModeFilter", "bundle")
    await page.fill("#atomSearch", "bundle.product.minimal-cli")
    await assertVisible(page, '[data-builder-bundle="bundle.product.minimal-cli"][data-builder-bundle-source="inferred"]', "atom-only import inferred minimal CLI bundle card")
    await assertVisible(page, '[data-builder-blueprint-bundle="bundle.product.minimal-cli"][data-builder-blueprint-bundle-source="inferred"]', "atom-only import inferred blueprint bundle")
    await openDetailsSection(page, "materials")
    await assertVisible(page, '[data-builder-details-drawer="open"][data-builder-details-active-section="materials"] [data-builder-inspector-panel="bom"][data-builder-inspector-active="true"] [data-builder-bom-bundle="bundle.product.minimal-cli"][data-builder-bom-bundle-source="inferred"]', "atom-only import inferred BOM bundle")
    await assertDetailsMaterialsMatchExport(page, "atom-only inferred import")
    await assertDetailsAuditMatchesExport(page, "atom-only inferred import")
    await closeDetails(page)
    const atomOnlyRoundTrip = JSON.parse(await page.inputValue("#exportText")) as { bundles?: Array<{ id: string }>; metadata?: { builderAssembly?: { inferredBundleIDs?: string[]; mode?: string; source?: string } } }
    if (!atomOnlyRoundTrip.bundles?.some((bundle) => bundle.id === "bundle.product.minimal-cli")) {
      throw new Error("atom-only import did not export inferred minimal CLI bundle")
    }
    if (!atomOnlyRoundTrip.metadata?.builderAssembly?.inferredBundleIDs?.includes("bundle.product.minimal-cli")) {
      throw new Error("atom-only import did not record inferred bundle metadata")
    }
    if (atomOnlyRoundTrip.metadata?.builderAssembly?.mode !== "import-inferred" || atomOnlyRoundTrip.metadata?.builderAssembly?.source !== "import") {
      throw new Error("atom-only import did not keep builderAssembly import inference metadata")
    }

    const unknownPath = join(artifactDir, "unknown-loose.json")
    const unknownRecipe = JSON.parse(readFileSync(exportedPath, "utf8")) as {
      id: string
      atoms?: Array<{ id: string }>
    }
    unknownRecipe.id = "custom.unknown-loose"
    unknownRecipe.atoms = [...(Array.isArray(unknownRecipe.atoms) ? unknownRecipe.atoms : []), { id: "external.loose.custom" }]
    writeFileSync(unknownPath, JSON.stringify(unknownRecipe, null, 2), "utf8")
    await page.setInputFiles("#recipeImport", unknownPath)
    await assertVisible(page, '[data-builder-loose-area="ready"] [data-builder-loose-unknown="external.loose.custom"]', "imported unknown atom in loose chassis area")
    await openDetailsSection(page, "materials")
    await assertVisible(page, '[data-builder-details-drawer="open"][data-builder-details-active-section="materials"] [data-builder-inspector-panel="bom"][data-builder-inspector-active="true"] [data-builder-bom-loose-unknown="external.loose.custom"]', "imported unknown atom in BOM loose area")
    await closeDetails(page)

    const invalidPath = join(artifactDir, "invalid.json")
    writeFileSync(invalidPath, "{not json", "utf8")
    await page.setInputFiles("#recipeImport", invalidPath)
    await assertVisible(page, '[data-builder-diagnostic], .warning', "invalid import warning")

    await checkResponsive(page, `${server.url}/harness-builder.html`, artifactDir)
    await assertNoBrowserErrors(page, pageErrors, consoleErrors, artifactDir)
    process.stdout.write(`Builder browser e2e passed. Artifacts: ${artifactDir}\n`)
  } catch (error) {
    process.stderr.write(`Builder browser e2e failed. Artifacts: ${artifactDir}\n`)
    throw error
  } finally {
    await browser?.close()
    await new Promise<void>((resolveClose) => server.server.close(() => resolveClose()))
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

async function exerciseOnlineTui(page: Page, pageErrors: string[], consoleErrors: string[], artifactDir: string): Promise<void> {
  const profileRoot = mkdtempSync(join(tmpdir(), "helix-builder-tui-profile-"))
  const docsEnv = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    USER: process.env.USER,
    HELIX_DISABLE_LIVE_PROVIDER: "1",
  } as NodeJS.ProcessEnv
  const running = await startDocsServer({
    cwd: root,
    port: 0,
    env: docsEnv,
    profileStore: new HarnessProfileStore({ rootDir: profileRoot, cwd: root, env: docsEnv }),
  })
  try {
    let delayInitialBuilderData = true
    await page.route("**/api/builder-data", async (route) => {
      if (delayInitialBuilderData) {
        delayInitialBuilderData = false
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 500))
      }
      await route.continue()
    })
    await page.goto(`${running.url}/harness-builder.html?builderTestHooks=1`, { waitUntil: "domcontentloaded" })
    await assertVisible(page, '[data-harness-builder="loading"] #builderLoading[role="status"]', "online builder loading state")
    if (await page.locator("#builderLayout").isVisible()) throw new Error("online builder exposed the partial static layout while data was loading")
    await page.waitForSelector('[data-harness-builder="ready"]')
    await page.unroute("**/api/builder-data")
    await page.waitForLoadState("networkidle")
    await page.click('[data-builder-preset-button="minimal"]')
    await assertVisible(page, '[data-builder-validation-status="ready"]', "online minimal ready validation")
    await assertVisible(page, '[data-builder-compile="ready"]', "online compile button")
    await clickMoreAction(page, "#saveButton")
    await assertVisible(page, '#builderNotice[data-builder-notice-status="success"]:not([hidden])', "visible saved draft feedback")
    await assertTextContains(page, "#builderNotice", "Saved draft", "saved draft feedback copy")
    await page.click('[data-builder-compile="ready"]')
    await page.waitForFunction("window.__HELIX_BUILDER_TEST_HOOKS__ && window.__HELIX_BUILDER_TEST_HOOKS__.state.compileStatus === 'passed'", null, { timeout: 5_000 })
    await assertVisible(page, '[data-builder-right-card="tui"][data-builder-tui-dock="open"] [data-builder-tui-panel="ready"]', "online right TUI card")
    await page.waitForFunction("window.__HELIX_BUILDER_TEST_HOOKS__ && window.__HELIX_BUILDER_TEST_HOOKS__.state.tuiStatus === 'running'", null, { timeout: 20_000 })
    const runningSessionID = await page.evaluate("window.__HELIX_BUILDER_TEST_HOOKS__.state.tuiSession && window.__HELIX_BUILDER_TEST_HOOKS__.state.tuiSession.sessionID")
    await page.click("#moreMenuButton")
    await page.click("#moreStatusButton")
    await page.waitForSelector('[data-builder-right-card="tui"][data-builder-tui-dock="closed"]', { state: "attached", timeout: 5_000 })
    await page.waitForFunction("window.__HELIX_BUILDER_TEST_HOOKS__ && window.__HELIX_BUILDER_TEST_HOOKS__.state.tuiStatus === 'running'", null, { timeout: 5_000 })
    const [restoredPage] = await Promise.all([
      page.waitForEvent("popup"),
      page.evaluate(`window.open(${JSON.stringify(`${running.url}/harness-builder.html?builderTestHooks=1`)}, "_blank")`),
    ])
    try {
      restoredPage.on("pageerror", (error: Error) => pageErrors.push(error.message))
      restoredPage.on("console", (message: ConsoleMessage) => {
        if (message.type() === "error" && !message.text().includes("favicon") && !message.text().includes("404")) consoleErrors.push(message.text())
      })
      await restoredPage.waitForLoadState("networkidle")
      await restoredPage.waitForSelector('[data-harness-builder="ready"]')
      await restoredPage.waitForFunction("window.__HELIX_BUILDER_TEST_HOOKS__ && window.__HELIX_BUILDER_TEST_HOOKS__.state.tuiStatus === 'running'", null, { timeout: 5_000 })
      const restoredView = await restoredPage.evaluate(`(() => {
        const state = window.__HELIX_BUILDER_TEST_HOOKS__.state
        return { tuiOpen: state.tuiOpen, rightPanelCard: state.rightPanelCard }
      })()`) as { tuiOpen: boolean; rightPanelCard: string }
      if (restoredView.tuiOpen || restoredView.rightPanelCard !== "status") {
        throw new Error(`restoring a running TUI session changed the default view: ${JSON.stringify(restoredView)}`)
      }
      if (await restoredPage.locator('[data-builder-phase="start"]').first().isVisible()) {
        await restoredPage.click('[data-builder-preset-button="minimal"]')
      }
      await assertVisible(restoredPage, '#detailsOpenButton[aria-expanded="false"]', "review remains available after restoring a running TUI session")
      await restoredPage.click("#moreMenuButton")
      await restoredPage.click("#moreTuiButton")
      await assertVisible(restoredPage, '[data-builder-right-card="tui"][data-builder-tui-dock="open"] [data-builder-tui-panel="ready"]', "restored TUI opens on explicit request")
      await restoredPage.waitForFunction(`window.__HELIX_BUILDER_TEST_HOOKS__ && window.__HELIX_BUILDER_TEST_HOOKS__.state.tuiSession && window.__HELIX_BUILDER_TEST_HOOKS__.state.tuiSession.sessionID === ${JSON.stringify(runningSessionID)}`, null, { timeout: 5_000 })
    } finally {
      await restoredPage.close()
    }
    await page.click("#moreMenuButton")
    await page.click("#moreTuiButton")
    await assertVisible(page, '[data-builder-right-card="tui"][data-builder-tui-dock="open"] [data-builder-tui-panel="ready"]', "online right TUI card reopens")
    await page.waitForFunction(`window.__HELIX_BUILDER_TEST_HOOKS__ && window.__HELIX_BUILDER_TEST_HOOKS__.state.tuiSession && window.__HELIX_BUILDER_TEST_HOOKS__.state.tuiSession.sessionID === ${JSON.stringify(runningSessionID)}`, null, { timeout: 5_000 })
    const terminalBoxBeforeResize = await page.locator('[data-builder-tui-output="ready"]').boundingBox()
    const metadataBoxBeforeResize = await page.locator('[data-builder-right-card="tui"][data-builder-tui-dock="open"] .tui-bar').boundingBox()
    if (!terminalBoxBeforeResize || terminalBoxBeforeResize.height < 120) throw new Error(`TUI terminal was not visible before resize: ${JSON.stringify(terminalBoxBeforeResize)}`)
    if (!metadataBoxBeforeResize || terminalBoxBeforeResize.y > metadataBoxBeforeResize.y) {
      throw new Error(`TUI terminal should render before metadata cards: terminal=${JSON.stringify(terminalBoxBeforeResize)} metadata=${JSON.stringify(metadataBoxBeforeResize)}`)
    }
    if (await page.locator('[data-builder-layout-resizer="ready"]').isVisible()) throw new Error("simplified builder exposed the legacy right-panel resizer")
    await assertVisible(page, '[data-builder-tui-output="ready"] .xterm', "xterm terminal container")
    await page.locator('[data-builder-tui-output="ready"]').click()
    await page.keyboard.type("hello")
    await page.keyboard.press("Enter")
    await page.waitForFunction("window.__HELIX_BUILDER_TEST_HOOKS__ && String(window.__HELIX_BUILDER_TEST_HOOKS__.state.tuiTranscript || '').includes('Live provider is not configured')", null, { timeout: 20_000 })
    await page.locator('[data-builder-tui-output="ready"]').click()
    await page.keyboard.type("second")
    await page.keyboard.press("Enter")
    await page.waitForFunction("window.__HELIX_BUILDER_TEST_HOOKS__ && ((String(window.__HELIX_BUILDER_TEST_HOOKS__.state.tuiTranscript || '').match(/Live provider is not configured/g) || []).length >= 2)", null, { timeout: 20_000 })
    await page.click('[data-builder-tui-stop="ready"]')
    await page.waitForFunction("window.__HELIX_BUILDER_TEST_HOOKS__ && window.__HELIX_BUILDER_TEST_HOOKS__.state.tuiStatus === 'stopped'", null, { timeout: 10_000 })
    await assertNoBrowserErrors(page, pageErrors, consoleErrors, artifactDir)
    await page.goto("about:blank")
  } finally {
    running.tuiSessions.stopAll()
    await new Promise<void>((resolveClose) => running.server.close(() => resolveClose()))
    rmSync(profileRoot, { recursive: true, force: true })
  }
}

async function exerciseAssemblyChrome(page: Page): Promise<void> {
  await assertVisible(page, '[data-builder-guide-shell="ready"][data-builder-guide-collapsed="true"][data-builder-guide-mode="overview"] [data-builder-guide-toggle="true"]', "collapsed assembly guide at top")
  await page.click('[data-builder-guide-toggle="true"]')
  await assertVisible(page, '[data-builder-guide-shell="ready"][data-builder-guide-collapsed="false"][data-builder-guide-mode="overview"] [data-builder-guide-body="ready"]', "expanded assembly guide overview")
  await page.click('[data-builder-guide-toggle="true"]')
  await assertVisible(page, '[data-builder-guide-shell="ready"][data-builder-guide-collapsed="true"]', "re-collapsed assembly guide")
  await assertVisible(page, '[data-builder-slot]', "assembly slots")
  await page.locator('[data-slot-select]').first().click()
  await assertVisible(page, '[data-builder-guide-shell="ready"][data-builder-guide-collapsed="true"][data-builder-guide-mode="active"]', "slot selection keeps assembly guide collapsed")
  await assertVisible(page, '[data-builder-slot-socket="true"]', "assembly slot socket visual hook")
  await assertVisible(page, '[data-builder-assembly-view-toggle="ready"][data-builder-assembly-view="flow"]', "default flow assembly grouping")
  await assertVisible(page, '[data-builder-assembly-view-option="flow"][aria-pressed="true"]', "flow grouping selected")
  await page.click('[data-builder-assembly-view-option="technical"]')
  await assertVisible(page, '#board[data-builder-assembly-view="technical"]', "technical assembly grouping board")
  await assertVisible(page, '[data-builder-assembly-view-option="technical"][aria-pressed="true"]', "technical grouping selected")
  await assertVisible(page, '[data-builder-lane="agent-loop"][data-builder-assembly-view="technical"]', "technical agent-loop lane")
  await assertVisible(page, '[data-builder-slot-assembly-lane="agent-loop"]', "technical slot lane marker")
  await assertVisible(page, '[data-builder-blueprint-stage="agent-loop"]', "technical blueprint stage summary")
  await page.click('[data-builder-assembly-view-option="flow"]')
  await assertVisible(page, '#board[data-builder-assembly-view="flow"]', "restored flow assembly grouping board")
  await assertVisible(page, '[data-builder-lane="session"] [data-builder-lane-help="session"]', "session stage help button")
  await assertVisible(page, '[data-builder-lane="session"] [data-builder-lane-toggle="session"]', "session stage collapse toggle")
  await page.click('[data-builder-lane="session"] [data-builder-lane-toggle="session"]')
  await assertVisible(page, '[data-builder-lane="session"][data-builder-lane-collapsed="true"] [data-builder-lane-toggle="session"][aria-expanded="false"]', "collapsed session stage header")
  await page.locator('[data-builder-lane="session"] [data-builder-lane-body="session"]').waitFor({ state: "hidden", timeout: 5_000 })
  await page.click('[data-builder-lane="session"] [data-builder-lane-toggle="session"]')
  await assertVisible(page, '[data-builder-lane="session"][data-builder-lane-collapsed="false"] [data-builder-lane-body="session"]', "expanded session stage body")
  await page.hover('[data-builder-lane-help="session"]')
  await assertVisible(page, '#floatingHelp:not([hidden])', "floating session help popover")
  await assertTextContains(page, '#floatingHelp', "Session", "session help text")
}

async function exercisePreset(page: Page, preset: string, expectedAtom: string, absentAtom?: string): Promise<void> {
  if (!(await page.locator('[data-builder-layout="ready"][data-builder-phase="start"]').isVisible())) {
    await clickMoreAction(page, "#presetButton")
  }
  await assertVisible(page, '[data-builder-layout="ready"][data-builder-phase="start"]', `${preset} preset shelf`)
  await page.click(`[data-builder-preset-button="${preset}"]`)
  await assertVisible(page, '[data-builder-layout="ready"][data-builder-phase="build"]', `${preset} build phase`)
  await assertOccamDefaultModel(page, `${preset} build phase`, true)
  if (await page.locator(`[data-builder-preset-button="${preset}"]`).first().isVisible()) {
    throw new Error(`${preset} preset shelf stayed visible after build started`)
  }
  await assertSelectedAtom(page, expectedAtom, `${preset} expected atom`)
  if (absentAtom && (await page.locator(`[data-builder-atom="${absentAtom}"][data-state-selected="true"]`).count()) > 0) {
    throw new Error(`${preset} retained ${absentAtom} as a selected atom`)
  }
  await assertVisible(page, '[data-builder-bundle][data-builder-bundle-state="selected"]', `${preset} selected bundle`)
  await assertVisible(page, '[data-builder-bundle-action-button="remove"][data-remove-bundle]', `${preset} uninstall action button`)
  await assertVisible(page, '[data-builder-bundle-action-icon="remove"] .action-icon', `${preset} uninstall icon action`)
  await assertTextContains(page, '[data-builder-bundle-action-button="remove"][data-remove-bundle]', "Remove", `${preset} uninstall action label`)
  await assertCurrentAssemblyDensity(page, preset)
  await assertNoPresetLoose(page, preset)
  if (preset === "opencode") {
    await assertSlotAtomRole(page, "provider.auth.bearer", "slot.provider.auth", "variant")
    await assertSlotAtomRole(page, "config.merge.replace", "slot.config.merge-strategy", "optional")
    await assertSlotAtomRole(page, "event.log.jsonl", "slot.event.log", "optional")
    await assertSlotAtomRole(page, "tool.permission.always-deny", "slot.tool.permission-policy", "optional")
	  }
	  const exportText = await page.inputValue("#exportText")
	  const recipe = JSON.parse(exportText) as {
	    requiredCapabilities: string[]
	    bundles?: Array<{ id: string }>
	    metadata?: { bundleExpansion?: Array<{ bundleID: string; selectedAtomIDs?: string[]; atomIDs?: string[] }> }
	  }
	  if (!Array.isArray(recipe.requiredCapabilities) || recipe.requiredCapabilities.length === 0) throw new Error(`${preset} export has no required capabilities`)
	  if (!Array.isArray(recipe.bundles) || recipe.bundles.length === 0) throw new Error(`${preset} export has no bundle refs`)
	  if (preset === "opencode") {
	    const configExpansion = recipe.metadata?.bundleExpansion?.find((expansion) => expansion.bundleID === "bundle.config.sources")
	    if (!configExpansion?.selectedAtomIDs?.includes("config.merge.replace") && !configExpansion?.atomIDs?.includes("config.merge.replace")) {
	      throw new Error("opencode export did not preserve optional config.merge.replace in bundle expansion metadata")
	    }
	  }
	  await assertNoLaneOverlap(page, preset)
	}

async function assertNoPresetLoose(page: Page, preset: string): Promise<void> {
  const looseAtoms = await page.locator('[data-builder-loose-area] [data-builder-loose-atom]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-builder-loose-atom")))
  if (looseAtoms.length > 0) {
    throw new Error(`${preset} preset rendered false loose atoms: ${looseAtoms.slice(0, 8).join(", ")}`)
  }
}

async function assertSlotAtomRole(page: Page, atomID: string, slotID: string, role: string): Promise<void> {
  const selector = `[data-builder-slot="${slotID}"] [data-builder-slot-atom="${atomID}"][data-builder-slot-atom-role="${role}"]`
  if ((await page.locator(selector).count()) === 0) {
    throw new Error(`${atomID} was not assigned to ${slotID} as ${role}`)
  }
  if ((await page.locator(`[data-builder-loose-atom="${atomID}"]`).count()) > 0) {
    throw new Error(`${atomID} still appeared in loose after role assignment`)
  }
}

async function exerciseCurrentAssemblySelectionDetails(page: Page): Promise<void> {
  await closeDetails(page)

  const slotButton = page.locator('[data-slot-select]').first()
  await slotButton.waitFor({ state: "visible", timeout: 5_000 })
  const slotID = await slotButton.getAttribute("data-slot-select")
  if (!slotID) throw new Error("slot selection did not expose a slot id")
  await slotButton.click()
  await assertDetailsClosed(page, "slot detail selection")
  await assertVisible(page, `[data-builder-current-assembly] #detailPanel [data-builder-slot-detail="${slotID}"]`, "current assembly slot detail")
  await assertVisible(page, `[data-builder-current-assembly] #detailPanel [data-builder-slot-candidate-bundle="${slotID}"]`, "current assembly slot candidate action")

  await page.locator('[data-show-bundle="bundle.opencode.session"]').first().click()
  await assertDetailsClosed(page, "bundle detail selection")
  await assertVisible(page, '[data-builder-current-assembly] #detailPanel [data-builder-bundle-detail="bundle.opencode.session"]', "current assembly bundle detail")

  const atomToggle = page.locator(`[data-builder-slot="${slotID}"] [data-builder-slot-atoms-toggle="${slotID}"]`).first()
  if ((await atomToggle.count()) > 0 && (await atomToggle.isVisible().catch(() => false))) {
    await atomToggle.click()
  } else {
    await page.locator("[data-builder-slot-atoms-toggle]").first().click()
  }
  const slotAtomTile = page.locator("[data-slot-atom-id]").first()
  await slotAtomTile.waitFor({ state: "visible", timeout: 5_000 })
  const atomID = await slotAtomTile.getAttribute("data-slot-atom-id")
  if (!atomID) throw new Error("slot atom selection did not expose an atom id")
  await slotAtomTile.click()
  await assertDetailsClosed(page, "atom detail selection")
  await assertVisible(page, `[data-builder-current-assembly] #detailPanel [data-builder-atom="${atomID}"]`, "current assembly atom detail")

  await page.selectOption("#libraryModeFilter", "port")
  await page.fill("#atomSearch", "session.store")
  const portButton = page.locator('[data-builder-port-candidate][data-port-select]').first()
  await portButton.waitFor({ state: "visible", timeout: 5_000 })
  const portID = await portButton.getAttribute("data-port-select")
  if (!portID) throw new Error("port selection did not expose a port id")
  await portButton.click()
  await assertDetailsClosed(page, "port detail selection")
  await assertVisible(page, `[data-builder-current-assembly] #detailPanel [data-builder-port="${portID}"]`, "current assembly port detail")
  await assertVisible(page, `[data-builder-current-assembly] #detailPanel [data-builder-binding="candidate"][data-builder-port="${portID}"]`, "current assembly port provider choices")

  await page.selectOption("#libraryModeFilter", "bundle")
  await page.fill("#atomSearch", "")
}

async function assertCurrentAssemblyDensity(page: Page, label: string): Promise<void> {
  const gapCount = await page.locator('[data-builder-current-assembly] [data-builder-blueprint-gap-slot]').count()
  const bundleCount = await page.locator('[data-builder-current-assembly] [data-builder-blueprint-bundle]').count()
  const diagnosticCount = await page.locator('[data-builder-current-assembly] #warningList [data-builder-diagnostic]').count()
  const surfaceCount = await page.locator('[data-builder-current-assembly] [data-builder-surface]').count()
  const rawCount = await page.locator('[data-builder-current-assembly] #exportText').count()
  const bomAtomCount = await page.locator('[data-builder-current-assembly] [data-builder-bom-atom]').count()
  const portCoverageCount = await page.locator('[data-builder-current-assembly] [data-builder-port-stage]').count()
  if (gapCount > 5) throw new Error(`${label} current assembly rendered ${gapCount} gap slots in the default panel`)
  if (bundleCount > 5) throw new Error(`${label} current assembly rendered ${bundleCount} bundles in the default panel`)
  if (diagnosticCount > 3) throw new Error(`${label} current assembly rendered ${diagnosticCount} diagnostics in the default panel`)
  if (surfaceCount !== 0) throw new Error(`${label} current assembly rendered product surfaces in the default panel`)
  if (rawCount !== 0) throw new Error(`${label} current assembly rendered Raw Recipe in the default panel`)
  if (bomAtomCount !== 0) throw new Error(`${label} current assembly rendered BOM atoms in the default panel`)
  if (portCoverageCount !== 0) throw new Error(`${label} current assembly rendered full port coverage in the default panel`)

  const materialsLink = page.locator('[data-builder-current-assembly] [data-builder-details-section-target="materials"]').first()
  if ((await materialsLink.count()) > 0 && (await materialsLink.isVisible().catch(() => false))) {
    await materialsLink.click()
    await assertVisible(page, '[data-builder-details-drawer="open"][data-builder-details-active-section="materials"]', `${label} materials details shortcut`)
    await assertVisible(page, '[data-builder-details-section="materials"][data-builder-details-section-active="true"]', `${label} active materials details section`)
    await closeDetails(page)
  }

  const auditLink = page.locator('[data-builder-current-assembly] [data-builder-details-section-target="audit"]').first()
  if ((await auditLink.count()) > 0 && (await auditLink.isVisible().catch(() => false))) {
    await auditLink.click()
    await assertVisible(page, '[data-builder-details-drawer="open"][data-builder-details-active-section="audit"]', `${label} audit details shortcut`)
    await assertVisible(page, '[data-builder-details-section="audit"][data-builder-details-section-active="true"]', `${label} active audit details section`)
    await closeDetails(page)
  }
}

async function exerciseProductShellAddDoesNotReplaceFamily(page: Page): Promise<void> {
  await page.selectOption("#libraryModeFilter", "bundle")
  await page.selectOption("#planeFilter", "all")
  await page.selectOption("#scopeFilter", "all")
  await page.selectOption("#viewFilter", "all")
  await page.fill("#atomSearch", "bundle.pi-mono.product-shells")
  await assertVisible(page, '[data-builder-bundle="bundle.pi-mono.product-shells"][data-builder-bundle-family=""][data-builder-bundle-family-policy="allow-many"]', "pi product shell is not exclusive family")
  if ((await page.locator('[data-builder-bundle="bundle.pi-mono.product-shells"] [data-builder-bundle-action-button="replace-family"]').count()) > 0) {
    throw new Error("product shell action rendered as replace-family")
  }
  const shellAction = page.locator('[data-add-bundle="bundle.pi-mono.product-shells"], [data-replace-bundle="bundle.pi-mono.product-shells"]').first()
  await shellAction.waitFor({ state: "visible", timeout: 5_000 })
  await shellAction.click()
  await assertPendingChangeActive(page, "product shell install pending change")
  await assertVisible(page, '[data-builder-inspector-panel="preview"][data-builder-inspector-active="true"] [data-builder-preview-panel="bundle.pi-mono.product-shells"][data-builder-preview-action="install"]', "product shell install preview")
  await assertPreviewImpactSections(page, '[data-builder-preview-panel="bundle.pi-mono.product-shells"]', "product shell install preview", ["target-slots", "new-atoms", "shared-atoms", "bindings", "conflicts", "breaks"])
  if ((await page.locator('[data-builder-preview-action="replace-family"][data-builder-preview-panel="bundle.pi-mono.product-shells"]').count()) > 0) {
    throw new Error("product shell triggered replace-family preview")
  }
  await page.click('[data-preview-install="bundle.pi-mono.product-shells"]')
  await assertPendingChangeCleared(page, "confirmed product shell install pending change")
  await assertNoRawRecipeInCurrentAssembly(page, "confirmed product shell install")
  await openDetails(page)
  await page.click('[data-builder-details-nav-target="raw"]')
  await assertVisible(page, '[data-builder-details-drawer="open"][data-builder-details-active-section="raw"] [data-builder-details-section="raw"][data-builder-details-section-active="true"] #exportText', "product shell install raw recipe details")
  const mixedShellRecipe = JSON.parse(await page.inputValue("#exportText")) as { productShells?: Array<{ id: string }>; bundles?: Array<{ id: string }>; metadata?: { diagnostics?: { diagnosticIDs?: string[] } } }
  await closeDetails(page)
  if (!mixedShellRecipe.productShells?.some((shell) => shell.id === "opencode.product-shell.sdk")) throw new Error("product shell add removed opencode shell atom")
  if (!mixedShellRecipe.productShells?.some((shell) => shell.id === "pi.product-shell.sdk")) throw new Error("product shell add did not export pi shell atom")
  if (!mixedShellRecipe.bundles?.some((bundle) => bundle.id === "bundle.opencode.product-shells")) throw new Error("product shell add removed opencode product shells")
  if (!mixedShellRecipe.bundles?.some((bundle) => bundle.id === "bundle.pi-mono.product-shells")) throw new Error("product shell add did not export pi product shells")
  if (mixedShellRecipe.metadata?.diagnostics?.diagnosticIDs?.includes("builder.exclusive-family.multiple-active")) {
    throw new Error("product shell add reported exclusive family conflict")
  }
  await clickMoreAction(page, "#presetButton")
  await page.click('[data-builder-preset-button="opencode"]')
}

async function exerciseFamilyReplacementHelperHooks(page: Page): Promise<void> {
  const result = await page.evaluate(() => {
    const hooks = (globalThis as unknown as {
      __HELIX_BUILDER_TEST_HOOKS__?: {
        DATA: { bundles: Array<Record<string, unknown>> }
        bundleByID: Map<string, Record<string, unknown>>
        previewBundleFamilyReplacement: (id: string) => {
          severity: string
          breakPortIDs?: string[]
          conflictPortIDs?: string[]
          unresolvedPortIDs?: string[]
          danglingBindingPortIDs?: string[]
          sharedAtomIDs?: string[]
          removedAtomIDs?: string[]
        } | null
      }
    }).__HELIX_BUILDER_TEST_HOOKS__
    if (!hooks) throw new Error("builder test hooks missing")
    const old = hooks.bundleByID.get("bundle.opencode.turn-loop")
    if (!old) throw new Error("opencode turn-loop bundle missing")
    const synthetic = {
      ...old,
      id: "bundle.test.turn-loop-missing",
      label: "Test Missing Turn Loop",
      atoms: ["opencode.turn.context-builder"],
      ports: ["turn.context-builder"],
      exclusiveFamilyID: "family.turn-loop",
      exclusiveFamilyLabel: "Turn Loop",
      exclusiveFamilyPolicy: "replace",
      exclusiveFamilyPorts: ["turn.context-builder"],
    }
    hooks.DATA.bundles.push(synthetic)
    hooks.bundleByID.set("bundle.test.turn-loop-missing", synthetic)
    const plan = hooks.previewBundleFamilyReplacement("bundle.test.turn-loop-missing")
    const syntheticIndex = hooks.DATA.bundles.findIndex((bundle) => bundle.id === "bundle.test.turn-loop-missing")
    if (syntheticIndex >= 0) hooks.DATA.bundles.splice(syntheticIndex, 1)
    hooks.bundleByID.delete("bundle.test.turn-loop-missing")
    return {
      severity: plan?.severity,
      breakPortIDs: plan?.breakPortIDs ?? [],
      conflictPortIDs: plan?.conflictPortIDs ?? [],
      unresolvedPortIDs: plan?.unresolvedPortIDs ?? [],
      danglingBindingPortIDs: plan?.danglingBindingPortIDs ?? [],
      sharedAtomIDs: plan?.sharedAtomIDs ?? [],
      removedAtomIDs: plan?.removedAtomIDs ?? [],
    }
  })
  if (result.severity !== "blocked") throw new Error(`synthetic missing turn-loop plan should be blocked, received ${result.severity}`)
  const blockingReasons = [...result.breakPortIDs, ...result.conflictPortIDs, ...result.unresolvedPortIDs, ...result.danglingBindingPortIDs]
  if (blockingReasons.length === 0) throw new Error("synthetic missing turn-loop plan did not report blocking reasons")
  if (!result.sharedAtomIDs.includes("opencode.turn.context-builder")) throw new Error("replacement plan did not preserve shared old atom")
  if (result.removedAtomIDs.includes("opencode.turn.context-builder")) throw new Error("replacement plan removed shared old atom")
}

async function exerciseExclusiveFamilyReplacement(page: Page): Promise<void> {
  await page.selectOption("#libraryModeFilter", "bundle")
  await page.selectOption("#planeFilter", "all")
  await page.selectOption("#scopeFilter", "all")
  await page.selectOption("#viewFilter", "all")
  await page.fill("#atomSearch", "bundle.nanobot.turn-loop")
  await assertVisible(page, '[data-builder-bundle="bundle.nanobot.turn-loop"][data-builder-bundle-family="family.turn-loop"][data-builder-bundle-family-policy="replace"]', "nanobot turn loop exclusive family metadata")
  await assertVisible(page, '[data-builder-bundle="bundle.nanobot.turn-loop"] [data-builder-bundle-action-button="replace-family"][data-replace-family-bundle="bundle.nanobot.turn-loop"]', "nanobot turn loop family replace action")

  const beforeRecipeText = await page.inputValue("#exportText")
  await page.click('[data-replace-family-bundle="bundle.nanobot.turn-loop"]')
  await assertPendingChangeActive(page, "nanobot turn loop family replace pending change")
  await assertNoPreviewInBlueprint(page, "nanobot turn loop family replace preview")
  await assertVisible(page, '[data-builder-inspector-panel="preview"][data-builder-inspector-active="true"] [data-builder-preview-panel="bundle.nanobot.turn-loop"][data-builder-preview-action="replace-family"][data-builder-preview-family="family.turn-loop"]', "nanobot turn loop family replace preview")
  await assertVisible(page, '[data-builder-preview-old-bundle="bundle.opencode.turn-loop"]', "opencode turn loop old bundle")
  await assertVisible(page, '[data-builder-preview-new-bundle="bundle.nanobot.turn-loop"]', "nanobot turn loop new bundle")
  await assertPreviewImpactSections(page, '[data-builder-preview-panel="bundle.nanobot.turn-loop"]', "nanobot turn loop family replace preview", ["family", "old-bundles", "new-bundle", "target-slots", "new-atoms", "removed-atoms", "shared-atoms", "binding-changes", "conflicts", "breaks"])
  await assertCountAtLeast(page, '[data-builder-preview-panel="bundle.nanobot.turn-loop"] [data-builder-preview-atom]', 1, "nanobot turn loop replacement new atoms")
  await assertCountAtLeast(page, '[data-builder-preview-panel="bundle.nanobot.turn-loop"] [data-builder-preview-removed-atom]', 1, "nanobot turn loop replacement removed atoms")
  await assertVisible(page, '[data-builder-preview-binding-change="turn.context-builder"]', "turn context binding migration")
  await assertVisible(page, '[data-builder-preview-dock="ready"][data-builder-preview-dock-action="replace-family"]:not([hidden]) [data-preview-replace-family="bundle.nanobot.turn-loop"]', "family replace preview dock")
  await assertCompactPreviewDock(page, "family replace preview dock")
  await assertVisible(page, '[data-builder-slot-family-preview="family.turn-loop"][data-builder-slot-family-replacement="bundle.nanobot.turn-loop"][data-builder-slot-ghost-fit="replace"]', "family replace slot ghost fit")

  await page.click('[data-preview-cancel="true"]')
  await assertPendingChangeCleared(page, "canceled nanobot turn loop family replace pending change")
  const canceledRecipeText = await page.inputValue("#exportText")
  if (canceledRecipeText !== beforeRecipeText) throw new Error("canceling family replace changed the exported recipe")

  await page.click('[data-replace-family-bundle="bundle.nanobot.turn-loop"]')
  await assertPendingChangeActive(page, "confirmed nanobot turn loop family replace pending change")
  await page.click('[data-preview-replace-family="bundle.nanobot.turn-loop"]')
  await assertPendingChangeCleared(page, "confirmed nanobot turn loop family replace pending change")
  const replacedRecipe = JSON.parse(await page.inputValue("#exportText")) as {
    atoms?: Array<{ id: string }>
    bundles?: Array<{ id: string }>
    bindings?: Array<{ port: string; module: string }>
    metadata?: { diagnostics?: { diagnosticIDs?: string[]; exclusiveFamilyConflicts?: Array<{ familyID: string; bundleIDs: string[] }> } }
  }
  if (!replacedRecipe.bundles?.some((bundle) => bundle.id === "bundle.nanobot.turn-loop")) throw new Error("family replace did not export the nanobot turn-loop bundle")
  if (replacedRecipe.bundles?.some((bundle) => bundle.id === "bundle.opencode.turn-loop")) throw new Error("family replace left the opencode turn-loop bundle ref")
  if (!replacedRecipe.atoms?.some((atom) => atom.id === "nanobot.turn.context-builder")) throw new Error("family replace did not add nanobot turn context-builder")
  if (replacedRecipe.atoms?.some((atom) => atom.id === "opencode.turn.context-builder")) throw new Error("family replace left opencode turn context-builder selected")
  if (!replacedRecipe.bindings?.some((binding) => binding.port === "turn.context-builder" && binding.module === "nanobot.turn.context-builder")) {
    throw new Error("family replace did not migrate turn.context-builder binding")
  }
  if (replacedRecipe.metadata?.diagnostics?.diagnosticIDs?.includes("builder.exclusive-family.multiple-active")) {
    throw new Error("family replace still reported an exclusive-family conflict")
  }
  if (replacedRecipe.metadata?.diagnostics?.exclusiveFamilyConflicts?.length) {
    throw new Error("family replace exported exclusive family conflicts")
  }
  await page.fill("#atomSearch", "")
  await page.selectOption("#planeFilter", "all")
  await page.selectOption("#scopeFilter", "all")
  await page.selectOption("#viewFilter", "all")
}

async function exerciseSlotAtomExpansion(page: Page): Promise<void> {
  const toggle = page.locator("[data-builder-slot-atoms-toggle]").first()
  await toggle.waitFor({ state: "visible", timeout: 5_000 })
  const slotID = await toggle.getAttribute("data-builder-slot-atoms-toggle")
  if (!slotID) throw new Error("slot atom toggle did not expose its slot id")
  const toggleText = (await toggle.textContent())?.trim()
  if (toggleText) throw new Error(`slot atom toggle should be icon-only, found ${JSON.stringify(toggleText)}`)
  await assertVisible(page, `[data-builder-slot="${slotID}"] .module-chip-wrap [data-builder-slot-atoms-toggle="${slotID}"]`, "slot atom disclosure beside module title")
  if ((await page.locator(`[data-builder-slot-atoms="${slotID}"][data-builder-slot-atoms-expanded="true"]`).count()) !== 0) {
    throw new Error(`slot ${slotID} showed internal atoms before expansion`)
  }
  await toggle.click()
  await assertVisible(page, `[data-builder-slot="${slotID}"] [data-builder-slot-atoms="${slotID}"][data-builder-slot-atoms-expanded="true"]`, "expanded slot atom drawer")
  await assertVisible(page, `[data-builder-slot="${slotID}"] [data-builder-slot-atom]`, "expanded slot atom tile")
  await page.locator(`[data-builder-slot-atoms-toggle="${slotID}"]`).click()
  await page.locator(`[data-builder-slot="${slotID}"] [data-builder-slot-atoms="${slotID}"][data-builder-slot-atoms-expanded="false"]`).waitFor({ state: "hidden", timeout: 5_000 })
  await page.locator(`[data-builder-slot-atoms-toggle="${slotID}"]`).click()
  await assertVisible(page, `[data-builder-slot="${slotID}"] [data-builder-slot-atoms="${slotID}"][data-builder-slot-atoms-expanded="true"]`, "re-expanded slot atom drawer")
  await page.locator(`[data-builder-slot="${slotID}"] [data-builder-slot-atom]`).first().click()
  await openDetailsSection(page, "audit")
  await assertVisible(page, '[data-builder-details-drawer="open"][data-builder-details-active-section="audit"] [data-builder-inspector-panel="audit"][data-builder-inspector-active="true"]', "slot atom audit panel")
  await assertVisible(page, '[data-builder-active-atom-audit]:not([data-builder-active-atom-audit="empty"])', "active slot atom audit")
}

async function exerciseBundleLayer(page: Page): Promise<void> {
  await page.selectOption("#libraryModeFilter", "bundle")
  await page.selectOption("#planeFilter", "all")
  await page.selectOption("#scopeFilter", "all")
  await page.selectOption("#viewFilter", "all")
  await page.fill("#atomSearch", "bundle.product.minimal-cli")
  await assertVisible(page, '[data-builder-bundle="bundle.product.minimal-cli"]', "minimal CLI bundle card")
  await assertVisible(page, '[data-builder-bundle="bundle.product.minimal-cli"] [data-builder-bundle-action-button="remove"]', "minimal CLI uninstall action")
  await page.click('[data-remove-bundle="bundle.product.minimal-cli"]')
  await assertPendingChangeActive(page, "minimal CLI uninstall pending change")
  await assertNoPreviewInBlueprint(page, "minimal CLI uninstall preview")
  await assertVisible(page, '[data-builder-inspector-panel="preview"][data-builder-inspector-active="true"] [data-builder-preview-panel="bundle.product.minimal-cli"][data-builder-preview-action="remove"][data-builder-preview-severity="blocked"]', "minimal CLI uninstall impact preview")
  await assertPreviewImpactSections(page, '[data-builder-preview-panel="bundle.product.minimal-cli"]', "minimal CLI uninstall preview", ["target-slots", "removed-atoms", "shared-atoms", "bindings", "conflicts", "breaks"])
  await assertVisible(page, '[data-builder-preview-dock="ready"][data-builder-preview-dock-action="remove"]:not([hidden]) [data-preview-remove="bundle.product.minimal-cli"]', "minimal CLI uninstall preview dock")
  await assertCompactPreviewDock(page, "minimal CLI uninstall preview dock")
  await assertVisible(page, '[data-builder-preview-break-port="product.shell"]', "minimal CLI uninstall required port break")
  await assertVisible(page, '[data-builder-slot-preview-bundle="bundle.product.minimal-cli"][data-builder-slot-ghost-fit="conflict"]', "minimal CLI uninstall conflict ghost fit")
  await assertVisible(page, '[data-builder-slot-preview-bundle="bundle.product.minimal-cli"][data-builder-slot-interface-state="misaligned"] [data-builder-slot-interface-meter="misaligned"]', "minimal CLI uninstall misaligned socket")
  await assertSelectedAtom(page, "product.shell.minimal-cli", "minimal CLI shell kept before uninstall confirmation")
  await page.click('[data-preview-remove="bundle.product.minimal-cli"]')
  await assertPendingChangeCleared(page, "confirmed minimal CLI uninstall pending change")
  if ((await page.locator('[data-builder-atom="product.shell.minimal-cli"][data-state-selected="true"]').count()) !== 0) {
    throw new Error("removing minimal CLI bundle left its product shell selected")
  }
  await assertVisible(page, '[data-builder-bundle="bundle.product.minimal-cli"] [data-builder-bundle-action-button="install"][data-add-bundle="bundle.product.minimal-cli"]', "minimal CLI install action")
  await assertVisible(page, '[data-builder-bundle="bundle.product.minimal-cli"] [data-builder-bundle-action-icon="install"] .action-icon', "minimal CLI install icon action")
  await assertTextContains(page, '[data-builder-bundle="bundle.product.minimal-cli"] [data-builder-bundle-action-button="install"]', "Add", "minimal CLI install action label")
  await page.selectOption("#libraryModeFilter", "atom")
  await page.fill("#atomSearch", "product.shell.minimal-cli")
  await page.click('[data-add="product.shell.minimal-cli"]')
  await assertSelectedAtom(page, "product.shell.minimal-cli", "re-added minimal CLI atom")
  await assertVisible(page, '[data-builder-atom-promotion="ready"][data-builder-atom-promotion-atom="product.shell.minimal-cli"]', "completed atom selection promotion panel")
  await assertVisible(page, '[data-promote-bundle="bundle.product.minimal-cli"][data-builder-atom-promote-bundle="bundle.product.minimal-cli"][data-builder-bundle-promotion-source-atom="product.shell.minimal-cli"]', "minimal CLI atom promotion action")
  await page.click('[data-promote-bundle="bundle.product.minimal-cli"]')
  await assertVisible(page, '[data-builder-slot="slot.product.shell"] [data-builder-slot-bundle-source="explicit"]', "promoted minimal CLI bundle installed in slot")
  const minimalRecipe = JSON.parse(await page.inputValue("#exportText")) as { bundles?: Array<{ id: string }> }
  if (!minimalRecipe.bundles?.some((bundle) => bundle.id === "bundle.product.minimal-cli")) {
    throw new Error("promoting minimal CLI atom did not export a bundle ref")
  }

  await page.selectOption("#libraryModeFilter", "bundle")
  await page.fill("#atomSearch", "bundle.hermes-agent.session")
  await page.click('[data-preview-bundle="bundle.hermes-agent.session"]')
  await assertPendingChangeActive(page, "hermes session install pending change")
  await assertNoPreviewInBlueprint(page, "hermes session install preview")
  await assertVisible(page, '[data-builder-inspector-panel="preview"][data-builder-inspector-active="true"] [data-builder-preview-panel="bundle.hermes-agent.session"][data-builder-preview-action="install"]', "hermes session bundle install preview")
  await assertPreviewImpactSections(page, '[data-builder-preview-panel="bundle.hermes-agent.session"]', "hermes session install preview", ["target-slots", "new-atoms", "shared-atoms", "bindings", "conflicts", "breaks"])
  await assertVisible(page, '[data-builder-preview-panel="bundle.hermes-agent.session"] [data-builder-preview-impact="bindings"]:not([data-builder-preview-impact-count="0"])', "hermes session install binding impact count")
  await assertVisible(page, '[data-builder-preview-dock="ready"][data-builder-preview-dock-action="install"]:not([hidden]) [data-preview-install="bundle.hermes-agent.session"]', "hermes session install preview dock")
  await assertCompactPreviewDock(page, "hermes session install preview dock")
  await assertVisible(page, '[data-builder-slot-preview-bundle="bundle.hermes-agent.session"]:not([data-builder-slot-preview="none"])', "hermes session target slot preview")
  await assertVisible(page, '[data-builder-slot-preview-bundle="bundle.hermes-agent.session"]:not([data-builder-slot-ghost-fit="none"]) [data-builder-slot-ghost-fit-rail]', "hermes session ghost-fit rail")
  await assertVisible(page, '[data-builder-slot-preview-bundle="bundle.hermes-agent.session"] [data-builder-slot-ghost-fit-module="bundle.hermes-agent.session"]', "hermes session ghost-fit module")
  await assertCountAtLeast(page, '[data-builder-inspector-panel="preview"] [data-builder-preview-panel="bundle.hermes-agent.session"] [data-builder-preview-atom]', 1, "hermes session preview new atoms")
  await page.click('[data-preview-install="bundle.hermes-agent.session"]')
  await assertPendingChangeCleared(page, "confirmed hermes session install pending change")
  await assertSelectedAtom(page, "hermes.session.store.sqlite-fts", "hermes session bundle atom")
  await page.fill("#atomSearch", "bundle.hermes.session-sqlite-fts")
  await page.click('[data-add-bundle="bundle.hermes.session-sqlite-fts"]')
  await assertPendingChangeActive(page, "hermes named session install pending change")
  await assertNoPreviewInBlueprint(page, "hermes named session install preview")
  await assertVisible(page, '[data-builder-inspector-panel="preview"][data-builder-inspector-active="true"] [data-builder-preview-panel="bundle.hermes.session-sqlite-fts"][data-builder-preview-action="install"]', "hermes named session install preview")
  await page.click('[data-preview-install="bundle.hermes.session-sqlite-fts"]')
  await assertPendingChangeCleared(page, "confirmed hermes named session install pending change")
  await page.click('[data-preview-bundle="bundle.hermes.session-sqlite-fts"]')
  await assertPendingChangeActive(page, "hermes named session remove pending change")
  await assertNoPreviewInBlueprint(page, "hermes named session remove preview")
  await assertVisible(page, '[data-builder-inspector-panel="preview"][data-builder-inspector-active="true"] [data-builder-preview-panel="bundle.hermes.session-sqlite-fts"][data-builder-preview-action="remove"]', "hermes named session remove preview")
  await page.click('[data-preview-remove="bundle.hermes.session-sqlite-fts"]')
  await assertPendingChangeCleared(page, "confirmed hermes named session remove pending change")
  await assertSelectedAtom(page, "hermes.session.store.sqlite-fts", "shared hermes session atom kept after named bundle removal")
  await page.fill("#atomSearch", "")
}

async function checkResponsive(page: Page, url: string, artifactDir: string): Promise<void> {
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto(url, { waitUntil: "networkidle" })
    await assertVisible(page, '[data-builder-preset-button="opencode"]', `preset button at ${viewport.width}`)
    await openDetailsSection(page, "raw")
    await assertVisible(page, '[data-builder-details-drawer="open"] [data-builder-details-raw="ready"] #exportText', `responsive details raw recipe at ${viewport.width}`)
    await openDetailsSubsection(page, "activation")
    await assertVisible(page, '[data-builder-details-drawer="open"] [data-builder-details-section="activation"] [data-builder-activation="ready"]', `responsive details activation section at ${viewport.width}`)
    await assertNoVisibleTextOverflow(page, `details drawer at ${viewport.width}x${viewport.height}`, artifactDir, viewport)
    for (const section of ["materials", "audit", "raw", "commands"]) {
      await page.click(`[data-builder-details-nav-target="${section}"]`)
      await assertVisible(page, `[data-builder-details-drawer="open"][data-builder-details-active-section="${section}"] [data-builder-details-section="${section}"][data-builder-details-section-active="true"]`, `responsive details ${section} section at ${viewport.width}`)
      await assertNoVisibleTextOverflow(page, `details ${section} at ${viewport.width}x${viewport.height}`, artifactDir, viewport)
    }
    await closeDetails(page)
    if (viewport.width <= 420) {
      await page.click('[data-builder-preset-button="minimal"]')
      await assertVisible(page, '[data-builder-layout="ready"][data-builder-phase="build"]', `mobile build phase at ${viewport.width}`)
      await page.selectOption("#libraryModeFilter", "bundle")
      await page.fill("#atomSearch", "bundle.product.minimal-cli")
      await page.click('[data-remove-bundle="bundle.product.minimal-cli"]')
      await assertVisible(page, '[data-builder-pending-change="active"] [data-builder-preview-panel="bundle.product.minimal-cli"] [data-preview-remove="bundle.product.minimal-cli"]', "mobile pending change confirmation")
      await assertVisible(page, '[data-builder-preview-dock="ready"][data-builder-preview-dock-action="remove"]:not([hidden]) [data-preview-remove="bundle.product.minimal-cli"]', "mobile preview dock confirmation")
    }
    await assertNoVisibleTextOverflow(page, `builder surface at ${viewport.width}x${viewport.height}`, artifactDir, viewport)
    const overflow = await page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth") as number
    if (overflow > 4) {
      await page.screenshot({ path: join(artifactDir, `overflow-${viewport.width}x${viewport.height}.png`), fullPage: true })
      throw new Error(`horizontal overflow ${overflow}px at ${viewport.width}x${viewport.height}`)
    }
  }
}

type OverflowViewport = { width: number; height: number }

async function assertNoVisibleTextOverflow(page: Page, label: string, artifactDir: string, viewport: OverflowViewport): Promise<void> {
  const issues = await page.evaluate(`(() => {
    const targetSelector = [
      'button',
      '.chip',
      '.preset-button',
      '.wizard-choice',
      '.bundle-tile',
      '.provider-choice',
      '.surface-row',
      '.impact-section',
      '.details-section',
      '.preview-dock',
      '.command-row',
      '.diagnostic',
      '.validation-card',
      '.guide-step',
      '.guide-acceptance-check',
      '.metric'
    ].join(', ');
    const ignoredSelector = [
      'input',
      'select',
      'textarea',
      'pre',
      'code',
      'svg',
      'canvas',
      '#exportText',
      '.tui-terminal',
      '.xterm',
      '.activation-log',
      '.tui-log',
      '.tui-fallback-output'
    ].join(', ');
    const verticalSelector = [
      'button',
      '.chip',
      '.provider-choice',
      '.surface-row',
      '.impact-section',
      '.details-section',
      '.preview-dock',
      '.command-row',
      '.diagnostic',
      '.validation-card',
      '.guide-step',
      '.guide-acceptance-check'
    ].join(', ');
    const esc = (value) => window.CSS && CSS.escape ? CSS.escape(value) : String(value).replace(/["\\\\]/g, '\\\\$&');
    const describe = (element) => {
      if (element.id) return '#' + esc(element.id);
      const dataAttribute = Array.from(element.attributes).find((attribute) => attribute.name.startsWith('data-builder') || attribute.name.startsWith('data-'));
      const dataSelector = dataAttribute ? '[' + dataAttribute.name + '="' + esc(dataAttribute.value) + '"]' : '';
      const classSelector = typeof element.className === 'string' && element.className.trim()
        ? '.' + element.className.trim().split(/\\s+/).slice(0, 3).map((className) => esc(className)).join('.')
        : '';
      return element.tagName.toLowerCase() + dataSelector + classSelector;
    };
    return Array.from(document.querySelectorAll(targetSelector))
      .filter((element) => {
        if (element.matches(ignoredSelector) || element.closest(ignoredSelector)) return false;
        if (!element.textContent || !element.textContent.trim()) return false;
        if (element.closest('[hidden], [aria-hidden="true"]')) return false;
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      })
      .map((element) => {
        const xOverflow = element.scrollWidth - element.clientWidth;
        const yOverflow = element.matches(verticalSelector) ? element.scrollHeight - element.clientHeight : 0;
        return {
          selector: describe(element),
          text: (element.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 140),
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          xOverflow,
          yOverflow
        };
      })
      .filter((issue) => issue.xOverflow > 3 || issue.yOverflow > 3)
      .slice(0, 12);
  })()`) as Array<{
    selector: string
    text: string
    scrollWidth: number
    clientWidth: number
    scrollHeight: number
    clientHeight: number
    xOverflow: number
    yOverflow: number
  }>

  if (issues.length > 0) {
    await page.screenshot({ path: join(artifactDir, `text-overflow-${viewport.width}x${viewport.height}.png`), fullPage: true })
    throw new Error(`${label} has visible text overflow: ${JSON.stringify(issues, null, 2)}`)
  }
}

async function runCliJSON(args: string[], label: string): Promise<unknown> {
  const { stdout } = await execFileAsync(resolve(root, "node_modules/.bin/tsx"), ["packages/cli/src/index.ts", ...args], {
    cwd: root,
    maxBuffer: 10 * 1024 * 1024,
  })
  try {
    return JSON.parse(stdout)
  } catch (error) {
    throw new Error(`${label} returned non-JSON output: ${stdout.slice(0, 500)}`)
  }
}

async function assertVisible(page: Page, selector: string, label: string): Promise<void> {
  const locator = page.locator(selector).first()
  try {
    await locator.waitFor({ state: "visible", timeout: 5_000 })
  } catch {
    throw new Error(`Expected visible ${label}: ${selector}`)
  }
}

async function clickMoreAction(page: Page, selector: string): Promise<void> {
  const menu = page.locator("#moreMenu")
  if (!(await menu.evaluate((element) => (element as unknown as { open: boolean }).open))) {
    await page.click("#moreMenuButton")
  }
  await assertVisible(page, selector, `More menu action ${selector}`)
  await page.click(selector)
}

async function assertInspectorTabs(page: Page, label: string): Promise<void> {
  await assertVisible(page, '[data-builder-inspector-tabs="three-card-tabs"]', `${label} inspector tabs`)
  for (const tab of ["blueprint", "details"]) {
    await assertVisible(page, `[data-builder-inspector-tab="${tab}"]`, `${label} ${tab} inspector tab`)
  }
  if ((await page.locator('[data-builder-inspector-tab="preview"]').count()) !== 1) throw new Error(`${label} did not retain the contextual preview tab`)
  const tabCount = await page.locator("[data-builder-inspector-tab]").count()
  if (tabCount !== 3) throw new Error(`${label} rendered ${tabCount} top-level inspector tabs instead of 3`)
  for (const oldTab of ["bom", "audit", "raw", "commands", "activation"]) {
    const oldTabCount = await page.locator(`[data-builder-inspector-tab="${oldTab}"]`).count()
    if (oldTabCount !== 0) throw new Error(`${label} rendered legacy top-level inspector tab ${oldTab}`)
  }
}

async function openDetails(page: Page): Promise<void> {
  const drawer = page.locator('[data-builder-details-drawer="open"]').first()
  if ((await drawer.count()) === 0 || !(await drawer.isVisible().catch(() => false))) {
    await page.click('#detailsOpenButton')
  }
  await assertVisible(page, '[data-builder-details-drawer="open"]', "details drawer")
}

async function openDetailsSubsection(page: Page, section: string): Promise<void> {
  const target = page.locator(`[data-builder-details-section="${section}"]`).first()
  await target.waitFor({ state: "attached", timeout: 5_000 })
  await target.evaluate((node) => {
    ;(node as { open?: boolean }).open = true
  })
}

async function openDetailsSection(page: Page, section: string): Promise<void> {
  await openDetails(page)
  const nav = page.locator(`[data-builder-details-nav-target="${section}"]`).first()
  if ((await nav.count()) > 0) {
    await nav.click()
  }
  await openDetailsSubsection(page, section)
  if ((await nav.count()) > 0) {
    await assertVisible(page, `[data-builder-details-drawer="open"][data-builder-details-active-section="${section}"] [data-builder-details-section="${section}"][data-builder-details-section-active="true"]`, `active ${section} details section`)
  }
}

async function closeDetails(page: Page): Promise<void> {
  const drawer = page.locator('[data-builder-details-drawer="open"]').first()
  if ((await drawer.count()) > 0 && (await drawer.isVisible().catch(() => false))) {
    await page.click('#currentAssemblyTabButton')
  }
  await page.locator('[data-builder-details-drawer="closed"]').first().waitFor({ state: "attached", timeout: 5_000 })
}

async function assertDetailsClosed(page: Page, label: string): Promise<void> {
  await page.locator('[data-builder-details-drawer="closed"]').first().waitFor({ state: "attached", timeout: 5_000 })
  const openVisible = await page.locator('[data-builder-details-drawer="open"]').first().isVisible().catch(() => false)
  if (openVisible) throw new Error(`${label} opened the details drawer`)
}

async function assertCountAtLeast(page: Page, selector: string, min: number, label: string): Promise<void> {
  const count = await page.locator(selector).count()
  if (count < min) throw new Error(`Expected at least ${min} ${label}, found ${count}`)
}

async function assertSelectedAtom(page: Page, atomID: string, label: string): Promise<void> {
  await assertCountAtLeast(page, `[data-builder-atom="${atomID}"][data-state-selected="true"]`, 1, label)
}

async function assertPendingChangeActive(page: Page, label: string): Promise<void> {
  await assertVisible(page, '[data-builder-pending-change="active"]', label)
  await assertVisible(page, '[data-builder-inspector-panel="preview"][data-builder-inspector-active="true"]', `${label} panel`)
}

async function assertPendingChangeCleared(page: Page, label: string): Promise<void> {
  await page.locator('[data-builder-pending-change="empty"]').first().waitFor({ state: "attached", timeout: 5_000 })
  const activeCount = await page.locator('[data-builder-pending-change="active"]').count()
  if (activeCount !== 0) throw new Error(`${label} left ${activeCount} active pending-change sections`)
  const dockCount = await page.locator('[data-builder-preview-dock="ready"]:not([hidden]) [data-preview-install], [data-builder-preview-dock="ready"]:not([hidden]) [data-preview-remove], [data-builder-preview-dock="ready"]:not([hidden]) [data-preview-replace-family], [data-builder-preview-dock="ready"]:not([hidden]) [data-binding-preview-confirm]').count()
  if (dockCount !== 0) throw new Error(`${label} left ${dockCount} visible preview dock confirmation actions`)
}

async function assertCompactPreviewDock(page: Page, label: string): Promise<void> {
  await assertVisible(page, '[data-builder-preview-dock="ready"][data-builder-preview-dock-density="compact"][data-builder-preview-dock-role="confirmation"]:not([hidden])', `${label} compact shell`)
  await assertVisible(page, '[data-builder-preview-dock="ready"]:not([hidden]) [data-builder-preview-dock-summary="compact"]', `${label} compact summary`)
  await assertVisible(page, '[data-builder-preview-dock="ready"]:not([hidden]) [data-builder-preview-dock-actions="ready"]', `${label} compact actions`)
  const duplicatedDetailCount = await page.locator(
    '[data-builder-preview-dock="ready"]:not([hidden]) [data-builder-preview-panel], ' +
    '[data-builder-preview-dock="ready"]:not([hidden]) [data-builder-binding-preview], ' +
    '[data-builder-preview-dock="ready"]:not([hidden]) [data-builder-preview-atom], ' +
    '[data-builder-preview-dock="ready"]:not([hidden]) [data-builder-preview-removed-atom], ' +
    '[data-builder-preview-dock="ready"]:not([hidden]) [data-builder-preview-binding-change], ' +
    '[data-builder-preview-dock="ready"]:not([hidden]) .impact-section'
  ).count()
  if (duplicatedDetailCount !== 0) throw new Error(`${label} duplicated ${duplicatedDetailCount} full preview detail nodes`)
}

async function assertPreviewImpactSections(page: Page, panelSelector: string, label: string, sections: string[]): Promise<void> {
  for (const section of sections) {
    await assertVisible(page, `${panelSelector} [data-builder-preview-impact="${section}"][data-builder-preview-impact-count]`, `${label} ${section} impact section`)
  }
}

async function assertNoPreviewInBlueprint(page: Page, label: string): Promise<void> {
  const count = await page.locator('[data-builder-inspector-panel="blueprint"] [data-builder-preview-panel], [data-builder-inspector-panel="blueprint"] [data-builder-binding-preview]').count()
  if (count !== 0) throw new Error(`${label} rendered ${count} preview nodes inside the blueprint panel`)
}

async function assertNoRawRecipeInCurrentAssembly(page: Page, label: string): Promise<void> {
  const rawCount = await page.locator('[data-builder-current-assembly] #exportText').count()
  if (rawCount !== 0) throw new Error(`${label} rendered Raw Recipe in the default current assembly panel`)
}

async function assertOccamDefaultModel(page: Page, label: string, expectBuildSummary: boolean): Promise<void> {
  await assertVisible(page, '[data-builder-zone="materials"]', `${label} materials zone`)

  if (expectBuildSummary) {
    await assertVisible(page, '[data-builder-zone="assembly"]', `${label} assembly zone`)
    await assertVisible(page, '[data-builder-zone="audit"]', `${label} current assembly zone`)
    await assertVisible(page, '[data-builder-current-assembly="ready"] [data-builder-current-assembly-section="ready"][data-builder-inspector-panel="blueprint"][data-builder-inspector-active="true"]', `${label} current assembly section`)
    await assertVisible(page, '#detailsOpenButton[aria-expanded="false"][aria-controls="detailsDrawer"]', `${label} details button`)
    await page.locator('[data-builder-details-drawer="closed"]').first().waitFor({ state: "attached", timeout: 5_000 })
    await assertInspectorTabs(page, label)
    if ((await page.locator('[data-builder-details-drawer="open"]').count()) !== 0) throw new Error(`${label} opened details by default`)
    if ((await page.locator('[data-builder-pending-change="active"]').count()) !== 0) throw new Error(`${label} showed pending change before user action`)
    await assertVisible(page, '[data-builder-current-assembly] #validationPanel [data-builder-validation-status]', `${label} readiness status`)
    await assertVisible(page, '[data-builder-current-assembly] #validationPanel [data-builder-validation-next-stage]', `${label} next-step hint`)
    await assertVisible(page, '[data-builder-current-assembly] [data-builder-current-assembly-action="readiness"]', `${label} actionable readiness`)
    await assertCountAtLeast(page, '[data-builder-current-assembly] #metrics .metric', 3, `${label} core metrics`)
    await assertCountAtLeast(page, '[data-builder-current-assembly] [data-builder-current-assembly-action^="metric-"]', 3, `${label} actionable metrics`)
    await assertCountAtLeast(page, '[data-builder-current-assembly] [data-builder-current-assembly-summary="ready"][data-builder-current-assembly-model="actionable"]', 1, `${label} actionable summary`)
    for (const action of ["harness", "kit", "stage-summary", "next-gap", "gaps", "installed-bundles", "latest-impact", "blocking-reason"]) {
      await assertCountAtLeast(page, `[data-builder-current-assembly] [data-builder-current-assembly-action="${action}"]`, 1, `${label} ${action} summary action`)
    }
  } else {
    await assertVisible(page, "#startIntro", `${label} start guidance`)
    await assertCountAtLeast(page, "[data-builder-preset-button]", 6, `${label} preset choices`)
    if (await page.locator('[data-builder-zone="assembly"]').isVisible()) throw new Error(`${label} exposed the empty assembly zone`)
    if (await page.locator('[data-builder-zone="audit"]').isVisible()) throw new Error(`${label} exposed the empty review zone`)
  }

  const advancedInDefaultPanel = await page.locator(
    '[data-builder-current-assembly] #exportText, ' +
    '[data-builder-current-assembly] [data-builder-bom-atom], ' +
    '[data-builder-current-assembly] [data-builder-bom-bundle], ' +
    '[data-builder-current-assembly] [data-builder-port-stage], ' +
    '[data-builder-current-assembly] [data-builder-command], ' +
    '[data-builder-current-assembly] [data-builder-details-section], ' +
    '[data-builder-current-assembly] [data-builder-activation], ' +
    '[data-builder-current-assembly] [data-builder-tui-dock]'
  ).count()
  if (advancedInDefaultPanel !== 0) throw new Error(`${label} rendered ${advancedInDefaultPanel} advanced detail nodes in the default current assembly panel`)
}

function sortedIDs(items: Array<{ id?: string } | string> | undefined): string[] {
  return (items ?? []).map((item) => typeof item === "string" ? item : item.id ?? "").filter(Boolean).sort()
}

function sortedBindings(items: Array<{ port?: string; module?: string }> | undefined): string[] {
  return (items ?? []).map((item) => `${item.port ?? ""}->${item.module ?? ""}`).filter((item) => item !== "->").sort()
}

function assertRawRecipeRoundTrip(
  before: {
    id?: string
    atoms?: Array<{ id: string }>
    productShells?: Array<{ id: string }>
    bundles?: Array<{ id: string }>
    bindings?: Array<{ port: string; module: string }>
    requiredCapabilities?: string[]
    metadata?: Record<string, unknown>
  },
  after: {
    id?: string
    atoms?: Array<{ id: string }>
    productShells?: Array<{ id: string }>
    bundles?: Array<{ id: string }>
    bindings?: Array<{ port: string; module: string }>
    requiredCapabilities?: string[]
    metadata?: Record<string, unknown>
  },
  label: string,
): void {
  if (after.id !== before.id) throw new Error(`${label} round trip changed id from ${before.id} to ${after.id}`)
  if (JSON.stringify(sortedIDs(after.bundles)) !== JSON.stringify(sortedIDs(before.bundles))) throw new Error(`${label} round trip changed bundle refs`)
  if (JSON.stringify(sortedBindings(after.bindings)) !== JSON.stringify(sortedBindings(before.bindings))) throw new Error(`${label} round trip changed bindings`)
  if (JSON.stringify(sortedIDs(after.requiredCapabilities)) !== JSON.stringify(sortedIDs(before.requiredCapabilities))) throw new Error(`${label} round trip changed required capabilities`)
  if (JSON.stringify(sortedIDs(after.atoms)) !== JSON.stringify(sortedIDs(before.atoms))) throw new Error(`${label} round trip changed regular atoms`)
  if (JSON.stringify(sortedIDs(after.productShells)) !== JSON.stringify(sortedIDs(before.productShells))) throw new Error(`${label} round trip changed product shells`)
  if (after.metadata?.generatedBy !== "helix-builder") throw new Error(`${label} round trip lost builder metadata`)
}

async function assertDetailsMaterialsMatchExport(page: Page, label: string): Promise<void> {
  const recipe = JSON.parse(await page.inputValue("#exportText")) as {
    atoms?: Array<{ id: string }>
    productShells?: Array<{ id: string }>
    bundles?: Array<{ id: string }>
    metadata?: { diagnostics?: { explicitBindings?: number; selectedAtoms?: number } }
  }
  const selectedAtoms = recipe.metadata?.diagnostics?.selectedAtoms ?? ((recipe.atoms?.length ?? 0) + (recipe.productShells?.length ?? 0))
  await openDetails(page)
  await page.click('[data-builder-details-nav-target="materials"]')
  await assertVisible(page, '[data-builder-details-drawer="open"][data-builder-details-active-section="materials"] [data-builder-details-section="materials"][data-builder-details-section-active="true"]', `${label} active materials details`)
  await assertText(page, "#bomBadge", String(selectedAtoms), `${label} BOM badge selected atom count`)
  const bundleCount = await page.locator('[data-builder-details-section="materials"] [data-builder-bom-bundle]').count()
  const atomCount = await page.locator('[data-builder-details-section="materials"] [data-builder-bom-atom]').count()
  const shellCount = await page.locator('[data-builder-details-section="materials"] [data-builder-bom-shell]').count()
  const explicitBindingCount = await page.locator('[data-builder-details-section="materials"] [data-builder-bom-binding]').count()
  if (bundleCount !== (recipe.bundles?.length ?? 0)) throw new Error(`${label} BOM rendered ${bundleCount} bundles but export has ${recipe.bundles?.length ?? 0}`)
  if (atomCount !== Math.min(80, selectedAtoms)) throw new Error(`${label} BOM rendered ${atomCount} listed atoms but export metadata has ${selectedAtoms}`)
  if (shellCount !== (recipe.productShells?.length ?? 0)) throw new Error(`${label} BOM rendered ${shellCount} product shells but export has ${recipe.productShells?.length ?? 0}`)
  if (explicitBindingCount !== (recipe.metadata?.diagnostics?.explicitBindings ?? 0)) throw new Error(`${label} BOM rendered ${explicitBindingCount} explicit bindings but export metadata has ${recipe.metadata?.diagnostics?.explicitBindings ?? 0}`)
}

async function assertDetailsAuditMatchesExport(page: Page, label: string): Promise<void> {
  const recipe = JSON.parse(await page.inputValue("#exportText")) as {
    requiredCapabilities?: string[]
    metadata?: { diagnostics?: { missingRequiredPorts?: string[]; diagnosticIDs?: string[] } }
  }
  const requiredCount = recipe.requiredCapabilities?.length ?? 0
  const missingCount = recipe.metadata?.diagnostics?.missingRequiredPorts?.length ?? 0
  await openDetails(page)
  await page.click('[data-builder-details-nav-target="audit"]')
  await assertVisible(page, '[data-builder-details-drawer="open"][data-builder-details-active-section="audit"] [data-builder-details-section="audit"][data-builder-details-section-active="true"]', `${label} active audit details`)
  await assertText(page, "#coverageBadge", `${requiredCount - missingCount}/${requiredCount}`, `${label} coverage badge`)
  const portRows = await page.locator('[data-builder-details-section="audit"] #portList [data-builder-port]').count()
  const coveredPortRows = await page.locator('[data-builder-details-section="audit"] #portList [data-builder-port][data-covered="true"]').count()
  if (requiredCount > 0 && portRows === 0) throw new Error(`${label} audit did not render any port rows`)
  if (portRows > requiredCount) throw new Error(`${label} audit rendered ${portRows} port rows but export has ${requiredCount} required ports`)
  if (coveredPortRows > requiredCount - missingCount) throw new Error(`${label} audit rendered ${coveredPortRows} covered port rows but export has ${requiredCount - missingCount} covered ports`)
  const renderedDiagnosticIDs = await page.evaluate(`Array.from(document.querySelectorAll('[data-builder-details-section="audit"] #diagnosticList [data-builder-diagnostic]')).map((node) => node.getAttribute('data-builder-diagnostic') || '').filter(Boolean).sort()`) as string[]
  const exportedDiagnosticIDs = [...(recipe.metadata?.diagnostics?.diagnosticIDs ?? [])].sort()
  if (JSON.stringify(renderedDiagnosticIDs) !== JSON.stringify(exportedDiagnosticIDs)) {
    throw new Error(`${label} audit diagnostics ${JSON.stringify(renderedDiagnosticIDs)} did not match export ${JSON.stringify(exportedDiagnosticIDs)}`)
  }
}

async function assertText(page: Page, selector: string, expected: string, label: string): Promise<void> {
  const actual = (await page.locator(selector).first().textContent())?.trim()
  if (actual !== expected) throw new Error(`Expected ${label} to be ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}`)
}

async function assertTextContains(page: Page, selector: string, expected: string, label: string): Promise<void> {
  const actual = (await page.locator(selector).first().textContent())?.trim() ?? ""
  if (!actual.includes(expected)) throw new Error(`Expected ${label} to contain ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}`)
}

async function assertTextNotContains(page: Page, selector: string, unexpected: string, label: string): Promise<void> {
  const actual = (await page.locator(selector).first().textContent())?.trim() ?? ""
  if (actual.includes(unexpected)) throw new Error(`Expected ${label} not to contain ${JSON.stringify(unexpected)}, found ${JSON.stringify(actual)}`)
}

async function assertNoLaneOverlap(page: Page, label: string): Promise<void> {
  const overlap = await page.evaluate(`(() => {
    const lanes = Array.from(document.querySelectorAll("#board .lane"))
    for (let index = 0; index < lanes.length - 1; index += 1) {
      const current = lanes[index]
      const next = lanes[index + 1]
      if (!current || !next) continue
      const currentRect = current.getBoundingClientRect()
      const nextRect = next.getBoundingClientRect()
      if (currentRect.bottom > nextRect.top + 1) {
        return {
          current: current.dataset.builderLane,
          next: next.dataset.builderLane,
          currentBottom: currentRect.bottom,
          nextTop: nextRect.top,
        }
      }
    }
    return null
  })()`)
  if (overlap) throw new Error(`${label} lane overlap: ${JSON.stringify(overlap)}`)
}

async function assertNoBrowserErrors(page: Page, pageErrors: string[], consoleErrors: string[], artifactDir: string): Promise<void> {
  if (pageErrors.length === 0 && consoleErrors.length === 0) return
  await page.screenshot({ path: join(artifactDir, "browser-error.png"), fullPage: true })
  throw new Error(`Browser errors: ${[...pageErrors, ...consoleErrors].join(" | ")}`)
}

function contentType(path: string): string {
  if (extname(path) === ".html") return "text/html; charset=utf-8"
  if (extname(path) === ".json") return "application/json; charset=utf-8"
  if (extname(path) === ".css") return "text/css; charset=utf-8"
  if (extname(path) === ".js") return "text/javascript; charset=utf-8"
  return "application/octet-stream"
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`)
  process.exitCode = 1
})
