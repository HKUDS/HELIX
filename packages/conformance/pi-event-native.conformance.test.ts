import { describe, expect, it } from "vitest"
import {
  buildPiMonoEventNativeExactFixture,
  createPiMonoEventBus,
  emitPiMonoRuntimeEvent,
  piMonoEventEnvelopeNativeDescriptor,
  piMonoEventNativeExactEvidenceRef,
  piMonoEventNativeExactFixtureID,
  piMonoEventNativeExactReplayRef,
  piMonoEventNativeDescriptors,
  piMonoExtensionRuntimeEventNativeDescriptor,
  piMonoRuntimeEventNativeDescriptor,
  verifyPiMonoEventNativeExactFixture,
} from "@helix/adapters-pi/product-schema/events"

describe("Pi event native exact fixture", () => {
  it("proves Pi extension EventBus fanout, unsubscribe, and error swallowing behavior", async () => {
    const order: string[] = []
    const errors: string[] = []
    const bus = createPiMonoEventBus({
      onError: ({ channel }) => {
        errors.push(channel)
      },
    })

    const unsubscribeFirst = bus.on("pi.custom", (payload) => {
      order.push(`first:${payload}`)
    })
    bus.on("pi.custom", (payload) => {
      order.push(`second:${payload}`)
    })
    bus.emit("pi.custom", "alpha")
    unsubscribeFirst()
    bus.emit("pi.custom", "beta")
    bus.on("pi.error", (payload) => {
      order.push(`throws:${payload}`)
      throw new Error("boom")
    })
    bus.on("pi.error", (payload) => {
      order.push(`continues:${payload}`)
    })
    bus.emit("pi.error", "gamma")
    bus.clear()
    bus.emit("pi.custom", "delta")
    await Promise.resolve()

    expect(order).toEqual(["first:alpha", "second:alpha", "second:beta", "throws:gamma", "continues:gamma"])
    expect(errors).toEqual(["pi.error"])
  })

  it("proves native event descriptors and replay fixture are complete", () => {
    const bus = createPiMonoEventBus()
    const emission = emitPiMonoRuntimeEvent({ bus, channel: "resources_discover", data: { skills: ["./skills"] } })
    const fixture = buildPiMonoEventNativeExactFixture()
    const verification = verifyPiMonoEventNativeExactFixture(fixture)

    expect(emission).toEqual({
      channel: "resources_discover",
      data: { skills: ["./skills"] },
      handlerCount: 1,
      delivered: [{ channel: "resources_discover", data: { skills: ["./skills"] } }],
    })
    expect(fixture).toMatchObject({
      product: "pi-mono",
      atomIDs: ["pi.event.envelope-bridge", "pi.event.runtime-bridge", "pi.extension.runtime-event-bridge"],
      portIDs: ["event.envelope", "event.log"],
      exactDiffStatus: "native-exact",
      nativeParityClaim: true,
      evidenceRef: piMonoEventNativeExactEvidenceRef,
      fixtureID: piMonoEventNativeExactFixtureID,
      knownLossiness: [],
      policy: {
        eventBusUsesNodeEventEmitterSemantics: true,
        emitIsSynchronousFanout: true,
        handlersAreRegisteredPerChannel: true,
        unsubscribeRemovesOnlyThatHandler: true,
        handlerErrorsAreReportedAndSwallowed: true,
        clearRemovesAllListeners: true,
        extensionAPIEventsExposeSharedBus: true,
        runnerEmitVisitsExtensionsInLoadOrder: true,
        runnerEmitContinuesAfterHandlerErrors: true,
        sessionBeforeCancelShortCircuits: true,
      },
    })
    expect(fixture.cases.map((item) => item.scenarioID)).toEqual([
      "event-bus-sync-order",
      "event-bus-unsubscribe",
      "event-bus-async-handler-error-is-reported",
      "extension-api-exposes-shared-event-bus",
      "generic-runner-emit-visits-extension-order",
    ])
    expect(fixture.sourceRefs).toEqual(
      expect.arrayContaining([
        expect.stringContaining("event-bus.ts#createEventBus"),
        expect.stringContaining("extensions/loader.ts#createExtensionRuntime,createExtensionAPI"),
        expect.stringContaining("extensions/runner.ts#ExtensionRunner.emit"),
      ]),
    )
    expect(verification).toEqual({ ok: true, issues: [] })
    expect(piMonoEventNativeDescriptors).toEqual([
      piMonoEventEnvelopeNativeDescriptor,
      piMonoRuntimeEventNativeDescriptor,
      piMonoExtensionRuntimeEventNativeDescriptor,
    ])
    for (const descriptor of piMonoEventNativeDescriptors) {
      expect(descriptor).toMatchObject({
        implementationKind: "factory",
        parityCoverage: "native",
        nativeEvidenceRefs: expect.arrayContaining([piMonoEventNativeExactEvidenceRef, piMonoEventNativeExactReplayRef]),
        fixtureIDs: [piMonoEventNativeExactFixtureID],
        knownLossiness: [],
      })
    }
  })

  it("rejects drift away from the native exact event fixture", () => {
    const fixture = buildPiMonoEventNativeExactFixture()

    expect(verifyPiMonoEventNativeExactFixture({ ...fixture, fingerprint: "bad" }).ok).toBe(false)
    expect(verifyPiMonoEventNativeExactFixture({ ...fixture, knownLossiness: ["native-parity-not-proven"] }).issues.map((item) => item.id)).toContain(
      "pi-event-native-exact.lossiness",
    )
    expect(verifyPiMonoEventNativeExactFixture({ ...fixture, cases: [{ ...fixture.cases[0]!, output: { order: ["second:first"] } }, ...fixture.cases.slice(1)] }).issues.map((item) => item.id)).toContain(
      "pi-event-native-exact.cases",
    )
  })
})
