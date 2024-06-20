import * as _vscode from "vscode";
import { MessageType, type WebviewMessage } from "./common/types";

declare global {
	const tsvscode: {
		postMessage: ({ type: MessageType, value: any }: WebviewMessage) => void;
	};
}
