import * as vscode from 'vscode'
import Logger from '../utilities/logger'

const BYCODEBEGIN = 'BYCODEBEGIN'
const BYCODEEND = 'BYCODEEND'

let editorTextChangeListener: vscode.Disposable | undefined

export const bycodeEditorEventListener = {
  // blockBeginLineIndex = getBlockBeginLineIndex()
  activate(ctx: vscode.ExtensionContext, document: vscode.TextDocument) {
    editorTextChangeListener = vscode.window.onDidChangeTextEditorSelection(
      generateOnSelectionChange(document),
      null,
      ctx.subscriptions,
    )
  },

  deactivate() {
    editorTextChangeListener?.dispose()
  },
}

//
const generateOnSelectionChange = (document: vscode.TextDocument) => {
  const getDocLines = (doc: vscode.TextDocument) => doc.getText().split(/\r?\n/)
  let docTextLines: Array<string> | undefined = getDocLines(document)
  // TODO: if performance optimization is needed, it could assumed that the line number of the line with BYCODEBEGIN will stay the same
  // because editing the preceding contents shouldn't be possible,
  // because of the read-only mode being activated when the cursor is above it
  let bycodeBeginLine: number = docTextLines.findIndex((s) =>
    s.includes(BYCODEBEGIN),
  )
  let bycodeEndLine: number = docTextLines.findIndex((s) =>
    s.includes(BYCODEEND),
  )
  Logger.debug('bycodebegin', bycodeBeginLine, 'bycodeend', bycodeEndLine)
  return function (event: vscode.TextEditorSelectionChangeEvent) {
    Logger.debug('ev', event)

    // TODO: optimize by using docTextLines variable and setting it to undefined at the end of this function
    if (
      !event.textEditor.document
        .lineAt(bycodeBeginLine)
        .text.includes(BYCODEBEGIN)
    ) {
      bycodeBeginLine = getDocLines(document).findIndex((s) =>
        s.includes(BYCODEBEGIN),
      )
    }
    if (
      !event.textEditor.document.lineAt(bycodeEndLine).text.includes(BYCODEEND)
    ) {
      bycodeBeginLine = getDocLines(document).findIndex((s) =>
        s.includes(BYCODEEND),
      )
    }

    const selectionBeginLine: number = Math.min(
      ...event.selections.map((s) => s.start.line),
    )
    const selectionEndLine: number = Math.max(
      ...event.selections.map((s) => s.end.line),
    )
    Logger.debug('s-start:', selectionBeginLine, 's-end:', selectionEndLine)
    Logger.debug('b-start:', bycodeBeginLine, 'b-end:', bycodeEndLine)

    if (
      selectionBeginLine > bycodeBeginLine &&
      selectionEndLine < bycodeEndLine
    ) {
      vscode.commands.executeCommand(
        'workbench.action.files.setActiveEditorWriteableInSession',
      )
    } else {
      vscode.commands.executeCommand(
        'workbench.action.files.setActiveEditorReadonlyInSession',
      )
    }
  }
}

export function isBycodeTaskFile(document: vscode.TextDocument): boolean {
  const docText: string = document.getText()
  return docText.includes(BYCODEBEGIN) && docText.includes(BYCODEEND)
}
