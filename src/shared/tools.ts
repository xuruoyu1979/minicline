/* eslint-disable @typescript-eslint/naming-convention */
import { Tool as AnthropicTool } from "@anthropic-ai/sdk/resources/index";

export type MiniClineTool = AnthropicTool;

// Define available tool ids
export enum MiniClineDefaultTool {
	FILE_NEW = "write_to_file",
}

export const toolUseNames = Object.values(MiniClineDefaultTool) as MiniClineDefaultTool[];