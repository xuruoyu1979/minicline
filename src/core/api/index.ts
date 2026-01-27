import { MiniClineTool } from "@/shared/tools";
import { Anthropic } from "@anthropic-ai/sdk";
import { ApiStream } from "./transform/stream";

export interface ApiHandler {
	createMessage(systemPrompt: string, messages: Anthropic.MessageParam[], tools?: MiniClineTool[], useResponseApi?: boolean): ApiStream
	abort?(): void
}