import * as vscode from "vscode";
import { getNonce } from "../utilities/getNonce";

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,

		// And restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, "out/compiled")],
	};
}

export default class TaskPanel {
	public static currentPanel: TaskPanel | undefined;

	public static readonly viewType = "TestPanel";

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri, timDataContent: string) {
		const column = vscode.ViewColumn.Two;

		// If we already have a panel, show it.
		if (TaskPanel.currentPanel) {
			TaskPanel.currentPanel._panel.reveal(column);
			TaskPanel.currentPanel._panel.webview.postMessage({ command: "updateTimData", data: timDataContent });
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(TaskPanel.viewType, "Task Panel", column || vscode.ViewColumn.Two, getWebviewOptions(extensionUri));

		TaskPanel.currentPanel = new TaskPanel(panel, extensionUri, timDataContent);
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, timDataContent: string) {
		TaskPanel.currentPanel = new TaskPanel(panel, extensionUri, timDataContent);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, timDataContent: string) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update(timDataContent);

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			(e) => {
				if (this._panel.visible) {
					this._update(timDataContent);
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(async (data) => {
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
			}
		});
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({ command: "refactor" });
	}

	public dispose() {
		TaskPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
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

	private _update(timDataContent: string) {
		const webview = this._panel.webview;
		this._panel.webview.html = this._getHtmlForWebview(webview);
		this._panel?.webview.postMessage({ type: "updateTimData", value: timDataContent });
		console.log(timDataContent);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));

		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out", "compiled/TaskPanel.js"));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out", "compiled/TaskPanel.css"));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <!--
                Use a content security policy to only allow loading images from https or from our extension directory,
                and only allow scripts that have a specific nonce.
    -->
    <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleResetUri}" rel="stylesheet">
            <link href="${styleVSCodeUri}" rel="stylesheet">
    <link href="${styleMainUri}" rel="stylesheet">
    <script nonce="${nonce}">
    const tsvscode = acquireVsCodeApi();
    </script>
        </head>
  <body>
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
	}
}
