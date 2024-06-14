/**
 * A webview that is displayed as a sidebar on the left.
 *
 * @author Hannes Koivusipilä
 * @author Stella Palenius
 * @license MIT
 * @date 16.3.2024
 */
import * as vscode from 'vscode'
import ExtensionStateManager from '../../api/ExtensionStateManager'
import { LoginData } from '../../common/types'
import { getDefaultHtmlForWebview } from '../utils'
import { MessageType } from '../../common/messages'

export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView
    _doc?: vscode.TextDocument

    constructor(private readonly _extensionUri: vscode.Uri) {
        ExtensionStateManager.subscribe(
            'loginData',
            this.sendLoginValue.bind(this)
        )
    }

    /**
     * Sends data to Sidebar if user's login is successful or not.
     * @param json_array JSON array from login data.
     */
    public sendLoginValue(loginData: LoginData) {
        this._view?.webview.postMessage({
            type: MessageType.LoginData,
            value: loginData,
        })
    }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [this._extensionUri],
        }

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'onInfo': {
                    if (!data.value) {
                        return
                    }
                    vscode.window.showInformationMessage(data.value)
                    break
                }
                case 'onError': {
                    if (!data.value) {
                        return
                    }
                    vscode.window.showErrorMessage(data.value)
                    break
                }
                case 'showCourses': {
                    vscode.commands.executeCommand('tide.showCourses')
                    break
                }
                case 'openSettings': {
                    vscode.commands.executeCommand('tide.openSettings')
                    break
                }
                case 'login': {
                    vscode.commands.executeCommand('tide.login')
                    break
                }
                case 'logout': {
                    vscode.commands.executeCommand('tide.logout')
                    break
                }
                case MessageType.RequestLoginData: {
                    this.sendLoginValue(ExtensionStateManager.getLoginData())
                }
            }
        })
    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return getDefaultHtmlForWebview(webview, this._extensionUri, 'sidebar')
    }
}
