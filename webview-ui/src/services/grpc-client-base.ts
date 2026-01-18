/** biome-ignore-all lint/complexity/noThisInStatic: In static methods, this refers to the constructor (the subclass that invoked the method) when we want to refer to the subclass serviceName.
 *
 * NOTE: This file imports PLATFORM_CONFIG directly rather than using the PlatformProvider
 * because it contains static utility methods that are called from various contexts,
 * including non-React code. The configuration is compile-time constant, so direct
 * import is safe and ensures the methods work consistently regardless of React context.
 */
import { v4 as uuidv4 } from "uuid";
import { vscode } from "../utilities/vscode";

const encodeMessage:Function = <T>(message: T, _encoder: (_: T) => unknown) => message;
const decodeMessage:Function = <T>(message: any, _decoder: (_: { [key: string]: any }) => T) => message;

export interface Callbacks<TResponse> {
	onResponse: (response: TResponse) => void
	onError: (error: Error) => void
	onComplete: () => void
}

export abstract class ProtoBusClient {
	static serviceName: string;

	static async makeUnaryRequest<TRequest, TResponse>(
		methodName: string,
		request: TRequest,
		encodeRequest: (_: TRequest) => unknown,
		decodeResponse: (_: { [key: string]: any }) => TResponse,
	): Promise<TResponse> {
		return new Promise((resolve, reject) => {
			const requestId = uuidv4();

			// Set up one-time listener for this specific request
			const handleResponse = (event: MessageEvent) => {
				const message = event.data;
				if (message.type === "grpc_response" && message.grpc_response?.request_id === requestId) {
					// Remove listener once we get our response
					window.removeEventListener("message", handleResponse);
					if (message.grpc_response.message) {
						const response = decodeMessage(message.grpc_response.message, decodeResponse);
						resolve(response);
					} else if (message.grpc_response.error) {
						reject(new Error(message.grpc_response.error));
					} else {
						console.error("Received ProtoBus message with no response or error ", JSON.stringify(message));
					}
				}
			}

			window.addEventListener("message", handleResponse);
			vscode.postMessage({
				type: "grpc_request",
				grpc_request: {
					service: this.serviceName,
					method: methodName,
					message: encodeMessage(request, encodeRequest),
					request_id: requestId
				},
			});
		})
	}
}
