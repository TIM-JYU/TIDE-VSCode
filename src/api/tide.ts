import * as cp from "child_process";
import Logger from "../utilities/logger";
import * as vscode from "vscode";
import { LoginData } from "../common/types";

/**
 * This class handles communication with the cli tool
 */
export default class Tide {
	public static async debug() {
		this.runAndHandle([], (data: string) => {
			Logger.debug(data);
		});
	}

	/**
	 * Executes tide login command.
	 */
	public static async login(): Promise<LoginData> {
		let loginData = { isLogged: false };
		await this.runAndHandle(["login", "--json"], (data: string) => {
            const parsedData = JSON.parse(data);
			loginData = { isLogged: parsedData['login_success'] };
		});
		return loginData;
	}

	/**
	 * Executes tide logout command.
	 */
	public static async logout(): Promise<LoginData> {
        // TODO: Mitä tapahtuu jos uloskirjautuminen epäonnistuu?
		await this.runAndHandle(["logout"], (data: string) => {
			Logger.info(`Logout: ${data}`);
		});
        return { isLogged: false };
	}

	/**
	 * Lists user's IDE-compatible courses from TIM in JSON array.
	 * @returns course data
	 */
	public static async listCourses() {
		let coursedata = "";
		await this.runAndHandle(["courses", "--json"], (data: string) => {
			Logger.debug(data);
			coursedata = data;
		});
		return coursedata;
	}

	// tide task list /polku/jne/yms
	// TODO: Mieti parempi nimi
	/**
	 * Lists all the tasks in one task set.
	 * @param taskSetPath path to task set. Path can be found by executing cli courses command
	 * @returns task data
	 */
	public static async listTasksFromSet(taskSetPath: string) {
		let taskdata = "";
		await this.runAndHandle(["task", "list", taskSetPath, "--json"], (data: string) => {
			Logger.debug(data);
			taskdata = data;
		});
		return taskdata;
	}

	/**
	 * Downloads task set from TIM; creates files for each task
	 * @param {string} taskSetPath - path to task set. Path can be found by executing cli courses command
	 */
	public static async downloadTaskSet(taskSetPath: string, downloadPath: string) {
		this.runAndHandle(["task", "create", taskSetPath, "-a", "-d", downloadPath], (data: string) => {
			Logger.debug(data);
		});
	}

	/**
	 * korvaa lokaalin set taskin
	 *
	 * @param {string} taskSetPath - task setin kansio
	 */
	public static async overwriteSetTasks(taskSetPath: string) {
		this.runAndHandle(["task", "create", "-a", "-f", taskSetPath], (data: string) => {
			Logger.debug(data);
		});
	}

	/**
	 * palauta taski
	 *
	 * @param {string} taskPath - yksittaisen tehtavan kansio
	 */
	public static async submitTask(taskPath: string) {
		this.runAndHandle(["submit", taskPath], (data: string) => {
			Logger.debug(data);
		});
		// TODO: asetuksista tms taskin polku (kts. createSetTasks())
	}

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
		let buffer = "";
		//TODO: muuta takaisin toimimaan tidellä
		const ar = ["run", "python", vscode.workspace.getConfiguration().get("tide.cliPath") as string, ...args];
		const childProcess = cp.spawn("poetry", ar, { cwd: "/home/hannes/Documents/kurssit/ties405/TIDE-CLI/" });

		// const childProcess = cp.spawn(vscode.workspace.getConfiguration().get("tide.cliPath") as string, args);

		childProcess.stdout.on("data", (data) => {
			buffer += data.toString();
		});

		return new Promise<string>((resolve, reject) => {
			childProcess.on("error", (error) => {
				Logger.error(`Error spawning child process: ${error}`);
				reject(error);
			});

			childProcess.on("exit", (code, signal) => {
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
