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
import { Course, CourseStatus, LoginData } from '../common/types'

export default class ExtensionStateManager {
  private static globalState: vscode.Memento & {
    setKeysForSync(keys: readonly string[]): void
  }

  private static KEY_PREFIX = 'tide'

  static setContext(ctx: vscode.ExtensionContext) {
    this.globalState = ctx.globalState
  }

  // TODO: why is this in both globalstate and settings

  /**
   * Sets the path for downloading tasks to the Global State.
   * @param path - The path where the tasks will be downloaded.
   */
  static setDownloadPath(path: string) {
    this.writeToGlobalState('downloadPath', path)
  }

  /**
   * Retrieves the download path from the Global State.
   * @returns The download path stored in the Global State.
   */
  static getDownloadPath(): string {
    return this.readFromGlobalState('downloadPath')
  }

  /**
   * Sets the courses data in the global state.
   * @param courses - An array containing the course data to be stored.
   */
  public static setCourses(courses: Array<Course>) {
    this.writeToGlobalState('courses', courses)
  }

  /**
   * Retrieves courses data from global state.
   * @returns Courses from the global state.
   */
  public static getCourses(): Array<Course> {
    return this.readFromGlobalState('courses')
  }

  /**
   * Sets the login data in the global state
   *
   * @static
   * @param {LoginData} loginData - the data to be saved
   */
  public static setLoginData(loginData: LoginData) {
    this.writeToGlobalState('loginData', loginData)
  }

  /**
   * Retrieves login data from global state
   *
   * @static
   * @returns {LoginData} LoginData saved to the global state
   */
  public static getLoginData(): LoginData {
    return this.readFromGlobalState('loginData')
  }

  /**
   * Sets the download path for a specific task set path in the Global State.
   * @param taskSetPath - The path of the task set.
   * @param downloadPath - The path where the task set will be downloaded.
   */
  static setTaskSetDownloadPath(taskSetPath: string, downloadPath: string) {
    const courses: Array<Course> = this.readFromGlobalState('courses')
    courses.forEach((course) => {
      course.taskSets.forEach((taskSet) => {
        if (taskSet.path === taskSetPath) {
          taskSet.downloadPath = downloadPath
        }
      })
    })
    this.writeToGlobalState('courses', courses)
  }

  /**
   * Retrieves the download path for a specific task set path from the Global State.
   * @param taskSetPath - The path of the task set.
   * @returns The download path stored for the specified task set path.
   */
  static getTaskSetDownloadPath(taskSetPath: string): string | undefined {
    const courses: Array<Course> = this.readFromGlobalState('courses')
    const downloadPath = courses
      .flatMap((course) => course.taskSets)
      .find((taskSet) => taskSet.path === taskSetPath)?.downloadPath
    return downloadPath
  }

  static setCourseStatus(id: number, status: CourseStatus) {
    const courses: Array<Course> = this.readFromGlobalState('courses')
    const courseIdx = courses.findIndex((course) => course.id === id)
    courses[courseIdx].status = status
    this.writeToGlobalState('courses', courses)
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
    Logger.debug(`Found the following value from key "${prefixedKey}"`, value)
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
    Logger.debug(`Someone subscribed to ${key}`)
    const subscriptionObject: SubscriptionObject = { key, onValueChange }
    this.subscribers.push(subscriptionObject)
    const disposableObject = {
      dispose: () => {
        ExtensionStateManager.unsubscribe(subscriptionObject)
      },
    }

    // TODO: is sending the info when subscribing ok?
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
    Logger.debug(`Someone unsubscribed from ${subscriptionObject.key}`)
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

// TODO: Refactor from using string to using type StateKey for referring to keys
export type StateKey = 'courses' | 'downloadPath' | 'loginData'
