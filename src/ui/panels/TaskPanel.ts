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
import { LoginData, MessageType, TimData } from '../../common/types'
import path from 'path'

export default class TaskPanel {
  public static currentPanel: TaskPanel | undefined

  private static readonly fileNamePrefix = 'TaskPanel'
  private static readonly viewType = 'TaskPanel'
  private static readonly panelTitle = 'Task Panel'
  private static preferredColumn = vscode.ViewColumn.Two

  private readonly panel: vscode.WebviewPanel
  private readonly extensionUri: vscode.Uri
  private disposables: vscode.Disposable[] = []

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

  private sendLoginData(loginData: LoginData) {
    this.panel.webview.postMessage({
      type: MessageType.LoginData,
      value: loginData,
    })
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
        this.sendLoginData.bind(this),
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
    this.panel.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case MessageType.OnInfo: {
          if (!data.value) {
            return
          }
          vscode.window.showInformationMessage(data.value)
          break
        }
        case MessageType.OnError: {
          if (!data.value) {
            return
          }
          vscode.window.showErrorMessage(data.value)
          break
        }
        case MessageType.SubmitTask: {
          vscode.commands.executeCommand('tide.submitTask', data.value)
          break
        }
        case MessageType.ShowOutput: {
          vscode.commands.executeCommand('workbench.action.output.toggleOutput')
          vscode.commands.executeCommand(
            'workbench.action.focusFirstEditorGroup',
          )
          break
        }
        case MessageType.ResetExercise: {
          vscode.window
            .showInformationMessage(
              'Are you sure you want to reset exercise? All unsubmitted changes will be lost.',
              'Continue',
              'Cancel',
            )
            .then((answer) => {
              if (answer === 'Continue') {
                let taskSetPath = data.path
                let taskId = data.taskId
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
        case MessageType.RequestLoginData: {
          this.sendLoginData(ExtensionStateManager.getLoginData())
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

  /** 
   * 
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
          const filePath = path.dirname(vscode.window.activeTextEditor!.document.fileName)
          const timDataContent = await vscode.workspace.fs.readFile(
            vscode.Uri.joinPath(vscode.Uri.file(filePath), '.timdata'),
          )

          const timData: TimData = JSON.parse(timDataContent.toString())

          return timData
        } catch {
          return undefined
        }
      }
    }

  }

  private async update() {
    const webview = this.panel.webview
    this.panel.webview.html = this.getHtmlForWebview(webview)
    const timData: TimData | undefined = await this.getTimData()
    this.panel.webview.postMessage({
      type: MessageType.UpdateTimData,
      value: timData,
    })
  }

  private getHtmlForWebview(webview: vscode.Webview) {
    return getDefaultHtmlForWebview(
      webview,
      this.extensionUri,
      TaskPanel.fileNamePrefix,
    )
  }
}
