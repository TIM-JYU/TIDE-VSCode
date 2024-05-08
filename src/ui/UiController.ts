import * as vscode from "vscode";
import TaskPanel from "./panels/TaskPanel";
import CoursePanel from "./panels/CoursePanel";

export default class UiController {
	private static ctx: vscode.ExtensionContext;

	static init(ctx: vscode.ExtensionContext) {
		this.ctx = ctx;
	}

	/**
	 * Creates or shows task panel.
	 * @param timDataJson - .timdata file from the task
	 * @param submitPath - the path that is needed if answer is submitted
	 */
	static showTaskPanel(timDataJson: string, submitPath: string) {
		// Create or show the TaskPanel and pass the .timdata content as a parameter
		TaskPanel.createOrShow(this.ctx.extensionUri, timDataJson, submitPath);
	}

	/**
	 * Closes the task panel.
	 */
	static closeTaskPanel() {
		TaskPanel.dispose();
	}

	/**
	 * Creates or shows the course panel, and closes the task panel.
	 * @param json_array - JSON data of TIM-IDE courses
	 */
	static showCoursePanel(json_array: any) {
		this.closeTaskPanel();
		CoursePanel.createOrShow(this.ctx.extensionUri, json_array);
	}
}
