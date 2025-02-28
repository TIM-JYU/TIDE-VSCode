import * as vscode from 'vscode'
import ExtensionStateManager, { StateKey } from '../../api/ExtensionStateManager'
import { LoginData, TaskPoints, WebviewMessage, TimData } from '../../common/types'
import { getDefaultHtmlForWebview } from '../utils'
import Tide from '../../api/tide'
import path from 'path'
import Logger from '../../utilities/logger'
import UiController from '../UiController'

export class TaskPanelProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView

    private static activeTextEditor: vscode.TextEditor | undefined

    constructor(private readonly _extensionUri: vscode.Uri) {
        ExtensionStateManager.subscribe(StateKey.LoginData, this.sendLoginData.bind(this))

        vscode.window.onDidChangeActiveTextEditor(async (editor) => {
            TaskPanelProvider.updateCurrentActiveEditor(editor);
            if (editor) {
                const timData = await this.getTimData();
                this.sendTimData(timData);
            }
        });
    }

    resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        }

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)

        webviewView.webview.onDidReceiveMessage(async (msg: WebviewMessage) => {
            switch (msg.type) {
                case 'OnInfo':
                    if (msg.value) {
                        vscode.window.showInformationMessage(msg.value)
                    }
                    break
                case 'OnError':
                    if (msg.value) {
                        UiController.showError(msg.value)
                    }
                    break
                case 'SubmitTask':
                    vscode.commands.executeCommand('workbench.action.files.save')
                    if (TaskPanelProvider.activeTextEditor) {
                        await Tide.submitTask(
                            path.dirname(TaskPanelProvider.activeTextEditor.document.fileName), 
                            this.onSubmitTask.bind(this)
                        )
                    }
                    break
                case 'ShowOutput':
                    vscode.commands.executeCommand('workbench.action.output.toggleOutput')
                    vscode.commands.executeCommand('workbench.action.focusFirstEditorGroup')
                    break
                case 'ResetExercise':
                    vscode.window.showInformationMessage(
                        'Are you sure you want to reset exercise? All unsubmitted changes will be lost.',
                        'Continue', 'Cancel'
                    ).then((answer) => {
                        if (answer === 'Continue') {
                            let taskSetPath = msg.value.path
                            let taskId = msg.value.taskId
                            let fileLocation = ExtensionStateManager.getTaskSetDownloadPath(taskSetPath)
                            if (fileLocation) {
                                vscode.commands.executeCommand(
                                    'tide.resetExercise', taskSetPath, taskId, fileLocation
                                )
                            }
                        }
                    })
                    break
                case 'RequestLoginData':
                    this.sendLoginData()
                    break
                case 'UpdateTaskPoints':
                    Tide.getTaskPoints(
                        msg.value.taskSetPath,
                        msg.value.ideTaskId,
                        this.sendTaskPoints.bind(this)
                    )
                    break
            }
        })
        this.sendLoginData();
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return getDefaultHtmlForWebview(webview, this._extensionUri, 'TaskPanel')
    }

    public static updateCurrentActiveEditor(editor: vscode.TextEditor | undefined) {
        this.activeTextEditor = editor;
    }

    public sendLoginValue(loginData: LoginData) {
        this._view?.webview.postMessage({
            type: 'LoginData',
            value: loginData,
        })
    }

    private async onSubmitTask() {
        const msg: WebviewMessage = { type: 'SubmitResult', value: true }
        await this._view?.webview.postMessage(msg)
    }

    private async sendLoginData() {    
        const loginData = ExtensionStateManager.getLoginData()
        const loginDataMsg: WebviewMessage = { type: 'LoginData', value: loginData }
        await this._view?.webview.postMessage(loginDataMsg)
    }

    private sendTaskPoints(points: TaskPoints | undefined) {    
        const taskPointsMsg: WebviewMessage = { type: 'TaskPoints', value: points }
        this._view?.webview.postMessage(taskPointsMsg)
    }

    private async getTimData(): Promise<TimData | undefined> {
        if (!TaskPanelProvider.activeTextEditor) {
            return undefined;
        }
        try {
            const doc = TaskPanelProvider.activeTextEditor.document
            const currentFile = doc.fileName
            const currentDir = path.dirname(currentFile)
            const taskId = path.basename(currentDir)
            const timDataPath = path.join(path.dirname(path.dirname(currentDir)), '.timdata')
            const timDataContent = await vscode.workspace.fs.readFile(vscode.Uri.file(timDataPath))
            const timDataCourse = JSON.parse(timDataContent.toString())
            const coursePath = Object.keys(timDataCourse.course_parts)[0]
            return timDataCourse.course_parts[coursePath].tasks[taskId]
        } catch {
            return undefined
        }
    }

    private async sendTimData(timData: TimData | undefined) {
        const timDataMsg: WebviewMessage = { type: 'UpdateTimData', value: timData }
        await this._view?.webview.postMessage(timDataMsg)
    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel
    }
}