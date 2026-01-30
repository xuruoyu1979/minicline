import type { ToolUse } from "@core/assistant-message";
import { MiniClineDefaultTool } from "@/shared/tools";
import { TaskConfig } from "../TaskConfig";

export interface IToolHandler {
	readonly name: MiniClineDefaultTool
	execute(config: TaskConfig, block: ToolUse): Promise<string>
	getDescription(block: ToolUse): string
}

export interface IPartialBlockHandler {
	handlePartialBlock(block: ToolUse): Promise<void>
}

export interface IFullyManagedTool extends IToolHandler {
	// Marker interface for tools that handle their own complete approval flow
}

/**
 * A wrapper class that allows a single tool handler to be registered under multiple names.
 * This provides proper typing for tools that share the same implementation logic.
 */
export class SharedToolHandler implements IFullyManagedTool {
	constructor(
		public readonly name: MiniClineDefaultTool,
		private baseHandler: IFullyManagedTool,
	) {}

	getDescription(block: ToolUse): string {
		return this.baseHandler.getDescription(block);
	}

	async execute(config: TaskConfig, block: ToolUse): Promise<string> {
		return this.baseHandler.execute(config, block);
	}
}

/**
 * Coordinates tool execution by routing to registered handlers.
 * Falls back to legacy switch for unregistered tools.
 */
export class ToolExecutorCoordinator {
	private handlers = new Map<string, IToolHandler>();

	/**
	 * Register a tool handler
	 */
	register(handler: IToolHandler): void {
		this.handlers.set(handler.name, handler);
	}

	/**
	 * Check if a handler is registered for the given tool
	 */
	has(toolName: string): boolean {
		return this.handlers.has(toolName);
	}

	/**
	 * Get a handler for the given tool name
	 */
	getHandler(toolName: string): IToolHandler | undefined {
		return this.handlers.get(toolName);
	}

	/**
	 * Execute a tool through its registered handler
	 */
	async execute(config: TaskConfig, block: ToolUse): Promise<string> {
		const handler = this.handlers.get(block.name);
		if (!handler) {
			throw new Error(`No handler registered for tool: ${block.name}`);
		}
		return handler.execute(config, block);
	}
}
