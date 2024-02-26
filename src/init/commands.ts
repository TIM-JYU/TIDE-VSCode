import * as vscode from 'vscode';

export function registerCommands(ctx: vscode.ExtensionContext) {
    ctx.subscriptions.push(
        vscode.commands.registerCommand("tide.hello-world", () => vscode.window.setStatusBarMessage('Hello TIDE!'))
    );
}
