import * as vscode from "vscode";
import * as init from "./init";
import Logger from "./utilities/logger";
import { SidebarProvider } from "./panels/SidebarProvider";
import ExtensionStateManager from "./api/ExtensionStateManager";

// This method is called when your extension is activated
export function activate(ctx: vscode.ExtensionContext) {
	Logger.init("TIDE Logs");
	Logger.show();
    ExtensionStateManager.setContext(ctx);
	init.registerCommands(ctx);

	// Creates and registers the side menu on the left
	const sidebarProvider = new SidebarProvider(ctx.extensionUri);
	ctx.subscriptions.push(vscode.window.registerWebviewViewProvider("tide-sidebar", sidebarProvider));
}

// This method is called when your extension is deactivated
export function deactivate() {}
