import type { LegoMessage, LegoModel, LegoProviderAdapter, SessionID } from "@helix/contracts"
import type {
  OpenCodeSDK,
  OpenCodeSlackManifest,
  OpenCodeSlackMessageInput,
  OpenCodeSlackMessageResult,
  OpenCodeSlackPostedMessage,
  OpenCodeSlackSurface,
  OpenCodeSlackThreadSession,
  OpenCodeSlackToolPartUpdate,
  OpenCodeSlackView,
  OpenCodeSurfaceHarness,
} from "./opencode-product-types"
import { createOpenCodeSDK } from "./opencode-sdk"

export interface OpenCodeSlackRuntimeOptions {
  provider?: LegoProviderAdapter
  model?: LegoModel
  shareSession?: (sessionID: SessionID) => string | undefined | Promise<string | undefined>
}

export function createOpenCodeSlack(harness: OpenCodeSurfaceHarness, sdk = createOpenCodeSDK(harness)): OpenCodeSlackSurface {
  return createOpenCodeSlackFromSDK(sdk)
}

export function createOpenCodeSlackFromSDK(sdk: OpenCodeSDK, options: OpenCodeSlackRuntimeOptions = {}): OpenCodeSlackSurface {
  const sessions = new Map<string, OpenCodeSlackThreadSession>()
  const postedMessages: OpenCodeSlackPostedMessage[] = []

  const postMessage = (message: OpenCodeSlackPostedMessage): OpenCodeSlackPostedMessage => {
    postedMessages.push(message)
    return message
  }

  return {
    kind: "opencode-slack",
    manifest() {
      return openCodeSlackManifestFromEnv(process.env)
    },
    home() {
      const controlPlane = sdk.controlPlane()
      return slackView("ephemeral", "OpenCode Slack bot is ready.", [
        sectionBlock(`*OpenCode* Slack bot is ready in \`${controlPlane.cwd}\`.`),
        contextBlock("Socket mode mirrors upstream @slack/bolt startup; messages are routed by channel/thread."),
      ])
    },
    async handleCommand(input) {
      const command = input.text.trim()
      const channelID = input.channelID ?? "slack-command"
      const threadTS = "command"
      if (command === "/test" || command === "test") {
        const response = postMessage({
          channelID,
          threadTS,
          kind: "command-response",
          text: "Bot is working! I can hear you loud and clear.",
        })
        return slackView("ephemeral", response.text, [sectionBlock(response.text)])
      }
      const response = postMessage({
        channelID,
        threadTS,
        kind: "error",
        text: "Unsupported Slack command.",
      })
      return slackView("ephemeral", response.text, [sectionBlock(response.text)])
    },
    async handleMessage(input) {
      if (input.subtype || !input.text) {
        return {
          ok: true,
          skipped: true,
          reason: "message has subtype or no text",
        }
      }

      const threadTS = input.threadTS ?? input.ts
      const key = openCodeSlackThreadSessionKey(input.channelID, threadTS)
      let session = sessions.get(key)
      let sharePost: OpenCodeSlackPostedMessage | undefined
      if (!session) {
        const sessionID = await sdk.session.create({ title: `Slack thread ${threadTS}` })
        const shareURL = await options.shareSession?.(sessionID)
        session = {
          key,
          sessionID,
          channelID: input.channelID,
          threadTS,
          ...(shareURL ? { shareURL } : {}),
        }
        sessions.set(key, session)
        if (shareURL) {
          sharePost = postMessage({
            channelID: input.channelID,
            threadTS,
            kind: "session-share",
            text: shareURL,
          })
        }
      }

      try {
        const result = await sdk.session.prompt({
          sessionID: session.sessionID,
          text: input.text,
          ...(options.provider ? { provider: options.provider } : {}),
          ...(options.model ? { model: options.model } : {}),
        })
        const response = postMessage({
          channelID: input.channelID,
          threadTS,
          kind: "assistant-response",
          text: openCodeSlackResponseText(result.assistantMessage),
        })
        return {
          ok: true,
          session,
          ...(sharePost ? { sharePost } : {}),
          response,
        }
      } catch (error) {
        const response = postMessage({
          channelID: input.channelID,
          threadTS,
          kind: "error",
          text: "Sorry, I had trouble processing your message.\nPlease try again.",
        })
        return {
          ok: false,
          reason: error instanceof Error ? error.message : String(error),
          session,
          ...(sharePost ? { sharePost } : {}),
          response,
        }
      }
    },
    async handleToolUpdate(part) {
      if (part.status !== "completed") return undefined
      const session = Array.from(sessions.values()).find((candidate) => candidate.sessionID === part.sessionID)
      if (!session) return undefined
      return postMessage({
        channelID: session.channelID,
        threadTS: session.threadTS,
        kind: "tool-update",
        text: `*${part.tool}* - ${part.title ?? ""}`.trim(),
      })
    },
    sessions() {
      return Array.from(sessions.values())
    },
    postedMessages() {
      return [...postedMessages]
    },
  }
}

export function openCodeSlackManifestFromEnv(env: NodeJS.ProcessEnv): OpenCodeSlackManifest {
  return {
    product: "opencode",
    appName: "OpenCode",
    framework: "@slack/bolt",
    socketMode: true,
    env: {
      botToken: Boolean(env.SLACK_BOT_TOKEN),
      signingSecret: Boolean(env.SLACK_SIGNING_SECRET),
      appToken: Boolean(env.SLACK_APP_TOKEN),
    },
    commands: ["/test"],
    events: ["message", "message.part.updated"],
    interactivity: true,
  }
}

export function openCodeSlackThreadSessionKey(channelID: string, threadTS: string): string {
  return `${channelID}-${threadTS}`
}

function openCodeSlackResponseText(message: LegoMessage): string {
  const text = message.parts.flatMap((part) => part.type === "text" ? [part.text] : []).join("\n")
  return text || "I received your message but didn't have a response."
}

function slackView(responseType: "ephemeral" | "in_channel", text: string, blocks: Array<Record<string, unknown>>): OpenCodeSlackView {
  return {
    response_type: responseType,
    text,
    blocks,
  }
}

function sectionBlock(text: string): Record<string, unknown> {
  return {
    type: "section",
    text: { type: "mrkdwn", text },
  }
}

function contextBlock(text: string): Record<string, unknown> {
  return {
    type: "context",
    elements: [{ type: "mrkdwn", text }],
  }
}

export type {
  OpenCodeSlackManifest,
  OpenCodeSlackMessageInput,
  OpenCodeSlackMessageResult,
  OpenCodeSlackPostedMessage,
  OpenCodeSlackSurface,
  OpenCodeSlackThreadSession,
  OpenCodeSlackToolPartUpdate,
  OpenCodeSlackView,
} from "./opencode-product-types"
