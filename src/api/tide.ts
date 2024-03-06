import * as cp from 'child_process';
import Logger from '../utilities/logger';

export default class Tide {
    private static cliPath: string;

    public static setCliPath(path: string) {
        this.cliPath = path;
        Logger.info(`Cli path set to "${path}"`);
    }

    public static async login() {
        const res = await this._spawnTideProcess('login');
        Logger.info(res);
    }

    public static async logout() {
        const res = await this._spawnTideProcess('logout');
        Logger.info(res);
    }

    public static async listCourses() {
        const res = await this._spawnTideProcess('list');
        Logger.info(res);
    }

    public static async listCourseTasks(courseName: string) {
        const res = await this._spawnTideProcess('list', courseName);
        Logger.info(res);
    }

    public static async pullAllTasks() {
        const res = await this._spawnTideProcess('pull');
        Logger.info(res);
    }

    public static async pullCourseTasks(courseName: string) {
        const res = await this._spawnTideProcess('pull', courseName);
        Logger.info(res);
    }

    public static async pullSpecificTask(courseName: string, taskId: string) {
        const res = await this._spawnTideProcess('pull', courseName,'--task', taskId);
        Logger.info(res);
    }

    public static async pushAllTasks() {
        const res = await this._spawnTideProcess('push');
        Logger.info(res);
    }

    public static async pushCourseTasks(courseName: string) {
        const res = await this._spawnTideProcess('push', courseName);
        Logger.info(res);
    }

    public static async pushSpecificTask(courseName: string, taskId: string) {
        const res = await this._spawnTideProcess('push', courseName, '--task', taskId);
        Logger.info(res);
    }

    private static async _spawnTideProcess(...args: Array<string>): Promise<string> {
        Logger.info(`Running cli with args "${args}"`);
        let buffer = '';
        const childProcess = cp.spawn(this.cliPath, args);
        
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
