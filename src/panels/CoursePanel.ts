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

export default class CoursePanel {
	public static currentPanel: CoursePanel | undefined;

	public static readonly viewType = "TestPanel";

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

		// If we already have a panel, show it.
		if (CoursePanel.currentPanel) {
			CoursePanel.currentPanel._panel.reveal(column);
			return CoursePanel.currentPanel;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(CoursePanel.viewType, "My Courses", column || vscode.ViewColumn.One, getWebviewOptions(extensionUri));

		CoursePanel.currentPanel = new CoursePanel(panel, extensionUri);

		// Send initial file download folder to the webview
		CoursePanel.currentPanel.sendInitialPath();

		return CoursePanel.currentPanel;
	}

	private sendInitialPath() {
		const initialPath = vscode.workspace.getConfiguration().get("tide.fileDownloadPath");
		this._panel.webview.postMessage({
			command: "setPathResult",
			path: initialPath ? initialPath : null,
		});
	}

	public sendCourseListMessage(json_array: any) {
		console.log("Tänne tultiin");
		console.log(json_array);
		this._panel?.webview.postMessage({ type: "json", value: json_array });
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		CoursePanel.currentPanel = new CoursePanel(panel, extensionUri);

		const path = vscode.workspace.getConfiguration().get("tide.fileDownloadPath");
		CoursePanel.currentPanel.sendInitialPath();

		vscode.workspace.onDidChangeConfiguration(() => {
			CoursePanel.currentPanel?._updateFolderPath();
		});
	}

	private async _updateFolderPath() {
		const configuration = vscode.workspace.getConfiguration();
		const newPath = configuration.get("tide.fileDownloadPath");
		await this._panel.webview.postMessage({
			command: "updatePath",
			path: newPath,
		});
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			(e) => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case "onError": {
					if (!data.value) {
						return;
					}
					vscode.window.showErrorMessage(data.value);
					break;
				}
				case "setPath": {
					const newPath = await vscode.window.showOpenDialog({
						canSelectFiles: false,
						canSelectFolders: true,
						canSelectMany: false,
						openLabel: "Select folder",
					});
					// Send the selected path back to the webview
					this._panel.webview.postMessage({
						command: "setPathResult",
						path: newPath ? newPath[0].fsPath : null,
					});
					vscode.workspace.getConfiguration().update("tide.fileDownloadPath", newPath ? newPath[0].fsPath : null, vscode.ConfigurationTarget.Global);
					return;
				}
				case "downloadTaskSet": {
					const taskSetPath = data.taskSetPath;
					const downloadPath = vscode.workspace.getConfiguration().get("tide.fileDownloadPath");
					console.log("Downloading task set:", taskSetPath);
					vscode.commands.executeCommand("tide.downloadTaskSet", taskSetPath, downloadPath);
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
		CoursePanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
		const webview = this._panel.webview;
		this._panel.webview.html = this._getHtmlForWebview(webview);
		const path = vscode.workspace.getConfiguration().get("tide.fileDownloadPath");
		this._panel.webview.postMessage({
			command: "setPathResult",
			path: path ? path : null,
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));

		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out", "compiled/courses.js"));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out", "compiled/courses.css"));

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
