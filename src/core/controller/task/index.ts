import { ApiHandler } from "@/core/api";
import { Controller } from "..";
import { OllamaHandler } from "@/core/api/providers/ollama";
import { getSystemPrompt } from "@/core/prompts/system";
import { ApiStream } from "@/core/api/transform/stream";
import Anthropic from "@anthropic-ai/sdk";
import { FocusChainPrompts } from "@/core/prompts/focus";
import { AssistantMessageContent, parseAssistantMessageV2, ToolUse } from "@/core/assistant-message";
import cloneDeep from "clone-deep";
import path from "path";
import * as fs from 'fs/promises';

export class Task {
    // Core task variables
    readonly taskId: string;
    private model: string;
    private task: string;
    private cwd: string;

    // Core dependencies
    private controller: Controller;

    // Service handlers
    api: ApiHandler;

    assistantMessageContent: AssistantMessageContent[] = [];
    currentStreamingContentIndex = 0;

    constructor(
        controller: Controller,
        model: string,
        task: string,
        taskId: string,
        cwd: string) {
        this.controller = controller;
        this.model = model;
        this.task = task;
        this.taskId = taskId;
        this.cwd = cwd;

        this.api = new OllamaHandler(this.model);
    };

    public async startTask(): Promise<void> {
        const processedUserContent: Anthropic.TextBlockParam[] = [
            {
                type: "text",
                text: `<task>\n${this.task}\n</task>`,
            }
        ];

        processedUserContent.push({
            type: "text",
            text: FocusChainPrompts.recommended,
        });


        let assistantMessage = ""; // For UI display (includes XML)
        const startTime = performance.now(); // 开始时间

        const stream = this.attemptApiRequest(processedUserContent); // yields only if the first chunk is successful, otherwise will allow the user to retry the request (most likely due to rate limit error, which gets thrown on the first chunk)
        try {
            for await (const chunk of stream) {
                switch (chunk.type) {
                    case "usage": {
                        break;
                    }
                    case "tool_calls": {
                        break;
                    }
                    case "text": {
                        assistantMessage += chunk.text;
                        this.assistantMessageContent = parseAssistantMessageV2(assistantMessage);
                        this.presentAssistantMessage();
                        break;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }

        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(`⏱️  耗时: ${duration.toFixed(2)}ms`);

        this.currentStreamingContentIndex = 0;
    }

    async *attemptApiRequest(processedUserContent: Anthropic.TextBlockParam[]): ApiStream {
        const systemPrompt = await getSystemPrompt();

        const userMessages: Anthropic.MessageParam[] = [{
            role: "user",
            content: processedUserContent
        }];

        // Response API requires native tool calls to be enabled
        const stream = this.api.createMessage(systemPrompt, userMessages);

        const iterator = stream[Symbol.asyncIterator]();

        try {
            // awaiting first chunk to see if it will throw an error
            const firstChunk = await iterator.next();
            yield firstChunk.value;
        } catch (error) {
            console.log(error);
        }

        // no error, so we can continue to yield all remaining chunks
        // (needs to be placed outside of try/catch since it we want caller to handle errors not with api_req_failed as that is reserved for first chunk failures only)
        // this delegates to another generator or iterable object. In this case, it's saying "yield all remaining values from this iterator". This effectively passes along all subsequent chunks from the original stream.
        yield* iterator;
    }

    async presentAssistantMessage() {
        const block = cloneDeep(this.assistantMessageContent[this.currentStreamingContentIndex]); // need to create copy bc while stream is updating the array, it could be updating the reference block properties too
        if (block) {
            switch (block.type) {
                case "text": {
                    break;
                }
                case "tool_use":
                    await this.executeTool(block);
                    break;
            }
            if (!block.partial) {
                this.currentStreamingContentIndex++; // need to increment regardless, so when read stream calls this function again it will be streaming the next block
                return;
            }
        }
    }

    /**
     * Main entry point for tool execution - called by Task class
     */
    public async executeTool(block: ToolUse): Promise<void> {
        if (block.params.path && block.params.content) {
            const filePath = path.join(this.cwd, block.params.path);
            // 将内容写入文件
            await fs.writeFile(filePath, block.params.content, 'utf-8');
        }
    }
}
