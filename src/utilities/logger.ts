/**
 * This class is used to logging.
 *
 * @author Hannes Koivusipilä
 * @author Stella Palenius
 * @license MIT
 * @date 14.5.2024
 */
import * as vscode from 'vscode'

enum LogLevel {
  Error = 'Error',
  Warning = 'Warning',
  Info = 'Info',
  Debug = 'Debug',
}

export default class Logger {
  private static _outputChannel: vscode.OutputChannel

  private static getTimeStamp(): string {
    const date = new Date()
    const hoursStr = String(date.getHours()).padStart(2, '0')
    const minutesStr = String(date.getMinutes()).padStart(2, '0')
    const secondsStr = String(date.getSeconds()).padStart(2, '0')
    return `${hoursStr}:${minutesStr}:${secondsStr}`
  }

  /**
   * Initialize the logger
   *
   * @static
   * @param outputChannelName - Name to use for the output channel
   */
  static init(outputChannelName: string) {
    if (!this._outputChannel) {
      this._outputChannel = vscode.window.createOutputChannel(outputChannelName)
    }
  }

  /**
   * Show the output channel.
   */
  static show() {
    this._outputChannel.show()
  }

  /**
   * Hide the output channel.
   */
  static hide() {
    this._outputChannel.hide()
  }

  /**
   * Log an error.
   *
   * @param msg - The message to be logged
   */
  static error(msg: string) {
    this.log(msg, LogLevel.Error)
  }

  /**
   * Log a warning.
   *
   * @param msg - The message to be logged
   */
  static warning(msg: string) {
    this.log(msg, LogLevel.Warning)
  }

  /**
   * Log an information message.
   *
   * @param msg - The message to be logged
   */
  static info(msg: string) {
    this.log(msg, LogLevel.Info)
  }

  /**
   * Log a debug message.
   *
   * @param msg - The message to be logged
   */
  static debug(msg: string) {
    // TODO: Add a boolean for debug mode to the class. When turned off the debug method return without logging.
    this.log(msg, LogLevel.Debug)
  }

  private static log(msg: string, level: LogLevel) {
    this._outputChannel.appendLine(`[${this.getTimeStamp()}] [${level}] ${msg}`)
  }
}
