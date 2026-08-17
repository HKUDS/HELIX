import { createHash, randomBytes as nodeRandomBytes } from "node:crypto"

export interface OpenCodeSessionIDGeneratorOptions {
  now?: () => number
  randomBytes?: (length: number) => Uint8Array
}

export interface OpenCodeNativeSessionIDGeneratorAtom {
  readonly manifest: {
    id: "opencode.session.id-generator"
    provides: ["session.id-generator"]
    variant: "opencode-ses"
    personality: "opencode"
  }
  next(input?: { seed?: string; timestamp?: number }): string
}

export interface OpenCodeSessionIDGeneratorNativeExactFixture {
  schemaVersion: 1
  fixtureID: "opencode-session-id-generator:native-exact-fixture"
  evidenceRef: "conformance:opencode-session-id-generator-native-exact-fixture"
  upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab"
  exactDiffStatus: "pinned-upstream-source-exact"
  nativeParityClaim: true
  sourceRefs: Array<{
    path: string
    symbols: string[]
    sha256: string
  }>
  deterministicInput: {
    timestamp: 1234567890
    randomByte: 0
    callOrder: ["next", "next", "restore"]
  }
  generated: Array<{
    name: "first" | "second"
    value: string
    prefix: "ses"
    direction: "descending"
    sequence: number
  }>
  restored: {
    input: "ses_existing"
    output: string
  }
  validationError: {
    input: "msg_wrong"
    message: string
  }
  knownLossiness: []
  fingerprint: string
}

export interface OpenCodeSessionIDGeneratorNativeExactFixtureIssue {
  id: string
  message: string
}

export interface OpenCodeSessionIDGeneratorNativeExactFixtureVerification {
  ok: boolean
  issues: OpenCodeSessionIDGeneratorNativeExactFixtureIssue[]
}

const OPENCODE_SESSION_ID_SOURCE_REFS = [
  {
    path: "packages/core/src/session.ts",
    symbols: ["Session.ID", "ID.descending"],
    sha256: "sha256:a4da5984b88e9b11ad57f7d5588a4ad15a9e7519fc5131f315ce46d39545890b",
  },
  {
    path: "packages/core/src/util/identifier.ts",
    symbols: ["Identifier.descending", "Identifier.create", "randomBase62"],
    sha256: "sha256:f196ac2448961421c7868befc5963ee104a8ca49ad45f9c443baaaaf3e5d40fc",
  },
  {
    path: "packages/opencode/src/session/session.ts",
    symbols: ["createNext", "SessionID.descending"],
    sha256: "sha256:48eddd4bb992afab269280731ccd288eac24c2fb36372c6eae09b95f5464d61c",
  },
] as const

const EXACT_TIMESTAMP = 1234567890 as const
const EXPECTED_FIRST = "ses_fb669fd2dffe00000000000000" as const
const EXPECTED_SECOND = "ses_fb669fd2dffd00000000000000" as const

export function createOpenCodeNativeSessionIDGenerator(
  options: OpenCodeSessionIDGeneratorOptions = {},
): OpenCodeNativeSessionIDGeneratorAtom {
  let lastTimestamp = 0
  let counter = 0
  const now = options.now ?? (() => Date.now())
  const entropy = options.randomBytes ?? ((length: number) => nodeRandomBytes(length))
  return {
    manifest: {
      id: "opencode.session.id-generator",
      provides: ["session.id-generator"],
      variant: "opencode-ses",
      personality: "opencode",
    },
    next(input = {}) {
      if (input.seed) {
        if (!input.seed.startsWith("ses")) throw new Error(`ID ${input.seed} does not start with ses`)
        return input.seed
      }
      const timestamp = input.timestamp ?? now()
      if (timestamp !== lastTimestamp) {
        lastTimestamp = timestamp
        counter = 0
      }
      counter += 1
      return `ses_${createOpenCodeCoreIdentifier(timestamp, counter, entropy)}`
    },
  }
}

export function captureOpenCodeSessionIDGeneratorNativeExactFixture(): OpenCodeSessionIDGeneratorNativeExactFixture {
  const generator = createOpenCodeNativeSessionIDGenerator({
    now: () => EXACT_TIMESTAMP,
    randomBytes: (length) => new Uint8Array(length),
  })
  const first = generator.next()
  const second = generator.next()
  const restored = generator.next({ seed: "ses_existing" })
  const validationError = captureSessionIDValidationError(() => generator.next({ seed: "msg_wrong" }))
  const snapshotWithoutFingerprint: Omit<OpenCodeSessionIDGeneratorNativeExactFixture, "fingerprint"> = {
    schemaVersion: 1,
    fixtureID: "opencode-session-id-generator:native-exact-fixture",
    evidenceRef: "conformance:opencode-session-id-generator-native-exact-fixture",
    upstreamRef: "upstream:anomalyco/opencode@1a8fd0e1dca58a473d85500530dd45def3f512ab",
    exactDiffStatus: "pinned-upstream-source-exact",
    nativeParityClaim: true,
    sourceRefs: OPENCODE_SESSION_ID_SOURCE_REFS.map((ref) => ({ ...ref, symbols: [...ref.symbols] })),
    deterministicInput: {
      timestamp: EXACT_TIMESTAMP,
      randomByte: 0,
      callOrder: ["next", "next", "restore"],
    },
    generated: [
      { name: "first", value: first, prefix: "ses", direction: "descending", sequence: 1 },
      { name: "second", value: second, prefix: "ses", direction: "descending", sequence: 2 },
    ],
    restored: {
      input: "ses_existing",
      output: restored,
    },
    validationError: {
      input: "msg_wrong",
      message: validationError,
    },
    knownLossiness: [],
  }
  return {
    ...snapshotWithoutFingerprint,
    fingerprint: fingerprintObject(snapshotWithoutFingerprint),
  }
}

export function verifyOpenCodeSessionIDGeneratorNativeExactFixture(
  fixture: OpenCodeSessionIDGeneratorNativeExactFixture,
): OpenCodeSessionIDGeneratorNativeExactFixtureVerification {
  const issues: OpenCodeSessionIDGeneratorNativeExactFixtureIssue[] = []
  if (
    fixture.fixtureID !== "opencode-session-id-generator:native-exact-fixture" ||
    fixture.evidenceRef !== "conformance:opencode-session-id-generator-native-exact-fixture"
  ) {
    issues.push({
      id: "opencode-session-id-generator-native-exact-fixture.identity",
      message: "OpenCode session ID fixture has an unexpected fixture or evidence ID.",
    })
  }
  if (fixture.exactDiffStatus !== "pinned-upstream-source-exact" || fixture.nativeParityClaim !== true) {
    issues.push({
      id: "opencode-session-id-generator-native-exact-fixture.native-claim",
      message: "OpenCode session ID fixture must claim native parity only for the upstream Session.ID descending surface.",
    })
  }
  if (fixture.knownLossiness.length !== 0) {
    issues.push({
      id: "opencode-session-id-generator-native-exact-fixture.lossiness",
      message: "OpenCode session ID fixture must not carry known lossiness.",
    })
  }
  for (const ref of OPENCODE_SESSION_ID_SOURCE_REFS) {
    const match = fixture.sourceRefs.find((candidate) => candidate.path === ref.path)
    if (!match || match.sha256 !== ref.sha256) {
      issues.push({
        id: `opencode-session-id-generator-native-exact-fixture.source-${ref.path}`,
        message: `OpenCode session ID fixture lost pinned upstream source ref ${ref.path}.`,
      })
    }
  }
  if (fixture.generated.find((item) => item.name === "first")?.value !== EXPECTED_FIRST) {
    issues.push({
      id: "opencode-session-id-generator-native-exact-fixture.first",
      message: "OpenCode session ID fixture no longer matches the first deterministic descending ID.",
    })
  }
  if (fixture.generated.find((item) => item.name === "second")?.value !== EXPECTED_SECOND) {
    issues.push({
      id: "opencode-session-id-generator-native-exact-fixture.second",
      message: "OpenCode session ID fixture no longer matches the second deterministic descending ID.",
    })
  }
  if (fixture.restored.input !== fixture.restored.output) {
    issues.push({
      id: "opencode-session-id-generator-native-exact-fixture.restore",
      message: "OpenCode session ID fixture no longer preserves a valid supplied session ID.",
    })
  }
  if (fixture.validationError.message !== "ID msg_wrong does not start with ses") {
    issues.push({
      id: "opencode-session-id-generator-native-exact-fixture.validation",
      message: "OpenCode session ID fixture no longer rejects non-session IDs.",
    })
  }
  if (fixture.fingerprint !== fingerprintObject({ ...fixture, fingerprint: undefined })) {
    issues.push({
      id: "opencode-session-id-generator-native-exact-fixture.fingerprint",
      message: "OpenCode session ID fixture fingerprint no longer matches its contents.",
    })
  }
  return {
    ok: issues.length === 0,
    issues,
  }
}

function captureSessionIDValidationError(run: () => unknown): string {
  try {
    run()
    return "<no-error>"
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

function createOpenCodeCoreIdentifier(timestamp: number, counter: number, entropy: (length: number) => Uint8Array): string {
  let encoded = BigInt(timestamp) * BigInt(0x1000) + BigInt(counter)
  encoded = ~encoded
  const timeBytes = Buffer.alloc(6)
  for (let index = 0; index < 6; index++) {
    timeBytes[index] = Number((encoded >> BigInt(40 - 8 * index)) & BigInt(0xff))
  }
  return `${timeBytes.toString("hex")}${openCodeRandomBase62(entropy, 14)}`
}

function openCodeRandomBase62(entropy: (length: number) => Uint8Array, length: number): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
  const bytes = entropy(length)
  let result = ""
  for (let index = 0; index < length; index++) result += chars[(bytes[index] ?? 0) % chars.length]
  return result
}

function fingerprintObject(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16)
}
