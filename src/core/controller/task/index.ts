import { ApiHandler } from "@/core/api";
import { Controller } from "..";
import { OllamaHandler } from "@/core/api/providers/ollama";
import { getSystemPrompt } from "@/core/prompts/system";
import { ApiStream } from "@/core/api/transform/stream";
import Anthropic from "@anthropic-ai/sdk";
import { FocusChainPrompts } from "@/core/prompts/focus";
import { AssistantMessageContent, parseAssistantMessageV2, ToolUse } from "@/core/assistant-message";
import { formatResponse } from "@/core/prompts/response";
import { TaskState } from "./TaskState";
import { ToolExecutor } from "./ToolExecutor";
import { MiniClineDefaultTool } from "@/shared/tools";
import { sendMessageUpdate } from "../message/subscribeToMessage";
import { Message, MessageOwn } from "@/shared/proto/minicline/message";

export class Task {
    // Core task variables
    readonly taskId: string;
    private model: string;
    private task: string;
    private cwd: string;

    taskState: TaskState;

    // Core dependencies
    private controller: Controller;

    // Service handlers
    api: ApiHandler;

    private toolExecutor: ToolExecutor;

    private apiConversationHistory: Anthropic.MessageParam[] = [];

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
        this.taskState = new TaskState();
        this.toolExecutor = new ToolExecutor(
            this.controller.context,
            this.taskState,
            this.api,
            cwd,
            this.taskId,
            (async () => { }),
        );
    };

    public async startTask(): Promise<void> {

        this.taskState.isInitialized = true;

        this.taskState.userMessageContent.push({
            type: "text",
            text: `<task>\n${this.task}\n</task>`,
        });

        this.taskState.userMessageContent.push({
            type: "text",
            text: FocusChainPrompts.recommended,
        });

        this.apiConversationHistory.push({
            role: "user",
            content: this.taskState.userMessageContent,
        });

        this.initiateTaskLoop();
    }

    private async initiateTaskLoop(): Promise<void> {
        while (!this.taskState.abort) {
            const didEndLoop = await this.makeClineRequests();

            //const totalCost = this.calculateApiCost(totalInputTokens, totalOutputTokens)
            if (didEndLoop) {
                // For now a task never 'completes'. This will only happen if the user hits max requests and denies resetting the count.
                //this.say("task_completed", `Task completed. Total API usage cost: ${totalCost}`)
                break;
            } else {
                this.taskState.userMessageContent = [];
            }
        }
    }

    async makeClineRequests(): Promise<boolean> {
        try {
            // reset streaming state
            this.taskState.isStreaming = true;
            this.taskState.currentStreamingContentIndex = 0;

            let assistantMessage = ""; // For UI display (includes XML)

            const stream = this.attemptApiRequest(); // yields only if the first chunk is successful, otherwise will allow the user to retry the request (most likely due to rate limit error, which gets thrown on the first chunk)
            try {
                for await (const chunk of stream) {
                    switch (chunk.type) {
                        case "usage": {
                            break;
                        }
                        case "tool_calls": {
                            // Accumulate tool use blocks in proper Anthropic format
                            break;
                        }
                        case "text": {
                            assistantMessage += chunk.text;
                            break;
                        }
                    }
                }
            } catch (error) {
                console.log(error);
            } finally {
                this.taskState.isStreaming = false;
            }

            const assistantHasContent = assistantMessage.length > 0;
            console.log(assistantMessage);
            this.taskState.userMessageContent = [];

            if (assistantHasContent) {
                let didEndLoop = false;
                this.taskState.assistantMessageContent = parseAssistantMessageV2(assistantMessage);
                for (const assistantMsg of this.taskState.assistantMessageContent) {
                    if (assistantMsg.type === "text") {
                        this.apiConversationHistory.push({
                            role: "assistant",
                            content: assistantMsg.content,
                        });
                    }
                }

                // if the model did not tool use, then we need to tell it to either use a tool or attempt_completion
                const didToolUse = this.taskState.assistantMessageContent.some((block) => block.type === "tool_use");
                if (!didToolUse) {
                    // normal request where tool use is required
                    this.taskState.userMessageContent.push({
                        type: "text",
                        text: formatResponse.noToolsUsed(false),
                    });
                    this.taskState.consecutiveMistakeCount++;
                } else {
                    // Process the new text content as it streams in without awaiting for full message
                    for (const block of this.taskState.assistantMessageContent) {
                        if (block.type === "tool_use" && block.name === MiniClineDefaultTool.ATTEMPT) {
                            didEndLoop = true;
                        }
                        await this.presentAssistantMessage(block);
                    }
                }
                this.apiConversationHistory.push({
                    role: "user",
                    content: this.taskState.userMessageContent,
                });
                return didEndLoop;
            } else {
                return true;
            }
        } catch (_error) {
            // this should never happen since the only thing that can throw an error is the attemptApiRequest, which is wrapped in a try catch that sends an ask where if noButtonClicked, will clear current task and destroy this instance. However to avoid unhandled promise rejection, we will end this loop which will end execution of this instance (see startTask)
            return true; // needs to be true so parent loop knows to end task
        }
    }

    async *attemptApiRequest(): ApiStream {
        const systemPrompt = await getSystemPrompt();

        // Response API requires native tool calls to be enabled
        const stream = this.api.createMessage(systemPrompt, this.apiConversationHistory);

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

    async presentAssistantMessage(block: AssistantMessageContent) {
        if (block) {
            switch (block.type) {
                case "text": {
                    sendMessageUpdate(Message.create({
                        content: block.content,
                        owner: MessageOwn.ASSISTANT
                    }));
                    break;
                }
                case "tool_use": {
                    await this.toolExecutor.executeTool(block);
                    break;
                }
            }
        }
    }
}
