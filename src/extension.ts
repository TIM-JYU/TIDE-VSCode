import * as vscode from "vscode";
import * as init from "./init";
import Logger from "./utilities/logger";
import { SidebarProvider } from "./panels/SidebarProvider";
import ExtensionStateManager from "./api/ExtensionStateManager";

// This method is called when your extension is activated
export function activate(ctx: vscode.ExtensionContext) {
	Logger.init("TIDE Logs");
	Logger.show();
	ExtensionStateManager.setContext(ctx);
	init.registerCommands(ctx);

	// Creates and registers the side menu on the left
	const sidebarProvider = new SidebarProvider(ctx.extensionUri);
	ctx.subscriptions.push(vscode.window.registerWebviewViewProvider("tide-sidebar", sidebarProvider));

	const textEditor = vscode.window.onDidChangeActiveTextEditor(onDidChangeActiveTextEditor);
	ctx.subscriptions.push(textEditor);
}

function onDidChangeActiveTextEditor(editor: vscode.TextEditor | undefined) {
	if (editor) {
		const currentFile = editor.document.fileName;
		console.log("Currently opened file:", currentFile);
	} else {
		console.log("No file is currently opened.");
	}
}

//Listens to changes in configuration
vscode.workspace.onDidChangeConfiguration((event) => {
	if (event.affectsConfiguration("tide.fileDownloadPath")) {
		// Get the new value of tide.fileDownloadPath
		const newPath = vscode.workspace.getConfiguration().get("tide.fileDownloadPath");

		// Update ExtensionStateManager with the new path
		if (typeof newPath === "string") {
			ExtensionStateManager.setDownloadPath(newPath);
		} else {
			// Handle invalid or undefined newPath
			console.log("Undefined download path");
		}
	}
});

// This method is called when your extension is deactivated
export function deactivate() {}
