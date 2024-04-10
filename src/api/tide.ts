import * as cp from 'child_process';
import Logger from '../utilities/logger';
import * as vscode from "vscode";

/**
 * This class handles communication with the cli tool
 */
export default class Tide {
  public static async debug() {
    this.runAndHandle([], (data: string) => {
      Logger.debug(data);
    });
  }

  public static async login() {
    this.runAndHandle(
      ['login'],
      (data: string) => {
        Logger.debug(data);
      });
  }

  public static async logout() {
    this.runAndHandle(
      ['logout']
      , (data: string) => {
        Logger.debug(data);
      });
  }

  public static async listCourses() {
    this.runAndHandle(
      ['courses'],
      (data: string) => {
        Logger.debug(data);
      });
  }

  // tide task list /polku/jne/yms
  // TODO: Mieti parempi nimi
  /**
   * listaa setin taskit timista
   */
  public static async listSetTasks(taskSetPath: string) {
    this.runAndHandle(
      ['task', 'list', taskSetPath],
      (data: string) => {
        Logger.debug(data);
      });
  }

  /**
   * luo task setin taskit lokaalisti
   *
   * @param {string} taskSetPath - task setin kansio
   */
  public static async createSetTasks(taskSetPath: string) {
    this.runAndHandle(
      ['task', 'create', '-a', taskSetPath],
      (data: string) => {
        Logger.debug(data);
      });
  }

  /**
   * korvaa lokaalin set taskin
   *
   * @param {string} taskSetPath - task setin kansio
   */
  public static async overwriteSetTasks(taskSetPath: string) {
    this.runAndHandle(
      ['task', 'create', '-a', '-f', taskSetPath],
      (data: string) => {
        Logger.debug(data);
      });
  }

  /**
   * palauta taski
   *
   * @param {string} taskPath - yksittaisen tehtavan kansio
   */
  public static async submitTask(taskPath: string) {
    this.runAndHandle(
      ['submit', taskPath],
      (data: string) => {
        Logger.debug(data);
      });
    // TODO: asetuksista tms taskin polku (kts. createSetTasks())
  }

  // TODO: wrapperifunktio tide-prosessin tulosteen parsimiselle


  // TODO: Keksi parempi nimi
  private static async runAndHandle(args: Array<string>, handler: HandlerFunction) {
    const data = await this.spawnTideProcess(...args);
    handler(data);
  }

  // x(json: string) {
  //     type kissa = {
  //         nimi: string
  //     };
  //     const objekti = JSON.parse(json) as kissa;
  // }

  private static async spawnTideProcess(...args: Array<string>): Promise<string> {
    Logger.debug(`Running cli with args "${args}"`);
    let buffer = '';
    const childProcess = cp.spawn(vscode.workspace.getConfiguration().get("tide.cliPath") as string, args);

    childProcess.stdout.on('data', data => {
      buffer += data.toString();
    });

    return new Promise<string>((resolve, reject) => {
      childProcess.on('error', error => {
        Logger.error(`Error spawning child process: ${error}`);
        reject(error);
      });

      childProcess.on('exit', (code, signal) => {
        if (code === 0) {
          resolve(buffer);
        } else {
          reject(new Error(`Process exited with code ${code} and signal ${signal}`));
        }

      });
    });
  }
}

type HandlerFunction = (data: string) => void;
