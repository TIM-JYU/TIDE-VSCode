/**
 * This class manages the display and closure of various panels within the extension.
 *
 * @author Hannes Koivusipilä
 * @author Stella Palenius
 * @license MIT
 * @date 2.5.2024
 */
import * as vscode from 'vscode'
import TaskPanel from './panels/TaskPanel'
import CoursePanel from './panels/CoursePanel'

export default class UiController {
  private static ctx: vscode.ExtensionContext

  static init(ctx: vscode.ExtensionContext) {
    this.ctx = ctx
  }

  /**
   * Creates or shows task panel.
   * @param timDataJson - .timdata file from the task.
   * @param submitPath - the path that is needed if answer is submitted.
   */
  static showTaskPanel() {
    TaskPanel.createOrShow(this.ctx.extensionUri)
  }

  /**
   * Closes the task panel.
   */
  static closeTaskPanel() {
    TaskPanel.dispose()
  }

  /**
   * Creates or shows the course panel, and closes the task panel.
   */
  static showCoursePanel() {
    this.closeTaskPanel()
    CoursePanel.createOrShow(this.ctx.extensionUri)
  }
}
