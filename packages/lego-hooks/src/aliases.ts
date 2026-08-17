import type { EventNameAlias } from "./types.ts"
import type { LegoEventType } from "@helix/contracts"

const aliases: Partial<Record<EventNameAlias, LegoEventType>> = {
  tool_call: "tool.call",
  tool_result: "tool.result",
  tool_definition: "tool.definition",
  tool_execution_start: "tool.execution_start",
  tool_execution_update: "tool.execution_update",
  tool_execution_end: "tool.execution_end",
  command_before: "command.before",
  before_agent_start: "before_agent_start",
  agent_start: "agent.start",
  agent_end: "agent.end",
  turn_start: "turn.start",
  turn_end: "turn.end",
  message_start: "message.start",
  message_update: "message.update",
  message_end: "message.end",
  session_start: "session.start",
  session_before_switch: "session.before_switch",
  session_before_fork: "session.before_fork",
  session_before_compact: "session.before_compact",
  session_compact: "session.compact",
  session_shutdown: "session.shutdown",
  session_before_tree: "session.before_tree",
  session_tree: "session.tree",
  model_select: "model.select",
  thinking_level_select: "thinking_level.select",
  permission_ask: "permission.ask",
  shell_env: "shell.env",
  before_provider_request: "provider.request.before",
  provider_request_before: "provider.request.before",
  after_provider_response: "provider.response.after",
  provider_response_after: "provider.response.after",
  user_bash: "user_bash",
  resources_discover: "resources.discover",
}

export function normalizeEventName(name: EventNameAlias): LegoEventType {
  return aliases[name] ?? (name as LegoEventType)
}
