import { NewTaskRequest } from "@/shared/proto/minicline/task";
import { Controller } from "..";
import { String } from "@shared/proto/minicline/common";

/**
 * Creates a new task with the given text and optional images
 * @param controller The controller instance
 * @param request The new task request containing text and optional images, and optional task settings
 * @returns Empty response
 */
export async function newTask(controller: Controller, request: NewTaskRequest): Promise<String> {
    console.log(request);
    const taskId = await controller.initTask(request.model, request.text);
	return String.create({ value: taskId || "" });
}