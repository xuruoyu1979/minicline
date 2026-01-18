/* eslint-disable @typescript-eslint/naming-convention */
import { serviceHandlers } from "@/generated/hosts/vscode/protobus-services";
import { ExtensionMessage } from "../../shared/ExtensionMessage";
import { GrpcRequest } from "../../shared/WebviewMessage";
import { Controller } from ".";

export type PostMessageToWebview = (message: ExtensionMessage) => Thenable<boolean | undefined>;

/**
 * Handles a gRPC request from the webview.
 */
export async function handleGrpcRequest(
	controller: Controller,
	postMessageToWebview: PostMessageToWebview,
	request: GrpcRequest,
): Promise<void> {
	await handleUnaryRequest(controller, postMessageToWebview, request);
}


/**
 * Handles a gRPC unary request from the webview.
 *
 * Calls the handler using the service and method name, and then posts the result back to the webview.
 */
async function handleUnaryRequest(
	controller: Controller,
	postMessageToWebview: PostMessageToWebview,
	request: GrpcRequest,
): Promise<void> {
	try {
		// Get the service handler from the config
		const handler = getHandler(request.service, request.method);
		// Handle unary request
		const response = await handler(controller, request.message);
		// Send response to the webview
		await postMessageToWebview({
			type: "grpc_response",
			grpc_response: {
				message: response,
				request_id: request.request_id,
			},
		});
	} catch (error) {
		// Send error response
		console.log("Protobus error:", error);
		await postMessageToWebview({
			type: "grpc_response",
			grpc_response: {
				error: error instanceof Error ? error.message : String(error),
				request_id: request.request_id
			},
		});
	}
}

function getHandler(serviceName: string, methodName: string): any {
	// Get the service handler from the config
	const serviceConfig = serviceHandlers[serviceName];
	if (!serviceConfig) {
		throw new Error(`Unknown service: ${serviceName}`);
	}
	const handler = serviceConfig[methodName];
	if (!handler) {
		throw new Error(`Unknown rpc: ${serviceName}.${methodName}`);
	}
	return handler;
}