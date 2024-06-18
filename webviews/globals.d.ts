import * as _vscode from "vscode";
import { MessageType } from "./common/types";

declare global {
	const tsvscode: {
		postMessage: ({ type: MessageType, value: unknown }) => void;
	};
}
