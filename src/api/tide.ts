/**
 * This class handles communication with the cli tool.
 *
 * @author Hannes Koivusipilä
 * @author Stella Palenius
 * @license MIT
 * @date 6.3.2024
 */

import * as cp from 'child_process'
import Logger from '../utilities/logger'
import * as vscode from 'vscode'
import { Course, LoginData, Task } from '../common/types'
import { parseCoursesFromJson } from '../utilities/parsers'
import ExtensionStateManager from './ExtensionStateManager'
import path from 'path'
import UiController from '../ui/UiController'

export default class Tide {
  public static async debug() {
    this.runAndHandle([], (data: string) => {
      Logger.debug(data)
    })
  }

  /**
   * Executes tide login command.
   */
  public static async login(): Promise<LoginData> {
    let loginData = { isLogged: false }
    await this.runAndHandle(['login', '--json'], (data: string) => {
      const parsedData = JSON.parse(data)
      loginData = { isLogged: parsedData['login_success'] }
      // TODO: raise exception in cli?
      if (!loginData.isLogged) {
        UiController.showError('Login failed.')
      }
    })
    return loginData
  }

  /**
   * Executes tide logout command.
   */
  public static async logout(): Promise<LoginData> {
    await this.runAndHandle(['logout'], (data: string) => {
      Logger.info(`Logout: ${data}`)
    })
    return { isLogged: false }
  }

  /**
   * Fetches user's IDE-compatible courses from TIM.
   * @returns course data
   */
  public static async getCourseList(): Promise<Array<Course>> {
    let courses: Array<Course> = []
    await this.runAndHandle(['courses', '--json'], async (data: string) => {
      courses = await parseCoursesFromJson(data)
    })
    return courses
  }

  /**
   * Lists all the tasks in one task set.
   * @param taskSetPath path to task set. Path can be found by executing cli courses command
   * @returns task data
   */
  public static async getTaskListForTaskSetPath(taskSetPath: string): Promise<Array<Task>> {
    let tasks: Array<Task> = []
    await this.runAndHandle(['task', 'list', taskSetPath, '--json'], async (data: string) => {
      tasks = JSON.parse(data)
    })
    return tasks
  }

  /**
   * Downloads task set from TIM; creates files for each task
   * @param {string} taskSetPath - path to task set. Path can be found by executing cli courses command
   */
  public static async downloadTaskSet(taskSetPath: string) {
    const downloadPathBase: string | undefined = vscode.workspace.getConfiguration().get('TIM-IDE.fileDownloadPath')
    if (downloadPathBase === undefined) {
      UiController.showError('Download path not set!')
      return
    }

    const courseName = path.basename(path.dirname(taskSetPath))
    const taskSetName = path.basename(taskSetPath)
    // append course name to the base download path
    const downloadPath = path.join(path.normalize(downloadPathBase), courseName, taskSetName)

    this.runAndHandle(['task', 'create', taskSetPath, '-a', '-d', downloadPath], (data: string) => {
      Logger.debug(data)
      // TODO: course path is saved instead of taskset path
      ExtensionStateManager.setTaskSetDownloadPath(taskSetPath, downloadPath)
    })
  }

  /**
   * Overwrites a local task set
   *
   * @param {string} taskSetPath - path of the task set
   */
  public static async overwriteSetTasks(taskSetPath: string) {
    this.runAndHandle(['task', 'create', '-a', '-f', taskSetPath], (data: string) => {
      Logger.debug(data)
    })
  }

  /**
   * Overwrites one exercise
   * @param taskSetPath - tide task set for the exercise that is going to be overwritten
   * @param ideTaskId - id/directory for the task that is going to be overwritten
   * @param fileLocation - path to the directory where user has loaded the task set
   */
  public static async overwriteTask(taskSetPath: string, ideTaskId: string, fileLocation: string) {
    this.runAndHandle(
      ['task', 'create', taskSetPath, ideTaskId, '-f', '-d', fileLocation],
      (data: string) => {
        Logger.debug(data)
      },
    )
  }

  /**
   * Resets the noneditable parts of a task to their original state.
   * @param filePath - path of the file to reset
   */
  public static async resetNoneditableAreas(filePath: string) {
    this.runAndHandle(['task', 'reset', filePath], (data: string) => {
      Logger.debug(data)
    })
  }

  /**
   * Return a task to TIM
   *
   * @param {string} taskPath - path of the task
   */
  public static async submitTask(taskPath: string) {
    this.runAndHandle(['submit', taskPath], (data: string) => {
      Logger.debug(data)
    })
  }

  /**
   * Executes the process defined in the extension's settings with arguments provided in "args" parameter. calls the function provided as parameter "handler" with the stdout of the executed process passed in as a parameter for the function.
   *
   * @param args - arguments to run the executable with
   * @param handler - a handler function to be called after the executable exits
   */
  private static async runAndHandle(args: Array<string>, handler: HandlerFunction) {
    // this.spawnTideProcess(...args).then((data) => handler(data), (err) => UiController.showError(err))
    const cliOutput = await this.spawnTideProcess(...args).catch(err => UiController.showError(err))
    if (typeof cliOutput === 'string') {
      // !! ts lang server or eslint claims this await has no effect but it actually does !!
      await handler(cliOutput)
    }
  }

  /**
   * Executes the process defined in the extension's settings.
   *
   * @param args - arguments to be passed to the executable
   * @returns the stdout of the executed process
   */
  private static async spawnTideProcess(...args: Array<string>): Promise<string> {
    Logger.debug(`Running cli with args "${args}"`)
    let buffer = ''
    let errorBuffer = ''

    // To run an uncompiled version of the CLI tool:
    // 1. Point the cli tool path in your extension settings to the main.py -file
    //const ar = ["run", "python", vscode.workspace.getConfiguration().get("tide.cliPath") as string, ...args];
    // 2. Edit the value of cwd to match the root directory of the cli tool repository
    //const childProcess = cp.spawn("poetry", ar, { cwd: "/Users/stella/tideproject/tide-cli" });

    const childProcess = cp.spawn(
      vscode.workspace.getConfiguration().get('TIM-IDE.cliPath') as string,
      args,
    )

    childProcess.stdout.on('data', (data) => {
      buffer += data.toString()
    })

    childProcess.stderr.on('data', (data) => {
      errorBuffer = data.toString()
    })

    return new Promise<string>((resolve, reject) => {
      childProcess.on('error', (error) => {
        Logger.error(`Error spawning child process: ${error}`)
        reject(error)
      })

      childProcess.on('exit', (code) => {
        if (code === 0) {
          resolve(buffer)
        } else {
          reject(errorBuffer)
        }
      })
    })
  }
}

type HandlerFunction = (data: string) => void
