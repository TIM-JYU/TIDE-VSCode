import * as cp from 'child_process';
import Logger from '../utilities/logger';

export default class Tide {
    private static cliPath: string;

    public static setCliPath(path: string) {
        this.cliPath = path;
        Logger.info(`Cli path set to "${path}"`);
    }

    public static async login() {
        Logger.info('Running cli login.');
        const res = await this._spawnTideProcess('login');
        Logger.info(res);
    }

    public static async logout() {
        Logger.info('Running cli logout');
        const res = await this._spawnTideProcess('logout');
        Logger.info(res);
    }

    public static async listCourses() {
        Logger.info(`Running cli list`);
        const res = await this._spawnTideProcess('list');
        Logger.info(res);
    }

    public static async listCourseTasks(courseName: string) {
        Logger.info(`Running cli list ${courseName}`);
        const res = await this._spawnTideProcess('list', courseName);
        Logger.info(res);
    }

    public static async pullAllTasks() {
        Logger.info(`Running cli pull`);
        const res = await this._spawnTideProcess('pull');
        Logger.info(res);
    }

    public static async pullCourseTasks(courseName: string) {
        Logger.info(`Running cli pull ${courseName}`);
        const res = await this._spawnTideProcess('pull', courseName);
        Logger.info(res);
    }

    public static async pullSpecificTask(courseName: string, taskId: string) {
        Logger.info(`Running cli pull ${courseName} ${taskId}`);
        const res = await this._spawnTideProcess('pull', courseName, taskId);
        Logger.info(res);
    }

    public static async pushAllTasks() {
        Logger.info(`Running cli push`);
        const res = await this._spawnTideProcess('push');
        Logger.info(res);
    }

    public static async pushCourseTasks(courseName: string) {
        Logger.info(`Running cli push ${courseName}`);
        const res = await this._spawnTideProcess('push', courseName);
        Logger.info(res);
    }

    public static async pushSpecificTask(courseName: string, taskId: string) {
        Logger.info(`Running cli push ${courseName} ${taskId}`);
        const res = await this._spawnTideProcess('push', courseName, taskId);
        Logger.info(res);
    }

    private static async _spawnTideProcess(...args: Array<string>): Promise<string> {
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
