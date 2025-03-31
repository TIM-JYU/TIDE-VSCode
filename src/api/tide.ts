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
import { Course, LoginData, Task, TaskCreationFeedback, TaskPoints, TimData, UserData } from '../common/types'
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
      const jsonStart = data.indexOf('{')
      const jsonString = data.slice(jsonStart)
      const parsedData = JSON.parse(jsonString)
      loginData = { isLogged: parsedData['login_success'] }
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
   * Executes tide check-login command.
   * @returns Logged in user data as JSON
   */
  public static async checkLogin(): Promise<UserData> {
    let loggedInUserData: UserData = { logged_in: null}
    await this.runAndHandle(['check-login', '--json'], (data: string) => {
      Logger.info(`Login data: ${data}`)
      loggedInUserData = JSON.parse(data)
    })
    return loggedInUserData
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
  public static async getTaskListForTaskSetPath(
    taskSetPath: string,
    ignoreErrors: boolean = false,
  ): Promise<Array<Task>> {
    let tasks: Array<Task> = []
    await this.runAndHandle(
      ['task', 'list', taskSetPath, '--json'],
      async (data: string) => {
        tasks = JSON.parse(data)
      },
      ignoreErrors,
    )
    return tasks
  }

  /**
   * Downloads task set from TIM; creates files for each task
   * @param {string} taskSetPath - path to task set. Path can be found by executing cli courses command
   */
  public static async downloadTaskSet(courseName:string, taskSetPath: string) {
    const downloadPathBase: string | undefined = vscode.workspace
      .getConfiguration()
      .get('TIM-IDE.fileDownloadPath')
    if (downloadPathBase === undefined) {
      UiController.showError('Download path not set!')
      return
    }

    const taskName = path.basename(taskSetPath)
    const localCoursePath = path.join(path.normalize(downloadPathBase), courseName)
    const localTaskPath = path.join(path.normalize(downloadPathBase), courseName, taskName)
    await this.runAndHandle(['task', 'create', taskSetPath, '-a', '-d', localCoursePath], (data: string) => {
        ExtensionStateManager.setTaskSetDownloadPath(taskSetPath, localTaskPath)
      // TODO: --json flag is not yet implemented in cli tool 
      // const taskCreationFeedback: TaskCreationFeedback = JSON.parse(data)
      // if (taskCreationFeedback.success) {
      //   ExtensionStateManager.setTaskSetDownloadPath(taskSetPath, downloadPath)
      // } else {
      //   // TODO: more specific errors from cli
      //   UiController.showError('Error downloading tasks.')
      // }
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
   * Resets the noneditable parts of a task file to their original state.
   * @param filePath - path of the file to reset
   */
  public static async resetTask(filePath: string) {
    vscode.commands.executeCommand('workbench.action.files.save')
    this.runAndHandle(['task', 'reset', filePath], (data: string) => {
      Logger.debug(data)
    })
  }

  /**
   * Return a task to TIM
   *
   * @param {string} taskPath - path of the task
   */
  public static async submitTask(taskPath: string, callback: () => any) {
    this.runAndHandle(['submit', taskPath], (data: string) => {
      Logger.debug(data)
      let pathSplit = taskPath.split(path.sep)
      // id
      let id = pathSplit.at(-2)
      // task set name
      let demo = pathSplit.at(-3)
      if (demo && id) {
        const timData : TimData | undefined = ExtensionStateManager.getTaskTimData(demo, id)
        if (timData) {
          this.getTaskPoints(timData.path, timData.ide_task_id, callback);
        } else {
          vscode.window.showErrorMessage('TimData is undefined or invalid.');
        }
      }
    })
  }

  public static async getTaskPoints(taskSetPath: string, ideTaskId: string, callback: any) {
    try {
      await this.runAndHandle(['task', 'points', taskSetPath, ideTaskId, '--json'], (data: string) => {
        Logger.debug(data)
        const points: TaskPoints = JSON.parse(data)
        // TODO: should this be called elsewhere instead?
        ExtensionStateManager.setTaskPoints(taskSetPath, ideTaskId, points)
      })
    } catch (error) {
      console.log('Error while fetching task points: ' + error)
    }
  }

  /**
   * Executes the process defined in the extension's settings with arguments provided in "args" parameter. calls the function provided as parameter "handler" with the stdout of the executed process passed in as a parameter for the function.
   *
   * @param args - arguments to run the executable with
   * @param handler - a handler function to be called after the executable exits
   */
  private static async runAndHandle(
    args: Array<string>,
    handler: HandlerFunction,
    ignoreErrors: boolean = false,
  ) {
    // this.spawnTideProcess(...args).then((data) => handler(data), (err) => UiController.showError(err))
    const cliOutput = await this.spawnTideProcess(...args).catch((err) => {
      if (!ignoreErrors) {
        UiController.showError(err)
      }
    })
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

    // Use a copy of process.env to pass custom url to the child process 
    const env_modified = {...process.env}
    
    let customUrl = vscode.workspace.getConfiguration().get("TIM-IDE.customUrl") as string
    if (customUrl && customUrl.trim() !== "") {
      // Ensure that the custom url ends with a slash
      const formattedUrl = customUrl.trim().endsWith("/") ? customUrl.trim() : customUrl.trim() + "/"
      env_modified.URL = formattedUrl
    }
    else {
      env_modified.URL = "https://tim.jyu.fi/"
    }

    // To run an uncompiled version of the CLI tool:
    // 1. Point the cli tool path in your extension settings to the main.py -file
    //const ar = ["run", "python", vscode.workspace.getConfiguration().get("tide.cliPath") as string, ...args];
    // 2. Edit the value of cwd to match the root directory of the cli tool repository
    //const childProcess = cp.spawn("poetry", ar, { cwd: "/Users/stella/tideproject/tide-cli" });

    const childProcess = cp.spawn(
      vscode.workspace.getConfiguration().get('TIM-IDE.cliPath') as string,
      args,
      {"env" : env_modified}
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
