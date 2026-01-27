/* eslint-disable @typescript-eslint/naming-convention */
import { MiniClineDefaultTool } from "@/shared/tools";

export type AssistantMessageContent = TextStreamContent | ToolUse;

export interface TextStreamContent {
	type: "text"
	content: string
	partial: boolean
}

export const toolParamNames = [
	"path",
	"content",
	"task_progress",
] as const;

export type ToolParamName = (typeof toolParamNames)[number];

export interface ToolUse {
	type: "tool_use"
	name: MiniClineDefaultTool // id of the tool being used
	// params is a partial record, allowing only some or none of the possible parameters to be used
	params: Partial<Record<ToolParamName, string>>
	partial: boolean
	/**
	 * Whether this tool use was initiated by a native tool call
	 */
	isNativeToolCall?: boolean
	/**
	 * The call / response ID this tool use is associated with.
	 */
	call_id?: string // optional call ID for tracking tool use calls
	/**
	 * Thought signature associated with this tool use, used by Gemini
	 */
	signature?: string
}

export { parseAssistantMessageV2 } from "./parse-assistant-message";