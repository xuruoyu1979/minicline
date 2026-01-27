import * as vscode from "vscode";
import os from "os";
import { Task } from "./task";

export class Controller {
	task?: Task;

    constructor(readonly context: vscode.ExtensionContext) {
    }

    async initTask(model?: string, task?: string): Promise<string> {

        const cwd = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : os.homedir();
        const taskId = Date.now().toString();

        this.task = new Task(
            this,
            model ? model : "",
            task ? task : "",
            taskId,
            cwd
        );

        await this.task.startTask();

        return this.task.taskId;
    }
}