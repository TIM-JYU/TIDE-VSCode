import * as vscode from 'vscode'
import { TaskInfo } from '../common/types'
import Tide from '../api/tide'

/**
 * Class for Status Bar item displaying answer limit related information
 * to users when loading tasks that have set answer_limit value in TIM.
 */
export default class AnswerLimitStatusBarItem {
  readonly name: string = 'Answer limit for current task'
  readonly text: string = '$(tim-font-icon) Limited number of submissions allowed'
  private answerLimit?: number | null
  readonly tooltip: string =
    'This task can only be submitted to TIM a limited number of times.\nAfter all tries have run out, you can no longer get more points by\nsubmitting the answer to TIM.\nCheck TIM task page to see how many attempts have been used.'
  private statusBarItem: vscode.StatusBarItem
  private static activeEditor?: vscode.TextEditor

  constructor(alignment: vscode.StatusBarAlignment, priority: number) {
    this.statusBarItem = vscode.window.createStatusBarItem(alignment, priority)
    this.statusBarItem.text = this.text
    this.statusBarItem.name = this.name
    this.statusBarItem.tooltip = this.tooltip
    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground')

    /**
     * Event listener for determining whether to display answer limit warning
     * based on timdata. This segment is adapted from TaskPanelProvider.ts
     */
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      AnswerLimitStatusBarItem.activeEditor = editor
      if (editor) {
        const taskInfo = await this.getTaskInfo()
        taskInfo?.answer_limit ? this.statusBarItem.show() : this.statusBarItem.hide()
        this.answerLimit = taskInfo?.answer_limit
        this.statusBarItem.tooltip =
          this.tooltip + `\nThis exercise has limit of ${this.answerLimit} submissions.`
      } else {
        this.statusBarItem.hide()
      }
    })
  }

  show(): void {
    this.statusBarItem.show()
  }
  hide(): void {
    this.statusBarItem.hide()
  }
  dispose(): void {
    this.statusBarItem.dispose()
  }

  // The following is taken from TaskPanelProvider.ts - Possible refactoring needed
  /**
   * Retrieves TIM data for the active text editor.
   */
  private async getTaskInfo(): Promise<TaskInfo | undefined> {
    if (!AnswerLimitStatusBarItem.activeEditor) {
      return undefined
    }

    try {
      const doc = AnswerLimitStatusBarItem.activeEditor.document
      return Tide.getTaskInfo(doc.fileName)
    } catch {
      return undefined
    }
  }
}
