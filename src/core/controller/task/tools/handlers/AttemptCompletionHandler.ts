import { MiniClineDefaultTool } from "@/shared/tools";
import { TaskConfig } from "../../TaskConfig";
import { IPartialBlockHandler, IToolHandler } from "../ToolExecutorCoordinator";
import { ToolUse } from "@/core/assistant-message";

export class AttemptCompletionHandler implements IToolHandler, IPartialBlockHandler {
    readonly name = MiniClineDefaultTool.ATTEMPT;
    async execute(config: TaskConfig, block: ToolUse): Promise<string> {
        // Return the tool results as a complex response
        return `[attempt_completion] Result: ${block.params.result}`;
    }
    getDescription(block: ToolUse): string {
        return `[${block.name}]`;
    }
    handlePartialBlock(block: ToolUse): Promise<void> {
        throw new Error("Method not implemented.");
    }
}