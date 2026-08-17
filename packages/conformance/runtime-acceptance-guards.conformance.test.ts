import { describe, expect, it } from "vitest"
import {
  buildRuntimeRegistryLifecycleStartStopGuardSnapshot,
  verifyRuntimeRegistryLifecycleStartStopGuardSnapshot,
} from "@helix/lego-runtime"
import {
  buildRuntimeAcceptanceNativeLikeSurfaceGuardSnapshot,
  verifyRuntimeAcceptanceNativeLikeSurfaceGuardSnapshot,
} from "@helix/lego-runtime/runtime-atoms"
import {
  openCodeRuntimeAcceptanceNativeExactEvidenceRef,
  openCodeRuntimeAcceptanceNativeExactFixtureID,
  openCodeRuntimeAcceptanceNativeExactReplayRef,
} from "@helix/lego-runtime/product-schema/opencode"
import {
  piMonoRuntimeAcceptanceNativeExactEvidenceRef,
  piMonoRuntimeAcceptanceNativeExactFixtureID,
  piMonoRuntimeAcceptanceNativeExactReplayRef,
} from "@helix/lego-runtime/product-schema/pi"
import {
  nanobotRuntimeAcceptanceNativeExactEvidenceRef,
  nanobotRuntimeAcceptanceNativeExactFixtureID,
  nanobotRuntimeAcceptanceNativeExactReplayRef,
} from "@helix/lego-runtime/product-schema/nanobot"
import {
  hermesRuntimeAcceptanceNativeExactEvidenceRef,
  hermesRuntimeAcceptanceNativeExactFixtureID,
  hermesRuntimeAcceptanceNativeExactReplayRef,
} from "@helix/lego-runtime/product-schema/hermes"

const runtimeAcceptanceNativeExactExpectations = [
  {
    product: "opencode",
    atomIDPrefix: "opencode",
    evidenceRef: openCodeRuntimeAcceptanceNativeExactEvidenceRef,
    replayRef: openCodeRuntimeAcceptanceNativeExactReplayRef,
    fixtureID: openCodeRuntimeAcceptanceNativeExactFixtureID,
  },
  {
    product: "pi-mono",
    atomIDPrefix: "pi",
    evidenceRef: piMonoRuntimeAcceptanceNativeExactEvidenceRef,
    replayRef: piMonoRuntimeAcceptanceNativeExactReplayRef,
    fixtureID: piMonoRuntimeAcceptanceNativeExactFixtureID,
  },
  {
    product: "nanobot",
    atomIDPrefix: "nanobot",
    evidenceRef: nanobotRuntimeAcceptanceNativeExactEvidenceRef,
    replayRef: nanobotRuntimeAcceptanceNativeExactReplayRef,
    fixtureID: nanobotRuntimeAcceptanceNativeExactFixtureID,
  },
  {
    product: "hermes-agent",
    atomIDPrefix: "hermes",
    evidenceRef: hermesRuntimeAcceptanceNativeExactEvidenceRef,
    replayRef: hermesRuntimeAcceptanceNativeExactReplayRef,
    fixtureID: hermesRuntimeAcceptanceNativeExactFixtureID,
  },
] as const

describe("runtime acceptance TODO29 guards", () => {
  it("records registry lifecycle start/stop order without claiming native parity", async () => {
    const snapshot = await buildRuntimeRegistryLifecycleStartStopGuardSnapshot()
    const verification = verifyRuntimeRegistryLifecycleStartStopGuardSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:runtime-registry-lifecycle-start-stop-guard",
      fixtureID: "runtime:registry-lifecycle-start-stop-guard",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      lifecycleScope: "process",
      expectedSequence: [
        "runtime.acceptance.controller:factory",
        "runtime.acceptance.controller:init",
        "runtime.acceptance.evidence:factory",
        "runtime.acceptance.evidence:init",
        "runtime.acceptance.controller:start",
        "runtime.acceptance.evidence:start",
        "runtime.acceptance.evidence:stop",
        "runtime.acceptance.evidence:dispose",
        "runtime.acceptance.controller:stop",
        "runtime.acceptance.controller:dispose",
      ],
      nativeBlockers: expect.arrayContaining([
        "product-native-runtime-start-stop:not-proven",
        "process-cleanup-side-effects:not-replayed",
      ]),
      knownLossiness: expect.arrayContaining([
        "runtime-registry-lifecycle-start-stop-partial-fixture",
        "runtime-registry-native-lifecycle-readback-not-proven",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(snapshot.events.map((event) => `${event.moduleID}:${event.kind}`)).toEqual(snapshot.expectedSequence)
    expect(snapshot.events.filter((event) => event.kind === "stop").map((event) => event.reason)).toEqual([
      "runtime-acceptance-registry-negative-gate",
      "runtime-acceptance-registry-negative-gate",
    ])
    expect(verification).toEqual({ ok: true, issues: [] })

    const nativeClaim = {
      ...snapshot,
      nativeParityClaim: true as false,
    }
    expect(verifyRuntimeRegistryLifecycleStartStopGuardSnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "runtime-registry-lifecycle.native-claim" }),
    ]))

    const sequenceDrift = {
      ...snapshot,
      events: [...snapshot.events].reverse().map((event, index) => ({ ...event, sequence: index + 1 })),
    }
    expect(verifyRuntimeRegistryLifecycleStartStopGuardSnapshot(sequenceDrift).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "runtime-registry-lifecycle.sequence" }),
    ]))

    const stopReasonDrop = {
      ...snapshot,
      events: snapshot.events.map((event) =>
        event.kind === "stop"
          ? { ...event, reason: "native-complete" }
          : event,
      ),
    }
    expect(verifyRuntimeRegistryLifecycleStartStopGuardSnapshot(stopReasonDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "runtime-registry-lifecycle.stop-reason" }),
    ]))

    const lossinessDrop = {
      ...snapshot,
      knownLossiness: [],
    }
    expect(verifyRuntimeRegistryLifecycleStartStopGuardSnapshot(lossinessDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "runtime-registry-lifecycle.lossiness" }),
    ]))
  })

  it("guards runtime acceptance surface with product native exact atoms", () => {
    const snapshot = buildRuntimeAcceptanceNativeLikeSurfaceGuardSnapshot()
    const verification = verifyRuntimeAcceptanceNativeLikeSurfaceGuardSnapshot(snapshot)

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      evidenceRef: "conformance:runtime-acceptance-native-like-surface-guard",
      fixtureID: "runtime:acceptance-native-like-surface-guard",
      exactDiffStatus: "exact-diff-partial",
      nativeParityClaim: false,
      products: ["opencode", "pi-mono", "nanobot", "hermes-agent"],
      nativeBlockers: expect.arrayContaining([
        "guard-snapshot:not-product-native-runtime",
        "common-runtime-registry-lifecycle:guard-only",
        "live-side-effect-readback:guard-only",
        "interrupt-path:assembled-guard-only",
      ]),
      fingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
    })
    expect(snapshot.atomRefs).toHaveLength(8)
    for (const expectation of runtimeAcceptanceNativeExactExpectations) {
      for (const key of ["acceptance-controller", "acceptance-evidence"] as const) {
        expect(snapshot.atomRefs.find((atom) => atom.atomID === `${expectation.atomIDPrefix}.runtime.${key}.native-like`)).toMatchObject({
          product: expectation.product,
          key,
          portID: key === "acceptance-controller" ? "runtime.acceptance-controller" : "runtime.acceptance-evidence",
          implementationLevel: "native",
          exactDiffStatus: "native-exact",
          nativeParityClaim: true,
          evidenceRefs: expect.arrayContaining([
            `conformance:${expectation.product}-runtime-acceptance-replay-snapshot`,
            `conformance:${expectation.product}-runtime-acceptance-lifecycle`,
            `conformance:${expectation.product}-runtime-acceptance-persistence-cleanup`,
            expectation.evidenceRef,
            expectation.replayRef,
          ]),
          nativeEvidenceRefs: expect.arrayContaining([
            expectation.evidenceRef,
            expectation.replayRef,
          ]),
          fixtureIDs: expect.arrayContaining([
            `${expectation.product}-runtime-acceptance:${key}`,
            `${expectation.product}-runtime-acceptance:timing-boundary`,
            `${expectation.product}-runtime-acceptance:persistence-cleanup`,
            expectation.fixtureID,
          ]),
          knownLossiness: [],
          replayFingerprint: expect.stringMatching(/^[a-f0-9]{16}$/),
        })
      }
    }
    expect(verification).toEqual({ ok: true, issues: [] })

    const nativeClaim = {
      ...snapshot,
      nativeParityClaim: true as false,
    }
    expect(verifyRuntimeAcceptanceNativeLikeSurfaceGuardSnapshot(nativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "runtime-acceptance-native-like.native-claim" }),
    ]))

    const atomNativeClaim = {
      ...snapshot,
      atomRefs: snapshot.atomRefs.map((atom) =>
        atom.atomID === "pi.runtime.acceptance-controller.native-like"
          ? { ...atom, implementationLevel: "native-like" as const, exactDiffStatus: "exact-diff-partial" as const, nativeParityClaim: false }
          : atom,
      ),
    }
    expect(verifyRuntimeAcceptanceNativeLikeSurfaceGuardSnapshot(atomNativeClaim).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance-native-like.atom-native-exact",
        atomID: "pi.runtime.acceptance-controller.native-like",
      }),
    ]))

    const nativeEvidenceDrop = {
      ...snapshot,
      atomRefs: snapshot.atomRefs.map((atom) =>
        atom.atomID === "opencode.runtime.acceptance-evidence.native-like"
          ? { ...atom, nativeEvidenceRefs: [] }
          : atom,
      ),
    }
    expect(verifyRuntimeAcceptanceNativeLikeSurfaceGuardSnapshot(nativeEvidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance-native-like.native-exact-evidence",
        atomID: "opencode.runtime.acceptance-evidence.native-like",
      }),
    ]))

    const evidenceDrop = {
      ...snapshot,
      atomRefs: snapshot.atomRefs.map((atom) =>
        atom.atomID === "nanobot.runtime.acceptance-evidence.native-like"
          ? { ...atom, evidenceRefs: [] }
          : atom,
      ),
    }
    expect(verifyRuntimeAcceptanceNativeLikeSurfaceGuardSnapshot(evidenceDrop).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance-native-like.native-exact-evidence",
        atomID: "nanobot.runtime.acceptance-evidence.native-like",
      }),
    ]))

    const lossinessAdded = {
      ...snapshot,
      atomRefs: snapshot.atomRefs.map((atom) =>
        atom.atomID === "nanobot.runtime.acceptance-controller.native-like"
          ? { ...atom, knownLossiness: ["partial-runtime-acceptance-replay"] }
          : atom,
      ),
    }
    expect(verifyRuntimeAcceptanceNativeLikeSurfaceGuardSnapshot(lossinessAdded).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "runtime-acceptance-native-like.native-exact-lossiness",
        atomID: "nanobot.runtime.acceptance-controller.native-like",
      }),
    ]))

    const misleadingSummary = {
      ...snapshot,
      summary: "runtime acceptance native parity complete",
    }
    expect(verifyRuntimeAcceptanceNativeLikeSurfaceGuardSnapshot(misleadingSummary).issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "runtime-acceptance-native-like.summary" }),
    ]))
  })
})
