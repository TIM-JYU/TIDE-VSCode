/**
 * A panel for displaying task information.
 *
 * @author Hannes Koivusipilä
 * @author Stella Palenius
 * @license MIT
 * @date 2.5.2024
 */
import * as vscode from 'vscode'
import { getDefaultHtmlForWebview, getWebviewOptions } from '../utils'
import ExtensionStateManager from '../../api/ExtensionStateManager'
import { LoginData, MessageType, TimData, WebviewMessage } from '../../common/types'
import path from 'path'
import Logger from '../../utilities/logger'
import { log } from 'console'

export default class TaskPanel {
  public static currentPanel: TaskPanel | undefined

  private static readonly fileNamePrefix = 'TaskPanel'
  private static readonly viewType = 'TaskPanel'
  private static readonly panelTitle = 'Task Panel'
  private static preferredColumn = vscode.ViewColumn.Two

  private readonly panel: vscode.WebviewPanel
  private readonly extensionUri: vscode.Uri
  private disposables: vscode.Disposable[] = []

  private static lastActiveTextEditor: vscode.TextEditor
  private static loginData: LoginData


  public static createOrShow(
    extensionUri: vscode.Uri,
  ) {
    // If we already have a panel, show it.
    if (TaskPanel.currentPanel) {
      TaskPanel.currentPanel.update()
      return
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      this.viewType,
      this.panelTitle,
      {
        viewColumn: vscode.ViewColumn.Beside,
        preserveFocus: true,
      },
      getWebviewOptions(extensionUri),
    )
    TaskPanel.currentPanel = new TaskPanel(panel, extensionUri)
    TaskPanel.currentPanel.update()
  }

  public static revive(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
  ) {
    TaskPanel.currentPanel = new TaskPanel(
      panel,
      extensionUri,
    )
  }

  private updateLoginData(loginData: LoginData) {
    TaskPanel.loginData = loginData
    this.sendLoginData()
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
  ) {
    this.panel = panel
    this.extensionUri = extensionUri

    // subscribe to changes in login data
    this.disposables.push(
      ExtensionStateManager.subscribe(
        'loginData',
        this.updateLoginData.bind(this),
      ),
    )

    // Set the webview's initial html content.
    this.update()

    // Listen for when the panel is disposed.
    // This happens when the user closes the panel or when the panel is closed programmatically.
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables)

    // Update the content based on view changes.
    this.panel.onDidChangeViewState(
      (e) => {
        if (this.panel.visible) {
          this.update()
        }
      },
      null,
      this.disposables,
    )

    // Handle messages from the webview.
    this.panel.webview.onDidReceiveMessage(async (msg: WebviewMessage) => {
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
          vscode.window.showErrorMessage(msg.value)
          break
        }
        case 'SubmitTask': {
          vscode.commands.executeCommand('tide.submitTask', msg.value)
          break
        }
        case 'ShowOutput': {
          vscode.commands.executeCommand('workbench.action.output.toggleOutput')
          vscode.commands.executeCommand(
            'workbench.action.focusFirstEditorGroup',
          )
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
              if (answer === 'Continue') {
                let taskSetPath = msg.value.path
                let taskId = msg.value.taskId
                let fileLocation =
                  ExtensionStateManager.getTaskSetDownloadPath(taskSetPath)
                vscode.commands.executeCommand(
                  'tide.resetExercise',
                  taskSetPath,
                  taskId,
                  fileLocation,
                )
              }
            })
          break
        }
        case 'RequestLoginData': {
          this.sendLoginData()
        }
      }
    })
  }

  public dispose() {
    TaskPanel.currentPanel = undefined

    // Clean up our resources
    this.panel.dispose()

    while (this.disposables.length) {
      const x = this.disposables.pop()
      if (x) {
        x.dispose()
      }
    }
  }

  public static dispose() {
    if (TaskPanel.currentPanel) {
      TaskPanel.currentPanel.dispose()
      TaskPanel.currentPanel = undefined
    }
  }

  public static updateLastActiveEditor(editor: vscode.TextEditor) {
    this.lastActiveTextEditor = editor
  }

  /** 
   * 
   */
  private async getTimData(): Promise<TimData | undefined> {
    const currentTextEditor = vscode.window.activeTextEditor
    switch (currentTextEditor) {
      case undefined: {
        return undefined
      }

      default: {
        try {
          // activeTextEditor banged! because the case of undefined is handled above
          const doc = currentTextEditor.document
          const currentFile = doc.fileName
          const currentDir = path.dirname(currentFile)
          const timDataPath = path.join(currentDir, '.timdata')
          const timDataContent = await vscode.workspace.fs.readFile(vscode.Uri.file(timDataPath))
          const timData: TimData = JSON.parse(timDataContent.toString())

          return timData
        } catch {
          return undefined
        }
      }
    }

  }

  private async sendLoginData() {
    const loginDataMsg: WebviewMessage = { type: 'LoginData', value: TaskPanel.loginData }
    await this.panel.webview.postMessage(loginDataMsg)
  }

  private async sendTimData() {
    const timData: TimData | undefined = await this.getTimData()
    const timDataMsg: WebviewMessage = { type: 'UpdateTimData', value: timData }
    await this.panel.webview.postMessage(timDataMsg)
  }

  private async update() {
    const webview = this.panel.webview
    this.panel.webview.html = this.getHtmlForWebview(webview)
    // TODO: Race condition. Webview doesn't receive messages while it's updating. Effect in work if sendTimData is called right before sendLoginData. Current implementation is prone to it too, but logindata message is so small, it's not happening in practice
    await this.sendLoginData()
    await this.sendTimData()
  }

  private getHtmlForWebview(webview: vscode.Webview) {
    return getDefaultHtmlForWebview(
      webview,
      this.extensionUri,
      TaskPanel.fileNamePrefix,
    )
  }
}
