import { randomUUID } from "node:crypto"
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs"
import { createServer, type IncomingMessage, type ServerResponse } from "node:http"
import { dirname, extname, isAbsolute, relative, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { gzipSync } from "node:zlib"
import { WebSocketServer } from "ws"
import {
  assembleRecipeHarness,
  buildAssembledFlowBlueprint,
  buildAssembledFlowRun,
  buildAssemblyContract,
  buildHarnessFlowComparison,
  buildOriginalFlowForProduct,
  buildOriginalFlowFromNativeCadenceFixture,
  buildOriginalFlowFromTaskParityReport,
  compareHarnessFlows,
  compileRecipe,
  createLiveProvider,
  HarnessGatewayController,
  HarnessProfileStore,
  parseRecipe,
  readProductTaskNativeCadenceFixtureSplitSet,
  nativeProjectionLossDetailsForFixture,
  redactProfileSecrets,
  resolveLiveProviderConfig,
  verifyProductTaskNativeCadenceFixtureSet,
  type HarnessFlowGraph,
  type HarnessNativeProjectionLossDetail,
  type HarnessProduct,
  type HarnessTurnResult,
  type HarnessTuiProviderMode,
  type LiveProviderKind,
  type ProductTaskNativeCadenceFixture,
  type ProductTaskNativeCadenceFixtureSet,
  type ProductTaskNativeCadenceFixtureSplitSet,
  type ProductTaskParityReport,
  type TaskParityAttachmentRef,
} from "@helix/recipes"
import {
  doctorExternalTool,
  externalCaptureHarnessProduct,
  listExternalToolProfiles,
  nativeCadenceFixtureSetFromExternalCapture,
  verifyNativeCaptureArtifact,
  type ExternalToolCaptureMode,
  type ExternalToolDoctorResult,
  type ExternalToolID,
  type NativeCaptureArtifact,
} from "@helix/external-tools"
import { analyzeHarnessRemovalImpact } from "./builder-impact.ts"
import { buildDocsSite, buildHarnessBuilderData, buildHarnessBuilderRecipeFlowBlueprint, renderDocsSite, renderHarnessBuilder, type HarnessBuilderData, type HarnessExternalToolSummary } from "./index.ts"
import { HarnessTuiSessionController, type HarnessTuiSessionSource } from "./tui-session.ts"

export interface RecipeDraft {
  id: string
  recipe: unknown
  createdAt: string
  updatedAt: string
}

export interface RecipeDraftStore {
  create(recipe: unknown): Promise<RecipeDraft>
  get(id: string): Promise<RecipeDraft | undefined>
  list(): Promise<RecipeDraft[]>
}

export class MemoryRecipeDraftStore implements RecipeDraftStore {
  private readonly drafts = new Map<string, RecipeDraft>()

  async create(recipe: unknown): Promise<RecipeDraft> {
    const now = new Date().toISOString()
    const draft: RecipeDraft = {
      id: `draft-${randomUUID()}`,
      recipe,
      createdAt: now,
      updatedAt: now,
    }
    this.drafts.set(draft.id, draft)
    return draft
  }

  async get(id: string): Promise<RecipeDraft | undefined> {
    return this.drafts.get(id)
  }

  async list(): Promise<RecipeDraft[]> {
    return [...this.drafts.values()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  }
}

export interface DocsServerOptions {
  cwd?: string
  host?: string
  port?: number
  store?: RecipeDraftStore
  profileStore?: HarnessProfileStore
  env?: NodeJS.ProcessEnv
}

export interface RunningDocsServer {
  server: ReturnType<typeof createServer>
  url: string
  store: RecipeDraftStore
  tuiSessions: HarnessTuiSessionController
}

export async function startDocsServer(options: DocsServerOptions = {}): Promise<RunningDocsServer> {
  const cwd = options.cwd ?? process.cwd()
  loadServerDotEnv(cwd)
  const host = options.host ?? process.env.HOST ?? "127.0.0.1"
  const port = options.port ?? numberFromEnv(process.env.PORT, 5173)
  const env = options.env ?? process.env
  const store = options.store ?? new MemoryRecipeDraftStore()
  const profileStore = options.profileStore ?? new HarnessProfileStore({ cwd, env })
  const tuiSessions = new HarnessTuiSessionController({ cwd, env, profileStore })
  const siteDir = resolve(cwd, "docs/site")
  const dataCache = createDocsDataCache(cwd)
  const builderDataCache = createHarnessBuilderDataCache(dataCache.get)
  builderDataCache.payload()

  const server = createServer((request, response) => {
    void handleRequest({
      request,
      response,
      cwd,
      siteDir,
      store,
      profileStore,
      tuiSessions,
      env,
      getData: dataCache.get,
      getBuilderSourceData: builderDataCache.source,
      getBuilderData: builderDataCache.get,
      getBuilderDataPayload: builderDataCache.payload,
    }).catch((error: unknown) => {
      sendJSON(response, 500, { error: error instanceof Error ? error.message : String(error) })
    })
  })
  const webSocketServer = new WebSocketServer({ noServer: true })
  server.on("upgrade", (request, socket, head) => {
    try {
      const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`)
      const sessionID = harnessTuiSocketSessionID(url.pathname)
      if (!sessionID) {
        socket.destroy()
        return
      }
      webSocketServer.handleUpgrade(request, socket, head, (ws) => {
        try {
          tuiSessions.attach(sessionID, ws)
        } catch (error) {
          ws.send(JSON.stringify({ type: "error", error: error instanceof Error ? error.message : String(error) }))
          ws.close()
        }
      })
    } catch {
      socket.destroy()
    }
  })

  await new Promise<void>((resolveListen, rejectListen) => {
    const onError = (error: Error): void => {
      server.off("listening", onListen)
      rejectListen(error)
    }
    const onListen = (): void => {
      server.off("error", onError)
      resolveListen()
    }
    server.once("error", onError)
    server.once("listening", onListen)
    server.listen(port, host)
  })

  const address = server.address()
  const actualPort = typeof address === "object" && address ? address.port : port
  return { server, url: `http://${host}:${actualPort}`, store, tuiSessions }
}

interface RequestContext {
  request: IncomingMessage
  response: ServerResponse
  cwd: string
  siteDir: string
  store: RecipeDraftStore
  profileStore: HarnessProfileStore
  tuiSessions: HarnessTuiSessionController
  env: NodeJS.ProcessEnv
  getData: () => ReturnType<typeof buildDocsSite>
  getBuilderSourceData: () => ReturnType<typeof buildDocsSite>
  getBuilderData: () => HarnessBuilderData
  getBuilderDataPayload: () => { json: string; gzip: Buffer }
}

async function handleRequest(context: RequestContext): Promise<void> {
  const { request, response, cwd, siteDir, store, getData, getBuilderSourceData, getBuilderData, getBuilderDataPayload } = context
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`)
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname

  if (request.method === "GET" && pathname === "/api/health") {
    sendJSON(response, 200, {
      ok: true,
      mode: "online",
      storage: "memory",
      generatedAt: getData().generatedAt,
    })
    return
  }

  if (request.method === "GET" && pathname === "/api/builder-data") {
    sendBuilderData(request, response, getBuilderDataPayload())
    return
  }

  if (request.method === "GET" && pathname === "/api/external-tools/status") {
    sendJSON(response, 200, await buildExternalToolsStatus(getData().externalTools))
    return
  }

  if (pathname === "/api/harness-flow/blueprint" || pathname === "/api/harness-flow/native" || pathname === "/api/harness-flow/compare" || pathname === "/api/harness-flow/run") {
    await handleHarnessFlowAPI(context, pathname, url)
    return
  }

  if (request.method === "GET" && pathname === "/api/harness-run-defaults") {
    const defaults = resolveLiveProviderConfig({})
    sendJSON(response, 200, {
      provider: defaults.provider ?? "openai-compatible",
      modelID: defaults.modelID ?? "",
      baseURL: defaults.baseURL ?? defaultBaseURL(defaults.provider),
      appURL: defaults.appURL ?? "",
      appName: defaults.appName ?? "",
      hasServerAPIKey: Boolean(defaults.apiKey),
      missing: defaults.missing.filter((item) => !item.toLowerCase().includes("api key") && !item.includes("_API_KEY")),
    })
    return
  }

  if (request.method === "GET" && pathname === "/api/recipes/drafts") {
    sendJSON(response, 200, { drafts: await store.list() })
    return
  }

  if (request.method === "GET" && pathname.startsWith("/api/recipes/drafts/")) {
    const draftID = decodeURIComponent(pathname.slice("/api/recipes/drafts/".length))
    const draft = await store.get(draftID)
    if (!draft) {
      sendJSON(response, 404, { error: `Draft ${draftID} not found.` })
      return
    }
    sendJSON(response, 200, draft)
    return
  }

  if (request.method === "POST" && pathname === "/api/recipes/drafts") {
    const body = await readJSONBody(request)
    const record = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
    const recipe = record.recipe ?? body
    if (!recipe || typeof recipe !== "object" || Array.isArray(recipe)) {
      sendJSON(response, 400, { error: "Recipe draft body must be a JSON object." })
      return
    }
    const draft = await store.create(recipe)
    sendJSON(response, 201, { ...draft, url: `/api/recipes/drafts/${encodeURIComponent(draft.id)}` })
    return
  }

  if (request.method === "POST" && pathname === "/api/harness-runs") {
    await handleHarnessRun(context)
    return
  }

  if (pathname === "/api/harness-tui-sessions" || pathname.startsWith("/api/harness-tui-sessions/")) {
    await handleHarnessTuiSessionAPI(context, pathname)
    return
  }

  if (request.method === "POST" && pathname === "/api/harness-impact/remove") {
    await handleHarnessRemovalImpact(context)
    return
  }

  if (pathname === "/api/harnesses" || pathname.startsWith("/api/harnesses/")) {
    await handleInstalledHarnessAPI(context, pathname)
    return
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJSON(response, 405, { error: "Method not allowed." })
    return
  }

  if (pathname === "/index.html") {
    sendHTML(request, response, renderDocsSite(getData()))
    return
  }

  if (pathname === "/harness-builder.html") {
    sendHTML(
      request,
      response,
      renderHarnessBuilder(getBuilderSourceData(), {
        dataSource: "api",
        builderData: getBuilderData(),
        builderDataUrl: "/api/builder-data",
        recipeDraftsUrl: "/api/recipes/drafts",
        harnessRunsUrl: "/api/harness-runs",
        harnessRunDefaultsUrl: "/api/harness-run-defaults",
        harnessImpactUrl: "/api/harness-impact/remove",
        harnessProfilesUrl: "/api/harnesses",
        harnessTuiSessionsUrl: "/api/harness-tui-sessions",
        harnessFlowUrl: "/api/harness-flow",
      }),
    )
    return
  }

  if (pathname === "/vendor/xterm/xterm.js" || pathname === "/vendor/xterm/xterm.css") {
    serveVendorXterm(response, cwd, pathname)
    return
  }

  serveStaticFile(response, siteDir, pathname)
}

type RunnableRecipe = Parameters<typeof compileRecipe>[0]

interface NativeFlowEvidenceStatus {
  status: "linked" | "missing" | "unverified"
  source: "native-cadence-fixture" | "task-parity-report" | "native-capture-artifact" | "external-capture"
  product: HarnessProduct
  taskID: string
  message: string
  artifactPath?: string
  attachmentPath?: string
  sha256?: string
  generatedAt?: string
  nativeVersion?: string
  cadenceLevel?: string
  providerRequests?: number
  messagePartTypes?: string[]
  projectionLosses?: number
  projectionLossDetails?: HarnessNativeProjectionLossDetail[]
  verifierIssues?: string[]
  reportMode?: string
  reportStatus?: string
  runnerID?: string
  sourceTool?: ExternalToolID
  sourceToolVersion?: string
  captureMode?: ExternalToolCaptureMode
  sourceArtifact?: NativeCaptureArtifact["sourceArtifact"]
  lossiness?: NativeCaptureArtifact["lossiness"]
}

interface LoadedNativeFlowEvidence {
  status: NativeFlowEvidenceStatus
  fixture?: ProductTaskNativeCadenceFixture
  attachment?: TaskParityAttachmentRef
  report?: ProductTaskParityReport
}

function parseFlowEvidenceSource(value: string | undefined): NativeFlowEvidenceStatus["source"] {
  if (value === "task-parity-report" || value === "task-parity") return "task-parity-report"
  if (value === "native-capture-artifact" || value === "native-capture") return "native-capture-artifact"
  if (value === "external-capture" || value === "external-capture-artifact" || value === "external-tool-capture") return "external-capture"
  return "native-cadence-fixture"
}

async function buildExternalToolsStatus(summary: HarnessExternalToolSummary): Promise<HarnessExternalToolSummary & { generatedAt: string }> {
  const profilesByID = new Map(listExternalToolProfiles().map((profile) => [profile.id, profile]))
  const tools = await Promise.all(
    summary.tools.map(async (tool) => {
      const profile = profilesByID.get(tool.id as ExternalToolID)
      let doctor: ExternalToolDoctorResult | undefined
      try {
        doctor = await doctorExternalTool(tool.id as ExternalToolID, { timeoutMs: 1000 })
      } catch (error) {
        doctor = {
          toolID: tool.id as ExternalToolID,
          label: tool.label,
          ok: false,
          installed: false,
          command: profile?.versionCommand.command ?? tool.command,
          args: profile?.versionCommand.args ?? [],
          error: error instanceof Error ? error.message : String(error),
          profile: {
            supportedProducts: profile?.supportedProducts ?? [],
            supportedArtifactFormats: profile?.supportedArtifactFormats ?? [],
            supportedCaptureModes: profile?.supportedCaptureModes ?? [],
          },
        }
      }
      const installStatus = doctor.installed ? "installed" as const : "missing" as const
      return {
        ...tool,
        installHints: tool.installHints.length > 0 ? tool.installHints : [...(profile?.installHints ?? [])],
        installStatus,
        ...(doctor.version ? { detectedVersion: doctor.version } : {}),
        doctorMessage: doctor.ok ? "tool installed" : doctor.error ?? "tool missing",
        installed: doctor.installed,
        doctor: {
          ok: doctor.ok,
          command: doctor.command,
          args: doctor.args,
          ...(doctor.version ? { version: doctor.version } : {}),
          ...(doctor.error ? { error: doctor.error } : {}),
        },
      }
    }),
  )
  return { generatedAt: new Date().toISOString(), tools }
}

async function handleHarnessRemovalImpact(context: RequestContext): Promise<void> {
  const { request, response, getData } = context
  const body = await readJSONBody(request, 1_000_000)
  const record = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
  const atomID = stringValue(record.atomID) ?? stringValue(record.removeAtomID)
  try {
    if (!atomID) throw new Error("Removal impact body must include atomID.")
    const recipe = record.recipe
    const impact = analyzeHarnessRemovalImpact(buildHarnessBuilderData(getData()), { atomID, recipe })
    sendJSON(response, 200, impact)
  } catch (error) {
    sendJSON(response, 400, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

async function handleHarnessFlowAPI(context: RequestContext, pathname: string, url: URL): Promise<void> {
  const { request, response, cwd, getData, store } = context
  if (pathname === "/api/harness-flow/run") {
    if (request.method !== "POST") {
      sendJSON(response, 405, { error: "Method not allowed." })
      return
    }
    await handleHarnessFlowRun(context, url)
    return
  }
  if (pathname === "/api/harness-flow/blueprint" && request.method === "POST") {
    try {
      const body = objectRecord(await readJSONBody(request, 1_000_000))
      const recipe = body.recipe ?? body
      const generatedAt = new Date().toISOString()
      sendJSON(response, 200, {
        ...buildHarnessBuilderRecipeFlowBlueprint(getData(), recipe, generatedAt),
        draftSource: "request-body",
      })
    } catch (error) {
      sendJSON(response, 400, {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
    return
  }
  if (request.method !== "GET") {
    sendJSON(response, 405, { error: "Method not allowed." })
    return
  }
  try {
    const productValue = stringValue(url.searchParams.get("product")) ?? "opencode"
    const taskID = stringValue(url.searchParams.get("task")) ?? stringValue(url.searchParams.get("taskID"))
    const generatedAt = new Date().toISOString()
    const currentModuleAudit = getData().currentModuleAudit
    if (pathname === "/api/harness-flow/blueprint") {
      const draftID = stringValue(url.searchParams.get("draft")) ?? stringValue(url.searchParams.get("draftID"))
      if (draftID) {
        const draft = await store.get(draftID)
        if (!draft) {
          sendJSON(response, 404, { error: `Draft ${draftID} not found.` })
          return
        }
        sendJSON(response, 200, {
          ...buildHarnessBuilderRecipeFlowBlueprint(getData(), draft.recipe, generatedAt),
          draftSource: "persisted-draft",
          draftID: draft.id,
          draftUpdatedAt: draft.updatedAt,
        })
        return
      }
      const product = parseFlowAssemblyProduct(productValue)
      sendJSON(response, 200, buildAssembledFlowBlueprint(buildAssemblyContract({ product }), generatedAt, { currentModuleAudit }))
      return
    }
    const product = parseFlowHarnessProduct(productValue)
    const flowTaskID = taskID ?? "read-only-answer"
    const requestedNativeArtifactPath = stringValue(url.searchParams.get("artifact")) ?? stringValue(url.searchParams.get("fixture"))
    const evidenceSource = parseFlowEvidenceSource(stringValue(url.searchParams.get("source")) ?? stringValue(url.searchParams.get("evidenceSource")))
    const nativeEvidence = evidenceSource === "task-parity-report"
      ? loadTaskParityFlowEvidence({
          product,
          taskID: flowTaskID,
          reports: getData().taskParity?.reports ?? [],
        })
      : evidenceSource === "external-capture"
      ? loadExternalCaptureFlowEvidence({
          cwd,
          product,
          taskID: flowTaskID,
          ...(requestedNativeArtifactPath ? { artifactPath: requestedNativeArtifactPath } : {}),
        })
      : loadNativeFlowEvidence({
          cwd,
          product,
          taskID: flowTaskID,
          source: evidenceSource,
          ...(requestedNativeArtifactPath ? { artifactPath: requestedNativeArtifactPath } : {}),
        })
    if (nativeEvidence.status.status === "unverified") {
      sendJSON(response, 400, {
        ok: false,
        error: nativeEvidence.status.message,
        nativeEvidence: nativeEvidence.status,
      })
      return
    }
    if (pathname === "/api/harness-flow/native") {
      const graph = nativeEvidence.report
        ? buildOriginalFlowFromTaskParityReport(nativeEvidence.report, generatedAt)
        : nativeEvidence.fixture
        ? buildOriginalFlowFromNativeCadenceFixture(nativeEvidence.fixture, generatedAt)
        : buildOriginalFlowForProduct(product, {
            generatedAt,
            taskID: flowTaskID,
          })
      sendJSON(response, 200, attachNativeEvidenceToGraph(graph, nativeEvidence))
      return
    }
    if (pathname === "/api/harness-flow/compare") {
      if (nativeEvidence.report || nativeEvidence.fixture) {
        const assembled = buildAssembledFlowBlueprint(buildAssemblyContract({ product }), generatedAt, { currentModuleAudit })
        const original = attachNativeEvidenceToGraph(
          nativeEvidence.report
            ? buildOriginalFlowFromTaskParityReport(nativeEvidence.report, generatedAt)
            : buildOriginalFlowFromNativeCadenceFixture(nativeEvidence.fixture!, generatedAt),
          nativeEvidence,
        )
        sendJSON(response, 200, { ...compareHarnessFlows({ assembled, original, generatedAt }), original, nativeEvidence: nativeEvidence.status })
      } else {
        sendJSON(
          response,
          200,
          {
            ...buildHarnessFlowComparison({
              product,
              generatedAt,
              taskID: flowTaskID,
              currentModuleAudit,
            }),
            nativeEvidence: nativeEvidence.status,
          },
        )
      }
      return
    }
    sendJSON(response, 404, { error: "Not found." })
  } catch (error) {
    sendJSON(response, 400, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

async function handleHarnessFlowRun(context: RequestContext, url: URL): Promise<void> {
  const { request, response, getData } = context
  try {
    const body = objectRecord(await readJSONBody(request, 1_000_000))
    const productValue = stringValue(body.product) ?? stringValue(url.searchParams.get("product")) ?? "opencode"
    const product = parseFlowAssemblyProduct(productValue)
    const taskID = stringValue(body.taskID) ?? stringValue(body.task) ?? stringValue(url.searchParams.get("task")) ?? stringValue(url.searchParams.get("taskID")) ?? "read-only-answer"
    const prompt = limitText(stringValue(body.prompt) ?? "Flow Observer assembled fixture trace.", 8_000, "Prompt")
    const maxSteps = clampInteger(body.maxSteps, 1, 12, 1)
    const toolSequence = stringArray(body.toolSequence ?? body.tools)
    const generatedAt = new Date().toISOString()
    sendJSON(
      response,
      200,
      buildAssembledFlowRun({
        product,
        contract: buildAssemblyContract({ product }),
        currentModuleAudit: getData().currentModuleAudit,
        generatedAt,
        taskID,
        prompt,
        steps: maxSteps,
        providerRequestCount: Math.max(1, maxSteps),
        toolSequence,
        finish: "ok",
        captureMode: "fixture",
      }),
    )
  } catch (error) {
    sendJSON(response, 400, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

function loadNativeFlowEvidence(input: {
  cwd: string
  product: HarnessProduct
  taskID: string
  source?: "native-cadence-fixture" | "native-capture-artifact"
  artifactPath?: string
}): LoadedNativeFlowEvidence {
  const artifactPath = nativeCadenceFixtureArtifactPath(input.cwd, input.artifactPath)
  const source = input.source ?? "native-cadence-fixture"
  const missing = (message = "no native evidence linked"): LoadedNativeFlowEvidence => ({
    status: {
      status: "missing",
      source,
      product: input.product,
      taskID: input.taskID,
      message,
      ...(artifactPath ? { artifactPath: displayPath(input.cwd, artifactPath) } : {}),
    },
  })
  if (!artifactPath || !existsSync(artifactPath)) return missing()
  try {
    const artifact = readNativeCadenceFixtureArtifact(artifactPath)
    const verification = verifyProductTaskNativeCadenceFixtureSet(artifact)
    if (!verification.ok) {
      return {
        status: {
          status: "unverified",
          source,
          product: input.product,
          taskID: input.taskID,
          message: "native evidence fixture failed verification",
          artifactPath: displayPath(input.cwd, artifactPath),
          verifierIssues: verification.issues.slice(0, 6).map((issue) => `${issue.id}: ${issue.message}`),
        },
      }
    }
    const match = nativeCadenceFixtureEntries(artifact).find((entry) => entry.fixture.product === input.product && entry.fixture.taskID === input.taskID)
    if (!match) return missing("no native evidence linked")
    return {
      fixture: match.fixture,
      ...(match.attachment ? { attachment: match.attachment } : {}),
      status: {
        status: "linked",
        source,
        product: match.fixture.product,
        taskID: match.fixture.taskID,
        message: "native evidence linked",
        artifactPath: displayPath(input.cwd, artifactPath),
        ...(match.attachment
          ? {
              attachmentPath: displayPath(input.cwd, resolve(dirname(artifactPath), match.attachment.path)),
              sha256: match.attachment.sha256,
            }
          : {}),
        generatedAt: nativeCadenceFixtureGeneratedAt(artifact),
        nativeVersion: match.fixture.nativeVersion,
        cadenceLevel: match.fixture.cadenceSignature.level,
        providerRequests: match.fixture.providerShape.requests,
        messagePartTypes: match.fixture.messageParts,
        projectionLosses: match.fixture.projectionLosses.length,
        projectionLossDetails: nativeProjectionLossDetailsForFixture(match.fixture),
      },
    }
  } catch (error) {
    return {
      status: {
        status: "unverified",
        source,
        product: input.product,
        taskID: input.taskID,
        message: error instanceof Error ? error.message : String(error),
        artifactPath: displayPath(input.cwd, artifactPath),
      },
    }
  }
}

function loadExternalCaptureFlowEvidence(input: {
  cwd: string
  product: HarnessProduct
  taskID: string
  artifactPath?: string
}): LoadedNativeFlowEvidence {
  const source = "external-capture" as const
  const artifactPath = externalCaptureArtifactPath(input.cwd, input.artifactPath)
  const missing = (message = "no external capture linked"): LoadedNativeFlowEvidence => ({
    status: {
      status: "missing",
      source,
      product: input.product,
      taskID: input.taskID,
      message,
      ...(artifactPath ? { artifactPath: displayPath(input.cwd, artifactPath) } : {}),
    },
  })
  if (!artifactPath || !existsSync(artifactPath)) return missing()
  try {
    const capture = JSON.parse(readFileSync(artifactPath, "utf8")) as NativeCaptureArtifact
    const verification = verifyNativeCaptureArtifact(capture)
    if (!verification.ok) {
      return {
        status: {
          status: "unverified",
          source,
          product: input.product,
          taskID: input.taskID,
          message: "external capture failed verification",
          artifactPath: displayPath(input.cwd, artifactPath),
          verifierIssues: verification.issues.slice(0, 6).map((issue) => `${issue.id}: ${issue.message}`),
        },
      }
    }
    if (capture.captureMode === "capture-only" || capture.captureMode === "dry-run") {
      return {
        status: {
          status: "unverified",
          source,
          product: input.product,
          taskID: input.taskID,
          message: `external capture mode ${capture.captureMode} cannot serve as Flow Observer native evidence`,
          artifactPath: displayPath(input.cwd, artifactPath),
        },
      }
    }
    const captureProduct = externalCaptureHarnessProduct(capture.product)
    if (captureProduct !== input.product) {
      return {
        status: {
          status: "unverified",
          source,
          product: input.product,
          taskID: input.taskID,
          message: `external capture product is ${captureProduct}; expected ${input.product}`,
          artifactPath: displayPath(input.cwd, artifactPath),
        },
      }
    }
    if (capture.taskID !== input.taskID) {
      return {
        status: {
          status: "unverified",
          source,
          product: input.product,
          taskID: input.taskID,
          message: `external capture task is ${capture.taskID}; expected ${input.taskID}`,
          artifactPath: displayPath(input.cwd, artifactPath),
        },
      }
    }
    const fixtureSet = nativeCadenceFixtureSetFromExternalCapture(capture, { generatedAt: capture.generatedAt })
    const fixtureVerification = verifyProductTaskNativeCadenceFixtureSet(fixtureSet)
    if (!fixtureVerification.ok) {
      return {
        status: {
          status: "unverified",
          source,
          product: input.product,
          taskID: input.taskID,
          message: "external capture could not be projected to verified native cadence evidence",
          artifactPath: displayPath(input.cwd, artifactPath),
          verifierIssues: fixtureVerification.issues.slice(0, 6).map((issue) => `${issue.id}: ${issue.message}`),
        },
      }
    }
    const fixture = fixtureSet.fixtures.find((candidate) => candidate.product === input.product && candidate.taskID === input.taskID)
    if (!fixture) return missing("external capture projection did not include the requested task")
    const projectionLossDetails = nativeProjectionLossDetailsForFixture(fixture)
    const sourceSha256 = capture.sourceArtifact.hash.startsWith("sha256:") ? capture.sourceArtifact.hash.slice("sha256:".length) : undefined
    return {
      fixture,
      status: {
        status: "linked",
        source,
        product: input.product,
        taskID: input.taskID,
        message: "external capture linked",
        artifactPath: displayPath(input.cwd, artifactPath),
        ...(sourceSha256 ? { sha256: sourceSha256 } : {}),
        generatedAt: capture.generatedAt,
        nativeVersion: fixture.nativeVersion,
        cadenceLevel: fixture.cadenceSignature.level,
        providerRequests: capture.providerRequests.length,
        messagePartTypes: fixture.messageParts,
        projectionLosses: projectionLossDetails.length,
        projectionLossDetails,
        sourceTool: capture.sourceTool,
        sourceToolVersion: capture.sourceToolVersion,
        captureMode: capture.captureMode,
        sourceArtifact: capture.sourceArtifact,
        lossiness: capture.lossiness,
      },
    }
  } catch (error) {
    return {
      status: {
        status: "unverified",
        source,
        product: input.product,
        taskID: input.taskID,
        message: error instanceof Error ? error.message : String(error),
        artifactPath: displayPath(input.cwd, artifactPath),
      },
    }
  }
}

function loadTaskParityFlowEvidence(input: {
  product: HarnessProduct
  taskID: string
  reports: ProductTaskParityReport[]
}): LoadedNativeFlowEvidence {
  const report =
    input.reports.find((item) => item.product === input.product && item.taskID === input.taskID && item.mode === "original") ??
    input.reports.find((item) => item.product === input.product && item.taskID === input.taskID)
  if (!report) {
    return {
      status: {
        status: "missing",
        source: "task-parity-report",
        product: input.product,
        taskID: input.taskID,
        message: "no task parity report linked",
      },
    }
  }
  const messagePartTypes = [...new Set(report.cadenceEvidence.assistantTurns.flatMap((turn) => turn.partTypes))]
  return {
    report,
    status: {
      status: "linked",
      source: "task-parity-report",
      product: report.product,
      taskID: report.taskID,
      message: "task parity report linked",
      providerRequests: report.providerEvidence.requests,
      messagePartTypes,
      projectionLosses: report.gaps.length,
      reportMode: report.mode,
      reportStatus: report.status,
      runnerID: report.runner.id,
    },
  }
}

function nativeCadenceFixtureArtifactPath(cwd: string, requested?: string): string | undefined {
  if (requested) return isAbsolute(requested) ? requested : resolve(cwd, requested)
  const defaultPath = resolve(cwd, "docs/reports/task-parity-native-cadence-fixtures/manifest.json")
  return existsSync(defaultPath) ? defaultPath : undefined
}

function externalCaptureArtifactPath(cwd: string, requested?: string): string | undefined {
  if (requested) return isAbsolute(requested) ? requested : resolve(cwd, requested)
  const defaultPath = resolve(cwd, "docs/reports/external-tools/claude-tap/pi-read-only/native-capture.json")
  return existsSync(defaultPath) ? defaultPath : undefined
}

function readNativeCadenceFixtureArtifact(artifactPath: string): ProductTaskNativeCadenceFixtureSet | ProductTaskNativeCadenceFixtureSplitSet {
  const raw = JSON.parse(readFileSync(artifactPath, "utf8")) as unknown
  const record = objectRecord(raw)
  if (record.schemaVersion === 1 && Array.isArray(record.fixtures)) return raw as ProductTaskNativeCadenceFixtureSet
  if (record.summary && record.manifest && Array.isArray(record.attachments)) return raw as ProductTaskNativeCadenceFixtureSplitSet
  if (record.schemaVersion === 2 && record.artifactKind === "native-cadence-fixture-summary") {
    return readProductTaskNativeCadenceFixtureSplitSet(artifactPath)
  }
  if (record.schemaVersion === 2 && record.artifactKind === "task-parity-manifest") {
    const summaryPath = resolve(dirname(artifactPath), stringValue(record.summaryPath) ?? "summary.json")
    return readProductTaskNativeCadenceFixtureSplitSet(summaryPath)
  }
  throw new Error(`Expected native cadence fixture artifact at ${artifactPath}`)
}

function nativeCadenceFixtureEntries(
  artifact: ProductTaskNativeCadenceFixtureSet | ProductTaskNativeCadenceFixtureSplitSet,
): Array<{ fixture: ProductTaskNativeCadenceFixture; attachment?: TaskParityAttachmentRef }> {
  if ("fixtures" in artifact) return artifact.fixtures.map((fixture) => ({ fixture }))
  return artifact.attachments.map((attachment) => ({ fixture: attachment.content, attachment: attachment.ref }))
}

function nativeCadenceFixtureGeneratedAt(artifact: ProductTaskNativeCadenceFixtureSet | ProductTaskNativeCadenceFixtureSplitSet): string {
  return "fixtures" in artifact ? artifact.generatedAt : artifact.summary.generatedAt
}

function attachNativeEvidenceToGraph(graph: HarnessFlowGraph, evidence: LoadedNativeFlowEvidence): HarnessFlowGraph & { nativeEvidence: NativeFlowEvidenceStatus } {
  if (evidence.status.status === "linked") {
    graph.evidence = graph.evidence.map((item) => {
      if (item.kind !== "native-cadence") return item
      return {
        ...item,
        refs: [...new Set([...item.refs, evidence.status.artifactPath, evidence.status.attachmentPath].filter(Boolean) as string[])],
        metadata: {
          ...item.metadata,
          artifactPath: evidence.status.attachmentPath ?? evidence.status.artifactPath,
          artifactHash: evidence.status.sha256,
          generatedAt: evidence.status.generatedAt,
          source: evidence.status.source,
          captureMode: evidence.status.captureMode ?? "native-cadence-fixture",
          sourceTool: evidence.status.sourceTool,
          sourceToolVersion: evidence.status.sourceToolVersion,
          sourceArtifact: evidence.status.sourceArtifact,
          lossiness: evidence.status.lossiness,
          packageSpec: evidence.status.nativeVersion,
          projectionLossDetails: evidence.status.projectionLossDetails,
        },
      }
    })
  }
  return Object.assign(graph, { nativeEvidence: evidence.status })
}

function displayPath(cwd: string, path: string): string {
  const relativePath = relative(cwd, path)
  return relativePath && !relativePath.startsWith("..") && !isAbsolute(relativePath) ? relativePath : path
}

async function handleHarnessTuiSessionAPI(context: RequestContext, pathname: string): Promise<void> {
  const { request, response, tuiSessions } = context
  try {
    if (request.method === "GET" && pathname === "/api/harness-tui-sessions") {
      sendProfileJSON(response, 200, { sessions: tuiSessions.list() })
      return
    }
    if (request.method === "POST" && pathname === "/api/harness-tui-sessions") {
      const body = await readJSONBody(request, 2_000_000)
      const record = objectRecord(body)
      const source = parseHarnessTuiSource(stringValue(record.source))
      const providerMode = parseHarnessTuiProviderMode(stringValue(record.providerMode) ?? stringValue(record.provider))
      const profileName = stringValue(record.profileName) ?? stringValue(record.profile)
      const cwd = stringValue(record.cwd) ?? stringValue(record.workspaceDir)
      const storageDir = stringValue(record.storageDir)
      sendProfileJSON(
        response,
        201,
        tuiSessions.create({
          ...(source ? { source } : {}),
          ...(record.recipe ? { recipe: record.recipe } : {}),
          ...(profileName ? { profileName } : {}),
          ...(providerMode ? { providerMode } : {}),
          ...(cwd ? { cwd } : {}),
          ...(storageDir ? { storageDir } : {}),
          cols: clampInteger(record.cols, 20, 240, 100),
          rows: clampInteger(record.rows, 8, 80, 28),
        }),
      )
      return
    }
    const route = harnessTuiSessionRoute(pathname)
    if (!route) {
      sendJSON(response, 404, { error: "Not found." })
      return
    }
    const { sessionID, suffix } = route
    if (request.method === "GET" && suffix === "") {
      const session = tuiSessions.get(sessionID)
      if (!session) sendJSON(response, 404, { error: `TUI session ${sessionID} not found.` })
      else sendProfileJSON(response, 200, session)
      return
    }
    if (request.method === "GET" && suffix === "logs") {
      sendProfileJSON(response, 200, tuiSessions.logs(sessionID))
      return
    }
    if (request.method === "POST" && suffix === "input") {
      const body = await readJSONBody(request, 200_000)
      const record = objectRecord(body)
      const data = typeof record.data === "string" ? record.data : typeof record.input === "string" ? record.input : typeof body === "string" ? body : ""
      sendProfileJSON(response, 200, tuiSessions.input(sessionID, data))
      return
    }
    if (request.method === "POST" && suffix === "interrupt") {
      sendProfileJSON(response, 200, tuiSessions.interrupt(sessionID))
      return
    }
    if (request.method === "POST" && suffix === "resize") {
      const body = objectRecord(await readJSONBody(request, 64_000))
      sendProfileJSON(response, 200, tuiSessions.resize(sessionID, Number(body.cols), Number(body.rows)))
      return
    }
    if (request.method === "POST" && suffix === "restart") {
      sendProfileJSON(response, 200, tuiSessions.restart(sessionID))
      return
    }
    if (request.method === "DELETE" && suffix === "") {
      sendProfileJSON(response, 200, tuiSessions.stop(sessionID))
      return
    }
    sendJSON(response, 405, { error: "Method not allowed." })
  } catch (error) {
    sendProfileJSON(response, 400, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

async function handleInstalledHarnessAPI(context: RequestContext, pathname: string): Promise<void> {
  const { request, response, profileStore } = context
  try {
    if (request.method === "GET" && pathname === "/api/harnesses") {
      sendProfileJSON(response, 200, { rootDir: profileStore.rootDir, profiles: profileStore.list() })
      return
    }
    if (request.method === "POST" && pathname === "/api/harnesses") {
      const body = await readJSONBody(request, 2_000_000)
      const record = objectRecord(body)
      const name = stringValue(record.name)
      const recipe = record.recipe
      if (!name) throw new Error("Harness install body must include name.")
      if (!recipe || typeof recipe !== "object" || Array.isArray(recipe)) throw new Error("Harness install body must include recipe.")
      const installed = profileStore.install({
        name,
        recipe: parseRecipe(recipe),
        ...(stringValue(record.workspaceDir) ? { workspaceDir: stringValue(record.workspaceDir)! } : {}),
        ...(stringValue(record.storageDir) ? { storageDir: stringValue(record.storageDir)! } : {}),
      })
      sendProfileJSON(response, 201, profileStore.status(installed.profile.name))
      return
    }
    const route = installedHarnessRoute(pathname)
    if (!route) {
      sendJSON(response, 404, { error: "Not found." })
      return
    }
    const { name, suffix } = route
    if (request.method === "GET" && suffix === "status") {
      sendProfileJSON(response, 200, profileStore.status(name))
      return
    }
    if (request.method === "PUT" && suffix === "provider") {
      const body = objectRecord(await readJSONBody(request))
      const provider = stringValue(body.provider) ?? stringValue(body.kind)
      if (!provider) throw new Error("Provider body must include provider.")
      const modelID = stringValue(body.model) ?? stringValue(body.modelID)
      const baseURL = stringValue(body.baseURL)
      const appURL = stringValue(body.appURL)
      const appName = stringValue(body.appName)
      const apiKeyEnv = stringValue(body.apiKeyEnv)
      sendProfileJSON(
        response,
        200,
        profileStore.configureProvider({
          name,
          kind: parseInstalledProvider(provider),
          ...(modelID ? { modelID } : {}),
          ...(baseURL ? { baseURL } : {}),
          ...(appURL ? { appURL } : {}),
          ...(appName ? { appName } : {}),
          ...(apiKeyEnv ? { apiKeyEnv } : {}),
        }),
      )
      return
    }
    if (request.method === "POST" && suffix === "channels/telegram") {
      const body = objectRecord(await readJSONBody(request))
      const mode = parseOptionalTelegramMode(stringValue(body.mode))
      const botTokenEnv = stringValue(body.botTokenEnv)
      const webhookURL = stringValue(body.webhookURL)
      const webhookSecretEnv = stringValue(body.webhookSecretEnv)
      const allowedChatIDs = stringArray(body.allowedChatIDs ?? body.allowedChats)
      const allowedUserIDs = stringArray(body.allowedUserIDs ?? body.allowedUsers)
      sendProfileJSON(
        response,
        200,
        profileStore.addTelegramChannel({
          name,
          ...(mode ? { mode } : {}),
          ...(botTokenEnv ? { botTokenEnv } : {}),
          ...(allowedChatIDs.length ? { allowedChatIDs } : {}),
          ...(allowedUserIDs.length ? { allowedUserIDs } : {}),
          ...(webhookURL ? { webhookURL } : {}),
          ...(webhookSecretEnv ? { webhookSecretEnv } : {}),
        }),
      )
      return
    }
    const controller = new HarnessGatewayController({ store: profileStore, cwd: context.cwd, env: context.env })
    if (request.method === "POST" && suffix === "gateway/start") {
      sendProfileJSON(response, 200, controller.start({ name, channel: "telegram" }))
      return
    }
    if (request.method === "POST" && suffix === "gateway/restart") {
      sendProfileJSON(response, 200, controller.restart({ name, channel: "telegram" }))
      return
    }
    if (request.method === "POST" && suffix === "gateway/stop") {
      sendProfileJSON(response, 200, controller.stop({ name, channel: "telegram" }))
      return
    }
    if (request.method === "GET" && suffix === "gateway/manifests") {
      sendProfileJSON(response, 200, controller.serviceManifests({ name, channel: "telegram" }))
      return
    }
    if (request.method === "GET" && suffix === "gateway/logs") {
      sendProfileJSON(response, 200, profileStore.gatewayLogs(name))
      return
    }
    if (request.method === "POST" && suffix === "gateway/smoke") {
      const body = objectRecord(await readJSONBody(request))
      const chatID = stringValue(body.chatID)
      const senderID = stringValue(body.senderID)
      sendProfileJSON(
        response,
        200,
        await controller.liveTelegramSmoke({
          name,
          text: stringValue(body.text) ?? "hello",
          ...(chatID ? { chatID } : {}),
          ...(senderID ? { senderID } : {}),
        }),
      )
      return
    }
    if (request.method === "POST" && suffix === "gateway/smoke-local") {
      const body = objectRecord(await readJSONBody(request))
      const chatID = stringValue(body.chatID)
      const senderID = stringValue(body.senderID)
      sendProfileJSON(
        response,
        200,
        await controller.localFixtureSmoke({
          name,
          text: stringValue(body.text) ?? "hello",
          ...(chatID ? { chatID } : {}),
          ...(senderID ? { senderID } : {}),
        }),
      )
      return
    }
    if (request.method === "POST" && suffix === "channels/telegram/webhook") {
      const body = await readJSONBody(request, 2_000_000)
      const secretToken = headerValue(request, "x-telegram-bot-api-secret-token")
      sendProfileJSON(response, 200, await controller.handleTelegramWebhook({ name, update: body, ...(secretToken ? { secretToken } : {}) }))
      return
    }
    sendJSON(response, 405, { error: "Method not allowed." })
  } catch (error) {
    sendProfileJSON(response, 400, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

async function handleHarnessRun(context: RequestContext): Promise<void> {
  const { request, response, cwd } = context
  const body = await readJSONBody(request, 2_000_000)
  const record = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
  const apiKey = stringValue(record.apiKey)
  const serverApiKey = resolveLiveProviderConfig({}).apiKey
  try {
    const recipe = record.recipe
    if (!recipe || typeof recipe !== "object" || Array.isArray(recipe)) throw new Error("Harness run body must include a recipe JSON object.")
    const envDefaults = resolveLiveProviderConfig({})
    const provider = parseLiveRunProvider(stringValue(record.provider) ?? envDefaults.provider ?? "openai-compatible")
    const modelID = stringValue(record.model) ?? stringValue(record.modelID) ?? envDefaults.modelID
    if (!modelID) throw new Error("Model is required for live harness runs.")
    const resolvedApiKey = apiKey ?? envDefaults.apiKey
    if (!resolvedApiKey) throw new Error("API key is required for live harness runs.")
    const baseURL = validateLiveBaseURL(stringValue(record.baseURL) ?? stringValue(record.base_url) ?? envDefaults.baseURL)
    const prompt = limitText(stringValue(record.prompt) ?? "Say hello from this Helix harness.", 8_000, "Prompt")
    const maxSteps = clampInteger(record.maxSteps, 1, 5, 2)
    const appURL = stringValue(record.appURL)
    const appName = stringValue(record.appName)
    const compiled = compileRecipe(recipe as RunnableRecipe)
    const harness = assembleRecipeHarness(recipe as RunnableRecipe, { cwd })
    const liveProvider = createLiveProvider(provider, {
      provider,
      modelID,
      apiKey: resolvedApiKey,
      missing: [] as string[],
      ...(baseURL ? { baseURL } : {}),
      ...(appURL ? { appURL } : {}),
      ...(appName ? { appName } : {}),
    })
    const result = await harness.runTurn({
      text: prompt,
      provider: liveProvider,
      maxSteps,
      maxRetries: 0,
      syntheticContinue: false,
    })
    sendJSON(response, 200, {
      ok: !result.error,
      runID: `run-${randomUUID()}`,
      provider: {
        kind: provider,
        modelID,
        ...(baseURL ? { baseURL } : {}),
      },
      recipe: {
        id: compiled.id,
        version: compiled.version,
        product: harness.product,
        modules: compiled.modules.length,
        bindings: compiled.bindings.length,
        graph: harness.graph.slice(0, 80),
      },
      session: result.session,
      steps: result.steps,
      retries: result.retries,
      syntheticContinues: result.syntheticContinues,
      finish: result.finish,
      error: result.error,
      blockedTools: result.blockedTools,
      assistantText: result.assistantMessage.parts.map(partToText).filter(Boolean).join("\n"),
      assistantParts: result.assistantMessage.parts,
      transcript: result.transcript.map(summarizeMessage),
    })
  } catch (error) {
    sendJSON(response, 400, {
      ok: false,
      error: redactSecret(redactSecret(error instanceof Error ? error.message : String(error), apiKey), serverApiKey),
    })
  }
}

function parseLiveRunProvider(value: string): LiveProviderKind {
  if (value === "openai-compatible" || value === "openrouter" || value === "anthropic" || value === "google") return value
  throw new Error(`Unsupported live provider: ${value}.`)
}

function parseFlowAssemblyProduct(value: string): HarnessProduct | "minimal" {
  if (value === "minimal" || value === "coding-agent.minimal") return "minimal"
  return parseFlowHarnessProduct(value)
}

function parseFlowHarnessProduct(value: string): HarnessProduct {
  if (value === "opencode" || value === "pi-mono" || value === "nanobot" || value === "hermes-agent") return value
  if (value === "pi") return "pi-mono"
  if (value === "hermes") return "hermes-agent"
  throw new Error(`Expected product to be opencode, pi-mono, nanobot, hermes-agent, or minimal; received ${value}.`)
}

function validateLiveBaseURL(value: string | undefined): string | undefined {
  if (!value) return undefined
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error("Base URL must be a valid URL.")
  }
  if (parsed.protocol !== "https:") throw new Error("Base URL must use https:// for public live runs.")
  const host = parsed.hostname.toLowerCase()
  if (isPrivateHost(host)) throw new Error("Base URL cannot target localhost or private network hosts.")
  return parsed.toString().replace(/\/$/, "")
}

function isPrivateHost(host: string): boolean {
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) return true
  const octets = host.split(".").map((part) => Number(part))
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false
  const first = octets[0] ?? 0
  const second = octets[1] ?? 0
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  )
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean)
  return []
}

function headerValue(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name.toLowerCase()]
  if (Array.isArray(value)) return value[0]
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined
}

function installedHarnessRoute(pathname: string): { name: string; suffix: string } | undefined {
  const prefix = "/api/harnesses/"
  if (!pathname.startsWith(prefix)) return undefined
  const rest = pathname.slice(prefix.length)
  const slash = rest.indexOf("/")
  if (slash <= 0) return undefined
  return {
    name: decodeURIComponent(rest.slice(0, slash)),
    suffix: rest.slice(slash + 1),
  }
}

function harnessTuiSessionRoute(pathname: string): { sessionID: string; suffix: string } | undefined {
  const prefix = "/api/harness-tui-sessions/"
  if (!pathname.startsWith(prefix)) return undefined
  const rest = pathname.slice(prefix.length)
  if (!rest) return undefined
  const slash = rest.indexOf("/")
  if (slash < 0) return { sessionID: decodeURIComponent(rest), suffix: "" }
  return {
    sessionID: decodeURIComponent(rest.slice(0, slash)),
    suffix: rest.slice(slash + 1),
  }
}

function harnessTuiSocketSessionID(pathname: string): string | undefined {
  const route = harnessTuiSessionRoute(pathname)
  return route?.suffix === "socket" ? route.sessionID : undefined
}

function parseHarnessTuiSource(value: string | undefined): HarnessTuiSessionSource | undefined {
  if (!value) return undefined
  if (value === "draft-recipe" || value === "installed-profile") return value
  throw new Error(`Unsupported TUI session source: ${value}.`)
}

function parseHarnessTuiProviderMode(value: string | undefined): HarnessTuiProviderMode | undefined {
  if (!value) return undefined
  if (value === "profile-live") return value
  throw new Error(`Unsupported TUI provider mode: ${value}.`)
}

function parseInstalledProvider(value: string): LiveProviderKind {
  if (value === "fake") throw new Error("Fake provider profiles are no longer supported. Configure a real provider/model/API key.")
  return parseLiveRunProvider(value)
}

function parseOptionalTelegramMode(value: string | undefined): "polling" | "webhook" | undefined {
  if (!value) return undefined
  if (value === "fake") throw new Error("Telegram gateway mode fake is no longer supported. Configure polling or webhook with a real bot token.")
  if (value === "polling" || value === "webhook") return value
  throw new Error(`Unsupported Telegram gateway mode: ${value}.`)
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN
  if (!Number.isInteger(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

function limitText(value: string, maxLength: number, label: string): string {
  if (value.length > maxLength) throw new Error(`${label} must be ${maxLength} characters or fewer.`)
  return value
}

function summarizeMessage(message: HarnessTurnResult["transcript"][number]): { role: string; text: string; parts: unknown[] } {
  return {
    role: message.role,
    text: message.parts.map(partToText).filter(Boolean).join("\n"),
    parts: message.parts,
  }
}

function partToText(part: unknown): string {
  if (!part || typeof part !== "object") return ""
  const record = part as Record<string, unknown>
  if ((record.type === "text" || record.type === "reasoning") && typeof record.text === "string") return record.text
  if (record.type === "tool_call") return `[tool:${String(record.toolName ?? "unknown")}] ${JSON.stringify(record.input ?? {})}`
  if (record.type === "tool_result" && Array.isArray(record.content)) return record.content.map(partToText).filter(Boolean).join("\n")
  if (record.type === "compaction" && typeof record.summary === "string") return record.summary
  if (record.type === "custom" && typeof record.display === "string") return record.display
  return ""
}

function redactSecret(message: string, secret: string | undefined): string {
  void secret
  return message
}

function createDocsDataCache(cwd: string): { get: () => ReturnType<typeof buildDocsSite> } {
  let cachedAt = 0
  let cachedData: ReturnType<typeof buildDocsSite> | undefined
  return {
    get() {
      const now = Date.now()
      if (!cachedData || now - cachedAt > 1000) {
        cachedData = buildDocsSite({ cwd })
        cachedAt = now
      }
      return cachedData
    },
  }
}

function createHarnessBuilderDataCache(getData: () => ReturnType<typeof buildDocsSite>): {
  source: () => ReturnType<typeof buildDocsSite>
  get: () => HarnessBuilderData
  payload: () => { json: string; gzip: Buffer }
} {
  let cachedSource: ReturnType<typeof buildDocsSite> | undefined
  let cachedData: HarnessBuilderData | undefined
  let cachedPayload: { json: string; gzip: Buffer } | undefined
  const source = (): ReturnType<typeof buildDocsSite> => {
    cachedSource ??= getData()
    return cachedSource
  }
  return {
    source,
    get() {
      cachedData ??= buildHarnessBuilderData(source())
      return cachedData
    },
    payload() {
      if (!cachedPayload) {
        const json = JSON.stringify(cachedData ??= buildHarnessBuilderData(source()))
        cachedPayload = { json, gzip: gzipSync(json) }
      }
      return cachedPayload
    },
  }
}

function defaultBaseURL(provider: LiveProviderKind | undefined): string {
  if (provider === "anthropic") return "https://api.anthropic.com"
  if (provider === "google") return "https://generativelanguage.googleapis.com"
  if (provider === "openrouter") return "https://openrouter.ai/api/v1"
  return "https://api.openai.com/v1"
}

function loadServerDotEnv(cwd: string): void {
  const path = resolve(cwd, ".env")
  if (!existsSync(path)) return
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const parsed = parseDotEnvLine(line)
    if (!parsed || process.env[parsed.key] !== undefined) continue
    process.env[parsed.key] = parsed.value
  }
}

function parseDotEnvLine(line: string): { key: string; value: string } | undefined {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) return undefined
  const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(trimmed)
  if (!match?.[1]) return undefined
  let value = match[2] ?? ""
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }
  return { key: match[1], value }
}

function sendHTML(request: IncomingMessage, response: ServerResponse, html: string): void {
  const acceptsGzip = String(request.headers["accept-encoding"] ?? "").includes("gzip")
  const body = acceptsGzip ? gzipSync(html) : Buffer.from(html)
  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "content-length": body.length,
    ...(acceptsGzip ? { "content-encoding": "gzip", vary: "Accept-Encoding" } : {}),
  })
  response.end(body)
}

function sendBuilderData(
  request: IncomingMessage,
  response: ServerResponse,
  payload: { json: string; gzip: Buffer },
): void {
  const acceptsGzip = String(request.headers["accept-encoding"] ?? "").includes("gzip")
  const body = acceptsGzip ? payload.gzip : Buffer.from(payload.json)
  response.writeHead(200, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "private, max-age=60",
    "content-length": body.length,
    ...(acceptsGzip ? { "content-encoding": "gzip", vary: "Accept-Encoding" } : {}),
  })
  response.end(body)
}

function sendJSON(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  })
  response.end(JSON.stringify(value))
}

function sendProfileJSON(response: ServerResponse, status: number, value: unknown): void {
  sendJSON(response, status, redactProfileSecrets(value, process.env))
}

function serveStaticFile(response: ServerResponse, siteDir: string, pathname: string): void {
  const decodedPathname = safeDecodeURIComponent(pathname)
  if (!decodedPathname) {
    sendJSON(response, 400, { error: "Bad path." })
    return
  }
  const filePath = resolve(siteDir, `.${decodedPathname}`)
  const relativePath = relative(siteDir, filePath)
  if (relativePath.startsWith("..") || isAbsolute(relativePath) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    sendJSON(response, 404, { error: "Not found." })
    return
  }
  response.writeHead(200, {
    "content-type": contentType(filePath),
    "cache-control": "no-store",
  })
  createReadStream(filePath).pipe(response)
}

function serveVendorXterm(response: ServerResponse, cwd: string, pathname: string): void {
  const filePath = resolve(cwd, pathname === "/vendor/xterm/xterm.css" ? "node_modules/@xterm/xterm/css/xterm.css" : "node_modules/@xterm/xterm/lib/xterm.js")
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    sendJSON(response, 404, { error: "xterm asset not found." })
    return
  }
  response.writeHead(200, {
    "content-type": pathname.endsWith(".css") ? "text/css; charset=utf-8" : "text/javascript; charset=utf-8",
    "cache-control": "no-store",
  })
  createReadStream(filePath).pipe(response)
}

function contentType(path: string): string {
  switch (extname(path)) {
    case ".html":
      return "text/html; charset=utf-8"
    case ".json":
      return "application/json; charset=utf-8"
    case ".js":
      return "text/javascript; charset=utf-8"
    case ".css":
      return "text/css; charset=utf-8"
    case ".svg":
      return "image/svg+xml"
    default:
      return "application/octet-stream"
  }
}

function readJSONBody(request: IncomingMessage, maxBytes = 1_000_000): Promise<unknown> {
  return new Promise((resolveBody, rejectBody) => {
    let body = ""
    let settled = false
    request.setEncoding("utf8")
    request.on("data", (chunk: string) => {
      if (settled) return
      body += chunk
      if (body.length > maxBytes) {
        settled = true
        rejectBody(new Error("Request body too large."))
        request.destroy()
      }
    })
    request.on("end", () => {
      if (settled) return
      try {
        resolveBody(body.length ? JSON.parse(body) : {})
      } catch (error) {
        rejectBody(error)
      }
    })
    request.on("error", rejectBody)
  })
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

function numberFromEnv(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseServerArgs(argv: string[]): DocsServerOptions {
  const options: DocsServerOptions = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = argv[index + 1]
    if (arg === "--host" && next) {
      options.host = next
      index += 1
    } else if (arg === "--port" && next) {
      options.port = Number(next)
      index += 1
    } else if (arg === "--cwd" && next) {
      options.cwd = resolve(next)
      index += 1
    }
  }
  return options
}

const scriptPath = process.argv[1]
if (scriptPath && import.meta.url === pathToFileURL(scriptPath).href) {
  startDocsServer(parseServerArgs(process.argv.slice(2)))
    .then((running) => {
      process.stdout.write(`Helix docs server listening on ${running.url}\n`)
      process.stdout.write(`Builder: ${running.url}/harness-builder.html\n`)
    })
    .catch((error: unknown) => {
      process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`)
      process.exitCode = 1
    })
}
