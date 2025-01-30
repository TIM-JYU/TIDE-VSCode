import * as _vscode from 'vscode'
import { MessageType, type WebviewMessage } from '../src/common/types'

declare global {
  const tsvscode: {
    postMessage: ({ type: MessageType, value: any }: WebviewMessage) => void
  }
}
