import * as vscode from 'vscode'
import Logger from '../utilities/logger'

// TODO: support different keywords
const EDITABLE_BEGIN = 'BYCODEBEGIN'
const EDITABLE_END = 'BYCODEEND'

let editorTextChangeListener: vscode.Disposable | undefined

export const editableAreaEventListener = {
  activate: (ctx: vscode.ExtensionContext, document: vscode.TextDocument) => {
    editorTextChangeListener = vscode.window.onDidChangeTextEditorSelection(
      generateOnSelectionChange(document),
      null,
      ctx.subscriptions,
    )
  },

  deactivate: () => {
    editorTextChangeListener?.dispose()
  },
}

export const validateNoneditableArea = (
  document: vscode.TextDocument,
  originalTaskFileContent: string,
) => {
  // empty lines are ignored
  const noneditableDocumentLines = parseNoneditableLines(document.getText())
  const noneditableOriginalLines = parseNoneditableLines(originalTaskFileContent)
  if (noneditableDocumentLines.length !== noneditableOriginalLines.length) {
    return false
  }
  return noneditableDocumentLines.every((value, idx) => {
    value === noneditableOriginalLines[idx]
  })
}

const parseNoneditableLines = (text: string): Array<string> => {
  let insideEditable: boolean = false
  return text
    .split(/\r?\n/)
    .filter((s) => s.length > 0)
    .reduce((acc: Array<string>, cur: string) => {
      if (cur.includes(EDITABLE_END)) {
        insideEditable = false
      }
      if (insideEditable) {
        return acc
      }
      if (cur.includes(EDITABLE_BEGIN)) {
        insideEditable = true
      }
      return [...acc, cur]
    }, [])
}

const generateOnSelectionChange = (document: vscode.TextDocument) => {
  const getDocLines = (doc: vscode.TextDocument) => doc.getText().split(/\r?\n/)
  let docTextLines: Array<string> | undefined = getDocLines(document)
  // TODO: if performance optimization is needed, it could assumed that the line number of the line with BYCODEBEGIN will stay the same
  // because editing the preceding contents shouldn't be possible,
  // because of the read-only mode being activated when the cursor is above it
  let bycodeBeginLine: number = docTextLines.findIndex((s) => s.includes(EDITABLE_BEGIN))
  let bycodeEndLine: number = docTextLines.findIndex((s) => s.includes(EDITABLE_END))
  Logger.debug('bycodebegin', bycodeBeginLine, 'bycodeend', bycodeEndLine)
  return function (event: vscode.TextEditorSelectionChangeEvent) {
    Logger.debug('ev', event)
    Logger.debug('nel', parseNoneditableLines(event.textEditor.document.getText()))

    // TODO: optimize by using docTextLines variable and setting it to undefined at the end of this function
    if (!event.textEditor.document.lineAt(bycodeBeginLine).text.includes(EDITABLE_BEGIN)) {
      bycodeBeginLine = getDocLines(document).findIndex((s) => s.includes(EDITABLE_BEGIN))
    }

    if (!event.textEditor.document.lineAt(bycodeEndLine).text.includes(EDITABLE_END)) {
      bycodeEndLine = getDocLines(document).findIndex((s) => s.includes(EDITABLE_END))
    }

    const selectionBeginLine: number = Math.min(...event.selections.map((s) => s.start.line))
    const selectionEndLine: number = Math.max(...event.selections.map((s) => s.end.line))

    Logger.debug('s-start:', selectionBeginLine, 's-end:', selectionEndLine)
    Logger.debug('b-start:', bycodeBeginLine, 'b-end:', bycodeEndLine)

    updateBaseDecorations(event.textEditor, bycodeBeginLine, bycodeEndLine)

    if (selectionBeginLine > bycodeBeginLine && selectionEndLine < bycodeEndLine) {
      vscode.commands.executeCommand('workbench.action.files.setActiveEditorWriteableInSession')
      event.textEditor.setDecorations(notInsideBycodeNotificationDecorationType, [])
    } else {
      vscode.commands.executeCommand('workbench.action.files.setActiveEditorReadonlyInSession')
      event.textEditor.setDecorations(notInsideBycodeNotificationDecorationType, [
        {
          range: new vscode.Range(
            new vscode.Position(selectionBeginLine, 0),
            new vscode.Position(selectionEndLine, 0),
          ),
          hoverMessage: 'Tätä riviä ei ole tarkoitus muokata.',
        },
      ])
    }
  }
}

const updateBaseDecorations = (
  editor: vscode.TextEditor,
  bycodeBegin: number,
  bycodeEnd: number,
) => {
  // decorations for areas outside of bycode
  const beforeBycode = new vscode.Range(
    new vscode.Position(0, 0),
    new vscode.Position(bycodeBegin, 0),
  )
  const afterBycode = new vscode.Range(
    new vscode.Position(bycodeEnd, 0),
    new vscode.Position(editor.document.lineCount - 1, 0),
  )
  const decorations = [{ range: beforeBycode }, { range: afterBycode }]
  editor.setDecorations(outsideBycodeDecorationType, decorations)

  // decorations for bycode lines
  editor.setDecorations(bycodeBeginDecorationType, [
    {
      range: new vscode.Range(
        new vscode.Position(bycodeBegin, 0),
        new vscode.Position(bycodeBegin, 0),
      ),
    },
  ])
  editor.setDecorations(bycodeEndDecorationType, [
    {
      range: new vscode.Range(new vscode.Position(bycodeEnd, 0), new vscode.Position(bycodeEnd, 0)),
    },
  ])
}

const outsideBycodeDecorationType = vscode.window.createTextEditorDecorationType({
  isWholeLine: true,
  light: {
    backgroundColor: '#eff0f1',
  },
  dark: {
    backgroundColor: '#161514',
  },
})

const notInsideBycodeNotificationDecorationType = vscode.window.createTextEditorDecorationType({
  isWholeLine: true,
  // TODO: this is here just for example, replace with actual implementation if necessary
  gutterIconPath: '/home/hannes/work/temp/exclam.svg',
})

const bycodeBeginDecorationType = vscode.window.createTextEditorDecorationType({
  isWholeLine: true,
  borderWidth: '0 0 2px 0',
  borderColor: 'green',
  borderStyle: 'solid',
})

const bycodeEndDecorationType = vscode.window.createTextEditorDecorationType({
  isWholeLine: true,
  borderWidth: '2px 0 0 0',
  borderColor: 'green',
  borderStyle: 'solid',
})

// TODO? does this belong here
export function isBycodeTaskFile(document: vscode.TextDocument): boolean {
  const docText: string = document.getText()
  return docText.includes(EDITABLE_BEGIN) && docText.includes(EDITABLE_END)
}
