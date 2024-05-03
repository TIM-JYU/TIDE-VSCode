import * as vscode from "vscode";
import ExtensionStateManager from "../api/ExtensionStateManager";
import UiController from "../ui/UiController";
import * as path from "path";

export function registerEventListeners(ctx: vscode.ExtensionContext) {
	let lastActiveEditor: vscode.TextEditor | undefined;

	const textEditorListener = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
		if (editor && editor !== lastActiveEditor) {
			// Update last active editor
			lastActiveEditor = editor;

			console.log("Text document opened:", editor.document.fileName);

			const currentFile = editor.document.fileName;
			const currentDirectory = vscode.Uri.file(path.dirname(currentFile));

			const lastIndex = currentFile.lastIndexOf("/");
			const submitPath = currentFile.substring(0, lastIndex + 1);

			try {
				// Read the content of the .timdata file
				const timDataContent = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(currentDirectory, ".timdata"));
				// Convert the content to a string
				const timDataString = timDataContent.toString();
				const timDataJson = JSON.parse(timDataString);

				// Create or show the TaskPanel and pass the .timdata content as a parameter
				UiController.showTaskPanel(timDataJson, submitPath);
			} catch (error) {
				console.log(".timdata file doesn't exist in current directory", error);
				UiController.closeTaskPanel();
			}
		}
	});
	ctx.subscriptions.push(textEditorListener);

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
}
