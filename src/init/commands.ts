import * as vscode from "vscode";
import Logger from "../utilities/logger";
import Tide from "../api/tide";
import TestPanel from "../panels/TestPanel";
import CoursePanel from "../panels/CoursePanel";
import SettingsPanel from "../panels/SettingsPanel";
import ExtensionStateManager from "../api/ExtensionStateManager";

export function registerCommands(ctx: vscode.ExtensionContext) {
	Logger.info("Registering commands.");
	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.hello-world", () => {
			vscode.window.setStatusBarMessage("Hello TIDE!");
			TestPanel.createOrShow(ctx.extensionUri);
		})
	);

	ctx.subscriptions.push(
		vscode.commands.registerCommand("tide.showCourses", () => {
			CoursePanel.createOrShow(ctx.extensionUri);
		})
	);

    ctx.subscriptions.push(
        vscode.commands.registerCommand("tide.showSettings", () => {
            SettingsPanel.createOrShow(ctx.extensionUri);
        })
    );

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
        vscode.commands.registerCommand('tide.debug', () => {
            Logger.debug(ExtensionStateManager.getCliPath());
        })
    );
	// "commands": [
	//   {
	//     "command": "tide.login",
	//     "title": "Login"
	//   },
	//   {
	//     "command": "tide.logout",
	//     "title": "Log out"
	//   },
	//   {
	//     "command": "tide.list",
	//     "title": "List Available Courses"
	//   },
	//   {
	//     "command": "tide.pull",
	//     "title": "Pull either all tasks for a course or a specific task."
	//   },
	//   {
	//     "command": "tide.push",
	//     "title": "Push either all tasks for a course or a specific task."
	//   }
	// ]
}
