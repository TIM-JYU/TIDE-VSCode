/**
 * Manages the global state for the extension.
 *
 * This class handles storing and retrieving various states such as download paths,
 * course data, and login information in the VSCode global state. It also allows
 * for subscribing to changes in specific state keys.
 *
 * @author Hannes Koivusipilä
 * @author Stella Palenius
 * @license MIT
 * @date 27.3.2024
 */

import * as vscode from 'vscode'
import Logger from '../utilities/logger'
import {
  Course,
  CourseStatus,
  FileStatus,
  LoginData,
  TaskPoints,
  TimData,
  UserData,
} from '../common/types'
import Formatting from '../common/formatting'
import path from 'path'
import * as fs from 'fs'

export default class ExtensionStateManager {
  private static globalState: vscode.Memento & {
    setKeysForSync(keys: readonly string[]): void
  }

  private static KEY_PREFIX = 'tide'

  static setContext(ctx: vscode.ExtensionContext) {
    this.globalState = ctx.globalState
  }

  /**
   * Sets the courses data in the global state.
   * @param courses - An array containing the course data to be stored.
   */
  public static setCourses(courses: Array<Course>) {
    this.writeToGlobalState(StateKey.Courses, courses)
  }

  /**
   * Retrieves courses data from global state.
   * @returns Courses data from the global state.
   */
  public static getCourses(): Array<Course> {
    return this.readFromGlobalState(StateKey.Courses)
  }

  /**
   * Set loginData to global state
   * @param loginData LoginData object to be saved to global state
   */
  public static setLoginData(loginData: LoginData) {
    this.writeToGlobalState(StateKey.LoginData, loginData)
  }

  /**
   * Retrieves loginData from global state
   * @returns loginData object saved to global state
   */
  public static getLoginData(): LoginData {
    return this.readFromGlobalState(StateKey.LoginData)
  }

  /**
   * Sets user data to global state
   * @param loggedInUserData UserData object saved to the global state
   */
  public static setUserData(loggedInUserData: UserData) {
    this.writeToGlobalState(StateKey.UserData, loggedInUserData)
  }

  /**
   * Retrieves user data from global state
   * @returns User Data saved to the global state
   */
  public static getUserData(): UserData {
    return this.readFromGlobalState(StateKey.UserData)
  }

  /**
   * Set the downloadpath for Tasks inside TaskSets inside Courses. Currently saves a normalized path (tide.ts)
   * @param localCoursePath Local path to course folder. This is set as the downloadPath of the course
   * @param taskSetPath TIM path for the course
   * @param tasks Data of the tasks for which the download_paths are set
   */
  static setTaskSetPaths(
    localCoursePath: string,
    taskSetPath: string,
    tasks: Array<Array<FileStatus>>,
  ) {
    const courses: Array<Course> = this.getCourses()
    courses.forEach((course) => {
      course.taskSets.forEach((taskSet) => {
        if (taskSet.path === taskSetPath) {
          taskSet.downloadPath = localCoursePath
          for (const group of tasks) {
            for (const file of group) {
              const task = taskSet.tasks.find((task) =>
                task.task_files?.some(
                  (taskFile) =>
                    taskFile.task_id_ext === file.task_id_ext &&
                    taskFile.file_name === file.file_name,
                ),
              )
              if (task) {
                // TODO: Do we want to save actual or normalized paths?
                task.download_path = Formatting.normalizePath(file.path)
              }
            }
          }
          return
        }
      })
    })
    this.writeToGlobalState(StateKey.Courses, courses)
  }

  /**
   * Set a courses status. The status is used to determine where to show the course in the Course Panel and to show or hide the course from the Course Explorer
   * @param id of the course
   * @param status to be set. Should be either 'active' or 'hidden'
   */
  static setCourseStatus(id: number, status: CourseStatus) {
    const courses: Array<Course> = this.readFromGlobalState(StateKey.Courses)
    const courseIdx = courses.findIndex((course) => course.id === id)
    courses[courseIdx].status = status
    this.writeToGlobalState(StateKey.Courses, courses)
  }

  /**
   * Store points for a task
   * @param taskSetPath of the task
   * @param ideTaskId of the task
   * @param taskPoints a TaskPoints object containing the points amount to be stored
   */
  static setTaskPoints(taskSetPath: string, ideTaskId: string, taskPoints: TaskPoints) {
    // TODO: This could be a hashmap
    let taskPointsData = this.readFromGlobalState(StateKey.TaskPoints)
    if (taskPointsData === undefined) {
      taskPointsData = {}
    }
    if (taskPointsData[taskSetPath] === undefined) {
      taskPointsData[taskSetPath] = {}
    }
    taskPointsData[taskSetPath][ideTaskId] = taskPoints
    this.writeToGlobalState(StateKey.TaskPoints, taskPointsData)
  }

  /**
   * Get task points for a task
   * @param taskSetPath of the task
   * @param ideTaskId of the task
   * @returns a TaskPoints object with the tasks points. A TaskPoints object with current_points: 0 is returned if no points is stored with for the given information
   */
  static getTaskPoints(taskSetPath: string, ideTaskId: string): TaskPoints | undefined {
    try {
      const taskPoints = this.readFromGlobalState(StateKey.TaskPoints)
      if (taskPoints === undefined) {
        return undefined
      }
      if (taskPoints[taskSetPath][ideTaskId]) {
        return taskPoints[taskSetPath][ideTaskId]
      } else {
        return { current_points: 0 }
      }
    } catch (error) {
      Logger.error(String(error))
    }
  }

  // This is for learning purposes only
  static getAllTaskPoints(): TaskPoints | undefined {
    const taskPoints = this.readFromGlobalState(StateKey.TaskPoints)
    return taskPoints
  }

  /**
   * Updates the timdata of a course, this should be called after downloading a new task set from tim, since it will modify the old .timdata file
   * @param taskSetPath This path and the downloadpath the user has set are used to find the new .timdata file, which is then saved
   */
  static updateTimData(taskSetPath: string) {
    const course: Course = this.getCourseByTasksetPath(taskSetPath)
    const taskset = course.taskSets.find((taskSet) => taskSet.path === taskSetPath)
    if (taskset) {
      // Find the path to the new .timdata file
      if (!taskset.downloadPath) {
        throw new Error('Download path is undefined for the task set.')
      } else {
        const pathToTimDataFile = path.join(path.dirname(taskset.downloadPath), '.timdata')
        ExtensionStateManager.readAndSaveTimData(pathToTimDataFile)
      }
    }
  }

  /**
   * Read a .timdata file and save a TimData object for each task (demo) found in the file
   * @param filePath Actual path to a .timdata file
   */
  static readAndSaveTimData(filePath: string) {
    try {
      // Read the timdata object from the file
      const timDataRaw = fs.readFileSync(filePath)
      const timData = JSON.parse(timDataRaw.toString())

      // course_parts includes all task sets (demos)
      let courseParts = Object.keys(timData.course_parts)
      courseParts.forEach((demo) => {
        let taskData = timData.course_parts[demo].tasks
        let keys = Object.keys(taskData)
        keys.forEach((element) => {
          // Save each task as separate objects into TimData
          const newTimData: TimData = timData.course_parts[demo].tasks[element]
          ExtensionStateManager.addTimData(newTimData)
        })
      })
    } catch (err) {
      Logger.error(String(err))
    }
  }

  /**
   * Add a new TimData object (a Task parsed from a .timdata file)
   * Each Task in Tim data is saved for later use as an Array of TimData objects:
   * [{.timData task object}, {.timData task object}, ...]
   * Only the tasks data (each task as one object) is saved from the .timdata files
   * Duplicate TimData objects are not saved
   * TODO: Is it necessary to update old TimData objects when a possible duplicate is found?
   * @param timData a TimData object (a task in a .timdata file) to be added
   */
  static addTimData(timData: TimData) {
    let allTimData: Array<TimData> = this.readFromGlobalState(StateKey.TimData)
    let save = true
    if (allTimData === undefined) {
      allTimData = []
    }

    allTimData.forEach((element) => {
      // If an element has the same ide_task_id and path it is the same unique timdata object -> dont save a duplicate
      if (element.ide_task_id === timData.ide_task_id && element.path === timData.path) {
        save = false
      }
    })

    // Only save timdata if it's not a dublicate
    if (save) {
      allTimData.push(timData)
      this.writeToGlobalState(StateKey.TimData, allTimData)
    }
  }

  /**
   * Get all TimData
   * @returns All TimData saved to globalstate
   */
  static getTimData(): Array<TimData> {
    const allTimData: Array<TimData> = this.readFromGlobalState(StateKey.TimData)
    if (allTimData) {
      return allTimData
    } else {
      return []
    }
  }

  /**
   * Find a TimData object using a file path
   * @param taskfilePath Actual path to a task file
   * @returns a TimData object that contains the given file as either a task or a supplementary file, undefined if a fitting TimData object isn't found
   */
  static getTimDataByFilepath(taskfilePath: string): TimData | undefined {
    const courses: Array<Course> = this.getCourses()
    const normalizedPath = Formatting.normalizePath(taskfilePath)
    let id: number = -1
    courses.find((course) => {
      course.taskSets.some((taskSet) => {
        taskSet.tasks.some((task) => {
          // Return if a taskSet(demo) was found
          if (!task.download_path) {
            return
          }
          if (id > -1) {
            return
          }
          if (
            task.download_path &&
            normalizedPath === Formatting.normalizePath(task.download_path)
          ) {
            id = taskSet.doc_id
          } else {
            // If it turns out there is a possibility of more than 1 task_file in a task
            // this needs to be refactored to take that into account
            task.supplementary_files.some((supFile) => {
              let supPath = task.download_path?.replace(task.task_files?.at(0)?.file_name ?? '', '')
              supPath = supPath + supFile.file_name.replaceAll('/', path.sep)
              if (normalizedPath === Formatting.normalizePath(supPath)) {
                id = taskSet.doc_id
              }
            })
          }
        })
      })
    })

    if (id !== -1) {
      const allTimData: Array<TimData> = this.getTimData()
      let timData = allTimData.find(
        (timData) =>
          timData.doc_id === id &&
          timData.task_files.some((taskFile) => {
            const parsedTaskDir = taskFile.task_directory ?? ''
            if (parsedTaskDir.length > 0) {
              return normalizedPath.includes(
                Formatting.normalizeSeparator(parsedTaskDir + path.sep + taskFile.file_name),
              )
            } else {
              const pathParts = timData.path.split('/')
              const demo = pathParts.at(-1)
              if (demo) {
                return normalizedPath.includes(
                  Formatting.normalizeSeparator(
                    path.join(demo, timData.ide_task_id, taskFile.file_name),
                  ),
                )
              } else {
                // This should never be reached
                return normalizedPath.includes(
                  Formatting.normalizeSeparator(path.join(timData.ide_task_id, taskFile.file_name)),
                )
              }
            }
          }),
      )
      // Added for Java course additional extra files
      if (!timData) {
        timData = allTimData.find(
          (timData) =>
            timData.doc_id === id &&
            timData.task_files.some((taskFile) => taskfilePath.includes(taskFile.file_name)),
        )
      }
      if (!timData) {
        // Search for supplementary files!
        timData = allTimData.find(
          (timData) =>
            timData.doc_id === id &&
            timData.supplementary_files.some((supFile) => {
              const parsedSupFileTaskDir = supFile.task_directory ?? ''
              const supFileNameToOsPath = supFile.file_name
              return normalizedPath.includes(
                Formatting.normalizeSeparator(
                  parsedSupFileTaskDir + path.sep + supFileNameToOsPath,
                ),
              )
            }),
        )
      }
      return timData
    }
    return undefined
  }

  static reset() {
    // let key: keyof typeof StateKey
    // for (key in StateKey) {
    //   Logger.debug(`Reseting globalState: "${this.prefixedKey(key)}" `)
    //   this.globalState.update(this.prefixedKey(key), undefined)
    // }
    this.writeToGlobalState(StateKey.Courses, undefined)
    this.writeToGlobalState(StateKey.LoginData, undefined)
    this.writeToGlobalState(StateKey.TaskPoints, undefined)
    this.writeToGlobalState(StateKey.TimData, undefined)
  }

  /**
   * Forms a string with the prefix prepended
   *
   * @static
   * @param {string} key - the rest of the key
   * @returns {string} Prefixed key
   */
  private static prefixedKey(key: string): string {
    return `${this.KEY_PREFIX}.${key}`
  }

  /**
   * Writes a value to global state and notifies listeners subscribed to the key.
   *
   * @static
   * @param {string} key - Key to write to
   * @param {string} value - Value to write
   */
  private static writeToGlobalState(key: StateKey, value: any) {
    Logger.debug(`Writing to globalState: "${this.prefixedKey(key)}": `, value)
    this.globalState.update(this.prefixedKey(key), value)
    this.notifySubscribers(key, value)
  }

  /**
   * Reads a value saved to the globalState
   *
   * @static
   * @param {string} key - Key of the value queries
   * @returns {string} value matching the key or an empty string if key doesn't exist
   */
  private static readFromGlobalState(key: StateKey): any {
    const prefixedKey = this.prefixedKey(key)
    const value: any = this.globalState.get(prefixedKey)
    return value
  }

  // Observer stuff starts here
  private static subscribers: Array<SubscriptionObject> = []

  /**
   * Subscribe to listen to changes on the value of a given key. Calls the NotifyFunction with current value.
   *
   * @static
   * @param {string} key - Key to listen to
   * @param {NotifyFunction} onValueChange - Callback function to call when a change happens
   * @returns {vscode.Disposable} A function for unsubscribing
   */
  public static subscribe(key: StateKey, onValueChange: NotifyFunction): vscode.Disposable {
    Logger.debug(`Subscribed to ${key}`)
    const subscriptionObject: SubscriptionObject = { key, onValueChange }
    this.subscribers.push(subscriptionObject)
    const disposableObject = {
      dispose: () => {
        ExtensionStateManager.unsubscribe(subscriptionObject)
      },
    }

    // TODO: is it necessary to send the value of a key when subscribing to it?
    onValueChange(this.readFromGlobalState(key))

    return vscode.Disposable.from(disposableObject)
  }

  /**
   * Unsubscribe a SubscriptionObject
   *
   * @static
   * @param {SubscriptionObject} subscriptionObject - SubscriptionObject to remove
   */
  static unsubscribe(subscriptionObject: SubscriptionObject) {
    Logger.debug(`Unsubscribed from ${subscriptionObject.key}`)
    this.subscribers = this.subscribers.filter((subscriber) => subscriber !== subscriptionObject)
  }

  /**
   * Calls the callback function of a key's subscribers with the new value as parameter.
   *
   * @static
   * @param {string} key - The key whose subscribers are notified
   * @param {string} value - The new value of the key
   */
  private static notifySubscribers(key: StateKey, value: unknown) {
    Logger.debug('Notifying subscribers of the following new value', key, value)
    this.subscribers
      .filter((subscriber) => subscriber.key === key)
      .forEach((subscriber) => subscriber.onValueChange(value))
  }

  /**
   * Retrieves a course by its task set path.
   * @param taskSetPath The path of the task set in TIM.
   * @returns The course associated with the task set path.
   */
  public static getCourseByTasksetPath(taskSetPath: string): Course {
    const courses = this.getCourses()
    const course = courses.find((course) =>
      course.taskSets.some((taskSet) => taskSet.path === taskSetPath),
    )
    if (!course) {
      throw new Error(`Course not found for task set path: ${taskSetPath}`)
    }
    return course
  }

  /**
   * Find a course that includes a taskset that includes a task with the given path as its download_path
   * @param filePath Actual path of a file
   * @returns a course that contains a task with the given path as one of its tasks download_path
   */
  public static getCourseByFilePath(filePath: string): Course {
    const courses = this.getCourses()
    const normPath = Formatting.normalizePath(filePath)
    const course = courses.find((course) =>
      course.taskSets.some((taskSet) =>
        taskSet.tasks.some((task) => task.download_path === normPath),
      ),
    )
    if (!course) {
      throw new Error(`This file doesn't seem to be part of the TIDE task: ${filePath}`)
    }
    return course
  }

  /**
   * Retrieves a course by its TIM path.
   * @param downloadPath The TIM path of the task set.
   * @returns The course associated with the TIM path.
   */
  public static getCourseByCoursePath(coursePath: string): Course {
    const courses = this.getCourses()
    const course: Course | undefined = courses.find((course) => course.path === coursePath)
    if (!course) {
      throw new Error(`Course with path: ${coursePath} not found`)
    }
    return course
  }
}

/**
 * Represents the data required for subscribing to the ExtensionStateManager
 *
 * @interface SubscriptionObject
 * @field {string} key - The key to listen to
 * @field {NotifyFunction} onValueChange - The function to call when the value of the key is changed
 */
interface SubscriptionObject {
  key: string
  onValueChange: NotifyFunction
}

interface NotifyFunction {
  (newValue: any): void
}

// type StateKey = 'courses' | 'loginData' | 'taskPoints'
export enum StateKey {
  Courses = 'courses',
  LoginData = 'loginData',
  UserData = 'userData',
  TaskPoints = 'taskPoints',
  TimData = 'timData',
}
