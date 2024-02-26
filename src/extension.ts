import * as vscode from 'vscode';
import * as init from "./init";


// This method is called when your extension is activated
export function activate(ctx: vscode.ExtensionContext) {
    init.registerCommands(ctx);
}

// This method is called when your extension is deactivated
export function deactivate() {}
