import * as vscode from 'vscode';
import * as init from "./init";
import Logger from './utilities/logger';
import Tide from './api/tide';


// This method is called when your extension is activated
export function activate(ctx: vscode.ExtensionContext) {
    Logger.init('TIDE Logs');
    Logger.show();
    Tide.setCliPath('mock-cli');
    init.registerCommands(ctx);
}

// This method is called when your extension is deactivated
export function deactivate() { }
