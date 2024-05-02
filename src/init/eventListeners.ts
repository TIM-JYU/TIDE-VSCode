import * as vscode from "vscode";
import ExtensionStateManager from "../api/ExtensionStateManager";
import UiController from "../ui/UiController";

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
    // TODO: Move .timdata checks here
    function fileOpened(document: vscode.TextDocument) {
        console.log("Text document opened:", document.fileName);
        UiController.showTaskPanel(document.fileName);
        // vscode.commands.executeCommand("tide.showTaskPanel", document.fileName);
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
