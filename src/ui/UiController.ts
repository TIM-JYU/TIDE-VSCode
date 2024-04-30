import * as vscode from 'vscode';
import * as path from "path";
import TaskPanel from './panels/TaskPanel';

export default class UiController {
    private static ctx: vscode.ExtensionContext;

    static init(ctx: vscode.ExtensionContext) {
        this.ctx = ctx;
    }

    static async showTaskPanel(currentFile: string) {
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
            TaskPanel.dispose();

            // Create or show the TaskPanel and pass the .timdata content as a parameter
            TaskPanel.createOrShow(this.ctx.extensionUri, timDataJson, submitPath);
        } catch (error) {
            console.log("Error occurred while checking for .timdata file:", error);
        }
    }

}
