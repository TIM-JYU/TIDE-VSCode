import * as vscode from 'vscode'
import ExtensionStateManager, { StateKey } from '../../api/ExtensionStateManager'
import { LoginData, TaskPoints, WebviewMessage, TimData } from '../../common/types'
import { getDefaultHtmlForWebview } from '../utils'
import Tide from '../../api/tide'
import path from 'path'
import UiController from '../UiController'

/**
 * Provides the TaskPanel menu in the extension's sidebar.
 */
export class TaskPanelProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView
    private static activeTextEditor?: vscode.TextEditor

    constructor(private readonly _extensionUri: vscode.Uri) {
        ExtensionStateManager.subscribe(StateKey.LoginData, this.sendLoginData.bind(this))

        vscode.window.onDidChangeActiveTextEditor(async (editor) => {
            TaskPanelProvider.activeTextEditor = editor
            if (editor) {
                const timData = await this.getTimData()
                this.sendTimData(timData)
                if (timData?.path && timData?.ide_task_id) {
                    Tide.getTaskPoints(timData.path, timData.ide_task_id, this.sendTaskPoints.bind(this))
                }
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

        webviewView.webview.onDidReceiveMessage(this.handleWebviewMessage.bind(this))
        this.sendLoginData();
    }

    /**
     * Handles messages received from the webview.
     */
    private async handleWebviewMessage(msg: WebviewMessage) {
        switch (msg.type) {
            case 'OnInfo':
                msg.value && vscode.window.showInformationMessage(msg.value)
                break
            case 'OnError':
                msg.value && UiController.showError(msg.value)
                break
            case 'SubmitTask':
                await this.handleSubmitTask()
                break
            case 'ShowOutput':
                vscode.commands.executeCommand('workbench.action.output.toggleOutput')
                vscode.commands.executeCommand('workbench.action.focusFirstEditorGroup')
                break
            case 'RequestLoginData':
                this.sendLoginData()
                break
            case 'UpdateTaskPoints':
                Tide.getTaskPoints(msg.value.taskSetPath, msg.value.ideTaskId, this.sendTaskPoints.bind(this))
                break
        }
    }

    /**
     * Sends login data to the webview.
     */
    private async sendLoginData() {    
        const loginData = ExtensionStateManager.getLoginData()
        await this._view?.webview.postMessage({ type: 'LoginData', value: loginData })
    }

    /**
     * Sends task points to the webview.
     */
    private sendTaskPoints(points: TaskPoints | undefined) {    
        this._view?.webview.postMessage({ type: 'TaskPoints', value: points })
    }

    /**
     * Retrieves TIM data for the active text editor.
     */
    private async getTimData(): Promise<TimData | undefined> {
        if (!TaskPanelProvider.activeTextEditor) return undefined;

        try {
            const doc = TaskPanelProvider.activeTextEditor.document
            const currentDir = path.dirname(doc.fileName)
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

    /**
     * Sends TIM data to the webview.
     */
    private async sendTimData(timData: TimData | undefined) {
        await this._view?.webview.postMessage({ type: 'UpdateTimData', value: timData })
    }

    /**
     * Handles task submission.
     */
    private async handleSubmitTask() {
        vscode.commands.executeCommand('workbench.action.files.save')
        if (TaskPanelProvider.activeTextEditor) {
            await Tide.submitTask(
                path.dirname(TaskPanelProvider.activeTextEditor.document.fileName), 
                async () => {
                    await this._view?.webview.postMessage({ type: 'SubmitResult', value: true })
                }
            )
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        return getDefaultHtmlForWebview(webview, this._extensionUri, 'TaskPanel')
    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel
    }
}