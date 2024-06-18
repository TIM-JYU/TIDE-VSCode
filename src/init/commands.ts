/**
 * Command registration for the extension.
 *
 * This module registers various commands for the extension, allowing users to interact with tasks,
 * courses, and settings. It includes commands for showing panels, managing user authentication, and handling task operations.
 *
 * @author Hannes Koivusipilä
 * @author Stella Palenius
 * @license MIT
 * @date 26.2.2024
 */

import * as vscode from 'vscode'
import Logger from '../utilities/logger'
import Tide from '../api/tide'
import ExtensionStateManager from '../api/ExtensionStateManager'
import UiController from '../ui/UiController'
import path from 'path'

export function registerCommands(ctx: vscode.ExtensionContext) {
  Logger.info('Registering commands.')
  ctx.subscriptions.push(
    vscode.commands.registerCommand('tide.hello-world', () => {
      vscode.window.setStatusBarMessage('Hello TIDE!')
    }),
  )

  /**
   * Opens VS Code settings and filters them to match with the extension.
   */
  ctx.subscriptions.push(
    vscode.commands.registerCommand('tide.openSettings', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'TIM-IDE')
    }),
  )

  /**
   * Resets exercise.
   */
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      'tide.resetExercise',
      (taskSetPath, taskId, downloadPath) => {
        Tide.overwriteTask(taskSetPath, taskId, downloadPath)
      },
    ),
  )

  /**
   * Opens task panel.
   */
  ctx.subscriptions.push(
    vscode.commands.registerCommand('tide.showTaskPanel', async () => {
      let editor = vscode.window.activeTextEditor

      readTimData(editor)
    }),
  )

  /**
   * Reads .timdata file from current active editor and opens the taskpanel with the data.
   * If there is no .timdata file in current folder, tells UiController to open TaskPanel with "" as timdata.
   * TaskPanel knows to show error message to user based when data is an empty string.
   * @param editor - current active text editor
   */
  async function readTimData(editor: vscode.TextEditor | undefined) {
    if (!editor) {
      return
    }
    const currentFile = editor.document.fileName
    const currentDirectory = vscode.Uri.file(path.dirname(currentFile))

    const lastIndex = currentFile.lastIndexOf('/')
    const submitPath = currentFile.substring(0, lastIndex + 1)

    try {
      // Read the content of the .timdata file.
      const timDataContent = await vscode.workspace.fs.readFile(
        vscode.Uri.joinPath(currentDirectory, '.timdata'),
      )
      // Convert the content to a string.
      const timDataString = timDataContent.toString()
      const timDataJson = JSON.parse(timDataString)

      // Create or show the TaskPanel and pass the .timdata content as a parameter.
      UiController.showTaskPanel(timDataJson, submitPath)
    } catch (error) {
      console.log(
        ".timdata file doesn't exist in current directory or text editor is not active",
        error,
      )
      UiController.showTaskPanel('', '')
    }
  }

  /**
   * Opens My courses -view.
   */
  ctx.subscriptions.push(
    vscode.commands.registerCommand('tide.showCourses', () => {
      UiController.showCoursePanel()
    }),
  )

  /**
   * Gets courses from TIM and updates the data to ExtensionStateManager
   */
  ctx.subscriptions.push(
    vscode.commands.registerCommand('tide.updateCoursesFromTim', async () => {
      const courses = await Tide.getCourseList()
      ExtensionStateManager.setCourses(courses)
    }),
  )

  /**
   * Registers the 'tide.login' command, allowing users to log in to TIDE.
   */
  ctx.subscriptions.push(
    vscode.commands.registerCommand('tide.login', async () => {
      let data = await Tide.login()
      ExtensionStateManager.setLoginData(data)
    }),
  )

  /**
   * Registers the 'tide.logout' command, allowing users to log out of TIDE.
   */
  ctx.subscriptions.push(
    vscode.commands.registerCommand('tide.logout', async () => {
      let data = await Tide.logout()
      ExtensionStateManager.setLoginData(data)
    }),
  )

  /**
   * Registers the 'tide.downloadTaskSet' command, allowing users to download a task set from TIDE.
   * @param taskSetPath - The path of the task set to download.
   * @param downloadPath - The path where the task set will be downloaded.
   */
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      'tide.downloadTaskSet',
      (taskSetPath, downloadPath) => {
        Tide.downloadTaskSet(taskSetPath, downloadPath)
        ExtensionStateManager.setTaskSetDownloadPath(taskSetPath, downloadPath)
      },
    ),
  )

  /**
   * Submits task to TIM
   * @param submitPath - The path of the to be submitted task in user's computer.
   */
  ctx.subscriptions.push(
    vscode.commands.registerCommand('tide.submitTask', (submitPath) => {
      vscode.commands.executeCommand('workbench.action.files.save')
      Tide.submitTask(submitPath)
    }),
  )

  /**
   * Registers the 'tide.listCourses' command, allowing users to list courses from TIDE.
   */
  ctx.subscriptions.push(
    vscode.commands.registerCommand('tide.listCourses', () => {
      Tide.getCourseList()
    }),
  )

  ctx.subscriptions.push(
    vscode.commands.registerCommand('tide.debug', () => {}),
  )
}
