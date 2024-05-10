import * as vscode from "vscode";
import ExtensionStateManager from "../api/ExtensionStateManager";

export function registerEventListeners(ctx: vscode.ExtensionContext) {
	let lastActiveEditor: vscode.TextEditor | undefined;

	/**
	 * Listens to changes of active text editor.
	 * Last active editor check ensures that if user closes taskpanel it won't open again
	 * when user activates or clicks the text document next to it right after closing.
	 * If they click another text document open, the task panel opens.
	 */
	const textEditorListener = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
		if (editor && editor !== lastActiveEditor) {
			lastActiveEditor = editor;

			vscode.commands.executeCommand("tide.showTaskPanel");
		}
	});
	ctx.subscriptions.push(textEditorListener);

	/**
	 * Listens to changes in configuration
	 */
	vscode.workspace.onDidChangeConfiguration((event) => {
		if (event.affectsConfiguration("TIM-IDE.fileDownloadPath")) {
			// Get the new value of fileDownloadPath
			const newPath = vscode.workspace.getConfiguration().get("TIM-IDE.fileDownloadPath");

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
