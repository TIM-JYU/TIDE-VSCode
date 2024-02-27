import * as vscode from 'vscode';
import * as init from "./init";
import { Logger } from './utilities/logger';


// This method is called when your extension is activated
export function activate(ctx: vscode.ExtensionContext) {
    Logger.init('TIDE Logs');
    init.registerCommands(ctx);
}

// This method is called when your extension is deactivated
export function deactivate() {}
