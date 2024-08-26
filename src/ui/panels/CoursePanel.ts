/**
 * A panel for displaying the user's courses.
 *
 * @author Hannes Koivusipilä
 * @author Stella Palenius
 * @license MIT
 * @date 22.3.2024
 */
import * as vscode from 'vscode'
import ExtensionStateManager from '../../api/ExtensionStateManager'
import { getDefaultHtmlForWebview, getWebviewOptions } from '../utils'
import { Course, LoginData, WebviewMessage } from '../../common/types'
import Tide from '../../api/tide'
import UiController from '../UiController'

export default class CoursePanel {
  public static currentPanel: CoursePanel | undefined

  private static readonly fileNamePrefix = 'courses'
  private static readonly viewType = 'Courses'
  private static readonly panelTitle = 'My Courses'
  private static preferredColumn = vscode.ViewColumn.One

  private readonly panel: vscode.WebviewPanel
  private readonly extensionUri: vscode.Uri
  private disposables: vscode.Disposable[] = []

  public static createOrShow(extensionUri: vscode.Uri) {
    // If we already have a panel, show it.
    if (CoursePanel.currentPanel) {
      CoursePanel.currentPanel.panel.reveal(this.preferredColumn)
      CoursePanel.currentPanel.update()
      return CoursePanel.currentPanel
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      this.viewType,
      this.panelTitle,
      this.preferredColumn,
      getWebviewOptions(extensionUri),
    )

    CoursePanel.currentPanel = new CoursePanel(panel, extensionUri)

    // Send initial file download path and courses to the webview.
    CoursePanel.currentPanel.update()

    return CoursePanel.currentPanel
  }

  /**
   * Sends initial file download path to svelte file.
   */
  private sendInitialPath() {
    const initialPath = vscode.workspace.getConfiguration().get('TIM-IDE.fileDownloadPath')
    this.panel.webview.postMessage({
      type: 'SetDownloadPathResult',
      value: initialPath ? initialPath : null,
    })
  }

  private sendCourseData(courseData: Array<Course>) {
    const msg: WebviewMessage = {
      type: 'CourseData',
      value: courseData,
    }
    this.panel.webview.postMessage(msg)
  }

  private sendLoginData(loginData: LoginData) {
    const msg: WebviewMessage = {
      type: 'LoginData',
      value: loginData,
    }
    this.panel.webview.postMessage(msg)
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    CoursePanel.currentPanel = new CoursePanel(panel, extensionUri)

    CoursePanel.currentPanel.update()
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel
    this.extensionUri = extensionUri

    // subscribe to changes in login data
    this.disposables.push(
      ExtensionStateManager.subscribe('loginData', this.sendLoginData.bind(this)),
      ExtensionStateManager.subscribe('courses', this.sendCourseData.bind(this)),
    )

    // Set the webview's initial html content
    this.update()

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables)

    // Update the content based on view changes
    this.panel.onDidChangeViewState(
      (_) => {
        if (this.panel.visible) {
          this.update()
        }
      },
      null,
      this.disposables,
    )

    this.handlePanelVisibilityChange()

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(async (msg: WebviewMessage) => {
      switch (msg.type) {
        case 'OnError': {
          if (!msg.value) {
            return
          }
          UiController.showError(msg.value)
          break
        }
        case 'SetDownloadPath': {
          let newPath: vscode.Uri[] | undefined = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select directory',
          })
          // If newPath is undefined or user cancels, get the previous path from global state
          if (!newPath) {
            const previousPath = ExtensionStateManager.getDownloadPath()
            if (previousPath) {
              newPath = [vscode.Uri.file(previousPath)]
            }
          }
          // Send the selected path back to the webview
          this.panel.webview.postMessage({
            type: 'SetDownloadPathResult',
            value: newPath ? newPath[0].fsPath : null,
          })
          // Update the configuration with the new path
          const updatedPath = newPath ? newPath[0].fsPath : null
          vscode.workspace
            .getConfiguration()
            .update('TIM-IDE.fileDownloadPath', updatedPath, vscode.ConfigurationTarget.Global)
          break
        }
        case 'DownloadTaskSet': {
          const taskSetPath = msg.value
          Tide.downloadTaskSet(taskSetPath)
          break
        }
        case 'OpenWorkspace': {
          vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(msg.value))
          break
        }
        case 'RequestLoginData': {
          this.sendLoginData(ExtensionStateManager.getLoginData())
          break
        }
        case 'SetCourseStatus': {
          ExtensionStateManager.setCourseStatus(msg.value.id, msg.value.status)
        }
      }
    })
  }

  public dispose() {
    CoursePanel.currentPanel = undefined

    // Clean up our resources
    this.panel.dispose()

    while (this.disposables.length) {
      const x = this.disposables.pop()
      if (x) {
        x.dispose()
      }
    }
  }

  /**
   * Handles the panel visibility in case tabs are switched.
   * Ensures that courses doesn't look empty when user opens My Courses tab again.
   */
  private handlePanelVisibilityChange() {
    this.panel.onDidChangeViewState(() => {
      if (this.panel.visible) {
        // Panel became visible, refresh content
        this.update()
      }
    })
  }

  private update() {
    const webview = this.panel.webview
    this.panel.webview.html = this.getHtmlForWebview(webview)
    const path = ExtensionStateManager.getDownloadPath()
    this.sendInitialPath()
    this.panel.webview.postMessage({
      type: 'SetDownloadPathResult',
      value: path ? path : null,
    })
    const loginData = ExtensionStateManager.getLoginData()
    this.sendLoginData(loginData)
    const courses = ExtensionStateManager.getCourses()
    this.sendCourseData(courses)
  }

  private getHtmlForWebview(webview: vscode.Webview) {
    return getDefaultHtmlForWebview(webview, this.extensionUri, CoursePanel.fileNamePrefix)
  }
}
