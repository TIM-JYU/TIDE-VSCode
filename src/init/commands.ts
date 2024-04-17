import * as vscode from "vscode";
import Logger from "../utilities/logger";
import Tide from "../api/tide";
import TestPanel from "../panels/TestPanel";
import CoursePanel from "../panels/CoursePanel";
import TaskPanel from "../panels/TaskPanel";

export function registerCommands(ctx: vscode.ExtensionContext) {
	Logger.info("Registering commands.");
	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.hello-world", () => {
			vscode.window.setStatusBarMessage("Hello TIDE!");
			TestPanel.createOrShow(ctx.extensionUri);
		})
	);

	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.openSettings", () => {
			vscode.commands.executeCommand("workbench.action.openSettings", "TIDE-extension");
		})
	);

	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.showTaskPanel", () => {
			TaskPanel.createOrShow(ctx.extensionUri);
		})
	);

	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.showCourses", () => {
			CoursePanel.createOrShow(ctx.extensionUri);
			getCoursesFromTide();
		})
	);

	async function getCoursesFromTide() {
		const coursePanel = CoursePanel.createOrShow(ctx.extensionUri);
		console.log("Täällä commandseissa ollaan");
		const data = await Tide.listCourses();
		let json_array = JSON.parse(data);
		if (!coursePanel) {
			console.log("!coursePanel tökkää tähän if lauseeseen");
			return;
		}

		let modified_json_array = json_array.map((course: any) => {
			// Add 'status' and 'expanded' attributes if they are not present
			if (!("status" in course)) {
				course.status = "active";
			}
			if (!("expanded" in course)) {
				course.expanded = false;
			}
			return course;
		});

		coursePanel.sendCourseListMessage(modified_json_array);
	}

	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.login", () => {
			Tide.login();
		})
	);

	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.logout", () => {
			Tide.logout();
		})
	);

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
