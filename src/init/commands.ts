import * as vscode from 'vscode';
import { Logger } from '../utilities/logger';

export function registerCommands(ctx: vscode.ExtensionContext) {
    Logger.info('Registering commands.');
    ctx.subscriptions.push(
        vscode.commands.registerCommand("tide.hello-world", () => {
            vscode.window.setStatusBarMessage('Hello TIDE!');
        })
    );
}
