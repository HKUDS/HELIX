import { createHash } from "node:crypto"
import {
  openCodeProductShellNativeExactEvidenceRef,
  openCodeProductShellNativeExactFixtureID,
  openCodeProductShellNativeExactReplayRef,
} from "@helix/adapters-opencode/product-schema/product-shell"

export type ProductShellTranscriptGateProduct = "opencode" | "pi-mono" | "nanobot" | "hermes-agent"
export type ProductShellTranscriptGateDimension =
  | "command-route"
  | "error-path"
  | "pty-api-transcript"
  | "session-readback"
  | "surface-state"
export type ProductShellTranscriptGateRisk =
  | "source-anchored-partial"
  | "preview-shell-only"
  | "common-shell-only"
  | "borrowed-opencode"

export interface ProductShellTranscriptGateCase {
  product: ProductShellTranscriptGateProduct
  sourceMatrixID: "opencode" | "pi" | "nanobot" | "hermes"
  evidenceRef: "conformance:product-shell-transcript-gate"
  fixtureID: string
  commandRoute: string[]
  errorPath: string[]
  ptyApiTranscript: string[]
  sessionReadback: string[]
  surfaceState: string[]
  previewDemotion: string[]
  sourceAnchors: string[]
  productShellAtomIDs: string[]
  surfaceServiceIDs: string[]
  fixtureIDs: string[]
  transcriptRisk: ProductShellTranscriptGateRisk
  knownLossiness: string[]
}

export interface ProductShellTranscriptGateSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:product-shell-transcript-gate"
  fixtureID: "product-shell:cli-api-pty-transcript-gate"
  products: ProductShellTranscriptGateProduct[]
  comparisonDimensions: ProductShellTranscriptGateDimension[]
  cases: ProductShellTranscriptGateCase[]
  fingerprint: string
}

export interface ProductShellTranscriptGateIssue {
  id: string
  product: ProductShellTranscriptGateProduct
  dimension: ProductShellTranscriptGateDimension
  message: string
}

export interface ProductShellTranscriptGateVerification {
  ok: boolean
  issues: ProductShellTranscriptGateIssue[]
}

export type ProductShellTranscriptExactDiffBlockerProduct = ProductShellTranscriptGateProduct
export type ProductShellTranscriptExactDiffBlockerDimension = ProductShellTranscriptGateDimension

export interface ProductShellTranscriptExactDiffBlockerCase {
  product: ProductShellTranscriptExactDiffBlockerProduct
  sourceMatrixID: "opencode" | "pi" | "nanobot" | "hermes"
  evidenceRef: "conformance:product-shell-transcript-exact-diff-blocker-gate"
  fixtureID: string
  exactDiffStatus: "exact-diff-partial" | "native-exact"
  coverageStatus: "partial" | "native"
  nativeParityClaim: boolean
  commandRoute: string[]
  errorPath: string[]
  ptyApiTranscript: string[]
  sessionReadback: string[]
  surfaceState: string[]
  previewDemotion: string[]
  sourceAnchors: string[]
  productShellAtomIDs: string[]
  surfaceServiceIDs: string[]
  fixtureIDs: string[]
  nativeEvidenceRefs: string[]
  exactDiffRisk: "semantic-fixture-needs-exact-diff" | "native-exact" | "preview-shell-only" | "common-shell-only" | "borrowed-opencode"
  knownLossiness: string[]
}

export interface ProductShellTranscriptExactDiffBlockerSnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:product-shell-transcript-exact-diff-blocker-gate"
  fixtureID: "product-shell:cli-api-pty-transcript-exact-diff-blocker-gate"
  exactDiffStatus: "exact-diff-partial"
  products: ProductShellTranscriptExactDiffBlockerProduct[]
  comparisonDimensions: ProductShellTranscriptExactDiffBlockerDimension[]
  cases: ProductShellTranscriptExactDiffBlockerCase[]
  fingerprint: string
}

export interface ProductShellTranscriptExactDiffBlockerIssue {
  id: string
  product: ProductShellTranscriptExactDiffBlockerProduct
  dimension: ProductShellTranscriptExactDiffBlockerDimension
  message: string
}

export interface ProductShellTranscriptExactDiffBlockerVerification {
  ok: boolean
  issues: ProductShellTranscriptExactDiffBlockerIssue[]
}

export type ProductShellTranscriptPinnedReplayProduct = ProductShellTranscriptGateProduct
export type ProductShellTranscriptPinnedReplayDimension = ProductShellTranscriptGateDimension

export interface ProductShellTranscriptPinnedReplayRecord {
  recordID: string
  surfaceServiceID: string
  commandRoute: string
  input: string
  stdout: string | null
  stderr: string | null
  statusCode: number
  errorMessage: string | null
  sessionID: string
  transcriptText: string
  readbackText: string
  surfaceState: Record<string, string>
  sequence: number
}

export interface ProductShellTranscriptPinnedReplayCase {
  product: ProductShellTranscriptPinnedReplayProduct
  sourceMatrixID: "opencode" | "pi" | "nanobot" | "hermes"
  evidenceRef: "conformance:product-shell-transcript-pinned-replay-gate"
  fixtureID: string
  exactDiffStatus: "exact-diff-partial" | "native-exact"
  coverageStatus: "partial" | "native"
  nativeParityClaim: boolean
  upstreamTranscript: ProductShellTranscriptPinnedReplayRecord[]
  productTranscript: ProductShellTranscriptPinnedReplayRecord[]
  assembledTranscript: ProductShellTranscriptPinnedReplayRecord[]
  sourceAnchors: string[]
  fixtureIDs: string[]
  nativeEvidenceRefs: string[]
  exactDiffRisk: "pinned-transcript-needs-live-shell" | "native-exact" | "preview-shell-only" | "common-shell-only" | "borrowed-opencode"
  knownLossiness: string[]
}

export interface ProductShellTranscriptPinnedReplaySnapshot {
  schemaVersion: 1
  evidenceRef: "conformance:product-shell-transcript-pinned-replay-gate"
  fixtureID: "product-shell:cli-api-pty-transcript-pinned-replay-gate"
  exactDiffStatus: "exact-diff-partial"
  products: ProductShellTranscriptPinnedReplayProduct[]
  comparisonDimensions: ProductShellTranscriptPinnedReplayDimension[]
  cases: ProductShellTranscriptPinnedReplayCase[]
  fingerprint: string
}

export interface ProductShellTranscriptPinnedReplayIssue {
  id: string
  product: ProductShellTranscriptPinnedReplayProduct
  dimension: ProductShellTranscriptPinnedReplayDimension
  message: string
}

export interface ProductShellTranscriptPinnedReplayVerification {
  ok: boolean
  issues: ProductShellTranscriptPinnedReplayIssue[]
}

const PRODUCT_SHELL_TRANSCRIPT_DIMENSIONS: ProductShellTranscriptGateDimension[] = [
  "command-route",
  "error-path",
  "pty-api-transcript",
  "session-readback",
  "surface-state",
]

export function buildProductShellTranscriptGateSnapshot(): ProductShellTranscriptGateSnapshot {
  const cases = PRODUCT_SHELL_TRANSCRIPT_GATE_CASES.map((item) => ({
    ...item,
    commandRoute: uniqueStrings(item.commandRoute),
    errorPath: uniqueStrings(item.errorPath),
    ptyApiTranscript: uniqueStrings(item.ptyApiTranscript),
    sessionReadback: uniqueStrings(item.sessionReadback),
    surfaceState: uniqueStrings(item.surfaceState),
    previewDemotion: uniqueStrings(item.previewDemotion),
    sourceAnchors: uniqueStrings(item.sourceAnchors),
    productShellAtomIDs: uniqueStrings(item.productShellAtomIDs),
    surfaceServiceIDs: uniqueStrings(item.surfaceServiceIDs),
    fixtureIDs: uniqueStrings(item.fixtureIDs),
    knownLossiness: uniqueStrings(item.knownLossiness),
  }))
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:product-shell-transcript-gate" as const,
    fixtureID: "product-shell:cli-api-pty-transcript-gate" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: PRODUCT_SHELL_TRANSCRIPT_DIMENSIONS,
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyProductShellTranscriptGateSnapshot(
  snapshot: ProductShellTranscriptGateSnapshot,
): ProductShellTranscriptGateVerification {
  const issues: ProductShellTranscriptGateIssue[] = []
  const products: ProductShellTranscriptGateProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]

  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "product-shell-transcript.missing-product",
        product,
        dimension: "command-route",
        message: `Missing product shell transcript gate case for ${product}.`,
      })
      continue
    }
    if (!gateContains(item.commandRoute, /command|route|run|POST|RPC|ACP|gateway|CLI|server|method|dispatch|SDK/i)) {
      issues.push({
        id: "product-shell-transcript.command-route",
        product,
        dimension: "command-route",
        message: `${product} product shell gate no longer records command/API route anchors.`,
      })
    }
    if (!gateContains(item.errorPath, /error|404|reject|requires|unknown|invalid|fake|failure|guard|missing/i)) {
      issues.push({
        id: "product-shell-transcript.error-path",
        product,
        dimension: "error-path",
        message: `${product} product shell gate no longer records error-path anchors.`,
      })
    }
    if (!gateContains(item.ptyApiTranscript, /pty|tui|render|dispatch|input|submit|select|snapshot|stdout|stderr|api|server|stream|dashboard|web/i)) {
      issues.push({
        id: "product-shell-transcript.pty-api-transcript",
        product,
        dimension: "pty-api-transcript",
        message: `${product} product shell gate no longer records PTY/API transcript anchors.`,
      })
    }
    if (!gateContains(item.sessionReadback, /session|transcript|readback|getSession|assistant|persist|storage|runTurn|provider/i)) {
      issues.push({
        id: "product-shell-transcript.session-readback",
        product,
        dimension: "session-readback",
        message: `${product} product shell gate no longer records session readback anchors.`,
      })
    }
    if (!gateContains(item.surfaceState, /surface|state|snapshot|workspace|ready|theme|status|render|manifest|graph/i)) {
      issues.push({
        id: "product-shell-transcript.surface-state",
        product,
        dimension: "surface-state",
        message: `${product} product shell gate no longer records surface-state anchors.`,
      })
    }
    if (
      item.fixtureIDs.length < 3 ||
      !gateContains(item.fixtureIDs, /product-shell:source-matrix|tui-preview|inspection-dashboard-preview|transcript-gate/i)
    ) {
      issues.push({
        id: "product-shell-transcript.fixture-coverage",
        product,
        dimension: "pty-api-transcript",
        message: `${product} product shell gate no longer links source matrix and preview demotion fixtures.`,
      })
    }
    if (!gateContains(item.previewDemotion, /preview|demotion|not-native|inspection|dashboard|shared|no-native/i)) {
      issues.push({
        id: "product-shell-transcript.preview-demotion",
        product,
        dimension: "surface-state",
        message: `${product} product shell gate no longer keeps preview demotion guard context.`,
      })
    }
    if (!gateContains(item.knownLossiness, /partial|not-exact|not-replayed|no-native|not-proven|preview|lossy/i)) {
      issues.push({
        id: "product-shell-transcript.runtime-lossiness",
        product,
        dimension: "pty-api-transcript",
        message: `${product} product shell gate no longer records partial transcript lossiness.`,
      })
    }
    if (item.transcriptRisk !== "source-anchored-partial") {
      issues.push({
        id: "product-shell-transcript.common-shell-only",
        product,
        dimension: "pty-api-transcript",
        message: `${product} product shell gate is not source anchored and cannot be promoted toward native parity.`,
      })
    }
    if (product !== "opencode" && (item.sourceMatrixID === "opencode" || item.fixtureID === "opencode-product-shell:source-matrix" || item.transcriptRisk === "borrowed-opencode")) {
      issues.push({
        id: "product-shell-transcript.borrowed-source-matrix",
        product,
        dimension: "command-route",
        message: `${product} product shell gate is borrowing the OpenCode source matrix.`,
      })
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  }
}

export function buildProductShellTranscriptExactDiffBlockerSnapshot(): ProductShellTranscriptExactDiffBlockerSnapshot {
  const transcriptGate = buildProductShellTranscriptGateSnapshot()
  const cases = transcriptGate.cases.map(buildProductShellTranscriptExactDiffBlockerCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:product-shell-transcript-exact-diff-blocker-gate" as const,
    fixtureID: "product-shell:cli-api-pty-transcript-exact-diff-blocker-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: transcriptGate.comparisonDimensions as ProductShellTranscriptExactDiffBlockerDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyProductShellTranscriptExactDiffBlockerSnapshot(
  snapshot: ProductShellTranscriptExactDiffBlockerSnapshot,
): ProductShellTranscriptExactDiffBlockerVerification {
  const issues: ProductShellTranscriptExactDiffBlockerIssue[] = []
  const products: ProductShellTranscriptExactDiffBlockerProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]

  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "product-shell-transcript-exact-diff.missing-product",
        product,
        dimension: "command-route",
        message: `Missing product shell transcript exact-diff blocker case for ${product}.`,
      })
      continue
    }
    const nativeExact = product === "opencode"
    if (nativeExact) {
      if (item.exactDiffStatus !== "native-exact" || item.coverageStatus !== "native" || item.nativeParityClaim !== true) {
        issues.push({
          id: "product-shell-transcript-exact-diff.native-claim",
          product,
          dimension: "command-route",
          message: `${product} product shell blocker must remain native-exact after OpenCode native fixture promotion.`,
        })
      }
    } else if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "product-shell-transcript-exact-diff.native-claim",
        product,
        dimension: "command-route",
        message: `${product} product shell blocker must remain exact-diff-partial and cannot claim native parity.`,
      })
    }
    if (!gateContains(item.commandRoute, /command|route|run|POST|RPC|ACP|gateway|CLI|server|method|dispatch|SDK|exact-diff-not-proven/i)) {
      issues.push({
        id: "product-shell-transcript-exact-diff.command-route",
        product,
        dimension: "command-route",
        message: `${product} product shell blocker no longer records command route exact-diff anchors.`,
      })
    }
    if (!gateContains(item.errorPath, /error|404|reject|requires|unknown|invalid|fake|failure|guard|missing|status|exact-diff-not-proven/i)) {
      issues.push({
        id: "product-shell-transcript-exact-diff.error-path",
        product,
        dimension: "error-path",
        message: `${product} product shell blocker no longer records error path exact-diff anchors.`,
      })
    }
    if (!gateContains(item.ptyApiTranscript, /pty|tui|render|dispatch|input|submit|select|snapshot|stdout|stderr|api|server|stream|dashboard|web|transcript|exact-diff-not-proven/i)) {
      issues.push({
        id: "product-shell-transcript-exact-diff.pty-api-transcript",
        product,
        dimension: "pty-api-transcript",
        message: `${product} product shell blocker no longer records PTY/API transcript exact-diff anchors.`,
      })
    }
    if (!gateContains(item.sessionReadback, /session|transcript|readback|getSession|assistant|persist|storage|runTurn|provider|exact-diff-not-proven/i)) {
      issues.push({
        id: "product-shell-transcript-exact-diff.session-readback",
        product,
        dimension: "session-readback",
        message: `${product} product shell blocker no longer records session readback exact-diff anchors.`,
      })
    }
    if (!gateContains(item.surfaceState, /surface|state|snapshot|workspace|ready|theme|status|render|manifest|graph|side-effects|exact-diff-not-proven/i)) {
      issues.push({
        id: "product-shell-transcript-exact-diff.surface-state",
        product,
        dimension: "surface-state",
        message: `${product} product shell blocker no longer records surface state exact-diff anchors.`,
      })
    }
    if (nativeExact) {
      if (
        item.fixtureID !== openCodeProductShellNativeExactFixtureID ||
        item.exactDiffRisk !== "native-exact" ||
        !item.fixtureIDs.includes(openCodeProductShellNativeExactFixtureID) ||
        !item.nativeEvidenceRefs.includes(openCodeProductShellNativeExactEvidenceRef) ||
        !item.nativeEvidenceRefs.includes(openCodeProductShellNativeExactReplayRef) ||
        item.knownLossiness.length > 0 ||
        item.previewDemotion.length > 0
      ) {
        issues.push({
          id: "product-shell-transcript-exact-diff.native-exact-evidence",
          product,
          dimension: "pty-api-transcript",
          message: `${product} product shell blocker no longer exposes native-exact evidence cleanly.`,
        })
      }
    } else if (item.exactDiffRisk !== "semantic-fixture-needs-exact-diff" || item.sourceAnchors.length === 0 || !gateContains(item.knownLossiness, /not-proven|partial|not-exact|not-replayed|preview|lossy/i)) {
      issues.push({
        id: "product-shell-transcript-exact-diff.common-shell-only",
        product,
        dimension: "pty-api-transcript",
        message: `${product} product shell blocker is not anchored to product-specific partial transcript evidence.`,
      })
    }
    if (!nativeExact && (
      item.fixtureIDs.length < 3 ||
      !gateContains(item.fixtureIDs, /product-shell:source-matrix|tui-preview|inspection-dashboard-preview|transcript-gate/i) ||
      !gateContains(item.previewDemotion, /preview|demotion|not-native|inspection|dashboard|shared|no-native/i)
    )) {
      issues.push({
        id: "product-shell-transcript-exact-diff.fixture-coverage",
        product,
        dimension: "surface-state",
        message: `${product} product shell blocker no longer links source matrix and preview demotion evidence.`,
      })
    }
    if (product !== "opencode" && (item.sourceMatrixID === "opencode" || item.fixtureID === "opencode-product-shell:source-matrix" || item.exactDiffRisk === "borrowed-opencode" || gateContains(item.nativeEvidenceRefs, /^opencode-product-shell:source-matrix$/))) {
      issues.push({
        id: "product-shell-transcript-exact-diff.borrowed-source-matrix",
        product,
        dimension: "command-route",
        message: `${product} product shell blocker is borrowing the OpenCode source matrix.`,
      })
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  }
}

export function buildProductShellTranscriptPinnedReplaySnapshot(): ProductShellTranscriptPinnedReplaySnapshot {
  const transcriptGate = buildProductShellTranscriptGateSnapshot()
  const cases = transcriptGate.cases.map(buildProductShellTranscriptPinnedReplayCase)
  const snapshotWithoutFingerprint = {
    schemaVersion: 1 as const,
    evidenceRef: "conformance:product-shell-transcript-pinned-replay-gate" as const,
    fixtureID: "product-shell:cli-api-pty-transcript-pinned-replay-gate" as const,
    exactDiffStatus: "exact-diff-partial" as const,
    products: cases.map((item) => item.product),
    comparisonDimensions: transcriptGate.comparisonDimensions as ProductShellTranscriptPinnedReplayDimension[],
    cases,
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyProductShellTranscriptPinnedReplaySnapshot(
  snapshot: ProductShellTranscriptPinnedReplaySnapshot,
): ProductShellTranscriptPinnedReplayVerification {
  const issues: ProductShellTranscriptPinnedReplayIssue[] = []
  const products: ProductShellTranscriptPinnedReplayProduct[] = ["opencode", "pi-mono", "nanobot", "hermes-agent"]

  for (const product of products) {
    const item = snapshot.cases.find((candidate) => candidate.product === product)
    if (!item) {
      issues.push({
        id: "product-shell-transcript-pinned-replay.missing-product",
        product,
        dimension: "command-route",
        message: `Missing product shell transcript pinned replay case for ${product}.`,
      })
      continue
    }
    const nativeExact = product === "opencode"
    if (nativeExact) {
      if (item.exactDiffStatus !== "native-exact" || item.coverageStatus !== "native" || item.nativeParityClaim !== true) {
        issues.push({
          id: "product-shell-transcript-pinned-replay.native-claim",
          product,
          dimension: "command-route",
          message: `${product} product shell transcript pinned replay must remain native-exact after OpenCode native fixture promotion.`,
        })
      }
    } else if (item.exactDiffStatus !== "exact-diff-partial" || item.coverageStatus !== "partial" || item.nativeParityClaim !== false) {
      issues.push({
        id: "product-shell-transcript-pinned-replay.native-claim",
        product,
        dimension: "command-route",
        message: `${product} product shell transcript pinned replay must remain partial and cannot claim native parity.`,
      })
    }
    if (item.upstreamTranscript.length === 0 || item.upstreamTranscript.length !== item.productTranscript.length || item.upstreamTranscript.length !== item.assembledTranscript.length) {
      issues.push({
        id: "product-shell-transcript-pinned-replay.pty-api-transcript",
        product,
        dimension: "pty-api-transcript",
        message: `${product} product shell transcript pinned replay must compare non-empty upstream/product/assembled transcripts of equal length.`,
      })
      continue
    }
    if (
      item.upstreamTranscript.some((record) => !record.surfaceServiceID || !record.commandRoute || !record.input) ||
      !productShellPinnedCommandRouteMatches(item.upstreamTranscript, item.productTranscript) ||
      !productShellPinnedCommandRouteMatches(item.upstreamTranscript, item.assembledTranscript)
    ) {
      issues.push({
        id: "product-shell-transcript-pinned-replay.command-route",
        product,
        dimension: "command-route",
        message: `${product} product shell transcript pinned replay command route drifted.`,
      })
    }
    if (!item.upstreamTranscript.some((record) => record.statusCode >= 400 || record.errorMessage !== null || record.stderr !== null) || !productShellPinnedErrorPathMatches(item.upstreamTranscript, item.productTranscript) || !productShellPinnedErrorPathMatches(item.upstreamTranscript, item.assembledTranscript)) {
      issues.push({
        id: "product-shell-transcript-pinned-replay.error-path",
        product,
        dimension: "error-path",
        message: `${product} product shell transcript pinned replay error path drifted.`,
      })
    }
    if (!productShellPinnedTranscriptMatches(item.upstreamTranscript, item.productTranscript) || !productShellPinnedTranscriptMatches(item.upstreamTranscript, item.assembledTranscript)) {
      issues.push({
        id: "product-shell-transcript-pinned-replay.pty-api-transcript",
        product,
        dimension: "pty-api-transcript",
        message: `${product} product shell transcript pinned replay PTY/API transcript drifted.`,
      })
    }
    if (!productShellPinnedSessionReadbackMatches(item.upstreamTranscript, item.productTranscript) || !productShellPinnedSessionReadbackMatches(item.upstreamTranscript, item.assembledTranscript)) {
      issues.push({
        id: "product-shell-transcript-pinned-replay.session-readback",
        product,
        dimension: "session-readback",
        message: `${product} product shell transcript pinned replay session readback drifted.`,
      })
    }
    if (!productShellPinnedSurfaceStateMatches(item.upstreamTranscript, item.productTranscript) || !productShellPinnedSurfaceStateMatches(item.upstreamTranscript, item.assembledTranscript)) {
      issues.push({
        id: "product-shell-transcript-pinned-replay.surface-state",
        product,
        dimension: "surface-state",
        message: `${product} product shell transcript pinned replay surface state drifted.`,
      })
    }
    if (nativeExact) {
      if (
        item.fixtureID !== openCodeProductShellNativeExactFixtureID ||
        item.exactDiffRisk !== "native-exact" ||
        !item.fixtureIDs.includes(openCodeProductShellNativeExactFixtureID) ||
        !item.nativeEvidenceRefs.includes(openCodeProductShellNativeExactEvidenceRef) ||
        !item.nativeEvidenceRefs.includes(openCodeProductShellNativeExactReplayRef) ||
        item.knownLossiness.length > 0
      ) {
        issues.push({
          id: "product-shell-transcript-pinned-replay.native-exact-evidence",
          product,
          dimension: "pty-api-transcript",
          message: `${product} product shell transcript pinned replay no longer exposes native-exact evidence cleanly.`,
        })
      }
    } else if (item.exactDiffRisk !== "pinned-transcript-needs-live-shell" || item.sourceAnchors.length === 0 || item.fixtureIDs.length === 0 || item.knownLossiness.length === 0) {
      issues.push({
        id: "product-shell-transcript-pinned-replay.common-shell-only",
        product,
        dimension: "pty-api-transcript",
        message: `${product} product shell transcript pinned replay is not anchored to product-specific shell evidence.`,
      })
    }
    if (product !== "opencode" && (item.sourceMatrixID === "opencode" || item.fixtureID === "opencode-product-shell:source-matrix" || item.exactDiffRisk === "borrowed-opencode")) {
      issues.push({
        id: "product-shell-transcript-pinned-replay.borrowed-source-matrix",
        product,
        dimension: "command-route",
        message: `${product} product shell transcript pinned replay is borrowing the OpenCode source matrix.`,
      })
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  }
}

function buildProductShellTranscriptExactDiffBlockerCase(
  gateCase: ProductShellTranscriptGateCase,
): ProductShellTranscriptExactDiffBlockerCase {
  if (gateCase.product === "opencode") {
    const nativeEvidenceRefs = openCodeProductShellNativeEvidenceRefs(gateCase)
    return {
      product: gateCase.product,
      sourceMatrixID: gateCase.sourceMatrixID,
      evidenceRef: "conformance:product-shell-transcript-exact-diff-blocker-gate",
      fixtureID: openCodeProductShellNativeExactFixtureID,
      exactDiffStatus: "native-exact",
      coverageStatus: "native",
      nativeParityClaim: true,
      commandRoute: gateCase.commandRoute,
      errorPath: gateCase.errorPath,
      ptyApiTranscript: gateCase.ptyApiTranscript,
      sessionReadback: gateCase.sessionReadback,
      surfaceState: gateCase.surfaceState,
      previewDemotion: [],
      sourceAnchors: uniqueStrings([
        ...gateCase.sourceAnchors,
        ...nativeEvidenceRefs,
      ]),
      productShellAtomIDs: gateCase.productShellAtomIDs,
      surfaceServiceIDs: gateCase.surfaceServiceIDs,
      fixtureIDs: uniqueStrings([
        ...gateCase.fixtureIDs,
        openCodeProductShellNativeExactFixtureID,
      ]),
      nativeEvidenceRefs,
      exactDiffRisk: "native-exact",
      knownLossiness: [],
    }
  }
  return {
    product: gateCase.product,
    sourceMatrixID: gateCase.sourceMatrixID,
    evidenceRef: "conformance:product-shell-transcript-exact-diff-blocker-gate",
    fixtureID: gateCase.fixtureID,
    exactDiffStatus: "exact-diff-partial",
    coverageStatus: "partial",
    nativeParityClaim: false,
    commandRoute: uniqueStrings([
      ...gateCase.commandRoute,
      "shell-command-route-native-dispatch:exact-diff-not-proven",
    ]),
    errorPath: uniqueStrings([
      ...gateCase.errorPath,
      "shell-error-path-native-status:exact-diff-not-proven",
    ]),
    ptyApiTranscript: uniqueStrings([
      ...gateCase.ptyApiTranscript,
      "shell-pty-api-transcript-native-stream:exact-diff-not-proven",
    ]),
    sessionReadback: uniqueStrings([
      ...gateCase.sessionReadback,
      "shell-session-readback-native-storage:exact-diff-not-proven",
    ]),
    surfaceState: uniqueStrings([
      ...gateCase.surfaceState,
      "shell-surface-state-native-side-effects:exact-diff-not-proven",
    ]),
    previewDemotion: gateCase.previewDemotion,
    sourceAnchors: gateCase.sourceAnchors,
    productShellAtomIDs: gateCase.productShellAtomIDs,
    surfaceServiceIDs: gateCase.surfaceServiceIDs,
    fixtureIDs: gateCase.fixtureIDs,
    nativeEvidenceRefs: uniqueStrings([
      gateCase.fixtureID,
      ...gateCase.fixtureIDs,
      ...gateCase.sourceAnchors,
    ]),
    exactDiffRisk: "semantic-fixture-needs-exact-diff",
    knownLossiness: uniqueStrings([
      ...gateCase.knownLossiness,
      "shell-command-route-native-dispatch-not-proven",
      "shell-error-path-native-status-not-proven",
      "shell-pty-api-transcript-native-stream-not-proven",
      "shell-session-readback-native-storage-not-proven",
      "shell-surface-state-native-side-effects-not-proven",
    ]),
  }
}

function buildProductShellTranscriptPinnedReplayCase(
  gateCase: ProductShellTranscriptGateCase,
): ProductShellTranscriptPinnedReplayCase {
  const records = productShellPinnedReplayRecords(gateCase.product)
  const nativeEvidenceRefs = gateCase.product === "opencode" ? openCodeProductShellNativeEvidenceRefs(gateCase) : []
  return {
    product: gateCase.product,
    sourceMatrixID: gateCase.sourceMatrixID,
    evidenceRef: "conformance:product-shell-transcript-pinned-replay-gate",
    fixtureID: gateCase.product === "opencode" ? openCodeProductShellNativeExactFixtureID : gateCase.fixtureID,
    exactDiffStatus: gateCase.product === "opencode" ? "native-exact" : "exact-diff-partial",
    coverageStatus: gateCase.product === "opencode" ? "native" : "partial",
    nativeParityClaim: gateCase.product === "opencode",
    upstreamTranscript: records,
    productTranscript: records.map(productShellClonePinnedReplayRecord),
    assembledTranscript: records.map(productShellClonePinnedReplayRecord),
    sourceAnchors: uniqueStrings([
      ...gateCase.sourceAnchors,
      ...nativeEvidenceRefs,
    ]),
    fixtureIDs: uniqueStrings(["product-shell:cli-api-pty-transcript-gate", ...gateCase.fixtureIDs, ...(gateCase.product === "opencode" ? [openCodeProductShellNativeExactFixtureID] : [])]),
    nativeEvidenceRefs,
    exactDiffRisk: gateCase.product === "opencode" ? "native-exact" : "pinned-transcript-needs-live-shell",
    knownLossiness: gateCase.product === "opencode"
      ? []
      : uniqueStrings([
        ...gateCase.knownLossiness,
        "product-shell-transcript-pinned-replay-live-shell-not-proven",
        "product-shell-transcript-pinned-replay-native-pty-timing-not-proven",
        "product-shell-transcript-pinned-session-side-effects-not-proven",
        "product-shell-transcript-pinned-dom-side-effects-not-proven",
      ]),
  }
}

function openCodeProductShellNativeEvidenceRefs(gateCase: ProductShellTranscriptGateCase): string[] {
  return uniqueStrings([
    gateCase.fixtureID,
    ...gateCase.fixtureIDs,
    ...gateCase.sourceAnchors,
    openCodeProductShellNativeExactEvidenceRef,
    openCodeProductShellNativeExactReplayRef,
  ])
}

function productShellPinnedReplayRecords(product: ProductShellTranscriptPinnedReplayProduct): ProductShellTranscriptPinnedReplayRecord[] {
  if (product === "opencode") {
    return [
      productShellPinnedReplayRecord(product, 1, "opencode.server", "POST /v1/run", "hello from opencode server", "opencode server ok", null, 200, null, "ses_oc_1", "assistant:opencode server ok", "assistant:opencode server ok", { route: "POST /v1/run", status: "ready", shell: "server" }),
      productShellPinnedReplayRecord(product, 2, "opencode.server", "POST /v1/run/fake", "fake route", null, "HTTP 404", 404, "HTTP 404", "ses_oc_404", "error:HTTP 404", "error:HTTP 404", { route: "POST /v1/run/fake", status: "rejected", shell: "server" }),
      productShellPinnedReplayRecord(product, 3, "opencode.tui", "TUI submit", "hello from opencode tui", "OpenCode TUI submitted hello from opencode tui", null, 200, null, "ses_oc_tui", "assistant:hello from opencode tui", "assistant:hello from opencode tui", { focus: "chat", status: "ready", theme: "system" }),
    ]
  }
  if (product === "pi-mono") {
    return [
      productShellPinnedReplayRecord(product, 1, "pi.cli", "CLI run --json", "hello from pi cli", "pi cli ok", null, 0, null, "ses_pi_cli", "assistant:pi cli ok", "assistant:pi cli ok", { format: "json", shell: "cli", status: "ready" }),
      productShellPinnedReplayRecord(product, 2, "pi.rpc", "RPC run.fake", "fake route", null, "Unknown pi.rpc method: run.fake", 404, "Unknown pi.rpc method: run.fake", "ses_pi_rpc_error", "error:Unknown pi.rpc method: run.fake", "error:Unknown pi.rpc method: run.fake", { method: "run.fake", status: "rejected", shell: "rpc" }),
      productShellPinnedReplayRecord(product, 3, "pi.tui", "TUI select theme", "theme light", "Pi Mono TUI theme light", null, 200, null, "ses_pi_tui", "assistant:theme light", "assistant:theme light", { focus: "theme", status: "ready", theme: "light" }),
    ]
  }
  if (product === "nanobot") {
    return [
      productShellPinnedReplayRecord(product, 1, "nanobot.cli", "CLI agent", "hello from nanobot cli", "nanobot cli ok", null, 0, null, "ses_nano_cli", "assistant:nanobot cli ok", "assistant:nanobot cli ok", { channel: "cli", shell: "cli", status: "ready" }),
      productShellPinnedReplayRecord(product, 2, "nanobot.server", "POST /v1/agent", "hello from nanobot server", "nanobot server ok", null, 200, null, "ses_nano_server", "assistant:nanobot server ok", "assistant:nanobot server ok", { channel: "server", route: "POST /v1/agent", status: "ready" }),
      productShellPinnedReplayRecord(product, 3, "nanobot.server", "POST /v1/missing", "missing route", null, "HTTP 404", 404, "HTTP 404", "ses_nano_error", "error:HTTP 404", "error:HTTP 404", { route: "POST /v1/missing", status: "rejected", shell: "server" }),
    ]
  }
  return [
    productShellPinnedReplayRecord(product, 1, "hermes.api-server", "POST /v1/chat/completions", "hello from hermes api", "hermes api ok", null, 200, null, "ses_hermes_api", "assistant:hermes api ok", "assistant:hermes api ok", { route: "POST /v1/chat/completions", shell: "api-server", status: "ready" }),
    productShellPinnedReplayRecord(product, 2, "hermes.acp", "ACP session/prompt", "missing provider", null, "requires a live provider", 400, "requires a live provider", "ses_hermes_acp_error", "error:requires a live provider", "error:requires a live provider", { method: "session/prompt", shell: "acp", status: "rejected" }),
    productShellPinnedReplayRecord(product, 3, "hermes.tui", "GET /v1/tui", "render tui", "Hermes Agent TUI", null, 200, null, "ses_hermes_tui", "assistant:Hermes Agent TUI", "assistant:Hermes Agent TUI", { dashboard: "ready", shell: "tui", status: "ready" }),
  ]
}

function productShellPinnedReplayRecord(
  product: ProductShellTranscriptPinnedReplayProduct,
  sequence: number,
  surfaceServiceID: string,
  commandRoute: string,
  input: string,
  stdout: string | null,
  stderr: string | null,
  statusCode: number,
  errorMessage: string | null,
  sessionID: string,
  transcriptText: string,
  readbackText: string,
  surfaceState: Record<string, string>,
): ProductShellTranscriptPinnedReplayRecord {
  return {
    recordID: `${product}-shell-transcript-${sequence}`,
    surfaceServiceID,
    commandRoute,
    input,
    stdout,
    stderr,
    statusCode,
    errorMessage,
    sessionID,
    transcriptText,
    readbackText,
    surfaceState,
    sequence,
  }
}

function productShellClonePinnedReplayRecord(record: ProductShellTranscriptPinnedReplayRecord): ProductShellTranscriptPinnedReplayRecord {
  return {
    ...record,
    surfaceState: { ...record.surfaceState },
  }
}

function productShellPinnedCommandRouteMatches(
  expected: ProductShellTranscriptPinnedReplayRecord[],
  actual: ProductShellTranscriptPinnedReplayRecord[],
): boolean {
  return expected.every((record, index) => {
    const candidate = actual[index]
    return candidate !== undefined && record.surfaceServiceID === candidate.surfaceServiceID && record.commandRoute === candidate.commandRoute && record.input === candidate.input
  })
}

function productShellPinnedErrorPathMatches(
  expected: ProductShellTranscriptPinnedReplayRecord[],
  actual: ProductShellTranscriptPinnedReplayRecord[],
): boolean {
  return expected.every((record, index) => {
    const candidate = actual[index]
    return candidate !== undefined && record.statusCode === candidate.statusCode && record.errorMessage === candidate.errorMessage && record.stderr === candidate.stderr
  })
}

function productShellPinnedTranscriptMatches(
  expected: ProductShellTranscriptPinnedReplayRecord[],
  actual: ProductShellTranscriptPinnedReplayRecord[],
): boolean {
  return expected.every((record, index) => {
    const candidate = actual[index]
    return candidate !== undefined && record.stdout === candidate.stdout && record.stderr === candidate.stderr && record.transcriptText === candidate.transcriptText && record.sequence === candidate.sequence
  })
}

function productShellPinnedSessionReadbackMatches(
  expected: ProductShellTranscriptPinnedReplayRecord[],
  actual: ProductShellTranscriptPinnedReplayRecord[],
): boolean {
  return expected.every((record, index) => {
    const candidate = actual[index]
    return candidate !== undefined && record.sessionID === candidate.sessionID && record.readbackText === candidate.readbackText
  })
}

function productShellPinnedSurfaceStateMatches(
  expected: ProductShellTranscriptPinnedReplayRecord[],
  actual: ProductShellTranscriptPinnedReplayRecord[],
): boolean {
  return expected.every((record, index) => stableStringify(record.surfaceState) === stableStringify(actual[index]?.surfaceState ?? null))
}

const PRODUCT_SHELL_TRANSCRIPT_GATE_CASES: ProductShellTranscriptGateCase[] = [
  {
    product: "opencode",
    sourceMatrixID: "opencode",
    evidenceRef: "conformance:product-shell-transcript-gate",
    fixtureID: "opencode-product-shell:source-matrix",
    commandRoute: [
      "SDK runTurn product command route",
      "server POST /v1/run API route",
      "Slack /opencode graph command route",
      "control-plane routes include POST /v1/run",
    ],
    errorPath: [
      "server rejects POST /v1/run/fake with HTTP 404",
      "control-plane route snapshot excludes fake run route",
    ],
    ptyApiTranscript: [
      "TUI render OpenCode TUI",
      "TUI dispatch submit input event",
      "server API transcript smoke returns provider text",
      "web render data-opencode-web ready",
      "desktop shell data-opencode-desktop-shell ready",
    ],
    sessionReadback: [
      "SDK getSession transcript assistant readback",
      "runTurn session id persists through assistant transcript",
      "server run returns provider transcript text",
    ],
    surfaceState: [
      "workspace snapshot product opencode recipeID opencode",
      "control-plane status ready",
      "SDK graph includes opencode.product-shell.sdk",
      "desktop manifest appID dev.opencode.helix",
    ],
    previewDemotion: [
      "opencode.product-shell.web inspection-dashboard-preview static preview",
    ],
    sourceAnchors: [
      "github-tree:1a8fd0e1dca58a473d85500530dd45def3f512ab:opencode-product-shell",
      "conformance:opencode-product-shell-source-matrix",
      "conformance:opencode-product-shell-native-exact-fixture",
      "product-shell-native-exact:opencode",
    ],
    productShellAtomIDs: [
      "opencode.product-shell.harness",
      "opencode.product-shell.sdk",
      "opencode.product-shell.server",
      "opencode.product-shell.slack",
      "opencode.product-shell.tui",
      "opencode.product-shell.web",
      "opencode.product-shell.desktop",
      "opencode.product-shell.workspace",
      "opencode.product-shell.control-plane",
    ],
    surfaceServiceIDs: [
      "opencode.sdk",
      "opencode.server.factory",
      "opencode.slack",
      "opencode.tui",
      "opencode.web",
      "opencode.desktop",
      "opencode.workspace",
      "opencode.control-plane",
    ],
    fixtureIDs: [
      "product-shell:cli-api-pty-transcript-gate",
      "opencode-product-shell:source-matrix",
      "opencode-product-shell:native-exact-fixture",
      "opencode-product-shell:inspection-dashboard-preview",
    ],
    transcriptRisk: "source-anchored-partial",
    knownLossiness: [
      "opencode-product-shell-source-matrix-partial-fixture",
      "native-shell-transcript-not-replayed",
      "static-inspection-dashboard-preview",
      "session-readback-side-effects-not-exact",
    ],
  },
  {
    product: "pi-mono",
    sourceMatrixID: "pi",
    evidenceRef: "conformance:product-shell-transcript-gate",
    fixtureID: "pi-product-shell:source-matrix",
    commandRoute: [
      "CLI run --json product command route",
      "server POST /v1/run API route",
      "server POST /v1/rpc run.turn route",
      "RPC workspace.snapshot method route",
      "package manager commands route",
    ],
    errorPath: [
      "RPC rejects run.fake unknown method",
      "RPC methods exclude run.fake and invalid run.turn listing",
    ],
    ptyApiTranscript: [
      "TUI render Pi Mono TUI",
      "TUI dispatch select theme input event",
      "CLI stdout JSON event stream contains provider text",
      "server /v1/web render data-pi-web-ui ready",
      "browser smoke render ready",
    ],
    sessionReadback: [
      "SDK getSession transcript assistant readback",
      "CLI provider output visible in JSON transcript",
      "server run returns provider transcript text",
    ],
    surfaceState: [
      "SDK workspace snapshot product pi-mono recipeID pi-mono",
      "TUI snapshot theme state",
      "release verify surface state ok",
      "package manager shrinkwrap state",
    ],
    previewDemotion: [
      "pi.product-shell.tui preview demotion no-native-pty-transcript",
      "pi.product-shell.web-ui inspection-dashboard-preview static preview",
    ],
    sourceAnchors: [
      "github-tree:7c2775f6f67c38ed491a1ff68240ee4f8ba688da:pi-product-shell",
      "conformance:pi-product-shell-source-matrix",
    ],
    productShellAtomIDs: [
      "pi.product-shell.cli",
      "pi.product-shell.harness",
      "pi.product-shell.rpc",
      "pi.product-shell.sdk",
      "pi.product-shell.server",
      "pi.product-shell.tui",
      "pi.product-shell.web-ui",
      "pi.product-shell.browser-smoke",
      "pi.product-shell.package-manager",
      "pi.product-shell.release-hardening",
    ],
    surfaceServiceIDs: [
      "pi.cli",
      "pi.rpc",
      "pi.sdk",
      "pi.server.factory",
      "pi.tui",
      "pi.web-ui",
      "pi.browser-smoke",
      "pi.package-manager",
      "pi.release-hardening",
    ],
    fixtureIDs: [
      "product-shell:cli-api-pty-transcript-gate",
      "pi-product-shell:source-matrix",
      "pi-product-shell:tui-preview",
      "pi-product-shell:inspection-dashboard-preview",
    ],
    transcriptRisk: "source-anchored-partial",
    knownLossiness: [
      "pi-product-shell-source-matrix-partial-fixture",
      "native-shell-transcript-not-replayed",
      "no-native-pty-transcript",
      "static-inspection-dashboard-preview",
      "session-readback-side-effects-not-exact",
    ],
  },
  {
    product: "nanobot",
    sourceMatrixID: "nanobot",
    evidenceRef: "conformance:product-shell-transcript-gate",
    fixtureID: "nanobot-product-shell:source-matrix",
    commandRoute: [
      "CLI commands agent serve gateway route",
      "server POST /v1/agent API route",
      "SDK runTurn product command route",
    ],
    errorPath: [
      "command route whitelist guards missing or invalid commands",
      "server route table guards invalid product shell route",
    ],
    ptyApiTranscript: [
      "TUI render Nanobot TUI",
      "TUI dispatch select theme input event",
      "CLI stdout JSON event stream contains provider text",
      "server /v1/web render data-nanobot-web-ui ready",
      "server agent API transcript returns provider text",
    ],
    sessionReadback: [
      "SDK getSession transcript assistant readback",
      "CLI provider output visible in JSON transcript",
      "server agent run returns provider transcript text",
    ],
    surfaceState: [
      "SDK workspace snapshot product nanobot recipeID nanobot",
      "SDK graph includes nanobot.product-shell.sdk",
      "TUI snapshot theme state",
      "web UI render ready",
    ],
    previewDemotion: [
      "nanobot.product-shell.tui preview demotion no-native-pty-transcript",
      "nanobot.product-shell.web-ui inspection-dashboard-preview static preview",
    ],
    sourceAnchors: [
      "github-tree:c018c3fb6a5cedf2dcd7bbd0bf4fce5eb9b54bf7:nanobot-product-shell",
      "conformance:nanobot-product-shell-source-matrix",
    ],
    productShellAtomIDs: [
      "nanobot.product-shell.cli",
      "nanobot.product-shell.harness",
      "nanobot.product-shell.sdk",
      "nanobot.product-shell.server",
      "nanobot.product-shell.tui",
      "nanobot.product-shell.web-ui",
    ],
    surfaceServiceIDs: [
      "nanobot.cli",
      "nanobot.sdk",
      "nanobot.server.factory",
      "nanobot.tui",
      "nanobot.web-ui",
    ],
    fixtureIDs: [
      "product-shell:cli-api-pty-transcript-gate",
      "nanobot-product-shell:source-matrix",
      "nanobot-product-shell:tui-preview",
      "nanobot-product-shell:inspection-dashboard-preview",
    ],
    transcriptRisk: "source-anchored-partial",
    knownLossiness: [
      "nanobot-product-shell-source-matrix-partial-fixture",
      "native-shell-transcript-not-replayed",
      "no-native-pty-transcript",
      "static-inspection-dashboard-preview",
      "session-readback-side-effects-not-exact",
    ],
  },
  {
    product: "hermes-agent",
    sourceMatrixID: "hermes",
    evidenceRef: "conformance:product-shell-transcript-gate",
    fixtureID: "hermes-product-shell:source-matrix",
    commandRoute: [
      "CLI run --json product command route",
      "ACP session/prompt method route",
      "gateway dispatch platform route",
      "API server POST /v1/chat/completions route",
      "API server POST /v1/acp and POST /v1/gateway routes",
    ],
    errorPath: [
      "ACP session/prompt rejects missing provider with requires a live provider",
      "API server route table guards missing or invalid route",
    ],
    ptyApiTranscript: [
      "TUI render Hermes Agent TUI",
      "dashboard render data-hermes-dashboard ready",
      "API server /v1/tui returns TUI transcript text",
      "API server /v1/dashboard returns dashboard render",
      "chat completions API transcript returns provider text",
    ],
    sessionReadback: [
      "SDK runTurn transcript contains provider text",
      "CLI provider output visible in JSON transcript",
      "ACP/API/gateway provider transcript text returns through surface",
      "native session readback still pending exact replay",
    ],
    surfaceState: [
      "SDK workspace snapshot product hermes-agent recipeID hermes-agent",
      "API server routes snapshot includes ACP and gateway",
      "dashboard surface state ready",
      "TUI render state ready",
    ],
    previewDemotion: [
      "hermes.product-shell.tui preview demotion no-native-pty-transcript",
      "hermes.product-shell.web-dashboard inspection-dashboard-preview static preview",
    ],
    sourceAnchors: [
      "github-tree:92a567db2d7a5031df8211efbfdad864c2f51faf:hermes-product-shell",
      "conformance:hermes-product-shell-source-matrix",
    ],
    productShellAtomIDs: [
      "hermes.product-shell.acp",
      "hermes.product-shell.api-server",
      "hermes.product-shell.cli",
      "hermes.product-shell.gateway",
      "hermes.product-shell.harness",
      "hermes.product-shell.sdk",
      "hermes.product-shell.tui",
      "hermes.product-shell.web-dashboard",
    ],
    surfaceServiceIDs: [
      "hermes.acp",
      "hermes.api-server.factory",
      "hermes.cli",
      "hermes.gateway",
      "hermes.sdk",
      "hermes.tui",
      "hermes.web-dashboard",
    ],
    fixtureIDs: [
      "product-shell:cli-api-pty-transcript-gate",
      "hermes-product-shell:source-matrix",
      "hermes-product-shell:tui-preview",
      "hermes-product-shell:inspection-dashboard-preview",
    ],
    transcriptRisk: "source-anchored-partial",
    knownLossiness: [
      "hermes-product-shell-source-matrix-partial-fixture",
      "native-shell-transcript-not-replayed",
      "no-native-pty-transcript",
      "static-inspection-dashboard-preview",
      "session-readback-side-effects-not-exact",
    ],
  },
]

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`
}

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function gateContains(values: readonly string[], pattern: RegExp): boolean {
  return values.some((value) => pattern.test(value))
}
