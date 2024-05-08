import * as vscode from "vscode";
import ExtensionStateManager from "../../api/ExtensionStateManager";
import { getNonce } from "../utils";
import { LoginData } from "../../common/types";
import Logger from "../../utilities/logger";

export class SidebarProvider implements vscode.WebviewViewProvider {
	_view?: vscode.WebviewView;
	_doc?: vscode.TextDocument;

	constructor(private readonly _extensionUri: vscode.Uri) {
        ExtensionStateManager.subscribe('loginData', this.sendLoginValue.bind(this));

		vscode.workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration("tide.sidebar.showSidebarWelcomeMessage")) {
				// Call a method to update the view with the new setting value
				this.updateWebview();
			}
		});
	}

	/**
	 * Sends data to Sidebar if user's login is successful or not.
	 * @param json_array JSON array from login data.
	 */
	public sendLoginValue(loginData: LoginData) {
		this._view?.webview.postMessage({ type: "loginData", value: loginData });
	}

	public resolveWebviewView(webviewView: vscode.WebviewView) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [this._extensionUri],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(async (data) => {
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
				case "showCourses": {
					vscode.commands.executeCommand("tide.showCourses");
					break;
				}
				case "openSettings": {
					vscode.commands.executeCommand("tide.openSettings");
					break;
				}
				case "showTaskPanel": {
					vscode.commands.executeCommand("tide.showTaskPanel");
					break;
				}
				case "login": {
					vscode.commands.executeCommand("tide.login");
					break;
				}
				case "logout": {
					vscode.commands.executeCommand("tide.logout");
					break;
				}
                case "requestLoggedInStatus": {
                    this.sendLoginValue(ExtensionStateManager.getLoginData());
                }
			}
		});
	}

	public revive(panel: vscode.WebviewView) {
		this._view = panel;
	}

	private updateWebview() {
		if (this._view) {
			const showSidebarWelcome = vscode.workspace.getConfiguration().get("tide.sidebar.showSidebarWelcomeMessage");
			this._view.webview.postMessage({ type: "settingValue", value: showSidebarWelcome });
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "reset.css"));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css"));

		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.js"));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.css"));

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
