import * as vscode from "vscode";
import TaskPanel from "./panels/TaskPanel";
import CoursePanel from "./panels/CoursePanel";

export default class UiController {
	private static ctx: vscode.ExtensionContext;

	static init(ctx: vscode.ExtensionContext) {
		this.ctx = ctx;
	}

	static showTaskPanel(timDataJson: string, submitPath: string) {
		// Create or show the TaskPanel and pass the .timdata content as a parameter
		TaskPanel.createOrShow(this.ctx.extensionUri, timDataJson, submitPath);
	}

	static closeTaskPanel() {
		TaskPanel.dispose();
	}

	static showCoursePanel(json_array: any) {
		CoursePanel.createOrShow(this.ctx.extensionUri, json_array);
	}
}
