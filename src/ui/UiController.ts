/**
 * This class manages the display and closure of various panels within the extension.
 *
 * @author Hannes Koivusipilä
 * @author Stella Palenius
 * @license MIT
 * @date 2.5.2024
 */
import * as vscode from 'vscode'
import { TaskPanelProvider } from './panels/TaskPanelProvider'
import CoursePanel from './panels/CoursePanel'

export default class UiController {
  private static ctx: vscode.ExtensionContext

  static init(ctx: vscode.ExtensionContext) {
    this.ctx = ctx
  }
  /**
   * Creates or shows the course panel, and closes the task panel.
   */
  static showCoursePanel() {
    CoursePanel.createOrShow(this.ctx.extensionUri)
  }

  static showError(error: string) {
    vscode.window.showErrorMessage(error)
  }
}
