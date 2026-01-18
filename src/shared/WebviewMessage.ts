/* eslint-disable @typescript-eslint/naming-convention */
export interface WebviewMessage {
	type: "grpc_request"
	grpc_request?: GrpcRequest
}

export type GrpcRequest = {
	service: string
	method: string
	message: any // JSON serialized protobuf message
	request_id: string // For correlating requests and responses
};