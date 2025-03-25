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
import { mergeCoursesWithNewData } from '../utilities/mergeCourses'
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
   * Resets exercise of active task file.
   */
  ctx.subscriptions.push(
    vscode.commands.registerCommand('tide.resetExercise', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found.')
        return
      }
      const doc = editor.document;
      Tide.resetTask(doc.fileName)
    }),
  )


  /**
   * Restore last submission of active task file.
   */
  ctx.subscriptions.push(
    vscode.commands.registerCommand('tide.restoreSubmission', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found.')
        return
      }
      const doc = editor.document;
      const currentDir = path.dirname(doc.fileName)
      const taskId = path.basename(currentDir)
      const timDataPath = path.join(path.dirname(path.dirname(currentDir)), '.timdata')
      const timDataContent = await vscode.workspace.fs.readFile(vscode.Uri.file(timDataPath))
      const timDataCourse = JSON.parse(timDataContent.toString())
      const coursePath = Object.keys(timDataCourse.course_parts)[0]
      const tasksetDir = path.dirname(path.dirname(currentDir))
      Tide.overwriteTask(coursePath, taskId, tasksetDir)
    }),
  )

  /**
   * Submits current task file to TIM.
   */
  ctx.subscriptions.push(
    vscode.commands.registerCommand('tide.submitTask', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active file to submit.');
        return;
      }
      const taskPath = editor.document.uri.fsPath;
      // TODO: callback should maybe be a show output function
      const callback = () => vscode.window.showInformationMessage('Task submitted successfully');
      Tide.submitTask(taskPath, callback)
    }),
  )

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
      const existingCourses = ExtensionStateManager.getCourses()
      Tide.getCourseList().then((freshCourses) => {
        if (existingCourses === undefined || existingCourses.length === 0) {
          ExtensionStateManager.setCourses(freshCourses)
        } else {
          const mergedCourses = mergeCoursesWithNewData(existingCourses, freshCourses)
          ExtensionStateManager.setCourses(mergedCourses)
        }
      })
      // const freshCourses = await Tide.getCourseList()
      // if (existingCourses === undefined || existingCourses.length === 0) {
      //   ExtensionStateManager.setCourses(freshCourses)
      // } else {
      //   const mergedCourses = mergeCoursesWithNewData(existingCourses, freshCourses)
      //   ExtensionStateManager.setCourses(mergedCourses)
      // }
    }),
  )

  /**
   * Registers the 'tide.login' command, allowing users to log in to TIDE.
   */
  ctx.subscriptions.push(
    vscode.commands.registerCommand('tide.login', async () => {
      let loginData = await Tide.login()
      ExtensionStateManager.setLoginData(loginData)
      let userData = await Tide.checkLogin()
      ExtensionStateManager.setUserData(userData)
    }),
  )

  /**
   * Registers the 'tide.logout' command, allowing users to log out of TIDE.
   */
  ctx.subscriptions.push(
    vscode.commands.registerCommand('tide.logout', async () => {
      let data = await Tide.logout()
      ExtensionStateManager.setLoginData(data)
      let userData = await Tide.checkLogin()
      ExtensionStateManager.setUserData(userData)
    }),
  )

  /**
   * Registers the 'tide.listCourses' command, allowing users to list courses from TIDE.
   */
  ctx.subscriptions.push(
    // TODO: This is unnecessary
    vscode.commands.registerCommand('tide.listCourses', () => {
      Tide.getCourseList()
    }),
  )

  ctx.subscriptions.push(
    vscode.commands.registerCommand('tide.debug', () => {
      Logger.debug(ExtensionStateManager.getCourses())
    }),
  )

  ctx.subscriptions.push(
    vscode.commands.registerCommand('tide.clearCourseCache', () => {
      ExtensionStateManager.setCourses([])
    }),
  )

  ctx.subscriptions.push(
    vscode.commands.registerCommand('tide.clearLocalExtensionData', () => {
      ExtensionStateManager.reset()
    }),
  )

  /**
   * Opens TIDE Logs into Output panel.
   */
  ctx.subscriptions.push(
    vscode.commands.registerCommand('tide.showOutput', () => {
      vscode.commands.executeCommand('workbench.panel.output.focus')
      vscode.commands.executeCommand('workbench.action.focusFirstEditorGroup')
    }),
  )
}
