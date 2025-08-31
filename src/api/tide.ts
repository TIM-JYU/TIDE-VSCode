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
import { Course, LoginData, Task, TaskPoints, TaskInfo, UserData } from '../common/types'
import { parseCoursesFromJson } from '../utilities/parsers'
import ExtensionStateManager from './ExtensionStateManager'
import path from 'path'
import UiController from '../ui/UiController'

const taskDataCache: Map<string, TaskInfo> = new Map()
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

    try {
      await this.runAndHandle(['login', '--json'], (data: string) => {
        const jsonStart = data.indexOf('{')
        const jsonString = data.slice(jsonStart)
        const parsedData = JSON.parse(jsonString)
        loginData = { isLogged: parsedData['login_success'] }
        if (!loginData.isLogged) {
          UiController.showError('Login failed.')
        }
      })
    } catch (error) {
      Logger.error('Error while logging in: ' + error)
      UiController.showError('Login failed.')
    }
    return loginData
  }

  /**
   * Executes tide logout command.
   * @returns Login data as JSON
   */
  public static async logout(): Promise<LoginData> {
    try {
      await this.runAndHandle(['logout'], (data: string) => {
        Logger.info(`Logout: ${data}`)
      })
    } catch (error) {
      Logger.error('Error while logging out: ' + error)
      UiController.showError('Logout failed.')
    }
    ExtensionStateManager.reset()
    return { isLogged: false }
  }

  /**
   * Executes tide check-login command.
   * @returns Logged in user data as JSON
   */
  public static async checkLogin(): Promise<UserData> {
    let loggedInUserData: UserData = { logged_in: null }
    try {
      await this.runAndHandle(['check-login', '--json'], (data: string) => {
        Logger.info(`Login data: ${data}`)
        loggedInUserData = JSON.parse(data)
      })
    } catch (error) {
      Logger.error('Error while checking login: ' + error)
      UiController.showError('Login check failed.')
    }
    return loggedInUserData
  }

  /**
   * Fetches user's IDE-compatible courses from TIM.
   * @returns course data
   */
  public static async getCourseList(): Promise<Array<Course>> {
    let courses: Array<Course> = []
    try {
      await this.runAndHandle(['courses', '--json'], async (data: string) => {
        courses = await parseCoursesFromJson(data)
      })
    } catch (error) {
      Logger.error('Error while fetching courses: ' + error)
      UiController.showError('Failed to fetch courses.')
    }
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
    try {
      await this.runAndHandle(
        ['task', 'list', taskSetPath, '--json'],
        async (data: string) => {
          tasks = JSON.parse(data)
        },
        ignoreErrors,
      )
    } catch (error) {
      Logger.error('Error while fetching tasks: ' + error)
      UiController.showError('Failed to fetch tasks.')
    }
    return tasks
  }

  /**
   * Downloads task set from TIM; creates files for each task
   * @param {string} taskSetPath - path to task set. Path can be found by executing cli courses command
   */

  /**
   * Downloads task set from TIM; TIDE-CLI creates files for each task
   * @param courseName Name of the course to be downloaded
   * @param courseDir Course directory set in TIM. If set as null in TIM, this should be called with an empty string ('')
   * @param taskSetPath Course path in TIM
   * @returns a Promise
   */
  public static async downloadTaskSet(courseName: string, courseDir: string, taskSetPath: string) {
    try {
      const downloadPathBase: string | undefined = vscode.workspace
        .getConfiguration()
        .get('TIM-IDE.fileDownloadPath')
      if (downloadPathBase === undefined) {
        UiController.showError('Download path not set!')
        return
      }

      const taskSetName = path.basename(taskSetPath)
      const localCoursePath = path.join(path.normalize(downloadPathBase), courseName)
      let localTaskPath = ''
      if (courseDir.length > 0) {
        localTaskPath = path.join(localCoursePath, courseDir)
      } else {
        localTaskPath = path.join(localCoursePath, taskSetName)
      }
      await this.runAndHandle(
        ['task', 'create', taskSetPath, '-a', '-d', localCoursePath, '-j'],
        (data: string) => {
          Logger.debug(data)
          let cleanData = data.trimStart()
          if (cleanData.startsWith('Task metadata updated')) {
            Logger.info('Task metadata has been updated.')
            cleanData = cleanData.substring(cleanData.indexOf('['))
          }
          const tasks = JSON.parse(cleanData)
          ExtensionStateManager.setTaskSetPaths(localTaskPath, taskSetPath, tasks)
        },
      )
    } catch (error) {
      Logger.error('Error while downloading task set: ' + error)
      UiController.showError('Failed to download task set.')
    }
  }

  /**
   * Creates dotnet solution file if one does not exist and adds all tasks with .csproj files to it as projects.
   * @param course - Course to which the solution file is added
   */
  public static async initDotnetProjects(courseDir: string) {
    try {
      Logger.debug('Creating dotnet solution for course: ' + courseDir)
      await this.runAndHandle(['course', 'init-dotnet-projects', courseDir], (data: string) => {
        Logger.debug(data)
      })
    } catch (error) {
      Logger.error('Error while creating dotnet solution: ' + error)
      UiController.showError('Failed to create dotnet solution.')
    }
  }

  /**
   * Overwrites a local task set
   *
   * @param {string} taskSetPath - TIM path of the task set
   */
  public static async overwriteSetTasks(taskSetPath: string) {
    try {
      await this.runAndHandle(['task', 'create', '-a', '-f', taskSetPath], (data: string) => {
        Logger.debug(data)
      })
    } catch (error) {
      Logger.error('Error while overwriting task set: ' + error)
      UiController.showError('Failed to overwrite task set.')
    }
  }

  /**
   * Overwrites one exercise. Used in task restore commad
   * @param taskSetPath - TIM path for the exercise that is going to be overwritten
   * @param ideTaskId - id/directory for the task that is going to be overwritten
   * @param fileLocation - Local path to the .timdata file which is going to be overwritten
   */
  public static async overwriteTask(taskSetPath: string, ideTaskId: string, fileLocation: string) {
    try {
      await this.runAndHandle(
        ['task', 'create', taskSetPath, ideTaskId, '-f', '-d', fileLocation],
        (data: string) => {
          Logger.debug(data)
        },
      )
      Logger.info('Current task now matches to the latest submission in TIM.')
    } catch (error) {
      Logger.error('Error while overwriting task: ' + error)
      UiController.showError('Failed to overwrite task.')
    }
  }

  /**
   * Resets the noneditable parts of a task file to their original state.
   * @param filePath - Local path to the file which is going to be reset
   */
  public static async resetTask(filePath: string) {
    Logger.info('Resetting current task...')
    try {
      vscode.commands.executeCommand('workbench.action.files.save')
      await this.runAndHandle(['task', 'reset', filePath], (data: string) => {
        Logger.debug(data)
        Logger.info('Current task has been reset.')
      })
    } catch (error) {
      Logger.error('Error while resetting task: ' + error)
      UiController.showError('Failed to reset task.')
    }
  }

  /**
   * Return a task to TIM
   *
   * @param {string} taskPath - path to the task file to be submitted
   */
  public static async submitTask(taskPath: string, callback: (string: any) => any) {
    try {
      Logger.info('The current task is being submitted to TIM. Please wait for the TIM response.')
      await this.runAndHandle(['submit', taskPath], async (data: string) => {
        Logger.info(data)
        callback(data)
        const taskInfo: TaskInfo | undefined = await this.getTaskInfo(taskPath)
        if (taskInfo) {
          this.getTaskPoints(taskInfo.path, taskInfo.ide_task_id)
        } else {
          vscode.window.showErrorMessage('Task data is undefined or invalid.')
        }
      })
    } catch (error) {
      Logger.error('Error while submitting task: ' + error)
      UiController.showError('Failed to submit task.')
    }
  }

  /**
   * Fetch current points for a task from TIM
   * @param taskSetPath TIM path of the taskSet
   * @param ideTaskId ide_task_id of the task that the points are fetched for
   */
  public static async getTaskPoints(taskSetPath: string, ideTaskId: string, _callback: any = undefined) {
    try {
      vscode.commands.executeCommand('tide.setPointsUpdating')
      await this.runAndHandle(
        ['task', 'points', taskSetPath, ideTaskId, '--json'],
        (data: string) => {
          Logger.debug(data)
          const points: TaskPoints = JSON.parse(data)
          ExtensionStateManager.setTaskPoints(taskSetPath, ideTaskId, points)
          vscode.commands.executeCommand('tide.refreshTree')
        },
      )
    } catch (error) {
      Logger.error('Error while fetching task points: ' + error)
      UiController.showError('Failed to fetch task points.')
    }
  }

  public static async getTaskInfo(
    taskPath: string,
    cached: boolean = false,
  ): Promise<TaskInfo | undefined> {
    if (cached && taskDataCache.has(taskPath)) {
      return taskDataCache.get(taskPath)
    }

    let taskData: TaskInfo | undefined = undefined
    try {
      await this.runAndHandle(
        ['task', 'info', path.resolve(taskPath), '--json'],
        (data: string) => {
          Logger.debug(data)
          taskData = JSON.parse(data)
        },
      )
    } catch (error) {
      Logger.debug('Error while fetching task data: ' + error)
    }
    if (taskData) {
      taskDataCache.set(taskPath, taskData)
    }
    return taskData
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
  ): Promise<void> {
    try {
      const cliOutput = await this.spawnTideProcess(...args)
      if (typeof cliOutput === 'string') {
        await handler(cliOutput)
      }
    } catch (err) {
      if (!ignoreErrors) {
        throw err
      }
    }
  }

  /**
   * Executes the process defined in the extension's settings.
   *
   * @param args - arguments to be passed to the executable
   * @returns the stdout of the executed process as a Promise
   */
  private static async spawnTideProcess(...args: Array<string>): Promise<string> {
    Logger.debug(`Running cli with args "${args}"`)
    let buffer = ''
    let errorBuffer = ''

    // Use a copy of process.env to pass custom url to the child process
    const env_modified = { ...process.env }

    let customUrl = vscode.workspace.getConfiguration().get('TIM-IDE.customUrl') as string
    if (customUrl && customUrl.trim() !== '') {
      // Ensure that the custom url ends with a slash
      const formattedUrl = customUrl.trim().endsWith('/')
        ? customUrl.trim()
        : customUrl.trim() + '/'
      env_modified.TIM_URL = formattedUrl
    } else {
      env_modified.TIM_URL = 'https://tim.jyu.fi/'
    }

    // To run an uncompiled version of the CLI tool:
    // 1. Point the cli tool path in your extension settings to the main.py -file
    //const ar = ["run", "python", vscode.workspace.getConfiguration().get("tide.cliPath") as string, ...args];
    // 2. Edit the value of cwd to match the root directory of the cli tool repository
    //const childProcess = cp.spawn("poetry", ar, { cwd: "/Users/stella/tideproject/tide-cli" });

    const childProcess = cp.spawn(
      vscode.workspace.getConfiguration().get('TIM-IDE.cliPath') as string,
      args,
      { env: env_modified },
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
