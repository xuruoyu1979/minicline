import { ApiHandler } from "@/core/api";
import { TaskState } from "./TaskState";
import { ToolExecutorCoordinator } from "./tools/ToolExecutorCoordinator";
import * as vscode from "vscode";

/**
 * Strongly-typed configuration object passed to tool handlers
 */
export interface TaskConfig {
	// Core identifiers
	taskId: string
	cwd: string

	vscodeTerminalExecutionMode: "vscodeTerminal" | "backgroundExec"
	enableParallelToolCalling: boolean
	context: vscode.ExtensionContext

	// State management
	taskState: TaskState

	// API and services
	api: ApiHandler
	coordinator: ToolExecutorCoordinator
}