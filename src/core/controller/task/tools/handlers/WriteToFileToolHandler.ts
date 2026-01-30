import { ToolUse } from "@/core/assistant-message";
import { MiniClineDefaultTool } from "@/shared/tools";
import { TaskConfig } from "../../TaskConfig";
import { IFullyManagedTool } from "../ToolExecutorCoordinator";
import { formatResponse } from "@/core/prompts/response";
import path from "path";
import * as fs from 'fs/promises';

export class WriteToFileToolHandler implements IFullyManagedTool {
    readonly name = MiniClineDefaultTool.FILE_NEW;
    async execute(config: TaskConfig, block: ToolUse): Promise<string> {
        const rawRelPath = block.params.path;
        const rawContent = block.params.content; // for write_to_file

        if (block.params.path && block.params.content) {
            const filePath = path.join(config.cwd, block.params.path);
            // 将内容写入文件
            await fs.writeFile(filePath, fixModelHtmlEscaping(block.params.content), 'utf-8');
            console.log(this.getDescription(block));
        }

        return formatResponse.fileEditWithoutUserChanges(rawRelPath, rawContent);
    }

    getDescription(block: ToolUse): string {
        return `${block.name} for '${block.params.path}'`;
    }
}

function fixModelHtmlEscaping(text: string): string {
	return text
		.replace(/&gt;/g, ">")
		.replace(/&lt;/g, "<")
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, "&")
		.replace(/&apos;/g, "'")
        .replace(/\uFFFD/g, "");
}