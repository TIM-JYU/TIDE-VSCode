import * as vscode from "vscode";
import { getDefaultHtmlForWebview, getWebviewOptions } from "../utils";

export default class TaskPanel {
	public static currentPanel: TaskPanel | undefined;

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
			TaskPanel.currentPanel.panel.reveal(column);
			TaskPanel.currentPanel.panel.webview.postMessage({ command: "updateTimData", data: timDataContent });
			return;
		}

		// Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(this.viewType, this.panelTitle, this.preferredColumn, getWebviewOptions(extensionUri));


		TaskPanel.currentPanel = new TaskPanel(panel, extensionUri, timDataContent, currentDirectory);
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, timDataContent: string, currentDirectory: string) {
		TaskPanel.currentPanel = new TaskPanel(panel, extensionUri, timDataContent, currentDirectory);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, timDataContent: string, currentDirectory: string) {
		this.panel = panel;
		this.extensionUri = extensionUri;

		// Set the webview's initial html content
		this.update(timDataContent, currentDirectory);

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

		// Update the content based on view changes
		this.panel.onDidChangeViewState(
			(e) => {
				if (this.panel.visible) {
					this.update(timDataContent, currentDirectory);
				}
			},
			null,
			this.disposables
		);

		// Handle messages from the webview
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
					vscode.commands.executeCommand("tide.submitTask", currentDirectory);
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
		this.panel?.webview.postMessage({ type: "updateTimData", value: timDataContent });
	}

    private getHtmlForWebview(webview: vscode.Webview) {
        return getDefaultHtmlForWebview(webview, this.extensionUri, TaskPanel.fileNamePrefix);
	}

}
