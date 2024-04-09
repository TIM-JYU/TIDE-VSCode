import * as cp from 'child_process';
import Logger from '../utilities/logger';
import ExtensionStateManager from './ExtensionStateManager';

/**
 * This class handles communication with the cli tool
 */
export default class Tide {
    public static async login() {
        const res = await this._spawnTideProcess('login');
        Logger.info(res);
    }

    public static async logout() {
        const res = await this._spawnTideProcess('logout');
        Logger.info(res);
    }

    public static async listCourses() {
        const res = await this._spawnTideProcess('courses');
        Logger.info(res);
    }

    // tide task list /polku/jne/yms
    // TODO: Mieti parempi nimi
    /**
     * listaa setin taskit timista
     */
    public static async listSetTasks(taskSetPath: string) {
        const res = await this._spawnTideProcess(`task list ${taskSetPath}`);
        Logger.info(res);
    }

    /**
     * luo task setin taskit lokaalisti
     *
     * @param {string} taskSetPath - task setin kansio
     */
    public static async createSetTasks(taskSetPath: string) {
        // TODO: asetuksista tms taskin polku
        const res = await this._spawnTideProcess(`task create -a ${taskSetPath}`);
        // const res = await this._spawnTideProcess(`task create -a ${taskSetPath} -d ${asetukset.haepolkux}`);
        Logger.info(res);
    }

    /**
     * korvaa lokaalin set taskin
     *
     * @param {string} taskSetPath - task setin kansio
     */
    public static async overwriteSetTasks(taskSetPath: string) {
        // TODO: asetuksista tms taskin polku (kts. createSetTasks())
        const res = await this._spawnTideProcess(`task create -a -f ${taskSetPath}`);
        Logger.info(res);
    }

    /**
     * palauta taski
     *
     * @param {string} taskPath - yksittaisen tehtavan kansio
     */
    public static async submitTask(taskPath: string) {
        // TODO: asetuksista tms taskin polku (kts. createSetTasks())
        const res = await this._spawnTideProcess(`submit ${taskPath}`);
        Logger.info(res);
    }

    // TODO: wrapperifunktio tide-prosessin tulosteen parsimiselle

    private static async _spawnTideProcess(...args: Array<string>): Promise<string> {
        Logger.info(`Running cli with args "${args}"`);
        let buffer = '';
        // TODO: ExtensionStateManagerin sijaan asetuksista
        const childProcess = cp.spawn(ExtensionStateManager.getCliPath(), args);
        
        childProcess.stdout.on('data', data => {
            buffer += data.toString();
        });

        return new Promise<string>((resolve, reject) => {
            childProcess.on('error', error => {
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
