import * as vscode from 'vscode'
import ExtensionStateManager, {StateKey} from '../../api/ExtensionStateManager'
import { LoginData, TaskPoints, WebviewMessage } from '../../common/types'
import { getDefaultHtmlForWebview } from '../utils'
import Tide from '../../api/tide'
import path from 'path'
import Logger from '../../utilities/logger'
import UiController from '../UiController'

/**
 * Class for providing the Taskpanel menu into the extensions sidemenu
 */
export class TaskPanelProvider implements vscode.WebviewViewProvider {

    _view?: vscode.WebviewView

    private static activeTextEditor: vscode.TextEditor | undefined

    constructor(private readonly _extensionUri: vscode.Uri) {
        ExtensionStateManager.subscribe(StateKey.LoginData , this.sendLoginData.bind(this))
    }

    resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView

        // Might include unnecessary stuff
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
      
            localResourceRoots: [this._extensionUri],
        }

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)

        webviewView.webview.onDidReceiveMessage(async (msg: WebviewMessage) => {
            // When a Webviewmessage is recieved, execute the appropriate command
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
                case 'SubmitTask': {
                    vscode.commands.executeCommand('workbench.action.files.save')
                    // Required arguments: (taskPath: string, callback: () => any)
                    if (TaskPanelProvider.activeTextEditor) {
                        const data = await Tide.submitTask(path.dirname(TaskPanelProvider.activeTextEditor.document.fileName), this.onSubmitTask.bind(this))
                        break
                    } else {
                        break
                    }
                }
                case 'ShowOutput': {
                    vscode.commands.executeCommand('workbench.action.output.toggleOutput')
                    vscode.commands.executeCommand('workbench.action.focusFirstEditorGroup')
                    break
                }
                case 'ResetExercise': {
                    vscode.window
                    .showInformationMessage(
                        'Are you sure you want to reset exercise? All unsubmitted changes will be lost.',
                        'Continue',
                        'Cancel',
                    )
                    .then((answer) => {
                        // Testing required
                        if (answer === 'Continue') {
                        let taskSetPath = msg.value.path
                        let taskId = msg.value.taskId
                        let fileLocation = ExtensionStateManager.getTaskSetDownloadPath(taskSetPath)
                        // TODO: proper error handling
                        if (fileLocation) {
                            vscode.commands.executeCommand(
                            'tide.resetExercise',
                            taskSetPath,
                            taskId,
                            fileLocation,
                            )
                        }
                        }
                    })
                    break
                }
                case 'ResetNoneditableAreas': {
                    if (TaskPanelProvider.activeTextEditor) {
                        Tide.resetNoneditableAreas(TaskPanelProvider.activeTextEditor.document.uri.path.toString())
                    }
                    
                }
                case 'RequestLoginData': {
                    this.sendLoginData()
                }
                case 'UpdateTaskPoints': {
                    // TODO: clean up and reorganize and type
                    Tide.getTaskPoints(
                    msg.value.taskSetPath,
                    msg.value.ideTaskId,
                    this.sendTaskPoints.bind(this),
                    )
                }
            }
        })
        this.sendLoginData();

    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return getDefaultHtmlForWebview(webview, this._extensionUri, 'TaskPanel')
    }

    public static updateCurrentActiveEditor(editor: vscode.TextEditor | undefined) {
        this.activeTextEditor = editor
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

    // Testing required
    private async onSubmitTask() {
        // TODO: logic for informing about success/failure while submitting task
        const msg: WebviewMessage = { type: 'SubmitResult', value: true}
        await this._view?.webview.postMessage(msg)
    }

    // Testing required
    private async sendLoginData() {    
        const loginData = ExtensionStateManager.getLoginData()
        const loginDataMsg: WebviewMessage = { type: 'LoginData', value: loginData }
        await this._view?.webview.postMessage(loginDataMsg)
    }

    // Testing required
    private sendTaskPoints(points: TaskPoints | undefined) {    
        const taskPointsMsg: WebviewMessage = { type: 'TaskPoints', value: points }
        this._view?.webview.postMessage(taskPointsMsg)
    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel
    }

}