/**
 * A webview that is displayed as a sidebar on the left.
exports
 *
 * @author Hannes Koivusipilä
 * @author Stella Palenius
 * @license MIT
 * @date 16.3.2024
 */
import * as vscode from 'vscode'
import ExtensionStateManager, {StateKey} from '../../api/ExtensionStateManager'
import { LoginData, MessageType, WebviewMessage } from '../../common/types'
import { getDefaultHtmlForWebview } from '../utils'
import Logger from '../../utilities/logger'
import UiController from '../UiController'

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView
  _doc?: vscode.TextDocument

  constructor(private readonly _extensionUri: vscode.Uri) {
    ExtensionStateManager.subscribe(StateKey.LoginData , this.sendLoginValue.bind(this))
  }

  /**
   * Sends data to Sidebar if user's login is successful or not.
   * @param json_array JSON array from login data.
   */
  public sendLoginValue(loginData: LoginData) {
    this._view?.webview.postMessage({
      type: 'LoginData',
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

    webviewView.webview.onDidReceiveMessage(async (msg: WebviewMessage) => {
      switch (msg.type) {
        case 'OnInfo': {
          if (!msg.value) {
            return
          }
          vscode.window.showInformationMessage(msg.value)
          break
        }
        case 'OnError': {
          if (!msg.value) {
            return
          }
          UiController.showError(msg.value)
          break
        }
        case 'ShowCourses': {
          vscode.commands.executeCommand('tide.showCourses')
          break
        }
        case 'OpenSettings': {
          vscode.commands.executeCommand('tide.openSettings')
          break
        }
        case 'Login': {
          await vscode.commands.executeCommand('tide.login')
          vscode.commands.executeCommand('tide.refreshTree')
          break
        }
        case 'Logout': {
          await vscode.commands.executeCommand('tide.logout')
          await vscode.commands.executeCommand('tide.wipeTreeAndEditors')
          break
        }
        case 'RequestLoginData': {
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
