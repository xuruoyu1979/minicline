import { MiniClineTool } from "@/shared/tools";
import { MessageParam } from "@anthropic-ai/sdk/resources/index.mjs";
import { ApiHandler } from "..";
import { ApiStream } from "../transform/stream";
import { Config, Message, Ollama } from "ollama";
import { convertToOllamaMessages } from "../transform/ollama-format";

const DEFAULT_CONTEXT_WINDOW = 256000;
const DEFAULT_TIMEOUT = 300000;
const DEFAULT_OLLAMA_BASEURL = "";

export class OllamaHandler implements ApiHandler {

    private client: Ollama | undefined;
    private model: string;

    constructor(model: string) {
        this.model = model;
    }

    private ensureClient(): Ollama {
        if (!this.client) {
            try {
                const clientOptions: Partial<Config> = {
                    host: DEFAULT_OLLAMA_BASEURL,
                    fetch,
                };

                this.client = new Ollama(clientOptions);
            } catch (error) {
                throw new Error(`Error creating Ollama client: ${error.message}`);
            }
        }
        return this.client;
    }

    async *createMessage(systemPrompt: string, messages: MessageParam[], tools?: MiniClineTool[], useResponseApi?: boolean): ApiStream {
        const client = this.ensureClient();
        const ollamaMessages: Message[] = [{ role: "system", content: systemPrompt }, ...convertToOllamaMessages(messages)];

        try {

            // Create a promise that rejects after timeout
            const timeoutMs = DEFAULT_TIMEOUT;
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error(`Ollama request timed out after ${timeoutMs / 1000} seconds`)), timeoutMs);
            });

            // Create the actual API request promise
            const apiPromise = client.chat({
                model: this.model,
                messages: ollamaMessages,
                stream: true,
                options: {
                    num_ctx: Number(DEFAULT_CONTEXT_WINDOW),
                },
            });

            // Race the API request against the timeout
            const stream = (await Promise.race([apiPromise, timeoutPromise])) as Awaited<typeof apiPromise>;

            try {
                for await (const chunk of stream) {
                    if (typeof chunk.message.content === "string") {
                        yield {
                            type: "text",
                            text: chunk.message.content,
                        };
                    }
                }
            } catch (streamError: any) {
                console.error("Error processing Ollama stream:", streamError);
                throw new Error(`Ollama stream processing error: ${streamError.message || "Unknown error"}`);
            }
        } catch (error) {
            // Check if it's a timeout error
            if (error?.message?.includes("timed out")) {
                const timeoutMs = DEFAULT_TIMEOUT;
                throw new Error(`Ollama request timed out after ${timeoutMs / 1000} seconds`);
            }

            // Enhance error reporting
            const statusCode = error.status || error.statusCode;
            const errorMessage = error.message || "Unknown error";

            console.error(`Ollama API error (${statusCode || "unknown"}): ${errorMessage}`);
            throw error;
        }
    }
    abort?(): void {
        this.client?.abort();
    }
}