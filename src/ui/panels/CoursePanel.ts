import * as vscode from "vscode";
import ExtensionStateManager from "../../api/ExtensionStateManager";
import { getDefaultHtmlForWebview, getWebviewOptions } from "../utils";

export default class CoursePanel {
	public static currentPanel: CoursePanel | undefined;

    private static readonly fileNamePrefix = "courses";
	private static readonly viewType = "Courses";
    private static readonly panelTitle = "My Courses";
    private static preferredColumn = vscode.ViewColumn.One;

	private readonly panel: vscode.WebviewPanel;
	private readonly extensionUri: vscode.Uri;
	private disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		// If we already have a panel, show it.
		if (CoursePanel.currentPanel) {
			CoursePanel.currentPanel.panel.reveal(this.preferredColumn);
			return CoursePanel.currentPanel;
		}

		// Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(this.viewType, this.panelTitle, this.preferredColumn, getWebviewOptions(extensionUri));


		CoursePanel.currentPanel = new CoursePanel(panel, extensionUri);

		// Send initial file download folder to the webview
		CoursePanel.currentPanel.sendInitialPath();

		return CoursePanel.currentPanel;
	}

	private sendInitialPath() {
		const initialPath = vscode.workspace.getConfiguration().get("tide.fileDownloadPath");
		this.panel.webview.postMessage({
			command: "setPathResult",
			path: initialPath ? initialPath : null,
		});
	}

	public sendCourseListMessage(json_array: any) {
		let courses_array = ExtensionStateManager.getCourses();
		this.panel?.webview.postMessage({ type: "json", value: courses_array });
		//this._panel?.webview.postMessage({ type: "json", value: json_array });
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		CoursePanel.currentPanel = new CoursePanel(panel, extensionUri);

		const path = vscode.workspace.getConfiguration().get("tide.fileDownloadPath");
		CoursePanel.currentPanel.sendInitialPath();
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this.panel = panel;
		this.extensionUri = extensionUri;

		// Set the webview's initial html content
		this.update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

		// Update the content based on view changes
		this.panel.onDidChangeViewState(
			(e) => {
				if (this.panel.visible) {
					this.update();
				}
			},
			null,
			this.disposables
		);

		// Handle messages from the webview
		this.panel.webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case "onError": {
					if (!data.value) {
						return;
					}
					vscode.window.showErrorMessage(data.value);
					break;
				}
				case "setPath": {
					let newPath: vscode.Uri[] | undefined = await vscode.window.showOpenDialog({
						canSelectFiles: false,
						canSelectFolders: true,
						canSelectMany: false,
						openLabel: "Select directory",
					});
					// If newPath is undefined or user cancels, get the previous path from global state
					if (!newPath) {
						const previousPath = ExtensionStateManager.getDownloadPath();
						if (previousPath) {
							newPath = [vscode.Uri.file(previousPath)];
						}
					}
					// Send the selected path back to the webview
					this.panel.webview.postMessage({
						command: "setPathResult",
						path: newPath ? newPath[0].fsPath : null,
					});
					// Update the configuration with the new path
					const updatedPath = newPath ? newPath[0].fsPath : null;
					vscode.workspace.getConfiguration().update("tide.fileDownloadPath", updatedPath, vscode.ConfigurationTarget.Global);
					break;
				}
				case "downloadTaskSet": {
					const taskSetPath = data.taskSetPath;
					const downloadPath = vscode.workspace.getConfiguration().get("tide.fileDownloadPath");
					vscode.commands.executeCommand("tide.downloadTaskSet", taskSetPath, downloadPath);
					break;
				}
				case "updateCoursesToGlobalState": {
					const coursesJson = data.coursesJson;
					ExtensionStateManager.setCourses(coursesJson);
					break;
				}
				case "openWorkspace": {
					const taskSetName = data.taskSetName;
					const downloadPath = data.downloadPath;
					let folder = downloadPath + "/" + taskSetName;
					vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(folder));
					//const folderUri = vscode.Uri.file(downloadPath + "/" + taskSetName);
					//const options = { uri: folderUri, name: taskSetName };
					//vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, options);
					break;
				}
			}
		});
	}

	public dispose() {
		CoursePanel.currentPanel = undefined;

		// Clean up our resources
		this.panel.dispose();

		while (this.disposables.length) {
			const x = this.disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private update() {
		const webview = this.panel.webview;
		this.panel.webview.html = this.getHtmlForWebview(webview);
		const path = ExtensionStateManager.getDownloadPath();
		this.panel.webview.postMessage({
			command: "setPathResult",
			path: path ? path : null,
		});
	}
	private getHtmlForWebview(webview: vscode.Webview) {
        return getDefaultHtmlForWebview(webview, this.extensionUri, CoursePanel.fileNamePrefix);
	}

}
