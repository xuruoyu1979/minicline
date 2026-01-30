import { ApiHandler } from "@/core/api";
import { TaskState } from "./TaskState";
import * as vscode from "vscode";
import { ToolUse } from "@/core/assistant-message";
import { ToolExecutorCoordinator } from "./tools/ToolExecutorCoordinator";
import { TaskConfig } from "./TaskConfig";
import { WriteToFileToolHandler } from "./tools/handlers/WriteToFileToolHandler";
import { AttemptCompletionHandler } from "./tools/handlers/AttemptCompletionHandler";

export class ToolExecutor {
	private coordinator: ToolExecutorCoordinator;

	constructor(
		// Core Services & Managers
		private context: vscode.ExtensionContext,
		private taskState: TaskState,
		private api: ApiHandler,
		// Configuration & Settings

		private cwd: string,
		private taskId: string,
		private updateFCListFromToolResponse: (taskProgress: string | undefined) => Promise<void>,
	) {
		// Initialize the coordinator and register all tool handlers
		this.coordinator = new ToolExecutorCoordinator();
		this.registerToolHandlers();
	}

	/**
	 * Register all tool handlers with the coordinator
	 */
	private registerToolHandlers(): void {
		// const validator = new ToolValidator(this.clineIgnoreController);

		// // Register all tool handlers
		// this.coordinator.register(new ListFilesToolHandler(validator));
		// this.coordinator.register(new ReadFileToolHandler(validator));

		// Register WriteToFileToolHandler for all three file tools with proper typing
		this.coordinator.register(new WriteToFileToolHandler()); // registers as "write_to_file" (ClineDefaultTool.FILE_NEW)
		this.coordinator.register(new AttemptCompletionHandler());
	}

	/**
	 * Main entry point for tool execution - called by Task class
	 */
	public async executeTool(block: ToolUse): Promise<void> {
		await this.execute(block);
	}

	// Create a properly typed TaskConfig object for handlers
	// NOTE: modifying this object in the tool handlers is okay since these are all references to the singular ToolExecutor instance's variables. However, be careful modifying this object assuming it will update the ToolExecutor instance, e.g. config.browserSession = ... will not update the ToolExecutor.browserSession instance variable. Use applyLatestBrowserSettings() instead.
	private asToolConfig(): TaskConfig {
		const config: TaskConfig = {
			taskId: this.taskId,
			context: this.context,
			cwd: this.cwd,
			taskState: this.taskState,
			api: this.api,
			coordinator: this.coordinator,
			vscodeTerminalExecutionMode: "vscodeTerminal",
			enableParallelToolCalling: false
		};

		return config;
	}

	/**
	 * Execute a tool through the coordinator if it's registered.
	 *
	 * This is the main entry point for tool execution, called by the Task class.
	 * It handles:
	 * - Checking if the tool is registered with the coordinator
	 * - Validating tool execution is allowed (not rejected, not already used, etc.)
	 * - Enforcing plan mode restrictions on file modification tools
	 * - Delegating to partial or complete block handlers
	 * - Error handling and checkpointing
	 *
	 * @param block The tool use block to execute
	 * @returns true if the tool was handled (even if execution failed), false if not registered
	 */
	private async execute(block: ToolUse): Promise<boolean> {
		// Note: MCP tool name transformation happens earlier in ToolUseHandler.getPartialToolUsesAsContent()
		// The toolUseIdMap is updated at the point of transformation in index.ts
		if (!this.coordinator.has(block.name)) {
			return false; // Tool not handled by coordinator
		}

		const config = this.asToolConfig();

		try {
			// Handle complete blocks
			await this.handleCompleteBlock(block, config);
			return true;
		} catch (error) {
			console.log(`executing ${block.name}`, error as Error, block);
			return true;
		}
	}

	/**
	 * Handle complete block execution.
	 *
	 * This is the main execution flow for a tool:
	 * 1. Execute the actual tool (tool handlers now run PreToolUse hooks post-approval)
	 * 2. Run PostToolUse hooks (if enabled) - cannot block, only observe
	 * 3. Add hook context modifications to the conversation
	 * 4. Update focus chain tracking
	 *
	 * Note: PreToolUse hooks are now executed by individual tool handlers after approval
	 * and before the actual tool operation. This provides better UX as approval dialogs
	 * appear immediately without hook execution delay.
	 *
	 * PostToolUse hooks are for observation/logging only and cannot block.
	 *
	 * @param block The complete tool use block with all parameters
	 * @param config The task configuration containing all necessary context
	 */
	private async handleCompleteBlock(block: ToolUse, config: any): Promise<void> {
		// Check abort flag at the very start to prevent execution after cancellation
		if (this.taskState.abort) {
			return;
		}

		let executionSuccess = true;

		try {
			// Execute the actual tool
			const toolResult = await this.coordinator.execute(config, block);
			this.pushToolResult(toolResult, block);
		} catch (error) {
			executionSuccess = false;
			// Re-throw the error after PostToolUse completes
			throw error;
		}

		// Handle focus chain updates
		await this.updateFCListFromToolResponse(block.params.task_progress);
	}

	/**
	 * Pushes a tool result to the user message content.
	 *
	 * This is a critical method that:
	 * - Formats the tool result appropriately for the API
	 * - Adds it to the conversation context
	 * - Marks that a tool has been used in this turn
	 *
	 * @param content The tool response content to add
	 * @param block The tool use block that generated this result
	 */
	private pushToolResult = (content: string, block: ToolUse) => {
		if (typeof content === "string") {
			const resultText = content || "(tool did not return anything)";
			let description = "";
			if (this.coordinator.has(block.name)) {
				const handler = this.coordinator.getHandler(block.name);
				description = handler ? handler.getDescription(block) : block.name;
			}
			// Create ToolResultBlockParam with description and result
			this.taskState.userMessageContent.push(
				{
					type: "text",
					text: `${description} Result:\n${resultText}`,
				});
		}
	};
}