import * as vscode from "vscode";
import Logger from "../utilities/logger";
import Tide from "../api/tide";
import TestPanel from "../panels/TestPanel";
import CoursePanel from "../panels/CoursePanel";
import TaskPanel from "../panels/TaskPanel";
import ExtensionStateManager from "../api/ExtensionStateManager";
import * as path from "path";

export function registerCommands(ctx: vscode.ExtensionContext) {
	Logger.info("Registering commands.");
	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.hello-world", () => {
			vscode.window.setStatusBarMessage("Hello TIDE!");
			TestPanel.createOrShow(ctx.extensionUri);
		})
	);

	/**
	 * Opens VS Code settings and filters them to match with the extension.
	 */
	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.openSettings", () => {
			vscode.commands.executeCommand("workbench.action.openSettings", "TIDE-extension");
		})
	);

	/**
	 * Opens task panel.
	 */
	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.showTaskPanel", async (currentFile) => {
			const currentDirectory = vscode.Uri.file(path.dirname(currentFile));

			try {
				// Read the content of the .timdata file
				const timDataContent = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(currentDirectory, ".timdata"));
				// Convert the content to a string
				const timDataString = timDataContent.toString();
				const timDataJson = JSON.parse(timDataString);

				// Dispose any existing TaskPanel
				TaskPanel.dispose();

				// Create or show the TaskPanel and pass the .timdata content as a parameter
				TaskPanel.createOrShow(ctx.extensionUri, timDataJson);
			} catch (error) {
				console.log("Error occurred while checking for .timdata file:", error);
			}
		})
	);

	/**
	 * Opens My courses -view.
	 */
	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.showCourses", () => {
			CoursePanel.createOrShow(ctx.extensionUri);
			getCoursesFromTide();
		})
	);

	/**
	 * Retrieves course data from TIDE, and sends a message with the course list to coursePanel.
	 * @returns {Promise<void>} A promise that resolves once the course data is retrieved and processed.
	 */
	async function getCoursesFromTide() {
		const coursePanel = CoursePanel.createOrShow(ctx.extensionUri);
		let json_array: any[] = [];

		// Check if courses are available in global state
		const coursesFromGlobalState = ExtensionStateManager.getCourses();
		if (coursesFromGlobalState.length > 0) {
			// If courses are available in global state, use them
			json_array = coursesFromGlobalState;
			console.log("Kurssit löytyy jo");
		} else {
			// If courses are not available in global state, fetch them from TIDE
			console.log("Haetaan kurssit tidestä");
			const data = await Tide.listCourses();
			json_array = JSON.parse(data);

			// Loops through each course in the JSON array
			for (let course of json_array) {
				// Loops through each task set in the course
				for (let taskSet of course.task_docs) {
					// Fetches task data for the current task set
					const taskSetPath = taskSet.path;
					const taskData = await Tide.listTasksFromSet(taskSetPath);
					const tasks = JSON.parse(taskData);

					// Adds the fetched task data to the current task set
					taskSet.tasks = tasks;
				}

				// Ensure that necessary properties are available in each course object
				if (!("status" in course)) {
					course.status = "active";
				}
				if (!("expanded" in course)) {
					course.expanded = false;
				}
			}

			// Save fetched courses to global state for future use
			ExtensionStateManager.setCourses(json_array);
		}

		// Send the course list message to the CoursePanel
		coursePanel.sendCourseListMessage(json_array);
	}

	/**
	 * Registers the 'tide.login' command, allowing users to log in to TIDE.
	 */
	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.login", () => {
			Tide.login();
		})
	);

	/**
	 * Registers the 'tide.logout' command, allowing users to log out of TIDE.
	 */
	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.logout", () => {
			Tide.logout();
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

	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.debug", () => {
			Tide.debug();
		})
	);
}
