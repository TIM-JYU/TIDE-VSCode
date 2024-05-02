import * as vscode from "vscode";
import ExtensionStateManager from "../api/ExtensionStateManager";
import UiController from "../ui/UiController";
import * as path from "path";

export function registerEventListeners(ctx: vscode.ExtensionContext) {
	const textDocumentListener = vscode.workspace.onDidOpenTextDocument(fileOpened);
	ctx.subscriptions.push(textDocumentListener);

	const textEditor = vscode.window.onDidChangeActiveTextEditor(onDidChangeActiveTextEditor);
	ctx.subscriptions.push(textEditor);

	function onDidChangeActiveTextEditor(editor: vscode.TextEditor | undefined) {
		if (editor) {
			const currentFile = editor.document.fileName;
			console.log("Currently opened file:", currentFile);
		} else {
			console.log("No file is currently opened.");
		}
	}

	// TODO: Fix things
	// TODO: Fix showTaskPanel from commands.ts
	async function fileOpened(document: vscode.TextDocument) {
		console.log("Text document opened:", document.fileName);
		const currentFile = document.fileName;
		const currentDirectory = vscode.Uri.file(path.dirname(currentFile));

		const lastIndex = currentFile.lastIndexOf("/");
		const submitPath = currentFile.substring(0, lastIndex + 1);

		try {
			// Read the content of the .timdata file
			const timDataContent = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(currentDirectory, ".timdata"));
			// Convert the content to a string
			const timDataString = timDataContent.toString();
			const timDataJson = JSON.parse(timDataString);

			// Dispose any existing TaskPanel
			UiController.closeTaskPanel();

			// Create or show the TaskPanel and pass the .timdata content as a parameter
			UiController.showTaskPanel(timDataJson, submitPath);
		} catch (error) {
			console.log(".timdata file doesn't exist in current directory", error);
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
}
