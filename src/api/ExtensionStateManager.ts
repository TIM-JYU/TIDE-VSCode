import * as vscode from "vscode";
import Logger from "../utilities/logger";

export default class ExtensionStateManager {
    private static globalState: vscode.Memento & { setKeysForSync(keys: readonly string[]): void; };
    private static KEY_PREFIX = 'tide';

    static setContext(ctx: vscode.ExtensionContext)     {
        this.globalState = ctx.globalState;
    }

    // TODO: settings type
    static setSettings(settings: any) {
        for (let key in settings) {
            if (settings.hasOwnProperty(key)) {
                this.writeToGlobalState(key, settings[key]);
            }
        }
    }

    static setCliPath(path: string) {
        this.writeToGlobalState('cliPath', path);
    }

    static getCliPath(): string {
        return this.readFromGlobalState('cliPath');
    }

    private static prefixedKey(key: string): string {
        return `${this.KEY_PREFIX}.${key}`;
    }

    private static writeToGlobalState(key: string, value: string) {
        Logger.debug(`Writing to globalState: "${this.prefixedKey(key)}": "${value}"`);
        this.globalState.update(this.prefixedKey(key), value);
    }

    private static readFromGlobalState(key: string): string {
        const prefixedKey = this.prefixedKey(key);
        const value: string = this.globalState.get(prefixedKey) || '';
        Logger.debug(`Found value "${value}" for key "${prefixedKey}" from globalState.`);
        return value;
    }
}

