import * as vscode from "vscode";
import Logger from "../utilities/logger";

// TODO: observer

export default class ExtensionStateManager {
    private static globalState: vscode.Memento & { setKeysForSync(keys: readonly string[]): void };
    private static KEY_PREFIX = "tide";

    static setContext(ctx: vscode.ExtensionContext) {
        this.globalState = ctx.globalState;
    }

    /**
     * Sets the path for downloading tasks to the Global State.
     * @param path - The path where the tasks will be downloaded.
     */
    static setDownloadPath(path: string) {
        this.writeToGlobalState("downloadPath", path);
    }

    /**
     * Retrieves the download path from the Global State.
     * @returns The download path stored in the Global State.
     */
    static getDownloadPath(): string {
        return this.readFromGlobalState("downloadPath");
    }

    /**
     * Sets the courses data in the global state.
     * @param courses - An array containing the course data to be stored.
     */
    public static setCourses(courses: any[]) {
        if (ExtensionStateManager.globalState) {
            ExtensionStateManager.globalState.update("courses", courses);
        } else {
            Logger.error("Global state is not set.");
        }
    }

    /**
     * Retrieves courses data from global state.
     * @returns Courses from the global state.
     */
    public static getCourses(): any[] {
        if (ExtensionStateManager.globalState) {
            return ExtensionStateManager.globalState.get("courses") || [];
        } else {
            Logger.error("Global state is not set.");
            return [];
        }
    }

    public static setLoginData(loginData: any[]) {
        if (ExtensionStateManager.globalState) {
            ExtensionStateManager.globalState.update("loginData", loginData);
        } else {
            Logger.error("Global state is not set.");
        }
    }

    public static getLoginData(): any[] {
        if (ExtensionStateManager.globalState) {
            return ExtensionStateManager.globalState.get("loginData") || [];
        } else {
            Logger.error("Global state is not set.");
            return [];
        }
    }

    /**
     * Forms a string with the prefix prepended
     *
     * @static
     * @param {string} key - the rest of the key
     * @returns {string} Prefixed key
     */
    private static prefixedKey(key: string): string {
        return `${this.KEY_PREFIX}.${key}`;
    }

    /**
     * Writes a value to global state and notifies listeners subscribed to the key.
     *
     * @static
     * @param {string} key - Key to write to
     * @param {string} value - Value to write
     */
    private static writeToGlobalState(key: string, value: string) {
        Logger.debug(`Writing to globalState: "${this.prefixedKey(key)}": "${value}"`);
        this.globalState.update(this.prefixedKey(key), value);
        this.notifySubscribers(key, value);
    }

    /**
     * Reads a value saved to the globalState
     *
     * @static
     * @param {string} key - Key of the value queries
     * @returns {string} value matching the key or an empty string if key doesn't exist
     */
    private static readFromGlobalState(key: string): string {
        const prefixedKey = this.prefixedKey(key);
        const value: string = this.globalState.get(prefixedKey) || "";
        Logger.debug(`Found value "${value}" for key "${prefixedKey}" from globalState.`);
        return value;
    }

    // Observer stuff starts here
    private static subscribers: Array<SubscriptionObject> = [];

    /**
     * Subscribe to listen to changes on the value of a given key
     *
     * @static
     * @param {string} key - Key to listen to
     * @param {NotifyFunction} onValueChange - Callback function to call when a change happens
     * @returns {vscode.Disposable} A function for unsubscribing
     */
    public static subscribe(key: string, onValueChange: NotifyFunction): vscode.Disposable {
        Logger.debug(`Someone subscribed to ${key}`);
        const subscriptionObject: SubscriptionObject = { key, onValueChange };
        this.subscribers.push(subscriptionObject);
        const disposableObject = {
            dispose: () => {
                ExtensionStateManager.unsubscribe(subscriptionObject);
            }
        };

        return vscode.Disposable.from(disposableObject);
    }

    /**
     * Unsubscribe a SubscriptionObject
     *
     * @static
     * @param {SubscriptionObject} subscriptionObject - SubscriptionObject to remove
     */
    static unsubscribe(subscriptionObject: SubscriptionObject) {
        Logger.debug(`Someone unsubscribed from ${subscriptionObject.key}`);
        this.subscribers = this.subscribers.filter(subscriber => subscriber !== subscriptionObject);
    }

    /**
     * Calls the callback function of a key's subscribers with the new value as parameter.
     *
     * @static
     * @param {string} key - The key whose subscribers are notified
     * @param {string} value - The new value of the key
     */
    private static notifySubscribers(key: string, value: string) {
        Logger.debug(`Notifying subscribers of the following new value "${key}": "${value}" `)
        this.subscribers.filter(subscriber => subscriber.key === key)
            .forEach(subscriber => subscriber.onValueChange(value));
    }

}

interface SubscriptionObject {
    key: string,
    onValueChange: NotifyFunction
}

interface NotifyFunction {
    (newValue: string): void
}
