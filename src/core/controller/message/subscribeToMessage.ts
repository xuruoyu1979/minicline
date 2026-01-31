import { EmptyRequest } from "@/shared/proto/minicline/common";
import { Controller } from "..";
import { Message, MessageOwn } from "@/shared/proto/minicline/message";
import { StreamingResponseHandler } from "../grpc-handler";

// Keep track of active state subscriptions
const activeMessageSubscriptions = new Set<StreamingResponseHandler<Message>>();

/**
 * Subscribe to message updates
 * @param controller The controller instance
 * @param request The empty request
 * @param responseStream The streaming response handler
 * @param requestId The ID of the request (passed by the gRPC handler)
 */
export async function subscribeToMessage(
    controller: Controller,
    _request: EmptyRequest,
    responseStream: StreamingResponseHandler<Message>,
    requestId?: string,
): Promise<void> {

    // Add this subscription to the active subscriptions
    activeMessageSubscriptions.add(responseStream);

    // Send the initial message
    const initialMessage = Message.create({
        content: "你好，我是你的AI助手小苔藓",
        owner: MessageOwn.ASSISTANT
    });

    try {
        await responseStream(
            {
                content: initialMessage.content,
                owner: initialMessage.owner
            },
            false, // Not the last message
        );
    } catch (error) {
        console.error("Error sending initial state:", error);
        activeMessageSubscriptions.delete(responseStream);
    }
}

/**
 * Send a message update to all active subscribers
 * @param message The message to send
 */
export async function sendMessageUpdate(message: Message): Promise<void> {
    // Send the message to all active subscribers
    const promises = Array.from(activeMessageSubscriptions).map(async (responseStream) => {
        try {
            await responseStream(
                {
                    content: message.content,
                    owner: message.owner

                },
                false, // Not the last message
            );
        } catch (error) {
            console.error("Error sending state update:", error);
            // Remove the subscription if there was an error
            activeMessageSubscriptions.delete(responseStream);
        }
    });

    await Promise.all(promises);
}