import * as vscode from 'vscode';
import Logger from '../utilities/logger';
import Tide from '../api/tide';

export function registerCommands(ctx: vscode.ExtensionContext) {
    Logger.info('Registering commands.');
    ctx.subscriptions.push(
        vscode.commands.registerCommand('tide.hello-world', () => {
            vscode.window.setStatusBarMessage('Hello TIDE!');
        })
    );

    ctx.subscriptions.push(
        vscode.commands.registerCommand('tide.login', () => {
            Tide.login();
        })
    );

    ctx.subscriptions.push(
        vscode.commands.registerCommand('tide.logout', () => {
            Tide.logout();
        })
    );

    // "commands": [
    //   {
    //     "command": "tide.login",
    //     "title": "Login"
    //   },
    //   {
    //     "command": "tide.logout",
    //     "title": "Log out"
    //   },
    //   {
    //     "command": "tide.list",
    //     "title": "List Available Courses"
    //   },
    //   {
    //     "command": "tide.pull",
    //     "title": "Pull either all tasks for a course or a specific task."
    //   },
    //   {
    //     "command": "tide.push",
    //     "title": "Push either all tasks for a course or a specific task."
    //   }
    // ]
}
