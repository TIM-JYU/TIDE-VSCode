import * as vscode from 'vscode';

enum LogLevel {
    Error = 'Error',
    Warning = 'Warning',
    Info = 'Info',
    Debug = 'Debug',
}

export default class Logger {
    private static _outputChannel: vscode.OutputChannel;

    private static getTimeStamp(): string {
        const date = new Date();
        const hoursStr = String(date.getHours()).padStart(2, '0');
        const minutesStr = String(date.getMinutes()).padStart(2, '0');
        const secondsStr = String(date.getSeconds()).padStart(2, '0');
        return `${hoursStr}:${minutesStr}:${secondsStr}`;
    }

    static init(outputChannelName: string) {
        if (!this._outputChannel) {
            this._outputChannel = vscode.window.createOutputChannel(outputChannelName);
        }
    }

    static show() {
        this._outputChannel.show();
    }

    static hide() {
        this._outputChannel.hide();
    }

    static error(msg: string) {
        this.log(msg, LogLevel.Error);
    }

    static warning(msg: string) {
        this.log(msg, LogLevel.Warning);
    }

    static info(msg: string) {
        this.log(msg, LogLevel.Info);
    }

    static debug(msg: string) {
        this.log(msg, LogLevel.Debug);
    }

    private static log(msg: string, level: LogLevel) {
        this._outputChannel.appendLine(`[${this.getTimeStamp()}] [${level}] ${msg}`);
    }
}
