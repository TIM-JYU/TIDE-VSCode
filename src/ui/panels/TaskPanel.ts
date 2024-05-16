/**
 * A panel for displaying task information.
 *
 * @author Hannes Koivusipilä
 * @author Stella Palenius
 * @license MIT
 * @date 2.5.2024
 */
import * as vscode from "vscode";
import { getDefaultHtmlForWebview, getWebviewOptions } from "../utils";
import ExtensionStateManager from "../../api/ExtensionStateManager";
import { LoginData } from "../../common/types";
import { MessageType } from "../../common/messages";

export default class TaskPanel {
	public static currentPanel: TaskPanel | undefined;
	private timData: string = "";
	private submitPath: string = "";

	private static readonly fileNamePrefix = "TaskPanel";
	private static readonly viewType = "TaskPanel";
	private static readonly panelTitle = "Task Panel";
	private static preferredColumn = vscode.ViewColumn.Two;

	private readonly panel: vscode.WebviewPanel;
	private readonly extensionUri: vscode.Uri;
	private disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri, timDataContent: string, currentDirectory: string) {
		const column = vscode.ViewColumn.Two;

		// If we already have a panel, show it.
		if (TaskPanel.currentPanel) {
			TaskPanel.currentPanel.submitPath = currentDirectory;
			TaskPanel.currentPanel.timData = timDataContent;
			TaskPanel.currentPanel.update(TaskPanel.currentPanel.timData, currentDirectory); // Update the panel with the new timDataContent
			TaskPanel.currentPanel.panel.webview.postMessage({ command: "updateTimData", data: timDataContent });
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			this.viewType,
			this.panelTitle,
			{
				viewColumn: vscode.ViewColumn.Beside,
				preserveFocus: true,
			},
			getWebviewOptions(extensionUri)
		);
		TaskPanel.currentPanel = new TaskPanel(panel, extensionUri, timDataContent, currentDirectory);
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, timDataContent: string, currentDirectory: string) {
		TaskPanel.currentPanel = new TaskPanel(panel, extensionUri, timDataContent, currentDirectory);
	}

    private sendLoginData(loginData: LoginData) {
        this.panel.webview.postMessage({
            type: MessageType.LoginData,
            value: loginData
        })
    }

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, timData: string, currentDirectory: string) {
		this.panel = panel;
		this.extensionUri = extensionUri;
		this.timData = timData;
		this.submitPath = currentDirectory;
        
        // subscribe to changes in login data
		this.disposables.push(ExtensionStateManager.subscribe("loginData", this.sendLoginData.bind(this)));

		// Set the webview's initial html content.
		this.update(this.timData, this.submitPath);

		// Listen for when the panel is disposed.
		// This happens when the user closes the panel or when the panel is closed programmatically.
		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

		// Update the content based on view changes.
		this.panel.onDidChangeViewState(
			(e) => {
				if (this.panel.visible) {
					this.update(this.timData, this.submitPath);
				}
			},
			null,
			this.disposables
		);

		// Handle messages from the webview.
		this.panel.webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case "onInfo": {
					if (!data.value) {
						return;
					}
					vscode.window.showInformationMessage(data.value);
					break;
				}
				case "onError": {
					if (!data.value) {
						return;
					}
					vscode.window.showErrorMessage(data.value);
					break;
				}
				case "submitTask": {
					console.log(currentDirectory);
					vscode.commands.executeCommand("tide.submitTask", this.submitPath);
					break;
				}
				case "showOutput": {
					vscode.commands.executeCommand("workbench.action.output.toggleOutput");
					vscode.commands.executeCommand("workbench.action.focusFirstEditorGroup");
					break;
				}
				case "resetExercise": {
					vscode.window.showInformationMessage("Are you sure you want to reset exercise? All unsubmitted changes will be lost.", "Continue", "Cancel").then((answer) => {
						if (answer === "Continue") {
							let taskSetPath = data.path;
							let taskId = data.taskId;
							let fileLocation = ExtensionStateManager.getTaskSetDownloadPath(taskSetPath);
							vscode.commands.executeCommand("tide.resetExercise", taskSetPath, taskId, fileLocation);
						}
					});
					break;
				}
                case MessageType.RequestLoginData: {
                    this.sendLoginData(ExtensionStateManager.getLoginData())
                }
			}
		});
	}

	public dispose() {
		TaskPanel.currentPanel = undefined;

		// Clean up our resources
		this.panel.dispose();

		while (this.disposables.length) {
			const x = this.disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	public static dispose() {
		if (TaskPanel.currentPanel) {
			TaskPanel.currentPanel.dispose();
			TaskPanel.currentPanel = undefined;
		}
	}

	private update(timDataContent: string, currentDirectory: string) {
		const webview = this.panel.webview;
		this.panel.webview.html = this.getHtmlForWebview(webview);
		this.panel.webview.postMessage({ type: "updateTimData", value: timDataContent });
	}

	private getHtmlForWebview(webview: vscode.Webview) {
		return getDefaultHtmlForWebview(webview, this.extensionUri, TaskPanel.fileNamePrefix);
	}
}
