/**
 * Command registration for the extension.
 *
 * This module registers various commands for the extension, allowing users to interact with tasks,
 * courses, and settings. It includes commands for showing panels, managing user authentication, and handling task operations.
 *
 * @author Hannes Koivusipilä
 * @author Stella Palenius
 * @license MIT
 * @date 26.2.2024
 */

import * as vscode from "vscode";
import Logger from "../utilities/logger";
import Tide from "../api/tide";
import ExtensionStateManager from "../api/ExtensionStateManager";
import UiController from "../ui/UiController";
import path from "path";

export function registerCommands(ctx: vscode.ExtensionContext) {
	Logger.info("Registering commands.");
	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.hello-world", () => {
			vscode.window.setStatusBarMessage("Hello TIDE!");
		})
	);

	/**
	 * Opens VS Code settings and filters them to match with the extension.
	 */
	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.openSettings", () => {
			vscode.commands.executeCommand("workbench.action.openSettings", "TIM-IDE");
		})
	);

	/**
	 * Resets exercise.
	 */
	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.resetExercise", (taskSetPath, taskId, downloadPath) => {
			Tide.overwriteTask(taskSetPath, taskId, downloadPath);
		})
	);

	/**
	 * Opens task panel.
	 */
	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.showTaskPanel", async () => {
			let editor = vscode.window.activeTextEditor;

			readTimData(editor);
		})
	);

	/**
	 * Reads .timdata file from current active editor and opens the taskpanel with the data.
	 * If there is no .timdata file in current folder, tells UiController to open TaskPanel with "" as timdata.
	 * TaskPanel knows to show error message to user based when data is an empty string.
	 * @param editor - current active text editor
	 */
	async function readTimData(editor: vscode.TextEditor | undefined) {
		if (!editor) {
			return;
		}
		const currentFile = editor.document.fileName;
		const currentDirectory = vscode.Uri.file(path.dirname(currentFile));

		const lastIndex = currentFile.lastIndexOf("/");
		const submitPath = currentFile.substring(0, lastIndex + 1);

		try {
			// Read the content of the .timdata file.
			const timDataContent = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(currentDirectory, ".timdata"));
			// Convert the content to a string.
			const timDataString = timDataContent.toString();
			const timDataJson = JSON.parse(timDataString);

			// Create or show the TaskPanel and pass the .timdata content as a parameter.
			UiController.showTaskPanel(timDataJson, submitPath);
		} catch (error) {
			console.log(".timdata file doesn't exist in current directory or text editor is not active", error);
			UiController.showTaskPanel("", "");
		}
	}

	/**
	 * Opens My courses -view.
	 */
	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.showCourses", () => {
			getCoursesFromTide();
		})
	);

	/**
	 * Retrieves course data from TIDE, and tells the UiController to show CoursePanel with the data.
	 * @returns {Promise<void>} A promise that resolves once the course data is retrieved and processed.
	 */
	async function getCoursesFromTide() {
		let json_array: any[] = [];

		// Check if courses are available in global state.
		const coursesFromGlobalState = ExtensionStateManager.getCourses();
		if (coursesFromGlobalState.length > 0) {
			// If courses are available in global state, use them.
			json_array = coursesFromGlobalState;
		} else {
			// If courses are not available in global state, fetch them from TIDE.
			const data = await Tide.listCourses();
			json_array = JSON.parse(data);

			// Loops through each course in the JSON array.
			for (let course of json_array) {
				// Loops through each task set in the course.
				for (let taskSet of course.task_docs) {
					// Fetches task data for the current task set.
					const taskSetPath = taskSet.path;
					const taskData = await Tide.listTasksFromSet(taskSetPath);
					const tasks = JSON.parse(taskData);

					// Adds the fetched task data to the current task set.
					taskSet.tasks = tasks;
				}

				// Ensure that necessary properties are available in each course object.
				if (!("status" in course)) {
					course.status = "active";
				}
				if (!("expanded" in course)) {
					course.expanded = false;
				}
			}

			// Save fetched courses to global state for future use.
			ExtensionStateManager.setCourses(json_array);
		}

		//Show coursePanel.
		UiController.showCoursePanel();
	}

	/**
	 * Registers the 'tide.login' command, allowing users to log in to TIDE.
	 */
	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.login", async () => {
			let data = await Tide.login();
			ExtensionStateManager.setLoginData(data);
		})
	);

	/**
	 * Registers the 'tide.logout' command, allowing users to log out of TIDE.
	 */
	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.logout", async () => {
			let data = await Tide.logout();
			ExtensionStateManager.setLoginData(data);
		})
	);

	/**
	 * Registers the 'tide.downloadTaskSet' command, allowing users to download a task set from TIDE.
	 * @param taskSetPath - The path of the task set to download.
	 * @param downloadPath - The path where the task set will be downloaded.
	 */
	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.downloadTaskSet", (taskSetPath, downloadPath) => {
			Tide.downloadTaskSet(taskSetPath, downloadPath);
			ExtensionStateManager.setTaskSetDownloadPath(taskSetPath, downloadPath);
		})
	);

	/**
	 * Submits task to TIM
	 * @param submitPath - The path of the to be submitted task in user's computer.
	 */
	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.submitTask", (submitPath) => {
			Tide.submitTask(submitPath);
		})
	);

	/**
	 * Registers the 'tide.listCourses' command, allowing users to list courses from TIDE.
	 */
	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.listCourses", () => {
			Tide.listCourses();
		})
	);

	ctx.subscriptions.push(vscode.commands.registerCommand("tide.debug", () => {}));
}
